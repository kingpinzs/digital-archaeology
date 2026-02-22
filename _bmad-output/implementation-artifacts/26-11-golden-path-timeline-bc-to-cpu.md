# Story 26-11: Golden Path Timeline BC to CPU

Status: ready-for-dev

## Story

**As a** player experiencing the game,
**I want** to see the complete timeline from ancient history to modern computing,
**So that** I understand the FULL scope of the journey.

## Acceptance Criteria

1. **Given** I access the Timeline view **When** I see the Golden Path **Then** I see the complete arc from Ancient (~600 BC) through Future computing
2. **Given** I view an era on the timeline **Then** I see key figures, key inventions, and branch points for that era
3. **Given** the overview timeline **When** I click/expand an era node **Then** I see a detail view with specific decades and technologies
4. **Given** I am playing the story **When** I open the timeline **Then** I see where I currently am (current position indicator)
5. **Given** I have explored branches **When** I view the timeline **Then** I see my branches and explorations marked
6. **Given** this is the "map" of the entire Digital Archaeology experience **Then** the timeline is the definitive view of the full journey

## Current State Analysis

### Already Working
- 11 act nodes on horizontal timeline (Story 19.4)
- Current position highlighting via `node--current` CSS class
- Click-to-preview showing chapter list (Story 26.6)
- Branch point indicators on nodes (Story 26.7)
- Active branch badge next to "The Golden Path" label
- "The Golden Path" title above timeline
- `technology-timeline.json` with 24 technologies (invention dates, predecessors, period terms)
- `ACT_COMPLETION_METADATA` with titles, eras, icons for all 11 acts

### Gaps to Fill
1. **No key figures per era** — nodes show icon/title/era but no historical figures
2. **No key inventions per era** — technology-timeline.json exists but isn't linked to timeline nodes
3. **No zoom/detail view** — clicking shows chapter list preview but no era-specific technology detail
4. **Timeline doesn't show full historical scope visually** — era strings exist but there's no sense of the BC-to-modern span

## Technical Design

### Task 1: Extend JourneyNode with Historical Data

**Files:** `src/progress/types.ts`

Add optional `keyFigures` and `keyInventions` arrays to `JourneyNode`:

```typescript
// Add to JourneyNode interface
/** Key historical figures associated with this era */
readonly keyFigures?: readonly string[];
/** Key inventions/technologies introduced in this era */
readonly keyInventions?: readonly string[];
```

### Task 2: Populate Historical Data in JourneyMapBuilder

**Files:** `src/progress/JourneyMapBuilder.ts`

Add hardcoded historical data mapping each act to its key figures and inventions. This keeps the data close to the existing `ACT_COMPLETION_METADATA` pattern.

