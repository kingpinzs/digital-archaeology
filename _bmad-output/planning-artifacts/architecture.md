---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: 'complete'
completedAt: '2026-01-20'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/planning-artifacts/research/domain-cpu-architecture-evolution-research-2026-01-20.md'
  - '_bmad-output/planning-artifacts/research/domain-historical-cpu-designs-research-2026-01-20.md'
  - '_bmad-output/planning-artifacts/research/domain-educational-cpu-projects-research-2026-01-20.md'
  - '_bmad-output/planning-artifacts/research/domain-memory-hierarchy-history-research-2026-01-20.md'
  - '_bmad-output/planning-artifacts/research/domain-missed-opportunities-research-2026-01-20.md'
  - '_bmad-output/planning-artifacts/research/domain-pipeline-superscalar-origins-research-2026-01-20.md'
workflowType: 'architecture'
project_name: 'cpu_ideas'
user_name: 'Jeremy'
date: '2026-01-20'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
34 requirements across 8 categories defining a complete in-browser CPU development environment:
- **Code Editing (FR1-4):** Monaco-based assembly editor with syntax highlighting
- **Assembly (FR5-8):** In-browser assembler with error reporting and binary output
- **Execution (FR9-12):** WASM emulator with run/stop/reset controls
- **Debugging (FR13-19):** Step execution, register/memory inspection, breakpoints
- **Visualization (FR20-24):** Canvas circuit rendering with signal animation
- **HDL (FR25-28):** View/edit HDL definitions with live reload
- **Examples (FR29-30):** Loadable test programs with descriptions
- **State (FR31-34):** Browser storage persistence, file import/export

**Non-Functional Requirements:**
- Performance: 30fps animation, <1ms step, <500ms assembly, <5s load
- Browser: Firefox primary, Chrome secondary, no plugins
- Usability: Zero-documentation basic workflow, keyboard shortcuts, <100ms feedback
- Data: Unsaved work protection, persistent storage, valid exports

**Scale & Complexity:**
- Primary domain: Frontend-heavy web application (SPA/PWA)
- Complexity level: Medium-High
- Estimated architectural components: 8-10 major modules

### Technical Constraints & Dependencies

**Hard Constraints:**
- Existing C emulators must compile to WASM via Emscripten
- Firefox is primary browser target
- No backend required - fully client-side
- MVP scope: Micro4 only (4-bit CPU, ~425 gates)

