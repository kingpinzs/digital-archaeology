// src/builder/RelaySimulator.ts
// Simulates relay circuit behavior
// Propagates signals through the circuit and updates component states

import type {
  BuilderCircuit,
  ComponentInstance,
  SignalValue,
  ComponentState,
  SimulationState,
} from './types';
import { getComponentDefinition } from './ComponentDefinitions';

/**
 * Maximum simulation iterations to prevent infinite loops.
 */
const MAX_ITERATIONS = 1000;

/**
 * Result of a simulation step.
 */
export interface SimulationResult {
  /** Whether simulation converged (stable state reached) */
  converged: boolean;
  /** Number of iterations to converge */
  iterations: number;
  /** Updated component states */
  componentStates: Map<string, ComponentState>;
  /** Wire signal values */
  wireSignals: Map<string, SignalValue>;
  /** Error message if simulation failed */
  error?: string;
}

/**
 * Network node for signal propagation.
 * Represents a set of connected ports that share the same signal.
 */
interface NetNode {
  /** Components and ports in this net */
  connections: Array<{ componentId: string; portId: string }>;
  /** Current signal value */
  signal: SignalValue;
  /** Whether this net is driven by a source */
  hasDrive: boolean;
}

/**
 * RelaySimulator performs circuit simulation.
 * Uses event-driven simulation with signal propagation.
 */
export class RelaySimulator {
  private circuit: BuilderCircuit | null = null;
  private componentStates: Map<string, ComponentState> = new Map();
  private inputValues: Map<string, SignalValue> = new Map();
  private nets: Map<string, NetNode> = new Map();
  private wireToNet: Map<string, string> = new Map();
  private simulationState: SimulationState = {
    isRunning: false,
    speed: 1,
    cycle: 0,
    inputValues: new Map(),
  };

  /**
   * Load a circuit for simulation.
   * @param circuit The circuit to simulate
   */
  loadCircuit(circuit: BuilderCircuit): void {
    this.circuit = circuit;
    this.componentStates.clear();
    this.inputValues.clear();
    this.nets.clear();
    this.wireToNet.clear();
    this.simulationState.cycle = 0;

    // Initialize component states
    for (const component of circuit.components) {
      this.componentStates.set(component.id, {
        coilEnergized: false,
        switchClosed: this.isRelayNC(component) ? true : false,
        portValues: new Map(),
      });
    }

    // Build net list (connected port groups)
    this.buildNetList();

    // Initialize input values to low
    for (const input of circuit.inputs) {
      this.inputValues.set(input.id, 0);
    }
  }

  /**
   * Check if a component is a Normally Closed relay.
   */
  private isRelayNC(component: ComponentInstance): boolean {
    const def = getComponentDefinition(component.definitionId);
    return def?.type === 'relay_nc';
  }

  /**
   * Build the net list by grouping connected ports.
   */
  private buildNetList(): void {
    if (!this.circuit) return;

    this.nets.clear();
    this.wireToNet.clear();

    let netCounter = 0;

    // Each wire potentially creates or joins nets
    for (const wire of this.circuit.wires) {
      const sourceKey = `${wire.sourceComponent}:${wire.sourcePort}`;
      const targetKey = `${wire.targetComponent}:${wire.targetPort}`;

      // Check if either endpoint already has a net
      let existingNetId: string | undefined;
      for (const [netId, net] of this.nets) {
        if (
          net.connections.some(
            (c) =>
              `${c.componentId}:${c.portId}` === sourceKey ||
              `${c.componentId}:${c.portId}` === targetKey
          )
        ) {
          existingNetId = netId;
          break;
        }
      }

      if (existingNetId) {
        // Add to existing net
        const net = this.nets.get(existingNetId)!;
        if (!net.connections.some((c) => `${c.componentId}:${c.portId}` === sourceKey)) {
          net.connections.push({ componentId: wire.sourceComponent, portId: wire.sourcePort });
        }
        if (!net.connections.some((c) => `${c.componentId}:${c.portId}` === targetKey)) {
          net.connections.push({ componentId: wire.targetComponent, portId: wire.targetPort });
        }
        this.wireToNet.set(wire.id, existingNetId);
      } else {
        // Create new net
        const netId = `net_${netCounter++}`;
        this.nets.set(netId, {
          connections: [
            { componentId: wire.sourceComponent, portId: wire.sourcePort },
            { componentId: wire.targetComponent, portId: wire.targetPort },
          ],
          signal: 2, // Unknown
          hasDrive: false,
        });
        this.wireToNet.set(wire.id, netId);
      }
    }
  }

  /**
   * Set an input value.
   * @param inputId Input port ID
   * @param value Signal value
   */
  setInput(inputId: string, value: SignalValue): void {
    this.inputValues.set(inputId, value);
    this.simulationState.inputValues.set(inputId, value);
  }

