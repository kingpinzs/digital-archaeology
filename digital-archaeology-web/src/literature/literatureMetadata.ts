// src/literature/literatureMetadata.ts
// Static article metadata for the 20 educational articles
// Story 20.1: Create Literature Browser

import type { LabStage } from '@ui/StageSelector';
import type { LiteratureArticle, LiteratureCategory, CategoryMetadata } from './types';
import { CATEGORY_ORDER } from './types';

/**
 * All 20 literature articles.
 * Basic (1-6): Foundational concepts for Micro4
 * Intermediate (7-12): Concepts for Micro8/Micro16
 * Advanced (13-20): Concepts for Micro32 and pipeline/superscalar stages
 */
export const LITERATURE_ARTICLES: readonly LiteratureArticle[] = [
  // --- Basic (1-6) ---
  {
    id: 'lit-01',
    title: 'Binary Numbers & Digital Representation',
    category: 'basic',
    description: 'How computers represent numbers using only ones and zeros, and why binary is the natural language of digital circuits.',
    tags: ['binary', 'numbers', 'representation', 'bits', 'bytes'],
    estimatedReadTime: 8,
    relatedStages: ['micro4'],
  },
  {
    id: 'lit-02',
    title: 'Logic Gates: The Building Blocks',
    category: 'basic',
    description: 'AND, OR, NOT, XOR — the fundamental operations that make computation possible, built from simple switches.',
    tags: ['gates', 'logic', 'and', 'or', 'not', 'xor', 'transistors'],
    estimatedReadTime: 10,
    relatedStages: ['micro4'],
  },
  {
    id: 'lit-03',
    title: 'Boolean Algebra & Logic Design',
    category: 'basic',
    description: 'The mathematics behind digital circuits — simplifying logic expressions and designing efficient hardware.',
    tags: ['boolean', 'algebra', 'logic', 'simplification', 'karnaugh'],
    estimatedReadTime: 12,
    relatedStages: ['micro4'],
  },
  {
    id: 'lit-04',
    title: 'The Arithmetic Logic Unit (ALU)',
    category: 'basic',
    description: 'How a CPU performs math and logic — combining adders, comparators, and logic gates into the computational heart of the processor.',
    tags: ['alu', 'arithmetic', 'adder', 'comparator', 'computation'],
    estimatedReadTime: 10,
    relatedStages: ['micro4'],
  },
  {
    id: 'lit-05',
    title: 'Registers, Flip-Flops & State',
    category: 'basic',
    description: 'How computers remember — from a single flip-flop storing one bit to register files holding the CPU\'s working data.',
    tags: ['registers', 'flip-flop', 'state', 'memory', 'latch', 'storage'],
    estimatedReadTime: 9,
    relatedStages: ['micro4'],
  },
  {
    id: 'lit-06',
    title: 'Clock Signals & Timing',
    category: 'basic',
    description: 'The heartbeat of a processor — how clock signals synchronize operations and why frequency matters.',
    tags: ['clock', 'timing', 'frequency', 'synchronization', 'cycle'],
    estimatedReadTime: 7,
    relatedStages: ['micro4'],
  },

  // --- Intermediate (7-12) ---
  {
    id: 'lit-07',
    title: 'Instruction Encoding & Machine Code',
    category: 'intermediate',
    description: 'How human-readable assembly becomes binary instructions the CPU can execute — opcodes, operands, and encoding formats.',
    tags: ['encoding', 'machine code', 'opcode', 'operand', 'instruction format'],
    estimatedReadTime: 12,
    relatedStages: ['micro4', 'micro8'],
  },
  {
    id: 'lit-08',
    title: 'Control Unit Design',
    category: 'intermediate',
    description: 'The brain behind the CPU — how the control unit fetches, decodes, and executes instructions step by step.',
    tags: ['control unit', 'fetch', 'decode', 'execute', 'microcode', 'fsm'],
    estimatedReadTime: 14,
    relatedStages: ['micro4', 'micro8'],
  },
  {
    id: 'lit-09',
    title: 'Memory Architecture: RAM, ROM & Stack',
    category: 'intermediate',
    description: 'The memory hierarchy from fast registers to volatile RAM and persistent ROM, plus how the stack enables subroutines.',
    tags: ['memory', 'ram', 'rom', 'stack', 'hierarchy', 'volatile'],
    estimatedReadTime: 11,
    relatedStages: ['micro8', 'micro16'],
  },
  {
    id: 'lit-10',
    title: 'Subroutines & the Call Stack',
    category: 'intermediate',
    description: 'How programs reuse code through subroutine calls — the call stack, return addresses, and stack frames.',
    tags: ['subroutines', 'call stack', 'return', 'stack frame', 'function call'],
    estimatedReadTime: 10,
    relatedStages: ['micro8'],
  },
  {
    id: 'lit-11',
    title: 'Input/Output & Peripherals',
    category: 'intermediate',
    description: 'How the CPU communicates with the outside world — ports, memory-mapped I/O, interrupts, and device controllers.',
    tags: ['io', 'input', 'output', 'peripherals', 'interrupts', 'ports'],
    estimatedReadTime: 11,
    relatedStages: ['micro8', 'micro16'],
  },
  {
    id: 'lit-12',
    title: 'Addressing Modes & Memory Models',
    category: 'intermediate',
    description: 'Different ways to reference memory — immediate, direct, indirect, indexed — and how segmentation extends address space.',
    tags: ['addressing', 'modes', 'direct', 'indirect', 'indexed', 'segmentation'],
    estimatedReadTime: 13,
    relatedStages: ['micro8', 'micro16'],
  },

  // --- Advanced (13-20) ---
  {
    id: 'lit-13',
    title: 'Instruction Pipelining',
    category: 'advanced',
    description: 'Overlapping instruction execution for throughput — pipeline stages, hazards, stalls, and the performance wall.',
    tags: ['pipeline', 'stages', 'hazards', 'stalls', 'throughput'],
    estimatedReadTime: 15,
    relatedStages: ['micro32', 'micro32p'],
  },
  {
    id: 'lit-14',
    title: 'Cache Memory & Hierarchy',
    category: 'advanced',
    description: 'Bridging the speed gap between CPU and memory — L1/L2/L3 caches, cache lines, hits, misses, and replacement policies.',
    tags: ['cache', 'hierarchy', 'L1', 'L2', 'L3', 'miss', 'hit', 'replacement'],
    estimatedReadTime: 14,
    relatedStages: ['micro32', 'micro32p'],
  },
  {
    id: 'lit-15',
    title: 'Virtual Memory & Paging',
    category: 'advanced',
    description: 'How operating systems give each process its own address space — page tables, TLBs, and memory protection.',
    tags: ['virtual memory', 'paging', 'page table', 'TLB', 'protection', 'address space'],
    estimatedReadTime: 14,
    relatedStages: ['micro32'],
  },
  {
    id: 'lit-16',
    title: 'Branch Prediction',
    category: 'advanced',
    description: 'Guessing the future to keep the pipeline full — static and dynamic prediction, branch target buffers, and misprediction penalties.',
    tags: ['branch prediction', 'speculative', 'BTB', 'misprediction', 'pipeline flush'],
    estimatedReadTime: 12,
    relatedStages: ['micro32p', 'micro32s'],
  },
  {
    id: 'lit-17',
    title: 'Superscalar Execution',
    category: 'advanced',
    description: 'Executing multiple instructions per clock cycle — issue width, functional units, and instruction-level parallelism.',
    tags: ['superscalar', 'ILP', 'issue width', 'functional units', 'parallel'],
    estimatedReadTime: 13,
    relatedStages: ['micro32s'],
  },
  {
    id: 'lit-18',
    title: 'Out-of-Order Execution',
    category: 'advanced',
    description: 'Reordering instructions for maximum throughput — reservation stations, reorder buffers, and precise exceptions.',
    tags: ['out-of-order', 'OoO', 'reservation station', 'reorder buffer', 'ROB'],
    estimatedReadTime: 15,
    relatedStages: ['micro32s'],
  },
  {
    id: 'lit-19',
    title: 'Register Renaming & Hazards',
    category: 'advanced',
    description: 'Eliminating false dependencies — WAR and WAW hazards, physical vs architectural registers, and the rename table.',
    tags: ['register renaming', 'hazards', 'WAR', 'WAW', 'RAW', 'dependencies'],
    estimatedReadTime: 12,
    relatedStages: ['micro32s'],
  },
  {
    id: 'lit-20',
    title: 'Modern Processor Design',
    category: 'advanced',
    description: 'Putting it all together — how modern CPUs combine pipelining, caching, prediction, and superscalar execution into a complete design.',
    tags: ['modern', 'processor', 'design', 'integration', 'architecture', 'performance'],
    estimatedReadTime: 16,
    relatedStages: ['micro32', 'micro32p', 'micro32s'],
  },
];

