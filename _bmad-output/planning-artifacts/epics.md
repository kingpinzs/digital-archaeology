---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: 'complete'
completedAt: '2026-01-20'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# Digital Archaeology - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Digital Archaeology, decomposing the requirements from the PRD, Architecture, and UX Design Specification into implementable stories.

## Requirements Inventory

### Functional Requirements

**Code Editing (FR1-FR4)**
- FR1: User can write Micro4 assembly code in a text editor
- FR2: User can see syntax highlighting for Micro4 assembly (opcodes, labels, comments)
- FR3: User can see line numbers in the editor
- FR4: User can undo/redo edits

**Assembly & Compilation (FR5-FR8)**
- FR5: User can assemble their code with a single action
- FR6: User can see assembly errors with line numbers and descriptions
- FR7: User can see the assembled binary output (hex view)
- FR8: System validates assembly syntax before execution

**Program Execution (FR9-FR12)**
- FR9: User can load assembled program into the Micro4 emulator
- FR10: User can run the program continuously until halt
- FR11: User can stop a running program
- FR12: User can reset the emulator to initial state

**Debugging (FR13-FR19)**
- FR13: User can step through program execution one instruction at a time
- FR14: User can view current register values (PC, Accumulator)
- FR15: User can view current flag state (Zero flag)
- FR16: User can view memory contents
- FR17: User can set breakpoints at specific addresses
- FR18: User can run until breakpoint is hit
- FR19: User can see which instruction is currently executing (highlighted in editor)

**Circuit Visualization (FR20-FR24)**
- FR20: User can view the Micro4 CPU circuit as a gate-level diagram
- FR21: User can see signal values on wires (high/low)
- FR22: User can see signal propagation animated during execution
- FR23: User can zoom and pan the circuit view
- FR24: User can identify components by hovering (tooltips)

**HDL Management (FR25-FR28)**
- FR25: User can view the Micro4 HDL definition
- FR26: User can edit the HDL definition
- FR27: User can reload the visualizer after HDL changes
- FR28: System validates HDL syntax

**Test Programs (FR29-FR30)**
- FR29: User can load example programs (from programs/ directory)
- FR30: User can see program descriptions/comments

**Application State (FR31-FR34)**
- FR31: User can save current work to browser storage
- FR32: User can restore previous session on return
- FR33: User can export assembly code as file
- FR34: User can import assembly code from file

### Non-Functional Requirements

**Performance (NFR1-NFR5)**
- NFR1: Visualizer renders at minimum 30 frames per second during signal animation
- NFR2: Single instruction step executes in under 1 millisecond
- NFR3: Code assembly completes in under 500 milliseconds for programs up to 256 instructions
- NFR4: Initial application load completes in under 5 seconds on broadband connection
- NFR5: Circuit visualization remains responsive with up to 500 gates displayed

**Browser Compatibility (NFR6-NFR9)**
- NFR6: Application functions fully in Firefox (latest stable release)
- NFR7: Application functions in Chrome (best effort, not primary target)
- NFR8: No browser plugins or extensions required
- NFR9: WebAssembly modules load and execute correctly in supported browsers

**Usability (NFR10-NFR14)**
- NFR10: User can complete basic assemble-run-debug cycle without documentation
- NFR11: Error messages include actionable information (line numbers, descriptions)
- NFR12: All primary actions accessible via keyboard shortcuts
- NFR13: Visual feedback provided within 100ms of user action
- NFR14: Undo available for destructive editor actions

**Data Integrity (NFR15-NFR17)**
- NFR15: Unsaved work prompts user before navigation away
- NFR16: Browser storage persists across sessions until explicitly cleared
- NFR17: Exported files are valid and re-importable

### Additional Requirements

**From Architecture - Starter Template & Project Setup:**
- Initialize project using `npm create vite@latest digital-archaeology-web -- --template vanilla-ts`
- Install dependencies: Tailwind CSS, PostCSS, autoprefixer, vite-plugin-wasm, vite-plugin-top-level-await, Monaco Editor
- Create feature folder structure as specified in Architecture document
- Configure Vite for WASM support

**From Architecture - WASM Integration:**
- Run Emscripten WASM modules in dedicated Web Worker
- Implement postMessage-based communication protocol (EmulatorCommand/EmulatorEvent types)
- Compile existing C emulators (cpu.c, assembler.c) to WASM via Emscripten
- Create EmulatorBridge class for Promise-based worker API

**From Architecture - State Management:**
- Implement Simple Store pattern (pub/sub) without external dependencies
- Define AppState type with cpu, editor, debugger, and ui sections
- Use tiered persistence: localStorage for settings, IndexedDB for projects

**From Architecture - Module Structure:**
- Organize code by feature folders: editor/, emulator/, visualizer/, debugger/, state/, story/, ui/
- Follow naming conventions: PascalCase for components, camelCase for utilities
- Implement typed interfaces for all data structures

**From Architecture - Deployment:**
- Deploy to GitHub Pages via GitHub Actions
- CI/CD pipeline: Emscripten build → Vite build → Deploy

**From UX - Two-Mode Interface:**
- Implement Story Mode with warm gold/copper theme, Crimson Text typography
- Implement Lab Mode with Dense Professional layout, cool blue accent
- Create seamless flip navigation between modes
- Story/Lab toggle in navigation bar and activity bar

**From UX - Story Mode Components:**
- Fixed navigation bar with progress dots and era badge
- "Your Role" floating panel showing user's character
- Chapter headers, scene settings, dialogue blocks
- Character cards with photos, bios, stats
- Choice cards for interactive story branching
- "Enter the Lab" transition button

**From UX - Lab Mode Components:**
- Three-panel closable layout: Code Editor | Circuit Visualizer | State Panel
- Full menu bar (File, Edit, View, Debug, Help)
- Activity bar with Story icon for quick return
- Challenge objectives section linking story goals to lab tasks
- Rich status bar with assembly status, PC, cycle count

**From UX - Rich Error Display:**
- Error type badges (SYNTAX_ERROR, MEMORY_ERROR, ARITHMETIC_WARNING)
- Full instruction context (type, opcode, operand types)
- Circuit path showing involved gates/components
- Signal values at point of error
- One-click fix suggestions

**From UX - Visual Foundation:**
- Dark theme with CSS custom properties (--da-* tokens)
- Signal colors: high=#00ff88, low=#3a3a3a
- Gate type colors for circuit visualization
- 4px-based spacing system
- JetBrains Mono / Fira Code for code, system sans-serif for UI

**From UX - Interaction Patterns:**
- Mouse-first interaction (keyboard shortcuts available but not required)
- Bidirectional code-circuit linking (click code → highlight gates, click gates → highlight code)
- Scroll-to-zoom, drag-to-pan for circuit navigation
- Hover-to-inspect for quick information

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 2 | Write assembly in text editor |
| FR2 | Epic 2 | Syntax highlighting |
| FR3 | Epic 2 | Line numbers |
| FR4 | Epic 2 | Undo/redo |
| FR5 | Epic 3 | Single-action assemble |
| FR6 | Epic 3 | Error display with line numbers |
| FR7 | Epic 3 | Binary output view |
| FR8 | Epic 3 | Syntax validation |
| FR9 | Epic 4 | Load program into emulator |
| FR10 | Epic 4 | Run until halt |
| FR11 | Epic 4 | Stop running program |
| FR12 | Epic 4 | Reset emulator |
| FR13 | Epic 5 | Step execution |
| FR14 | Epic 5 | View registers |
| FR15 | Epic 5 | View flags |
| FR16 | Epic 5 | View memory |
| FR17 | Epic 5 | Set breakpoints |
| FR18 | Epic 5 | Run to breakpoint |
| FR19 | Epic 5 | Current instruction highlight |
| FR20 | Epic 6 | View circuit diagram |
| FR21 | Epic 6 | Signal values on wires |
| FR22 | Epic 6 | Signal animation |
| FR23 | Epic 6 | Zoom and pan |
| FR24 | Epic 6 | Component tooltips |
| FR25 | Epic 7 | View HDL |
| FR26 | Epic 7 | Edit HDL |
| FR27 | Epic 7 | Reload visualizer |
| FR28 | Epic 7 | Validate HDL |
| FR29 | Epic 8 | Load example programs |
| FR30 | Epic 8 | See program descriptions |
| FR31 | Epic 9 | Save to browser storage |
| FR32 | Epic 9 | Restore session |
| FR33 | Epic 9 | Export code |
| FR34 | Epic 9 | Import code |

## Epic List

### Epic 1: Project Foundation & App Shell
Development environment ready with Lab Mode layout functional. Initialize Vite project with TypeScript, configure WASM plugins, Tailwind CSS, Monaco Editor, create feature folder structure, implement 3-panel Lab Mode layout with resizable panels, toolbar, menu bar, status bar, theme system with CSS custom properties.
**FRs covered:** Foundation for all FRs

### Epic 2: Assembly Code Editor
Users can write and edit Micro4 assembly code with full editor features. Monaco editor integration, Micro4 syntax highlighting, line numbers, undo/redo, cursor position display.
**FRs covered:** FR1, FR2, FR3, FR4

### Epic 3: Code Assembly & Error Handling
Users can assemble code and get rich, actionable error feedback. WASM assembler, Web Worker, single-action assemble, rich error display with type badges, suggestions, one-click fixes, binary output view.
**FRs covered:** FR5, FR6, FR7, FR8

### Epic 4: Program Execution
Users can run Micro4 programs with full execution control. WASM emulator, Web Worker with EmulatorBridge, load/run/stop/reset controls, speed control slider.
**FRs covered:** FR9, FR10, FR11, FR12

### Epic 5: Debugging & State Inspection
Users can debug programs step-by-step with full state visibility. Step execution, step back, register view, flag display, memory view, breakpoints, runtime error display with circuit context.
**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR18, FR19

### Epic 6: Circuit Visualization
Users can see the CPU circuit animate and understand how instructions execute. Canvas renderer, gate/wire rendering, signal animation at 30fps, zoom/pan, tooltips, bidirectional code-circuit linking.
**FRs covered:** FR20, FR21, FR22, FR23, FR24

### Epic 7: HDL Editor & Management
Users can view, edit, validate, and reload HDL definitions. HDL viewer, editor, syntax highlighting, validation, reload visualizer.
**FRs covered:** FR25, FR26, FR27, FR28

### Epic 8: Example Programs
Users can browse and load example programs to learn. Example browser, load from programs/, display descriptions, quick-load.
**FRs covered:** FR29, FR30

### Epic 9: Work Persistence
Users can save work, resume sessions, and share files. localStorage/IndexedDB, auto-save, session restore, export/import .asm/.bin files, unsaved work warning.
**FRs covered:** FR31, FR32, FR33, FR34, NFR15, NFR16, NFR17

### Epic 10: Story Mode Experience ⚡ PARALLEL
Users experience immersive narrative providing context and motivation. Story/Lab toggle, Story Mode UI with character cards, dialogue, choices, challenge objectives in Lab Mode, era badges, progress tracking.
**FRs covered:** UX Story Mode requirements

### Epic 11: Multi-Stage Architecture
Platform supports multiple CPU stages with stage switching. Stage selector UI, stage-specific syntax/WASM/circuits/examples, unified EmulatorBridge, URL routing.
**FRs covered:** Multi-stage foundation

### Epic 12: Micro8 Stage (Act 2: Discovering Necessity)
Users experience 8-bit CPU with registers, stack, and subroutines. Micro8 WASM emulator/assembler, 8 registers, stack view, 64KB address space, CALL/RET visualization, Micro8 examples and HDL.
**FRs covered:** Micro8 stage requirements

### Epic 13: Micro16 Stage (Act 3: Scaling Up)
Users experience 16-bit CPU with segmentation and hardware multiply. Micro16 WASM tools, segment registers, 1MB address space, hardware multiply, interrupts, Micro16 examples and HDL.
**FRs covered:** Micro16 stage requirements

### Epic 14: Micro32 Stage (Act 4: The Real Machine)
Users experience 32-bit CPU with protected mode and paging. Design ISA, implement micro32/ tools, protected mode, paging visualization, 4GB address space, Micro32 examples and HDL.
**FRs covered:** Micro32 stage requirements

### Epic 15: Micro32-P Pipeline Stage (Act 5a: Performance)
Users experience pipelined CPU with hazard detection. 5-stage pipeline visualization, hazard detection, stalls/bubbles, forwarding paths, FPU, pipeline timing diagrams.
**FRs covered:** Micro32-P stage requirements

### Epic 16: Micro32-S Superscalar Stage (Act 5b: Mastery)
Users experience superscalar CPU with branch prediction. Multiple execution units, issue queue, out-of-order execution, register renaming, reorder buffer, branch prediction visualization.
**FRs covered:** Micro32-S stage requirements

### Epic 17: PWA & Offline Support
Users can use the application offline after initial load. Service worker, cache strategy, offline indicator, install prompt, app manifest.
**FRs covered:** PWA requirements

### Epic 18: Period-Accurate Constraints System
Users experience authentic limitations that drive discovery. Constraint definitions per stage, memory/instruction limits, educational error messages, experimentation mode.
**FRs covered:** Period-accurate constraints