```typescript
const ACT_KEY_FIGURES: Record<number, readonly string[]> = {
  0: ['Thales of Miletus', 'Aristotle', 'Al-Khwarizmi', 'Pascal', 'Leibniz', 'Babbage', 'Ada Lovelace'],
  1: ['George Boole', 'Herman Hollerith', 'Konrad Zuse', 'Alan Turing', 'Claude Shannon'],
  2: ['John von Neumann', 'J. Presper Eckert', 'John Mauchly', 'Grace Hopper', 'Maurice Wilkes'],
  3: ['William Shockley', 'Jack Kilby', 'Robert Noyce', 'Gordon Moore', 'Douglas Engelbart'],
  4: ['Ted Hoff', 'Federico Faggin', 'Stan Mazor', 'Masatoshi Shima'],
  5: ['Chuck Peddle', 'Steve Wozniak', 'Gary Kildall', 'Bill Gates'],
  6: ['Stephen Morse', 'John Crawford', 'Sophie Wilson', 'Steve Furber'],
  7: ['David Patterson', 'John Hennessy', 'Linus Torvalds'],
  8: ['John Cocke', 'Jim Smith', 'Mike Johnson'],
  9: ['Seymour Cray', 'Jim Keller', 'Jensen Huang'],
  10: ['David Deutsch', 'Carver Mead', 'John Preskill'],
};

const ACT_KEY_INVENTIONS: Record<number, readonly string[]> = {
  0: ['Abacus', 'Boolean Logic', 'Pascaline', 'Stepped Reckoner', 'Analytical Engine'],
  1: ['Relay Computer', 'Z3', 'Colossus', 'Harvard Mark I'],
  2: ['ENIAC', 'EDVAC', 'Stored Program', 'Assembly Language', 'Magnetic Core Memory'],
  3: ['Transistor', 'Integrated Circuit', 'MOSFET', 'Mainframe Computer'],
  4: ['Intel 4004', 'Microprocessor', '4-bit CPU', 'Calculator Chip'],
  5: ['Intel 8080', 'MOS 6502', 'Z80', 'Personal Computer'],
  6: ['Intel 8086', 'x86 Architecture', 'Protected Mode', 'ARM Architecture'],
  7: ['Intel 80386', 'RISC', 'Virtual Memory', 'Paging'],
  8: ['Instruction Pipeline', 'Branch Prediction', 'Out-of-Order Execution', 'Cache Hierarchy'],
  9: ['Superscalar', 'Speculative Execution', 'Multi-core', 'SIMD'],
  10: ['Quantum Computing', 'Neuromorphic Chips', 'Photonic Computing'],
};
```

Populate these in the `build()` method when creating each node.

### Task 3: Enhance Timeline Preview with Key Figures & Inventions

**Files:** `src/progress/JourneyMap.ts`

Extend the existing `renderPreview()` (Story 26.6 click-to-preview) to show key figures and inventions below the chapter list:

- Add a "Key Figures" section with the figure names as a comma-separated inline list
- Add a "Key Inventions" section with invention names as small pill/badge elements
- Style to fit within the existing preview panel aesthetic

### Task 4: Era Detail Zoom View

**Files:** `src/progress/JourneyMap.ts`, `src/styles/main.css`

Add a "View Era Details" button to the preview panel that expands into a full detail view:

- When clicked, the preview expands to show:
  - Full era description with date range
  - Key figures with brief roles (inline)
  - Key inventions with invention year from `technology-timeline.json`
  - Technologies relevant to this era (filtered from technology-timeline.json by year range)
- A "Back to Overview" button returns to the normal timeline
- The detail view replaces the timeline in the panel (not a separate modal)

### Task 5: CSS for Enhanced Timeline

**Files:** `src/styles/main.css`

- `.da-journey-map__preview-figures` — Key figures section styling
- `.da-journey-map__preview-inventions` — Key inventions section with pill badges
- `.da-journey-map__era-detail` — Full era detail view
- `.da-journey-map__era-detail-header` — Era title + date range
- `.da-journey-map__era-detail-tech` — Technology list with year badges
- `.da-journey-map__back-btn` — Back to Overview button

## Testing Plan

### Unit Tests (JourneyMapBuilder)
- `build()` populates `keyFigures` for each node
- `build()` populates `keyInventions` for each node
- Figures/inventions are readonly arrays
- All 11 acts have non-empty keyFigures
- All 11 acts have non-empty keyInventions

### Unit Tests (JourneyMap)
- Preview panel shows key figures section when node has keyFigures
- Preview panel shows key inventions section when node has keyInventions
- "View Era Details" button renders in preview
- Era detail view renders with technologies
- "Back to Overview" button returns to timeline view
- Era detail shows technology years from matching data
- Accessibility: detail view has proper ARIA labels

## Implementation Order

1. Task 1: Extend JourneyNode type (foundation)
2. Task 2: Populate historical data in builder
3. Task 3: Preview enhancement (figures + inventions in existing preview)
4. Task 4: Era detail zoom view
5. Task 5: CSS (alongside Tasks 3-4)
