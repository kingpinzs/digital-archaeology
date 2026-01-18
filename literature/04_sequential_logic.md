# Sequential Logic: Circuits That Remember

## Prerequisites

- Logic gates (see [02_logic_gates.md](02_logic_gates.md))
- Combinational logic (see [03_combinational_logic.md](03_combinational_logic.md))

## Learning Objectives

After completing this chapter, you will be able to:

1. Explain the difference between combinational and sequential logic
2. Understand how feedback creates memory
3. Design SR latches and analyze their behavior
4. Implement D latches and D flip-flops
5. Explain edge triggering and why it matters
6. Build registers from flip-flops
7. Design counters (ripple and synchronous)

---

## Introduction

Every circuit we've built so far has been purely combinational: the output depends only on the current inputs. But a computer needs to *remember* things—the current instruction, the contents of registers, the program counter value.

Sequential logic introduces memory through *feedback*—connecting outputs back to inputs. This simple idea is profound: it allows circuits to maintain state, remember the past, and create the foundation for all digital computation.

In this chapter, we'll see how a few wires crossed in the right way can create persistent memory.

---

## Core Concepts

### 1. The Need for Memory

Consider this problem: How do you store a bit?

With combinational logic, as soon as the input changes, the output changes. There's no way to "hold" a value.

**The solution:** Feedback. Connect the output back to the input.

```
Simple feedback creates instability:

        ┌──────────────────┐
        │                  │
   ┌────┴────┐             │
   │   NOT   ├─────────────┘
   └────┬────┘
        │
        ▼
     Output: ???

This oscillates forever! Output drives input which changes output...
```

But with *two* inverters (or appropriate gates), we can create a stable memory cell.

### 2. The SR Latch (Set-Reset Latch)

The SR latch is the simplest memory element. It uses two NOR gates with cross-coupled feedback.

**Circuit Diagram:**

```
          ┌───────────┐
S ────────┤           │
          │    NOR    ├────┬───── Q
     ┌────┤           │    │
     │    └───────────┘    │
     │                     │
     │    ┌───────────┐    │
     │    │           │    │
     └────┤    NOR    ├────┼───── Q' (not Q)
          │           │    │
R ────────┤           │    │
          └───────────┘    │
                 ▲         │
                 │         │
                 └─────────┘
```

**Simplified Symbol:**

```
       ┌────────┐
S ─────┤S     Q ├───── Q
       │        │
       │   SR   │
       │  Latch │
       │        │
R ─────┤R    Q' ├───── Q' (inverted Q)
       └────────┘
```

**How It Works:**

| S | R | Q (next) | Q' (next) | Description |
|---|---|----------|-----------|-------------|
| 0 | 0 | Q | Q' | **Hold** - no change |
| 1 | 0 | 1 | 0 | **Set** - Q becomes 1 |
| 0 | 1 | 0 | 1 | **Reset** - Q becomes 0 |
| 1 | 1 | ? | ? | **Invalid** - forbidden! |

**Tracing the Set Operation (S=1, R=0):**

```
Initial: Q=0, Q'=1

1. S=1 enters top NOR gate
   NOR(1, anything) = 0
   So top NOR output → 0

2. Wait... Q is connected to top NOR output
   But we said Q=1 after Set. What's happening?

Let's trace carefully:
- Top NOR inputs: S=1, Q'=1 → output=0?
  No! We need to trace the feedback...

Actually, let's label the gates clearly:

        ┌───────────┐
S=1 ────┤           │
        │   NOR1    ├─────── Q
   ┌────┤           │         │
   │    └───────────┘         │
   │         (output goes to Q)
   │                          │
   │    ┌───────────┐         │
   │    │           │         │
   └────┤   NOR2    ├─────────┤── Q'
        │           │         │
R=0 ────┤           │         │
        └───────────┘         │
              ▲               │
              │               │
              └───────────────┘

With S=1, R=0:
- NOR1 inputs: S=1, Q'=?
- NOR2 inputs: R=0, Q=?

If S=1, then NOR1 = NOR(1, Q') = 0 regardless of Q'
So Q = 0... wait, that's wrong.

The confusion is in my diagram. Let me redo:

Standard SR latch (NOR-based):
- Q output comes from the gate that R feeds into
- Q' output comes from the gate that S feeds into

     S ───────────────┐
                      │
          ┌──────────┐
   ┌──────┤   NOR    ├──── Q'
   │      └──────────┘
   │            ▲
   │            │
   │            │ (feedback: Q to this NOR)
   │            │
   │      ┌─────┴────┐
   └──────┤   NOR    ├──── Q
          └──────────┘
                      │
     R ───────────────┘

Now with S=1, R=0:
- Top NOR (Q' output): inputs are S=1, Q
  NOR(1, Q) = 0, so Q' = 0

- Bottom NOR (Q output): inputs are R=0, Q'=0
  NOR(0, 0) = 1, so Q = 1

After Set: Q=1, Q'=0 ✓
```

