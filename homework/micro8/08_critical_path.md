# Exercise 08: Critical Path Analysis

**Difficulty:** ⭐⭐⭐⭐ Expert
**Time:** ~90-120 minutes
**Prerequisites:** All previous Micro8 exercises, understanding of digital logic timing

---

## Goal

Analyze and optimize the critical timing path in the Micro8 CPU. The critical path determines the maximum clock frequency - optimizing it makes the CPU faster.

---

## Background

### What is Critical Path?

The **critical path** is the longest delay through combinational logic between two registers. Since all registers update on the clock edge, the clock period must be long enough for signals to propagate through the slowest path.

```
Register A → [Combinational Logic] → Register B
             └─────────────────────┘
                  Critical Path
                  (must settle before clock edge)
```

**Clock period ≥ Critical path delay + Setup time + Clock skew**

A shorter critical path = higher clock frequency = faster CPU.

### Typical Critical Paths in CPUs

1. **ALU carry chain**: Ripple carry through all bits
2. **Memory access**: Address decode + memory read + data path
3. **Instruction decode**: Opcode to control signals
4. **Address calculation**: HL + displacement computation

---

## Current State in HDL

The Micro8 has several potential critical paths. Let's analyze them.

### Path 1: ALU Carry Chain

For an 8-bit ripple carry adder:

```
; Each bit position:
sum[i] = a[i] XOR b[i] XOR carry[i]
carry[i+1] = (a[i] AND b[i]) OR (carry[i] AND (a[i] XOR b[i]))

; Delay per bit: ~2 gate delays for carry
; Total for 8 bits: ~16 gate delays
```

### Path 2: Instruction Decode

```
IR register → Decode logic → Control signals → ALU/Registers

; IR (8 bits) feeds into massive decoder
; Many AND/OR gates to detect each opcode
; Control signals enable register writes, ALU ops, etc.
```

### Path 3: Memory Read

```
Address register → Memory decode → Cell access → Data to MDR

; For 64KB: 16-bit address decode
; Memory cell access time (technology dependent)
; Data path to CPU
```

### Path 4: Indexed Address Calculation

```
HL (16-bit) + Sign-extended displacement → Effective Address

; Sign extension (trivial)
; 16-bit addition (carry chain!)
; Result to MAR
```

---

## What to Analyze and Optimize

### Step 1: Map the Data Path

Draw the critical paths in your CPU:

```
FETCH path:
  PC → MAR → Memory → MDR → IR
  |    [addr delay]    [read delay]
  └──────────────────────────────────→ Total: ~X gate delays

EXECUTE (ALU) path:
  Register File → ALU inputs → ALU → Register File
  [select delay]    [8-bit carry chain]    [write enable]
  └──────────────────────────────────────→ Total: ~Y gate delays

EXECUTE (Memory) path:
  HL → MAR → Memory → MDR → Register
  [16-bit addr]    [read]    [data mux]
  └──────────────────────────────────→ Total: ~Z gate delays
```

### Step 2: Measure Gate Delays

Assign delay values to logic elements:

| Element | Delay (gate delays) |
|---------|---------------------|
| NOT gate | 1 |
| AND gate (2-input) | 1 |
| OR gate (2-input) | 1 |
| XOR gate | 2 |
| Full adder | 2 (sum) + 2 (carry) |
| 8-bit ripple adder | 16 (carry chain) |
| 2:1 MUX | 2 |
| 4:1 MUX | 3 |
| 8:1 MUX | 4 |
| Memory read | 10-20 (varies) |
| Register read | 2 |
| Register write | (setup time, ~1) |

### Step 3: Identify the Slowest Path

Example analysis:

**ALU ADD path:**
```
1. Register read (src1): 2 GD
2. Register read (src2): 2 GD  (parallel, so max = 2)
3. ALU input mux: 3 GD
4. 8-bit ripple carry: 16 GD
5. Flag generation: 2 GD
6. Register write setup: 1 GD
Total: 2 + 3 + 16 + 2 + 1 = 24 gate delays
```

**Memory Load path:**
```
1. HL concatenation: 0 GD (just wires)
2. MAR load: 1 GD
3. Memory read: 15 GD (example)
4. MDR load: 1 GD
5. Data mux to register: 3 GD
6. Register write setup: 1 GD
Total: 1 + 15 + 1 + 3 + 1 = 21 gate delays
```

Critical path is the ALU at 24 gate delays.

### Step 4: Optimization Techniques

**Technique 1: Carry Lookahead Adder**

Replace ripple carry (16 GD) with carry lookahead (6-8 GD):

```
; Generate and Propagate signals
G[i] = A[i] AND B[i]      ; Generate carry if both 1
P[i] = A[i] XOR B[i]      ; Propagate carry if exactly one 1

; Carry lookahead (4-bit block)
C[1] = G[0] OR (P[0] AND C[0])
C[2] = G[1] OR (P[1] AND G[0]) OR (P[1] AND P[0] AND C[0])
C[3] = G[2] OR (P[2] AND G[1]) OR (P[2] AND P[1] AND G[0]) OR ...
C[4] = ...  ; Group generate/propagate for next block
```

