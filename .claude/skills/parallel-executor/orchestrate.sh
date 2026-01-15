#!/bin/bash
# Orchestrator: Monitor parallel agents and merge when all complete
# Usage: orchestrate.sh [--auto-merge] [--poll-interval=30]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDS_FILE="../.parallel-pids"
LOGS_DIR="../logs"
SESSION_DIR="../.parallel-session"
SESSION_FILE="$SESSION_DIR/session.json"
AUTO_MERGE=false
POLL_INTERVAL=30

# Source file locking utilities
source "$SCRIPT_DIR/filelock.sh" 2>/dev/null || true
USE_FLOCK=$(check_flock 2>/dev/null && echo "true" || echo "false")

# Parse arguments
for arg in "$@"; do
    case $arg in
        --auto-merge)
            AUTO_MERGE=true
            ;;
        --poll-interval=*)
            POLL_INTERVAL="${arg#*=}"
            ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[orchestrate]${NC} $1"; }
warn() { echo -e "${YELLOW}[orchestrate]${NC} $1"; }
error() { echo -e "${RED}[orchestrate]${NC} $1"; }

# Update session status (with optional file locking)
update_session_status() {
    local status=$1
    if [[ -f "$SESSION_FILE" ]] && command -v jq &> /dev/null; then
        if [[ "$USE_FLOCK" == "true" ]]; then
            atomic_jq_update "$SESSION_FILE" \
                --arg status "$status" \
                --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
                '.status = $status | .updated_at = $updated'
        else
            local temp_file=$(mktemp)
            jq --arg status "$status" \
               --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
               '.status = $status | .updated_at = $updated' \
               "$SESSION_FILE" > "$temp_file" && mv "$temp_file" "$SESSION_FILE"
        fi
    fi
}

# Update individual agent status (with optional file locking)
update_agent_status() {
    local name=$1
    local status=$2
    local agent_file="$SESSION_DIR/agents/${name}.json"

    if [[ -f "$agent_file" ]] && command -v jq &> /dev/null; then
        local completed_at="null"
        [[ "$status" == "completed" || "$status" == "failed" ]] && completed_at="\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\""

        if [[ "$USE_FLOCK" == "true" ]]; then
            atomic_jq_update "$agent_file" \
                --arg status "$status" \
                --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
                --argjson completed "$completed_at" \
                '.status = $status | .updated_at = $updated | .completed_at = $completed'
        else
            local temp_file=$(mktemp)
            jq --arg status "$status" \
               --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
               --argjson completed "$completed_at" \
               '.status = $status | .updated_at = $updated | .completed_at = $completed' \
               "$agent_file" > "$temp_file" && mv "$temp_file" "$agent_file"
        fi
    fi
}

# Detect agent phase from log file
detect_agent_phase() {
    local logfile=$1
    local phase="unknown"

    if [[ -f "$logfile" ]]; then
        # Look for phase markers in reverse order (most recent first)
        if grep -q "ENTERING PHASE 4" "$logfile" 2>/dev/null; then
            phase="simplification"
        elif grep -q "ENTERING PHASE 3" "$logfile" 2>/dev/null; then
            phase="verification"
        elif grep -q "ENTERING PHASE 2" "$logfile" 2>/dev/null; then
            phase="implementation"
        elif grep -q "ENTERING PHASE 1.5" "$logfile" 2>/dev/null; then
            phase="how"
        elif grep -q "ENTERING PHASE 1.4" "$logfile" 2>/dev/null; then
            phase="plan"
        elif grep -q "ENTERING PHASE 1.3" "$logfile" 2>/dev/null; then
            phase="logic"
        elif grep -q "ENTERING PHASE 1.2" "$logfile" 2>/dev/null; then
            phase="analysis"
        elif grep -q "ENTERING PHASE 1.1" "$logfile" 2>/dev/null; then
            phase="requirements"
        fi
    fi
    echo "$phase"
}

# Update agent phase in state file and invoke checkpoint if phase changed
update_agent_phase() {
    local name=$1
    local new_phase=$2
    local agent_file="$SESSION_DIR/agents/${name}.json"

    if [[ -f "$agent_file" ]] && command -v jq &> /dev/null && [[ "$new_phase" != "unknown" ]]; then
        # Get previous phase to detect change (with optional locking)
        local prev_phase
        if [[ "$USE_FLOCK" == "true" ]]; then
            prev_phase=$(atomic_jq_read "$agent_file" -r '.phase.current // "unknown"' 2>/dev/null)
        else
            prev_phase=$(jq -r '.phase.current // "unknown"' "$agent_file" 2>/dev/null)
        fi

        # Update state file (with optional locking)
        if [[ "$USE_FLOCK" == "true" ]]; then
            atomic_jq_update "$agent_file" \
                --arg phase "$new_phase" \
                --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
                '.phase.current = $phase | .updated_at = $updated | .recovery_point.phase = $phase'
        else
            local temp_file=$(mktemp)
            jq --arg phase "$new_phase" \
               --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
               '.phase.current = $phase | .updated_at = $updated | .recovery_point.phase = $phase' \
               "$agent_file" > "$temp_file" && mv "$temp_file" "$agent_file"
        fi

        # If phase changed, invoke checkpoint.sh to update recovery context
        if [[ "$prev_phase" != "$new_phase" ]] && [[ "$prev_phase" != "unknown" ]]; then
            log "Phase change detected for $name: $prev_phase → $new_phase"
            # Call checkpoint.sh to update recovery_point with proper resume prompt
            "$SCRIPT_DIR/checkpoint.sh" "$name" "$new_phase" 2>/dev/null || true
        fi
    fi
}

