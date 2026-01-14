# Historical Path to the 4004: Build Your Way Through Computing History

## Introduction

This document contains a series of hands-on homework assignments that trace the evolution of computing from mechanical switches to the Intel 4004. Each assignment builds on the previous one, helping you understand not just *what* was invented, but *why* each step was necessary.

**Philosophy**: You cannot truly understand the 4004 without understanding the problems it solved. Each technological jump happened because the previous technology hit a wall.

---

## Era 0: Before Electronics (1800s-1930s)
### Understanding Why We Need Automatic Computation

### Homework 0.1: Babbage's Problem
**Background**: Charles Babbage noticed that mathematical tables (used for navigation, astronomy, engineering) were full of errors because humans made mistakes when computing them.

**Assignment**:
1. Manually compute the first 20 values of the polynomial: `f(x) = x² + 2x + 1`
2. Time yourself and count your errors
3. Now compute: `f(x) = x³ - 3x² + 2x - 7` for x = 1 to 50
4. Document: Why is human computation slow and error-prone?

**Key Insight**: This is why Babbage wanted a machine to compute - humans are slow and make errors.

---

### Homework 0.2: The Method of Differences
**Background**: Babbage realized polynomials can be computed using only addition by using "differences."

**Assignment**:
1. For `f(x) = x²`:
   - Compute f(0), f(1), f(2), f(3), f(4), f(5)
   - Compute first differences: f(1)-f(0), f(2)-f(1), etc.
   - Compute second differences
   - Notice the pattern!

2. Design (on paper) a mechanism that could:
   - Store three numbers
   - Add them in sequence
   - This is the Difference Engine concept

**Key Insight**: Complex computations can be reduced to simple additions. This is why Babbage thought a machine was feasible.

---

### Homework 0.3: Boolean Algebra (1854)
**Background**: George Boole showed that logic could be expressed mathematically.

**Assignment**:
1. Prove these Boolean identities by trying all input combinations:
   - `A AND (B OR C) = (A AND B) OR (A AND C)`
   - `NOT(A AND B) = (NOT A) OR (NOT B)` (De Morgan)
   - `A XOR B = (A AND NOT B) OR (NOT A AND B)`

2. Express in Boolean algebra:
   - "The alarm sounds if the door is open AND the system is armed"
   - "The light turns on if switch A OR switch B is pressed"

**Key Insight**: Logic can be computed! If we can build AND, OR, NOT, we can compute anything logical.

---

## Era 1: Electromechanical Computing (1930s-1940s)
### Relays: The First Electronic Switches

### Homework 1.1: Understanding Relays
**Background**: A relay is an electrically-controlled switch. When current flows through a coil, it creates a magnetic field that moves a metal contact.

**Assignment**:
1. Draw a relay with:
   - Input coil (control)
   - Normally-open (NO) contact
   - Normally-closed (NC) contact

2. Build these circuits (conceptually or with actual relays):
   ```
   NOT gate: Use NC contact
   Input ----[COIL]
                    NC----Output
   When input=0, NC is closed, output=1
   When input=1, NC opens, output=0
   ```

3. Build AND gate with two relays in series
4. Build OR gate with two relays in parallel

**Materials**: If you have actual relays (5V Arduino relays work), build these!

---

### Homework 1.2: The Zuse Z3 (1941) - First Programmable Computer
**Background**: Konrad Zuse built the first working programmable computer using 2,600 relays.

**Assignment**:
1. Calculate: If each relay:
   - Weighs 50 grams
   - Consumes 0.5 watts
   - Switches in 10 milliseconds
   - Costs $1 (1941 dollars)

   What are the total weight, power, speed, and cost of 2,600 relays?

2. The Z3 could do one multiplication in 3 seconds. Why so slow?
   (Hint: How many relay switches for a multiply?)

3. Design a 1-bit register using relays (hint: use feedback)

**Key Insight**: Relays work but are slow, heavy, and power-hungry. We need something better.

---

### Homework 1.3: Relay Computer Problems
**Assignment**:
1. Relays have moving parts. Research:
   - What is "contact bounce"?
   - What is relay "sticking"?
   - What is the MTBF (Mean Time Between Failures)?

2. If you have 2,600 relays each with MTBF of 10,000 hours:
   - What's the expected time before ANY relay fails?
   - (Hint: 1/total_MTBF = sum of 1/individual_MTBF)

