# System-Level Test Design: Digital Archaeology

**Date:** 2026-01-21
**Author:** Jeremy (TEA Agent)
**Status:** Draft

---

## Executive Summary

**Scope:** System-level testability review for Digital Archaeology web platform

**Architecture Assessment:**
- **Controllability:** HIGH - Simple Store pattern, isolated Web Worker, clear module boundaries
- **Observability:** HIGH - Pub/sub state, traceable postMessage protocol, canvas snapshots
- **Isolation:** HIGH - Feature folders, no backend dependencies, mockable Worker

**Risk Summary:**
- Total risks identified: 8
- High-priority risks (score ≥6): 3
- Critical categories: PERF (WASM performance), TECH (Worker communication), DATA (State sync)

**Coverage Summary:**
- P0 scenarios: 12 (critical user journeys)
- P1 scenarios: 18 (feature coverage)
- P2/P3 scenarios: 25 (edge cases, visual regression)
- **Total effort**: ~45 hours (~6 days)

---

## Architecturally Significant Requirements (ASRs)

### Performance ASRs (from NFRs)

| ASR ID | Requirement | Threshold | Test Approach |
|--------|-------------|-----------|---------------|
| ASR-P1 | NFR1: Visualizer 30fps | ≥30 fps sustained | Performance benchmark (requestAnimationFrame timing) |
| ASR-P2 | NFR2: Step execution | <1ms per step | Unit test timing assertions |
| ASR-P3 | NFR3: Assembly time | <500ms for 256 instructions | Integration test with timer |
| ASR-P4 | NFR4: Initial load | <5s on broadband | Lighthouse CI / E2E page load |
| ASR-P5 | NFR5: 500 gates responsive | No frame drops | Stress test with max gate count |

### Reliability ASRs

| ASR ID | Requirement | Threshold | Test Approach |
|--------|-------------|-----------|---------------|
| ASR-R1 | NFR15: Unsaved work protection | Always prompt | E2E beforeunload test |
| ASR-R2 | NFR16: Storage persistence | Survives refresh | Integration localStorage/IndexedDB test |
| ASR-R3 | NFR17: Valid exports | Re-importable | Round-trip import/export test |

### Usability ASRs

| ASR ID | Requirement | Threshold | Test Approach |
|--------|-------------|-----------|---------------|
| ASR-U1 | NFR10: Zero-doc workflow | Complete cycle unaided | E2E user journey test |
| ASR-U2 | NFR11: Actionable errors | Line numbers + descriptions | Unit + E2E error display |
| ASR-U3 | NFR12: Keyboard shortcuts | All primary actions | E2E keyboard navigation |
| ASR-U4 | NFR13: 100ms feedback | Visual response | Performance timing assertions |

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Prob | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|------|--------|-------|------------|-------|
| R-001 | PERF | WASM Worker message latency exceeds 1ms per step | 2 | 3 | 6 | SharedArrayBuffer for hot path, benchmark tests | Dev |
| R-002 | TECH | State desync between Store and Worker during rapid stepping | 3 | 2 | 6 | Request-response protocol with sequence IDs, integration tests | Dev |
| R-003 | DATA | Circuit visualization lags behind CPU state | 2 | 3 | 6 | Throttled state updates, visual regression tests | Dev |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Prob | Impact | Score | Mitigation |
|---------|----------|-------------|------|--------|-------|------------|
| R-004 | TECH | Monaco Editor initialization failures | 1 | 3 | 3 | Lazy load with fallback, integration test |
| R-005 | PERF | Canvas rendering drops frames during zoom/pan | 2 | 2 | 4 | Debounced rendering, performance test |
| R-006 | DATA | IndexedDB quota exceeded | 1 | 3 | 3 | Storage quota check, cleanup prompts |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Prob | Impact | Score | Action |
|---------|----------|-------------|------|--------|-------|--------|
| R-007 | BUS | User loads corrupted .asm file | 1 | 2 | 2 | Validation on import |
| R-008 | OPS | GitHub Pages deployment fails | 1 | 2 | 2 | CI smoke test |

---

## Test Levels Strategy

### Test Pyramid Distribution

