// src/progress/ArtifactGallery.ts
// Grid container of ArtifactCardView instances
// Displays all artifacts with collected/available/locked states

import type { CollectibleProfile } from './collectible-types';
import { ARTIFACT_REGISTRY } from './CollectibleRegistry';
import { ArtifactCardView } from './ArtifactCardView';
import type { ArtifactCardState } from './ArtifactCardView';

/**
 * Callbacks for artifact gallery interactions.
 */
export interface ArtifactGalleryCallbacks {
  onCollectArtifact?: (artifactId: string) => void;
}

/**
 * ArtifactGallery renders a CSS Grid of ArtifactCardView instances.
 * Shows collected count, filters by act progress, and manages card lifecycle.
 */
export class ArtifactGallery {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private counterEl: HTMLElement | null = null;
  private gridEl: HTMLElement | null = null;
  private cards: ArtifactCardView[] = [];
  private callbacks: ArtifactGalleryCallbacks = {};
  private currentActNumber = 0;
  private profile: CollectibleProfile | null = null;
  private highlightedArtifactId: string | null = null;

  mount(container: HTMLElement): void {
    this.container = container;
    this.element = document.createElement('div');
    this.element.className = 'da-artifact-gallery';

    // Header with counter
    const header = document.createElement('div');
    header.className = 'da-artifact-gallery__header';

    const title = document.createElement('h3');
    title.className = 'da-artifact-gallery__title';
    title.textContent = 'Artifact Collection';

    this.counterEl = document.createElement('span');
    this.counterEl.className = 'da-artifact-gallery__counter';
    this.counterEl.textContent = '0 / 0 Collected';

    header.appendChild(title);
    header.appendChild(this.counterEl);

    // Grid container
    this.gridEl = document.createElement('div');
    this.gridEl.className = 'da-artifact-gallery__grid';

    this.element.appendChild(header);
    this.element.appendChild(this.gridEl);
    this.container.appendChild(this.element);
  }

  setCallbacks(callbacks: ArtifactGalleryCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Update the gallery with current data.
   */
  update(currentActNumber: number, profile: CollectibleProfile, highlightedArtifactId?: string): void {
    this.currentActNumber = currentActNumber;
    this.profile = profile;
    this.highlightedArtifactId = highlightedArtifactId ?? null;
    this.renderCards();
  }

  private renderCards(): void {
    if (!this.gridEl || !this.profile) return;

    // Destroy existing cards
    for (const card of this.cards) {
      card.destroy();
    }
    this.cards = [];

    const collectedIds = new Set(this.profile.collectedArtifacts.map(a => a.artifactId));
    let collectedCount = 0;

    for (const artifact of ARTIFACT_REGISTRY) {
      const state = this.getArtifactState(artifact.actNumber, artifact.id, collectedIds);
      if (state === 'collected') collectedCount++;

      const card = new ArtifactCardView();
      const mount = document.createElement('div');
      mount.className = 'da-artifact-gallery__card-mount';

      // Highlight if this is the targeted artifact
      if (artifact.id === this.highlightedArtifactId) {
        mount.classList.add('da-artifact-gallery__card-mount--highlighted');
      }

      this.gridEl.appendChild(mount);
      card.mount(mount);
      card.setCallbacks({
        onCollect: (artifactId: string) => {
          this.callbacks.onCollectArtifact?.(artifactId);
        },
      });
      card.setArtifact(artifact, state);
      this.cards.push(card);
    }

    // Update counter
    if (this.counterEl) {
      this.counterEl.textContent = `${collectedCount} / ${ARTIFACT_REGISTRY.length} Collected`;
    }
  }

  private getArtifactState(
    artifactActNumber: number,
    artifactId: string,
    collectedIds: Set<string>,
  ): ArtifactCardState {
    if (collectedIds.has(artifactId)) return 'collected';
    if (artifactActNumber <= this.currentActNumber) return 'available';
    return 'locked';
  }

  getElement(): HTMLElement | null {
    return this.element;
  }

  destroy(): void {
    for (const card of this.cards) {
      card.destroy();
    }
    this.cards = [];
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.container = null;
    this.counterEl = null;
    this.gridEl = null;
    this.callbacks = {};
    this.profile = null;
  }
}
