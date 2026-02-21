// src/literature/hintData.ts
// Progressive hint content for literature articles
// Story 20.5: Create Progressive Hint System

/** A set of progressive hints for a single article, ordered vague → specific. */
export interface ProgressiveHint {
  readonly articleId: string;
  readonly hints: readonly string[];
}

/**
 * Progressive hints keyed by article ID.
 * Each entry contains 3-5 hints ordered from vaguest to most specific.
 * Only articles with conceptual challenges have hints.
 */
const HINT_ENTRIES: readonly ProgressiveHint[] = [
  {
    articleId: 'lit-01', // Binary Numbers & Digital Representation
    hints: [
      'Think about how you count on your fingers — but you only have two states per finger.',
      'Each position in a binary number represents a power of 2, just like decimal positions represent powers of 10.',
      'To convert decimal to binary, repeatedly divide by 2 and track the remainders.',
      'The rightmost bit is 2⁰ = 1, next is 2¹ = 2, then 2² = 4, and so on. Add up the positions that are 1.',
    ],
  },
  {
    articleId: 'lit-02', // Logic Gates: The Building Blocks
    hints: [
      'Every complex circuit is built from just a few simple building blocks that combine true/false values.',
      'AND outputs true only when ALL inputs are true. OR outputs true when ANY input is true.',
      'NAND (NOT-AND) is special — you can build every other gate type using only NAND gates.',
      'Try building an XOR gate: it outputs true when inputs DIFFER. Think: (A OR B) AND NOT (A AND B).',
    ],
  },
  {
    articleId: 'lit-03', // Boolean Algebra & Logic Design
    hints: [
      'Boolean algebra has rules similar to normal algebra, but with only two values: 0 and 1.',
      'De Morgan\'s Laws are key: NOT(A AND B) = (NOT A) OR (NOT B), and vice versa.',
      'Simplifying expressions reduces the number of gates needed — fewer gates means faster, cheaper circuits.',
      'Use a Karnaugh map to visualize and simplify expressions with 2-4 variables.',
      'The goal is always to find the minimum number of terms that cover all the 1s in your truth table.',
    ],
  },
  {
    articleId: 'lit-04', // The Arithmetic Logic Unit (ALU)
    hints: [
      'An ALU combines two capabilities: arithmetic (add, subtract) and logic (AND, OR, NOT).',
      'Addition starts with a half adder (two inputs), then chains full adders (three inputs including carry).',
      'Subtraction uses a trick: A - B = A + (NOT B) + 1. This is two\'s complement!',
      'The ALU\'s operation selector is just a multiplexer choosing which result to output.',
    ],
  },
  {
    articleId: 'lit-07', // Instruction Encoding & Machine Code
    hints: [
      'Every instruction your CPU understands is just a pattern of bits — a number with special meaning.',
      'Instructions typically have two parts: an opcode (what to do) and operands (what to do it with).',
      'Fixed-width instructions are simpler to decode but waste bits. Variable-width packs more efficiently.',
      'Think about the trade-off: more opcode bits = more instructions, but fewer bits left for operands.',
      'RISC keeps it simple (fixed, few formats). CISC packs more per instruction (variable, many formats).',
    ],
  },
  {
    articleId: 'lit-09', // Memory Architecture: RAM, ROM & Stack
    hints: [
      'Memory is just a large array of numbered boxes. The number is the address, the contents are the data.',
      'RAM loses data when power is off (volatile). ROM keeps it forever (non-volatile).',
      'A stack is memory with a discipline: last in, first out. Think of a stack of plates.',
      'The stack pointer register tracks the top of the stack. PUSH decrements it, POP increments it.',
    ],
  },
  {
    articleId: 'lit-13', // Instruction Pipelining
    hints: [
      'Pipelining is like a factory assembly line — don\'t wait for one product to finish before starting the next.',
      'A 5-stage pipeline: Fetch → Decode → Execute → Memory → Write-back. Each stage does one thing.',
      'Hazards occur when one instruction depends on the result of a previous one still in the pipeline.',
      'Data forwarding (bypassing) solves many hazards by routing results directly, skipping the write-back stage.',
      'Branch prediction guesses which way a branch will go, keeping the pipeline full instead of stalling.',
    ],
  },
  {
    articleId: 'lit-16', // Branch Prediction
    hints: [
      'Without prediction, the CPU must stall and wait every time it encounters an if/else — very wasteful.',
      'The simplest predictor: assume all branches are taken (loops usually are). This is "always taken."',
      'A 1-bit predictor remembers the last result. A 2-bit predictor needs two wrong guesses to switch.',
      'Modern CPUs use history tables to track patterns. A branch that alternates T-N-T-N can be predicted!',
    ],
  },
];

/** Map for O(1) lookup by article ID */
const HINTS_BY_ARTICLE = new Map<string, ProgressiveHint>(
  HINT_ENTRIES.map(entry => [entry.articleId, entry]),
);

/** All article IDs that have hints */
export const ARTICLES_WITH_HINTS: ReadonlySet<string> = new Set(
  HINT_ENTRIES.map(entry => entry.articleId),
);

/**
 * Get the progressive hints for an article, or null if none exist.
 */
export function getHintsForArticle(articleId: string): ProgressiveHint | null {
  return HINTS_BY_ARTICLE.get(articleId) ?? null;
}

/**
 * Get the total number of hints for an article, or 0 if none exist.
 */
export function getHintCount(articleId: string): number {
  return HINTS_BY_ARTICLE.get(articleId)?.hints.length ?? 0;
}