**External Dependencies:**
- Monaco Editor (VS Code's editor engine)
- Emscripten toolchain (C → WASM compilation)
- Tailwind CSS (utility-first styling)

**Existing Codebase:**
- `src/micro4/cpu.c` - Working emulator (compile target)
- `src/micro4/assembler.c` - Working assembler (compile target)
- `hdl/*.m4hdl` - HDL definitions for circuit visualization
- `visualizer/` - Existing circuit visualization code

### Cross-Cutting Concerns Identified

1. **State Synchronization:** Emulator state ↔ UI components ↔ Circuit visualization must stay in sync during step/run execution
2. **WASM/JS Boundary:** Efficient data transfer between WebAssembly emulator and JavaScript UI
3. **Rendering Performance:** Canvas operations must maintain 30fps during animation
4. **Theming:** Two distinct visual systems (Story Mode warm gold, Lab Mode cool blue) sharing components
5. **Error Context:** Errors must carry rich metadata (instruction type, gate location, signal values) across system layers

## Starter Template Evaluation

### Primary Technology Domain

Frontend-heavy SPA with WebAssembly integration, based on project requirements analysis.

### Starter Options Considered

| Option | Tool | Verdict |
|--------|------|---------|
| Vite vanilla-ts | Vite 6.x | **Selected** - Best balance of DX and WASM support |
| No build tool | None | Rejected - Missing optimization, HMR, WASM helpers |
| esbuild custom | esbuild | Rejected - Too manual for Monaco/Tailwind integration |

### Selected Starter: Vite vanilla-ts

**Rationale for Selection:**
- Excellent Emscripten/WASM integration via plugins
- Native ES module dev server matches existing code style
- PostCSS pipeline ready for Tailwind CSS
- Monaco Editor works out of box
- Migration-friendly - existing visualizer modules compatible
- PWA plugin available for Phase 2

**Initialization Command:**

```bash
npm create vite@latest digital-archaeology-web -- --template vanilla-ts
```

**Post-Initialization Setup:**

```bash
cd digital-archaeology-web
npm install
npm install -D tailwindcss postcss autoprefixer
npm install -D vite-plugin-wasm vite-plugin-top-level-await
npm install monaco-editor
npx tailwindcss init -p
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
- TypeScript with esbuild transpilation (type-checking via tsc)
- ES2022+ target, modern browser support

**Styling Solution:**
- PostCSS pipeline configured
- Tailwind CSS integration ready
- CSS modules available if needed

**Build Tooling:**
- esbuild for dev (instant HMR)
- Rollup for production (tree-shaking, code-splitting)
- Asset optimization and hashing

**Testing Framework:**
- Not included by default
- Vitest recommended (Vite-native, Jest-compatible API)

**Code Organization:**
- `src/` directory for source code
- `public/` for static assets (WASM files)
- `index.html` as entry point

**Development Experience:**
- Hot Module Replacement (HMR)
- TypeScript error overlay
- Source maps in dev and prod

**Note:** Project initialization using this command should be the first implementation story. Existing visualizer code can be migrated into the `src/` directory.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- WASM Integration Pattern → Affects emulator wrapper design
- State Management → Affects all component communication
- Module Architecture → Affects project structure from day one

**Important Decisions (Shape Architecture):**
- Client-Side Persistence → Affects data layer design
- Deployment Strategy → Affects CI/CD setup

**Deferred Decisions (Post-MVP):**
- PWA Service Worker strategy (Phase 2)
- Multi-CPU stage architecture (when adding Micro8+)

### Frontend Architecture

#### State Management: Simple Store Pattern

**Decision:** Implement a lightweight pub/sub store without external dependencies.

**Rationale:**
- Matches "vanilla JS / lightweight store" preference from PRD
- Predictable state flow, easy to debug
- No framework lock-in
- Sufficient for 8-10 module application

**Implementation Pattern:**
```typescript
// src/state/store.ts
type Listener<T> = (state: T) => void;

export function createStore<T>(initialState: T) {
  let state = initialState;
  const listeners = new Set<Listener<T>>();

  return {
    getState: () => state,
    setState: (partial: Partial<T>) => {
      state = { ...state, ...partial };
      listeners.forEach(fn => fn(state));
    },
    subscribe: (fn: Listener<T>) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }
  };
}
```

**Affects:** All UI components, emulator bridge, visualizer sync

#### Module Architecture: Feature Folders

**Decision:** Organize codebase by functional feature areas.

**Rationale:**
- Clear boundaries matching functional concerns
- Easy navigation and mental model
- Supports parallel development
- Scales well for medium-complexity projects

**Structure:**
```
src/
├── editor/           # Monaco wrapper, syntax highlighting, assembly language
│   ├── Editor.ts
│   ├── micro4-language.ts
│   └── index.ts
├── emulator/         # WASM worker, message protocol, state bridge
│   ├── worker.ts
│   ├── EmulatorBridge.ts
│   └── index.ts
├── visualizer/       # Canvas circuit rendering, animation, interaction
│   ├── CircuitRenderer.ts
│   ├── GateView.ts
│   ├── AnimationLoop.ts
│   └── index.ts
├── debugger/         # Step controls, breakpoints, state inspection
│   ├── DebugControls.ts
│   ├── RegisterView.ts
│   ├── MemoryView.ts
│   └── index.ts
├── state/            # Store implementation, persistence layer
│   ├── store.ts
│   ├── persistence.ts
│   └── index.ts
├── story/            # Story mode: narrative, characters, choices
│   ├── StoryEngine.ts
│   ├── CharacterCard.ts
│   └── index.ts
├── ui/               # Shared UI: toolbar, panels, theming
│   ├── Toolbar.ts
│   ├── Panel.ts
│   ├── theme.ts
│   └── index.ts
├── types/            # Shared TypeScript types
│   └── index.ts
└── main.ts           # Application entry point
```

**Affects:** All development, file organization, import paths

### Data Architecture (Client-Side)

#### Persistence: localStorage + IndexedDB + File API

**Decision:** Tiered persistence strategy based on data characteristics.

**Rationale:**
- Settings are small, frequently accessed → localStorage (sync, fast)
- Projects can be larger, less frequent → IndexedDB (async, scalable)
- Import/export uses native File API for explicit user control
- Supports NFR15-17 (unsaved work protection, persistence, valid exports)

**Implementation:**
| Data Type | Storage | Format |
|-----------|---------|--------|
| User preferences | localStorage | JSON |
| Editor settings | localStorage | JSON |
| Assembly projects | IndexedDB | Structured objects |
| Binary outputs | IndexedDB | ArrayBuffer |
| Export files | File API | .asm (text), .bin (binary) |

**Affects:** State module, project management, import/export features

### WASM Integration

#### Pattern: Web Worker with postMessage

**Decision:** Run Emscripten WASM module in dedicated Web Worker, communicate via structured messages.

**Rationale:**
- Keeps UI thread free for 30fps animation (NFR1)
- Non-blocking during continuous "Run" mode
- Clean API boundary enforced by message protocol
- Future-proof for multi-CPU stages

**Architecture:**
```
┌─────────────────┐     postMessage      ┌─────────────────┐
│   Main Thread   │ ◄──────────────────► │   Web Worker    │
│                 │                      │                 │
│  - UI/DOM       │  { type, payload }   │  - WASM Module  │
│  - Canvas       │                      │  - CPU State    │
│  - Store        │                      │  - Assembler    │
└─────────────────┘                      └─────────────────┘
```

**Message Protocol:**
```typescript
// Commands (Main → Worker)
type EmulatorCommand =
  | { type: 'LOAD_PROGRAM', payload: Uint8Array }
  | { type: 'STEP' }
  | { type: 'RUN', payload: { speed: number } }
  | { type: 'STOP' }
  | { type: 'RESET' }
  | { type: 'GET_STATE' };

