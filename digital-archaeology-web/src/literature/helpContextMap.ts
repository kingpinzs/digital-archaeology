// src/literature/helpContextMap.ts
// Help context mapping for contextual help links (Story 20.3)

import { LITERATURE_ARTICLES } from './literatureMetadata';
import type { HelpContext, ContextFilter, LiteratureArticle } from './types';
import type { LabStage } from '@ui/StageSelector';

/**
 * Maps UI help contexts to filter criteria for the literature browser.
 * Each context defines which article tags are relevant and a display label.
 */
export const HELP_CONTEXT_MAP: Record<HelpContext, ContextFilter> = {
  'circuit': {
    tags: ['gates', 'logic', 'alu', 'boolean', 'transistors'],
    contextLabel: 'Circuit Panel',
  },
  'registers': {
    tags: ['registers', 'flip-flop', 'state', 'latch'],
    contextLabel: 'Registers',
  },
  'flags': {
    tags: ['registers', 'flip-flop', 'state'],
    contextLabel: 'Flags',
  },
  'memory': {
    tags: ['memory', 'ram', 'rom', 'hierarchy'],
    contextLabel: 'Memory',
  },
  'stack': {
    tags: ['subroutines', 'call stack', 'stack frame'],
    contextLabel: 'Call Stack',
  },
  'code-editor': {
    tags: ['encoding', 'machine code', 'opcode', 'instruction format'],
    contextLabel: 'Code Editor',
  },
};

/**
 * Check if an article matches any of the context filter tags.
 * Uses substring matching in both directions for flexibility.
 */
export function matchesTags(article: LiteratureArticle, filterTags: readonly string[]): boolean {
  return article.tags.some(tag =>
    filterTags.some(ft => tag.includes(ft) || ft.includes(tag))
  );
}

/**
 * Get articles relevant to a given help context, optionally filtered by lab stage.
 * Falls back to tag-only matching when stage filtering would yield zero results.
 */
export function getContextualArticles(context: HelpContext, stage?: LabStage): LiteratureArticle[] {
  const filter = HELP_CONTEXT_MAP[context];
  if (!filter.tags) return [...LITERATURE_ARTICLES];

  const tagMatched = LITERATURE_ARTICLES.filter(a => matchesTags(a, filter.tags!));

  if (!stage) return tagMatched;

  // Try tag + stage filtering
  const stageFiltered = tagMatched.filter(a => a.relatedStages.includes(stage));

  // Fall back to tag-only if stage yields no results
  return stageFiltered.length > 0 ? stageFiltered : tagMatched;
}

/**
 * Get the resolved ContextFilter for a given help context and optional stage.
 */
export function getContextFilter(context: HelpContext, stage?: LabStage): ContextFilter {
  const base = HELP_CONTEXT_MAP[context];
  if (!stage) return base;

  return {
    ...base,
    stages: [stage],
  };
}