Delay: ~4 GD per 4-bit block, ~8 GD for 8 bits.

**Technique 2: Reduced Decode Logic**

Instead of checking every opcode individually, use ROM-based decode:

```
; Current: Massive AND/OR tree for each instruction
; Improved: 256-entry ROM indexed by opcode
; ROM output = all control signals

; Delay: Address to ROM → ROM access → Output stable
; Often faster than gate forest for complex ISAs
```

**Technique 3: Register Bypass**

If ALU result needed immediately, bypass register file:

```
; Current: ALU → Register → (next clock) → ALU input
; Bypass: ALU → ALU input (through mux)

; Eliminates register read delay for back-to-back operations
```

**Technique 4: Speculative Address Calculation**

Pre-compute PC+1 while fetching:

```
; Current: Fetch → Decode → PC+1 → Fetch
; Improved: PC+1 calculated in parallel with Decode
; Already have PC+1 ready when needed
```

### Step 5: Pipelining Preview

The ultimate optimization: break the critical path across multiple cycles.

```
; Non-pipelined:
Clock 1: Fetch + Decode + Execute + Writeback (25 GD total)
Max freq: 1 / (25 × gate_delay)

; 4-stage pipeline:
Clock 1: Fetch (8 GD)
Clock 2: Decode (5 GD)
Clock 3: Execute (10 GD)
Clock 4: Writeback (2 GD)
Max freq: 1 / (10 × gate_delay)  ; Limited by longest stage

Speedup: 2.5× clock frequency!
```

Pipelining is covered in Micro32-P (Exercise 08 of that stage).

---

## Test Program

Measure cycle counts for different instruction types:

```assembly
; timing_test.asm - Measure instruction timing
; Count cycles for various operations

        .org 0x0200

START:
        LDI16 SP, 0x01FD

        ; ===== Test 1: NOP timing (baseline) =====
        ; 10 NOPs - measure total time
        NOP
        NOP
        NOP
        NOP
        NOP
        NOP
        NOP
        NOP
        NOP
        NOP
        ; Record cycle count here (using simulator)

        ; ===== Test 2: Simple ALU (ADD) =====
        LDI R0, 0x55
        LDI R1, 0x2A
        ADD R0, R1              ; Single ALU op
        ADD R0, R1
        ADD R0, R1
        ADD R0, R1
        ADD R0, R1              ; 5 ADDs

        ; ===== Test 3: Memory load =====
        LDI16 HL, DATA
        LD R0, [HL]             ; Memory read
        LD R1, [HL]
        LD R2, [HL]
        LD R3, [HL]
        LD R4, [HL]             ; 5 loads

        ; ===== Test 4: Indexed load (HL+d) =====
        LDI16 HL, DATA
        LD R0, [HL+0]
        LD R1, [HL+1]
        LD R2, [HL+2]
        LD R3, [HL+3]
        LD R4, [HL+4]           ; 5 indexed loads

        ; ===== Test 5: 16-bit add =====
        LDI16 HL, 0x1234
        LDI16 BC, 0x5678
        ADD16 HL, BC
        ADD16 HL, BC
        ADD16 HL, BC
        ADD16 HL, BC
        ADD16 HL, BC            ; 5 ADD16s

        ; ===== Test 6: CALL/RET overhead =====
        CALL DUMMY_SUB          ; Includes CALL + RET
        CALL DUMMY_SUB
        CALL DUMMY_SUB
        CALL DUMMY_SUB
        CALL DUMMY_SUB          ; 5 calls

        ; ===== Test 7: Interrupt latency =====
        ; Simulate: DI, call ISR, RETI, EI
        DI
        CALL MINI_ISR
        ; RETI enables interrupts, measure this path

        HLT

; Minimal subroutine (just returns)
DUMMY_SUB:
        RET

; Minimal ISR (just returns)
MINI_ISR:
        RETI

; Data section
        .org 0x0500
DATA:   .db 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88
```

**Expected Analysis:**
Run in simulator and count cycles:
- NOP: Baseline, typically 4 cycles (fetch + execute)
- ADD: ~4-5 cycles
- LD [HL]: ~5-6 cycles (extra memory access)
- LD [HL+d]: ~6-7 cycles (fetch displacement + calculate + load)
- ADD16: ~6-8 cycles (two ALU operations)
- CALL: ~8-12 cycles (push + load + jump)
- RET: ~6-8 cycles (pop + jump)

---

## Progressive Hints

<details>
<summary>Hint 1: Finding Gate Delays in HDL</summary>

Count the logic levels in your HDL:

```
; Example: is_add detection
and DEC_ADD (input: upper_0x4 ir3n, output: is_add);

; Trace back:
; ir3n = NOT ir[3]                 ; 1 GD
; upper_0x4 = AND(ir7n, ir[6], ir5n, ir4n)  ; 1 GD (+4 inputs means ~2 GD)
; is_add = AND(upper_0x4, ir3n)    ; 1 GD

; Total: ~3-4 GD for decode
```

Sum up delays from register output to register input.
</details>

<details>
<summary>Hint 2: Carry Lookahead Implementation</summary>

4-bit CLA block:

```
; Generate and Propagate
G0 = A0 & B0
P0 = A0 ^ B0
; ... for all bits

; Carry equations (parallel computation)
C1 = G0 | (P0 & C0)
C2 = G1 | (P1 & G0) | (P1 & P0 & C0)
C3 = G2 | (P2 & G1) | (P2 & P1 & G0) | (P2 & P1 & P0 & C0)
C4 = G3 | (P3 & G2) | ...

; Group generate/propagate for cascading
G_group = G3 | (P3 & G2) | (P3 & P2 & G1) | (P3 & P2 & P1 & G0)
P_group = P3 & P2 & P1 & P0
```

Wire up two 4-bit CLA blocks for 8-bit adder.
</details>

<details>
<summary>Hint 3: Measuring Real Performance</summary>

In simulation, count cycles per instruction type:

```python
# Pseudo-code for cycle analysis
instruction_cycles = {}
for trace_entry in simulation_trace:
    instr = trace_entry.instruction
    cycles = trace_entry.end_cycle - trace_entry.start_cycle
    if instr not in instruction_cycles:
        instruction_cycles[instr] = []
    instruction_cycles[instr].append(cycles)

# Average cycles per instruction type
for instr, cycles_list in instruction_cycles.items():
    avg = sum(cycles_list) / len(cycles_list)
    print(f"{instr}: {avg:.1f} cycles")
```
</details>

<details>
<summary>Hint 4: CPI (Cycles Per Instruction)</summary>

Average CPI depends on instruction mix:

```
CPI_avg = Σ (frequency[i] × CPI[i])

Example program mix:
- 40% ALU (4 cycles each): 0.4 × 4 = 1.6
- 25% Load (6 cycles): 0.25 × 6 = 1.5
- 15% Store (5 cycles): 0.15 × 5 = 0.75
- 10% Branch (taken, 6 cycles): 0.1 × 6 = 0.6
- 10% Branch (not taken, 3 cycles): 0.1 × 3 = 0.3

CPI_avg = 1.6 + 1.5 + 0.75 + 0.6 + 0.3 = 4.75 cycles/instruction
```

Lower CPI = better performance.
</details>

<details>
<summary>Hint 5: Trade-offs in Optimization</summary>

Every optimization has costs:

| Optimization | Benefit | Cost |
|--------------|---------|------|
| Carry lookahead | Faster ALU | More gates, more area |
| ROM decode | Faster decode | ROM size (256 entries) |
| Pipelining | Higher throughput | Control hazards, more registers |
| Bypass paths | Fewer stalls | Mux delay, complexity |

Choose optimizations based on:
- Frequency of affected operations
- Available die area
- Power budget
- Design complexity
</details>

---

## Literature References

- **Patterson & Hennessy, "Computer Organization and Design"**: Performance chapters
- **"Digital Design and Computer Architecture"** by Harris & Harris: Timing analysis
- **Hennessy & Patterson, "Computer Architecture: A Quantitative Approach"**: Advanced performance optimization
- **"CMOS VLSI Design"** by Weste & Harris: Gate-level timing

---

## Expected Outcome

When complete, you should be able to:

1. Identify critical paths in CPU design
2. Calculate gate delays through combinational logic
3. Implement faster adders (carry lookahead)
4. Measure CPI for different instruction types
5. Understand trade-offs in performance optimization

---

## Verification Checklist

- [ ] Data path diagram with delay annotations
- [ ] Critical path identified and measured
- [ ] CPI measured for: NOP, ALU, Load, Store, Branch, CALL/RET
- [ ] At least one optimization implemented (e.g., faster adder)
- [ ] Performance improvement quantified
- [ ] Trade-offs documented

---

## Analysis Template

Use this format to document your analysis:

```markdown
# Micro8 Critical Path Analysis

## 1. Data Path Diagram
[Include annotated diagram]

## 2. Critical Path Identification
Path: [description]
Total delay: [X gate delays]

## 3. Cycle Counts (Before Optimization)
| Instruction | Cycles | Notes |
|-------------|--------|-------|
| NOP         | 4      | Baseline |
| ADD         | 5      | ALU limited |
| LD [HL]     | 6      | Memory limited |
| ...         | ...    | ... |

## 4. Optimization Applied
Description: [e.g., Carry lookahead adder]
Before: [X gate delays]
After: [Y gate delays]
Improvement: [Z%]

## 5. Cycle Counts (After Optimization)
[Updated table]

## 6. Conclusion
[Overall performance improvement, trade-offs]
```

---

## Challenge Extensions

1. **Full CLA**: Implement 16-bit carry lookahead for ADD16
2. **Microcode ROM**: Replace gate-based decoder with ROM
3. **Pipeline planning**: Design 2-stage pipeline for fetch/execute overlap
4. **Power analysis**: Estimate switching activity and power consumption

---

## Congratulations!

You've completed all 8 Micro8 optimization exercises! You now understand:
- Register pairs and 16-bit operations
- Stack and subroutines
- Interrupt handling
- Advanced addressing modes
- Performance optimization

Next: Move to **Micro16** or **Micro32** for more advanced CPU features!