### Epic 19: Progress & Journey Tracking
Users see their progress through the learning journey. Discovery tracking, act completion, milestone achievements, progress visualization, stage unlock system, statistics dashboard.
**FRs covered:** Journey tracking requirements

### Epic 20: Educational Content System
Users can access literature, tutorials, and curated multimedia resources. 20 articles, categories, contextual help, reading progress, hint system, technical deep-dives, plus curated documentaries, TV shows, YouTube channels, books, museums, and online simulators organized by computing era.
**FRs covered:** Literature requirements, Multimedia resources (from IMMERSIVE_PLATFORM_PLAN.md)

### Epic 21: Homework & Exercises System
Users can practice with structured challenges. Exercises per stage (5-12 each), starter code, validation, progressive hints, solution reveal, completion tracking.
**FRs covered:** Homework requirements

### Epic 22: FPGA Export Pipeline
Users can export designs for real hardware synthesis. Verilog/VHDL export, pin mapping, target board selection, synthesis constraints, build scripts, deployment guides.
**FRs covered:** FPGA export requirements

### Epic 23: Custom Microcontroller Toolkit
Users can design their own CPU architectures. ISA designer, instruction encoding, register file, ALU operations, memory map, custom HDL/assembler/emulator generation.
**FRs covered:** Custom microcontroller requirements

### Epic 24: Fab Preparation Tools
Users can prepare designs for potential fabrication. DRC integration, process node selection, timing/power/area analysis, fab-ready export.
**FRs covered:** Fab preparation requirements

### Epic 25: Community & Sharing
Users can share designs and learn from others. Design export/import, gallery browser, profiles, comments, forking, version history.
**FRs covered:** Community sharing requirements

---

## Epic 1: Project Foundation & App Shell

**Goal:** Development environment ready with Lab Mode layout functional

### Story 1.1: Initialize Vite Project with TypeScript

As a user,
I want the application to load quickly in my browser,
So that I can start learning CPU architecture without waiting.

**Acceptance Criteria:**

**Given** I navigate to the application URL
**When** the page loads
**Then** the application shell appears within 5 seconds
**And** no console errors are displayed
**And** the page is responsive and interactive

**Technical Implementation Notes:**
- Initialize Vite project with vanilla-ts template
- Project must compile without errors
- `npm run dev` starts the development server

---

### Story 1.2: Configure Build Dependencies

As a user,
I want the application to support code editing and CPU emulation,
So that I can write assembly and run it in the browser.

**Acceptance Criteria:**

**Given** the application is loaded
**When** I interact with the interface
**Then** the code editor is responsive and functional
**And** WebAssembly modules load without errors
**And** styles render correctly with the design system

**Technical Implementation Notes:**
- Install tailwindcss, postcss, autoprefixer
- Install vite-plugin-wasm, vite-plugin-top-level-await
- Install monaco-editor
- Configure vite.config.ts with WASM plugins
- Create tailwind.config.js with custom theme tokens

---

### Story 1.3: Create Feature Folder Structure

As a user,
I want the application to be well-organized and maintainable,
So that features work reliably and can be extended over time.

**Acceptance Criteria:**

**Given** the application codebase
**When** new features are added
**Then** code is modular and isolated by feature
**And** imports resolve correctly across the application
**And** public assets (WASM, programs, circuits) are accessible

**Technical Implementation Notes:**
- Create src/ folders: editor/, emulator/, visualizer/, debugger/, state/, story/, ui/, types/, utils/
- Add index.ts barrel exports to each folder
- Create public/ folders: wasm/, programs/, circuits/, story/
- Configure TypeScript path aliases in tsconfig.json

---

### Story 1.4: Implement CSS Theme System

As a user,
I want consistent visual styling across the application,
So that the interface feels cohesive and professional.

**Acceptance Criteria:**

**Given** the application is loaded
**When** I view any component
**Then** colors and styles are consistent throughout
**And** the dark theme is applied correctly
**And** signal colors (high/low) are clearly distinguishable

**Technical Implementation Notes:**
- Define --da-* CSS variables in main.css (bg, text, signal, gate colors)
- Create lab-mode.css with Lab Mode specific overrides
- Create story-mode.css with Story Mode warm gold theme
- Implement theme.ts with theme switching logic
- Support "lab-mode" and "story-mode" classes on HTML element

---

### Story 1.5: Create Basic App Shell with 3-Panel Layout

As a user,
I want to see the main application layout,
So that I understand where the editor, circuit, and state panels will be.

**Acceptance Criteria:**

**Given** the application loads in the browser
**When** I view the main interface
**Then** I see a toolbar area at the top (48px height)
**And** I see a status bar at the bottom (24px height)
**And** I see three panels: left (code), center (circuit), right (state)
**And** panels are arranged using CSS Grid
**And** the layout fills the viewport height
**And** panels have visible borders and background colors from theme

---

### Story 1.6: Implement Resizable Panel System

As a user,
I want to resize the panels by dragging dividers,
So that I can customize my workspace layout.

**Acceptance Criteria:**

**Given** the 3-panel layout is displayed
**When** I drag the divider between panels
**Then** the panels resize smoothly
**And** minimum panel widths are enforced (250px code, 400px circuit, 200px state)
**And** the cursor changes to resize cursor on hover
**And** panel sizes persist visually during resize
**And** resize stops when I release the mouse

---

### Story 1.7: Create Toolbar Component

As a user,
I want a toolbar with action buttons,
So that I can access primary actions like Assemble, Run, Step.

**Acceptance Criteria:**

**Given** the application is loaded
**When** I view the toolbar
**Then** I see a File dropdown menu trigger
**And** I see Assemble, Run, Pause, Reset, Step buttons (disabled initially)
**And** I see a speed control slider
**And** I see Settings (⚙) and Help (?) buttons
**And** buttons are styled according to the design system
**And** hover states are visible

---

### Story 1.8: Create Menu Bar Component

As a user,
I want a menu bar with standard menus,
So that I can access all application functions.

**Acceptance Criteria:**

**Given** the application is loaded
**When** I view the menu bar
**Then** I see menus: File, Edit, View, Debug, Help
**And** I see Story/Lab toggle buttons at the left
**And** clicking a menu shows a dropdown (placeholder items for now)
**And** menus close when clicking outside
**And** menus are styled according to the design system

---

### Story 1.9: Create Status Bar Component

As a user,
I want a status bar showing current state,
So that I can see assembly status, PC value, and other info at a glance.

**Acceptance Criteria:**

**Given** the application is loaded
**When** I view the status bar
**Then** I see placeholder sections for: assembly status, PC value, instruction, cycle count, speed
**And** the status bar is 24px height
**And** text uses monospace font for values
**And** the bar is styled according to the design system

---

### Story 1.10: Create Panel Header Components

As a user,
I want each panel to have a header with title and close button,
So that I can identify panels and optionally hide them.

**Acceptance Criteria:**

**Given** the 3-panel layout is displayed
**When** I view a panel
**Then** I see a header with the panel title (CODE, CIRCUIT, STATE)
**And** I see a close [×] button
**And** clicking close hides the panel
**And** the layout adjusts when a panel is hidden
**And** there is a way to restore hidden panels (View menu)

---

## Epic 2: Assembly Code Editor

**Goal:** Users can write and edit Micro4 assembly code with full editor features

**FRs covered:** FR1, FR2, FR3, FR4

### Story 2.1: Integrate Monaco Editor

As a user,
I want a professional code editor in the code panel,
So that I have a familiar editing experience.

**Acceptance Criteria:**

**Given** the application is loaded
**When** I view the code panel
**Then** I see a Monaco editor instance filling the panel
**And** the editor has a dark theme matching the application
**And** I can type text in the editor
**And** the editor resizes when the panel resizes

---

### Story 2.2: Implement Micro4 Syntax Highlighting

As a user,
I want Micro4 assembly syntax highlighted,
So that I can easily read and understand my code.

**Acceptance Criteria:**

**Given** I am typing in the code editor
**When** I write Micro4 assembly code
**Then** opcodes (LDA, STA, ADD, SUB, etc.) are highlighted in one color
**And** labels (ending with :) are highlighted in another color
**And** comments (starting with ;) are highlighted in a muted color
**And** hex values (0x...) are highlighted distinctly
**And** decimal values are highlighted distinctly
**And** directives (.org, .byte) are highlighted

---

### Story 2.3: Display Line Numbers

As a user,
I want to see line numbers in the editor,
So that I can reference specific lines when debugging.

**Acceptance Criteria:**

**Given** the Monaco editor is displayed
**When** I view the code panel
**Then** line numbers are visible in the gutter
**And** line numbers update as I add or remove lines
**And** line numbers are styled to be readable but not distracting
**And** the current line number is highlighted

---

### Story 2.4: Enable Undo/Redo Functionality

As a user,
I want to undo and redo my edits,
So that I can recover from mistakes.

**Acceptance Criteria:**

**Given** I have made edits in the editor
**When** I press Ctrl+Z
**Then** the last edit is undone
**And** when I press Ctrl+Y or Ctrl+Shift+Z
**Then** the undone edit is redone
**And** multiple undo/redo operations work in sequence
**And** undo history is maintained during the session

---

### Story 2.5: Display Cursor Position in Status Bar

As a user,
I want to see my cursor position,
So that I know where I am in the code.

**Acceptance Criteria:**

**Given** I am editing code
**When** I move the cursor
**Then** the status bar shows "Ln X, Col Y" with current position
**And** the position updates in real-time as I type or navigate
**And** the display uses monospace font

---

### Story 2.6: Implement Editor Keyboard Shortcuts

As a user,
I want standard keyboard shortcuts,
So that I can edit code efficiently.

**Acceptance Criteria:**

**Given** I am in the editor
**When** I use keyboard shortcuts
**Then** Ctrl+A selects all text
**And** Ctrl+C copies selected text
**And** Ctrl+V pastes clipboard content
**And** Ctrl+X cuts selected text
**And** Ctrl+F opens find dialog
**And** Ctrl+H opens find and replace
**And** Tab indents selected lines
**And** Shift+Tab unindents selected lines

---

## Epic 3: Code Assembly & Error Handling

**Goal:** Users can assemble code and get rich, actionable error feedback

**FRs covered:** FR5, FR6, FR7, FR8

### Story 3.1: Compile Assembler to WASM

As a developer,
I want the Micro4 assembler compiled to WebAssembly,
So that assembly can run in the browser.

**Acceptance Criteria:**

**Given** the existing src/micro4/assembler.c source code
**When** I run the Emscripten build script
**Then** micro4-asm.wasm and micro4-asm.js are generated in public/wasm/
**And** the WASM module exports an assemble function
**And** the module can be loaded in a Web Worker
**And** the build script is documented in wasm-build/build.sh

---

### Story 3.2: Create Assembler Web Worker

As a developer,
I want the assembler to run in a Web Worker,
So that assembly doesn't block the UI thread.

**Acceptance Criteria:**

**Given** the WASM assembler module is built
**When** the application initializes
**Then** a Web Worker is created for the assembler
**And** the worker loads the WASM module
**And** the worker responds to ASSEMBLE messages
**And** the worker returns assembly results or errors via postMessage

---

### Story 3.3: Implement Assemble Button

As a user,
I want to assemble my code with one click,
So that I can quickly test my programs.

**Acceptance Criteria:**

**Given** I have code in the editor
**When** I click the Assemble button
**Then** the code is sent to the assembler worker
**And** a loading indicator appears briefly
**And** on success, the status bar shows "✓ Assembled: X bytes"
**And** the Run, Step, and Reset buttons become enabled
**And** Ctrl+Enter also triggers assembly

---

### Story 3.4: Display Assembly Errors with Line Numbers

As a user,
I want to see detailed error information,
So that I can fix problems in my code.

**Acceptance Criteria:**

**Given** my code has syntax errors
**When** I click Assemble
**Then** an error panel appears below the editor
**And** each error shows the line number and column
**And** each error shows a descriptive message
**And** the editor highlights the error line with a red marker
**And** clicking an error jumps to that line in the editor

---

### Story 3.5: Implement Rich Error Display

As a user,
I want errors to show type, context, and suggestions,
So that I understand what went wrong and how to fix it.

**Acceptance Criteria:**

**Given** an assembly error occurs
**When** I view the error panel
**Then** I see the error type badge (SYNTAX_ERROR, VALUE_ERROR, CONSTRAINT_ERROR)
**And** I see a code snippet showing the error location
**And** I see a suggestion if available (e.g., "Did you mean 'LDA'?")
**And** I see a "Fix" button for auto-fixable errors
**And** clicking "Fix" applies the suggestion and re-assembles

---

### Story 3.6: Show Binary Output View

As a user,
I want to see the assembled binary,
So that I can understand the machine code.

**Acceptance Criteria:**

**Given** assembly succeeds
**When** I view the binary output
**Then** I see a hex dump of the assembled program
**And** bytes are grouped in rows of 16
**And** addresses are shown on the left
**And** the view is scrollable for larger programs
**And** the binary output can be toggled on/off

---

### Story 3.7: Validate Syntax Before Execution

As a user,
I want syntax validated before running,
So that I don't run invalid programs.

