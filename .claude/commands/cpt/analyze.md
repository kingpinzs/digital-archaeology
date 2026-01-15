---
description: Analyze codebase structure without taking action
---

# /cpt:analyze - Read-Only Codebase Analysis

When the user runs `/cpt:analyze`, perform a comprehensive analysis of the project without taking any action. This is useful for understanding the codebase before deciding what to work on.

## Analysis Steps

### 1. Load Project State

Check if `.claude/.project-state` exists from install:
```bash
if [[ -f ".claude/.project-state" ]]; then
  source .claude/.project-state
fi
```

### 2. Discover Modules

Find all top-level source directories:
- Glob: `src/*/`, `lib/*/`, `app/*/`, `packages/*/`
- Count files in each
- Identify purpose from directory name and contents

### 3. Check GitHub (if available)

If `gh` CLI is available:
```bash
# Open issues
gh issue list --state open --limit 10

# Open PRs
gh pr list --state open --limit 5
```

### 4. Find Code Notes

Search for:
- `TODO:` or `TODO(`
- `FIXME:` or `FIXME(`
- `HACK:` or `XXX:`

### 5. Estimate Test Coverage

- Find test directories: `tests/`, `test/`, `__tests__/`, `spec/`
- Count test files vs source files
- Look for coverage reports: `coverage/`, `.nyc_output/`, `htmlcov/`

## Output Format

```
═══════════════════════════════════════════════════════════════
                    Codebase Analysis
═══════════════════════════════════════════════════════════════

Project: <name from package.json/pyproject.toml/go.mod>
Type: <nodejs/python/go/rust/java/unknown>
Git: <branch name> (<clean/X uncommitted changes>)

Modules
────────────────────────────────────────
  src/auth/        Authentication         12 files
  src/api/         API endpoints          23 files
  src/ui/          Frontend components    45 files
  src/db/          Database layer          8 files
  src/utils/       Shared utilities       15 files

GitHub Issues (5 open)
────────────────────────────────────────
  #42  Add OAuth support              [enhancement]
  #38  Fix login timeout bug          [bug]
  #35  Improve test coverage          [testing]
  #33  Add dark mode                  [enhancement]
  #28  Refactor API responses         [refactor]

GitHub PRs (2 open)
────────────────────────────────────────
  #41  feat: add password reset       (3 days old)
  #39  fix: session expiry            (5 days old)

Code Notes
────────────────────────────────────────
  TODOs:    12 found
  FIXMEs:    3 found
  HACKs:     1 found

Testing
────────────────────────────────────────
  Test files:     34
  Source files:   103
  Ratio:          33%
  Coverage report: coverage/lcov-report/index.html

═══════════════════════════════════════════════════════════════

Run /init to set up for development, or describe what you'd like to work on.
```

## Step 6: Check for Existing Plan

After the analysis, check if a persistent plan already exists:

```bash
if [[ -f ".claude/parallel-plan.json" ]]; then
    # Show existing plan status
    .claude/skills/parallel-executor/plan.sh status
fi
```

## Step 7: Offer Plan Creation

If parallelizable work is detected (2+ independent issues/TODOs), offer to create a plan:

```
────────────────────────────────────────
Detected Parallelizable Work
────────────────────────────────────────
Found 4 independent items that could run in parallel:
  - Issue #42: Add OAuth support         → src/auth/
  - Issue #33: Add dark mode             → src/ui/theme/
  - TODO: Implement caching              → src/cache/
  - Issue #35: Improve test coverage     → tests/

Would you like to create a persistent plan from these items? (y/n)

If yes, I'll create .claude/parallel-plan.json to track progress.
You can then run /cpt:continue to spawn agents.
```

**On confirmation:** Create the plan:
```bash
source .claude/skills/parallel-executor/plan.sh
plan_init "Work from codebase analysis"
plan_add_task "oauth" "Issue #42: Add OAuth support" "src/auth/"
plan_add_task "dark-mode" "Issue #33: Add dark mode" "src/ui/theme/"
plan_add_task "caching" "Implement caching (TODO)" "src/cache/"
plan_add_task "test-coverage" "Issue #35: Improve test coverage" "tests/"
```

Then show: "Plan created! Run `/cpt:continue` to spawn agents or `/cpt:plan-status` to view."

## Notes

- Analysis is READ-ONLY - plan creation requires user confirmation
- Use this to understand a project before running /cpt:quick
- GitHub data requires the `gh` CLI to be installed and authenticated
- If no GitHub remote, the GitHub sections are skipped
- Plan creation adds `.claude/parallel-plan.json` (tracked in git)
