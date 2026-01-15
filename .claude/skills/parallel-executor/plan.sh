#!/bin/bash
# Persistent Plan Management for Cross-Session Continuity
# This manifest is stored IN git for cross-machine persistence
#
# Usage:
#   source plan.sh
#   plan_init "Build authentication system" "oauth,password-reset,2fa"
#   plan_add_task "oauth" "Implement OAuth 2.0 client" "src/auth/"
#   plan_set_task_status "oauth" "in_progress" "feature/oauth"
#   plan_get_pending_tasks
#   plan_status

set -e

# Note: _SCRIPT_DIR reserved for future use when sourcing relative scripts
_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLAN_FILE=".claude/parallel-plan.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check for jq
_check_jq() {
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}[plan]${NC} jq is required. Install with: apt install jq" >&2
        return 1
    fi
}

# Check for circular dependencies using depth-first search
# Args: $1=task_id to check, $2=path (space-separated visited nodes)
# Returns: 0 if no cycle, 1 if cycle detected
_has_cycle_from() {
    local task_id="$1"
    local path="$2"

    # Check if task_id is already in path (cycle detected)
    for node in $path; do
        if [[ "$node" == "$task_id" ]]; then
            return 1  # Cycle found
        fi
    done

    # Get dependencies for this task
    local deps=$(jq -r --arg id "$task_id" '.tasks[] | select(.id == $id) | .depends_on[]? // empty' "$PLAN_FILE" 2>/dev/null)

    # Recurse into dependencies
    for dep in $deps; do
        if ! _has_cycle_from "$dep" "$path $task_id"; then
            return 1  # Cycle found in subtree
        fi
    done

    return 0  # No cycle
}

# Check all tasks for circular dependencies
# Returns: 0 if no cycles, 1 if cycles detected (with error message)
_check_circular_dependencies() {
    _check_jq || return 1

    if [[ ! -f "$PLAN_FILE" ]]; then
        return 0  # No plan, no cycles
    fi

    # Get all task IDs
    local task_ids=$(jq -r '.tasks[].id' "$PLAN_FILE" 2>/dev/null)

    for task_id in $task_ids; do
        if ! _has_cycle_from "$task_id" ""; then
            # Build cycle path for error message
            local deps=$(jq -r --arg id "$task_id" '.tasks[] | select(.id == $id) | .depends_on | join(" -> ")' "$PLAN_FILE")
            echo -e "${RED}[plan]${NC} Circular dependency detected involving task '$task_id'" >&2
            echo -e "${RED}[plan]${NC} Dependencies: $task_id -> $deps" >&2
            return 1
        fi
    done

    return 0
}

# Validate that adding a dependency won't create a cycle
# Args: $1=task_id, $2=new_dependency
# Returns: 0 if safe, 1 if would create cycle
_would_create_cycle() {
    local task_id="$1"
    local new_dep="$2"

    # Check if the new dependency (or any of its ancestors) depends on task_id
    # This would create a cycle: task_id -> new_dep -> ... -> task_id
    _check_jq || return 1

    if [[ ! -f "$PLAN_FILE" ]]; then
        return 0
    fi

    # Use BFS to check if new_dep can reach task_id through its dependencies
    local queue="$new_dep"
    local visited=""

    while [[ -n "$queue" ]]; do
        # Pop first item from queue
        local current="${queue%% *}"
        if [[ "$queue" == *" "* ]]; then
            queue="${queue#* }"
        else
            queue=""
        fi

        # Skip if already visited
        if [[ " $visited " == *" $current "* ]]; then
            continue
        fi
        visited="$visited $current"

        # Check if we reached task_id (cycle!)
        if [[ "$current" == "$task_id" ]]; then
            return 1  # Would create cycle
        fi

        # Add dependencies of current to queue
        local deps=$(jq -r --arg id "$current" '.tasks[] | select(.id == $id) | .depends_on[]? // empty' "$PLAN_FILE" 2>/dev/null)
        for dep in $deps; do
            queue="$queue $dep"
        done
    done

    return 0  # Safe to add
}

# Generate unique plan ID
_generate_plan_id() {
    echo "plan_$(date +%Y%m%d_%H%M%S)_$(head -c 4 /dev/urandom | xxd -p)"
}

