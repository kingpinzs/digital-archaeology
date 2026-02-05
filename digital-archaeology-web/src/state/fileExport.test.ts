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

  beforeEach(() => {
    // Create a mock anchor element
    mockAnchor = document.createElement('a');
    vi.spyOn(mockAnchor, 'click').mockImplementation(() => {});
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);

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

    // Verify Blob content
    const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBe('LDA 0x10\nADD 0x05\nHLT'.length);
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

    // Verify Blob was created and download was triggered
    const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/plain;charset=utf-8');
    // Blob size matches UTF-8 byte length (ASCII chars = 1 byte each)
    expect(blob.size).toBe(content.length);
    expect(mockAnchor.click).toHaveBeenCalled();
  });

  it('should handle empty string content', () => {
    downloadTextFile('', 'empty.asm');

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  it('should accept any filename', () => {
    downloadTextFile('code', 'my-program.asm');
    expect(mockAnchor.download).toBe('my-program.asm');
  });
});
