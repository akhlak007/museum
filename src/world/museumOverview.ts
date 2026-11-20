// Public visitor landmarks from the Louvre's floor guide. The overview layout is schematic.
export type MuseumWing = 'Richelieu' | 'Sully' | 'Denon' | 'Pyramid reception';

interface MuseumArea {
  wing: MuseumWing;
  galleries: readonly string[];
}

export const MUSEUM_FLOORS = [-2, -1, 0, 1, 2] as const;
export type MuseumFloor = typeof MUSEUM_FLOORS[number];

export const MUSEUM_OVERVIEW: Record<MuseumFloor, readonly MuseumArea[]> = {
  [-2]: [
    { wing: 'Pyramid reception', galleries: ['Visitor assistance', 'Hall Napoléon'] },
    { wing: 'Denon', galleries: ['Islamic Art'] },
  ],
  [-1]: [
    { wing: 'Richelieu', galleries: ['The Studio', 'French sculpture'] },
    { wing: 'Sully', galleries: ['Medieval Louvre'] },
    { wing: 'Denon', galleries: ['Greek Antiquities', 'Islamic Art'] },
  ],
  0: [
    { wing: 'Richelieu', galleries: ['French sculpture', 'Near Eastern Antiquities'] },
    { wing: 'Sully', galleries: ['Egyptian Antiquities', 'Venus de Milo · 345'] },
    { wing: 'Denon', galleries: ['Roman Antiquities', 'Arts of Africa, Asia, Oceania and the Americas'] },
  ],
  1: [
    { wing: 'Richelieu', galleries: ['Napoleon III Apartments · 544', 'European decorative arts'] },
    { wing: 'Sully', galleries: ['Egyptian Antiquities', 'The Seated Scribe · 635'] },
    { wing: 'Denon', galleries: ['Winged Victory · 703', 'Galerie d’Apollon · 705', 'Grande Galerie'] },
  ],
  2: [
    { wing: 'Richelieu', galleries: ['Northern European paintings', 'The Lacemaker · 837'] },
    { wing: 'Sully', galleries: ['French paintings', 'The Bather · 940'] },
  ],
};

export const LOUVRE_VISITOR_MAP = 'https://www.louvre.fr/en/visit/map-entrances-directions';
