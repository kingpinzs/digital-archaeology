import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted for mock functions referenced in vi.mock factories
const mocks = vi.hoisted(() => ({
  registerMicro4: vi.fn(),
  registerMicro8: vi.fn(),
  registerMicro16: vi.fn(),
}));

// Mock Monaco
vi.mock('monaco-editor', () => ({
  languages: {
    register: vi.fn(),
    setLanguageConfiguration: vi.fn(),
    setMonarchTokensProvider: vi.fn(),
  },
}));

// Mock individual language registrations
vi.mock('./micro4-language', () => ({
  registerMicro4Language: mocks.registerMicro4,
  micro4LanguageId: 'micro4',
}));
vi.mock('./micro8-language', () => ({
  registerMicro8Language: mocks.registerMicro8,
}));
vi.mock('./micro16-language', () => ({
  registerMicro16Language: mocks.registerMicro16,
}));

// Mock stageConfig
vi.mock('../config/stageConfig', () => ({
  getStageConfig: vi.fn((stage: string) => {
    const configs: Record<string, { syntax: { languageId: string | null } }> = {
      micro4: { syntax: { languageId: 'micro4' } },
      micro8: { syntax: { languageId: 'micro8' } },
      micro16: { syntax: { languageId: 'micro16' } },
      micro32: { syntax: { languageId: null } },
      micro32p: { syntax: { languageId: null } },
      micro32s: { syntax: { languageId: null } },
    };
    return configs[stage] ?? { syntax: { languageId: null } };
  }),
}));

import { registerAllLanguages, getLanguageIdForStage } from './languageRegistry';

describe('languageRegistry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerAllLanguages', () => {
    it('should register all three language definitions', () => {
      registerAllLanguages();

      expect(mocks.registerMicro4).toHaveBeenCalledTimes(1);
      expect(mocks.registerMicro8).toHaveBeenCalledTimes(1);
      expect(mocks.registerMicro16).toHaveBeenCalledTimes(1);
    });

    it('should be safe to call multiple times', () => {
      registerAllLanguages();
      registerAllLanguages();

      // Each registration function is called twice, but they have internal idempotent guards
      expect(mocks.registerMicro4).toHaveBeenCalledTimes(2);
      expect(mocks.registerMicro8).toHaveBeenCalledTimes(2);
      expect(mocks.registerMicro16).toHaveBeenCalledTimes(2);
    });
  });

  describe('getLanguageIdForStage', () => {
    it('should return "micro4" for micro4 stage', () => {
      expect(getLanguageIdForStage('micro4')).toBe('micro4');
    });

    it('should return "micro8" for micro8 stage', () => {
      expect(getLanguageIdForStage('micro8')).toBe('micro8');
    });

    it('should return "micro16" for micro16 stage', () => {
      expect(getLanguageIdForStage('micro16')).toBe('micro16');
    });

    it('should fall back to "micro4" for micro32 (languageId is null)', () => {
      expect(getLanguageIdForStage('micro32')).toBe('micro4');
    });

    it('should fall back to "micro4" for micro32p (languageId is null)', () => {
      expect(getLanguageIdForStage('micro32p')).toBe('micro4');
    });

    it('should fall back to "micro4" for micro32s (languageId is null)', () => {
      expect(getLanguageIdForStage('micro32s')).toBe('micro4');
    });
  });
});
