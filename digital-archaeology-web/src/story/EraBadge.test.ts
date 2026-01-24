// src/story/EraBadge.test.ts
// Tests for EraBadge component
// Story 10.16: Display Era Badge and Progress

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EraBadge } from './EraBadge';

describe('EraBadge', () => {
  let container: HTMLElement;
  let eraBadge: EraBadge;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    eraBadge?.destroy();
    container.remove();
  });

  describe('Task 2: Component Rendering', () => {
    it('should render era badge with correct class', () => {
      eraBadge = new EraBadge();
      eraBadge.mount(container);

      const badge = container.querySelector('.da-story-nav-era-badge');
      expect(badge).not.toBeNull();
    });

    it('should render as a span element', () => {
      eraBadge = new EraBadge();
      eraBadge.mount(container);

      const badge = container.querySelector('.da-story-nav-era-badge');
      expect(badge?.tagName).toBe('SPAN');
    });

    it('should return element via getElement()', () => {
      eraBadge = new EraBadge();
      eraBadge.mount(container);

      const element = eraBadge.getElement();
      expect(element).not.toBeNull();
      expect(element?.classList.contains('da-story-nav-era-badge')).toBe(true);
    });

    it('should return null before mounting', () => {
      eraBadge = new EraBadge();
      expect(eraBadge.getElement()).toBeNull();
    });
  });

  describe('Task 2: setEra Method', () => {
    it('should render era year correctly', () => {
      eraBadge = new EraBadge();
      eraBadge.mount(container);
      eraBadge.setEra('1971');

      const badge = container.querySelector('.da-story-nav-era-badge');
      expect(badge?.textContent).toBe('1971');
    });

    it('should update era when setEra called', () => {
      eraBadge = new EraBadge();
      eraBadge.mount(container);

      eraBadge.setEra('1971');
      expect(container.querySelector('.da-story-nav-era-badge')?.textContent).toBe('1971');

      eraBadge.setEra('1985');
      expect(container.querySelector('.da-story-nav-era-badge')?.textContent).toBe('1985');
    });

    it('should render era with title when provided', () => {
      eraBadge = new EraBadge();
      eraBadge.mount(container);
      eraBadge.setEra('1971', 'Dawn of the Microprocessor');

      const badge = container.querySelector('.da-story-nav-era-badge');
      expect(badge?.textContent).toBe('1971 - Dawn of the Microprocessor');
    });

    it('should render year only when title is undefined', () => {
      eraBadge = new EraBadge();
      eraBadge.mount(container);
      eraBadge.setEra('1971', undefined);

      const badge = container.querySelector('.da-story-nav-era-badge');
      expect(badge?.textContent).toBe('1971');
    });

    it('should update from title to year only', () => {
      eraBadge = new EraBadge();
      eraBadge.mount(container);

      eraBadge.setEra('1971', 'Some Title');
      expect(container.querySelector('.da-story-nav-era-badge')?.textContent).toBe('1971 - Some Title');

      eraBadge.setEra('1985');
      expect(container.querySelector('.da-story-nav-era-badge')?.textContent).toBe('1985');
    });

    it('should allow setEra before mount', () => {
      eraBadge = new EraBadge();
      eraBadge.setEra('2000');
      eraBadge.mount(container);

      const badge = container.querySelector('.da-story-nav-era-badge');
      expect(badge?.textContent).toBe('2000');
    });
  });

  describe('Task 2: Getters', () => {
    it('should return current era via getEra()', () => {
      eraBadge = new EraBadge();
      eraBadge.mount(container);
      eraBadge.setEra('1975');

      expect(eraBadge.getEra()).toBe('1975');
    });

    it('should return current title via getTitle()', () => {
      eraBadge = new EraBadge();
      eraBadge.mount(container);
      eraBadge.setEra('1975', 'Test Title');

      expect(eraBadge.getTitle()).toBe('Test Title');
    });

    it('should return undefined for title when not set', () => {
      eraBadge = new EraBadge();
      eraBadge.mount(container);
      eraBadge.setEra('1975');

      expect(eraBadge.getTitle()).toBeUndefined();
    });
  });

  describe('Task 2: XSS Prevention', () => {
    it('should escape HTML in era year', () => {
      eraBadge = new EraBadge();
      eraBadge.mount(container);
      eraBadge.setEra('<script>alert("xss")</script>');

      const badge = container.querySelector('.da-story-nav-era-badge');
      // textContent should be literal string, not executed
      expect(badge?.textContent).toBe('<script>alert("xss")</script>');
      expect(badge?.innerHTML).not.toContain('<script>');
    });

    it('should escape HTML in title', () => {
      eraBadge = new EraBadge();
      eraBadge.mount(container);
      eraBadge.setEra('1971', '<img src=x onerror=alert(1)>');

      const badge = container.querySelector('.da-story-nav-era-badge');
      // Should be escaped literal text
      expect(badge?.innerHTML).not.toContain('<img');
    });
  });

  describe('Task 2: Cleanup', () => {
    it('should remove element from DOM on destroy', () => {
      eraBadge = new EraBadge();
      eraBadge.mount(container);

      expect(container.querySelector('.da-story-nav-era-badge')).not.toBeNull();

      eraBadge.destroy();

      expect(container.querySelector('.da-story-nav-era-badge')).toBeNull();
    });

    it('should return null from getElement() after destroy', () => {
      eraBadge = new EraBadge();
      eraBadge.mount(container);
      eraBadge.destroy();

      expect(eraBadge.getElement()).toBeNull();
    });
  });
});
