# Digital Archaeology - Test Suite

This document describes the testing infrastructure for Digital Archaeology.

## Test Frameworks

| Framework | Purpose | Location |
|-----------|---------|----------|
| **Vitest** | Unit & Component tests | `src/**/*.test.ts`, `tests/unit/` |
| **Playwright** | E2E browser tests | `tests/e2e/` |

## Running Tests

### Unit Tests (Vitest)

```bash
# Run tests in watch mode (development)
npm test

# Run tests once
npm run test:run

# Run with coverage report
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# View HTML report after run
npm run test:e2e:report
```

### Run by Priority

Tests are tagged with priority levels:

```bash
# Run only P0 (critical) tests
npm run test:e2e -- --grep "@P0"

# Run P0 + P1 tests (pre-merge)
npm run test:e2e -- --grep "@P0|@P1"
```

## Directory Structure

```
tests/
├── e2e/                    # Playwright E2E tests
│   └── app.spec.ts         # Application-level tests
├── unit/                   # Vitest unit tests
│   └── example.test.ts     # Example test with factories
└── support/                # Test infrastructure
    ├── fixtures/           # Playwright fixtures
    │   └── index.ts        # Extended test with custom fixtures
    ├── factories/          # Test data factories
    │   └── test-data.factory.ts
    └── helpers/            # Utility functions
        └── wait-for.ts     # Async helpers
```

## Test File Conventions

### Naming

| Type | Pattern | Example |
|------|---------|---------|
| Unit tests (co-located) | `*.test.ts` | `src/utils/validation.test.ts` |
| Unit tests (separate) | `*.test.ts` | `tests/unit/validation.test.ts` |
| E2E tests | `*.spec.ts` | `tests/e2e/editor.spec.ts` |

### Priority Tags

Include priority in test names for selective execution:

```typescript
test('[P0] critical user flow', async () => { ... });
test('[P1] important feature', async () => { ... });
test('[P2] edge case', async () => { ... });
test('[P3] nice-to-have', async () => { ... });
```

| Tag | Run When | Purpose |
|-----|----------|---------|
| `[P0]` | Every commit | Critical paths that must never break |
| `[P1]` | PR to main | Important features |
| `[P2]` | Nightly | Edge cases, less critical |
| `[P3]` | On-demand | Exploratory, rare scenarios |

## Writing Tests

### Unit Tests (Vitest)

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something specific', () => {
    // GIVEN: Setup
    const input = 'test';

    // WHEN: Action
    const result = process(input);

    // THEN: Assertion
    expect(result).toBe('expected');
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '../support/fixtures';

test.describe('Feature', () => {
  test('[P1] should accomplish user goal', async ({ page }) => {
    // GIVEN: User is on the page
    await page.goto('/');

    // WHEN: User performs action
    await page.click('[data-testid="action-button"]');

    // THEN: Expected outcome
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

## Using Test Factories

Factories generate realistic test data using `@faker-js/faker`:

```typescript
import { createCPUState, createBreakpoint } from '../support/factories/test-data.factory';

// Default random values
const state = createCPUState();

// With specific overrides
const customState = createCPUState({
  pc: 42,
  accumulator: 7,
  isRunning: true,
});
```

## Best Practices

### DO

- Use `data-testid` attributes for selectors
- Follow Given-When-Then format
- One assertion per test (atomic tests)
- Use factories for test data
- Tag tests with priority (`[P0]`, `[P1]`, etc.)
- Clean up test data after each test

### DON'T

- Use hard waits (`page.waitForTimeout()`)
- Use brittle CSS selectors
- Share state between tests
- Use try-catch for test logic
- Create page object classes (keep tests simple)

## Configuration Files

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Vitest configuration |
| `playwright.config.ts` | Playwright configuration |

## CI Integration

Tests run automatically in CI:

- **Unit tests**: Run on every commit
- **E2E tests**: Run on PR to main

The Playwright config includes a web server that starts `npm run dev` before tests.

## Debugging

### Vitest

```bash
# Run specific test file
npm test src/utils/validation.test.ts

# Run tests matching pattern
npm test -- -t "validation"
```

### Playwright

```bash
# Debug specific test
npm run test:e2e:debug -- tests/e2e/app.spec.ts

# Generate trace for failing test
# (traces are auto-captured on failure)
```

## Coverage

Generate coverage report:

```bash
npm run test:coverage
```

Reports are output to `./coverage/` directory.
