// src/literature/curatedResources.ts
// Curated external resource data for Stories 20-7 through 20-12
// Documentaries, TV Shows, YouTube Channels, Books, Museums, Online Simulators

/** Resource type categories matching stories 20-7 through 20-12 */
export type CuratedResourceType =
  | 'documentary'
  | 'tv'
  | 'youtube'
  | 'book'
  | 'museum'
  | 'simulator';

/** Display labels for each resource type */
export const RESOURCE_TYPE_LABELS: Record<CuratedResourceType, string> = {
  documentary: 'Documentaries & Films',
  tv: 'TV Shows & Series',
  youtube: 'YouTube Channels',
  book: 'Books',
  museum: 'Museums & Sites',
  simulator: 'Online Simulators',
};

/** Icons for each resource type */
export const RESOURCE_TYPE_ICONS: Record<CuratedResourceType, string> = {
  documentary: '\uD83C\uDFAC',  // 🎬
  tv: '\uD83D\uDCFA',           // 📺
  youtube: '\u25B6\uFE0F',      // ▶️
  book: '\uD83D\uDCDA',         // 📚
  museum: '\uD83C\uDFDB\uFE0F', // 🏛️
  simulator: '\uD83D\uDD27',    // 🔧
};

/** Rendering order for resource type sections */
export const RESOURCE_TYPE_ORDER: readonly CuratedResourceType[] = [
  'documentary', 'tv', 'youtube', 'book', 'museum', 'simulator',
] as const;

/** A single curated external resource */
export interface CuratedResource {
  readonly id: string;
  readonly type: CuratedResourceType;
  readonly title: string;
  readonly year?: number;
  readonly creator?: string;
  readonly era: string;
  readonly description: string;
  readonly whereToAccess: string;
  readonly tags: readonly string[];
}

// --- Story 20.7: Documentaries & Films ---

const DOCUMENTARIES: readonly CuratedResource[] = [
  {
    id: 'doc-01',
    type: 'documentary',
    title: 'The Imitation Game',
    year: 2014,
    creator: 'Morten Tyldum',
    era: 'Turing Era',
    description: 'The story of Alan Turing cracking the Enigma code during WWII, dramatizing the birth of computational thinking and the first electronic computers.',
    whereToAccess: 'Netflix, Amazon Prime',
    tags: ['turing', 'enigma', 'wwii', 'codebreaking'],
  },
  {
    id: 'doc-02',
    type: 'documentary',
    title: 'Hidden Figures',
    year: 2016,
    creator: 'Theodore Melfi',
    era: 'Early Computing',
    description: 'Three brilliant African-American women at NASA who served as human computers and helped launch astronaut John Glenn into orbit.',
    whereToAccess: 'Disney+, Amazon Prime',
    tags: ['nasa', 'human-computers', 'space-race', 'early-computing'],
  },
  {
    id: 'doc-03',
    type: 'documentary',
    title: 'Pirates of Silicon Valley',
    year: 1999,
    creator: 'Martyn Burke',
    era: 'PC Era',
    description: 'The rivalry between Steve Jobs and Bill Gates as they built Apple and Microsoft, capturing the chaotic creativity of the personal computer revolution.',
    whereToAccess: 'YouTube, Amazon Prime',
    tags: ['apple', 'microsoft', 'pc-revolution', 'jobs', 'gates'],
  },
  {
    id: 'doc-04',
    type: 'documentary',
    title: 'Triumph of the Nerds',
    year: 1996,
    creator: 'Robert X. Cringely',
    era: 'PC Era',
    description: 'PBS documentary tracing the personal computer from hobbyist garages to mainstream dominance, featuring interviews with key figures.',
    whereToAccess: 'YouTube',
    tags: ['pc-revolution', 'ibm', 'apple', 'microsoft', 'hobbyist'],
  },
  {
    id: 'doc-05',
    type: 'documentary',
    title: 'The Machine That Changed the World',
    year: 1992,
    creator: 'PBS/WGBH',
    era: 'All Eras',
    description: 'Five-part PBS series covering the entire history of computing from Babbage to modern networks, with rare archival footage.',
    whereToAccess: 'YouTube, PBS',
    tags: ['history', 'babbage', 'mainframe', 'pc', 'network'],
  },
  {
    id: 'doc-06',
    type: 'documentary',
    title: 'Revolution OS',
    year: 2001,
    creator: 'J.T.S. Moore',
    era: 'Open Source',
    description: 'The story of Linux and the open-source movement, featuring Linus Torvalds, Richard Stallman, and the philosophy behind free software.',
    whereToAccess: 'YouTube',
    tags: ['linux', 'open-source', 'stallman', 'torvalds'],
  },
  {
    id: 'doc-07',
    type: 'documentary',
    title: 'Silicon Cowboys',
    year: 2016,
    creator: 'Jason Cohen',
    era: 'PC Era',
    description: 'How three friends in Texas built Compaq Computer and challenged IBM for dominance of the PC market through reverse engineering.',
    whereToAccess: 'Amazon Prime, YouTube',
    tags: ['compaq', 'ibm', 'reverse-engineering', 'pc-clone'],
  },
  {
    id: 'doc-08',
    type: 'documentary',
    title: 'General Magic',
    year: 2018,
    creator: 'Sarah Kerruish & Matt Maude',
    era: 'Early Mobile',
    description: 'The untold story of the team that invented the smartphone a decade before the iPhone, and how their vision was too early for its time.',
    whereToAccess: 'Amazon Prime, Apple TV+',
    tags: ['mobile', 'smartphone', 'apple', 'innovation'],
  },
  {
    id: 'doc-09',
    type: 'documentary',
    title: 'Micro Men',
    year: 2009,
    creator: 'BBC',
    era: '8-bit Era',
    description: 'BBC drama about the rivalry between Clive Sinclair and Chris Curry as they battled to bring computers into British homes in the 1980s.',
    whereToAccess: 'YouTube, BBC iPlayer',
    tags: ['sinclair', 'acorn', 'bbc-micro', '8-bit', 'british-computing'],
  },
  {
    id: 'doc-10',
    type: 'documentary',
    title: 'BBS: The Documentary',
    year: 2005,
    creator: 'Jason Scott',
    era: 'Modem Era',
    description: 'Eight-part documentary about the bulletin board system (BBS) subculture of the 1980s-90s, the internet before the internet.',
    whereToAccess: 'YouTube, Archive.org',
    tags: ['bbs', 'modem', 'dial-up', 'online-culture'],
  },
  {
    id: 'doc-11',
    type: 'documentary',
    title: 'The Code',
    year: 2001,
    creator: 'Hannu Puttonen',
    era: 'Open Source',
    description: 'Finnish documentary exploring the Linux operating system, Linus Torvalds, and the global community that built an OS to rival Microsoft.',
    whereToAccess: 'YouTube',
    tags: ['linux', 'open-source', 'torvalds', 'community'],
  },
  {
    id: 'doc-12',
    type: 'documentary',
    title: 'Steve Jobs: The Man in the Machine',
    year: 2015,
    creator: 'Alex Gibney',
    era: 'PC Era to Modern',
    description: 'Unflinching look at the complicated genius behind Apple, from the Apple II through the iPhone, examining the human cost of innovation.',
    whereToAccess: 'Amazon Prime',
    tags: ['apple', 'jobs', 'iphone', 'innovation'],
  },
];

