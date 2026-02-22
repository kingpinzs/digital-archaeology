// src/story/TimeTravelPortal.ts
// Animated time-travel vortex portal for story transitions
// Renders a full-screen Canvas 2D swirling vortex effect

/** Animation mode determines visual intensity and duration */
export type PortalMode = 'chapter' | 'persona';

/**
 * TimeTravelPortal renders a full-screen animated vortex effect
 * during story transitions. Lighter/faster for chapter transitions,
 * more dramatic for persona/act transitions.
 */
export class TimeTravelPortal {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private backdropElement: HTMLElement | null = null;
  private animationFrameId: number | null = null;

  /**
   * Mount the portal to a container element.
   * Creates canvas and backdrop but does not start animation.
   */
  mount(container: HTMLElement): void {
    this.container = container;

    // Create backdrop
    this.backdropElement = document.createElement('div');
    this.backdropElement.className = 'da-portal-backdrop';
    this.container.appendChild(this.backdropElement);

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'da-portal-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
  }

  /**
   * Destroy the portal and clean up all resources.
   */
  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.backdropElement?.remove();
    this.backdropElement = null;

    this.canvas?.remove();
    this.canvas = null;
    this.ctx = null;

    this.container = null;
  }
}
