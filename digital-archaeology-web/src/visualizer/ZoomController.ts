// src/visualizer/ZoomController.ts
// Zoom state and calculations for circuit visualization (Story 6.6)

/**
 * Configuration for ZoomController.
 */
export interface ZoomControllerConfig {
  /** Minimum zoom scale (default: 0.25 = 25%) */
  min: number;
  /** Maximum zoom scale (default: 4.0 = 400%) */
  max: number;
  /** Zoom step increment (default: 0.1 = 10%) */
  step: number;
}

/**
 * Zoom offset state for pan position.
 */
export interface ZoomOffset {
  x: number;
  y: number;
}

/**
 * Callback type for zoom change notifications.
 */
export type ZoomChangeCallback = (scale: number, displayPercent: string) => void;

/**
 * Default zoom configuration matching acceptance criteria.
 * Zoom range: 25% to 400%, step: 10%
 */
export const DEFAULT_ZOOM_CONFIG: ZoomControllerConfig = {
  min: 0.25,
  max: 4.0,
  step: 0.1,
};

/**
 * ZoomController manages zoom state and calculations for the circuit renderer.
 * Provides methods for zooming in/out, fit-to-view, and zoom-around-point.
 */
export class ZoomController {
  private config: ZoomControllerConfig;
  private scale: number = 1.0;
  private offset: ZoomOffset = { x: 0, y: 0 };
  private onChange: ZoomChangeCallback | null = null;

  /**
   * Create a new ZoomController.
   * @param config - Optional partial configuration to merge with defaults
   */
  constructor(config?: Partial<ZoomControllerConfig>) {
    this.config = { ...DEFAULT_ZOOM_CONFIG, ...config };
  }

  /**
   * Create a ZoomController with configuration from CSS variables.
   * Reads --da-zoom-min and --da-zoom-max from document root.
   * @returns New ZoomController instance
   */
  static fromCSSVariables(): ZoomController {
    const style = getComputedStyle(document.documentElement);

    const minStr = style.getPropertyValue('--da-zoom-min').trim();
    const maxStr = style.getPropertyValue('--da-zoom-max').trim();

    const config: Partial<ZoomControllerConfig> = {};

    if (minStr) {
      const minVal = parseFloat(minStr);
      if (!isNaN(minVal)) {
        config.min = minVal;
      }
    }

    if (maxStr) {
      const maxVal = parseFloat(maxStr);
      if (!isNaN(maxVal)) {
        config.max = maxVal;
      }
    }

    return new ZoomController(config);
  }

  /**
   * Get the current zoom scale.
   * @returns Current scale (1.0 = 100%)
   */
  getScale(): number {
    return this.scale;
  }

  /**
   * Set the zoom scale, clamping to min/max range.
   * @param scale - New scale value
   */
  setScale(scale: number): void {
    const oldScale = this.scale;
    this.scale = this.clampScale(scale);

    if (this.scale !== oldScale) {
      this.notifyChange();
    }
  }

  /**
   * Zoom in by step amount.
   * @param step - Optional step override (default: config.step)
   */
  zoomIn(step?: number): void {
    const stepValue = step ?? this.config.step;
    this.setScale(this.scale + stepValue);
  }

  /**
   * Zoom out by step amount.
   * @param step - Optional step override (default: config.step)
   */
  zoomOut(step?: number): void {
    const stepValue = step ?? this.config.step;
    this.setScale(this.scale - stepValue);
  }

  /**
   * Calculate and set scale to fit content in viewport.
   * Applies 90% padding for visual comfort.
   * @param contentWidth - Width of content to fit
   * @param contentHeight - Height of content to fit
   * @param viewportWidth - Available viewport width
   * @param viewportHeight - Available viewport height
   * @returns The calculated scale value
   */
  zoomToFit(
    contentWidth: number,
    contentHeight: number,
    viewportWidth: number,
    viewportHeight: number
  ): number {
    // Handle edge cases
    if (
      contentWidth <= 0 ||
      contentHeight <= 0 ||
      viewportWidth <= 0 ||
      viewportHeight <= 0
    ) {
      return this.scale;
    }

    const scaleX = viewportWidth / contentWidth;
    const scaleY = viewportHeight / contentHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to add padding

    this.setScale(scale);
    return this.scale;
  }

  /**
   * Reset zoom to 100% (scale = 1.0).
   */
  reset(): void {
    this.setScale(1.0);
    this.offset = { x: 0, y: 0 };
  }

  /**
   * Get the zoom level as a display percentage string.
   * @returns Formatted string like "100%"
   */
  getDisplayPercent(): string {
    const percent = Math.round(this.scale * 100);
    return `${percent}%`;
  }

  /**
   * Get the current configuration.
   * @returns Copy of current config
   */
  getConfig(): ZoomControllerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration partially.
   * Clamps current scale to new bounds if needed.
   * @param config - Partial configuration to merge
   */
  updateConfig(config: Partial<ZoomControllerConfig>): void {
    this.config = { ...this.config, ...config };
    // Re-clamp scale to new bounds
    this.scale = this.clampScale(this.scale);
  }

  /**
   * Zoom at a specific point, adjusting offset to keep point stationary.
   * This enables zoom-toward-cursor behavior for mouse wheel zoom.
   * @param x - X coordinate of zoom focal point
   * @param y - Y coordinate of zoom focal point
   * @param zoomIn - True to zoom in, false to zoom out
   * @param step - Optional step override
   */
  zoomAtPoint(x: number, y: number, zoomIn: boolean, step?: number): void {
    const oldScale = this.scale;
    const stepValue = step ?? this.config.step;
    const newScale = zoomIn
      ? this.clampScale(oldScale + stepValue)
      : this.clampScale(oldScale - stepValue);

    if (newScale === oldScale) {
      return; // No change
    }

    // Calculate offset adjustment to keep point under cursor stationary
    // Formula: newOffset = point - (point - oldOffset) * (newScale / oldScale)
    const scaleRatio = newScale / oldScale;
    this.offset = {
      x: x - (x - this.offset.x) * scaleRatio,
      y: y - (y - this.offset.y) * scaleRatio,
    };

    this.scale = newScale;
    this.notifyChange();
  }

  /**
   * Get the current pan offset.
   * @returns Copy of current offset
   */
  getOffset(): ZoomOffset {
    return { ...this.offset };
  }

  /**
   * Set the pan offset.
   * @param x - X offset
   * @param y - Y offset
   */
  setOffset(x: number, y: number): void {
    this.offset = { x, y };
  }

  /**
   * Set callback for zoom change notifications.
   * @param callback - Function to call on zoom change, or null to remove
   */
  setOnChange(callback: ZoomChangeCallback | null): void {
    this.onChange = callback;
  }

  /**
   * Clamp scale to config min/max range.
   * @param scale - Scale to clamp
   * @returns Clamped scale value
   */
  private clampScale(scale: number): number {
    return Math.max(this.config.min, Math.min(this.config.max, scale));
  }

  /**
   * Notify onChange callback if registered.
   */
  private notifyChange(): void {
    if (this.onChange) {
      this.onChange(this.scale, this.getDisplayPercent());
    }
  }
}
