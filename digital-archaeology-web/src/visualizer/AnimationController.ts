// src/visualizer/AnimationController.ts
// Animation frame loop management for circuit visualization (Story 6.5)

/**
 * Animation configuration options.
 */
export interface AnimationConfig {
  /** Animation duration in milliseconds */
  duration: number;
  /** Target frames per second */
  targetFps: number;
}

/**
 * Default animation configuration.
 * Note: These are fallback values. Prefer reading from CSS variables when available.
 */
export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  duration: 500,
  targetFps: 30,
};

/**
 * Read animation duration from CSS variable --da-animation-duration.
 * Falls back to default if CSS variable is not set or not in browser environment.
 * @returns Duration in milliseconds
 */
export function getAnimationDurationFromCSS(): number {
  if (typeof document === 'undefined') return DEFAULT_ANIMATION_CONFIG.duration;
  const style = getComputedStyle(document.documentElement);
  const value = style.getPropertyValue('--da-animation-duration').trim();
  if (!value) return DEFAULT_ANIMATION_CONFIG.duration;
  // Parse "500ms" or "0.5s" format
  if (value.endsWith('ms')) {
    return parseFloat(value) || DEFAULT_ANIMATION_CONFIG.duration;
  }
  if (value.endsWith('s')) {
    return (parseFloat(value) * 1000) || DEFAULT_ANIMATION_CONFIG.duration;
  }
  return parseFloat(value) || DEFAULT_ANIMATION_CONFIG.duration;
}

/**
 * Callback type for animation frame updates.
 * @param progress - Animation progress from 0.0 to 1.0
 */
export type FrameCallback = (progress: number) => void;

/**
 * Callback type for animation completion.
 */
export type CompleteCallback = () => void;

/**
 * AnimationController manages requestAnimationFrame-based animations.
 * Provides progress callbacks and automatic completion handling.
 * Throttles frames to target FPS to reduce CPU usage.
 */
export class AnimationController {
  private config: AnimationConfig;
  private animationId: number | null = null;
  private startTime: number = 0;
  private currentDuration: number = 0;
  private frameCallback: FrameCallback | null = null;
  private completeCallback: CompleteCallback | null = null;
  private lastFrameTime: number = 0;
  private frameInterval: number = 0;

  // Bound tick method for consistent reference
  private boundTick: (currentTime: number) => void;

  /**
   * Create a new AnimationController.
   * @param config - Optional custom animation configuration
   */
  constructor(config?: Partial<AnimationConfig>) {
    this.config = { ...DEFAULT_ANIMATION_CONFIG, ...config };
    this.frameInterval = 1000 / this.config.targetFps;
    this.boundTick = this.tick.bind(this);
  }

  /**
   * Start the animation loop.
   * @param duration - Optional duration override in milliseconds
   */
  startAnimation(duration?: number): void {
    // Stop any existing animation
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    this.currentDuration = duration ?? this.config.duration;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.animationId = requestAnimationFrame(this.boundTick);
  }

  /**
   * Animation frame tick handler.
   * Throttles frames to target FPS to reduce CPU usage.
   * @param currentTime - Current timestamp from requestAnimationFrame
   * @private
   */
  private tick(currentTime: number): void {
    const elapsed = currentTime - this.startTime;
    const progress = Math.min(elapsed / this.currentDuration, 1.0);

    // Throttle to target FPS - only call callback if enough time has passed
    const timeSinceLastFrame = currentTime - this.lastFrameTime;
    if (timeSinceLastFrame >= this.frameInterval || progress >= 1.0) {
      this.lastFrameTime = currentTime;
      // Call frame callback with current progress
      this.frameCallback?.(progress);
    }

    if (progress < 1.0) {
      // Continue animation
      this.animationId = requestAnimationFrame(this.boundTick);
    } else {
      // Animation complete
      this.animationId = null;
      this.completeCallback?.();
    }
  }

  /**
   * Stop the current animation.
   * Does not trigger the complete callback.
   * Clears callbacks to prevent memory leaks.
   */
  stopAnimation(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    // Clear callbacks to prevent memory leaks when component is destroyed
    this.frameCallback = null;
    this.completeCallback = null;
  }

  /**
   * Check if an animation is currently running.
   */
  get isAnimating(): boolean {
    return this.animationId !== null;
  }

  /**
   * Set the frame callback.
   * Called on each animation frame with progress (0.0 to 1.0).
   * @param callback - The callback function
   * @returns This controller for chaining
   */
  onFrame(callback: FrameCallback): this {
    this.frameCallback = callback;
    return this;
  }

  /**
   * Set the completion callback.
   * Called when animation completes naturally (not when stopped).
   * @param callback - The callback function
   * @returns This controller for chaining
   */
  onComplete(callback: CompleteCallback): this {
    this.completeCallback = callback;
    return this;
  }

  /**
   * Get the current animation configuration.
   * @returns A copy of the current config
   */
  getConfig(): AnimationConfig {
    return { ...this.config };
  }

  /**
   * Update the animation configuration.
   * @param config - Partial configuration to merge
   */
  updateConfig(config: Partial<AnimationConfig>): void {
    this.config = { ...this.config, ...config };
    // Recalculate frame interval if targetFps changed
    this.frameInterval = 1000 / this.config.targetFps;
  }
}
