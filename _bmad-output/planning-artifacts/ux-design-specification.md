---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
designDirection: "Two-Mode Interface: Story Mode + Lab Mode (Dense Professional)"
canonicalMockup: "_bmad-output/planning-artifacts/mockups/option-b10-flip-views.html"
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
---

# UX Design Specification - Digital Archaeology

**Author:** Jeremy
**Date:** 2026-01-20

---

## Executive Summary

### Project Vision

An immersive web platform for learning CPU architecture through first-principles construction. Users build every component themselves—from 4-bit gates to 32-bit superscalar processors—experiencing the *why* behind each innovation through discovery, not instruction.

The interface must support the transformation from "I know nothing about CPUs" to "I feel like the inventor who created this."

### Target Users

**Primary User:** Builder-learner (Jeremy first, extendable to others)

| Attribute | Description |
|-----------|-------------|
| Profile | Makers who want to understand computing from first principles |
| Tech Level | Intermediate developer comfortable with code |
| Motivation | Curiosity-driven, no financial pressure, wants deep understanding |
| Success State | Can solve problems without external help—feels like an inventor |
| Devices | Desktop browser (Firefox primary) |

### Key Design Challenges

1. **Complex multi-pane interface** - Editor, visualizer, debugger, and state panels must work together without overwhelming

2. **Real-time visualization clarity** - 425+ gates animating at 30fps needs to remain comprehensible

3. **Connecting abstraction layers** - User must see how assembly instructions relate to gate-level signals

4. **Discovery-based learning** - Interface should create productive "walls" that lead to discovery, not frustration

5. **Power user density** - Lots of information (registers, memory, flags, circuit) in limited screen space

### Design Opportunities

1. **Visualizing "aha moments"** - When user steps through code, circuit animation shows *why* things work

2. **Progressive disclosure** - Start with high-level CPU view, zoom into gate details on demand

3. **Code-to-hardware connection** - Highlight the gates that activate when each instruction executes

4. **Inventor aesthetic** - Interface should feel like a workshop, not a classroom

---

## Core User Experience

### Defining Experience

**Core Interaction:** The code-to-circuit connection

The defining experience of Digital Archaeology is watching your code come alive in the circuit. When you step through an instruction, you see:
- Which gates activate
- How signals propagate through wires
- Why the accumulator, PC, or flags change

This isn't just debugging—it's *understanding*. The circuit visualization IS the explanation.

**Core Loop:**
```
Write Assembly → Assemble → Step → Watch Circuit → Understand → Iterate
```

The tighter this loop, the faster learning happens.

### Platform Strategy

| Aspect | Decision |
|--------|----------|
| Platform | Desktop web (SPA) |
| Primary Browser | Firefox |
| Input | Keyboard + mouse (power user optimized) |
| Offline | PWA in Phase 2 |
| Mobile | Not in scope for MVP |

**Keyboard-first design:** All primary actions should have keyboard shortcuts. Step (F10), Run (F5), Assemble (Ctrl+Enter), Reset (Ctrl+R).

### Effortless Interactions

These must require zero friction:

1. **Write → Assemble → Step** - Single keystroke between each phase
2. **Code ↔ Circuit sync** - Clicking a gate highlights the relevant code; clicking code highlights relevant gates
3. **Error recovery** - Assembly errors show exactly where and why, one click to fix
4. **State inspection** - Hovering shows values without clicking through panels

### Critical Success Moments

| Moment | What Happens | How We Support It |
|--------|--------------|-------------------|
| First successful run | Code executes, circuit animates | Clear visual feedback, no ambiguity |
| First "aha" | User sees WHY an instruction works | Gate highlighting during step |
| First bug found | User traces problem in circuit | Signal path visualization |
| First limitation hit | User needs a feature CPU doesn't have | This IS the learning moment |

### Experience Principles

1. **Show, don't tell** - The circuit visualization IS the explanation. No tooltips needed if the animation is clear.

2. **Tight feedback loops** - Every action has immediate, visible response. < 100ms for user actions, 30fps for animation.

3. **Code and circuit are one** - They're not two views of the same thing; they're connected. Select one, highlight the other.

4. **Friction is intentional** - The CPU's limitations create learning. The UI should have zero friction; the architecture creates productive struggle.

5. **Inventor's workshop, not classroom** - Dense, powerful, professional. Respect the user's intelligence.

---

## Desired Emotional Response

### Primary Emotional Goals

**Ultimate Goal:** Transform from "student learning" to "inventor creating"

The user should feel like they ARE the person who invented this CPU, not someone following a tutorial about how CPUs work.

**During Core Interaction (code-to-circuit):**

| Emotion | Description | How It Manifests |
|---------|-------------|------------------|
| **Clarity** | "I see exactly why that happened" | Circuit visualization explains the instruction |
| **Control** | "I can examine anything I want" | Hover, click, zoom—nothing hidden |
| **Discovery** | "I didn't expect that—interesting" | Exploration rewarded, surprises lead to learning |
| **Flow** | Time disappears, fully absorbed | Tight feedback loop, no interruptions |
| **Competence** | "I understand this machine" | Growing mastery with each session |

### Emotional Journey Mapping

| Phase | Desired Emotion | Design Support |
|-------|-----------------|----------------|
| **First Open** | Intrigue + Approachability | Professional but not intimidating |
| **First Program** | Accomplishment + Ownership | "I made this work" |
| **First Step-Through** | Clarity + Wonder | Circuit animation creates "aha" |
| **First Bug** | Curiosity, not frustration | Traceable, explorable, solvable |
| **First Limitation Hit** | Productive struggle | This IS the learning—feel the constraint |
| **Session End** | Satisfaction + Anticipation | Want to come back, eager for more |
| **Returning** | Familiarity + Progress | Pick up where left off, see growth |

### Micro-Emotions

**Cultivate:**
- **Confidence** over confusion—every state is visible and understandable
- **Accomplishment** over frustration—even failures teach something
- **Delight** in the "aha" moments—circuit animation creates mini-revelations
- **Ownership** over following—"I built this" not "I completed the lesson"

**Avoid:**
- **Overwhelm**—progressive disclosure, don't show everything at once
- **Lost**—always know what instruction is executing, where you are
- **Blocked**—errors should explain and guide, not just reject
- **Passive**—never watching a video, always doing

### Design Implications

| Emotional Goal | UX Design Choice |
|----------------|------------------|
| Clarity | Circuit highlights active gates during step; signals animate visibly |
| Control | Everything inspectable on hover; no hidden state |
| Discovery | Zoom into any component; follow any signal path |
| Flow | Keyboard shortcuts for everything; no modal interruptions |
| Competence | Visible progress; increasingly complex programs work |
| Ownership | No "lessons" or "tutorials"—just tools and challenges |

### Emotional Design Principles

1. **Earned understanding** - Don't explain; let the visualization explain. Understanding feels better when discovered.

