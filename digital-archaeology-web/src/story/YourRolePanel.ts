// src/story/YourRolePanel.ts
// Floating "Your Role" panel for Story Mode (fixed position, desktop only)
// Story 10.2: Create Story Mode Layout
// Story 10.4: Create "Your Role" Panel - Add experience, discoveries, setRoleData()

import type { RoleData, DiscoveryBadge } from './types';

/**
 * YourRolePanel shows the user's character in the story.
 * Fixed position on the left side, visible only on desktop (≥1200px).
 *
 * Layout specification (from UX design):
 * - Width: 220px
 * - Position: fixed, left: 24px, top: 72px (48px nav + 24px gap)
 * - Hidden on screens <1200px via CSS media query
 * - Glass-like background with warm gold border
 */
export class YourRolePanel {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private roleData: RoleData | null = null;

  // Element references for dynamic updates
  private nameElement: HTMLElement | null = null;
  private locationElement: HTMLElement | null = null;
  private eraValueElement: HTMLElement | null = null;
  private progressValueElement: HTMLElement | null = null;
  private experienceValueElement: HTMLElement | null = null;
  private badgesContainer: HTMLElement | null = null;

  /**
   * Mount the panel to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
  }

  /**
   * Set the role data and update the display.
   * @param data - The role data to display
   */
  setRoleData(data: RoleData): void {
    this.roleData = data;
    this.updateDisplay();
  }

  /**
   * Update all displayed values based on current roleData.
   */
  private updateDisplay(): void {
    if (!this.roleData) return;

    if (this.nameElement) {
      this.nameElement.textContent = this.roleData.name;
    }
    if (this.locationElement) {
      this.locationElement.textContent = this.roleData.location;
    }
    if (this.eraValueElement) {
      this.eraValueElement.textContent = this.roleData.era;
    }
    if (this.progressValueElement) {
      this.progressValueElement.textContent = this.roleData.progress;
    }
    if (this.experienceValueElement) {
      this.experienceValueElement.textContent = this.roleData.experience;
    }

    this.updateDiscoveries();
  }

  /**
   * Update the discoveries badges display.
   */
  private updateDiscoveries(): void {
    if (!this.badgesContainer || !this.roleData) return;

    // Clear existing badges using DOM methods (not innerHTML for XSS safety)
    while (this.badgesContainer.firstChild) {
      this.badgesContainer.removeChild(this.badgesContainer.firstChild);
    }

    // Render earned discoveries
    for (const badge of this.roleData.discoveries) {
      const badgeEl = this.createBadgeElement(badge);
      this.badgesContainer.appendChild(badgeEl);
    }
  }

  /**
   * Create a badge element for a discovery.
   * @param badge - The discovery badge data
   * @returns The badge element
   */
  private createBadgeElement(badge: DiscoveryBadge): HTMLElement {
    const el = document.createElement('span');
    el.className = 'da-your-role-badge da-your-role-badge--earned';
    el.setAttribute('title', badge.name);
    el.setAttribute('aria-label', `Discovery: ${badge.name}`);
    el.textContent = badge.icon;
    return el;
  }