  /**
   * Get an input value.
   * @param inputId Input port ID
   * @returns Signal value
   */
  getInput(inputId: string): SignalValue {
    return this.inputValues.get(inputId) ?? 0;
  }

  /**
   * Toggle an input value.
   * @param inputId Input port ID
   */
  toggleInput(inputId: string): void {
    const current = this.getInput(inputId);
    this.setInput(inputId, current === 1 ? 0 : 1);
  }

  /**
   * Get an output value.
   * @param outputId Output port ID
   * @returns Signal value
   */
  getOutput(outputId: string): SignalValue {
    if (!this.circuit) return 2;

    const output = this.circuit.outputs.find((o) => o.id === outputId);
    if (!output) return 2;

    const state = this.componentStates.get(output.componentId);
    return state?.portValues.get('in') ?? 2;
  }

  /**
   * Run one simulation step.
   * Propagates signals until stable or max iterations reached.
   */
  step(): SimulationResult {
    if (!this.circuit) {
      return {
        converged: false,
        iterations: 0,
        componentStates: new Map(),
        wireSignals: new Map(),
        error: 'No circuit loaded',
      };
    }

    let iterations = 0;
    let changed = true;

    // Reset net signals
    for (const net of this.nets.values()) {
      net.signal = 2;
      net.hasDrive = false;
    }

    while (changed && iterations < MAX_ITERATIONS) {
      changed = false;
      iterations++;

      // Phase 1: Update net signals from sources
      changed = this.updateNetSignals() || changed;

      // Phase 2: Update relay coil states
      changed = this.updateRelayCoils() || changed;

      // Phase 3: Update relay switch states
      changed = this.updateRelaySwitches() || changed;

      // Phase 4: Propagate signals through closed switches
      changed = this.propagateSignals() || changed;

      // Phase 5: Update component port values
      this.updatePortValues();
    }

    // Set undriven nets to LOW (0) instead of unknown (2)
    // In digital circuits, an undriven wire is typically pulled to ground
    for (const net of this.nets.values()) {
      if (!net.hasDrive) {
        net.signal = 0;
      }
    }

    // Update port values again after setting undriven nets to LOW
    this.updatePortValues();

    this.simulationState.cycle++;

    // Build wire signals map
    const wireSignals = new Map<string, SignalValue>();
    for (const wire of this.circuit.wires) {
      const netId = this.wireToNet.get(wire.id);
      if (netId) {
        const net = this.nets.get(netId);
        wireSignals.set(wire.id, net?.signal ?? 2);
      }
    }

    return {
      converged: iterations < MAX_ITERATIONS,
      iterations,
      componentStates: new Map(this.componentStates),
      wireSignals,
      error: iterations >= MAX_ITERATIONS ? 'Simulation did not converge' : undefined,
    };
  }

  /**
   * Update net signals from power sources and inputs.
   */
  private updateNetSignals(): boolean {
    if (!this.circuit) return false;

    let changed = false;

    for (const component of this.circuit.components) {
      const def = getComponentDefinition(component.definitionId);
      if (!def) continue;

      // Power source always drives high
      if (def.type === 'power') {
        changed = this.driveNet(component.id, 'out', 1) || changed;
      }

      // Input components drive based on input value
      if (def.type === 'input') {
        const inputValue = this.inputValues.get(component.id) ?? 0;
        changed = this.driveNet(component.id, 'out', inputValue) || changed;
      }
    }

    return changed;
  }

