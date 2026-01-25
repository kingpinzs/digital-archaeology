// src/utils/escapeHtml.ts
// XSS prevention utility for escaping HTML special characters

/**
 * Escape HTML special characters to prevent XSS attacks.
 * Use this for ANY user-provided or external content rendered as HTML.
 *
 * Safe alternatives:
 * - element.textContent = userInput; // No escaping needed, inherently safe
 *
 * @param text - Text to escape
 * @returns Escaped text safe for HTML rendering
 *
 * @example
 * // Escaping user input before HTML rendering
 * const safeName = escapeHtml(userProvidedName);
 * element.innerHTML = `<span>${safeName}</span>`;
 *
 * @see project-context.md#XSS Prevention Rules
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text; // Browser handles encoding
  return div.innerHTML;
}
