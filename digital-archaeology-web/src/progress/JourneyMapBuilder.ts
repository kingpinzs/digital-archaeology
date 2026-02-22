// src/progress/JourneyMapBuilder.ts
// Data builder for journey map visualization
// Story 19.4: Create Progress Visualization

import type { ActCompletionType, JourneyMapData, JourneyNode, JourneyNodeStatus } from './types';
import { ACT_COMPLETION_METADATA } from './types';
import { ActCompletionStorage } from './ActCompletionStorage';

/** Total number of acts in the story (Act 0 through Act 10) */
const TOTAL_ACTS = 11;

/** Story 26.11: Key historical figures per act */
const ACT_KEY_FIGURES: readonly (readonly string[])[] = [
  /* Act 0 */ ['Thales of Miletus', 'Aristotle', 'Al-Khwarizmi', 'Pascal', 'Leibniz', 'Babbage', 'Ada Lovelace'],
  /* Act 1 */ ['George Boole', 'Herman Hollerith', 'Konrad Zuse', 'Alan Turing', 'Claude Shannon'],
  /* Act 2 */ ['John von Neumann', 'J. Presper Eckert', 'John Mauchly', 'Grace Hopper', 'Maurice Wilkes'],
  /* Act 3 */ ['William Shockley', 'Jack Kilby', 'Robert Noyce', 'Gordon Moore', 'Douglas Engelbart'],
  /* Act 4 */ ['Ted Hoff', 'Federico Faggin', 'Stan Mazor', 'Masatoshi Shima'],
  /* Act 5 */ ['Chuck Peddle', 'Steve Wozniak', 'Gary Kildall', 'Bill Gates'],
  /* Act 6 */ ['Stephen Morse', 'John Crawford', 'Sophie Wilson', 'Steve Furber'],
  /* Act 7 */ ['David Patterson', 'John Hennessy', 'Linus Torvalds'],
  /* Act 8 */ ['John Cocke', 'Jim Smith', 'Mike Johnson'],
  /* Act 9 */ ['Seymour Cray', 'Jim Keller', 'Jensen Huang'],
  /* Act 10 */ ['David Deutsch', 'Carver Mead', 'John Preskill'],
];

/** Story 26.11: Key inventions/technologies per act */
const ACT_KEY_INVENTIONS: readonly (readonly string[])[] = [
  /* Act 0 */ ['Abacus', 'Boolean Logic', 'Pascaline', 'Stepped Reckoner', 'Analytical Engine'],
  /* Act 1 */ ['Relay Computer', 'Z3', 'Colossus', 'Harvard Mark I'],
  /* Act 2 */ ['ENIAC', 'EDVAC', 'Stored Program', 'Assembly Language', 'Magnetic Core Memory'],
  /* Act 3 */ ['Transistor', 'Integrated Circuit', 'MOSFET', 'Mainframe Computer'],
  /* Act 4 */ ['Intel 4004', 'Microprocessor', '4-bit CPU', 'Calculator Chip'],
  /* Act 5 */ ['Intel 8080', 'MOS 6502', 'Z80', 'Personal Computer'],
  /* Act 6 */ ['Intel 8086', 'x86 Architecture', 'Protected Mode', 'ARM Architecture'],
  /* Act 7 */ ['Intel 80386', 'RISC', 'Virtual Memory', 'Paging'],
  /* Act 8 */ ['Instruction Pipeline', 'Branch Prediction', 'Out-of-Order Execution', 'Cache Hierarchy'],
  /* Act 9 */ ['Superscalar', 'Speculative Execution', 'Multi-core', 'SIMD'],
  /* Act 10 */ ['Quantum Computing', 'Neuromorphic Chips', 'Photonic Computing'],
];

/** Mapping from act number (0-10) to CpuStage string — tuple enforces exactly 11 entries at compile time */
const ACT_CPU_STAGES: readonly [string, string, string, string, string, string, string, string, string, string, string] = [
  'mechanical',   // Act 0
  'relay',        // Act 1
  'vacuum',       // Act 2
  'transistor',   // Act 3
  'micro4',       // Act 4
  'micro8',       // Act 5
  'micro16',      // Act 6
  'micro32',      // Act 7
  'micro32p',     // Act 8
  'micro32s',     // Act 9
  'future',       // Act 10
];

/**
 * Story 26.11: Key historical figures per act (0-10).
 * These appear in the era detail view on the journey map timeline.
 */
