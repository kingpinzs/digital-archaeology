# Keyboard Navigation Testing Guide

**Action Item from Epic 1 Retrospective: Create keyboard navigation testing guide**

This guide documents how to implement and test keyboard navigation for accessibility compliance.

## WCAG Requirements

WCAG 2.1 Level AA requires:
- **2.1.1 Keyboard**: All functionality available via keyboard
- **2.1.2 No Keyboard Trap**: User can navigate away using keyboard
- **2.4.3 Focus Order**: Logical, meaningful sequence
- **2.4.7 Focus Visible**: Keyboard focus indicator is visible

## Standard Navigation Keys

| Key | Action |
|-----|--------|
| `Tab` | Move to next focusable element |
| `Shift+Tab` | Move to previous focusable element |
| `Enter` | Activate button/link |
| `Space` | Activate button, toggle checkbox |
| `Escape` | Close dialog/menu |
| `Arrow keys` | Navigate within component |
| `Home` | Go to first item |
| `End` | Go to last item |

## Component-Specific Patterns

### Buttons

```typescript
// Buttons are natively keyboard accessible
<button onClick={handleClick}>Click me</button>

// AVOID: div with click handler (not keyboard accessible)
<div onClick={handleClick}>Click me</div>  // BAD

// If you must use a div, add proper ARIA and keyboard handling
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Click me
</div>
```

### Sliders/Range Inputs

```typescript
// Native input is keyboard accessible
<input
  type="range"
  min="1"
  max="1000"
  value={speed}
  onChange={handleChange}
  aria-label="Execution speed"
  aria-valuenow={speed}
  aria-valuemin={1}
  aria-valuemax={1000}
  aria-valuetext={`${speed} Hz`}
/>
```

### Dialogs/Modals

```typescript
class Dialog {
  private previousActiveElement: Element | null = null;

  open(): void {
    // Save current focus
    this.previousActiveElement = document.activeElement;

    // Focus first focusable element in dialog
    const firstFocusable = this.element.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    (firstFocusable as HTMLElement)?.focus();

    // Trap focus within dialog
    this.element.addEventListener('keydown', this.handleKeyDown);
  }

  close(): void {
    // Restore focus to triggering element
    (this.previousActiveElement as HTMLElement)?.focus();
    this.element.removeEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.close();
    }
    // Implement focus trap for Tab key
  };
}
```

### Menus

```typescript
handleMenuKeyDown(e: KeyboardEvent): void {
  const items = this.menuItems;
  const currentIndex = items.indexOf(document.activeElement as HTMLElement);

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % items.length;
      items[nextIndex].focus();
      break;

    case 'ArrowUp':
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      items[prevIndex].focus();
      break;

    case 'Home':
      e.preventDefault();
      items[0].focus();
      break;

    case 'End':
      e.preventDefault();
      items[items.length - 1].focus();
      break;

    case 'Escape':
      this.closeMenu();
      this.menuButton.focus();
      break;
  }
}
```

### Panel Resizers

```typescript
// PanelResizer keyboard support (from Story 1.6)
handleKeyDown(e: KeyboardEvent): void {
  const step = e.shiftKey ? 50 : 10;  // Larger step with Shift

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      this.resize(-step);
      break;
    case 'ArrowRight':
      e.preventDefault();
      this.resize(step);
      break;
    case 'Home':
      e.preventDefault();
      this.resize(-Infinity);  // Go to minimum
      break;
    case 'End':
      e.preventDefault();
      this.resize(Infinity);  // Go to maximum
      break;
  }
}
```

## Testing Keyboard Navigation

### Unit Tests

