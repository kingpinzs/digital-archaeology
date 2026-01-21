---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain-skipped', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
workflowType: 'prd'
classification:
  projectType: 'web_app'
  domain: 'edtech'
  complexity: 'medium'
  projectContext: 'brownfield'
inputDocuments:
  - '_bmad-output/planning-artifacts/research/domain-cpu-architecture-evolution-research-2026-01-20.md'
  - '_bmad-output/planning-artifacts/research/domain-historical-cpu-designs-research-2026-01-20.md'
  - '_bmad-output/planning-artifacts/research/domain-educational-cpu-projects-research-2026-01-20.md'
  - '_bmad-output/planning-artifacts/research/domain-memory-hierarchy-history-research-2026-01-20.md'
  - '_bmad-output/planning-artifacts/research/domain-missed-opportunities-research-2026-01-20.md'
  - '_bmad-output/planning-artifacts/research/domain-pipeline-superscalar-origins-research-2026-01-20.md'
  - 'docs/index.md'
  - 'docs/PROJECT_STATUS.md'
  - 'docs/architecture-overview.md'
  - 'docs/development-guide.md'
documentCounts:
  briefs: 0
  research: 6
  brainstorming: 0
  projectDocs: 20
---

# Product Requirements Document - Digital Archaeology

**Author:** Jeremy
**Date:** 2026-01-20
**Version:** 1.0

---

## Executive Summary

**Digital Archaeology** is an immersive web platform for learning CPU architecture through first-principles construction. Users build every component themselves—from 4-bit gates to 32-bit superscalar processors—experiencing the *why* behind each innovation through authentic discovery rather than instruction.

**Vision:** Achieve doctorate-level expertise in applied computer engineering by building, not studying. Create novel technology and give it away freely.

**Differentiator:** Unlike guided tutorials or academic courses, this platform offers unconstrained experimentation with no backwards compatibility constraints. Designs progress from simulation to real FPGA hardware.

**Primary User:** Builder-learners who want to understand computing from first principles, not assemble others' pieces.

**MVP:** Act 1 (Micro4) fully functional in-browser—editor, assembler, emulator, debugger, and circuit visualizer.

---

## Success Criteria

### User Success

The primary user is the builder-learner (starting with Jeremy, extendable to others). Success means:

1. **Practical Mastery:** Can design and build complex CPUs from first principles, having constructed every stage personally (4-bit → 8-bit → 16-bit → 32-bit → pipelined → superscalar)

2. **Inventor's Intuition:** Understands *why* every architectural feature exists through lived experience of hitting the limitations that necessitated each innovation

3. **Hardware Realization:** Can take designs from simulation to physical hardware (FPGA synthesis, potentially fabrication)

4. **Identity Transformation:** Feels like an inventor, not a student—learning happens through authentic discovery under period-accurate constraints

### Business Success

This is not a commercial venture. Success metrics are:

1. **Personal Capability:** Achieve expertise equivalent to a doctorate in applied computer engineering through hands-on building

2. **Creation:** Invent novel technology (custom microcontroller architectures, new approaches)

3. **Contribution:** Give the platform, tools, and designs away freely—enabling others to take the same journey

4. **Legacy:** Create something lasting that advances open hardware and computer science education

### Technical Success

1. **Micro32 on FPGA:** A complete 32-bit CPU design synthesized and running on an FPGA development board

2. **Custom Microcontroller:** An original microcontroller design (not following Micro4→32 path) that demonstrates mastery

3. **Fab-Ready Design:** At least one design that follows manufacturing design rules and could theoretically be fabricated as a real chip

4. **Complete Toolchain:** Emulators, assemblers, debuggers, and HDL for each stage—all open source

### Measurable Outcomes

| Milestone | Measurement |
|-----------|-------------|
| Platform Complete | All 6 CPU stages implemented with working emulators + HDL |
| FPGA Deployment | Micro32 boots and executes programs on physical FPGA |
| Custom Design | Novel microcontroller architecture designed and simulated |
| Fab Viability | Design passes DRC for a target process node |
| Open Release | Full platform, tools, and designs published freely |

