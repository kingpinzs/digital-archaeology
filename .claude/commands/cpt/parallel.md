---
description: Spawn multiple parallel Claude sessions from a task list
arguments:
  - name: tasks
    description: Comma-separated task descriptions OR path to tasks file
    required: true
---

Create multiple worktrees and spawn parallel Claude sessions for each task.

**After spawning, the orchestrator automatically starts and monitors all agents until completion, then auto-merges results.**

## Input Parsing

**Option 1: Comma-separated tasks**
```
/cpt:parallel "add auth, create api, build ui"
```

**Option 2: Tasks file**
```
/cpt:parallel tasks.md
```

Tasks file format:
```markdown
- [ ] Add authentication [P]
- [ ] Create API endpoints [P]
- [ ] Build dashboard UI [P]
- [ ] Integration tests [depends: 1,2,3]
```

## Execution

Run the spawn script which handles everything automatically:

```bash
.claude/skills/parallel-executor/spawn.sh "task1" "task2" "task3"
```

Or with a tasks file:
```bash
.claude/skills/parallel-executor/spawn.sh --file tasks.md
```

## What Happens Automatically

1. **Worktrees created** - One git worktree per task
2. **Agents spawned** - Headless Claude runs in each worktree
3. **Orchestrator starts** - Monitors all agents in real-time
4. **Progress shown** - `[14:32:15] 2/5 complete 3 running`
5. **Auto-merge** - When all complete, merges to main and cleans up

## Output During Execution

```
═══════════════════════════════════════════════════════════
               PARALLEL AGENT ORCHESTRATOR
═══════════════════════════════════════════════════════════

[spawn] Monitoring 3 parallel agents...

[14:32:15] 1/3 complete 2 running
[14:33:45] 2/3 complete 1 running
[14:35:00] 3/3 complete 0 running

═══════════════════════════════════════════════════════════
[orchestrate] All agents finished in 5m 23s

✓ All 3 agents completed successfully!

Completed worktrees:
  ✓ add-auth
  ✓ create-api
  ✓ build-ui

[orchestrate] Auto-merge enabled. Starting merge...
...
[merge] All merges complete!
[merge] Cleanup complete
```

## Manual Control (Optional)

If you don't want auto-orchestration:
```bash
# Spawn without orchestrator
.claude/skills/parallel-executor/spawn.sh --no-orchestrate "task1" "task2"

# Spawn with orchestrator but no auto-merge
.claude/skills/parallel-executor/spawn.sh --no-auto-merge "task1" "task2"
```

## Limits

- Maximum 10 parallel tasks
- Sequential tasks (with dependencies) are queued, not spawned
- Each agent gets ~200k token context
