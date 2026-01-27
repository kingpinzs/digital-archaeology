// src/story/AnachronismFilter.ts
// Utility for filtering anachronistic content from text
// Story 10.21: Historical Mindset Time-Travel
//
// Note: This utility uses RegExp for pattern matching on user-provided text.
// The escapeRegex() method ensures special characters are escaped.

import { MindsetProvider } from './MindsetProvider';

/**
 * Result of anachronism analysis for a piece of text.
 */
export interface AnachronismResult {
  /** Original text */
  original: string;
  /** Text with anachronisms replaced/flagged */
  filtered: string;
  /** List of anachronisms found */
  anachronisms: AnachronismMatch[];
  /** Whether any anachronisms were found */
  hasAnachronisms: boolean;
}

/**
 * Details about a single anachronism match.
 */
export interface AnachronismMatch {
  /** The anachronistic term found */
  term: string;
  /** Position in original text */
  position: number;
  /** The era-appropriate replacement (if available) */
  replacement: string | null;
  /** Why this is an anachronism */
  reason: string;
}

/**
 * Options for anachronism filtering.
 */
export interface AnachronismFilterOptions {
  /** Year to check against (defaults to mindset year) */
  year?: number;
  /** Mode for handling anachronisms */
  mode: 'replace' | 'flag' | 'remove' | 'highlight';
  /** Custom replacements map */
  customReplacements?: Map<string, string>;
  /** Whether to do case-insensitive matching */
  caseInsensitive?: boolean;
}

/**
 * Default filter options.
 */
const DEFAULT_OPTIONS: AnachronismFilterOptions = {
  mode: 'flag',
  caseInsensitive: true,
};

/**
 * Utility class for detecting and filtering anachronistic content.
 * Works with MindsetProvider to understand the current era context.
 */
export class AnachronismFilter {
  private provider: MindsetProvider;
  private customTerms: Map<string, { yearIntroduced: number; replacement?: string }> = new Map();

  constructor() {
    this.provider = MindsetProvider.getInstance();
  }

  /**
   * Add custom terms to check for anachronisms.
   */
  addCustomTerm(
    term: string,
    yearIntroduced: number,
    replacement?: string
  ): void {
    this.customTerms.set(term.toLowerCase(), { yearIntroduced, replacement });
  }

  /**
   * Clear all custom terms.
   */
  clearCustomTerms(): void {
    this.customTerms.clear();
  }

  /**
   * Check if a single term is an anachronism.
   */
  isAnachronism(term: string, year?: number): boolean {
    const checkYear = year ?? this.provider.getCurrentYear();

    // Check custom terms first
    const customTerm = this.customTerms.get(term.toLowerCase());
    if (customTerm && customTerm.yearIntroduced > checkYear) {
      return true;
    }

    // Use MindsetProvider's anachronism check
    return this.provider.isAnachronism(term, checkYear);
  }

  /**
   * Get the era-appropriate term for a concept.
   */
  getPeriodTerm(term: string): string {
    // Check custom replacements first
    const customTerm = this.customTerms.get(term.toLowerCase());
    if (customTerm?.replacement) {
      return customTerm.replacement;
    }

    // Use MindsetProvider's period term lookup
    return this.provider.getPeriodTerm(term);
  }

  /**
   * Analyze text for anachronisms.
   */
  analyze(text: string, options?: Partial<AnachronismFilterOptions>): AnachronismResult {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const year = opts.year ?? this.provider.getCurrentYear();

    const anachronisms: AnachronismMatch[] = [];
    let filtered = text;

    // Get terms to check
    const termsToCheck = this.getTermsToCheck();

    for (const [term, data] of termsToCheck) {
      const pattern = this.escapeRegex(term);
      const flags = opts.caseInsensitive ? 'gi' : 'g';
      const regex = new RegExp(`\\b${pattern}\\b`, flags);

      let match;
      while ((match = regex.exec(text)) !== null) {
        if (data.yearCommon > year || data.yearIntroduced > year) {
          const replacement = data.replacement ?? this.provider.getPeriodTerm(term);
          const isKnownButNotCommon = data.yearIntroduced <= year && data.yearCommon > year;

          anachronisms.push({
            term: match[0],
            position: match.index,
            replacement: replacement !== term ? replacement : null,
            reason: isKnownButNotCommon
              ? `"${term}" was invented in ${data.yearIntroduced} but not common until ${data.yearCommon}`
              : `"${term}" did not exist until ${data.yearIntroduced ?? data.yearCommon}`,
          });
        }
      }
    }

    // Sort by position
    anachronisms.sort((a, b) => a.position - b.position);

    // Apply filtering based on mode
    if (anachronisms.length > 0) {
      filtered = this.applyFilter(text, anachronisms, opts);
    }

    return {
      original: text,
      filtered,
      anachronisms,
      hasAnachronisms: anachronisms.length > 0,
    };
  }

