# Pre-Commit Hook Setup

**Action Item #8 from Epic 3 Retrospective**

This guide explains how to set up pre-commit hooks for test count verification.

## Option 1: Manual Verification

Run the verification script before committing:

```bash
./scripts/verify-test-count.sh
```

The script:
- Runs all tests
- Extracts the pass count
- Fails if count drops below 1000

## Option 2: Husky Pre-Commit Hook

### Installation

```bash
cd digital-archaeology-web
npm install --save-dev husky lint-staged
npx husky init
```

### Configure Pre-Commit Hook

Edit `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run test count verification
./scripts/verify-test-count.sh

# Run lint-staged for other checks
npx lint-staged
```

### Configure lint-staged

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.css": [
      "prettier --write"
    ]
  }
}
```

## Option 3: Git Hook (No Dependencies)

Create `.git/hooks/pre-commit` manually:

```bash
#!/bin/sh
# Digital Archaeology pre-commit hook

cd "$(git rev-parse --show-toplevel)/digital-archaeology-web"

# Quick type check (faster than full tests)
echo "Running type check..."
npm run typecheck || exit 1

# Verify test count (slower, can be skipped with --no-verify)
echo "Verifying test count..."
./scripts/verify-test-count.sh || exit 1

echo "Pre-commit checks passed!"
exit 0
```

Make it executable:

```bash
chmod +x .git/hooks/pre-commit
```

## Skipping Hooks

For emergency commits, use:

```bash
git commit --no-verify -m "message"
```

**Note:** Use sparingly. Test count drops should be fixed, not bypassed.

## CI Integration

The CI workflow (`.github/workflows/ci.yml`) also verifies test count. Even if local hooks are skipped, CI will catch test count drops.

## Test Count Threshold

The current threshold is **1000 tests**. This was the count at the end of Epic 4.

To update the threshold:
1. Edit `scripts/verify-test-count.sh`
2. Change the `THRESHOLD` variable
3. Update CI workflow if separate threshold is maintained

## Troubleshooting

### "Could not determine test count"

The regex expects Vitest output format: `1011 passed`. If Vitest output format changes, update the grep pattern in `verify-test-count.sh`.

### Hook runs slow

The full test suite takes ~8 seconds. Options:
1. Run only critical tests in hook, full suite in CI
2. Use `--no-verify` for WIP commits, ensure CI catches issues
3. Run type check only in hook (much faster)

### Hook doesn't run

Check hook is executable:

```bash
ls -la .git/hooks/pre-commit
# Should show: -rwxr-xr-x
```
