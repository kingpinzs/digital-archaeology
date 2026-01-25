// src/utils/escapeHtml.test.ts
// Unit tests for escapeHtml utility

import { describe, it, expect } from 'vitest';
import { escapeHtml } from './escapeHtml';

describe('escapeHtml', () => {
  it('should escape < and > characters', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('should escape & character', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  it('should escape " character', () => {
    expect(escapeHtml('say "hello"')).toBe('say "hello"');
  });

  it('should escape multiple special characters', () => {
    expect(escapeHtml('<a href="test">link</a>')).toBe(
      '&lt;a href="test"&gt;link&lt;/a&gt;'
    );
  });

  it('should handle script injection attempt', () => {
    const malicious = '<script>alert("xss")</script>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });

  it('should preserve normal text', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  it('should handle empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should handle numbers converted to strings', () => {
    expect(escapeHtml('123')).toBe('123');
  });

  it('should handle unicode characters', () => {
    expect(escapeHtml('Hello 世界 🌍')).toBe('Hello 世界 🌍');
  });
});