3. Document why mechanical switches are unreliable for computing

**Key Insight**: Moving parts wear out. We need switches with no moving parts.

---

## Era 2: Vacuum Tubes (1940s-1950s)
### The First Electronic Switches

### Homework 2.1: How Vacuum Tubes Work
**Background**: A vacuum tube (valve) controls electron flow using electric fields, with no moving parts.

**Assignment**:
1. Research the triode vacuum tube:
   - Cathode (heated, emits electrons)
   - Grid (controls electron flow)
   - Plate/Anode (collects electrons)

2. Draw the triode symbol and label parts

3. Explain how a triode acts as a switch:
   - Negative grid voltage = OFF (electrons repelled)
   - Zero/positive grid voltage = ON (electrons flow)

4. Compare to relay:
   | Property | Relay | Vacuum Tube |
   |----------|-------|-------------|
   | Moving parts | Yes | No |
   | Speed | ~10ms | ~1μs |
   | Power | ~0.5W | ~5W |
   | Size | Large | Medium |
   | Heat | Low | HIGH |

---

### Homework 2.2: Building Gates with Tubes
**Assignment**:
1. Design a NOT gate using one triode:
   ```
   +V ----[Resistor]----+---- Output
                        |
                     [Plate]
                      [Grid]---- Input
                    [Cathode]
                        |
                       GND
   ```
   Explain: When input is high, tube conducts, output goes low

2. Design an AND gate using two triodes
   (Hint: Put tubes in series)

3. Design an OR gate using two triodes
   (Hint: Put tubes in parallel)

4. Calculate: ENIAC used 18,000 vacuum tubes at 150W each.
   - Total power consumption?
   - Heat generated? (Almost all power becomes heat)
   - Why did ENIAC need air conditioning?

---

### Homework 2.3: ENIAC Deep Dive (1945)
**Background**: ENIAC was the first general-purpose electronic computer.

**Assignment**:
1. Research ENIAC specifications:
   - Number of tubes: 18,000
   - Power: 150 kW
   - Weight: 30 tons
   - Floor space: 1,800 sq ft
   - Speed: 5,000 additions/second

2. ENIAC had a MTBF of about 6 hours (one tube failed every 6 hours on average). With 18,000 tubes and 10,000 hour individual MTBF:
   - Verify this calculation
   - How did they debug tube failures?

3. Programming ENIAC required physically rewiring it. Why was this necessary with tube technology?

**Key Insight**: Vacuum tubes are fast but hot, power-hungry, and unreliable. We need something better.

---

### Homework 2.4: Build a Tube-Era Logic Unit
**Assignment**:
Using your simulator, create `hdl/history/tube_era.m4hdl`:
1. Implement a tube-style inverter (same as NOT, but think about it as a tube)
2. Implement a 2-input NAND using tube topology
3. Build a 1-bit half adder

Why NAND? In tube circuits, NAND is the "natural" gate (just like NAND is natural in CMOS).

---

## Era 3: The Transistor Revolution (1947-1960)
### Solid-State Switches

### Homework 3.1: The Point-Contact Transistor (1947)
**Background**: Bardeen, Brattain, and Shockley at Bell Labs invented the transistor.

**Assignment**:
1. Research: Why was Bell Labs working on this?
   (Hint: Phone switching networks used relays)

2. The first transistor was a "point-contact" transistor:
   - Draw its structure
   - Why was it unreliable?
   - Why was it still revolutionary?

3. Compare first transistor to vacuum tube:
   | Property | Vacuum Tube | Transistor |
   |----------|-------------|------------|
   | Size | ~5cm | ~1cm |
   | Power | ~5W | ~0.1W |
   | Speed | ~1μs | ~0.1μs |
   | Voltage | ~100V | ~5V |
   | Lifespan | ~10,000 hrs | ~100,000 hrs |

---

### Homework 3.2: The Junction Transistor (1951)
**Background**: Shockley invented the more reliable junction transistor.

**Assignment**:
1. Research NPN transistor structure:
   - Draw the NPN layers
   - Label: Emitter, Base, Collector
   - Explain how current flows

2. Draw the transistor symbol

3. Explain transistor as switch:
   - Base-Emitter junction is like a diode
   - Small base current allows large collector current
   - This is AMPLIFICATION (key insight!)