# Initialize a new plan
# Args: $1=goal, $2=comma-separated task IDs (optional)
plan_init() {
    _check_jq || return 1

    local goal="$1"
    local task_ids="$2"
    local plan_id=$(_generate_plan_id)
    local created_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Create .claude directory if needed
    mkdir -p "$(dirname "$PLAN_FILE")"

    # Check if plan already exists
    if [[ -f "$PLAN_FILE" ]]; then
        local existing_status=$(jq -r '.status' "$PLAN_FILE" 2>/dev/null)
        if [[ "$existing_status" == "in_progress" ]]; then
            echo -e "${YELLOW}[plan]${NC} Active plan already exists. Use plan_status to view or plan_archive to archive." >&2
            return 1
        fi
    fi

    # Create initial plan structure
    cat > "$PLAN_FILE" << EOF
{
  "version": "1.0",
  "plan_id": "$plan_id",
  "goal": "$goal",
  "status": "planning",
  "created_at": "$created_at",
  "updated_at": "$created_at",
  "tasks": [],
  "history": []
}
EOF

    # Add initial tasks if provided
    if [[ -n "$task_ids" ]]; then
        IFS=',' read -ra ids <<< "$task_ids"
        for id in "${ids[@]}"; do
            id=$(echo "$id" | xargs)  # trim whitespace
            plan_add_task "$id" "" ""
        done
    fi

    echo -e "${GREEN}[plan]${NC} Created plan: $plan_id"
    echo -e "${GREEN}[plan]${NC} Goal: $goal"
}

# Add a task to the plan
# Args: $1=task_id, $2=description, $3=scope (files/directories), $4=depends_on (comma-separated)
plan_add_task() {
    _check_jq || return 1

    local task_id="$1"
    local description="${2:-}"
    local scope="${3:-}"
    local depends_on="${4:-}"

    if [[ ! -f "$PLAN_FILE" ]]; then
        echo -e "${RED}[plan]${NC} No plan exists. Run plan_init first." >&2
        return 1
    fi

    # Check if task already exists
    local existing=$(jq -r --arg id "$task_id" '.tasks[] | select(.id == $id) | .id' "$PLAN_FILE")
    if [[ -n "$existing" ]]; then
        echo -e "${YELLOW}[plan]${NC} Task '$task_id' already exists." >&2
        return 1
    fi

    local created_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Build depends_on array and validate each dependency
    local deps_json="[]"
    if [[ -n "$depends_on" ]]; then
        # Validate dependencies exist and won't create cycles
        IFS=',' read -ra dep_array <<< "$depends_on"
        for dep in "${dep_array[@]}"; do
            dep=$(echo "$dep" | xargs)  # trim whitespace
            # Check if dependency exists
            local dep_exists=$(jq -r --arg id "$dep" '.tasks[] | select(.id == $id) | .id' "$PLAN_FILE" 2>/dev/null)
            if [[ -z "$dep_exists" ]]; then
                echo -e "${YELLOW}[plan]${NC} Warning: Dependency '$dep' does not exist yet." >&2
            fi
        done
        deps_json=$(echo "$depends_on" | tr ',' '\n' | xargs -I{} echo '"{}"' | jq -s '.')
    fi

    # Add task to plan
    local temp_file=$(mktemp)
    jq --arg id "$task_id" \
       --arg desc "$description" \
       --arg scope "$scope" \
       --argjson deps "$deps_json" \
       --arg created "$created_at" \
       '.tasks += [{
         "id": $id,
         "description": $desc,
         "scope": $scope,
         "status": "pending",
         "depends_on": $deps,
         "branch": null,
         "worktree": null,
         "created_at": $created,
         "started_at": null,
         "merged_at": null,
         "commits": []
       }] | .updated_at = $created' \
       "$PLAN_FILE" > "$temp_file"

    if jq -e . "$temp_file" > /dev/null 2>&1; then
        mv "$temp_file" "$PLAN_FILE"
    else
        echo -e "${RED}[plan]${NC} JSON validation failed when adding task" >&2
        rm -f "$temp_file"
        return 1
    fi

    # Verify no circular dependencies were introduced
    if ! _check_circular_dependencies; then
        echo -e "${RED}[plan]${NC} Removing task '$task_id' due to circular dependency." >&2
        # Remove the task we just added
        local rollback_file=$(mktemp)
        jq --arg id "$task_id" 'del(.tasks[] | select(.id == $id))' "$PLAN_FILE" > "$rollback_file"
        if jq -e . "$rollback_file" > /dev/null 2>&1; then
            mv "$rollback_file" "$PLAN_FILE"
        else
            rm -f "$rollback_file"
        fi
        return 1
    fi

    echo -e "${GREEN}[plan]${NC} Added task: $task_id"
}

