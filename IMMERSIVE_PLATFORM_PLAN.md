# Plan: Digital Archaeology - Immersive Historical Web Platform

## Vision Summary

Transform Digital Archaeology from "build CPUs incrementally" to **"become the inventors who shaped computing history"** - a **fully immersive web platform** where students:

1. **Take on personas** of historical figures (Ada Lovelace, Turing, Zuse, Faggin, Wozniak)
2. **Experience period-accurate materials** - letters, journal entries, contemporary documents
3. **Feel authentic constraints** (4-bit pain, tiny memory, no subroutines) with NO modern hints
4. **Build era-appropriate applications** (BCD calculators, games, device controllers)
5. **Discover solutions through necessity** - invent features because they NEED them

### Immersion Level: FULL
- Period-accurate constraints (no modern conveniences)
- Historical documents as primary sources
- Students must discover solutions as inventors did
- No "here's how to solve this" - only "here's the problem you face"

### Pedagogical Flow (Per Era) - INTERLEAVED

```
┌─────────────────────────────────────────────────────────────────┐
│  ERA EXPERIENCE FLOW                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. PERSONA ADOPTION                                            │
│     "You are Federico Faggin. It's 1970..."                    │
│     - Historical context, constraints of the time               │
│     - The problem you're trying to solve                        │
│     - Period documents (letters, memos, specs)                  │
│                        ↓                                        │
│  2. LESSON (interleaved with labs)                              │
│     Learn a concept → Immediately apply it                      │
│     "Busicom needs a calculator chip..."                        │
│                        ↓                                        │
│  3. LAB (hands-on building)                                     │
│     Build circuits, write code, test solutions                  │
│     "Wire up a 4-bit adder using only these gates"             │
│                        ↓                                        │
│  4. EXPERIMENT (free exploration)                               │
│     "What happens if you try to add 9+9?"                      │
│     Discover limitations yourself                               │
│                        ↓                                        │
│  [REPEAT: Lesson → Lab → Experiment cycle continues]            │
│                        ↓                                        │
│  5. ERA CAPSTONE                                                │
│     Build the era-authentic application                         │
│     "Complete the BCD calculator that started it all"          │
│                        ↓                                        │
│  6. TRANSITION                                                  │
│     "The 4004 shipped. But customers want more..."             │
│     → Next era persona                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principle:** Lessons, labs, and experiments are INTERLEAVED - not sequential blocks. Students learn a small concept, immediately apply it in a lab, then experiment freely before the next lesson.

### Delivery: Interactive Web Platform
- Single-page application (SPA)
- Circuit visualization and simulation
- Code editor with era-appropriate assembler
- Step-through debugger
- Progress tracking through eras
- **Sandbox mode** for free experimentation

---

## Timeline: The Convergence of Inventions

The computer wasn't one invention - it was **dozens of breakthroughs** that had to come together.

```
                    THE PATH TO THE MICROPROCESSOR
                    ═══════════════════════════════

    MATHEMATICS          MECHANICS           ELECTRICITY         MATERIALS
        │                    │                    │                   │
        │                    │                    │                   │
   1600s│               1800s│                    │                   │
        │                    │                    │                   │
   ┌────┴────┐          ┌────┴────┐               │                   │
   │ Leibniz │          │ Jacquard│               │                   │
   │ Binary  │          │  Loom   │               │                   │
   │ Numbers │          │ (1804)  │               │                   │
   │ (1679)  │          │Punch    │               │                   │
   └────┬────┘          │Cards    │               │                   │
        │               └────┬────┘               │                   │
        │                    │                    │                   │
   1830s│               ┌────┴────┐               │                   │
        │               │ BABBAGE │               │                   │
   ┌────┴────┐          │Difference│              │                   │
   │  Boole  │          │ Engine  │               │                   │
   │ Boolean │          │ (1822)  │               │                   │
   │ Algebra │          │         │               │                   │
   │ (1854)  │          │Analytical│              │                   │
   └────┬────┘          │ Engine  │               │                   │
        │               │ (1837)  │               │                   │
        │               └────┬────┘               │                   │
        │                    │                    │                   │
        │               ┌────┴────┐               │                   │
        │               │   ADA   │               │                   │
        │               │LOVELACE │               │                   │
        │               │  First  │               │                   │
        │               │Algorithm│               │                   │
        │               │ (1843)  │               │                   │
        │               └────┬────┘               │                   │
        │                    │                    │                   │
   1870s│                    │               ┌────┴────┐              │
        │                    │               │ Edison  │              │
        │                    │               │ Light   │              │
        │                    │               │ Bulb    │              │
        │                    │               │ (1879)  │              │
        │                    │               └────┬────┘              │
        │                    │                    │                   │
   1900s│                    │               ┌────┴────┐              │
        │                    │               │ Fleming │              │
        │                    │               │ Vacuum  │              │
        │                    │               │ Diode   │              │
        │                    │               │ (1904)  │              │
        │                    │               └────┬────┘              │
        │                    │                    │                   │
        │                    │               ┌────┴────┐              │
        │                    │               │ De Forest│             │
        │                    │               │ Triode  │              │
        │                    │               │ (1906)  │              │
        │                    │               └────┬────┘              │
        │                    │                    │                   │
   1930s│                    │                    │                   │
        │                    │                    │                   │
   ┌────┴────┐               │                    │                   │
   │ TURING  │               │               ┌────┴────┐              │
   │Computa- │               │               │  Zuse   │              │
   │ bility  │               │               │   Z3    │              │
   │ (1936)  │               │               │ (1941)  │              │
   └────┬────┘               │               │ RELAYS  │              │
        │                    │               └────┬────┘              │
   ┌────┴────┐               │                    │                   │
   │ Shannon │               │               ┌────┴────┐              │
   │ Boolean │               │               │ ENIAC   │              │
   │=Circuits│               │               │ 18,000  │              │
   │ (1937)  │               │               │ TUBES   │              │
   └────┬────┘               │               │ (1945)  │              │
        │                    │               └────┬────┘              │
        │                    │                    │                   │
   1940s│                    │                    │              ┌────┴────┐
        │                    │                    │              │Shockley │
        │                    │                    │              │Bardeen  │
        │                    │                    │              │Brattain │
        │                    │                    │              │TRANSISTOR
        │                    │                    │              │ (1947)  │
        │                    │                    │              └────┬────┘
        │                    │                    │                   │
   1950s│                    │                    │              ┌────┴────┐
        │                    │                    │              │ Kilby   │
        │                    │                    │              │ Noyce   │
        │                    │                    │              │INTEGRATED
        │                    │                    │              │ CIRCUIT │
        │                    │                    │              │ (1958)  │
        │                    │                    │              └────┬────┘
        │                    │                    │                   │
   1970 ├════════════════════╪════════════════════╪═══════════════════┤
        │                    │                    │                   │
        │              ┌─────┴────────────────────┴───────────────────┴─┐
        │              │                                                │
        │              │              FEDERICO FAGGIN                   │
        │              │                 INTEL 4004                     │
        │              │                   (1971)                       │
        │              │                                                │
        │              │   ALL STREAMS CONVERGE INTO ONE CHIP           │
        │              │                                                │
        │              └────────────────────┬───────────────────────────┘
        │                                   │
        ▼                                   ▼
