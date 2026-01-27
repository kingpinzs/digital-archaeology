// src/examples/ExampleLoader.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadExampleProgram, checkProgramExists } from './ExampleLoader';

describe('ExampleLoader', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  describe('loadExampleProgram', () => {
    it('should fetch program from correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('; test program'),
      });

      await loadExampleProgram('add.asm');

      expect(mockFetch).toHaveBeenCalledWith('/programs/add.asm');
    });

    it('should return program source code on success', async () => {
      const sourceCode = '; Add two numbers\nLDA NUM1\nADD NUM2\n';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(sourceCode),
      });

      const result = await loadExampleProgram('add.asm');

      expect(result).toBe(sourceCode);
    });

    it('should throw error on fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(loadExampleProgram('nonexistent.asm')).rejects.toThrow(
        'Failed to load example program: nonexistent.asm (404)'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(loadExampleProgram('add.asm')).rejects.toThrow('Network error');
    });
  });

  describe('checkProgramExists', () => {
    it('should return true for existing program', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const exists = await checkProgramExists('add.asm');

      expect(exists).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/programs/add.asm', { method: 'HEAD' });
    });

    it('should return false for non-existing program', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const exists = await checkProgramExists('nonexistent.asm');

      expect(exists).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const exists = await checkProgramExists('add.asm');

      expect(exists).toBe(false);
    });
  });
});
