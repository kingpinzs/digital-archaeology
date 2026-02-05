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

/**
 * Download a binary file to the user's device.
 *
 * Creates a Blob from the Uint8Array data with application/octet-stream MIME type,
 * generates a temporary object URL, and triggers a download via a hidden anchor element.
 * Cleanup (DOM removal, URL revocation) is guaranteed via try/finally.
 *
 * @param data - The binary data to download
 * @param filename - The default filename for the download
 */
export function downloadBinaryFile(data: Uint8Array, filename: string): void {
  // TS 5.7+: Uint8Array<ArrayBufferLike> is not assignable to BlobPart which requires ArrayBuffer
  const blob = new Blob([data as Uint8Array<ArrayBuffer>], { type: 'application/octet-stream' });
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
