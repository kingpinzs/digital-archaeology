// src/builder/RelayRenderer.ts
// Renders relay symbols and other builder components on canvas

import type { ComponentInstance, Position, SignalValue } from './types';
import { getComponentDefinition } from './ComponentDefinitions';

/**
 * Color configuration for component rendering.
 */
export interface ComponentColors {
  /** Body/frame color */
  body: string;
  /** Border/outline color */
  border: string;
  /** Label text color */
  text: string;
  /** Coil color (for relays) */
  coil: string;
  /** Contact/switch color */
  contact: string;
  /** High signal color */
  signalHigh: string;
  /** Low signal color */
  signalLow: string;
  /** Unknown signal color */
  signalUnknown: string;
  /** Selected highlight color */
  selected: string;
  /** Hover highlight color */
  hover: string;
  /** Port color */
  port: string;
  /** Port connected color */
  portConnected: string;
}

/**
 * Default colors matching the Digital Archaeology theme.
 */
export const DEFAULT_COMPONENT_COLORS: ComponentColors = {
  body: '#252542',
  border: '#3a3a52',
  text: '#e0e0e0',
  coil: '#4d96ff',
  contact: '#a0a0b0',
  signalHigh: '#00ff88',
  signalLow: '#3a3a3a',
  signalUnknown: '#ffaa00',
  selected: '#00b4d8',
  hover: '#48cae4',
  port: '#606080',
  portConnected: '#00b4d8',
};

/**
 * Rendering configuration.
 */
export interface RenderConfig {
  colors: ComponentColors;
  /** Line width for borders */
  lineWidth: number;
  /** Port radius */
  portRadius: number;
  /** Font for labels */
  font: string;
  /** Show port labels */
  showPortLabels: boolean;
}

/**
 * Default render configuration.
 */
export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  colors: DEFAULT_COMPONENT_COLORS,
  lineWidth: 2,
  portRadius: 6,
  font: '12px "JetBrains Mono", monospace',
  showPortLabels: false,
};

/**
 * RelayRenderer draws relay symbols and other builder components.
 */
export class RelayRenderer {
  private config: RenderConfig;

  constructor(config: Partial<RenderConfig> = {}) {
    this.config = { ...DEFAULT_RENDER_CONFIG, ...config };
    if (config.colors) {
      this.config.colors = { ...DEFAULT_COMPONENT_COLORS, ...config.colors };
    }
  }

  /**
   * Update render configuration.
   */
  setConfig(config: Partial<RenderConfig>): void {
    Object.assign(this.config, config);
    if (config.colors) {
      this.config.colors = { ...this.config.colors, ...config.colors };
    }
  }

