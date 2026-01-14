/**
 * Core Simulation Engine - I/O Module
 *
 * JSON import/export utilities for interoperability with the C simulator.
 * Includes file loading, circuit serialization, and format conversion.
 */

(function(exports) {
    'use strict';

    // Get dependencies
    const { WireState, GateType, WireStateStr } = exports.SimEngine || exports;
    const { Circuit } = exports.SimEngine || exports;

    /**
     * CircuitIO provides static methods for circuit serialization.
     */
    class CircuitIO {
        /**
         * Export circuit to JSON string.
         * @param {Circuit} circuit - Circuit to export
         * @param {boolean} pretty - Pretty print JSON (default true)
         * @returns {string} JSON string
         */
        static toJSONString(circuit, pretty = true) {
            const json = circuit.toJSON();
            return pretty ? JSON.stringify(json, null, 2) : JSON.stringify(json);
        }

        /**
         * Import circuit from JSON string.
         * @param {string} jsonStr - JSON string
         * @returns {Circuit} Circuit instance
         */
        static fromJSONString(jsonStr) {
            const json = JSON.parse(jsonStr);
            return Circuit.fromJSON(json);
        }

        /**
         * Load circuit from a URL (async fetch).
         * @param {string} url - URL to JSON file
         * @returns {Promise<Circuit>} Promise resolving to Circuit
         */
        static async loadFromURL(url) {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load circuit from ${url}: ${response.status}`);
            }
            const json = await response.json();
            return Circuit.fromJSON(json);
        }

        /**
         * Export circuit state as downloadable JSON file.
         * @param {Circuit} circuit - Circuit to export
         * @param {string} filename - Filename (default 'circuit.json')
         */
        static downloadJSON(circuit, filename = 'circuit.json') {
            const json = CircuitIO.toJSONString(circuit, true);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        /**
         * Save circuit to localStorage.
         * @param {Circuit} circuit - Circuit to save
         * @param {string} key - Storage key (default 'circuit')
         */
        static saveToLocalStorage(circuit, key = 'circuit') {
            const json = CircuitIO.toJSONString(circuit, false);
            localStorage.setItem(key, json);
        }

        /**
         * Load circuit from localStorage.
         * @param {string} key - Storage key (default 'circuit')
         * @returns {Circuit|null} Circuit or null if not found
         */
        static loadFromLocalStorage(key = 'circuit') {
            const json = localStorage.getItem(key);
            if (!json) return null;
            return CircuitIO.fromJSONString(json);
        }

        /**
         * Convert wire state array to string representation.
         * @param {number[]} states - Array of WireState values
         * @returns {string} String like "0101X1"
         */
        static stateArrayToString(states) {
            return states
                .slice()
                .reverse()  // MSB first
                .map(s => WireStateStr[s] || '?')
                .join('');
        }

        /**
         * Export circuit state as text table (for debugging).
         * @param {Circuit} circuit - Circuit to export
         * @returns {string} Text table
         */
        static toTextTable(circuit) {
            const lines = [];
            lines.push('=== Circuit State ===');
            lines.push(`Cycle: ${circuit.cycleCount}`);
            lines.push(`Stable: ${circuit.stable ? 'YES' : 'NO'}`);
            lines.push('');

            // Wires
            lines.push('--- Wires ---');
            for (let i = 0; i < circuit.wires.length; i++) {
                const w = circuit.wires[i];
                const flags = [
                    w.isInput ? 'IN' : '',
                    w.isOutput ? 'OUT' : ''
                ].filter(Boolean).join(',');
                const flagStr = flags ? ` (${flags})` : '';
                lines.push(`  ${w.name.padEnd(16)} = ${CircuitIO.stateArrayToString(w.state)}${flagStr}`);
            }
            lines.push('');

            // Gates
            lines.push('--- Gates ---');
            for (let i = 0; i < circuit.gates.length; i++) {
                const g = circuit.gates[i];
                lines.push(`  ${g.name.padEnd(16)} : ${g.type}`);
            }

            return lines.join('\n');
        }

        /**
         * Generate SVG representation of circuit.
         * Basic schematic for debugging (not a full visualizer).
         * @param {Circuit} circuit - Circuit to visualize
         * @param {number} width - SVG width
         * @param {number} height - SVG height
         * @returns {string} SVG markup
         */
        static toSVG(circuit, width = 800, height = 600) {
            const svg = [];
            svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`);
            svg.push('  <style>');
            svg.push('    .gate { fill: #16213e; stroke: #0f3460; stroke-width: 2; }');
            svg.push('    .wire0 { stroke: #0077b6; stroke-width: 2; }');
            svg.push('    .wire1 { stroke: #e94560; stroke-width: 2; }');
            svg.push('    .wireX { stroke: #888; stroke-width: 2; stroke-dasharray: 4,2; }');
            svg.push('    .label { fill: #eee; font-family: monospace; font-size: 12px; }');
            svg.push('  </style>');

            // Layout gates in a grid
            const gatesPerRow = 4;
            const gateW = 100;
            const gateH = 60;
            const margin = 40;
            const spacingX = (width - 2 * margin) / gatesPerRow;
            const spacingY = 100;

            for (let i = 0; i < circuit.gates.length; i++) {
                const g = circuit.gates[i];
                const col = i % gatesPerRow;
                const row = Math.floor(i / gatesPerRow);
                const x = margin + col * spacingX;
                const y = margin + row * spacingY;

                // Gate box
                svg.push(`  <rect class="gate" x="${x}" y="${y}" width="${gateW}" height="${gateH}" rx="5"/>`);
                svg.push(`  <text class="label" x="${x + gateW / 2}" y="${y + gateH / 2 + 5}" text-anchor="middle">${g.type}</text>`);
                svg.push(`  <text class="label" x="${x + gateW / 2}" y="${y + gateH - 5}" text-anchor="middle" font-size="10">${g.name}</text>`);
            }

            svg.push('</svg>');
            return svg.join('\n');
        }
    }

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { CircuitIO };
    } else {
        exports.SimEngine = exports.SimEngine || {};
        exports.SimEngine.CircuitIO = CircuitIO;
    }

})(typeof window !== 'undefined' ? window : global);