**The Forbidden State (S=1, R=1):**

Both NOR gates output 0, so Q=0 and Q'=0. But Q and Q' should be complements! When S and R return to 0, the final state is unpredictable (depends on race conditions).

**Rule:** Never set S=1 and R=1 simultaneously.

### 3. The Gated SR Latch

Add an enable input to control when the latch can change.

```
       ┌────────┐
S ─────┤        │
       │ Gated  ├───── Q
E ─────┤  SR    │
       │ Latch  │
R ─────┤        ├───── Q'
       └────────┘

When E=0: Latch ignores S and R (holds current state)
When E=1: S and R control the latch normally
```

**Implementation:**

```
S ─────┬─────────┐
       │   AND   ├───────────┐
E ─────┼─────────┘           │
       │                     │
       │           ┌─────────┴─────────┐
       │           │                   │
       │           │    SR Latch       │
       │           │                   │
       │           └─────────┬─────────┘
       │                     │
       │   AND   ┌───────────┘
E ─────┼─────────┤
       │         │
R ─────┴─────────┘
```

### 4. The D Latch (Data Latch)

The D latch solves the forbidden state problem: there's only one data input.

```
       ┌────────┐
D ─────┤D     Q ├───── Q
       │        │
       │ D Latch│
       │        │
E ─────┤E    Q' ├───── Q'
       └────────┘
```

**Built from a Gated SR Latch:**

```
       ┌─────┐
D ──┬──┤ NOT ├────────┐
    │  └─────┘        │
    │                 │
    │        ┌────────┴────────┐
    │        │                 │
    └────────┤S     Gated   Q  ├──── Q
             │      SR         │
E ───────────┤E     Latch      │
             │                 │
         ┌───┤R            Q'  ├──── Q'
         │   └─────────────────┘
         │
         │
D ───────┘ (via NOT)

Since R = NOT D, we can never have S=R=1!
```

**Behavior:**

| E | D | Q (next) | Description |
|---|---|----------|-------------|
| 0 | X | Q | **Hold** - no change |
| 1 | 0 | 0 | **Store 0** |
| 1 | 1 | 1 | **Store 1** |

**Key insight:** When E=1, Q follows D (transparent). When E=0, Q holds its value.

### 5. The Problem with Level Triggering

The D latch is "level-triggered"—it's transparent whenever E=1. This causes problems in synchronous systems:

```
Clock: ____████████____████████____
           E=1         E=1

During E=1, any changes to D immediately affect Q.
If Q is connected back to D through logic,
we get unpredictable multiple updates!
```

**Example problem:**

```
    ┌───────────────────────────┐
    │                           │
    │      ┌────────┐           │
    └──────┤D     Q ├───────────┘
           │        │
CLK ───────┤E    Q' ├
           └────────┘

This is a toggle: Q feeds back through NOT to D.
With level triggering, it oscillates during the entire E=1 period!
```

**Solution:** Edge triggering.

### 6. The D Flip-Flop (Edge-Triggered)

A flip-flop only samples its input at the precise moment the clock changes (the "edge"). The rest of the time, the output is completely stable.

**Types of edges:**
- **Rising edge (positive edge):** Clock transitions from 0 to 1
- **Falling edge (negative edge):** Clock transitions from 1 to 0

