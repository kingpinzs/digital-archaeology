// src/progress/CollectibleRegistry.ts
// Static data registries for world map locations and collectible artifacts
// Maps story content stat values to geographic coordinates and artifact metadata

import type { LocationEntry, ArtifactEntry } from './collectible-types';

/**
 * Registry of world map locations referenced in the story.
 * Coordinates are percentages of a 1000x500 equirectangular SVG viewBox.
 * x: 0 = far west (-180°), 100 = far east (180°)
 * y: 0 = north pole (90°N), 100 = south pole (90°S)
 */
export const LOCATION_REGISTRY: readonly LocationEntry[] = [
  {
    id: 'lebombo',
    name: 'Lebombo Mountains, Swaziland',
    x: 56.5,
    y: 65,
    actNumber: 0,
    era: '~35,000 BC',
    description: 'Origin of the oldest mathematical artifact — the Lebombo bone tally stick.',
    icon: '\u{1F9B4}',
  },
  {
    id: 'ujjain',
    name: 'Ujjain, India',
    x: 65.3,
    y: 42,
    actNumber: 0,
    era: '~600 AD',
    description: 'Where Brahmagupta formalized zero as a number, revolutionizing mathematics.',
    icon: '\u{1F4D6}',
  },
  {
    id: 'baghdad',
    name: 'Baghdad',
    x: 60.5,
    y: 38,
    actNumber: 0,
    era: '~820 AD',
    description: 'The House of Wisdom where al-Khwarizmi gave us "algorithm" and "algebra".',
    icon: '\u{1F3DB}',
  },
  {
    id: 'pisa',
    name: 'Pisa, Italy',
    x: 51.5,
    y: 33,
    actNumber: 0,
    era: '~1200 AD',
    description: 'Where Fibonacci introduced Hindu-Arabic numerals to Europe.',
    icon: '\u{1F3F0}',
  },
  {
    id: 'berlin',
    name: 'Berlin, Germany',
    x: 52.0,
    y: 28,
    actNumber: 1,
    era: '1941',
    description: 'Konrad Zuse built the Z3 — the world\'s first programmable digital computer.',
    icon: '\u{26A1}',
  },
  {
    id: 'lincoln',
    name: 'Lincoln, England',
    x: 49.7,
    y: 27,
    actNumber: 1,
    era: '1854',
    description: 'George Boole wrote "The Laws of Thought" — boolean algebra was born.',
    icon: '\u{1F4DA}',
  },
  {
    id: 'philadelphia',
    name: 'Philadelphia, USA',
    x: 25.8,
    y: 32,
    actNumber: 2,
    era: '1946',
    description: 'ENIAC was unveiled — 18,000 vacuum tubes computing at unprecedented speed.',
    icon: '\u{1F4A1}',
  },
  {
    id: 'manchester',
    name: 'Manchester, England',
    x: 49.2,
    y: 27,
    actNumber: 2,
    era: '1948',
    description: 'The Manchester Baby ran the first stored program, fulfilling Turing\'s vision.',
    icon: '\u{1F3ED}',
  },
  {
    id: 'murray-hill',
    name: 'Murray Hill, New Jersey',
    x: 25.5,
    y: 32,
    actNumber: 3,
    era: '1955',
    description: 'Bell Labs — where the transistor was invented and silicon replaced vacuum tubes.',
    icon: '\u{1F50C}',
  },
  {
    id: 'santa-clara',
    name: 'Santa Clara, California',
    x: 18.5,
    y: 34,
    actNumber: 4,
    era: '1971',
    description: 'Intel created the 4004 — the first commercial microprocessor on a single chip.',
    icon: '\u{1F4BB}',
  },
  {
    id: 'albuquerque',
    name: 'Albuquerque, New Mexico',
    x: 20.5,
    y: 35,
    actNumber: 5,
    era: '1975',
    description: 'MITS Altair 8800 launched the personal computer revolution.',
    icon: '\u{1F3AE}',
  },
  {
    id: 'cupertino',
    name: 'Cupertino, California',
    x: 18.3,
    y: 34.5,
    actNumber: 6,
    era: '1984',
    description: 'Apple introduced the Macintosh — bringing GUIs to the masses.',
    icon: '\u{1F34E}',
  },
  {
    id: 'hillsboro',
    name: 'Hillsboro, Oregon',
    x: 18.0,
    y: 30,
    actNumber: 7,
    era: '1985',
    description: 'Intel designed the 80386 — ushering in the 32-bit era.',
    icon: '\u{1F5A5}',
  },
  {
    id: 'austin',
    name: 'Austin, Texas',
    x: 22.0,
    y: 37,
    actNumber: 9,
    era: '2003',
    description: 'AMD\'s Opteron launched the x86-64 era from Austin design labs.',
    icon: '\u{1F680}',
  },
];