```

### The Personas Who Made It Happen

| Era | Year | Persona | Contribution | Why It Mattered |
|-----|------|---------|--------------|-----------------|
| 0a | 1679 | **Gottfried Leibniz** | Binary number system | All computation reduced to 0s and 1s |
| 0b | 1804 | **Joseph Jacquard** | Punch card loom | Programs stored on physical media |
| 0c | 1822 | **Charles Babbage** | Difference Engine | Mechanical automatic computation |
| 0d | 1837 | **Charles Babbage** | Analytical Engine | First general-purpose computer design |
| 0e | 1843 | **Ada Lovelace** | First algorithm | Proved machines could do more than calculate |
| 0f | 1854 | **George Boole** | Boolean algebra | Logic becomes mathematics |
| 1a | 1936 | **Alan Turing** | Computability theory | Defined what machines CAN compute |
| 1b | 1937 | **Claude Shannon** | Boolean = Circuits | Logic gates can compute Boolean algebra |
| 2a | 1941 | **Konrad Zuse** | Z3 (relay computer) | First working programmable computer |
| 2b | 1945 | **ENIAC Team** | Electronic computer | 1000x faster than relays |
| 3 | 1947 | **Shockley/Bardeen/Brattain** | Transistor | Solid-state switch, no vacuum |
| 4 | 1958 | **Kilby/Noyce** | Integrated circuit | Multiple transistors on one chip |
| 5 | 1971 | **Federico Faggin** | Microprocessor | Entire CPU on one chip |
| 6 | 1976 | **Steve Wozniak** | Apple I | Computer for everyone |
| 7 | 1981 | **IBM PC Team** | IBM PC | Business standard |
| 8 | 1985 | **Intel 386 Team** | 32-bit protected mode | Modern computing foundation |

### What Had to Exist First

Each invention depended on earlier ones:

```
TO BUILD THE 4004, FAGGIN NEEDED:
├── Integrated circuits (Kilby/Noyce 1958)
│   └── Which needed: Transistors (Bell Labs 1947)
│       └── Which needed: Semiconductor physics (1930s)
│           └── Which needed: Quantum mechanics (1920s)
│
├── Stored program concept (von Neumann 1945)
│   └── Which needed: Turing's computability (1936)
│       └── Which needed: Boolean algebra (Boole 1854)
│           └── Which needed: Binary numbers (Leibniz 1679)
│
├── Digital logic design (Shannon 1937)
│   └── Which needed: Boolean algebra
│   └── Which needed: Relay/switch technology
│
└── The IDEA of a programmable machine
    └── Babbage's Analytical Engine (1837)
        └── Which needed: Jacquard's punch cards (1804)
        └── Which needed: Precision machining (1800s)
