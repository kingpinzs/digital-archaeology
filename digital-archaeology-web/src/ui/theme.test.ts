import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setTheme, getTheme, toggleTheme, initTheme, type ThemeMode } from './theme';

describe('Theme System', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    // Reset DOM
    document.documentElement.className = '';
    // Reset localStorage mock
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    // Replace global localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  describe('setTheme', () => {
    it('should add lab-mode class to html element', () => {
      setTheme('lab');
      expect(document.documentElement.classList.contains('lab-mode')).toBe(true);
      expect(document.documentElement.classList.contains('story-mode')).toBe(false);
    });

    it('should add story-mode class to html element', () => {
      setTheme('story');
      expect(document.documentElement.classList.contains('story-mode')).toBe(true);
      expect(document.documentElement.classList.contains('lab-mode')).toBe(false);
    });

    it('should remove previous theme class when switching', () => {
      setTheme('lab');
      expect(document.documentElement.classList.contains('lab-mode')).toBe(true);

      setTheme('story');
      expect(document.documentElement.classList.contains('story-mode')).toBe(true);
      expect(document.documentElement.classList.contains('lab-mode')).toBe(false);
    });

    it('should persist theme to localStorage', () => {
      setTheme('story');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('da-theme', 'story');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw
      expect(() => setTheme('lab')).not.toThrow();
      expect(document.documentElement.classList.contains('lab-mode')).toBe(true);
    });
  });

  describe('getTheme', () => {
    it('should return lab as default when no theme is set', () => {
      expect(getTheme()).toBe('lab');
    });

    it('should return theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValueOnce('story');
      expect(getTheme()).toBe('story');
    });

    it('should return lab from localStorage', () => {
      localStorageMock.getItem.mockReturnValueOnce('lab');
      expect(getTheme()).toBe('lab');
    });

    it('should fallback to checking HTML class when localStorage returns invalid value', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid');
      document.documentElement.classList.add('story-mode');
      expect(getTheme()).toBe('story');
    });

    it('should fallback to lab when localStorage throws', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('SecurityError');
      });
      expect(getTheme()).toBe('lab');
    });

    it('should detect story-mode from HTML class', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);
      document.documentElement.classList.add('story-mode');
      expect(getTheme()).toBe('story');
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from lab to story', () => {
      setTheme('lab');
      const result = toggleTheme();
      expect(result).toBe('story');
      expect(document.documentElement.classList.contains('story-mode')).toBe(true);
    });

    it('should toggle from story to lab', () => {
      setTheme('story');
      const result = toggleTheme();
      expect(result).toBe('lab');
      expect(document.documentElement.classList.contains('lab-mode')).toBe(true);
    });

    it('should return the new theme mode', () => {
      setTheme('lab');
      expect(toggleTheme()).toBe('story');
      expect(toggleTheme()).toBe('lab');
    });
  });

  describe('initTheme', () => {
    it('should initialize with stored theme preference', () => {
      localStorageMock.getItem.mockReturnValueOnce('story');
      const result = initTheme();
      expect(result).toBe('story');
      expect(document.documentElement.classList.contains('story-mode')).toBe(true);
    });

    it('should initialize with lab mode when no preference stored', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);
      const result = initTheme();
      expect(result).toBe('lab');
      expect(document.documentElement.classList.contains('lab-mode')).toBe(true);
    });

    it('should apply theme class to html element', () => {
      initTheme();
      const hasThemeClass =
        document.documentElement.classList.contains('lab-mode') ||
        document.documentElement.classList.contains('story-mode');
      expect(hasThemeClass).toBe(true);
    });
  });

  describe('ThemeMode type', () => {
    it('should only accept valid theme modes', () => {
      // TypeScript compile-time check - these should work
      const validModes: ThemeMode[] = ['lab', 'story'];
      validModes.forEach((mode) => {
        expect(() => setTheme(mode)).not.toThrow();
      });
    });
  });
});
