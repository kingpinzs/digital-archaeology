// src/builder/WireDrawingTool.ts
// Handles wire drawing with orthogonal routing

import type { Position } from './types';

/**
 * Routing style for wires.
 */
export type WireRoutingStyle = 'orthogonal' | 'diagonal' | 'direct';

/**
 * Direction for orthogonal routing.
 */
export type Direction = 'horizontal' | 'vertical';

/**
 * Wire drawing state.
 */
export interface WireDrawingState {
  /** Is wire drawing active */
  isDrawing: boolean;
  /** Start position */
  startPos: Position | null;
  /** Current end position */
  endPos: Position | null;
  /** Calculated waypoints */
  waypoints: Position[];
  /** Start component and port */
  startPort: { componentId: string; portId: string } | null;
  /** Target port being hovered */
  targetPort: { componentId: string; portId: string } | null;
  /** Whether the current target is valid */
  isValidTarget: boolean;
}

/**
 * Configuration for wire drawing.
 */
export interface WireDrawingConfig {
  /** Routing style */
  routingStyle: WireRoutingStyle;
  /** Minimum segment length for orthogonal routing */
  minSegmentLength: number;
  /** Preferred initial direction */
  preferredDirection: Direction;
  /** Snap to grid */
  snapToGrid: boolean;
  /** Grid size */
  gridSize: number;
}

/**
 * Default wire drawing configuration.
 */
export const DEFAULT_WIRE_CONFIG: WireDrawingConfig = {
  routingStyle: 'orthogonal',
  minSegmentLength: 10,
  preferredDirection: 'horizontal',
  snapToGrid: true,
  gridSize: 20,
};

/**
 * WireDrawingTool handles interactive wire creation.
 */
export class WireDrawingTool {
  private config: WireDrawingConfig;
  private state: WireDrawingState;

  constructor(config: Partial<WireDrawingConfig> = {}) {
    this.config = { ...DEFAULT_WIRE_CONFIG, ...config };
    this.state = this.createInitialState();
  }

  /**
   * Create initial state.
   */
  private createInitialState(): WireDrawingState {
    return {
      isDrawing: false,
      startPos: null,
      endPos: null,
      waypoints: [],
      startPort: null,
      targetPort: null,
      isValidTarget: false,
    };
  }

