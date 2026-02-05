// File import utility for reading text files from the user's device (Story 9.6)

/**
 * Open a file picker and read the selected text file.
 *
 * Creates a hidden file input, triggers the native file picker dialog,
 * and reads the selected file as text. Cleanup (DOM removal) is guaranteed
 * via try/finally in the change handler and in the cancel handler.
 *
 * @param accept - File types to accept (e.g., '.asm,.txt'). Default: '.asm,.txt'
 * @returns Promise resolving to { content, filename } on selection, or null if cancelled
 */
export function readTextFile(
  accept: string = '.asm,.txt',
): Promise<{ content: string; filename: string } | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';

    const cleanup = () => {
      document.body.removeChild(input);
    };

    input.addEventListener('change', async () => {
      try {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const content = await file.text();
        resolve({ content, filename: file.name });
      } catch (error) {
        reject(error);
      } finally {
        cleanup();
      }
    });

    input.addEventListener('cancel', () => {
      try {
        cleanup();
      } finally {
        resolve(null);
      }
    });

    document.body.appendChild(input);
    input.click();
  });
}
