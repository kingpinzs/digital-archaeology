// src/literature/depthLayerData.ts
// Layered depth content for articles — Story 20.13: Depth When You Want It
// Each article can have up to 5 expandable layers beyond the always-visible summary.

/** A reference to an academic paper or primary source */
export interface AcademicReference {
  readonly title: string;
  readonly source: string;
  readonly year?: number;
}

/** A cross-reference to a curated resource */
export interface ResourceLink {
  readonly resourceId: string;
  readonly label: string;
}

/** All depth layers for a single article */
export interface DepthLayers {
  readonly articleId: string;
  /** 1-2 paragraphs expanding on the quick summary */
  readonly coreConcept: string;
  /** Full technical deep-dive (may duplicate deepDiveData — that's fine, they serve different contexts) */
  readonly deepDive?: string;
  /** Academic papers and primary sources */
  readonly academic: readonly AcademicReference[];
  /** Related curated media (documentaries, videos, etc.) */
  readonly media: readonly ResourceLink[];
  /** Related interactive resources (simulators, tools) */
  readonly interactive: readonly ResourceLink[];
}

const DEPTH_LAYERS: ReadonlyMap<string, DepthLayers> = new Map([
  // --- lit-02: Logic Gates: The Building Blocks ---
  ['lit-02', {
    articleId: 'lit-02',
    coreConcept: 'Logic gates are the physical implementation of Boolean algebra. Each gate takes one or two binary inputs and produces one binary output according to a fixed rule. The AND gate outputs 1 only when both inputs are 1. The OR gate outputs 1 when either input is 1. The NOT gate (inverter) flips its single input. From just these three operations, you can build any computation.\n\nThe key insight is universality: NAND gates alone (or NOR gates alone) can implement any Boolean function. This means an entire computer can be built from a single type of gate. In practice, chip designers use libraries of optimized gate combinations, but the theoretical foundation of universal gates is what makes digital computing possible.',
    academic: [
      { title: 'A Symbolic Analysis of Relay and Switching Circuits', source: 'Claude Shannon, MIT Thesis', year: 1937 },
      { title: 'The Mathematical Theory of Communication', source: 'Shannon & Weaver', year: 1949 },
    ],
    media: [
      { resourceId: 'yt-01', label: 'Ben Eater — building logic from gates' },
      { resourceId: 'doc-05', label: 'The Machine That Changed the World' },
    ],
    interactive: [
      { resourceId: 'sim-01', label: 'Nand2Tetris — build from NAND gates' },
      { resourceId: 'sim-04', label: 'Logic.ly — drag-and-drop gate simulator' },
    ],
  }],

  // --- lit-04: The Arithmetic Logic Unit (ALU) ---
  ['lit-04', {
    articleId: 'lit-04',
    coreConcept: 'The ALU is the computational core of every processor. It combines two capabilities: arithmetic (addition, subtraction, sometimes multiplication) and logic (AND, OR, XOR, NOT on entire words). A control signal selects which operation to perform on the inputs.\n\nModern ALUs are far more complex than early designs, but the principle is the same: multiplex between different functional units based on the operation code. The simplest ALU uses a ripple-carry adder for arithmetic and parallel gate arrays for logic operations, with a multiplexer choosing the output.',
    academic: [
      { title: 'Preliminary Discussion of the Logical Design of an Electronic Computing Instrument', source: 'Burks, Goldstine & von Neumann', year: 1946 },
      { title: 'Computer Architecture: A Quantitative Approach', source: 'Hennessy & Patterson', year: 1990 },
    ],
    media: [
      { resourceId: 'yt-01', label: 'Ben Eater — 8-bit ALU on breadboard' },
      { resourceId: 'yt-02', label: 'Computerphile — how ALUs work' },
    ],
    interactive: [
      { resourceId: 'sim-01', label: 'Nand2Tetris — build an ALU from gates' },
      { resourceId: 'sim-03', label: 'Digital — logic circuit simulator' },
    ],
  }],

  // --- lit-07: Instruction Encoding & Machine Code ---
  ['lit-07', {
    articleId: 'lit-07',
    coreConcept: 'Every CPU instruction is encoded as a binary pattern the hardware can decode. The encoding format determines how many bits represent the opcode (what to do), how many identify registers (where data lives), and how many carry immediate values (literal numbers).\n\nThe tension in instruction encoding is between simplicity and density. Fixed-length instructions (like MIPS, ARM) are easy to decode but waste bits. Variable-length instructions (like x86) pack more information but require complex decoders. RISC architectures chose simplicity; CISC chose density. Modern processors often translate complex instructions into simpler micro-operations internally.',
    academic: [
      { title: 'The Case for the Reduced Instruction Set Computer', source: 'Patterson & Ditzel', year: 1980 },
      { title: 'An Introduction to Microcomputers (Volume 1)', source: 'Adam Osborne', year: 1976 },
    ],
    media: [
      { resourceId: 'yt-01', label: 'Ben Eater — instruction encoding explained' },
      { resourceId: 'book-01', label: 'Code by Charles Petzold — building up to machine code' },
    ],
    interactive: [
      { resourceId: 'sim-01', label: 'Nand2Tetris — design your own instruction set' },
      { resourceId: 'sim-02', label: 'Visual 6502 — watch instructions decode at transistor level' },
    ],
  }],

  // --- lit-09: Memory Hierarchy & Addressing ---
  ['lit-09', {
    articleId: 'lit-09',
    coreConcept: 'Computers use a hierarchy of memory types because no single technology is simultaneously fast, large, and cheap. Registers are fastest but hold only a few values. Cache is fast but small. RAM is large but slower. Disk is massive but orders of magnitude slower than RAM.\n\nAddressing modes determine how instructions specify memory locations. Direct addressing uses a literal address. Indirect addressing uses a register containing an address. Indexed addressing adds an offset to a base address. These modes evolved because programs access memory in predictable patterns — sequential access, stack access, and structure field access — and each mode optimizes a different pattern.',
    academic: [
      { title: 'One-Level Storage System', source: 'Kilburn, Edwards, Lanigan & Sumner', year: 1962 },
      { title: 'The Memory Hierarchy', source: 'Hennessy & Patterson, Ch. 5', year: 1990 },
    ],
    media: [
      { resourceId: 'yt-02', label: 'Computerphile — memory hierarchy explained' },
      { resourceId: 'book-03', label: 'Soul of a New Machine — real memory design pressure' },
    ],
    interactive: [
      { resourceId: 'sim-02', label: 'Visual 6502 — watch memory access patterns' },
      { resourceId: 'sim-06', label: 'MAME — experience real memory-constrained systems' },
    ],
  }],

  // --- lit-13: Pipelining: Assembly Line Processing ---
  ['lit-13', {
    articleId: 'lit-13',
    coreConcept: 'Pipelining applies the assembly-line principle to instruction execution. Instead of completing one instruction before starting the next, the CPU overlaps stages: while one instruction is being executed, the next is being decoded, and a third is being fetched from memory.\n\nA classic 5-stage pipeline has: Fetch, Decode, Execute, Memory Access, and Write Back. Each stage takes one clock cycle, so a new instruction can start every cycle even though each takes 5 cycles to complete. The speedup approaches N (the number of stages) but is limited by hazards — situations where one instruction depends on the result of another still in the pipeline.',
    academic: [
      { title: 'The IBM System/360 Model 91: Machine Philosophy and Instruction-Handling', source: 'Anderson, Sparacio & Tomasulo', year: 1967 },
      { title: 'Pipeline Design Considerations', source: 'Hennessy & Patterson, Appendix C', year: 1990 },
    ],
    media: [
      { resourceId: 'yt-08', label: 'Sebastian Lague — visual pipeline animation' },
      { resourceId: 'doc-05', label: 'The Machine That Changed the World — pipeline era' },
    ],
    interactive: [
      { resourceId: 'sim-01', label: 'Nand2Tetris — build toward pipeline concepts' },
      { resourceId: 'sim-03', label: 'Digital — simulate pipeline stages' },
    ],
  }],

  // --- lit-16: Branch Prediction ---
  ['lit-16', {
    articleId: 'lit-16',
    coreConcept: 'Branch prediction is a necessity created by pipelining. When the CPU encounters a conditional branch (like an if-statement), it must decide which instruction to fetch next before knowing the branch outcome. Guessing wrong means flushing the pipeline — throwing away several cycles of partially-completed work.\n\nSimple predictors assume branches are always taken (or not taken). Better predictors track branch history: a 2-bit saturating counter per branch tolerates one misprediction before changing its mind. Modern processors use tournament predictors that combine multiple strategies and learn which predictor works best for each branch.',
    academic: [
      { title: 'Two-Level Adaptive Training Branch Prediction', source: 'Yeh & Patt', year: 1991 },
      { title: 'A Study of Branch Prediction Strategies', source: 'Jim Smith', year: 1981 },
    ],
    media: [
      { resourceId: 'yt-02', label: 'Computerphile — branch prediction explained' },
      { resourceId: 'book-01', label: 'Code by Petzold — processor design tradeoffs' },
    ],
    interactive: [
      { resourceId: 'sim-03', label: 'Digital — simulate branch prediction logic' },
      { resourceId: 'sim-01', label: 'Nand2Tetris — CPU control flow' },
    ],
  }],
]);

/** Set of article IDs that have depth layer content */
export const ARTICLES_WITH_DEPTH_LAYERS: ReadonlySet<string> = new Set(DEPTH_LAYERS.keys());

/** Get depth layers for an article, or null if none exist */
export function getDepthLayersForArticle(articleId: string): DepthLayers | null {
  return DEPTH_LAYERS.get(articleId) ?? null;
}

/** Depth layer names for display and preference tracking */
export type DepthLayerName = 'coreConcept' | 'deepDive' | 'academic' | 'media' | 'interactive';

export const DEPTH_LAYER_LABELS: Record<DepthLayerName, string> = {
  coreConcept: 'Core Concept',
  deepDive: 'Deep Dive',
  academic: 'Academic Sources',
  media: 'Related Media',
  interactive: 'Interactive Resources',
};

export const DEPTH_LAYER_ORDER: readonly DepthLayerName[] = [
  'coreConcept', 'deepDive', 'academic', 'media', 'interactive',
] as const;
