# CSS Variable Usage Policy

**Action Item #6 from Epic 3 Retrospective**

This policy ensures consistent theming and prevents hardcoded colors in the codebase.

## Golden Rule

**Never use hardcoded colors in CSS or inline styles. Always use CSS variables.**

```css
/* BAD */
.error { color: #ff4444; }

/* GOOD */
.error { color: var(--da-error); }
```

## Available Variables

All CSS variables are defined in `src/styles/main.css` with the `--da-` prefix.

### Background Colors

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `--da-bg-primary` | Main background | `#1a1a2e` |
| `--da-bg-secondary` | Panel backgrounds | `#252542` |
| `--da-bg-tertiary` | Elevated surfaces | `#2f2f52` |
| `--da-bg-hover` | Hover states | `#3a3a62` |

### Text Colors

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `--da-text-primary` | Main text | `#e0e0e0` |
| `--da-text-secondary` | Secondary text | `#a0a0b0` |

### Accent Colors

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `--da-accent` | Primary accent | `#00b4d8` |
| `--da-accent-hover` | Accent hover | `#48cae4` |

### Semantic Colors

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `--da-error` | Error states | `#ff4444` |
| `--da-warning` | Warning states | `#ffaa00` |
| `--da-success` | Success states | `#00ff88` |
| `--da-constraint` | Constraint info | `#bd93f9` |

### Signal Colors (Circuit Visualization)

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `--da-signal-high` | High signal | `#00ff88` |
| `--da-signal-low` | Low signal | `#3a3a3a` |

### Gate Colors (Circuit Visualization)

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `--da-gate-and` | AND gate | `#4ecdc4` |
| `--da-gate-or` | OR gate | `#ff6b6b` |
| `--da-gate-xor` | XOR gate | `#ffe66d` |
| `--da-gate-not` | NOT gate | `#c792ea` |

### UI Elements

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `--da-border` | Border color | `#3a3a52` |
| `--da-panel-header` | Panel header bg | `#202038` |

### Error Badge Colors (Semi-transparent)

| Variable | Purpose |
|----------|---------|
| `--da-error-badge-bg` | Error badge background |
| `--da-error-badge-text` | Error badge text |
| `--da-error-badge-border` | Error badge border |
| `--da-warning-badge-bg` | Warning badge background |
| `--da-warning-badge-text` | Warning badge text |
| `--da-warning-badge-border` | Warning badge border |
| `--da-constraint-badge-bg` | Constraint badge background |
| `--da-constraint-badge-text` | Constraint badge text |
| `--da-constraint-badge-border` | Constraint badge border |

## Theme Support

Variables are defined for both Lab Mode and Story Mode:

```css
/* Lab Mode (default) - Cool blue accent */
.lab-mode {
  --da-accent: #00b4d8;
}

/* Story Mode - Warm gold accent */
.story-mode {
  --da-accent: #d4a574;
}
```

Components automatically adapt when the theme class changes on `<html>`.

## Usage in TypeScript

When styles must be applied in JavaScript, use `getComputedStyle`:

```typescript
// Get variable value
const errorColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--da-error')
  .trim();

// Apply to element
element.style.color = 'var(--da-error)';
```

## Adding New Variables

When adding new colors:

1. **Add to `:root`** in `main.css`
2. **Add to `.lab-mode`** with Lab Mode value
3. **Add to `.story-mode`** with Story Mode value
4. **Document** in this file
5. **Use semantic naming** (purpose, not color: `--da-error` not `--da-red`)

```css
:root {
  --da-new-semantic: #value;
}

.lab-mode {
  --da-new-semantic: #lab-value;
}

.story-mode {
  --da-new-semantic: #story-value;
}
```

## Code Review Checklist

When reviewing code, check for:

- [ ] No hardcoded hex colors (`#ffffff`, `rgb(...)`, `hsl(...)`)
- [ ] No hardcoded color names (`red`, `blue`, `white`)
- [ ] All colors use `var(--da-*)` syntax
- [ ] New colors are added to all three theme sections
- [ ] Variable names are semantic, not color-descriptive

## Exceptions

The only allowed hardcoded colors are:

1. **Transparent**: `transparent`, `rgba(0, 0, 0, 0)`
2. **Inherit**: `inherit`, `currentColor`
3. **Third-party library requirements** (document why)

## Real Examples

```css
/* Panel component */
.panel {
  background-color: var(--da-bg-secondary);
  border: 1px solid var(--da-border);
}

.panel-header {
  background-color: var(--da-panel-header);
  color: var(--da-text-primary);
}

/* Error display */
.error-message {
  color: var(--da-error);
  background-color: var(--da-error-badge-bg);
  border: 1px solid var(--da-error-badge-border);
}

/* Success state */
.success-indicator {
  color: var(--da-success);
}

/* Hover state */
.button:hover {
  background-color: var(--da-bg-hover);
}
```
