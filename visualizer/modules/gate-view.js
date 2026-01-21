/**
 * Gate-Level Animation Module
 *
 * Provides animated gate-level circuit visualization for the Digital
 * Archaeology CPU project visualizer. Renders logic gates with signal
 * propagation animation, supports X-Ray mode (CMOS transistor view),
 * and provides zoom/pan capabilities.
 *
 * Features:
 * - Renders AND, OR, NOT, XOR, NAND, NOR, XNOR, DFF, BUF gates
 * - Wire drawing with signal state color coding
 * - Particle animation for signal flow
 * - X-Ray mode showing CMOS transistor structure
 * - Zoom/pan for large circuits
 * - Event subscription for simulation updates
 * - 60fps animation via requestAnimationFrame
 *
 * @version 1.0.0
 */

(function(exports) {
    'use strict';

    // Get SimEngine dependencies if available
    const SimEngine = exports.SimEngine || {};
    const WireState = SimEngine.WireState || {
        LOW: 0,
        HIGH: 1,
        UNKNOWN: 2,
        HIGHZ: 3
    };
    const GateType = SimEngine.GateType || {
        NOT: 'NOT',
        AND: 'AND',
        OR: 'OR',
        NAND: 'NAND',
        NOR: 'NOR',
        XOR: 'XOR',
        XNOR: 'XNOR',
        BUF: 'BUF',
        DFF: 'DFF',
        DLATCH: 'DLATCH'
    };

    // =============================================
    // Color Scheme (matches existing UI)
    // =============================================
    const Colors = Object.freeze({
        BACKGROUND: '#0d0d1a',
        GRID: '#1a1a2e',
        GATE_BODY: '#16213e',
        GATE_BORDER: '#0f3460',
        GATE_BORDER_ACTIVE: '#e94560',
        TEXT: '#eeeeee',
        TEXT_MUTED: '#888888',
        TEXT_LABEL: '#e94560',
        WIRE_HIGH: '#00ff00',       // Green for HIGH
        WIRE_LOW: '#0077cc',        // Blue for LOW
        WIRE_UNKNOWN: '#555555',    // Gray for unknown
        WIRE_HIGHZ: '#ff00ff',      // Magenta for high-Z
        HIGHLIGHT: '#ffaa00',       // Orange for active gate
        PMOS_ACTIVE: '#00ff00',     // Green for active PMOS
        NMOS_ACTIVE: '#0088dd',     // Blue for active NMOS
        TRANSISTOR_INACTIVE: '#555555',
        PARTICLE: '#00ff00',
        DFF_CLOCK: '#ff9900'
    });

    // =============================================
    // Gate Dimensions
    // =============================================
    const Dimensions = Object.freeze({
        GATE_WIDTH: 80,
        GATE_HEIGHT: 60,
        PORT_RADIUS: 5,
        BUBBLE_RADIUS: 5,
        DFF_WIDTH: 70,
        DFF_HEIGHT: 80,
        GRID_SIZE: 20,
        MIN_ZOOM: 0.1,
        MAX_ZOOM: 10,
        DEFAULT_ZOOM: 1
    });

    // =============================================
    // Helper Functions
    // =============================================

    /**
     * Get color for a wire state
     */
    function getWireColor(state) {
        switch (state) {
            case WireState.HIGH: return Colors.WIRE_HIGH;
            case WireState.LOW: return Colors.WIRE_LOW;
            case WireState.HIGHZ: return Colors.WIRE_HIGHZ;
            default: return Colors.WIRE_UNKNOWN;
        }
    }

    /**
     * Get state string for display
     */
    function getStateString(state) {
        switch (state) {
            case WireState.HIGH: return '1';
            case WireState.LOW: return '0';
            case WireState.HIGHZ: return 'Z';
            default: return 'X';
        }
    }

    /**
     * Clamp a value between min and max
     */
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Linear interpolation
     */
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Bezier curve point calculation
     */
    function bezierPoint(p0, p1, p2, p3, t) {
        const t2 = t * t;
        const t3 = t2 * t;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        return {
            x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
            y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
        };
    }

    // =============================================
    // Particle Class (for signal flow animation)
    // =============================================
    class Particle {
        constructor(from, to, color) {
            this.from = { x: from.x, y: from.y };
            this.to = { x: to.x, y: to.y };
            this.color = color;
            this.progress = 0;
            this.speed = 0.03;  // Progress per frame
            this.size = 4;
            this.alive = true;
        }

        update() {
            this.progress += this.speed;
            if (this.progress >= 1) {
                this.alive = false;
            }
        }

        getPosition() {
            return {
                x: lerp(this.from.x, this.to.x, this.progress),
                y: lerp(this.from.y, this.to.y, this.progress)
            };
        }

        draw(ctx) {
            if (!this.alive || this.progress < 0) return;

            const pos = this.getPosition();
            ctx.save();
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.restore();
        }
    }

    // =============================================
    // LayoutEngine - Auto-positions gates
    // =============================================
    class LayoutEngine {
        constructor() {
            this.positions = new Map();  // gate/wire index -> {x, y}
            this.wirePositions = new Map();
        }

        /**
         * Calculate positions for circuit elements
         */
        calculate(circuit) {
            this.positions.clear();
            this.wirePositions.clear();

            if (!circuit || !circuit.gates) return;

            const gates = circuit.gates;
            const wires = circuit.wires || [];

            // Group gates by depth (simple topological ordering)
            const depths = this._calculateDepths(gates, wires);

            // Position by depth
            const depthGroups = new Map();
            for (let i = 0; i < gates.length; i++) {
                const depth = depths[i] || 0;
                if (!depthGroups.has(depth)) {
                    depthGroups.set(depth, []);
                }
                depthGroups.get(depth).push(i);
            }

            // Layout gates
            const sortedDepths = Array.from(depthGroups.keys()).sort((a, b) => a - b);
            const marginX = 150;
            const marginY = 100;
            const gateSpacingY = Dimensions.GATE_HEIGHT + 40;

            for (const depth of sortedDepths) {
                const gatesAtDepth = depthGroups.get(depth);
                const x = marginX + depth * marginX;

                for (let i = 0; i < gatesAtDepth.length; i++) {
                    const gateIdx = gatesAtDepth[i];
                    const y = marginY + i * gateSpacingY;
                    this.positions.set(gateIdx, { x, y });
                }
            }

            // Position wires (input wires on left, output wires on right)
            let inputY = marginY;
            let outputY = marginY;
            const inputX = 30;
            const outputX = marginX + (sortedDepths.length + 1) * marginX;

            for (let i = 0; i < wires.length; i++) {
                const wire = wires[i];
                if (wire.name === 'gnd' || wire.name === 'vdd') continue;

                if (wire.isInput || wire.is_input) {
                    this.wirePositions.set(i, { x: inputX, y: inputY, isInput: true });
                    inputY += 40;
                } else if (wire.isOutput || wire.is_output) {
                    this.wirePositions.set(i, { x: outputX, y: outputY, isOutput: true });
                    outputY += 40;
                }
            }
        }

        /**
         * Calculate depth for each gate (distance from inputs)
         */
        _calculateDepths(gates, wires) {
            const depths = [];
            const outputWireToGate = new Map();

            // Map output wires to gates
            for (let i = 0; i < gates.length; i++) {
                const gate = gates[i];
                if (gate.outputs) {
                    for (const out of gate.outputs) {
                        const wireIdx = out.wire !== undefined ? out.wire : out.wireIndex;
                        outputWireToGate.set(wireIdx, i);
                    }
                }
                depths[i] = 0;
            }

            // Calculate depths
            let changed = true;
            let iterations = 0;
            while (changed && iterations < 100) {
                changed = false;
                iterations++;

                for (let i = 0; i < gates.length; i++) {
                    const gate = gates[i];
                    if (!gate.inputs) continue;

                    for (const inp of gate.inputs) {
                        const wireIdx = inp.wire !== undefined ? inp.wire : inp.wireIndex;
                        const srcGate = outputWireToGate.get(wireIdx);
                        if (srcGate !== undefined && depths[srcGate] + 1 > depths[i]) {
                            depths[i] = depths[srcGate] + 1;
                            changed = true;
                        }
                    }
                }
            }

            return depths;
        }

        getGatePosition(gateIndex) {
            return this.positions.get(gateIndex) || { x: 100, y: 100 };
        }

        getWirePosition(wireIndex) {
            return this.wirePositions.get(wireIndex) || null;
        }
    }

    // =============================================
    // GateRenderer - Draws individual gate types
    // =============================================
    class GateRenderer {
        constructor(ctx) {
            this.ctx = ctx;
        }

        /**
         * Draw a gate at the specified position
         */
        draw(gate, x, y, inputStates, outputState, options = {}) {
            const type = (gate.type || 'AND').toUpperCase();
            const highlighted = options.highlighted || false;
            const xrayMode = options.xrayMode || false;

            switch (type) {
                case 'NOT':
                case 'BUF':
                    this._drawNot(x, y, inputStates, outputState, highlighted, xrayMode, type === 'BUF');
                    break;
                case 'AND':
                    this._drawAnd(x, y, inputStates, outputState, highlighted, xrayMode);
                    break;
                case 'OR':
                    this._drawOr(x, y, inputStates, outputState, highlighted, xrayMode);
                    break;
                case 'NAND':
                    this._drawNand(x, y, inputStates, outputState, highlighted, xrayMode);
                    break;
                case 'NOR':
                    this._drawNor(x, y, inputStates, outputState, highlighted, xrayMode);
                    break;
                case 'XOR':
                    this._drawXor(x, y, inputStates, outputState, highlighted, xrayMode);
                    break;
                case 'XNOR':
                    this._drawXnor(x, y, inputStates, outputState, highlighted, xrayMode);
                    break;
                case 'DFF':
                case 'DLATCH':
                    this._drawDff(x, y, gate, inputStates, outputState, highlighted, xrayMode);
                    break;
                default:
                    this._drawGeneric(x, y, type, inputStates, outputState, highlighted);
            }

            // Draw gate name label
            if (gate.name) {
                this._drawLabel(x, y, gate.name);
            }
        }

        /**
         * Draw NOT gate (triangle with bubble)
         */
        _drawNot(x, y, inputStates, outputState, highlighted, xrayMode, isBuffer = false) {
            const ctx = this.ctx;
            const w = Dimensions.GATE_WIDTH;
            const h = Dimensions.GATE_HEIGHT;
            const midY = y + h / 2;

            // Gate body (triangle)
            ctx.save();
            ctx.fillStyle = Colors.GATE_BODY;
            ctx.strokeStyle = highlighted ? Colors.HIGHLIGHT : this._getBorderColor(outputState);
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(x + 10, y + 10);
            ctx.lineTo(x + w - 20, midY);
            ctx.lineTo(x + 10, y + h - 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Inversion bubble (only for NOT)
            if (!isBuffer) {
                ctx.beginPath();
                ctx.arc(x + w - 15, midY, Dimensions.BUBBLE_RADIUS, 0, Math.PI * 2);
                ctx.fillStyle = Colors.GATE_BODY;
                ctx.fill();
                ctx.stroke();
            }

            // X-Ray mode overlay
            if (xrayMode) {
                this._drawCmosNot(x, y, w, h, inputStates, outputState);
            }

            ctx.restore();

            // Draw ports
            this._drawPort(x, midY, inputStates[0], 'left');
            this._drawPort(x + w, midY, outputState, 'right');
        }

        /**
         * Draw AND gate (D-shape)
         */
        _drawAnd(x, y, inputStates, outputState, highlighted, xrayMode) {
            const ctx = this.ctx;
            const w = Dimensions.GATE_WIDTH;
            const h = Dimensions.GATE_HEIGHT;
            const midY = y + h / 2;

            ctx.save();
            ctx.fillStyle = Colors.GATE_BODY;
            ctx.strokeStyle = highlighted ? Colors.HIGHLIGHT : this._getBorderColor(outputState);
            ctx.lineWidth = 2;

            // D-shape body
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 8);
            ctx.lineTo(x + w / 2, y + 8);
            ctx.arc(x + w / 2, midY, h / 2 - 8, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(x + 10, y + h - 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // X-Ray mode
            if (xrayMode) {
                this._drawCmos2Input(x, y, w, h, 'AND', inputStates, outputState);
            }

            ctx.restore();

            // Input ports
            this._drawPort(x, y + h * 0.3, inputStates[0], 'left');
            this._drawPort(x, y + h * 0.7, inputStates[1], 'left');
            // Output port
            this._drawPort(x + w, midY, outputState, 'right');
        }

        /**
         * Draw OR gate (curved body)
         */
        _drawOr(x, y, inputStates, outputState, highlighted, xrayMode) {
            const ctx = this.ctx;
            const w = Dimensions.GATE_WIDTH;
            const h = Dimensions.GATE_HEIGHT;
            const midY = y + h / 2;

            ctx.save();
            ctx.fillStyle = Colors.GATE_BODY;
            ctx.strokeStyle = highlighted ? Colors.HIGHLIGHT : this._getBorderColor(outputState);
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(x + 10, y + 8);
            ctx.quadraticCurveTo(x + w * 0.7, y + 8, x + w - 8, midY);
            ctx.quadraticCurveTo(x + w * 0.7, y + h - 8, x + 10, y + h - 8);
            ctx.quadraticCurveTo(x + w * 0.3, midY, x + 10, y + 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            if (xrayMode) {
                this._drawCmos2Input(x, y, w, h, 'OR', inputStates, outputState);
            }

            ctx.restore();

            this._drawPort(x, y + h * 0.3, inputStates[0], 'left');
            this._drawPort(x, y + h * 0.7, inputStates[1], 'left');
            this._drawPort(x + w, midY, outputState, 'right');
        }

        /**
         * Draw NAND gate (AND with bubble)
         */
        _drawNand(x, y, inputStates, outputState, highlighted, xrayMode) {
            const ctx = this.ctx;
            const w = Dimensions.GATE_WIDTH;
            const h = Dimensions.GATE_HEIGHT;
            const midY = y + h / 2;

            ctx.save();
            ctx.fillStyle = Colors.GATE_BODY;
            ctx.strokeStyle = highlighted ? Colors.HIGHLIGHT : this._getBorderColor(outputState);
            ctx.lineWidth = 2;

            // AND body
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 8);
            ctx.lineTo(x + w / 2 - 5, y + 8);
            ctx.arc(x + w / 2 - 5, midY, h / 2 - 8, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(x + 10, y + h - 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Bubble
            ctx.beginPath();
            ctx.arc(x + w - 10, midY, Dimensions.BUBBLE_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = Colors.GATE_BODY;
            ctx.fill();
            ctx.stroke();

            if (xrayMode) {
                this._drawCmos2Input(x, y, w, h, 'NAND', inputStates, outputState);
            }

            ctx.restore();

            this._drawPort(x, y + h * 0.3, inputStates[0], 'left');
            this._drawPort(x, y + h * 0.7, inputStates[1], 'left');
            this._drawPort(x + w, midY, outputState, 'right');
        }

        /**
         * Draw NOR gate (OR with bubble)
         */
        _drawNor(x, y, inputStates, outputState, highlighted, xrayMode) {
            const ctx = this.ctx;
            const w = Dimensions.GATE_WIDTH;
            const h = Dimensions.GATE_HEIGHT;
            const midY = y + h / 2;

            ctx.save();
            ctx.fillStyle = Colors.GATE_BODY;
            ctx.strokeStyle = highlighted ? Colors.HIGHLIGHT : this._getBorderColor(outputState);
            ctx.lineWidth = 2;

            // OR body
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 8);
            ctx.quadraticCurveTo(x + w * 0.6, y + 8, x + w - 18, midY);
            ctx.quadraticCurveTo(x + w * 0.6, y + h - 8, x + 10, y + h - 8);
            ctx.quadraticCurveTo(x + w * 0.3, midY, x + 10, y + 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Bubble
            ctx.beginPath();
            ctx.arc(x + w - 10, midY, Dimensions.BUBBLE_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = Colors.GATE_BODY;
            ctx.fill();
            ctx.stroke();

            if (xrayMode) {
                this._drawCmos2Input(x, y, w, h, 'NOR', inputStates, outputState);
            }

            ctx.restore();

            this._drawPort(x, y + h * 0.3, inputStates[0], 'left');
            this._drawPort(x, y + h * 0.7, inputStates[1], 'left');
            this._drawPort(x + w, midY, outputState, 'right');
        }

        /**
         * Draw XOR gate (OR with extra curved line)
         */
        _drawXor(x, y, inputStates, outputState, highlighted, xrayMode) {
            const ctx = this.ctx;
            const w = Dimensions.GATE_WIDTH;
            const h = Dimensions.GATE_HEIGHT;
            const midY = y + h / 2;

            ctx.save();
            ctx.fillStyle = Colors.GATE_BODY;
            ctx.strokeStyle = highlighted ? Colors.HIGHLIGHT : this._getBorderColor(outputState);
            ctx.lineWidth = 2;

            // OR body (shifted right)
            ctx.beginPath();
            ctx.moveTo(x + 18, y + 8);
            ctx.quadraticCurveTo(x + w * 0.7, y + 8, x + w - 8, midY);
            ctx.quadraticCurveTo(x + w * 0.7, y + h - 8, x + 18, y + h - 8);
            ctx.quadraticCurveTo(x + w * 0.35, midY, x + 18, y + 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Extra input curve
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 8);
            ctx.quadraticCurveTo(x + w * 0.28, midY, x + 10, y + h - 8);
            ctx.stroke();

            if (xrayMode) {
                this._drawCmos2Input(x, y, w, h, 'XOR', inputStates, outputState);
            }

            ctx.restore();

            this._drawPort(x, y + h * 0.3, inputStates[0], 'left');
            this._drawPort(x, y + h * 0.7, inputStates[1], 'left');
            this._drawPort(x + w, midY, outputState, 'right');
        }

        /**
         * Draw XNOR gate (XOR with bubble)
         */
        _drawXnor(x, y, inputStates, outputState, highlighted, xrayMode) {
            const ctx = this.ctx;
            const w = Dimensions.GATE_WIDTH;
            const h = Dimensions.GATE_HEIGHT;
            const midY = y + h / 2;

            ctx.save();
            ctx.fillStyle = Colors.GATE_BODY;
            ctx.strokeStyle = highlighted ? Colors.HIGHLIGHT : this._getBorderColor(outputState);
            ctx.lineWidth = 2;

            // XOR body
            ctx.beginPath();
            ctx.moveTo(x + 18, y + 8);
            ctx.quadraticCurveTo(x + w * 0.6, y + 8, x + w - 18, midY);
            ctx.quadraticCurveTo(x + w * 0.6, y + h - 8, x + 18, y + h - 8);
            ctx.quadraticCurveTo(x + w * 0.35, midY, x + 18, y + 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Extra curve
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 8);
            ctx.quadraticCurveTo(x + w * 0.28, midY, x + 10, y + h - 8);
            ctx.stroke();

            // Bubble
            ctx.beginPath();
            ctx.arc(x + w - 10, midY, Dimensions.BUBBLE_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = Colors.GATE_BODY;
            ctx.fill();
            ctx.stroke();

            if (xrayMode) {
                this._drawCmos2Input(x, y, w, h, 'XNOR', inputStates, outputState);
            }

            ctx.restore();

            this._drawPort(x, y + h * 0.3, inputStates[0], 'left');
            this._drawPort(x, y + h * 0.7, inputStates[1], 'left');
            this._drawPort(x + w, midY, outputState, 'right');
        }

        /**
         * Draw D Flip-Flop
         */
        _drawDff(x, y, gate, inputStates, outputState, highlighted, xrayMode) {
            const ctx = this.ctx;
            const w = Dimensions.DFF_WIDTH;
            const h = Dimensions.DFF_HEIGHT;

            ctx.save();
            ctx.fillStyle = Colors.GATE_BODY;
            ctx.strokeStyle = highlighted ? Colors.HIGHLIGHT : this._getBorderColor(outputState);
            ctx.lineWidth = 2;

            // Rectangle body
            ctx.beginPath();
            ctx.rect(x + 5, y + 5, w - 10, h - 10);
            ctx.fill();
            ctx.stroke();

            // Clock triangle on left
            ctx.beginPath();
            ctx.moveTo(x + 5, y + h * 0.6 - 6);
            ctx.lineTo(x + 15, y + h * 0.6);
            ctx.lineTo(x + 5, y + h * 0.6 + 6);
            ctx.strokeStyle = Colors.DFF_CLOCK;
            ctx.stroke();

            // Labels
            ctx.fillStyle = Colors.TEXT_MUTED;
            ctx.font = '10px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('D', x + 10, y + h * 0.3 + 4);
            ctx.fillText('CLK', x + 10, y + h * 0.6 + 4);

            ctx.textAlign = 'right';
            ctx.fillText('Q', x + w - 10, y + h * 0.35 + 4);

            // Show stored value
            const storedValue = gate.storedValue !== undefined ? gate.storedValue : '?';
            ctx.fillStyle = outputState === WireState.HIGH ? Colors.WIRE_HIGH : Colors.WIRE_LOW;
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(storedValue.toString(), x + w / 2, y + h / 2 + 5);

            ctx.restore();

            // Ports: D input, Clock input, Q output
            this._drawPort(x, y + h * 0.3, inputStates[0], 'left');
            this._drawPort(x, y + h * 0.6, inputStates[1], 'left');
            this._drawPort(x + w, y + h * 0.35, outputState, 'right');
        }

        /**
         * Draw generic gate (for unknown types)
         */
        _drawGeneric(x, y, type, inputStates, outputState, highlighted) {
            const ctx = this.ctx;
            const w = Dimensions.GATE_WIDTH;
            const h = Dimensions.GATE_HEIGHT;

            ctx.save();
            ctx.fillStyle = Colors.GATE_BODY;
            ctx.strokeStyle = highlighted ? Colors.HIGHLIGHT : Colors.GATE_BORDER;
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.rect(x + 5, y + 5, w - 10, h - 10);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = Colors.TEXT;
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(type, x + w / 2, y + h / 2 + 4);
            ctx.restore();

            // Draw available ports
            const midY = y + h / 2;
            if (inputStates.length >= 1) {
                this._drawPort(x, midY, inputStates[0], 'left');
            }
            this._drawPort(x + w, midY, outputState, 'right');
        }

        /**
         * Draw CMOS NOT gate internals (X-Ray mode)
         */
        _drawCmosNot(x, y, w, h, inputStates, outputState) {
            const ctx = this.ctx;
            const midX = x + w / 2;
            const midY = y + h / 2;
            const outX = x + w - 20;

            const inHigh = inputStates[0] === WireState.HIGH;
            const pmosActive = outputState === WireState.HIGH;
            const nmosActive = outputState === WireState.LOW;

            // Semi-transparent overlay
            ctx.fillStyle = 'rgba(22, 33, 62, 0.7)';
            ctx.beginPath();
            ctx.rect(x + 12, y + 12, w - 24, h - 24);
            ctx.fill();

            // PMOS (top)
            const pmosY = y + 20;
            ctx.strokeStyle = pmosActive ? Colors.PMOS_ACTIVE : Colors.TRANSISTOR_INACTIVE;
            ctx.lineWidth = pmosActive ? 2 : 1;
            ctx.beginPath();
            ctx.arc(midX, pmosY, 6, 0, Math.PI * 2);
            ctx.stroke();

            // VDD to PMOS
            ctx.beginPath();
            ctx.moveTo(midX, y + 8);
            ctx.lineTo(midX, pmosY - 6);
            ctx.stroke();

            // PMOS to output
            ctx.beginPath();
            ctx.moveTo(midX + 6, pmosY);
            ctx.lineTo(outX, pmosY);
            ctx.lineTo(outX, midY);
            ctx.stroke();

            // NMOS (bottom)
            const nmosY = y + h - 20;
            ctx.strokeStyle = nmosActive ? Colors.NMOS_ACTIVE : Colors.TRANSISTOR_INACTIVE;
            ctx.lineWidth = nmosActive ? 2 : 1;
            ctx.beginPath();
            ctx.arc(midX, nmosY, 6, 0, Math.PI * 2);
            ctx.stroke();

            // GND to NMOS
            ctx.beginPath();
            ctx.moveTo(midX, y + h - 8);
            ctx.lineTo(midX, nmosY + 6);
            ctx.stroke();

            // NMOS to output
            ctx.beginPath();
            ctx.moveTo(midX + 6, nmosY);
            ctx.lineTo(outX, nmosY);
            ctx.lineTo(outX, midY);
            ctx.stroke();

            // Control input line
            ctx.strokeStyle = Colors.TEXT_MUTED;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 15, midY);
            ctx.lineTo(midX - 10, midY);
            ctx.lineTo(midX - 10, pmosY);
            ctx.moveTo(midX - 10, midY);
            ctx.lineTo(midX - 10, nmosY);
            ctx.stroke();

            // Transistor labels
            ctx.fillStyle = Colors.TEXT_MUTED;
            ctx.font = '7px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('P', midX + 12, pmosY + 2);
            ctx.fillText('N', midX + 12, nmosY + 2);
        }

        /**
         * Draw CMOS 2-input gate internals (X-Ray mode)
         */
        _drawCmos2Input(x, y, w, h, type, inputStates, outputState) {
            const ctx = this.ctx;
            const midX = x + w / 2;
            const midY = y + h / 2;

            // Semi-transparent overlay
            ctx.fillStyle = 'rgba(22, 33, 62, 0.7)';
            ctx.beginPath();
            ctx.rect(x + 12, y + 12, w - 24, h - 24);
            ctx.fill();

            // Simplified CMOS structure indicator
            const pmosActive = outputState === WireState.HIGH;
            const nmosActive = outputState === WireState.LOW;

            // PMOS network (top)
            ctx.strokeStyle = pmosActive ? Colors.PMOS_ACTIVE : Colors.TRANSISTOR_INACTIVE;
            ctx.lineWidth = pmosActive ? 2 : 1;
            ctx.beginPath();
            ctx.arc(midX - 8, y + 18, 4, 0, Math.PI * 2);
            ctx.arc(midX + 8, y + 18, 4, 0, Math.PI * 2);
            ctx.stroke();

            // NMOS network (bottom)
            ctx.strokeStyle = nmosActive ? Colors.NMOS_ACTIVE : Colors.TRANSISTOR_INACTIVE;
            ctx.lineWidth = nmosActive ? 2 : 1;
            ctx.beginPath();
            ctx.arc(midX - 8, y + h - 18, 4, 0, Math.PI * 2);
            ctx.arc(midX + 8, y + h - 18, 4, 0, Math.PI * 2);
            ctx.stroke();

            // Connection indicators
            ctx.strokeStyle = Colors.TEXT_MUTED;
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(midX, y + 22);
            ctx.lineTo(midX, midY - 5);
            ctx.moveTo(midX, midY + 5);
            ctx.lineTo(midX, y + h - 22);
            ctx.stroke();
            ctx.setLineDash([]);

            // Labels
            ctx.fillStyle = Colors.TEXT_MUTED;
            ctx.font = '7px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('PMOS', midX, y + 30);
            ctx.fillText('NMOS', midX, y + h - 28);
        }

        /**
         * Draw a port (input/output connection point)
         */
        _drawPort(x, y, state, side) {
            const ctx = this.ctx;
            const r = Dimensions.PORT_RADIUS;

            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = getWireColor(state);
            ctx.fill();
            ctx.strokeStyle = Colors.TEXT_MUTED;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }

        /**
         * Draw gate label
         */
        _drawLabel(x, y, name) {
            const ctx = this.ctx;
            ctx.save();
            ctx.fillStyle = Colors.TEXT_LABEL;
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(name, x + Dimensions.GATE_WIDTH / 2, y - 5);
            ctx.restore();
        }

        /**
         * Get border color based on output state
         */
        _getBorderColor(outputState) {
            switch (outputState) {
                case WireState.HIGH: return Colors.WIRE_HIGH;
                case WireState.LOW: return Colors.WIRE_LOW;
                default: return Colors.GATE_BORDER;
            }
        }
    }

    // =============================================
    // WireRenderer - Draws wires between gates
    // =============================================
    class WireRenderer {
        constructor(ctx) {
            this.ctx = ctx;
        }

        /**
         * Draw a wire between two points
         */
        draw(from, to, state, options = {}) {
            const ctx = this.ctx;
            const color = getWireColor(state);
            const highlighted = options.highlighted || false;

            ctx.save();
            ctx.strokeStyle = highlighted ? Colors.HIGHLIGHT : color;
            ctx.lineWidth = highlighted ? 4 : 2;

            // Draw curved bezier wire
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            const midX = (from.x + to.x) / 2;
            ctx.bezierCurveTo(midX, from.y, midX, to.y, to.x, to.y);
            ctx.stroke();

            // Draw signal state at midpoint
            if (options.showState) {
                const midY = (from.y + to.y) / 2;
                ctx.fillStyle = color;
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(getStateString(state), midX, midY - 8);
            }

            ctx.restore();
        }

        /**
         * Draw wire with orthogonal routing
         */
        drawOrthogonal(from, to, state, options = {}) {
            const ctx = this.ctx;
            const color = getWireColor(state);

            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            // Horizontal first, then vertical
            ctx.lineTo(to.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
            ctx.restore();
        }
    }

    // =============================================
    // GateView - Main View Class
    // =============================================
    class GateView {
        /**
         * Create a new GateView
         * @param {HTMLCanvasElement|string} canvasElement - Canvas element or ID
         * @param {Object} options - Configuration options
         */
        constructor(canvasElement, options = {}) {
            // Resolve canvas element
            this.canvas = typeof canvasElement === 'string'
                ? document.getElementById(canvasElement)
                : canvasElement;

            if (!this.canvas || !(this.canvas instanceof HTMLCanvasElement)) {
                throw new Error('GateView: Invalid canvas element');
            }

            this.ctx = this.canvas.getContext('2d');

            // Options
            this.options = {
                autoResize: options.autoResize !== false,
                showGrid: options.showGrid !== false,
                showWireStates: options.showWireStates || false,
                animateParticles: options.animateParticles !== false,
                particleSpawnRate: options.particleSpawnRate || 0.15,
                ...options
            };

            // View state
            this.zoom = Dimensions.DEFAULT_ZOOM;
            this.panX = 0;
            this.panY = 0;
            this.xrayMode = false;
            this.highlightedGate = -1;

            // Circuit data
            this.circuit = null;
            this.circuitData = null;
            this.wireStates = new Map();
            this.gateOutputs = new Map();

            // Animation
            this.particles = [];
            this._animationId = null;
            this._lastFrameTime = 0;

            // Rendering helpers
            this.layoutEngine = new LayoutEngine();
            this.gateRenderer = new GateRenderer(this.ctx);
            this.wireRenderer = new WireRenderer(this.ctx);

            // Event system
            this._eventListeners = {
                gateClick: [],
                wireClick: [],
                update: [],
                error: []
            };

            // Interaction state
            this._isPanning = false;
            this._lastMouseX = 0;
            this._lastMouseY = 0;

            // Initialize
            this._setupEventHandlers();
            if (this.options.autoResize) {
                this._setupResizeHandler();
            }
            this._resizeCanvas();
        }

        // =============================================
        // Public API
        // =============================================

        /**
         * Load a circuit for visualization
         * @param {Circuit|Object} circuit - SimEngine Circuit or circuit JSON
         */
        loadCircuit(circuit) {
            if (!circuit) {
                this._emit('error', 'No circuit provided');
                return;
            }

            // Handle SimEngine Circuit or raw JSON
            if (circuit.wires && circuit.gates) {
                // Could be Circuit instance or JSON
                if (typeof circuit.toJSON === 'function') {
                    this.circuit = circuit;
                    this.circuitData = circuit.toJSON();
                } else {
                    this.circuit = null;
                    this.circuitData = circuit;
                }
            } else {
                this._emit('error', 'Invalid circuit format');
                return;
            }

            // Calculate layout
            this.layoutEngine.calculate(this.circuitData);

            // Extract initial wire states
            this._extractWireStates();

            // Reset view
            this.panX = 0;
            this.panY = 0;
            this.zoom = 1;

            // Initial render
            this.render();
        }

        /**
         * Full render of the circuit
         */
        render() {
            if (!this.ctx) return;

            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            // Clear
            ctx.fillStyle = Colors.BACKGROUND;
            ctx.fillRect(0, 0, w, h);

            // Apply view transform
            ctx.save();
            ctx.translate(this.panX, this.panY);
            ctx.scale(this.zoom, this.zoom);

            // Draw grid
            if (this.options.showGrid) {
                this._drawGrid();
            }

            // Draw circuit
            if (this.circuitData) {
                this._drawWires();
                this._drawGates();
                this._drawInputOutputNodes();
            }

            // Draw particles
            this._drawParticles();

            ctx.restore();

            // Draw UI overlay (zoom level, etc.)
            this._drawOverlay();
        }

        /**
         * Update view after simulation step
         */
        update() {
            if (this.circuit) {
                // Update from live circuit
                this._extractWireStates();
            }

            // Spawn new particles for active signals
            if (this.options.animateParticles) {
                this._spawnParticles();
            }

            this.render();
            this._emit('update', { cycle: this.circuitData?.cycle || 0 });
        }

        /**
         * Set zoom level
         * @param {number} level - Zoom level (0.1 to 10)
         */
        setZoom(level) {
            this.zoom = clamp(level, Dimensions.MIN_ZOOM, Dimensions.MAX_ZOOM);
            this.render();
        }

        /**
         * Pan the viewport
         * @param {number} dx - X offset
         * @param {number} dy - Y offset
         */
        pan(dx, dy) {
            this.panX += dx;
            this.panY += dy;
            this.render();
        }

        /**
         * Enable/disable X-Ray mode (CMOS transistor view)
         * @param {boolean} enabled - Enable state
         */
        enableXRay(enabled) {
            this.xrayMode = enabled;
            this.render();
        }

        /**
         * Highlight a specific gate
         * @param {number} gateIndex - Gate index to highlight (-1 to clear)
         */
        highlightGate(gateIndex) {
            this.highlightedGate = gateIndex;
            this.render();
        }

        /**
         * Subscribe to events
         * @param {string} event - Event name
         * @param {Function} callback - Event callback
         */
        on(event, callback) {
            if (this._eventListeners[event]) {
                this._eventListeners[event].push(callback);
            }
            return this;
        }

        /**
         * Unsubscribe from events
         * @param {string} event - Event name
         * @param {Function} callback - Event callback
         */
        off(event, callback) {
            if (this._eventListeners[event]) {
                const idx = this._eventListeners[event].indexOf(callback);
                if (idx >= 0) {
                    this._eventListeners[event].splice(idx, 1);
                }
            }
            return this;
        }

        /**
         * Start animation loop
         */
        startAnimation() {
            if (this._animationId) return;
            this._lastFrameTime = performance.now();
            this._animate();
        }

        /**
         * Stop animation loop
         */
        stopAnimation() {
            if (this._animationId) {
                cancelAnimationFrame(this._animationId);
                this._animationId = null;
            }
        }

        /**
         * Clean up resources
         */
        dispose() {
            this.stopAnimation();
            this._removeEventHandlers();
            this.circuit = null;
            this.circuitData = null;
            this.particles = [];
            this._eventListeners = {
                gateClick: [],
                wireClick: [],
                update: [],
                error: []
            };
        }

        /**
         * Fit the circuit in the viewport
         */
        fitToView() {
            if (!this.circuitData || !this.circuitData.gates) return;

            // Find bounds
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;

            for (let i = 0; i < this.circuitData.gates.length; i++) {
                const pos = this.layoutEngine.getGatePosition(i);
                minX = Math.min(minX, pos.x);
                minY = Math.min(minY, pos.y);
                maxX = Math.max(maxX, pos.x + Dimensions.GATE_WIDTH);
                maxY = Math.max(maxY, pos.y + Dimensions.GATE_HEIGHT);
            }

            if (minX === Infinity) return;

            const margin = 50;
            const contentWidth = maxX - minX + margin * 2;
            const contentHeight = maxY - minY + margin * 2;

            const scaleX = this.canvas.width / contentWidth;
            const scaleY = this.canvas.height / contentHeight;
            this.zoom = Math.min(scaleX, scaleY, 2);

            this.panX = -minX * this.zoom + margin;
            this.panY = -minY * this.zoom + margin;

            this.render();
        }

        /**
         * Get circuit bounds
         */
        getBounds() {
            if (!this.circuitData) return null;

            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;

            for (let i = 0; i < (this.circuitData.gates?.length || 0); i++) {
                const pos = this.layoutEngine.getGatePosition(i);
                minX = Math.min(minX, pos.x);
                minY = Math.min(minY, pos.y);
                maxX = Math.max(maxX, pos.x + Dimensions.GATE_WIDTH);
                maxY = Math.max(maxY, pos.y + Dimensions.GATE_HEIGHT);
            }

            return { minX, minY, maxX, maxY };
        }

        // =============================================
        // Internal Methods
        // =============================================

        /**
         * Extract wire states from circuit
         */
        _extractWireStates() {
            this.wireStates.clear();
            this.gateOutputs.clear();

            if (!this.circuitData) return;

            // Extract wire states
            const wires = this.circuitData.wires || [];
            for (let i = 0; i < wires.length; i++) {
                const wire = wires[i];
                const state = wire.state ? wire.state[0] : WireState.UNKNOWN;
                this.wireStates.set(i, state);
            }

            // Extract gate outputs
            const gates = this.circuitData.gates || [];
            for (let i = 0; i < gates.length; i++) {
                const gate = gates[i];
                if (gate.outputs && gate.outputs.length > 0) {
                    const outWire = gate.outputs[0].wire !== undefined
                        ? gate.outputs[0].wire
                        : gate.outputs[0].wireIndex;
                    const state = this.wireStates.get(outWire) || WireState.UNKNOWN;
                    this.gateOutputs.set(i, state);
                }
            }
        }

        /**
         * Draw background grid
         */
        _drawGrid() {
            const ctx = this.ctx;
            const size = Dimensions.GRID_SIZE;
            const w = this.canvas.width / this.zoom + Math.abs(this.panX / this.zoom);
            const h = this.canvas.height / this.zoom + Math.abs(this.panY / this.zoom);

            ctx.strokeStyle = Colors.GRID;
            ctx.lineWidth = 0.5;

            for (let x = 0; x <= w; x += size) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }

            for (let y = 0; y <= h; y += size) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }
        }

        /**
         * Draw all wires
         */
        _drawWires() {
            if (!this.circuitData || !this.circuitData.gates) return;

            const gates = this.circuitData.gates;
            const wires = this.circuitData.wires || [];

            // Build wire-to-gate output map
            const wireOutputs = new Map();
            for (let i = 0; i < gates.length; i++) {
                const gate = gates[i];
                if (gate.outputs) {
                    for (const out of gate.outputs) {
                        const wireIdx = out.wire !== undefined ? out.wire : out.wireIndex;
                        wireOutputs.set(wireIdx, { gateIndex: i, bit: out.bit || 0 });
                    }
                }
            }

            // Draw wires from gate outputs to gate inputs
            for (let i = 0; i < gates.length; i++) {
                const gate = gates[i];
                if (!gate.inputs) continue;

                const destPos = this.layoutEngine.getGatePosition(i);
                const gateType = (gate.type || 'AND').toUpperCase();

                for (let inpIdx = 0; inpIdx < gate.inputs.length; inpIdx++) {
                    const inp = gate.inputs[inpIdx];
                    const wireIdx = inp.wire !== undefined ? inp.wire : inp.wireIndex;
                    const srcOutput = wireOutputs.get(wireIdx);

                    // Calculate input position on gate
                    let inY;
                    if (gateType === 'NOT' || gateType === 'BUF') {
                        inY = destPos.y + Dimensions.GATE_HEIGHT / 2;
                    } else if (gateType === 'DFF') {
                        inY = destPos.y + (inpIdx === 0 ? Dimensions.DFF_HEIGHT * 0.3 : Dimensions.DFF_HEIGHT * 0.6);
                    } else {
                        // 2-input gates
                        inY = destPos.y + Dimensions.GATE_HEIGHT * (inpIdx === 0 ? 0.3 : 0.7);
                    }

                    const to = { x: destPos.x, y: inY };
                    const state = this.wireStates.get(wireIdx) || WireState.UNKNOWN;

                    if (srcOutput) {
                        // Wire from another gate
                        const srcPos = this.layoutEngine.getGatePosition(srcOutput.gateIndex);
                        const srcGate = gates[srcOutput.gateIndex];
                        const srcType = (srcGate?.type || 'AND').toUpperCase();
                        const srcH = srcType === 'DFF' ? Dimensions.DFF_HEIGHT : Dimensions.GATE_HEIGHT;
                        const srcW = srcType === 'DFF' ? Dimensions.DFF_WIDTH : Dimensions.GATE_WIDTH;
                        const srcY = srcType === 'DFF' ? srcPos.y + srcH * 0.35 : srcPos.y + srcH / 2;
                        const from = { x: srcPos.x + srcW, y: srcY };
                        this.wireRenderer.draw(from, to, state, { showState: this.options.showWireStates });
                    } else {
                        // Wire from input node
                        const inputPos = this.layoutEngine.getWirePosition(wireIdx);
                        if (inputPos && inputPos.isInput) {
                            const from = { x: inputPos.x + 30, y: inputPos.y };
                            this.wireRenderer.draw(from, to, state, { showState: this.options.showWireStates });
                        }
                    }
                }
            }

            // Draw wires to output nodes
            for (let i = 0; i < wires.length; i++) {
                const wire = wires[i];
                const outputPos = this.layoutEngine.getWirePosition(i);
                if (!outputPos || !outputPos.isOutput) continue;

                const srcOutput = wireOutputs.get(i);
                const state = this.wireStates.get(i) || WireState.UNKNOWN;

                if (srcOutput) {
                    const srcPos = this.layoutEngine.getGatePosition(srcOutput.gateIndex);
                    const srcGate = gates[srcOutput.gateIndex];
                    const srcType = (srcGate?.type || 'AND').toUpperCase();
                    const srcH = srcType === 'DFF' ? Dimensions.DFF_HEIGHT : Dimensions.GATE_HEIGHT;
                    const srcW = srcType === 'DFF' ? Dimensions.DFF_WIDTH : Dimensions.GATE_WIDTH;
                    const srcY = srcType === 'DFF' ? srcPos.y + srcH * 0.35 : srcPos.y + srcH / 2;
                    const from = { x: srcPos.x + srcW, y: srcY };
                    const to = { x: outputPos.x - 10, y: outputPos.y };
                    this.wireRenderer.draw(from, to, state, { showState: this.options.showWireStates });
                }
            }
        }

        /**
         * Draw all gates
         */
        _drawGates() {
            if (!this.circuitData || !this.circuitData.gates) return;

            const gates = this.circuitData.gates;

            for (let i = 0; i < gates.length; i++) {
                const gate = gates[i];
                const pos = this.layoutEngine.getGatePosition(i);

                // Get input states
                const inputStates = [];
                if (gate.inputs) {
                    for (const inp of gate.inputs) {
                        const wireIdx = inp.wire !== undefined ? inp.wire : inp.wireIndex;
                        inputStates.push(this.wireStates.get(wireIdx) || WireState.UNKNOWN);
                    }
                }

                // Get output state
                const outputState = this.gateOutputs.get(i) || WireState.UNKNOWN;

                // Draw gate
                this.gateRenderer.draw(gate, pos.x, pos.y, inputStates, outputState, {
                    highlighted: i === this.highlightedGate,
                    xrayMode: this.xrayMode
                });
            }
        }

        /**
         * Draw input/output nodes
         */
        _drawInputOutputNodes() {
            if (!this.circuitData || !this.circuitData.wires) return;

            const ctx = this.ctx;
            const wires = this.circuitData.wires;

            for (let i = 0; i < wires.length; i++) {
                const wire = wires[i];
                const pos = this.layoutEngine.getWirePosition(i);
                if (!pos) continue;

                const state = this.wireStates.get(i) || WireState.UNKNOWN;
                const color = getWireColor(state);

                if (pos.isInput) {
                    // Draw input switch
                    ctx.save();
                    ctx.fillStyle = Colors.GATE_BODY;
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;

                    ctx.beginPath();
                    ctx.roundRect(pos.x, pos.y - 12, 30, 24, 5);
                    ctx.fill();
                    ctx.stroke();

                    // State indicator
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(pos.x + 15, pos.y, 6, 0, Math.PI * 2);
                    ctx.fill();

                    // Label
                    ctx.fillStyle = Colors.TEXT_LABEL;
                    ctx.font = '10px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(wire.name || `IN${i}`, pos.x + 15, pos.y - 18);

                    ctx.restore();

                } else if (pos.isOutput) {
                    // Draw output LED
                    ctx.save();

                    // Glow when high
                    if (state === WireState.HIGH) {
                        const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 20);
                        glow.addColorStop(0, 'rgba(0, 255, 0, 0.5)');
                        glow.addColorStop(1, 'rgba(0, 255, 0, 0)');
                        ctx.fillStyle = glow;
                        ctx.beginPath();
                        ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    // LED body
                    ctx.fillStyle = state === WireState.HIGH ? Colors.WIRE_HIGH : Colors.GATE_BODY;
                    ctx.strokeStyle = Colors.GATE_BORDER;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();

                    // Label
                    ctx.fillStyle = Colors.TEXT_LABEL;
                    ctx.font = '10px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(wire.name || `OUT${i}`, pos.x, pos.y - 20);

                    ctx.restore();
                }
            }
        }

        /**
         * Draw particles
         */
        _drawParticles() {
            // Update and draw particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.update();
                if (!p.alive) {
                    this.particles.splice(i, 1);
                } else {
                    p.draw(this.ctx);
                }
            }
        }

        /**
         * Spawn particles for active signals
         */
        _spawnParticles() {
            if (!this.circuitData || !this.circuitData.gates) return;

            const gates = this.circuitData.gates;
            const wires = this.circuitData.wires || [];

            // Build wire output map
            const wireOutputs = new Map();
            for (let i = 0; i < gates.length; i++) {
                const gate = gates[i];
                if (gate.outputs) {
                    for (const out of gate.outputs) {
                        const wireIdx = out.wire !== undefined ? out.wire : out.wireIndex;
                        wireOutputs.set(wireIdx, i);
                    }
                }
            }

            // Spawn particles on HIGH wires
            for (let i = 0; i < gates.length; i++) {
                const gate = gates[i];
                if (!gate.inputs) continue;

                const destPos = this.layoutEngine.getGatePosition(i);
                const gateType = (gate.type || 'AND').toUpperCase();

                for (let inpIdx = 0; inpIdx < gate.inputs.length; inpIdx++) {
                    const inp = gate.inputs[inpIdx];
                    const wireIdx = inp.wire !== undefined ? inp.wire : inp.wireIndex;
                    const state = this.wireStates.get(wireIdx);

                    // Only spawn for HIGH signals
                    if (state !== WireState.HIGH) continue;

                    // Random spawn chance
                    if (Math.random() > this.options.particleSpawnRate) continue;

                    const srcGateIdx = wireOutputs.get(wireIdx);
                    let from;

                    if (srcGateIdx !== undefined) {
                        const srcPos = this.layoutEngine.getGatePosition(srcGateIdx);
                        const srcGate = gates[srcGateIdx];
                        const srcType = (srcGate?.type || 'AND').toUpperCase();
                        const srcH = srcType === 'DFF' ? Dimensions.DFF_HEIGHT : Dimensions.GATE_HEIGHT;
                        const srcW = srcType === 'DFF' ? Dimensions.DFF_WIDTH : Dimensions.GATE_WIDTH;
                        from = {
                            x: srcPos.x + srcW,
                            y: srcType === 'DFF' ? srcPos.y + srcH * 0.35 : srcPos.y + srcH / 2
                        };
                    } else {
                        const inputPos = this.layoutEngine.getWirePosition(wireIdx);
                        if (!inputPos) continue;
                        from = { x: inputPos.x + 30, y: inputPos.y };
                    }

                    // Calculate destination
                    let toY;
                    if (gateType === 'NOT' || gateType === 'BUF') {
                        toY = destPos.y + Dimensions.GATE_HEIGHT / 2;
                    } else if (gateType === 'DFF') {
                        toY = destPos.y + (inpIdx === 0 ? Dimensions.DFF_HEIGHT * 0.3 : Dimensions.DFF_HEIGHT * 0.6);
                    } else {
                        toY = destPos.y + Dimensions.GATE_HEIGHT * (inpIdx === 0 ? 0.3 : 0.7);
                    }

                    const to = { x: destPos.x, y: toY };
                    this.particles.push(new Particle(from, to, Colors.PARTICLE));
                }
            }
        }

        /**
         * Draw UI overlay
         */
        _drawOverlay() {
            const ctx = this.ctx;

            // Zoom level indicator
            ctx.save();
            ctx.fillStyle = 'rgba(22, 33, 62, 0.9)';
            ctx.fillRect(10, this.canvas.height - 30, 100, 20);

            ctx.fillStyle = Colors.TEXT;
            ctx.font = '11px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`Zoom: ${(this.zoom * 100).toFixed(0)}%`, 15, this.canvas.height - 15);

            // X-Ray indicator
            if (this.xrayMode) {
                ctx.fillStyle = Colors.TEXT_LABEL;
                ctx.fillText('X-RAY', 120, this.canvas.height - 15);
            }

            ctx.restore();
        }

        /**
         * Animation loop
         */
        _animate() {
            const now = performance.now();
            const delta = now - this._lastFrameTime;

            // Update at ~60fps
            if (delta > 16) {
                this._lastFrameTime = now;
                this.render();
            }

            this._animationId = requestAnimationFrame(() => this._animate());
        }

        /**
         * Resize canvas to container
         */
        _resizeCanvas() {
            const container = this.canvas.parentElement;
            if (container) {
                this.canvas.width = container.clientWidth || 800;
                this.canvas.height = container.clientHeight || 600;
            }
            this.render();
        }

        /**
         * Setup resize handler
         */
        _setupResizeHandler() {
            this._resizeHandler = () => this._resizeCanvas();
            window.addEventListener('resize', this._resizeHandler);
        }

        /**
         * Setup event handlers
         */
        _setupEventHandlers() {
            // Mouse wheel for zoom
            this._wheelHandler = (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                const newZoom = clamp(this.zoom * delta, Dimensions.MIN_ZOOM, Dimensions.MAX_ZOOM);

                // Zoom toward mouse position
                const rect = this.canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;

                const zoomRatio = newZoom / this.zoom;
                this.panX = mx - (mx - this.panX) * zoomRatio;
                this.panY = my - (my - this.panY) * zoomRatio;
                this.zoom = newZoom;

                this.render();
            };
            this.canvas.addEventListener('wheel', this._wheelHandler, { passive: false });

            // Mouse down for pan start
            this._mouseDownHandler = (e) => {
                if (e.button === 0) {  // Left button
                    this._isPanning = true;
                    this._lastMouseX = e.clientX;
                    this._lastMouseY = e.clientY;
                    this.canvas.style.cursor = 'grabbing';
                }
            };
            this.canvas.addEventListener('mousedown', this._mouseDownHandler);

            // Mouse move for panning
            this._mouseMoveHandler = (e) => {
                if (this._isPanning) {
                    const dx = e.clientX - this._lastMouseX;
                    const dy = e.clientY - this._lastMouseY;
                    this._lastMouseX = e.clientX;
                    this._lastMouseY = e.clientY;
                    this.panX += dx;
                    this.panY += dy;
                    this.render();
                }
            };
            this.canvas.addEventListener('mousemove', this._mouseMoveHandler);

            // Mouse up for pan end
            this._mouseUpHandler = (e) => {
                if (this._isPanning) {
                    this._isPanning = false;
                    this.canvas.style.cursor = 'default';
                }
            };
            this.canvas.addEventListener('mouseup', this._mouseUpHandler);
            document.addEventListener('mouseup', this._mouseUpHandler);

            // Click for gate selection
            this._clickHandler = (e) => {
                if (this._isPanning) return;

                const rect = this.canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;

                // Convert to circuit coordinates
                const cx = (mx - this.panX) / this.zoom;
                const cy = (my - this.panY) / this.zoom;

                // Find clicked gate
                const gateIdx = this._findGateAt(cx, cy);
                if (gateIdx >= 0) {
                    this._emit('gateClick', {
                        index: gateIdx,
                        gate: this.circuitData?.gates[gateIdx]
                    });
                }
            };
            this.canvas.addEventListener('click', this._clickHandler);
        }

        /**
         * Remove event handlers
         */
        _removeEventHandlers() {
            if (this._wheelHandler) {
                this.canvas.removeEventListener('wheel', this._wheelHandler);
            }
            if (this._mouseDownHandler) {
                this.canvas.removeEventListener('mousedown', this._mouseDownHandler);
            }
            if (this._mouseMoveHandler) {
                this.canvas.removeEventListener('mousemove', this._mouseMoveHandler);
            }
            if (this._mouseUpHandler) {
                this.canvas.removeEventListener('mouseup', this._mouseUpHandler);
                document.removeEventListener('mouseup', this._mouseUpHandler);
            }
            if (this._clickHandler) {
                this.canvas.removeEventListener('click', this._clickHandler);
            }
            if (this._resizeHandler) {
                window.removeEventListener('resize', this._resizeHandler);
            }
        }

        /**
         * Find gate at circuit coordinates
         */
        _findGateAt(x, y) {
            if (!this.circuitData || !this.circuitData.gates) return -1;

            for (let i = 0; i < this.circuitData.gates.length; i++) {
                const pos = this.layoutEngine.getGatePosition(i);
                const gate = this.circuitData.gates[i];
                const type = (gate.type || 'AND').toUpperCase();
                const w = type === 'DFF' ? Dimensions.DFF_WIDTH : Dimensions.GATE_WIDTH;
                const h = type === 'DFF' ? Dimensions.DFF_HEIGHT : Dimensions.GATE_HEIGHT;

                if (x >= pos.x && x <= pos.x + w && y >= pos.y && y <= pos.y + h) {
                    return i;
                }
            }

            return -1;
        }

        /**
         * Emit an event
         */
        _emit(event, data) {
            if (this._eventListeners[event]) {
                for (const callback of this._eventListeners[event]) {
                    try {
                        callback(data);
                    } catch (e) {
                        console.error(`GateView event error (${event}):`, e);
                    }
                }
            }
        }

        // =============================================
        // Static Methods
        // =============================================

        /**
         * Get default CSS for embedding
         */
        static getDefaultCSS() {
            return `
.gate-view-container {
    background: ${Colors.BACKGROUND};
    border: 2px solid ${Colors.GATE_BORDER};
    border-radius: 8px;
    overflow: hidden;
}
.gate-view-container canvas {
    display: block;
    width: 100%;
    height: 100%;
}
.gate-view-controls {
    background: ${Colors.GATE_BODY};
    padding: 8px;
    display: flex;
    gap: 8px;
    border-bottom: 1px solid ${Colors.GATE_BORDER};
}
.gate-view-controls button {
    background: ${Colors.GATE_BORDER};
    color: ${Colors.TEXT};
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
}
.gate-view-controls button:hover {
    background: ${Colors.TEXT_LABEL};
}
.gate-view-controls button.active {
    background: ${Colors.TEXT_LABEL};
}
            `;
        }
    }

    // =============================================
    // Export
    // =============================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            GateView,
            GateRenderer,
            WireRenderer,
            LayoutEngine,
            Particle,
            Colors,
            Dimensions,
            WireState,
            GateType
        };
    } else {
        exports.SimEngine = exports.SimEngine || {};
        exports.SimEngine.GateView = GateView;
        exports.SimEngine.GateRenderer = GateRenderer;
        exports.SimEngine.WireRenderer = WireRenderer;
        exports.SimEngine.LayoutEngine = LayoutEngine;
        exports.SimEngine.Particle = Particle;
        exports.SimEngine.GateViewColors = Colors;
        exports.SimEngine.GateViewDimensions = Dimensions;
    }

})(typeof window !== 'undefined' ? window : global);