# Update task status
# Args: $1=task_id, $2=new_status (pending|in_progress|completed|merged|failed|skipped), $3=branch (optional)
plan_set_task_status() {
    _check_jq || return 1

    local task_id="$1"
    local new_status="$2"
    local branch="${3:-}"
    local worktree="${4:-}"

    if [[ ! -f "$PLAN_FILE" ]]; then
        echo -e "${RED}[plan]${NC} No plan exists." >&2
        return 1
    fi

    local updated_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local temp_file=$(mktemp)

    # Build update based on status
    case $new_status in
        "in_progress")
            jq --arg id "$task_id" \
               --arg new_status "$new_status" \
               --arg branch "$branch" \
               --arg worktree "$worktree" \
               --arg updated "$updated_at" \
               --arg started "$updated_at" \
               '(.tasks[] | select(.id == $id)) |= (
                 .status = $new_status |
                 .branch = $branch |
                 .worktree = $worktree |
                 .started_at = $started
               ) | .updated_at = $updated | .status = "in_progress"' \
               "$PLAN_FILE" > "$temp_file"

            if jq -e . "$temp_file" > /dev/null 2>&1; then
                mv "$temp_file" "$PLAN_FILE"
            else
                rm -f "$temp_file"
                return 1
            fi
            ;;
        "merged")
            jq --arg id "$task_id" \
               --arg new_status "$new_status" \
               --arg updated "$updated_at" \
               --arg merged "$updated_at" \
               '(.tasks[] | select(.id == $id)) |= (
                 .status = $new_status |
                 .merged_at = $merged |
                 .worktree = null
               ) | .updated_at = $updated' \
               "$PLAN_FILE" > "$temp_file"

            # Validate JSON before moving
            if jq -e . "$temp_file" > /dev/null 2>&1; then
                mv "$temp_file" "$PLAN_FILE"
            else
                echo -e "${RED}[plan]${NC} JSON validation failed, aborting update" >&2
                rm -f "$temp_file"
                return 1
            fi

            # Add to history
            _add_history_entry "$task_id" "merged"

            # Check if all tasks are complete
            _check_plan_completion
            ;;
        "failed")
            jq --arg id "$task_id" \
               --arg new_status "$new_status" \
               --arg updated "$updated_at" \
               '(.tasks[] | select(.id == $id)) |= (
                 .status = $new_status |
                 .failed_at = $updated
               ) | .updated_at = $updated' \
               "$PLAN_FILE" > "$temp_file"

            if jq -e . "$temp_file" > /dev/null 2>&1; then
                mv "$temp_file" "$PLAN_FILE"
            else
                rm -f "$temp_file"
                return 1
            fi

            _add_history_entry "$task_id" "failed"
            _check_plan_completion
            ;;
        "skipped")
            # Skipped allows dependent tasks to proceed (user acknowledges risk)
            jq --arg id "$task_id" \
               --arg new_status "$new_status" \
               --arg updated "$updated_at" \
               '(.tasks[] | select(.id == $id)) |= (
                 .status = $new_status |
                 .skipped_at = $updated |
                 .worktree = null
               ) | .updated_at = $updated' \
               "$PLAN_FILE" > "$temp_file"

            if jq -e . "$temp_file" > /dev/null 2>&1; then
                mv "$temp_file" "$PLAN_FILE"
            else
                rm -f "$temp_file"
                return 1
            fi

            _add_history_entry "$task_id" "skipped"
            _check_plan_completion
            ;;
        *)
            jq --arg id "$task_id" \
               --arg new_status "$new_status" \
               --arg updated "$updated_at" \
               '(.tasks[] | select(.id == $id)).status = $new_status | .updated_at = $updated' \
               "$PLAN_FILE" > "$temp_file"

            if jq -e . "$temp_file" > /dev/null 2>&1; then
                mv "$temp_file" "$PLAN_FILE"
            else
                rm -f "$temp_file"
                return 1
            fi
            ;;
    esac

    echo -e "${GREEN}[plan]${NC} Task '$task_id' status: $new_status"
}

