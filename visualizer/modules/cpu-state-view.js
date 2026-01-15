/**
 * CPU State Viewer Module
 *
 * Displays CPU internal state including registers, flags, PC, SP,
 * current instruction, and memory hex dump. Adapts to different
 * CPU architectures (Micro4, Micro8, Micro16, Micro32).
 *
 * Features:
 * - Auto-detect CPU type from circuit metadata
 * - Register display with CSS grid layout
 * - Flags with visual indicators (green=set, gray=clear)
 * - PC and SP with hex values
 * - Current instruction decoded
 * - Memory hex dump (scrollable, 16 bytes per row)
 * - Event subscription for auto-update on simulation step
 * - Click register/memory to set watchpoint
 * - Highlight changed values in yellow briefly
 */

(function(exports) {
    'use strict';

    // CPU Architecture Definitions
    const CPUArchitectures = {
        MICRO4: {
            name: 'Micro4',
            dataBits: 4,
            addressBits: 8,
            registers: [
                { name: 'A', description: 'Accumulator', bits: 4 }
            ],
            flags: [
                { name: 'Z', description: 'Zero', bit: 0 }
            ],
            hasStack: false,
            memorySize: 256
        },
        MICRO8: {
            name: 'Micro8',
            dataBits: 8,
            addressBits: 16,
            registers: [
                { name: 'R0', alias: 'A', description: 'Accumulator', bits: 8 },
                { name: 'R1', alias: 'B', description: 'Counter High', bits: 8 },
                { name: 'R2', alias: 'C', description: 'Counter Low', bits: 8 },
                { name: 'R3', alias: 'D', description: 'Data High', bits: 8 },
                { name: 'R4', alias: 'E', description: 'Extended Low', bits: 8 },
                { name: 'R5', alias: 'H', description: 'Address High', bits: 8 },
                { name: 'R6', alias: 'L', description: 'Address Low', bits: 8 },
                { name: 'R7', alias: '-', description: 'General Purpose', bits: 8 }
            ],
            registerPairs: [
                { name: 'BC', high: 'R1', low: 'R2' },
                { name: 'DE', high: 'R3', low: 'R4' },
                { name: 'HL', high: 'R5', low: 'R6' }
            ],
            flags: [
                { name: 'C', description: 'Carry', bit: 0 },
                { name: 'O', description: 'Overflow', bit: 2 },
                { name: 'Z', description: 'Zero', bit: 6 },
                { name: 'S', description: 'Sign', bit: 7 }
            ],
            hasStack: true,
            memorySize: 65536
        },
        MICRO16: {
            name: 'Micro16',
            dataBits: 16,
            addressBits: 20,
            registers: [
                { name: 'AX', alias: 'R0', description: 'Accumulator', bits: 16 },
                { name: 'BX', alias: 'R1', description: 'Base', bits: 16 },
                { name: 'CX', alias: 'R2', description: 'Counter', bits: 16 },
                { name: 'DX', alias: 'R3', description: 'Data', bits: 16 },
                { name: 'SI', alias: 'R4', description: 'Source Index', bits: 16 },
                { name: 'DI', alias: 'R5', description: 'Destination Index', bits: 16 },
                { name: 'BP', alias: 'R6', description: 'Base Pointer', bits: 16 },
                { name: 'R7', alias: '-', description: 'General Purpose', bits: 16 }
            ],
            segmentRegisters: [
                { name: 'CS', description: 'Code Segment' },
                { name: 'DS', description: 'Data Segment' },
                { name: 'SS', description: 'Stack Segment' },
                { name: 'ES', description: 'Extra Segment' }
            ],
            flags: [
                { name: 'C', description: 'Carry', bit: 0 },
                { name: 'Z', description: 'Zero', bit: 1 },
                { name: 'S', description: 'Sign', bit: 2 },
                { name: 'O', description: 'Overflow', bit: 3 },
                { name: 'D', description: 'Direction', bit: 4 },
                { name: 'I', description: 'Interrupt', bit: 5 },
                { name: 'T', description: 'Trap', bit: 6 },
                { name: 'P', description: 'Parity', bit: 7 }
            ],
            hasStack: true,
            memorySize: 1048576
        },
        MICRO32: {
            name: 'Micro32',
            dataBits: 32,
            addressBits: 32,
            registers: [
                { name: 'EAX', description: 'Extended Accumulator', bits: 32 },
                { name: 'EBX', description: 'Extended Base', bits: 32 },
                { name: 'ECX', description: 'Extended Counter', bits: 32 },
                { name: 'EDX', description: 'Extended Data', bits: 32 },
                { name: 'ESI', description: 'Extended Source Index', bits: 32 },
                { name: 'EDI', description: 'Extended Destination Index', bits: 32 },
                { name: 'EBP', description: 'Extended Base Pointer', bits: 32 },
                { name: 'ESP', description: 'Extended Stack Pointer', bits: 32 }
            ],
            controlRegisters: [
                { name: 'CR0', description: 'Control Register 0' },
                { name: 'CR2', description: 'Page Fault Linear Address' },
                { name: 'CR3', description: 'Page Directory Base' },
                { name: 'CR4', description: 'Control Register 4' }
            ],
            flags: [
                { name: 'C', description: 'Carry', bit: 0 },
                { name: 'P', description: 'Parity', bit: 2 },
                { name: 'A', description: 'Auxiliary', bit: 4 },
                { name: 'Z', description: 'Zero', bit: 6 },
                { name: 'S', description: 'Sign', bit: 7 },
                { name: 'T', description: 'Trap', bit: 8 },
                { name: 'I', description: 'Interrupt', bit: 9 },
                { name: 'D', description: 'Direction', bit: 10 },
                { name: 'O', description: 'Overflow', bit: 11 }
            ],
            hasStack: true,
            memorySize: 4294967296
        }
    };

    /**
     * Helper to safely set text content
     */
    function setText(elem, text) {
        elem.textContent = text;
    }

    /**
     * Helper to create element with text
     */
    function createTextElement(tag, text, className) {
        const elem = document.createElement(tag);
        if (className) elem.className = className;
        elem.textContent = text;
        return elem;
    }

    /**
     * Format a number as hex string
     */
    function toHex(value, digits) {
        return '0x' + (value >>> 0).toString(16).toUpperCase().padStart(digits, '0');
    }

    /**
     * CPUStateView - Main class for CPU state visualization
     */
    class CPUStateView {
        constructor(containerElement, options = {}) {
            this.container = typeof containerElement === 'string'
                ? document.getElementById(containerElement)
                : containerElement;

            if (!this.container) {
                throw new Error('CPUStateView: container element not found');
            }

            this.options = {
                cpuType: options.cpuType || 'auto',
                memoryViewRows: options.memoryViewRows || 16,
                memoryViewAddress: options.memoryViewAddress || 0,
                showInternalRegisters: options.showInternalRegisters || false,
                highlightDuration: options.highlightDuration || 500,
                ...options
            };

            // State storage
            this.cpuState = null;
            this.previousState = null;
            this.architecture = null;
            this.watchpoints = new Set();

            // Event system
            this.eventListeners = {
                watchpointSet: [],
                watchpointTriggered: [],
                memoryNavigate: [],
                stateUpdate: []
            };

            // Animation state
            this.changedElements = new Map();

            // Initialize UI
            this._initializeUI();
        }

        /**
         * Initialize the UI structure
         */
        _initializeUI() {
            // Clear container safely
            while (this.container.firstChild) {
                this.container.removeChild(this.container.firstChild);
            }
            this.container.style.fontFamily = "'SF Mono', 'Monaco', 'Consolas', monospace";
            this.container.style.fontSize = '11px';
            this.container.style.color = '#eee';

            // Main layout container
            this.mainContainer = document.createElement('div');
            this.mainContainer.className = 'cpu-state-view';
            this.container.appendChild(this.mainContainer);

            // CPU type indicator
            this.cpuTypePanel = this._createPanel('CPU Type');
            this.cpuTypeDisplay = document.createElement('div');
            this.cpuTypeDisplay.style.color = '#e94560';
            this.cpuTypeDisplay.style.fontSize = '14px';
            this.cpuTypeDisplay.style.fontWeight = 'bold';
            setText(this.cpuTypeDisplay, 'Not loaded');
            this.cpuTypePanel.appendChild(this.cpuTypeDisplay);
            this.mainContainer.appendChild(this.cpuTypePanel);

            // Registers panel
            this.registersPanel = this._createPanel('Registers');
            this.registersGrid = document.createElement('div');
            this.registersGrid.style.display = 'grid';
            this.registersGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(80px, 1fr))';
            this.registersGrid.style.gap = '6px';
            this.registersPanel.appendChild(this.registersGrid);
            this.mainContainer.appendChild(this.registersPanel);

            // Segment registers panel (for Micro16+)
            this.segmentPanel = this._createPanel('Segment Registers');
            this.segmentPanel.style.display = 'none';
            this.segmentGrid = document.createElement('div');
            this.segmentGrid.style.display = 'grid';
            this.segmentGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
            this.segmentGrid.style.gap = '6px';
            this.segmentPanel.appendChild(this.segmentGrid);
            this.mainContainer.appendChild(this.segmentPanel);

            // Flags panel
            this.flagsPanel = this._createPanel('Flags');
            this.flagsRow = document.createElement('div');
            this.flagsRow.style.display = 'flex';
            this.flagsRow.style.gap = '8px';
            this.flagsRow.style.flexWrap = 'wrap';
            this.flagsPanel.appendChild(this.flagsRow);
            this.mainContainer.appendChild(this.flagsPanel);

            // PC/SP panel
            this.pcSpPanel = this._createPanel('Program Counter / Stack');
            this.pcSpGrid = document.createElement('div');
            this.pcSpGrid.style.display = 'grid';
            this.pcSpGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            this.pcSpGrid.style.gap = '8px';
            this.pcSpPanel.appendChild(this.pcSpGrid);
            this.mainContainer.appendChild(this.pcSpPanel);

            // Current instruction panel
            this.instrPanel = this._createPanel('Current Instruction');
            this.instrDisplay = document.createElement('div');
            this.instrDisplay.style.cssText = 'background: #0a0a12; padding: 8px; border-radius: 4px; font-size: 12px;';
            this.instrPanel.appendChild(this.instrDisplay);
            this.mainContainer.appendChild(this.instrPanel);

            // Statistics panel
            this.statsPanel = this._createPanel('Statistics');
            this.statsGrid = document.createElement('div');
            this.statsGrid.style.display = 'grid';
            this.statsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            this.statsGrid.style.gap = '6px';
            this.statsPanel.appendChild(this.statsGrid);
            this.mainContainer.appendChild(this.statsPanel);

            // Memory viewer panel
            this.memoryPanel = this._createPanel('Memory');
            this._createMemoryViewer();
            this.mainContainer.appendChild(this.memoryPanel);

            // Watchpoints panel
            this.watchpointsPanel = this._createPanel('Watchpoints');
            this.watchpointsList = document.createElement('div');
            this.watchpointsList.style.maxHeight = '100px';
            this.watchpointsList.style.overflowY = 'auto';
            this.watchpointsPanel.appendChild(this.watchpointsList);
            this.mainContainer.appendChild(this.watchpointsPanel);

            // Add CSS styles
            this._injectStyles();
        }

        /**
         * Create a panel with header
         */
        _createPanel(title) {
            const panel = document.createElement('div');
            panel.className = 'csv-panel';

            const header = document.createElement('div');
            header.className = 'csv-panel-header';
            setText(header, title);
            panel.appendChild(header);

            return panel;
        }

        /**
         * Create memory viewer components
         */
        _createMemoryViewer() {
            // Address input row
            const addressRow = document.createElement('div');
            addressRow.style.display = 'flex';
            addressRow.style.gap = '8px';
            addressRow.style.marginBottom = '8px';
            addressRow.style.alignItems = 'center';

            const addressLabel = document.createElement('span');
            setText(addressLabel, 'Address:');
            addressLabel.style.color = '#888';
            addressRow.appendChild(addressLabel);

            this.addressInput = document.createElement('input');
            this.addressInput.type = 'text';
            this.addressInput.value = '0x0000';
            this.addressInput.style.cssText = 'width: 80px; padding: 4px 6px; background: #1a1a2e; border: 1px solid #0f3460; border-radius: 3px; color: #00ff00; font-family: inherit;';
            this.addressInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this._navigateToAddress();
                }
            });
            addressRow.appendChild(this.addressInput);

            const goBtn = document.createElement('button');
            setText(goBtn, 'Go');
            goBtn.style.cssText = 'padding: 4px 12px; background: #0f3460; border: none; border-radius: 3px; color: #eee; cursor: pointer;';
            goBtn.addEventListener('click', () => this._navigateToAddress());
            addressRow.appendChild(goBtn);

            this.memoryPanel.appendChild(addressRow);

            // Memory display
            this.memoryDisplay = document.createElement('div');
            this.memoryDisplay.className = 'csv-memory-display';
            this.memoryPanel.appendChild(this.memoryDisplay);
        }

        /**
         * Inject CSS styles
         */
        _injectStyles() {
            const styleId = 'cpu-state-view-styles';
            if (document.getElementById(styleId)) return;

            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .cpu-state-view {
                    user-select: none;
                }
                .csv-panel {
                    background: #16213e;
                    border: 2px solid #0f3460;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 10px;
                }
                .csv-panel-header {
                    color: #e94560;
                    font-size: 11px;
                    font-weight: bold;
                    text-transform: uppercase;
                    border-bottom: 1px solid #0f3460;
                    padding-bottom: 6px;
                    margin-bottom: 10px;
                }
                .csv-register {
                    background: #1a1a2e;
                    border: 1px solid #0f3460;
                    border-radius: 4px;
                    padding: 6px 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .csv-register:hover {
                    border-color: #e94560;
                    background: #252545;
                }
                .csv-register.changed {
                    animation: csv-highlight 0.5s ease-out;
                }
                .csv-register.watchpoint {
                    border-color: #ffaa00;
                    box-shadow: 0 0 5px #ffaa00;
                }
                .csv-register-name {
                    font-size: 10px;
                    color: #888;
                }
                .csv-register-value {
                    font-size: 13px;
                    color: #00ff00;
                    font-weight: bold;
                }
                .csv-flag {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 3px;
                    font-weight: bold;
                    font-size: 11px;
                    cursor: help;
                    transition: all 0.2s;
                }
                .csv-flag.set {
                    background: #00aa00;
                    color: #fff;
                }
                .csv-flag.clear {
                    background: #333;
                    color: #666;
                }
                .csv-flag.changed {
                    animation: csv-highlight 0.5s ease-out;
                }
                .csv-memory-display {
                    background: #0a0a12;
                    padding: 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    line-height: 1.6;
                    max-height: 300px;
                    overflow-y: auto;
                    overflow-x: auto;
                }
                .csv-memory-row {
                    display: flex;
                    white-space: nowrap;
                }
                .csv-memory-addr {
                    color: #e94560;
                    margin-right: 12px;
                    min-width: 60px;
                }
                .csv-memory-hex {
                    color: #00ff00;
                    margin-right: 4px;
                    cursor: pointer;
                    padding: 0 2px;
                }
                .csv-memory-hex:hover {
                    background: #333;
                    border-radius: 2px;
                }
                .csv-memory-hex.changed {
                    animation: csv-highlight 0.5s ease-out;
                }
                .csv-memory-hex.watchpoint {
                    background: #664400;
                }
                .csv-memory-ascii {
                    color: #888;
                    margin-left: 12px;
                }
                .csv-stat-box {
                    background: #1a1a2e;
                    padding: 6px 8px;
                    border-radius: 4px;
                    text-align: center;
                }
                .csv-stat-label {
                    font-size: 9px;
                    color: #888;
                }
                .csv-stat-value {
                    font-size: 14px;
                    color: #e94560;
                    font-weight: bold;
                }
                .csv-watchpoint-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 4px 0;
                    border-bottom: 1px solid #0f3460;
                }
                .csv-watchpoint-remove {
                    color: #e94560;
                    cursor: pointer;
                    padding: 0 4px;
                }
                @keyframes csv-highlight {
                    0% { background: #ffff00; }
                    100% { background: inherit; }
                }
            `;
            document.head.appendChild(style);
        }

        /**
         * Detect CPU type from circuit metadata
         */
        detectCPUType(circuitData) {
            if (!circuitData) return null;

            // Check for explicit CPU type in metadata
            if (circuitData.metadata && circuitData.metadata.cpuType) {
                const type = circuitData.metadata.cpuType.toUpperCase();
                if (CPUArchitectures[type]) {
                    return type;
                }
            }

            // Auto-detect from circuit structure
            const wires = circuitData.wires || [];
            const wireNames = wires.map(w => w.name.toLowerCase());

            // Check for Micro32 indicators
            if (wireNames.some(n => n.includes('eax') || n.includes('ebx') || n.includes('cr0'))) {
                return 'MICRO32';
            }

            // Check for Micro16 indicators
            if (wireNames.some(n => n.includes('cs') || n.includes('ds') || n.includes('ss') || n.includes('ax'))) {
                return 'MICRO16';
            }

            // Check for Micro8 indicators
            if (wireNames.some(n => /^r[0-7]$/.test(n) || n.includes('hl') || n.includes('bc'))) {
                return 'MICRO8';
            }

            // Default to Micro4
            return 'MICRO4';
        }

        /**
         * Set the CPU architecture
         */
        setArchitecture(archType) {
            if (typeof archType === 'string') {
                this.architecture = CPUArchitectures[archType.toUpperCase()];
            } else {
                this.architecture = archType;
            }

            if (!this.architecture) {
                console.warn('CPUStateView: Unknown architecture, defaulting to MICRO8');
                this.architecture = CPUArchitectures.MICRO8;
            }

            setText(this.cpuTypeDisplay, this.architecture.name);
            this._rebuildUI();
        }

        /**
         * Rebuild UI for current architecture
         */
        _rebuildUI() {
            if (!this.architecture) return;

            // Clear register grid
            while (this.registersGrid.firstChild) {
                this.registersGrid.removeChild(this.registersGrid.firstChild);
            }

            // Build register display
            this.registerElements = {};
            for (const reg of this.architecture.registers) {
                const elem = this._createRegisterElement(reg);
                this.registersGrid.appendChild(elem);
                this.registerElements[reg.name] = elem;
            }

            // Build segment registers (if applicable)
            while (this.segmentGrid.firstChild) {
                this.segmentGrid.removeChild(this.segmentGrid.firstChild);
            }
            if (this.architecture.segmentRegisters) {
                this.segmentPanel.style.display = 'block';
                this.segmentElements = {};
                for (const seg of this.architecture.segmentRegisters) {
                    const elem = this._createRegisterElement(seg, true);
                    this.segmentGrid.appendChild(elem);
                    this.segmentElements[seg.name] = elem;
                }
            } else {
                this.segmentPanel.style.display = 'none';
            }

            // Build flags display
            while (this.flagsRow.firstChild) {
                this.flagsRow.removeChild(this.flagsRow.firstChild);
            }
            this.flagElements = {};
            for (const flag of this.architecture.flags) {
                const elem = this._createFlagElement(flag);
                this.flagsRow.appendChild(elem);
                this.flagElements[flag.name] = elem;
            }

            // Build PC/SP display
            while (this.pcSpGrid.firstChild) {
                this.pcSpGrid.removeChild(this.pcSpGrid.firstChild);
            }
            this.pcElement = this._createRegisterElement({ name: 'PC', description: 'Program Counter', bits: this.architecture.addressBits });
            this.pcSpGrid.appendChild(this.pcElement);

            if (this.architecture.hasStack) {
                this.spElement = this._createRegisterElement({ name: 'SP', description: 'Stack Pointer', bits: this.architecture.addressBits });
                this.pcSpGrid.appendChild(this.spElement);
            }

            // Build stats display
            while (this.statsGrid.firstChild) {
                this.statsGrid.removeChild(this.statsGrid.firstChild);
            }
            this.cyclesElement = this._createStatElement('Cycles', '0');
            this.instrCountElement = this._createStatElement('Instructions', '0');
            this.statsGrid.appendChild(this.cyclesElement);
            this.statsGrid.appendChild(this.instrCountElement);

            // Initialize memory display
            this._updateMemoryDisplay();
        }

        /**
         * Create a register element
         */
        _createRegisterElement(reg, isSegment = false) {
            const elem = document.createElement('div');
            elem.className = 'csv-register';
            elem.dataset.regName = reg.name;
            elem.title = reg.description || reg.name;

            const nameDiv = document.createElement('div');
            nameDiv.className = 'csv-register-name';
            setText(nameDiv, reg.alias ? `${reg.name} (${reg.alias})` : reg.name);
            elem.appendChild(nameDiv);

            const valueDiv = document.createElement('div');
            valueDiv.className = 'csv-register-value';
            setText(valueDiv, '0x' + '0'.repeat(Math.ceil((reg.bits || 16) / 4)));
            elem.appendChild(valueDiv);

            // Click to set watchpoint
            elem.addEventListener('click', () => this._toggleWatchpoint('register', reg.name));

            return elem;
        }

        /**
         * Create a flag element
         */
        _createFlagElement(flag) {
            const elem = document.createElement('span');
            elem.className = 'csv-flag clear';
            setText(elem, flag.name);
            elem.title = flag.description;
            elem.dataset.flagName = flag.name;

            elem.addEventListener('click', () => this._toggleWatchpoint('flag', flag.name));

            return elem;
        }

        /**
         * Create a stat element
         */
        _createStatElement(label, value) {
            const elem = document.createElement('div');
            elem.className = 'csv-stat-box';

            const labelDiv = document.createElement('div');
            labelDiv.className = 'csv-stat-label';
            setText(labelDiv, label);
            elem.appendChild(labelDiv);

            const valueDiv = document.createElement('div');
            valueDiv.className = 'csv-stat-value';
            setText(valueDiv, value);
            elem.appendChild(valueDiv);

            elem.valueDiv = valueDiv;
            return elem;
        }

        /**
         * Update the view with new CPU state
         */
        update(state) {
            this.previousState = this.cpuState;
            this.cpuState = state;

            if (!this.architecture) {
                // Try to detect architecture from state
                if (state.cpuType) {
                    this.setArchitecture(state.cpuType);
                } else {
                    this.setArchitecture('MICRO8');
                }
            }

            this._updateRegisters();
            this._updateFlags();
            this._updatePCSP();
            this._updateInstruction();
            this._updateStats();
            this._updateMemoryDisplay();
            this._checkWatchpoints();

            this._emit('stateUpdate', state);
        }

        /**
         * Update register display
         */
        _updateRegisters() {
            if (!this.cpuState || !this.registerElements) return;

            const regs = this.cpuState.registers || {};
            const prevRegs = this.previousState?.registers || {};

            for (const [name, elem] of Object.entries(this.registerElements)) {
                const value = regs[name] ?? 0;
                const prevValue = prevRegs[name];
                const bits = this.architecture.registers.find(r => r.name === name)?.bits || 8;
                const hexDigits = Math.ceil(bits / 4);

                const valueDiv = elem.querySelector('.csv-register-value');
                setText(valueDiv, toHex(value, hexDigits));

                // Highlight if changed
                if (prevValue !== undefined && prevValue !== value) {
                    this._highlightElement(elem);
                }

                // Show watchpoint status
                elem.classList.toggle('watchpoint', this.watchpoints.has(`register:${name}`));
            }

            // Update segment registers
            if (this.segmentElements && this.cpuState.segments) {
                for (const [name, elem] of Object.entries(this.segmentElements)) {
                    const value = this.cpuState.segments[name] ?? 0;
                    const valueDiv = elem.querySelector('.csv-register-value');
                    setText(valueDiv, toHex(value, 4));
                }
            }
        }

        /**
         * Update flags display
         */
        _updateFlags() {
            if (!this.cpuState || !this.flagElements) return;

            const flags = this.cpuState.flags ?? 0;
            const prevFlags = this.previousState?.flags ?? flags;

            for (const flagDef of this.architecture.flags) {
                const elem = this.flagElements[flagDef.name];
                if (!elem) continue;

                const isSet = (flags & (1 << flagDef.bit)) !== 0;
                const wasSet = (prevFlags & (1 << flagDef.bit)) !== 0;

                elem.classList.toggle('set', isSet);
                elem.classList.toggle('clear', !isSet);

                if (isSet !== wasSet) {
                    this._highlightElement(elem);
                }

                elem.classList.toggle('watchpoint', this.watchpoints.has(`flag:${flagDef.name}`));
            }
        }

        /**
         * Update PC and SP display
         */
        _updatePCSP() {
            if (!this.cpuState) return;

            const hexDigits = Math.ceil(this.architecture.addressBits / 4);

            if (this.pcElement) {
                const pc = this.cpuState.pc ?? 0;
                const prevPc = this.previousState?.pc;
                const valueDiv = this.pcElement.querySelector('.csv-register-value');
                setText(valueDiv, toHex(pc, hexDigits));

                if (prevPc !== undefined && prevPc !== pc) {
                    this._highlightElement(this.pcElement);
                }
            }

            if (this.spElement && this.cpuState.sp !== undefined) {
                const sp = this.cpuState.sp ?? 0;
                const prevSp = this.previousState?.sp;
                const valueDiv = this.spElement.querySelector('.csv-register-value');
                setText(valueDiv, toHex(sp, hexDigits));

                if (prevSp !== undefined && prevSp !== sp) {
                    this._highlightElement(this.spElement);
                }
            }
        }

        /**
         * Update current instruction display
         */
        _updateInstruction() {
            if (!this.instrDisplay) return;

            const instr = this.cpuState?.currentInstruction;
            if (!instr) {
                // Clear and set empty state
                while (this.instrDisplay.firstChild) {
                    this.instrDisplay.removeChild(this.instrDisplay.firstChild);
                }
                const noInstr = document.createElement('span');
                noInstr.style.color = '#888';
                setText(noInstr, 'No instruction');
                this.instrDisplay.appendChild(noInstr);
                return;
            }

            // Clear existing content
            while (this.instrDisplay.firstChild) {
                this.instrDisplay.removeChild(this.instrDisplay.firstChild);
            }

            // Address row
            const addrRow = document.createElement('div');
            addrRow.style.marginBottom = '4px';
            const addrLabel = document.createElement('span');
            addrLabel.style.color = '#888';
            setText(addrLabel, 'Address: ');
            addrRow.appendChild(addrLabel);
            const addrValue = document.createElement('span');
            addrValue.style.color = '#e94560';
            setText(addrValue, toHex(instr.address ?? 0, 4));
            addrRow.appendChild(addrValue);
            this.instrDisplay.appendChild(addrRow);

            // Opcode row
            const opcodeRow = document.createElement('div');
            opcodeRow.style.marginBottom = '4px';
            const opcodeLabel = document.createElement('span');
            opcodeLabel.style.color = '#888';
            setText(opcodeLabel, 'Opcode: ');
            opcodeRow.appendChild(opcodeLabel);
            const opcodeValue = document.createElement('span');
            opcodeValue.style.color = '#00ff00';
            setText(opcodeValue, toHex(instr.opcode ?? 0, 2));
            opcodeRow.appendChild(opcodeValue);
            if (instr.operand !== undefined) {
                const operandValue = document.createElement('span');
                operandValue.style.color = '#0077b6';
                operandValue.style.marginLeft = '4px';
                setText(operandValue, toHex(instr.operand, 2));
                opcodeRow.appendChild(operandValue);
            }
            this.instrDisplay.appendChild(opcodeRow);

            // Decoded row
            const decodedRow = document.createElement('div');
            const decodedLabel = document.createElement('span');
            decodedLabel.style.color = '#888';
            setText(decodedLabel, 'Decoded: ');
            decodedRow.appendChild(decodedLabel);
            const mnemonic = document.createElement('span');
            mnemonic.style.color = '#fff';
            setText(mnemonic, instr.mnemonic || 'UNKNOWN');
            decodedRow.appendChild(mnemonic);
            if (instr.operandStr) {
                const operandStr = document.createElement('span');
                operandStr.style.color = '#888';
                operandStr.style.marginLeft = '4px';
                setText(operandStr, instr.operandStr);
                decodedRow.appendChild(operandStr);
            }
            this.instrDisplay.appendChild(decodedRow);
        }

        /**
         * Update statistics display
         */
        _updateStats() {
            if (!this.cpuState) return;

            if (this.cyclesElement) {
                setText(this.cyclesElement.valueDiv, (this.cpuState.cycles ?? 0).toLocaleString());
            }
            if (this.instrCountElement) {
                setText(this.instrCountElement.valueDiv, (this.cpuState.instructions ?? 0).toLocaleString());
            }
        }

        /**
         * Update memory display using safe DOM methods
         */
        _updateMemoryDisplay() {
            if (!this.memoryDisplay) return;

            // Clear existing content
            while (this.memoryDisplay.firstChild) {
                this.memoryDisplay.removeChild(this.memoryDisplay.firstChild);
            }

            const memory = this.cpuState?.memory || [];
            const startAddr = this.options.memoryViewAddress;
            const rows = this.options.memoryViewRows;
            const bytesPerRow = 16;
            const hexDigits = Math.ceil(this.architecture?.addressBits / 4) || 4;

            for (let row = 0; row < rows; row++) {
                const rowAddr = startAddr + (row * bytesPerRow);
                const rowElem = document.createElement('div');
                rowElem.className = 'csv-memory-row';

                // Address label
                const addrSpan = document.createElement('span');
                addrSpan.className = 'csv-memory-addr';
                setText(addrSpan, toHex(rowAddr, hexDigits));
                rowElem.appendChild(addrSpan);

                // Hex bytes
                for (let col = 0; col < bytesPerRow; col++) {
                    const addr = rowAddr + col;
                    const value = memory[addr] ?? 0;
                    const prevValue = this.previousState?.memory?.[addr];
                    const changed = prevValue !== undefined && prevValue !== value;
                    const isWatchpoint = this.watchpoints.has(`memory:${addr}`);

                    const hexSpan = document.createElement('span');
                    hexSpan.className = 'csv-memory-hex';
                    if (changed) hexSpan.classList.add('changed');
                    if (isWatchpoint) hexSpan.classList.add('watchpoint');
                    hexSpan.dataset.addr = addr;
                    setText(hexSpan, (value >>> 0).toString(16).toUpperCase().padStart(2, '0'));

                    hexSpan.addEventListener('click', () => {
                        this._toggleWatchpoint('memory', addr);
                    });

                    rowElem.appendChild(hexSpan);

                    // Add space in middle
                    if (col === 7) {
                        const space = document.createElement('span');
                        setText(space, ' ');
                        rowElem.appendChild(space);
                    }
                }

                // ASCII representation
                const asciiSpan = document.createElement('span');
                asciiSpan.className = 'csv-memory-ascii';
                let asciiStr = '';
                for (let col = 0; col < bytesPerRow; col++) {
                    const addr = rowAddr + col;
                    const value = memory[addr] ?? 0;
                    asciiStr += (value >= 32 && value < 127) ? String.fromCharCode(value) : '.';
                }
                setText(asciiSpan, asciiStr);
                rowElem.appendChild(asciiSpan);

                this.memoryDisplay.appendChild(rowElem);
            }
        }

        /**
         * Navigate to a memory address
         */
        _navigateToAddress() {
            let addr = this.addressInput.value.trim();
            if (addr.startsWith('0x') || addr.startsWith('0X')) {
                addr = parseInt(addr, 16);
            } else {
                addr = parseInt(addr);
            }

            if (isNaN(addr)) {
                addr = 0;
            }

            // Align to row boundary
            addr = Math.floor(addr / 16) * 16;
            addr = Math.max(0, addr);

            this.options.memoryViewAddress = addr;
            this.addressInput.value = toHex(addr, 4);
            this._updateMemoryDisplay();

            this._emit('memoryNavigate', addr);
        }

        /**
         * Toggle a watchpoint
         */
        _toggleWatchpoint(type, name) {
            const key = `${type}:${name}`;

            if (this.watchpoints.has(key)) {
                this.watchpoints.delete(key);
            } else {
                this.watchpoints.add(key);
            }

            this._updateWatchpointsList();
            this._updateRegisters();
            this._updateFlags();
            this._updateMemoryDisplay();

            this._emit('watchpointSet', { type, name, active: this.watchpoints.has(key) });
        }

        /**
         * Update watchpoints list display using safe DOM methods
         */
        _updateWatchpointsList() {
            // Clear existing content
            while (this.watchpointsList.firstChild) {
                this.watchpointsList.removeChild(this.watchpointsList.firstChild);
            }

            if (this.watchpoints.size === 0) {
                const emptySpan = document.createElement('span');
                emptySpan.style.color = '#888';
                setText(emptySpan, 'No watchpoints set');
                this.watchpointsList.appendChild(emptySpan);
                return;
            }

            for (const wp of this.watchpoints) {
                const [type, name] = wp.split(':');
                const item = document.createElement('div');
                item.className = 'csv-watchpoint-item';

                const label = document.createElement('span');
                setText(label, `${type}: ${name}`);
                item.appendChild(label);

                const removeBtn = document.createElement('span');
                removeBtn.className = 'csv-watchpoint-remove';
                setText(removeBtn, 'x');
                removeBtn.addEventListener('click', () => this._toggleWatchpoint(type, name));
                item.appendChild(removeBtn);

                this.watchpointsList.appendChild(item);
            }
        }

        /**
         * Check watchpoints and emit events if triggered
         */
        _checkWatchpoints() {
            if (!this.previousState) return;

            for (const wp of this.watchpoints) {
                const [type, name] = wp.split(':');
                let oldValue, newValue;

                if (type === 'register') {
                    oldValue = this.previousState.registers?.[name];
                    newValue = this.cpuState?.registers?.[name];
                } else if (type === 'flag') {
                    const flag = this.architecture?.flags.find(f => f.name === name);
                    if (flag) {
                        oldValue = (this.previousState.flags ?? 0) & (1 << flag.bit);
                        newValue = (this.cpuState?.flags ?? 0) & (1 << flag.bit);
                    }
                } else if (type === 'memory') {
                    const addr = parseInt(name);
                    oldValue = this.previousState.memory?.[addr];
                    newValue = this.cpuState?.memory?.[addr];
                }

                if (oldValue !== newValue) {
                    this._emit('watchpointTriggered', {
                        type,
                        name,
                        oldValue,
                        newValue
                    });
                }
            }
        }

        /**
         * Highlight an element briefly
         */
        _highlightElement(elem) {
            elem.classList.add('changed');
            setTimeout(() => {
                elem.classList.remove('changed');
            }, this.options.highlightDuration);
        }

        /**
         * Add event listener
         */
        on(event, callback) {
            if (this.eventListeners[event]) {
                this.eventListeners[event].push(callback);
            }
            return this;
        }

        /**
         * Remove event listener
         */
        off(event, callback) {
            if (this.eventListeners[event]) {
                const idx = this.eventListeners[event].indexOf(callback);
                if (idx >= 0) {
                    this.eventListeners[event].splice(idx, 1);
                }
            }
            return this;
        }

        /**
         * Emit an event
         */
        _emit(event, data) {
            if (this.eventListeners[event]) {
                for (const callback of this.eventListeners[event]) {
                    callback(data);
                }
            }
        }

        /**
         * Subscribe to engine events
         */
        subscribeToEngine(engine) {
            if (engine.on) {
                engine.on('step', () => {
                    const state = this._extractStateFromEngine(engine);
                    this.update(state);
                });

                engine.on('reset', () => {
                    const state = this._extractStateFromEngine(engine);
                    this.update(state);
                });
            }
        }

        /**
         * Extract CPU state from engine
         */
        _extractStateFromEngine(engine) {
            // This is a placeholder - actual implementation depends on engine structure
            const state = {
                registers: {},
                flags: 0,
                pc: 0,
                sp: 0,
                memory: [],
                cycles: 0,
                instructions: 0,
                currentInstruction: null
            };

            // Try to extract from circuit state
            if (engine.exportState) {
                const exported = engine.exportState();
                // Map wire states to CPU state
                // This would need to be customized based on actual circuit naming
            }

            return state;
        }

        /**
         * Load state from JSON
         */
        loadFromJSON(json) {
            if (json.cpuType) {
                this.setArchitecture(json.cpuType);
            }
            this.update(json);
        }

        /**
         * Export current state to JSON
         */
        toJSON() {
            return {
                cpuType: this.architecture?.name,
                ...this.cpuState,
                watchpoints: Array.from(this.watchpoints)
            };
        }

        /**
         * Clear all watchpoints
         */
        clearWatchpoints() {
            this.watchpoints.clear();
            this._updateWatchpointsList();
            this._updateRegisters();
            this._updateFlags();
            this._updateMemoryDisplay();
        }

        /**
         * Dispose of the view
         */
        dispose() {
            while (this.container.firstChild) {
                this.container.removeChild(this.container.firstChild);
            }
            this.eventListeners = {
                watchpointSet: [],
                watchpointTriggered: [],
                memoryNavigate: [],
                stateUpdate: []
            };
        }
    }

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { CPUStateView, CPUArchitectures };
    } else {
        exports.CPUStateView = CPUStateView;
        exports.CPUArchitectures = CPUArchitectures;
    }

})(typeof window !== 'undefined' ? window : global);