2. **Productive struggle** - The CPU's limitations should frustrate (that creates learning). The UI should never frustrate.

3. **Visible everything** - Anxiety comes from hidden state. Show all registers, all memory, all signals. Clarity creates confidence.

4. **Respect intelligence** - Dense, powerful interface. Don't dumb down. The user is becoming an expert.

5. **Celebrate progress** - Each working program, each understood concept, each "aha" should feel like a win.

---

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**VS Code**
| What Works | Apply To Digital Archaeology |
|------------|------------------------------|
| Multi-pane layout | Editor + Circuit + Debugger + State panels |
| Command palette for discovery | Find actions when needed |
| Extensions/customization | Future: user-defined views, themes |
| Integrated terminal/debug | Assembler output, emulator state in same window |

**Logisim**
| What Works | Apply To Digital Archaeology |
|------------|------------------------------|
| Visual circuit editing | Gate-level visualization |
| **Click-driven interaction** | Mouse-first, point and click |
| Signal propagation animation | 30fps signal flow during step |
| Component hierarchy | Subcircuits → full circuits |
| Probe/inspection tools | Hover to see signal values |

**Nand2Tetris Web Tools**
| What Works | Apply To Digital Archaeology |
|------------|------------------------------|
| Immediate feedback | Assemble → Run → See result instantly |
| Focused scope per level | Each stage has appropriate constraints |
| Educational progression | Build on previous knowledge |
| Browser-based, no install | SPA/PWA approach |

### Transferable UX Patterns

**The Layer Model (Key Innovation)**

One program, all layers. Peel back to see inner workings.

```
┌─────────────────────────────────────────┐
│           Full System View              │  ← Micro32 level
│  ┌─────────────────────────────────┐   │
│  │        Component View           │   │  ← ALU, Registers, Control
│  │  ┌─────────────────────────┐   │   │
│  │  │      Gate View          │   │   │  ← AND, OR, XOR, MUX
│  │  │  ┌─────────────────┐   │   │   │
│  │  │  │  Discrete View  │   │   │   │  ← Transistors (future)
│  │  │  └─────────────────┘   │   │   │
│  │  └─────────────────────────┘   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Like Google Maps:** Zoom from globe → street view. All one interface, all mouse-driven.

**Navigation Patterns to Adopt:**
- VS Code's sidebar + multi-pane layout
- Logisim's **click-to-enter-subcircuit** navigation
- Google Maps' scroll-to-zoom, drag-to-pan

**Interaction Patterns to Adopt:**
- **Mouse-first:** Click buttons, click circuit, click to inspect
- Hover-to-preview for quick info
- Right-click context menus for advanced actions
- Drag-and-drop where natural
- Keyboard shortcuts available but not required

### Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Our Approach |
|--------------|--------------|--------------|
| Keyboard-required workflows | Not everyone wants keyboard | Mouse-first, keyboard optional |
| Separate tools per layer | Context switching breaks flow | One tool, zoom between layers |
| Hidden state | Creates confusion | Everything visible, inspectable |
| Modal dialogs | Interrupts flow | Inline feedback, panels not popups |
| Tutorial overlays | Feels like school | Tools + challenges, not lessons |

### Design Inspiration Strategy

**Adopt Directly:**
- Logisim's mouse-driven, click-to-explore approach
- Google Maps' zoom/pan for circuit navigation
- Nand2Tetris's immediate feedback loop

**Adapt:**
- VS Code's layout (but mouse-first interaction)
- IDE debugging panels → CPU state inspection (clickable)

**Innovate:**
- **Unified layer model** - One tool from transistors to systems
- **Code-circuit bidirectional linking** - Click code → highlight gates. Click gate → highlight code.
- **Journey-aware defaults** - Start at appropriate abstraction for current stage

**Input Model:**
- Primary: Mouse (click, hover, drag, scroll-zoom)
- Secondary: Keyboard shortcuts for power users who want them
- Touch: Future consideration

---

## Design Direction

### Selected: Dense Professional with Story Mode

After evaluating design directions and iterating on mockups, the final design combines **Dense Professional** (for the Lab) with a **Story Mode** for narrative-driven learning. Users flip between these two modes seamlessly.

**Final Design: B10 - Flip Between Story & Lab**

The application has two primary views that users toggle between:

| Mode | Purpose | Visual Style |
|------|---------|--------------|
| **Story Mode** | Narrative, role-playing, choices | Warm gold/copper tones, serif typography, immersive |
| **Lab Mode** | Code editing, circuit visualization, debugging | Dense Professional IDE, cool blue accent, monospace |

**Why This Approach:**
- Supports "inventor" identity transformation through role-playing
- Story provides context and motivation for technical challenges
- Lab provides hands-on building and experimentation
- Seamless transition maintains flow state
- Each mode optimized for its purpose

**Enhanced Error Display (Key Feature in Lab Mode):**
- Every error shows **Type** (SYNTAX_ERROR, MEMORY_ERROR, etc.)
- **Component context** (which gate, which instruction type)
- **Circuit path** showing signal flow to error location
- **Actionable suggestions** with one-click fixes
- Full instruction metadata (opcode, operand types, categories)

---

## Two-Mode Interface Architecture

### Overview

The application consists of two distinct views that users flip between:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STORY MODE                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [📜 Story] [⚡ Lab]  Progress: ● ○ ○ ○ ○   Era: 1971            │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  "Your Role"     │  Chapter Title, Setting, Narrative,             │   │
│  │   Floating       │  Character Cards, Dialogue, Choices             │   │
│  │   Panel          │                                                  │   │
│  │                  │  [Enter the Lab] button                         │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↕ flip                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [📜 Story] [⚡ Lab]  File Edit View Debug Help                    │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Activity │ Sidebar    │ Code Editor │ Circuit View                 │   │
│  │ Bar      │ (Objectives│ (Monaco)    │ (Canvas)                     │   │
│  │ [📜→]    │  Registers)│             │                              │   │
│  │          │            │             │                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                         LAB MODE                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Navigation Between Modes

**Toggle Controls:**
- **Story Mode:** Toggle buttons in fixed header (`[📜 Story] [⚡ Lab]`)
- **Lab Mode:** Toggle buttons in menu bar + Story icon in activity bar

**Transition Points:**
- "Enter the Lab" button in story footer
- Choice cards that lead to lab challenges
- Activity bar icon (📜) in Lab Mode returns to story
- Keyboard: No keyboard shortcut required (mouse-first)

### Story Mode Components

#### Fixed Navigation Bar (48px)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Digital Archaeology  [📜 Story] [⚡ Lab]  Act: ● ○ ○ ○ ○  │ 1971  │ [Save] │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Element | Description |
|---------|-------------|
| App logo | "Digital Archaeology" in gold accent |
| View toggle | Story/Lab flip buttons |
| Progress dots | Current act indicator (1 of 5) |
| Era badge | Historical context (e.g., "1971 — Dawn of the Microprocessor") |
| Actions | Journal, Save buttons |

**CSS Note:** Navigation is `position: fixed` so it stays visible while scrolling.

#### "Your Role" Panel (Floating Left)
Shows the user's character in the story:

```
┌──────────────────────┐
│    YOUR ROLE         │
│       [👤]           │
│   Junior Engineer    │
│ Fairchild Semiconductor│
├──────────────────────┤
│ Era: 1971            │
│ Location: Mountain View│
│ Experience: 3 weeks  │
│ Specialty: Logic Design│
├──────────────────────┤
│ Discoveries Made:    │
│ [AND Gate] [Half Adder]│
│ [Full Adder]         │
└──────────────────────┘
```

#### Chapter Header
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ACT I — 1971                                       │
│                     The Humbling Beginning                                  │
│     In which you discover that computation begins with the simplest gates   │
└─────────────────────────────────────────────────────────────────────────────┘
```

