# Story 10.16: Display Era Badge and Progress

Status: done

---

## Story

As a user,
I want to see my progress and current era,
So that I feel accomplished.

## Acceptance Criteria

1. **Given** I am in Story Mode
   **When** I view the navigation bar
   **Then** I see the current era (e.g., "1971")

2. **And** I see progress dots for acts (● ○ ○ ○ ○)

3. **And** completed acts show filled dots

4. **And** the current act is highlighted

## Tasks / Subtasks

- [x] Task 1: Create Progress Types (AC: #2, #3, #4)
  - [x] 1.1 Create `src/story/ProgressDisplay.ts` with type definitions
  - [x] 1.2 Define `ActProgress` interface: actNumber, isCompleted, isCurrent
  - [x] 1.3 Define `ProgressDisplayData` interface: acts array, currentActNumber, totalActs

- [x] Task 2: Create Era Badge Component (AC: #1)
  - [x] 2.1 Create `src/story/EraBadge.ts` component class
  - [x] 2.2 Implement `setEra(year: string, title?: string): void` method
  - [x] 2.3 Use CSS class `da-story-nav-era-badge` (already exists)
  - [x] 2.4 Expose setEra() for parent component updates (StoryNav subscribes to events)

- [x] Task 3: Create Progress Dots Component (AC: #2, #3, #4)
  - [x] 3.1 Create `src/story/ProgressDots.ts` component class
  - [x] 3.2 Implement `setProgress(data: ProgressDisplayData): void` method
  - [x] 3.3 Use CSS classes `da-progress-dot`, `da-progress-dot--active`, `da-progress-dot--completed`
  - [x] 3.4 Add `aria-label` for accessibility: "Act X of Y" for current, "Completed" for filled
  - [x] 3.5 Expose setProgress() for parent component updates (StoryNav subscribes to events)

- [x] Task 4: Update StoryNav Component (AC: all)
  - [x] 4.1 Modify `StoryNav.ts` to instantiate EraBadge and ProgressDots components
  - [x] 4.2 Remove hardcoded era badge text "1971"
  - [x] 4.3 Remove hardcoded progress dots creation (lines 96-102)
  - [x] 4.4 Add `updateFromProgress(progress: StoryProgress | null): void` method
  - [x] 4.5 Subscribe to `story-state-changed` event in mount()
  - [x] 4.6 Unsubscribe in destroy()

- [x] Task 5: Connect to StoryEngine (AC: all)
  - [x] 5.1 Import `StoryProgress`, `StoryStateChangedEvent` from story module
  - [x] 5.2 Extract era from `StoryAct.era` using current actNumber
  - [x] 5.3 Calculate completed acts from progress data
  - [x] 5.4 Update era badge and progress dots when event fires

- [x] Task 6: Write Comprehensive Tests (AC: all)
  - [x] 6.1 Test EraBadge renders era year correctly
  - [x] 6.2 Test EraBadge updates when setEra called
  - [x] 6.3 Test ProgressDots renders correct number of dots (5)
  - [x] 6.4 Test ProgressDots marks current act with active class
  - [x] 6.5 Test ProgressDots marks completed acts with completed class
  - [x] 6.6 Test StoryNav updates when story-state-changed event fires
  - [x] 6.7 Test accessibility: aria-label values on progress dots

- [x] Task 7: Add CSS for New States (AC: #3)
  - [x] 7.1 Add `.da-progress-dot--completed` style in story mode CSS
  - [x] 7.2 Use filled circle styling for completed acts
  - [x] 7.3 Ensure visual distinction between active, completed, and pending dots

- [x] Task 8: Export and Verify (AC: all)
  - [x] 8.1 Export EraBadge and ProgressDots from `src/story/index.ts`
  - [x] 8.2 Run `npm test` - all tests pass (1945 tests)
  - [x] 8.3 Run `npm run build` - build succeeds

---

## Dev Notes

### Previous Story Intelligence (Story 10.15)

**Critical Assets Created:**
- `src/story/StoryState.ts` - State type definitions (85 lines)
  - `StoryPosition` interface: actNumber, chapterNumber, sceneId
  - `StoryProgress` interface: position, choices, discoveredItems, startedAt, lastPlayedAt
- `src/story/StoryEngine.ts` - Engine class with state management (328 lines)
  - `getProgress(): StoryProgress | null` method - use this to get current position
  - Dispatches `story-state-changed` CustomEvent on state changes
- `src/story/StoryStorage.ts` - localStorage persistence (128 lines)

**Key Pattern - Event Subscription:**
```typescript
// Subscribe to story state changes
window.addEventListener('story-state-changed', (event) => {
  const { progress, previousSceneId } = (event as CustomEvent).detail;
  // progress is StoryProgress | null
  if (progress) {
    const currentAct = progress.position.actNumber; // 1-5
    // Update UI
  }
});
```

**StoryStateChangedEvent Interface:**
```typescript
interface StoryStateChangedEvent extends CustomEvent {
  detail: {
    progress: StoryProgress | null;
    previousSceneId: string | null;
  };
}
```

### Existing StoryNav Implementation

**From StoryNav.ts (Story 10.3):**
- Hardcoded era badge: `eraBadge.textContent = '1971'` (line 114)
- Hardcoded progress dots: Creates 5 dots, first one active (lines 96-102)
- CSS classes already exist: `da-progress-dot`, `da-progress-dot--active`
- Need to add: `da-progress-dot--completed` for filled completed acts

**Current StoryNav Structure:**
```
header.da-story-nav
  └── div.da-story-nav-content
      ├── div.da-story-nav-left (logo + toggle)
      ├── div.da-story-nav-center
      │   └── div.da-story-nav-progress
      │       ├── span.da-story-nav-progress-label ("Act:")
      │       └── span.da-story-nav-progress-dots
      │           └── span.da-progress-dot (×5)
      └── div.da-story-nav-right
          ├── span.da-story-nav-era-badge ("1971")
          ├── button (Journal)
          └── button (Save)
```

### UX Design Reference

**From ux-design-specification.md:**
- Progress dots format: `● ○ ○ ○ ○` (filled = current/completed, empty = future)
- Era badge format: Year and optional title (e.g., "1971 — Dawn of the Microprocessor")
- Color: Use `--persona-gold` (#d4a574) for active/completed states

**Progress Dot States:**
| State | Visual | CSS Class |
|-------|--------|-----------|
| Pending | ○ (empty) | `da-progress-dot` |
| Current | ● (filled, highlighted) | `da-progress-dot da-progress-dot--active` |
| Completed | ● (filled) | `da-progress-dot da-progress-dot--completed` |

### Data Flow

```
StoryEngine (state changes)
    │
    ▼
'story-state-changed' event
    │
    ▼
StoryNav.updateFromProgress()
    │
    ├──► EraBadge.setEra()
    │
    └──► ProgressDots.setProgress()
```

**Era Lookup:**
To get the era string for the current act:
1. Get `progress.position.actNumber` from event
2. Load the act using `StoryLoader.loadAct(actNumber)` or use cached acts
3. Read `act.era` property (e.g., "1971")

### Architecture Compliance

**From architecture.md:**
- Use TypeScript for type safety
- Custom events for component communication
- CSS class prefix: `da-`
- Component pattern: class with mount(), destroy()
- Tests co-located: `EraBadge.test.ts`, `ProgressDots.test.ts`

**Anti-Patterns to Avoid:**
| Don't | Do |
|-------|-----|
| Query DOM for act content | Use StoryEngine/StoryLoader APIs |
| Inline styles for states | Use CSS classes for state styling |
| Forget to unsubscribe | Clean up event listeners in destroy() |
| Hardcode act count | Get total acts from story content |

### Git Intelligence (Recent Commits)

Recent commits show consistent pattern:
- `feat(web): create Story Progression Engine with code review fixes (Story 10.15)`
- `feat(web): implement story content data structure with code review fixes (Story 10.14)`

**Commit Pattern:** `feat(web): create [Feature Name] with code review fixes (Story X.Y)`

### Accessibility Checklist

- [x] **Keyboard Navigation** - N/A (passive display, no interactive elements)
- [x] **ARIA Attributes** - Progress dots need `aria-label` for each state
  - [x] `aria-label="Current act, Act X of Y"` for active dot
  - [x] `aria-label="Completed, Act X of Y"` for completed dot
  - [x] `aria-label="Act X of Y"` for pending dot
- [x] **Focus Management** - N/A (no focus targets)
- [x] **Color Contrast** - Ensure dots meet 3:1 ratio for UI elements
- [x] **XSS Prevention** - Use textContent, not innerHTML for era text
- [ ] **Screen Reader Announcements** - Consider aria-live for progress changes (deferred to Epic 10 retrospective or accessibility epic)

### Project Structure Notes

**Files to create:**
```
digital-archaeology-web/
  src/
    story/
      EraBadge.ts           # Era badge component
      EraBadge.test.ts      # Tests
      ProgressDots.ts       # Progress dots component
      ProgressDots.test.ts  # Tests
```

**Files to modify:**
```
digital-archaeology-web/
  src/
    story/
      StoryNav.ts           # Add component integration
      StoryNav.test.ts      # Add integration tests
      index.ts              # Export new components
    styles/
      story.css             # Add .da-progress-dot--completed
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 10.16]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Fixed Navigation Bar]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: digital-archaeology-web/src/story/StoryNav.ts - Existing navigation component]
- [Source: digital-archaeology-web/src/story/StoryEngine.ts - State management]
- [Source: digital-archaeology-web/src/story/StoryState.ts - Progress types]
- [Source: _bmad-output/implementation-artifacts/10-15-create-story-progression-engine.md - Previous story]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required - clean implementation.

### Completion Notes List

- Created `ProgressDisplay.ts` with type definitions: ActProgress, ProgressDisplayData, createProgressDisplayData helper
- Created `EraBadge.ts` component class with setEra/getEra/getTitle methods and XSS prevention
- Created `ProgressDots.ts` component class with setProgress method and accessibility aria-labels
- Updated `StoryNav.ts` to integrate EraBadge and ProgressDots as child components
- Added story-state-changed event subscription in StoryNav with proper cleanup in destroy()
- Added `updateFromProgress()` method for programmatic updates
- Added `getEraForAct` callback option for era lookups
- Added `.da-progress-dot--completed` CSS class in main.css with 0.7 opacity for visual distinction
- Exported new types and components from index.ts
- 17 tests for EraBadge, 28 tests for ProgressDots, ~15 new integration tests for StoryNav
- All 1945 tests pass, build succeeds

### Code Review Fixes Applied

1. **Fixed task descriptions 2.4 and 3.5** - Updated to accurately reflect architecture (StoryNav subscribes to events, child components expose setters)
2. **Corrected File List line counts** - Updated all line counts to match actual file sizes
3. **Enhanced active dot visibility** - Added box-shadow glow to `.da-progress-dot--active` for better visual distinction from completed dots
4. **Clarified deferred accessibility item** - Added note about follow-up in Epic 10 retrospective

### File List

- `src/story/ProgressDisplay.ts` - Type definitions and helper function (54 lines)
- `src/story/EraBadge.ts` - Era badge component class (94 lines)
- `src/story/EraBadge.test.ts` - EraBadge tests (17 tests, 183 lines)
- `src/story/ProgressDots.ts` - Progress dots component class (138 lines)
- `src/story/ProgressDots.test.ts` - ProgressDots tests (28 tests, 296 lines)
- `src/story/StoryNav.ts` - Updated with component integration (349 lines, +135 lines)
- `src/story/StoryNav.test.ts` - Updated with integration tests (613 lines, +244 lines)
- `src/story/index.ts` - Added exports (37 lines, +5 lines)
- `src/styles/main.css` - Added .da-progress-dot--completed (5 lines added)