  /**
   * Render a component on the canvas.
   * @param ctx Canvas 2D context
   * @param component Component instance to render
   * @param isSelected Whether the component is selected
   * @param isHovered Whether the component is hovered
   * @param connectedPorts Set of connected port IDs
   */
  renderComponent(
    ctx: CanvasRenderingContext2D,
    component: ComponentInstance,
    isSelected: boolean = false,
    isHovered: boolean = false,
    connectedPorts: Set<string> = new Set()
  ): void {
    const definition = getComponentDefinition(component.definitionId);
    if (!definition) return;

    ctx.save();

    // Move to component position and apply rotation
    ctx.translate(component.position.x, component.position.y);
    if (component.rotation !== 0) {
      // Rotate around center
      const cx = definition.width / 2;
      const cy = definition.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate((component.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    // Draw based on component type
    switch (definition.type) {
      case 'relay_no':
        this.drawRelayNO(ctx, definition.width, definition.height, component.state, isSelected, isHovered);
        break;
      case 'relay_nc':
        this.drawRelayNC(ctx, definition.width, definition.height, component.state, isSelected, isHovered);
        break;
      case 'power':
        this.drawPower(ctx, definition.width, definition.height, isSelected, isHovered);
        break;
      case 'ground':
        this.drawGround(ctx, definition.width, definition.height, isSelected, isHovered);
        break;
      case 'input':
        this.drawInput(ctx, definition.width, definition.height, component.state, isSelected, isHovered);
        break;
      case 'output':
        this.drawOutput(ctx, definition.width, definition.height, component.state, isSelected, isHovered);
        break;
      default:
        this.drawGenericGate(ctx, definition.width, definition.height, definition.name, isSelected, isHovered);
    }

    // Draw ports
    for (const port of definition.ports) {
      const isConnected = connectedPorts.has(port.id);
      this.drawPort(ctx, port.position, isConnected);
    }

    // Draw label if present
    if (component.label) {
      this.drawLabel(ctx, component.label, definition.width, definition.height);
    }

    ctx.restore();
  }

  /**
   * Draw a Normally Open relay symbol.
   * Shows coil on left, NO switch on right.
   */
  private drawRelayNO(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    state: ComponentInstance['state'],
    isSelected: boolean,
    isHovered: boolean
  ): void {
    const { colors, lineWidth } = this.config;
    const coilEnergized = state?.coilEnergized ?? false;
    const switchClosed = coilEnergized; // NO: closes when energized

    // Draw body background
    ctx.fillStyle = colors.body;
    ctx.strokeStyle = isSelected ? colors.selected : isHovered ? colors.hover : colors.border;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 4);
    ctx.fill();
    ctx.stroke();

    // Draw coil (left side)
    this.drawCoil(ctx, 10, 20, 30, 60, coilEnergized);

    // Draw NO switch (right side)
    this.drawNOSwitch(ctx, 45, 20, 30, 60, switchClosed);

    // Draw type label
    ctx.fillStyle = colors.text;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NO', width / 2, height - 5);
  }

  /**
   * Draw a Normally Closed relay symbol.
   * Shows coil on left, NC switch on right.
   */
  private drawRelayNC(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    state: ComponentInstance['state'],
    isSelected: boolean,
    isHovered: boolean
  ): void {
    const { colors, lineWidth } = this.config;
    const coilEnergized = state?.coilEnergized ?? false;
    const switchClosed = !coilEnergized; // NC: opens when energized

    // Draw body background
    ctx.fillStyle = colors.body;
    ctx.strokeStyle = isSelected ? colors.selected : isHovered ? colors.hover : colors.border;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 4);
    ctx.fill();
    ctx.stroke();

    // Draw coil (left side)
    this.drawCoil(ctx, 10, 20, 30, 60, coilEnergized);

    // Draw NC switch (right side)
    this.drawNCSwitch(ctx, 45, 20, 30, 60, switchClosed);

    // Draw type label
    ctx.fillStyle = colors.text;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NC', width / 2, height - 5);
  }

  /**
   * Draw the coil portion of a relay.
   */
  private drawCoil(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    energized: boolean
  ): void {
    const { colors, lineWidth } = this.config;

    // Coil box
    ctx.strokeStyle = energized ? colors.signalHigh : colors.coil;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.stroke();

    // Coil windings (zigzag)
    const windingCount = 4;
    const windingHeight = height / windingCount;
    ctx.beginPath();
    for (let i = 0; i < windingCount; i++) {
      const yPos = y + i * windingHeight;
      if (i % 2 === 0) {
        ctx.moveTo(x, yPos);
        ctx.lineTo(x + width, yPos + windingHeight / 2);
        ctx.lineTo(x, yPos + windingHeight);
      }
    }
    ctx.stroke();

    // Connection lines to ports
    ctx.beginPath();
    // Top connection (coil_in)
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width / 2, y - 15);
    ctx.lineTo(0, y - 15 + 20);
    // Bottom connection (coil_out)
    ctx.moveTo(x + width / 2, y + height);
    ctx.lineTo(x + width / 2, y + height + 15);
    ctx.lineTo(0, y + height + 15 - 20);
    ctx.stroke();
  }

  /**
   * Draw Normally Open switch symbol.
   */
  private drawNOSwitch(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    closed: boolean
  ): void {
    const { colors, lineWidth } = this.config;

    ctx.strokeStyle = colors.contact;
    ctx.lineWidth = lineWidth;

    // Top contact point
    ctx.beginPath();
    ctx.arc(x + width / 2, y + 5, 4, 0, Math.PI * 2);
    ctx.stroke();

    // Bottom contact point
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height - 5, 4, 0, Math.PI * 2);
    ctx.stroke();