// Events (Worker → Main)
type EmulatorEvent =
  | { type: 'STATE_UPDATE', payload: CPUState }
  | { type: 'HALTED' }
  | { type: 'ERROR', payload: ErrorInfo }
  | { type: 'BREAKPOINT_HIT', payload: { address: number } };
```

**Affects:** Emulator module, debugger controls, performance characteristics

### Infrastructure & Deployment

#### Hosting: GitHub Pages

**Decision:** Deploy static site to GitHub Pages with GitHub Actions CI/CD.

**Rationale:**
- Free hosting integrated with repository
- GitHub Actions handles Emscripten build step
- Sufficient for personal/educational project
- Easy migration to Vercel/Netlify later if needed

**CI/CD Pipeline:**
```yaml
# .github/workflows/deploy.yml
- Checkout repository
- Setup Emscripten SDK
- Compile C emulators → WASM
- Setup Node.js
- npm install && npm run build
- Deploy dist/ to GitHub Pages
```

**Affects:** Repository structure, build process, deployment workflow

### Decision Impact Analysis

**Implementation Sequence:**
1. Module architecture (project structure) - First
2. State management (store implementation) - Second
3. WASM integration (worker setup) - Third
4. Client-side persistence (storage layer) - Fourth
5. Deployment (CI/CD) - Can be parallel

**Cross-Component Dependencies:**
- Emulator Worker depends on Store for state broadcasting
- Visualizer depends on Store for CPU state subscription
- Debugger depends on both Store and Emulator message protocol
- Persistence depends on Store for save/load triggers

## Implementation Patterns & Consistency Rules

### Purpose

These patterns ensure multiple AI agents write compatible, consistent code. All agents implementing features for this project MUST follow these conventions.

### Naming Patterns

#### File & Code Naming

| Element | Convention | Example |
|---------|------------|---------|
| Class/Component files | PascalCase | `Editor.ts`, `CircuitRenderer.ts` |
| Utility files | camelCase | `store.ts`, `persistence.ts` |
| Test files | Co-located `.test.ts` | `Editor.test.ts` |
| Type files | Per-module or central | `src/emulator/types.ts` |
| Functions | camelCase | `getState()`, `handleStep()` |
| Variables | camelCase | `cpuState`, `isRunning` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_MEMORY_SIZE` |
| Interfaces/Types | PascalCase | `CPUState`, `EmulatorCommand` |

