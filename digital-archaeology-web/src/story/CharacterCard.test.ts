// src/story/CharacterCard.test.ts
// Tests for CharacterCard component
// Story 10.7: Create Character Card Component

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CharacterCard } from './CharacterCard';
import type { CharacterData, CharacterStat } from './types';

describe('CharacterCard', () => {
  let container: HTMLElement;
  let characterCard: CharacterCard;

  const mockCharacterData: CharacterData = {
    avatar: '👩‍🔬',
    name: 'Dr. Sarah Chen',
    title: 'Senior Design Engineer',
    bio: 'One of the few women in semiconductor design, Dr. Chen earned her PhD from MIT in 1965. Known for her work on the 74181 ALU chip.',
    stats: [
      { label: 'Expertise', value: 'Digital Logic, ALU Design' },
      { label: 'Years at Fairchild', value: '6' },
    ],
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    characterCard = new CharacterCard();
  });

  afterEach(() => {
    characterCard.destroy();
    container.remove();
  });

  // Task 1: Create CharacterData Interface
  describe('Task 1: CharacterData Interface', () => {
    it('should accept CharacterData with all required fields', () => {
      const data: CharacterData = {
        avatar: '👤',
        name: 'Test Character',
        title: 'Test Title',
        bio: 'Test bio text.',
        stats: [],
      };
      expect(data.avatar).toBe('👤');
      expect(data.name).toBe('Test Character');
      expect(data.title).toBe('Test Title');
      expect(data.bio).toBe('Test bio text.');
      expect(data.stats).toEqual([]);
    });

    it('should accept CharacterStat with label and value', () => {
      const stat: CharacterStat = {
        label: 'Test Label',
        value: 'Test Value',
      };
      expect(stat.label).toBe('Test Label');
      expect(stat.value).toBe('Test Value');
    });

    it('should accept CharacterData with stats array', () => {
      const data: CharacterData = {
        avatar: '👤',
        name: 'Test',
        title: 'Title',
        bio: 'Bio',
        stats: [
          { label: 'Stat1', value: 'Value1' },
          { label: 'Stat2', value: 'Value2' },
        ],
      };
      expect(data.stats).toHaveLength(2);
      expect(data.stats[0].label).toBe('Stat1');
      expect(data.stats[1].value).toBe('Value2');
    });
  });

  // Task 2: Create CharacterCard Component Class
  describe('Task 2: Component Class', () => {
    it('should mount correctly', () => {
      characterCard.mount(container);
      expect(container.children.length).toBe(1);
    });

    it('should have getElement() accessor', () => {
      expect(characterCard.getElement()).toBeNull();
      characterCard.mount(container);
      expect(characterCard.getElement()).not.toBeNull();
    });

    it('should have show/hide visibility methods', () => {
      characterCard.mount(container);
      expect(characterCard.isVisible()).toBe(true);
      characterCard.hide();
      expect(characterCard.isVisible()).toBe(false);
      characterCard.show();
      expect(characterCard.isVisible()).toBe(true);
    });

    it('should destroy and cleanup', () => {
      characterCard.mount(container);
      expect(container.children.length).toBe(1);
      characterCard.destroy();
      expect(container.children.length).toBe(0);
      expect(characterCard.getElement()).toBeNull();
    });
  });

  // Task 3: Implement render() Method
  describe('Task 3: render() Method', () => {
    it('should render <article> element with correct class', () => {
      characterCard.mount(container);
      const element = characterCard.getElement();
      expect(element?.tagName).toBe('ARTICLE');
      expect(element?.classList.contains('da-character-card')).toBe(true);
    });

    it('should have aria-label for accessibility', () => {
      characterCard.mount(container);
      const element = characterCard.getElement();
      expect(element?.getAttribute('aria-label')).toBe('Character information');
    });

    it('should render avatar wrapper with correct class', () => {
      characterCard.mount(container);
      const avatar = container.querySelector('.da-character-card-avatar');
      expect(avatar).not.toBeNull();
    });

    it('should render avatar emoji span', () => {
      characterCard.mount(container);
      const avatarEmoji = container.querySelector('.da-character-card-avatar-emoji');
      expect(avatarEmoji).not.toBeNull();
      expect(avatarEmoji?.tagName).toBe('SPAN');
    });

    it('should render header section', () => {
      characterCard.mount(container);
      const header = container.querySelector('.da-character-card-header');
      expect(header).not.toBeNull();
    });

    it('should render name as <h3> element', () => {
      characterCard.mount(container);
      const name = container.querySelector('.da-character-card-name');
      expect(name).not.toBeNull();
      expect(name?.tagName).toBe('H3');
    });

    it('should render title element', () => {
      characterCard.mount(container);
      const title = container.querySelector('.da-character-card-title');
      expect(title).not.toBeNull();
      expect(title?.tagName).toBe('SPAN');
    });

    it('should render separator divs', () => {
      characterCard.mount(container);
      const separators = container.querySelectorAll('.da-character-card-separator');
      expect(separators.length).toBe(2);
    });

    it('should render bio paragraph', () => {
      characterCard.mount(container);
      const bio = container.querySelector('.da-character-card-bio');
      expect(bio).not.toBeNull();
      expect(bio?.tagName).toBe('P');
    });

    it('should render stats container', () => {
      characterCard.mount(container);
      const stats = container.querySelector('.da-character-card-stats');
      expect(stats).not.toBeNull();
    });
  });

  // Task 4: Implement setCharacterData() Method
  describe('Task 4: setCharacterData() Method', () => {
    it('should update avatar content', () => {
      characterCard.mount(container);
      characterCard.setCharacterData(mockCharacterData);
      const avatar = container.querySelector('.da-character-card-avatar-emoji');
      expect(avatar?.textContent).toBe('👩‍🔬');
    });

    it('should update name content', () => {
      characterCard.mount(container);
      characterCard.setCharacterData(mockCharacterData);
      const name = container.querySelector('.da-character-card-name');
      expect(name?.textContent).toBe('Dr. Sarah Chen');
    });

    it('should update title content', () => {
      characterCard.mount(container);
      characterCard.setCharacterData(mockCharacterData);
      const title = container.querySelector('.da-character-card-title');
      expect(title?.textContent).toBe('Senior Design Engineer');
    });

    it('should update bio content', () => {
      characterCard.mount(container);
      characterCard.setCharacterData(mockCharacterData);
      const bio = container.querySelector('.da-character-card-bio');
      expect(bio?.textContent).toContain('One of the few women in semiconductor design');
    });

    it('should handle setCharacterData before mount (edge case)', () => {
      // Should not throw when called before mount
      expect(() => {
        characterCard.setCharacterData(mockCharacterData);
      }).not.toThrow();
    });

    it('should display data set before mount after mounting', () => {
      // Set data BEFORE mount
      characterCard.setCharacterData(mockCharacterData);
      // Mount WITHOUT calling setCharacterData again
      characterCard.mount(container);
      // Should display the pre-set data
      const name = container.querySelector('.da-character-card-name');
      expect(name?.textContent).toBe('Dr. Sarah Chen');
      const avatar = container.querySelector('.da-character-card-avatar-emoji');
      expect(avatar?.textContent).toBe('👩‍🔬');
      const stats = container.querySelectorAll('.da-character-card-stat');
      expect(stats.length).toBe(2);
    });
  });

  // Task 5: Implement Stats Rendering
  describe('Task 5: Stats Rendering', () => {
    it('should render stats from array', () => {
      characterCard.mount(container);
      characterCard.setCharacterData(mockCharacterData);
      const stats = container.querySelectorAll('.da-character-card-stat');
      expect(stats.length).toBe(2);
    });

    it('should render stat labels with correct class', () => {
      characterCard.mount(container);
      characterCard.setCharacterData(mockCharacterData);
      const labels = container.querySelectorAll('.da-character-card-stat-label');
      expect(labels.length).toBe(2);
      expect(labels[0].textContent).toContain('Expertise');
    });

    it('should render stat values with correct class', () => {
      characterCard.mount(container);
      characterCard.setCharacterData(mockCharacterData);
      const values = container.querySelectorAll('.da-character-card-stat-value');
      expect(values.length).toBe(2);
      expect(values[0].textContent).toBe('Digital Logic, ALU Design');
    });

    it('should render separators between stats', () => {
      characterCard.mount(container);
      characterCard.setCharacterData(mockCharacterData);
      const separators = container.querySelectorAll('.da-character-card-stat-separator');
      // One separator between two stats
      expect(separators.length).toBe(1);
    });

    it('should handle empty stats array', () => {
      characterCard.mount(container);
      const dataWithNoStats: CharacterData = {
        ...mockCharacterData,
        stats: [],
      };
      characterCard.setCharacterData(dataWithNoStats);
      const stats = container.querySelectorAll('.da-character-card-stat');
      expect(stats.length).toBe(0);
    });

    it('should handle single stat (no separator)', () => {
      characterCard.mount(container);
      const dataWithOneStat: CharacterData = {
        ...mockCharacterData,
        stats: [{ label: 'Single', value: 'Stat' }],
      };
      characterCard.setCharacterData(dataWithOneStat);
      const separators = container.querySelectorAll('.da-character-card-stat-separator');
      expect(separators.length).toBe(0);
    });

    it('should clear old stats when updating with new data', () => {
      characterCard.mount(container);
      // First set data with 2 stats
      characterCard.setCharacterData(mockCharacterData);
      expect(container.querySelectorAll('.da-character-card-stat').length).toBe(2);
      expect(container.querySelectorAll('.da-character-card-stat-separator').length).toBe(1);

      // Update with data that has only 1 stat
      const newData: CharacterData = {
        ...mockCharacterData,
        stats: [{ label: 'Only', value: 'One' }],
      };
      characterCard.setCharacterData(newData);

      // Old stats should be gone, only new stat should exist
      const stats = container.querySelectorAll('.da-character-card-stat');
      expect(stats.length).toBe(1);
      const separators = container.querySelectorAll('.da-character-card-stat-separator');
      expect(separators.length).toBe(0);
      const label = container.querySelector('.da-character-card-stat-label');
      expect(label?.textContent).toContain('Only');
    });

    it('should clear all stats when updating with empty stats array', () => {
      characterCard.mount(container);
      // First set data with 2 stats
      characterCard.setCharacterData(mockCharacterData);
      expect(container.querySelectorAll('.da-character-card-stat').length).toBe(2);

      // Update with empty stats
      const dataWithNoStats: CharacterData = {
        ...mockCharacterData,
        stats: [],
      };
      characterCard.setCharacterData(dataWithNoStats);

      // All stats should be cleared
      expect(container.querySelectorAll('.da-character-card-stat').length).toBe(0);
      expect(container.querySelectorAll('.da-character-card-stat-separator').length).toBe(0);
    });
  });

  // Task 7: Additional Component Tests
  describe('Task 7: Additional Tests', () => {
    it('should use textContent for XSS safety (avatar)', () => {
      characterCard.mount(container);
      const xssData: CharacterData = {
        ...mockCharacterData,
        avatar: '<script>alert("xss")</script>',
      };
      characterCard.setCharacterData(xssData);
      const avatar = container.querySelector('.da-character-card-avatar-emoji');
      // Should be escaped, not executed
      expect(avatar?.innerHTML).toContain('&lt;script&gt;');
    });

    it('should use textContent for XSS safety (name)', () => {
      characterCard.mount(container);
      const xssData: CharacterData = {
        ...mockCharacterData,
        name: '<img src=x onerror=alert("xss")>',
      };
      characterCard.setCharacterData(xssData);
      const name = container.querySelector('.da-character-card-name');
      // textContent escapes HTML
      expect(name?.innerHTML).toContain('&lt;img');
    });

    it('should use textContent for XSS safety (bio)', () => {
      characterCard.mount(container);
      const xssData: CharacterData = {
        ...mockCharacterData,
        bio: '<script>evil()</script>',
      };
      characterCard.setCharacterData(xssData);
      const bio = container.querySelector('.da-character-card-bio');
      expect(bio?.innerHTML).toContain('&lt;script&gt;');
    });

    it('should use textContent for XSS safety (stats)', () => {
      characterCard.mount(container);
      const xssData: CharacterData = {
        ...mockCharacterData,
        stats: [{ label: '<script>', value: '</script>' }],
      };
      characterCard.setCharacterData(xssData);
      const label = container.querySelector('.da-character-card-stat-label');
      const value = container.querySelector('.da-character-card-stat-value');
      expect(label?.innerHTML).toContain('&lt;script&gt;');
      expect(value?.innerHTML).toContain('&lt;/script&gt;');
    });

    it('should handle destroy() called multiple times', () => {
      characterCard.mount(container);
      characterCard.destroy();
      // Second destroy should not throw
      expect(() => characterCard.destroy()).not.toThrow();
    });

    it('should update display when data changes', () => {
      characterCard.mount(container);
      characterCard.setCharacterData(mockCharacterData);

      const newData: CharacterData = {
        avatar: '👨‍💻',
        name: 'Bob Smith',
        title: 'Engineer',
        bio: 'A new character.',
        stats: [{ label: 'Skill', value: 'Coding' }],
      };
      characterCard.setCharacterData(newData);

      const name = container.querySelector('.da-character-card-name');
      expect(name?.textContent).toBe('Bob Smith');
    });

    it('should have hidden class when hide() is called', () => {
      characterCard.mount(container);
      characterCard.hide();
      const element = characterCard.getElement();
      expect(element?.classList.contains('da-character-card--hidden')).toBe(true);
    });

    it('should remove hidden class when show() is called', () => {
      characterCard.mount(container);
      characterCard.hide();
      characterCard.show();
      const element = characterCard.getElement();
      expect(element?.classList.contains('da-character-card--hidden')).toBe(false);
    });
  });
});
