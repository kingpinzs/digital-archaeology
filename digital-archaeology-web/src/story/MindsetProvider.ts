// src/story/MindsetProvider.ts
// Singleton provider for managing historical mindset context
// Story 10.21: Historical Mindset Time-Travel

import type { MindsetContext, EraTechnology } from './types';

/**
 * Technology timeline data structure loaded from JSON.
 */
interface TechnologyTimelineData {
  technologies: EraTechnology[];
  terminology: { modern: string; earliest: number; before: string }[];
}

/**
 * Singleton provider for managing historical mindset context.
 * Establishes the "you are THERE" perspective by tracking:
 * - Current year
 * - Known vs unknown technologies
 * - Era-appropriate terminology
 * - Anachronism detection
 */
let instance: MindsetProvider | null = null;

export class MindsetProvider {
  private currentMindset: MindsetContext | null = null;
  private technologyTimeline: EraTechnology[] = [];
  private terminology: { modern: string; earliest: number; before: string }[] = [];
  private isTimelineLoaded: boolean = false;

  /**
   * Get the singleton instance of MindsetProvider.
   */
  static getInstance(): MindsetProvider {
    if (!instance) {
      instance = new MindsetProvider();
    }
    return instance;
  }

  /**
   * Reset the singleton instance (primarily for testing).
   */
  static resetInstance(): void {
    if (instance) {
      instance.destroy();
    }
    instance = null;
  }

  /**
   * Load the technology timeline data from JSON.
   * Must be called before using anachronism detection.
   */
  async loadTechnologyTimeline(): Promise<void> {
    if (this.isTimelineLoaded) {
      return;
    }

    try {
      const response = await fetch('/story/data/technology-timeline.json');
      if (!response.ok) {
        throw new Error(`Failed to load technology timeline: ${response.statusText}`);
      }
      const data: TechnologyTimelineData = await response.json();
      this.technologyTimeline = data.technologies || [];
      this.terminology = data.terminology || [];
      this.isTimelineLoaded = true;
    } catch (error) {
      // In development/testing, timeline may not exist yet
      console.warn('Could not load technology timeline:', error);
      this.technologyTimeline = [];
      this.terminology = [];
      this.isTimelineLoaded = true;
    }
  }

  /**
   * Set the technology timeline directly (for testing).
   */
  setTechnologyTimeline(technologies: EraTechnology[]): void {
    this.technologyTimeline = technologies;
    this.isTimelineLoaded = true;
  }

  /**
   * Set the terminology data directly (for testing).
   */
  setTerminology(terminology: { modern: string; earliest: number; before: string }[]): void {
    this.terminology = terminology;
  }

  /**
   * Set the current mindset context.
   * Dispatches 'mindset-established' event when called.
   */
  setMindset(context: MindsetContext): void {
    const previousMindset = this.currentMindset;
    this.currentMindset = context;

    if (previousMindset === null) {
      this.dispatchEvent('mindset-established', { mindset: context });
    } else {
      this.dispatchEvent('mindset-changed', {
        previous: previousMindset,
        current: context,
      });
    }
  }

  /**
   * Get the current mindset context.
   */
  getCurrentMindset(): MindsetContext | null {
    return this.currentMindset;
  }

  /**
   * Get the current year from the mindset, or 2026 if no mindset set.
   */
  getCurrentYear(): number {
    return this.currentMindset?.year ?? 2026;
  }

  /**
   * Check if a concept is an anachronism for the current or specified year.
   * @param concept - The technology or concept name to check
   * @param year - Optional year override (defaults to current mindset year)
   * @returns true if the concept didn't exist/wasn't common at that time
   */
  isAnachronism(concept: string, year?: number): boolean {
    const checkYear = year ?? this.currentMindset?.year ?? 2026;

    // Check if it's in the unknownTechnology list for current mindset
    if (this.currentMindset?.unknownTechnology.includes(concept)) {
      return true;
    }

    // Check technology timeline
    const tech = this.technologyTimeline.find(
      (t) => t.name.toLowerCase() === concept.toLowerCase()
    );

    if (!tech) {
      // Not in our timeline - might be okay, might not
      // Check terminology as fallback
      const term = this.terminology.find(
        (t) => t.modern.toLowerCase() === concept.toLowerCase()
      );
      if (term) {
        return checkYear < term.earliest;
      }
      return false;
    }

    // Technology exists but wasn't common yet
    return tech.yearCommon > checkYear;
  }

  /**
   * Get the period-accurate term for a concept.
   * @param concept - The modern concept name
   * @returns The era-appropriate term, or the original concept if no mapping exists
   */
  getPeriodTerm(concept: string): string {
    const year = this.currentMindset?.year ?? 2026;

    // Check terminology mapping first
    const termMapping = this.terminology.find(
      (t) => t.modern.toLowerCase() === concept.toLowerCase()
    );
    if (termMapping && year < termMapping.earliest) {
      return termMapping.before;
    }

    // Check technology timeline for period terms
    const tech = this.technologyTimeline.find(
      (t) => t.name.toLowerCase() === concept.toLowerCase()
    );

    if (!tech || !tech.periodTerms || tech.periodTerms.length === 0) {
      return concept;
    }

    // Find the most recent period term that applies
    const applicable = tech.periodTerms
      .filter((pt) => pt.year <= year)
      .sort((a, b) => b.year - a.year);

    return applicable[0]?.term ?? concept;
  }

  /**
   * Check if the timeline has been loaded.
   */
  isLoaded(): boolean {
    return this.isTimelineLoaded;
  }

  /**
   * Clear the current mindset.
   */
  clearMindset(): void {
    if (this.currentMindset) {
      const previous = this.currentMindset;
      this.currentMindset = null;
      this.dispatchEvent('mindset-cleared', { previous });
    }
  }

  /**
   * Dispatch a custom event on the document.
   */
  private dispatchEvent(eventName: string, detail: unknown): void {
    const event = new CustomEvent(`mindset-${eventName}`, {
      detail,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }

  /**
   * Clean up the provider instance.
   */
  destroy(): void {
    this.currentMindset = null;
    this.technologyTimeline = [];
    this.terminology = [];
    this.isTimelineLoaded = false;
  }
}
