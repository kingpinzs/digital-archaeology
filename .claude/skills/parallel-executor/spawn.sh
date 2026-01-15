#!/bin/bash
# Parallel Claude Code Spawner
# Usage: spawn.sh "task1" "task2" "task3"
# Or:    spawn.sh --file tasks.md
# Or:    spawn.sh --scoped "task1|scope1" "task2|scope2"
# Options:
#   --no-orchestrate    Don't auto-start orchestrator
#   --no-auto-merge     Start orchestrator but don't auto-merge
#   --max-turns=N       Max turns per agent (default: 100)
#   --scoped            Tasks include scope (format: "task|scope")

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT=$(basename "$(pwd)")
LOGS_DIR="../logs"
PIDS_FILE="../.parallel-pids"
SCOPES_FILE="../.parallel-scopes"
SESSION_DIR="../.parallel-session"
PLAN_FILE=".claude/parallel-plan.json"
MAX_PARALLEL=10
MAX_TURNS=100
AUTO_ORCHESTRATE=true
AUTO_MERGE=true
SCOPED_MODE=false
SESSION_ID="sess_$(date +%Y%m%d_%H%M%S)_$(head -c 4 /dev/urandom | xxd -p)"
FROM_PLAN=false
PLAN_GOAL=""

# Source plan management functions
source "$SCRIPT_DIR/plan.sh" 2>/dev/null || true

# Check if ralph-wiggum plugin is available (reserved for future enhanced agent prompts)
_RALPH_AVAILABLE=false
if claude plugin list 2>/dev/null | grep -q "ralph-wiggum"; then
    _RALPH_AVAILABLE=true
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[spawn]${NC} $1"; }
warn() { echo -e "${YELLOW}[spawn]${NC} $1"; }
error() { echo -e "${RED}[spawn]${NC} $1"; exit 1; }