# Handle interrupt - mark session as interrupted for resume
handle_interrupt() {
    echo ""
    warn "Interrupt received - marking session for resume..."
    update_session_status "interrupted"

    # Update any running agents as interrupted
    while IFS=: read -r pid name; do
        if kill -0 "$pid" 2>/dev/null; then
            update_agent_status "$name" "interrupted"
        fi
    done < "$PIDS_FILE"

    log "Session state saved. Resume with: /cpt:resume"
    exit 130
}

# Set up interrupt handler
trap handle_interrupt SIGINT SIGTERM

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "               PARALLEL AGENT ORCHESTRATOR"
echo "═══════════════════════════════════════════════════════════"
echo ""
log "Auto-merge: $AUTO_MERGE"
log "Poll interval: ${POLL_INTERVAL}s"
echo ""

if [[ ! -f "$PIDS_FILE" ]]; then
    error "No parallel agents found (no PID file at $PIDS_FILE)"
    exit 1
fi

# Count total agents
TOTAL=$(wc -l < "$PIDS_FILE")
log "Monitoring $TOTAL parallel agents..."
echo ""

# Function to check agent status and update state files
check_status() {
    local running=0
    local completed=0
    local failed=0

    while IFS=: read -r pid name; do
        logfile="${LOGS_DIR}/${name}.log"

        if kill -0 "$pid" 2>/dev/null; then
            ((running++))
            # Update phase for running agents
            phase=$(detect_agent_phase "$logfile")
            update_agent_phase "$name" "$phase"
        elif [[ -f "$logfile" ]] && grep -qi "error\|failed\|exception\|panic" "$logfile" 2>/dev/null; then
            ((failed++))
            update_agent_status "$name" "failed"
        else
            ((completed++))
            update_agent_status "$name" "completed"
        fi
    done < "$PIDS_FILE"

    echo "$running:$completed:$failed"
}

# Function to show progress
show_progress() {
    local running=$1
    local completed=$2
    local failed=$3
    local timestamp=$(date '+%H:%M:%S')

    printf "\r[%s] " "$timestamp"
    printf "${GREEN}%d/%d complete${NC} " "$completed" "$TOTAL"
    printf "${YELLOW}%d running${NC} " "$running"
    if [[ $failed -gt 0 ]]; then
        printf "${RED}%d failed${NC}" "$failed"
    fi
}

# Monitor loop
start_time=$(date +%s)
while true; do
    IFS=: read -r running completed failed <<< "$(check_status)"

    show_progress "$running" "$completed" "$failed"

    # Check if all done
    if [[ $running -eq 0 ]]; then
        echo ""
        echo ""

        elapsed=$(($(date +%s) - start_time))
        minutes=$((elapsed / 60))
        seconds=$((elapsed % 60))

        echo "═══════════════════════════════════════════════════════════"
        log "All agents finished in ${minutes}m ${seconds}s"
        echo ""

        if [[ $failed -gt 0 ]]; then
            update_session_status "failed"
            error "$failed agent(s) failed. Check logs:"
            echo ""
            while IFS=: read -r pid name; do
                logfile="${LOGS_DIR}/${name}.log"
                if [[ -f "$logfile" ]] && grep -qi "error\|failed\|exception\|panic" "$logfile" 2>/dev/null; then
                    echo "  ${RED}✗${NC} $name: $logfile"
                    # Show last error line
                    grep -i "error\|failed\|exception\|panic" "$logfile" 2>/dev/null | tail -1 | sed 's/^/    /'
                fi
            done < "$PIDS_FILE"
            echo ""
            echo "Fix issues and re-run, or proceed with successful agents."
            exit 1
        fi

        echo "${GREEN}✓${NC} All $completed agents completed successfully!"
        update_session_status "completed"
        echo ""

        # Show what was completed
        echo "Completed worktrees:"
        while IFS=: read -r pid name; do
            echo "  ${GREEN}✓${NC} $name"
        done < "$PIDS_FILE"
        echo ""

        if $AUTO_MERGE; then
            log "Auto-merge enabled. Starting merge..."
            echo ""
            "$SCRIPT_DIR/merge.sh" --cleanup

            # Auto-cleanup session on successful merge
            if [[ $? -eq 0 ]] && [[ -d "$SESSION_DIR" ]]; then
                log "Cleaning up session state (auto-cleanup on success)..."
                rm -rf "$SESSION_DIR"
            fi
        else
            echo "Next steps:"
            echo "  1. Review changes: git -C ../<worktree> log -1"
            echo "  2. Run tests: cd ../<worktree> && npm test"
            echo "  3. Merge all: $SCRIPT_DIR/merge.sh"
            echo "  4. Or merge with cleanup: $SCRIPT_DIR/merge.sh --cleanup"
            echo ""
            echo "Or use /cpt:done to merge interactively."
        fi

        exit 0
    fi

    sleep "$POLL_INTERVAL"
done
