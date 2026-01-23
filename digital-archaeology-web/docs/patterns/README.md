# Development Patterns

This directory contains documented patterns and best practices for Digital Archaeology development.

## Pattern Index

| Pattern | Description | When to Use |
|---------|-------------|-------------|
| [Web Worker + Bridge](./web-worker-bridge.md) | Promise-based API for WASM modules in Web Workers | WASM integration, long-running tasks |
| [Event Listener Cleanup](./event-listener-cleanup.md) | Proper cleanup of event listeners | Any component with event handlers |
| [State Management](./state-management.md) | Boolean flags, state updates, subscriptions | Application state, UI coordination |
| [CSS Variables](./css-variables.md) | Theming with `--da-*` custom properties | Any styling work |
| [Pre-Commit Hooks](./pre-commit-hooks.md) | Test count verification | CI/CD, quality gates |
| [XSS Prevention](./xss-prevention.md) | escapeHtml() for dynamic content | Displaying user/external data |
| [Keyboard Navigation](./keyboard-navigation.md) | Keyboard accessibility patterns | All interactive components |
| [Manual Test Deferral](./manual-test-deferral.md) | When to replace manual tests with automated | Test planning, code review |

## Quick Reference

### Adding a New Component

1. Review [Event Listener Cleanup](./event-listener-cleanup.md) before adding event handlers
2. Use [CSS Variables](./css-variables.md) for all colors
3. Plan state reset points per [State Management](./state-management.md)

### Adding WASM Integration

1. Follow [Web Worker + Bridge](./web-worker-bridge.md) pattern
2. Define types in `types.ts`
3. Create worker file
4. Create Bridge class with Promise API

### Running Quality Checks

```bash
# Verify test count
./scripts/verify-test-count.sh

# Run full test suite
npm test

# Type check
npm run typecheck
```

## Contributing

When adding new patterns:
1. Create a new `.md` file in this directory
2. Add entry to this README
3. Link to real code examples in the codebase
4. Include anti-patterns to avoid