```
        ┌─────────────────────────┐
        │        E2E (15%)        │  12 scenarios
        │   User Journeys Only    │  Playwright
        ├─────────────────────────┤
        │    Integration (25%)    │  18 scenarios
        │  WASM/Worker/Storage    │  Vitest + Playwright API
        ├─────────────────────────┤
        │      Unit (60%)         │  ~100 tests
        │  Store, Utils, Parser   │  Vitest
        └─────────────────────────┘
```

### Test Level Assignments by Module

| Module | Unit | Integration | E2E | Notes |
|--------|------|-------------|-----|-------|
| `state/store.ts` | ✅ Primary | - | - | Pure function, no deps |
| `state/persistence.ts` | ✅ Mocked | ✅ Primary | - | Storage APIs |
| `emulator/EmulatorBridge.ts` | ✅ Protocol | ✅ Primary | - | Worker messages |
| `emulator/worker.ts` | ✅ WASM calls | ✅ Primary | - | WASM integration |
| `editor/Editor.ts` | - | ✅ Primary | - | Monaco integration |
| `editor/micro4-language.ts` | ✅ Primary | - | - | Token rules |
| `visualizer/CircuitRenderer.ts` | ✅ Geometry | ✅ Canvas | ✅ Visual | Canvas rendering |
| `visualizer/AnimationLoop.ts` | ✅ Timing | ✅ RAF | - | Animation frames |
| `debugger/BreakpointManager.ts` | ✅ Primary | - | - | Pure logic |
| `ui/*` | - | - | ✅ Primary | User interactions |

### E2E Test Scenarios (P0 - Critical)

| ID | Scenario | FR Coverage | Risk Link |
|----|----------|-------------|-----------|
| E2E-001 | Write code → Assemble → See binary | FR1, FR5, FR7 | - |
| E2E-002 | Load program → Run → See halt | FR9, FR10 | - |
| E2E-003 | Step execution with register updates | FR13, FR14, FR15 | R-002 |
| E2E-004 | Set breakpoint → Run → Stop at breakpoint | FR17, FR18 | - |
| E2E-005 | Circuit animates during step | FR20, FR21, FR22 | R-003 |
| E2E-006 | Assembly error with line highlight | FR6, FR19 | - |
| E2E-007 | Save work → Refresh → Restore | FR31, FR32 | ASR-R2 |
| E2E-008 | Export .asm → Import → Same content | FR33, FR34 | ASR-R3 |
| E2E-009 | Unsaved work blocks navigation | - | ASR-R1 |
| E2E-010 | Load example program | FR29, FR30 | - |
| E2E-011 | Zoom and pan circuit | FR23 | R-005 |
| E2E-012 | Reset emulator to initial state | FR12 | - |

---

## NFR Testing Approach

### Performance (NFR1-NFR5)

**Tool:** Vitest benchmarks + Playwright performance tracing

```typescript
// tests/performance/animation.bench.ts
import { bench, describe } from 'vitest';

describe('Animation Performance', () => {
  bench('AnimationLoop maintains 30fps', async () => {
    const loop = new AnimationLoop();
    const frames: number[] = [];

    loop.onFrame((delta) => frames.push(delta));
    loop.start();

    await new Promise(r => setTimeout(r, 1000));
    loop.stop();

    const avgFps = frames.length;
    expect(avgFps).toBeGreaterThanOrEqual(30);
  });
});
```

**Tool:** Playwright for page load timing

```typescript
// tests/e2e/performance.spec.ts
test('initial load under 5 seconds', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  await page.waitForSelector('[data-testid="app-ready"]');
  const loadTime = Date.now() - startTime;

  expect(loadTime).toBeLessThan(5000);
});
```

### Reliability (NFR15-NFR17)

```typescript
// tests/e2e/reliability.spec.ts
test('unsaved work prompts before navigation', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="editor"]', 'MOV A, #5');

  page.on('dialog', dialog => {
    expect(dialog.message()).toContain('unsaved');
    dialog.dismiss();
  });

  await page.goto('/other-page');
  // Should still be on original page
  await expect(page).toHaveURL('/');
});
```

### Browser Compatibility (NFR6-NFR9)

