import * as THREE from 'three';
import { animatePerson, createPlayerModel, createRoom711 } from '../world/createRoom711';
import { worldToMap } from '../world/mapRegistry';
import type { PlayerMapPosition } from '../domain/types';

interface GameCallbacks {
  onPosition(position: PlayerMapPosition, nearArtwork: boolean, nearIncident: boolean): void;
  onIncident(): void;
  onGuardArrived(): void;
  onGuardPosition(position: PlayerMapPosition): void;
}

const FIXED_STEP = 1 / 60;

export class GameEngine {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  private renderer: THREE.WebGLRenderer;
  private player = createPlayerModel();
  private keys = new Set<string>();
  private velocity = new THREE.Vector3();
  private yaw = Math.PI;
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
  private viewMode: 'follow' | 'cctv' = 'follow';
  private accumulator = 0;
  private actors;

  constructor(private container: HTMLElement, private callbacks: GameCallbacks) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.container.appendChild(this.renderer.domElement);
    this.actors = createRoom711(this.scene);
    this.player.position.set(0, 0, 4);
    this.scene.add(this.player);
    this.bindEvents();
    this.resize();
    this.loop(performance.now());
  }

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.resize);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointermove', this.onPointerMove);
  }

  private onKeyDown = (event: KeyboardEvent) => this.keys.add(event.key.toLowerCase());
  private onKeyUp = (event: KeyboardEvent) => this.keys.delete(event.key.toLowerCase());
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
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    const desired = forward.multiplyScalar(forwardInput).add(right.multiplyScalar(sideInput));
    if (desired.lengthSq() > 0) desired.normalize().multiplyScalar(speed);
    const responsiveness = desired.lengthSq() > 0 ? 8.5 : 11;
    this.velocity.lerp(desired, 1 - Math.exp(-responsiveness * delta));
    const previous = this.player.position.clone();
    this.player.position.addScaledVector(this.velocity, delta);
    this.player.position.x = THREE.MathUtils.clamp(this.player.position.x, -20.6, 20.6);
    this.player.position.z = THREE.MathUtils.clamp(this.player.position.z, -12.5, 12.5);
    const hitsBench = [-15, -8, 8, 15].some((x) => Math.abs(this.player.position.x - x) < 2.25 && Math.abs(this.player.position.z - 1.4 * Math.sign(x)) < 1.1);
    const hitsBarrier = Math.abs(this.player.position.x) < 3.75 && this.player.position.z < -8.82;
    if (hitsBench || hitsBarrier) this.player.position.copy(previous);
    if (this.velocity.lengthSq() > 0.08) this.player.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
    const movementIntensity = THREE.MathUtils.clamp(this.velocity.length() / 3.6, 0, 1.4);
    animatePerson(this.player, now * 0.0075 * Math.max(movementIntensity, 0.5), movementIntensity);

    if (!this.incidentTriggered && this.simulationElapsed > 8.5) {
      this.incidentTriggered = true;
      this.actors.visitor.position.copy(this.actors.incidentPosition);
      this.callbacks.onIncident();
      this.lastIncidentSignal = this.simulationElapsed;
    }
    if (this.incidentTriggered) {
      this.actors.visitor.position.x += Math.sin(now * 0.002) * delta * 0.08;
      if (this.simulationElapsed - this.lastIncidentSignal > 1.2) {
        this.lastIncidentSignal = this.simulationElapsed;
        this.callbacks.onIncident();
      }
    }

    if (this.guardResponding) {
      const distanceToIncident = this.actors.guard.position.distanceTo(this.actors.incidentPosition);
      if (distanceToIncident > 1.15) {
        const direction = this.actors.incidentPosition.clone().sub(this.actors.guard.position).normalize();
        this.actors.guard.position.addScaledVector(direction, Math.min(distanceToIncident - 1.05, delta * 4.2));
        this.actors.guard.rotation.y = Math.atan2(direction.x, direction.z);
        animatePerson(this.actors.guard, now * 0.009, 1);
      } else if (!this.guardArrivalReported) {
        this.guardArrivalReported = true;
        animatePerson(this.actors.guard, 0, 0);
        this.callbacks.onGuardArrived();
      }
      this.callbacks.onGuardPosition(worldToMap(this.actors.guard.position.x, this.actors.guard.position.z, this.actors.guard.rotation.y));
    }
    animatePerson(this.actors.visitor, now * 0.0024, this.incidentTriggered ? 0.14 : 0.06);

    if (this.viewMode === 'cctv') {
      this.camera.position.lerp(new THREE.Vector3(-19.2, 6.35, -12.35), 1 - Math.exp(-7 * delta));
      this.camera.lookAt(new THREE.Vector3(-1.8, 1.15, -7.4));
    } else {
      const distance = 5.5;
      const cameraOffset = new THREE.Vector3(
        -Math.sin(this.yaw) * distance,
        1.42 + Math.sin(this.cameraPitch) * 1.8,
        -Math.cos(this.yaw) * distance,
      );
      const target = this.player.position.clone().add(new THREE.Vector3(0, 1.5, 0));
      const desiredCamera = target.clone().add(cameraOffset);
      desiredCamera.x = THREE.MathUtils.clamp(desiredCamera.x, -21.25, 21.25);
      desiredCamera.z = THREE.MathUtils.clamp(desiredCamera.z, -13.15, 13.15);
      this.camera.position.lerp(desiredCamera, 1 - Math.exp(-8 * delta));
      this.camera.lookAt(target);
    }

    const nearArtwork = this.player.position.distanceTo(this.actors.artifactPosition) < 3.4;
    const nearIncident = this.incidentTriggered && this.player.position.distanceTo(this.actors.incidentPosition) < 3.6;
    this.callbacks.onPosition(worldToMap(this.player.position.x, this.player.position.z, this.yaw), nearArtwork, nearIncident);
  }

  private loop = (now: number) => {
    // Preserve elapsed time during frame drops while retaining small collision
    // steps. Long suspended-tab gaps remain bounded to avoid simulation jumps.
    this.accumulator += Math.min((now - this.lastTime) / 1000, 1);
    this.lastTime = now;
    while (this.accumulator >= FIXED_STEP) {
      this.update(FIXED_STEP, now);
      this.accumulator -= FIXED_STEP;
    }
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.loop);
  };

  setGuardResponding() {
    this.guardResponding = true;
  }

  setViewMode(mode: 'follow' | 'cctv') {
    this.viewMode = mode;
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    if (paused) {
      this.keys.clear();
      this.accumulator = 0;
    }
  }

  setResourceStates(cameraOnline: boolean, sensorOnline: boolean) {
    this.actors.camera.visible = cameraOnline;
    const sensorMaterial = this.actors.sensor.material as THREE.MeshStandardMaterial;
    sensorMaterial.emissive.set(sensorOnline ? '#3a8f55' : '#8b1e24');
    sensorMaterial.emissiveIntensity = sensorOnline ? 0.45 : 0.08;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.resize);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
