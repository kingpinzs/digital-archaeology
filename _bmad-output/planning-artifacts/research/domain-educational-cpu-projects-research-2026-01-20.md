---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
workflowType: 'research'
lastStep: 1
research_type: 'domain'
research_topic: 'Educational CPU Projects'
research_goals: 'Survey the landscape of educational CPU projects from university courses to hobbyist builds, understanding different pedagogical approaches and their effectiveness'
user_name: 'Jeremy'
date: '2026-01-20'
web_research_enabled: true
source_verification: true
---

# Research Report: Educational CPU Projects

**Date:** 2026-01-20
**Author:** Jeremy
**Research Type:** Domain Research

---

## Research Overview

This research document surveys the landscape of educational CPU projects—from formal university courses to YouTube series to hobbyist homebrew computers. We examine different pedagogical approaches, their target audiences, and what makes each effective for learning computer architecture.

---

## Domain Research Scope Confirmation

**Research Topic:** Educational CPU Projects

**Research Goals:**
- Survey prominent educational CPU projects
- Understand different pedagogical approaches (bottom-up vs top-down)
- Document technical complexity levels and prerequisites
- Identify best practices for teaching computer architecture
- Evaluate relevance to Digital Archaeology project

**Key Projects to Cover:**

| Project | Type | Approach | Complexity |
|---------|------|----------|------------|
| Nand2Tetris | Course | Bottom-up (gates to OS) | Beginner |
| Ben Eater SAP-1 | Video Series | Hardware-first | Intermediate |
| MIPS in Education | University | ISA-focused | Intermediate |
| RISC-V Educational | Various | Open ISA | Varies |
| Magic-1 | Homebrew | Full system | Advanced |
| James Sharman | Video Series | Pipelined | Advanced |
| Gigatron | Kit | No microprocessor | Intermediate |

**Scope Confirmed:** 2026-01-20

---

## Nand2Tetris: The "First Principles" Approach

### Overview

**Nand to Tetris** (formally "From Nand to Tetris: Building a Modern Computer System from First Principles") is perhaps the most influential educational computing project of the 21st century.

Created by **Noam Nisan** (Hebrew University) and **Shimon Schocken** (Interdisciplinary Center Herzliya), the course builds an entire computer—from NAND gates to Tetris—in 12 progressive projects.