Typography: Crimson Text (serif) for immersive narrative feel.

#### Scene Setting Box
Visual container establishing location and atmosphere:
- Label: "Setting" (positioned above border)
- Italic descriptive text
- Background gradient with gold border

#### Character Cards
Introduce NPCs with personality and context:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [👩‍🔬]  Dr. Sarah Chen                                                       │
│        SENIOR DESIGN ENGINEER                                               │
│        ─────────────────────────────────────────────────────────────────   │
│        One of the few women in semiconductor design, Dr. Chen earned her    │
│        PhD from MIT in 1965. Known for her work on the 74181 ALU chip.     │
│        ─────────────────────────────────────────────────────────────────   │
│        Expertise: Digital Logic, ALU Design  │  Years at Fairchild: 6      │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Element | Purpose |
|---------|---------|
| Photo/Avatar | Visual identity (emoji placeholder for MVP) |
| Name | Character name in gold accent |
| Title | Role/position in uppercase |
| Bio | 2-3 sentences of background |
| Stats | Key attributes for context |

#### Dialogue Blocks
Character speech with visual distinction:
- Left border in copper accent color
- Speaker name in uppercase
- Dialogue text in serif font

#### Technical Notes
Bridge between narrative and technical content:
- Blue accent styling (matches Lab mode)
- Monospace font for code elements
- Clear "Technical Note" label

#### Choice Cards
Interactive story branching:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [🔧]  Stick with Ripple-Carry                                          [→] │
│       Continue with the working design. It's slower, but reliable.         │
├─────────────────────────────────────────────────────────────────────────────┤
│ [💡]  Investigate Carry Look-Ahead                                     [→] │
│       There must be a way to predict carries. Time to experiment.          │
├─────────────────────────────────────────────────────────────────────────────┤
│ [🗣️]  Ask Dr. Chen for Guidance                                        [→] │
│       She clearly knows something. Ask for a more direct hint.             │
└─────────────────────────────────────────────────────────────────────────────┘
```

Interactions:
- Hover: Slide right, gold border, background tint
- Click: Navigate to next scene or transition to Lab

#### Story Actions Footer
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [← Previous Scene]              [⚡ Enter the Lab]           [Continue →]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Lab Mode Components

Lab Mode uses the Dense Professional layout (VS Code-inspired) with these additions:

#### Story Integration Points
- **Menu bar toggle:** Story/Lab buttons at left of menu
- **Activity bar icon:** 📜 icon to return to story (gold accent)
- **Status bar era:** Shows current historical era (e.g., "1971 — Micro4")
- **Challenge objectives:** Story-driven tasks appear in sidebar

#### Challenge Objectives Section
Connects story goals to lab tasks:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 💡 CHALLENGE: CARRY LOOK-AHEAD                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  [✓] Implement Generate (G) logic                                          │
│  [✓] Implement Propagate (P) logic                                         │
│  [ ] Build carry look-ahead unit                                           │
│  [ ] Connect to sum generators                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

Styling:
- Gold border to connect to story theme
- Checkmarks for completed objectives
- Progress visible in status bar

### Color Systems

**Story Mode Palette:**
| Token | Hex | Usage |
|-------|-----|-------|
| `--story-bg-deep` | `#0a0a12` | Main background |
| `--story-bg` | `#12121a` | Nav and cards |
| `--story-bg-card` | `#1e1e2a` | Card backgrounds |
| `--story-border` | `rgba(212,165,116,0.15)` | Subtle borders |
| `--persona-gold` | `#d4a574` | Primary accent |
| `--persona-warm` | `#c9956e` | Secondary accent |
| `--persona-copper` | `#b87333` | Dialogue, emphasis |

**Lab Mode Palette:** Uses existing Dense Professional colors (see Visual Foundation section).

### Typography

**Story Mode:**
- `Crimson Text` (serif) for narrative text, chapter titles
- System sans-serif for UI elements
- `Source Code Pro` for technical notes

**Lab Mode:**
- `Source Code Pro` / `JetBrains Mono` for code
- System sans-serif for UI

### Responsive Behavior

| Width | Story Mode | Lab Mode |
|-------|------------|----------|
| ≥1200px | "Your Role" panel visible | Full layout |
| <1200px | "Your Role" panel hidden | Panels collapsible |
| <768px | Not supported (show message) | Not supported |

### Mockup Reference

**Canonical Design:** `_bmad-output/planning-artifacts/mockups/option-b10-flip-views.html`

This HTML mockup demonstrates:
- Full Story Mode with all components
- Full Lab Mode with B6 layout
- JavaScript toggle between views
- Character cards and "Your Role" panel
- Fixed navigation in story mode

---

## Design System Foundation

### Design System Choice

**Selected:** Tailwind CSS

A utility-first CSS framework that provides low-level utility classes to build custom designs without fighting pre-built component styles.

### Rationale for Selection

| Factor | Why Tailwind Fits |
|--------|-------------------|
| Custom aesthetic | No pre-built component look to override—build "workshop" feel from scratch |
| Solo developer | Fast iteration without writing custom CSS for every element |
| Firefox-first | Works great, no browser-specific issues |
| Canvas integration | Tailwind handles UI; Canvas handles circuit—clean separation |
| Learning curve | Shallow—utility classes are intuitive |
| No framework lock-in | Just CSS classes—easy to migrate if needed |

### Implementation Approach

**Core Stack:**
```
Tailwind CSS     → Layout, panels, buttons, toolbars
Monaco Editor    → Code editing (VS Code's engine)
Custom Canvas    → Circuit visualization
CSS Grid         → Main layout structure
```

**Setup:**
- Tailwind via CDN for MVP (no build step needed)
- Upgrade to PostCSS build later if needed for purging unused styles

**Color Strategy:**
- Dark theme default (workshop aesthetic)
- High contrast for circuit signals (bright on dark)
- Muted UI elements so circuit visualization stands out

### Customization Strategy

**Tailwind Config Customizations:**