    // Switch arm
    ctx.strokeStyle = closed ? colors.signalHigh : colors.contact;
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y + 5);
    if (closed) {
      // Closed: straight down
      ctx.lineTo(x + width / 2, y + height - 5);
    } else {
      // Open: angled
      ctx.lineTo(x + width / 2 + 15, y + height / 2);
    }
    ctx.stroke();

    // Connection lines to ports
    ctx.strokeStyle = colors.contact;
    ctx.beginPath();
    // Top connection (contact_in)
    ctx.moveTo(x + width / 2, y + 5);
    ctx.lineTo(80, 25);
    // Bottom connection (contact_out)
    ctx.moveTo(x + width / 2, y + height - 5);
    ctx.lineTo(80, 75);
    ctx.stroke();
  }

  /**
   * Draw Normally Closed switch symbol.
   */
  private drawNCSwitch(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    closed: boolean
  ): void {
    const { colors, lineWidth } = this.config;

    ctx.strokeStyle = colors.contact;
    ctx.lineWidth = lineWidth;

    // Top contact point
    ctx.beginPath();
    ctx.arc(x + width / 2, y + 5, 4, 0, Math.PI * 2);
    ctx.stroke();

    // Bottom contact point
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height - 5, 4, 0, Math.PI * 2);
    ctx.stroke();

    // Switch arm
    ctx.strokeStyle = closed ? colors.signalHigh : colors.contact;
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y + 5);
    if (closed) {
      // Closed: straight down
      ctx.lineTo(x + width / 2, y + height - 5);
    } else {
      // Open: angled away
      ctx.lineTo(x + width / 2 - 15, y + height / 2);
    }
    ctx.stroke();

    // NC indicator (small circle/dot on the switch)
    if (!closed) {
      ctx.fillStyle = colors.signalUnknown;
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Connection lines to ports
    ctx.strokeStyle = colors.contact;
    ctx.beginPath();
    // Top connection (contact_in)
    ctx.moveTo(x + width / 2, y + 5);
    ctx.lineTo(80, 25);
    // Bottom connection (contact_out)
    ctx.moveTo(x + width / 2, y + height - 5);
    ctx.lineTo(80, 75);
    ctx.stroke();
  }

  /**
   * Draw power source symbol (VCC).
   */
  private drawPower(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    isSelected: boolean,
    isHovered: boolean
  ): void {
    const { colors, lineWidth } = this.config;

    ctx.strokeStyle = isSelected ? colors.selected : isHovered ? colors.hover : colors.signalHigh;
    ctx.fillStyle = colors.signalHigh;
    ctx.lineWidth = lineWidth;

    const centerX = width / 2;

    // Draw upward arrow (power symbol)
    ctx.beginPath();
    ctx.moveTo(centerX, 5);
    ctx.lineTo(centerX - 10, 20);
    ctx.lineTo(centerX - 5, 20);
    ctx.lineTo(centerX - 5, 35);
    ctx.lineTo(centerX + 5, 35);
    ctx.lineTo(centerX + 5, 20);
    ctx.lineTo(centerX + 10, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Label
    ctx.fillStyle = colors.text;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VCC', centerX, height - 2);
  }

  /**
   * Draw ground symbol (GND).
   */
  private drawGround(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    isSelected: boolean,
    isHovered: boolean
  ): void {
    const { colors, lineWidth } = this.config;

    ctx.strokeStyle = isSelected ? colors.selected : isHovered ? colors.hover : colors.signalLow;
    ctx.lineWidth = lineWidth;

    const centerX = width / 2;

    // Draw ground symbol (three horizontal lines)
    ctx.beginPath();
    // Stem
    ctx.moveTo(centerX, 5);
    ctx.lineTo(centerX, 15);
    // Top bar
    ctx.moveTo(centerX - 12, 15);
    ctx.lineTo(centerX + 12, 15);
    // Middle bar
    ctx.moveTo(centerX - 8, 22);
    ctx.lineTo(centerX + 8, 22);
    // Bottom bar
    ctx.moveTo(centerX - 4, 29);
    ctx.lineTo(centerX + 4, 29);
    ctx.stroke();

    // Label
    ctx.fillStyle = colors.text;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GND', centerX, height - 2);
  }

  /**
   * Draw input port symbol.
   */
  private drawInput(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    state: ComponentInstance['state'],
    isSelected: boolean,
    isHovered: boolean
  ): void {
    const { colors, lineWidth } = this.config;

    // Get signal value
    const signal = state?.portValues?.get('out') ?? 0;
    const signalColor = this.getSignalColor(signal);

    ctx.strokeStyle = isSelected ? colors.selected : isHovered ? colors.hover : colors.border;
    ctx.fillStyle = signalColor;
    ctx.lineWidth = lineWidth;

    // Draw arrow pointing right
    ctx.beginPath();
    ctx.moveTo(5, height / 2 - 8);
    ctx.lineTo(5, height / 2 + 8);
    ctx.lineTo(width - 5, height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  /**
   * Draw output port symbol.
   */
  private drawOutput(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    state: ComponentInstance['state'],
    isSelected: boolean,
    isHovered: boolean
  ): void {
    const { colors, lineWidth } = this.config;

    // Get signal value
    const signal = state?.portValues?.get('in') ?? 2;
    const signalColor = this.getSignalColor(signal);

    ctx.strokeStyle = isSelected ? colors.selected : isHovered ? colors.hover : colors.border;
    ctx.fillStyle = signalColor;
    ctx.lineWidth = lineWidth;

    // Draw circle (LED-like indicator)
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  /**
   * Draw a generic gate symbol (for user-created gates).
   */
  private drawGenericGate(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    name: string,
    isSelected: boolean,
    isHovered: boolean
  ): void {
    const { colors, lineWidth } = this.config;

    ctx.fillStyle = colors.body;
    ctx.strokeStyle = isSelected ? colors.selected : isHovered ? colors.hover : colors.border;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 4);
    ctx.fill();
    ctx.stroke();

    // Draw name
    ctx.fillStyle = colors.text;
    ctx.font = this.config.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, width / 2, height / 2);
  }

  /**
   * Draw a port indicator.
   */
  private drawPort(
    ctx: CanvasRenderingContext2D,
    position: Position,
    isConnected: boolean
  ): void {
    const { colors, portRadius } = this.config;

    ctx.fillStyle = isConnected ? colors.portConnected : colors.port;
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.arc(position.x, position.y, portRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  /**
   * Draw a component label.
   */
  private drawLabel(
    ctx: CanvasRenderingContext2D,
    label: string,
    width: number,
    height: number
  ): void {
    const { colors, font } = this.config;

    ctx.fillStyle = colors.text;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, width / 2, height + 5);
  }

  /**
   * Get color for a signal value.
   */
  getSignalColor(value: SignalValue): string {
    const { colors } = this.config;
    switch (value) {
      case 1:
        return colors.signalHigh;
      case 0:
        return colors.signalLow;
      default:
        return colors.signalUnknown;
    }
  }

  /**
   * Render a wire connection.
   * @param ctx Canvas 2D context
   * @param startPos Start position
   * @param endPos End position
   * @param waypoints Intermediate waypoints
   * @param signal Signal value (for coloring)
   * @param isSelected Whether the wire is selected
   */
  renderWire(
    ctx: CanvasRenderingContext2D,
    startPos: Position,
    endPos: Position,
    waypoints: Position[] = [],
    signal: SignalValue = 2,
    isSelected: boolean = false
  ): void {
    const { colors, lineWidth } = this.config;

    ctx.strokeStyle = isSelected ? colors.selected : this.getSignalColor(signal);
    ctx.lineWidth = isSelected ? lineWidth + 1 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(startPos.x, startPos.y);

    for (const point of waypoints) {
      ctx.lineTo(point.x, point.y);
    }

    ctx.lineTo(endPos.x, endPos.y);
    ctx.stroke();

    // Draw connection dots at endpoints
    const dotRadius = 3;
    ctx.fillStyle = ctx.strokeStyle;

    ctx.beginPath();
    ctx.arc(startPos.x, startPos.y, dotRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(endPos.x, endPos.y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Render a ghost/preview component (for drag operations).
   * @param ctx Canvas 2D context
   * @param definitionId Component definition ID
   * @param position Position
   */
  renderGhost(
    ctx: CanvasRenderingContext2D,
    definitionId: string,
    position: Position
  ): void {
    const definition = getComponentDefinition(definitionId);
    if (!definition) return;

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.translate(position.x, position.y);

    // Draw simple outline
    ctx.strokeStyle = this.config.colors.selected;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.roundRect(0, 0, definition.width, definition.height, 4);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Render a selection box.
   * @param ctx Canvas 2D context
   * @param start Start corner position
   * @param end End corner position
   */
  renderSelectionBox(
    ctx: CanvasRenderingContext2D,
    start: Position,
    end: Position
  ): void {
    ctx.save();

    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    ctx.fillStyle = 'rgba(0, 180, 216, 0.1)';
    ctx.strokeStyle = this.config.colors.selected;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
