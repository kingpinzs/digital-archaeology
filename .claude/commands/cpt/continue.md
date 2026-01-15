---
description: Continue working on the persistent project plan
arguments:
  - name: max
    description: Maximum number of tasks to spawn (default: all ready)
    required: false
---

Continue working on an existing project plan by spawning agents for tasks that are ready to start (pending with dependencies met).

## How It Works

1. **Load Existing Plan:**
   - Reads `.claude/parallel-plan.json`
   - Identifies tasks with status `pending`
   - Filters to those with all dependencies `merged`

2. **Spawn Agents:**
   - Creates worktree for each ready task
   - Launches Claude agent with task context
   - Updates plan status to `in_progress`

3. **Monitor Progress:**
   - Auto-starts orchestrator to monitor
   - On completion, prompts for merge

## Prerequisites

- An existing plan (created via `/cpt:quick` or manual setup)
- At least one task with status `pending`
- All dependencies for the task must be `merged`

## Usage

```bash
# Continue all ready tasks
/cpt:continue

# Limit to 2 tasks
/cpt:continue 2

# Or use the spawn script directly
.claude/skills/parallel-executor/spawn.sh --from-plan
```

## Workflow Example

### Day 1: Create plan and start first batch

```bash
# Create plan with goal
/cpt:quick "Build e-commerce checkout"

# Claude identifies 5 tasks, 3 are independent (no deps)
# → Spawns 3 agents: cart, products, users

# Agents complete, you merge
/cpt:done
```

### Day 2: Continue on another machine

```bash
git pull  # Get latest with plan + merged code

# Claude auto-detects plan on startup
# Shows: "Active plan detected: Build e-commerce checkout"
#        "2 tasks merged, 2 pending"

# Continue with remaining tasks
/cpt:continue

# → Spawns agents for: payments, checkout
# (These depended on cart/products which are now merged)
```

### Day 3: Final task

```bash
git pull

/cpt:continue

# → Spawns agent for: integration-tests
# (Depended on all previous tasks)

/cpt:done  # Merge final work
# Plan marked as "completed"
```

## Task Dependencies

Tasks are only spawned when their dependencies are met:

```json
{
  "tasks": [
    {"id": "auth", "status": "merged", "depends_on": []},
    {"id": "profile", "status": "pending", "depends_on": ["auth"]},
    {"id": "settings", "status": "pending", "depends_on": ["auth", "profile"]}
  ]
}
```

In this example:
- `auth` is merged ✓
- `profile` can start (depends on auth which is merged)
- `settings` cannot start (depends on profile which is pending)

Running `/cpt:continue` would spawn only `profile`.

## Plan State Persistence

The plan state is committed to git:

```
project/
└── .claude/
    └── parallel-plan.json   # ← Committed to git
```

This enables:
- **Cross-machine continuity** - Pull and continue
- **Team visibility** - Everyone sees progress
- **History** - Track what was merged and when

## Related Commands

- `/cpt:plan-status` - View current plan status
- `/cpt:quick` - Create new plan with goal
- `/cpt:list` - Show active worktrees/agents
- `/cpt:done` - Merge completed work