4. Why is amplification important for logic?
   (Hint: Signal degradation through many gates)

---

### Homework 3.3: Resistor-Transistor Logic (RTL)
**Background**: First transistor logic family (1950s).

**Assignment**:
1. Design RTL NOR gate:
   ```
        +Vcc
          |
         [R]
          |-------- Output
          |
   A---[R]--[B]
             |
            [E]
             |
            GND

   (Multiple transistors in parallel)
   ```

2. Build in simulator: `hdl/history/rtl_gates.m4hdl`
   - RTL inverter
   - RTL NOR gate (2-input)
   - RTL NAND gate (hint: series transistors)

3. RTL Problems:
   - What happens when you chain many RTL gates?
   - Why does signal level degrade?
   - What is "fan-out" and why is it limited in RTL?

---

### Homework 3.4: First Transistor Computer - TRADIC (1954)
**Background**: Bell Labs built TRADIC, the first fully transistorized computer.

**Assignment**:
1. Research TRADIC:
   - Number of transistors: ~800
   - Power: ~100W
   - Size: Small enough for aircraft!

2. Compare to ENIAC:
   | | ENIAC | TRADIC |
   |---|-------|--------|
   | Switches | 18,000 tubes | 800 transistors |
   | Power | 150,000W | 100W |
   | Size | 1,800 sq ft | Airborne-capable |
   | Reliability | 6hr MTBF | Much better |

3. Why were transistors a military priority?
   (Hint: Missiles, aircraft, submarines)

**Key Insight**: Transistors made portable electronics possible for the first time.

---

## Era 4: Integrated Circuits (1958-1965)
### Putting Multiple Components on One Chip

### Homework 4.1: The Integration Problem
**Background**: By late 1950s, transistors were cheap, but WIRING them together was expensive and unreliable.

**Assignment**:
1. "Tyranny of Numbers" - Research this term:
   - If a computer needs 100,000 transistors
   - Each transistor has 3 wires
   - How many solder joints? (300,000+)
   - If each joint has 0.001% failure rate, what's system reliability?

2. Calculate wiring cost:
   - If hand-soldering one wire takes 10 seconds
   - And costs $0.10 in labor
   - What's the cost to wire 100,000 transistors?

3. Document: Why did individual transistors hit a wall?

**Key Insight**: The problem wasn't making transistors - it was connecting them!

---

### Homework 4.2: The Integrated Circuit (1958-1959)
**Background**: Jack Kilby (TI) and Robert Noyce (Fairchild) independently invented the IC.

**Assignment**:
1. Kilby's approach (September 1958):
   - Put transistors, resistors, capacitors on ONE piece of germanium
   - Still used wire bonds between components
   - Why was this already a breakthrough?

2. Noyce's approach (1959):
   - Used planar process
   - Metal interconnects ON the chip
   - Why was this better than Kilby's?

3. Draw a simple IC cross-section showing:
   - Silicon substrate
   - Diffused regions (transistors)
   - Oxide layer
   - Metal interconnects

---

### Homework 4.3: Diode-Transistor Logic (DTL)
**Background**: DTL improved on RTL with better noise margins.

**Assignment**:
1. Study DTL NAND gate:
   ```
        +Vcc
          |
         [R1]
          |
   A-----|>|---+
               |
   B-----|>|---+---[R2]---[Base]---[Collector]---Output
               |           |
             [Diode]     [Emitter]
               |           |
              GND         GND
   ```

2. Why add diodes at the input?
   - Hint: Level shifting, noise immunity

3. Build DTL gates in simulator: `hdl/history/dtl_gates.m4hdl`

4. Compare RTL vs DTL:
   | Property | RTL | DTL |
   |----------|-----|-----|
   | Fan-out | ~3 | ~8 |
   | Noise margin | Poor | Better |
   | Speed | Slow | Medium |
   | Power | High | Medium |

---

### Homework 4.4: Transistor-Transistor Logic (TTL) - 1963
**Background**: TTL became the dominant logic family, used in the famous 7400 series.

**Assignment**:
1. Study TTL NAND gate (multi-emitter input transistor):
   ```
   The key innovation: Multi-emitter transistor replaces input diodes
   ```