| Token | Purpose |
|-------|---------|
| `colors.signal.high` | Wire carrying 1 (bright green/cyan) |
| `colors.signal.low` | Wire carrying 0 (dim/gray) |
| `colors.gate.*` | Gate type colors (AND, OR, XOR, etc.) |
| `colors.surface.*` | Panel backgrounds (dark grays) |
| `colors.accent` | Active instruction, selected element |

**Component Patterns:**

| Component | Approach |
|-----------|----------|
| Toolbar | Tailwind flex, icon buttons |
| Panels | Tailwind grid, resizable with CSS |
| Buttons | Custom Tailwind classes, minimal style |
| State displays | Monospace text, grid layouts |

**Typography:**
- Monospace for code, memory, registers (e.g., `JetBrains Mono`, `Fira Code`)
- Sans-serif for UI labels (system font stack for speed)

### Design Tokens

```css
/* Core palette for Digital Archaeology */
--da-bg-primary: #1a1a2e;      /* Deep dark blue-gray */
--da-bg-secondary: #16213e;    /* Panel backgrounds */
--da-bg-tertiary: #0f3460;     /* Hover states */
--da-text-primary: #e4e4e4;    /* Main text */
--da-text-muted: #8a8a8a;      /* Secondary text */
--da-signal-high: #00ff88;     /* Wire = 1 */
--da-signal-low: #3a3a3a;      /* Wire = 0 */
--da-accent: #00b4d8;          /* Selection, active */
--da-error: #ff6b6b;           /* Errors */
--da-success: #51cf66;         /* Success states */
```

---

## Defining Experience

### The Core Interaction

**"Step through code and watch your CPU come alive"**

This is how users will describe Digital Archaeology. It's the moment that creates understanding—the defining experience that makes everything else follow.

### The Step-Through Moment

When the user clicks **Step**:

**1. Code Side:**
- Current instruction highlights (accent color)
- Previous instruction dims
- Line number pulses briefly

**2. Circuit Side (simultaneously):**
- Relevant gates illuminate
- Signals animate along wires (30fps)
- Active path glows (signal high = bright, signal low = dim)
- Inactive components stay muted

**3. State Side:**
- Changed registers flash then settle
- Memory cells that changed highlight
- Flags update with visual feedback

**4. The Connection:**
- Click a gate → code that uses it highlights
- Click code → gates it activates highlight
- Hover shows relationship without clicking

### Success Criteria

| Criteria | Measurement |
|----------|-------------|
| Instant feedback | < 100ms from click to visual change |
| Causality visible | User sees WHY registers changed |
| No confusion | Always know what instruction is executing |
| Explorable | Can follow any signal path by clicking |
| Reversible | Can step backward to see previous state |

### Novel UX Pattern

**Bidirectional code-circuit linking** - This doesn't exist in other tools:
- Logisim has circuits, no code
- VS Code has code, no circuits
- Digital Archaeology has **both, connected**

**Familiar Patterns Applied:**
- Debugger step controls (from IDEs)
- Canvas pan/zoom (from Google Maps)
- Syntax highlighting (from code editors)
- Hover-to-inspect (from DevTools)

### Experience Mechanics

**Initiation:**
- User writes/loads assembly code
- Clicks "Assemble" button
- If successful, "Step" and "Run" buttons enable

**Interaction:**
- **Step:** Execute one instruction, animate circuit
- **Run:** Execute continuously at adjustable speed
- **Stop:** Pause execution
- **Reset:** Return to initial state

**Feedback:**
- Gates glow during their clock cycle
- Wires animate signal propagation
- Changed state values flash
- Errors show inline in code + circuit location

**Completion:**
- Program halts (HLT instruction)
- Final state visible
- Can reset and modify code

---

## Visual Foundation

### Color System

**Philosophy:** Dark workshop aesthetic where the circuit visualization is the star. UI elements stay muted; signals pop.

#### Core Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--da-bg-primary` | `#1a1a2e` | Main application background |
| `--da-bg-secondary` | `#16213e` | Panel backgrounds, cards |
| `--da-bg-tertiary` | `#0f3460` | Hover states, active panels |
| `--da-bg-elevated` | `#1f2847` | Floating elements, dropdowns |

#### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--da-text-primary` | `#e4e4e4` | Main text, headings |
| `--da-text-secondary` | `#b0b0b0` | Secondary text, labels |
| `--da-text-muted` | `#8a8a8a` | Disabled, hints |
| `--da-text-inverse` | `#1a1a2e` | Text on light backgrounds |

#### Signal Colors (Circuit Visualization)

| Token | Hex | Usage |
|-------|-----|-------|
| `--da-signal-high` | `#00ff88` | Wire carrying 1 (bright, glowing) |
| `--da-signal-low` | `#3a3a3a` | Wire carrying 0 (dim, recessed) |
| `--da-signal-unknown` | `#ffaa00` | Uninitialized/floating signal |
| `--da-signal-error` | `#ff4444` | Invalid signal state |

#### Gate Type Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--da-gate-and` | `#4ecdc4` | AND gates |
| `--da-gate-or` | `#ff6b6b` | OR gates |
| `--da-gate-xor` | `#c44dff` | XOR gates |
| `--da-gate-not` | `#ffd93d` | NOT/inverter gates |
| `--da-gate-mux` | `#6bcb77` | Multiplexers |
| `--da-gate-reg` | `#4d96ff` | Registers, flip-flops |

#### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--da-accent` | `#00b4d8` | Selection, active instruction, focus |
| `--da-success` | `#51cf66` | Success states, passed tests |
| `--da-warning` | `#ffc107` | Warnings, cautions |
| `--da-error` | `#ff6b6b` | Errors, failed assembly |
| `--da-info` | `#74c0fc` | Informational highlights |

### Typography System

**Philosophy:** Monospace for everything technical (code, values, addresses). Clean sans-serif for UI chrome.

#### Font Stack

```css
/* Code, registers, memory, addresses */
--da-font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace;

/* UI labels, buttons, tooltips */
--da-font-ui: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

#### Type Scale

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `--da-text-xs` | 11px | 1.4 | Tiny labels, wire values |
| `--da-text-sm` | 13px | 1.4 | Secondary info, tooltips |
| `--da-text-base` | 14px | 1.5 | Body text, code editor |
| `--da-text-md` | 16px | 1.5 | Panel headers |
| `--da-text-lg` | 18px | 1.4 | Section titles |
| `--da-text-xl` | 24px | 1.3 | Major headings |

#### Font Weights

| Token | Weight | Usage |
|-------|--------|-------|
| `--da-font-normal` | 400 | Body text, code |
| `--da-font-medium` | 500 | Labels, buttons |
| `--da-font-semibold` | 600 | Panel headers |
| `--da-font-bold` | 700 | Emphasis, headings |

### Spacing System

**Philosophy:** Consistent 4px base unit. Dense but not cramped—respect the power user.

#### Base Unit

```css
--da-space-unit: 4px;
```

#### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--da-space-1` | 4px | Tight gaps, inline spacing |
| `--da-space-2` | 8px | Icon gaps, small padding |
| `--da-space-3` | 12px | Button padding, list gaps |
| `--da-space-4` | 16px | Card padding, section gaps |
| `--da-space-5` | 20px | Panel padding |
| `--da-space-6` | 24px | Major section gaps |
| `--da-space-8` | 32px | Large separations |
| `--da-space-12` | 48px | Major layout gaps |

