// src/story/SceneSetting.test.ts
// Tests for SceneSetting component
// Story 10.6: Create Scene Setting Component

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SceneSetting } from './SceneSetting';
import type { SceneSettingData } from './types';

describe('SceneSetting', () => {
  let container: HTMLElement;
  let sceneSetting: SceneSetting;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    sceneSetting?.destroy();
    container.remove();
  });

  describe('Task 1: Component Class and Lifecycle', () => {
    it('should mount to a container element', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);

      const element = container.querySelector('.da-scene-setting');
      expect(element).not.toBeNull();
    });

    it('should use semantic <section> element', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);

      const element = container.querySelector('section.da-scene-setting');
      expect(element).not.toBeNull();
      expect(element?.tagName).toBe('SECTION');
    });

    it('should have aria-label for accessibility', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);

      const element = container.querySelector('.da-scene-setting');
      expect(element?.getAttribute('aria-label')).toBe('Scene setting');
    });

    it('should be visible by default', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);

      expect(sceneSetting.isVisible()).toBe(true);
    });

    it('should hide when hide() is called', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);
      sceneSetting.hide();

      expect(sceneSetting.isVisible()).toBe(false);
      const element = container.querySelector('.da-scene-setting');
      expect(element?.classList.contains('da-scene-setting--hidden')).toBe(true);
    });

    it('should show when show() is called', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);
      sceneSetting.hide();
      sceneSetting.show();

      expect(sceneSetting.isVisible()).toBe(true);
      const element = container.querySelector('.da-scene-setting');
      expect(element?.classList.contains('da-scene-setting--hidden')).toBe(false);
    });

    it('should return element via getElement()', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);

      const element = sceneSetting.getElement();
      expect(element).not.toBeNull();
      expect(element?.classList.contains('da-scene-setting')).toBe(true);
    });

    it('should return null from getElement() before mounting', () => {
      sceneSetting = new SceneSetting();
      expect(sceneSetting.getElement()).toBeNull();
    });

    it('should return false from isVisible() before mounting', () => {
      sceneSetting = new SceneSetting();
      expect(sceneSetting.isVisible()).toBe(false);
    });

    it('should remove element from DOM on destroy', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);
      expect(container.querySelector('.da-scene-setting')).not.toBeNull();

      sceneSetting.destroy();
      expect(container.querySelector('.da-scene-setting')).toBeNull();
    });

    it('should return null from getElement() after destroy', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);
      sceneSetting.destroy();

      expect(sceneSetting.getElement()).toBeNull();
    });
  });

  describe('Task 2: Render Method', () => {
    it('should render "Setting" label element', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);

      const label = container.querySelector('.da-scene-setting-label');
      expect(label).not.toBeNull();
      expect(label?.textContent).toBe('Setting');
    });

    it('should use <span> element for label', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);

      const label = container.querySelector('span.da-scene-setting-label');
      expect(label).not.toBeNull();
      expect(label?.tagName).toBe('SPAN');
    });

    it('should render content wrapper element', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);

      const content = container.querySelector('.da-scene-setting-content');
      expect(content).not.toBeNull();
    });

    it('should use <div> element for content wrapper', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);

      const content = container.querySelector('div.da-scene-setting-content');
      expect(content).not.toBeNull();
      expect(content?.tagName).toBe('DIV');
    });

    it('should render text element', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);

      const text = container.querySelector('.da-scene-setting-text');
      expect(text).not.toBeNull();
    });

    it('should render text with default placeholder value', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);

      const text = container.querySelector('.da-scene-setting-text');
      expect(text?.textContent).toBe('The scene setting will appear here...');
    });

    it('should use <p> element for text content', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);

      const text = container.querySelector('p.da-scene-setting-text');
      expect(text).not.toBeNull();
      expect(text?.tagName).toBe('P');
    });
  });

  describe('Task 3: SceneSettingData Interface', () => {
    it('should accept SceneSettingData with text field', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);

      const data: SceneSettingData = {
        text: 'A dimly lit laboratory filled with blinking equipment.',
      };

      // Should not throw - interface is correctly typed
      sceneSetting.setSettingData(data);

      const text = container.querySelector('.da-scene-setting-text');
      expect(text?.textContent).toBe(data.text);
    });
  });

  describe('Task 4: setSettingData() Method', () => {
    it('should update text when setSettingData is called', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);

      const settingData: SceneSettingData = {
        text: 'The fluorescent lights hum overhead in the cramped office.',
      };

      sceneSetting.setSettingData(settingData);

      const text = container.querySelector('.da-scene-setting-text');
      expect(text?.textContent).toBe(
        'The fluorescent lights hum overhead in the cramped office.'
      );
    });

    it('should handle consecutive setSettingData calls', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);

      // First update
      sceneSetting.setSettingData({
        text: 'First setting description.',
      });

      // Second update (should replace first)
      sceneSetting.setSettingData({
        text: 'Second setting description.',
      });

      const text = container.querySelector('.da-scene-setting-text');
      expect(text?.textContent).toBe('Second setting description.');
    });

    it('should handle setSettingData called before mount', () => {
      sceneSetting = new SceneSetting();

      // Call setSettingData before mount - should not throw
      sceneSetting.setSettingData({
        text: 'Pre-mount setting data.',
      });

      // Now mount - should show default values since elements weren't cached yet
      sceneSetting.mount(container);

      const text = container.querySelector('.da-scene-setting-text');
      // Default values are shown because setSettingData was called before mount
      expect(text?.textContent).toBe('The scene setting will appear here...');
    });

    it('should handle empty text gracefully', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);

      sceneSetting.setSettingData({
        text: '',
      });

      const text = container.querySelector('.da-scene-setting-text');
      expect(text?.textContent).toBe('');
    });

    it('should preserve whitespace in setting text', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);

      const multilineText = `The sun sets over the valley.
The birds return to their nests.
A new day awaits.`;

      sceneSetting.setSettingData({
        text: multilineText,
      });

      const text = container.querySelector('.da-scene-setting-text');
      expect(text?.textContent).toBe(multilineText);
    });
  });

  describe('Edge Cases', () => {
    it('should handle destroy() being called multiple times', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);

      // First destroy
      sceneSetting.destroy();
      expect(sceneSetting.getElement()).toBeNull();

      // Second destroy should not throw
      expect(() => sceneSetting.destroy()).not.toThrow();
      expect(sceneSetting.getElement()).toBeNull();
    });

    it('should have label with CSS class for uppercase styling', () => {
      sceneSetting = new SceneSetting();
      sceneSetting.mount(container);

      // Verify the label has the class that applies text-transform: uppercase in CSS
      const label = container.querySelector('.da-scene-setting-label');
      expect(label).not.toBeNull();
      expect(label?.classList.contains('da-scene-setting-label')).toBe(true);
      // Note: Actual uppercase transform is applied via CSS (text-transform: uppercase)
    });
  });
});
