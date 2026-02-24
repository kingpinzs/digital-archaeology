// src/story/scene-utils.ts
// Shared utility functions for scene display formatting
// Code Review Fix M6: Extracted from JourneyMap, StoryBrowser, ReplayPanel to prevent duplication drift

/** Scene type display labels */
const SCENE_TYPE_LABELS: Record<string, string> = {
  narrative: 'Story',
  dialogue: 'Dialogue',
  choice: 'Branch Point',
  challenge: 'Challenge',
  decision: 'Decision',
  builder: 'Builder',
  persona: 'Introduction',
  transition: 'Transition',
};

/**
 * Format a scene type string for display.
 * Returns a human-readable label for the scene type.
 */
export function formatSceneType(type: string): string {
  return SCENE_TYPE_LABELS[type] ?? type;
}
