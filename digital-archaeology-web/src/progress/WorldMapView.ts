// src/progress/WorldMapView.ts
// World map component with interactive location pins
// Renders an SVG world map and places pin markers at registry coordinates

import type { LocationEntry, CollectibleProfile } from './collectible-types';
import { WORLD_MAP_SVG } from './world-map-svg';
import { getLocationsUpToAct } from './CollectibleRegistry';

/**
 * Callbacks for world map interactions.
 */
export interface WorldMapViewCallbacks {
  onPinLocation?: (locationId: string) => void;
  onUnpinLocation?: (locationId: string) => void;
}

/**
 * WorldMapView renders an inline SVG world map with interactive location pins.
 * Pins show visited locations from the story, with pin/unpin toggle.
 */
export class WorldMapView {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private svgElement: SVGSVGElement | null = null;
  private pinsGroup: SVGGElement | null = null;
  private tooltip: HTMLElement | null = null;
  private popup: HTMLElement | null = null;
  private callbacks: WorldMapViewCallbacks = {};
  private currentActNumber = 0;
  private profile: CollectibleProfile | null = null;
  private highlightedLocationId: string | null = null;

  mount(container: HTMLElement): void {
    this.container = container;
    this.element = document.createElement('div');
    this.element.className = 'da-world-map';
    this.element.setAttribute('role', 'img');
    this.element.setAttribute('aria-label', 'World map showing locations from your journey');

    // Parse and insert the SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(WORLD_MAP_SVG, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (svg) {
      this.svgElement = this.element.appendChild(document.importNode(svg, true)) as unknown as SVGSVGElement;
      this.pinsGroup = this.svgElement.querySelector('.da-world-map__pins') as SVGGElement | null;
    }

    // Create tooltip element
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'da-world-map__tooltip da-world-map__tooltip--hidden';
    this.tooltip.setAttribute('role', 'tooltip');
    this.element.appendChild(this.tooltip);