/**
 * Get articles grouped by category in display order.
 */
export function getArticlesByCategory(): Map<LiteratureCategory, LiteratureArticle[]> {
  const map = new Map<LiteratureCategory, LiteratureArticle[]>();
  for (const category of CATEGORY_ORDER) {
    map.set(category, LITERATURE_ARTICLES.filter(a => a.category === category));
  }
  return map;
}

/**
 * Find an article by its ID.
 */
export function findArticleById(id: string): LiteratureArticle | undefined {
  return LITERATURE_ARTICLES.find(a => a.id === id);
}

/**
 * Rich metadata for each literature category (Story 20.2).
 */
export const CATEGORY_METADATA: Record<LiteratureCategory, CategoryMetadata> = {
  basic: {
    key: 'basic',
    label: 'Basic',
    description: 'Foundational digital concepts — binary numbers, logic gates, ALU, registers, and timing. Essential knowledge for understanding the Micro4 CPU.',
    relatedStages: ['micro4'],
    icon: '\u{1F527}', // 🔧
  },
  intermediate: {
    key: 'intermediate',
    label: 'Intermediate',
    description: 'Instruction encoding, control units, memory architecture, and I/O. The building blocks needed for Micro8 and Micro16 development.',
    relatedStages: ['micro4', 'micro8', 'micro16'],
    icon: '\u{2699}\u{FE0F}', // ⚙️
  },
  advanced: {
    key: 'advanced',
    label: 'Advanced',
    description: 'Pipelining, caching, virtual memory, branch prediction, and superscalar design. Deep knowledge for Micro32 and beyond.',
    relatedStages: ['micro32', 'micro32p', 'micro32s'],
    icon: '\u{1F680}', // 🚀
  },
};