#### Message Protocol Naming

| Element | Convention | Example |
|---------|------------|---------|
| Commands (Main→Worker) | SCREAMING_SNAKE_CASE imperative | `LOAD_PROGRAM`, `STEP`, `RUN` |
| Events (Worker→Main) | SCREAMING_SNAKE_CASE past/state | `STATE_UPDATE`, `HALTED` |
| Payload keys | camelCase | `{ speed: 10 }` |

### Structure Patterns

#### State Shape

```typescript
interface AppState {
  cpu: {
    pc: number;
    accumulator: number;
    zeroFlag: boolean;
    memory: Uint8Array;
    isRunning: boolean;
    isHalted: boolean;
  };
  editor: {
    source: string;
    cursorPosition: { line: number; column: number };
    hasUnsavedChanges: boolean;
    errors: AssemblyError[];
  };
  debugger: {
    breakpoints: Set<number>;
    currentAddress: number | null;
  };
  ui: {
    activeMode: 'story' | 'lab';
    activePanel: 'registers' | 'memory' | 'circuit';
    executionSpeed: number;
  };
}
```

**Rules:**
- State keys: camelCase, noun-based
- Max 2 levels of nesting
- Booleans: `is`/`has` prefix
- Nullable: explicit `null`, not `undefined`
- Collections: plural nouns

### Format Patterns

#### Error Structures

```typescript
// Assembly error
interface AssemblyError {
  type: 'SYNTAX_ERROR' | 'VALUE_ERROR' | 'CONSTRAINT_ERROR';
  line: number;
  column: number;
  message: string;
  suggestion?: string;
}

// Runtime error
interface RuntimeError {
  type: 'MEMORY_ERROR' | 'INVALID_OPCODE' | 'ARITHMETIC_OVERFLOW';
  address: number;
  instruction: string;
  message: string;
  context: { pc: number; accumulator: number };
}

// UI error
interface UIError {
  message: string;
  recoverable: boolean;
  action?: { label: string; handler: () => void };
}
```

**Rules:**
- Worker errors → transform to UIError in main thread
- Always include context sufficient for debugging
- User-facing messages separate from technical details

### Styling Patterns

#### CSS & Theming

| Element | Convention | Example |
|---------|------------|---------|
| Custom classes | `da-` prefix, kebab-case | `da-panel`, `da-toolbar` |
| CSS variables | `--da-` prefix | `--da-bg-primary` |
| Theme switching | Class on `<html>` | `lab-mode` or `story-mode` |
| Animations | `da-anim-` prefix | `da-anim-signal-pulse` |

**Rules:**
- Tailwind utilities first
- CSS variables for colors (enables theming)
- Custom classes only when Tailwind insufficient

#### Theme Variables

```css
:root, .lab-mode {
  --da-bg-primary: #1a1a2e;
  --da-accent: #00b4d8;
  --da-signal-high: #00ff88;
}

.story-mode {
  --da-bg-primary: #0a0a12;
  --da-accent: #d4a574;
}
```

### Visualization Patterns

#### Canvas Rendering

