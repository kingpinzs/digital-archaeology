// src/editor/languageRegistry.ts
// Centralized language registration and stage-to-language lookup (Story 11.4)

import { registerMicro4Language, micro4LanguageId } from './micro4-language';
import { registerMicro8Language } from './micro8-language';
import { registerMicro16Language } from './micro16-language';
import { getStageConfig } from '../config/stageConfig';
import type { LabStage } from '../config/stageConfig';

/**
 * Fallback language ID used when a stage has no defined language.
 * Falls back to Micro4 since it's the simplest and always available.
 */
const FALLBACK_LANGUAGE_ID = micro4LanguageId;

/**
 * Register all assembly languages with Monaco Editor.
 * Safe to call multiple times — each language has its own idempotent guard.
 * Call this once during app initialization.
 */
export function registerAllLanguages(): void {
  registerMicro4Language();
  registerMicro8Language();
  registerMicro16Language();
}

/**
 * Get the Monaco language ID for a given CPU stage.
 * Returns the stage's configured language ID, or falls back to Micro4
 * if the stage has no language defined (languageId is null).
 *
 * @param stage - The CPU stage to get the language for
 * @returns Monaco language ID string (never null)
 */
export function getLanguageIdForStage(stage: LabStage): string {
  return getStageConfig(stage).syntax.languageId ?? FALLBACK_LANGUAGE_ID;
}