# Add a commit to task history
# Args: $1=task_id, $2=commit_hash, $3=message
plan_add_commit() {
    _check_jq || return 1

    local task_id="$1"
    local commit_hash="$2"
    local message="$3"

    if [[ ! -f "$PLAN_FILE" ]]; then
        return 0  # Silently skip if no plan
    fi

    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local temp_file=$(mktemp)

    jq --arg id "$task_id" \
       --arg hash "$commit_hash" \
       --arg msg "$message" \
       --arg ts "$timestamp" \
       '(.tasks[] | select(.id == $id)).commits += [{
         "hash": $hash,
         "message": $msg,
         "timestamp": $ts
       }]' \
       "$PLAN_FILE" > "$temp_file"

    if jq -e . "$temp_file" > /dev/null 2>&1; then
        mv "$temp_file" "$PLAN_FILE"
    else
        rm -f "$temp_file"
        return 1
    fi
}

# Add history entry
_add_history_entry() {
    local task_id="$1"
    local action="$2"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local temp_file=$(mktemp)

    jq --arg id "$task_id" \
       --arg action "$action" \
       --arg ts "$timestamp" \
       '.history += [{
         "task_id": $id,
         "action": $action,
         "timestamp": $ts
       }]' \
       "$PLAN_FILE" > "$temp_file"

    if jq -e . "$temp_file" > /dev/null 2>&1; then
        mv "$temp_file" "$PLAN_FILE"
    else
        rm -f "$temp_file"
    fi
}

# Check if all tasks are complete (merged, failed, or skipped)
_check_plan_completion() {
    # Count tasks in each terminal and non-terminal state
    local merged=$(jq '[.tasks[] | select(.status == "merged")] | length' "$PLAN_FILE")
    local failed=$(jq '[.tasks[] | select(.status == "failed")] | length' "$PLAN_FILE")
    local skipped=$(jq '[.tasks[] | select(.status == "skipped")] | length' "$PLAN_FILE")
    local pending=$(jq '[.tasks[] | select(.status == "pending")] | length' "$PLAN_FILE")
    local in_progress=$(jq '[.tasks[] | select(.status == "in_progress")] | length' "$PLAN_FILE")

    # All tasks are in terminal state (merged/failed/skipped)?
    if [[ "$pending" -eq 0 && "$in_progress" -eq 0 ]]; then
        local temp_file=$(mktemp)
        local completed_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        local final_status="completed"

        # Determine completion status
        if [[ "$failed" -gt 0 && "$skipped" -gt 0 ]]; then
            final_status="completed_with_failures_and_skips"
        elif [[ "$failed" -gt 0 ]]; then
            final_status="completed_with_failures"
        elif [[ "$skipped" -gt 0 ]]; then
            final_status="completed_with_skips"
        fi

        jq --arg status "$final_status" \
           --arg completed "$completed_at" \
           --argjson merged "$merged" \
           --argjson failed "$failed" \
           --argjson skipped "$skipped" \
           '.status = $status | .completed_at = $completed | .completion_stats = {merged: $merged, failed: $failed, skipped: $skipped}' \
           "$PLAN_FILE" > "$temp_file"

        if jq -e . "$temp_file" > /dev/null 2>&1; then
            mv "$temp_file" "$PLAN_FILE"
        else
            rm -f "$temp_file"
            return 1
        fi

        if [[ "$failed" -gt 0 || "$skipped" -gt 0 ]]; then
            echo -e "${YELLOW}[plan]${NC} Plan completed: $merged merged, $failed failed, $skipped skipped"
        else
            echo -e "${GREEN}[plan]${NC} All tasks merged! Plan completed."
        fi
    fi
}

# Get pending tasks (returns JSON array)
plan_get_pending_tasks() {
    _check_jq || return 1

    if [[ ! -f "$PLAN_FILE" ]]; then
        echo "[]"
        return 0
    fi

    jq '[.tasks[] | select(.status == "pending")]' "$PLAN_FILE"
}