| Element | Convention | Example |
|---------|------------|---------|
| Coordinates | Top-left origin, y down | `{ x: 100, y: 50 }` |
| Dimensions | Pixels | `{ width: 40, height: 30 }` |
| Gate IDs | `g-{type}-{index}` | `g-and-017` |
| Wire IDs | `w-{source}-{target}` | `w-g-and-017-g-or-023` |
| Animation | requestAnimationFrame | Never setInterval |

#### Circuit Data Structures

```typescript
interface Gate {
  id: string;
  type: 'AND' | 'OR' | 'XOR' | 'NOT' | 'MUX' | 'REG';
  position: { x: number; y: number };
  size: { width: number; height: number };
  inputs: string[];
  output: string;
  value: 0 | 1 | null;
}

interface Wire {
  id: string;
  from: { gateId: string; port: number };
  to: { gateId: string; port: number };
  path: { x: number; y: number }[];
  value: 0 | 1 | null;
}

interface Circuit {
  gates: Map<string, Gate>;
  wires: Map<string, Wire>;
}
```

### Enforcement Guidelines

**All AI Agents MUST:**
1. Follow naming conventions exactly as specified
2. Use typed interfaces for all data structures
3. Transform errors appropriately for their context
4. Use CSS variables for any color values
5. Never use setInterval for canvas animation

**Pattern Verification:**
- TypeScript compiler enforces type patterns
- ESLint rules for naming conventions
- Code review checklist includes pattern compliance

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| `user_state` | `userState` |
| `stateUpdate` event type | `STATE_UPDATE` |
| `state.cpu.alu.adder.carry` | `state.cpu.carryFlag` |
| `setInterval(render, 33)` | `requestAnimationFrame(render)` |
| `color: #00ff88` | `color: var(--da-signal-high)` |
| `undefined` for missing | `null` for missing |

## Project Structure & Boundaries

### Requirements to Module Mapping

| FR Category | Module | Primary Files |
|-------------|--------|---------------|
| Code Editing (FR1-4) | `editor/` | `Editor.ts`, `micro4-language.ts` |
| Assembly (FR5-8) | `emulator/` | `worker.ts`, `assembler.ts` |
| Execution (FR9-12) | `emulator/` | `EmulatorBridge.ts`, `worker.ts` |
| Debugging (FR13-19) | `debugger/` | `DebugControls.ts`, `RegisterView.ts`, `MemoryView.ts` |
| Visualization (FR20-24) | `visualizer/` | `CircuitRenderer.ts`, `GateView.ts`, `AnimationLoop.ts` |
| HDL Management (FR25-28) | `visualizer/` | `HdlParser.ts`, `CircuitBuilder.ts` |
| Test Programs (FR29-30) | `data/` | `programs.ts`, JSON files |
| Application State (FR31-34) | `state/` | `store.ts`, `persistence.ts` |

### Complete Project Directory Structure

