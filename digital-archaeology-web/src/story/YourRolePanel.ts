// src/story/YourRolePanel.ts
// Floating "Your Role" panel for Story Mode (fixed position, desktop only)
// Story 10.2: Create Story Mode Layout

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
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = '👤';

    const roleName = document.createElement('div');
    roleName.className = 'da-your-role-name';
    roleName.textContent = 'Junior Engineer';

    const roleLocation = document.createElement('div');
    roleLocation.className = 'da-your-role-location';
    roleLocation.textContent = 'Fairchild Semiconductor';

    avatarSection.appendChild(avatar);
    avatarSection.appendChild(roleName);
    avatarSection.appendChild(roleLocation);

    // Stats section
    const stats = document.createElement('div');
    stats.className = 'da-your-role-stats';

    const eraLabel = document.createElement('div');
    eraLabel.className = 'da-your-role-stat';

    const eraKey = document.createElement('span');
    eraKey.className = 'da-your-role-stat-key';
    eraKey.textContent = 'Era:';

    const eraValue = document.createElement('span');
    eraValue.className = 'da-your-role-stat-value';
    eraValue.textContent = '1971';

    eraLabel.appendChild(eraKey);
    eraLabel.appendChild(eraValue);

    const progressLabel = document.createElement('div');
    progressLabel.className = 'da-your-role-stat';

    const progressKey = document.createElement('span');
    progressKey.className = 'da-your-role-stat-key';
    progressKey.textContent = 'Progress:';

    const progressValue = document.createElement('span');
    progressValue.className = 'da-your-role-stat-value';
    progressValue.textContent = 'Act 1 / Chapter 1';

    progressLabel.appendChild(progressKey);
    progressLabel.appendChild(progressValue);

    stats.appendChild(eraLabel);
    stats.appendChild(progressLabel);

    // Assemble the panel
    panel.appendChild(header);
    panel.appendChild(avatarSection);
    panel.appendChild(stats);

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
  }
}