/**
 * Count articles in a given category.
 */
export function getCategoryArticleCount(category: LiteratureCategory): number {
  return LITERATURE_ARTICLES.filter(a => a.category === category).length;
}

/**
 * Sum estimated read time (minutes) for all articles in a category.
 */
export function getCategoryTotalReadTime(category: LiteratureCategory): number {
  return LITERATURE_ARTICLES
    .filter(a => a.category === category)
    .reduce((sum, a) => sum + a.estimatedReadTime, 0);
}

/**
 * Get the union of all relatedStages for articles in a category.
 */
export function getCategoryStages(category: LiteratureCategory): readonly LabStage[] {
  const stageSet = new Set<LabStage>();
  for (const article of LITERATURE_ARTICLES) {
    if (article.category === category) {
      for (const stage of article.relatedStages) {
        stageSet.add(stage);
      }
    }
  }
  return Array.from(stageSet);
}

/**
 * Get articles grouped by category with full category metadata (Story 20.2).
 * Unlike getArticlesByCategory(), this includes CategoryMetadata alongside articles.
 */
export function getArticlesWithMetadata(): Map<LiteratureCategory, { metadata: CategoryMetadata; articles: LiteratureArticle[] }> {
  const map = new Map<LiteratureCategory, { metadata: CategoryMetadata; articles: LiteratureArticle[] }>();
  for (const category of CATEGORY_ORDER) {
    map.set(category, {
      metadata: CATEGORY_METADATA[category],
      articles: LITERATURE_ARTICLES.filter(a => a.category === category),
    });
  }
  return map;
}
