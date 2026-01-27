# Story 10.21: Historical Mindset Time-Travel

Status: done

---

## Story

As a learner,
I want to BE the engineer in 1978, not a student in 2026,
So that I understand problems from the perspective of those who faced them.

## Acceptance Criteria

1. **Given** I enter any historical era
   **When** I begin learning
   **Then** the system establishes my mindset:
   - What year it is (not modern day)
   - What technology EXISTS at this time (no anachronisms)
   - What problems engineers are ACTUALLY facing
   - What constraints they work under (budget, materials, knowledge)
   - What is IMPOSSIBLE vs merely difficult at this time
   **And** I think like someone IN that time, not looking back
   **And** hindsight is explicitly removed - I don't know what "will" happen
   **And** I face decisions without knowing the "right" answer
   **And** the experience feels like time-travel, not history class

2. **Given** the mindset system is active
   **When** I view any technical content
   **Then** anachronisms are filtered/flagged (no modern terminology)
   **And** decisions are presented without historical outcome bias
   **And** the UI reinforces "you are THERE, not looking back"

3. **Given** a historical decision point
   **When** I make a choice
   **Then** I see consequences as someone in that era would
   **And** I only learn the "right" answer after experiencing consequences
   **And** alternative paths show what COULD have happened

**Example from Acceptance Criteria:**
- 1978: "You're at Intel. The 8080 is a hit. But addresses are only 16 bits - 64KB max. Memory is getting cheaper. What do you do?"
- NOT: "Here's how Intel solved the 64KB limitation with segment registers."

## Tasks / Subtasks

