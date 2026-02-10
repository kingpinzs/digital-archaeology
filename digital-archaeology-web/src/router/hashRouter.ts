// src/router/hashRouter.ts
// Lightweight hash-based router for stage and mode URL routing (Story 11.7)

import type { LabStage } from '../config/stageConfig';
import { LAB_STAGES } from '../config/stageConfig';
import type { ThemeMode } from '../ui/theme';

/** Parsed route state from the URL hash. */
export interface RouteState {
  mode: ThemeMode;
  stage: LabStage;
}

/** Callback fired when the route changes via browser navigation. */
export type RouteChangeCallback = (route: RouteState) => void;

const VALID_MODES: readonly ThemeMode[] = ['lab', 'story'];
const DEFAULT_STAGE: LabStage = 'micro4';
const DEFAULT_MODE: ThemeMode = 'lab';

/**
 * Parse a URL hash string into a RouteState.
 * Validates mode and stage, falling back to defaults for invalid values.
 *
 * Supported formats:
 * - `#/lab/micro4` → { mode: 'lab', stage: 'micro4' }
 * - `#/story`      → { mode: 'story', stage: 'micro4' }
 * - `#/lab`        → { mode: 'lab', stage: 'micro4' }
 * - invalid/empty  → { mode: 'lab', stage: 'micro4' }
 */
export function parseHash(hash: string): RouteState {
  // Strip leading # and /
  const cleaned = hash.replace(/^#\/?/, '');
  if (!cleaned) {
    return { mode: DEFAULT_MODE, stage: DEFAULT_STAGE };
  }

  const parts = cleaned.split('/');
  const rawMode = parts[0];
  const rawStage = parts[1];

  const mode: ThemeMode = VALID_MODES.includes(rawMode as ThemeMode)
    ? (rawMode as ThemeMode)
    : DEFAULT_MODE;

  const stage: LabStage = rawStage && LAB_STAGES.includes(rawStage as LabStage)
    ? (rawStage as LabStage)
    : DEFAULT_STAGE;

  return { mode, stage };
}

/**
 * Build a URL hash string from mode and stage.
 * Story mode omits the stage segment.
 */
export function buildHash(mode: ThemeMode, stage: LabStage): string {
  if (mode === 'story') {
    return '#/story';
  }
  return `#/lab/${stage}`;
}

/**
 * Lightweight hash-based router.
 * Listens for `hashchange` events and calls the registered callback.
 */
export class HashRouter {
  private callback: RouteChangeCallback | null = null;
  private boundHandler: (() => void) | null = null;

  /** Register a callback for route changes. */
  onRouteChange(callback: RouteChangeCallback): void {
    this.callback = callback;
  }

  /** Start listening for hashchange events. */
  start(): void {
    // Clean up existing listener to prevent memory leak on double-call (CR H-3)
    if (this.boundHandler) {
      window.removeEventListener('hashchange', this.boundHandler);
      this.boundHandler = null;
      // Note: preserve this.callback — only stop() clears it (CR M-1)
    }

    this.boundHandler = () => {
      if (this.callback) {
        const route = parseHash(window.location.hash);
        this.callback(route);
      }
    };
    window.addEventListener('hashchange', this.boundHandler);
  }

  /** Stop listening for hashchange events. */
  stop(): void {
    if (this.boundHandler) {
      window.removeEventListener('hashchange', this.boundHandler);
      this.boundHandler = null;
    }
    this.callback = null; // Clear callback reference to prevent stale closures (CR M-1)
  }

  /** Navigate to a route (pushes history entry). */
  navigate(mode: ThemeMode, stage: LabStage = DEFAULT_STAGE): void {
    const hash = buildHash(mode, stage);
    window.location.hash = hash;
  }

  /** Replace current route (no history entry). */
  replace(mode: ThemeMode, stage: LabStage = DEFAULT_STAGE): void {
    const hash = buildHash(mode, stage);
    history.replaceState(null, '', hash);
  }

  /** Get the current route from the URL hash. */
  getCurrentRoute(): RouteState {
    return parseHash(window.location.hash);
  }
}