    this.container.appendChild(this.element);
  }

  setCallbacks(callbacks: WorldMapViewCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Update the map with current data.
   */
  update(currentActNumber: number, profile: CollectibleProfile, highlightedLocationId?: string): void {
    this.currentActNumber = currentActNumber;
    this.profile = profile;
    this.highlightedLocationId = highlightedLocationId ?? null;
    this.renderPins();
  }

  /**
   * Render all location pins on the SVG map.
   */
  private renderPins(): void {
    if (!this.pinsGroup || !this.profile) return;

    // Clear existing pins safely (remove child nodes one by one)
    while (this.pinsGroup.firstChild) {
      this.pinsGroup.removeChild(this.pinsGroup.firstChild);
    }

    const locations = getLocationsUpToAct(this.currentActNumber);
    const pinnedIds = new Set(this.profile.pinnedLocations.map(p => p.locationId));

    for (const location of locations) {
      const isPinned = pinnedIds.has(location.id);
      const isHighlighted = location.id === this.highlightedLocationId;
      this.createPin(location, isPinned, isHighlighted);
    }
  }

  /**
   * Create a single pin on the SVG map.
   */
  private createPin(location: LocationEntry, isPinned: boolean, isHighlighted: boolean): void {
    if (!this.pinsGroup) return;

    // Convert percentage coordinates to SVG viewBox coordinates (1000x500)
    const cx = location.x * 10;
    const cy = location.y * 5;

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', this.getPinClasses(isPinned, isHighlighted));
    group.setAttribute('data-location-id', location.id);
    group.setAttribute('role', 'button');
    group.setAttribute('tabindex', '0');
    group.setAttribute('aria-label', `${location.name} (${location.era})`);

    // Highlight pulse (animated ring)
    if (isHighlighted) {
      const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      pulse.setAttribute('cx', String(cx));
      pulse.setAttribute('cy', String(cy));
      pulse.setAttribute('r', '12');
      pulse.setAttribute('class', 'da-world-map__pin-pulse');
      group.appendChild(pulse);
    }

    // Pin outer ring
    const outer = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    outer.setAttribute('cx', String(cx));
    outer.setAttribute('cy', String(cy));
    outer.setAttribute('r', '6');
    outer.setAttribute('class', 'da-world-map__pin-outer');
    group.appendChild(outer);

    // Pin inner dot (filled when pinned)
    const inner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    inner.setAttribute('cx', String(cx));
    inner.setAttribute('cy', String(cy));
    inner.setAttribute('r', isPinned ? '4' : '2');
    inner.setAttribute('class', 'da-world-map__pin-inner');
    group.appendChild(inner);

    // Hover and click handlers
    group.addEventListener('mouseenter', (e) => {
      this.showTooltip(location, e as MouseEvent);
    });
    group.addEventListener('mouseleave', () => {
      this.hideTooltip();
    });
    group.addEventListener('click', () => {
      this.showPopup(location, isPinned, cx, cy);
    });
    group.addEventListener('keydown', (e: Event) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
        keyEvent.preventDefault();
        this.showPopup(location, isPinned, cx, cy);
      }
    });

    this.pinsGroup.appendChild(group);
  }

  private getPinClasses(isPinned: boolean, isHighlighted: boolean): string {
    let classes = 'da-world-map__pin';
    if (isPinned) classes += ' da-world-map__pin--pinned';
    if (isHighlighted) classes += ' da-world-map__pin--highlighted';
    return classes;
  }

  private showTooltip(location: LocationEntry, event: MouseEvent): void {
    if (!this.tooltip || !this.element) return;
    this.tooltip.textContent = `${location.name} \u{2022} ${location.era}`;
    this.tooltip.classList.remove('da-world-map__tooltip--hidden');

    // Position tooltip near cursor
    const rect = this.element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.tooltip.style.left = `${x + 12}px`;
    this.tooltip.style.top = `${y - 8}px`;
  }

  private hideTooltip(): void {
    if (!this.tooltip) return;
    this.tooltip.classList.add('da-world-map__tooltip--hidden');
  }

  private showPopup(location: LocationEntry, isPinned: boolean, svgX: number, svgY: number): void {
    // Remove existing popup
    this.closePopup();

    if (!this.element || !this.svgElement) return;

    this.popup = document.createElement('div');
    this.popup.className = 'da-world-map__popup';
    this.popup.setAttribute('role', 'dialog');
    this.popup.setAttribute('aria-label', `Location details: ${location.name}`);

    const name = document.createElement('div');
    name.className = 'da-world-map__popup-name';
    name.textContent = `${location.icon} ${location.name}`;

    const era = document.createElement('div');
    era.className = 'da-world-map__popup-era';
    era.textContent = location.era;

    const desc = document.createElement('p');
    desc.className = 'da-world-map__popup-desc';
    desc.textContent = location.description;

    const pinBtn = document.createElement('button');
    pinBtn.type = 'button';
    pinBtn.className = isPinned
      ? 'da-world-map__popup-pin da-world-map__popup-pin--active'
      : 'da-world-map__popup-pin';
    pinBtn.textContent = isPinned ? '\u{1F4CC} Unpin' : '\u{1F4CC} Pin Location';
    pinBtn.addEventListener('click', () => {
      if (isPinned) {
        this.callbacks.onUnpinLocation?.(location.id);
      } else {
        this.callbacks.onPinLocation?.(location.id);
      }
      this.closePopup();
    });

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'da-world-map__popup-close';
    closeBtn.textContent = '\u{2715}';
    closeBtn.setAttribute('aria-label', 'Close location details');
    closeBtn.addEventListener('click', () => {
      this.closePopup();
    });

    this.popup.appendChild(closeBtn);
    this.popup.appendChild(name);
    this.popup.appendChild(era);
    this.popup.appendChild(desc);
    this.popup.appendChild(pinBtn);

    // Position popup near the pin on the SVG
    const svgRect = this.svgElement.getBoundingClientRect();
    const mapRect = this.element.getBoundingClientRect();
    const scaleX = svgRect.width / 1000;
    const scaleY = svgRect.height / 500;
    const popupX = svgRect.left - mapRect.left + svgX * scaleX;
    const popupY = svgRect.top - mapRect.top + svgY * scaleY;

    this.popup.style.left = `${popupX + 15}px`;
    this.popup.style.top = `${popupY - 30}px`;

    this.element.appendChild(this.popup);
    pinBtn.focus();
  }

  private closePopup(): void {
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
    }
  }

  getElement(): HTMLElement | null {
    return this.element;
  }

  destroy(): void {
    this.closePopup();
    this.hideTooltip();
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.container = null;
    this.svgElement = null;
    this.pinsGroup = null;
    this.tooltip = null;
    this.callbacks = {};
    this.profile = null;
  }
}
