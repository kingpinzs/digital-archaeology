// src/state/fileExport.test.ts
// Unit tests for file export utilities (Story 9.4)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadTextFile } from './fileExport';

describe('downloadTextFile', () => {
  let mockAnchor: HTMLAnchorElement;
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let capturedBlobContent: string | null;

  beforeEach(() => {
    capturedBlobContent = null;

    // Create a mock anchor element
    mockAnchor = document.createElement('a');
    vi.spyOn(mockAnchor, 'click').mockImplementation(() => {});

    // L1 fix: Only intercept createElement('a'), pass through all others
    const originalCreateElement = document.createElement.bind(document);
    createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(
      (tagName: string, options?: ElementCreationOptions) => {
        if (tagName === 'a') return mockAnchor as unknown as HTMLElement;
        return originalCreateElement(tagName, options);
      },
    );

    // L3 fix: Intercept Blob constructor to capture content for verification
    const OriginalBlob = globalThis.Blob;
    vi.spyOn(globalThis, 'Blob').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function (parts?: BlobPart[], options?: BlobPropertyBag): any {
        const blob = new OriginalBlob(parts, options);
        // Extract string content from the first part for verification
        if (parts && parts.length > 0 && typeof parts[0] === 'string') {
          capturedBlobContent = parts[0];
        }
        return blob;
      } as unknown as typeof Blob,
    );

    // Mock URL APIs
    mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    mockRevokeObjectURL = vi.fn();
    globalThis.URL.createObjectURL = mockCreateObjectURL as unknown as typeof URL.createObjectURL;
    globalThis.URL.revokeObjectURL = mockRevokeObjectURL as unknown as typeof URL.revokeObjectURL;

    // Spy on body append/remove
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockReturnValue(mockAnchor);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockReturnValue(mockAnchor);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a Blob with the correct content and MIME type', () => {
    downloadTextFile('LDA 0x10\nADD 0x05\nHLT', 'program.asm');

    expect(mockCreateObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'text/plain;charset=utf-8',
      }),
    );

    // L3 fix: Verify actual Blob content via constructor interception
    expect(capturedBlobContent).toBe('LDA 0x10\nADD 0x05\nHLT');
  });

  it('should only create an anchor element', () => {
    downloadTextFile('code', 'test.asm');

    // L1: Verify createElement was called specifically with 'a'
    expect(createElementSpy).toHaveBeenCalledWith('a');
  });

  it('should set the anchor download attribute to the given filename', () => {
    downloadTextFile('some code', 'program.asm');

    expect(mockAnchor.download).toBe('program.asm');
    expect(mockAnchor.href).toBe('blob:mock-url');
  });

  it('should append anchor to body, click it, then remove it', () => {
    downloadTextFile('code', 'test.asm');

    expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor);
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor);
  });

  it('should call URL.revokeObjectURL after download', () => {
    downloadTextFile('code', 'file.asm');

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should preserve exact content including multi-line and special characters', () => {
    const content = '; Comment with special chars: <>&"\nLDA 0xFF\nHLT';
    downloadTextFile(content, 'special.asm');

    // L3 fix: Verify actual string content preserved exactly
    expect(capturedBlobContent).toBe(content);
    expect(mockAnchor.click).toHaveBeenCalled();
  });

  it('should handle empty string content', () => {
    downloadTextFile('', 'empty.asm');

    expect(capturedBlobContent).toBe('');
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  it('should accept any filename', () => {
    downloadTextFile('code', 'my-program.asm');
    expect(mockAnchor.download).toBe('my-program.asm');
  });

  // L4 fix: Error scenario — cleanup still happens if click() throws
  it('should still cleanup anchor and revoke URL if click() throws', () => {
    vi.spyOn(mockAnchor, 'click').mockImplementation(() => {
      throw new Error('Browser blocked download');
    });

    expect(() => downloadTextFile('code', 'test.asm')).toThrow('Browser blocked download');

    // try/finally ensures cleanup even on error
    expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