```

### Era 0 Split: Babbage & Ada

**Era 0 is now TWO personas:**

```
Era 0a: Charles Babbage - The Visionary Engineer
├── PERSONA: Frustrated mathematician who sees human error everywhere
├── PROBLEM: Navigation tables are killing sailors
├── LESSON: The Difference Engine - mechanical polynomial evaluation
├── LAB: Build gear mechanisms for addition
├── EXPERIMENT: Try to extend to general computation
└── INSIGHT: "I need a GENERAL purpose machine" → Analytical Engine

Era 0b: Ada Lovelace - The First Programmer
├── PERSONA: Mathematician who sees beyond calculation
├── PROBLEM: Babbage's machine needs instructions
├── LESSON: The concept of an algorithm
├── LAB: Write the Bernoulli number program (on paper)
├── EXPERIMENT: What ELSE could this machine do? (music? art?)
└── INSIGHT: "The machine could compose music..." → Software vision
```

---

## Learn More: Multimedia Resources

Each era includes a "Want to Learn More?" section with curated resources.

### Documentaries & Films

| Title | Year | Era | Description |
|-------|------|-----|-------------|
| **The Imitation Game** | 2014 | Turing | Alan Turing and the Enigma machine (dramatized) |
| **Hidden Figures** | 2016 | Early Computing | NASA's human computers and early IBM mainframes |
| **Pirates of Silicon Valley** | 1999 | Personal Computer | Steve Jobs, Bill Gates, and the PC revolution |
| **Triumph of the Nerds** | 1996 | Personal Computer | Documentary on the PC industry (Bob Cringely) |
| **The Machine That Changed the World** | 1992 | All Eras | 5-part PBS documentary on computer history |
| **Revolution OS** | 2001 | Modern | Open source movement, Linux |
| **Silicon Cowboys** | 2016 | PC Era | Compaq vs IBM |
| **General Magic** | 2018 | Modern | Early smartphone/PDA development |
| **Micro Men** | 2009 | 8-bit Era | BBC drama about Sinclair vs Acorn (UK) |
| **Steve Jobs: The Man in the Machine** | 2015 | Personal Computer | Apple's history |
| **BBS: The Documentary** | 2005 | Modem Era | Bulletin board systems |
| **The Code** | 2001 | Modern | Linux documentary |

### TV Shows & Series

| Title | Platform | Era | Description |
|-------|----------|-----|-------------|
| **Halt and Catch Fire** | AMC | PC Era (1980s) | Drama following PC clone makers, software, internet |
| **Silicon Valley** | HBO | Modern | Comedy about startup culture (modern context) |
| **The Billion Dollar Code** | Netflix | Modern | True story of Google Earth's origins |
| **Devs** | Hulu | Modern | Quantum computing thriller (fictional but thought-provoking) |

### YouTube Channels & Videos

| Channel/Video | Focus | Best For |
|---------------|-------|----------|
| **Computerphile** | CS concepts explained | All eras - academic explanations |
| **Ben Eater** | Building computers from scratch | Hands-on CPU building, 8-bit breadboard computer |
| **The 8-Bit Guy** | Retro computing | 8-bit and 16-bit era hardware |
| **LGR (Lazy Game Reviews)** | Retro PC hardware | IBM PC era, DOS gaming |
| **Technology Connections** | How things work | Electronics fundamentals |
| **CuriousMarc** | Vintage computer restoration | Apollo guidance computer, HP calculators |
| **Usagi Electric** | Vacuum tube computing | Building a relay computer |
| **Sebastian Lague** | Visual CS explanations | Modern CPU concepts visualized |

**Specific Must-Watch Videos:**
- Ben Eater: "Building an 8-bit breadboard computer" (full series)
- Computerphile: "Turing Machines Explained"
- CuriousMarc: "Restoring the Apollo Guidance Computer"
- The 8-Bit Guy: "How Computers Work" series

### Wikipedia Deep Dives (Per Era)

**Era 0 - Mechanical Computing:**
- [Charles Babbage](https://en.wikipedia.org/wiki/Charles_Babbage)
- [Difference Engine](https://en.wikipedia.org/wiki/Difference_engine)
- [Analytical Engine](https://en.wikipedia.org/wiki/Analytical_Engine)
- [Ada Lovelace](https://en.wikipedia.org/wiki/Ada_Lovelace)
- [Jacquard Loom](https://en.wikipedia.org/wiki/Jacquard_machine)

**Era 1 - Mathematical Foundations:**
- [George Boole](https://en.wikipedia.org/wiki/George_Boole)
- [Boolean Algebra](https://en.wikipedia.org/wiki/Boolean_algebra)
- [Alan Turing](https://en.wikipedia.org/wiki/Alan_Turing)
- [Turing Machine](https://en.wikipedia.org/wiki/Turing_machine)
- [Claude Shannon](https://en.wikipedia.org/wiki/Claude_Shannon)

**Era 2 - Early Computers:**
- [Konrad Zuse](https://en.wikipedia.org/wiki/Konrad_Zuse)
- [Z3 (computer)](https://en.wikipedia.org/wiki/Z3_(computer))
- [ENIAC](https://en.wikipedia.org/wiki/ENIAC)
- [Colossus Computer](https://en.wikipedia.org/wiki/Colossus_computer)
- [Von Neumann Architecture](https://en.wikipedia.org/wiki/Von_Neumann_architecture)

**Era 3 - Transistors:**
- [Transistor](https://en.wikipedia.org/wiki/Transistor)
- [William Shockley](https://en.wikipedia.org/wiki/William_Shockley)
- [Bell Labs](https://en.wikipedia.org/wiki/Bell_Labs)
- [Semiconductor](https://en.wikipedia.org/wiki/Semiconductor)

**Era 4 - Integrated Circuits:**
- [Integrated Circuit](https://en.wikipedia.org/wiki/Integrated_circuit)
- [Jack Kilby](https://en.wikipedia.org/wiki/Jack_Kilby)
- [Robert Noyce](https://en.wikipedia.org/wiki/Robert_Noyce)
- [Moore's Law](https://en.wikipedia.org/wiki/Moore%27s_law)

**Era 5 - Microprocessors:**
- [Intel 4004](https://en.wikipedia.org/wiki/Intel_4004)
- [Federico Faggin](https://en.wikipedia.org/wiki/Federico_Faggin)
- [Microprocessor](https://en.wikipedia.org/wiki/Microprocessor)
- [Busicom](https://en.wikipedia.org/wiki/Busicom)

**Era 6 - Personal Computers:**
- [Altair 8800](https://en.wikipedia.org/wiki/Altair_8800)
- [Apple I](https://en.wikipedia.org/wiki/Apple_I)
- [Steve Wozniak](https://en.wikipedia.org/wiki/Steve_Wozniak)
- [Homebrew Computer Club](https://en.wikipedia.org/wiki/Homebrew_Computer_Club)
- [BASIC](https://en.wikipedia.org/wiki/BASIC)

**Era 7-8 - IBM PC & Beyond:**
- [IBM PC](https://en.wikipedia.org/wiki/IBM_Personal_Computer)
- [Intel 8086](https://en.wikipedia.org/wiki/Intel_8086)
- [Intel 80386](https://en.wikipedia.org/wiki/Intel_80386)
- [Protected Mode](https://en.wikipedia.org/wiki/Protected_mode)
- [x86](https://en.wikipedia.org/wiki/X86)

### Books (Optional Reading)

| Title | Author | Era | Description |
|-------|--------|-----|-------------|
| **The Innovators** | Walter Isaacson | All | Full history from Ada to Google |
| **Code** | Charles Petzold | Fundamentals | How computers work from first principles |
| **Soul of a New Machine** | Tracy Kidder | Minicomputer | Building the Data General Eclipse |
| **Hackers** | Steven Levy | PC Era | The hacker ethic and early computing culture |
| **Fire in the Valley** | Freiberger & Swaine | PC Era | Making of the personal computer |
| **The Dream Machine** | M. Mitchell Waldrop | All | J.C.R. Licklider and the computer revolution |
| **Turing's Cathedral** | George Dyson | Early | Origins of the digital universe |

### Museums & Physical Sites

| Museum | Location | Focus |
|--------|----------|-------|
| **Computer History Museum** | Mountain View, CA | Comprehensive - all eras |
| **Living Computer Museum** | Seattle, WA | Working vintage computers |
| **Bletchley Park** | UK | WWII codebreaking, Colossus, Turing |
| **Science Museum London** | UK | Babbage's Difference Engine (working replica) |
| **Heinz Nixdorf Museum** | Germany | Largest computer museum in the world |
| **Computer Museum of America** | Atlanta, GA | Apple, IBM, gaming history |

### Online Simulators & Interactive Sites

| Resource | URL | What It Does |
|----------|-----|--------------|
| **Nand2Tetris** | nand2tetris.org | Build a computer from NAND gates |
| **Visual 6502** | visual6502.org | Transistor-level 6502 simulation |
| **CPU Simulator** | cpu-sim.gitlab.io | MIPS/RISC-V simulation |
| **Logic.ly** | logic.ly | Visual logic gate simulator |
| **Turing Machine Simulator** | turingmachine.io | Interactive Turing machine |
| **MAME** | mamedev.org | Arcade/computer emulation |

---

## Gap Analysis

### What Exists (Strong Foundation)
- ✅ 6-stage CPU progression (Micro4 → Micro32-S)
- ✅ Historical homework with 8 eras (Babbage → 8080)
- ✅ 160+ optimization exercises
- ✅ Technical ISA specs (Micro4, Micro8, Micro16)
- ✅ Working emulators and assemblers

### What's Missing (For Immersive Vision)
- ❌ **Role-playing framework** - No persona-based narrative structure
- ❌ **Era-authentic applications** - Programs are test cases, not usable apps
- ❌ **Constraint immersion** - No forced BCD, tiny memory challenges
- ❌ **Interactive journey** - Static docs, not time-travel experience
- ❌ **"Why" moments** - Features taught mechanically, not through need

---

## Proposed Documentation Restructure

### New Core Document: `docs/time_travelers_guide.md`

**Structure:**
```
Chapter 1: The Problem of Computation (1800s)
  → BE Ada Lovelace programming Babbage's Engine
  → Challenge: Compute polynomial tables by hand, then automate