2. Research the 7400 series:
   - 7400: Quad 2-input NAND
   - 7402: Quad 2-input NOR
   - 7404: Hex inverter
   - 7408: Quad 2-input AND
   - 7432: Quad 2-input OR
   - 7486: Quad 2-input XOR

3. Build a 4-bit adder using ONLY 7400-series chips:
   - List which chips you need
   - How many total chips?
   - How many ICs for the full 4004?

4. Create `hdl/history/ttl_gates.m4hdl` with TTL-style implementations

**Key Insight**: TTL became a STANDARD. Different manufacturers made compatible chips.

---

### Homework 4.5: Build a 7400-Series Computer
**Assignment**:
1. Design a 1-bit ALU using 7400-series chips:
   - Operations: AND, OR, XOR, ADD
   - List all chips needed

2. Design an 8-bit register using 7474 (D flip-flops)

3. Calculate for an 8-bit computer:
   - 8-bit ALU: ~20 chips
   - 8 registers: ~16 chips
   - Control logic: ~50 chips
   - Total: ~100+ chips!

4. Research: How big was a 7400-based computer?
   (Look up "wire-wrap" construction)

**Key Insight**: Even with ICs, a computer needed 100+ chips. What if we put it all on ONE chip?

---

## Era 5: MOS Technology (1960s)
### The Path to Microprocessors

### Homework 5.1: MOS vs Bipolar
**Background**: TTL uses bipolar transistors. MOS (Metal-Oxide-Semiconductor) is different.

**Assignment**:
1. Research MOSFET structure:
   - Gate, Source, Drain
   - How the channel forms
   - NMOS vs PMOS

2. Draw NMOS transistor cross-section:
   ```
         Gate
          |
    Metal-Oxide-Metal
          |
   n+ ---[channel]--- n+
      Source     Drain
          |
        p-substrate
   ```

3. Compare:
   | Property | Bipolar (TTL) | MOS |
   |----------|---------------|-----|
   | Speed | Fast | Slower |
   | Power | High | LOW |
   | Density | Medium | HIGH |
   | Ease of fab | Complex | Simpler |

4. Why was MOS better for high-integration chips?

---

### Homework 5.2: PMOS Logic
**Background**: Early MOS chips used PMOS (slower but easier to manufacture).

**Assignment**:
1. PMOS inverter:
   ```
   Vdd (negative!)
     |
    [PMOS load]
     |----Output
    [PMOS driver]
     |
    Input---Gate
     |
    GND
   ```

2. Why did early MOS use negative voltages?
   (Hint: PMOS threshold voltage, contamination issues)

3. The 4004 was PMOS. Research:
   - Supply voltage: -15V
   - Clock frequency: 740 kHz
   - Why so slow compared to TTL?

---

### Homework 5.3: NMOS Logic
**Background**: NMOS was faster than PMOS but came later (1970s).

**Assignment**:
1. NMOS inverter with depletion load:
   ```
   Vdd (+5V)
     |
    [Depletion NMOS] (always somewhat on)
     |----Output
    [Enhancement NMOS] (controlled by input)
     |
    Input---Gate
     |
    GND
   ```

2. Why is NMOS faster than PMOS?
   (Hint: Electron mobility > hole mobility)

3. The 8080 was NMOS. Compare to 4004:
   | | 4004 (PMOS) | 8080 (NMOS) |
   |---|-------------|-------------|
   | Voltage | -15V | +5V |
   | Clock | 740 kHz | 2 MHz |
   | Transistors | 2,300 | 4,500 |

---

### Homework 5.4: CMOS - The Future
**Background**: CMOS uses both NMOS and PMOS for minimal power.

**Assignment**:
1. CMOS inverter:
   ```
   Vdd
     |
    [PMOS]---Gate---Input
     |
     +----Output
     |
    [NMOS]---Gate---Input
     |
    GND
   ```

2. Why does CMOS use almost zero static power?
   (Hint: One transistor always off)

3. Build CMOS gates in simulator: `hdl/history/cmos_gates.m4hdl`
   - CMOS inverter
   - CMOS NAND
   - CMOS NOR

4. CMOS wasn't used for CPUs until later. Why?
   (Hint: Manufacturing complexity, speed)

---

## Era 6: The Calculator Wars (1965-1971)
### The Direct Predecessor to the 4004

### Homework 6.1: Desktop Calculators
**Background**: In 1965, desktop calculators were big business and used hundreds of ICs.