```
digital-archaeology-web/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, type-check, test on PR
│       └── deploy.yml                # Build WASM + Vite, deploy to GH Pages
├── public/
│   ├── wasm/
│   │   ├── micro4-cpu.wasm           # Compiled emulator
│   │   ├── micro4-cpu.js             # Emscripten glue code
│   │   ├── micro4-asm.wasm           # Compiled assembler
│   │   └── micro4-asm.js             # Assembler glue code
│   ├── programs/
│   │   ├── hello-world.asm           # Example programs
│   │   ├── add-two-numbers.asm
│   │   ├── countdown.asm
│   │   └── fibonacci.asm
│   ├── circuits/
│   │   └── micro4-circuit.json       # Gate layout data
│   └── story/
│       └── act1/
│           ├── chapter1.json         # Story content
│           └── characters.json       # NPC definitions
├── src/
│   ├── editor/
│   │   ├── Editor.ts                 # Monaco wrapper component
│   │   ├── micro4-language.ts        # Syntax highlighting definition
│   │   ├── Editor.test.ts
│   │   └── index.ts
│   ├── emulator/
│   │   ├── worker.ts                 # Web Worker entry point
│   │   ├── EmulatorBridge.ts         # Main thread ↔ Worker bridge
│   │   ├── types.ts                  # EmulatorCommand, EmulatorEvent, CPUState
│   │   ├── EmulatorBridge.test.ts
│   │   └── index.ts
│   ├── visualizer/
│   │   ├── CircuitRenderer.ts        # Main canvas rendering
│   │   ├── GateView.ts               # Individual gate rendering
│   │   ├── WireView.ts               # Wire and signal rendering
│   │   ├── AnimationLoop.ts          # 30fps animation controller
│   │   ├── HdlParser.ts              # Parse .m4hdl files
│   │   ├── CircuitBuilder.ts         # Build Circuit from HDL
│   │   ├── interaction.ts            # Click, hover, zoom handlers
│   │   ├── types.ts                  # Gate, Wire, Circuit interfaces
│   │   ├── CircuitRenderer.test.ts
│   │   └── index.ts
│   ├── debugger/
│   │   ├── DebugControls.ts          # Step, Run, Stop, Reset buttons
│   │   ├── RegisterView.ts           # PC, ACC, flags display
│   │   ├── MemoryView.ts             # Memory hex dump
│   │   ├── BreakpointManager.ts      # Breakpoint logic
│   │   ├── DebugControls.test.ts
│   │   └── index.ts
│   ├── state/
│   │   ├── store.ts                  # Simple Store implementation
│   │   ├── appState.ts               # AppState type and initial state
│   │   ├── persistence.ts            # localStorage + IndexedDB wrapper
│   │   ├── actions.ts                # State update functions
│   │   ├── store.test.ts
│   │   └── index.ts
│   ├── story/
│   │   ├── StoryEngine.ts            # Story progression logic
│   │   ├── StoryView.ts              # Story mode UI rendering
│   │   ├── CharacterCard.ts          # NPC card component
│   │   ├── ChoiceCard.ts             # Interactive choice component
│   │   ├── DialogueBlock.ts          # Character dialogue rendering
│   │   ├── types.ts                  # Story, Chapter, Character types
│   │   └── index.ts
│   ├── ui/
│   │   ├── App.ts                    # Root application component
│   │   ├── LabMode.ts                # Lab mode layout container
│   │   ├── StoryMode.ts              # Story mode layout container
│   │   ├── Toolbar.ts                # Main toolbar with controls
│   │   ├── Panel.ts                  # Resizable panel component
│   │   ├── StatusBar.ts              # Bottom status bar
│   │   ├── MenuBar.ts                # File, Edit, View, Debug menus
│   │   ├── theme.ts                  # Theme switching logic
│   │   ├── ErrorDisplay.ts           # Rich error panel
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts                  # Shared types (AppState, etc.)
│   ├── utils/
│   │   ├── dom.ts                    # DOM manipulation helpers
│   │   ├── format.ts                 # Number formatting (hex, bin)
│   │   └── index.ts
│   ├── main.ts                       # Application entry point
│   └── styles/
│       ├── main.css                  # Tailwind imports + custom CSS
│       ├── lab-mode.css              # Lab mode specific styles
│       └── story-mode.css            # Story mode specific styles
├── wasm-build/
│   ├── build.sh                      # Emscripten build script
│   └── emscripten-config.json        # Emscripten settings
├── index.html                        # Vite entry HTML
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── .gitignore
└── README.md
```

### Architectural Boundaries

