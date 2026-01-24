// src/story/YourRolePanel.test.ts
// Tests for YourRolePanel component
// Story 10.2: Create Story Mode Layout
// Story 10.4: Create "Your Role" Panel
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { YourRolePanel } from './YourRolePanel';
import type { RoleData } from './types';
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
    });
    it('should render avatar with role="img" and aria-label', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      const avatar = container.querySelector('.da-your-role-avatar');
      expect(avatar?.getAttribute('role')).toBe('img');
      expect(avatar?.getAttribute('aria-label')).toBe('Character avatar');
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
  describe('Task 1: Experience Stat (Story 10.4)', () => {
    it('should render experience stat with default value "Novice"', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      const stats = container.querySelector('.da-your-role-stats');
      expect(stats?.textContent).toContain('Experience:');
      expect(stats?.textContent).toContain('Novice');
    });
    it('should have experience value element with correct class', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      const experienceValue = container.querySelector('.da-your-role-experience-value');
      expect(experienceValue).not.toBeNull();
      expect(experienceValue?.textContent).toBe('Novice');
    });
  });
  describe('Task 2: Discoveries Section (Story 10.4)', () => {
    it('should render discoveries section', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      const discoveries = container.querySelector('.da-your-role-discoveries');
      expect(discoveries).not.toBeNull();
    });
    it('should render "Discoveries Made" header', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      const header = container.querySelector('.da-your-role-discoveries-header');
      expect(header).not.toBeNull();
      expect(header?.textContent).toBe('Discoveries Made');
    });
    it('should render badges container', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      const badgesContainer = container.querySelector('.da-your-role-discoveries-badges');
      expect(badgesContainer).not.toBeNull();
    });
    it('should render 3 placeholder badges by default', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      const badges = container.querySelectorAll('.da-your-role-badge');
      expect(badges.length).toBe(3);
    });
    it('should have placeholder badges with "?" text', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      const badges = container.querySelectorAll('.da-your-role-badge');
      badges.forEach((badge) => {
        expect(badge.textContent).toBe('?');
      });
    });
    it('should have placeholder badges with aria-hidden', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      const badges = container.querySelectorAll('.da-your-role-badge');
      badges.forEach((badge) => {
        expect(badge.getAttribute('aria-hidden')).toBe('true');
      });
    });
  });
  describe('Task 4: setRoleData() Method (Story 10.4)', () => {
    it('should update name when setRoleData is called', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      const roleData: RoleData = {
        name: 'Senior Engineer',
        era: '1975',
        location: 'Intel Corporation',
        progress: 'Act 2 / Chapter 3',
        experience: 'Journeyman',
        discoveries: [],
      };
      panel.setRoleData(roleData);
      const name = container.querySelector('.da-your-role-name');
      expect(name?.textContent).toBe('Senior Engineer');
    });
    it('should update location when setRoleData is called', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      const roleData: RoleData = {
        name: 'Senior Engineer',
        era: '1975',
        location: 'Intel Corporation',
        progress: 'Act 2 / Chapter 3',
        experience: 'Journeyman',
        discoveries: [],
      };
      panel.setRoleData(roleData);
      const location = container.querySelector('.da-your-role-location');
      expect(location?.textContent).toBe('Intel Corporation');
    });
    it('should update era when setRoleData is called', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      const roleData: RoleData = {
        name: 'Senior Engineer',
        era: '1975',
        location: 'Intel Corporation',
        progress: 'Act 2 / Chapter 3',
        experience: 'Journeyman',
        discoveries: [],
      };
      panel.setRoleData(roleData);
      const stats = container.querySelector('.da-your-role-stats');
      expect(stats?.textContent).toContain('1975');
    });
    it('should update progress when setRoleData is called', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      const roleData: RoleData = {
        name: 'Senior Engineer',
        era: '1975',
        location: 'Intel Corporation',
        progress: 'Act 2 / Chapter 3',
        experience: 'Journeyman',
        discoveries: [],
      };
      panel.setRoleData(roleData);
      const stats = container.querySelector('.da-your-role-stats');
      expect(stats?.textContent).toContain('Act 2 / Chapter 3');
    });
    it('should update experience when setRoleData is called', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      const roleData: RoleData = {
        name: 'Senior Engineer',
        era: '1975',
        location: 'Intel Corporation',
        progress: 'Act 2 / Chapter 3',
        experience: 'Journeyman',
        discoveries: [],
      };
      panel.setRoleData(roleData);
      const experienceValue = container.querySelector('.da-your-role-experience-value');
      expect(experienceValue?.textContent).toBe('Journeyman');
    });
    it('should render discovery badges when setRoleData is called with discoveries', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      const roleData: RoleData = {
        name: 'Junior Engineer',
        era: '1971',
        location: 'Fairchild Semiconductor',
        progress: 'Act 1 / Chapter 1',
        experience: 'Novice',
        discoveries: [
          { id: 'first-circuit', name: 'First Circuit', icon: '⚡' },
          { id: 'logic-gates', name: 'Logic Gates', icon: '🔌' },
        ],
      };
      panel.setRoleData(roleData);
      const badges = container.querySelectorAll('.da-your-role-badge--earned');
      expect(badges.length).toBe(2);
    });
    it('should render discovery badges with correct icons', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      const roleData: RoleData = {
        name: 'Junior Engineer',
        era: '1971',
        location: 'Fairchild Semiconductor',
        progress: 'Act 1 / Chapter 1',
        experience: 'Novice',
        discoveries: [
          { id: 'first-circuit', name: 'First Circuit', icon: '⚡' },
          { id: 'logic-gates', name: 'Logic Gates', icon: '🔌' },
        ],
      };
      panel.setRoleData(roleData);
      const badges = container.querySelectorAll('.da-your-role-badge--earned');
      expect(badges[0].textContent).toBe('⚡');
      expect(badges[1].textContent).toBe('🔌');
    });
    it('should render discovery badges with title attribute', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      const roleData: RoleData = {
        name: 'Junior Engineer',
        era: '1971',
        location: 'Fairchild Semiconductor',
        progress: 'Act 1 / Chapter 1',
        experience: 'Novice',
        discoveries: [{ id: 'first-circuit', name: 'First Circuit', icon: '⚡' }],
      };
      panel.setRoleData(roleData);
      const badge = container.querySelector('.da-your-role-badge--earned');
      expect(badge?.getAttribute('title')).toBe('First Circuit');
    });
    it('should render discovery badges with aria-label for accessibility', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      const roleData: RoleData = {
        name: 'Junior Engineer',
        era: '1971',
        location: 'Fairchild Semiconductor',
        progress: 'Act 1 / Chapter 1',
        experience: 'Novice',
        discoveries: [{ id: 'first-circuit', name: 'First Circuit', icon: '⚡' }],
      };
      panel.setRoleData(roleData);
      const badge = container.querySelector('.da-your-role-badge--earned');
      expect(badge?.getAttribute('aria-label')).toBe('Discovery: First Circuit');
    });
    it('should clear previous badges when setRoleData is called again', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      // First set of discoveries
      panel.setRoleData({
        name: 'Junior Engineer',
        era: '1971',
        location: 'Fairchild Semiconductor',
        progress: 'Act 1 / Chapter 1',
        experience: 'Novice',
        discoveries: [
          { id: 'first-circuit', name: 'First Circuit', icon: '⚡' },
          { id: 'logic-gates', name: 'Logic Gates', icon: '🔌' },
        ],
      });
      expect(container.querySelectorAll('.da-your-role-badge--earned').length).toBe(2);
      // Second set of discoveries (different)
      panel.setRoleData({
        name: 'Junior Engineer',
        era: '1971',
        location: 'Fairchild Semiconductor',
        progress: 'Act 1 / Chapter 1',
        experience: 'Novice',
        discoveries: [{ id: 'alu', name: 'ALU Master', icon: '🔢' }],
      });
      const badges = container.querySelectorAll('.da-your-role-badge--earned');
      expect(badges.length).toBe(1);
      expect(badges[0].textContent).toBe('🔢');
    });
    it('should show empty badges container when setRoleData has empty discoveries array', () => {
      panel = new YourRolePanel();
      panel.mount(container);
      // Initially has 3 placeholder badges
      expect(container.querySelectorAll('.da-your-role-badge').length).toBe(3);
      // Set role data with empty discoveries
      panel.setRoleData({
        name: 'Junior Engineer',
era: '1971',
        location: 'Fairchild Semiconductor',
        progress: 'Act 1 / Chapter 1',
        experience: 'Novice',
        discoveries: [],
      });
      // Should clear all badges (no placeholders, no earned)
      const allBadges = container.querySelectorAll('.da-your-role-badge');
      const earnedBadges = container.querySelectorAll('.da-your-role-badge--earned');
      expect(allBadges.length).toBe(0);
      expect(earnedBadges.length).toBe(0);
      // Container should still exist but be empty
      const badgesContainer = container.querySelector('.da-your-role-discoveries-badges');
      expect(badgesContainer).not.toBeNull();
      expect(badgesContainer?.children.length).toBe(0);
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
