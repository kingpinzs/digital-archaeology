#!/bin/bash
# Resume interrupted parallel session
# Usage: resume.sh [--check-only]
# Options:
#   --check-only    Only check for resumable sessions, don't resume

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SESSION_DIR="../.parallel-session"
SESSION_FILE="$SESSION_DIR/session.json"
LOGS_DIR="../logs"
PIDS_FILE="../.parallel-pids"
CHECK_ONLY=false
MAX_TURNS=100

# Source file locking utilities
source "$SCRIPT_DIR/filelock.sh" 2>/dev/null || true
USE_FLOCK=$(check_flock 2>/dev/null && echo "true" || echo "false")

# Parse arguments
for arg in "$@"; do
    case $arg in
        --check-only)
            CHECK_ONLY=true
            ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[resume]${NC} $1"; }
warn() { echo -e "${YELLOW}[resume]${NC} $1"; }
error() { echo -e "${RED}[resume]${NC} $1"; exit 1; }
info() { echo -e "${BLUE}[resume]${NC} $1"; }

# Check if session exists
if [[ ! -f "$SESSION_FILE" ]]; then
    if $CHECK_ONLY; then
        echo '{"resumable": false, "reason": "No session file found"}'
        exit 0
    else
        log "No interrupted session found."
        exit 0
    fi
fi

# Check for jq
if ! command -v jq &> /dev/null; then
    error "jq is required for resume functionality. Install with: apt install jq"
fi

# Read session state
SESSION_STATUS=$(jq -r '.status' "$SESSION_FILE")
SESSION_ID=$(jq -r '.session_id' "$SESSION_FILE")
# Note: _TOTAL_AGENTS is reserved for future progress reporting
_TOTAL_AGENTS=$(jq -r '.total_agents' "$SESSION_FILE")
MAX_TURNS=$(jq -r '.max_turns // 100' "$SESSION_FILE")

# Check if session needs resuming
if [[ "$SESSION_STATUS" == "completed" ]]; then
    if $CHECK_ONLY; then
        echo '{"resumable": false, "reason": "Session already completed"}'
        exit 0
    else
        log "Session $SESSION_ID already completed. Nothing to resume."
        exit 0
    fi
fi

# Collect resumable agents
declare -a RESUMABLE_AGENTS=()
declare -a AGENT_DETAILS=()

# Track agents that exceeded max resume attempts
declare -a EXCEEDED_AGENTS=()

for agent_file in "$SESSION_DIR/agents/"*.json; do
    [[ -f "$agent_file" ]] || continue

    name=$(jq -r '.name' "$agent_file")
    status=$(jq -r '.status' "$agent_file")
    task=$(jq -r '.task' "$agent_file")
    scope=$(jq -r '.scope' "$agent_file")
    worktree=$(jq -r '.worktree' "$agent_file")
    branch=$(jq -r '.branch' "$agent_file")
    phase=$(jq -r '.phase.current' "$agent_file")
    pid=$(jq -r '.pid' "$agent_file")
    resume_prompt=$(jq -r '.recovery_point.resume_prompt' "$agent_file")
    resume_count=$(jq -r '.resume_count // 0' "$agent_file")
    max_resume=$(jq -r '.max_resume_attempts // 3' "$agent_file")

    # Check if agent needs resuming
    needs_resume=false
    reason=""

    case $status in
        "running")
            # Check if PID is still alive
            if ! kill -0 "$pid" 2>/dev/null; then
                needs_resume=true
                reason="Process died (was at phase: $phase)"
            fi
            ;;
        "interrupted")
            needs_resume=true
            reason="Session interrupted (was at phase: $phase)"
            ;;
        "failed")
            needs_resume=true
            reason="Agent failed (was at phase: $phase)"
            ;;
        "completed")
            # Already done, skip
            ;;
        *)
            needs_resume=true
            reason="Unknown status: $status"
            ;;
    esac

    if $needs_resume; then
        # Check if exceeded max resume attempts
        if [[ $resume_count -ge $max_resume ]]; then
            EXCEEDED_AGENTS+=("$name|$resume_count|$max_resume|$phase")
            # Mark agent as failed due to exceeded attempts (with optional locking)
            if [[ "$USE_FLOCK" == "true" ]]; then
                atomic_jq_update "$agent_file" \
                    --arg status "exceeded_retries" \
                    --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
                    '.status = $status | .updated_at = $updated'
            else
                temp_file=$(mktemp)
                jq --arg status "exceeded_retries" \
                   --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
                   '.status = $status | .updated_at = $updated' \
                   "$agent_file" > "$temp_file" && mv "$temp_file" "$agent_file"
            fi
        else
            RESUMABLE_AGENTS+=("$name")
            AGENT_DETAILS+=("$name|$task|$scope|$worktree|$branch|$phase|$resume_prompt|$reason|$resume_count")
        fi
    fi
