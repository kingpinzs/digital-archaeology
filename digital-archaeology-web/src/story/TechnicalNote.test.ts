// src/story/TechnicalNote.test.ts
// Tests for TechnicalNote component
// Story 10.10: Create Technical Note Component

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TechnicalNote } from './TechnicalNote';
import type { TechnicalNoteData } from './types';

describe('TechnicalNote', () => {
  let container: HTMLElement;
  let technicalNote: TechnicalNote;

  const mockNoteData: TechnicalNoteData = {
    content: 'The carry look-ahead adder predicts carry bits in parallel, eliminating the ripple delay.',
    codeSnippet: 'C[i] = G[i] OR (P[i] AND C[i-1])',
  };

  const mockNoteDataWithoutCode: TechnicalNoteData = {
    content: 'A ripple-carry adder propagates carries sequentially through each bit position.',
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    technicalNote = new TechnicalNote();
  });

  afterEach(() => {
    technicalNote.destroy();
    container.remove();
  });

  // Task 1: TechnicalNoteData Interface
  describe('Task 1: TechnicalNoteData Interface', () => {
    it('should accept TechnicalNoteData with all fields', () => {
      const data: TechnicalNoteData = {
        content: 'Test content',
        codeSnippet: 'const x = 1;',
      };
      expect(data.content).toBe('Test content');
      expect(data.codeSnippet).toBe('const x = 1;');
    });

    it('should accept TechnicalNoteData without optional codeSnippet', () => {
      const data: TechnicalNoteData = {
        content: 'Test content only',
      };
      expect(data.content).toBe('Test content only');
      expect(data.codeSnippet).toBeUndefined();
    });
  });

  // Task 2: Component Class
  describe('Task 2: Component Class', () => {
    it('should mount correctly', () => {
      technicalNote.mount(container);
      expect(container.children.length).toBe(1);
    });

    it('should have getElement() accessor', () => {
      expect(technicalNote.getElement()).toBeNull();
      technicalNote.mount(container);
      expect(technicalNote.getElement()).not.toBeNull();
    });

    it('should have show/hide visibility methods', () => {
      technicalNote.mount(container);
      expect(technicalNote.isVisible()).toBe(true);
      technicalNote.hide();
      expect(technicalNote.isVisible()).toBe(false);
      technicalNote.show();
      expect(technicalNote.isVisible()).toBe(true);
    });

    it('should return false for isVisible() before mount', () => {
      expect(technicalNote.isVisible()).toBe(false);
    });

    it('should destroy and cleanup', () => {
      technicalNote.mount(container);
      expect(container.children.length).toBe(1);
      technicalNote.destroy();
      expect(container.children.length).toBe(0);
      expect(technicalNote.getElement()).toBeNull();
    });
  });

  // Task 3: render() Method
  describe('Task 3: render() Method', () => {
    it('should render <aside> element with correct class', () => {
      technicalNote.mount(container);
      const element = technicalNote.getElement();
      expect(element?.tagName).toBe('ASIDE');
      expect(element?.classList.contains('da-technical-note')).toBe(true);
    });

    it('should have role="note" for accessibility', () => {
      technicalNote.mount(container);
      const element = technicalNote.getElement();
      expect(element?.getAttribute('role')).toBe('note');
    });

    it('should have aria-label for accessibility', () => {
      technicalNote.mount(container);
      const element = technicalNote.getElement();
      expect(element?.getAttribute('aria-label')).toBe('Technical note');
    });

    it('should render label with "Technical Note" text', () => {
      technicalNote.mount(container);
      const label = container.querySelector('.da-technical-note-label');
      expect(label).not.toBeNull();
      expect(label?.tagName).toBe('SPAN');
      expect(label?.textContent).toBe('Technical Note');
    });

    it('should render content element', () => {
      technicalNote.mount(container);
      const content = container.querySelector('.da-technical-note-content');
      expect(content).not.toBeNull();
      expect(content?.tagName).toBe('P');
    });

    it('should render code element', () => {
      technicalNote.mount(container);
      const code = container.querySelector('.da-technical-note-code');
      expect(code).not.toBeNull();
      expect(code?.tagName).toBe('CODE');
    });

    it('should hide code element by default (no data set)', () => {
      technicalNote.mount(container);
      const code = container.querySelector('.da-technical-note-code') as HTMLElement;
      expect(code?.style.display).toBe('none');
    });
  });

  // Task 4: setNoteData() Method
  describe('Task 4: setNoteData() Method', () => {
    it('should update content text', () => {
      technicalNote.mount(container);
      technicalNote.setNoteData(mockNoteData);
      const content = container.querySelector('.da-technical-note-content');
      expect(content?.textContent).toContain('carry look-ahead');
    });

    it('should update code when codeSnippet is provided', () => {
      technicalNote.mount(container);
      technicalNote.setNoteData(mockNoteData);
      const code = container.querySelector('.da-technical-note-code') as HTMLElement;
      expect(code?.textContent).toBe('C[i] = G[i] OR (P[i] AND C[i-1])');
      expect(code?.style.display).toBe('');
    });

    it('should hide code element when codeSnippet is not provided', () => {
      technicalNote.mount(container);
      technicalNote.setNoteData(mockNoteDataWithoutCode);
      const code = container.querySelector('.da-technical-note-code') as HTMLElement;
      expect(code?.style.display).toBe('none');
    });

    it('should show code then hide when data changes', () => {
      technicalNote.mount(container);
      technicalNote.setNoteData(mockNoteData);
      const code = container.querySelector('.da-technical-note-code') as HTMLElement;
      expect(code?.style.display).toBe('');

      technicalNote.setNoteData(mockNoteDataWithoutCode);
      expect(code?.style.display).toBe('none');
    });

    it('should handle setNoteData before mount (no throw)', () => {
      expect(() => {
        technicalNote.setNoteData(mockNoteData);
      }).not.toThrow();
    });

    it('should display data set before mount after mounting', () => {
      technicalNote.setNoteData(mockNoteData);
      technicalNote.mount(container);
      const content = container.querySelector('.da-technical-note-content');
      expect(content?.textContent).toContain('carry look-ahead');
      const code = container.querySelector('.da-technical-note-code') as HTMLElement;
      expect(code?.textContent).toBe('C[i] = G[i] OR (P[i] AND C[i-1])');
    });

    it('should update display when data changes', () => {
      technicalNote.mount(container);
      technicalNote.setNoteData(mockNoteData);

      const newData: TechnicalNoteData = {
        content: 'New technical explanation.',
        codeSnippet: 'new_code();',
      };
      technicalNote.setNoteData(newData);

      const content = container.querySelector('.da-technical-note-content');
      expect(content?.textContent).toBe('New technical explanation.');
      const code = container.querySelector('.da-technical-note-code');
      expect(code?.textContent).toBe('new_code();');
    });

    it('should preserve component state when data is updated multiple times', () => {
      technicalNote.mount(container);

      technicalNote.setNoteData(mockNoteData);
      technicalNote.setNoteData({ content: 'Second update' });
      technicalNote.setNoteData({ content: 'Third update', codeSnippet: 'code3()' });

      const content = container.querySelector('.da-technical-note-content');
      expect(content?.textContent).toBe('Third update');
      expect(technicalNote.getElement()?.tagName).toBe('ASIDE');
      expect(technicalNote.isVisible()).toBe(true);
    });
  });

  // Task 5: CSS Classes
  describe('Task 5: CSS Classes', () => {
    it('should have hidden class when hide() is called', () => {
      technicalNote.mount(container);
      technicalNote.hide();
      const element = technicalNote.getElement();
      expect(element?.classList.contains('da-technical-note--hidden')).toBe(true);
    });

    it('should remove hidden class when show() is called', () => {
      technicalNote.mount(container);
      technicalNote.hide();
      technicalNote.show();
      const element = technicalNote.getElement();
      expect(element?.classList.contains('da-technical-note--hidden')).toBe(false);
    });
  });

  // Task 6: Additional Tests
  describe('Task 6: Additional Tests', () => {
    it('should use textContent for XSS safety (content)', () => {
      technicalNote.mount(container);
      const xssData: TechnicalNoteData = {
        content: '<script>alert("xss")</script>',
      };
      technicalNote.setNoteData(xssData);
      const content = container.querySelector('.da-technical-note-content');
      expect(content?.innerHTML).toContain('&lt;script&gt;');
    });

    it('should use textContent for XSS safety (code)', () => {
      technicalNote.mount(container);
      const xssData: TechnicalNoteData = {
        content: 'Normal content',
        codeSnippet: '<img src=x onerror=alert("xss")>',
      };
      technicalNote.setNoteData(xssData);
      const code = container.querySelector('.da-technical-note-code');
      expect(code?.innerHTML).toContain('&lt;img');
    });

    it('should handle destroy() called multiple times', () => {
      technicalNote.mount(container);
      technicalNote.destroy();
      expect(() => technicalNote.destroy()).not.toThrow();
    });

    it('should be accessible with semantic aside element', () => {
      technicalNote.mount(container);
      const element = technicalNote.getElement();

      // Verify semantic element
      expect(element?.tagName).toBe('ASIDE');
      expect(element?.getAttribute('role')).toBe('note');
      expect(element?.getAttribute('aria-label')).toBe('Technical note');
    });
  });
});
