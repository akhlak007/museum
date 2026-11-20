import * as THREE from 'three';
import { animatePerson, createPlayerModel, createRoom711 } from '../world/createRoom711';
import { worldToMap } from '../world/mapRegistry';
import type { PlayerMapPosition } from '../domain/types';
import { floorHeightAt, galleries, galleryAt, galleryLocations, inspectionPoints, passageWaypoints, walkable, type InspectableArtwork } from '../world/galleries';
import { cameraRelativeMovement } from './movement';

interface GameCallbacks {
  onPosition(position: PlayerMapPosition, nearArtwork: InspectableArtwork | null, nearIncident: boolean): void;
  onIncident(): void;
  onGuardArrived(): void;
  onGuardPosition(position: PlayerMapPosition): void;
  onFieldPosition(position: PlayerMapPosition, progress: number, inRange: boolean): void;
  onFieldContact(): void;
}

const FIXED_STEP = 1 / 60;

export class GameEngine {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  private renderer: THREE.WebGLRenderer;
  private player = createPlayerModel();
  private keys = new Set<string>();
  private velocity = new THREE.Vector3();
  private guardWaypoints: THREE.Vector3[] = [];
  private fieldActive = false;
  private fieldInputEnabled = false;
  private fieldElapsed = 0;
  private fieldProgress = 0;
  private visitorMarker = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.18),
    new THREE.MeshBasicMaterial({ color: '#ffc550' }),
  );
  private yaw = Math.PI;
  private followYaw = Math.PI;
  private cameraPitch = 0.1;
  private raf = 0;
  private lastTime = performance.now();
  private simulationElapsed = 0;
  private incidentTriggered = false;
  private lastIncidentSignal = 0;
  private mouseDown = false;
  private paused = false;
  private guardResponding = false;
  private guardArrivalReported = false;
  private viewMode: 'follow' | 'cctv' | 'grande-cctv' = 'follow';
  private accumulator = 0;
  private actors;

  constructor(private container: HTMLElement, private callbacks: GameCallbacks) {
    const canvas = document.createElement('canvas');
    // Check the actual render surface before Three.js initializes it.
    const context = canvas.getContext('webgl2', { alpha: false, antialias: true, powerPreference: 'high-performance' });
    if (!context) throw new Error('WebGL 2 is unavailable');
    this.renderer = new THREE.WebGLRenderer({ canvas, context });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.container.appendChild(this.renderer.domElement);
    this.actors = createRoom711(this.scene);
    this.visitorMarker.position.y = 2.1;
    this.visitorMarker.visible = false;
    this.actors.visitor.add(this.visitorMarker);
    this.player.position.set(0, 0, 4);
    this.player.rotation.y = this.yaw;
    this.scene.add(this.player);
    this.bindEvents();
    this.resize();
    this.loop(performance.now());
  }

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.resetInput);
    window.addEventListener('resize', this.resize);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointermove', this.onPointerMove);
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (this.paused) return;
    if (event.key.startsWith('Arrow')) event.preventDefault();
    this.keys.add(event.key.toLowerCase());
  };
  private onKeyUp = (event: KeyboardEvent) => this.keys.delete(event.key.toLowerCase());
  private resetInput = () => {
    this.keys.clear();
    this.mouseDown = false;
  };
  private onPointerDown = () => { this.mouseDown = true; };
  private onPointerUp = () => { this.mouseDown = false; };
  private onPointerMove = (event: PointerEvent) => {
    if (!this.mouseDown) return;
    this.yaw -= event.movementX * 0.004;
    this.cameraPitch = THREE.MathUtils.clamp(this.cameraPitch + event.movementY * 0.0025, 0.08, 0.65);
  };

  private resize = () => {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private update(delta: number, now: number) {
    if (this.paused) return;
    this.simulationElapsed += delta;
    const forwardInput = Number(this.keys.has('w') || this.keys.has('arrowup')) - Number(this.keys.has('s') || this.keys.has('arrowdown'));
    const sideInput = Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft'));
    const speed = this.keys.has('shift') ? 6.6 : 3.6;
    this.followYaw = THREE.MathUtils.lerp(this.followYaw, this.yaw, 1 - Math.exp(-12 * delta));
    const desired = cameraRelativeMovement(this.followYaw, forwardInput, sideInput);
    if (desired.lengthSq() > 0) desired.normalize().multiplyScalar(speed);
    const responsiveness = desired.lengthSq() > 0 ? 8.5 : 11;
    this.velocity.lerp(desired, 1 - Math.exp(-responsiveness * delta));
    const previous = this.player.position.clone();
    this.player.position.addScaledVector(this.velocity, delta);
    if (!walkable(this.player.position.x, this.player.position.z)) this.player.position.copy(previous);
    const gallery = galleryAt(this.player.position.x, this.player.position.z);
    if (gallery?.id === '711') {
      const hitsBench = [-15, -8, 8, 15].some((x) => Math.abs(this.player.position.x - x) < 2.25 && Math.abs(this.player.position.z - 1.4 * Math.sign(x)) < 1.1);
      const hitsBarrier = Math.abs(this.player.position.x) < 3.75 && this.player.position.z < -8.82;
      if (hitsBench || hitsBarrier) this.player.position.copy(previous);
    }
    const movedX = this.player.position.x - previous.x;
    const movedZ = this.player.position.z - previous.z;
    this.player.position.y = floorHeightAt(this.player.position.x);
    if (Math.hypot(movedX, movedZ) > delta * 0.28) this.player.rotation.y = Math.atan2(movedX, movedZ);
    const movementIntensity = THREE.MathUtils.clamp(this.velocity.length() / 3.6, 0, 1.4);
    animatePerson(this.player, now * 0.0075 * Math.max(movementIntensity, 0.5), movementIntensity);

    if (!this.incidentTriggered && this.simulationElapsed > 8.5) {
      this.incidentTriggered = true;
      this.actors.visitor.position.copy(this.actors.incidentPosition);
      this.callbacks.onIncident();
      this.lastIncidentSignal = this.simulationElapsed;
    }
    if (this.incidentTriggered) {
      if (this.fieldActive) this.updateFieldEncounter(delta);
      if (this.simulationElapsed - this.lastIncidentSignal > 1.2) {
        this.lastIncidentSignal = this.simulationElapsed;
        this.callbacks.onIncident();
      }
    }

    if (this.guardResponding) {
      const distanceToIncident = this.actors.guard.position.distanceTo(this.actors.incidentPosition);
      if (distanceToIncident > 1.15) {
        const waypoint = this.guardWaypoints[0];
        const destination = waypoint ?? this.actors.incidentPosition;
        const direction = destination.clone().sub(this.actors.guard.position);
        const distance = direction.length();
        if (waypoint && distance <= delta * 4.2) {
          this.actors.guard.position.copy(waypoint);
          this.guardWaypoints.shift();
        } else {
          direction.normalize();
          this.actors.guard.position.addScaledVector(direction, Math.min(waypoint ? distance : distanceToIncident - 1.05, delta * 4.2));
        }
        this.actors.guard.rotation.y = Math.atan2(direction.x, direction.z);
        animatePerson(this.actors.guard, now * 0.009, 1);
      } else if (!this.guardArrivalReported) {
        this.guardArrivalReported = true;
        animatePerson(this.actors.guard, 0, 0);
        this.callbacks.onGuardArrived();
      }
      this.callbacks.onGuardPosition(worldToMap(this.actors.guard.position.x, this.actors.guard.position.z, this.actors.guard.rotation.y));
    }
    animatePerson(this.actors.visitor, now * 0.008, this.fieldActive ? 0.7 : 0.06);
    this.actors.galleryVisitors.forEach(({ person, x, z, radiusX, radiusZ }, index) => {
      person.visible = Math.abs(this.player.position.x - x) < 38;
      if (!person.visible) return;
      const angle = this.simulationElapsed * (0.19 + (index % 3) * 0.035) + index * 1.7;
      const visitorX = x + radiusX * Math.cos(angle);
      person.position.set(visitorX, floorHeightAt(visitorX), z + radiusZ * Math.sin(angle));
      person.rotation.y = Math.atan2(-radiusX * Math.sin(angle), radiusZ * Math.cos(angle));
      animatePerson(person, this.simulationElapsed * 5 + index, 0.5);
    });

    if (this.viewMode === 'grande-cctv') {
      this.camera.position.set(60,6.35,12);
      this.camera.lookAt(45,1.3,3.5);
    } else if (this.viewMode === 'cctv') {
      this.camera.position.lerp(new THREE.Vector3(-19.2, 6.35, -12.35), 1 - Math.exp(-7 * delta));
      this.camera.lookAt(new THREE.Vector3(-1.8, 1.15, -7.4));
    } else {
      const offsetX = -Math.sin(this.followYaw);
      const offsetZ = -Math.cos(this.followYaw);
      const target = this.player.position.clone().add(new THREE.Vector3(0, 1.5, 0));
      // Shorten the boom along its heading so room walls cannot rotate or hide the view.
      let distance = 0.25;
      while (distance < 5.5 && walkable(target.x + offsetX * (distance + 0.25), target.z + offsetZ * (distance + 0.25), 0.3)) {
        distance += 0.25;
      }
      this.camera.position.copy(target).add(new THREE.Vector3(
        offsetX * distance,
        1.42 + Math.sin(this.cameraPitch) * 1.8,
        offsetZ * distance,
      ));
      this.camera.lookAt(target);
    }

    const currentGallery = galleryAt(this.player.position.x, this.player.position.z);
    const nearArtwork = inspectionPoints.find(point => point.room === currentGallery?.id &&
      Math.hypot(this.player.position.x - point.x, this.player.position.z - point.z) < 3.4)?.title ?? null;
    const nearIncident = this.incidentTriggered && this.player.position.distanceTo(this.actors.incidentPosition) < 3.6;
    this.callbacks.onPosition(worldToMap(this.player.position.x, this.player.position.z, this.player.rotation.y), nearArtwork, nearIncident);
  }

  private updateFieldEncounter(delta: number) {
    const visitor = this.actors.visitor;
    const origin = this.actors.incidentPosition;
    const inGrande = galleryAt(origin.x, origin.z)?.id === '710';
    this.fieldElapsed += delta;
    const phase = this.fieldElapsed * 0.58;
    const x = origin.x + Math.sin(phase) * (inGrande ? 5 : 3.6);
    const z = origin.z + (inGrande ? 1.5 : 3.7) * (1 - Math.cos(phase));
    visitor.rotation.y = Math.atan2(x - visitor.position.x, z - visitor.position.z);
    visitor.position.set(x, 0, z);
    const inRange = visitor.position.distanceTo(this.player.position) < 2.7;
    this.fieldProgress = inRange && this.fieldInputEnabled && this.keys.has('f')
      ? Math.min(1, this.fieldProgress + delta / 1.4)
      : Math.max(0, this.fieldProgress - delta * 1.5);
    this.callbacks.onFieldPosition(worldToMap(x, z, visitor.rotation.y), this.fieldProgress, inRange);
    if (this.fieldProgress >= 1) {
      this.fieldActive = false;
      this.visitorMarker.visible = false;
      origin.copy(visitor.position);
      this.callbacks.onFieldContact();
    }
  }

  private loop = (now: number) => {
    // Preserve elapsed time during frame drops while retaining small collision
    // steps. Long suspended-tab gaps remain bounded to avoid simulation jumps.
    this.accumulator += Math.min((now - this.lastTime) / 1000, 0.25);
    this.lastTime = now;
    while (this.accumulator >= FIXED_STEP) {
      this.update(FIXED_STEP, now);
      this.accumulator -= FIXED_STEP;
    }
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.loop);
  };

  setIncidentRoom(room: string) {
    if ((room !== '711' && room !== '710') || (room === galleries[0].id && !this.incidentTriggered)) return;
    this.incidentTriggered = true;
    this.guardResponding = false;
    this.guardArrivalReported = false;
    const [x, z] = galleryLocations[room].incident;
    this.actors.incidentPosition.set(x, 0, z);
    this.actors.visitor.position.copy(this.actors.incidentPosition);
    this.fieldElapsed = 0;
    this.fieldProgress = 0;
  }

  setFieldEncounter(active: boolean, acceptsInput: boolean) {
    this.fieldActive = active;
    this.visitorMarker.visible = active;
    this.fieldInputEnabled = acceptsInput;
  }

  setGuardResponding() {
    if (this.guardResponding) return;
    const from = galleryAt(this.actors.guard.position.x, this.actors.guard.position.z);
    const to = galleryAt(this.actors.incidentPosition.x, this.actors.incidentPosition.z);
    this.guardWaypoints = from && to
      ? passageWaypoints(from.id, to.id).map(([x, z]) => new THREE.Vector3(x, 0, z))
      : [];
    this.guardResponding = true;
  }

  setViewMode(mode: 'follow' | 'cctv' | 'grande-cctv') {
    this.viewMode = mode;
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    if (paused) {
      this.resetInput();
      this.accumulator = 0;
    }
  }

  setResourceStates(cameraOnline: boolean, sensorOnline: boolean, grandeCamera: boolean, grandeSensor: boolean) {
    this.actors.grandeCamera.visible = grandeCamera;
    this.actors.grandeSensor.material.emissive.set(grandeSensor ? '#3a8f55' : '#8b1e24');
    this.actors.camera.visible = cameraOnline;
    const sensorMaterial = this.actors.sensor.material as THREE.MeshStandardMaterial;
    sensorMaterial.emissive.set(sensorOnline ? '#3a8f55' : '#8b1e24');
    sensorMaterial.emissiveIntensity = sensorOnline ? 0.45 : 0.08;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.resetInput);
    window.removeEventListener('resize', this.resize);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