// --- Story 20.8: TV Shows & Series ---

const TV_SHOWS: readonly CuratedResource[] = [
  {
    id: 'tv-01',
    type: 'tv',
    title: 'Halt and Catch Fire',
    year: 2014,
    creator: 'AMC',
    era: 'PC Era (1980s-90s)',
    description: 'Drama following engineers and entrepreneurs racing to build the future of computing, from PC clones to the early internet, capturing the ambition and chaos of Silicon Prairie.',
    whereToAccess: 'AMC+, Amazon Prime',
    tags: ['pc-era', 'ibm-clone', 'networking', 'internet', 'startup'],
  },
  {
    id: 'tv-02',
    type: 'tv',
    title: 'Silicon Valley',
    year: 2014,
    creator: 'HBO',
    era: 'Modern',
    description: 'Comedy satirizing the modern tech startup world — compression algorithms, venture capital, and the absurdity of building a billion-dollar company from nothing.',
    whereToAccess: 'HBO Max',
    tags: ['startup', 'silicon-valley', 'compression', 'modern-tech'],
  },
  {
    id: 'tv-03',
    type: 'tv',
    title: 'The Billion Dollar Code',
    year: 2021,
    creator: 'Netflix',
    era: 'Modern',
    description: 'German miniseries about the true story of two hackers who invented the technology behind Google Earth, and their legal battle for recognition.',
    whereToAccess: 'Netflix',
    tags: ['google-earth', 'mapping', 'patent', 'hacker'],
  },
  {
    id: 'tv-04',
    type: 'tv',
    title: 'Devs',
    year: 2020,
    creator: 'Hulu/FX',
    era: 'Modern',
    description: 'Thriller exploring quantum computing, determinism, and the limits of simulation — a secretive Silicon Valley lab builds something that could predict the future.',
    whereToAccess: 'Hulu, Disney+',
    tags: ['quantum', 'simulation', 'silicon-valley', 'determinism'],
  },
];