# Validate that two scopes don't overlap
# Returns 0 if no overlap, 1 if overlap detected
validate_scope_overlap() {
    local scope1="$1"
    local scope2="$2"

    # Both unrestricted = definite conflict
    [[ "$scope1" == "*" && "$scope2" == "*" ]] && return 1

    # One unrestricted, one restricted = user accepts potential overlap risk
    [[ "$scope1" == "*" || "$scope2" == "*" ]] && return 0

    # Normalize paths (remove trailing slashes)
    scope1="${scope1%/}"
    scope2="${scope2%/}"

    # Check for exact match
    [[ "$scope1" == "$scope2" ]] && return 1

    # Check if one scope is a parent of another
    [[ "$scope1" == "$scope2"/* ]] && return 1
    [[ "$scope2" == "$scope1"/* ]] && return 1

    return 0
}

# Validate all scopes in TASKS array before spawning
# Called after TASKS array is populated but before spawning
validate_all_scopes() {
    local scopes=()
    local names=()

    # Extract scopes from TASKS
    for task_entry in "${TASKS[@]}"; do
        if [[ "$task_entry" == *"|"* ]]; then
            local scope="${task_entry#*|}"
            local task="${task_entry%%|*}"
            local name=$(echo "$task" | tr ' ' '-' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]//g' | cut -c1-25)
            scopes+=("$scope")
            names+=("$name")
        fi
    done

    # Check all pairs for overlap
    local count=${#scopes[@]}
    for ((i=0; i<count; i++)); do
        for ((j=i+1; j<count; j++)); do
            if ! validate_scope_overlap "${scopes[$i]}" "${scopes[$j]}"; then
                error "Scope overlap detected: '${names[$i]}' (${scopes[$i]}) conflicts with '${names[$j]}' (${scopes[$j]}). Parallel agents cannot share scopes."
            fi
        done
    done

    return 0
}

# Initialize session state
init_session() {
    local task_count=$1
    local main_worktree=$(pwd)

    mkdir -p "$SESSION_DIR/agents"

    cat > "$SESSION_DIR/session.json" << EOF
{
  "version": "1.0",
  "session_id": "$SESSION_ID",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "updated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "status": "running",
  "main_worktree": "$main_worktree",
  "auto_merge": $AUTO_MERGE,
  "max_turns": $MAX_TURNS,
  "total_agents": $task_count,
  "agents": []
}
EOF
    log "Session initialized: $SESSION_ID"
}

# Create agent state file
create_agent_state() {
    local name=$1
    local task=$2
    local scope=$3
    local worktree=$4
    local branch=$5
    local pid=$6
    local plan_task_id=${7:-""}  # Optional: ID in persistent plan

    cat > "$SESSION_DIR/agents/${name}.json" << EOF
{
  "name": "$name",
  "session_id": "$SESSION_ID",
  "task": "$task",
  "scope": "$scope",
  "worktree": "$worktree",
  "branch": "$branch",
  "plan_task_id": "$plan_task_id",
  "status": "running",
  "pid": $pid,
  "started_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "updated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "completed_at": null,
  "resume_count": 0,
  "max_resume_attempts": 3,
  "phase": {
    "current": "requirements",
    "completed": []
  },
  "commits": [],
  "files_modified": [],
  "recovery_point": {
    "phase": "requirements",
    "resume_prompt": "Continue with Phase 1.1 - restate the task in your own words."
  }
}
EOF
}

# Update session.json with agent info
add_agent_to_session() {
    local name=$1
    local task=$2
    local scope=$3
    local worktree=$4
    local pid=$5

    # Use temp file for atomic update
    local temp_file=$(mktemp)

    # Add agent to the agents array using jq if available, else sed
    if command -v jq &> /dev/null; then
        jq --arg name "$name" \
           --arg task "$task" \
           --arg scope "$scope" \
           --arg worktree "$worktree" \
           --argjson pid "$pid" \
           '.agents += [{"name": $name, "task": $task, "scope": $scope, "worktree": $worktree, "pid": $pid, "status": "running"}] | .updated_at = now | .updated_at = (now | strftime("%Y-%m-%dT%H:%M:%SZ"))' \
           "$SESSION_DIR/session.json" > "$temp_file"
        mv "$temp_file" "$SESSION_DIR/session.json"
    fi
}

# Check for Claude CLI
if ! command -v claude &> /dev/null; then
    error "Claude Code CLI not found. Install it first: https://docs.anthropic.com/en/docs/claude-code"
fi

# Parse arguments
TASKS=()
POSITIONAL=()
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-orchestrate)
            AUTO_ORCHESTRATE=false
            shift
            ;;
        --no-auto-merge)
            AUTO_MERGE=false
            shift
            ;;
        --max-turns=*)
            MAX_TURNS="${1#*=}"
            shift
            ;;
        --scoped)
            SCOPED_MODE=true
            shift
            ;;
        --from-plan)
            FROM_PLAN=true
            shift
            ;;
        --goal=*)
            PLAN_GOAL="${1#*=}"
            shift
            ;;
        --file)
            [[ -f "$2" ]] || error "File not found: $2"
            # Extract tasks marked with [P] or (P)
            # Format: "- [ ] Task description [P] → scope: src/dir/"
            while IFS= read -r line; do
                if [[ "$line" =~ \[P\]|\(P\) ]]; then
                    # Extract scope if present (after "→ scope:" or "scope:")
                    scope=""
                    if [[ "$line" =~ →[[:space:]]*scope:[[:space:]]*([^[:space:]]+) ]]; then
                        scope="${BASH_REMATCH[1]}"
                        SCOPED_MODE=true
                    elif [[ "$line" =~ scope:[[:space:]]*([^[:space:]]+) ]]; then
                        scope="${BASH_REMATCH[1]}"
                        SCOPED_MODE=true
                    fi
                    # Clean up the task description (remove [P], scope info)
                    task=$(echo "$line" | sed 's/^[^a-zA-Z]*//' | sed 's/\[P\]//' | sed 's/(P)//' | sed 's/→.*$//' | sed 's/scope:[^[:space:]]*//' | xargs)
                    if [[ -n "$task" ]]; then
                        if [[ -n "$scope" ]]; then
                            TASKS+=("$task|$scope")
                        else
                            TASKS+=("$task")
                        fi
                    fi
                fi
            done < "$2"
            shift 2
            ;;
        *)
            POSITIONAL+=("$1")
            shift
            ;;
    esac
done

# Add positional args as tasks
TASKS+=("${POSITIONAL[@]}")

# Declare associative array for task-to-plan-id mapping (must be before use)
declare -A TASK_TO_PLAN_ID

# Handle --from-plan mode: load tasks from existing plan
if $FROM_PLAN; then
    if [[ ! -f "$PLAN_FILE" ]]; then
        error "No plan exists. Create one first with /cpt:plan or provide tasks directly."
    fi

    log "Loading tasks from plan..."
    ready_tasks=$(plan_get_ready_tasks)
    task_count=$(echo "$ready_tasks" | jq 'length')

    if [[ "$task_count" -eq 0 ]]; then
        log "No ready tasks in plan. Either all are complete or dependencies are unmet."
        plan_status
        exit 0
    fi

    # Convert ready tasks to our format
    TASKS=()
    while IFS= read -r task_json; do
        id=$(echo "$task_json" | jq -r '.id')
        desc=$(echo "$task_json" | jq -r '.description // .id')
        scope=$(echo "$task_json" | jq -r '.scope // "*"')
        if [[ "$scope" != "*" ]] && [[ -n "$scope" ]]; then
            TASKS+=("$desc|$scope")
            SCOPED_MODE=true
        else
            TASKS+=("$desc")
        fi
        # Store mapping of task description to plan ID
        TASK_TO_PLAN_ID["$desc"]="$id"
    done < <(echo "$ready_tasks" | jq -c '.[]')
fi

# Validate
[[ ${#TASKS[@]} -eq 0 ]] && error "No tasks provided"
[[ ${#TASKS[@]} -gt $MAX_PARALLEL ]] && error "Too many tasks (max $MAX_PARALLEL)"

# Validate scopes don't overlap (prevents merge conflicts)
if $SCOPED_MODE; then
    validate_all_scopes
fi

# Create/update plan if goal is provided
if [[ -n "$PLAN_GOAL" ]] && [[ ! -f "$PLAN_FILE" ]]; then
    log "Creating persistent plan: $PLAN_GOAL"
    plan_init "$PLAN_GOAL"
fi

# Setup
mkdir -p "$LOGS_DIR"
: > "$PIDS_FILE"
: > "$SCOPES_FILE"

# Initialize session state for crash recovery
init_session ${#TASKS[@]}

log "Spawning ${#TASKS[@]} parallel agents..."
if $SCOPED_MODE; then
    log "File scope enforcement: ENABLED"
fi
echo ""

# Spawn each task
for task_entry in "${TASKS[@]}"; do
    # Parse task and scope (format: "task|scope" or just "task")
    if [[ "$task_entry" == *"|"* ]]; then
        task="${task_entry%%|*}"
        scope="${task_entry#*|}"
    else
        task="$task_entry"
        scope="*"  # No restriction
    fi

    # Generate safe name with unique suffix to prevent collisions
    base_name=$(echo "$task" | tr ' ' '-' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]//g' | cut -c1-20)
    unique_suffix=$(head -c 4 /dev/urandom | xxd -p)
    name="${base_name}-${unique_suffix}"
    worktree="../${PROJECT}-${name}"
    branch="feature/${name}"
    logfile="${LOGS_DIR}/${name}.log"

    log "Creating worktree: $worktree"
    if [[ "$scope" != "*" ]]; then
        log "  Scope: $scope"
    fi

    # Record scope for conflict detection
    echo "$name:$scope" >> "$SCOPES_FILE"

    # Create worktree
    if ! git worktree add "$worktree" -b "$branch" main 2>/dev/null; then
        warn "Worktree exists, reusing: $worktree"
    fi

    # Build prompt from template with task and scope
    PROMPT=$(cat "$SCRIPT_DIR/agent-prompt.md" | sed "s|{{TASK}}|$task|g" | sed "s|{{SCOPE}}|$scope|g")

    # Escape single quotes in PROMPT for safe embedding in single-quoted string
    # Pattern: replace ' with '\'' (end quote, escaped quote, start quote)
    ESCAPED_PROMPT="${PROMPT//\'/\'\\\'\'}"

    # Create a runner script for this agent (ensures proper detachment)
    runner_script="${LOGS_DIR}/${name}-runner.sh"
    cat > "$runner_script" << RUNNER_EOF
#!/bin/bash
cd "$worktree"

# Install dependencies if needed
[[ -f "package.json" ]] && npm install --silent 2>/dev/null || true
[[ -f "requirements.txt" ]] && pip install -q -r requirements.txt 2>/dev/null || true

# Run Claude headless with structured methodology
claude -p '$ESCAPED_PROMPT' \\
    --dangerously-skip-permissions \\
    --max-turns $MAX_TURNS \\
    > "$logfile" 2>&1

echo "TASK_COMPLETE: $name" >> "$logfile"
RUNNER_EOF
    chmod +x "$runner_script"

    # Spawn fully detached using nohup + disown
    nohup bash "$runner_script" > /dev/null 2>&1 &
    pid=$!
    disown $pid

    echo "$pid:$name" >> "$PIDS_FILE"

    # Get plan task ID (from --from-plan mapping or generate from name)
    plan_task_id="${TASK_TO_PLAN_ID[$task]:-$name}"

    # Create agent state for crash recovery (includes plan_task_id for reliable merging)
    create_agent_state "$name" "$task" "$scope" "$worktree" "$branch" "$pid" "$plan_task_id"
    add_agent_to_session "$name" "$task" "$scope" "$worktree" "$pid"

    # Update persistent plan if exists
    if [[ -f "$PLAN_FILE" ]]; then

        # Check if task exists in plan
        existing=$(jq -r --arg id "$plan_task_id" '.tasks[] | select(.id == $id) | .id' "$PLAN_FILE" 2>/dev/null)

        if [[ -z "$existing" ]]; then
            # Add task to plan if not present
            plan_add_task "$plan_task_id" "$task" "$scope"
        fi

        # Mark task as in_progress in plan
        plan_set_task_status "$plan_task_id" "in_progress" "$branch" "$worktree"
    fi

    log "  Spawned: $name (PID: $pid)"
done

echo ""
log "All ${#TASKS[@]} agents spawned!"
echo ""

# Auto-start orchestrator
if $AUTO_ORCHESTRATE; then
    echo "═══════════════════════════════════════════════════════════"
    log "Starting orchestrator (auto-merge: $AUTO_MERGE)..."
    echo ""

    if $AUTO_MERGE; then
        # Run orchestrator with auto-merge
        exec "$SCRIPT_DIR/orchestrate.sh" --auto-merge
    else
        # Run orchestrator without auto-merge
        exec "$SCRIPT_DIR/orchestrate.sh"
    fi
else
    echo "Monitor commands:"
    echo "  tail -f $LOGS_DIR/*.log              # Watch all logs"
    echo "  $SCRIPT_DIR/status.sh                # Check completion"
    echo "  $SCRIPT_DIR/orchestrate.sh           # Start orchestrator"
    echo ""
    echo "When complete:"
    echo "  $SCRIPT_DIR/merge.sh                 # Merge all to main"
fi
