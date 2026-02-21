// src/literature/types.ts
// Type definitions for the Literature Browser module
// Story 20.1: Create Literature Browser

import type { LabStage } from '@ui/StageSelector';

/** Article difficulty categories matching the 3-tier structure */
export type LiteratureCategory = 'basic' | 'intermediate' | 'advanced';

/** Display labels for each category */
export const CATEGORY_LABELS: Record<LiteratureCategory, string> = {
  basic: 'Basic',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

/** Order for rendering category sections */
export const CATEGORY_ORDER: readonly LiteratureCategory[] = ['basic', 'intermediate', 'advanced'] as const;

/**
 * A single literature article entry.
 * Contains metadata only — article body content is a future story concern.
 */
export interface LiteratureArticle {
  readonly id: string;
  readonly title: string;
  readonly category: LiteratureCategory;
  readonly description: string;
  readonly tags: readonly string[];
  readonly estimatedReadTime: number;
  readonly relatedStages: readonly LabStage[];
}

/**
 * Rich metadata for a literature category (Story 20.2).
 * Provides descriptions, related stages, and icons for category display.
 */
export interface CategoryMetadata {
  readonly key: LiteratureCategory;
  readonly label: string;
  readonly description: string;
  readonly relatedStages: readonly LabStage[];
  readonly icon: string;
}

/** UI contexts that can trigger contextual help (Story 20.3) */
export type HelpContext = 'circuit' | 'registers' | 'flags' | 'memory' | 'stack' | 'code-editor';

/**
 * Filter criteria for contextual help opening (Story 20.3).
 * Used to pre-filter the literature browser to relevant articles.
 */
export interface ContextFilter {
  readonly tags?: readonly string[];
  readonly category?: LiteratureCategory;
  readonly stages?: readonly LabStage[];
  readonly contextLabel?: string;
}

/** Callbacks provided by the parent component to handle browser events */
export interface LiteratureBrowserCallbacks {
  readonly onArticleSelect: (article: LiteratureArticle) => void;
  readonly onClose: () => void;
}

/** Data passed to the browser when opening */
export interface LiteratureBrowserData {
  readonly articles: readonly LiteratureArticle[];
  readonly readArticleIds?: ReadonlySet<string>;
  readonly contextFilter?: ContextFilter;
}
