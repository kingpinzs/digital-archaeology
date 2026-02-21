// src/progress/ArtifactCardView.test.ts
// Tests for ArtifactCardView collectible card component

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ArtifactCardView } from './ArtifactCardView';
import type { ArtifactEntry } from './collectible-types';

const mockArtifact: ArtifactEntry = {
  id: 'lebombo-bone',
  name: 'Lebombo Bone',
  imageUrl: 'https://example.com/lebombo.jpg',
  attribution: 'Test Attribution',
  actNumber: 0,
  era: '~35,000 BC',
  description: 'A baboon fibula with notch marks.',
  icon: '\u{1F9B4}',
  rarity: 'legendary',
};

describe('ArtifactCardView', () => {
  let container: HTMLElement;
  let card: ArtifactCardView;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    card = new ArtifactCardView();
  });

  afterEach(() => {
    card.destroy();
    container.remove();
  });

  describe('mount', () => {
    it('creates the card element', () => {
      card.mount(container);
      expect(container.querySelector('.da-artifact-card')).not.toBeNull();
    });
  });

  describe('setArtifact', () => {
    it('renders artifact name for available state', () => {
      card.mount(container);
      card.setArtifact(mockArtifact, 'available');
      const name = container.querySelector('.da-artifact-card__name');
      expect(name?.textContent).toBe('Lebombo Bone');
    });

    it('renders ??? for locked state', () => {
      card.mount(container);
      card.setArtifact(mockArtifact, 'locked');
      const name = container.querySelector('.da-artifact-card__name');
      expect(name?.textContent).toBe('???');
    });

    it('renders collect button for available state', () => {
      card.mount(container);
      card.setArtifact(mockArtifact, 'available');
      expect(container.querySelector('.da-artifact-card__collect')).not.toBeNull();
    });

    it('renders collected label for collected state', () => {
      card.mount(container);
      card.setArtifact(mockArtifact, 'collected');
      expect(container.querySelector('.da-artifact-card__collected-label')).not.toBeNull();
    });

    it('does not render collect button for locked state', () => {
      card.mount(container);
      card.setArtifact(mockArtifact, 'locked');
      expect(container.querySelector('.da-artifact-card__collect')).toBeNull();
    });

    it('renders checkmark for collected state', () => {
      card.mount(container);
      card.setArtifact(mockArtifact, 'collected');
      expect(container.querySelector('.da-artifact-card__check')).not.toBeNull();
    });

    it('applies rarity class', () => {
      card.mount(container);
      card.setArtifact(mockArtifact, 'available');
      const el = container.querySelector('.da-artifact-card');
      expect(el?.classList.contains('da-artifact-card--legendary')).toBe(true);
    });

    it('applies locked class', () => {
      card.mount(container);
      card.setArtifact(mockArtifact, 'locked');
      const el = container.querySelector('.da-artifact-card');
      expect(el?.classList.contains('da-artifact-card--locked')).toBe(true);
    });

    it('renders rarity badge', () => {
      card.mount(container);
      card.setArtifact(mockArtifact, 'available');
      const rarity = container.querySelector('.da-artifact-card__rarity');
      expect(rarity?.textContent).toBe('Legendary');
    });

    it('renders description', () => {
      card.mount(container);
      card.setArtifact(mockArtifact, 'available');
      const desc = container.querySelector('.da-artifact-card__desc');
      expect(desc?.textContent).toContain('baboon fibula');
    });

    it('renders lock placeholder for locked state', () => {
      card.mount(container);
      card.setArtifact(mockArtifact, 'locked');
      const placeholder = container.querySelector('.da-artifact-card__placeholder');
      expect(placeholder).not.toBeNull();
    });

    it('renders image for available state', () => {
      card.mount(container);
      card.setArtifact(mockArtifact, 'available');
      const img = container.querySelector('.da-artifact-card__img') as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img?.src).toContain('example.com');
    });
  });

  describe('collect callback', () => {
    it('calls onCollect when collect button is clicked', () => {
      const onCollect = vi.fn();
      card.mount(container);
      card.setCallbacks({ onCollect });
      card.setArtifact(mockArtifact, 'available');

      const btn = container.querySelector('.da-artifact-card__collect') as HTMLElement;
      btn?.click();

      expect(onCollect).toHaveBeenCalledWith('lebombo-bone');
    });
  });

  describe('destroy', () => {
    it('removes element from DOM', () => {
      card.mount(container);
      card.destroy();
      expect(container.querySelector('.da-artifact-card')).toBeNull();
    });

    it('getElement returns null after destroy', () => {
      card.mount(container);
      card.destroy();
      expect(card.getElement()).toBeNull();
    });
  });
});