  /**
   * Drive a net from a component port.
   */
  private driveNet(componentId: string, portId: string, value: SignalValue): boolean {
    const portKey = `${componentId}:${portId}`;

    for (const [, net] of this.nets) {
      if (net.connections.some((c) => `${c.componentId}:${c.portId}` === portKey)) {
        if (net.signal !== value || !net.hasDrive) {
          net.signal = value;
          net.hasDrive = true;
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get the signal on a port.
   */
  private getPortSignal(componentId: string, portId: string): SignalValue {
    const portKey = `${componentId}:${portId}`;

    for (const [, net] of this.nets) {
      if (net.connections.some((c) => `${c.componentId}:${c.portId}` === portKey)) {
        return net.signal;
      }
    }

    return 2; // Unknown if not connected
  }

  /**
   * Update relay coil states based on input signals.
   */
  private updateRelayCoils(): boolean {
    if (!this.circuit) return false;

    let changed = false;

    for (const component of this.circuit.components) {
      const def = getComponentDefinition(component.definitionId);
      if (!def) continue;

      // Check if this is a relay
      if (def.type !== 'relay_no' && def.type !== 'relay_nc') continue;

      const state = this.componentStates.get(component.id)!;

      // Get coil input signal
      const coilInSignal = this.getPortSignal(component.id, 'coil_in');
      // Note: coil_out should be connected to ground for a complete circuit
      // For simplicity, we check if coil_in is high to determine if coil is energized
      const shouldBeEnergized = coilInSignal === 1;

      if (state.coilEnergized !== shouldBeEnergized) {
        state.coilEnergized = shouldBeEnergized;
        changed = true;
      }
    }

    return changed;
  }

  /**
   * Update relay switch states based on coil states.
   */
  private updateRelaySwitches(): boolean {
    if (!this.circuit) return false;

    let changed = false;

    for (const component of this.circuit.components) {
      const def = getComponentDefinition(component.definitionId);
      if (!def) continue;

      const state = this.componentStates.get(component.id)!;

      if (def.type === 'relay_no') {
        // Normally Open: closes when energized
        const shouldBeClosed = state.coilEnergized === true;
        if (state.switchClosed !== shouldBeClosed) {
          state.switchClosed = shouldBeClosed;
          changed = true;
        }
      } else if (def.type === 'relay_nc') {
        // Normally Closed: opens when energized
        const shouldBeClosed = state.coilEnergized !== true;
        if (state.switchClosed !== shouldBeClosed) {
          state.switchClosed = shouldBeClosed;
          changed = true;
        }
      }
    }

    return changed;
  }

  /**
   * Propagate signals through closed relay switches.
   */
  private propagateSignals(): boolean {
    if (!this.circuit) return false;

    let changed = false;

    for (const component of this.circuit.components) {
      const def = getComponentDefinition(component.definitionId);
      if (!def) continue;

      const state = this.componentStates.get(component.id)!;

      // Check relays with closed switches
      if ((def.type === 'relay_no' || def.type === 'relay_nc') && state.switchClosed) {
        // Propagate signal from contact_in to contact_out (and vice versa)
        const contactInSignal = this.getPortSignal(component.id, 'contact_in');
        const contactOutSignal = this.getPortSignal(component.id, 'contact_out');

        // Propagate the driven signal
        if (contactInSignal === 1 || contactInSignal === 0) {
          changed = this.driveNet(component.id, 'contact_out', contactInSignal) || changed;
        }
        if (contactOutSignal === 1 || contactOutSignal === 0) {
          changed = this.driveNet(component.id, 'contact_in', contactOutSignal) || changed;
        }
      }
    }

    return changed;
  }

  /**
   * Update all component port values from net signals.
   */
  private updatePortValues(): void {
    if (!this.circuit) return;

    for (const component of this.circuit.components) {
      const def = getComponentDefinition(component.definitionId);
      if (!def) continue;

      const state = this.componentStates.get(component.id)!;

      for (const port of def.ports) {
        const signal = this.getPortSignal(component.id, port.id);
        state.portValues.set(port.id, signal);
      }
    }
  }

  /**
   * Get the current state of a component.
   * @param componentId Component ID
   * @returns Component state or undefined
   */
  getComponentState(componentId: string): ComponentState | undefined {
    return this.componentStates.get(componentId);
  }

  /**
   * Get all component states.
   */
  getAllComponentStates(): Map<string, ComponentState> {
    return new Map(this.componentStates);
  }

  /**
   * Get the simulation state.
   */
  getSimulationState(): SimulationState {
    return { ...this.simulationState };
  }

  /**
   * Reset the simulation to initial state.
   */
  reset(): void {
    if (this.circuit) {
      this.loadCircuit(this.circuit);
    }
  }

  /**
   * Run the simulation with given input combination.
   * Returns the output values.
   * @param inputs Map of input ID to signal value
   * @returns Map of output ID to signal value
   */
  runWithInputs(inputs: Map<string, SignalValue>): Map<string, SignalValue> {
    // Set all inputs
    for (const [id, value] of inputs) {
      this.setInput(id, value);
    }

    // Run simulation
    this.step();

    // Collect outputs
    const outputs = new Map<string, SignalValue>();
    if (this.circuit) {
      for (const output of this.circuit.outputs) {
        outputs.set(output.id, this.getOutput(output.id));
      }
    }

    return outputs;
  }

  /**
   * Test circuit against a truth table.
   * @param truthTable The truth table to test against
   * @returns Verification result
   */
  verifyTruthTable(
    inputIds: string[],
    outputIds: string[],
    expectedRows: SignalValue[][]
  ): { passed: boolean; failedRows: number[] } {
    const failedRows: number[] = [];

    for (let rowIndex = 0; rowIndex < expectedRows.length; rowIndex++) {
      const row = expectedRows[rowIndex];

      // Set inputs
      const inputs = new Map<string, SignalValue>();
      for (let i = 0; i < inputIds.length; i++) {
        inputs.set(inputIds[i], row[i]);
      }

      // Run and check outputs
      const actualOutputs = this.runWithInputs(inputs);

      for (let i = 0; i < outputIds.length; i++) {
        const expectedValue = row[inputIds.length + i];
        const actualValue = actualOutputs.get(outputIds[i]);

        if (actualValue !== expectedValue) {
          failedRows.push(rowIndex);
          break;
        }
      }

      // Reset between tests
      this.reset();
    }

    return {
      passed: failedRows.length === 0,
      failedRows,
    };
  }
}
