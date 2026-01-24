// src/visualizer/animationUtils.ts
// Animation utility functions for circuit visualization (Story 6.5)

/**
 * Default maximum scale for gate pulse animation.
 * Gates scale up to this value and back during pulse effect.
 */
export const DEFAULT_PULSE_MAX_SCALE = 1.1;

/**
 * Default pulse duration as fraction of total animation.
 * Pulse completes in first 40% of the animation window.
 */
export const DEFAULT_PULSE_DURATION = 0.4;

/**
 * Ease-out quadratic easing function.
 * Starts fast and slows down.
 * @param t - Progress from 0.0 to 1.0
 * @returns Eased value from 0.0 to 1.0
 */
export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/**
 * Read gate pulse scale from CSS variable --da-gate-pulse-scale.
 * Falls back to DEFAULT_PULSE_MAX_SCALE if CSS variable is not set.
 * @returns Scale factor for gate pulse
 */
export function getPulseScaleFromCSS(): number {
  if (typeof document === 'undefined') return DEFAULT_PULSE_MAX_SCALE;
  const style = getComputedStyle(document.documentElement);
  const value = style.getPropertyValue('--da-gate-pulse-scale').trim();
  if (!value) return DEFAULT_PULSE_MAX_SCALE;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? DEFAULT_PULSE_MAX_SCALE : parsed;
}

/**
 * Calculate the pulse scale for a gate during animation.
 * Gates pulse up (1.0 → maxScale) and back down (maxScale → 1.0).
 *
 * @param progress - Animation progress from 0.0 to 1.0
 * @param isActive - Whether this gate should pulse (has changed outputs)
 * @param maxScale - Maximum scale during pulse (default from CSS or 1.1)
 * @param pulseDuration - Duration of pulse as fraction of total animation (default 0.4 = 40%)
 * @returns Scale factor (1.0 = normal, up to maxScale during pulse)
 */
export function calculatePulseScale(
  progress: number,
  isActive: boolean,
  maxScale: number = DEFAULT_PULSE_MAX_SCALE,
  pulseDuration: number = DEFAULT_PULSE_DURATION
): number {
  if (!isActive) return 1.0;

  // Calculate pulse progress (0 to 1 within pulse duration window)
  const pulseProgress = Math.min(progress / pulseDuration, 1.0);

  // Use sine wave for smooth up-down effect
  // sin(0) = 0, sin(π/2) = 1, sin(π) = 0
  const scaleOffset = (maxScale - 1.0) * Math.sin(pulseProgress * Math.PI);

  return 1.0 + scaleOffset;
}

/**
 * Check if user prefers reduced motion.
 * @returns True if user has prefers-reduced-motion: reduce
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