**Assignment**:
1. Research early electronic calculators:
   - Friden EC-130 (1964): First all-transistor desktop
   - Sharp Compet (1964): Used TTL
   - Size: Desk-sized
   - Cost: $2,000-$5,000

2. A typical calculator needed:
   - 10-20 IC chips for logic
   - Hundreds of discrete components
   - Why was this expensive?

3. What operations does a calculator need?
   - Add, Subtract, Multiply, Divide
   - Display control
   - Keyboard input

---

### Homework 6.2: Calculator Chip Sets
**Background**: Companies started making "calculator chip sets" - multiple ICs designed to work together.

**Assignment**:
1. Research Texas Instruments calculator chips (1967):
   - TMS1802: One of first calculator chips
   - Required multiple chips for full calculator

2. Design exercise: What functions would you put on separate chips?
   - Arithmetic unit
   - Register storage
   - Display driver
   - Keyboard scanner

3. Why not put everything on ONE chip?
   - Technology limitation (transistor count)
   - Yield issues (bigger chip = more defects)
   - Design complexity

---

### Homework 6.3: Busicom and the 4004 Story
**Background**: Japanese company Busicom wanted a calculator chip set from Intel.

**Assignment**:
1. Research the Busicom 141-PF calculator:
   - Original design: 12 custom chips
   - Each chip specialized for one function
   - Intel's contract: Make these 12 chips

2. Ted Hoff's insight:
   - Instead of 12 specialized chips
   - Make ONE general-purpose processor
   - Program it to be a calculator

   Why was this revolutionary?

3. The 4004 chip set:
   - 4001: ROM (program storage)
   - 4002: RAM (data storage)
   - 4003: Shift register (I/O)
   - 4004: CPU (the processor)

   How is this different from 12 specialized chips?

**Key Insight**: A general-purpose processor can be REPROGRAMMED for different tasks!

---

### Homework 6.4: Why 4 Bits?
**Assignment**:
1. BCD (Binary Coded Decimal):
   - Each decimal digit (0-9) stored in 4 bits
   - Why is this useful for calculators?
   - What's wasted? (4 bits can hold 0-15)

2. Calculator precision:
   - 12-digit display = 12 BCD digits = 48 bits
   - 4004 processes 4 bits at a time
   - How many cycles to process all 12 digits?

3. Why not 8 bits?
   - More transistors needed
   - Larger pins needed (remember the DIP package!)
   - 4 bits was "enough" for calculators

---

## Era 7: The 4004 Itself (1971)
### Building the Microprocessor

### Homework 7.1: 4004 Architecture Analysis
**Assignment**:
1. Study the 4004 architecture:
   - 4-bit data bus
   - 12-bit address bus (for 4K addresses)
   - 16 4-bit registers (organized as 8 pairs)
   - 46 instructions
   - 3-level stack (hardwired, not in RAM)

2. Compare to your Micro4:
   | Feature | 4004 | Micro4 |
   |---------|------|--------|
   | Data width | 4-bit | 4-bit |
   | Address width | 12-bit | 8-bit |
   | Registers | 16 | 1 (ACC) |
   | Instructions | 46 | 8 |
   | Stack | 3-level | None |

3. What features could you add to Micro4 to approach 4004?

---

### Homework 7.2: 4004 Instruction Set
**Assignment**:
1. Study key 4004 instructions:
   ```
   NOP       - No operation
   JCN       - Jump conditional
   FIM       - Fetch immediate (load register pair)
   FIN       - Fetch indirect
   JIN       - Jump indirect
   JUN       - Jump unconditional
   JMS       - Jump to subroutine
   INC       - Increment register
   ADD       - Add register to accumulator
   SUB       - Subtract register from accumulator
   LD        - Load accumulator from register
   XCH       - Exchange accumulator and register
   BBL       - Branch back and load (return from subroutine)
   ```

2. Implement 4 new instructions in Micro4:
   - INC: Increment accumulator
   - DEC: Decrement accumulator
   - AND: AND accumulator with memory
   - OR: OR accumulator with memory

3. What would you need to add subroutine support?

---

### Homework 7.3: 4004 Transistor-Level
**Assignment**:
1. The 4004 had 2,300 transistors. Break down:
   - ALU: ~500 transistors
   - Registers: ~800 transistors
   - Control: ~700 transistors
   - I/O and misc: ~300 transistors