# Get tasks ready to start (pending with no unmet dependencies)
plan_get_ready_tasks() {
    _check_jq || return 1

    if [[ ! -f "$PLAN_FILE" ]]; then
        echo "[]"
        return 0
    fi

    # First, check for circular dependencies (deadlock detection)
    if ! _check_circular_dependencies 2>/dev/null; then
        echo -e "${RED}[plan]${NC} ERROR: Circular dependencies detected - plan is deadlocked!" >&2
        echo -e "${RED}[plan]${NC} Fix dependencies manually in $PLAN_FILE or use plan_archive to start fresh." >&2
        echo "[]"
        return 1
    fi

    # Get satisfied dependency IDs (merged or skipped - both allow dependents to proceed)
    local satisfied_ids=$(jq -r '[.tasks[] | select(.status == "merged" or .status == "skipped") | .id]' "$PLAN_FILE")

    # Get pending tasks where all dependencies are satisfied (merged or skipped)
    local ready_tasks=$(jq --argjson satisfied "$satisfied_ids" \
       '[.tasks[] | select(
         .status == "pending" and
         ((.depends_on | length) == 0 or (.depends_on | all(. as $dep | $satisfied | index($dep))))
       )]' "$PLAN_FILE")

    # Warn if there are pending tasks but none are ready (possible unresolvable deps)
    local pending_count=$(jq '[.tasks[] | select(.status == "pending")] | length' "$PLAN_FILE")
    local ready_count=$(echo "$ready_tasks" | jq 'length')
    local in_progress_count=$(jq '[.tasks[] | select(.status == "in_progress")] | length' "$PLAN_FILE")

    if [[ "$pending_count" -gt 0 && "$ready_count" -eq 0 && "$in_progress_count" -eq 0 ]]; then
        local failed_count=$(jq '[.tasks[] | select(.status == "failed")] | length' "$PLAN_FILE")
        echo -e "${YELLOW}[plan]${NC} WARNING: $pending_count pending task(s) but none ready to start." >&2

        if [[ "$failed_count" -gt 0 ]]; then
            echo -e "${YELLOW}[plan]${NC} $failed_count task(s) have FAILED - dependent tasks are blocked." >&2
            echo -e "${YELLOW}[plan]${NC} Options: retry failed tasks, or use 'plan_set_task_status <id> skipped' to bypass." >&2
            jq -r '.tasks[] | select(.status == "failed") | "  FAILED: \(.id)"' "$PLAN_FILE" >&2
        else
            echo -e "${YELLOW}[plan]${NC} Tasks may have unresolvable dependencies (missing dependency tasks)." >&2
        fi

        # List the blocked tasks
        jq -r '.tasks[] | select(.status == "pending") | "  - \(.id) depends on: \(.depends_on | join(", "))"' "$PLAN_FILE" >&2
    fi

    echo "$ready_tasks"
}

# Get in-progress tasks
plan_get_active_tasks() {
    _check_jq || return 1

    if [[ ! -f "$PLAN_FILE" ]]; then
        echo "[]"
        return 0
    fi

    jq '[.tasks[] | select(.status == "in_progress")]' "$PLAN_FILE"
}

# Get task by ID
plan_get_task() {
    _check_jq || return 1

    local task_id="$1"

    if [[ ! -f "$PLAN_FILE" ]]; then
        echo "null"
        return 0
    fi

    jq --arg id "$task_id" '.tasks[] | select(.id == $id)' "$PLAN_FILE"
}

# Check if plan exists and is active
plan_exists() {
    if [[ ! -f "$PLAN_FILE" ]]; then
        return 1
    fi

    local status=$(jq -r '.status' "$PLAN_FILE" 2>/dev/null)
    [[ "$status" == "planning" || "$status" == "in_progress" ]]
}