Chapter 2: Making Machines Think (1930s-1940s)
  → BE Alan Turing defining computability
  → BE Konrad Zuse building relay computers
  → Challenge: Build logic from relays, feel the speed pain

Chapter 3: The Electronic Revolution (1940s-1950s)
  → BE the ENIAC team wiring vacuum tubes
  → Challenge: Speed vs reliability tradeoffs

Chapter 4: The Transistor Age (1950s-1960s)
  → BE Shockley/Bardeen at Bell Labs
  → Challenge: Miniaturization begins

Chapter 5: Birth of the Microprocessor (1970-1971)
  → BE Federico Faggin designing the 4004
  → Challenge: Build a BCD calculator with ONLY 4 bits
  → APPLICATION: Busicom 141-PF calculator simulation

Chapter 6: The Personal Computer (1975-1980)
  → BE Steve Wozniak building the Apple I
  → Challenge: Make computing personal
  → APPLICATION: Simple game, terminal interface

Chapter 7: The 16-bit Explosion (1980s)
  → BE the IBM PC team
  → Challenge: Break the 64KB barrier with segmentation
  → APPLICATION: Text editor, simple graphics

[Continue through 32-bit, pipelining, superscalar...]
```

### Era-Authentic Applications to Create

| Era | Application | Constraint Experience |
|-----|-------------|----------------------|
| Micro4 | **BCD Calculator** | Only 0-9 per nibble, chain for larger numbers |
| Micro4 | **LED Pattern Controller** | 256 nibbles total, make it fit |
| Micro8 | **Number Guessing Game** | Feel the luxury of 8 registers |
| Micro8 | **Text Adventure** | String handling with limited memory |
| Micro8 | **Device Controller** | Keypad + display simulation |
| Micro16 | **Terminal/REPL** | Interactive command processing |
| Micro16 | **Simple Graphics** | Why we needed more address space |

### Constraint Immersion Exercises

**Micro4 Constraints (All Applied):**
1. **BCD Math Only** - Students must use 0-9 per nibble
2. **256 Nibbles Total** - Programs must fit or fail
3. **No Subroutines** - Feel copy-paste pain before CALL/RET
4. **No Carry Flag** - Struggle with multi-digit addition
5. **Single Accumulator** - Constant load/store shuffling

**Progression:** Each constraint becomes a homework exercise where students INVENT the solution after feeling the pain.

---

## Files to Create/Modify

### New Files
1. `docs/time_travelers_guide.md` - Master narrative document
2. `programs/micro4/bcd_calculator.asm` - Era-authentic calculator
3. `programs/micro4/led_controller.asm` - Device simulation
4. `programs/micro8/guess_game.asm` - Number guessing game
5. `programs/micro8/text_adventure.asm` - Simple adventure
6. `programs/micro16/terminal.asm` - Interactive REPL
7. `docs/personas/` - Historical figure backgrounds
   - `ada_lovelace.md`
   - `alan_turing.md`
   - `konrad_zuse.md`
   - `federico_faggin.md`
   - `steve_wozniak.md`

### Files to Modify
1. `docs/PROJECT_STATUS.md` - Add immersive vision statement
2. `docs/digital_archaeology_lab_plan.md` - Integrate persona framework
3. `docs/historical_homework.md` - Transform to role-playing format
4. `docs/optimization_homework.md` - Link exercises to "why" moments

---

## Implementation Sequence (Per User Request)

**Order: Platform Shell → Era 5 (4004/Micro4) → Era 0 (Babbage) → Fill in Between**

### Sprint 1: Platform Shell
Build the SPA framework that will host all content.

**Files to Create:**
- `visualizer/lab.html` - Main platform entry point
- `visualizer/app/main.js` - SPA routing, state management
- `visualizer/app/era-navigator.js` - Timeline navigation component
- `visualizer/app/narrative-view.js` - Period document display
- `visualizer/app/progress-view.js` - Era completion tracking
- `visualizer/css/lab.css` - Era-themed styling

**Integrate Existing:**
- Reuse `engine/` simulation core
- Reuse `modules/` view components
- Link circuit builder for hands-on exercises

---

### Sprint 2: Era 5 - The 4004 / Micro4
The microprocessor birth - students become Federico Faggin.

**PERSONA ADOPTION:**
- `visualizer/data/personas/faggin.json` - Background, quotes, constraints
- `visualizer/assets/documents/faggin_design_notes.md` - Period-style journal
- `visualizer/assets/documents/busicom_contract.md` - The original spec

**INTERLEAVED LESSON/LAB/EXPERIMENT SEQUENCE:**

```
Unit 1: The Problem
├── LESSON: "Busicom needs a calculator chip" (read contract)
├── LAB: Try to design a chip for EACH calculator function
├── EXPERIMENT: How many chips would that take?
└── INSIGHT: "What if ONE chip could do it all?"

