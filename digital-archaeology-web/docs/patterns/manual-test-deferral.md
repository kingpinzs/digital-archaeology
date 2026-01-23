# Manual Test Deferral Process

**Action Item from Epic 4 Retrospective: Formalize manual test deferral process**

This document describes when and how to defer manual tests to automated tests.

## Background

Some stories include manual test subtasks (e.g., "visually verify button state"). When these can be adequately covered by automated tests, they may be deferred. This process formalizes that decision.

## When Manual Tests Can Be Deferred

Manual tests can be replaced with automated tests when:

1. **State can be programmatically verified**
   - Button enabled/disabled state
   - Element visibility
   - Text content
   - CSS classes applied

2. **Behavior can be simulated**
   - Click events
   - Keyboard events
   - Focus changes
   - Form input

3. **UI state is deterministic**
   - Given X input, always produces Y output
   - No animation timing dependencies
   - No external service dependencies

## When Manual Tests Are Still Required

Manual tests should NOT be deferred when:

1. **Visual appearance matters**
   - Color accuracy
   - Layout/spacing
   - Animation smoothness
   - Responsive design breakpoints

2. **Browser-specific behavior**
   - Different rendering across browsers
   - Native dialog interactions
   - Clipboard operations

3. **User experience judgment**
   - "Does this feel right?"
   - "Is this intuitive?"
   - "Is the timing appropriate?"

4. **Accessibility verification**
   - Screen reader announcements
   - Color contrast in context
   - Focus visibility in real usage

## Deferral Process

### Step 1: Document the Deferral

In the story file, mark the manual test subtask with a note:

```markdown
- [x] 7.3 Verify button state changes (Manual → Automated)
      _Covered by automated test: "should disable Run button when running"_
```

### Step 2: Write Equivalent Automated Test

Create an automated test that covers the same scenario:

```typescript
it('should disable Run button when running', async () => {
  // Setup
  await loadValidProgram();

  // Trigger
  await clickRunButton();

  // Verify - this replaces manual visual verification
  expect(runButton.disabled).toBe(true);
  expect(runButton.getAttribute('aria-disabled')).toBe('true');
  expect(pauseButton.disabled).toBe(false);
});
```

### Step 3: Reference in Code Review

In the Code Review Record, note the deferral:

```markdown
### Manual Test Deferrals

| Subtask | Automated Replacement |
|---------|----------------------|
| 7.3 Verify button state changes | App.test.ts: "should disable Run button when running" |
| 7.4 Verify UI responsiveness | App.test.ts: "should update status bar during execution" |
```

## Examples from Epic 4

### Story 4.6: Stop Button

**Original manual tests:**
- 7.3 Manually verify button state changes
- 7.4 Manually verify pause/resume behavior
- 7.5 Manually verify Step button after pause

**Automated replacements:**
```typescript
// 7.3 - Button state changes
it('should change Run button to Pause when running', () => {
  expect(toolbar.querySelector('.btn-pause')).toBeTruthy();
});

// 7.4 - Pause/resume behavior
it('should resume execution when Run clicked after pause', async () => {
  await pauseExecution();
  await clickRunButton();
  expect(isRunning).toBe(true);
});

// 7.5 - Step after pause
it('should enable Step button after pause', async () => {
  await pauseExecution();
  expect(stepButton.disabled).toBe(false);
});
```

### Story 4.7: Reset Button

**Original manual tests:**
- Manually verify reset clears display

**Automated replacement:**
```typescript
it('should reset CPU state to initial values', async () => {
  // Setup: put CPU in non-initial state
  await loadAndRunProgram();

  // Trigger reset
  await clickResetButton();

  // Verify all state cleared (replaces visual verification)
  expect(statusBar.pcValue).toBe('$00');
  expect(statusBar.cycleCount).toBe('0');
  expect(toolbar.runButtonEnabled).toBe(true);
});
```

## Test Coverage Equivalence

When deferring manual tests, ensure automated tests cover:

| Manual Test Aspect | Automated Equivalent |
|--------------------|---------------------|
| "Button appears disabled" | `expect(button.disabled).toBe(true)` |
| "Text shows correct value" | `expect(element.textContent).toBe('expected')` |
| "Element is visible" | `expect(element.style.display).not.toBe('none')` |
| "Correct CSS class applied" | `expect(element.classList).toContain('active')` |
| "Focus moves correctly" | `expect(document.activeElement).toBe(expectedElement)` |

## Tracking Deferrals

### In Sprint Status

Track deferred manual tests in the story's Dev Notes:

```yaml
# sprint-status.yaml comments
4-6-implement-stop-button: done  # Manual tests 7.3-7.5 → automated
```

### In Retrospective

Report deferrals in the retrospective:

```markdown
## Manual Test Deferrals

| Story | Manual Tasks | Automated Coverage |
|-------|--------------|-------------------|
| 4.6 | 3 | 100% (3 new tests) |
| 4.7 | 1 | 100% (1 new test) |
```

## When to Revisit

Consider adding actual manual tests if:

1. Automated tests pass but users report issues
2. Visual regressions slip through
3. New browser versions behave differently
4. Accessibility audit finds issues

## Related Documentation

- [Pre-Commit Hooks](./pre-commit-hooks.md) - Automated test verification
- [State Management](./state-management.md) - Testing state changes