#### Main Thread ↔ Worker Boundary

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MAIN THREAD                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Editor  │  │Visualizer│  │ Debugger │  │   UI     │           │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
│       │             │             │             │                   │
│       └─────────────┴──────┬──────┴─────────────┘                   │
│                            │                                         │
│                     ┌──────┴──────┐                                  │
│                     │    Store    │                                  │
│                     └──────┬──────┘                                  │
│                            │                                         │
│                     ┌──────┴──────┐                                  │
│                     │EmulatorBridge│ ◄─── postMessage boundary       │
│                     └──────┬──────┘                                  │
├─────────────────────────────┼───────────────────────────────────────┤
│                            │                                         │
│                     ┌──────┴──────┐                                  │
│                     │   Worker    │                                  │
│                     │  (worker.ts)│                                  │
│                     │             │                                  │
│                     │ ┌─────────┐ │                                  │
│                     │ │  WASM   │ │                                  │
│                     │ │ Module  │ │                                  │
│                     │ └─────────┘ │                                  │
│                     └─────────────┘                                  │
│                         WEB WORKER                                   │
└─────────────────────────────────────────────────────────────────────┘
```

#### Module Communication Rules

| From | To | Method |
|------|-----|--------|
| UI Components | Store | `store.setState()`, `store.subscribe()` |
| EmulatorBridge | Worker | `worker.postMessage()` |
| Worker | EmulatorBridge | `self.postMessage()` |
| EmulatorBridge | Store | `store.setState()` on events |
| Any Component | Theme | CSS variable access |

#### Data Flow

```
User Action → UI Component → Store.setState() → Subscribers notified
                                                      │
                          ┌───────────────────────────┴───────────────┐
                          │                           │               │
                          ▼                           ▼               ▼
                    Visualizer.render()      Debugger.update()   StatusBar.update()

User clicks "Step" → DebugControls → EmulatorBridge.step()
                                            │
                                            ▼ postMessage
                                        Worker.onmessage()
                                            │
                                            ▼ WASM call
                                        cpu_step()
                                            │
                                            ▼ postMessage
                                    EmulatorBridge.onmessage()
                                            │
                                            ▼
                                    Store.setState({ cpu: newState })
                                            │
                                    ┌───────┴───────┐
                                    ▼               ▼
                            Visualizer       RegisterView
```

### File Purpose Reference

| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/main.ts` | Bootstrap app, create store, mount UI | N/A (entry) |
| `src/state/store.ts` | Simple Store factory | `createStore<T>()` |
| `src/state/appState.ts` | AppState type, initial state | `AppState`, `initialState` |
| `src/emulator/worker.ts` | Worker entry, WASM loading | N/A (worker) |
| `src/emulator/EmulatorBridge.ts` | Promise-based worker API | `EmulatorBridge` class |
| `src/editor/Editor.ts` | Monaco integration | `Editor` class |
| `src/visualizer/CircuitRenderer.ts` | Canvas orchestration | `CircuitRenderer` class |
| `src/visualizer/AnimationLoop.ts` | RAF-based animation | `AnimationLoop` class |
| `src/ui/App.ts` | Root component, mode switching | `App` class |

### Development Workflow