Unit 2: Why 4 Bits?
├── LESSON: "BCD uses 4 bits for 0-9" (period document)
├── LAB: Build a 4-bit adder from gates
├── EXPERIMENT: Add 5+3, then try 9+9 - what breaks?
└── INSIGHT: "We need to handle carries between digits"

Unit 3: The Accumulator
├── LESSON: "One register to rule them all"
├── LAB: Wire up a 4-bit accumulator with load/store
├── EXPERIMENT: Try doing A+B+C with only one register
└── INSIGHT: "This is painful - maybe we need more registers?"

Unit 4: Memory Constraints
├── LESSON: "256 nibbles is all we have"
├── LAB: Write a program that fits in 256 nibbles
├── EXPERIMENT: Try to write something bigger - fail
└── INSIGHT: "Code must be TIGHT"

Unit 5: Capstone - The Calculator
├── LAB: Build the BCD calculator application
├── EXPERIMENT: Add features (memory, clear, etc.)
└── TRANSITION: "Busicom shipped... but Intel saw bigger potential"
```

**Content Files:**
- `visualizer/data/eras/era5-4004/unit01_problem.json`
- `visualizer/data/eras/era5-4004/unit02_4bits.json`
- `visualizer/data/eras/era5-4004/unit03_accumulator.json`
- `visualizer/data/eras/era5-4004/unit04_memory.json`
- `visualizer/data/eras/era5-4004/unit05_capstone.json`

**Constraint Enforcer:**
- `visualizer/app/constraint-enforcer.js` - Block non-era techniques
  - Force BCD (0-9 per nibble)
  - 256 nibble memory limit
  - No subroutines (until "invented")
  - No carry flag (until "invented")

**Era-Authentic Application:**
- `programs/micro4/bcd_calculator.asm` - Working calculator
- `programs/micro4/led_controller.asm` - 7-segment display simulation

---

### Sprint 3: Era 0 - Babbage & Ada Lovelace
The dawn of computation - students become Ada Lovelace.

**Persona Content:**
- `visualizer/data/personas/ada_lovelace.json` - Background, the "first programmer"
- `visualizer/data/personas/babbage.json` - The Analytical Engine designer
- `visualizer/assets/documents/ada_notes.md` - Period-style notes

**Lessons:**
- `visualizer/data/eras/era0-babbage/lesson01_tables.json` - The error-prone tables problem
- `visualizer/data/eras/era0-babbage/lesson02_differences.json` - Method of differences
- `visualizer/data/eras/era0-babbage/lesson03_mechanical.json` - Mechanical computation concept
- `visualizer/data/eras/era0-babbage/lesson04_programming.json` - Ada's program for Bernoulli

**Hands-On:**
- Simulate difference engine calculation by hand
- Design gears/cogs for simple addition (visual)

---

### Sprint 4: Fill Eras 1-4 (Relays → ICs)
**Era 1 - Zuse & Relays:** Build logic from electromagnetic switches
**Era 2 - ENIAC & Tubes:** Wire vacuum tube computations
**Era 3 - Transistors:** Understand the switch that changed everything
**Era 4 - ICs:** First integrated circuits, TTL logic

---

### Sprint 5: Fill Eras 6+ (Personal Computers → Modern)
**Era 6 - Wozniak:** Build the Apple I experience
**Era 7 - 16-bit:** Segmentation struggles (Micro16)
**Era 8 - 32-bit:** Protected mode, paging (Micro32)
**Era 9 - Pipeline:** Why and how
**Era 10 - Superscalar:** Modern complexity

---

## Web Platform Architecture

### Technology Decision: Vanilla JS (Confirmed via Research)

**Existing Foundation (Already Built):**
- Canvas-based circuit visualization (~1900 lines, fully interactive)
- Modular simulation engine (wire.js, gate.js, circuit.js, animation.js)
- Gate simulation (NOT, AND, OR, NAND, NOR, XOR)
- Wire connections with signal propagation & electron flow animation
- X-ray mode showing internal transistor structure
- Pre-built circuits (half adder, full adder, SR latch, D flip-flop)
- JSON circuit loading from HDL simulator exports

**Why Vanilla JS is Right:**
- ✅ Already functional and fast (no framework overhead)
- ✅ ~1900 lines of working code to build on
- ✅ Educational transparency (students can read the code)
- ✅ No build step, no dependencies, no "AI slop"
- ✅ Canvas rendering is smooth for animation

**New Structure:**
```
visualizer/
├── index.html              # ✅ EXISTS - Circuit builder (1897 lines)
├── engine/                 # ✅ EXISTS - Simulation core
│   ├── types.js           # Wire states, gate types
│   ├── wire.js            # Wire class
│   ├── gate.js            # Gate class
│   ├── circuit.js         # Circuit class
│   ├── io.js              # Input/output handling
│   ├── animation.js       # Electron flow animation
│   └── index.js           # Main entry, pre-built circuits
├── modules/               # ✅ EXISTS - View components
│   ├── gate-view.js       # Gate visualization
│   ├── cpu-state-view.js  # Register/memory display
│   └── debugger-view.js   # Step/run/breakpoint
├── app/                   # NEW - Main platform shell
│   ├── main.js            # SPA routing, state management
│   ├── era-navigator.js   # Timeline UI
│   ├── narrative-view.js  # Document/story display
│   ├── editor-view.js     # Code editor with constraints
│   └── progress-view.js   # Era progress tracking
├── data/                  # NEW - Era content
│   ├── eras/              # JSON lesson definitions
│   └── personas/          # Historical figure profiles
└── assets/                # NEW - Period materials
    └── documents/         # Letters, journals, patents