  /**
   * Update configuration.
   */
  setConfig(config: Partial<WireDrawingConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Get current state.
   */
  getState(): Readonly<WireDrawingState> {
    return this.state;
  }

  /**
   * Start wire drawing from a port.
   */
  startDrawing(
    position: Position,
    componentId: string,
    portId: string
  ): void {
    this.state.isDrawing = true;
    this.state.startPos = { ...position };
    this.state.endPos = { ...position };
    this.state.startPort = { componentId, portId };
    this.state.waypoints = [];
    this.state.targetPort = null;
    this.state.isValidTarget = false;
  }

  /**
   * Update wire endpoint during drawing.
   */
  updateEndpoint(position: Position): void {
    if (!this.state.isDrawing || !this.state.startPos) return;

    this.state.endPos = { ...position };
    this.state.waypoints = this.calculateWaypoints(
      this.state.startPos,
      position
    );
  }

  /**
   * Set target port being hovered.
   */
  setTargetPort(
    componentId: string | null,
    portId: string | null,
    isValid: boolean
  ): void {
    if (componentId && portId) {
      this.state.targetPort = { componentId, portId };
      this.state.isValidTarget = isValid;
    } else {
      this.state.targetPort = null;
      this.state.isValidTarget = false;
    }
  }

  /**
   * Finish wire drawing.
   * Returns the connection info if valid.
   */
  finishDrawing(): {
    sourceComponent: string;
    sourcePort: string;
    targetComponent: string;
    targetPort: string;
    waypoints: Position[];
  } | null {
    if (
      !this.state.isDrawing ||
      !this.state.startPort ||
      !this.state.targetPort ||
      !this.state.isValidTarget
    ) {
      this.cancel();
      return null;
    }

    const result = {
      sourceComponent: this.state.startPort.componentId,
      sourcePort: this.state.startPort.portId,
      targetComponent: this.state.targetPort.componentId,
      targetPort: this.state.targetPort.portId,
      waypoints: [...this.state.waypoints],
    };

    this.cancel();
    return result;
  }

  /**
   * Cancel wire drawing.
   */
  cancel(): void {
    this.state = this.createInitialState();
  }

  /**
   * Check if wire drawing is active.
   */
  isDrawing(): boolean {
    return this.state.isDrawing;
  }

  /**
   * Calculate waypoints between two positions.
   */
  calculateWaypoints(start: Position, end: Position): Position[] {
    switch (this.config.routingStyle) {
      case 'orthogonal':
        return this.calculateOrthogonalRoute(start, end);
      case 'diagonal':
        return this.calculateDiagonalRoute(start, end);
      case 'direct':
      default:
        return []; // No waypoints for direct routing
    }
  }

  /**
   * Calculate orthogonal route (L-shaped or Z-shaped).
   */
  private calculateOrthogonalRoute(start: Position, end: Position): Position[] {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // If endpoints are nearly aligned, use direct route
    if (Math.abs(dx) < this.config.minSegmentLength) {
      return []; // Vertical line
    }
    if (Math.abs(dy) < this.config.minSegmentLength) {
      return []; // Horizontal line
    }

    // Determine routing based on relative positions and preference
    if (this.config.preferredDirection === 'horizontal') {
      // Go horizontal first, then vertical (L-shape)
      const midX = start.x + dx / 2;
      return [
        { x: midX, y: start.y },
        { x: midX, y: end.y },
      ];
    } else {
      // Go vertical first, then horizontal (L-shape)
      const midY = start.y + dy / 2;
      return [
        { x: start.x, y: midY },
        { x: end.x, y: midY },
      ];
    }
  }

  /**
   * Calculate diagonal route (45-degree angles).
   */
  private calculateDiagonalRoute(start: Position, end: Position): Position[] {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    if (adx === 0 || ady === 0) {
      return []; // Already orthogonal
    }

    // Create 45-degree segment
    const diagLength = Math.min(adx, ady);
    const diagX = start.x + Math.sign(dx) * diagLength;
    const diagY = start.y + Math.sign(dy) * diagLength;

    if (adx > ady) {
      // Horizontal segment after diagonal
      return [{ x: diagX, y: diagY }];
    } else {
      // Vertical segment after diagonal
      return [{ x: diagX, y: diagY }];
    }
  }

  /**
   * Snap position to grid if enabled.
   */
  snapToGrid(position: Position): Position {
    if (!this.config.snapToGrid) return position;

    return {
      x: Math.round(position.x / this.config.gridSize) * this.config.gridSize,
      y: Math.round(position.y / this.config.gridSize) * this.config.gridSize,
    };
  }

  /**
   * Get preview path for rendering.
   * Returns array of points from start to end including waypoints.
   */
  getPreviewPath(): Position[] {
    if (!this.state.startPos || !this.state.endPos) {
      return [];
    }

    return [
      this.state.startPos,
      ...this.state.waypoints,
      this.state.endPos,
    ];
  }

  /**
   * Render preview wire on canvas.
   */
  renderPreview(
    ctx: CanvasRenderingContext2D,
    validColor: string = '#00ff88',
    invalidColor: string = '#ffaa00',
    lineWidth: number = 2
  ): void {
    if (!this.state.isDrawing) return;

    const path = this.getPreviewPath();
    if (path.length < 2) return;

    ctx.save();

    ctx.strokeStyle = this.state.isValidTarget ? validColor : invalidColor;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash([5, 5]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);

    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }

    ctx.stroke();

    // Draw endpoint indicator
    const endPoint = path[path.length - 1];
    ctx.beginPath();
    ctx.arc(endPoint.x, endPoint.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = this.state.isValidTarget ? validColor : invalidColor;
    ctx.fill();

    ctx.restore();
  }
}