```typescript
import { fireEvent } from '@testing-library/dom';

describe('Keyboard navigation', () => {
  it('should open dialog on Enter key', () => {
    const button = container.querySelector('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(container.querySelector('.dialog')).toBeInTheDocument();
  });

  it('should close dialog on Escape key', () => {
    openDialog();
    const dialog = container.querySelector('.dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(container.querySelector('.dialog')).not.toBeInTheDocument();
  });

  it('should navigate menu with arrow keys', () => {
    openMenu();
    const firstItem = container.querySelector('.menu-item');
    firstItem.focus();

    fireEvent.keyDown(firstItem, { key: 'ArrowDown' });

    const secondItem = container.querySelectorAll('.menu-item')[1];
    expect(document.activeElement).toBe(secondItem);
  });

  it('should trap focus within dialog', () => {
    openDialog();
    const lastFocusable = container.querySelector('.dialog button:last-child');
    lastFocusable.focus();

    fireEvent.keyDown(lastFocusable, { key: 'Tab' });

    const firstFocusable = container.querySelector('.dialog button:first-child');
    expect(document.activeElement).toBe(firstFocusable);
  });
});
```

### Integration Tests

```typescript
describe('App keyboard navigation', () => {
  it('should allow full keyboard-only workflow', async () => {
    // Tab to editor
    await userEvent.tab();
    expect(document.activeElement).toBe(editorElement);

    // Type code
    await userEvent.type(editorElement, 'LDA #5');

    // Tab to Assemble button
    await userEvent.tab();
    expect(document.activeElement).toHaveTextContent('Assemble');

    // Press Enter to assemble
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(statusBar).toHaveTextContent('Success'));

    // Tab to Run button
    await userEvent.tab();
    expect(document.activeElement).toHaveTextContent('Run');
  });
});
```

### Manual Testing Checklist

Before shipping any component:

- [ ] Can reach all interactive elements with Tab
- [ ] Tab order is logical (left-to-right, top-to-bottom)
- [ ] Focus indicator is visible on all focused elements
- [ ] Can activate buttons with Enter and Space
- [ ] Can close dialogs/menus with Escape
- [ ] Arrow keys work for menus, sliders, tabs
- [ ] Home/End work for applicable components
- [ ] No keyboard traps (can always Tab away)

## ARIA Attributes for Keyboard Support

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `tabindex="0"` | Make element focusable | `<div tabindex="0">` |
| `tabindex="-1"` | Programmatically focusable only | `<div tabindex="-1">` |
| `role="button"` | Announce as button | `<div role="button">` |
| `aria-label` | Accessible name | `aria-label="Close"` |
| `aria-expanded` | Expanded state | `aria-expanded="true"` |
| `aria-haspopup` | Has popup menu | `aria-haspopup="menu"` |

## Common Issues and Fixes

### Issue: Custom div button not keyboard accessible

```typescript
// Before (inaccessible)
<div class="button" onClick={handleClick}>Save</div>

// After (accessible)
<button class="button" onClick={handleClick}>Save</button>
// OR
<div
  class="button"
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
>
  Save
</div>
```

### Issue: Focus lost after action

```typescript
// Before (focus lost after close)
closeModal(): void {
  this.modalElement.remove();
}

// After (focus restored)
closeModal(): void {
  const triggerButton = this.triggerElement;
  this.modalElement.remove();
  triggerButton?.focus();  // Restore focus
}
```

### Issue: No visible focus indicator

```css
/* Ensure focus is visible */
button:focus,
[tabindex]:focus {
  outline: 2px solid var(--da-accent);
  outline-offset: 2px;
}

/* Don't hide focus for keyboard users */
button:focus:not(:focus-visible) {
  outline: none;  /* Hide for mouse clicks */
}

button:focus-visible {
  outline: 2px solid var(--da-accent);  /* Show for keyboard */
}
```

## Real Examples in Codebase

- `src/ui/PanelResizer.ts` - Arrow key resizing with Home/End support
- `src/ui/MenuBar.ts` - Menu keyboard navigation
- `src/ui/KeyboardShortcutsDialog.ts` - Dialog focus management
- `src/ui/Toolbar.ts` - Button keyboard activation