**Tool:** Playwright multi-browser projects

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } }, // Primary
    { name: 'chrome', use: { ...devices['Desktop Chrome'] } },   // Secondary
  ],
});
```

### Usability (NFR10-NFR14)

```typescript
// tests/e2e/usability.spec.ts
test('complete assemble-run-debug without documentation', async ({ page }) => {
  await page.goto('/');

  // Write code
  await page.click('[data-testid="editor"]');
  await page.keyboard.type('LDA #5\nADD #3\nHLT');

  // Assemble (discover button)
  await page.click('[data-testid="assemble-button"]');
  await expect(page.getByText('Assembly successful')).toBeVisible();

  // Run
  await page.click('[data-testid="run-button"]');
  await expect(page.getByText('HALTED')).toBeVisible();

  // Inspect result
  await expect(page.getByTestId('accumulator')).toHaveText('8');
});
```

---

## Test Infrastructure Requirements

### Test Data

| Factory | Purpose | Dependencies |
|---------|---------|--------------|
| `createAssemblyProgram()` | Generate valid Micro4 assembly | None |
| `createCPUState()` | Create CPU state snapshots | None |
| `createCircuitData()` | Generate gate/wire test data | None |

### Test Fixtures

| Fixture | Purpose | Setup/Teardown |
|---------|---------|----------------|
| `withEmulator` | WASM emulator instance | Load WASM, reset state |
| `withEditor` | Monaco editor instance | Create editor, cleanup |
| `withStore` | Application store | Create store, reset |

### Tooling

| Tool | Purpose |
|------|---------|
| Vitest | Unit + integration tests, benchmarks |
| Playwright | E2E tests, visual regression |
| @vitest/coverage-v8 | Coverage reporting |
| @playwright/test | Browser automation |

### Environment

| Requirement | Notes |
|-------------|-------|
| Node 20+ | WASM support, modern APIs |
| Firefox + Chrome | Multi-browser testing |
| CI: GitHub Actions | Automated test runs |

---

## Quality Gate Criteria

### Pass/Fail Thresholds

| Metric | P0 | P1 | P2/P3 |
|--------|----|----|-------|
| Test Pass Rate | 100% | ≥95% | ≥90% |
| Coverage (lines) | N/A | ≥80% | ≥70% |
| Performance (30fps) | MUST | SHOULD | NICE |

### Non-Negotiable Requirements

- [ ] All P0 E2E tests pass (12 scenarios)
- [ ] All high-risk (≥6) items have mitigation tests
- [ ] Performance NFRs validated with benchmarks
- [ ] No critical/high vulnerabilities (npm audit)

---

## Testability Concerns & Recommendations

### Concern 1: WASM State Inspection

**Issue:** Cannot directly inspect WASM memory from JavaScript tests.

**Recommendation:** Add `getState()` method to WASM exports that returns serialized CPU state. Already defined in architecture.

### Concern 2: Canvas Visual Testing

**Issue:** Canvas rendering cannot be asserted via DOM queries.

**Recommendation:**
1. Use Playwright visual comparison (`toHaveScreenshot()`)
2. Add `data-testid` to SVG overlay elements
3. Expose `getRenderedGates()` method for programmatic verification

### Concern 3: Animation Timing Tests

**Issue:** RAF-based animation is non-deterministic.

**Recommendation:**
1. Mock `requestAnimationFrame` in unit tests
2. Use `page.clock.fastForward()` in E2E tests
3. Test frame count over duration, not exact timing

### Concern 4: Monaco Editor Integration

**Issue:** Third-party component with complex initialization.

**Recommendation:**
1. Create `EditorTestHelper` that handles initialization
2. Use `waitForSelector('[data-testid="editor-ready"]')` in E2E
3. Unit test `micro4-language.ts` token rules separately

---

## Follow-on Workflows

- **testarch-atdd**: Generate failing P0 tests before implementation
- **testarch-automate**: Expand coverage after implementation
- **testarch-trace**: Verify requirements-to-tests traceability

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: __________ Date: __________
- [ ] Tech Lead: __________ Date: __________
- [ ] QA Lead: __________ Date: __________

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `/bmad:bmm:workflows:testarch-test-design`
**Version**: System-Level (Phase 3)