**Acceptance Criteria:**

**Given** I have code that hasn't been assembled
**When** I try to click Run or Step
**Then** the buttons remain disabled
**And** a tooltip explains "Assemble first"
**And** after successful assembly, the buttons enable
**And** if I edit code after assembly, buttons disable until re-assembly

---

## Epic 4: Program Execution

**Goal:** Users can run Micro4 programs with full execution control

**FRs covered:** FR9, FR10, FR11, FR12

### Story 4.1: Compile Emulator to WASM

As a developer,
I want the Micro4 CPU emulator compiled to WebAssembly,
So that programs can run in the browser.

**Acceptance Criteria:**

**Given** the existing src/micro4/cpu.c source code
**When** I run the Emscripten build script
**Then** micro4-cpu.wasm and micro4-cpu.js are generated in public/wasm/
**And** the WASM module exports cpu_init, cpu_step, cpu_get_state functions
**And** the module can be loaded in a Web Worker
**And** the build process is documented

---

### Story 4.2: Create Emulator Web Worker

As a developer,
I want the emulator to run in a Web Worker,
So that execution doesn't block the UI.

**Acceptance Criteria:**

**Given** the WASM emulator module is built
**When** the application initializes
**Then** a Web Worker is created for the emulator
**And** the worker loads the WASM module
**And** the worker responds to LOAD_PROGRAM, STEP, RUN, STOP, RESET, GET_STATE messages
**And** the worker sends STATE_UPDATE, HALTED, ERROR, BREAKPOINT_HIT events

---

### Story 4.3: Implement EmulatorBridge Class

As a developer,
I want a Promise-based API for the emulator,
So that UI code can easily interact with the worker.

**Acceptance Criteria:**

**Given** the emulator worker is running
**When** I use EmulatorBridge
**Then** bridge.loadProgram(binary) returns a Promise
**And** bridge.step() returns a Promise with new CPU state
**And** bridge.run(speed) starts continuous execution
**And** bridge.stop() pauses execution
**And** bridge.reset() resets to initial state
**And** bridge.onStateUpdate(callback) subscribes to state changes

---

### Story 4.4: Implement Load Program

As a user,
I want to load my assembled program into the emulator,
So that I can run it.

**Acceptance Criteria:**

**Given** assembly succeeds
**When** the program is assembled
**Then** the binary is automatically loaded into the emulator
**And** the emulator is reset to initial state
**And** PC is set to 0
**And** memory contains the loaded program
**And** status bar shows "Loaded: X bytes"

---

### Story 4.5: Implement Run Button

As a user,
I want to run my program continuously,
So that I can see it execute to completion.

**Acceptance Criteria:**

**Given** a program is loaded
**When** I click Run
**Then** the emulator executes instructions continuously
**And** the Run button changes to Pause
**And** the UI updates showing execution progress
**And** execution continues until HLT or Stop
**And** the speed slider controls execution rate (1Hz to 1000Hz)

---

### Story 4.6: Implement Stop Button

As a user,
I want to stop a running program,
So that I can pause and inspect state.

**Acceptance Criteria:**

**Given** a program is running
**When** I click Pause/Stop
**Then** execution pauses immediately
**And** the button changes back to Run
**And** current state is displayed
**And** I can resume with Run or continue with Step

---

### Story 4.7: Implement Reset Button

As a user,
I want to reset the emulator,
So that I can run the program again from the start.

**Acceptance Criteria:**

**Given** a program has been running
**When** I click Reset
**Then** PC is set to 0
**And** Accumulator is cleared
**And** Flags are cleared
**And** Memory is reset to initial loaded state
**And** status bar shows "Reset"
**And** execution is stopped if running

---

### Story 4.8: Implement Speed Control

As a user,
I want to control execution speed,
So that I can watch slowly or run fast.

**Acceptance Criteria:**

**Given** a program is running
**When** I adjust the speed slider
**Then** execution speed changes in real-time
**And** speed range is 1Hz to 1000Hz
**And** current speed is shown (e.g., "10 Hz")
**And** speed persists across runs

---

## Epic 5: Debugging & State Inspection

**Goal:** Users can debug programs step-by-step with full state visibility

**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR18, FR19

### Story 5.1: Implement Step Execution

As a user,
I want to execute one instruction at a time,
So that I can understand program flow.

**Acceptance Criteria:**

**Given** a program is loaded and not running
**When** I click Step
**Then** exactly one instruction executes
**And** the CPU state updates
**And** the current instruction is highlighted in the editor
**And** F10 keyboard shortcut also triggers step

---

### Story 5.2: Implement Step Back

As a user,
I want to step backward through execution,
So that I can review what just happened.

**Acceptance Criteria:**

**Given** I have stepped through several instructions
**When** I click Step Back
**Then** the CPU state reverts to the previous instruction
**And** the editor highlights the previous instruction
**And** I can step back multiple times (up to history limit)
**And** stepping forward after stepping back continues from that point

---

### Story 5.3: Create Register View Panel

As a user,
I want to see register values,
So that I can understand CPU state.

**Acceptance Criteria:**

**Given** a program is loaded
**When** I view the State panel
**Then** I see a Registers section
**And** PC is displayed in hex and decimal
**And** Accumulator is displayed in hex and decimal
**And** changed values flash briefly with accent color
**And** values update after each step

---

### Story 5.4: Create Flags Display

As a user,
I want to see flag states,
So that I understand condition results.

**Acceptance Criteria:**

**Given** a program is loaded
**When** I view the State panel
**Then** I see a Flags section below registers
**And** Zero flag shows 0/1 with "clear"/"SET" label
**And** Carry flag shows 0/1 with "clear"/"SET" label
**And** SET flags are visually distinct (highlighted)
**And** flags update after each step

---

### Story 5.5: Create Memory View Panel

As a user,
I want to see memory contents,
So that I can inspect data and program.

**Acceptance Criteria:**

**Given** a program is loaded
**When** I view the Memory section
**Then** I see a scrollable hex dump of memory
**And** each row shows address, hex values, decimal, and ASCII
**And** the current PC address is highlighted
**And** changed cells are highlighted after each step
**And** I can scroll through all 256 bytes

---

### Story 5.6: Implement Jump to Address

As a user,
I want to jump to a specific memory address,
So that I can quickly find data.

**Acceptance Criteria:**

**Given** the memory view is displayed
**When** I enter an address in the "Jump to" field
**Then** the memory view scrolls to show that address
**And** hex values (0x10) and decimal (16) are accepted
**And** invalid addresses show an error
**And** Enter key triggers the jump

---

### Story 5.7: Highlight Current Instruction in Editor

As a user,
I want to see which line is executing,
So that I can follow program flow.

**Acceptance Criteria:**

**Given** a program is loaded
**When** I step through execution
**Then** the line containing the current instruction is highlighted
**And** the highlight color is the accent color
**And** the editor scrolls to keep the current line visible
**And** the highlight moves as PC changes

---

### Story 5.8: Implement Breakpoint Toggle

As a user,
I want to set breakpoints on lines,
So that I can stop at specific points.

**Acceptance Criteria:**

**Given** I am viewing the editor
**When** I click in the gutter next to a line number
**Then** a breakpoint marker (red dot) appears
**And** clicking again removes the breakpoint
**And** breakpoints are stored for the session
**And** breakpoint lines are listed in a Breakpoints section

---

### Story 5.9: Implement Run to Breakpoint

As a user,
I want to run until a breakpoint is hit,
So that I can skip to important code.

**Acceptance Criteria:**

**Given** breakpoints are set
**When** I click Run
**Then** execution continues until a breakpoint is reached
**And** execution pauses at the breakpoint
**And** the status shows "Breakpoint hit at 0xNN"
**And** I can continue with Run or Step

---

### Story 5.10: Display Rich Runtime Errors

As a user,
I want detailed error information for runtime errors,
So that I can understand and fix problems.

**Acceptance Criteria:**

**Given** a runtime error occurs (e.g., invalid memory access)
**When** I view the error
**Then** I see the error type (MEMORY_ERROR, ARITHMETIC_WARNING)
**And** I see the instruction context (PC, instruction, opcode)
**And** I see component context (which circuit component)
**And** I see relevant signal values
**And** I see buttons: View in Circuit, View in Code, Reset

---

## Epic 6: Circuit Visualization

**Goal:** Users can see the CPU circuit animate and understand how instructions execute

**FRs covered:** FR20, FR21, FR22, FR23, FR24

### Story 6.1: Create Canvas Circuit Renderer

As a user,
I want to see the CPU circuit diagram,
So that I can understand the hardware.

**Acceptance Criteria:**

**Given** the application is loaded
**When** I view the Circuit panel
**Then** I see a canvas element filling the panel
**And** the canvas has a dark background matching the theme
**And** the canvas resizes when the panel resizes
**And** the canvas is ready for rendering

---

### Story 6.2: Load and Parse Circuit Data

As a developer,
I want circuit data loaded from JSON,
So that the renderer knows what to draw.

**Acceptance Criteria:**

**Given** micro4-circuit.json exists in public/circuits/
**When** the application initializes
**Then** the circuit data is loaded and parsed
**And** gates are stored in a Map with their properties
**And** wires are stored with their connections
**And** the circuit is ready for rendering

---

### Story 6.3: Render Gates with Type Colors

As a user,
I want gates rendered with distinct colors,
So that I can identify different gate types.

**Acceptance Criteria:**

