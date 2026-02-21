// src/progress/ArtifactCardView.ts
// Single artifact card component for the collectible gallery
// Follows CharacterCard mount/destroy pattern

import type { ArtifactEntry, ArtifactRarity } from './collectible-types';

/** State of an artifact card relative to user progress */
export type ArtifactCardState = 'collected' | 'available' | 'locked';

/**
 * Callbacks for artifact card interactions.
 */
export interface ArtifactCardCallbacks {
  onCollect?: (artifactId: string) => void;
}

/**
 * ArtifactCardView displays a single collectible artifact.
 * States: collected (full color + checkmark), available (clickable Collect),
 * locked (grayscale silhouette for future acts).
 */
export class ArtifactCardView {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private artifact: ArtifactEntry | null = null;
  private state: ArtifactCardState = 'locked';
  private callbacks: ArtifactCardCallbacks = {};

  mount(container: HTMLElement): void {
    this.container = container;
    this.element = document.createElement('div');
    this.element.className = 'da-artifact-card';
    this.container.appendChild(this.element);
    if (this.artifact) {
      this.renderCard();
    }
  }

  setCallbacks(callbacks: ArtifactCardCallbacks): void {
    this.callbacks = callbacks;
  }

  setArtifact(artifact: ArtifactEntry, state: ArtifactCardState): void {
    this.artifact = artifact;
    this.state = state;
    this.renderCard();
  }

  private renderCard(): void {
    if (!this.element || !this.artifact) return;

    // Clear existing content safely
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }

    const artifact = this.artifact;

    // Update element classes based on state and rarity
    this.element.className = `da-artifact-card da-artifact-card--${this.state} da-artifact-card--${artifact.rarity}`;
    this.element.setAttribute('aria-label', `${artifact.name} - ${this.state}`);

    // Image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'da-artifact-card__image';

    if (this.state === 'locked') {
      // Show emoji icon as placeholder for locked artifacts
      const placeholder = document.createElement('span');
      placeholder.className = 'da-artifact-card__placeholder';
      placeholder.textContent = '\u{1F512}';
      imageContainer.appendChild(placeholder);
    } else {
      // Lazy-loaded image with emoji fallback
      const img = document.createElement('img');
      img.className = 'da-artifact-card__img';
      img.alt = artifact.name;
      img.loading = 'lazy';
      img.src = artifact.imageUrl;
      img.addEventListener('error', () => {
        // Replace with emoji fallback on load error
        img.remove();
        const fallback = document.createElement('span');
        fallback.className = 'da-artifact-card__placeholder';
        fallback.textContent = artifact.icon;
        imageContainer.appendChild(fallback);
      });
      imageContainer.appendChild(img);
    }

    // Collected checkmark overlay
    if (this.state === 'collected') {
      const check = document.createElement('span');
      check.className = 'da-artifact-card__check';
      check.textContent = '\u{2713}';
      check.setAttribute('aria-label', 'Collected');
      imageContainer.appendChild(check);
    }

    // Name
    const nameEl = document.createElement('div');
    nameEl.className = 'da-artifact-card__name';
    nameEl.textContent = this.state === 'locked' ? '???' : artifact.name;

    // Era badge
    const eraEl = document.createElement('span');
    eraEl.className = 'da-artifact-card__era';
    eraEl.textContent = this.state === 'locked' ? 'Locked' : artifact.era;

    // Rarity badge
    const rarityEl = document.createElement('span');
    rarityEl.className = `da-artifact-card__rarity da-artifact-card__rarity--${artifact.rarity}`;
    rarityEl.textContent = this.getRarityLabel(artifact.rarity);

    // Description
    const descEl = document.createElement('p');
    descEl.className = 'da-artifact-card__desc';
    descEl.textContent = this.state === 'locked'
      ? 'Progress further in the story to unlock this artifact.'
      : artifact.description;

    // Action button (only for available state)
    const footer = document.createElement('div');
    footer.className = 'da-artifact-card__footer';

    if (this.state === 'available') {
      const collectBtn = document.createElement('button');
      collectBtn.type = 'button';
      collectBtn.className = 'da-artifact-card__collect';
      collectBtn.textContent = 'Collect';
      collectBtn.addEventListener('click', () => {
        this.callbacks.onCollect?.(artifact.id);
      });
      footer.appendChild(collectBtn);
    } else if (this.state === 'collected') {
      const collectedLabel = document.createElement('span');
      collectedLabel.className = 'da-artifact-card__collected-label';
      collectedLabel.textContent = '\u{2713} Collected';
      footer.appendChild(collectedLabel);
    }

    // Attribution (only when visible)
    if (this.state !== 'locked') {
      const attrEl = document.createElement('div');
      attrEl.className = 'da-artifact-card__attribution';
      attrEl.textContent = artifact.attribution;
      footer.appendChild(attrEl);
    }

    // Assemble
    this.element.appendChild(imageContainer);
    this.element.appendChild(nameEl);
    this.element.appendChild(eraEl);
    this.element.appendChild(rarityEl);
    this.element.appendChild(descEl);
    this.element.appendChild(footer);
  }

  private getRarityLabel(rarity: ArtifactRarity): string {
    switch (rarity) {
      case 'common': return 'Common';
      case 'uncommon': return 'Uncommon';
      case 'rare': return 'Rare';
      case 'legendary': return 'Legendary';
    }
  }

  getElement(): HTMLElement | null {
    return this.element;
  }

  destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.container = null;
    this.artifact = null;
    this.callbacks = {};
  }
}
