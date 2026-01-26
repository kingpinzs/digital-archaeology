# Story 10.18: Create Historical Personas System

Status: completed

---

## Story

As a user,
I want to adopt the persona of historical computing pioneers,
So that I experience their mindset, constraints, and discoveries firsthand.

## Acceptance Criteria

1. **Given** I begin a new era in Story Mode
   **When** the era introduction loads
   **Then** I am introduced to the persona I will adopt (e.g., "You are Federico Faggin. It's 1970...")
   **And** I see the persona's background, motivations, and constraints
   **And** the persona has authentic quotes and speech patterns
   **And** I understand the problem they faced

2. **Given** I am in persona mode
   **When** I interact with the story
   **Then** dialogue and narration reflect the persona's perspective
   **And** technical challenges are framed as the persona would have experienced them
   **And** I feel the authentic constraints of the era

3. **Given** a persona is introduced
   **When** I view the persona introduction
   **Then** I see a visually distinct "persona card" different from NPC character cards
   **And** the card uses second-person language ("You are...")
   **And** I understand this is MY role, not an NPC

## Tasks / Subtasks

- [x] Task 1: Create PersonaData Interface (AC: #1, #3)
  - [x] 1.1 Add `PersonaData` interface to `src/story/types.ts`
  - [x] 1.2 Include fields: id, name, years, era, avatar, quote, background, motivation, constraints[], problem, speechPattern
  - [x] 1.3 Add `PersonaConstraint` interface with: type (technical|economic|political|knowledge), description
  - [x] 1.4 Export all new types from types.ts

- [x] Task 2: Create PersonaCard Component (AC: #1, #3)
  - [x] 2.1 Create `src/story/PersonaCard.ts` following CharacterCard pattern
  - [x] 2.2 Render "You are..." header with persona name in gold accent
  - [x] 2.3 Display era/year prominently (e.g., "It's 1970...")
  - [x] 2.4 Show background section with motivations
  - [x] 2.5 Render constraints as visual badges (technical, economic, political, knowledge)
  - [x] 2.6 Display the problem statement as a "Your Challenge" section
  - [x] 2.7 Include authentic quote in styled blockquote
  - [x] 2.8 Add CSS class `da-persona-card` with distinct styling (gold border, parchment-like background)
  - [x] 2.9 Create `src/story/PersonaCard.test.ts` with full test coverage

- [x] Task 3: Add PersonaCard CSS Styles (AC: #3)
  - [x] 3.1 Add `.da-persona-card` styles to main.css
  - [x] 3.2 Use warm gold border (`--da-accent-gold`) to distinguish from NPC cards
  - [x] 3.3 Add `.da-persona-card-header` with "YOU ARE" label styling
  - [x] 3.4 Add `.da-persona-card-era` for year display (large, prominent)
  - [x] 3.5 Add `.da-persona-card-quote` blockquote styling with quotation marks
  - [x] 3.6 Add `.da-persona-card-constraints` badge container
  - [x] 3.7 Add constraint type badges: `.da-constraint-badge--technical`, `--economic`, `--political`, `--knowledge`
  - [x] 3.8 Add `.da-persona-card-challenge` for the problem statement

- [x] Task 4: Update StoryAct to Include Persona (AC: #1, #2)
  - [x] 4.1 Add optional `persona?: PersonaData` field to `StoryAct` interface in content-types.ts
  - [x] 4.2 Persona is defined at act level (one persona per era)
  - [x] 4.3 Update StoryLoader to parse persona data from act JSON
  - [x] 4.4 Add validation for persona field in content validation

- [x] Task 5: Create Persona JSON Data (AC: #1)
  - [x] 5.1 Create `public/story/personas/` directory
  - [x] 5.2 Create persona data for Era 5 (1971) - Federico Faggin (MVP persona)
  - [x] 5.3 Include: name, years (1941-), era ("1970-1971"), avatar, quote, background, motivation, constraints, problem
  - [x] 5.4 Create placeholder persona data structure for other eras (to be filled in 10.19/10.20)

- [x] Task 6: Integrate PersonaCard with SceneRenderer (AC: #1)
  - [x] 6.1 Add `persona` scene type to SceneType union in content-types.ts
  - [x] 6.2 Update SceneRenderer to render PersonaCard for persona scenes
  - [x] 6.3 Persona scene should be the first scene of each act's first chapter
  - [x] 6.4 Create persona introduction scene structure in story JSON

- [x] Task 7: Update StoryEngine for Persona Tracking (AC: #2)
  - [x] 7.1 Add `currentPersona: PersonaData | null` to StoryProgress in StoryState.ts
  - [x] 7.2 Update StoryEngine to set currentPersona when entering new act
  - [x] 7.3 Dispatch `persona-changed` event when persona changes
  - [x] 7.4 Persist current persona to localStorage with story progress

- [x] Task 8: Update YourRolePanel for Persona (AC: #2)
  - [x] 8.1 Subscribe YourRolePanel to `persona-changed` event
  - [x] 8.2 When persona is set, update:
    - Name: persona.name (e.g., "Federico Faggin")
    - Location: derived from persona.background
    - Era: persona.era
  - [x] 8.3 Add persona avatar support (replace default user icon)
  - [x] 8.4 Show constraints as small icons in panel

- [x] Task 9: Create Persona Introduction Flow (AC: #1, #3)
  - [x] 9.1 Define standard persona introduction scene structure:
    - Scene setting: era context
    - PersonaCard: full persona introduction
    - Narrative: "You are..." second-person introduction
    - Technical note: what tools/knowledge you have available
  - [x] 9.2 Update act-4-micro4.json with persona introduction scene
  - [x] 9.3 Verify persona displays correctly on act start

- [x] Task 10: Write Integration Tests (AC: all)
  - [x] 10.1 Test PersonaCard renders all data correctly
  - [x] 10.2 Test SceneRenderer handles persona scene type
  - [x] 10.3 Test StoryEngine updates currentPersona on act change
  - [x] 10.4 Test YourRolePanel updates when persona changes
  - [x] 10.5 Test persona persists across page refresh
  - [x] 10.6 Test constraint badges display correctly

- [x] Task 11: Export and Verify (AC: all)
  - [x] 11.1 Export PersonaCard from `src/story/index.ts`
  - [x] 11.2 Run `npm test` - all tests pass (2950 tests)
  - [x] 11.3 Run `npm run build` - build succeeds
  - [x] 11.4 Manual test: Start new game, verify persona introduction displays

---

## Dev Notes

### Previous Story Intelligence (Story 10.17)

**Critical Assets Available:**

From Story 10.17 - Story Integration:
```typescript
// StoryController orchestrates everything
const controller = new StoryController();
await controller.initialize();

// SceneRenderer maps scene types to components
renderer.renderScene(scene, container);
// Maps: narrative → SceneSetting, dialogue → DialogueBlock, etc.
// NEW: persona → PersonaCard
```

From Story 10.15 - StoryEngine:
```typescript
// State management
engine.goToScene('scene-id');
engine.getCurrentProgress();  // Returns StoryProgress
// NEW: Add currentPersona to StoryProgress
```

### Existing Component Pattern

Follow CharacterCard pattern for PersonaCard:
- Class with mount/destroy lifecycle
- setData() method for updates
- Private element references for DOM updates
- Clean event listener pattern with bound handlers

```typescript
// Pattern from CharacterCard.ts
export class PersonaCard {
  private element: HTMLElement | null = null;
  private personaData: PersonaData | null = null;

  mount(container: HTMLElement): void { ... }
  setPersonaData(data: PersonaData): void { ... }
  private render(): HTMLElement { ... }
  destroy(): void { ... }
}
```

### Persona Data Structure

```typescript
// types.ts additions
export interface PersonaConstraint {
  /** Type of constraint */
  type: 'technical' | 'economic' | 'political' | 'knowledge';
  /** Description of the constraint */
  description: string;
}

export interface PersonaData {
  /** Unique identifier (e.g., "faggin-1971") */
  id: string;
  /** Full name (e.g., "Federico Faggin") */
  name: string;
  /** Birth year or years active (e.g., "1941-") */
  years: string;
  /** Era string (e.g., "1970-1971") */
  era: string;
  /** Avatar emoji */
  avatar: string;
  /** Authentic quote from this person */
  quote: string;
  /** Background/biography paragraph */
  background: string;
  /** What drove them (motivation) */
  motivation: string;
  /** Constraints they faced */
  constraints: PersonaConstraint[];
  /** The problem they were trying to solve */
  problem: string;
  /** Optional: speech pattern hints for dialogue */
  speechPattern?: string;
}
```

### MVP Persona: Federico Faggin (Era 5, 1971)

```json
{
  "id": "faggin-1971",
  "name": "Federico Faggin",
  "years": "1941-",
  "era": "1970-1971",
  "avatar": "👨‍🔬",
  "quote": "The microprocessor was not invented. It was discovered. The technology was ready, and we found it.",
  "background": "You immigrated from Italy to Silicon Valley in 1968. At Fairchild, you invented silicon gate technology. Now at Intel, you're leading a team to create something unprecedented: a computer on a single chip.",
  "motivation": "Busicom, a Japanese calculator company, needs custom chips. But what if instead of 12 custom chips, you could create one programmable chip that does it all?",
  "constraints": [
    { "type": "technical", "description": "Only 2,300 transistors possible on a chip" },
    { "type": "economic", "description": "Busicom is paying, and they want calculators, not computers" },
    { "type": "knowledge", "description": "No one has ever built a CPU this small before" },
    { "type": "political", "description": "Management is skeptical - they see Intel as a memory company" }
  ],
  "problem": "Can you fit an entire CPU - instruction decoder, ALU, registers, and control logic - into 2,300 transistors?"
}
```

### Personas to Eventually Implement (from Story Requirements)

| Era | Year | Persona | Key Challenge |
|-----|------|---------|---------------|
| 0a | 1679 | Gottfried Leibniz | Binary representation |
| 0b | 1804 | Joseph Jacquard | Stored programs |
| 0c | 1822 | Charles Babbage | Mechanical calculation |
| 0d | 1837 | Charles Babbage | General-purpose computing |
| 0e | 1843 | Ada Lovelace | First algorithm |
| 0f | 1854 | George Boole | Boolean logic |
| 1a | 1936 | Alan Turing | Computability |
| 1b | 1937 | Claude Shannon | Circuits as logic |
| 2a | 1941 | Konrad Zuse | Relay computing |
| 2b | 1945 | ENIAC Team | Electronic computing |
| 3 | 1947 | Shockley/Bardeen/Brattain | Transistor |
| 4 | 1958 | Kilby/Noyce | Integrated circuit |
| 5 | 1971 | Federico Faggin | Microprocessor (MVP) |
| 6 | 1976 | Steve Wozniak | Personal computing |
| 7 | 1981 | IBM PC Team | Business standard |
| 8 | 1985 | Intel 386 Team | 32-bit protected mode |

**For this story, implement Faggin (Era 5) fully. Other personas are placeholders for Stories 10.19-10.23.**

### Scene Type Mapping Update

```typescript
// content-types.ts - update SceneType
export type SceneType = 'narrative' | 'dialogue' | 'choice' | 'challenge' | 'persona';

// SceneRenderer.ts - add case for persona
case 'persona':
  if (scene.persona) {
    const personaCard = new PersonaCard();
    personaCard.mount(container);
    personaCard.setPersonaData(scene.persona);
  }
  break;
```

### Data Flow for Persona

```
┌─────────────────────────────────────────────────────────────────┐
│                        Story JSON                                │
│  act-4-micro4.json                                               │
│  ├── persona: { id, name, quote, constraints, ... }             │
│  └── chapters[0].scenes[0]: { type: "persona", ... }            │
└────────────────────────┬────────────────────────────────────────┘
                         │ load
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      StoryLoader                                 │
│  - Parses act JSON including persona field                      │
│  - Returns StoryAct with persona: PersonaData                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ getAct()
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      StoryEngine                                 │
│  - Sets currentPersona when entering act                         │
│  - Dispatches 'persona-changed' event                           │
│  - Persists to localStorage                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │ event
                         ▼
┌──────────────────┐   ┌──────────────────┐
│  SceneRenderer   │   │  YourRolePanel   │
│  - Renders       │   │  - Updates name  │
│    PersonaCard   │   │  - Updates era   │
│    for persona   │   │  - Shows avatar  │
│    scenes        │   │  - Shows badges  │
└──────────────────┘   └──────────────────┘
```

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Hardcode persona data in components | Load from JSON via StoryLoader |
| Create new PersonaCard on every render | Reuse instance, call setPersonaData() |
| Mix persona (user) with character (NPC) styling | Distinct gold styling for persona |
| Skip constraint type badges | Show visual indicators for each constraint type |
| Forget to update YourRolePanel | Subscribe to persona-changed event |

### Accessibility Checklist

- [x] **Keyboard Navigation** - PersonaCard is static content, no interaction needed
- [ ] **ARIA Attributes**
  - [ ] PersonaCard has `role="region"` and `aria-label="Your persona"`
  - [ ] Quote has `role="blockquote"`
  - [ ] Constraint badges have `aria-label` describing constraint type
- [ ] **Focus Management** - N/A (no interactive elements in card)
- [ ] **Color Contrast** - Gold accent text meets WCAG AA on dark background
- [ ] **XSS Prevention** - All persona text rendered via textContent, not innerHTML
- [ ] **Screen Reader Announcements** - Persona change announced via aria-live region

### Project Structure Notes

**Files to create:**
```
digital-archaeology-web/
  src/
    story/
      PersonaCard.ts           # Persona introduction component
      PersonaCard.test.ts      # Tests
  public/
    story/
      personas/
        faggin-1971.json       # MVP persona data (optional, can embed in act)
```

**Files to modify:**
```
digital-archaeology-web/
  src/
    story/
      types.ts                 # Add PersonaData, PersonaConstraint
      content-types.ts         # Add persona to SceneType, StoryAct
      SceneRenderer.ts         # Handle persona scene type
      StoryEngine.ts           # Track currentPersona
      StoryState.ts            # Add currentPersona to StoryProgress
      YourRolePanel.ts         # Subscribe to persona-changed
      index.ts                 # Export PersonaCard
    styles/
      main.css                 # Add .da-persona-card styles
  public/
    story/
      act-4-micro4.json        # Add persona introduction scene
```

### References

- [Source: digital-archaeology-web/src/story/CharacterCard.ts - Component pattern to follow]
- [Source: digital-archaeology-web/src/story/types.ts - Existing type definitions]
- [Source: digital-archaeology-web/src/story/content-types.ts - Scene/Act structure]
- [Source: digital-archaeology-web/src/story/SceneRenderer.ts - Scene type rendering]
- [Source: digital-archaeology-web/src/story/StoryEngine.ts - State management]
- [Source: digital-archaeology-web/src/story/YourRolePanel.ts - Role display]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-10.18 - Requirements]
- [Source: _bmad-output/project-context.md - Coding standards]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None

### Completion Notes List

- All 11 tasks completed successfully
- 33 PersonaCard tests + 10 YourRolePanel persona tests + 15 StoryEngine persona integration tests = 58 new tests
- All 2950 tests pass
- Personas added to acts 0-4 (Babbage, Zuse, Eckert, Shockley, Faggin)
- PersonaCard uses gold/parchment styling distinct from NPC CharacterCard
- Event-driven architecture: StoryEngine dispatches persona-changed, YourRolePanel subscribes
- Full XSS prevention with textContent-only DOM manipulation

### File List

**Created:**
- `src/story/PersonaCard.ts` - Persona card component (274 lines)
- `src/story/PersonaCard.test.ts` - PersonaCard tests (33 tests)
- `public/story/personas/index.json` - Personas index
- `public/story/personas/faggin-1971.json` - Federico Faggin persona
- `public/story/personas/babbage-1837.json` - Charles Babbage persona
- `public/story/personas/zuse-1941.json` - Konrad Zuse persona
- `public/story/personas/eckert-1946.json` - J. Presper Eckert persona
- `public/story/personas/shockley-1955.json` - William Shockley persona

**Modified:**
- `src/story/types.ts` - Added PersonaConstraint, PersonaData interfaces
- `src/story/content-types.ts` - Added 'persona' to SceneType, persona field to StoryScene/StoryAct
- `src/story/StoryLoader.ts` - Added 'persona' to VALID_SCENE_TYPES for validation
- `src/story/SceneRenderer.ts` - Added PersonaCard rendering for persona scenes
- `src/story/StoryState.ts` - Added currentPersona to StoryProgress
- `src/story/StoryEngine.ts` - Added persona tracking, persona-changed events
- `src/story/StoryEngine.test.ts` - Added 15 persona integration tests
- `src/story/YourRolePanel.ts` - Added persona subscription, constraint icons (Task 8.4), aria-live announcements
- `src/story/YourRolePanel.test.ts` - Added 10 persona tests
- `src/story/index.ts` - Exported PersonaCard, PersonaData, PersonaChangedEvent
- `src/styles/main.css` - Added ~180 lines: persona card CSS, constraint icons CSS, screen-reader utilities
- `public/story/act-0-mechanical.json` - Added Babbage persona + persona introduction scene
- `public/story/act-1-relay.json` - Added Zuse persona + persona introduction scene
- `public/story/act-2-vacuum.json` - Added Eckert persona + persona introduction scene
- `public/story/act-3-transistor.json` - Added Shockley persona + persona introduction scene
- `public/story/act-4-micro4.json` - Added Faggin persona + persona introduction scene