---

## User Journeys

### Journey 1: The Builder-Learner (Primary)

**Persona:** Jeremy—a maker who wants to understand computing from first principles, not assemble others' pieces.

**Starting Point:** No knowledge of CPU architecture. Curiosity-driven, no financial pressure. Pure motivation: understand *how* and *why*, with the freedom to explore and make it better.

**The Journey:**

**Act 1 - The Humbling Beginning (Micro4)**
You sit down with nothing but gates. 4 bits. One accumulator. 16 instructions. You write your first program and it runs. It's painfully limited—you can only address 256 nibbles, you have no stack, no subroutines. But you built it. Every gate is yours.

*Emotional state: Frustration mixed with wonder. "This is so limited... but I made this."*

**Act 2 - Discovering Necessity (Micro8)**
The limitations of Micro4 become unbearable. You *need* more registers. You *need* a stack for subroutines. You don't read about these features—you invent them because you must. 8 registers. 64KB address space. CALL and RET. The CPU becomes capable.

*Emotional state: Growing power. "I understand why these features exist—I needed them."*

**Act 3 - Scaling Up (Micro16)**
64KB isn't enough. You invent segmentation. Math is slow—you add hardware multiply. String operations, interrupts, the complexity grows but you understand every piece because you built every piece.

*Emotional state: Confidence. "I'm building what real computers use."*

**Act 4 - The Real Machine (Micro32)**
32-bit flat addressing. Protected mode. Paging. This is the architecture that runs the world. You implement it yourself. Then you synthesize it to an FPGA. Your CPU runs on real silicon.

*Emotional state: Awe. "My design is running on physical hardware."*

**Act 5 - Performance (Micro32-P, Micro32-S)**
Pipelining. Hazard detection. Superscalar execution. Branch prediction. You understand why modern CPUs are marvels of engineering—because you built one.

*Emotional state: Mastery. "I see how it all fits together."*

**Resolution:**
You receive a problem in this domain. You solve it without help—no AI, no internet, no textbooks. Just first-principles understanding. You've built a CPU, an OS, a language, an ecosystem. You can give it all away. Others can follow your path.

*Emotional state: Inventor. "I didn't just learn this. I became this."*

### Journey 2: Future Learner (Deferred)

*To be designed after the primary journey is complete.*

A future user discovers this open-source platform and wants to take the same journey. They follow the path Jeremy carved—same stages, same discovery moments, same transformation.

### Journey Requirements Summary

| Journey Phase | Required Capabilities |
|---------------|----------------------|
| Getting Started | Web-based environment, no setup friction, immediate feedback |
| Building CPUs | Code editor, HDL editor, circuit visualizer, step-by-step debugger |
| Hitting Walls | Period-accurate constraints that force discovery, no premature hints |
| Discovery Moments | Clear visualization of *why* features solve problems |
| Progressive Stages | 6 complete CPU architectures with full toolchains |
| Hardware Realization | FPGA synthesis export, physical deployment guides |
| Mastery Validation | Challenges solvable only with deep understanding |
| Ecosystem Creation | Ability to build OS, language, tools on top of CPU |

---

## Innovation & Novel Patterns

### Detected Innovation Areas

1. **First-Principles Complete Journey** - From gates to superscalar, every layer built by you, nothing borrowed

2. **Unconstrained Experimentation** - No backwards compatibility requirements. See a better approach? Implement it. Breaking changes are free.

3. **Real Hardware Realization** - Not simulation-only. Designs synthesize to FPGA and could theoretically be fabricated.

4. **Inventor's Freedom** - Experience what historical CPU designers couldn't: the ability to "fix" architecture without ecosystem constraints

5. **Roads Not Taken** - Ability to explore alternative CPU evolution paths (what if segmentation was never invented? what if we had capability-based addressing?)

### Competitive Landscape

