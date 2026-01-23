#!/bin/bash
# Action Item #8 from Epic 3 Retrospective: Verify test count hasn't dropped
#
# This script verifies the test count meets the minimum threshold.
# Can be run manually or as part of a pre-commit hook.
#
# Usage:
#   ./scripts/verify-test-count.sh
#
# Exit codes:
#   0 - Test count is above threshold
#   1 - Test count is below threshold or tests failed

set -e

THRESHOLD=1000
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "Running tests to verify count..."
TEST_OUTPUT=$(npm test -- --run 2>&1) || {
    echo "Tests failed!"
    echo "$TEST_OUTPUT"
    exit 1
}

# Extract test count from output (e.g., "1011 passed")
TEST_COUNT=$(echo "$TEST_OUTPUT" | grep -oP '\d+(?= passed)' | tail -1)

if [ -z "$TEST_COUNT" ]; then
    echo "Could not determine test count from output"
    echo "$TEST_OUTPUT"
    exit 1
fi

echo "Test count: $TEST_COUNT (threshold: $THRESHOLD)"

if [ "$TEST_COUNT" -lt "$THRESHOLD" ]; then
    echo "ERROR: Test count dropped below $THRESHOLD!"
    echo "Please add tests to maintain coverage."
    exit 1
fi

echo "Test count check passed!"
exit 0
