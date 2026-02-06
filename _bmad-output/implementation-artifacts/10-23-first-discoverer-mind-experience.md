# Story 10.23: First Discoverer's Mind Experience

Status: review

## Story

As a new learner,
I want to experience one complete "discoverer's mind" journey as my first interaction,
So that I immediately understand what this platform offers.

## Acceptance Criteria

1. **Given** I'm a brand new user
   **When** I start the first experience
   **Then** I'm placed into one complete historical moment:
   - I face ONE real constraint (e.g., "how do we count with electricity?")
   - I have LIMITED tools (just what they had)
   - I make ONE decision (my approach)
   - I see ONE consequence (what happens)
   - I experience ONE "IT WORKS!" moment

2. **Given** I complete the first experience
   **When** I see the result
   **Then** this takes 5-10 minutes maximum

3. **Given** I've completed the experience
   **When** I reflect
   **Then** I feel: "I just discovered something. I want more."

4. **Given** both first-time and returning users exist
   **When** a first-time user starts
   **Then** they see the discoverer experience
   **When** a returning user starts
   **Then** they resume their normal story progression

5. **Given** this is the first experience
   **When** it concludes
   **Then** it serves as the prototype pattern for ALL future discoverer experiences
   **And** it seamlessly transitions into the full story (Act 0)

## Tasks / Subtasks

