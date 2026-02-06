# Story TD-4: Story Mode Journey E2E Tests

Status: backlog

## Story

As a developer,
I want comprehensive journey E2E tests that verify the story mode experience works end-to-end,
so that we can prove choices branch correctly, the lab loop completes, content loads properly, and the narrative experience functions as designed.

## Origin

**Source:** Epic 10 Retrospective (2026-02-06), Gap #1
**Root Cause:** E2E tests prove mechanics work (buttons render, modes switch) but don't verify the narrative experience. Lab mode has ~80% E2E coverage. Story mode has ~35%. Critical gaps: multi-act progression (0%), choice branching (0%), persona display (10%), challenge round-trip (15%), full discoverer walkthrough (50%).
**Impact:** HIGH — Can't verify the product works as an experience. Individual components pass their own tests but the system-level behavior is untested. Story 10-24's anachronism bug (Babbage in 35,000 BC) was only caught visually, reinforcing the need for content-aware E2E tests.

## Acceptance Criteria

1. **Given** the story mode, **When** the discoverer experience E2E test runs, **Then** it verifies all 6 phases sequentially (intro → constraint → decision → build → consequence → celebration), **And** the completion flag persists across page reload, **And** a returning user skips directly to the story

2. **Given** a choice scene with branching (requires TD-1), **When** the choice branching E2E test runs, **Then** selecting Choice A leads to scene A's content, **And** reloading and selecting Choice B leads to different content, proving causality

3. **Given** a challenge scene (requires TD-2), **When** the challenge round-trip E2E test runs, **Then** the flow story → "Enter Lab" → complete objectives → "Return to Story" → verify scene advanced is verified end-to-end, **And** returning without completion stays on the same scene

4. **Given** the story mode with real JSON content, **When** multi-scene navigation E2E tests run, **Then** at least 5 consecutive scenes are navigated with content verification at each step, **And** chapter transitions are verified

5. **Given** the persona system, **When** persona display E2E tests run, **Then** the "Your Role" panel shows the persona name and context for the current scene, **And** the persona updates when navigating to a new scene with a different persona

6. **Given** multi-act content, **When** act transition E2E tests run, **Then** navigating from the last scene of one act to the first scene of the next is verified, **And** the era badge and progress dots update accordingly

7. **Given** all new journey E2E tests, **When** CI runs, **Then** all pass in both Chromium and Firefox, **And** story mode E2E coverage reaches 70%+ (up from 35%)

8. **Given** all journey tests, **When** content changes are made in future PRs, **Then** the tests catch regressions without relying on exact text matches (use structural assertions)

## Tasks / Subtasks

