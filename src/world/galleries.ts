export const galleries = [
  { id: '711', name: 'Salle des États', wing: 'Denon', floor: 1, origin: [0,0], rotation: 0, bounds: [-22,22,-14,14], artworks: ['Mona Lisa','The Wedding Feast at Cana'], connections: ['710'] },
  { id: '710', name: 'Grande Galerie', wing: 'Denon', floor: 1, origin: [22,7.4], rotation: 0, bounds: [22,62,1,14], artworks: ['Saint John the Baptist', 'La Belle Ferronnière'], connections: ['711', '708'] },
  { id: '708', name: 'Square Room (Salon Carré)', wing: 'Denon', floor: 1, origin: [62,7.4], rotation: 0, bounds: [62,84,-3,18], artworks: ['Virgin and Child Enthroned with Six Angels', 'Saint Francis Receiving the Stigmata'], connections: ['710', '703'] },
  { id: '703', name: 'Daru Staircase', wing: 'Denon', floor: 1, origin: [84,7.4], rotation: 0, bounds: [84,100,3,12], artworks: ['Winged Victory of Samothrace'], connections: ['708', 'daru-lower'] },
  { id: 'daru-lower', name: 'Lower Stair Landing', wing: 'Denon', floor: 0, origin: [100,7.4], rotation: 0, bounds: [100,112,3,12], artworks: ['Roman Marble Candelabrum'], connections: ['703'] },
] as const;
export const passages = [
  { rooms: ['711', '710'], x: 22, z: 7.4, halfWidth: 2, axis: 'x' },
  { rooms: ['710', '708'], x: 62, z: 7.4, halfWidth: 2.9, axis: 'x' },
  { rooms: ['708', '703'], x: 84, z: 7.4, halfWidth: 3, axis: 'x' },
  { rooms: ['703', 'daru-lower'], x: 100, z: 7.4, halfWidth: 4, axis: 'x' },
] as const;
export const passage = passages[0];
export const saintJohnImage = '/artwork/saint-john.jpg';
export const ferronniereImage = '/artwork/la-belle-ferronniere.jpg';
export const ferronnierePosition = [36, 1.35] as const;
export const inspectionPoints = [
  { title: 'Mona Lisa', room: '711', x: 0, z: -10.5 },
  { title: 'The Wedding Feast at Cana', room: '711', x: 0, z: 12 },
  { title: 'Saint John the Baptist', room: '710', x: 45, z: 2.5 },
  { title: 'La Belle Ferronnière', room: '710', x: ferronnierePosition[0], z: 2.5 },
  { title: 'Virgin and Child Enthroned with Six Angels', room: '708', x: 69, z: -1 },
  { title: 'Saint Francis Receiving the Stigmata', room: '708', x: 77, z: -1 },
  { title: 'Winged Victory of Samothrace', room: '703', x: 85.7, z: 7.4 },
  { title: 'Roman Marble Candelabrum', room: 'daru-lower', x: 107.2, z: 7.4 },
] as const;
export type InspectableArtwork = typeof inspectionPoints[number]['title'];
export const addedExhibits = {
  'Virgin and Child Enthroned with Six Angels': {
    artist: 'Cimabue', room: 'Square Room · 708 · Level 1', image: '/artwork/cimabue-maesta.jpg',
    detail: 'The enthroned Virgin and Child are flanked by six angels on this large gold-ground panel. The Louvre displays it with its original painted frame.',
    source: 'https://collections.louvre.fr/en/ark:/53355/cl010064463',
  },
  'Saint Francis Receiving the Stigmata': {
    artist: 'Giotto di Bondone', room: 'Square Room · 708 · Level 1', image: '/artwork/giotto-stigmata.jpg',
    detail: 'A gold-ground poplar panel from the early 1300s. Three smaller scenes below show the pope’s dream, approval of the Franciscan rule, and Francis preaching to the birds.',
    source: 'https://collections.louvre.fr/en/ark:/53355/cl010064459',
  },
  'Winged Victory of Samothrace': {
    artist: 'Unknown Hellenistic sculptor', room: 'Daru Staircase · 703 · Level 1', image: null,
    detail: 'The marble figure represents Nike, the goddess of victory, alighting on a ship. Discovered in 1863 on Samothrace, it stands at the top of the Louvre’s Daru staircase. The game uses a simplified sculptural model.',
    source: 'https://collections.louvre.fr/en/ark:/53355/cl010252531',
  },
  'Roman Marble Candelabrum': {
    artist: 'Unknown Roman sculptor', room: 'Lower Stair Landing · Level 0', image: null,
    detail: 'This over-three-metre marble stand was found near Naples in 1777. Its carved shaft features ivy, fluting and a scene with dancers associated with Dionysus. The game uses a simplified model.',
    source: 'https://collections.louvre.fr/en/ark:/53355/cl010304019',
  },
} as const;

export function findAddedExhibit(title: InspectableArtwork | null) {
  return title && Object.hasOwn(addedExhibits, title) ? addedExhibits[title as keyof typeof addedExhibits] : null;
}
export const galleryLocations = {
  '711': { artwork: [0, -13.6], wedding: [0, 13.6], inspection: [0, -10.5], incident: [-2.8, -10.1], camera: [-19.8, -12.9], sensor: [4.1, -13.45] },
  '710': { artwork: [45, 1.35], inspection: [45, 2.5], incident: [45, 3.5], camera: [60, 12], sensor: [46, 2] },
} as const;

export function galleryById(id: string | undefined) {
  return galleries.find(gallery => gallery.id === id);
}

export function floorHeightAt(x: number) {
  return -4.2 * Math.min(1, Math.max(0, (x - 88) / 12));
}

export function passageWaypoints(from: string, to: string): Array<[number, number]> {
  const door = passages.find(({ rooms }) =>
    (rooms[0] === from && rooms[1] === to) || (rooms[1] === from && rooms[0] === to));
  if (!door) return [];
  const direction = door.rooms[0] === from ? 1 : -1;
  return [-direction * 2, direction * 2].map(offset =>
    door.axis === 'x' ? [door.x + offset, door.z] : [door.x, door.z + offset]);
}
export function galleryAt(x: number, z: number) {
  return galleries.find(({bounds:[left,right,top,bottom]}) => x >= left && x <= right && z >= top && z <= bottom);
}
export function walkable(x: number, z: number, margin = 0.65) {
  if (passages.some(door => {
    const dx = Math.abs(x - door.x);
    const dz = Math.abs(z - door.z);
    return door.axis === 'x'
      ? dx <= margin && dz < door.halfWidth - margin
      : dz <= margin && dx < door.halfWidth - margin;
  })) return true;
  return galleries.some(({bounds:[left,right,top,bottom]}) => x >= left+margin && x <= right-margin && z >= top+margin && z <= bottom-margin);
}