- [x] Task 1: Create DiscovererExperience Component (AC: #1, #2, #5)
  - [x] 1.1 Create `src/story/DiscovererExperience.ts` — orchestrator component
  - [x] 1.2 Mount method creates container with `.da-discoverer-experience` class
  - [x] 1.3 Implement phase state machine: `intro` → `constraint` → `decision` → `build` → `consequence` → `celebration`
  - [x] 1.4 Each phase transition uses a brief animated crossfade (reuse `.da-anim-fade-in`)
  - [x] 1.5 Add `onComplete(callback: () => void)` for transitioning to full story after experience
  - [x] 1.6 Add `onSkip(callback: () => void)` for experienced users who want to skip the intro
  - [x] 1.7 Implement `destroy()` with proper cleanup of all sub-components and event listeners
  - [x] 1.8 ARIA: `role="region"`, `aria-label="First Discovery Experience"`, `aria-live="polite"` on phase container

- [x] Task 2: Implement Intro Phase (AC: #1)
  - [x] 2.1 Render welcome text: "Every technology you use today was once someone's impossible problem."
  - [x] 2.2 Show era framing: "The year is 1971. Intel, Santa Clara."
  - [x] 2.3 Present mini persona card (reuse `PersonaCard` pattern) for Federico Faggin
  - [x] 2.4 Render constraint statement: "You have 2,300 transistors. Build a processor."
  - [x] 2.5 Show "Begin" button to advance to constraint phase
  - [x] 2.6 Include optional "Skip Intro" link for returning users (small, non-prominent)
  - [x] 2.7 Use `textContent` for all dynamic text (XSS prevention)

- [x] Task 3: Implement Constraint Phase (AC: #1)
  - [x] 3.1 Display the specific constraint: "Your ALU can only work with 4 bits at a time"
  - [x] 3.2 Show "what you have" panel: 4-bit data bus, 256 bytes of memory, 16 possible opcodes
  - [x] 3.3 Show "what you need": Add two numbers together. The simplest operation. The foundation of everything.
  - [x] 3.4 Render a visual representation (CSS-only, no canvas) of the constraint — a simple 4-bit register diagram
  - [x] 3.5 Use MindsetProvider to set the 1971 context (reuse existing `mockMindset`-style data)
  - [x] 3.6 "Continue" button advances to decision phase

- [x] Task 4: Implement Decision Phase — Reuse DecisionMakerScene (AC: #1)
  - [x] 4.1 Create a `HistoricalDecision` data object for the ALU addition approach:
    - Question: "How should your 4-bit ALU perform addition?"
    - Option A: "Ripple carry — simple, cascading carry from bit to bit" (historical choice)
    - Option B: "Carry lookahead — predict carries in advance, faster but complex"
    - Option C: "Serial — process one bit at a time, save transistors"
  - [x] 4.2 Mount existing `DecisionMakerScene` with the decision data
  - [x] 4.3 Wire `onBuildTransition` callback to advance to build phase
  - [x] 4.4 Store chosen option for consequence phase
  - [x] 4.5 Use abbreviated era context (just year + one-line perspective from MindsetProvider)

- [x] Task 5: Implement Build Phase — Reuse BuilderModeScene (AC: #1)
  - [x] 5.1 Create `BuilderChallengeData` with 3 objectives (keep it tight for 5-10 min experience):
    - Objective 1: "Connect the inputs — wire A and B to the adder" (auto-complete after 3s or click)
    - Objective 2: "Handle the carry — what happens when 1+1=10?" (auto-complete after interaction)
    - Objective 3: "Test it — add 0101 + 0011" (shows result: 1000 = 8)
  - [x] 5.2 Mount existing `BuilderModeScene` with challenge data and decision context
  - [x] 5.3 For the first-time experience, objectives auto-progress with guided prompts (simplified from full lab)
  - [x] 5.4 Show a simple CSS visual of bits being added with carry propagation (not full lab mode)
  - [x] 5.5 When all objectives complete, advance to consequence phase

- [x] Task 6: Implement Consequence + Celebration Phase (AC: #1, #3)
  - [x] 6.1 Mount existing `ConsequenceRevealPanel` showing user choice vs. Faggin's choice
  - [x] 6.2 After consequence, show celebration overlay:
    - Large text: "IT WORKS!" with animated emphasis
    - "You just built the core of a microprocessor."
    - "The same circuit Faggin used in 1971."
    - "5 + 3 = 8. Four bits. The beginning of everything."
  - [x] 6.3 Show two buttons:
    - "Begin the Full Journey" → transitions to Act 0 (main story)
    - "Explore the Lab" → transitions to lab mode with Micro4
  - [x] 6.4 Fire `onComplete` callback with the user's choice recorded
  - [x] 6.5 Animation: `.da-anim-celebration` keyframes (scale pulse + glow)

- [x] Task 7: Integrate with StoryController (AC: #4)
  - [x] 7.1 In `StoryController.ts`, add `isFirstTimeUser(): boolean` method checking StoryStorage
  - [x] 7.2 In `StoryController.resume()` or `start()`, detect first-time user
  - [x] 7.3 If first-time: mount `DiscovererExperience` instead of jumping to Act 0
  - [x] 7.4 On experience complete: mark as completed in StoryStorage (`discoverer_intro_completed: true`)
  - [x] 7.5 Transition to `startNewGame()` (Act 0) after experience completes
  - [x] 7.6 Add `skipDiscovererIntro()` method for skip button

- [x] Task 8: Add Discoverer Experience Data to JSON (AC: #1, #5)
  - [x] 8.1 Create `public/story/data/discoverer-intro.json` with all experience content:
    - Welcome text, persona data, constraint data, decision data, builder data, consequence data, celebration text
  - [x] 8.2 Content should be loadable by `DiscovererExperience` component
  - [x] 8.3 Validate JSON structure matches `HistoricalDecision` and `BuilderChallengeData` interfaces
  - [x] 8.4 Include `MindsetContext` data for the 1971 Intel era

- [x] Task 9: Add CSS Styles (AC: all)
  - [x] 9.1 Add `.da-discoverer-experience` container styles in `src/styles/main.css`
  - [x] 9.2 Add `.da-discoverer-phase` styles with fade transitions between phases
  - [x] 9.3 Add `.da-discoverer-intro` styles (centered, cinematic feel)
  - [x] 9.4 Add `.da-discoverer-constraint` styles (constraint panel with visual diagram)
  - [x] 9.5 Add `.da-discoverer-celebration` styles with `.da-anim-celebration` keyframes
  - [x] 9.6 Add `.da-discoverer-cta` button styles for "Begin Journey" and "Explore Lab"
  - [x] 9.7 Use existing CSS variable system (`--da-*` prefix)
  - [x] 9.8 Ensure responsive layout (mobile-friendly for the intro experience)
  - [x] 9.9 Add `:focus-visible` rules for all new interactive elements

- [x] Task 10: Create Unit Tests (AC: all)
  - [x] 10.1 Create `src/story/DiscovererExperience.test.ts` (~30 tests):
    - Mounts with correct container class and ARIA
    - Starts in intro phase
    - Transitions through all 6 phases in order
    - Renders welcome text in intro phase
    - Renders constraint info in constraint phase
    - Mounts DecisionMakerScene in decision phase
    - Mounts BuilderModeScene in build phase
    - Mounts ConsequenceRevealPanel in consequence phase
    - Shows celebration text and buttons in celebration phase
    - Fires onComplete callback
    - Fires onSkip callback
    - Handles destroy at each phase gracefully
    - Does not duplicate sub-components on repeated phase transitions
  - [x] 10.2 Add StoryController first-time detection tests in `StoryController.test.ts` (~8 tests):
    - Detects first-time user correctly
    - Shows discoverer experience for first-time user
    - Skips experience for returning user
    - Records completion in storage
    - Skip button records completion
    - Transitions to Act 0 after experience
  - [x] 10.3 Every `catch` block must have a corresponding test (per retro action item)
  - [x] 10.4 Add E2E test stubs noting: "When 10-25 E2E infra is built, add: first-time user sees intro, returning user skips, full phase cycle"

- [x] Task 11: Export and Integration Verification (AC: all)
  - [x] 11.1 Export `DiscovererExperience` from `src/story/index.ts`
  - [x] 11.2 Run `npm test` — all tests pass
  - [x] 11.3 Run `npm run build` — builds successfully
  - [x] 11.4 Verify discoverer-intro.json loads correctly
  - [x] 11.5 Verify first-time detection works with empty localStorage

## Dev Notes

### Previous Story Intelligence (Story 10.22)

**Critical Assets Available — DO NOT REWRITE:**
- `DecisionMakerScene` (Story 10.22) — wraps `HistoricalDecisionCard` with era context, build CTA
  - Has `setDecision()`, `onBuildTransition()`, `mount()`, `destroy()`
  - Shows era year + perspective from MindsetProvider
  - After choice + reveal, shows "Now build your solution" + "Enter Builder Mode" button
- `BuilderModeScene` (Story 10.22) — challenge objectives with Enter Lab button
  - Has `setChallengeData()`, `setDecisionContext()`, `setObjectiveComplete()`, `onComplete()`, `onEnterLab()`
  - Shows challenge title, description, objective checklist
  - Shows "You built it!" celebration when all objectives complete
- `ConsequenceRevealPanel` (Story 10.22) — post-builder reflection
  - Shows user choice vs. history's choice side-by-side
  - Shows alternate timeline speculation
  - "Continue Journey" button
- `MindsetProvider` singleton (Story 10.21) — provides era context
- `PersonaCard` (Story 10.18) — displays persona intro card
- `HistoricalDecisionCard` (Story 10.21) — full decision flow UI (333 lines, COMPLETE)

**Patterns Established:**
- Component lifecycle: `mount(container)` / `destroy()` with bound handler cleanup
- CSS: `.da-` prefix, `.da-anim-` animations, `--da-` variables
- Events: `CustomEvent` on `document` or `window`, detail payloads
- Singleton: `MindsetProvider.getInstance()`
- Persistence: `StoryStorage` saves `StoryProgress` to localStorage
- XSS: Always use `textContent`, never `innerHTML` with untrusted data
- Testing: Vitest, co-located `.test.ts`, `describe`/`it` blocks, 85+ tests target

**Bugs Fixed in 10.22 Review (avoid repeating):**
- Missing `.da-builder-complete--hidden { display: none; }` — always add hidden CSS rules
- `resume()` must restore ALL transient state (pendingDecision was missed)
- Bound handler pattern required for all event listeners (no anonymous arrows on DOM elements)
- `:focus-visible` required for all interactive elements
- No duplicate CSS rule blocks
- All subtask checkboxes must match parent checkbox state

### Architecture Requirements

**DiscovererExperience is an ORCHESTRATOR, not a scene type:**
- It does NOT add a new `SceneType` to `content-types.ts`
- It composes existing scene components (PersonaCard, DecisionMakerScene, BuilderModeScene, ConsequenceRevealPanel)
- It manages its own phase state machine internally
- It's mounted by `StoryController` BEFORE the normal scene rendering flow
- After completion, control transfers to the normal `StoryEngine` flow

**Phase State Machine:**
```
intro → constraint → decision → build → consequence → celebration → DONE
```
Each phase:
1. Clears previous phase content (destroy sub-components)
2. Creates new phase content
3. Mounts relevant sub-component(s)
4. Waits for user interaction or auto-advance
5. On advance, transitions to next phase

**First-Time Detection:**
- Check `StoryStorage` (localStorage) for `discoverer_intro_completed` flag
- If flag missing/false → show DiscovererExperience
- If flag true → skip to normal resume/startNewGame flow
- The flag is persisted via a new `StoryStorage` method: `isDiscovererComplete()` / `markDiscovererComplete()`

**Content Loading:**
- Experience data loaded from `public/story/data/discoverer-intro.json`
- This JSON contains all text, decision data, builder data, persona data
- Loaded via `fetch()` at mount time (same pattern as StoryLoader)
- JSON structure uses existing interfaces: `HistoricalDecision`, `BuilderChallengeData`, `PersonaData`, `MindsetContext`

**Build Phase Simplification:**
- The first-time experience does NOT launch full lab mode
- Instead, objectives auto-progress with guided visual feedback
- This is a CSS-only "mini lab" simulation showing bits being added
- The `BuilderModeScene` is used for structure, but `onEnterLab` is NOT wired to actual lab transition
- Instead, objectives are marked complete through the `setObjectiveComplete()` API after brief delays or user clicks

### Key Design Decisions

1. **Orchestrator pattern, not scene type** — DiscovererExperience manages its own rendering lifecycle separate from SceneRenderer. This prevents polluting the scene type system with a one-off flow.

2. **Reuse existing components** — All visual components come from 10.18-10.22. No new UI primitives needed. Only a new orchestrator + phase manager.

3. **Data-driven content** — All text, decisions, objectives in JSON, not hardcoded. This makes the pattern reusable for future discoverer experiences (per AC #5).

4. **Simplified build phase** — No actual lab mode for the intro. CSS animations simulate the "IT WORKS!" moment. Full lab comes later in the real story.

5. **Skip-friendly** — Returning users auto-skip. New users can also skip manually. The "Skip Intro" link is small and non-prominent (we want them to experience it).

6. **Seamless transition** — After celebration, "Begin the Full Journey" calls `StoryController.startNewGame()` which starts from Act 0, Scene 0-1-0. The discoverer experience is a prologue, not part of the act numbering.

### File Structure

```
src/story/
├── DiscovererExperience.ts          # NEW: Orchestrator component
├── DiscovererExperience.test.ts     # NEW: ~30 tests
├── StoryController.ts               # MODIFY: First-time detection + experience mount
├── StoryController.test.ts          # MODIFY: Add ~8 tests
├── StoryStorage.ts                  # MODIFY: Add discoverer completion methods
├── index.ts                         # MODIFY: Export new component

src/styles/
├── main.css                         # MODIFY: Add discoverer experience CSS

public/story/data/
├── discoverer-intro.json            # NEW: Experience content data
```

### Testing Requirements

- **Unit tests:** Co-located `.test.ts` files using Vitest
- **Every `catch` block must have a test** (Epic 9 retro action item)
- **E2E test stubs** — Add comments noting what E2E tests are needed when 10-25 is complete
- **Target:** ~38 new tests (30 DiscovererExperience + 8 StoryController)
- **Phase transition testing:** Test that destroying in any phase doesn't throw

### CSS Conventions

- Class prefix: `.da-discoverer-` (e.g., `.da-discoverer-experience`, `.da-discoverer-celebration`)
- Animation prefix: `.da-anim-celebration` (new keyframes)
- CSS variables: `--da-` (reuse existing)
- Responsive: Mobile-first for intro (many new users on mobile)
- Focus styles: `:focus-visible` on all buttons

### XSS Prevention

- All text from `discoverer-intro.json` rendered via `textContent`
- Never use `innerHTML` with JSON content
- Persona names, constraint descriptions, decision options all treated as untrusted

### References

- [Source: src/story/DecisionMakerScene.ts] — Decision wrapping pattern (mount/setDecision/onBuildTransition)
- [Source: src/story/BuilderModeScene.ts] — Builder challenge pattern (setChallengeData/setObjectiveComplete/onComplete)
- [Source: src/story/ConsequenceRevealPanel.ts] — Consequence display pattern
- [Source: src/story/PersonaCard.ts] — Persona card rendering
- [Source: src/story/MindsetProvider.ts] — Singleton mindset access
- [Source: src/story/StoryController.ts] — Controller orchestration pattern (~lines 1-180)
- [Source: src/story/StoryStorage.ts] — Persistence methods
- [Source: src/story/content-types.ts:30] — SceneType union (DO NOT EXTEND for this story)
- [Source: src/story/types.ts:303-336] — HistoricalDecision, HistoricalOption interfaces
- [Source: src/styles/main.css] — CSS conventions and variable system
- [Source: _bmad-output/implementation-artifacts/10-22-decision-maker-builder-mode.md] — Previous story patterns
- [Source: _bmad-output/planning-artifacts/epics.md:2140-2160] — Epic story definition

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed TS error: `ChallengeObjective` imported from `./types` not `./content-types` (not re-exported)
- Fixed TS error: unused `decisionId` parameter renamed to `_decisionId`
- Existing StoryController tests required `DISCOVERER_COMPLETE_KEY` set in `beforeEach` to simulate returning user behavior (first-time detection changes the initialize flow)

### Completion Notes List

- 37 DiscovererExperience tests + 8 StoryController integration tests = 45 new tests (exceeded ~38 target)
- All 3,866 project tests pass (96 test files)
- No new TypeScript errors in story modules (pre-existing App.test.ts errors are unrelated)
- DiscovererExperience is a pure orchestrator — no new SceneType added to content-types
- StoryController.initialize() short-circuits for first-time users, deferring to showDiscovererExperience()
- StoryStorage gained isDiscovererComplete() and markDiscovererComplete() using separate localStorage key
- CSS uses existing --da-* variables, adds da-anim-celebration keyframes, :focus-visible on all buttons
- E2E test stubs added as comments in DiscovererExperience.test.ts for Story 10-25

### File List

- `src/story/DiscovererExperience.ts` — NEW: Orchestrator component (466 lines, 6 phases)
- `src/story/DiscovererExperience.test.ts` — NEW: 37 tests + E2E stubs
- `src/story/StoryController.ts` — MODIFIED: Added first-time detection, showDiscovererExperience(), skipDiscovererIntro(), isDiscovererActive(), cleanup
- `src/story/StoryController.test.ts` — MODIFIED: Added 8 integration tests for discoverer experience
- `src/story/StoryStorage.ts` — MODIFIED: Added DISCOVERER_COMPLETE_KEY, isDiscovererComplete(), markDiscovererComplete()
- `src/story/index.ts` — MODIFIED: Export DiscovererExperience, DiscovererPhase, DISCOVERER_COMPLETE_KEY
- `src/styles/main.css` — MODIFIED: Added ~250 lines of discoverer experience CSS with responsive layout
- `public/story/data/discoverer-intro.json` — NEW: Experience content data (137 lines)
