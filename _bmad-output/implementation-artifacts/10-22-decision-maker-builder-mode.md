# Story 10.22: Decision-Maker + Builder Mode

Status: review

## Story

As a learner,
I want to both THINK and DO, not just one or the other,
So that my understanding comes from both decision-making and building.

## Acceptance Criteria

1. **Given** I'm learning any concept
   **When** I engage with the material
   **Then** I experience BOTH modes:

   **Decision-Maker Mode:**
   - I face the same choices engineers faced
   - I make decisions with limited information
   - I see consequences of my decisions
   - I compare my choices to history's choices

   **Builder Mode:**
   - I implement my decisions (or history's decisions)
   - I write real code, design real circuits
   - I see my implementations actually run
   - I feel the satisfaction of working systems

2. **Given** decision and builder modes exist
   **When** I progress through a story act
   **Then** these modes alternate naturally (decide -> build -> decide -> build)

3. **Given** both modes are available
   **When** a scene requires both thinking and doing
   **Then** neither mode is optional - both are required for true understanding

4. **Given** I complete a decision-builder cycle
   **When** I reflect on the experience
   **Then** I feel: "I decided how to solve this AND I built the solution"

## Tasks / Subtasks

- [x] Task 1: Add 'decision' and 'builder' Scene Types (AC: #1, #2)
  - [x] 1.1 In `src/story/content-types.ts`, add `'decision'` and `'builder'` to `SceneType` union (line 30)
  - [x] 1.2 Add `decision?: HistoricalDecision` field to `StoryScene` interface
  - [x] 1.3 Add `builderChallenge?: BuilderChallengeData` field to `StoryScene` interface
  - [x] 1.4 Create `BuilderChallengeData` interface in `content-types.ts`:
    - `title: string` - challenge name
    - `description: string` - what to build
    - `decisionId?: string` - links to the decision that led here
    - `objectives: ChallengeObjective[]` - reuse existing type
    - `labContext?: string` - optional context to pass to lab mode
  - [x] 1.5 Write tests for new types (type assertion tests)

- [x] Task 2: Create DecisionMakerScene Component (AC: #1)
  - [x] 2.1 Create `src/story/DecisionMakerScene.ts`
  - [x] 2.2 Mount method creates container with `.da-decision-maker-scene` class
  - [x] 2.3 Render era context summary (year, constraints) from current MindsetProvider
  - [x] 2.4 Instantiate and mount existing `HistoricalDecisionCard` component
  - [x] 2.5 Listen for `mindset-decision-choice-made` event to track user's choice
  - [x] 2.6 After choice + reveal, show transition to builder: "Now build your solution" CTA
  - [x] 2.7 Add `onBuildTransition(callback: (decisionId: string, chosenOptionId: string) => void)` callback
  - [x] 2.8 Implement `destroy()` with proper event listener cleanup (bound handler pattern)
  - [x] 2.9 Add ARIA attributes: `role="region"`, `aria-label="Historical Decision"`
  - [x] 2.10 XSS prevention: use `textContent` or `escapeHtml()` for all dynamic text

- [x] Task 3: Create BuilderModeScene Component (AC: #1, #3)
  - [x] 3.1 Create `src/story/BuilderModeScene.ts`
  - [x] 3.2 Mount method creates container with `.da-builder-mode-scene` class
  - [x] 3.3 Display the decision context: "You decided to [choice]. Now build it."
  - [x] 3.4 Show challenge objectives using existing `ChallengeObjective` pattern from `ChallengeObjectives.ts`
  - [x] 3.5 Render "Enter the Lab" button using existing `EnterLabButton` component
  - [x] 3.6 Track objective completion state
  - [x] 3.7 When all objectives complete, show "You built it!" celebration message
  - [x] 3.8 Add `onComplete(callback: () => void)` for story progression after building
  - [x] 3.9 Add `onEnterLab(callback: () => void)` for lab mode transition
  - [x] 3.10 Implement `destroy()` with proper cleanup
  - [x] 3.11 ARIA: `role="region"`, `aria-label="Builder Challenge"`

- [x] Task 4: Create ConsequenceRevealPanel Component (AC: #1, #4)
  - [x] 4.1 Create `src/story/ConsequenceRevealPanel.ts`
  - [x] 4.2 Display after builder challenge completion: "What happened because of your choice"
  - [x] 4.3 Show user's decision vs. history's decision side by side
  - [x] 4.4 Show what they built and how it relates to the historical outcome
  - [x] 4.5 If user chose the historical path: "You made the same choice as [persona]!"
  - [x] 4.6 If user chose differently: "You took a different path. Here's what happened in our timeline..."
  - [x] 4.7 Show alternate timeline speculation (from `HistoricalDecision.alternateOutcomes`)
  - [x] 4.8 Add "Continue Journey" button to proceed to next scene
  - [x] 4.9 Dispatch `decision-cycle-complete` CustomEvent with detail `{ decisionId, chosenOptionId, builtSolution: true }`
  - [x] 4.10 Implement `destroy()` with cleanup
  - [x] 4.11 ARIA: `role="dialog"`, `aria-label="Decision Consequences"`

- [x] Task 5: Integrate Decision Scenes into SceneRenderer (AC: #1, #2)
  - [x] 5.1 In `SceneRenderer.ts`, add `onDecisionMade?: (decisionId: string, optionId: string) => void` to `SceneRendererCallbacks`
  - [x] 5.2 Add `onBuilderComplete?: () => void` to `SceneRendererCallbacks`
  - [x] 5.3 In `renderScene()`, add decision scene handling (after persona handling, ~line 142):
    ```
    if (context.scene.type === 'decision' && context.scene.decision) {
      this.renderDecisionScene(context.scene.decision);
    }
    ```
  - [x] 5.4 In `renderScene()`, add builder scene handling:
    ```
    if (context.scene.type === 'builder' && context.scene.builderChallenge) {
      this.renderBuilderScene(context.scene.builderChallenge);
    }
    ```
  - [x] 5.5 Implement `renderDecisionScene(decision: HistoricalDecision)` method
  - [x] 5.6 Implement `renderBuilderScene(challenge: BuilderChallengeData)` method
  - [x] 5.7 Store component references for cleanup in `destroy()`

- [x] Task 6: Wire Decision-Builder Sequencing in StoryEngine (AC: #2)
  - [x] 6.1 In `StoryEngine.ts`, add `pendingDecision` state tracking (decisionId + chosenOptionId)
  - [x] 6.2 When a decision scene completes (choice made + revealed), store decision context
  - [x] 6.3 When advancing to next scene, if next scene is type 'builder', pass decision context
  - [x] 6.4 When builder scene completes, clear pending decision state
  - [x] 6.5 Add `recordDecision(decisionId: string, optionId: string)` method (store in StoryProgress)
  - [x] 6.6 Dispatch `decision-builder-cycle` event when full cycle completes
  - [x] 6.7 Handle decision state in `resume()` - restore pending decision from saved progress

- [x] Task 7: Add Decision-Builder Content to Act JSON Files (AC: #2, #3)
  - [ ] 7.1 Add decision scene to `public/story/act-6-micro16.json` (1978 segment registers decision - strongest fit)
  - [ ] 7.2 Add paired builder scene to act-6 (build with the chosen approach)
  - [ ] 7.3 Add decision scene to `public/story/act-4-micro4.json` (1971 - how to build a microprocessor)
  - [ ] 7.4 Add paired builder scene to act-4
  - [ ] 7.5 Ensure decision -> builder -> consequence scene sequencing in act JSON
  - [ ] 7.6 Reference existing HistoricalDecision data from act mindset contexts

- [x] Task 8: Add CSS Styles (AC: all)
  - [ ] 8.1 Add `.da-decision-maker-scene` styles in `src/styles/main.css`
  - [ ] 8.2 Add `.da-builder-mode-scene` styles
  - [ ] 8.3 Add `.da-consequence-reveal` styles
  - [ ] 8.4 Add `.da-decision-builder-transition` animation (arrow/flow between decide and build)
  - [ ] 8.5 Add `.da-builder-complete` celebration styles
  - [ ] 8.6 Use existing CSS variable system (`--da-*` prefix)
  - [ ] 8.7 Ensure responsive layout for all new components

- [x] Task 9: Create Unit Tests (AC: all)
  - [ ] 9.1 Create `src/story/DecisionMakerScene.test.ts` (~25 tests)
    - Mounts with decision data
    - Renders HistoricalDecisionCard
    - Tracks choice events
    - Shows build transition CTA after reveal
    - Fires onBuildTransition callback
    - Cleans up on destroy
    - ARIA attributes present
  - [ ] 9.2 Create `src/story/BuilderModeScene.test.ts` (~20 tests)
    - Renders challenge objectives
    - Shows decision context
    - Shows Enter Lab button
    - Tracks objective completion
    - Shows completion message when all done
    - Fires callbacks
    - Cleans up on destroy
  - [ ] 9.3 Create `src/story/ConsequenceRevealPanel.test.ts` (~20 tests)
    - Shows user choice vs history
    - Handles same-as-history case
    - Handles different-from-history case
    - Shows alternate timeline
    - Dispatches decision-cycle-complete event
    - Continue button works
    - Cleans up on destroy
  - [ ] 9.4 Add SceneRenderer decision/builder tests in `SceneRenderer.test.ts` (~10 tests)
    - Renders decision scenes
    - Renders builder scenes
    - Callbacks fire correctly
  - [ ] 9.5 Add StoryEngine decision sequencing tests in `StoryEngine.test.ts` (~10 tests)
    - Records decisions in progress
    - Passes decision context to builder scenes
    - Handles resume with pending decision
    - Fires cycle-complete event
  - [ ] 9.6 Test content-types changes (type assertion tests)
  - [ ] 9.7 Every `catch` block must have a corresponding test (per retro action item)

- [x] Task 10: Export and Integration Verification (AC: all)
  - [ ] 10.1 Export `DecisionMakerScene` from `src/story/index.ts`
  - [ ] 10.2 Export `BuilderModeScene` from `src/story/index.ts`
  - [ ] 10.3 Export `ConsequenceRevealPanel` from `src/story/index.ts`
  - [ ] 10.4 Export `BuilderChallengeData` type from `src/story/index.ts`
  - [ ] 10.5 Run `npm test` - all tests pass
  - [ ] 10.6 Run `npm run build` - builds successfully
  - [ ] 10.7 Verify decision -> builder -> consequence flow in act-4 and act-6 JSON data

## Dev Notes

### Previous Story Intelligence (Story 10.21)

**Critical Assets Available:**
- `HistoricalDecisionCard` component (333 lines) - **COMPLETE, DO NOT REWRITE**
  - Already has `setDecision()`, `onChoice()`, `hasChosen()`, `isRevealed()`, `getSelectedOption()`
  - Dispatches `mindset-decision-choice-made` and `mindset-decision-revealed` events
  - Full visual flow: select option -> reveal button -> show comparison
- `MindsetProvider` singleton - provides era context (year, constraints, known tech)
- `EraContextPanel` - displays era context (reusable for decision scene)
- `AnachronismFilter` - text filtering by era
- `HistoricalDecision` and `HistoricalOption` interfaces in `types.ts:303-336`
- All 11 act JSON files have `mindset` data with era context

**Patterns Established in 10.21:**
- Singleton pattern: `MindsetProvider.getInstance()`
- Event dispatch: `CustomEvent` on `document` with detail payload
- Bound handler pattern for event listener cleanup
- `mount(container)` / `destroy()` lifecycle
- CSS: `.da-` prefix, `.da-anim-` for animations, `--da-` CSS variables

**10.21 Completion Notes:**
- Bug fix needed: mindset initialization in `resume()` - already fixed
- AnachronismFilter API was 2-arg, not 3-arg
- `result.filtered` not `result.filteredText`

### Architecture Requirements

**Component Pattern (MUST follow):**
```typescript
export class ComponentName {
  private container: HTMLElement | null = null;
  private boundHandlers: { event: string; handler: EventListener }[] = [];

  mount(parent: HTMLElement): void {
    this.container = document.createElement('div');
    this.container.className = 'da-component-name';
    // ... setup
    parent.appendChild(this.container);
  }

  destroy(): void {
    this.boundHandlers.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler);
    });
    this.boundHandlers = [];
    this.container?.remove();
    this.container = null;
  }
}
```

**Scene Rendering Pattern (from SceneRenderer.ts):**
- Scene type check in `renderScene()` method using `context.scene.type`
- Component instantiation, mount to content area, store reference for cleanup
- Callback wiring through `SceneRendererCallbacks` interface

**Lab Integration Pattern (from ChallengeObjectives.ts):**
- `ChallengeObjective` interface: `{ id: string; text: string; completed: boolean }`
- Gold border styling for challenge areas
- `challenge-progress-changed` event dispatch
- `EnterLabButton` component for lab transition

**Existing Exports in index.ts (DO NOT DUPLICATE):**
- `HistoricalDecisionCard` already exported (line 67)
- `HistoricalDecision`, `HistoricalOption` types already exported (line 72)

### Key Design Decisions

1. **DecisionMakerScene wraps HistoricalDecisionCard** - do NOT reimplement decision logic. Instantiate and mount the existing component.

2. **BuilderModeScene wraps ChallengeObjectives pattern** - reuse `ChallengeObjective` type and follow `ChallengeObjectives.ts` rendering pattern.

3. **Scene sequencing is JSON-driven** - the act JSON files define the order: decision scene -> builder scene -> consequence/narrative. The StoryEngine just follows `nextScene` pointers.

4. **Decision context threading** - when a decision is made, store `{ decisionId, chosenOptionId }` in StoryEngine state. The next builder scene reads this to customize its challenge description.

5. **ConsequenceRevealPanel is story-mode only** - it does NOT transition to lab. It's the reflection/debrief after building.

### File Structure

```
src/story/
├── DecisionMakerScene.ts           # NEW: Wraps HistoricalDecisionCard
├── DecisionMakerScene.test.ts      # NEW: ~25 tests
├── BuilderModeScene.ts             # NEW: Challenge + Enter Lab
├── BuilderModeScene.test.ts        # NEW: ~20 tests
├── ConsequenceRevealPanel.ts       # NEW: Post-build reflection
├── ConsequenceRevealPanel.test.ts  # NEW: ~20 tests
├── content-types.ts                # MODIFY: Add 'decision', 'builder' to SceneType
├── SceneRenderer.ts                # MODIFY: Add decision/builder rendering
├── StoryEngine.ts                  # MODIFY: Decision state tracking
├── types.ts                        # READ ONLY: HistoricalDecision already exists
├── index.ts                        # MODIFY: Export new components

src/styles/
├── main.css                        # MODIFY: Add decision/builder CSS

public/story/
├── act-4-micro4.json               # MODIFY: Add decision+builder scenes
├── act-6-micro16.json              # MODIFY: Add decision+builder scenes
```

### Testing Requirements

- **Unit tests:** Co-located `.test.ts` files using Vitest
- **Every `catch` block must have a test** (Epic 9 retro action item)
- **E2E tests are mandatory** (Epic 9 retro action item) - but E2E infrastructure (Story 10-25) hasn't been built yet. Add E2E test stubs/comments noting what E2E tests are needed when 10-25 is complete.
- Target: ~85+ new tests across all new components
- Test pattern: `describe('ComponentName', () => { ... })` with nested `describe` for methods

### XSS Prevention

- All user-facing text from JSON must use `textContent` or `escapeHtml()` utility
- Never use `innerHTML` with unsanitized content
- Decision options, context, outcomes all come from JSON - treat as untrusted

### CSS Conventions

- Class prefix: `.da-` (e.g., `.da-decision-maker-scene`)
- Animation prefix: `.da-anim-` (e.g., `.da-anim-decide-to-build`)
- CSS variables: `--da-` (e.g., `--da-decision-highlight`)
- Follow existing responsive patterns in `main.css`

### Project Structure Notes

- Alignment with unified project structure: all story components in `src/story/`
- New components follow established PascalCase class naming
- All new files co-located with tests
- CSS additions go in existing `src/styles/main.css`
- Act JSON modifications follow existing scene structure

### References

- [Source: src/story/content-types.ts:30] - SceneType union to extend
- [Source: src/story/content-types.ts:36-59] - StoryScene interface to extend
- [Source: src/story/SceneRenderer.ts:122-184] - renderScene() method pattern
- [Source: src/story/SceneRenderer.ts:31-38] - SceneRendererCallbacks interface
- [Source: src/story/HistoricalDecisionCard.ts] - Existing complete component (333 lines)
- [Source: src/story/types.ts:303-336] - HistoricalDecision, HistoricalOption interfaces
- [Source: src/story/StoryEngine.ts:221-240] - recordChoice() pattern
- [Source: src/story/StoryEngine.ts:462-509] - Event dispatch pattern
- [Source: src/story/ChallengeObjectives.ts] - Challenge/objective pattern (260 lines)
- [Source: src/story/EnterLabButton.ts] - Lab transition component (133 lines)
- [Source: src/story/MindsetProvider.ts] - Singleton mindset access
- [Source: src/styles/main.css] - CSS conventions
- [Source: _bmad-output/implementation-artifacts/10-21-historical-mindset-time-travel.md] - Previous story
- [Source: _bmad-output/planning-artifacts/epics.md:2112-2139] - Epic story definition

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
