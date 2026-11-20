import { ferronniereImage, ferronnierePosition, galleryById, galleryLocations, passage, saintJohnImage } from './galleries';
import * as THREE from 'three';

function parquetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#754328';
  ctx.fillRect(0, 0, 512, 512);
  for (let blockY = 0; blockY < 8; blockY += 1) {
    for (let blockX = 0; blockX < 8; blockX += 1) {
      const horizontal = (blockX + blockY) % 2 === 0;
      for (let plank = 0; plank < 4; plank += 1) {
        const shade = 94 + ((blockX * 11 + blockY * 7 + plank * 5) % 28);
        ctx.fillStyle = `rgb(${shade + 42}, ${shade + 5}, ${Math.max(42, shade - 28)})`;
        ctx.strokeStyle = 'rgba(38,19,10,.38)';
        ctx.lineWidth = 1.5;
        const x = blockX * 64 + (horizontal ? 0 : plank * 16);
        const y = blockY * 64 + (horizontal ? plank * 16 : 0);
        const w = horizontal ? 64 : 16;
        const h = horizontal ? 16 : 64;
        ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
        ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5.5, 3.5);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function labelTexture(title: string, subtitle: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 180;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#efe6d2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#a88947';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  ctx.fillStyle = '#1b2330';
  ctx.textAlign = 'center';
  ctx.font = '700 48px Georgia';
  ctx.fillText(title, canvas.width / 2, 74);
  ctx.font = '30px Arial';
  ctx.fillText(subtitle, canvas.width / 2, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addFrame(
  scene: THREE.Scene,
  loader: THREE.TextureLoader,
  imageUrl: string,
  position: THREE.Vector3,
  rotationY: number,
  size: [number, number],
) {
  const group = new THREE.Group();
  const [width, height] = size;
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.42, height + 0.42, 0.22),
    new THREE.MeshStandardMaterial({ color: '#b68a2c', metalness: 0.62, roughness: 0.28 }),
  );
  const mat = new THREE.MeshStandardMaterial({ color: '#6f5637', roughness: 0.8 });
  loader.load(imageUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    mat.map = texture;
    mat.needsUpdate = true;
  });
  const painting = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  painting.position.z = 0.121;
  group.add(frame, painting);
  group.position.copy(position);
  group.rotation.y = rotationY;
  scene.add(group);
  return { group, painting, frame };
}

function createPerson(uniformColor: string, skinColor: string, scale = 1) {
  const person = new THREE.Group();
  const uniform = new THREE.MeshStandardMaterial({ color: uniformColor, roughness: 0.72 });
  const skin = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.31 * scale, 0.42 * scale, 0.92 * scale, 8), uniform);
  body.position.y = 1.45 * scale;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26 * scale, 16, 12), skin);
  head.position.y = 2.18 * scale;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * scale, 0.3 * scale, 0.12 * scale, 16), uniform);
  cap.position.y = 2.42 * scale;
  const capPeak = new THREE.Mesh(new THREE.BoxGeometry(0.34 * scale, 0.035 * scale, 0.28 * scale), uniform);
  capPeak.position.set(0, 2.39 * scale, 0.18 * scale);
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.405 * scale, 0.405 * scale, 0.11 * scale, 8), new THREE.MeshStandardMaterial({ color: '#0b1017', roughness: 0.55 }));
  belt.position.y = 1.03 * scale;
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.13 * scale, 0.2 * scale, 0.025 * scale), new THREE.MeshStandardMaterial({ color: '#d6c58a', metalness: 0.35 }));
  badge.position.set(0.18 * scale, 1.62 * scale, 0.33 * scale);
  const createLimb = (x: number, y: number, length: number, radius: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(x * scale, y * scale, 0);
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius * scale, length * scale, 4, 8), uniform);
    mesh.position.y = -(length * 0.5 + radius) * scale;
    pivot.add(mesh);
    return pivot;
  };
  const leftArm = createLimb(-0.46, 1.78, 0.7, 0.11);
  const rightArm = createLimb(0.46, 1.78, 0.7, 0.11);
  const leftLeg = createLimb(-0.2, 1.04, 0.84, 0.14);
  const rightLeg = createLimb(0.2, 1.04, 0.84, 0.14);
  const addBoot = (leg: THREE.Group) => {
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.25 * scale, 0.18 * scale, 0.42 * scale), new THREE.MeshStandardMaterial({ color: '#0c1015', roughness: 0.65 }));
    boot.position.set(0, -1.02 * scale, 0.08 * scale);
    leg.add(boot);
  };
  addBoot(leftLeg);
  addBoot(rightLeg);
  person.add(body, head, cap, capPeak, belt, badge, leftArm, rightArm, leftLeg, rightLeg);
  person.userData.limbs = { leftArm, rightArm, leftLeg, rightLeg };
  person.traverse((object) => {
    if (object instanceof THREE.Mesh) object.castShadow = true;
  });
  return person;
}