**Symbol:**

```
Rising-edge triggered:       Falling-edge triggered:

       ┌────────┐                   ┌────────┐
D ─────┤D     Q ├── Q          D ──┤D     Q ├── Q
       │        │                   │        │
CLK ──>┤>    Q' ├── Q'        CLK ─○┤>    Q' ├── Q'
       └────────┘                   └────────┘

The > indicates edge triggering.
The ○ indicates negative (falling) edge.
```

**Master-Slave Implementation:**

```
       ┌──────────────────────────────────────────┐
       │                                          │
       │  ┌────────┐      ┌────────┐              │
D ─────┼──┤D     Q ├──────┤D     Q ├───────────── Q
       │  │ Master │      │ Slave  │              │
       │  │ (D Lat)│      │ (D Lat)│              │
       │  │        │      │        │              │
       └──┤E    Q' ├──────┤E    Q' ├───────────── Q'
          └────┬───┘      └────┬───┘
               │               │
CLK ───────────┴──○────────────┘
               │               │
            (CLK')           (CLK)

When CLK=0: Master transparent, Slave holds
When CLK=1: Master holds, Slave transparent

Result: Q only updates at the moment CLK goes 0→1
```

**Timing Diagram:**

```
CLK:   ____╱¯¯¯¯¯╲_____╱¯¯¯¯¯╲_____╱¯¯¯¯¯
           ↑           ↑           ↑
           │           │           │
           │           │           │
D:     ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯___________¯¯¯¯¯¯¯
                       │
Q:     _______________¯¯¯¯¯¯¯¯¯¯¯¯_______
                      ↑           ↑
                      │           │
            Q captures D=1   Q captures D=0
            at rising edge   at rising edge
```

### 7. Setup and Hold Times

Real flip-flops need time to reliably capture data:

**Setup time (tsu):** D must be stable BEFORE the clock edge
**Hold time (th):** D must remain stable AFTER the clock edge

```
        ├── tsu ──├── th ──┤
                  │
CLK:  ____________╱¯¯¯¯¯¯¯¯
                  │
D:    ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯
      ├─ D must be ─┤
         stable here
```

If violated: **Metastability**—Q may oscillate or settle to an unpredictable value.

### 8. Registers

A register is a group of flip-flops sharing a common clock, used to store multi-bit values.

**4-bit Register:**

```
       ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
D3 ────┤D     Q ├──┤D     Q ├──┤D     Q ├──┤D     Q ├── Q0
       │   FF3  │  │   FF2  │  │   FF1  │  │   FF0  │
D2 ────│        │  │        │  │        │  │        │── Q1
       │        │  │        │  │        │  │        │
D1 ────│        │  │        │  │        │  │        │── Q2
       │        │  │        │  │        │  │        │
D0 ────┤>       │  ┤>       │  ┤>       │  ┤>       │── Q3
       └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘
            │           │           │           │
CLK ────────┴───────────┴───────────┴───────────┘
```

**With Load Enable:**

Sometimes we don't want to update the register every clock cycle.

```
                    ┌─────────┐
                    │ 2:1 MUX │
D ─────────────────┤1        │
                    │         ├────┤D   FF   Q├──── Q
Q ─────────────────┤0        │     └────┬────┘
                    └────┬────┘          │
                         │               │
LD ──────────────────────┘               │
                                         │
CLK ─────────────────────────────────────┘

When LD=0: FF input = Q (current value) → no change
When LD=1: FF input = D (new value) → load D
```

### 9. Counters

Counters are registers that increment (or decrement) their value.

#### Ripple Counter (Asynchronous)

The simplest counter: each flip-flop's output clocks the next.

**4-bit Ripple Counter:**

```
    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │ Toggle  │    │ Toggle  │    │ Toggle  │    │ Toggle  │
CLK─┤>      Q ├────┤>      Q ├────┤>      Q ├────┤>      Q ├── Q3
    │   FF0   │    │   FF1   │    │   FF2   │    │   FF3   │
    │        Q'│   │        Q'│   │        Q'│   │        Q'│
    └─────────┘    └─────────┘    └─────────┘    └─────────┘
          │              │              │              │
          Q0             Q1             Q2             Q3

Each FF toggles when the previous FF transitions from 1→0.
```