**Given** circuit data is loaded
**When** the circuit is rendered
**Then** AND gates are rendered in teal (#4ecdc4)
**And** OR gates are rendered in red (#ff6b6b)
**And** XOR gates are rendered in purple (#c44dff)
**And** NOT gates are rendered in yellow (#ffd93d)
**And** MUX gates are rendered in green (#6bcb77)
**And** REG (flip-flops) are rendered in blue (#4d96ff)
**And** gates are drawn with standard logic symbols

---

### Story 6.4: Render Wires with Signal States

As a user,
I want wires to show signal values,
So that I can trace data flow.

**Acceptance Criteria:**

**Given** the circuit is rendered
**When** signals have values
**Then** wires carrying 1 are bright green (#00ff88)
**And** wires carrying 0 are dim gray (#3a3a3a)
**And** wires with unknown values are orange (#ffaa00)
**And** wire colors update when signal values change

---

### Story 6.5: Animate Signal Propagation

As a user,
I want to see signals animate during execution,
So that I understand timing.

**Acceptance Criteria:**

**Given** I step through an instruction
**When** signals change
**Then** the signal animation plays at 30fps
**And** I can see values propagate through the circuit
**And** active gates pulse briefly
**And** the animation completes within 500ms per step

---

### Story 6.6: Implement Zoom Controls

As a user,
I want to zoom the circuit view,
So that I can see details or overview.

**Acceptance Criteria:**

**Given** the circuit is displayed
**When** I use zoom controls
**Then** scrolling the mouse wheel zooms in/out
**And** Fit button fits the entire circuit in view
**And** 100% button shows actual size
**And** zoom level is displayed (e.g., "75%")
**And** zoom range is 25% to 400%

---

### Story 6.7: Implement Pan Navigation

As a user,
I want to pan around the circuit,
So that I can view different areas.

**Acceptance Criteria:**

**Given** the circuit is zoomed in
**When** I drag the canvas
**Then** the view pans smoothly in the drag direction
**And** the cursor changes to grab/grabbing
**And** panning works with mouse drag
**And** panning is bounded to circuit extents

---

### Story 6.8: Show Component Tooltips

As a user,
I want tooltips on hover,
So that I can identify components.

**Acceptance Criteria:**

**Given** the circuit is displayed
**When** I hover over a gate
**Then** a tooltip appears showing gate type and ID
**And** the tooltip shows current output value
**And** the tooltip disappears when I move away
**And** hover also slightly highlights the gate

---

### Story 6.9: Implement Code-to-Circuit Linking

As a user,
I want clicking code to highlight related gates,
So that I understand the connection.

**Acceptance Criteria:**

**Given** a program is loaded
**When** I click on an instruction in the editor
**Then** the gates activated by that instruction highlight in the circuit
**And** the signal path for that instruction is emphasized
**And** clicking elsewhere clears the highlight

---

### Story 6.10: Implement Circuit-to-Code Linking

As a user,
I want clicking gates to highlight related code,
So that I understand what code uses them.

**Acceptance Criteria:**

**Given** the circuit is displayed
**When** I click on a gate
**Then** instructions that use that gate highlight in the editor
**And** the gate remains highlighted
**And** clicking elsewhere clears the highlight

---

### Story 6.11: Display Signal Values Panel

As a user,
I want to see key signal values,
So that I can understand bus states.

**Acceptance Criteria:**

**Given** a program is loaded
**When** I view the circuit panel
**Then** I see a Signals section showing key buses
**And** data_bus value is displayed
**And** addr_bus value is displayed
**And** alu_op is displayed
**And** control signals are displayed
**And** values update after each step

---

### Story 6.12: Show Breadcrumb Navigation

As a user,
I want to see my navigation path,
So that I know what level I'm viewing.

**Acceptance Criteria:**

**Given** the circuit is displayed
**When** I view the circuit panel header
**Then** I see a breadcrumb path (e.g., "CPU > ALU > Adder")
**And** clicking a breadcrumb zooms to that level
**And** the path updates when I navigate into components

---

## Epic 7: HDL Editor & Management

**Goal:** Users can view, edit, validate, and reload HDL definitions

**FRs covered:** FR25, FR26, FR27, FR28

### Story 7.1: Create HDL Viewer Panel

As a user,
I want to view HDL files,
So that I can understand circuit definitions.

**Acceptance Criteria:**

**Given** I select View > HDL Viewer
**When** the panel opens
**Then** I see the Micro4 HDL file content
**And** the viewer uses Monaco with read-only mode
**And** the viewer can be closed
**And** the HDL file loads from hdl/ directory

---

### Story 7.2: Implement HDL Syntax Highlighting

As a user,
I want HDL syntax highlighted,
So that I can read it easily.

**Acceptance Criteria:**

**Given** the HDL viewer is open
**When** I view the content
**Then** keywords (MODULE, INPUT, OUTPUT) are highlighted
**And** gate types (AND, OR, XOR) are highlighted
**And** wire names are highlighted
**And** comments are highlighted in muted color

---

### Story 7.3: Enable HDL Editing

As a user,
I want to edit HDL files,
So that I can modify circuit definitions.

**Acceptance Criteria:**

**Given** the HDL viewer is open
**When** I click an "Edit" toggle
**Then** the viewer becomes editable
**And** I can modify the HDL content
**And** unsaved changes are indicated
**And** I can save changes

---

### Story 7.4: Implement HDL Validation

As a user,
I want HDL syntax validated,
So that I know if my changes are valid.

**Acceptance Criteria:**

**Given** I am editing HDL
**When** I save or click Validate
**Then** the HDL is parsed and validated
**And** syntax errors are shown with line numbers
**And** valid HDL shows success message
**And** errors are highlighted in the editor

---

### Story 7.5: Reload Visualizer After HDL Changes

As a user,
I want to reload the circuit after HDL changes,
So that I see my modifications.

**Acceptance Criteria:**

**Given** I have edited and saved HDL
**When** I click "Reload Circuit"
**Then** the HDL is re-parsed
**And** the circuit data is regenerated
**And** the visualizer displays the updated circuit
**And** any errors are displayed if HDL is invalid

---

## Epic 8: Example Programs

**Goal:** Users can browse and load example programs to learn

**FRs covered:** FR29, FR30

### Story 8.1: Create Example Browser

As a user,
I want to browse example programs,
So that I can find programs to learn from.

**Acceptance Criteria:**

**Given** I click File > Examples
**When** the submenu opens
**Then** I see a list of example programs
**And** each shows the program name
**And** programs are categorized (arithmetic, loops, etc.)
**And** clicking a program loads it

---

### Story 8.2: Load Example Programs

As a user,
I want to load an example with one click,
So that I can quickly start learning.

**Acceptance Criteria:**

**Given** I click on an example program
**When** the program loads
**Then** the example code appears in the editor
**And** any existing unsaved code prompts for confirmation
**And** the status shows which example is loaded
**And** I can immediately assemble and run

---

### Story 8.3: Display Program Descriptions

As a user,
I want to see what each example does,
So that I can choose the right one.

**Acceptance Criteria:**

**Given** I hover over an example in the menu
**When** the tooltip appears
**Then** I see a description of the program
**And** I see what concepts it demonstrates
**And** I see estimated complexity/difficulty

---

### Story 8.4: Show Program Comments

As a user,
I want to see comments in example code,
So that I understand how it works.

**Acceptance Criteria:**

**Given** an example is loaded
**When** I view the code
**Then** comments are visible and highlighted
**And** the header comment explains the program purpose
**And** inline comments explain key sections
**And** comments use syntax highlighting

---

## Epic 9: Work Persistence

**Goal:** Users can save work, resume sessions, and share files

**FRs covered:** FR31, FR32, FR33, FR34, NFR15, NFR16, NFR17

### Story 9.1: Implement Local Storage for Settings

As a user,
I want my settings saved automatically,
So that my preferences persist.

**Acceptance Criteria:**

**Given** I change a setting (theme, speed, panel sizes)
**When** I reload the application
**Then** my settings are restored
**And** settings are stored in localStorage
**And** settings include: theme, speed, panel sizes, editor options

---

### Story 9.2: Implement IndexedDB for Projects

As a user,
I want my code saved automatically,
So that I don't lose work.

**Acceptance Criteria:**

**Given** I write code in the editor
**When** I pause typing for 2 seconds
**Then** the code is auto-saved to IndexedDB
**And** a "Saved" indicator appears briefly
**And** the save includes: code, breakpoints, cursor position

---

### Story 9.3: Restore Previous Session

As a user,
I want my previous session restored,
So that I can continue where I left off.

**Acceptance Criteria:**

**Given** I have previous work saved
**When** I open the application
**Then** my last code is loaded in the editor
**And** my breakpoints are restored
**And** my cursor position is restored
**And** a welcome message shows "Session restored"

---

### Story 9.4: Export Assembly Code

As a user,
I want to export my code as a file,
So that I can share or backup my work.

**Acceptance Criteria:**

**Given** I have code in the editor
**When** I click File > Export > Assembly (.asm)
**Then** a file download dialog appears
**And** the file contains my code
**And** the filename defaults to "program.asm"
**And** the file is valid and re-importable

---

### Story 9.5: Export Binary File

As a user,
I want to export the assembled binary,
So that I can use it elsewhere.

**Acceptance Criteria:**

**Given** I have assembled code
**When** I click File > Export > Binary (.bin)
**Then** a file download dialog appears
**And** the file contains the assembled binary
**And** the filename defaults to "program.bin"

---

### Story 9.6: Import Assembly Code

As a user,
I want to import assembly files,
So that I can work on existing code.

**Acceptance Criteria:**

**Given** I click File > Import
**When** I select a .asm file
**Then** the file content loads into the editor
**And** I am warned if current work is unsaved
**And** the status shows which file was imported
**And** invalid files show an error

---

### Story 9.7: Implement Unsaved Work Warning

As a user,
I want to be warned before losing unsaved work,
So that I don't accidentally lose changes.

**Acceptance Criteria:**

**Given** I have unsaved changes
**When** I try to close the tab or load a different file
**Then** a confirmation dialog appears
**And** I can choose to Save, Don't Save, or Cancel
**And** the dialog shows what will be lost
**And** browser beforeunload is also handled

---

### Story 9.8: Create File Menu Integration

As a user,
I want file operations in the menu,
So that I can access them easily.

**Acceptance Criteria:**

**Given** I click the File menu
**When** the menu opens
**Then** I see New, Open, Save, Save As options
**And** I see Export submenu (Assembly, Binary)
**And** I see Import option
**And** keyboard shortcuts are shown (Ctrl+N, Ctrl+O, Ctrl+S)
**And** options are enabled/disabled appropriately

---

## Epic 10: Story Mode Experience ⚡ PARALLEL

**Goal:** Users experience immersive narrative providing context and motivation

**FRs covered:** UX Story Mode requirements

### Story 10.1: Implement Story/Lab Mode Toggle

As a user,
I want to switch between Story and Lab modes,
So that I can experience both narrative and hands-on learning.

**Acceptance Criteria:**

**Given** I am in either Story or Lab mode
**When** I click the Story/Lab toggle buttons
**Then** the view switches to the selected mode
**And** toggle buttons appear in the navigation bar
**And** the transition is smooth (fade or slide)
**And** my position in each mode is preserved

---

### Story 10.2: Create Story Mode Layout

As a user,
I want a distinct Story Mode interface,
So that I feel immersed in the narrative.

**Acceptance Criteria:**

**Given** I am in Story Mode
**When** I view the interface
**Then** I see a warm gold/copper color theme
**And** I see a fixed navigation bar at top
**And** I see the main story content area
**And** I see the "Your Role" panel on the left (desktop)
**And** the layout uses Crimson Text serif font for narrative

---

### Story 10.3: Create Fixed Navigation Bar

As a user,
I want a navigation bar that stays visible,
So that I can always access controls.

**Acceptance Criteria:**

**Given** I am in Story Mode
**When** I scroll the content
**Then** the navigation bar stays fixed at the top
**And** the bar shows: logo, Story/Lab toggle, progress dots, era badge
**And** the bar shows Save and Journal buttons
**And** the bar is styled with the story theme

---

### Story 10.4: Create "Your Role" Panel

As a user,
I want to see my character information,
So that I feel connected to the story.

**Acceptance Criteria:**

**Given** I am in Story Mode on desktop
**When** I view the left side
**Then** I see a "Your Role" floating panel
**And** the panel shows character name and title
**And** the panel shows era, location, experience
**And** the panel shows "Discoveries Made" badges
**And** the panel hides on smaller screens (<1200px)

---

### Story 10.5: Create Chapter Header Component

As a user,
I want to see chapter information,
So that I know where I am in the story.

**Acceptance Criteria:**

**Given** I am viewing a story chapter
**When** I look at the top of the content
**Then** I see the Act number and year
**And** I see the chapter title
**And** I see a subtitle describing the chapter theme
**And** the text uses serif typography

---

### Story 10.6: Create Scene Setting Component

As a user,
I want to see scene descriptions,
So that I feel the atmosphere.

**Acceptance Criteria:**

**Given** a scene has a setting description
**When** I view the scene
**Then** I see a styled "Setting" box
**And** the box has a gold border accent
**And** the text is in italics
**And** the background has a subtle gradient

---

### Story 10.7: Create Character Card Component

As a user,
I want to meet characters in the story,
So that the narrative feels real.

**Acceptance Criteria:**

**Given** a character is introduced
**When** I view the character card
**Then** I see an avatar/photo placeholder
**And** I see the character name in gold accent
**And** I see their title in uppercase
**And** I see a bio (2-3 sentences)
**And** I see key stats (expertise, years)

---

### Story 10.8: Create Dialogue Block Component

As a user,
I want to see character dialogue,
So that the story comes alive.

**Acceptance Criteria:**

**Given** a character speaks
**When** I view the dialogue
**Then** I see a left border in copper accent
**And** I see the speaker name in uppercase
**And** I see the dialogue in serif font
**And** dialogue is visually distinct from narration

---

### Story 10.9: Create Choice Card Component

As a user,
I want to make choices in the story,
So that I feel agency in my journey.

**Acceptance Criteria:**

**Given** a choice point is reached
**When** I view the choices
**Then** I see 2-4 choice cards
**And** each card has an icon and title
**And** each card has a description
**And** hovering shows gold border and slide effect
**And** clicking navigates to the chosen path

---

### Story 10.10: Create Technical Note Component

As a user,
I want technical concepts explained in story context,
So that I understand the relevance.

**Acceptance Criteria:**

**Given** a technical concept is introduced
**When** I view the technical note
**Then** I see a blue-accented box (matching Lab mode)
**And** the note is labeled "Technical Note"
**And** code elements use monospace font
**And** the note bridges narrative and technical content

---

### Story 10.11: Create "Enter the Lab" Button

As a user,
I want to transition from Story to Lab for challenges,
So that I can apply what I've learned.

**Acceptance Criteria:**

**Given** I reach a hands-on challenge in the story
**When** I see the "Enter the Lab" button
**Then** clicking switches to Lab Mode
**And** the button is prominently styled
**And** the Lab loads with the relevant challenge context
**And** I can return to Story via the activity bar

---

### Story 10.12: Create Story Actions Footer

As a user,
I want navigation controls at the bottom,
So that I can move through the story.

**Acceptance Criteria:**

**Given** I am viewing story content
**When** I scroll to the bottom
**Then** I see Previous Scene, Enter Lab, Continue buttons
**And** buttons are styled according to their action
**And** Previous is disabled on first scene
**And** Continue advances to next scene

---

### Story 10.13: Create Challenge Objectives in Lab Mode

As a user,
I want to see story objectives in Lab mode,
So that I know what to accomplish.

**Acceptance Criteria:**

**Given** I entered Lab from a story challenge
**When** I view the Lab sidebar
**Then** I see a Challenge Objectives section
**And** objectives have checkboxes
**And** completed objectives show checkmarks
**And** the section has a gold border (story accent)
**And** progress updates as I complete tasks

---

### Story 10.14: Implement Story Content Data Structure

As a user,
I want rich narrative content with characters and choices,
So that I feel immersed in the CPU history journey.

**Acceptance Criteria:**

**Given** I open Story Mode
**When** a scene loads
**Then** the narrative text renders with proper formatting
**And** character cards display with photos and dialogue
**And** choice cards appear when decisions are needed
**And** scene settings provide historical context

**Technical Implementation Notes:**
- Story JSON loaded from public/story/
- Structure includes acts, chapters, scenes
- Scenes include narrative, characters, choices
- Content validated against schema

---

### Story 10.15: Create Story Progression Engine

As a user,
I want my story progress saved automatically,
So that I can resume where I left off.

**Acceptance Criteria:**

**Given** I am progressing through the story
**When** I make choices or advance scenes
**Then** my current position (act, chapter, scene) is tracked
**And** my choices are recorded for later reference
**And** progress is persisted to browser storage
**And** when I return, I resume from my saved position

---

### Story 10.16: Display Era Badge and Progress

As a user,
I want to see my progress and current era,
So that I feel accomplished.

**Acceptance Criteria:**

**Given** I am in Story Mode
**When** I view the navigation bar
**Then** I see the current era (e.g., "1971")
**And** I see progress dots for acts (● ○ ○ ○ ○)
**And** completed acts show filled dots
**And** the current act is highlighted

---

### Story 10.17: Wire Story Mode Integration

As a user,
I want Story Mode and Lab Mode to work seamlessly together,
So that I can transition between narrative and hands-on work without issues.

**Acceptance Criteria:**

**Given** I am in Story Mode
**When** I click "Enter the Lab"
**Then** Lab Mode loads with the correct challenge objectives displayed
**And** the code editor contains any starter code from the story
**And** my cursor position and editor state are preserved when returning to Story Mode

**Given** I am in Lab Mode with a challenge active
**When** I complete the challenge objectives
**Then** I can return to Story Mode to continue the narrative
**And** my progress is recorded in the story engine
**And** the story advances to the next scene

**Given** I switch between modes multiple times
**When** I check my work
**Then** no state is lost between transitions
**And** the application remains responsive
**And** no memory leaks occur from repeated mode switches

**Integration Test Requirements:**
- Test mode toggle preserves editor content
- Test challenge completion triggers story progression
- Test rapid mode switching (10+ times) for stability
- Test that Story Mode content correctly maps to Lab Mode challenges
- Test that era badge updates reflect Lab Mode achievements

---

## Epic 11: Multi-Stage Architecture

**Goal:** Platform supports multiple CPU stages with stage switching

**FRs covered:** Multi-stage foundation

### Story 11.1: Create Stage Selector UI

As a user,
I want to select which CPU stage to work with,
So that I can progress through the journey.

**Acceptance Criteria:**

**Given** I am in Lab Mode
**When** I click the stage selector
**Then** I see available stages: Micro4, Micro8, Micro16, etc.
**And** locked stages show as grayed out
**And** current stage is highlighted
**And** clicking a stage switches to it

---

### Story 11.2: Implement Stage Configuration System

As a developer,
I want stage configurations defined,
So that each stage can load its resources.

**Acceptance Criteria:**

**Given** stage definitions exist
**When** a stage is selected
**Then** the config provides: name, data width, address space, instruction count
**And** the config provides: WASM module paths
**And** the config provides: syntax highlighting rules
**And** the config provides: circuit data path
**And** the config provides: example programs path

---

### Story 11.3: Implement Stage-Specific WASM Loading

As a developer,
I want stage-specific WASM modules loaded,
So that each CPU stage uses its own emulator.

**Acceptance Criteria:**

**Given** I switch to a different stage
**When** the stage loads
**Then** the correct WASM emulator module is loaded
**And** the correct WASM assembler module is loaded
**And** the worker is reinitialized with new modules
**And** previous stage modules can be unloaded

---

### Story 11.4: Implement Stage-Specific Syntax Highlighting

As a developer,
I want syntax rules per stage,
So that each stage's instructions are highlighted correctly.

**Acceptance Criteria:**

**Given** I switch stages
**When** I view the editor
**Then** syntax highlighting matches the new stage
**And** opcodes for that stage are recognized
**And** directives for that stage work
**And** the highlighting definition is loaded dynamically

---

### Story 11.5: Implement Stage-Specific Circuit Loading

As a developer,
I want circuit data per stage,
So that each stage shows its correct circuit.

**Acceptance Criteria:**

**Given** I switch stages
**When** I view the circuit panel
**Then** the circuit for the new stage is displayed
**And** the circuit JSON is loaded from the stage path
**And** the visualizer resets zoom and pan
**And** gate colors and layouts are stage-appropriate

---

### Story 11.6: Implement Stage-Specific Examples

As a developer,
I want example programs per stage,
So that users can learn stage-specific concepts.

**Acceptance Criteria:**

**Given** I switch stages
**When** I access File > Examples
**Then** I see examples for the current stage only
**And** examples are loaded from the stage's programs folder
**And** examples demonstrate stage-specific features

---

### Story 11.7: Implement URL Routing for Stages

As a user,
I want URLs to reflect the current stage,
So that I can bookmark and share.

**Acceptance Criteria:**

**Given** I am using a stage
**When** I look at the URL
**Then** the URL includes the stage (e.g., /micro4, /micro8)
**And** navigating to a URL loads that stage
**And** the URL updates when I switch stages
**And** invalid stage URLs show an error

---

## Epic 12: Micro8 Stage (Act 2: Discovering Necessity)

**Goal:** Users experience 8-bit CPU with registers, stack, and subroutines

**FRs covered:** Micro8 stage requirements

### Story 12.1: Compile Micro8 Emulator to WASM

As a developer,
I want Micro8 emulator in WebAssembly,
So that Micro8 programs can run in browser.

**Acceptance Criteria:**

**Given** src/micro8/cpu.c exists
**When** I run the build script
**Then** micro8-cpu.wasm is generated
**And** the module exports cpu_init, cpu_step, cpu_get_state
**And** the module handles 8 registers (R0-R7)
**And** the module handles 64KB address space

---

### Story 12.2: Compile Micro8 Assembler to WASM

As a developer,
I want Micro8 assembler in WebAssembly,
So that Micro8 code can be assembled in browser.

**Acceptance Criteria:**

**Given** src/micro8/assembler.c exists
**When** I run the build script
**Then** micro8-asm.wasm is generated
**And** the module handles 80 Micro8 instructions
**And** the module supports all addressing modes
**And** error messages reference Micro8-specific syntax

---

### Story 12.3: Create Micro8 Syntax Highlighting

As a user,
I want Micro8 assembly highlighted,
So that I can read Micro8 code easily.

**Acceptance Criteria:**

**Given** I am in Micro8 stage
**When** I write Micro8 assembly
**Then** all 80 opcodes are highlighted
**And** register names (R0-R7, SP, PC) are highlighted
**And** stack operations (PUSH, POP, CALL, RET) are highlighted
**And** Micro8-specific directives work

---

### Story 12.4: Create 8-Register Display

As a user,
I want to see all 8 registers,
So that I can track Micro8 state.

**Acceptance Criteria:**

**Given** I am in Micro8 stage
**When** I view the State panel
**Then** I see R0-R7 registers displayed
**And** I see SP (stack pointer) displayed
**And** I see PC displayed
**And** changed registers highlight
**And** values show in hex and decimal

---

### Story 12.5: Create Stack View

As a user,
I want to see the stack contents,
So that I can debug subroutine calls.

**Acceptance Criteria:**

**Given** I am in Micro8 stage
**When** I view the State panel
**Then** I see a Stack section
**And** I see stack contents from SP to bottom
**And** pushed values are labeled
**And** CALL return addresses are marked
**And** stack grows/shrinks visually with operations

---

### Story 12.6: Visualize CALL/RET Operations

As a user,
I want to see subroutine calls visualized,
So that I understand how they work.

**Acceptance Criteria:**

**Given** I step through a CALL instruction
**When** the circuit animates
**Then** I see the return address pushed to stack
**And** I see PC change to subroutine address
**And** when RET executes, I see address popped
**And** I see PC return to caller

---

### Story 12.7: Create Micro8 Circuit Visualization

As a user,
I want to see the Micro8 CPU circuit,
So that I understand 8-bit architecture.

**Acceptance Criteria:**

**Given** I am in Micro8 stage
**When** I view the circuit
**Then** I see the 8-bit data paths
**And** I see the register file with 8 registers
**And** I see the stack pointer logic
**And** I see the enhanced ALU
**And** gates and wires animate correctly

---

### Story 12.8: Load Micro8 Example Programs

As a user,
I want Micro8 examples available,
So that I can learn 8-bit concepts.

**Acceptance Criteria:**

**Given** I am in Micro8 stage
**When** I access examples
**Then** I see the 15 Micro8 example programs
**And** examples include subroutine usage
**And** examples include stack operations
**And** examples include multi-register algorithms

---

## Epic 13: Micro16 Stage (Act 3: Scaling Up)

**Goal:** Users experience 16-bit CPU with segmentation and hardware multiply

**FRs covered:** Micro16 stage requirements

### Story 13.1: Compile Micro16 Emulator to WASM

As a developer,
I want Micro16 emulator in WebAssembly,
So that Micro16 programs can run in browser.

**Acceptance Criteria:**

**Given** src/micro16/cpu.c exists
**When** I run the build script
**Then** micro16-cpu.wasm is generated
**And** the module handles segment registers
**And** the module handles 1MB address space
**And** the module handles hardware multiply/divide

---

### Story 13.2: Compile Micro16 Assembler to WASM

As a developer,
I want Micro16 assembler in WebAssembly,
So that Micro16 code can be assembled in browser.

**Acceptance Criteria:**

**Given** src/micro16/assembler.c exists
**When** I run the build script
**Then** micro16-asm.wasm is generated
**And** the module handles Micro16 instructions
**And** the module handles segment:offset addressing
**And** error messages are Micro16-specific

---

### Story 13.3: Create Micro16 Disassembler

As a developer,
I want a Micro16 disassembler,
So that users can view machine code as assembly.

**Acceptance Criteria:**

**Given** I need to disassemble Micro16 code
**When** I create src/micro16/disasm.c
**Then** the disassembler converts binary to assembly
**And** it handles all Micro16 instructions
**And** it handles segment addressing
**And** it can be compiled to WASM

---

### Story 13.4: Create Segment Registers Display

As a user,
I want to see segment registers,
So that I understand memory segmentation.

**Acceptance Criteria:**

**Given** I am in Micro16 stage
**When** I view the State panel
**Then** I see CS, DS, SS, ES segment registers
**And** I see base address calculations
**And** I see effective addresses
**And** segment changes are highlighted

---

### Story 13.5: Create 1MB Memory View

As a user,
I want to view the 1MB address space,
So that I can navigate large memory.

**Acceptance Criteria:**

**Given** I am in Micro16 stage
**When** I view memory
**Then** I see segment:offset notation
**And** I can jump to segment:offset addresses
**And** the view handles 1MB address space
**And** segment boundaries are indicated

---

### Story 13.6: Visualize Hardware Multiply

As a user,
I want to see hardware multiply in action,
So that I understand the ALU enhancement.

**Acceptance Criteria:**

**Given** I execute a MUL instruction
**When** the circuit animates
**Then** I see the multiply unit activate
**And** I see operands entering the multiplier
**And** I see the 32-bit result split to DX:AX
**And** the process is visually clear

---

### Story 13.7: Create Micro16 Circuit Visualization

As a user,
I want to see the Micro16 CPU circuit,
So that I understand 16-bit architecture.

**Acceptance Criteria:**

**Given** I am in Micro16 stage
**When** I view the circuit
**Then** I see 16-bit data paths
**And** I see segment register logic
**And** I see the hardware multiplier
**And** I see interrupt handling logic
**And** all components animate correctly

---

### Story 13.8: Load Micro16 Example Programs

As a user,
I want Micro16 examples available,
So that I can learn 16-bit concepts.

**Acceptance Criteria:**

**Given** I am in Micro16 stage
**When** I access examples
**Then** I see the 13+ Micro16 example programs
**And** examples include segment usage
**And** examples include multiply/divide
**And** examples include string operations

---

## Epic 14: Micro32 Stage (Act 4: The Real Machine)

**Goal:** Users experience 32-bit CPU with protected mode and paging

**FRs covered:** Micro32 stage requirements

### Story 14.1: Design Micro32 ISA

As a developer,
I want a complete Micro32 ISA specification,
So that implementation can proceed.

**Acceptance Criteria:**

**Given** I am designing Micro32
**When** I create docs/micro32_isa.md
**Then** all instructions are specified
**And** encoding formats are defined
**And** addressing modes are documented
**And** protected mode features are specified
**And** paging is specified

---

### Story 14.2: Implement Micro32 Emulator

As a developer,
I want a Micro32 CPU emulator,
So that 32-bit programs can run.

**Acceptance Criteria:**

**Given** the ISA is designed
**When** I create src/micro32/cpu.c
**Then** all Micro32 instructions execute
**And** protected mode is implemented
**And** paging is implemented
**And** 4GB address space is handled
**And** the emulator can be compiled to WASM

---

### Story 14.3: Implement Micro32 Assembler

As a developer,
I want a Micro32 assembler,
So that Micro32 code can be assembled.

**Acceptance Criteria:**

**Given** the ISA is designed
**When** I create src/micro32/assembler.c
**Then** all Micro32 instructions assemble
**And** 32-bit operands work
**And** protected mode directives work
**And** the assembler can be compiled to WASM

---

### Story 14.4: Create Protected Mode Visualization

As a user,
I want to see protected mode,
So that I understand privilege levels.

**Acceptance Criteria:**

**Given** I am in Micro32 stage
**When** I view the State panel
**Then** I see current privilege level (Ring 0-3)
**And** I see segment descriptors
**And** I see protection checks
**And** privilege violations are shown

---

### Story 14.5: Create Paging Visualization

As a user,
I want to see paging in action,
So that I understand virtual memory.

**Acceptance Criteria:**

**Given** paging is enabled
**When** I access memory
**Then** I see page directory lookup
**And** I see page table lookup
**And** I see physical address calculation
**And** I see TLB hits/misses
**And** page faults are visualized

---

### Story 14.6: Create Micro32 Circuit Visualization

As a user,
I want to see the Micro32 CPU circuit,
So that I understand 32-bit architecture.

**Acceptance Criteria:**

**Given** I am in Micro32 stage
**When** I view the circuit
**Then** I see 32-bit data paths
**And** I see MMU and paging unit
**And** I see privilege check logic
**And** I see enhanced ALU
**And** all components animate correctly

---

### Story 14.7: Create Micro32 HDL

As a developer,
I want Micro32 HDL definition,
So that the circuit can be visualized.

**Acceptance Criteria:**

**Given** the Micro32 architecture is designed
**When** I create hdl/07_micro32_cpu.m4hdl
**Then** all components are defined
**And** the HDL compiles without errors
**And** the visualizer can render it
**And** the HDL matches the emulator behavior

---

## Epic 15: Micro32-P Pipeline Stage (Act 5a: Performance)

**Goal:** Users experience pipelined CPU with hazard detection

**FRs covered:** Micro32-P stage requirements

### Story 15.1: Implement 5-Stage Pipeline

As a developer,
I want a pipelined CPU implementation,
So that users can learn pipelining.

**Acceptance Criteria:**

**Given** the base Micro32 exists
**When** I create src/micro32p/
**Then** the CPU has 5 pipeline stages: IF, ID, EX, MEM, WB
**And** pipeline registers separate each stage
**And** instructions progress through stages
**And** the emulator can be compiled to WASM

---

### Story 15.2: Create Pipeline Visualization

As a user,
I want to see the pipeline stages,
So that I understand instruction overlap.

**Acceptance Criteria:**

**Given** I am in Micro32-P stage
**When** I view the circuit
**Then** I see all 5 pipeline stages
**And** I see which instruction is in each stage
**And** I see pipeline registers between stages
**And** stages execute in parallel visually

---

### Story 15.3: Visualize Data Hazards

As a user,
I want to see data hazards,
So that I understand pipeline stalls.

**Acceptance Criteria:**

**Given** a data hazard occurs
**When** I step through execution
**Then** I see the hazard detected
**And** I see which stages are affected
**And** I see stall bubbles inserted
**And** the reason is explained

---

### Story 15.4: Visualize Forwarding Paths

As a user,
I want to see data forwarding,
So that I understand hazard mitigation.

**Acceptance Criteria:**

**Given** forwarding is used
**When** I step through execution
**Then** I see forwarding paths light up
**And** I see data bypassing pipeline stages
**And** I see which hazard is avoided
**And** forwarding vs stalling is compared

---

### Story 15.5: Show Pipeline Timing Diagram

As a user,
I want to see a timing diagram,
So that I understand instruction timing.

**Acceptance Criteria:**

**Given** I am running a program
**When** I view the timing diagram
**Then** I see instructions as horizontal bars
**And** I see each stage as a column
**And** I see how instructions overlap
**And** stalls and bubbles are visible
**And** the diagram scrolls with execution

---

### Story 15.6: Create Micro32-P HDL

As a developer,
I want pipelined CPU HDL,
So that the circuit can be visualized.

**Acceptance Criteria:**

**Given** the pipeline is designed
**When** I create hdl/08_micro32p_cpu.m32hdl
**Then** all pipeline stages are defined
**And** pipeline registers are defined
**And** hazard detection logic is defined
**And** forwarding paths are defined

---

## Epic 16: Micro32-S Superscalar Stage (Act 5b: Mastery)

**Goal:** Users experience superscalar CPU with branch prediction

**FRs covered:** Micro32-S stage requirements

### Story 16.1: Implement Superscalar Execution

As a developer,
I want a superscalar CPU implementation,
So that users can learn advanced architectures.

**Acceptance Criteria:**

**Given** the pipelined Micro32 exists
**When** I create src/micro32s/
**Then** multiple instructions can issue per cycle
**And** multiple execution units exist
**And** out-of-order execution is supported
**And** the emulator can be compiled to WASM

---

### Story 16.2: Visualize Multiple Execution Units

As a user,
I want to see multiple execution units,
So that I understand parallel execution.

**Acceptance Criteria:**

**Given** I am in Micro32-S stage
**When** I view the circuit
**Then** I see multiple ALUs
**And** I see load/store units
**And** I see branch unit
**And** I see which units are active each cycle

---

### Story 16.3: Visualize Issue Queue

As a user,
I want to see instruction scheduling,
So that I understand out-of-order execution.

**Acceptance Criteria:**

**Given** I am running a program
**When** I view the issue queue
**Then** I see pending instructions
**And** I see which are ready to execute
**And** I see operand availability
**And** I see issue decisions

---

### Story 16.4: Visualize Register Renaming

As a user,
I want to see register renaming,
So that I understand false dependency elimination.

**Acceptance Criteria:**

**Given** register renaming occurs
**When** I view the renaming logic
**Then** I see architectural to physical mapping
**And** I see rename table contents
**And** I see how WAR/WAW hazards are eliminated
**And** free list is shown

---

### Story 16.5: Visualize Reorder Buffer

As a user,
I want to see the reorder buffer,
So that I understand in-order retirement.

**Acceptance Criteria:**

**Given** out-of-order execution occurs
**When** I view the ROB
**Then** I see instructions in program order
**And** I see completion status
**And** I see head and tail pointers
**And** I see retirement happening

---

### Story 16.6: Visualize Branch Prediction

As a user,
I want to see branch prediction,
So that I understand speculative execution.

**Acceptance Criteria:**

**Given** a branch occurs
**When** I view the branch predictor
**Then** I see branch history table
**And** I see prediction made
**And** I see branch resolution
**And** I see misprediction recovery
**And** prediction accuracy is shown

---

### Story 16.7: Create Micro32-S HDL

As a developer,
I want superscalar CPU HDL,
So that the circuit can be visualized.

**Acceptance Criteria:**

**Given** the superscalar is designed
**When** I create hdl/09_micro32s_cpu.m32hdl
**Then** all execution units are defined
**And** issue logic is defined
**And** ROB is defined
**And** branch predictor is defined

---

## Epic 17: PWA & Offline Support

**Goal:** Users can use the application offline after initial load

**FRs covered:** PWA requirements

### Story 17.1: Create Service Worker

As a developer,
I want a service worker for caching,
So that the app works offline.

**Acceptance Criteria:**

**Given** the application is built
**When** the service worker installs
**Then** all application assets are cached
**And** WASM modules are cached
**And** the cache strategy is cache-first for assets
**And** the service worker updates on new versions

---

### Story 17.2: Implement Offline Indicator

As a user,
I want to know when I'm offline,
So that I understand any limitations.

**Acceptance Criteria:**

**Given** I lose network connection
**When** the app detects offline
**Then** an offline indicator appears
**And** the indicator shows in the status bar
**And** the indicator disappears when online
**And** functionality continues to work offline

---

### Story 17.3: Create App Manifest

As a user,
I want to install the app,
So that I can access it like a native app.

**Acceptance Criteria:**

**Given** the manifest is configured
**When** I visit the app
**Then** I see an "Add to Home Screen" prompt (on supported browsers)
**And** the manifest includes icons for all sizes
**And** the app name and theme color are set
**And** installing works on desktop and mobile

---

### Story 17.4: Cache Example Programs Offline

As a user,
I want examples available offline,
So that I can learn without network.

**Acceptance Criteria:**

**Given** I have used the app online
**When** I go offline
**Then** example programs still load
**And** all stages' examples are cached
**And** new examples sync when online

---

### Story 17.5: Implement Background Sync

As a developer,
I want saves to sync when online,
So that no data is lost.

**Acceptance Criteria:**

**Given** I save while offline
**When** I come back online
**Then** my saves sync to storage
**And** no data is lost
**And** conflicts are handled gracefully

---

## Epic 18: Period-Accurate Constraints System

**Goal:** Users experience authentic limitations that drive discovery

**FRs covered:** Period-accurate constraints

### Story 18.1: Define Stage Constraints

As a developer,
I want constraint definitions per stage,
So that limitations are enforced.

**Acceptance Criteria:**

**Given** each CPU stage
**When** constraints are defined
**Then** Micro4 has 256-byte memory limit
**And** Micro8 has 64KB memory limit
**And** each stage has instruction set limits
**And** each stage has register count limits
**And** constraints are stored in configuration

---

### Story 18.2: Enforce Memory Limits

As a user,
I want memory limits enforced,
So that I experience authentic constraints.

**Acceptance Criteria:**

**Given** I am using a stage
**When** I exceed memory limits
**Then** assembly fails with constraint error
**And** the error explains the limit
**And** the error suggests solutions
**And** the error mentions advancing to next stage

---

### Story 18.3: Enforce Instruction Set Limits

As a user,
I want only available instructions usable,
So that I discover why new instructions are needed.

**Acceptance Criteria:**

**Given** I am in an earlier stage
**When** I try to use an instruction from a later stage
**Then** assembly fails
**And** the error explains the instruction doesn't exist
**And** I'm prompted to "discover" or advance

---

### Story 18.4: Create Educational Error Messages

As a user,
I want errors that teach,
So that limitations become learning moments.

**Acceptance Criteria:**

**Given** I hit a constraint
**When** I view the error
**Then** the message explains WHY the limit exists
**And** the message suggests what I might need to solve it
**And** the message connects to the learning journey
**And** "Why can't I...?" becomes "Now I understand..."

---

### Story 18.5: Implement Experimentation Mode

As a user,
I want to bypass constraints sometimes,
So that I can explore freely.

**Acceptance Criteria:**

**Given** I want unrestricted access
**When** I enable Experimentation Mode
**Then** all constraints are relaxed
**And** an indicator shows I'm in experimentation mode
**And** I can switch back to constrained mode
**And** achievements note if earned in experimentation mode

---

## Epic 19: Progress & Journey Tracking

**Goal:** Users see their progress through the learning journey

**FRs covered:** Journey tracking requirements

### Story 19.1: Track First-Time Discoveries

As a user,
I want discoveries tracked,
So that I see my growth.

**Acceptance Criteria:**

**Given** I build something for the first time
**When** the system detects a discovery
**Then** a discovery notification appears
**And** the discovery is added to my profile
**And** discoveries include: first program, first subroutine, first interrupt, etc.
**And** discoveries persist across sessions

---

### Story 19.2: Track Act Completion

As a user,
I want act completion tracked,
So that I see journey progress.

**Acceptance Criteria:**

**Given** I complete an act's objectives
**When** the act is finished
**Then** a completion celebration appears
**And** the next act unlocks
**And** progress is shown in Story Mode
**And** completion is persisted

---

### Story 19.3: Create Milestone Achievements

As a user,
I want milestone achievements,
So that I feel accomplished.

**Acceptance Criteria:**

**Given** I reach significant milestones
**When** an achievement triggers
**Then** I see an achievement notification
**And** achievements include: First "aha" moment, First bug fixed, Built an ALU, etc.
**And** achievements are viewable in a gallery
**And** achievements have icons and descriptions

---

### Story 19.4: Create Progress Visualization

As a user,
I want to see my journey visually,
So that I understand how far I've come.

**Acceptance Criteria:**

**Given** I access the progress view
**When** I view my journey
**Then** I see a map/timeline of all stages
**And** completed stages are highlighted
**And** current position is marked
**And** upcoming stages are preview visible
**And** I can click to navigate to any unlocked stage

---

### Story 19.5: Implement Stage Unlock System

As a user,
I want stages unlocked progressively,
So that I build on prior knowledge.

**Acceptance Criteria:**

**Given** I am progressing through stages
**When** I complete a stage's requirements
**Then** the next stage unlocks
**And** locked stages show unlock requirements
**And** I can see what I need to do to unlock
**And** unlock progress is shown

---

### Story 19.6: Create Statistics Dashboard

As a user,
I want to see my statistics,
So that I can reflect on my journey.

**Acceptance Criteria:**

**Given** I access the stats dashboard
**When** I view statistics
**Then** I see programs written count
**And** I see instructions executed count
**And** I see bugs found and fixed count
**And** I see time spent per stage
**And** I see discoveries and achievements

---

## Epic 20: Educational Content System

**Goal:** Users can access literature and tutorials when needed

**FRs covered:** Literature requirements

### Story 20.1: Create Literature Browser

As a user,
I want to browse educational articles,
So that I can learn concepts.

**Acceptance Criteria:**

**Given** I access the literature section
**When** I view the browser
**Then** I see categorized articles (20 total)
**And** categories include: Basic, Intermediate, Advanced
**And** I can search articles
**And** I can filter by topic

---

### Story 20.2: Implement Article Categories

As a developer,
I want articles organized by difficulty,
So that users find appropriate content.

**Acceptance Criteria:**

**Given** articles exist
**When** they are categorized
**Then** Basic (1-6): binary, gates, ALU
**And** Intermediate (7-12): encoding, control, memory
**And** Advanced (13-20): pipeline, cache, superscalar
**And** categories are displayed clearly

---

### Story 20.3: Create Contextual Help Links

As a user,
I want help links from the UI,
So that I can learn about what I'm seeing.

**Acceptance Criteria:**

**Given** I am viewing the circuit
**When** I click a help icon on a component
**Then** relevant documentation opens
**And** the help is contextual to the component
**And** I can return to where I was

---

### Story 20.4: Implement Reading Progress

As a user,
I want my reading tracked,
So that I know what I've learned.

**Acceptance Criteria:**

**Given** I read articles
**When** I view the literature browser
**Then** read articles are marked
**And** partially read articles show progress
**And** I can mark articles as complete
**And** reading stats are shown

---

### Story 20.5: Create Progressive Hint System

As a user,
I want hints when I'm stuck,
So that I can make progress without full solutions.

**Acceptance Criteria:**

**Given** I'm working on a challenge
**When** I request a hint
**Then** I get the first (vaguest) hint
**And** I can request additional hints (3-5 per topic)
**And** each hint is more specific
**And** using hints is optional and tracked

---

### Story 20.6: Create Technical Deep-Dives

As a user,
I want detailed explanations available,
So that I can go deeper on topics.

**Acceptance Criteria:**

**Given** I am viewing a circuit component
**When** I access the deep-dive
**Then** I see detailed technical explanation
**And** I see historical context
**And** I see design trade-offs
**And** I see real-world examples

---

### Story 20.7: Curated Documentaries & Films

As a user,
I want to discover documentaries and films about computing history,
So that I can deepen my understanding through visual storytelling.

**Acceptance Criteria:**

**Given** I am learning about an era
**When** I access the "Learn More" resources
**Then** I see curated documentaries and films for that era
**And** each entry has title, year, and description
**And** entries are tagged by era (Turing, PC Era, Modern, etc.)
**And** I see where to watch (streaming service, YouTube, etc.)

**Curated Content (from IMMERSIVE_PLATFORM_PLAN.md):**
- The Imitation Game (2014) - Turing Era
- Hidden Figures (2016) - Early Computing
- Pirates of Silicon Valley (1999) - PC Era
- Triumph of the Nerds (1996) - PC Era documentary
- The Machine That Changed the World (1992) - All Eras, PBS
- Revolution OS (2001) - Open Source
- Silicon Cowboys (2016) - PC Era, Compaq vs IBM
- General Magic (2018) - Early smartphone/PDA
- Micro Men (2009) - 8-bit Era, Sinclair vs Acorn
- Steve Jobs: The Man in the Machine (2015) - Apple history
- BBS: The Documentary (2005) - Modem Era
- The Code (2001) - Linux

---

### Story 20.8: Curated TV Shows & Series

As a user,
I want to discover TV shows about computing history and culture,
So that I can explore the human stories behind technology.

**Acceptance Criteria:**

**Given** I am exploring computing history
**When** I access the TV shows section
**Then** I see curated series relevant to computing
**And** each entry has title, platform, era, and description
**And** I can filter by era or theme

**Curated Content (from IMMERSIVE_PLATFORM_PLAN.md):**
- Halt and Catch Fire (AMC) - PC Era 1980s drama
- Silicon Valley (HBO) - Modern startup comedy
- The Billion Dollar Code (Netflix) - Google Earth origins
- Devs (Hulu) - Quantum computing thriller

---

### Story 20.9: Curated YouTube Channels & Videos

As a user,
I want to discover educational YouTube content about CPU building and computing,
So that I can learn from expert creators in visual format.

**Acceptance Criteria:**

**Given** I want to learn more about a topic
**When** I access YouTube resources
**Then** I see curated channels organized by focus area
**And** I see specific must-watch videos highlighted
**And** each entry describes what the channel/video covers
**And** I can filter by topic (hands-on building, history, concepts)

**Curated Content (from IMMERSIVE_PLATFORM_PLAN.md):**

Channels:
- Ben Eater - Building computers from scratch, 8-bit breadboard
- Computerphile - CS concepts explained academically
- The 8-Bit Guy - Retro 8-bit/16-bit hardware
- LGR (Lazy Game Reviews) - IBM PC era, DOS
- Technology Connections - Electronics fundamentals
- CuriousMarc - Vintage restoration (Apollo, HP)
- Usagi Electric - Vacuum tube/relay computing
- Sebastian Lague - Visual CS explanations

Must-Watch Videos:
- Ben Eater: "Building an 8-bit breadboard computer" series
- Computerphile: "Turing Machines Explained"
- CuriousMarc: "Restoring the Apollo Guidance Computer"
- The 8-Bit Guy: "How Computers Work" series

---

### Story 20.10: Curated Books & Reading List

As a user,
I want recommended books about computing history,
So that I can do deeper reading on topics that interest me.

**Acceptance Criteria:**

**Given** I want to read more about computing
**When** I access the books section
**Then** I see curated books organized by era/topic
**And** each entry has title, author, era, and description
**And** I can see which books relate to my current learning stage

**Curated Content (from IMMERSIVE_PLATFORM_PLAN.md):**
- The Innovators (Walter Isaacson) - Full history, Ada to Google
- Code (Charles Petzold) - How computers work from first principles
- Soul of a New Machine (Tracy Kidder) - Minicomputer era
- Hackers (Steven Levy) - PC era hacker culture
- Fire in the Valley (Freiberger & Swaine) - PC revolution
- The Dream Machine (M. Mitchell Waldrop) - Licklider and the revolution
- Turing's Cathedral (George Dyson) - Origins of digital universe

---

### Story 20.11: Museums & Physical Sites

As a user,
I want to know about museums where I can see real computing history,
So that I can plan visits to see actual hardware.

**Acceptance Criteria:**

**Given** I want to see computing history in person
**When** I access the museums section
**Then** I see museums with computing exhibits
**And** each entry has name, location, and focus
**And** I can see which museums have working vintage computers
**And** I can see which relate to specific eras I'm studying

**Curated Content (from IMMERSIVE_PLATFORM_PLAN.md):**
- Computer History Museum (Mountain View, CA) - Comprehensive, all eras
- Living Computer Museum (Seattle, WA) - Working vintage computers
- Bletchley Park (UK) - WWII codebreaking, Colossus, Turing
- Science Museum London (UK) - Babbage's Difference Engine replica
- Heinz Nixdorf Museum (Germany) - Largest computer museum
- Computer Museum of America (Atlanta, GA) - Apple, IBM, gaming

---

### Story 20.12: Online Simulators & Interactive Resources

As a user,
I want to discover online simulators and interactive learning tools,
So that I can practice and experiment beyond Digital Archaeology.

**Acceptance Criteria:**

**Given** I want more hands-on practice
**When** I access online resources
**Then** I see curated simulators and interactive sites
**And** each entry has name, URL, and description
**And** I can see which relate to concepts I'm learning
**And** resources are categorized (CPU simulation, logic gates, Turing machines)

**Curated Content (from IMMERSIVE_PLATFORM_PLAN.md):**
- Nand2Tetris (nand2tetris.org) - Build computer from NAND gates
- Visual 6502 (visual6502.org) - Transistor-level 6502 simulation
- CPU Simulator (cpu-sim.gitlab.io) - MIPS/RISC-V simulation
- Logic.ly (logic.ly) - Visual logic gate simulator
- Turing Machine Simulator (turingmachine.io) - Interactive Turing machine
- MAME (mamedev.org) - Arcade/computer emulation

---

## Epic 21: Homework & Exercises System

**Goal:** Users can practice with structured challenges

**FRs covered:** Homework requirements

### Story 21.1: Create Exercise Browser

As a user,
I want to browse exercises,
So that I can practice skills.

**Acceptance Criteria:**

**Given** I access exercises
**When** I view the browser
**Then** I see exercises grouped by stage
**And** each stage has its exercise count (5-12)
**And** I see difficulty indicators
**And** I see completion status

---

### Story 21.2: Implement Exercise Metadata

As a developer,
I want exercise descriptions,
So that users understand goals.

**Acceptance Criteria:**

**Given** an exercise exists
**When** I view its details
**Then** I see title and description
**And** I see difficulty level
**And** I see concepts covered
**And** I see estimated time
**And** I see prerequisites

---

### Story 21.3: Create Starter Code Templates

As a user,
I want starter code for exercises,
So that I have a starting point.

**Acceptance Criteria:**

**Given** I start an exercise
**When** the exercise loads
**Then** starter code appears in the editor
**And** the code has TODO comments
**And** the code has the basic structure
**And** I know what to implement

---

### Story 21.4: Implement Output Validation

As a user,
I want my solution validated,
So that I know if I succeeded.

**Acceptance Criteria:**

**Given** I complete an exercise
**When** I submit/test my solution
**Then** the output is compared to expected
**And** I see pass/fail result
**And** I see which test cases pass/fail
**And** I can see expected vs actual for failures

---

### Story 21.5: Implement Progressive Hints

As a user,
I want hints for exercises,
So that I can get unstuck.

**Acceptance Criteria:**

**Given** I'm stuck on an exercise
**When** I request hints
**Then** I get 3-5 progressive hints
**And** each hint reveals more
**And** hints don't give the full solution
**And** hint usage is tracked

---

### Story 21.6: Implement Solution Reveal

As a user,
I want to see the solution after trying,
So that I can learn from it.

**Acceptance Criteria:**

**Given** I've attempted an exercise
**When** I click "Show Solution"
**Then** a solution is shown
**And** the solution is explained
**And** I can compare to my attempt
**And** solution viewing is noted in stats

---

### Story 21.7: Track Exercise Completion

As a user,
I want my exercise progress tracked,
So that I see my skill growth.

**Acceptance Criteria:**

**Given** I complete exercises
**When** I view my progress
**Then** I see completed exercises per stage
**And** I see my scores/times
**And** I see improvement over time
**And** completion unlocks achievements

---

## Epic 22: FPGA Export Pipeline

**Goal:** Users can export designs for real hardware synthesis

**FRs covered:** FPGA export requirements

### Story 22.1: Create Export Format Options

As a user,
I want export format choices,
So that I can use different tools.

**Acceptance Criteria:**

**Given** I have a working design
**When** I access FPGA Export
**Then** I can choose Verilog or VHDL
**And** I see format descriptions
**And** I can select my target format
**And** export generates the chosen format

---

### Story 22.2: Implement HDL to Verilog Export

As a developer,
I want HDL converted to Verilog,
So that designs can be synthesized.

**Acceptance Criteria:**

**Given** a valid HDL design
**When** I export to Verilog
**Then** syntactically correct Verilog is generated
**And** all modules are translated
**And** wire connections are preserved
**And** the output can be opened in Vivado/Quartus

---

### Story 22.3: Create Pin Mapping Configuration

As a user,
I want to map pins to my FPGA board,
So that I/O works correctly.

**Acceptance Criteria:**

**Given** I am exporting for FPGA
**When** I configure pin mapping
**Then** I can map logical signals to physical pins
**And** I can select from common dev boards
**And** pin assignments are saved
**And** constraints file is generated

---

### Story 22.4: Implement Target Board Selection

As a user,
I want to select my FPGA board,
So that settings are correct.

**Acceptance Criteria:**

**Given** I am exporting
**When** I select a board
**Then** common boards are listed (Arty, DE10-Nano, etc.)
**And** board specs are shown
**And** pin maps are pre-configured
**And** I can add custom boards

---

### Story 22.5: Generate Build Scripts

As a user,
I want build scripts generated,
So that I can synthesize my design.

**Acceptance Criteria:**

**Given** I have exported a design
**When** I download the package
**Then** it includes build scripts
**And** Makefile or TCL scripts are included
**And** scripts work with Vivado/Quartus
**And** README explains the process

---

### Story 22.6: Show Resource Estimation

As a user,
I want to see resource usage,
So that I know if my design fits.

**Acceptance Criteria:**

**Given** I am exporting
**When** I view resource estimation
**Then** I see LUT count estimate
**And** I see flip-flop count estimate
**And** I see BRAM usage estimate
**And** I see comparison to target board capacity

---

## Epic 23: Custom Microcontroller Toolkit

**Goal:** Users can design their own CPU architectures

**FRs covered:** Custom microcontroller requirements

### Story 23.1: Create ISA Designer Tool

As a user,
I want to design my own instruction set,
So that I can create custom CPUs.

**Acceptance Criteria:**

**Given** I access the ISA designer
**When** I create an ISA
**Then** I can define instruction categories
**And** I can specify instruction formats
**And** I can assign opcodes
**And** I can define operand types
**And** the ISA is validated for conflicts

---

### Story 23.2: Create Instruction Encoding Editor

As a user,
I want to define instruction encoding,
So that my instructions can be assembled.

**Acceptance Criteria:**

**Given** I am designing an ISA
**When** I define encoding
**Then** I can specify bit fields
**And** I can assign meanings to fields
**And** I can set field widths
**And** encoding conflicts are detected
**And** encoding documentation is generated

---

### Story 23.3: Create Register File Configurator

As a user,
I want to design my register file,
So that my CPU has the right registers.

**Acceptance Criteria:**

**Given** I am designing a CPU
**When** I configure registers
**Then** I can set register count
**And** I can set register width
**And** I can name registers
**And** I can designate special registers (SP, PC)
**And** the register file is visualized

---

### Story 23.4: Create ALU Operation Selector

As a user,
I want to choose ALU operations,
So that my CPU has needed capabilities.

**Acceptance Criteria:**

**Given** I am designing a CPU
**When** I configure the ALU
**Then** I can select from operation templates
**And** I can add/remove operations
**And** I can define custom operations
**And** the ALU complexity is estimated

---

### Story 23.5: Create Memory Map Designer

As a user,
I want to design my memory map,
So that I can allocate address space.

**Acceptance Criteria:**

**Given** I am designing a CPU
**When** I configure memory
**Then** I can set address space size
**And** I can define memory regions
**And** I can map I/O ports
**And** I can set region permissions
**And** the memory map is visualized

---

### Story 23.6: Generate Custom HDL

As a developer,
I want HDL generated from custom design,
So that it can be simulated.

**Acceptance Criteria:**

**Given** a custom CPU design
**When** I generate HDL
**Then** HDL is generated matching the design
**And** all components are included
**And** the HDL is valid and parseable
**And** the visualizer can render it

---

### Story 23.7: Generate Custom Assembler

As a developer,
I want assembler generated for custom ISA,
So that I can write programs.

**Acceptance Criteria:**

**Given** a custom ISA
**When** I generate assembler
**Then** a JavaScript assembler is generated
**And** all instructions are recognized
**And** encoding matches the ISA
**And** error messages are appropriate

---

### Story 23.8: Generate Custom Emulator

As a developer,
I want emulator generated for custom CPU,
So that programs can be tested.

**Acceptance Criteria:**

**Given** a custom CPU design
**When** I generate emulator
**Then** a JavaScript emulator is generated
**And** all instructions execute correctly
**And** state matches the design
**And** the emulator integrates with the platform

---

## Epic 24: Fab Preparation Tools

**Goal:** Users can prepare designs for potential fabrication

**FRs covered:** Fab preparation requirements

### Story 24.1: Implement Design Rule Check

As a user,
I want my design checked for fab rules,
So that I know if it could be manufactured.

**Acceptance Criteria:**

**Given** a complete CPU design
**When** I run DRC
**Then** design rules are checked
**And** violations are listed
**And** violations are explained
**And** suggestions for fixing are provided

---

### Story 24.2: Create Process Node Selection

As a user,
I want to select a target process,
So that rules match the fab.

**Acceptance Criteria:**

**Given** I am preparing for fab
**When** I select a process node
**Then** I see available nodes (180nm, 130nm, etc.)
**And** I see node characteristics
**And** rules update for the selected node
**And** educational info explains the node

---

### Story 24.3: Implement Timing Analysis

As a user,
I want to see timing estimates,
So that I know the speed of my design.

**Acceptance Criteria:**

**Given** a design and process node
**When** I run timing analysis
**Then** I see critical path delay
**And** I see maximum clock frequency
**And** I see setup/hold margins
**And** slow paths are highlighted

---

### Story 24.4: Implement Power Estimation

As a user,
I want to see power estimates,
So that I understand power consumption.

**Acceptance Criteria:**

**Given** a design and process node
**When** I view power analysis
**Then** I see static power estimate
**And** I see dynamic power estimate
**And** I see power per component
**And** optimization suggestions are shown

---

### Story 24.5: Implement Area Estimation

As a user,
I want to see die area estimates,
So that I understand chip size.

**Acceptance Criteria:**

**Given** a design and process node
**When** I view area analysis
**Then** I see gate count equivalent
**And** I see estimated die area
**And** I see breakdown by component
**And** comparison to real chips is shown

---

### Story 24.6: Generate Fab Documentation

As a user,
I want fab documentation generated,
So that I could theoretically submit a design.

**Acceptance Criteria:**

**Given** a fab-ready design
**When** I generate documentation
**Then** specification document is created
**And** all design files are packaged
**And** test vectors are included
**And** documentation follows fab guidelines

---

## Epic 25: Community & Sharing

**Goal:** Users can share designs and learn from others

**FRs covered:** Community sharing requirements

### Story 25.1: Create Design Export Format

As a developer,
I want a shareable design format,
So that designs can be exchanged.

**Acceptance Criteria:**

**Given** a complete design
**When** I export for sharing
**Then** a portable format is created
**And** the format includes HDL, programs, metadata
**And** the format is versioned
**And** the format is documented

---

### Story 25.2: Implement Design Import

As a user,
I want to import shared designs,
So that I can learn from others.

**Acceptance Criteria:**

**Given** a shared design file
**When** I import it
**Then** the design loads into my workspace
**And** I can view and run it
**And** I can modify it
**And** original attribution is preserved

---

### Story 25.3: Create Design Gallery Browser

As a user,
I want to browse shared designs,
So that I can find interesting work.

**Acceptance Criteria:**

**Given** I access the gallery
**When** I browse designs
**Then** I see design thumbnails and descriptions
**And** I can filter by stage, complexity, features
**And** I can search by keyword
**And** I can sort by popularity, date

---

### Story 25.4: Implement User Profiles (Optional)

As a user,
I want to have a profile,
So that my designs are attributed.

**Acceptance Criteria:**

**Given** profiles are enabled
**When** I create a profile
**Then** I can set a display name
**And** I can add a bio
**And** my shared designs are listed
**And** my achievements are shown
**And** profiles are optional

---

### Story 25.5: Enable Design Comments

As a user,
I want to comment on designs,
So that I can discuss and learn.

**Acceptance Criteria:**

**Given** I am viewing a shared design
**When** I add a comment
**Then** the comment is posted
**And** I can reply to comments
**And** comments are moderated
**And** comments are respectful

---

### Story 25.6: Implement Design Forking

As a user,
I want to fork a design,
So that I can build on others' work.

**Acceptance Criteria:**

**Given** I am viewing a design
**When** I click Fork
**Then** a copy is created in my workspace
**And** the fork links to the original
**And** I can modify the fork freely
**And** attribution is preserved

---

### Story 25.7: Track Version History

As a user,
I want to see design history,
So that I can track evolution.

**Acceptance Criteria:**

**Given** a design has been modified
**When** I view version history
**Then** I see previous versions
**And** I can compare versions
**And** I can restore previous versions
**And** version notes are shown

---

### Story 25.8: Implement Open Source Workflow

As a user,
I want to contribute to the platform,
So that I can help others learn.

**Acceptance Criteria:**

**Given** I want to contribute
**When** I submit a contribution
**Then** the process is documented
**And** I can submit designs, literature, exercises
**And** contributions are reviewed
**And** accepted contributions are credited

---

## Epic 26: Core Game Experience

**Goal:** User plays Digital Archaeology as a time-travel simulation game, progressing through computing history on the golden path while able to branch into alternate timelines with their own stories and inventions.

**FRs covered:** Core game loop, progression system, timeline visualization, alternate timelines

**Dependencies:** Epic 10 (Story Mode components), Epic 19 (Progress tracking foundations)

---

### Story 26.1: First Launch - Story Mode Entry

As a new player,
I want to start immediately in the story,
So that I'm immersed from the first moment.

**Acceptance Criteria:**

**Given** I open Digital Archaeology for the first time
**When** the application loads
**Then** I land directly in Story Mode at Act 0, Scene 1
**And** there is no menu, launcher, or mode selection screen
**And** the narrative begins immediately
**And** I am playing the Mechanical Era story

---

### Story 26.2: Story-Driven Lab Entry

As a player in Story Mode,
I want the story to lead me naturally to building,
So that I understand why I need to invent things.

**Acceptance Criteria:**

**Given** I am in Story Mode reading the narrative
**When** the story presents a problem I cannot yet solve
**Then** "Enter the Lab" is the ONLY way to progress the story
**And** there is no "Continue" button that skips Lab work
**And** the story makes clear what problem needs solving
**And** I understand the context before entering Lab

**Given** I click "Enter the Lab"
**When** Lab Mode loads
**Then** I see the problem objectives from the story
**And** my previous Lab work is loaded (cumulative state)
**And** the era/context is visible

---

### Story 26.3: Cumulative Lab State Persistence

As a player returning to the Lab,
I want to continue where I left off,
So that my work builds on itself like real history.

**Acceptance Criteria:**

**Given** I have previous Lab work saved
**When** I enter the Lab for a new challenge
**Then** I see my last working state (code, circuits, designs)
**And** my progress builds on what I've already created
**And** new challenges extend previous work (not restart)

**Given** I want to clear old work
**When** I archive my current work
**Then** it moves to the archive library
**And** my active Lab state is cleared
**And** archived work is accessible but not active

---

### Story 26.4: Production-Ready Completion Standard

As a player completing a challenge,
I want verification that my solution actually works,
So that I know I truly solved the problem.

**Acceptance Criteria:**

**Given** I believe my solution is ready
**When** the system verifies my work
**Then** actual tests run (inputs produce correct outputs)
**And** gates/circuits function correctly like real hardware
**And** code produces correct results when executed
**And** the "production-ready" standard applies (could this be sold/used?)

**Given** my solution passes verification
**When** I return to Story Mode
**Then** the story acknowledges my accomplishment
**And** I can continue the narrative
**And** my new capability is unlocked for future challenges

---

### Story 26.5: Act Unlock System

As a player progressing through the game,
I want a clear sense of advancement,
So that I feel accomplishment and see what's ahead.

**Acceptance Criteria:**

**Given** I complete 100% of the current act's goals
**When** the act ends
**Then** the next act unlocks
**And** I receive clear feedback of progression
**And** all previous acts remain accessible for replay

**Given** I have not completed the current act
**When** I try to access a future act
**Then** it is locked
**And** I see what I need to complete to unlock it

---

### Story 26.6: Timeline Visualization Interface

As a player navigating through time,
I want to see my journey visually,
So that I understand where I am and where I can go.

**Acceptance Criteria:**

**Given** I want to see my progression
**When** I open the Timeline interface
**Then** I see a visual timeline of my complete journey
**And** I see my current position clearly marked
**And** I see branch points where I diverged from the golden path
**And** I see if/when branches rejoin the golden path
**And** the golden path is visually distinct from alternate timelines

**Given** I want to explore a different time
**When** I hover over a point on the timeline
**Then** I can peek into what's there (preview)
**And** I can click to jump to that point

**Given** the timeline interface
**When** I interact with it
**Then** it is expandable/collapsible (not always visible)
**And** granularity allows navigation to any accessible point

---

### Story 26.7: Alternate Timeline Branches

As a player at a choice point,
I want to explore "what if" scenarios,
So that I can experience alternate computing history.

**Acceptance Criteria:**

**Given** I reach a branch point in the story
**When** I choose an alternate path instead of the golden path
**Then** I enter an alternate timeline with its own unique story content
**And** this timeline reflects "what if history went this way"
**And** the story content is authentic to that alternate path

**Given** I am on an alternate timeline
**When** I complete challenges
**Then** I unlock different inventions than the golden path
**And** these different inventions give me different Lab capabilities
**And** my tools reflect my timeline's history

**Given** I am on an alternate timeline
**When** I reach certain points
**Then** I may rejoin the golden path (if the tech converges)
**Or** I may continue on a permanent alternate timeline
**And** the timeline visualization shows this clearly

---

### Story 26.8: Time-Travel Replay

As a player wanting to explore or practice,
I want to go back to earlier points,
So that I can try different paths or review past work.

**Acceptance Criteria:**

**Given** I want to revisit an earlier point
**When** I select a previous point on the timeline
**Then** I am transported back to that moment
**And** it's a full replay (I'm back in time, not just viewing)
**And** I can interact fully with that point in time

**Given** I time-travel back
**When** I make different choices than before
**Then** I create a new branch/timeline
**And** my original forward progress is not lost
**And** both timelines exist in my game

**Given** I time-travel back
**When** I want to return to my furthest point
**Then** I can navigate forward on my original timeline
**And** all my progress is preserved

---

### Story 26.9: Alternate Timeline Story Content

As a player exploring alternate timelines,
I want rich alternate history narratives,
So that each path feels authentic and educational.

**Acceptance Criteria:**

**Given** I branch to an alternate timeline
**When** I read the story content
**Then** the narrative reflects the alternate history authentically
**And** characters, dialogue, and events match "what if" scenario
**And** technical content explains the alternate inventions
**And** the story is as rich as the golden path content

**Given** alternate timeline content is needed
**When** creating new branch points
**Then** both paths have complete story content
**And** alternate labs have appropriate challenges
**And** alternate inventions are historically plausible

---

### Story 26.10: Seamless Story-Lab-Story Loop

As a player experiencing the game,
I want smooth transitions between story and building,
So that it feels like one cohesive experience.

**Acceptance Criteria:**

**Given** I complete the end-to-end loop
**When** I play from Story → Lab → Story
**Then** transitions are smooth and contextual
**And** the story setup matches the Lab challenge
**And** the story resolution acknowledges my Lab work
**And** my emotional journey feels continuous

**Given** I complete Act 0 fully
**When** I transition to Act 1
**Then** my Act 0 capabilities carry forward
**And** the story references my previous accomplishments
**And** the experience feels like one continuous game

---

