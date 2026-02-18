// src/progress/DiscoveryDetector.test.ts
// Tests for DiscoveryDetector source code analysis
// Story 19.1: Track First-Time Discoveries

import { describe, it, expect, beforeEach } from 'vitest';
import { DiscoveryDetector } from './DiscoveryDetector';
import { DiscoveryStorage } from './DiscoveryStorage';

describe('DiscoveryDetector', () => {
  const TEST_KEY = 'test-detector-storage';
  let storage: DiscoveryStorage;
  let detector: DiscoveryDetector;

  beforeEach(() => {
    localStorage.clear();
    storage = new DiscoveryStorage(TEST_KEY);
    detector = new DiscoveryDetector(storage);
  });

  describe('first-assembly detection', () => {
    it('detects first-assembly on first successful assembly', () => {
      const discoveries = detector.detect('NOP', 'micro4', false);
      expect(discoveries.some(d => d.type === 'first-assembly')).toBe(true);
    });

    it('does NOT re-detect first-assembly if already earned', () => {
      storage.addDiscovery({
        type: 'first-assembly',
        timestamp: 1000,
        stage: 'micro4',
        experimentationMode: false,
      });
      const discoveries = detector.detect('NOP', 'micro4', false);
      expect(discoveries.some(d => d.type === 'first-assembly')).toBe(false);
    });
  });

  describe('first-subroutine detection', () => {
    it('detects when source contains CALL instruction', () => {
      const source = 'CALL subroutine\nRET';
      const discoveries = detector.detect(source, 'micro8', false);
      expect(discoveries.some(d => d.type === 'first-subroutine')).toBe(true);
    });

    it('detects when source contains JSR instruction', () => {
      const source = 'JSR handler\nRTS';
      const discoveries = detector.detect(source, 'micro8', false);
      expect(discoveries.some(d => d.type === 'first-subroutine')).toBe(true);
    });

    it('detects when source contains only RET instruction', () => {
      // RET alone indicates subroutine usage (return from subroutine)
      const source = 'RET';
      const discoveries = detector.detect(source, 'micro8', false);
      expect(discoveries.some(d => d.type === 'first-subroutine')).toBe(true);
    });

    it('detects when source contains only RTS instruction', () => {
      const source = 'RTS';
      const discoveries = detector.detect(source, 'micro8', false);
      expect(discoveries.some(d => d.type === 'first-subroutine')).toBe(true);
    });

    it('detects case-insensitively', () => {
      const source = 'call myFunc\nret';
      const discoveries = detector.detect(source, 'micro8', false);
      expect(discoveries.some(d => d.type === 'first-subroutine')).toBe(true);
    });

    it('does NOT detect when CALL appears only in a comment', () => {
      const source = '; This uses CALL for subroutines\nNOP';
      const discoveries = detector.detect(source, 'micro8', false);
      expect(discoveries.some(d => d.type === 'first-subroutine')).toBe(false);
    });

    it('does NOT re-detect if already earned', () => {
      storage.addDiscovery({
        type: 'first-subroutine',
        timestamp: 1000,
        stage: 'micro8',
        experimentationMode: false,
      });
      const source = 'CALL subroutine\nRET';
      const discoveries = detector.detect(source, 'micro8', false);
      expect(discoveries.some(d => d.type === 'first-subroutine')).toBe(false);
    });
  });

  describe('first-interrupt detection', () => {
    it('detects when source contains INT instruction', () => {
      const source = 'INT 0x10\nRTI';
      const discoveries = detector.detect(source, 'micro8', false);
      expect(discoveries.some(d => d.type === 'first-interrupt')).toBe(true);
    });

    it('does NOT detect INT inside a label name like PRINT', () => {
      // PRINT does not contain INT as a whole word
      const source = 'PRINT:\n  NOP';
      const discoveries = detector.detect(source, 'micro8', false);
      expect(discoveries.some(d => d.type === 'first-interrupt')).toBe(false);
    });

    it('detects RTI mnemonic', () => {
      const source = 'RTI';
      const discoveries = detector.detect(source, 'micro8', false);
      expect(discoveries.some(d => d.type === 'first-interrupt')).toBe(true);
    });

    it('detects RETI mnemonic', () => {
      const source = 'RETI';
      const discoveries = detector.detect(source, 'micro8', false);
      expect(discoveries.some(d => d.type === 'first-interrupt')).toBe(true);
    });

    it('detects IRET mnemonic', () => {
      const source = 'IRET';
      const discoveries = detector.detect(source, 'micro8', false);
      expect(discoveries.some(d => d.type === 'first-interrupt')).toBe(true);
    });
  });

  describe('first-stack detection', () => {
    it('detects when source contains PUSH/POP', () => {
      const source = 'PUSH R0\nPOP R1';
      const discoveries = detector.detect(source, 'micro8', false);
      expect(discoveries.some(d => d.type === 'first-stack')).toBe(true);
    });

    it('detects PUSHA/POPA', () => {
      const source = 'PUSHA\nPOPA';
      const discoveries = detector.detect(source, 'micro8', false);
      expect(discoveries.some(d => d.type === 'first-stack')).toBe(true);
    });

    it('does NOT detect when PUSH is only in a comment', () => {
      const source = '; PUSH saves registers\nNOP';
      const discoveries = detector.detect(source, 'micro8', false);
      expect(discoveries.some(d => d.type === 'first-stack')).toBe(false);
    });
  });

  describe('first-stage detection', () => {
    it('detects first-stage-micro4 on first assembly in micro4', () => {
      const discoveries = detector.detect('NOP', 'micro4', false);
      expect(discoveries.some(d => d.type === 'first-stage-micro4')).toBe(true);
    });

    it('detects first-stage-micro8 on first assembly in micro8', () => {
      const discoveries = detector.detect('NOP', 'micro8', false);
      expect(discoveries.some(d => d.type === 'first-stage-micro8')).toBe(true);
    });

    it('detects first-stage-micro16 on first assembly in micro16', () => {
      const discoveries = detector.detect('NOP', 'micro16', false);
      expect(discoveries.some(d => d.type === 'first-stage-micro16')).toBe(true);
    });

    it('does NOT re-detect first-stage if already earned', () => {
      storage.addDiscovery({
        type: 'first-stage-micro4',
        timestamp: 1000,
        stage: 'micro4',
        experimentationMode: false,
      });
      const discoveries = detector.detect('NOP', 'micro4', false);
      expect(discoveries.some(d => d.type === 'first-stage-micro4')).toBe(false);
    });
  });

  describe('multiple simultaneous discoveries', () => {
    it('detects multiple discoveries at once', () => {
      const source = 'CALL subroutine\nPUSH R0\nRET';
      const discoveries = detector.detect(source, 'micro8', false);
      const types = discoveries.map(d => d.type);
      expect(types).toContain('first-assembly');
      expect(types).toContain('first-stage-micro8');
      expect(types).toContain('first-subroutine');
      expect(types).toContain('first-stack');
      expect(discoveries.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('experimentation mode flag', () => {
    it('sets experimentationMode true when active', () => {
      const discoveries = detector.detect('NOP', 'micro4', true);
      for (const d of discoveries) {
        expect(d.experimentationMode).toBe(true);
      }
    });

    it('sets experimentationMode false when inactive', () => {
      const discoveries = detector.detect('NOP', 'micro4', false);
      for (const d of discoveries) {
        expect(d.experimentationMode).toBe(false);
      }
    });
  });

  describe('discovery metadata', () => {
    it('includes correct stage on all discoveries', () => {
      const discoveries = detector.detect('CALL sub\nRET', 'micro8', false);
      for (const d of discoveries) {
        expect(d.stage).toBe('micro8');
      }
    });

    it('includes timestamp on all discoveries', () => {
      const before = Date.now();
      const discoveries = detector.detect('NOP', 'micro4', false);
      const after = Date.now();
      for (const d of discoveries) {
        expect(d.timestamp).toBeGreaterThanOrEqual(before);
        expect(d.timestamp).toBeLessThanOrEqual(after);
      }
    });
  });
});