| Existing Approaches | Digital Archaeology |
|--------------------|--------------------|
| Guided tutorials with predetermined outcomes | First-principles discovery where YOU choose the path |
| Follow established ISA specifications | Freedom to invent—no backwards compatibility constraints |
| Simulation-only or breadboard-only | Full pipeline to real hardware (FPGA, potentially fab) |
| Learn about existing designs | Experience the inventor's freedom to make breaking changes |
| Curriculum-structured | See a window of opportunity? Take it. |

### Validation Approach

- **Micro32 on FPGA** proves the full pipeline works (simulation → synthesis → physical hardware)
- **Custom microcontroller** proves mastery extends beyond the guided path
- **Solving novel problems** without external help proves deep understanding

---

## Web Application Architecture

### Platform Overview

Digital Archaeology is a **Single Page Application (SPA)** providing an immersive CPU development environment:

- Circuit visualization with real-time signal animation
- Code editors for assembly and HDL
- CPU emulators compiled to WebAssembly for performance
- Step-by-step debuggers
- Progressive lesson structure

The application operates as a **Progressive Web App (PWA)**, enabling offline use after initial load.

### Technical Stack

| Component | Technology |
|-----------|------------|
| Application Type | Single Page Application (SPA) |
| Offline Support | PWA with service worker |
| State Management | Client-side (no backend required) |
| Emulators | C → WebAssembly (Emscripten) |
| Visualizer | Canvas-based rendering |
| HDL Simulator | WebAssembly or optimized JavaScript |

### Browser Support

| Browser | Support Level |
|---------|---------------|
| Firefox | Primary—full testing and optimization |
| Chrome | Secondary—should work, not primary target |
| Safari | Best effort |
| Edge | Best effort |

### WebAssembly Integration

**Components to compile via Emscripten:**
- `src/micro4/cpu.c` → `micro4.wasm`
- `src/micro8/cpu.c` → `micro8.wasm`
- `src/micro16/cpu.c` → `micro16.wasm`
- `src/micro32/cpu.c` → `micro32.wasm` (when implemented)
- `src/simulator/` → `m4sim.wasm`

**JavaScript API Pattern:**
```javascript
const micro8 = await Micro8.create();
micro8.loadProgram(binaryData);
micro8.step();  // Execute one instruction
micro8.getState();  // { pc, registers, flags, memory }
```

---

## Project Scoping & Phased Development

### MVP Strategy

**Approach:** Journey-First MVP

The minimum viable platform enables the complete first "Act" of the learning journey—experiencing Micro4 from gates to working programs, entirely in the browser.

**Why this works:**
- Micro4 is already complete in CLI—proven foundation
- Validates the full platform concept with the simplest CPU
- Once Act 1 works in-browser, the pattern extends to all stages
- Keeps scope tight while delivering real learning value

### Phase 1: MVP (Act 1 - Micro4)

| Component | Requirement |
|-----------|-------------|
| Assembly Editor | Write Micro4 assembly with syntax highlighting |
| Assembler | Assemble code in browser (WASM or JS port) |
| Emulator | Run Micro4 programs (WASM compiled from cpu.c) |
| Debugger | Step through execution, view registers/memory |
| Visualizer | See gate-level circuit, animate signal flow |
| HDL View | View/edit Micro4 HDL definition |

**Explicitly NOT in MVP:**
- Micro8, Micro16, Micro32 stages
- FPGA export
- PWA offline mode
- Historical personas/role-play framing
- Homework/exercises system

### Phase 2: Complete Core Journey

- Micro8 stage (Act 2: Discovering Necessity)
- Micro16 stage (Act 3: Scaling Up)
- PWA offline support
- Progress persistence (localStorage/IndexedDB)
- Period-accurate constraints system

### Phase 3: Advanced Stages

- Micro32 stage (Act 4: The Real Machine)
- Micro32-P pipelined stage (Act 5)
- Micro32-S superscalar stage (Act 5)
- FPGA synthesis export pipeline

### Phase 4: Mastery & Contribution