2. Your task: Estimate transistors for Micro4:
   - Count gates in your HDL files
   - Multiply by transistors per gate
   - Compare to 4004

3. Create `hdl/05_micro4_complete.m4hdl`:
   - Add 4 more instructions (INC, DEC, AND, OR)
   - Add a second register (B register)
   - Implement JNZ (jump if not zero)

---

### Homework 7.4: 4004 Timing
**Assignment**:
1. 4004 clock: 740 kHz (8-phase clock)
   - Each instruction takes 8 or 16 clock cycles
   - Calculate: Instructions per second?

2. Two-phase vs multi-phase clocks:
   - Why did 4004 use 8 phases?
   - How does this simplify design?
   - What are the tradeoffs?

3. Implement a 2-phase clock in your simulator:
   - Phase 1: Fetch
   - Phase 2: Execute
   - Test with simple program

---

## Era 8: Beyond the 4004
### What Came Next

### Homework 8.1: 8008 (1972)
**Assignment**:
1. Research the 8008:
   - 8-bit data bus
   - 14-bit address (16KB)
   - 3,500 transistors
   - Still PMOS

2. Why 8 bits?
   - ASCII characters are 7-8 bits
   - Business data processing needs more than BCD
   - Memory addressing benefits from wider bus

3. Upgrade path: How would you convert Micro4 to 8-bit?

---

### Homework 8.2: 8080 (1974)
**Assignment**:
1. The 8080 was the first "real" microprocessor for computers:
   - NMOS (faster than PMOS)
   - 6,000 transistors
   - 2 MHz clock
   - 64KB address space

2. The 8080 influenced everything after:
   - Z80 was an enhanced 8080
   - 8086 was 8080 compatible
   - x86 evolved from 8086
   - Your PC runs 8080-descended code!

3. Research: What made the 8080 successful?

---

## Final Project: Build a 4004-Class CPU

### Requirements:
1. 4-bit data path
2. At least 12 instructions:
   - NOP, HLT
   - LDA, STA (load/store)
   - ADD, SUB, AND, OR, XOR
   - JMP, JZ, JNZ
3. At least 4 registers
4. Subroutine support (JSR, RET)
5. Full implementation in HDL
6. Working visualizer display
7. Test program that demonstrates all features

### Deliverables:
1. `hdl/final/micro4_complete.m4hdl` - Full HDL implementation
2. `programs/final/test_all.asm` - Comprehensive test program
3. `docs/final_architecture.md` - Architecture documentation
4. `docs/final_transistor_count.md` - Transistor analysis
5. Working visualization showing data flow

### Grading Rubric:
- [ ] All 12+ instructions working
- [ ] Subroutines work correctly
- [ ] Test program runs without errors
- [ ] HDL is well-commented
- [ ] Visualizer shows correct operation
- [ ] Transistor count documented and analyzed
- [ ] Can explain every design decision

---

## Appendix: Timeline Summary

| Year | Event | Switches | Power | Speed |
|------|-------|----------|-------|-------|
| 1941 | Zuse Z3 | 2,600 relays | High | 1 Hz |
| 1945 | ENIAC | 18,000 tubes | 150kW | 5 kHz |
| 1954 | TRADIC | 800 transistors | 100W | 10 kHz |
| 1958 | First IC | Few transistors | <1W | 100 kHz |
| 1963 | TTL 7400 | 4 gates/chip | mW | 1 MHz |
| 1971 | Intel 4004 | 2,300 transistors | <1W | 740 kHz |
| 1974 | Intel 8080 | 6,000 transistors | ~1W | 2 MHz |

**The pattern**: Each generation solves the previous generation's main problem:
- Relays → Tubes: No moving parts
- Tubes → Transistors: Less power, heat, size
- Discrete → ICs: Fewer connections
- Many ICs → Microprocessor: One chip does everything

---

## Reading List

1. "The First Microprocessor" - Intel Museum
2. "Revolution in Miniature: The History and Impact of Semiconductor Electronics"
3. "The Chip" by T.R. Reid
4. "Intel 4004 Datasheet" (original 1971 document)
5. "Oral History of Ted Hoff" - Computer History Museum

---

*Complete these assignments in order. Each builds on understanding from the previous. Take your time - this is the path that took humanity 30 years to travel.*
