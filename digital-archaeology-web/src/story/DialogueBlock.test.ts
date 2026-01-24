// src/story/DialogueBlock.test.ts
// Tests for DialogueBlock component
// Story 10.8: Create Dialogue Block Component

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DialogueBlock } from './DialogueBlock';
import type { DialogueData } from './types';

describe('DialogueBlock', () => {
  let container: HTMLElement;
  let dialogueBlock: DialogueBlock;

  const mockDialogueData: DialogueData = {
    speaker: 'Dr. Chen',
    text: 'Welcome to Fairchild. I see you\'ve been assigned to my team. The 74181 project is behind schedule, and we need fresh perspective.',
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    dialogueBlock = new DialogueBlock();
  });

  afterEach(() => {
    dialogueBlock.destroy();
    container.remove();
  });

  // Task 1: Create DialogueData Interface
  describe('Task 1: DialogueData Interface', () => {
    it('should accept DialogueData with all required fields', () => {
      const data: DialogueData = {
        speaker: 'Test Speaker',
        text: 'Test dialogue text.',
      };
      expect(data.speaker).toBe('Test Speaker');
      expect(data.text).toBe('Test dialogue text.');
    });
  });

  // Task 2: Create DialogueBlock Component Class
  describe('Task 2: Component Class', () => {
    it('should mount correctly', () => {
      dialogueBlock.mount(container);
      expect(container.children.length).toBe(1);
    });

    it('should have getElement() accessor', () => {
      expect(dialogueBlock.getElement()).toBeNull();
      dialogueBlock.mount(container);
      expect(dialogueBlock.getElement()).not.toBeNull();
    });

    it('should have show/hide visibility methods', () => {
      dialogueBlock.mount(container);
      expect(dialogueBlock.isVisible()).toBe(true);
      dialogueBlock.hide();
      expect(dialogueBlock.isVisible()).toBe(false);
      dialogueBlock.show();
      expect(dialogueBlock.isVisible()).toBe(true);
    });

    it('should destroy and cleanup', () => {
      dialogueBlock.mount(container);
      expect(container.children.length).toBe(1);
      dialogueBlock.destroy();
      expect(container.children.length).toBe(0);
      expect(dialogueBlock.getElement()).toBeNull();
    });
  });

  // Task 3: Implement render() Method
  describe('Task 3: render() Method', () => {
    it('should render <blockquote> element with correct class', () => {
      dialogueBlock.mount(container);
      const element = dialogueBlock.getElement();
      expect(element?.tagName).toBe('BLOCKQUOTE');
      expect(element?.classList.contains('da-dialogue-block')).toBe(true);
    });

    it('should have aria-label for accessibility', () => {
      dialogueBlock.mount(container);
      const element = dialogueBlock.getElement();
      expect(element?.getAttribute('aria-label')).toBe('Character dialogue');
    });

    it('should render speaker with <cite> element', () => {
      dialogueBlock.mount(container);
      const speaker = container.querySelector('.da-dialogue-block-speaker');
      expect(speaker).not.toBeNull();
      expect(speaker?.tagName).toBe('CITE');
    });

    it('should render text with <p> element', () => {
      dialogueBlock.mount(container);
      const text = container.querySelector('.da-dialogue-block-text');
      expect(text).not.toBeNull();
      expect(text?.tagName).toBe('P');
    });
  });

  // Task 4: Implement setDialogueData() Method
  describe('Task 4: setDialogueData() Method', () => {
    it('should update speaker content', () => {
      dialogueBlock.mount(container);
      dialogueBlock.setDialogueData(mockDialogueData);
      const speaker = container.querySelector('.da-dialogue-block-speaker');
      expect(speaker?.textContent).toBe('Dr. Chen');
    });

    it('should update text content', () => {
      dialogueBlock.mount(container);
      dialogueBlock.setDialogueData(mockDialogueData);
      const text = container.querySelector('.da-dialogue-block-text');
      expect(text?.textContent).toContain('Welcome to Fairchild');
    });

    it('should handle setDialogueData before mount (no throw)', () => {
      expect(() => {
        dialogueBlock.setDialogueData(mockDialogueData);
      }).not.toThrow();
    });

    it('should display data set before mount after mounting', () => {
      dialogueBlock.setDialogueData(mockDialogueData);
      dialogueBlock.mount(container);
      const speaker = container.querySelector('.da-dialogue-block-speaker');
      expect(speaker?.textContent).toBe('Dr. Chen');
      const text = container.querySelector('.da-dialogue-block-text');
      expect(text?.textContent).toContain('Welcome to Fairchild');
    });

    it('should update display when data changes', () => {
      dialogueBlock.mount(container);
      dialogueBlock.setDialogueData(mockDialogueData);

      const newData: DialogueData = {
        speaker: 'Bob Smith',
        text: 'New dialogue text.',
      };
      dialogueBlock.setDialogueData(newData);

      const speaker = container.querySelector('.da-dialogue-block-speaker');
      expect(speaker?.textContent).toBe('Bob Smith');
      const text = container.querySelector('.da-dialogue-block-text');
      expect(text?.textContent).toBe('New dialogue text.');
    });
  });

  // Task 5: CSS Styling (verified visually/manually - no unit tests needed)
  // CSS classes tested implicitly through render() tests above

  // Task 6: Additional Component Tests
  describe('Task 6: Additional Tests', () => {
    it('should return false for isVisible() before mount', () => {
      // Edge case: isVisible() called before component is mounted
      expect(dialogueBlock.isVisible()).toBe(false);
    });

    it('should preserve component state when data is updated multiple times', () => {
      // Task 6.14: Test data update preserves component after remounting data
      dialogueBlock.mount(container);

      // Set initial data
      dialogueBlock.setDialogueData(mockDialogueData);

      // Update data multiple times
      dialogueBlock.setDialogueData({ speaker: 'First Update', text: 'Text 1' });
      dialogueBlock.setDialogueData({ speaker: 'Second Update', text: 'Text 2' });
      dialogueBlock.setDialogueData({ speaker: 'Third Update', text: 'Text 3' });

      // Verify component still works correctly
      const speaker = container.querySelector('.da-dialogue-block-speaker');
      const text = container.querySelector('.da-dialogue-block-text');
      expect(speaker?.textContent).toBe('Third Update');
      expect(text?.textContent).toBe('Text 3');

      // Verify element still exists and is properly structured
      expect(dialogueBlock.getElement()?.tagName).toBe('BLOCKQUOTE');
      expect(dialogueBlock.isVisible()).toBe(true);
    });
    it('should use textContent for XSS safety (speaker)', () => {
      dialogueBlock.mount(container);
      const xssData: DialogueData = {
        speaker: '<script>alert("xss")</script>',
        text: 'Normal text',
      };
      dialogueBlock.setDialogueData(xssData);
      const speaker = container.querySelector('.da-dialogue-block-speaker');
      expect(speaker?.innerHTML).toContain('&lt;script&gt;');
    });

    it('should use textContent for XSS safety (text)', () => {
      dialogueBlock.mount(container);
      const xssData: DialogueData = {
        speaker: 'Normal Speaker',
        text: '<img src=x onerror=alert("xss")>',
      };
      dialogueBlock.setDialogueData(xssData);
      const text = container.querySelector('.da-dialogue-block-text');
      expect(text?.innerHTML).toContain('&lt;img');
    });

    it('should handle destroy() called multiple times', () => {
      dialogueBlock.mount(container);
      dialogueBlock.destroy();
      expect(() => dialogueBlock.destroy()).not.toThrow();
    });

    it('should have hidden class when hide() is called', () => {
      dialogueBlock.mount(container);
      dialogueBlock.hide();
      const element = dialogueBlock.getElement();
      expect(element?.classList.contains('da-dialogue-block--hidden')).toBe(true);
    });

    it('should remove hidden class when show() is called', () => {
      dialogueBlock.mount(container);
      dialogueBlock.hide();
      dialogueBlock.show();
      const element = dialogueBlock.getElement();
      expect(element?.classList.contains('da-dialogue-block--hidden')).toBe(false);
    });
  });
});
