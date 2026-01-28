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

    it('should preserve comment lines in loaded program (Story 8.4)', async () => {
      // Simulate a program with various comment styles
      const programWithComments = `; Program header comment
; Multiple lines of comments
        ORG 0x00            ; Inline comment after directive

START:  LDA NUM1            ; Load first number
        ADD NUM2            ; Add second number
        STA RESULT          ; Store result
        HLT                 ; Halt execution

; Data section comment
        ORG 0x20            ; Data starts here
NUM1:   DB  5               ; First number = 5
NUM2:   DB  3               ; Second number = 3
RESULT: DB  0               ; Result stored here
`;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(programWithComments),
      });

      const result = await loadExampleProgram('test.asm');

      // Verify all comment lines are preserved
      expect(result).toContain('; Program header comment');
      expect(result).toContain('; Multiple lines of comments');
      expect(result).toContain('; Inline comment after directive');
      expect(result).toContain('; Load first number');
      expect(result).toContain('; Data section comment');
      expect(result).toContain('; First number = 5');
    });

    it('should not strip or modify comment content (Story 8.4)', async () => {
      // Test that comments are returned exactly as stored, not modified
      const exactContent = '; This is a comment with special chars: @#$%^&*\n';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(exactContent),
      });

      const result = await loadExampleProgram('special.asm');

      // Exact match - no stripping or modification
      expect(result).toBe(exactContent);
    });

    it('should handle program containing only comments (Story 8.4)', async () => {
      // Edge case: program with only comments and no instructions
      const commentsOnly = `; Header comment
; This file contains only comments
; No actual instructions
; Just documentation
`;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(commentsOnly),
      });

      const result = await loadExampleProgram('comments-only.asm');

      // All comment lines preserved exactly
      expect(result).toBe(commentsOnly);
      expect(result.split('\n').filter((line) => line.startsWith(';')).length).toBe(4);
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
