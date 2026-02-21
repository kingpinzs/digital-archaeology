// src/progress/ArtifactGallery.test.ts
// Tests for ArtifactGallery grid container component

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ArtifactGallery } from './ArtifactGallery';
import type { CollectibleProfile } from './collectible-types';
import { DEFAULT_COLLECTIBLE_PROFILE } from './collectible-types';
import { ARTIFACT_REGISTRY } from './CollectibleRegistry';

describe('ArtifactGallery', () => {
  let container: HTMLElement;
  let gallery: ArtifactGallery;

  const makeProfile = (overrides: Partial<CollectibleProfile> = {}): CollectibleProfile => ({
    ...DEFAULT_COLLECTIBLE_PROFILE,
    ...overrides,
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    gallery = new ArtifactGallery();
  });

  afterEach(() => {
    gallery.destroy();
    container.remove();
  });

  describe('mount', () => {
    it('creates the gallery element', () => {
      gallery.mount(container);
      expect(container.querySelector('.da-artifact-gallery')).not.toBeNull();
    });

    it('creates header with title', () => {
      gallery.mount(container);
      const title = container.querySelector('.da-artifact-gallery__title');
      expect(title?.textContent).toBe('Artifact Collection');
    });

    it('creates counter element', () => {
      gallery.mount(container);
      expect(container.querySelector('.da-artifact-gallery__counter')).not.toBeNull();
    });

    it('creates grid element', () => {
      gallery.mount(container);
      expect(container.querySelector('.da-artifact-gallery__grid')).not.toBeNull();
    });
  });

  describe('update', () => {
    it('renders all artifacts in the registry', () => {
      gallery.mount(container);
      gallery.update(10, makeProfile()); // Act 10 = all acts
      const cards = container.querySelectorAll('.da-artifact-card');
      expect(cards.length).toBe(ARTIFACT_REGISTRY.length);
    });

    it('updates counter with collected count', () => {
      gallery.mount(container);
      gallery.update(10, makeProfile({
        collectedArtifacts: [
          { artifactId: 'lebombo-bone', timestamp: Date.now() },
          { artifactId: 'eniac', timestamp: Date.now() },
        ],
      }));
      const counter = container.querySelector('.da-artifact-gallery__counter');
      expect(counter?.textContent).toContain('2');
    });

    it('marks available artifacts as available (not locked)', () => {
      gallery.mount(container);
      gallery.update(0, makeProfile()); // Only act 0 artifacts available
      const available = container.querySelectorAll('.da-artifact-card--available');
      // Act 0 artifacts: lebombo-bone, clay-tokens, pascaline, difference-engine
      expect(available.length).toBe(4);
    });

    it('marks future artifacts as locked', () => {
      gallery.mount(container);
      gallery.update(0, makeProfile()); // Only act 0, so later acts are locked
      const locked = container.querySelectorAll('.da-artifact-card--locked');
      expect(locked.length).toBe(ARTIFACT_REGISTRY.length - 4);
    });

    it('marks collected artifacts as collected', () => {
      gallery.mount(container);
      gallery.update(0, makeProfile({
        collectedArtifacts: [{ artifactId: 'lebombo-bone', timestamp: Date.now() }],
      }));
      const collected = container.querySelectorAll('.da-artifact-card--collected');
      expect(collected.length).toBe(1);
    });

    it('highlights the targeted artifact', () => {
      gallery.mount(container);
      gallery.update(0, makeProfile(), 'lebombo-bone');
      const highlighted = container.querySelectorAll('.da-artifact-gallery__card-mount--highlighted');
      expect(highlighted.length).toBe(1);
    });
  });

  describe('collect callback', () => {
    it('calls onCollectArtifact when a card collect button is clicked', () => {
      const onCollect = vi.fn();
      gallery.mount(container);
      gallery.setCallbacks({ onCollectArtifact: onCollect });
      gallery.update(0, makeProfile());

      const btn = container.querySelector('.da-artifact-card__collect') as HTMLElement;
      btn?.click();

      expect(onCollect).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy', () => {
    it('removes element from DOM', () => {
      gallery.mount(container);
      gallery.update(0, makeProfile());
      gallery.destroy();
      expect(container.querySelector('.da-artifact-gallery')).toBeNull();
    });

    it('getElement returns null after destroy', () => {
      gallery.mount(container);
      gallery.destroy();
      expect(gallery.getElement()).toBeNull();
    });
  });
});