done

# Report exceeded agents
if [[ ${#EXCEEDED_AGENTS[@]} -gt 0 ]]; then
    echo ""
    warn "═══════════════════════════════════════════════════════════"
    warn "    AGENTS EXCEEDED MAXIMUM RESUME ATTEMPTS"
    warn "═══════════════════════════════════════════════════════════"
    for exceeded in "${EXCEEDED_AGENTS[@]}"; do
        IFS='|' read -r exc_name exc_count exc_max exc_phase <<< "$exceeded"
        echo -e "  ${RED}✗${NC} $exc_name: $exc_count/$exc_max attempts (last phase: $exc_phase)"
    done
    echo ""
    warn "These agents have been marked as 'exceeded_retries' and will not be resumed."
    warn "To retry, manually reset resume_count in the agent state file or delete and respawn."
    echo ""
fi

# Report findings
if [[ ${#RESUMABLE_AGENTS[@]} -eq 0 ]]; then
    if $CHECK_ONLY; then
        exceeded_count=${#EXCEEDED_AGENTS[@]}
        if [[ $exceeded_count -gt 0 ]]; then
            echo "{\"resumable\": false, \"reason\": \"$exceeded_count agent(s) exceeded max resume attempts\", \"exceeded_count\": $exceeded_count}"
        else
            echo '{"resumable": false, "reason": "No agents need resuming"}'
        fi
        exit 0
    else
        log "No agents available to resume."

        # Check if any are still running
        running=0
        for agent_file in "$SESSION_DIR/agents/"*.json; do
            [[ -f "$agent_file" ]] || continue
            status=$(jq -r '.status' "$agent_file")
            pid=$(jq -r '.pid' "$agent_file")
            if [[ "$status" == "running" ]] && kill -0 "$pid" 2>/dev/null; then
                ((running++))
            fi
        done

        if [[ $running -gt 0 ]]; then
            log "$running agent(s) still running. Use orchestrate.sh to monitor."
        fi
        exit 0
    fi
fi

# Check-only mode: return JSON
if $CHECK_ONLY; then
    agents_json="["
    first=true
    for detail in "${AGENT_DETAILS[@]}"; do
        IFS='|' read -r name task scope worktree branch phase resume_prompt reason <<< "$detail"
        $first || agents_json+=","
        first=false
        agents_json+="{\"name\":\"$name\",\"task\":\"$task\",\"phase\":\"$phase\",\"resume_prompt\":\"$resume_prompt\",\"reason\":\"$reason\"}"
    done
    agents_json+="]"
    echo "{\"resumable\": true, \"session_id\": \"$SESSION_ID\", \"agents\": $agents_json}"
    exit 0
fi

# Resume mode: restart agents
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "               RESUMING PARALLEL SESSION"
echo "═══════════════════════════════════════════════════════════"
echo ""
log "Session: $SESSION_ID"
log "Found ${#RESUMABLE_AGENTS[@]} agent(s) to resume"
echo ""

# Clear old PID file and rebuild
: > "$PIDS_FILE"

for detail in "${AGENT_DETAILS[@]}"; do
    IFS='|' read -r name task scope worktree branch phase resume_prompt reason resume_count <<< "$detail"
    new_resume_count=$((resume_count + 1))

    echo "─────────────────────────────────────────────────────────────"
    info "Resuming: $name (attempt $new_resume_count)"
    echo "  Task: $task"
    echo "  Phase: $phase"
    echo "  Reason: $reason"
    echo ""

    # Check if worktree still exists
    if [[ ! -d "$worktree" ]]; then
        warn "Worktree missing: $worktree - recreating..."
        git worktree add "$worktree" -b "$branch" main 2>/dev/null || \
            git worktree add "$worktree" "$branch" 2>/dev/null || \
            warn "Could not recreate worktree"
    fi

    # Check for uncommitted changes
    if [[ -d "$worktree" ]]; then
        pushd "$worktree" > /dev/null
        if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
            warn "Uncommitted changes found - stashing..."
            git stash push -m "Resume stash $(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
        fi
        popd > /dev/null
    fi

    # Build resume prompt with context
    ORIGINAL_PROMPT=$(cat "$SCRIPT_DIR/agent-prompt.md" | sed "s|{{TASK}}|$task|g" | sed "s|{{SCOPE}}|$scope|g")

    RESUME_CONTEXT="
## RESUMING FROM INTERRUPTED SESSION

You are resuming a previously interrupted task. Here is your context:

**Original Task:** $task
**Previous Phase:** $phase
**Resume Point:** $resume_prompt

**Important:**
- Check git log to see what was already committed
- Review any existing code changes before continuing
- Don't repeat work that's already done
- Continue from where the previous agent left off

---

"
    FULL_PROMPT="${RESUME_CONTEXT}${ORIGINAL_PROMPT}"

    # Create runner script
    logfile="${LOGS_DIR}/${name}.log"
    runner_script="${LOGS_DIR}/${name}-runner.sh"

    cat > "$runner_script" << RUNNER_EOF
#!/bin/bash
cd "$worktree"

# Show resume context
echo "=== RESUMING AGENT: $name ===" >> "$logfile"
echo "Previous phase: $phase" >> "$logfile"
echo "Resume time: $(date)" >> "$logfile"
echo "" >> "$logfile"

# Install dependencies if needed
[[ -f "package.json" ]] && npm install --silent 2>/dev/null || true
[[ -f "requirements.txt" ]] && pip install -q -r requirements.txt 2>/dev/null || true

# Run Claude headless
claude -p '$FULL_PROMPT' \\
    --dangerously-skip-permissions \\
    --max-turns $MAX_TURNS \\
    >> "$logfile" 2>&1

echo "TASK_COMPLETE: $name" >> "$logfile"
RUNNER_EOF
    chmod +x "$runner_script"

    # Spawn agent
    nohup bash "$runner_script" > /dev/null 2>&1 &
    pid=$!
    disown $pid

    echo "$pid:$name" >> "$PIDS_FILE"

    # Update agent state with incremented resume count (with optional locking)
    agent_file="$SESSION_DIR/agents/${name}.json"
    if [[ -f "$agent_file" ]]; then
        if [[ "$USE_FLOCK" == "true" ]]; then
            atomic_jq_update "$agent_file" \
                --argjson pid "$pid" \
                --arg status "running" \
                --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
                --argjson resume_count "$new_resume_count" \
                '.pid = $pid | .status = $status | .updated_at = $updated | .resume_count = $resume_count'
        else
            temp_file=$(mktemp)
            jq --argjson pid "$pid" \
               --arg status "running" \
               --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
               --argjson resume_count "$new_resume_count" \
               '.pid = $pid | .status = $status | .updated_at = $updated | .resume_count = $resume_count' \
               "$agent_file" > "$temp_file" && mv "$temp_file" "$agent_file"
        fi
    fi

    log "Spawned: $name (PID: $pid)"
    echo ""
done

# Update session status (with optional locking)
if [[ "$USE_FLOCK" == "true" ]]; then
    atomic_jq_update "$SESSION_FILE" \
        --arg status "running" \
        --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        '.status = $status | .updated_at = $updated'
else
    temp_file=$(mktemp)
    jq --arg status "running" \
       --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
       '.status = $status | .updated_at = $updated' \
       "$SESSION_FILE" > "$temp_file" && mv "$temp_file" "$SESSION_FILE"
fi

echo "═══════════════════════════════════════════════════════════"
log "All ${#RESUMABLE_AGENTS[@]} agents resumed!"
echo ""

# Start orchestrator
log "Starting orchestrator..."
exec "$SCRIPT_DIR/orchestrate.sh" --auto-merge
