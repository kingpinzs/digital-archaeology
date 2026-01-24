// src/story/YourRolePanel.test.ts
// Tests for YourRolePanel component
// Story 10.2: Create Story Mode Layout

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { YourRolePanel } from './YourRolePanel';

describe('YourRolePanel', () => {
  let container: HTMLElement;
  let panel: YourRolePanel;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    panel?.destroy();
    container.remove();
  });

  describe('Task 3: Component Rendering', () => {
    it('should render panel with correct class', () => {
      panel = new YourRolePanel();
      panel.mount(container);

      const panelElement = container.querySelector('.da-your-role-panel');
      expect(panelElement).not.toBeNull();
    });

    it('should render as an aside element', () => {
      panel = new YourRolePanel();
      panel.mount(container);

      const aside = container.querySelector('aside.da-your-role-panel');
      expect(aside).not.toBeNull();
    });

    it('should use semantic <aside> element (implicit role="complementary")', () => {
      panel = new YourRolePanel();
      panel.mount(container);

      const panelElement = container.querySelector('.da-your-role-panel');
      expect(panelElement?.tagName).toBe('ASIDE');
      // Note: <aside> has implicit role="complementary" per ARIA spec
    });

    it('should have aria-label for accessibility', () => {
      panel = new YourRolePanel();
      panel.mount(container);

      const panelElement = container.querySelector('.da-your-role-panel');
      expect(panelElement?.getAttribute('aria-label')).toBe('Your character role');
    });

    it('should render "YOUR ROLE" title', () => {
      panel = new YourRolePanel();
      panel.mount(container);

      const title = container.querySelector('.da-your-role-title');
      expect(title?.textContent).toBe('YOUR ROLE');
    });

    it('should render avatar placeholder', () => {
      panel = new YourRolePanel();
      panel.mount(container);

      const avatar = container.querySelector('.da-your-role-avatar');
      expect(avatar).not.toBeNull();
      expect(avatar?.textContent).toBe('👤');
      expect(avatar?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should render role name "Junior Engineer"', () => {
      panel = new YourRolePanel();
      panel.mount(container);

      const roleName = container.querySelector('.da-your-role-name');
      expect(roleName?.textContent).toBe('Junior Engineer');
    });

    it('should render location "Fairchild Semiconductor"', () => {
      panel = new YourRolePanel();
      panel.mount(container);

      const location = container.querySelector('.da-your-role-location');
      expect(location?.textContent).toBe('Fairchild Semiconductor');
    });

    it('should render era stat with "1971"', () => {
      panel = new YourRolePanel();
      panel.mount(container);

      const stats = container.querySelector('.da-your-role-stats');
      expect(stats?.textContent).toContain('Era:');
      expect(stats?.textContent).toContain('1971');
    });

    it('should render progress stat', () => {
      panel = new YourRolePanel();
      panel.mount(container);

      const stats = container.querySelector('.da-your-role-stats');
      expect(stats?.textContent).toContain('Progress:');
      expect(stats?.textContent).toContain('Act 1 / Chapter 1');
    });
  });

  describe('Task 3: Visibility Control', () => {
    it('should be visible by default', () => {
      panel = new YourRolePanel();
      panel.mount(container);

      expect(panel.isVisible()).toBe(true);
    });

    it('should hide when hide() is called', () => {
      panel = new YourRolePanel();
      panel.mount(container);

      panel.hide();

      expect(panel.isVisible()).toBe(false);
      const panelElement = container.querySelector('.da-your-role-panel');
      expect(panelElement?.classList.contains('da-your-role-panel--hidden')).toBe(true);
    });

    it('should show when show() is called', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      panel.hide();

      panel.show();

      expect(panel.isVisible()).toBe(true);
      const panelElement = container.querySelector('.da-your-role-panel');
      expect(panelElement?.classList.contains('da-your-role-panel--hidden')).toBe(false);
    });
  });

  describe('Task 3: Element Access', () => {
    it('should return element via getElement()', () => {
      panel = new YourRolePanel();
      panel.mount(container);

      const element = panel.getElement();
      expect(element).not.toBeNull();
      expect(element?.classList.contains('da-your-role-panel')).toBe(true);
    });

    it('should return null before mounting', () => {
      panel = new YourRolePanel();
      expect(panel.getElement()).toBeNull();
    });

    it('should return false from isVisible() before mounting', () => {
      panel = new YourRolePanel();
      expect(panel.isVisible()).toBe(false);
    });
  });

  describe('Task 3: Cleanup', () => {
    it('should remove element from DOM on destroy', () => {
      panel = new YourRolePanel();
      panel.mount(container);

      expect(container.querySelector('.da-your-role-panel')).not.toBeNull();

      panel.destroy();

      expect(container.querySelector('.da-your-role-panel')).toBeNull();
    });

    it('should return null from getElement() after destroy', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      panel.destroy();

      expect(panel.getElement()).toBeNull();
    });
  });
});
