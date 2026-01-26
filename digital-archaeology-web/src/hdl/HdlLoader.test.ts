// src/hdl/HdlLoader.test.ts
// Tests for HdlLoader utility
// Story 7.1: Create HDL Viewer Panel - Task 2

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadHdlFile, HdlLoader, DEFAULT_HDL_PATH } from './HdlLoader';

describe('HdlLoader', () => {
  // Mock fetch
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('loadHdlFile', () => {
    it('should return success state when fetch succeeds', async () => {
      const mockContent = '# HDL content\nwire test;';
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockContent),
      } as Response);

      const result = await loadHdlFile('test.m4hdl');

      expect(result.state).toBe('success');
      expect(result.content).toBe(mockContent);
      expect(result.error).toBeNull();
    });

    it('should return error state when fetch fails with non-ok status', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await loadHdlFile('nonexistent.m4hdl');

      expect(result.state).toBe('error');
      expect(result.content).toBeNull();
      expect(result.error).toContain('404');
      expect(result.error).toContain('Not Found');
    });

    it('should return error state when fetch throws', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await loadHdlFile('test.m4hdl');

      expect(result.state).toBe('error');
      expect(result.content).toBeNull();
      expect(result.error).toContain('Network error');
    });

    it('should use default path when none provided', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('content'),
      } as Response);

      await loadHdlFile();

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining(DEFAULT_HDL_PATH));
    });

    it('should prepend BASE_URL to path', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('content'),
      } as Response);

      await loadHdlFile('custom/path.m4hdl');

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('custom/path.m4hdl'));
    });
  });

  describe('HdlLoader class', () => {
    it('should initialize with idle state', () => {
      const loader = new HdlLoader();

      expect(loader.getState()).toBe('idle');
      expect(loader.getContent()).toBeNull();
      expect(loader.getError()).toBeNull();
    });

    it('should use default path when none provided', () => {
      const loader = new HdlLoader();

      expect(loader.getPath()).toBe(DEFAULT_HDL_PATH);
    });

    it('should use custom path when provided', () => {
      const loader = new HdlLoader('custom/file.m4hdl');

      expect(loader.getPath()).toBe('custom/file.m4hdl');
    });

    it('should update state to loading during load', async () => {
      const loader = new HdlLoader();
      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  text: () => Promise.resolve('content'),
                } as Response),
              10
            );
          })
      );

      const loadPromise = loader.load();
      // State should be loading immediately after call
      expect(loader.getState()).toBe('loading');

      await loadPromise;
    });

    it('should update state to success after successful load', async () => {
      const mockContent = '# HDL content';
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockContent),
      } as Response);

      const loader = new HdlLoader();
      await loader.load();

      expect(loader.getState()).toBe('success');
      expect(loader.getContent()).toBe(mockContent);
      expect(loader.getError()).toBeNull();
    });

    it('should update state to error after failed load', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      } as Response);

      const loader = new HdlLoader();
      await loader.load();

      expect(loader.getState()).toBe('error');
      expect(loader.getContent()).toBeNull();
      expect(loader.getError()).toContain('500');
    });

    it('should reset to idle state', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('content'),
      } as Response);

      const loader = new HdlLoader();
      await loader.load();
      loader.reset();

      expect(loader.getState()).toBe('idle');
      expect(loader.getContent()).toBeNull();
      expect(loader.getError()).toBeNull();
    });

    it('should allow changing path', () => {
      const loader = new HdlLoader('old/path.m4hdl');
      loader.setPath('new/path.m4hdl');

      expect(loader.getPath()).toBe('new/path.m4hdl');
    });
  });
});