### Layout Foundation

#### Panel Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Toolbar (48px fixed height)                                      │
├─────────────────┬───────────────────────────┬───────────────────┤
│                 │                           │                   │
│ Code Editor     │  Circuit Visualizer       │  State Panel      │
│ (resizable)     │  (fills remaining)        │  (resizable)      │
│                 │                           │                   │
│ min: 250px      │  min: 400px               │  min: 200px       │
│ default: 350px  │                           │  default: 280px   │
│                 │                           │                   │
├─────────────────┴───────────────────────────┴───────────────────┤
│ Status Bar (24px fixed height)                                   │
└─────────────────────────────────────────────────────────────────┘
```

#### Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| `desktop-lg` | ≥1440px | Full 3-column layout |
| `desktop` | ≥1024px | 3-column, smaller panels |
| `tablet` | ≥768px | 2-column, state panel as overlay |
| `mobile` | <768px | Not supported (show message) |

#### Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--da-z-base` | 0 | Default content |
| `--da-z-panel` | 10 | Floating panels |
| `--da-z-dropdown` | 100 | Dropdowns, menus |
| `--da-z-tooltip` | 200 | Tooltips |
| `--da-z-modal` | 300 | Modal overlays |
| `--da-z-toast` | 400 | Notifications |

### Component Styling

#### Buttons

```css
/* Primary action (Assemble, Run) */
.btn-primary {
  background: var(--da-accent);
  color: var(--da-text-inverse);
  padding: var(--da-space-2) var(--da-space-4);
  border-radius: 4px;
  font-weight: var(--da-font-medium);
}

/* Secondary action (Reset, Stop) */
.btn-secondary {
  background: var(--da-bg-tertiary);
  color: var(--da-text-primary);
  border: 1px solid var(--da-text-muted);
}

/* Icon-only button (toolbar) */
.btn-icon {
  width: 32px;
  height: 32px;
  padding: var(--da-space-1);
  border-radius: 4px;
}
```

#### Panels

```css
.panel {
  background: var(--da-bg-secondary);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.panel-header {
  padding: var(--da-space-3) var(--da-space-4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-weight: var(--da-font-semibold);
}
```

#### State Displays (Registers, Memory)

```css
.register-display {
  font-family: var(--da-font-mono);
  font-size: var(--da-text-base);
  background: var(--da-bg-primary);
  padding: var(--da-space-2);
  border-radius: 3px;
}

.register-changed {
  animation: flash-highlight 0.3s ease-out;
  background: var(--da-accent);
}
```

### Accessibility

#### Color Contrast

All text meets WCAG AA standards:
- Primary text on backgrounds: 12:1 contrast ratio
- Secondary text on backgrounds: 7:1 contrast ratio
- Signal colors designed for visibility, not just aesthetics

#### Focus Indicators

```css
:focus-visible {
  outline: 2px solid var(--da-accent);
  outline-offset: 2px;
}
```

#### Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### Keyboard Navigation (Available but not required)

- Tab navigation through all interactive elements
- Arrow keys for list navigation
- Escape to close panels/modals
- All keyboard shortcuts have mouse alternatives

---

## Core Screens & Wireframes

### Design Direction: Story Mode + Lab Mode (B10)

Two-mode interface: Story Mode for narrative/role-playing, Lab Mode for hands-on development. Users flip between them seamlessly. Lab Mode uses Dense Professional layout—information-rich, every pixel earns its place. Story Mode uses warm, immersive styling for narrative engagement.

**See "Two-Mode Interface Architecture" section above for complete Story Mode specifications.**

### Lab Mode: Main Development Environment

The primary interface where users spend most of their technical work time.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ ┌─[File]─[Edit]─[View]─[Debug]─[Help]───────────────────────────────────────[⚙]─┐  │
│ │ [⚡Assemble] [▶ Run] [⏸] [⏹ Reset] [⏭ Step] [⏮ Back] │ Speed:[━━━●━━━] 10Hz   │  │
│ └───────────────────────────────────────────────────────────────────────────────┘  │
├───────────────────┬──────────────────────────────────────┬──────────────────────────┤
│ CODE           [x]│ CIRCUIT                           [x]│ STATE                 [x]│
│───────────────────│──────────────────────────────────────│──────────────────────────│
│▸ 1│ ; Micro4 Demo │ ┌─ ALU ────────────────────────────┐ │ ▼ REGISTERS              │
│  2│ ; Add two nums│ │                                  │ │ ┌──────┬───────┬───────┐│
│  3│               │ │   ┌─────┐         ┌─────┐       │ │ │ Name │ Hex   │ Dec   ││
│▸ 4│ LDA 0x10   ◀──┼─┼───┤ AND ├────●────┤ OR  ├───●   │ │ ├──────┼───────┼───────┤│
│  5│ ADD 0x11      │ │   └─────┘    │    └─────┘   │   │ │ │ PC   │ 0x04  │ 4     ││
│  6│ STA 0x12      │ │   type:AND   │    type:OR   │   │ │ │ ACC  │ 0x0F  │ 15    ││
│● 7│ HLT           │ │   gate:G17   │    gate:G23  │   │ │ │ Z    │ 0     │ false ││
│  8│               │ │              │              │   │ │ └──────┴───────┴───────┘│
│  9│ .org 0x10     │ │   ┌─────┐    │    ┌─────┐   │   │ │                          │
│ 10│ .byte 0x05    │ │   │ XOR ├────┴────┤ MUX ├───┴   │ │ ▼ FLAGS                  │
│ 11│ .byte 0x0A    │ │   └─────┘         └─────┘       │ │ ┌──────┬───────┬───────┐│
│ 12│ .byte 0x00    │ │   type:XOR        type:MUX      │ │ │ Zero │ 0     │ clear ││
│───────────────────│ │   gate:G31        gate:G45      │ │ │ Carry│ 1     │ SET   ││
│ Ln 4, Col 1       │ └──────────────────────────────────┘ │ └──────┴───────┴───────┘│
│ Inst: LDA         │──────────────────────────────────────│                          │
│ Type: DATA_MOVE   │ View: [100%▾] [Fit] [1:1] [Grid ☑]  │ ▼ MEMORY     [Jump:____] │
│ Opcode: 0x1       │ Path: CPU > ALU > Adder             │ ┌──────┬─────┬─────┬────┐│
│ Operand: ADDR     │                                      │ │ Addr │ Hex │ Dec │ Ch ││
│                   │ Signals:                             │ ├──────┼─────┼─────┼────┤│
│                   │  data_bus: 0x05                      │ │ 0x10 │ 05  │   5 │ .  ││
│                   │  addr_bus: 0x10                      │ │ 0x11 │ 0A  │  10 │ .  ││
│                   │  alu_op:   PASS                      │ │ 0x12 │ 0F◀ │  15 │ .  ││
│                   │  write_en: 0                         │ │ 0x13 │ 00  │   0 │ .  ││
│                   │                                      │ └──────┴─────┴─────┴────┘│
│ Breakpoints: 1    │                                      │ Showing: 0x10-0x1F       │
├───────────────────┴──────────────────────────────────────┴──────────────────────────┤
│ ✓ Assembled: 12B │ PC:0x04 │ Inst:LDA(DATA_MOVE) │ Cycle:4 │ BPs:1 │ Errs:0       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Key Dense Professional Features:**
- Full menu bar (File, Edit, View, Debug, Help)
- Closable panels with [x] buttons
- Instruction metadata in code panel (type, opcode, operand kind)
- Gate labels showing type and ID in circuit
- Signal values displayed in circuit panel
- Breadcrumb path for circuit navigation
- Rich status bar with all relevant counters
- Multiple number formats in state panel (hex + dec)