// --- Story 20.9: YouTube Channels & Videos ---

const YOUTUBE: readonly CuratedResource[] = [
  {
    id: 'yt-01',
    type: 'youtube',
    title: 'Ben Eater',
    creator: 'Ben Eater',
    era: 'Hands-On Building',
    description: 'Build an 8-bit computer from scratch on a breadboard. The definitive hands-on series for understanding how CPUs work at the gate level.',
    whereToAccess: 'youtube.com/@BenEater',
    tags: ['breadboard', '8-bit', 'cpu-building', 'hands-on', 'gates'],
  },
  {
    id: 'yt-02',
    type: 'youtube',
    title: 'Computerphile',
    creator: 'Brady Haran / University of Nottingham',
    era: 'CS Concepts',
    description: 'Academic computer science explained accessibly — from Turing machines to modern cryptography, featuring university professors.',
    whereToAccess: 'youtube.com/@Computerphile',
    tags: ['cs-concepts', 'turing', 'algorithms', 'cryptography', 'academic'],
  },
  {
    id: 'yt-03',
    type: 'youtube',
    title: 'The 8-Bit Guy',
    creator: 'David Murray',
    era: '8-bit & 16-bit',
    description: 'Exploring, restoring, and explaining vintage 8-bit and 16-bit computers — Commodore 64, Apple II, DOS-era PCs, and more.',
    whereToAccess: 'youtube.com/@The8BitGuy',
    tags: ['retro', '8-bit', '16-bit', 'commodore', 'apple-ii', 'restoration'],
  },
  {
    id: 'yt-04',
    type: 'youtube',
    title: 'LGR (Lazy Game Reviews)',
    creator: 'Clint Basinger',
    era: 'IBM PC Era',
    description: 'Deep dives into IBM PC-compatible hardware, DOS software, and the culture of 1990s computing with detailed teardowns and reviews.',
    whereToAccess: 'youtube.com/@LGR',
    tags: ['ibm-pc', 'dos', '90s', 'hardware', 'teardown'],
  },
  {
    id: 'yt-05',
    type: 'youtube',
    title: 'Technology Connections',
    creator: 'Alec Watson',
    era: 'Electronics Fundamentals',
    description: 'Deep explanations of how everyday technology works, from analog circuits to digital logic, with a focus on the engineering "why" behind designs.',
    whereToAccess: 'youtube.com/@TechnologyConnections',
    tags: ['electronics', 'analog', 'digital', 'engineering', 'fundamentals'],
  },
  {
    id: 'yt-06',
    type: 'youtube',
    title: 'CuriousMarc',
    creator: 'Marc Verdiell',
    era: 'Vintage Restoration',
    description: 'Restoring and repairing iconic vintage computers including the Apollo Guidance Computer, HP calculators, and Xerox Alto.',
    whereToAccess: 'youtube.com/@CuriousMarc',
    tags: ['restoration', 'apollo', 'vintage', 'hp', 'xerox-alto'],
  },
  {
    id: 'yt-07',
    type: 'youtube',
    title: 'Usagi Electric',
    creator: 'David Lovett',
    era: 'Pre-transistor Computing',
    description: 'Building computers from vacuum tubes and relays, exploring the technology that preceded transistors with hands-on construction.',
    whereToAccess: 'youtube.com/@UsagiElectric',
    tags: ['vacuum-tube', 'relay', 'pre-transistor', 'hands-on'],
  },
  {
    id: 'yt-08',
    type: 'youtube',
    title: 'Sebastian Lague',
    creator: 'Sebastian Lague',
    era: 'Visual CS',
    description: 'Beautiful visualizations of computer science concepts — ray tracing, pathfinding, neural networks, and more, explained through code and animation.',
    whereToAccess: 'youtube.com/@SebastianLague',
    tags: ['visualization', 'algorithms', 'graphics', 'animation'],
  },
];

// --- Story 20.10: Books ---

