// src/progress/AchievementGallery.test.ts
// Tests for AchievementGallery modal UI component
// Story 19.3: Create Milestone Achievements

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AchievementGallery } from './AchievementGallery';
import type { AchievementType } from './types';

describe('AchievementGallery', () => {
  let gallery: AchievementGallery;
  let container: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    gallery = new AchievementGallery();
    container = document.createElement('div');
    document.body.appendChild(container);
    gallery.mount(container);
  });

  afterEach(() => {
    gallery.destroy();
    container.remove();
    vi.useRealTimers();
  });

  describe('mount', () => {
    it('does not create any DOM elements until show() is called', () => {
      expect(container.children).toHaveLength(0);
    });
  });

  describe('show', () => {
    it('creates overlay with correct ARIA attributes', () => {
      gallery.show([]);

      const overlay = container.querySelector('.da-achievement-gallery');
      expect(overlay).not.toBeNull();
      expect(overlay!.getAttribute('role')).toBe('dialog');
      expect(overlay!.getAttribute('aria-modal')).toBe('true');
      expect(overlay!.getAttribute('aria-labelledby')).toBe('da-achievement-gallery-title');
    });

    it('displays title', () => {
      gallery.show([]);

      const title = container.querySelector('.da-achievement-gallery__title');
      expect(title).not.toBeNull();
      expect(title!.textContent).toBe('Achievements');
    });

    it('displays earned counter', () => {
      gallery.show(['first-discovery', 'code-pioneer']);

      const counter = container.querySelector('.da-achievement-gallery__counter');
      expect(counter).not.toBeNull();
      expect(counter!.textContent).toBe('2 / 16 Earned');
    });

    it('displays 0 / 16 when no achievements earned', () => {
      gallery.show([]);

      const counter = container.querySelector('.da-achievement-gallery__counter');
      expect(counter!.textContent).toBe('0 / 16 Earned');
    });

    it('renders all 16 achievement cards', () => {
      gallery.show([]);

      const cards = container.querySelectorAll('.da-achievement-card');
      expect(cards).toHaveLength(16);
    });

    it('has entering CSS class initially', () => {
      gallery.show([]);

      const overlay = container.querySelector('.da-achievement-gallery');
      expect(overlay!.classList.contains('da-achievement-gallery--entering')).toBe(true);
    });

    it('has close button', () => {
      gallery.show([]);

      const closeBtn = container.querySelector('.da-achievement-gallery__close');
      expect(closeBtn).not.toBeNull();
      expect(closeBtn!.getAttribute('aria-label')).toBe('Close achievements gallery');
    });
  });

  describe('earned vs locked cards', () => {
    it('earned cards have tier class and no locked class', () => {
      gallery.show(['first-discovery']);

      const cards = container.querySelectorAll('.da-achievement-card');
      const firstCard = cards[0]; // first-discovery is first in order
      expect(firstCard.classList.contains('da-achievement-card--locked')).toBe(false);
      expect(firstCard.classList.contains('da-achievement-card--common')).toBe(true);
    });

    it('locked cards have locked class', () => {
      gallery.show([]);

      const cards = container.querySelectorAll('.da-achievement-card');
      for (const card of cards) {
        expect(card.classList.contains('da-achievement-card--locked')).toBe(true);
      }
    });

    it('locked cards show ??? for description', () => {
      gallery.show([]);

      const descriptions = container.querySelectorAll('.da-achievement-card__description');
      for (const desc of descriptions) {
        expect(desc.textContent).toBe('???');
      }
    });

    it('earned cards show actual description', () => {
      gallery.show(['first-discovery']);

      const cards = container.querySelectorAll('.da-achievement-card');
      const desc = cards[0].querySelector('.da-achievement-card__description');
      expect(desc!.textContent).toBe('Earned your first discovery.');
    });

    it('locked cards show Locked status', () => {
      gallery.show([]);

      const statuses = container.querySelectorAll('.da-achievement-card__status');
      for (const status of statuses) {
        expect(status.textContent).toBe('Locked');
      }
    });

    it('earned cards show earned date when timestamp provided', () => {
      const timestamps = new Map<AchievementType, number>();
      timestamps.set('first-discovery', new Date('2026-02-20').getTime());
      gallery.show(['first-discovery'], timestamps);

      const cards = container.querySelectorAll('.da-achievement-card');
      const status = cards[0].querySelector('.da-achievement-card__status');
      expect(status!.textContent).toContain('Earned:');
      expect(status!.textContent).toContain('2026');
    });

    it('each card shows title regardless of locked state', () => {
      gallery.show([]);

      const titles = container.querySelectorAll('.da-achievement-card__title');
      for (const title of titles) {
        expect(title.textContent!.length).toBeGreaterThan(0);
      }
    });

    it('each card shows tier badge', () => {
      gallery.show([]);

      const tiers = container.querySelectorAll('.da-achievement-card__tier');
      expect(tiers).toHaveLength(16);
      for (const tier of tiers) {
        expect(['common', 'uncommon', 'rare', 'epic', 'legendary']).toContain(tier.textContent);
      }
    });
  });

  describe('dismissal', () => {
    it('close button dismisses overlay', () => {
      gallery.show([]);

      const closeBtn = container.querySelector('.da-achievement-gallery__close') as HTMLButtonElement;
      closeBtn.click();

      const overlay = container.querySelector('.da-achievement-gallery');
      expect(overlay!.classList.contains('da-achievement-gallery--exiting')).toBe(true);

      vi.advanceTimersByTime(300);
      expect(container.querySelector('.da-achievement-gallery')).toBeNull();
    });

    it('Escape key dismisses overlay', () => {
      gallery.show([]);

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);

      const overlay = container.querySelector('.da-achievement-gallery');
      expect(overlay!.classList.contains('da-achievement-gallery--exiting')).toBe(true);

      vi.advanceTimersByTime(300);
      expect(container.querySelector('.da-achievement-gallery')).toBeNull();
    });

    it('backdrop click dismisses overlay', () => {
      gallery.show([]);

      const backdrop = container.querySelector('.da-achievement-gallery__backdrop') as HTMLElement;
      backdrop.click();

      const overlay = container.querySelector('.da-achievement-gallery');
      expect(overlay!.classList.contains('da-achievement-gallery--exiting')).toBe(true);

      vi.advanceTimersByTime(300);
      expect(container.querySelector('.da-achievement-gallery')).toBeNull();
    });

    it('double-dismiss does not cause errors (race guard)', () => {
      gallery.show([]);

      const closeBtn = container.querySelector('.da-achievement-gallery__close') as HTMLButtonElement;
      closeBtn.click();
      closeBtn.click();

      const overlay = container.querySelector('.da-achievement-gallery');
      expect(overlay!.classList.contains('da-achievement-gallery--exiting')).toBe(true);

      vi.advanceTimersByTime(300);
      expect(container.querySelector('.da-achievement-gallery')).toBeNull();
    });

    it('Tab key traps focus within the gallery', () => {
      gallery.show([]);

      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      document.dispatchEvent(tabEvent);

      const closeBtn = container.querySelector('.da-achievement-gallery__close');
      expect(document.activeElement).toBe(closeBtn);
    });

    it('restores focus after dismiss', () => {
      const externalBtn = document.createElement('button');
      externalBtn.textContent = 'External';
      document.body.appendChild(externalBtn);
      externalBtn.focus();
      expect(document.activeElement).toBe(externalBtn);

      gallery.show([]);

      const closeBtn = container.querySelector('.da-achievement-gallery__close') as HTMLButtonElement;
      closeBtn.click();
      vi.advanceTimersByTime(300);

      expect(document.activeElement).toBe(externalBtn);

      externalBtn.remove();
    });
  });

  describe('destroy', () => {
    it('cleans up pending timeouts and DOM elements', () => {
      gallery.show([]);
      expect(container.querySelector('.da-achievement-gallery')).not.toBeNull();

      gallery.destroy();
      expect(container.querySelector('.da-achievement-gallery')).toBeNull();
    });

    it('handles being called when no overlay is showing', () => {
      expect(() => gallery.destroy()).not.toThrow();
    });

    it('removes keyboard listener', () => {
      gallery.show([]);
      gallery.destroy();

      const newGallery = new AchievementGallery();
      const newContainer = document.createElement('div');
      document.body.appendChild(newContainer);
      newGallery.mount(newContainer);
      newGallery.show([]);

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);

      const overlay = newContainer.querySelector('.da-achievement-gallery');
      expect(overlay!.classList.contains('da-achievement-gallery--exiting')).toBe(true);

      newGallery.destroy();
      newContainer.remove();
    });
  });
});