_Source: [Nand to Tetris - ACM](https://cacm.acm.org/research/nand-to-tetris-building-a-modern-computer-system-from-first-principles/), [Coursera Course](https://www.coursera.org/learn/build-a-computer)_

### Why It Exists

From the creators: "Because many CS students don't understand how computers work; because fewer CS programs require a compilation course; because many computer architecture courses are too detailed; because nothing beats the thrill of creating something from almost nothing."

### The Hack Computer

Students build the **Hack**—a 16-bit computer with custom ISA:

**Technical Specs:**
- 16-bit data and address width
- Harvard architecture (separate instruction and data memory)
- 32K RAM, 32K ROM
- Memory-mapped I/O for screen and keyboard
- Two registers: A (address/data) and D (data)

### Course Structure

**Part I: Hardware (Projects 1-6)**

| Project | Topic | Output |
|---------|-------|--------|
| 1 | Boolean Logic | AND, OR, NOT, XOR, MUX gates |
| 2 | Boolean Arithmetic | Half-adder, full-adder, ALU |
| 3 | Sequential Logic | Flip-flops, registers, RAM |
| 4 | Machine Language | Assembly programs |
| 5 | Computer Architecture | CPU, Memory, I/O |
| 6 | Assembler | Hack assembler |

**Part II: Software (Projects 7-12)**

| Project | Topic | Output |
|---------|-------|--------|
| 7-8 | VM Translator | Stack-based VM implementation |
| 9 | High-level Language | Jack programs |
| 10-11 | Compiler | Jack → VM compiler |
| 12 | Operating System | Jack OS libraries |

### Time Investment

- **Lectures:** 2-3 hours per module
- **Projects:** 5-10 hours each
- **Total:** 6 weeks (intensive) or self-paced

### Pedagogical Approach

**Bottom-up construction:** Start from the smallest component (NAND gate) and build upward. Each layer is implemented before the next is introduced.

**Abstraction hiding:** Once a component is built, its implementation is hidden. You use it as a black box to build higher layers.

**Simulation-first:** All projects use provided simulators. No physical hardware required.

### Impact

- Versions taught in hundreds of universities, high schools, and bootcamps
- Book: "The Elements of Computing Systems"
- All materials freely available as open source
- Hobbyists have built physical Hack computers on breadboards

_Source: [Hackaday - Hack on Breadboards](https://hackaday.io/project/185131-the-hack-computer-from-nand2tetris-on-breadboards)_

---

## Ben Eater SAP-1: The Hardware-First Approach

### Overview

Ben Eater, a former Khan Academy employee, created a YouTube series building an **8-bit breadboard computer** based on the SAP-1 (Simple As Possible) architecture from Albert Paul Malvino's textbook "Digital Computer Electronics."

_Source: [SAP Wikipedia](https://en.wikipedia.org/wiki/Simple-As-Possible_computer), [Ben Eater Project](https://www.ullright.org/ullWiki/show/ben-eater-8-bit-computer-sap1)_

### The SAP-1 Architecture

**Design Philosophy:** "Simple As Possible"—the minimal components needed for a working computer.

**Components:**
- Adjustable-speed clock (manual stepping possible)
- 8-bit ALU (addition and subtraction)
- Two 8-bit registers (A and B)
- Instruction register (4-bit opcode + 4-bit address)
- 4-bit program counter (16 memory locations)
- 16 bytes of RAM
- Flags register (Zero, Carry)

**Limitations:**
- 4-bit address bus → only 16 memory locations
- Combined program/data memory
- Very limited instruction set

### Educational Value

What makes Ben Eater's series exceptional:
1. **Physical hardware:** Real chips, real wiring, real debugging
2. **Thorough explanation:** Every signal, every timing issue explained
3. **Incremental building:** Each video adds one component
4. **Failure is learning:** Debugging shown on camera

### Community Extensions

The series spawned a massive community. Common extensions include:
- Expanded RAM (256 bytes using 8-bit addressing)
- 16-bit address space with segmentation
- Additional instructions
- Display output
- Multiple data sizes

_Source: [GitHub - SAP-1 Improvements](https://github.com/michaelkamprath/eater-sap-1-improvements)_

### Kit Availability

Ben Eater sells kits containing all components needed. The full 8-bit computer kit includes:
- Clock module
- Registers
- ALU
- RAM
- Control logic
- Output display

### Pedagogical Approach

**Hardware-first:** Physical components before any abstraction.

**Wire-wrap construction:** Students make every connection manually, building intuition for signal flow.

**Debugging-centric:** Learning through troubleshooting is emphasized.

---

## MIPS: The University Standard

### Historical Dominance

For decades, MIPS was **the** ISA for teaching computer architecture. Patterson and Hennessy's textbooks ("Computer Architecture: A Quantitative Approach" and "Computer Organization and Design") used MIPS as their primary example.

_Source: [MIPS Architecture Wikipedia](https://en.wikipedia.org/wiki/MIPS_architecture)_

### Why MIPS for Education?

1. **Clean design:** Regular instruction encoding, orthogonal operations
2. **Load-store architecture:** Simple memory model
3. **32-bit consistency:** All registers and operations are 32-bit
4. **Well-documented:** Extensive academic literature
5. **Simulator availability:** SPIM, MARS, EduMIPS64, Saturn

### Educational Simulators

| Simulator | Platform | Features |
|-----------|----------|----------|
| SPIM | Cross-platform | MIPS32, widely used |
| MARS | Java/GUI | Designed for education, pipeline visualization |
| EduMIPS64 | Java/GUI | MIPS64, shows pipeline graphically |
| Saturn | Java/GUI | University of Toronto replacement for MARS |

### The End of MIPS

In March 2021, MIPS Technologies announced the end of MIPS architecture development. The company transitioned to RISC-V.

**Implications for education:**
- Existing materials remain valid (architecture unchanged)
- New courses increasingly adopt RISC-V
- MIPS remains valuable for understanding RISC principles

---

## RISC-V: The Open Standard for Education

### Origins

RISC-V was developed in 2010 at UC Berkeley as the **fifth generation** of RISC processors created there since 1981 (after RISC-I, RISC-II, SOAR, and SPUR).

Unlike proprietary ISAs, RISC-V specifications are released under permissive open-source licenses with no royalty requirements.

_Source: [RISC-V Wikipedia](https://en.wikipedia.org/wiki/RISC-V)_

### Why RISC-V for Education?

1. **Free and open:** No licensing restrictions
2. **Clean design:** Learned from 30 years of RISC evolution
3. **Modular:** Base ISA plus optional extensions
4. **Modern:** Designed for contemporary needs
5. **Industry adoption:** Real-world relevance

### Educational Projects

**Wildcat Project:**
Explores simpler pipeline organizations for teaching. Questions whether the classic 5-stage pipeline (from 1980s technology) is optimal for education.

**HaDes-V (Graz University of Technology):**
Open Educational Resource guiding students through creating a 5-stage pipelined 32-bit RISC-V processor using SystemVerilog and FPGA tools.

**PULPino (ETH Zürich/University of Bologna):**
Implements cores with RV32IMC ISA for microcontrollers. Open source and used in education.

_Source: [Wildcat Paper](https://arxiv.org/html/2502.20197v1), [HaDes-V](https://riscv.org/blog/2025/05/hades-v-learning-by-puzzling-a-modular-approach-to-risc-v-processor-design-education/)_

### Online Resources

**Linux Foundation - Building a RISC-V CPU Core:**
Crash course in digital logic and basic CPU microarchitecture. Uses Makerchip online IDE to implement gates through complete RISC-V core.

**RISC-V Learn Repository:**
Tracks educational resources, courses, and open implementations for hands-on learning.

_Source: [Linux Foundation Course](https://training.linuxfoundation.org/training/building-a-riscv-cpu-core-lfd111x/), [RISC-V Learn GitHub](https://github.com/riscv/learn)_

---

## Magic-1: The Ambitious Homebrew

### Overview

**Magic-1** is arguably the most well-known hobbyist-built TTL computer. Created by Bill Buzbee (a Google engineer), it demonstrates what's possible when you start from scratch.

_Source: [Magic-1 Official Site](https://www.magic-1.org/), [Homebrew CPU](https://www.homebrewcpu.com/)_

### Technical Specifications

| Feature | Specification |
|---------|---------------|
| Technology | ~200 74-series TTL chips |
| Construction | Wire-wrap |
| Clock Speed | 4.09 MHz |
| RAM | 4 MB SRAM |
| Architecture | Microcoded CISC |
| Microcode | 512 × 40-bit words |
| Data Bus | 8-bit |
| Arithmetic | 8/16-bit operations |
| Virtual Memory | 16-bit virtual → 23-bit physical |
| Operating Modes | User/Supervisor |

### Software Stack

Buzbee didn't just build hardware—he created an entire software ecosystem:

- **Minix 2.0.4:** Custom port
- **LCC:** Retargeted C compiler
- **Assembler:** Written from scratch
- **Linker:** Custom implementation
- **C libraries:** Ported to Magic-1

### Project Timeline

- **Hardware:** 2005-2006
- **Software:** 2005-2009

### The Web Server

Magic-1 is notable for being a **working web server**. Visitors can telnet into it to run classic programs like Adventure, Eliza, and Conway's Life.

### Educational Value

Magic-1 demonstrates:
1. **Full-system thinking:** Hardware + software integration
2. **Operating system concepts:** Virtual memory, protection rings
3. **Compiler design:** Retargeting a real compiler
4. **Persistence:** Years of dedicated effort

---

## James Sharman: Pipelined Breadboard CPU

### Overview

James Sharman has been documenting the construction of an **8-bit pipelined CPU** on YouTube. Unlike Ben Eater's SAP-1, Sharman's design includes pipelining—making it significantly more complex and educational.

_Source: [Cemetech Forum](https://www.cemetech.net/forum/viewtopic.php?t=19868), [GitHub Simulator](https://github.com/jamon/jamessharman-8bit-cpu-sim)_

### What Makes It Special

1. **Pipelining:** The key architectural concept that SAP-1 doesn't address
2. **Custom peripherals:** VGA, sound, UART built from scratch
3. **Extensive documentation:** Over 100 videos
4. **PCB transition:** Modules move from breadboard to PCB once proven

### Community Impact

The series has inspired:
- Logic simulators of the design
- FPGA implementations
- Hobbyists building their own versions
- Spin-off projects combining ideas from Sharman and Eater

### Complexity Level

This is an **advanced** project. Prerequisites include:
- Understanding of basic digital logic
- Familiarity with Ben Eater's series (or equivalent)
- Patience for multi-year projects

---

## Gigatron: The No-Microprocessor Computer

### Overview

The **Gigatron TTL** is a retro-style 8-bit computer where the CPU is implemented entirely in TTL chips—no microprocessor at all. Created by Marcel van Kervinck and Walter Belgers.

_Source: [Gigatron Official](https://gigatron.io/), [Gigatron Wikipedia](https://en.wikipedia.org/wiki/Gigatron_TTL)_

### Design Philosophy

"It's special in its own oddball way, because it has absolutely no complex logic chips in it, not even a microprocessor!"

The Gigatron demonstrates that a functional computer can be built from basic logic gates—the same principle as Nand2Tetris, but in physical hardware.

### Kit Contents

Available as a DIY kit including:
- TTL logic chips
- EPROM (swappable for firmware updates)
- VGA and game controller ports
- USB power
- NES-style controller
- Keyboard controller with non-volatile memory
- Instruction booklet
- Wooden presentation box

### Software

Programs are included in ROM, written in:
- **GCL:** Gigatron Control Language
- **Tiny BASIC:** Interactive programming
- **vCPU:** Virtual CPU bytecode

### Availability

The original kits are no longer available (stock depleted and Marcel van Kervinck passed away). However:
- A Dutch company produces kits (~€100)
- Design files are fully open source (BSD license)
- Assembly/User manual available under CC-BY-SA

_Source: [Legacy Pixels - Gigatron](https://legacypixels.com/gigatron/index.html), [Gigatron Hackaday](https://hackaday.io/project/20781-gigatron-ttl-microcomputer)_

---

## Other Notable Projects

### CSCvon8

A minimal von Neumann 8-bit CPU using only **17 TTL chips**:
- 32K ROM
- 32K RAM
- UART
- Microcoded architecture

Includes: hardware design, Perl simulator, Verilog simulator, assembler, compiler, and example programs (Conway's Life, Tic-Tac-Toe).

_Source: [CSCvon8 Hackaday](https://hackaday.io/project/165950-cscvon8-an-8-bit-ttl-cpu)_

### HOL-1

A TTL-based 8-bit CPU designed for permanent construction on perfboards. Based on SAP-1 but intended for long-term use, not just education.

_Source: [HOL-1 GitHub](https://github.com/agben/Hol-1)_

### DIP-8 TTL Computer

An 8-bit computer with custom architecture, custom software, and no microprocessor—just 7400 series logic and EEPROMs.

_Source: [DIP-8 Hackaday](https://hackaday.io/project/186132-dip-8-ttl-computer)_

---

## Pedagogical Approaches Compared

### Bottom-Up vs Top-Down

| Approach | Examples | Advantages | Disadvantages |
|----------|----------|------------|---------------|
| **Bottom-up** | Nand2Tetris, Ben Eater | Deep understanding of each layer | Slow to reach "interesting" programs |
| **Top-down** | Assembly-first courses | Quick to write programs | Black-box hardware |
| **Middle-out** | MIPS courses | Balance of both | May miss both extremes |

### Hardware vs Software First

| Approach | Examples | Best For |
|----------|----------|----------|
| **Hardware-first** | Ben Eater, James Sharman | Electrical engineers, hands-on learners |
| **Software-first** | Nand2Tetris | CS students, simulation preference |
| **Parallel** | Full-stack courses | Ambitious curricula |

### Complexity Progression

**Recommended learning path:**

1. **Beginner:** Nand2Tetris Part I (simulation)
2. **Intermediate:** Ben Eater SAP-1 (hardware)
3. **Advanced:** James Sharman (pipelining) or RISC-V (modern ISA)
4. **Expert:** Magic-1 style full-system build

---

## Implications for Digital Archaeology

### What Works

Based on this survey, effective educational CPU projects share these traits:

1. **Incremental complexity:** Each step builds naturally on the previous
2. **Working at each stage:** Something runs, even if limited
3. **Visible internals:** Students can see what's happening
4. **Real debugging:** Problems are learning opportunities
5. **Community:** Others working on similar projects

### Digital Archaeology Positioning

| Project | Complexity | Focus | Target |
|---------|------------|-------|--------|
| Nand2Tetris | Low | Full stack | CS beginners |
| Ben Eater | Medium | Hardware | Hands-on learners |
| **Digital Archaeology** | Medium-High | Historical evolution | History-oriented learners |
| Magic-1 | Very High | Full system | Advanced hobbyists |

### Unique Value Proposition

Digital Archaeology's distinct approach:
1. **Historical context:** Why was each feature invented?
2. **Staged evolution:** 4-bit → 8-bit → 16-bit → 32-bit
3. **Multiple implementations:** Software emulator + HDL
4. **Focus on "aha moments":** Connect each feature to the problem it solved

### Recommended Adaptations

Based on successful projects:

1. **From Nand2Tetris:** Bottom-up construction, abstraction hiding, clear project milestones
2. **From Ben Eater:** Incremental video-style documentation, debugging emphasis
3. **From RISC-V educational:** Open materials, modular design
4. **From Magic-1:** Full-system thinking, real software running

---

## Executive Summary

### Project Comparison

| Project | Year | Approach | ISA | Physical HW? | Difficulty |
|---------|------|----------|-----|--------------|------------|
| Nand2Tetris | 2005 | Bottom-up | Hack | No (simulation) | Beginner |
| Ben Eater | 2017 | Hardware-first | SAP-1 | Yes (breadboard) | Intermediate |
| MIPS Education | 1990s | ISA-focused | MIPS | No (simulation) | Intermediate |
| RISC-V Education | 2010s | Open ISA | RISC-V | Optional (FPGA) | Varies |
| Magic-1 | 2005 | Full system | Custom | Yes (wire-wrap) | Expert |
| James Sharman | 2018+ | Pipelined | Custom | Yes (breadboard) | Advanced |
| Gigatron | 2018 | No μP | Custom | Yes (kit) | Intermediate |

### Key Insights

1. **Simulation vs Hardware:** Both approaches are valid; choose based on audience
2. **Complexity matters:** Too simple is boring, too complex is overwhelming
3. **History teaches:** Understanding "why" helps retention
4. **Community is essential:** Projects with active communities thrive
5. **Iteration is key:** Great projects evolved over years

### Lessons for Digital Archaeology

The most successful educational CPU projects share:
- Clear progression from simple to complex
- Working systems at each stage
- Explanation of "why" not just "how"
- Multiple entry points for different skill levels
- Open materials encouraging extension

Digital Archaeology can stand out by emphasizing the **historical evolution**—making the journey from 4-bit to superscalar feel like archaeological excavation through computing history.

---

**Research Completion Date:** 2026-01-20
**Research Type:** Domain Research - Educational CPU Projects
**Source Verification:** All claims verified against multiple sources

Sources:
- [Nand to Tetris - ACM](https://cacm.acm.org/research/nand-to-tetris-building-a-modern-computer-system-from-first-principles/)
- [Coursera - Nand2Tetris](https://www.coursera.org/learn/build-a-computer)
- [SAP Wikipedia](https://en.wikipedia.org/wiki/Simple-As-Possible_computer)
- [MIPS Architecture Wikipedia](https://en.wikipedia.org/wiki/MIPS_architecture)
- [RISC-V Wikipedia](https://en.wikipedia.org/wiki/RISC-V)
- [Magic-1 Official](https://www.magic-1.org/)
- [Homebrew CPU](https://www.homebrewcpu.com/)
- [Gigatron Official](https://gigatron.io/)
- [Gigatron Wikipedia](https://en.wikipedia.org/wiki/Gigatron_TTL)
- [Hackaday - Homebrew CPU Projects](https://hackaday.io/list/25846-homebrew-cpu)
