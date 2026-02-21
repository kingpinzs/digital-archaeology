// src/literature/deepDiveData.ts
// Technical deep-dive content for literature articles
// Story 20.6: Create Technical Deep-Dives

/** A section within a deep-dive */
export interface DeepDiveSection {
  readonly heading: string;
  readonly content: string;
}

/** Complete deep-dive content for an article */
export interface DeepDive {
  readonly articleId: string;
  readonly explanation: string;
  readonly historicalContext: string;
  readonly tradeOffs: string;
  readonly realWorldExamples: string;
}

const DEEP_DIVE_ENTRIES: readonly DeepDive[] = [
  {
    articleId: 'lit-02', // Logic Gates: The Building Blocks
    explanation:
      'Logic gates implement Boolean functions in hardware. Each gate type — AND, OR, NOT, NAND, NOR, XOR — maps a truth table to a physical circuit. At the transistor level, NMOS and PMOS transistors are combined in complementary pairs (CMOS) to create gates that consume near-zero static power. A NAND gate, for instance, uses two series NMOS transistors and two parallel PMOS transistors.',
    historicalContext:
      'Claude Shannon\'s 1937 master\'s thesis "A Symbolic Analysis of Relay and Switching Circuits" was the breakthrough that connected Boolean algebra to electrical circuits. Before Shannon, engineers designed switching circuits by intuition. After Shannon, they had a mathematical framework. Early computers like ENIAC (1945) used vacuum tube gates — each consuming 150 watts. The shift to transistor gates (1950s), then integrated circuit gates (1960s), dropped power per gate by six orders of magnitude.',
    tradeOffs:
      'NAND and NOR gates are "universal" — any Boolean function can be built from just one type. NAND is preferred in practice because NMOS transistors are faster than PMOS (electrons have higher mobility than holes in silicon). Using only NAND gates simplifies manufacturing but can require more gates for some functions. Modern synthesis tools automatically convert designs to a target gate library, balancing area, speed, and power.',
    realWorldExamples:
      'The 74xx TTL series (Texas Instruments, 1960s) defined the gate-level building blocks used for decades: 7400 (quad NAND), 7402 (quad NOR), 7404 (hex inverter). Apple\'s original Wozniak-designed Apple I used 62 chips, mostly from this family. Today, a single modern CPU contains billions of gates, but they\'re all still NAND, NOR, and inverters at the lowest level — just 10,000× smaller.',
  },
  {
    articleId: 'lit-04', // The Arithmetic Logic Unit (ALU)
    explanation:
      'The ALU is the computational core of every processor. It combines an adder circuit (typically a ripple-carry or carry-lookahead adder) with bitwise logic operations, all selected by a function code input. A 4-bit ALU like the 74181 implements 16 arithmetic and 16 logic functions. The key insight: subtraction is just addition with the two\'s complement of the subtrahend, so one adder handles both.',
    historicalContext:
      'The first general-purpose ALU on a single chip was the 74181, designed by Texas Instruments engineer Jerry Keim in 1970. Before this, ALU functions required dozens of separate chips. The 74181 packed all arithmetic and logic operations into a single 24-pin DIP package. It was used in minicomputers like the DEC PDP-11 and Data General Nova. The concept of a single-chip ALU directly inspired the creation of the first microprocessors.',
    tradeOffs:
      'Ripple-carry adders are simple (O(n) gates for n bits) but slow (O(n) propagation delay). Carry-lookahead adders are fast (O(log n) delay) but use O(n log n) gates. Modern ALUs use hybrid approaches: carry-select adders divide the word into blocks, computing both carry-0 and carry-1 results in parallel, then selecting with a multiplexer. The ALU width directly affects die area, power consumption, and clock speed.',
    realWorldExamples:
      'The Intel 8080 (1974) had an 8-bit ALU that could perform 8 arithmetic and 8 logic operations. The Z80 improved on this with a 4-bit ALU that processed 8-bit values in two cycles — trading speed for smaller die size. Modern x86 CPUs have multiple ALUs operating in parallel: Intel\'s Alder Lake has 5 integer ALUs per core. ARM\'s Cortex-A78 has 3 ALU pipelines with different latencies for simple vs. complex operations.',
  },
  {
    articleId: 'lit-07', // Instruction Encoding & Machine Code
    explanation:
      'Instruction encoding is the binary format that maps assembly mnemonics to bit patterns the CPU can decode. Fixed-width encoding (like ARM\'s 32-bit instructions) simplifies fetch and decode logic — the CPU always knows exactly how many bytes to read. Variable-width encoding (like x86\'s 1-15 byte instructions) packs more information per instruction but requires complex, multi-stage decoding. The opcode field identifies the operation; remaining fields specify registers, immediates, and addressing modes.',
    historicalContext:
      'The PDP-11 (1970) pioneered orthogonal instruction encoding — any addressing mode could be used with any instruction, giving a clean, regular encoding. The Intel 8080 and 8086 took the opposite approach with irregular, ad-hoc encoding optimized for specific use cases. RISC emerged in the 1980s (Berkeley RISC, Stanford MIPS) as a reaction: keep encoding simple and regular, even if it means more instructions. The RISC vs. CISC debate defined processor architecture for three decades.',
    tradeOffs:
      'Fixed-width wastes bits when instructions don\'t need all fields (a NOP uses 32 bits just like a complex load). Variable-width maximizes code density but makes parallel decode hard — you can\'t find instruction boundaries without decoding sequentially. Thumb-2 (ARM) and RISC-V\'s compressed extension (RVC) offer a compromise: 16-bit and 32-bit instructions intermixed, with a simple length bit. Code density matters for embedded systems where memory is expensive.',
    realWorldExamples:
      'MIPS R2000 (1985): clean 32-bit fixed encoding with just 3 formats (R, I, J). x86: evolved from 8086\'s 1-6 byte encoding to modern 1-15 bytes with REX prefixes, VEX prefixes, and EVEX prefixes for SIMD. ARM\'s original encoding was 32-bit fixed, but Thumb (16-bit) was added for code density. RISC-V defines a base 32-bit encoding with optional 16-bit compressed instructions — learning from 40 years of encoding design.',
  },
  {
    articleId: 'lit-09', // Memory Architecture: RAM, ROM & Stack
    explanation:
      'Memory in a computer is organized as a hierarchy trading off speed, cost, and capacity. SRAM (6 transistors per bit) is fast but expensive — used for caches. DRAM (1 transistor + 1 capacitor per bit) is dense and cheap — used for main memory but requires periodic refresh. ROM variants (EEPROM, Flash) retain data without power. The stack is a LIFO data structure stored in main memory, managed by hardware (stack pointer register) for subroutine calls, local variables, and interrupt handling.',
    historicalContext:
      'The first magnetic core memory (Jay Forrester, MIT, 1951) gave computers the first reliable random-access read/write memory. Before core memory, delay lines and Williams tubes were unreliable. Core memory dominated from the 1950s to early 1970s, when semiconductor DRAM (Intel 1103, 1970) took over. The 1103 stored 1 kilobit — today\'s DDR5 modules store 64 gigabits per chip. Stack-based computing was formalized by Burroughs (B5000, 1961), which was the first computer designed around a hardware stack.',
    tradeOffs:
      'SRAM vs. DRAM: SRAM is 6× more transistors per bit but doesn\'t need refresh circuitry, giving ~10× faster access. The memory hierarchy exists because we can\'t afford to make all memory fast: 64 KB of SRAM cache costs about the same as 64 GB of DRAM. Stack vs. heap: stack allocation is O(1) (just move the pointer) but limited in size; heap allocation is flexible but requires a memory allocator. Stack overflow is a real danger — most systems default to 1-8 MB stack size.',
    realWorldExamples:
      'The Intel 4004 (1971) had just 640 bytes of RAM. The Apple II (1977) shipped with 4-48 KB. The original IBM PC (1981) had 16-640 KB. Modern systems: L1 cache is 32-64 KB SRAM (1-2 cycle latency), L2 is 256 KB-1 MB (4-10 cycles), L3 is 8-96 MB (20-50 cycles), and main memory is 8-128 GB DRAM (100-200 cycles). The 1000× latency gap between L1 and DRAM is why cache design is so critical.',
  },
  {
    articleId: 'lit-13', // Instruction Pipelining
    explanation:
      'Pipelining breaks instruction execution into stages (Fetch, Decode, Execute, Memory, Write-back) and overlaps them — like an assembly line. While instruction N is executing, N+1 is decoding and N+2 is being fetched. Ideally, this gives throughput of one instruction per cycle despite each instruction taking 5 cycles. Pipeline hazards — data dependencies, control flow changes, and resource conflicts — prevent this ideal and require forwarding, stalling, or prediction.',
    historicalContext:
      'The IBM Stretch (1961) was the first machine to use instruction pipelining, though the concept wasn\'t widely adopted until the CDC 6600 (1964, Seymour Cray). The MIPS R2000 (1985) was designed specifically to make pipelining efficient — its name literally stands for "Microprocessor without Interlocked Pipeline Stages." The 5-stage pipeline became the canonical teaching example. Intel\'s Pentium 4 (2000) pushed to 20 stages for higher clock speeds, but this created so many bubbles that actual performance suffered — a cautionary tale.',
    tradeOffs:
      'More pipeline stages = higher clock frequency (each stage does less work) but more hazard penalties (each mispredicted branch wastes more cycles). The Pentium 4\'s 20-stage "NetBurst" pipeline hit 3.8 GHz but lost to the 14-stage Pentium M at 2.0 GHz in real-world performance. Modern designs converge on 12-19 stages. Deep pipelines also increase power consumption (more pipeline registers, more speculation). ARM\'s Cortex-A53 uses 8 stages for efficiency; Cortex-A77 uses 13 for performance.',
    realWorldExamples:
      'Classic 5-stage pipeline (MIPS R2000): Fetch → Decode → Execute → Memory → Writeback. Intel Core (2006): 14 stages, a return to sanity after NetBurst. Apple M1 (2020): estimated 11-16 stages in the Firestorm performance cores. RISC-V implementations range from 2 stages (PicoRV32, for FPGAs) to 7+ stages (SiFive U74). Each stage adds about 50 picoseconds of pipeline register overhead — at 5 GHz, that\'s 25% of the cycle time.',
  },
  {
    articleId: 'lit-16', // Branch Prediction
    explanation:
      'Branch prediction guesses the outcome of conditional branches before they\'re resolved, keeping the pipeline full. Static prediction (always-taken or always-not-taken) is simple but inaccurate. Dynamic predictors use history: a 1-bit predictor remembers the last outcome; a 2-bit saturating counter needs two consecutive mispredictions to change state. Modern predictors use pattern history tables (PHT) indexed by branch address XORed with global history, achieving 95-99% accuracy.',
    historicalContext:
      'Branch prediction became critical with pipelining. The IBM Stretch (1961) had a rudimentary branch prediction mechanism. The MIPS R2000 (1985) relied on delayed branches — the instruction after a branch always executes, letting the compiler fill the slot. Smith (1981) published the seminal paper on two-bit saturating counters. McFarling (1993) combined local and global history with his "gshare" predictor, which influenced every subsequent design. Today\'s TAGE (TAgged GEometric history length) predictor, invented by Seznec (2006), uses multiple history lengths simultaneously.',
    tradeOffs:
      'Simple predictors (2-bit counter) use ~2 bits per branch but achieve only ~85% accuracy. Complex predictors (TAGE) use ~100 bits per branch but achieve ~96-99% accuracy. At 5 GHz with a 15-stage pipeline, a misprediction wastes ~3 nanoseconds and ~15 micro-ops. With ~20% of instructions being branches, even 1% accuracy improvement saves billions of wasted cycles per second. But predictor tables consume die area and power — a 64 KB branch predictor on a modern CPU is larger than the entire Intel 4004.',
    realWorldExamples:
      'Intel Pentium (1993): simple bimodal predictor, ~80% accuracy. Intel Pentium Pro (1995): two-level adaptive predictor, ~93%. Intel Core (2006): combination of local and global predictors, ~95%. Apple M1 Firestorm (2020): estimated TAGE-like predictor, ~97-99%. AMD Zen 4 (2022): perceptron-based predictor with large history tables. Branch prediction is one of the few areas where proprietary microarchitectural innovations provide meaningful competitive advantage.',
  },
];

/** Map for O(1) lookup by article ID */
const DEEP_DIVES_BY_ARTICLE = new Map<string, DeepDive>(
  DEEP_DIVE_ENTRIES.map(entry => [entry.articleId, entry]),
);

/** All article IDs that have deep-dives */
export const ARTICLES_WITH_DEEP_DIVES: ReadonlySet<string> = new Set(
  DEEP_DIVE_ENTRIES.map(entry => entry.articleId),
);

/**
 * Get the deep-dive for an article, or null if none exists.
 */
export function getDeepDiveForArticle(articleId: string): DeepDive | null {
  return DEEP_DIVES_BY_ARTICLE.get(articleId) ?? null;
}