/**
 * Registry of collectible artifacts referenced in the story.
 * Images use Wikimedia Commons thumbnail URLs for real historical photos.
 */
export const ARTIFACT_REGISTRY: readonly ArtifactEntry[] = [
  {
    id: 'lebombo-bone',
    name: 'Lebombo Bone',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Os_d%27Ishango_IRSNB.JPG/220px-Os_d%27Ishango_IRSNB.JPG',
    attribution: 'Royal Belgian Institute of Natural Sciences, CC BY-SA 3.0',
    actNumber: 0,
    era: '~35,000 BC',
    description: 'A baboon fibula with 29 notch marks — the oldest known mathematical artifact.',
    icon: '\u{1F9B4}',
    rarity: 'legendary',
  },
  {
    id: 'clay-tokens',
    name: 'Sumerian Clay Tokens',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Accountancy_clay_envelope_Louvre_Sb1932.jpg/220px-Accountancy_clay_envelope_Louvre_Sb1932.jpg',
    attribution: 'Louvre Museum, Public Domain',
    actNumber: 0,
    era: '~8,000 BC',
    description: 'Clay tokens used for accounting in ancient Mesopotamia — shape encodes meaning.',
    icon: '\u{1F4E6}',
    rarity: 'common',
  },
  {
    id: 'pascaline',
    name: 'Pascaline',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Arts_et_Metiers_Pascaline_dsc03869.jpg/220px-Arts_et_Metiers_Pascaline_dsc03869.jpg',
    attribution: 'Wikimedia Commons, CC BY-SA 3.0',
    actNumber: 0,
    era: '1642',
    description: 'Blaise Pascal\'s mechanical calculator — the first commercial calculating device.',
    icon: '\u{2699}',
    rarity: 'uncommon',
  },
  {
    id: 'difference-engine',
    name: 'Babbage\'s Difference Engine',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Babbage_Difference_Engine.jpg/220px-Babbage_Difference_Engine.jpg',
    attribution: 'Science Museum London, CC BY-SA 2.0',
    actNumber: 0,
    era: '1837',
    description: 'Charles Babbage designed the first automatic computing machine — inspiring all that followed.',
    icon: '\u{1F3DB}',
    rarity: 'rare',
  },
  {
    id: 'z3-computer',
    name: 'Zuse Z3',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Z3_Deutsches_Museum.JPG/220px-Z3_Deutsches_Museum.JPG',
    attribution: 'Deutsches Museum, CC BY-SA 3.0',
    actNumber: 1,
    era: '1941',
    description: 'The world\'s first programmable digital computer, built from telephone relays.',
    icon: '\u{26A1}',
    rarity: 'rare',
  },
  {
    id: 'eniac',
    name: 'ENIAC',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Eniac.jpg/220px-Eniac.jpg',
    attribution: 'U.S. Army Photo, Public Domain',
    actNumber: 2,
    era: '1946',
    description: 'The Electronic Numerical Integrator and Computer — 18,000 vacuum tubes.',
    icon: '\u{1F4A1}',
    rarity: 'rare',
  },
  {
    id: 'transistor',
    name: 'First Transistor',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Replica-of-first-transistor.jpg/220px-Replica-of-first-transistor.jpg',
    attribution: 'Wikimedia Commons, CC BY-SA 3.0',
    actNumber: 3,
    era: '1947',
    description: 'The point-contact transistor from Bell Labs — the switch that changed everything.',
    icon: '\u{1F50C}',
    rarity: 'legendary',
  },
  {
    id: 'intel-4004',
    name: 'Intel 4004',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Intel_C4004.jpg/220px-Intel_C4004.jpg',
    attribution: 'Wikimedia Commons, CC BY-SA 3.0',
    actNumber: 4,
    era: '1971',
    description: 'The first commercial microprocessor — 2,300 transistors on a single chip.',
    icon: '\u{1F4BB}',
    rarity: 'legendary',
  },
  {
    id: 'altair-8800',
    name: 'Altair 8800',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Altair_8800_Computer.jpg/220px-Altair_8800_Computer.jpg',
    attribution: 'Wikimedia Commons, CC BY-SA 2.0',
    actNumber: 5,
    era: '1975',
    description: 'The computer kit that launched the personal computing revolution.',
    icon: '\u{1F3AE}',
    rarity: 'uncommon',
  },
  {
    id: 'ibm-pc',
    name: 'IBM PC',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Ibm_pc_5150.jpg/220px-Ibm_pc_5150.jpg',
    attribution: 'Wikimedia Commons, CC BY-SA 3.0',
    actNumber: 6,
    era: '1981',
    description: 'The IBM Personal Computer — open architecture that became the industry standard.',
    icon: '\u{1F4CA}',
    rarity: 'uncommon',
  },
  {
    id: 'intel-386',
    name: 'Intel 80386',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/KL_Intel_i386DX.jpg/220px-KL_Intel_i386DX.jpg',
    attribution: 'Wikimedia Commons, CC BY-SA 3.0',
    actNumber: 7,
    era: '1985',
    description: 'Intel\'s first 32-bit processor — flat addressing, protected mode, virtual memory.',
    icon: '\u{1F5A5}',
    rarity: 'rare',
  },
  {
    id: 'pentium-pro',
    name: 'Pentium Pro',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/KL_Intel_Pentium_Pro.jpg/220px-KL_Intel_Pentium_Pro.jpg',
    attribution: 'Wikimedia Commons, CC BY-SA 3.0',
    actNumber: 8,
    era: '1995',
    description: 'The P6 microarchitecture — out-of-order execution comes to x86.',
    icon: '\u{2699}',
    rarity: 'rare',
  },
];