export function animatePerson(person: THREE.Group, phase: number, intensity: number) {
  const limbs = person.userData.limbs as Record<string, THREE.Group> | undefined;
  if (!limbs) return;
  const swing = Math.sin(phase) * 0.72 * intensity;
  limbs.leftArm.rotation.x = swing;
  limbs.rightArm.rotation.x = -swing;
  limbs.leftLeg.rotation.x = -swing;
  limbs.rightLeg.rotation.x = swing;
}

function addBarrier(scene: THREE.Scene) {
  const gold = new THREE.MeshStandardMaterial({ color: '#c49b3c', metalness: 0.7, roughness: 0.25 });
  const ropeMaterial = new THREE.LineBasicMaterial({ color: '#8f1824' });
  const points = [-3.1, -1.55, 0, 1.55, 3.1];
  for (const x of points) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.25, 12), gold);
    post.position.set(x, 0.63, -9.2);
    scene.add(post);
  }
  for (let i = 0; i < points.length - 1; i += 1) {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(points[i], 1.12, -9.2),
      new THREE.Vector3((points[i] + points[i + 1]) / 2, 0.78, -9.2),
      new THREE.Vector3(points[i + 1], 1.12, -9.2),
    );
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(18)), ropeMaterial));
  }
}

export interface RoomActors {
  galleryVisitors: Array<{ person: THREE.Group; x: number; z: number; radiusX: number; radiusZ: number }>;
  grandeCamera: THREE.Group;
  grandeSensor: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  guard: THREE.Group;
  visitor: THREE.Group;
  sensor: THREE.Mesh;
  camera: THREE.Group;
  incidentPosition: THREE.Vector3;
  hemiLight: THREE.HemisphereLight;
  keyLight: THREE.DirectionalLight;
  ceilingLights: THREE.PointLight[];
  ferronnierePainting: THREE.Mesh;
  emptyFrameBacking: THREE.Group;
  suspect: THREE.Group;
}

