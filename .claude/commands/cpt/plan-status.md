---
description: Show status of the persistent project plan
arguments: []
---

Display the current status of the persistent project plan, showing which tasks are completed, in progress, or pending.

## What It Shows

1. **Plan Overview:**
   - Plan ID and creation date
   - Overall goal
   - Current status (planning, in_progress, completed)

2. **Task Breakdown:**
   - Each task with its status (pending, in_progress, merged, failed)
   - Branch names for active/merged tasks
   - Dependencies between tasks

3. **Progress Summary:**
   - Count of merged, active, pending, and failed tasks
   - Which tasks are ready to start (dependencies met)

## Usage

Run the status script:

```bash
# From main worktree
.claude/skills/parallel-executor/plan.sh status
```

Or use the command:

```
/cpt:plan-status
```

## Status Values

| Status | Description |
|--------|-------------|
| `pending` | Task not yet started |
| `in_progress` | Agent currently working on task |
| `merged` | Task completed and merged to main |
| `failed` | Task encountered an error |

## Cross-Session Persistence

The plan is stored in `.claude/parallel-plan.json` which is committed to git. This means:

- **Pull on another machine** → See same plan status
- **New Claude session** → Automatically detects existing plan
- **Team collaboration** → Everyone sees the same progress

## Next Steps

After viewing status:

- **If tasks are pending:** Run `/cpt:continue` to spawn agents for ready tasks
- **If tasks are in_progress:** Monitor with `/cpt:list` or `status.sh`
- **If all tasks merged:** Plan is complete!

## Example Output

```
═══════════════════════════════════════════════════════════
                    PLAN STATUS
═══════════════════════════════════════════════════════════

Plan ID:  plan_20260114_abc123
Goal:     Build authentication system
Status:   in_progress
Created:  2026-01-14

─────────────────────────────────────────────────────────────
TASK                      STATUS       BRANCH          DEPENDS ON
─────────────────────────────────────────────────────────────
oauth-client              merged       feature/oauth   none
password-reset            active       feature/reset   oauth-client
two-factor-auth           pending      -               oauth-client
session-management        pending      -               none

─────────────────────────────────────────────────────────────
Summary: 1 merged | 1 active | 2 pending | 0 failed
Progress: 1 / 4 tasks complete

1 task(s) ready to start (dependencies met)
Run /cpt:continue to spawn agents for ready tasks
```