```bash
# Start development
npm run dev              # Vite dev server (HMR)

# Build WASM (separate step)
cd wasm-build && ./build.sh   # Requires Emscripten

# Production build
npm run build            # Outputs to dist/

# Type checking
npm run typecheck        # tsc --noEmit

# Testing
npm run test             # Vitest

# Linting
npm run lint             # ESLint
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices work together without conflicts. Vite 6.x provides native TypeScript support, PostCSS pipeline for Tailwind, and excellent WASM integration. Web Worker pattern aligns with Emscripten output. Simple Store works cleanly with feature folder organization.

**Pattern Consistency:**
All implementation patterns are internally consistent. Naming conventions follow TypeScript community standards. Event naming uses consistent SCREAMING_SNAKE_CASE. CSS uses `--da-` prefix throughout. Canvas IDs follow predictable `g-{type}-{index}` pattern.

**Structure Alignment:**
Project structure fully supports all architectural decisions. Feature folders map to functional requirements. Worker isolation supports WASM pattern. Public directory handles static WASM assets. GitHub workflows support deployment decision.

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
All 34 functional requirements (FR1-FR34) have explicit architectural support through defined modules, files, and patterns.

**Non-Functional Requirements Coverage:**
All 17 non-functional requirements (NFR1-NFR17) are addressed:
- Performance: Web Worker offloading, RAF animation, WASM compilation
- Browser: Standard web APIs only, no plugins
- Usability: Keyboard shortcuts, instant feedback via Store subscriptions
- Data: Tiered persistence with localStorage + IndexedDB

### Implementation Readiness Validation ✅

**Decision Completeness:**
- Technology versions: Specified (Vite 6.x, TypeScript, Tailwind)
- Patterns: 6 categories fully documented with examples
- Consistency rules: Defined with anti-patterns table

**Structure Completeness:**
- ~50 files defined across 12 source directories
- Integration points: Main/Worker boundary diagram included
- Data flow: Documented with ASCII diagrams

**Pattern Completeness:**
- Naming: File, function, variable, event, CSS conventions
- Communication: Store pub/sub, postMessage protocol
- Error handling: 3 typed error structures with transformation rules

### Gap Analysis Results

**Critical Gaps:** None

**Important Gaps (Low Priority):**
- Testing configuration (Vitest) - add during first implementation sprint
- Keyboard shortcut mapping - define when implementing UI module
- Detailed WASM error scenarios - expand during worker implementation

**Nice-to-Have:**
- ESLint configuration file for pattern enforcement
- Complete GitHub Actions YAML for copy-paste setup

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Medium-High)
- [x] Technical constraints identified (WASM, Firefox, no backend)
- [x] Cross-cutting concerns mapped (state sync, theming, errors)

**✅ Architectural Decisions**
- [x] Critical decisions documented (state, WASM, modules)
- [x] Technology stack fully specified
- [x] Integration patterns defined (Worker boundary)
- [x] Performance considerations addressed (30fps, <1ms step)

**✅ Implementation Patterns**
- [x] Naming conventions established (6 categories)
- [x] Structure patterns defined (feature folders)
- [x] Communication patterns specified (Store, postMessage)
- [x] Process patterns documented (error handling)

**✅ Project Structure**
- [x] Complete directory structure defined (~50 files)
- [x] Component boundaries established (Main/Worker)
- [x] Integration points mapped (Store, Bridge)
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Clean separation of concerns with Web Worker
- Simple, predictable state management
- Consistent naming and structure patterns
- All functional and non-functional requirements addressed
- Migration-friendly from existing visualizer code

**Areas for Future Enhancement:**
- PWA service worker (Phase 2)
- Multi-CPU stage support (Micro8+)
- Collaborative features (not in MVP scope)

### Implementation Handoff

**AI Agent Guidelines:**
1. Follow all architectural decisions exactly as documented
2. Use implementation patterns consistently across all components
3. Respect project structure and boundaries
4. Use typed interfaces for all data structures
5. Refer to this document for all architectural questions

**First Implementation Priority:**

```bash
npm create vite@latest digital-archaeology-web -- --template vanilla-ts
cd digital-archaeology-web
npm install
npm install -D tailwindcss postcss autoprefixer
npm install -D vite-plugin-wasm vite-plugin-top-level-await
npm install monaco-editor
npx tailwindcss init -p
```

Then create the feature folder structure as specified.

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2026-01-20
**Document Location:** `_bmad-output/planning-artifacts/architecture.md`

### Final Architecture Deliverables

**Complete Architecture Document**
- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**Implementation Ready Foundation**
- 5 major architectural decisions made
- 6 implementation pattern categories defined
- 8 architectural components specified
- 51 requirements fully supported (34 FR + 17 NFR)

**AI Agent Implementation Guide**
- Technology stack with verified versions
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Quality Assurance Checklist

**✅ Architecture Coherence**
- [x] All decisions work together without conflicts
- [x] Technology choices are compatible
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices

**✅ Requirements Coverage**
- [x] All functional requirements are supported
- [x] All non-functional requirements are addressed
- [x] Cross-cutting concerns are handled
- [x] Integration points are defined

**✅ Implementation Readiness**
- [x] Decisions are specific and actionable
- [x] Patterns prevent agent conflicts
- [x] Structure is complete and unambiguous
- [x] Examples are provided for clarity

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.