**Toggle Flip-Flop:** A D flip-flop with Q' connected to D.

```
     ┌──────────────┐
     │              │
     │  ┌────────┐  │
     └──┤D     Q ├──┴── Q (toggles each clock)
        │        │
CLK ───>┤>    Q' ├───── Q'
        └────────┘
```

**Counting Sequence:**

```
CLK edges:  0   1   2   3   4   5   6   7   8
Q3Q2Q1Q0: 0000 0001 0010 0011 0100 0101 0110 0111 1000
           0    1    2    3    4    5    6    7   8
```

**Problem:** Ripple delay. Each stage adds delay, so Q3 changes long after Q0. This causes temporary "glitches" during counting.

#### Synchronous Counter

All flip-flops share the same clock. Additional logic determines when each bit should toggle.

**Rule:** Bit n toggles when all lower bits are 1.

```
Q0: Toggle every clock (always)
Q1: Toggle when Q0=1
Q2: Toggle when Q0=1 AND Q1=1
Q3: Toggle when Q0=1 AND Q1=1 AND Q2=1
```

**Implementation:**

```
               ┌──┬───────────────────────────┐
               │  │                           │
    ┌────────┐ │  │  ┌────────┐               │
    │Toggle  │ │  │  │Toggle  │               │
1───┤D     Q ├─┼──┼──┤D     Q ├─── ...       │
    │        │ │  │  │        │               │
CLK┤>    Q' │ │  │  ┤>    Q' │               │
    └────┬───┘ │  │  └────┬───┘               │
         │     │  │       │                   │
        Q0     │  │      Q1                   │
               │  │                           │
          AND──┘  │      AND──────────────────┘
               ↑  │      ↑
               │  │      │
(Toggle Q1     │  └──────┘  (Toggle Q2 when Q0 AND Q1 = 1)
when Q0=1)
```

All bits update simultaneously on the clock edge—no glitches!

---

## Worked Example

**Problem:** Design a 2-bit counter that counts: 0, 1, 2, 3, 0, 1, 2, 3, ...

**Approach:**
1. Two D flip-flops for Q1 and Q0
2. Logic for next state

**State Table:**

```
Current | Next
Q1  Q0  | Q1' Q0'
--------+---------
0   0   | 0   1
0   1   | 1   0
1   0   | 1   1
1   1   | 0   0
```

**Next-State Equations:**

```
Q0' = NOT Q0         (toggles every cycle)
Q1' = Q1 XOR Q0      (toggles when Q0=1)
```

**Circuit:**

```
        ┌───────────────────────────────────┐
        │                                   │
        │    ┌─────┐    ┌────────┐          │
        └────┤ XOR ├────┤D     Q ├──────────┴── Q1
             │     │    │  FF1   │
     ┌───────┤     │    │        │
     │       └─────┘   ┤>    Q' │
     │                  └────┬───┘
     │                       │
     │         ┌────────┐    │
     │    ┌────┤D     Q ├────┼─────────────── Q0
     │    │    │  FF0   │    │
     │    │    │        │    │
     │    │   ┤>    Q' ├────┘
     │    │    └────┬───┘
     │    │         │
     │    └─────────┘ (Q0' → D of FF0)
     │
     └─────────────── (Q0 to XOR input)

CLK ──────────────────┴────────────────────────
```

---

## Try It Yourself

### 1. Visualizer Practice

Open `visualizer/index.html`:

1. **Build an SR Latch:**
   - Use two NOR gates
   - Connect outputs back to inputs (cross-coupled)
   - Add switches for S and R
   - Observe how it remembers!

2. **Test the Forbidden State:**
   - Set S=1, R=1, then release both
   - The final state is random

### 2. HDL Exploration

Examine the HDL files:

- `hdl/04_micro4_cpu.m4hdl` - Look at the DFF (D flip-flop) definitions
- Note the use of `dff` primitives for registers

### 3. Homework Exercises