const BOOKS: readonly CuratedResource[] = [
  {
    id: 'book-01',
    type: 'book',
    title: 'Code: The Hidden Language of Computer Hardware and Software',
    creator: 'Charles Petzold',
    year: 2000,
    era: 'First Principles',
    description: 'The definitive guide to understanding computers from scratch — from Morse code and flashlights to building a complete CPU, one layer at a time.',
    whereToAccess: 'Amazon, bookstores',
    tags: ['fundamentals', 'hardware', 'gates', 'cpu', 'first-principles'],
  },
  {
    id: 'book-02',
    type: 'book',
    title: 'The Innovators',
    creator: 'Walter Isaacson',
    year: 2014,
    era: 'All Eras',
    description: 'How a group of hackers, geniuses, and geeks created the digital revolution — from Ada Lovelace to Google, tracing the collaborative nature of innovation.',
    whereToAccess: 'Amazon, bookstores, libraries',
    tags: ['history', 'lovelace', 'turing', 'innovation', 'collaboration'],
  },
  {
    id: 'book-03',
    type: 'book',
    title: 'The Soul of a New Machine',
    creator: 'Tracy Kidder',
    year: 1981,
    era: 'Minicomputer Era',
    description: 'Pulitzer Prize-winning account of building a new minicomputer at Data General, capturing the intensity and human drama of hardware engineering.',
    whereToAccess: 'Amazon, bookstores, libraries',
    tags: ['minicomputer', 'hardware', 'engineering', 'data-general'],
  },
  {
    id: 'book-04',
    type: 'book',
    title: 'Hackers: Heroes of the Computer Revolution',
    creator: 'Steven Levy',
    year: 1984,
    era: 'PC Era',
    description: 'The hacker ethic from MIT to the Homebrew Computer Club — how passionate tinkerers built the foundations of personal computing.',
    whereToAccess: 'Amazon, bookstores',
    tags: ['hacker', 'mit', 'homebrew', 'pc-revolution', 'culture'],
  },
  {
    id: 'book-05',
    type: 'book',
    title: 'Fire in the Valley',
    creator: 'Michael Swaine & Paul Freiberger',
    year: 1984,
    era: 'PC Revolution',
    description: 'The making of the personal computer from the Altair 8800 to the IBM PC, with insider accounts from the people who built the industry.',
    whereToAccess: 'Amazon, bookstores',
    tags: ['altair', 'ibm-pc', 'apple', 'pc-revolution'],
  },
  {
    id: 'book-06',
    type: 'book',
    title: 'The Dream Machine',
    creator: 'M. Mitchell Waldrop',
    year: 2001,
    era: 'Mainframe to Internet',
    description: 'The story of J.C.R. Licklider, who envisioned human-computer symbiosis and funded the creation of the ARPANET, shaping the future of computing.',
    whereToAccess: 'Amazon, bookstores',
    tags: ['licklider', 'arpanet', 'darpa', 'internet', 'mainframe'],
  },
  {
    id: 'book-07',
    type: 'book',
    title: "Turing's Cathedral",
    creator: 'George Dyson',
    year: 2012,
    era: 'Dawn of Computing',
    description: 'The origins of the digital universe at the Institute for Advanced Study, where von Neumann and colleagues built one of the first stored-program computers.',
    whereToAccess: 'Amazon, bookstores, libraries',
    tags: ['von-neumann', 'ias', 'stored-program', 'early-computing'],
  },
];

// --- Story 20.11: Museums & Physical Sites ---

const MUSEUMS: readonly CuratedResource[] = [
  {
    id: 'museum-01',
    type: 'museum',
    title: 'Computer History Museum',
    creator: 'Mountain View, CA, USA',
    era: 'All Eras',
    description: 'The world\'s largest collection of computing artifacts — from Babbage\'s Difference Engine to modern AI, with hands-on exhibits and a working PDP-1.',
    whereToAccess: 'computerhistory.org',
    tags: ['comprehensive', 'babbage', 'pdp-1', 'mainframe', 'silicon-valley'],
  },
  {
    id: 'museum-02',
    type: 'museum',
    title: 'Living Computers: Museum + Labs',
    creator: 'Seattle, WA, USA',
    era: 'Mainframe to PC',
    description: 'Working vintage computers you can actually use — from mainframes to early PCs, with hands-on sessions on real hardware from every era.',
    whereToAccess: 'livingcomputers.org',
    tags: ['hands-on', 'mainframe', 'minicomputer', 'working-hardware'],
  },
  {
    id: 'museum-03',
    type: 'museum',
    title: 'Bletchley Park',
    creator: 'Milton Keynes, UK',
    era: 'WWII / Turing Era',
    description: 'The home of WWII codebreaking — see a working Bombe reconstruction, learn about Colossus (the first electronic computer), and walk where Turing worked.',
    whereToAccess: 'bletchleypark.org.uk',
    tags: ['turing', 'enigma', 'colossus', 'bombe', 'wwii'],
  },
  {
    id: 'museum-04',
    type: 'museum',
    title: 'Science Museum',
    creator: 'London, UK',
    era: 'All Eras',
    description: 'Home to Babbage\'s Difference Engine No. 2 replica (which works!), plus extensive computing galleries from mechanical calculators to modern machines.',
    whereToAccess: 'sciencemuseum.org.uk',
    tags: ['babbage', 'difference-engine', 'mechanical', 'british-computing'],
  },
  {
    id: 'museum-05',
    type: 'museum',
    title: 'Heinz Nixdorf MuseumsForum',
    creator: 'Paderborn, Germany',
    era: 'All Eras',
    description: 'The world\'s largest computer museum by floor space — 5,000 years of information technology from cuneiform tablets to modern robotics.',
    whereToAccess: 'hnf.de',
    tags: ['comprehensive', 'european', 'history', 'robotics'],
  },
  {
    id: 'museum-06',
    type: 'museum',
    title: 'Computer Museum of America',
    creator: 'Roswell, GA, USA',
    era: 'PC Era',
    description: 'Extensive collection of Apple, IBM, and gaming hardware with working demonstrations and rotating exhibits on computing culture.',
    whereToAccess: 'computermuseumofamerica.org',
    tags: ['apple', 'ibm', 'gaming', 'pc-era', 'american'],
  },
];

