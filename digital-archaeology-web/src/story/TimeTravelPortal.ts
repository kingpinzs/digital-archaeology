// src/story/TimeTravelPortal.ts
// Animated time-travel vortex portal for story transitions
// Renders a full-screen Canvas 2D swirling vortex effect

import { prefersReducedMotion } from '../visualizer/animationUtils';

/** Animation mode determines visual intensity and duration */
export type PortalMode = 'chapter' | 'persona';

/** A concentric ring in the vortex */
interface Ring {
  radius: number;
  speed: number;
  opacity: number;
  lineWidth: number;
}

/** A spiraling particle */
interface Particle {
  angle: number;
  radius: number;
  angularSpeed: number;
  inwardSpeed: number;
  opacity: number;
  trailLength: number;
  colorT: number;
  isSpark: boolean;
}

/** Color with RGB channels */
interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Configuration for a portal mode */
interface PortalConfig {
  ringCount: number;
  particleCount: number;
  duration: number;
  rotations: number;
  colors: RGB[];
}

/** Durations for each mode in milliseconds */
const DURATIONS: Record<PortalMode, number> = {
  chapter: 2000,
  persona: 5000,
};

/** Mode-specific visual configurations */
const CONFIGS: Record<PortalMode, PortalConfig> = {
  chapter: {
    ringCount: 8,
    particleCount: 80,
    duration: DURATIONS.chapter,
    rotations: 2,
    colors: [
      { r: 184, g: 115, b: 51 },  // copper
      { r: 212, g: 165, b: 116 },  // gold (#d4a574, matches --persona-gold)
    ],
  },
  persona: {
    ringCount: 14,
    particleCount: 150,
    duration: DURATIONS.persona,
    rotations: 3,
    colors: [
      { r: 212, g: 165, b: 116 },  // gold (#d4a574, matches --persona-gold)
      { r: 74, g: 158, b: 255 },  // blue (#4a9eff, matches --da-accent)
    ],
  },
};

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
  private playResolve: (() => void) | null = null;
  private rings: Ring[] = [];
  private particles: Particle[] = [];

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
   * Play the portal animation.
   * @param mode - 'chapter' for lighter transition, 'persona' for dramatic
   * @returns Promise that resolves when animation completes
   */
  play(mode: PortalMode): Promise<void> {
    // Return immediately if not mounted
    if (!this.canvas || !this.ctx) {
      return Promise.resolve();
    }

    // Return immediately if user prefers reduced motion
    if (prefersReducedMotion()) {
      return Promise.resolve();
    }

    // Cancel any in-flight animation
    if (this.playResolve) {
      this.playResolve();
      this.playResolve = null;
    }
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    const config = CONFIGS[mode];

    // Show backdrop
    if (this.backdropElement) {
      this.backdropElement.classList.add('da-portal-backdrop--visible');
    }

    // Size the canvas
    this.resizeCanvas();

    // Initialize rings and particles
    this.initRings(config);
    this.initParticles(config, mode);

    return new Promise<void>((resolve) => {
      this.playResolve = resolve;
      const startTime = performance.now();
      const duration = config.duration;

      const tick = () => {
        try {
          const elapsed = performance.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          this.renderFrame(progress, mode);

          if (progress < 1) {
            this.animationFrameId = requestAnimationFrame(tick);
          } else {
            // Animation complete — clear canvas so it doesn't obscure content beneath
            this.animationFrameId = null;
            if (this.ctx && this.canvas) {
              this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
            if (this.backdropElement) {
              this.backdropElement.classList.remove('da-portal-backdrop--visible');
            }
            if (this.playResolve) {
              this.playResolve();
              this.playResolve = null;
            }
          }
        } catch {
          // Resolve on error so the transition panel still shows
          this.animationFrameId = null;
          if (this.backdropElement) {
            this.backdropElement.classList.remove('da-portal-backdrop--visible');
          }
          if (this.playResolve) {
            this.playResolve();
            this.playResolve = null;
          }
        }
      };

      this.animationFrameId = requestAnimationFrame(tick);
    });
  }

  /**
   * Destroy the portal and clean up all resources.
   */
  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Resolve any in-flight play promise
    if (this.playResolve) {
      this.playResolve();
      this.playResolve = null;
    }

    this.backdropElement?.remove();
    this.backdropElement = null;

    this.canvas?.remove();
    this.canvas = null;
    this.ctx = null;

    this.container = null;
    this.rings = [];
    this.particles = [];
  }

  /**
   * Resize the canvas to fill the window, accounting for device pixel ratio.
   */
  private resizeCanvas(): void {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  }

  /**
   * Initialize concentric rings based on configuration.
   */
  private initRings(config: PortalConfig): void {
    this.rings = [];
    for (let i = 0; i < config.ringCount; i++) {
      const t = i / Math.max(config.ringCount - 1, 1);
      this.rings.push({
        radius: 0.05 + t * 0.40, // 0.05 to 0.45
        speed: 1.0 - t * 0.6,    // speed decreasing outward
        opacity: 1.0 - t * 0.6,  // opacity decreasing outward
        lineWidth: 2 - t * 1.2,  // thinner outward
      });
    }
  }

  /**
   * Initialize spiraling particles based on configuration and mode.
   */
  private initParticles(config: PortalConfig, mode: PortalMode): void {
    this.particles = [];
    for (let i = 0; i < config.particleCount; i++) {
      const isSpark = mode === 'persona' && Math.random() < 0.1;
      this.particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 0.05 + Math.random() * 0.45,
        angularSpeed: (0.5 + Math.random() * 1.5) * (Math.random() < 0.5 ? 1 : -1),
        inwardSpeed: isSpark ? -0.1 : 0.05 + Math.random() * 0.15,
        opacity: 0.3 + Math.random() * 0.7,
        trailLength: 3 + Math.random() * 12,
        colorT: Math.random(),
        isSpark,
      });
    }
  }

  /**
   * Render a single animation frame.
   */
  private renderFrame(progress: number, mode: PortalMode): void {
    const ctx = this.ctx;
    const canvas = this.canvas;
    if (!ctx || !canvas) return;

    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    const cx = w / 2;
    const cy = h / 2;
    const viewMin = Math.min(w, h);

    // Save state for screen shake
    ctx.save();

    // Persona mode: screen shake during 30%-85%
    if (mode === 'persona' && progress >= 0.3 && progress < 0.85) {
      const shakeX = (Math.random() - 0.5) * 4; // 2px max each direction
      const shakeY = (Math.random() - 0.5) * 4;
      ctx.translate(shakeX, shakeY);
    }

    // Dark background
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, w, h);

    // Layer 1: Concentric rings
    this.renderRings(progress, mode, cx, cy, viewMin);

    // Layer 2: Spiraling particles
    this.renderParticles(progress, mode, cx, cy, viewMin);

    // Layer 3: Center glow and flash
    this.renderCenterGlow(progress, mode, cx, cy, viewMin);

    // Restore from screen shake
    ctx.restore();
  }

  /**
   * Render concentric rings with rotation and color interpolation.
   */
  private renderRings(
    progress: number,
    mode: PortalMode,
    cx: number,
    cy: number,
    viewMin: number
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;

    const config = CONFIGS[mode];

    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];
      const t = i / Math.max(this.rings.length - 1, 1);

      // Phase-based scale-in: rings appear staggered
      const scaleInStart = t * 0.3;
      const scaleInEnd = scaleInStart + 0.2;
      const scaleIn = progress < scaleInStart ? 0
        : progress > scaleInEnd ? 1
        : (progress - scaleInStart) / (scaleInEnd - scaleInStart);

      // Fade-out in last 15%
      const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;

      const effectiveOpacity = ring.opacity * scaleIn * fadeOut;
      if (effectiveOpacity <= 0) continue;

      const radius = ring.radius * viewMin * scaleIn;
      const rotation = progress * Math.PI * 2 * config.rotations * ring.speed;

      // Color interpolation
      const color = this.lerpColor(config.colors[0], config.colors[1], t);

      // Persona mode: ring thickness pulsing
      let lineWidth = Math.max(ring.lineWidth, 0.5);
      if (mode === 'persona') {
        lineWidth *= 1 + 0.3 * Math.sin(progress * Math.PI * 6 + i);
      }

      ctx.beginPath();
      ctx.ellipse(
        cx,
        cy,
        radius,
        radius * 0.6, // slight vertical compression for 3D effect
        rotation,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${effectiveOpacity})`;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  /**
   * Render spiraling particles with trails.
   */
  private renderParticles(
    progress: number,
    mode: PortalMode,
    cx: number,
    cy: number,
    viewMin: number
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;

    const config = CONFIGS[mode];

    // Fade-out in last 15%
    const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;

    for (const particle of this.particles) {
      // Skip if not yet visible
      const appearTime = particle.colorT * 0.3;
      if (progress < appearTime) continue;

      const localProgress = progress - appearTime;

      // Calculate spiral position
      const angle = particle.angle + localProgress * particle.angularSpeed * Math.PI * 2 * config.rotations;
      const radius = Math.max(0, (particle.radius - localProgress * particle.inwardSpeed)) * viewMin;

      if (radius <= 0) continue;

      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius * 0.6; // match ring compression

      const effectiveOpacity = particle.opacity * fadeOut;
      if (effectiveOpacity <= 0) continue;

      // Color
      const color = this.lerpColor(config.colors[0], config.colors[1], particle.colorT);

      // Draw trail line
      const trailAngle = angle - particle.angularSpeed * 0.05 * Math.PI * 2;
      const trailX = cx + Math.cos(trailAngle) * radius;
      const trailY = cy + Math.sin(trailAngle) * radius * 0.6;

      ctx.beginPath();
      ctx.moveTo(trailX, trailY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${effectiveOpacity * 0.5})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw particle dot
      const dotSize = particle.isSpark ? 3 : 2;
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${effectiveOpacity})`;
      ctx.fillRect(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);

      // Persona mode: glow effect on long trails
      if (mode === 'persona' && particle.trailLength > 10) {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${effectiveOpacity * 0.3})`;
        ctx.fill();
      }
    }
  }

  /**
   * Render center glow and flash effects.
   */
  private renderCenterGlow(
    progress: number,
    mode: PortalMode,
    cx: number,
    cy: number,
    viewMin: number
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;

    const config = CONFIGS[mode];
    const primaryColor = config.colors[0];

    // Glow intensity phases:
    // 0%-30%: building
    // 30%-70%: glow builds
    // 70%-85%: peak + flash
    // 85%-100%: fade out
    let glowIntensity = 0;
    if (progress < 0.3) {
      glowIntensity = progress / 0.3 * 0.3;
    } else if (progress < 0.7) {
      glowIntensity = 0.3 + (progress - 0.3) / 0.4 * 0.5;
    } else if (progress < 0.85) {
      glowIntensity = 0.8 + (progress - 0.7) / 0.15 * 0.2;
    } else {
      glowIntensity = 1.0 * (1 - (progress - 0.85) / 0.15);
    }

    if (glowIntensity <= 0) return;

    const glowRadius = viewMin * 0.3 * glowIntensity;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    gradient.addColorStop(0, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, ${glowIntensity * 0.6})`);
    gradient.addColorStop(0.5, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, ${glowIntensity * 0.2})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(cx - glowRadius, cy - glowRadius, glowRadius * 2, glowRadius * 2);

    // Flash effect at 70%-85%
    if (progress >= 0.7 && progress < 0.85) {
      const flashProgress = (progress - 0.7) / 0.15;
      let flashAlpha = 0;

      if (mode === 'chapter') {
        // Single sin pulse
        flashAlpha = Math.sin(flashProgress * Math.PI);
      } else {
        // Persona: double pulse (flash-dim-flash)
        flashAlpha = Math.sin(flashProgress * Math.PI * 2);
        flashAlpha = Math.abs(flashAlpha);
      }

      // Cap at 0.7 alpha
      flashAlpha = Math.min(flashAlpha * 0.7, 0.7);

      if (flashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
        const w = this.canvas!.style.width ? parseInt(this.canvas!.style.width) : window.innerWidth;
        const h = this.canvas!.style.height ? parseInt(this.canvas!.style.height) : window.innerHeight;
        ctx.fillRect(0, 0, w, h);
      }
    }
  }

  /**
   * Linearly interpolate between two RGB colors.
   */
  private lerpColor(a: RGB, b: RGB, t: number): RGB {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t),
    };
  }
}