- [ ] Task 1: Full Discoverer Experience Journey (AC: #1)
  - [ ] 1.1 Create or extend test in `tests/e2e/story-journeys.spec.ts`
  - [ ] 1.2 Test: Clear localStorage → enter story mode → verify `.da-discoverer-experience` visible
  - [ ] 1.3 Test: Progress through all 6 phases:
    - Phase 1 (intro): Verify intro content visible, click continue
    - Phase 2 (constraint): Verify constraint content visible, click continue
    - Phase 3 (decision): Verify decision prompt visible, make a selection
    - Phase 4 (build): Verify build interface visible, complete action
    - Phase 5 (consequence): Verify consequence shown, click continue
    - Phase 6 (celebration): Verify "Begin Your Journey" button visible, click it
  - [ ] 1.4 Test: After completion, verify story mode loads (not discoverer)
  - [ ] 1.5 Test: Reload page → verify discoverer does NOT show again (flag persisted)

- [ ] Task 2: Choice Branching Journey (AC: #2) — Depends on TD-1
  - [ ] 2.1 Test: Navigate to a choice scene in the story
  - [ ] 2.2 Test: Capture current scene content, select Choice A
  - [ ] 2.3 Test: Verify new scene content differs from departure scene AND matches Choice A's target
  - [ ] 2.4 Test: Reload page, navigate to same choice scene, select Choice B
  - [ ] 2.5 Test: Verify scene content differs from Choice A's result (proves branching)
  - [ ] 2.6 Test: Use back/previous navigation from branched scene, verify return to choice scene

- [ ] Task 3: Challenge Round-Trip Journey (AC: #3) — Depends on TD-2
  - [ ] 3.1 Test: Navigate to a challenge scene in story mode
  - [ ] 3.2 Test: Verify "Enter the Lab" button visible, click it
  - [ ] 3.3 Test: Verify lab mode with challenge objectives panel visible
  - [ ] 3.4 Test: Complete challenge objectives (or simulate completion via state)
  - [ ] 3.5 Test: Click "Return to Story", verify story scene ADVANCED (new content)
  - [ ] 3.6 Test: Separate test — return from lab WITHOUT completing, verify same scene

- [ ] Task 4: Multi-Scene Navigation Journey (AC: #4)
  - [ ] 4.1 Test: Enter story mode, capture initial scene content
  - [ ] 4.2 Test: Click "Continue" 5 times, verify content changes at each step
  - [ ] 4.3 Test: At each step, verify structural elements present (`.da-story-content`, scene content length > 0)
  - [ ] 4.4 Test: Verify chapter header updates when crossing chapter boundary
  - [ ] 4.5 Test: Use "Previous" to go back, verify content matches earlier capture

- [ ] Task 5: Persona Display Journey (AC: #5)
  - [ ] 5.1 Test: Navigate to a scene with persona context
  - [ ] 5.2 Test: Verify "Your Role" panel (`.da-your-role-panel`) shows:
    - Persona name is non-empty
    - Persona context/description is present
  - [ ] 5.3 Test: Navigate to a scene with a different persona
  - [ ] 5.4 Test: Verify "Your Role" panel updated with new persona name/context
  - [ ] 5.5 Test: Switch to lab mode and back, verify persona state preserved

- [ ] Task 6: Multi-Act Progression Journey (AC: #6)
  - [ ] 6.1 Test: Use story browser to verify all 11 acts listed
  - [ ] 6.2 Test: Navigate to a scene near the end of Act 0
  - [ ] 6.3 Test: Progress to Act 1, verify:
    - Era badge updates
    - Progress dots show Act 1 as current
    - Content is Act 1 content (not Act 0)
  - [ ] 6.4 Test: Verify chapter header shows Act 1 chapter info

- [ ] Task 7: Verify All Tests Pass in CI (AC: #7, #8)
  - [ ] 7.1 Run all new journey tests locally in Chromium — all pass
  - [ ] 7.2 Run all new journey tests locally in Firefox — all pass
  - [ ] 7.3 Run full E2E suite — no regressions in existing tests
  - [ ] 7.4 Verify story mode E2E coverage calculation reaches 70%+
  - [ ] 7.5 Verify all assertions use structural selectors, not exact text matches

## Dev Notes

### Current Coverage vs. Target

| Area | Before (Epic 10) | Target (After TD-4) |
|------|------------------|---------------------|
| Story Content & Choices | 20% | 70%+ |
| Persona System | 10% | 60%+ |
| Multi-Act Progression | 0% | 50%+ |
| Challenge Flow | 15% | 70%+ |
| Discoverer Experience | 50% | 90%+ |
| **Story Mode Overall** | **35%** | **70%+** |

### Test File Organization

New tests go in: `digital-archaeology-web/tests/e2e/story-journeys.spec.ts`

Follow existing naming convention:
```typescript
describe('Story Mode Journeys', () => {
  describe('TD-4: Discoverer Experience', () => {
    test('[TD-4.1] should complete all 6 discoverer phases sequentially', async ({ page }) => {
```

### Selector Strategy (No Flaky Tests)

**DO use structural selectors:**
- `.da-discoverer-experience` — discoverer visible
- `.da-story-content` — story content area
- `[data-scene-id]` — specific scene rendered
- `.da-your-role-panel` — persona panel
- `.da-era-badge` — era badge
- `.da-progress-dots` — progress indicator
- `[data-action="continue"]` — continue button
- `[data-action="previous"]` — previous button
- `.da-choice-card` — choice cards

**DO NOT use:**
- Exact story text (`expect(text).toBe("In 1837, Charles Babbage...")`)
- CSS nth-child selectors (`div > span:nth-child(3)`)
- Hardcoded scene IDs (unless testing specific known content)

**DO use content-change assertions:**
```typescript
const contentBefore = await page.locator('.da-story-content').textContent();
await page.click('[data-action="continue"]');
const contentAfter = await page.locator('.da-story-content').textContent();
expect(contentAfter).not.toBe(contentBefore); // Content changed
expect(contentAfter!.length).toBeGreaterThan(50); // New content is substantial
```

### Dependencies

- **Depends on TD-1** (choice branching) — Task 2 tests can only pass after branching works
- **Depends on TD-2** (lab loop) — Task 3 tests can only pass after loop is closed
- **Depends on TD-3** (content fixes) — All tests depend on valid content

**Development Strategy:** Create all test files with Tasks 1, 4, 5, 6 immediately (these work with current codebase). Tasks 2, 3 can be written as stubs that get enabled after TD-1 and TD-2 are complete. Use `test.skip()` with descriptive reason until dependencies are met.

### E2E Test Count Target

Current: 163 tests (326 across 2 browsers)
New journey tests: ~15 (Tasks 1-6)
Target: 178+ tests (356+ across 2 browsers)

### Anti-Patterns to Avoid

1. DO NOT assert on exact story text — content will evolve, tests should survive content changes
2. DO NOT use `page.waitForTimeout()` as primary sync — prefer `waitForSelector`, `expect().toBeVisible()`
3. DO NOT mock story JSON content — journey tests must use REAL content to catch content bugs
4. DO NOT skip Firefox — all journey tests must pass in both browsers
5. DO NOT create one mega-test — each journey should be a separate test for clear failure diagnosis

### References

- [Source: digital-archaeology-web/tests/e2e/story-playthrough.spec.ts] — Existing story tests (reference patterns)
- [Source: digital-archaeology-web/tests/e2e/full-user-journey.spec.ts] — Existing journey tests (reference patterns)
- [Source: digital-archaeology-web/tests/e2e/epic-10-story-mode.spec.ts] — Existing story mode spot checks
- [Source: digital-archaeology-web/tests/e2e/story-navigation.spec.ts] — Existing navigation tests
- [Source: digital-archaeology-web/src/story/DiscovererExperience.ts] — Discoverer component (6 phases)
- [Source: digital-archaeology-web/src/story/StoryController.ts] — Story orchestrator
- [Source: digital-archaeology-web/src/story/SceneRenderer.ts] — Scene rendering
- [Source: _bmad-output/implementation-artifacts/epic-10-retro-2026-02-06.md] — Gap #1 analysis
