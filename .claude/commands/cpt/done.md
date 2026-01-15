---
description: Merge current or specified worktree to main and cleanup
arguments:
  - name: name
    description: Worktree name to merge (default: current directory)
    required: false
---

Complete work in a worktree: commit changes, merge to main, cleanup.

## Pre-flight Checks

1. **Determine worktree:**
   - If argument provided, use that
   - Otherwise, use current directory if it's a worktree
   - Error if in main

2. **Check uncommitted changes:**
   ```bash
   git status --porcelain
   ```
   If changes exist, ask user for commit message

3. **Verify branch exists:**
   ```bash
   git branch --show-current
   ```

## Merge Steps

1. **Commit any changes** (if user approved):
   ```bash
   git add -A
   git commit -m "$USER_MESSAGE"
   ```

2. **Switch to main:**
   ```bash
   cd ../main
   git pull origin main
   ```

3. **Merge the feature branch:**
   ```bash
   BRANCH=$(git -C "../$WORKTREE" branch --show-current)
   git merge "$BRANCH" --no-edit
   ```

4. **Handle conflicts:**
   - If conflicts, report them and STOP
   - User must resolve manually
   - Provide: `git merge --abort` to cancel

5. **On success, cleanup:**
   ```bash
   cd ..
   git worktree remove "$WORKTREE"
   git branch -d "$BRANCH"
   rm -f "logs/$(basename $WORKTREE).log"
   ```

## Output

Report:
- Commits merged (count)
- Files changed
- Worktree removed
- Branch deleted
- Current location (should be main)

## Safety

- Never force merge
- Never delete unmerged branches
- Always report conflicts clearly
- Keep log file until user confirms cleanup
