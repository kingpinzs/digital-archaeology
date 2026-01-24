// src/story/SceneSetting.ts
// Scene setting component for Story Mode
// Story 10.6: Create Scene Setting Component

import type { SceneSettingData } from './types';

/**
 * SceneSetting displays atmospheric scene descriptions.
 * Shows a styled box with "Setting" label, gold border,
 * and italic text with gradient background.
 *
 * Layout specification (from UX design):
 * - Container: position relative for floating label
 * - Label: positioned above border, uppercase, gold color
 * - Border: 1px solid with gold accent (--persona-gold)
 * - Background: subtle gold-tinted gradient
 * - Text: italic, serif font (Crimson Text), secondary color
 */
export class SceneSetting {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private settingData: SceneSettingData | null = null;

  // Element references for dynamic updates
  private textElement: HTMLElement | null = null;

  /**
   * Mount the scene setting to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
  }

  /**
   * Set the scene setting data and update the display.
   * @param data - The scene setting data to display
   */
  setSettingData(data: SceneSettingData): void {
    this.settingData = data;
    this.updateDisplay();
  }

  /**
   * Update all displayed values based on current settingData.
   */
  private updateDisplay(): void {
    if (!this.settingData) return;

    if (this.textElement) {
      this.textElement.textContent = this.settingData.text;
    }
  }

  /**
   * Render the scene setting structure.
   * @returns The rendered section element
   */
  private render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'da-scene-setting';
    section.setAttribute('aria-label', 'Scene setting');

    // Floating label ("Setting") - positioned above the border
    const label = document.createElement('span');
    label.className = 'da-scene-setting-label';
    label.textContent = 'Setting';

    // Content wrapper (has the border and gradient)
    const content = document.createElement('div');
    content.className = 'da-scene-setting-content';

    // Setting text (italic description)
    const text = document.createElement('p');
    text.className = 'da-scene-setting-text';
    text.textContent = 'The scene setting will appear here...'; // Default placeholder
    this.textElement = text;

    content.appendChild(text);
    section.appendChild(label);
    section.appendChild(content);

    return section;
  }

  /**
   * Show the scene setting.
   */
  show(): void {
    this.element?.classList.remove('da-scene-setting--hidden');
  }

  /**
   * Hide the scene setting.
   */
  hide(): void {
    this.element?.classList.add('da-scene-setting--hidden');
  }

  /**
   * Check if the scene setting is currently visible.
   * @returns true if visible and mounted, false otherwise
   */
  isVisible(): boolean {
    if (!this.element) return false;
    return !this.element.classList.contains('da-scene-setting--hidden');
  }

  /**
   * Get the root element.
   * @returns The section element or null if not mounted
   */
  getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.container = null;
    this.settingData = null;
    this.textElement = null;
  }
}