- [x] Task 1: Create MindsetContext Interface (AC: #1)
  - [x] 1.1 Add `MindsetContext` interface to `src/story/types.ts`
  - [x] 1.2 Include fields: `year`, `knownTechnology[]`, `unknownTechnology[]`, `activeProblems[]`, `constraints[]`, `impossibilities[]`
  - [x] 1.3 Add `historicalPerspective` field with `currentKnowledge`, `futureBlind` properties
  - [x] 1.4 Export interface from types.ts

- [x] Task 2: Create MindsetProvider Component (AC: #1, #2)
  - [x] 2.1 Create `src/story/MindsetProvider.ts` for establishing era mindset
  - [x] 2.2 Implement `setMindset(context: MindsetContext)` method
  - [x] 2.3 Implement `getCurrentMindset(): MindsetContext | null` getter
  - [x] 2.4 Implement `isAnchronism(concept: string): boolean` checker
  - [x] 2.5 Create internal registry of technology by year (when invented/known)
  - [x] 2.6 Implement event dispatch: `mindset-established`, `mindset-changed`
  - [x] 2.7 Add singleton pattern for global mindset access

- [x] Task 3: Create EraContextPanel Component (AC: #1)
  - [x] 3.1 Create `src/story/EraContextPanel.ts` for displaying era context
  - [x] 3.2 Display current year prominently (e.g., "1978" in large format)
  - [x] 3.3 Show "WHAT YOU KNOW" section listing available technologies
  - [x] 3.4 Show "WHAT DOESN'T EXIST YET" section (without revealing future)
  - [x] 3.5 Show "THE PROBLEM" section with current engineering challenges
  - [x] 3.6 Show "YOUR CONSTRAINTS" (budget, time, materials, knowledge)
  - [x] 3.7 Add collapsible sections for each category
  - [x] 3.8 Style with historical/sepia theme appropriate to era

- [x] Task 4: Create HistoricalDecisionCard Component (AC: #1, #3)
  - [x] 4.1 Create `src/story/HistoricalDecisionCard.ts` for decision presentation
  - [x] 4.2 Present decisions WITHOUT revealing historical outcome
  - [x] 4.3 Show available options with their 1978-visible pros/cons
  - [x] 4.4 Hide any "this led to..." or "history shows..." language
  - [x] 4.5 Add "What would YOU do?" framing
  - [x] 4.6 Track user choice before revealing historical path
  - [x] 4.7 After choice, reveal: your choice vs. history's choice
  - [x] 4.8 Show "alternative timeline" for non-historical choices

- [x] Task 5: Create AnchronismFilter Utility (AC: #2)
  - [x] 5.1 Create `src/story/AnachronismFilter.ts` utility module
  - [x] 5.2 Build technology timeline data structure (JSON)
  - [x] 5.3 Implement `analyze(text: string, options)` that removes/flags anachronisms
  - [x] 5.4 Implement `getPeriodTerm(concept: string): string` for period-correct terms
  - [x] 5.5 Add flag mode vs. filter mode (highlight anachronisms vs. remove them)
  - [x] 5.6 Create technology-to-year lookup map

- [x] Task 6: Create Technology Timeline JSON Data (AC: #1, #2)
  - [x] 6.1 Create `public/story/data/technology-timeline.json`
  - [x] 6.2 Document each technology with: name, yearInvented, yearCommon, predecessors
  - [x] 6.3 Include: transistor (1947), IC (1958), microprocessor (1971), etc.
  - [x] 6.4 Include terminology mapping: e.g., "personal computer" didn't exist in 1971
  - [x] 6.5 Include constraints by era: fabrication limits, costs, knowledge gaps

- [x] Task 7: Create MindsetIntroScene Component (AC: #1)
  - [x] 7.1 Create `src/story/MindsetIntroScene.ts` for era entry immersion
  - [x] 7.2 Display dramatic "TIME TRAVEL" transition effect
  - [x] 7.3 Show year zooming in (e.g., fading "2026..." then "1978")
  - [x] 7.4 Present "You are now..." persona adoption
  - [x] 7.5 List what the user "knows" and "doesn't know"
  - [x] 7.6 Add "Begin Your Journey" CTA
  - [x] 7.7 Integrate with existing EraContextPanel for context display

- [x] Task 8: Integrate with StoryEngine (AC: #1)
  - [x] 8.1 Modify `src/story/StoryEngine.ts` to initialize MindsetProvider on act start
  - [x] 8.2 When entering act, extract mindset context from act JSON
  - [x] 8.3 Set mindset before first scene renders
  - [x] 8.4 Pass mindset context to SceneRenderer
  - [x] 8.5 Dispatch `mindset-established` event after setup
  - [x] 8.6 Initialize mindset when resuming game (bug fix)

- [x] Task 9: Integrate with SceneRenderer (AC: #2)
  - [x] 9.1 Modify `src/story/SceneRenderer.ts` to use AnachronismFilter
  - [x] 9.2 Filter all narrative text through mindset filter
  - [x] 9.3 Filter scene settings through mindset filter
  - [x] 9.4 Filter dialogue text (not speaker names) through mindset filter
  - [x] 9.5 Filter technical note content (not code snippets) through mindset filter

- [x] Task 10: Add Mindset Data to Act JSON Files (AC: #1)
  - [x] 10.1 Extend act JSON schema with `mindset` field in content-types.ts
  - [x] 10.2 Add mindset data to `public/story/act-0-mechanical.json` (1837)
  - [x] 10.3 Add mindset data to `public/story/act-1-relay.json` (1941)
  - [x] 10.4 Add mindset data to `public/story/act-2-vacuum.json` (1946)
  - [x] 10.5 Add mindset data to `public/story/act-3-transistor.json` (1955)
  - [x] 10.6 Add mindset data to `public/story/act-4-micro4.json` (1971)
  - [x] 10.7 Add mindset data to `public/story/act-5-micro8.json` (1976)
  - [x] 10.8 Add mindset data to `public/story/act-6-micro16.json` (1978)
  - [x] 10.9 Add mindset data to `public/story/act-7-micro32.json` (1985)
  - [x] 10.10 Add mindset data to `public/story/act-8-micro32p.json` (1990)
  - [x] 10.11 Add mindset data to `public/story/act-9-micro32s.json` (1995)
  - [x] 10.12 Add mindset data to `public/story/act-10-future.json` (2010)

- [x] Task 11: Add CSS Styles (AC: all)
  - [x] 11.1 Add `.da-mindset-intro` styles for time-travel transition
  - [x] 11.2 Add `.da-era-context-panel` styles for context display
  - [x] 11.3 Add `.da-decision-card` styles for decision cards
  - [x] 11.4 Add `.da-anachronism-flag` styles for flagged content
  - [x] 11.5 Add era-specific color themes (using CSS variables)
  - [x] 11.6 Add animation for year transition effect

- [x] Task 12: Create Unit Tests (AC: all)
  - [x] 12.1 Test MindsetProvider sets and gets mindset context (20 tests)
  - [x] 12.2 Test MindsetProvider detects anachronisms correctly
  - [x] 12.3 Test EraContextPanel renders all sections (28 tests)
  - [x] 12.4 Test HistoricalDecisionCard hides historical outcomes initially (35 tests)
  - [x] 12.5 Test HistoricalDecisionCard reveals outcomes after choice
  - [x] 12.6 Test AnachronismFilter correctly filters text by year (31 tests)
  - [x] 12.7 Test MindsetIntroScene renders transition animation (27 tests)
  - [x] 12.8 Test StoryEngine initializes mindset on act entry (8 tests)
  - [x] 12.9 Test SceneRenderer applies anachronism filter (10 tests)
  - [x] 12.10 Test StoryEngine resume() initializes mindset (2 tests)

- [x] Task 13: Export and Verify (AC: all)
  - [x] 13.1 Export all new components from `src/story/index.ts`
  - [x] 13.2 Export MindsetContext type from `src/story/types.ts`
  - [x] 13.3 Run `npm test` - all tests pass (3,431 tests)
  - [x] 13.4 Run `npm run build` - builds successfully
  - [x] 13.5 Verified mindset data in all 11 act JSON files

---

## Dev Notes

### Previous Story Intelligence (Story 10.18, 10.19, 10.20)

**Critical Assets Available from Previous Stories:**

From Story 10.18 (Historical Personas System):
- `PersonaData` interface in `src/story/types.ts:167-201`
- `PersonaCard` component for persona introductions
- 5 personas created: Babbage (1837), Zuse (1941), Eckert (1946), Shockley (1955), Faggin (1971)
- Persona JSON files in `public/story/personas/`
- `persona-changed` event from StoryEngine
- `currentPersona` tracked in StoryProgress

From Story 10.19 (Persona Profile Cards):
- Extended `PersonaData` with `keyContribution`, `additionalQuotes[]`
- `PersonaProfilePanel` for detailed persona viewing
- Modal/panel patterns with backdrop and close handling

From Story 10.20 (Persona Transition Narratives):
- `TransitionData` interface in `types.ts:208-225`
- `PersonaTransitionPanel` component for era transitions
- Timeline visual element pattern
- Narrative bridge patterns between eras
- `transition-panel-opened`, `transition-panel-closed` events

### MindsetContext Interface Design

```typescript
// src/story/types.ts additions

/**
 * Represents a technology or concept available in a specific era.
 * Used for anachronism filtering and mindset establishment.
 * Story 10.21: Historical Mindset Time-Travel
 */
export interface EraTechnology {
  /** Technology name (e.g., "transistor", "integrated circuit") */
  name: string;
  /** Year invented/discovered */
  yearInvented: number;
  /** Year became commonly known/used */
  yearCommon: number;
  /** What it replaced or built upon */
  predecessors?: string[];
  /** Period-accurate terminology variants */
  periodTerms?: { year: number; term: string }[];
}

/**
 * Represents a constraint faced in a specific historical era.
 * Story 10.21: Historical Mindset Time-Travel
 */
export interface EraConstraint {
  /** Type of constraint */
  type: 'technical' | 'economic' | 'knowledge' | 'material' | 'political';
  /** Description of the constraint */
  description: string;
  /** Specific limitation (e.g., "64KB max addressable memory") */
  limitation?: string;
}

/**
 * Represents an active problem engineers faced in an era.
 * Story 10.21: Historical Mindset Time-Travel
 */
export interface EraProblem {
  /** Problem statement from their perspective */
  statement: string;
  /** Why this mattered to them */
  motivation: string;
  /** What approaches were being tried */
  currentApproaches?: string[];
}

/**
 * Context for establishing the historical mindset.
 * Filters out anachronisms and frames decisions without hindsight.
 * Story 10.21: Historical Mindset Time-Travel
 */
export interface MindsetContext {
  /** The year we're "in" (e.g., 1978) */
  year: number;
  /** Technologies that exist and are known at this time */
  knownTechnology: string[];
  /** Technologies that don't exist yet (concepts we must NOT reference) */
  unknownTechnology: string[];
  /** Active engineering problems people are working on */
  activeProblems: EraProblem[];
  /** Constraints engineers work under */
  constraints: EraConstraint[];
  /** Things that are impossible at this time (not just difficult) */
  impossibilities: string[];
  /** Historical perspective framing */
  historicalPerspective: {
    /** What knowledge is available to someone in this year */
    currentKnowledge: string;
    /** Explicit statement that we don't know the future */
    futureBlind: string;
  };
}
```

### UI Layout for EraContextPanel

```
+============================================================+
|                                                            |
|                        [ 1 9 7 8 ]                         |
|                    You are at Intel.                       |
|                                                            |
|  ┌────────────────────────────────────────────────────┐   |
|  │  WHAT YOU KNOW                              [−]    │   |
|  │  ─────────────────────────────────────────────────  │   |
|  │  • 8-bit microprocessors are shipping (8080)      │   |
|  │  • 16-bit memory addresses = 64KB maximum         │   |
|  │  • Memory is getting cheaper every year           │   |
|  │  • DRAM is 4K bits per chip                       │   |
|  │  • Japan is buying lots of calculators            │   |
|  └────────────────────────────────────────────────────┘   |
|                                                            |
|  ┌────────────────────────────────────────────────────┐   |
|  │  WHAT DOESN'T EXIST                         [−]    │   |
|  │  ─────────────────────────────────────────────────  │   |
|  │  • 32-bit processors (theoretical only)           │   |
|  │  • Personal computers as home appliances          │   |
|  │  • Internet (ARPANET is military/academic)        │   |
|  │  • 1MB+ of addressable memory                     │   |
|  └────────────────────────────────────────────────────┘   |
|                                                            |
|  ┌────────────────────────────────────────────────────┐   |
|  │  THE PROBLEM                                [−]    │   |
|  │  ─────────────────────────────────────────────────  │   |
|  │  Memory is getting cheaper faster than expected.  │   |
|  │  Soon 64KB won't be enough. But the 8080's        │   |
|  │  16-bit address bus can't change. What do we do?  │   |
|  │                                                    │   |
|  │  Options being discussed:                          │   |
|  │  • Bank switching (clunky but works)              │   |
|  │  • New 32-bit processor (expensive, complex)      │   |
|  │  • Something else...?                              │   |
|  └────────────────────────────────────────────────────┘   |
|                                                            |
|  ┌────────────────────────────────────────────────────┐   |
|  │  YOUR CONSTRAINTS                           [−]    │   |
|  │  ─────────────────────────────────────────────────  │   |
|  │  💰 Budget: Must use existing 8086 design team    │   |
|  │  ⏰ Time: IBM wants a chip in 18 months           │   |
|  │  🔧 Tech: 40-pin DIP package limit                │   |
|  │  📚 Knowledge: 32-bit design is unproven          │   |
|  └────────────────────────────────────────────────────┘   |
|                                                            |
+============================================================+
```

### HistoricalDecisionCard Pattern

```typescript
/**
 * Decision card that presents choices WITHOUT revealing history's path.
 * Only after user chooses do we reveal what actually happened.
 */
export interface HistoricalDecision {
  /** Decision ID */
  id: string;
  /** The decision framed from the era's perspective */
  question: string;
  /** Context explaining why this matters NOW (in 1978) */
  context: string;
  /** Available options without historical outcome hints */
  options: HistoricalOption[];
  /** What history actually chose (revealed after user picks) */
  historicalChoice: string;
  /** Outcome of historical choice (revealed after) */
  historicalOutcome: string;
  /** What might have happened with other choices */
  alternateOutcomes: { optionId: string; speculation: string }[];
}

export interface HistoricalOption {
  /** Option ID */
  id: string;
  /** Option description (period-accurate framing) */
  description: string;
  /** Pros visible from 1978 perspective */
  visiblePros: string[];
  /** Cons visible from 1978 perspective */
  visibleCons: string[];
  /** Is this what history chose? (hidden until reveal) */
  isHistorical: boolean;
}
```

### Technology Timeline Data Structure

```json
// public/story/data/technology-timeline.json
{
  "technologies": [
    {
      "name": "transistor",
      "yearInvented": 1947,
      "yearCommon": 1955,
      "predecessors": ["vacuum tube"],
      "periodTerms": [
        { "year": 1947, "term": "transfer resistor" },
        { "year": 1950, "term": "transistor" }
      ]
    },
    {
      "name": "integrated_circuit",
      "yearInvented": 1958,
      "yearCommon": 1965,
      "predecessors": ["discrete transistor"],
      "periodTerms": [
        { "year": 1958, "term": "solid circuit" },
        { "year": 1960, "term": "integrated circuit" }
      ]
    },
    {
      "name": "microprocessor",
      "yearInvented": 1971,
      "yearCommon": 1975,
      "predecessors": ["integrated circuit", "calculator chip"],
      "periodTerms": [
        { "year": 1971, "term": "computer on a chip" },
        { "year": 1974, "term": "microprocessor" }
      ]
    },
    {
      "name": "segment_registers",
      "yearInvented": 1978,
      "yearCommon": 1979,
      "predecessors": ["bank switching"],
      "periodTerms": [
        { "year": 1978, "term": "segment registers" }
      ]
    }
  ],
  "terminology": [
    { "modern": "personal computer", "earliest": 1975, "before": "minicomputer" },
    { "modern": "internet", "earliest": 1990, "before": "ARPANET" },
    { "modern": "cloud computing", "earliest": 2006, "before": "timesharing" }
  ]
}
```

### Integration with Existing Story Architecture

**Event Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│                   User Enters New Act                            │
│   StoryEngine.goToAct(actNumber)                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      StoryEngine                                  │
│   1. Load act JSON                                               │
│   2. Extract mindsetContext from act                             │
│   3. Call MindsetProvider.setMindset(context)                    │
│   4. Dispatch 'mindset-established' event                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 MindsetIntroScene (if first visit)               │
│   1. Show time-travel transition animation                       │
│   2. Display year prominently                                    │
│   3. Show persona adoption                                       │
│   4. Present era context (EraContextPanel)                       │
│   5. User clicks "Begin Your Journey"                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SceneRenderer                                │
│   1. Get current mindset from MindsetProvider                    │
│   2. For each text block, run AnchronismFilter                   │
│   3. For decision scenes, use HistoricalDecisionCard             │
│   4. All content presented from "you are THERE" perspective      │
└─────────────────────────────────────────────────────────────────┘
```

### File Structure Requirements

```
digital-archaeology-web/src/story/
├── MindsetProvider.ts               # NEW: Mindset state management
├── MindsetProvider.test.ts          # NEW: Unit tests
├── EraContextPanel.ts               # NEW: Context display component
├── EraContextPanel.test.ts          # NEW: Unit tests
├── HistoricalDecisionCard.ts        # NEW: Decision presentation
├── HistoricalDecisionCard.test.ts   # NEW: Unit tests
├── AnchronismFilter.ts              # NEW: Text filtering utility
├── AnchronismFilter.test.ts         # NEW: Unit tests
├── MindsetIntroScene.ts             # NEW: Era entry animation
├── MindsetIntroScene.test.ts        # NEW: Unit tests
├── types.ts                         # MODIFY: Add MindsetContext interface
├── content-types.ts                 # MODIFY: Add 'mindset' to SceneType
├── StoryEngine.ts                   # MODIFY: Initialize mindset on act entry
├── SceneRenderer.ts                 # MODIFY: Apply anachronism filter
├── index.ts                         # MODIFY: Export new components

digital-archaeology-web/public/story/
├── data/
│   └── technology-timeline.json     # NEW: Technology history data
├── act-0-mechanical.json            # MODIFY: Add mindsetContext
├── act-1-relay.json                 # MODIFY: Add mindsetContext
├── act-2-vacuum.json                # MODIFY: Add mindsetContext
├── act-3-transistor.json            # MODIFY: Add mindsetContext
├── act-4-micro4.json                # MODIFY: Add mindsetContext
```

### Component Pattern (following existing codebase conventions)

```typescript
// MindsetProvider.ts
let instance: MindsetProvider | null = null;

export class MindsetProvider {
  private currentMindset: MindsetContext | null = null;
  private technologyTimeline: EraTechnology[] = [];
  private listeners: Map<string, Set<(event: CustomEvent) => void>> = new Map();

  static getInstance(): MindsetProvider {
    if (!instance) {
      instance = new MindsetProvider();
    }
    return instance;
  }

  async loadTechnologyTimeline(): Promise<void> {
    const response = await fetch('/story/data/technology-timeline.json');
    const data = await response.json();
    this.technologyTimeline = data.technologies;
  }

  setMindset(context: MindsetContext): void {
    this.currentMindset = context;
    this.dispatchEvent('mindset-established', { mindset: context });
  }

  getCurrentMindset(): MindsetContext | null {
    return this.currentMindset;
  }

  isAnachronism(concept: string, year?: number): boolean {
    const checkYear = year ?? this.currentMindset?.year ?? 2026;
    const tech = this.technologyTimeline.find(t =>
      t.name.toLowerCase() === concept.toLowerCase()
    );
    if (!tech) return false;
    return tech.yearCommon > checkYear;
  }

  getPeriodTerm(concept: string): string {
    const year = this.currentMindset?.year ?? 2026;
    const tech = this.technologyTimeline.find(t => t.name === concept);
    if (!tech || !tech.periodTerms) return concept;

    const applicable = tech.periodTerms
      .filter(pt => pt.year <= year)
      .sort((a, b) => b.year - a.year);
    return applicable[0]?.term ?? concept;
  }

  private dispatchEvent(eventName: string, detail: unknown): void {
    const event = new CustomEvent(`mindset-${eventName}`, { detail });
    document.dispatchEvent(event);
  }

  destroy(): void {
    this.currentMindset = null;
    this.listeners.clear();
    instance = null;
  }
}
```

### Accessibility Checklist

- [ ] **Keyboard Navigation**
  - [ ] EraContextPanel sections expandable via Enter/Space
  - [ ] HistoricalDecisionCard options selectable via arrow keys
  - [ ] Tab cycles through interactive elements
  - [ ] Escape closes expanded panels
- [ ] **ARIA Attributes**
  - [ ] EraContextPanel has `role="region"` with `aria-labelledby`
  - [ ] Collapsible sections have `aria-expanded` state
  - [ ] Decision options have `role="radio"` with `aria-checked`
  - [ ] Year display has `aria-label="Current year: 1978"`
- [ ] **Focus Management** - Focus moves logically through context panels
- [ ] **Color Contrast** - All text meets WCAG AA on era-themed backgrounds
- [ ] **XSS Prevention** - All narrative text rendered via textContent or escapeHtml()
- [ ] **Screen Reader Announcements** - Era changes announced via aria-live

### Project Structure Notes

- Follows established modal/panel patterns from PersonaCard, PersonaProfilePanel
- MindsetProvider uses singleton pattern for global access (like StoryState)
- Event-driven architecture matches existing StoryEngine patterns
- Technology timeline data stored in public/story/data/ (new directory)
- CSS follows `.da-` prefix convention with animation classes using `.da-anim-`
- All components follow bound handler pattern for event listener cleanup

### References

- [Source: digital-archaeology-web/src/story/types.ts:167-225] - PersonaData, TransitionData interfaces
- [Source: digital-archaeology-web/src/story/content-types.ts:29] - SceneType union
- [Source: digital-archaeology-web/src/story/StoryEngine.ts] - Act/scene navigation
- [Source: digital-archaeology-web/src/story/SceneRenderer.ts] - Scene type handling
- [Source: digital-archaeology-web/src/story/PersonaCard.ts] - Component pattern
- [Source: digital-archaeology-web/src/story/PersonaTransitionPanel.ts] - Modal pattern (10.20)
- [Source: _bmad-output/implementation-artifacts/10-20-create-persona-transition-narratives.md] - Previous story patterns
- [Source: _bmad-output/project-context.md] - Coding standards, naming conventions
- [Source: _bmad-output/planning-artifacts/epics.md:2084-2109] - Story acceptance criteria

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. **Bug Fix:** Added mindset initialization to `resume()` method in StoryEngine. Previously, when users refreshed the page and resumed from saved progress, the MindsetProvider wasn't initialized, causing anachronism filtering to not work. Fixed by adding mindset initialization from the current act when resuming.

2. **Test Coverage:** Added 5 new tests:
   - 2 tests for resume() with mindset initialization
   - 3 tests for SceneRenderer filtering (scene settings, technical note content, code snippet preservation)

3. **All 11 Acts Updated:** Mindset data added to all act JSON files (acts 0-10), not just acts 0-4 as originally specified in subtasks.

4. **Code Review Issues Fixed:**
   - AnachronismFilter API mismatch (changed from 3-arg to 2-arg signature)
   - `result.filteredText` → `result.filtered`
   - Fixed term overwriting bug where unknownTechnology terms were replacing pre-loaded terms without replacements

### File List

**Modified Files:**
- `src/story/content-types.ts` - Added `mindset?: MindsetContext` to StoryAct
- `src/story/StoryEngine.ts` - Added mindset integration (goToScene, startNewGame, resume, getActMindset, getCurrentMindset, dispatchMindsetChanged)
- `src/story/StoryEngine.test.ts` - Added 10 mindset integration tests
- `src/story/SceneRenderer.ts` - Added AnachronismFilter integration (setAnachronismFiltering, filterText)
- `src/story/SceneRenderer.test.ts` - Added 10 anachronism filtering tests
- `src/story/index.ts` - Exported MindsetChangedEvent
- `src/story/types.ts` - Added MindsetContext, EraTechnology, EraConstraint, EraProblem interfaces
- `src/styles/main.css` - Added mindset-related CSS classes
- `public/story/act-0-mechanical.json` - Added mindset (1837)
- `public/story/act-1-relay.json` - Added mindset (1941)
- `public/story/act-2-vacuum.json` - Added mindset (1946)
- `public/story/act-3-transistor.json` - Added mindset (1955)
- `public/story/act-4-micro4.json` - Added mindset (1971)
- `public/story/act-5-micro8.json` - Added mindset (1976)
- `public/story/act-6-micro16.json` - Added mindset (1978)
- `public/story/act-7-micro32.json` - Added mindset (1985)
- `public/story/act-8-micro32p.json` - Added mindset (1990)
- `public/story/act-9-micro32s.json` - Added mindset (1995)
- `public/story/act-10-future.json` - Added mindset (2010)

**New Files:**
- `src/story/MindsetProvider.ts` - Singleton provider for mindset context
- `src/story/MindsetProvider.test.ts` - Unit tests (20 tests)
- `src/story/AnachronismFilter.ts` - Text filtering utility
- `src/story/AnachronismFilter.test.ts` - Unit tests (31 tests)
- `src/story/EraContextPanel.ts` - Era context display component
- `src/story/EraContextPanel.test.ts` - Unit tests (28 tests)
- `src/story/HistoricalDecisionCard.ts` - Decision presentation component
- `src/story/HistoricalDecisionCard.test.ts` - Unit tests (35 tests)
- `src/story/MindsetIntroScene.ts` - Era entry immersion scene
- `src/story/MindsetIntroScene.test.ts` - Unit tests (27 tests)
- `public/story/data/technology-timeline.json` - Technology history data