  /**
   * Get all terms to check for anachronisms.
   */
  private getTermsToCheck(): Map<string, { yearIntroduced: number; yearCommon: number; replacement?: string }> {
    const terms = new Map<string, { yearIntroduced: number; yearCommon: number; replacement?: string }>();

    // Add custom terms
    for (const [term, data] of this.customTerms) {
      terms.set(term, {
        yearIntroduced: data.yearIntroduced,
        yearCommon: data.yearIntroduced,
        replacement: data.replacement,
      });
    }

    // Get terms from mindset's unknownTechnology list
    const mindset = this.provider.getCurrentMindset();
    if (mindset) {
      for (const tech of mindset.unknownTechnology) {
        if (!terms.has(tech.toLowerCase())) {
          terms.set(tech.toLowerCase(), {
            yearIntroduced: mindset.year + 1, // After current year
            yearCommon: mindset.year + 1,
          });
        }
      }
    }

    return terms;
  }

  /**
   * Apply the filter mode to the text.
   */
  private applyFilter(
    text: string,
    anachronisms: AnachronismMatch[],
    options: AnachronismFilterOptions
  ): string {
    // Process in reverse order to preserve positions
    const sorted = [...anachronisms].sort((a, b) => b.position - a.position);

    let result = text;

    for (const match of sorted) {
      const start = match.position;
      const end = start + match.term.length;

      switch (options.mode) {
        case 'replace':
          if (match.replacement) {
            result = result.slice(0, start) + match.replacement + result.slice(end);
          }
          break;

        case 'flag':
          result = result.slice(0, start) + `[ANACHRONISM: ${match.term}]` + result.slice(end);
          break;

        case 'remove':
          result = result.slice(0, start) + '[...]' + result.slice(end);
          break;

        case 'highlight':
          result = result.slice(0, start) + `**${match.term}**` + result.slice(end);
          break;
      }
    }

    return result;
  }

  /**
   * Escape special regex characters in a string.
   * This prevents regex injection by escaping all special characters.
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

/**
 * Create a pre-configured filter for a specific era.
 */
export function createEraFilter(year: number): AnachronismFilter {
  const filter = new AnachronismFilter();

  // Add common anachronistic terms with their introduction years
  const commonTerms: [string, number, string?][] = [
    ['internet', 1990, 'ARPANET'],
    ['smartphone', 2007, 'mobile phone'],
    ['cloud computing', 2006, 'timesharing'],
    ['web browser', 1990, undefined],
    ['email', 1971, 'electronic mail'],
    ['personal computer', 1975, 'minicomputer'],
    ['laptop', 1981, 'portable computer'],
    ['USB', 1996, 'serial port'],
    ['SSD', 2000, 'disk drive'],
    ['Wi-Fi', 1999, 'wireless network'],
    ['Bluetooth', 1998, 'infrared link'],
    ['GPS', 1993, 'navigation system'],
    ['touchscreen', 1982, 'display'],
    ['flash memory', 1984, 'EPROM'],
    ['gigabyte', 1980, 'megabyte'],
    ['terabyte', 1997, 'gigabyte'],
  ];

  for (const [term, yearIntroduced, replacement] of commonTerms) {
    if (yearIntroduced > year) {
      filter.addCustomTerm(term, yearIntroduced, replacement);
    }
  }

  return filter;
}
