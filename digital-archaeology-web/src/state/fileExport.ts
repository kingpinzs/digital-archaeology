// src/state/fileExport.ts
// File export utilities for downloading text and binary files

/**
 * Download a text file to the user's device.
 *
 * Creates a Blob from the content, generates a temporary object URL,
 * and triggers a download via a hidden anchor element.
 *
 * @param content - The text content to download
 * @param filename - The default filename for the download
 */
export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  try {
    a.click();
  } finally {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
