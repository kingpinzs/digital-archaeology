# Story 10.13: Create Challenge Objectives in Lab Mode

Status: done

---

## Story

As a user,
I want to see story objectives in Lab mode,
So that I know what to accomplish.

## Acceptance Criteria

1. **Given** I entered Lab from a story challenge
   **When** I view the Lab sidebar
   **Then** I see a Challenge Objectives section

2. **And** objectives have checkboxes

3. **And** completed objectives show checkmarks

4. **And** the section has a gold border (story accent)

5. **And** progress updates as I complete tasks

## Tasks / Subtasks

- [x] Task 1: Create ChallengeObjectives Component Class (AC: #1, #4)
  - [x] 1.1 Create `src/story/ChallengeObjectives.ts` with class definition
  - [x] 1.2 Add private fields: element, container, challengeData, objectiveElements
  - [x] 1.3 Add mount/show/hide/destroy/isVisible/getElement lifecycle methods (pattern from TechnicalNote)

- [x] Task 2: Define ChallengeData Type (AC: #1, #2, #3)
  - [x] 2.1 Add `ChallengeObjective` interface to `types.ts`: id, text, completed
  - [x] 2.2 Add `ChallengeData` interface to `types.ts`: title, objectives array
  - [x] 2.3 Export types from index.ts

- [x] Task 3: Implement render() Method (AC: #1, #2, #4)
  - [x] 3.1 Create container `<section>` element with `da-challenge-objectives` class
  - [x] 3.2 Add `role="region"` and `aria-label="Challenge objectives"` for accessibility
  - [x] 3.3 Create header with lightbulb icon (💡) and "CHALLENGE:" label with title
  - [x] 3.4 Create objectives list with checkbox-style indicators
  - [x] 3.5 Gold border styling using `--persona-gold` variable

- [x] Task 4: Implement Objective Checkboxes (AC: #2, #3)
  - [x] 4.1 Render each objective with checkbox indicator `[ ]` or `[✓]`
  - [x] 4.2 Use `aria-checked` attribute for screen readers
  - [x] 4.3 Style completed items with checkmark and muted text
  - [x] 4.4 Style incomplete items with empty checkbox and normal text

- [x] Task 5: Implement Data Management (AC: #1, #3, #5)
  - [x] 5.1 Add `setChallengeData(data: ChallengeData): void` method
  - [x] 5.2 Add `setObjectiveComplete(id: string, completed: boolean): void` method
  - [x] 5.3 Add `getProgress(): { completed: number, total: number }` method
  - [x] 5.4 Implement `updateDisplay()` method to refresh UI from current data
  - [x] 5.5 Dispatch custom event `challenge-progress-changed` when objectives change

- [x] Task 6: Add CSS Styling (AC: #4)
  - [x] 6.1 Add `.da-challenge-objectives` container styling (gold border, padding)
  - [x] 6.2 Add `.da-challenge-objectives--hidden` class for visibility control
  - [x] 6.3 Add `.da-challenge-objectives-header` styling (uppercase, gold icon)
  - [x] 6.4 Add `.da-challenge-objectives-title` styling (gold color, bold)
  - [x] 6.5 Add `.da-challenge-objective-item` styling (list items)
  - [x] 6.6 Add `.da-challenge-objective-item--complete` styling (checkmark, muted text)
  - [x] 6.7 Add `.da-challenge-objective-checkbox` styling (monospace brackets)

- [x] Task 7: Write Component Tests (AC: all)
  - [x] 7.1 Test component mounts correctly
  - [x] 7.2 Test renders `<section>` element with correct class
  - [x] 7.3 Test has role="region" and aria-label
  - [x] 7.4 Test setChallengeData renders title and objectives
  - [x] 7.5 Test objectives display unchecked state `[ ]`
  - [x] 7.6 Test completed objectives display checked state `[✓]`
  - [x] 7.7 Test setObjectiveComplete(id, true) marks objective complete
  - [x] 7.8 Test setObjectiveComplete(id, false) marks objective incomplete
  - [x] 7.9 Test getProgress returns correct counts
  - [x] 7.10 Test has gold border class (verify CSS class applied)
  - [x] 7.11 Test visibility control methods (show/hide/isVisible)
  - [x] 7.12 Test isVisible() returns false before mount
  - [x] 7.13 Test destroy() cleans up resources
  - [x] 7.14 Test challenge-progress-changed event fires on objective change
  - [x] 7.15 Test aria-checked attributes on objectives

- [x] Task 8: Export from index.ts (AC: #1)
  - [x] 8.1 Add `export { ChallengeObjectives } from './ChallengeObjectives';` to index.ts
  - [x] 8.2 Add `export type { ChallengeData, ChallengeObjective } from './types';` to index.ts

- [x] Task 9: Verify Integration (AC: all)
  - [x] 9.1 Run `npm test` - all tests pass (1792 tests)
  - [x] 9.2 Run `npm run build` - build succeeds

---

## Dev Notes

### Previous Story Intelligence (Story 10.12)

**Critical Assets Created:**
- `src/story/StoryActionsFooter.ts` - Footer with three navigation buttons (289 lines)
- Bound handler pattern for event listener cleanup
- createButton helper with icon+text structure
- State management methods: setPreviousEnabled, setContinueEnabled, setEnterLabVisible

**Code Review Lessons from 10.12:**
- Fix line counts in documentation to match actual
- Ensure all CSS classes used in component are defined in CSS
- Keep all metrics consistent throughout story file
- Mark accessibility checklist items when complete

**From Story 10.10 (TechnicalNote):**
- Pattern for setData + updateDisplay methods
- Element references stored for dynamic updates
- Semantic HTML: `<aside role="note">` pattern
- Blue accent styling for technical content

### UX Design Reference

**From ux-design-specification.md - Challenge Objectives Section:**

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

**Styling Requirements (from UX spec):**
- Gold border to connect to story theme (`--persona-gold: #d4a574`)
- Checkmarks for completed objectives
- Progress visible in status bar (via custom event for future integration)

### Architecture Compliance

See `src/story/ChallengeObjectives.ts` (260 lines) for full implementation featuring:
- Map-based tracking for objective element references
- setData + updateDisplay pattern from TechnicalNote
- Custom event dispatch for progress changes
- Semantic HTML: `<section role="region">`

### CSS Requirements

See `src/styles/main.css` lines 3007-3077 (~71 lines) for full CSS implementation.

### Accessibility Checklist

- [x] **Semantic HTML** - Uses `<section role="region">` with aria-label
- [x] **ARIA Attributes** - `role="region"`, `aria-label`, `aria-checked` on objectives
- [x] **Keyboard Navigation** - Not interactive (display-only component for MVP)
- [x] **Focus Management** - N/A (no interactive elements)
- [x] **Color Contrast** - Gold on dark background meets WCAG AA
- [x] **Screen Reader Announcements** - Objectives read with checked/unchecked state

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Use innerHTML for user content | Use textContent for all text |
| Forget to update element references | Store references in Map for efficient updates |
| Skip progress tracking | Dispatch events when progress changes |
| Hardcode colors | Use CSS variables with fallbacks |
| Skip aria-checked | Set aria-checked on each objective item |

### Critical Technical Requirements

1. **Semantic HTML** - Use `<section role="region">` container
2. **Gold Border Theme** - Use `--persona-gold` to connect to story visuals
3. **Checkbox State** - Use `[✓]` and `[ ]` text with `aria-checked` attribute
4. **Progress Tracking** - getProgress() method and custom event dispatch
5. **Dynamic Updates** - setObjectiveComplete() for marking items done
6. **Named Exports** - Export class and types using named exports

### Lab Mode Integration Notes

This component will be displayed in Lab Mode's state panel when a story challenge is active. The integration with the actual Lab Mode sidebar will be handled in a future story (likely Epic 11 or later). For now, the component is self-contained with:
- Data setter methods for external control
- Progress getter for status bar integration
- Custom event for progress change notifications

### Git Intelligence (Recent Commits)

Recent commits show consistent pattern:
- `feat(web): create Story Actions Footer with code review fixes (Story 10.12)`
- `feat(web): create Enter the Lab button with code review fixes (Story 10.11)`
- `feat(web): create Technical Note component with code review fixes (Story 10.10)`

**Commit Pattern:** `feat(web): create [Component Name] with code review fixes (Story X.Y)`

**Files typically modified:**
- `src/story/[ComponentName].ts` - New component
- `src/story/[ComponentName].test.ts` - Tests
- `src/story/types.ts` - Add new types
- `src/story/index.ts` - Add exports
- `src/styles/main.css` - Add CSS

### Project Structure Notes

**Files to create:**
```
digital-archaeology-web/
  src/
    story/
      ChallengeObjectives.ts       # New component (260 lines)
      ChallengeObjectives.test.ts  # New tests (35 tests, 337 lines)
```

**Files to modify:**
```
digital-archaeology-web/
  src/
    story/
      types.ts            # Add ChallengeData, ChallengeObjective types
      index.ts            # Add exports
    styles/
      main.css            # Add challenge objectives CSS (~71 lines)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 10.13]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Challenge Objectives Section]
- [Source: digital-archaeology-web/src/story/TechnicalNote.ts - Component pattern]
- [Source: digital-archaeology-web/src/story/types.ts - Type definitions]
- [Source: _bmad-output/implementation-artifacts/10-12-create-story-actions-footer.md - Previous story]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required - clean implementation.

### Completion Notes List

- Implemented ChallengeObjectives component with gold border theme
- Created ChallengeData and ChallengeObjective types in types.ts
- Checkbox indicators: `[✓]` for complete, `[ ]` for incomplete
- Map-based element tracking for efficient objective updates
- Custom event `challenge-progress-changed` dispatched on state changes
- Progress tracking via getProgress() method
- 35 comprehensive unit tests covering all acceptance criteria
- All 1792 tests pass, build succeeds

### File List

- `src/story/ChallengeObjectives.ts` - New component (260 lines)
- `src/story/ChallengeObjectives.test.ts` - Tests (35 tests, 337 lines)
- `src/story/types.ts` - Added ChallengeData, ChallengeObjective interfaces
- `src/story/index.ts` - Added exports for ChallengeObjectives and types
- `src/styles/main.css` - Added challenge objectives CSS (~71 lines)