/**
 * Reverse lookup: exact stat value strings → location IDs.
 * Maps character card stat values from the story JSON to location registry entries.
 */
export const STAT_VALUE_TO_LOCATION: ReadonlyMap<string, string> = new Map([
  ['Lebombo Mountains, Swaziland', 'lebombo'],
  ['Ujjain, India', 'ujjain'],
  ['Baghdad', 'baghdad'],
  ['Pisa, Italy', 'pisa'],
]);

/**
 * Reverse lookup: exact stat value strings → artifact IDs.
 * Maps character card stat values from the story JSON to artifact registry entries.
 */
export const STAT_VALUE_TO_ARTIFACT: ReadonlyMap<string, string> = new Map([
  ['Oldest mathematical artifact', 'lebombo-bone'],
  ['Clay tokens for accounting', 'clay-tokens'],
  ['Foundation of digital computing', 'pascaline'],
  ['Inspired all stored-program computing', 'difference-engine'],
  ['Binary, floating-point, programs', 'z3-computer'],
  ['First practical stored-program computer', 'eniac'],
  ['Co-invented the IC', 'transistor'],
  ['Moore\'s Law (1965)', 'intel-4004'],
  ['8080 simulator on PDP-10', 'altair-8800'],
  ['Open PC architecture', 'ibm-pc'],
  ['Flat 32-bit addressing', 'intel-386'],
  ['x86 out-of-order execution', 'pentium-pro'],
]);

/**
 * Lookup a location entry by ID.
 */
export function getLocationById(id: string): LocationEntry | undefined {
  return LOCATION_REGISTRY.find(loc => loc.id === id);
}

/**
 * Lookup an artifact entry by ID.
 */
export function getArtifactById(id: string): ArtifactEntry | undefined {
  return ARTIFACT_REGISTRY.find(art => art.id === id);
}

/**
 * Get all locations available up to a given act number.
 */
export function getLocationsUpToAct(actNumber: number): readonly LocationEntry[] {
  return LOCATION_REGISTRY.filter(loc => loc.actNumber <= actNumber);
}

/**
 * Get all artifacts available up to a given act number.
 */
export function getArtifactsUpToAct(actNumber: number): readonly ArtifactEntry[] {
  return ARTIFACT_REGISTRY.filter(art => art.actNumber <= actNumber);
}