# Get plan status summary
plan_status() {
    _check_jq || return 1

    if [[ ! -f "$PLAN_FILE" ]]; then
        echo -e "${YELLOW}[plan]${NC} No plan exists."
        return 0
    fi

    local plan_id=$(jq -r '.plan_id' "$PLAN_FILE")
    local goal=$(jq -r '.goal' "$PLAN_FILE")
    local plan_status=$(jq -r '.status' "$PLAN_FILE")
    local created=$(jq -r '.created_at' "$PLAN_FILE" | cut -d'T' -f1)

    local total=$(jq '.tasks | length' "$PLAN_FILE")
    local pending=$(jq '[.tasks[] | select(.status == "pending")] | length' "$PLAN_FILE")
    local in_progress=$(jq '[.tasks[] | select(.status == "in_progress")] | length' "$PLAN_FILE")
    local merged=$(jq '[.tasks[] | select(.status == "merged")] | length' "$PLAN_FILE")
    local failed=$(jq '[.tasks[] | select(.status == "failed")] | length' "$PLAN_FILE")
    local skipped=$(jq '[.tasks[] | select(.status == "skipped")] | length' "$PLAN_FILE")

    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "                    PLAN STATUS"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo -e "Plan ID:  ${CYAN}$plan_id${NC}"
    echo -e "Goal:     $goal"
    echo -e "Status:   $plan_status"
    echo -e "Created:  $created"
    echo ""
    echo "─────────────────────────────────────────────────────────────"
    printf "%-25s %-12s %-15s %s\n" "TASK" "STATUS" "BRANCH" "DEPENDS ON"
    echo "─────────────────────────────────────────────────────────────"

    jq -r '.tasks[] | "\(.id)|\(.status)|\(.branch // "-")|\(.depends_on | join(","))"' "$PLAN_FILE" | \
    while IFS='|' read -r id task_status branch deps; do
        case $task_status in
            "pending")     status_color="${YELLOW}pending${NC}" ;;
            "in_progress") status_color="${BLUE}active${NC}" ;;
            "merged")      status_color="${GREEN}merged${NC}" ;;
            "failed")      status_color="${RED}failed${NC}" ;;
            "skipped")     status_color="${CYAN}skipped${NC}" ;;
            *)             status_color="$task_status" ;;
        esac
        printf "%-25s %-20b %-15s %s\n" "$id" "$status_color" "$branch" "${deps:-none}"
    done

    echo ""
    echo "─────────────────────────────────────────────────────────────"
    local summary="${GREEN}$merged merged${NC} | ${BLUE}$in_progress active${NC} | ${YELLOW}$pending pending${NC}"
    [[ "$failed" -gt 0 ]] && summary="$summary | ${RED}$failed failed${NC}"
    [[ "$skipped" -gt 0 ]] && summary="$summary | ${CYAN}$skipped skipped${NC}"
    echo -e "Summary: $summary"
    local done_count=$((merged + skipped))
    echo -e "Progress: $done_count / $total tasks complete ($merged merged, $skipped skipped)"
    echo ""

    if [[ $pending -gt 0 ]]; then
        local ready=$(plan_get_ready_tasks | jq 'length')
        echo -e "${CYAN}$ready task(s) ready to start${NC} (dependencies met)"
        echo "Run /cpt:continue to spawn agents for ready tasks"
    elif [[ $in_progress -gt 0 ]]; then
        echo "Agents are working. Check status with /cpt:list"
    else
        echo -e "${GREEN}All tasks complete!${NC}"
    fi
    echo ""
}

# Archive current plan (for starting fresh)
plan_archive() {
    _check_jq || return 1

    if [[ ! -f "$PLAN_FILE" ]]; then
        echo -e "${YELLOW}[plan]${NC} No plan to archive."
        return 0
    fi

    local plan_id=$(jq -r '.plan_id' "$PLAN_FILE")
    local archive_dir=".claude/archived-plans"
    mkdir -p "$archive_dir"

    local archive_file="$archive_dir/${plan_id}.json"
    mv "$PLAN_FILE" "$archive_file"

    echo -e "${GREEN}[plan]${NC} Archived plan to: $archive_file"
}

# Export plan as markdown (for documentation)
plan_export_md() {
    _check_jq || return 1

    if [[ ! -f "$PLAN_FILE" ]]; then
        echo "No plan exists."
        return 0
    fi

    local goal=$(jq -r '.goal' "$PLAN_FILE")
    local status=$(jq -r '.status' "$PLAN_FILE")
    local created=$(jq -r '.created_at' "$PLAN_FILE")

    echo "# Project Plan"
    echo ""
    echo "**Goal:** $goal"
    echo "**Status:** $status"
    echo "**Created:** $created"
    echo ""
    echo "## Tasks"
    echo ""

    jq -r '.tasks[] | "- [\(if .status == "merged" then "x" else " " end)] **\(.id)**: \(.description // "No description") (\(.status))"' "$PLAN_FILE"

    echo ""
    echo "## History"
    echo ""
    jq -r '.history[] | "- \(.timestamp | split("T")[0]): \(.task_id) - \(.action)"' "$PLAN_FILE"
}

# If script is run directly, show usage
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    case "${1:-}" in
        "init")
            shift
            plan_init "$@"
            ;;
        "add")
            shift
            plan_add_task "$@"
            ;;
        "status")
            plan_status
            ;;
        "pending")
            plan_get_pending_tasks
            ;;
        "ready")
            plan_get_ready_tasks
            ;;
        "active")
            plan_get_active_tasks
            ;;
        "archive")
            plan_archive
            ;;
        "export")
            plan_export_md
            ;;
        *)
            echo "Usage: plan.sh <command> [args]"
            echo ""
            echo "Commands:"
            echo "  init <goal> [task_ids]  - Create new plan"
            echo "  add <id> [desc] [scope] - Add task to plan"
            echo "  status                  - Show plan status"
            echo "  pending                 - List pending tasks (JSON)"
            echo "  ready                   - List ready tasks (JSON)"
            echo "  active                  - List active tasks (JSON)"
            echo "  archive                 - Archive current plan"
            echo "  export                  - Export plan as markdown"
            ;;
    esac
fi