- Custom microcontroller design toolkit
- Fab preparation tools
- Community sharing
- Educational materials for others

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| WASM compilation complexity | Start with Micro4 only—smallest codebase, proven working |
| Visualizer performance | 30fps target is conservative; Micro4 has ~425 gates |
| Browser compatibility | Firefox-first simplifies initial testing |
| Feature creep | MVP = Act 1 only. Everything else is explicitly Phase 2+ |
| Perfectionism | Ship when Micro4 journey works, iterate from there |

### MVP Success Criteria

The MVP is complete when you can:
1. Open the web app in Firefox
2. Write a Micro4 assembly program in the editor
3. Assemble it with one click
4. Step through execution in the debugger
5. See the circuit visualization animate
6. Experience "I built this" feeling entirely in-browser

---

## Functional Requirements

### Code Editing

- **FR1:** User can write Micro4 assembly code in a text editor
- **FR2:** User can see syntax highlighting for Micro4 assembly (opcodes, labels, comments)
- **FR3:** User can see line numbers in the editor
- **FR4:** User can undo/redo edits

### Assembly & Compilation

- **FR5:** User can assemble their code with a single action
- **FR6:** User can see assembly errors with line numbers and descriptions
- **FR7:** User can see the assembled binary output (hex view)
- **FR8:** System validates assembly syntax before execution

### Program Execution

- **FR9:** User can load assembled program into the Micro4 emulator
- **FR10:** User can run the program continuously until halt
- **FR11:** User can stop a running program
- **FR12:** User can reset the emulator to initial state

### Debugging

- **FR13:** User can step through program execution one instruction at a time
- **FR14:** User can view current register values (PC, Accumulator)
- **FR15:** User can view current flag state (Zero flag)
- **FR16:** User can view memory contents
- **FR17:** User can set breakpoints at specific addresses
- **FR18:** User can run until breakpoint is hit
- **FR19:** User can see which instruction is currently executing (highlighted in editor)

### Circuit Visualization

- **FR20:** User can view the Micro4 CPU circuit as a gate-level diagram
- **FR21:** User can see signal values on wires (high/low)
- **FR22:** User can see signal propagation animated during execution
- **FR23:** User can zoom and pan the circuit view
- **FR24:** User can identify components by hovering (tooltips)

### HDL Management

- **FR25:** User can view the Micro4 HDL definition
- **FR26:** User can edit the HDL definition
- **FR27:** User can reload the visualizer after HDL changes
- **FR28:** System validates HDL syntax

### Test Programs

- **FR29:** User can load example programs (from programs/ directory)
- **FR30:** User can see program descriptions/comments

### Application State

- **FR31:** User can save current work to browser storage
- **FR32:** User can restore previous session on return
- **FR33:** User can export assembly code as file
- **FR34:** User can import assembly code from file

---

## Non-Functional Requirements

### Performance

- **NFR1:** Visualizer renders at minimum 30 frames per second during signal animation
- **NFR2:** Single instruction step executes in under 1 millisecond
- **NFR3:** Code assembly completes in under 500 milliseconds for programs up to 256 instructions
- **NFR4:** Initial application load completes in under 5 seconds on broadband connection
- **NFR5:** Circuit visualization remains responsive with up to 500 gates displayed

### Browser Compatibility

- **NFR6:** Application functions fully in Firefox (latest stable release)
- **NFR7:** Application functions in Chrome (best effort, not primary target)
- **NFR8:** No browser plugins or extensions required
- **NFR9:** WebAssembly modules load and execute correctly in supported browsers

### Usability

- **NFR10:** User can complete basic assemble-run-debug cycle without documentation
- **NFR11:** Error messages include actionable information (line numbers, descriptions)
- **NFR12:** All primary actions accessible via keyboard shortcuts
- **NFR13:** Visual feedback provided within 100ms of user action
- **NFR14:** Undo available for destructive editor actions

### Data Integrity

- **NFR15:** Unsaved work prompts user before navigation away
- **NFR16:** Browser storage persists across sessions until explicitly cleared
- **NFR17:** Exported files are valid and re-importable