### Panel: Code Editor

**Purpose:** Write and view assembly code

**Features:**
- Line numbers (always visible)
- Syntax highlighting (opcodes, labels, comments, values)
- Current instruction highlight (accent background on active line)
- Error markers (red squiggle, gutter icon)
- Breakpoint gutter (click to toggle)

**Interactions:**
- Click line → set cursor
- Click gutter → toggle breakpoint
- Click error → show error details
- Ctrl+Enter → assemble (or click button)

### Panel: Circuit Visualizer

**Purpose:** Show gate-level circuit with signal animation

**Features:**
- Gates rendered as standard symbols (AND, OR, XOR, NOT, MUX)
- Wires connecting gates
- Signal state visualization (bright = 1, dim = 0)
- Component labels on hover
- Current execution path highlighted
- Zoom levels (overview → gate detail)

**Interactions:**
- Scroll → zoom in/out
- Drag → pan
- Click gate → highlight related code
- Click wire → show signal value + source/destination
- Double-click component → zoom to fill view
- Right-click → context menu (trace signal, show datasheet)

**Animation:**
- On step: signals propagate along wires (30fps)
- Active gates pulse briefly
- Changed outputs flash then settle

### Panel: State Panel

**Purpose:** Display CPU state (registers, flags, memory)

**Sections:**

**Registers (collapsible):**
```
▼ REGISTERS
┌─────────────────────────────┐
│ PC   │ 0x04  │ ████░░░░    │  ← progress bar optional
│ ACC  │ 0x0F  │              │
│ Z    │ 0     │              │
└─────────────────────────────┘
```

**Memory (collapsible, scrollable):**
```
▼ MEMORY
┌─────────────────────────────┐
│ Addr │ Hex  │ Dec │ ASCII  │
│──────┼──────┼─────┼────────│
│ 0x10 │ 0x05 │   5 │ .      │
│ 0x11 │ 0x0A │  10 │ .      │
│ 0x12 │ 0x0F │  15 │ . ◀    │  ← changed indicator
└─────────────────────────────┘
[Jump to: ____] [Show: 16 rows ▾]
```

**Interactions:**
- Click register → highlight in circuit
- Click memory cell → edit value (in debug mode)
- Changed values flash accent color, then fade
- Hover → show all representations (hex, dec, bin, ASCII)

### Toolbar

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [📁▾]  [⚡ Assemble]  [▶ Run] [⏸] [⏹ Reset] [⏭ Step]      │ [?] [⚙]      │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Button | Action | State Changes |
|--------|--------|---------------|
| File ▾ | Dropdown: New, Open, Save, Examples | Always enabled |
| Assemble | Compile assembly to binary | Enabled when code exists |
| Run | Execute continuously | Enabled after assemble; toggles to Pause |
| Pause | Pause execution | Shown during Run |
| Reset | Return to initial state | Enabled after assemble |
| Step | Execute one instruction | Enabled after assemble |
| ? | Help/keyboard shortcuts | Always enabled |
| ⚙ | Settings (speed, view options) | Always enabled |

### Status Bar

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ✓ Assembled: 12 bytes │ PC: 0x04 │ Next: ADD 0x11 │ Cycle: 4 │ Speed: 1Hz  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Shows:**
- Assembly status (success/error count)
- Current PC value
- Next instruction to execute
- Cycle count
- Execution speed (when running)

### Error States

Errors display rich contextual information including component types, instruction categories, and diagnostic details.