export function createRoom711(scene: THREE.Scene): RoomActors {
  scene.background = new THREE.Color('#101a27');
  scene.fog = new THREE.Fog('#101a27', 32, 66);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(44, 28),
    new THREE.MeshStandardMaterial({ map: parquetTexture(), roughness: 0.62, metalness: 0.02 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const blue = new THREE.MeshStandardMaterial({ color: '#142a42', roughness: 0.83 });
  const stone = new THREE.MeshStandardMaterial({ color: '#d6cbb8', roughness: 0.78 });
  const gold = new THREE.MeshStandardMaterial({ color: '#a98335', metalness: 0.45, roughness: 0.36 });
  const gapStart = passage.z - passage.halfWidth;
  const gapEnd = passage.z + passage.halfWidth;
  const wallParts: Array<[number, number, number, number, number]> = [
    [44, 8.5, 0.5, 0, -14], [44, 8.5, 0.5, 0, 14], [0.5, 8.5, 28, -22, 0],
    [0.5, 8.5, gapStart + 14, passage.x, (gapStart - 14) / 2],
    [0.5, 8.5, 14 - gapEnd, passage.x, (14 + gapEnd) / 2],
  ];
  for (const [w, h, d, x, z] of wallParts) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), blue);
    wall.position.set(x, h / 2, z);
    wall.receiveShadow = true;
    scene.add(wall);
  }
  const header = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.1, gapEnd - gapStart), blue);
  header.position.set(passage.x, 6.45, passage.z);
  scene.add(header);
  const threshold = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.025, gapEnd - gapStart), gold);
  threshold.position.set(passage.x, 0.01, passage.z);
  scene.add(threshold);

  for (const z of [-13.68, 13.68]) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(44, 0.38, 0.18), stone);
    base.position.set(0, 0.32, z);
    scene.add(base);
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(44, 0.28, 0.24), gold);
    cornice.position.set(0, 7.35, z);
    scene.add(cornice);
  }

  // Break the long midnight-blue exhibition wall into pale-stone bays. This
  // preserves the documented visual identity without claiming survey accuracy.
  for (const x of [-19, -14, -9, -5, 5, 9, 14, 19]) {
    const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.52, 7.1, 0.34), stone);
    pilaster.position.set(x, 3.55, -13.48);
    scene.add(pilaster);
    const capital = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.28, 0.42), gold);
    capital.position.set(x, 7.02, -13.27);
    scene.add(capital);
  }

  for (const x of [-16.5, -11.5, 11.5, 16.5]) {
    const panel = new THREE.Group();
    const verticals = [-1.65, 1.65].map((offset) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 4.7, 0.09), gold);
      rail.position.set(offset, 0, 0);
      return rail;
    });
    const horizontals = [-2.35, 2.35].map((offset) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(3.37, 0.07, 0.09), gold);
      rail.position.set(0, offset, 0);
      return rail;
    });
    panel.add(...verticals, ...horizontals);
    panel.position.set(x, 3.8, -13.2);
    scene.add(panel);
  }

  for (const x of [-21.68, 21.68]) {
    for (const z of [-10, -5, 0, 5, 10]) {
      const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.28, 7.3, 1.05), stone);
      pilaster.position.set(x, 3.65, z);
      scene.add(pilaster);
    }
  }


  for (const x of [-21.45, 21.45]) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.16, 4.1, 2.7), new THREE.MeshStandardMaterial({ color: '#321f17', roughness: 0.72 }));
    door.position.set(x, 2.05, 7.4);
    if (x < 0) scene.add(door);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.38, 3.25), stone);
    lintel.position.set(x, 4.24, 7.4);
    scene.add(lintel);
  }

  for (const [side, title, subtitle] of [
    [-1, 'Grand Gallery', 'ROOM 710 · OPEN PASSAGE'],
    [1, 'State Room', 'ROOM 711 · OPEN PASSAGE'],
  ] as const) {
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.85, 0.9),
      new THREE.MeshBasicMaterial({ map: labelTexture(title, subtitle) }));
    sign.position.set(passage.x + side * 0.31, 4.9, passage.z);
    sign.rotation.y = side * Math.PI / 2;
    scene.add(sign);
  }

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(44, 28), new THREE.MeshStandardMaterial({ color: '#d9d1c3', roughness: 0.9 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 8.48;
  scene.add(ceiling);
  for (let x = -18; x <= 18; x += 6) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 27), gold);
    beam.position.set(x, 8.25, 0);
    scene.add(beam);
  }
  for (let z = -10.5; z <= 10.5; z += 5.25) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(43, 0.28, 0.24), gold);
    beam.position.set(0, 8.25, z);
    scene.add(beam);
  }

  const loader = new THREE.TextureLoader();
  addFrame(scene, loader, '/artwork/mona-lisa.jpg', new THREE.Vector3(0, 4.1, -13.6), 0, [2.25, 3.35]);
  addFrame(scene, loader, '/artwork/wedding-at-cana.jpg', new THREE.Vector3(0, 4.25, 13.6), Math.PI, [10.2, 5.7]);

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(2.35, 0.55),
    new THREE.MeshBasicMaterial({ map: labelTexture('Mona Lisa', 'Leonardo da Vinci · Room 711') }),
  );
  label.position.set(0, 1.8, -13.73);
  scene.add(label);

  const protectiveGlass = new THREE.Mesh(
    new THREE.BoxGeometry(2.72, 3.82, 0.08),
    new THREE.MeshPhysicalMaterial({ color: '#b9d5de', transparent: true, opacity: 0.12, roughness: 0.08, transmission: 0.35 }),
  );
  protectiveGlass.position.set(0, 4.1, -13.42);
  scene.add(protectiveGlass);

  addBarrier(scene);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.32, 0.85), stone);
  plinth.position.set(0, 0.16, -12.7);
  scene.add(plinth);

  const sensor = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.62, 0.28), new THREE.MeshStandardMaterial({ color: '#d8d4ca', emissive: '#3a8f55', emissiveIntensity: 0.35 }));
  sensor.position.set(4.1, 1.7, -13.45);
  scene.add(sensor);

  const cameraBody = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.32, 0.32), stone);
  cameraBody.rotation.y = -0.45;
  const cameraLens = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.18, 12), new THREE.MeshStandardMaterial({ color: '#111822' }));
  cameraLens.rotation.z = Math.PI / 2;
  cameraLens.position.set(0.45, 0, 0.18);
  const camera = new THREE.Group();
  const [roomCameraX, roomCameraZ] = galleryLocations['711'].camera;
  camera.position.set(roomCameraX, 6.5, roomCameraZ);
  camera.add(cameraBody, cameraLens);
  scene.add(camera);

  for (const x of [-15, -8, 8, 15]) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.32, 1.05), new THREE.MeshStandardMaterial({ color: '#151c25', roughness: 0.7 }));
    bench.position.set(x, 0.65, 1.4 * Math.sign(x));
    scene.add(bench);
    const legs = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.62, 0.55), new THREE.MeshStandardMaterial({ color: '#5a3a23' }));
    legs.position.set(x, 0.31, 1.4 * Math.sign(x));
    scene.add(legs);
  }

  for (const x of [-17, -10, 10, 17]) {
    const sconce = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16), gold);
    plate.rotation.x = Math.PI / 2;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), new THREE.MeshStandardMaterial({ color: '#ffe5ad', emissive: '#ffc65d', emissiveIntensity: 2.4 }));
    bulb.position.z = 0.18;
    sconce.add(plate, bulb);
    sconce.position.set(x, 5.7, -13.15);
    scene.add(sconce);
  }

  const guard = createPerson('#172437', '#9c6847');
  guard.position.set(11, 0, -7.5);
  scene.add(guard);
  const visitor = createPerson('#745342', '#d2a37c', 0.95);
  visitor.position.set(-5, 0, 4);
  scene.add(visitor);

  const hemiLight = new THREE.HemisphereLight('#c8dcff', '#5b3824', 1.65);
  scene.add(hemiLight);
  const keyLight = new THREE.DirectionalLight('#fff1d6', 2.3);
  keyLight.position.set(2, 12, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1536, 1536);
  keyLight.shadow.camera.left = -24;
  keyLight.shadow.camera.right = 24;
  keyLight.shadow.camera.top = 16;
  keyLight.shadow.camera.bottom = -16;
  scene.add(keyLight);
  const ceilingLights: THREE.PointLight[] = [];
  for (const x of [-14, -7, 0, 7, 14]) {
    const light = new THREE.PointLight('#ffdca5', 18, 14, 2);
    light.position.set(x, 7.5, -7);
    scene.add(light);
    ceilingLights.push(light);
  }

  const grandeCamera = camera.clone();
  const [cameraX, cameraZ] = galleryLocations['710'].camera;
  grandeCamera.position.set(cameraX, camera.position.y, cameraZ);
  grandeCamera.rotation.y = Math.PI;
  scene.add(grandeCamera);
  const grandeSensor = sensor.clone();
  grandeSensor.material = sensor.material.clone();
  grandeSensor.position.set(46,1.7,2);
  scene.add(grandeSensor);
  const timber = new THREE.MeshStandardMaterial({map: parquetTexture()});
  const plaster = new THREE.MeshStandardMaterial({color: '#884d43'});
  const skylight = new THREE.MeshBasicMaterial({color: '#fff2d5'});
  function bayPart(size: [number,number,number], at: [number,number,number], material: THREE.Material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...at);
    scene.add(mesh);
  }
  const [west, east, north, south] = galleryById('710')!.bounds;
  const length = east - west;
  const width = south - north;
  const centerX = (west + east) / 2;
  const centerZ = (north + south) / 2;
  bayPart([length, .12, width], [centerX, -.06, centerZ], timber);
  for (const z of [north, south]) bayPart([length, 8, .32], [centerX, 4, z], plaster);
  const opening = 2.9;
  for (const [start, end] of [[north, 7.4 - opening], [7.4 + opening, south]]) {
    bayPart([.32, 8, end - start], [east, 4, (start + end) / 2], plaster);
  }
  bayPart([.32, 3.6, 2 * opening], [east, 6.2, 7.4], plaster);
  bayPart([length, .25, width], [centerX, 8.1, centerZ], stone);
  const archGeometry = new THREE.TorusGeometry(width / 2 - .35, .24, 6, 24, Math.PI);
  archGeometry.scale(1, .31, 1);
  for (let x = west + 4; x < east; x += 8) {
    bayPart([6, .12, 4], [x, 7.92, centerZ], skylight);
    const arch = new THREE.Mesh(archGeometry, stone);
    arch.rotation.y = Math.PI / 2;
    arch.position.set(x, 6.05, centerZ);
    scene.add(arch);
    for (const z of [north + .35, south - .35]) bayPart([.55, 6.1, .45], [x, 3.05, z], stone);
  }
  const [artX, artZ] = galleryLocations['710'].artwork;
  addFrame(scene, loader, saintJohnImage, new THREE.Vector3(artX, 3.1, artZ), 0, [2.1, 2.55]);
  const ferronniereFrameObj = addFrame(scene, loader, ferronniereImage, new THREE.Vector3(ferronnierePosition[0], 2.9, ferronnierePosition[1]), 0, [1.5, 2.15]);

  const emptyFrameBacking = new THREE.Group();
  const emptyMat = new THREE.MeshStandardMaterial({ color: '#251b14', roughness: 0.95 });
  const emptyMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.15), emptyMat);
  emptyMesh.position.z = 0.122;
  const wireMat = new THREE.LineBasicMaterial({ color: '#c0382d' });
  const wireGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.6, 0.9, 0.126),
    new THREE.Vector3(-0.52, 0.35, 0.128),
    new THREE.Vector3(-0.58, -0.2, 0.13),
  ]);
  emptyFrameBacking.add(emptyMesh, new THREE.Line(wireGeom, wireMat));
  emptyFrameBacking.visible = false;
  ferronniereFrameObj.group.add(emptyFrameBacking);
  const cream = new THREE.MeshStandardMaterial({ color: '#e9d9ba', roughness: .81 });
  const red = new THREE.MeshStandardMaterial({ color: '#63372c', roughness: .85 });
  const marble = new THREE.MeshStandardMaterial({ color: '#dad3c3', roughness: .52 });
  const upperHeight = 9.6;
  bayPart([22, .2, 21], [73, -.1, 7.5], timber);
  bayPart([22, upperHeight, .35], [73, upperHeight / 2, -3], red);
  bayPart([22, upperHeight, .35], [73, upperHeight / 2, 18], red);
  bayPart([22, .3, 21], [73, upperHeight, 7.5], cream);
  for (const [wallX, halfWidth] of [[62, 2.9], [84, 3]]) {
    for (const [start, end] of [[-3, 7.4 - halfWidth], [7.4 + halfWidth, 18]]) {
      bayPart([.35, upperHeight, end - start], [wallX, upperHeight / 2, (start + end) / 2], red);
    }
    bayPart([.4, 4.7, 2 * halfWidth], [wallX, 7.25, 7.4], cream);
  }
  for (const x of [64, 72, 80]) {
    for (const z of [-2.75, 17.75]) {
      bayPart([.65, 9.3, .55], [x, 4.65, z], cream);
      bayPart([1, .5, .72], [x, 8.7, z], gold);
    }
    bayPart([4, .12, 9], [x + 1, 9.43, 7.5], skylight);
  }
  for (const z of [-2.7, 17.7]) bayPart([22, .35, .3], [73, 8.43, z], gold);
  addFrame(scene, loader, '/artwork/cimabue-maesta.jpg', new THREE.Vector3(69, 3.7, -2.77), 0, [3.05, 4.48]);
  addFrame(scene, loader, '/artwork/giotto-stigmata.jpg', new THREE.Vector3(77, 3.5, -2.77), 0, [2.25, 4.3]);

  for (const [x, side, title, subtitle] of [
    [61.78, -1, 'Square Room', 'ROOM 708 · EARLY ITALIAN PAINTINGS'],
    [62.24, 1, 'Grand Gallery', 'ROOM 710 · ITALIAN PAINTINGS'],
    [83.75, -1, 'Daru Staircase', 'WINGED VICTORY · LEVEL 0 ACCESS'],
  ] as const) {
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(5, 1),
      new THREE.MeshBasicMaterial({ map: labelTexture(title, subtitle) }));
    sign.position.set(x, x < 63 ? 5.1 : 5.55, 7.4);
    sign.rotation.y = side * Math.PI / 2;
    scene.add(sign);
  }

  bayPart([4, .3, 9], [86, -.15, 7.5], marble);
  for (let step = 0; step < 24; step += 1) {
    const height = -step * .175;
    bayPart([.51, 1, 9], [88.25 + step * .5, height - .5, 7.5], marble);
  }
  bayPart([12, .35, 9], [106, -4.375, 7.5], marble);
  bayPart([.38, 11.5, 9], [112, 1.55, 7.5], cream);
  for (const z of [3, 12]) {
    bayPart([28, 11.5, .4], [98, 1.55, z], cream);
    for (const x of [86, 92, 98, 105, 111]) bayPart([.7, 11.2, .65], [x, 1.4, z], marble);
  }
  bayPart([28, .3, 9], [98, 7.5, 7.5], cream);
  for (const x of [89, 95, 102, 108]) bayPart([3.8, .16, 5], [x, 7.3, 7.5], skylight);

  const monument = new THREE.Group();
  monument.position.set(86.5, 0, 5.15);
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, .82, 1.35), stone);
  base.position.y = .41;
  const clothProfile = [[0, .85], [.43, .85], [.52, 1.02], [.33, 1.39], [.39, 1.72], [.46, 2.02], [.18, 2.18], [0, 2.18]];
  const drapery = new THREE.Mesh(new THREE.LatheGeometry(clothProfile.map(([r, y]) => new THREE.Vector2(r, y)), 16), marble);
  drapery.scale.z = .75;
  monument.add(base, drapery);
  for (const side of [-1, 1]) {
    const outline = new THREE.Shape();
    outline.moveTo(side * .15, 1.7);
    outline.quadraticCurveTo(side * 1.45, 3.35, side * 1.25, 2.9);
    outline.quadraticCurveTo(side * 1.3, 2.15, side * .42, 1.42);
    outline.lineTo(side * .15, 1.7);
    const wing = new THREE.Mesh(new THREE.ExtrudeGeometry(outline, { depth: .09, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 1, steps: 1 }), marble);
    wing.position.z = -.18;
    monument.add(wing);
  }
  monument.rotation.y = Math.PI / 2;
  scene.add(monument);
  bayPart([1.2, .28, 1.15], [107.8, -4.06, 5], marble);
  const standProfile = [[0, .23], [.45, .23], [.4, .37], [.33, .42], [.26, .58], [.24, .75],
    [.2, 1.9], [.25, 2.06], [.3, 2.22], [.26, 2.42], [.43, 2.56], [.44, 2.7], [.31, 2.7], [0, 2.62]];
  const stand = new THREE.Mesh(new THREE.LatheGeometry(standProfile.map(([r, y]) => new THREE.Vector2(r, y)), 24), marble);
  stand.position.set(107.8, -4.2, 5);
  scene.add(stand);

  const galleryVisitors = [
    [-12, 7, 4, 2], [-12, -6, 3, 1], [12, 6, 4, 1.8], [8, -6, 2.5, 1.1],
    [30, 9.5, 3, 1.5], [39, 5, 4, 1.5], [53, 9, 5, 1.7], [56, 4, 2, 1],
    [67, 7, 2.8, 3], [74, 11, 3.3, 3], [79, 1.5, 2.4, 1.9], [105, 7, 3, 1.7],
  ].map(([x, z, radiusX, radiusZ], index) => {
    const person = createPerson(['#614458', '#3c5f60', '#7a5942', '#566249'][index % 4],
      ['#c98c67', '#845339', '#d9ac88'][index % 3], .86 + (index % 3) * .045);
    person.position.set(x, x > 100 ? -4.2 : 0, z);
    person.traverse(object => { object.castShadow = false; });
    scene.add(person);
    return { person, x, z, radiusX, radiusZ };
  });
  const suspect = createPerson('#0c131d', '#323d4b', 0.96);
  suspect.position.set(104, -4.2, 8);
  suspect.rotation.y = -Math.PI / 3;
  suspect.visible = false;
  scene.add(suspect);

  return {
    guard,
    visitor,
    sensor,
    camera, grandeCamera, grandeSensor, galleryVisitors,
    incidentPosition: new THREE.Vector3(-2.8, 0, -10.1),
    hemiLight,
    keyLight,
    ceilingLights,
    ferronnierePainting: ferronniereFrameObj.painting,
    emptyFrameBacking,
    suspect,
  };
}

export function createPlayerModel() {
  return createPerson('#1b2b41', '#b98765', 1);
}
