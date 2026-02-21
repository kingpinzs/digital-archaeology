// src/progress/WorldMapView.test.ts
// Tests for WorldMapView SVG world map component

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorldMapView } from './WorldMapView';
import type { CollectibleProfile } from './collectible-types';
import { DEFAULT_COLLECTIBLE_PROFILE } from './collectible-types';

// Helper: SVG elements in jsdom don't have .click(), use dispatchEvent instead
const clickElement = (el: Element | null): void => {
  el?.dispatchEvent(new Event('click', { bubbles: true }));
};

describe('WorldMapView', () => {
  let container: HTMLElement;
  let view: WorldMapView;

  const makeProfile = (overrides: Partial<CollectibleProfile> = {}): CollectibleProfile => ({
    ...DEFAULT_COLLECTIBLE_PROFILE,
    ...overrides,
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    view = new WorldMapView();
  });

  afterEach(() => {
    view.destroy();
    container.remove();
  });

  describe('mount', () => {
    it('creates the world map element', () => {
      view.mount(container);
      expect(container.querySelector('.da-world-map')).not.toBeNull();
    });

    it('contains an SVG element', () => {
      view.mount(container);
      expect(container.querySelector('svg')).not.toBeNull();
    });

    it('creates a tooltip element', () => {
      view.mount(container);
      expect(container.querySelector('.da-world-map__tooltip')).not.toBeNull();
    });

    it('sets aria attributes', () => {
      view.mount(container);
      const el = container.querySelector('.da-world-map');
      expect(el?.getAttribute('role')).toBe('img');
      expect(el?.getAttribute('aria-label')).toContain('World map');
    });
  });

  describe('update', () => {
    it('renders pins for locations up to current act', () => {
      view.mount(container);
      // Act 0 has 4 locations (lebombo, ujjain, baghdad, pisa)
      view.update(0, makeProfile());
      const pins = container.querySelectorAll('.da-world-map__pin');
      expect(pins.length).toBe(4);
    });

    it('renders more pins for higher act numbers', () => {
      view.mount(container);
      view.update(1, makeProfile());
      const pins = container.querySelectorAll('.da-world-map__pin');
      // Act 0 has 4, Act 1 adds 2 more (berlin, lincoln)
      expect(pins.length).toBe(6);
    });

    it('marks pinned locations with pinned class', () => {
      view.mount(container);
      view.update(0, makeProfile({
        pinnedLocations: [{ locationId: 'lebombo', timestamp: Date.now() }],
      }));
      const pinnedPins = container.querySelectorAll('.da-world-map__pin--pinned');
      expect(pinnedPins.length).toBe(1);
    });

    it('marks highlighted location with highlighted class', () => {
      view.mount(container);
      view.update(0, makeProfile(), 'baghdad');
      const highlighted = container.querySelectorAll('.da-world-map__pin--highlighted');
      expect(highlighted.length).toBe(1);
    });

    it('renders pulse animation for highlighted pin', () => {
      view.mount(container);
      view.update(0, makeProfile(), 'pisa');
      const pulse = container.querySelectorAll('.da-world-map__pin-pulse');
      expect(pulse.length).toBe(1);
    });
  });

  describe('pin interactions', () => {
    it('calls onPinLocation when pin button is clicked in popup', () => {
      const onPin = vi.fn();
      view.mount(container);
      view.setCallbacks({ onPinLocation: onPin });
      view.update(0, makeProfile());

      // Click a pin to show popup
      const pin = container.querySelector('.da-world-map__pin');
      clickElement(pin);

      // Click the pin button in the popup
      const pinBtn = container.querySelector('.da-world-map__popup-pin') as HTMLElement;
      pinBtn?.click();

      expect(onPin).toHaveBeenCalledTimes(1);
    });

    it('calls onUnpinLocation for already-pinned locations', () => {
      const onUnpin = vi.fn();
      view.mount(container);
      view.setCallbacks({ onUnpinLocation: onUnpin });
      view.update(0, makeProfile({
        pinnedLocations: [{ locationId: 'lebombo', timestamp: Date.now() }],
      }));

      // Click the lebombo pin (first one)
      const pins = container.querySelectorAll('.da-world-map__pin');
      const lebomboPin = Array.from(pins).find(
        p => p.getAttribute('data-location-id') === 'lebombo'
      );
      clickElement(lebomboPin ?? null);

      // Click unpin in popup
      const pinBtn = container.querySelector('.da-world-map__popup-pin') as HTMLElement;
      pinBtn?.click();

      expect(onUnpin).toHaveBeenCalledWith('lebombo');
    });
  });

  describe('popup', () => {
    it('shows popup on pin click', () => {
      view.mount(container);
      view.update(0, makeProfile());

      const pin = container.querySelector('.da-world-map__pin');
      clickElement(pin);

      expect(container.querySelector('.da-world-map__popup')).not.toBeNull();
    });

    it('closes popup on close button click', () => {
      view.mount(container);
      view.update(0, makeProfile());

      const pin = container.querySelector('.da-world-map__pin');
      clickElement(pin);

      const closeBtn = container.querySelector('.da-world-map__popup-close') as HTMLElement;
      closeBtn?.click();

      expect(container.querySelector('.da-world-map__popup')).toBeNull();
    });

    it('replaces existing popup when another pin is clicked', () => {
      view.mount(container);
      view.update(0, makeProfile());

      const pins = container.querySelectorAll('.da-world-map__pin');
      clickElement(pins[0]);
      clickElement(pins[1]);

      const popups = container.querySelectorAll('.da-world-map__popup');
      expect(popups.length).toBe(1);
    });
  });

  describe('destroy', () => {
    it('removes element from DOM', () => {
      view.mount(container);
      view.destroy();
      expect(container.querySelector('.da-world-map')).toBeNull();
    });

    it('getElement returns null after destroy', () => {
      view.mount(container);
      view.destroy();
      expect(view.getElement()).toBeNull();
    });

    it('can be called multiple times safely', () => {
      view.mount(container);
      view.destroy();
      view.destroy();
    });
  });
});