```

### Key Platform Features
1. **Era Navigator** - Timeline showing computing evolution
2. **Document Viewer** - Period-accurate letters, journals, patents
3. **Circuit Simulator** - Visual gate-level simulation
4. **Code Editor** - Era-appropriate assembler with constraints
5. **Constraint Enforcer** - Prevents "cheating" with modern techniques
6. **Progress Tracker** - Unlocks next era upon completion

---

## Verification

### Platform Verification
- [ ] SPA loads and navigates between eras
- [ ] Circuit simulator runs Micro4/8/16 programs
- [ ] Code editor assembles and loads programs
- [ ] Constraint enforcer blocks "modern" solutions
- [ ] Progress saves across sessions

### Content Verification
- [ ] Each era has period-accurate documents (letters, journals)
- [ ] Each CPU stage has 2+ era-authentic applications
- [ ] Constraints force students to feel limitations
- [ ] "Why" moments precede feature introductions
- [ ] No modern hints - discovery-based learning only

### Immersion Verification
- [ ] Students can complete Micro4 BCD calculator challenge
- [ ] Micro8 game is playable within constraints
- [ ] Historical context feels authentic, not contrived

---

## Questions Resolved

- ✅ Applications: BCD Calculator, Games, Device Controllers, Terminal
- ✅ Constraint approach: Full immersion (BCD only, tiny memory, no subroutines)
- ✅ Narrative structure: Time travel with historical personas
- ✅ Immersion level: Full (period-accurate materials, no modern hints)
- ✅ Delivery format: Interactive web platform (SPA)

---

## Scope Summary

This is a **large undertaking** combining:
1. **Web platform development** - SPA with simulator, editor, narrative viewer
2. **Historical research** - Period-accurate documents for each era
3. **Educational design** - Discovery-based, constraint-enforced learning
4. **Application development** - Era-authentic programs students build

The existing `visualizer/` and CPU emulators provide a foundation, but significant new development is required for the immersive historical experience.
