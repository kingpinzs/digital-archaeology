// src/progress/StageUnlockToast.test.ts
// Tests for StageUnlockToast notification UI component
// Story 19.5: Implement Stage Unlock System

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StageUnlockToast } from './StageUnlockToast';

describe('StageUnlockToast', () => {
  let toast: StageUnlockToast;
  let parent: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    parent = document.createElement('div');
    document.body.appendChild(parent);
    toast = new StageUnlockToast();
  });

  afterEach(() => {
    toast.destroy();
    parent.remove();
    vi.useRealTimers();
  });

  // Task 9.1: mount() creates container with correct ARIA attributes
  it('should create container with role="status" and aria-live="polite"', () => {
    toast.mount(parent);
    const container = parent.querySelector('.da-stage-unlock-toast-container');
    expect(container).not.toBeNull();
    expect(container?.getAttribute('role')).toBe('status');
    expect(container?.getAttribute('aria-live')).toBe('polite');
  });

  // Task 9.2: show() displays toast with stage icon, label, and message
  it('should display toast with stage icon, label, and "Stage Unlocked!" message', () => {
    toast.mount(parent);
    toast.show('micro8');

    const toastEl = parent.querySelector('.da-stage-unlock-toast');
    expect(toastEl).not.toBeNull();

    const icon = toastEl?.querySelector('.da-stage-unlock-toast__icon');
    expect(icon?.textContent).toBe('8');

    const label = toastEl?.querySelector('.da-stage-unlock-toast__label');
    expect(label?.textContent).toBe('Micro8');

    const message = toastEl?.querySelector('.da-stage-unlock-toast__message');
    expect(message?.textContent).toBe('Stage Unlocked!');
  });

  it('should display correct metadata for micro16', () => {
    toast.mount(parent);
    toast.show('micro16');

    const icon = parent.querySelector('.da-stage-unlock-toast__icon');
    expect(icon?.textContent).toBe('16');

    const label = parent.querySelector('.da-stage-unlock-toast__label');
    expect(label?.textContent).toBe('Micro16');
  });

  // Task 9.3: auto-dismiss after 4000ms
  it('should auto-dismiss after 4000ms', () => {
    toast.mount(parent);
    toast.show('micro8');

    expect(parent.querySelector('.da-stage-unlock-toast')).not.toBeNull();

    // Advance to just before dismiss
    vi.advanceTimersByTime(3999);
    expect(parent.querySelector('.da-stage-unlock-toast')).not.toBeNull();

    // Advance past dismiss
    vi.advanceTimersByTime(1);
    const toastEl = parent.querySelector('.da-stage-unlock-toast');
    expect(toastEl?.classList.contains('da-stage-unlock-toast--exiting')).toBe(true);

    // Exit animation complete
    vi.advanceTimersByTime(200);
    expect(parent.querySelector('.da-stage-unlock-toast')).toBeNull();
  });

  // Task 9.4: enter/exit animation classes
  it('should add --entering class on show', () => {
    toast.mount(parent);
    toast.show('micro8');

    const toastEl = parent.querySelector('.da-stage-unlock-toast');
    expect(toastEl?.classList.contains('da-stage-unlock-toast--entering')).toBe(true);
  });

  it('should remove --entering class after requestAnimationFrame cycle', () => {
    // Mock requestAnimationFrame to execute callbacks synchronously
    const rAFCallbacks: FrameRequestCallback[] = [];
    const originalRAF = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
      rAFCallbacks.push(cb);
      return rAFCallbacks.length;
    };

    toast.mount(parent);
    toast.show('micro8');

    const toastEl = parent.querySelector('.da-stage-unlock-toast');
    expect(toastEl?.classList.contains('da-stage-unlock-toast--entering')).toBe(true);

    // Execute first rAF (outer)
    while (rAFCallbacks.length > 0) {
      rAFCallbacks.shift()!(0);
    }

    // After both rAF callbacks, --entering should be removed
    expect(toastEl?.classList.contains('da-stage-unlock-toast--entering')).toBe(false);

    // Restore
    globalThis.requestAnimationFrame = originalRAF;
  });

  it('should add --exiting class before removal', () => {
    toast.mount(parent);
    toast.show('micro8');

    // Trigger dismiss
    vi.advanceTimersByTime(4000);

    const toastEl = parent.querySelector('.da-stage-unlock-toast');
    expect(toastEl?.classList.contains('da-stage-unlock-toast--exiting')).toBe(true);
  });

  // Task 9.5: queue support
  it('should queue multiple toasts and show second after first dismisses', () => {
    toast.mount(parent);
    toast.show('micro8');
    toast.show('micro16');

    // Only first toast visible
    const toasts = parent.querySelectorAll('.da-stage-unlock-toast');
    expect(toasts).toHaveLength(1);
    expect(parent.querySelector('.da-stage-unlock-toast__label')?.textContent).toBe('Micro8');

    // Dismiss first toast: 4000ms dismiss + 200ms exit + 500ms gap
    vi.advanceTimersByTime(4000 + 200 + 500);

    // Second toast should now be visible
    const label = parent.querySelector('.da-stage-unlock-toast__label');
    expect(label?.textContent).toBe('Micro16');
  });

  // Task 9.6: destroy() cleans up DOM and timeouts
  it('should clean up DOM and timeouts on destroy()', () => {
    toast.mount(parent);
    toast.show('micro8');

    toast.destroy();

    expect(parent.querySelector('.da-stage-unlock-toast-container')).toBeNull();
    expect(parent.querySelector('.da-stage-unlock-toast')).toBeNull();

    // Advancing timers should not cause errors
    vi.advanceTimersByTime(10000);
  });

  // Edge: show() before mount does nothing
  it('should silently ignore show() before mount()', () => {
    toast.show('micro8');
    // No error thrown
    expect(parent.querySelector('.da-stage-unlock-toast')).toBeNull();
  });
});