  /**
   * Render the Your Role panel structure.
   * @returns The rendered aside element
   */
  private render(): HTMLElement {
    const panel = document.createElement('aside');
    panel.className = 'da-your-role-panel';
    // Note: <aside> has implicit role="complementary" - no need to set explicitly
    panel.setAttribute('aria-label', 'Your character role');

    // Build DOM structure programmatically
    const header = document.createElement('div');
    header.className = 'da-your-role-header';

    const title = document.createElement('h2');
    title.className = 'da-your-role-title';
    title.textContent = 'YOUR ROLE';

    header.appendChild(title);

    // Avatar section
    const avatarSection = document.createElement('div');
    avatarSection.className = 'da-your-role-avatar-section';

    const avatar = document.createElement('div');
    avatar.className = 'da-your-role-avatar';
    avatar.setAttribute('role', 'img');
    avatar.setAttribute('aria-label', 'Character avatar');
    avatar.textContent = '👤';

    const roleName = document.createElement('div');
    roleName.className = 'da-your-role-name';
    roleName.textContent = 'Junior Engineer';
    this.nameElement = roleName;

    const roleLocation = document.createElement('div');
    roleLocation.className = 'da-your-role-location';
    roleLocation.textContent = 'Fairchild Semiconductor';
    this.locationElement = roleLocation;

    avatarSection.appendChild(avatar);
    avatarSection.appendChild(roleName);
    avatarSection.appendChild(roleLocation);

    // Stats section
    const stats = document.createElement('div');
    stats.className = 'da-your-role-stats';

    // Era stat
    const eraLabel = document.createElement('div');
    eraLabel.className = 'da-your-role-stat';

    const eraKey = document.createElement('span');
    eraKey.className = 'da-your-role-stat-key';
    eraKey.textContent = 'Era:';

    const eraValue = document.createElement('span');
    eraValue.className = 'da-your-role-stat-value';
    eraValue.textContent = '1971';
    this.eraValueElement = eraValue;

    eraLabel.appendChild(eraKey);
    eraLabel.appendChild(eraValue);

    // Progress stat
    const progressLabel = document.createElement('div');
    progressLabel.className = 'da-your-role-stat';

    const progressKey = document.createElement('span');
    progressKey.className = 'da-your-role-stat-key';
    progressKey.textContent = 'Progress:';

    const progressValue = document.createElement('span');
    progressValue.className = 'da-your-role-stat-value';
    progressValue.textContent = 'Act 1 / Chapter 1';
    this.progressValueElement = progressValue;

    progressLabel.appendChild(progressKey);
    progressLabel.appendChild(progressValue);

    // Experience stat (Task 1: Add Experience Stat)
    const experienceLabel = document.createElement('div');
    experienceLabel.className = 'da-your-role-stat';

    const experienceKey = document.createElement('span');
    experienceKey.className = 'da-your-role-stat-key';
    experienceKey.textContent = 'Experience:';

    const experienceValue = document.createElement('span');
    experienceValue.className = 'da-your-role-stat-value da-your-role-experience-value';
    experienceValue.textContent = 'Novice';
    this.experienceValueElement = experienceValue;

    experienceLabel.appendChild(experienceKey);
    experienceLabel.appendChild(experienceValue);

    stats.appendChild(eraLabel);
    stats.appendChild(progressLabel);
    stats.appendChild(experienceLabel);

    // Discoveries section (Task 2: Add Discoveries Section)
    const discoveries = document.createElement('div');
    discoveries.className = 'da-your-role-discoveries';

    const discoveriesHeader = document.createElement('div');
    discoveriesHeader.className = 'da-your-role-discoveries-header';
    discoveriesHeader.textContent = 'Discoveries Made';

    const badgesContainer = document.createElement('div');
    badgesContainer.className = 'da-your-role-discoveries-badges';
    this.badgesContainer = badgesContainer;

    // Add 3 placeholder badges (unearned state)
    for (let i = 0; i < 3; i++) {
      const placeholderBadge = document.createElement('span');
      placeholderBadge.className = 'da-your-role-badge';
      placeholderBadge.setAttribute('aria-hidden', 'true');
      placeholderBadge.textContent = '?';
      badgesContainer.appendChild(placeholderBadge);
    }

    discoveries.appendChild(discoveriesHeader);
    discoveries.appendChild(badgesContainer);

    // Assemble the panel
    panel.appendChild(header);
    panel.appendChild(avatarSection);
    panel.appendChild(stats);
    panel.appendChild(discoveries);

    return panel;
  }

  /**
   * Show the panel.
   */
  show(): void {
    this.element?.classList.remove('da-your-role-panel--hidden');
  }

  /**
   * Hide the panel.
   */
  hide(): void {
    this.element?.classList.add('da-your-role-panel--hidden');
  }

  /**
   * Check if the panel is currently visible.
   * @returns true if visible and mounted, false otherwise
   */
  isVisible(): boolean {
    if (!this.element) return false;
    return !this.element.classList.contains('da-your-role-panel--hidden');
  }

  /**
   * Get the root element.
   * @returns The panel element or null if not mounted
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
    this.roleData = null;
    this.nameElement = null;
    this.locationElement = null;
    this.eraValueElement = null;
    this.progressValueElement = null;
    this.experienceValueElement = null;
    this.badgesContainer = null;
  }
}
