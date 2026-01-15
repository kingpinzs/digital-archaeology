/**
 * Step Debugger View Module
 *
 * Provides interactive debugging controls for the circuit visualizer.
 * Features:
 * - Step/Run/Pause/Reset execution controls
 * - Speed slider for continuous execution
 * - Breakpoint management (address, value, condition)
 * - Execution history with state snapshots
 * - Keyboard shortcuts
 *
 * Integrates with core-engine.js (SimEngine)
 */

(function(exports) {
    'use strict';

    // Get SimEngine dependency
    const SimEngine = exports.SimEngine;

    /**
     * Breakpoint types
     */
    const BreakpointType = Object.freeze({
        ADDRESS: 'address',     // PC equals value
        VALUE: 'value',         // Register/wire equals value
        CONDITION: 'condition'  // Custom condition function
    });

    /**
     * Execution states
     */
    const ExecutionState = Object.freeze({
        STOPPED: 'stopped',
        RUNNING: 'running',
        PAUSED: 'paused',
        STEPPING: 'stepping',
        BREAKPOINT: 'breakpoint'
    });

    /**
     * Breakpoint class
     */
    class Breakpoint {
        constructor(id, type, config = {}) {
            this.id = id;
            this.type = type;
            this.enabled = true;
            this.hitCount = 0;

            // Type-specific config
            switch (type) {
                case BreakpointType.ADDRESS:
                    this.address = config.address || 0;
                    this.label = config.label || `PC == 0x${this.address.toString(16).toUpperCase().padStart(4, '0')}`;
                    break;
                case BreakpointType.VALUE:
                    this.target = config.target || 'R0';  // Wire/register name
                    this.value = config.value || 0;
                    this.operator = config.operator || '==';  // ==, !=, <, >, <=, >=
                    this.label = config.label || `${this.target} ${this.operator} 0x${this.value.toString(16).toUpperCase()}`;
                    break;
                case BreakpointType.CONDITION:
                    this.condition = config.condition || (() => false);
                    this.label = config.label || 'Custom condition';
                    break;
            }
        }

        /**
         * Check if breakpoint should trigger.
         * @param {Object} state - Current execution state
         * @returns {boolean} True if breakpoint should trigger
         */
        check(state) {
            if (!this.enabled) return false;

            switch (this.type) {
                case BreakpointType.ADDRESS:
                    return state.pc === this.address;
                case BreakpointType.VALUE:
                    const val = state.values?.[this.target];
                    if (val === undefined) return false;
                    switch (this.operator) {
                        case '==': return val === this.value;
                        case '!=': return val !== this.value;
                        case '<': return val < this.value;
                        case '>': return val > this.value;
                        case '<=': return val <= this.value;
                        case '>=': return val >= this.value;
                        default: return false;
                    }
                case BreakpointType.CONDITION:
                    try {
                        return this.condition(state);
                    } catch (e) {
                        console.error('Breakpoint condition error:', e);
                        return false;
                    }
            }
            return false;
        }

        toJSON() {
            return {
                id: this.id,
                type: this.type,
                enabled: this.enabled,
                hitCount: this.hitCount,
                label: this.label,
                address: this.address,
                target: this.target,
                value: this.value,
                operator: this.operator
            };
        }
    }

    /**
     * History entry for execution snapshots
     */
    class HistoryEntry {
        constructor(cycle, state, timestamp = Date.now()) {
            this.cycle = cycle;
            this.state = state;  // Deep copy of circuit state
            this.timestamp = timestamp;
            this.instruction = state.instruction || '';
        }
    }

    /**
     * DebuggerView - Main debugger class
     */
    class DebuggerView {
        constructor(options = {}) {
            // Circuit reference
            this.circuit = options.circuit || null;

            // Execution state
            this.state = ExecutionState.STOPPED;
            this.cycleCount = 0;
            this.instructionCount = 0;

            // Speed control (cycles per second)
            this.speed = options.speed || 10;
            this.minSpeed = 1;
            this.maxSpeed = 1000;

            // Animation
            this._animationId = null;
            this._lastFrameTime = 0;
            this._accumulator = 0;

            // Breakpoints
            this._breakpoints = new Map();
            this._nextBreakpointId = 1;

            // History
            this._history = [];
            this._maxHistorySize = options.maxHistory || 100;
            this._historyIndex = -1;  // Current position in history for navigation

            // Callbacks
            this.onStep = options.onStep || (() => {});
            this.onStateChange = options.onStateChange || (() => {});
            this.onBreakpoint = options.onBreakpoint || (() => {});
            this.onHistoryUpdate = options.onHistoryUpdate || (() => {});
            this.onError = options.onError || ((err) => console.error(err));

            // State extraction function
            this.getExecutionState = options.getExecutionState || (() => ({
                pc: 0,
                cycle: this.cycleCount,
                values: {},
                flags: {},
                instruction: ''
            }));

            // DOM elements (set via attachToDOM)
            this._elements = {};

            // Keyboard handling
            this._keyboardEnabled = true;
            this._boundKeyHandler = this._handleKeydown.bind(this);
        }

        /**
         * Attach circuit for debugging.
         * @param {Circuit} circuit - SimEngine Circuit instance
         */
        attachCircuit(circuit) {
            this.circuit = circuit;
            this.reset();
        }

        /**
         * Attach to DOM elements.
         * @param {Object} elements - Map of element IDs or elements
         */
        attachToDOM(elements) {
            this._elements = {};

            // Resolve element references
            for (const [key, value] of Object.entries(elements)) {
                this._elements[key] = typeof value === 'string'
                    ? document.getElementById(value)
                    : value;
            }

            this._setupEventListeners();
            this._updateUI();
        }

        /**
         * Enable keyboard shortcuts.
         */
        enableKeyboard() {
            if (!this._keyboardEnabled) {
                document.addEventListener('keydown', this._boundKeyHandler);
                this._keyboardEnabled = true;
            }
        }

        /**
         * Disable keyboard shortcuts.
         */
        disableKeyboard() {
            if (this._keyboardEnabled) {
                document.removeEventListener('keydown', this._boundKeyHandler);
                this._keyboardEnabled = false;
            }
        }

        // === Execution Control ===

        /**
         * Execute one step (cycle).
         */
        step() {
            if (!this.circuit) {
                this.onError('No circuit attached');
                return;
            }

            // Check for breakpoints (except on first step after hitting one)
            if (this.state !== ExecutionState.BREAKPOINT) {
                const bp = this._checkBreakpoints();
                if (bp) {
                    this._triggerBreakpoint(bp);
                    return;
                }
            }

            this.state = ExecutionState.STEPPING;
            this._executeStep();
            this.state = ExecutionState.PAUSED;

            this._updateUI();
            this.onStateChange(this.state);
        }

        /**
         * Start continuous execution.
         */
        run() {
            if (!this.circuit) {
                this.onError('No circuit attached');
                return;
            }

            if (this.state === ExecutionState.RUNNING) {
                return;
            }

            this.state = ExecutionState.RUNNING;
            this._lastFrameTime = performance.now();
            this._accumulator = 0;
            this._runLoop();

            this._updateUI();
            this.onStateChange(this.state);
        }

        /**
         * Pause execution.
         */
        pause() {
            if (this.state !== ExecutionState.RUNNING) {
                return;
            }

            if (this._animationId) {
                cancelAnimationFrame(this._animationId);
                this._animationId = null;
            }

            this.state = ExecutionState.PAUSED;
            this._updateUI();
            this.onStateChange(this.state);
        }

        /**
         * Reset execution state.
         */
        reset() {
            this.pause();

            if (this.circuit) {
                this.circuit.reset();
            }

            this.cycleCount = 0;
            this.instructionCount = 0;
            this._history = [];
            this._historyIndex = -1;
            this.state = ExecutionState.STOPPED;

            // Clear breakpoint hit counts
            for (const bp of this._breakpoints.values()) {
                bp.hitCount = 0;
            }

            this._updateUI();
            this.onStateChange(this.state);
            this.onHistoryUpdate(this._history);
        }

        /**
         * Set execution speed (cycles per second).
         * @param {number} cps - Cycles per second (1-1000)
         */
        setSpeed(cps) {
            this.speed = Math.max(this.minSpeed, Math.min(this.maxSpeed, cps));
            this._updateUI();
        }

        // === Breakpoint Management ===

        /**
         * Add address breakpoint.
         * @param {number} address - PC address to break at
         * @param {string} label - Optional label
         * @returns {number} Breakpoint ID
         */
        addAddressBreakpoint(address, label = null) {
            const id = this._nextBreakpointId++;
            const bp = new Breakpoint(id, BreakpointType.ADDRESS, {
                address,
                label
            });
            this._breakpoints.set(id, bp);
            this._updateBreakpointUI();
            return id;
        }

        /**
         * Add value breakpoint.
         * @param {string} target - Wire/register name
         * @param {string} operator - Comparison operator
         * @param {number} value - Value to compare
         * @param {string} label - Optional label
         * @returns {number} Breakpoint ID
         */
        addValueBreakpoint(target, operator, value, label = null) {
            const id = this._nextBreakpointId++;
            const bp = new Breakpoint(id, BreakpointType.VALUE, {
                target,
                operator,
                value,
                label
            });
            this._breakpoints.set(id, bp);
            this._updateBreakpointUI();
            return id;
        }

        /**
         * Add condition breakpoint.
         * @param {Function} condition - Function that takes state and returns boolean
         * @param {string} label - Description of condition
         * @returns {number} Breakpoint ID
         */
        addConditionBreakpoint(condition, label = 'Custom condition') {
            const id = this._nextBreakpointId++;
            const bp = new Breakpoint(id, BreakpointType.CONDITION, {
                condition,
                label
            });
            this._breakpoints.set(id, bp);
            this._updateBreakpointUI();
            return id;
        }

        /**
         * Remove a breakpoint.
         * @param {number} id - Breakpoint ID
         * @returns {boolean} True if removed
         */
        removeBreakpoint(id) {
            const removed = this._breakpoints.delete(id);
            if (removed) {
                this._updateBreakpointUI();
            }
            return removed;
        }

        /**
         * Enable/disable a breakpoint.
         * @param {number} id - Breakpoint ID
         * @param {boolean} enabled - Enable state
         */
        setBreakpointEnabled(id, enabled) {
            const bp = this._breakpoints.get(id);
            if (bp) {
                bp.enabled = enabled;
                this._updateBreakpointUI();
            }
        }

        /**
         * Get all breakpoints.
         * @returns {Array} Array of breakpoint objects
         */
        getBreakpoints() {
            return Array.from(this._breakpoints.values()).map(bp => bp.toJSON());
        }

        /**
         * Clear all breakpoints.
         */
        clearBreakpoints() {
            this._breakpoints.clear();
            this._updateBreakpointUI();
        }

        // === History Management ===

        /**
         * Get execution history.
         * @returns {Array} Array of history entries
         */
        getHistory() {
            return this._history.map((entry, index) => ({
                index,
                cycle: entry.cycle,
                timestamp: entry.timestamp,
                instruction: entry.instruction
            }));
        }

        /**
         * Jump to a history state.
         * @param {number} index - History index
         */
        jumpToHistory(index) {
            if (index < 0 || index >= this._history.length) {
                return;
            }

            this.pause();

            const entry = this._history[index];
            this._historyIndex = index;

            // Restore circuit state if we have the full state
            if (entry.state && this.circuit) {
                // Restore wire states
                if (entry.state.wire_states) {
                    for (let i = 0; i < entry.state.wire_states.length && i < this.circuit.wires.length; i++) {
                        const states = entry.state.wire_states[i];
                        for (let b = 0; b < states.length; b++) {
                            this.circuit.wires[i].setState(b, states[b]);
                        }
                    }
                }

                // Restore DFF states
                if (entry.state.dff_states) {
                    for (const dff of entry.state.dff_states) {
                        if (this.circuit.gates[dff.id]) {
                            this.circuit.gates[dff.id].storedValue = dff.stored;
                        }
                    }
                }

                this.cycleCount = entry.cycle;
            }

            this._updateUI();
            this.onStep();
        }

        // === Internal Methods ===

        /**
         * Execute a single step.
         */
        _executeStep() {
            // Save state to history before stepping
            const preState = this.circuit.exportState();
            preState.instruction = this._getCurrentInstruction();

            // Add to history
            this._addToHistory(this.cycleCount, preState);

            // Execute one cycle
            this.circuit.step();
            this.cycleCount++;
            this.instructionCount++;

            // Notify listeners
            this.onStep();
        }

        /**
         * Get current instruction description.
         */
        _getCurrentInstruction() {
            const state = this.getExecutionState();
            return state.instruction || `Cycle ${this.cycleCount}`;
        }

        /**
         * Add entry to history.
         */
        _addToHistory(cycle, state) {
            const entry = new HistoryEntry(cycle, state);
            this._history.push(entry);

            // Trim history if too long
            if (this._history.length > this._maxHistorySize) {
                this._history.shift();
            }

            this._historyIndex = this._history.length - 1;
            this.onHistoryUpdate(this.getHistory());
        }

        /**
         * Main run loop using requestAnimationFrame.
         */
        _runLoop() {
            if (this.state !== ExecutionState.RUNNING) {
                return;
            }

            const now = performance.now();
            const deltaTime = now - this._lastFrameTime;
            this._lastFrameTime = now;

            // Calculate how many cycles to run based on speed
            const cycleTime = 1000 / this.speed;  // ms per cycle
            this._accumulator += deltaTime;

            // Execute cycles
            let cyclesThisFrame = 0;
            const maxCyclesPerFrame = Math.max(1, this.speed / 30);  // Cap cycles per frame

            while (this._accumulator >= cycleTime && cyclesThisFrame < maxCyclesPerFrame) {
                // Check breakpoints
                const bp = this._checkBreakpoints();
                if (bp) {
                    this._triggerBreakpoint(bp);
                    return;
                }

                // Check for halt/error
                if (this.circuit.error) {
                    this.pause();
                    this.onError(this.circuit.errorMsg);
                    return;
                }

                this._executeStep();
                this._accumulator -= cycleTime;
                cyclesThisFrame++;
            }

            // Cap accumulator to prevent spiral of death
            if (this._accumulator > cycleTime * 10) {
                this._accumulator = cycleTime * 10;
            }

            this._updateUI();

            // Schedule next frame
            this._animationId = requestAnimationFrame(() => this._runLoop());
        }

        /**
         * Check all breakpoints.
         * @returns {Breakpoint|null} Triggered breakpoint or null
         */
        _checkBreakpoints() {
            const state = this.getExecutionState();

            for (const bp of this._breakpoints.values()) {
                if (bp.check(state)) {
                    return bp;
                }
            }

            return null;
        }

        /**
         * Trigger a breakpoint.
         */
        _triggerBreakpoint(bp) {
            bp.hitCount++;
            this.state = ExecutionState.BREAKPOINT;

            if (this._animationId) {
                cancelAnimationFrame(this._animationId);
                this._animationId = null;
            }

            this._updateUI();
            this.onStateChange(this.state);
            this.onBreakpoint(bp.toJSON());
        }

        /**
         * Handle keyboard shortcuts.
         */
        _handleKeydown(e) {
            // Don't handle if focus is in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.key) {
                case ' ':  // Space = Step
                    e.preventDefault();
                    this.step();
                    break;
                case 'r':
                case 'R':
                    e.preventDefault();
                    if (this.state === ExecutionState.RUNNING) {
                        this.pause();
                    } else {
                        this.run();
                    }
                    break;
                case 'p':
                case 'P':
                    e.preventDefault();
                    this.pause();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.reset();
                    break;
            }
        }

        /**
         * Setup DOM event listeners.
         */
        _setupEventListeners() {
            const el = this._elements;

            // Step button
            if (el.stepBtn) {
                el.stepBtn.addEventListener('click', () => this.step());
            }

            // Run button
            if (el.runBtn) {
                el.runBtn.addEventListener('click', () => {
                    if (this.state === ExecutionState.RUNNING) {
                        this.pause();
                    } else {
                        this.run();
                    }
                });
            }

            // Pause button
            if (el.pauseBtn) {
                el.pauseBtn.addEventListener('click', () => this.pause());
            }

            // Reset button
            if (el.resetBtn) {
                el.resetBtn.addEventListener('click', () => this.reset());
            }

            // Speed slider
            if (el.speedSlider) {
                el.speedSlider.min = this.minSpeed;
                el.speedSlider.max = this.maxSpeed;
                el.speedSlider.value = this.speed;
                el.speedSlider.addEventListener('input', (e) => {
                    this.setSpeed(parseInt(e.target.value, 10));
                });
            }

            // Enable keyboard shortcuts
            this.enableKeyboard();
        }

        /**
         * Update UI elements.
         */
        _updateUI() {
            const el = this._elements;
            const isRunning = this.state === ExecutionState.RUNNING;

            // Step button
            if (el.stepBtn) {
                el.stepBtn.disabled = isRunning;
            }

            // Run/Pause button text
            if (el.runBtn) {
                el.runBtn.textContent = isRunning ? 'Pause' : 'Run';
                el.runBtn.classList.toggle('active', isRunning);
            }

            // Pause button
            if (el.pauseBtn) {
                el.pauseBtn.disabled = !isRunning;
            }

            // Speed display
            if (el.speedDisplay) {
                el.speedDisplay.textContent = `${this.speed} CPS`;
            }

            // Speed slider
            if (el.speedSlider) {
                el.speedSlider.value = this.speed;
            }

            // Cycle counter
            if (el.cycleCounter) {
                el.cycleCounter.textContent = `Cycle: ${this.cycleCount}`;
            }

            // State indicator
            if (el.stateIndicator) {
                el.stateIndicator.textContent = this.state.toUpperCase();
                el.stateIndicator.className = `state-indicator state-${this.state}`;
            }
        }

        /**
         * Update breakpoint list UI using safe DOM methods.
         */
        _updateBreakpointUI() {
            const el = this._elements;

            if (!el.breakpointList) return;

            // Clear existing content safely
            while (el.breakpointList.firstChild) {
                el.breakpointList.removeChild(el.breakpointList.firstChild);
            }

            if (this._breakpoints.size === 0) {
                const empty = document.createElement('div');
                empty.className = 'breakpoint-empty';
                empty.textContent = 'No breakpoints set';
                el.breakpointList.appendChild(empty);
                return;
            }

            for (const bp of this._breakpoints.values()) {
                const item = document.createElement('div');
                item.className = `breakpoint-item ${bp.enabled ? 'enabled' : 'disabled'}`;
                item.dataset.id = bp.id;

                // Create toggle label
                const label = document.createElement('label');
                label.className = 'breakpoint-toggle';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = bp.enabled;
                checkbox.addEventListener('change', () => {
                    this.setBreakpointEnabled(bp.id, checkbox.checked);
                });

                const labelSpan = document.createElement('span');
                labelSpan.className = 'breakpoint-label';
                labelSpan.textContent = bp.label;

                label.appendChild(checkbox);
                label.appendChild(labelSpan);

                // Create hit count
                const hitsSpan = document.createElement('span');
                hitsSpan.className = 'breakpoint-hits';
                hitsSpan.textContent = String(bp.hitCount);

                // Create delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'breakpoint-delete';
                deleteBtn.title = 'Delete';
                deleteBtn.textContent = '\u00D7';  // Unicode multiplication sign
                deleteBtn.addEventListener('click', () => {
                    this.removeBreakpoint(bp.id);
                });

                item.appendChild(label);
                item.appendChild(hitsSpan);
                item.appendChild(deleteBtn);

                el.breakpointList.appendChild(item);
            }
        }

        // === Static Factory Methods ===

        /**
         * Create a debugger view with default DOM structure.
         * @param {HTMLElement|string} container - Container element or ID
         * @param {Object} options - Debugger options
         * @returns {DebuggerView} Configured debugger view
         */
        static create(container, options = {}) {
            const containerEl = typeof container === 'string'
                ? document.getElementById(container)
                : container;

            if (!containerEl) {
                throw new Error('Container element not found');
            }

            // Create DOM structure using safe methods
            DebuggerView._buildDefaultDOM(containerEl);

            // Create debugger instance
            const debugger_ = new DebuggerView(options);

            // Attach to DOM
            debugger_.attachToDOM({
                stepBtn: containerEl.querySelector('.dbg-step'),
                runBtn: containerEl.querySelector('.dbg-run'),
                pauseBtn: containerEl.querySelector('.dbg-pause'),
                resetBtn: containerEl.querySelector('.dbg-reset'),
                speedSlider: containerEl.querySelector('.dbg-speed-slider'),
                speedDisplay: containerEl.querySelector('.dbg-speed-display'),
                cycleCounter: containerEl.querySelector('.dbg-cycle-counter'),
                stateIndicator: containerEl.querySelector('.dbg-state'),
                breakpointList: containerEl.querySelector('.dbg-breakpoint-list'),
                historyList: containerEl.querySelector('.dbg-history-list')
            });

            return debugger_;
        }

        /**
         * Build default DOM structure using safe methods.
         * @param {HTMLElement} container - Container element
         */
        static _buildDefaultDOM(container) {
            // Clear container safely
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }

            // Main wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'debugger-view';

            // Controls section
            const controls = document.createElement('div');
            controls.className = 'dbg-controls';

            const stepBtn = document.createElement('button');
            stepBtn.className = 'dbg-step';
            stepBtn.title = 'Step (Space)';
            stepBtn.textContent = 'Step';

            const runBtn = document.createElement('button');
            runBtn.className = 'dbg-run';
            runBtn.title = 'Run/Pause (R)';
            runBtn.textContent = 'Run';

            const pauseBtn = document.createElement('button');
            pauseBtn.className = 'dbg-pause';
            pauseBtn.title = 'Pause (P)';
            pauseBtn.textContent = 'Pause';

            const resetBtn = document.createElement('button');
            resetBtn.className = 'dbg-reset';
            resetBtn.title = 'Reset (Esc)';
            resetBtn.textContent = 'Reset';

            controls.appendChild(stepBtn);
            controls.appendChild(runBtn);
            controls.appendChild(pauseBtn);
            controls.appendChild(resetBtn);

            // Speed section
            const speedSection = document.createElement('div');
            speedSection.className = 'dbg-speed';

            const speedLabel = document.createElement('label');
            speedLabel.textContent = 'Speed:';

            const speedSlider = document.createElement('input');
            speedSlider.type = 'range';
            speedSlider.className = 'dbg-speed-slider';
            speedSlider.min = '1';
            speedSlider.max = '1000';
            speedSlider.value = '10';

            const speedDisplay = document.createElement('span');
            speedDisplay.className = 'dbg-speed-display';
            speedDisplay.textContent = '10 CPS';

            speedSection.appendChild(speedLabel);
            speedSection.appendChild(speedSlider);
            speedSection.appendChild(speedDisplay);

            // Status section
            const status = document.createElement('div');
            status.className = 'dbg-status';

            const stateIndicator = document.createElement('span');
            stateIndicator.className = 'dbg-state state-stopped';
            stateIndicator.textContent = 'STOPPED';

            const cycleCounter = document.createElement('span');
            cycleCounter.className = 'dbg-cycle-counter';
            cycleCounter.textContent = 'Cycle: 0';

            status.appendChild(stateIndicator);
            status.appendChild(cycleCounter);

            // Breakpoints section
            const breakpoints = document.createElement('div');
            breakpoints.className = 'dbg-breakpoints';

            const bpHeader = document.createElement('h4');
            bpHeader.textContent = 'Breakpoints';

            const bpList = document.createElement('div');
            bpList.className = 'dbg-breakpoint-list';

            breakpoints.appendChild(bpHeader);
            breakpoints.appendChild(bpList);

            // History section
            const history = document.createElement('div');
            history.className = 'dbg-history';

            const histHeader = document.createElement('h4');
            histHeader.textContent = 'History';

            const histList = document.createElement('div');
            histList.className = 'dbg-history-list';

            history.appendChild(histHeader);
            history.appendChild(histList);

            // Assemble
            wrapper.appendChild(controls);
            wrapper.appendChild(speedSection);
            wrapper.appendChild(status);
            wrapper.appendChild(breakpoints);
            wrapper.appendChild(history);

            container.appendChild(wrapper);
        }

        /**
         * Get default CSS styles.
         */
        static getDefaultCSS() {
            return `
.debugger-view {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #16213e;
    padding: 10px;
    border-radius: 5px;
    color: #eee;
}

.dbg-controls {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
}

.dbg-controls button {
    background: #0f3460;
    color: #eee;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.2s;
}

.dbg-controls button:hover:not(:disabled) {
    background: #e94560;
}

.dbg-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.dbg-controls button.active {
    background: #e94560;
}

.dbg-speed {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}

.dbg-speed label {
    font-size: 12px;
    color: #aaa;
}

.dbg-speed-slider {
    flex: 1;
    max-width: 200px;
}

.dbg-speed-display {
    font-size: 12px;
    color: #e94560;
    min-width: 70px;
}

.dbg-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding: 8px;
    background: #1a1a2e;
    border-radius: 4px;
}

.dbg-state {
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: bold;
    text-transform: uppercase;
}

.state-stopped { background: #555; color: #aaa; }
.state-running { background: #00aa00; color: #fff; }
.state-paused { background: #0077cc; color: #fff; }
.state-stepping { background: #ff9900; color: #fff; }
.state-breakpoint { background: #e94560; color: #fff; }

.dbg-cycle-counter {
    font-size: 12px;
    color: #888;
}

.dbg-breakpoints, .dbg-history {
    margin-top: 10px;
}

.dbg-breakpoints h4, .dbg-history h4 {
    font-size: 12px;
    color: #e94560;
    margin: 0 0 8px 0;
    padding-bottom: 4px;
    border-bottom: 1px solid #0f3460;
}

.dbg-breakpoint-list, .dbg-history-list {
    max-height: 150px;
    overflow-y: auto;
    background: #1a1a2e;
    border-radius: 4px;
    padding: 5px;
}

.breakpoint-empty {
    color: #666;
    font-size: 11px;
    text-align: center;
    padding: 10px;
}

.breakpoint-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px;
    border-bottom: 1px solid #0f3460;
    font-size: 11px;
}

.breakpoint-item:last-child {
    border-bottom: none;
}

.breakpoint-item.disabled {
    opacity: 0.5;
}

.breakpoint-toggle {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
}

.breakpoint-label {
    font-family: monospace;
}

.breakpoint-hits {
    color: #888;
    font-size: 10px;
}

.breakpoint-delete {
    background: none;
    border: none;
    color: #e94560;
    cursor: pointer;
    font-size: 16px;
    padding: 0 4px;
}

.breakpoint-delete:hover {
    color: #ff6b6b;
}

.history-item {
    display: flex;
    justify-content: space-between;
    padding: 4px 6px;
    cursor: pointer;
    border-radius: 3px;
    font-size: 11px;
}

.history-item:hover {
    background: #0f3460;
}

.history-item.current {
    background: #e94560;
    color: #fff;
}

.history-cycle {
    color: #888;
    font-family: monospace;
}

.history-instruction {
    color: #aaa;
    font-family: monospace;
}

.history-time {
    color: #666;
    font-size: 10px;
}
`;
        }
    }

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { DebuggerView, Breakpoint, BreakpointType, ExecutionState, HistoryEntry };
    } else {
        exports.SimEngine = exports.SimEngine || {};
        exports.SimEngine.DebuggerView = DebuggerView;
        exports.SimEngine.Breakpoint = Breakpoint;
        exports.SimEngine.BreakpointType = BreakpointType;
        exports.SimEngine.ExecutionState = ExecutionState;
        exports.SimEngine.HistoryEntry = HistoryEntry;
    }

})(typeof window !== 'undefined' ? window : global);
