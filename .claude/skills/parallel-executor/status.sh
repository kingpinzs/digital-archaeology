#!/bin/bash
# Check status of parallel Claude agents
# Usage: status.sh [--json]

PIDS_FILE="../.parallel-pids"
LOGS_DIR="../logs"
SESSION_DIR="../.parallel-session"
SESSION_FILE="$SESSION_DIR/session.json"
# Note: JSON_OUTPUT is reserved for future structured output feature
_JSON_OUTPUT=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --json)
            _JSON_OUTPUT=true
            ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Get phase from session state or log
get_agent_phase() {
    local name=$1
    local logfile=$2
    local phase="--"

    # Try session state first
    local agent_file="$SESSION_DIR/agents/${name}.json"
    if [[ -f "$agent_file" ]] && command -v jq &> /dev/null; then
        phase=$(jq -r '.phase.current // "--"' "$agent_file")
    fi

    # Fall back to log parsing if phase unknown
    if [[ "$phase" == "--" ]] || [[ "$phase" == "null" ]]; then
        if [[ -f "$logfile" ]]; then
            if grep -q "ENTERING PHASE 4" "$logfile" 2>/dev/null; then
                phase="cleanup"
            elif grep -q "ENTERING PHASE 3" "$logfile" 2>/dev/null; then
                phase="verify"
            elif grep -q "ENTERING PHASE 2" "$logfile" 2>/dev/null; then
                phase="impl"
            elif grep -q "ENTERING PHASE 1" "$logfile" 2>/dev/null; then
                phase="ralph"
            fi
        fi
    fi

    # Shorten phase names for display
    case $phase in
        requirements|analysis|logic|plan|how) phase="ralph" ;;
        implementation) phase="impl" ;;
        verification) phase="verify" ;;
        simplification) phase="cleanup" ;;
    esac

    echo "$phase"
}

# Show session info if available
show_session_info() {
    if [[ -f "$SESSION_FILE" ]] && command -v jq &> /dev/null; then
        local session_id=$(jq -r '.session_id // "unknown"' "$SESSION_FILE")
        local status=$(jq -r '.status // "unknown"' "$SESSION_FILE")
        local created=$(jq -r '.created_at // ""' "$SESSION_FILE" | cut -d'T' -f1,2 | tr 'T' ' ')

        echo -e "Session: ${CYAN}$session_id${NC}"
        echo -e "Status:  $status | Started: $created"
        echo ""
    fi
}

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "                 PARALLEL AGENT STATUS"
echo "═══════════════════════════════════════════════════════════"
echo ""

show_session_info

if [[ ! -f "$PIDS_FILE" ]]; then
    # Check for resumable session
    if [[ -f "$SESSION_FILE" ]]; then
        status=$(jq -r '.status // "unknown"' "$SESSION_FILE" 2>/dev/null)
        if [[ "$status" == "interrupted" ]] || [[ "$status" == "failed" ]]; then
            echo -e "${YELLOW}Interrupted session found.${NC} Resume with: /cpt:resume"
            exit 0
        fi
    fi
    echo "No parallel agents running (no PID file found)"
    exit 0
fi

running=0
completed=0
failed=0
exceeded=0
skipped=0

printf "%-20s %-8s %-12s %-10s %s\n" "TASK" "PID" "STATUS" "PHASE" "LAST OUTPUT"
echo "─────────────────────────────────────────────────────────────────────"

while IFS=: read -r pid name; do
    logfile="${LOGS_DIR}/${name}.log"
    last_line=""
    agent_status=""

    # Get last meaningful line from log
    if [[ -f "$logfile" ]]; then
        last_line=$(tail -1 "$logfile" 2>/dev/null | cut -c1-25)
    fi

    # Get phase
    phase=$(get_agent_phase "$name" "$logfile")

    # Check agent state file for explicit status first
    agent_file="$SESSION_DIR/agents/${name}.json"
    if [[ -f "$agent_file" ]] && command -v jq &> /dev/null; then
        agent_status=$(jq -r '.status // ""' "$agent_file" 2>/dev/null)
    fi

    # Determine status (prefer agent state file, then fallback to PID/log checks)
    if [[ "$agent_status" == "exceeded_retries" ]]; then
        status="${RED}EXCEEDED${NC}"
        phase_color="${RED}$phase${NC}"
        ((exceeded++))
        ((failed++))
    elif [[ "$agent_status" == "skipped" ]]; then
        status="${CYAN}SKIPPED${NC}"
        phase_color="${CYAN}$phase${NC}"
        ((skipped++))
        ((completed++))
    elif kill -0 "$pid" 2>/dev/null; then
        status="${YELLOW}RUNNING${NC}"
        phase_color="${CYAN}$phase${NC}"
        ((running++))
    elif [[ "$agent_status" == "completed" ]] || grep -q "TASK_COMPLETE" "$logfile" 2>/dev/null; then
        status="${GREEN}COMPLETE${NC}"
        phase_color="${GREEN}done${NC}"
        ((completed++))
    elif [[ "$agent_status" == "failed" ]] || grep -qi "error\|failed\|exception" "$logfile" 2>/dev/null; then
        status="${RED}FAILED${NC}"
        phase_color="${RED}$phase${NC}"
        ((failed++))
    elif [[ "$agent_status" == "interrupted" ]]; then
        status="${YELLOW}STOPPED${NC}"
        phase_color="${YELLOW}$phase${NC}"
        ((failed++))
    else
        status="${BLUE}STOPPED${NC}"
        phase_color="$phase"
        ((completed++))
    fi

    printf "%-20s %-8s " "$name" "$pid"
    printf "${status}  "
    printf "%-10b " "$phase_color"
    printf "%s\n" "$last_line"

done < "$PIDS_FILE"

echo ""
echo "─────────────────────────────────────────────────────────────"
summary="${GREEN}$completed complete${NC} | ${YELLOW}$running running${NC} | ${RED}$failed failed${NC}"
[[ $exceeded -gt 0 ]] && summary="$summary | ${RED}$exceeded exceeded${NC}"
[[ $skipped -gt 0 ]] && summary="$summary | ${CYAN}$skipped skipped${NC}"
echo -e "Summary: $summary"
echo ""

if [[ $running -gt 0 ]]; then
    echo "Still running. Check again with: $(basename $0)"
    echo "Or wait with: wait \$(cut -d: -f1 $PIDS_FILE)"
elif [[ $failed -gt 0 ]]; then
    echo "Some tasks failed. Check logs in $LOGS_DIR/"
else
    echo "All tasks complete! Run merge.sh to merge to main."
fi
echo ""
