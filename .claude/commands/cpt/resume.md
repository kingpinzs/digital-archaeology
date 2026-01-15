---
description: Resume an interrupted parallel session
arguments:
  - name: check
    description: Only check for resumable sessions without resuming
    required: false
---

Resume a previously interrupted parallel session. Automatically detects agents that need resuming and restarts them from their last checkpoint.

## How It Works

1. **Session Detection:**
   - Checks for `.parallel-session/session.json`
   - Identifies agents with status: interrupted, failed, or crashed

2. **Recovery Points:**
   - Uses git commits as checkpoints
   - Reads agent phase from state files
   - Generates context-aware resume prompts

3. **Auto-Resume:**
   - Recreates worktrees if missing
   - Stashes uncommitted changes
   - Spawns new Claude agents with resume context
   - Starts orchestrator to monitor completion

## Check Mode

To check without resuming:

```bash
# In the main worktree
cd ../main

# Check if there's a resumable session
.claude/skills/parallel-executor/resume.sh --check-only
```

Returns JSON with resumable session details.

## Resume Steps

Execute the resume script:

```bash
# From main worktree
.claude/skills/parallel-executor/resume.sh
```

The script will:

1. **Scan session state** - Find interrupted/failed agents
2. **Show recovery plan** - Display what will be resumed
3. **Restart agents** - Spawn with resume context
4. **Monitor completion** - Start orchestrator

## What Gets Preserved

- **Git commits** - All previous work that was committed
- **Phase progress** - Where each agent was in the RALPH methodology
- **Task context** - Original task, scope restrictions
- **Log history** - Appended to existing logs

## When to Use

- Terminal was closed while agents were running
- System crashed or rebooted
- Agent hit an error and stopped
- Session was interrupted (Ctrl+C)

## Limitations

- Uncommitted changes are stashed (not lost, but need manual recovery)
- Agents restart from phase, not exact line of code
- API/network issues may require manual intervention

## Manual Recovery

If auto-resume fails:

1. Check session state:
   ```bash
   cat ../.parallel-session/session.json | jq
   ```

2. Check individual agent:
   ```bash
   cat ../.parallel-session/agents/<name>.json | jq
   ```

3. View logs:
   ```bash
   tail -100 ../logs/<name>.log
   ```

4. Manual cleanup:
   ```bash
   rm -rf ../.parallel-session
   ```
