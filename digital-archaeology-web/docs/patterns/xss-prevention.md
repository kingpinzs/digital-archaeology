# XSS Prevention Pattern

**Action Item from Epic 1 Retrospective: Document escapeHtml() pattern**

This document describes how to prevent Cross-Site Scripting (XSS) vulnerabilities when displaying user-controlled or dynamic content.

## The Problem

When inserting dynamic content into HTML using innerHTML, unescaped text can execute malicious scripts. This is a critical security vulnerability that must be prevented.

## The Solution: escapeHtml()

The `escapeHtml()` function sanitizes any dynamic content before inserting into HTML:

```typescript
/**
 * Escape HTML special characters to prevent XSS attacks.
 * Uses the browser's built-in encoding via textContent/innerHTML.
 *
 * @param text - The text to escape
 * @returns The escaped text safe for use in HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

### How It Works

1. Create a temporary DOM element
2. Set `textContent` (which auto-escapes special characters)
3. Read back `innerHTML` (which is now safely escaped)

This approach:
- Uses the browser's built-in escaping mechanism
- Handles all special characters (`<`, `>`, `&`, `"`, `'`)
- Is faster than manual regex replacement
- Cannot be bypassed by encoding tricks

## Usage Guidelines

### Always Use escapeHtml() When:

- Displaying user input
- Displaying data from external sources
- Displaying error messages that might contain code snippets
- Any innerHTML assignment with dynamic content

```typescript
// SAFE: Dynamic content is escaped
const safeMessage = escapeHtml(userMessage);
element.innerHTML = '<span>' + safeMessage + '</span>';
```

### Not Needed When:

- Using `textContent` (auto-escapes by default)
- Using static strings only
- Using DOM methods like `createElement`/`appendChild`

```typescript
// Already safe - textContent auto-escapes
element.textContent = userMessage;

// Already safe - DOM API methods
const span = document.createElement('span');
span.textContent = userMessage;
element.appendChild(span);
```

## Current Usage in Codebase

The `escapeHtml()` function is implemented in `src/ui/StatusBar.ts`:

```typescript
// StatusBar.ts line 33-37
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

Used for:
- Assembly status messages
- Load status display
- Instruction display

## Future Consideration: Shared Utility

If `escapeHtml()` is needed in multiple files, extract to a shared utility:

```typescript
// src/utils/html.ts
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

## Testing

```typescript
describe('escapeHtml', () => {
  it('should escape HTML tags', () => {
    const input = '<script>alert("xss")</script>';
    const expected = '&lt;script&gt;alert("xss")&lt;/script&gt;';
    expect(escapeHtml(input)).toBe(expected);
  });

  it('should escape ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('should handle empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should pass through normal text unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });
});
```

## Code Review Checklist

When reviewing code, verify:

- [ ] No innerHTML with unescaped dynamic content
- [ ] All user-visible error messages are escaped
- [ ] All external data is escaped before display
- [ ] textContent used where HTML formatting not needed

## Alternative: DOMPurify Library

For cases requiring HTML formatting (e.g., rich text), consider using DOMPurify:

```typescript
import DOMPurify from 'dompurify';

// Allows safe HTML while stripping dangerous elements
element.innerHTML = DOMPurify.sanitize(htmlWithFormatting);
```

This is overkill for our use case where plain text display suffices.

## Real Examples

- `src/ui/StatusBar.ts` - Escapes assembly messages, load status, instruction display