From `docs/optimization_homework.md`:
- **B5:** Stack pointer is a register
- **F2:** Instruction prefetch needs a register

---

## Common Mistakes

### 1. Forgetting the Clock

Flip-flops need a clock! Without a clock signal, they're just latches (or nothing).

```
Wrong: ┌────────┐
D ─────┤D     Q ├── Q
       │        │
       │   FF   │
       │        │
       └────────┘   ← No clock!

Right: ┌────────┐
D ─────┤D     Q ├── Q
       │        │
CLK ──>┤>       │
       └────────┘
```

### 2. Confusing Latches and Flip-Flops

| | Latch | Flip-Flop |
|-|-------|-----------|
| Trigger | Level (E=1) | Edge (0→1 or 1→0) |
| Behavior | Transparent when enabled | Samples only at edge |
| Use | Simple storage, clock gating | Synchronous design |

### 3. Ignoring Setup/Hold

Data must be stable around the clock edge. Violating timing constraints causes metastability.

```
Bad:        CLK edges here
                ↓
D:      ____╱¯¯¯¯╲____   ← D changes right at clock edge!
CLK:    ____╱¯¯¯¯¯¯¯¯¯

Result: Q might be 0, might be 1, might oscillate!
```

### 4. Ripple Counter Glitches

In a ripple counter, bits don't change simultaneously:

```
Time →
Q0:  ____╱¯¯¯¯╲____╱¯¯¯¯
Q1:  ________╱¯¯¯¯¯¯¯¯¯¯   (delayed from Q0)

During transition 01→10:
  Q1Q0 briefly = 00 before settling to 10!
```

Use synchronous counters for glitch-free operation.

---

## Historical Context

### The Invention of the Flip-Flop

**1918:** William Eccles and F.W. Jordan patented the "trigger circuit"—the first flip-flop. Built from vacuum tubes, it was used for counting in early calculators.

**1947:** The transistor's invention at Bell Labs made flip-flops smaller and more reliable.

**1960s:** TTL (Transistor-Transistor Logic) chips like the 7474 (Dual D Flip-Flop) standardized flip-flop designs.

**Today:** A single CPU contains billions of flip-flops, each one a descendant of Eccles and Jordan's original circuit.

### The Race Condition Problem

Early computers suffered from "race conditions" where signals arrived at slightly different times, causing unpredictable behavior. Edge triggering was the solution.

**Quote from early computer scientist:**
"We quickly learned that asynchronous design was like herding cats. Synchronous design with a global clock tamed the beast."

### Master-Slave Flip-Flops

The master-slave configuration was developed in the 1950s to create reliable edge-triggered behavior. The insight: use *two* latches, with one always holding while the other updates.

---

## Further Reading

### In This Project
- `hdl/04_micro4_cpu.m4hdl` - Register definitions
- `src/micro4/cpu.c` - Emulated register behavior
- `docs/optimization_homework.md` - Register exercises (B1-B7)

### External Resources
- *Sequential Logic* chapters in Digital Design textbooks
- Ben Eater's "8-bit computer" YouTube series - Building registers from 7474 chips
- Nand2Tetris course - Building flip-flops from NAND gates

---

## Summary

| Component | Function | Trigger | Behavior |
|-----------|----------|---------|----------|
| SR Latch | Set/Reset memory | Level | S=1 sets, R=1 resets, forbidden: S=R=1 |
| Gated SR | SR with enable | Level | Only responds when E=1 |
| D Latch | Data storage | Level | Q follows D when E=1 |
| D Flip-Flop | Edge-triggered storage | Edge | Q captures D at clock edge |
| Register | Multi-bit storage | Edge | n flip-flops sharing a clock |
| Counter | Incrementing register | Edge | Counts clock cycles |

**Key Insights:**
- Feedback creates memory—connect output to input
- Latches are transparent when enabled (level-triggered)
- Flip-flops sample only at clock edges (edge-triggered)
- Edge triggering prevents unpredictable multiple updates
- Registers and counters are built from flip-flops

**Next Chapter:** [ALU Design](05_alu_design.md) - Putting it all together for arithmetic