// --- Story 20.12: Online Simulators & Interactive Resources ---

const SIMULATORS: readonly CuratedResource[] = [
  {
    id: 'sim-01',
    type: 'simulator',
    title: 'Nand2Tetris',
    creator: 'Noam Nisan & Shimon Schocken',
    era: 'Build from NAND Gates',
    description: 'Build a complete computer system from NAND gates up through an OS — the gold standard for understanding computer architecture from first principles.',
    whereToAccess: 'nand2tetris.org',
    tags: ['nand', 'gates', 'cpu', 'assembler', 'compiler', 'os', 'first-principles'],
  },
  {
    id: 'sim-02',
    type: 'simulator',
    title: 'Visual 6502',
    creator: 'Visual6502.org Team',
    era: '8-bit Transistor Level',
    description: 'See every transistor fire in a real MOS 6502 CPU — the actual chip layout visualized at the transistor level as it executes instructions.',
    whereToAccess: 'visual6502.org',
    tags: ['6502', 'transistor', 'visualization', 'mos', '8-bit'],
  },
  {
    id: 'sim-03',
    type: 'simulator',
    title: 'Digital',
    creator: 'Helmut Neemann',
    era: 'Logic Simulation',
    description: 'Free logic circuit simulator for building and testing digital circuits — from simple gates to complete CPUs with a visual editor.',
    whereToAccess: 'github.com/hneemann/Digital',
    tags: ['logic-gates', 'simulation', 'circuit', 'visual-editor'],
  },
  {
    id: 'sim-04',
    type: 'simulator',
    title: 'Logic.ly',
    creator: 'Logic.ly',
    era: 'Logic Gates',
    description: 'Drag-and-drop logic gate simulator in the browser — build circuits from AND, OR, NOT gates and see signals propagate in real time.',
    whereToAccess: 'logic.ly',
    tags: ['logic-gates', 'browser', 'visual', 'drag-and-drop'],
  },
  {
    id: 'sim-05',
    type: 'simulator',
    title: 'Turing Machine Simulator',
    creator: 'turingmachine.io',
    era: 'Theoretical Computing',
    description: 'Interactive Turing machine with visual tape, head, and state diagram — experiment with the theoretical foundation of all computation.',
    whereToAccess: 'turingmachine.io',
    tags: ['turing-machine', 'theory', 'computation', 'interactive'],
  },
  {
    id: 'sim-06',
    type: 'simulator',
    title: 'MAME',
    creator: 'MAMEdev Team',
    era: 'Hardware Emulation',
    description: 'Multi-system emulator preserving arcade machines and vintage computers in software — experience the actual hardware behavior of thousands of systems.',
    whereToAccess: 'mamedev.org',
    tags: ['emulation', 'arcade', 'vintage', 'preservation'],
  },
];

/** All curated resources across all types */
export const CURATED_RESOURCES: readonly CuratedResource[] = [
  ...DOCUMENTARIES,
  ...TV_SHOWS,
  ...YOUTUBE,
  ...BOOKS,
  ...MUSEUMS,
  ...SIMULATORS,
];

/** Get all resources of a specific type */
export function getResourcesByType(type: CuratedResourceType): readonly CuratedResource[] {
  return CURATED_RESOURCES.filter(r => r.type === type);
}

/** Get the count of resources for a given type */
export function getResourceCount(type: CuratedResourceType): number {
  return CURATED_RESOURCES.filter(r => r.type === type).length;
}

/** Get all unique eras across all resources */
export function getAllEras(): readonly string[] {
  const eras = new Set(CURATED_RESOURCES.map(r => r.era));
  return Array.from(eras).sort();
}