**Assembly Error - Syntax:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ✗ ASSEMBLY FAILED                                              2 errors   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ERROR 1 of 2 ─────────────────────────────────────────────────────────────│
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Type:        SYNTAX_ERROR / Unknown Instruction                     │   │
│  │ Location:    Line 4, Column 1                                       │   │
│  │ Token:       'LODA'                                                 │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │   2 │   ; Add two numbers                                          │   │
│  │   3 │                                                               │   │
│  │ ► 4 │   LODA 0x10        ← unknown instruction                     │   │
│  │   5 │   ADD 0x11                                                    │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Suggestion:  Did you mean 'LDA'? (Load Accumulator)                 │   │
│  │ Category:    DATA_MOVEMENT instructions: LDA, STA                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  [Apply Fix: LDA] [Ignore] [Show All DATA_MOVEMENT Instructions]           │
│                                                                             │
│  ERROR 2 of 2 ─────────────────────────────────────────────────────────────│
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Type:        VALUE_ERROR / Invalid Hex Literal                      │   │
│  │ Location:    Line 7, Column 9                                       │   │
│  │ Token:       '0xGG'                                                 │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ ► 7 │   STA 0xGG         ← invalid hex digit 'G'                   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Expected:    Hex value 0x00-0xFF (valid digits: 0-9, A-F)           │   │
│  │ Operand:     ADDRESS (8-bit memory location)                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  [Edit Value] [Show Memory Map]                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Assembly Error - Constraint:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ✗ ASSEMBLY FAILED                                              1 error    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Type:        CONSTRAINT_ERROR / Program Too Large                   │   │
│  │ Limit:       256 bytes (Micro4 address space)                       │   │
│  │ Actual:      312 bytes                                              │   │
│  │ Overflow:    56 bytes over limit                                    │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ MEMORY MAP                                                          │   │
│  │ ┌──────────────────────────────────────────────────────────────┐   │   │
│  │ │ 0x00 ████████████████████████████████████████ 0xFF           │   │   │
│  │ │      [====== CODE: 198B ======][== DATA ==][/// OVERFLOW ///]│   │   │
│  │ └──────────────────────────────────────────────────────────────┘   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Suggestions:                                                        │   │
│  │  • Reduce code size (current: 47 instructions)                      │   │
│  │  • Use shorter instruction forms where available                    │   │
│  │  • Move to Micro8 for 64KB address space (future)                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  [Show Instruction Sizes] [Optimize Suggestions]                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Runtime Error - Memory:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚠ EXECUTION HALTED                                        Runtime Error   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Type:        MEMORY_ERROR / Invalid Read                            │   │
│  │ Severity:    FATAL - Cannot continue execution                      │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ INSTRUCTION CONTEXT                                                 │   │
│  │  PC:           0x07                                                 │   │
│  │  Instruction:  LDA 0xFF                                             │   │
│  │  Inst. Type:   DATA_MOVEMENT / Load                                 │   │
│  │  Opcode:       0x1 (LDA immediate)                                  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ MEMORY ACCESS                                                       │   │
│  │  Operation:    READ                                                 │   │
│  │  Address:      0xFF                                                 │   │
│  │  Status:       UNMAPPED (outside valid range)                       │   │
│  │  Valid Range:  0x00 - 0x7F (128 bytes allocated)                    │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ CIRCUIT LOCATION                                                    │   │
│  │  Component:    Memory Address Register (MAR)                        │   │
│  │  Gate Path:    Control Unit → MAR → Address Bus → Memory            │   │
│  │  Signal:       addr_bus = 0xFF (invalid)                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [View in Circuit] [View in Code] [Inspect MAR] [Memory Map] [Reset]       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Runtime Error - Arithmetic:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚠ WARNING                                                  Runtime Issue  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Type:        ARITHMETIC_WARNING / Overflow                          │   │
│  │ Severity:    WARNING - Execution continues                          │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ INSTRUCTION CONTEXT                                                 │   │
│  │  PC:           0x05                                                 │   │
│  │  Instruction:  ADD 0x11                                             │   │
│  │  Inst. Type:   ARITHMETIC / Addition                                │   │
│  │  Opcode:       0x3 (ADD memory)                                     │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ COMPUTATION                                                         │   │
│  │  Accumulator:  0x0E (14)                                            │   │
│  │  Operand:      0x0F (15) from address 0x11                          │   │
│  │  Result:       0x1D (29) → truncated to 0x0D (13)                   │   │
│  │  Carry Flag:   SET (overflow occurred)                              │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ CIRCUIT LOCATION                                                    │   │
│  │  Component:    ALU (Arithmetic Logic Unit)                          │   │
│  │  Subcomponent: 4-bit Adder                                          │   │
│  │  Gate:         Carry-out of bit 3                                   │   │
│  │  Signal:       carry_out = 1                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [View ALU in Circuit] [Continue] [Step Back] [Inspect Adder Gates]        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Error Type Categories:**

| Category | Types | Severity |
|----------|-------|----------|
| SYNTAX_ERROR | Unknown Instruction, Invalid Token, Missing Operand | FATAL (assembly) |
| VALUE_ERROR | Invalid Hex, Out of Range, Wrong Type | FATAL (assembly) |
| CONSTRAINT_ERROR | Program Too Large, Label Redefined | FATAL (assembly) |
| MEMORY_ERROR | Invalid Read, Invalid Write, Unmapped | FATAL (runtime) |
| ARITHMETIC_WARNING | Overflow, Underflow, Divide by Zero | WARNING (runtime) |
| EXECUTION_ERROR | Invalid Opcode, Halt, Breakpoint | INFO/FATAL (runtime) |

**Error Display Features:**
- Type badge with category and specific error
- Full instruction context (type, opcode, operand types)
- Circuit path showing which components/gates involved
- Signal values at point of error
- Actionable buttons (Fix, View in Circuit, Inspect Component)
- Code snippet with error location highlighted
- Suggestions based on error type

### Layer Navigation (Future: Multi-stage)

When viewing components that can be expanded:

```
┌──────────────────────────────────────────────────────────────┐
│  🔍 Viewing: ALU > Adder > Full Adder > Gate Level          │
│  [◀ Back to Adder] [🏠 CPU Overview]                        │
└──────────────────────────────────────────────────────────────┘
```

**Breadcrumb navigation:**
- Click any level to zoom out
- Double-click component to zoom in
- Mouse wheel zooms smoothly between levels

### Settings Panel (Overlay)

```
┌─────────────────────────────────────────────────────┐
│ ⚙ Settings                                    [✕]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ EXECUTION                                           │
│ ┌─────────────────────────────────────────────┐    │
│ │ Speed: [1 Hz ━━━━━━━━●━━━ 1000 Hz]         │    │
│ │ ☑ Animate signals                           │    │
│ │ ☑ Highlight active gates                    │    │
│ │ ☐ Auto-scroll code to PC                    │    │
│ └─────────────────────────────────────────────┘    │
│                                                     │
│ DISPLAY                                             │
│ ┌─────────────────────────────────────────────┐    │
│ │ Number format: [Hex ▾]                      │    │
│ │ Font size: [14px ▾]                         │    │
│ │ ☑ Show wire values                          │    │
│ │ ☑ Show component labels                     │    │
│ └─────────────────────────────────────────────┘    │
│                                                     │
│ KEYBOARD SHORTCUTS                                  │
│ ┌─────────────────────────────────────────────┐    │
│ │ Step:     F10                               │    │
│ │ Run:      F5                                │    │
│ │ Assemble: Ctrl+Enter                        │    │
│ │ Reset:    Ctrl+R                            │    │
│ └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### File Menu Dropdown

```
┌─────────────────────────────┐
│ 📄 New                      │
│ 📂 Open...                  │
│ 💾 Save                     │
│ 💾 Save As...               │
├─────────────────────────────┤
│ 📚 Examples                ▶│──┐
│    ├─ Hello World           │  │
│    ├─ Add Two Numbers       │  │
│    ├─ Countdown Loop        │  │
│    ├─ Fibonacci             │  │
│    └─ Memory Copy           │  │
├─────────────────────────────┤──┘
│ 📤 Export Binary            │
│ 📥 Import Binary            │
└─────────────────────────────┘
```

---

## Interaction Flows

### Flow 1: Write → Assemble → Debug

```
User Action                    System Response
───────────────────────────────────────────────────────────────
1. Types assembly code    →    Syntax highlighting updates
                              Line numbers visible

2. Clicks [Assemble]      →    Status: "Assembling..."
                              If success: "✓ Assembled: 12 bytes"
                                         [Run] [Step] [Reset] enable
                              If error: Error panel shows
                                       Error lines highlighted red

3. Clicks [Step]          →    PC advances
                              Current line highlights in code
                              Circuit animates signal flow
                              Changed registers/memory flash
                              Status bar updates

4. Clicks gate in circuit →    Related code line highlights
                              Tooltip shows gate details
                              Signal path traces backward

5. Clicks code line       →    Related gates highlight in circuit
                              Shows which hardware implements this
```

### Flow 2: Discover Through Limitation

```
User Action                    System Response
───────────────────────────────────────────────────────────────
1. Writes complex program →    Code appears in editor

2. Assembles              →    Error: "Program too large"
                              "Micro4 can only address 256 bytes"
                              "Your program needs 312 bytes"

                              [This is the learning moment]

3. User must:             →    Options visible in interface:
   - Simplify program          - Edit code
   - Use more efficient        - View memory map
     instructions              - Check instruction sizes
   - (Future) Move to
     Micro8
```

### Flow 3: Explore Circuit Layers

```
User Action                    System Response
───────────────────────────────────────────────────────────────
1. Views CPU overview     →    High-level blocks visible:
                              [PC] [ALU] [Registers] [Control]

2. Clicks [ALU] block     →    Zooms smoothly into ALU
                              Shows: [Adder] [Logic] [Shifter]
                              Breadcrumb: CPU > ALU

3. Clicks [Adder]         →    Zooms into adder
                              Shows: Full adders chained
                              Breadcrumb: CPU > ALU > Adder

4. Clicks [Full Adder]    →    Zooms to gate level
                              Shows: AND, OR, XOR gates
                              Breadcrumb: CPU > ALU > Adder > FA

5. Clicks breadcrumb      →    Zooms back to selected level
   "ALU"
```

### Flow 4: Error Recovery

```
User Action                    System Response
───────────────────────────────────────────────────────────────
1. Types: "LODA 0x10"     →    Line marked with warning
                              (Unknown instruction)

2. Clicks [Assemble]      →    Error panel:
                              "Line 4: Unknown instruction 'LODA'"
                              "Did you mean 'LDA'?"
                              [Fix ▶] button

3. Clicks [Fix ▶]         →    Code changes to "LDA 0x10"
                              Cursor moves to next error

4. Fixes remaining        →    Assembly succeeds
   errors                      Error panel closes
```

---

## Implementation Notes

### Technology Decisions

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Code Editor | Monaco Editor | VS Code engine, excellent syntax highlighting API |
| Circuit Canvas | HTML5 Canvas + requestAnimationFrame | 30fps animation, custom rendering |
| Layout | CSS Grid + Flexbox | Native resize, no library overhead |
| Styling | Tailwind CSS | Rapid iteration, utility-first |
| State | Vanilla JS / lightweight store | No framework lock-in for MVP |
| Emulator | WebAssembly (Emscripten) | Performance for CPU simulation |

### MVP Implementation Order

1. **Static Layout** - Get the 3-panel structure working with resize handles
2. **Code Editor** - Integrate Monaco with Micro4 syntax highlighting
3. **State Panel** - Display registers and memory (static first)
4. **Assembler Integration** - Connect to WASM assembler, show errors
5. **Step Execution** - Single instruction execution with state updates
6. **Circuit Rendering** - Static gate diagram from HDL data
7. **Signal Animation** - Animate wires during step execution
8. **Bidirectional Linking** - Click code ↔ highlight circuit
9. **Run Mode** - Continuous execution with speed control
10. **Polish** - Transitions, error recovery, settings

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial load | < 5s | First contentful paint |
| Assemble feedback | < 500ms | Click to result |
| Step execution | < 1ms | Instruction complete |
| Animation frame | < 33ms | 30fps minimum |
| Circuit render | < 100ms | Full redraw |

### File Structure (Proposed)

```
visualizer/
├── index.html              # Single page entry
├── css/
│   └── main.css            # Tailwind + custom CSS
├── js/
│   ├── app.js              # Main application
│   ├── editor.js           # Monaco wrapper
│   ├── circuit.js          # Canvas rendering
│   ├── state.js            # CPU state display
│   ├── emulator.js         # WASM emulator wrapper
│   └── assembler.js        # WASM assembler wrapper
├── wasm/
│   ├── micro4.wasm         # Compiled emulator
│   └── assembler.wasm      # Compiled assembler
└── data/
    └── micro4-circuit.json # Gate layout data
```

### Accessibility Checklist

- [ ] All interactive elements have focus states
- [ ] Color is not the only indicator (icons/text accompany)
- [ ] Reduced motion preference respected
- [ ] Screen reader landmarks for panels
- [ ] Keyboard shortcuts documented and available

### Browser Testing Priority

1. **Firefox (latest)** - Primary, must be perfect
2. **Chrome (latest)** - Secondary, should work
3. **Safari** - Best effort
4. **Edge** - Best effort (Chromium-based, should match Chrome)

---

## Document Summary

This UX Design Specification defines the user experience for Digital Archaeology's MVP (Micro4 stage):

**Design Direction:** Two-Mode Interface (Story Mode + Lab Mode) with flip navigation

**Core Experience:** Immersive role-playing narrative combined with hands-on circuit building—users flip between Story Mode (narrative, choices, character interaction) and Lab Mode (code editing, circuit visualization, debugging).

**Design Philosophy:**
- Mouse-first interaction (keyboard shortcuts available but not required)
- **Two-mode architecture** - Story for context/motivation, Lab for hands-on work
- **Dense Professional aesthetic** in Lab Mode - information-rich, every pixel earns its place
- **Immersive narrative styling** in Story Mode - warm gold accents, serif typography
- Tight feedback loops with instant visual response
- Inventor identity transformation through role-playing

**Story Mode Features:**
- Fixed navigation bar with Story/Lab toggle and progress dots
- "Your Role" floating panel showing user's character
- Chapter headers with era, title, and subtitle
- Scene settings, narrative text, and dialogue blocks
- Character cards with photos, bios, and stats for NPCs
- Choice cards for interactive story branching
- Technical notes bridging narrative and concepts
- "Enter the Lab" transition button

**Lab Mode Features:**
- Three-panel closable layout: Code Editor | Circuit Visualizer | State Panel
- Full menu bar (File, Edit, View, Debug, Help) with Story/Lab toggle
- Activity bar with Story icon (📜) for quick return
- Challenge objectives section linking story goals to tasks
- Toolbar with assemble/run/step controls and speed slider
- **Rich error displays** showing component types, instruction categories, circuit paths

**Error Display Features:**
- Error type badges (SYNTAX_ERROR, MEMORY_ERROR, ARITHMETIC_WARNING)
- Full instruction context (type, opcode, operand types)
- Circuit path showing which gates/components involved
- Signal values at point of error
- One-click fix suggestions

**Visual Identity:**
- **Story Mode:** Dark background with warm gold/copper accents, Crimson Text serif font
- **Lab Mode:** Dark blue-gray theme with cyan accent, monospace typography
- 4px-based spacing system
- Gate-type colors for circuit visualization
- Multiple number formats visible (hex + decimal)

**Canonical Mockup:** `_bmad-output/planning-artifacts/mockups/option-b10-flip-views.html`

**Success Metrics:**
- User feels like an inventor, not a student (identity transformation)
- Story provides context and motivation for technical challenges
- Seamless flip between Story and Lab maintains flow state
- User can complete write → assemble → step → understand cycle without documentation
- Errors provide enough context to understand AND fix the problem
- Circuit animation explains instruction execution visually
- < 100ms feedback on all user actions
- 30fps animation during signal propagation
