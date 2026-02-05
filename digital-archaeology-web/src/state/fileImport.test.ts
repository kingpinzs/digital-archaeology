// Story 9.6: Unit tests for file import utility

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readTextFile } from './fileImport';

describe('readTextFile', () => {
  let mockInput: HTMLInputElement;
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let changeHandler: (() => Promise<void>) | null;
  let cancelHandler: (() => void) | null;

  beforeEach(() => {
    changeHandler = null;
    cancelHandler = null;

    // Create a real input element so properties work
    mockInput = document.createElement('input');
    vi.spyOn(mockInput, 'click').mockImplementation(() => {});
    vi.spyOn(mockInput, 'addEventListener').mockImplementation(
      (event: string, handler: EventListenerOrEventListenerObject) => {
        if (event === 'change') changeHandler = handler as () => Promise<void>;
        if (event === 'cancel') cancelHandler = handler as () => void;
      },
    );

    // Only intercept createElement('input'), pass through all others
    const originalCreateElement = document.createElement.bind(document);
    createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(
      (tagName: string, options?: ElementCreationOptions) => {
        if (tagName === 'input') return mockInput;
        return originalCreateElement(tagName, options);
      },
    );

    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockReturnValue(mockInput);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockReturnValue(mockInput);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 5.1: Test creates file input with type='file' and correct accept attribute
  it('should create a file input with type="file" and correct accept attribute', () => {
    readTextFile('.asm,.txt');

    expect(createElementSpy).toHaveBeenCalledWith('input');
    expect(mockInput.type).toBe('file');
    expect(mockInput.accept).toBe('.asm,.txt');
    expect(mockInput.style.display).toBe('none');
    expect(appendChildSpy).toHaveBeenCalledWith(mockInput);
    expect(mockInput.click).toHaveBeenCalled();
  });

  // 5.2: Test returns { content, filename } when file is selected
  it('should resolve with content and filename when file is selected', async () => {
    // JSDOM File doesn't have .text(), use mock object
    const mockFile = {
      name: 'program.asm',
      text: vi.fn().mockResolvedValue('LDA 5\nHLT'),
    };

    const promise = readTextFile();

    // Simulate file selection
    Object.defineProperty(mockInput, 'files', {
      value: [mockFile],
      configurable: true,
    });

    // Trigger change handler
    expect(changeHandler).not.toBeNull();
    await changeHandler!();

    const result = await promise;
    expect(result).toEqual({ content: 'LDA 5\nHLT', filename: 'program.asm' });
  });

  // 5.3: Test returns null when cancel event fires
  it('should resolve with null when user cancels file picker', async () => {
    const promise = readTextFile();

    // Trigger cancel handler
    expect(cancelHandler).not.toBeNull();
    cancelHandler!();

    const result = await promise;
    expect(result).toBeNull();
  });

  // 5.4: Test removes input element from DOM after file selection
  it('should remove input from DOM after file selection', async () => {
    const mockFile = {
      name: 'test.asm',
      text: vi.fn().mockResolvedValue('test content'),
    };

    const promise = readTextFile();

    Object.defineProperty(mockInput, 'files', {
      value: [mockFile],
      configurable: true,
    });

    await changeHandler!();
    await promise;

    expect(removeChildSpy).toHaveBeenCalledWith(mockInput);
  });

  // 5.5: Test removes input element from DOM after cancel
  it('should remove input from DOM after cancel', async () => {
    const promise = readTextFile();

    cancelHandler!();
    await promise;

    expect(removeChildSpy).toHaveBeenCalledWith(mockInput);
  });

  // L2 fix: Test resolves null when change fires but files is empty
  it('should resolve with null when change fires with no files', async () => {
    const promise = readTextFile();

    // Simulate change event with empty FileList
    Object.defineProperty(mockInput, 'files', {
      value: [],
      configurable: true,
    });

    await changeHandler!();

    const result = await promise;
    expect(result).toBeNull();
    expect(removeChildSpy).toHaveBeenCalledWith(mockInput);
  });

  // 5.6: Test rejects promise when file.text() throws
  it('should reject when file.text() throws', async () => {
    const mockFile = {
      name: 'bad.asm',
      text: vi.fn().mockRejectedValue(new Error('Read failed')),
    };

    const promise = readTextFile();

    Object.defineProperty(mockInput, 'files', {
      value: [mockFile],
      configurable: true,
    });

    await changeHandler!();

    await expect(promise).rejects.toThrow('Read failed');
    // Cleanup still happens via finally
    expect(removeChildSpy).toHaveBeenCalledWith(mockInput);
  });
});