const ACT_KEY_FIGURES: readonly (readonly string[])[] = [
  /* Act 0 */ ['Thales of Miletus', 'Aristotle', 'Al-Khwarizmi', 'Pascal', 'Leibniz', 'Babbage', 'Ada Lovelace'],
  /* Act 1 */ ['George Boole', 'Herman Hollerith', 'Konrad Zuse', 'Alan Turing', 'Claude Shannon'],
  /* Act 2 */ ['John von Neumann', 'Grace Hopper', 'J. Presper Eckert', 'John Mauchly', 'Maurice Wilkes'],
  /* Act 3 */ ['William Shockley', 'John Bardeen', 'Walter Brattain', 'Jack Kilby', 'Robert Noyce'],
  /* Act 4 */ ['Ted Hoff', 'Federico Faggin', 'Stan Mazor', 'Masatoshi Shima'],
  /* Act 5 */ ['Chuck Peddle', 'Steve Wozniak', 'Bill Gates', 'Gary Kildall'],
  /* Act 6 */ ['Gordon Moore', 'Andy Grove', 'Bill Joy', 'Richard Stallman'],
  /* Act 7 */ ['David Patterson', 'John Hennessy', 'Linus Torvalds', 'Tim Berners-Lee'],
  /* Act 8 */ ['Jim Smith', 'Gurindar Sohi', 'Yale Patt'],
  /* Act 9 */ ['Jim Keller', 'Sophie Wilson', 'Steve Furber'],
  /* Act 10 */ ['John Preskill', 'Jensen Huang', 'Lisa Su'],
];

/**
 * Story 26.11: Key inventions/technologies per act (0-10).
 * These appear as pill badges in the era detail view.
 */
const ACT_KEY_INVENTIONS: readonly (readonly string[])[] = [
  /* Act 0 */ ['Abacus', 'Boolean Logic', 'Pascaline', 'Stepped Reckoner', 'Analytical Engine'],
  /* Act 1 */ ['Tabulating Machine', 'Z3 Computer', 'Turing Machine', 'Information Theory'],
  /* Act 2 */ ['ENIAC', 'EDVAC', 'Stored Program', 'Assembly Language', 'UNIVAC'],
  /* Act 3 */ ['Transistor', 'Integrated Circuit', 'Silicon Planar Process'],
  /* Act 4 */ ['Intel 4004', 'Microprocessor', 'Calculator Chip'],
  /* Act 5 */ ['MOS 6502', 'Apple II', 'CP/M', 'Altair 8800'],
  /* Act 6 */ ['Intel 8086', 'IBM PC', 'Motorola 68000', 'Protected Mode'],
  /* Act 7 */ ['RISC Architecture', 'Virtual Memory', 'Cache Hierarchy', 'Linux Kernel'],
  /* Act 8 */ ['Instruction Pipeline', 'Branch Prediction', 'Out-of-Order Execution'],
  /* Act 9 */ ['Superscalar Design', 'ARM Architecture', 'Multi-core Processors'],
  /* Act 10 */ ['Quantum Computing', 'Neural Processing', 'Chiplet Architecture'],
];

/**
 * Builds JourneyMapData from act completion state.
 * Pure data builder — reads ActCompletionStorage and maps to JourneyNode array.
 */
export class JourneyMapBuilder {
  private readonly storage: ActCompletionStorage;

  constructor(storage: ActCompletionStorage) {
    this.storage = storage;
  }

  /**
   * Build the journey map data for the current state.
   * @param currentActNumber - The user's current act (0-10)
   * @returns Complete JourneyMapData with all 11 nodes
   */
  build(currentActNumber: number): JourneyMapData {
    const completedActNumbers = new Set(this.storage.getCompletedActNumbers());
    const nodes: JourneyNode[] = [];

    for (let i = 0; i < TOTAL_ACTS; i++) {
      const actId = `act-${i}` as ActCompletionType;
      const metadata = ACT_COMPLETION_METADATA[actId];
      const status = this.resolveStatus(i, currentActNumber, completedActNumbers);

      nodes.push({
        actNumber: i,
        title: metadata.title,
        era: metadata.era,
        icon: metadata.icon,
        cpuStage: ACT_CPU_STAGES[i],
        status,
        keyFigures: ACT_KEY_FIGURES[i],
        keyInventions: ACT_KEY_INVENTIONS[i],
      });
    }

    return {
      nodes,
      totalActs: TOTAL_ACTS,
      completedCount: completedActNumbers.size,
      currentActNumber,
    };
  }

  /**
   * Determine the visual status for an act node.
   */
  private resolveStatus(
    actNumber: number,
    currentActNumber: number,
    completedActNumbers: Set<number>,
  ): JourneyNodeStatus {
    if (completedActNumbers.has(actNumber)) {
      return 'completed';
    }
    if (actNumber === currentActNumber) {
      return 'current';
    }
    if (actNumber === currentActNumber + 1) {
      return 'upcoming';
    }
    return 'locked';
  }
}
