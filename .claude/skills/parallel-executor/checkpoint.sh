#!/bin/bash
# Checkpoint helper - record progress for crash recovery
# Usage: checkpoint.sh <agent-name> <phase> [message]
# Called by orchestrator or can be invoked manually

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAME="$1"
PHASE="$2"
# Note: MESSAGE parameter is reserved for future use (e.g., custom resume prompts)
_MESSAGE="${3:-Checkpoint at $PHASE}"
SESSION_DIR="../.parallel-session"
AGENT_FILE="$SESSION_DIR/agents/${NAME}.json"

# Source file locking utilities
source "$SCRIPT_DIR/filelock.sh" 2>/dev/null || true
USE_FLOCK=$(check_flock 2>/dev/null && echo "true" || echo "false")

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [[ -z "$NAME" ]] || [[ -z "$PHASE" ]]; then
    echo "Usage: checkpoint.sh <agent-name> <phase> [message]"
    echo "Phases: requirements, analysis, logic, plan, how, implementation, verification, simplification"
    exit 1
fi

if [[ ! -f "$AGENT_FILE" ]]; then
    echo -e "${YELLOW}[checkpoint]${NC} Agent state file not found: $AGENT_FILE"
    exit 1
fi

# Get current git commit if in a git repo
COMMIT="none"
if git rev-parse HEAD 2>/dev/null; then
    COMMIT=$(git rev-parse --short HEAD)
fi

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Update agent state file using jq
if command -v jq &> /dev/null; then
    temp_file=$(mktemp)

    # Map phase name to completed phases
    declare -A PHASE_ORDER=(
        ["requirements"]=0
        ["analysis"]=1
        ["logic"]=2
        ["plan"]=3
        ["how"]=4
        ["implementation"]=5
        ["verification"]=6
        ["simplification"]=7
    )

    # Build completed phases array based on current phase
    completed_json="[]"
    current_idx=${PHASE_ORDER[$PHASE]:-0}
    for p in requirements analysis logic plan how implementation verification; do
        if [[ ${PHASE_ORDER[$p]} -lt $current_idx ]]; then
            completed_json=$(echo "$completed_json" | jq --arg p "$p" '. += [$p]')
        fi
    done

    # Generate resume prompt based on phase
    case $PHASE in
        requirements) resume="Continue with Phase 1.1 - restate the task." ;;
        analysis) resume="Continue with Phase 1.2 - analyze existing code." ;;
        logic) resume="Continue with Phase 1.3 - design solution approach." ;;
        plan) resume="Continue with Phase 1.4 - create implementation steps." ;;
        how) resume="Continue with Phase 1.5 - list files to modify." ;;
        implementation) resume="Continue with Phase 2 - implement with TDD." ;;
        verification) resume="Continue with Phase 3 - verify against requirements." ;;
        simplification) resume="Continue with Phase 4 - final cleanup." ;;
        *) resume="Continue from phase: $PHASE" ;;
    esac

    if [[ "$USE_FLOCK" == "true" ]]; then
        atomic_jq_update "$AGENT_FILE" \
            --arg phase "$PHASE" \
            --arg updated "$TIMESTAMP" \
            --arg commit "$COMMIT" \
            --arg resume "$resume" \
            --argjson completed "$completed_json" \
            '.phase.current = $phase |
             .phase.completed = $completed |
             .updated_at = $updated |
             .recovery_point.phase = $phase |
             .recovery_point.resume_prompt = $resume |
             .recovery_point.git_ref = $commit'
    else
        jq --arg phase "$PHASE" \
           --arg updated "$TIMESTAMP" \
           --arg commit "$COMMIT" \
           --arg resume "$resume" \
           --argjson completed "$completed_json" \
           '.phase.current = $phase |
            .phase.completed = $completed |
            .updated_at = $updated |
            .recovery_point.phase = $phase |
            .recovery_point.resume_prompt = $resume |
            .recovery_point.git_ref = $commit' \
           "$AGENT_FILE" > "$temp_file"

        if jq -e . "$temp_file" > /dev/null 2>&1; then
            mv "$temp_file" "$AGENT_FILE"
        else
            rm -f "$temp_file"
            echo -e "${YELLOW}[checkpoint]${NC} JSON validation failed"
            exit 1
        fi
    fi

    echo -e "${GREEN}[checkpoint]${NC} $NAME @ $PHASE (commit: $COMMIT)"
else
    echo -e "${YELLOW}[checkpoint]${NC} jq not available - checkpoint skipped"
fi
