---
description: Create a worktree and spawn a parallel Claude session
arguments:
  - name: name
    description: Worktree name (e.g., auth-feature)
    required: true
  - name: prompt
    description: Task prompt for the spawned session
    required: false
---

Create a new git worktree and spawn a headless Claude session.

## Steps

1. **Validate** we're in a git repository
2. **Create** the worktree:
   ```bash
   git worktree add "../$(basename $(pwd))-$1" -b "feature/$1" main
   ```
3. **Check** for package.json and note if npm install needed
4. **Generate** the spawn command:
   ```bash
   WORKTREE="../$(basename $(pwd))-$1"
   PROMPT="${2:-Implement the feature as described in the project docs}"

   (cd "$WORKTREE" && npm install 2>/dev/null; claude -p "$PROMPT" --dangerously-skip-permissions > "../logs/$1.log" 2>&1) &
   echo "Spawned in $WORKTREE (PID: $!)"
   ```

## Output

Report:
- Worktree path created
- Branch name
- PID of spawned process
- Command to monitor: `tail -f ../logs/$1.log`
- Command to check status: `ps aux | grep $!`

## Important

- Do NOT cd into the worktree in this session
- User should open new terminal if they want interactive access
- Log file captures all output for review
