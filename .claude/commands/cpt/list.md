---
description: List all worktrees with their status
---

Show all git worktrees with branch, path, and uncommitted changes status.

## Steps

1. **Get worktrees:**
   ```bash
   git worktree list
   ```

2. **For each worktree**, check status:
   ```bash
   for wt in $(git worktree list --porcelain | grep "^worktree" | cut -d' ' -f2); do
     branch=$(git -C "$wt" branch --show-current 2>/dev/null || echo "detached")
     changes=$(git -C "$wt" status --porcelain 2>/dev/null | wc -l)
     if [ "$changes" -gt 0 ]; then
       status="$changes uncommitted"
     else
       status="clean"
     fi
     echo "$wt | $branch | $status"
   done
   ```

3. **Check for running Claude processes:**
   ```bash
   ps aux | grep "claude -p" | grep -v grep
   ```

4. **Check log files:**
   ```bash
   for log in ../logs/*.log 2>/dev/null; do
     if [ -f "$log" ]; then
       name=$(basename "$log" .log)
       if grep -q "error\|Error\|ERROR" "$log"; then
         echo "$name: ERROR detected"
       elif grep -q "completed\|success\|done" "$log"; then
         echo "$name: COMPLETED"
       else
         echo "$name: IN PROGRESS"
       fi
     fi
   done
   ```

## Output Format

| Worktree | Branch | Files | Agent Status |
|----------|--------|-------|--------------|
| ../project-auth | feature/auth | clean | RUNNING |
| ../project-api | feature/api | 3 uncommitted | COMPLETED |
| main | main | clean | - |
