// src/builder/ComponentDefinitions.ts
// Component definitions for the Circuit Builder
// Defines the building blocks: relays, power, ground, inputs, outputs

import type { ComponentDefinition, PortDefinition, Era, UnlockRequirement, TruthTable } from './types';

/**
 * Standard component dimensions in canvas units.
 */
export const COMPONENT_SIZES = {
  RELAY_WIDTH: 80,
  RELAY_HEIGHT: 100,
  SOURCE_SIZE: 40,
  PORT_SIZE: 30,
  GRID_SIZE: 20,
} as const;

/**
 * Create port definitions for a relay component.
 * Relays have:
 * - coil_in: Input to the coil (left side)
 * - coil_out: Output from coil (left side, below input)
 * - contact_in: Input to switch contacts (right side, top)
 * - contact_out: Output from switch contacts (right side, bottom)
 */
function createRelayPorts(): PortDefinition[] {
  return [
    {
      id: 'coil_in',
      name: 'Coil Input',
      direction: 'input',
      position: { x: 0, y: 25 },
    },
    {
      id: 'coil_out',
      name: 'Coil Output',
      direction: 'output',
      position: { x: 0, y: 75 },
    },
    {
      id: 'contact_in',
      name: 'Contact Input',
      direction: 'bidirectional',
      position: { x: 80, y: 25 },
    },
    {
      id: 'contact_out',
      name: 'Contact Output',
      direction: 'bidirectional',
      position: { x: 80, y: 75 },
    },
  ];
}

/**
 * Normally Open (NO) Relay definition.
 * When coil is NOT energized: switch is OPEN (no connection)
 * When coil IS energized: switch is CLOSED (connection made)
 */
export const RELAY_NO: ComponentDefinition = {
  id: 'relay_no',
  name: 'Relay (NO)',
  type: 'relay_no',
  era: 'relay',
  ports: createRelayPorts(),
  locked: false,
  width: COMPONENT_SIZES.RELAY_WIDTH,
  height: COMPONENT_SIZES.RELAY_HEIGHT,
  symbol: 'relay_no',
};

/**
 * Normally Closed (NC) Relay definition.
 * When coil is NOT energized: switch is CLOSED (connection made)
 * When coil IS energized: switch is OPEN (no connection)
 */
export const RELAY_NC: ComponentDefinition = {
  id: 'relay_nc',
  name: 'Relay (NC)',
  type: 'relay_nc',
  era: 'relay',
  ports: createRelayPorts(),
  locked: false,
  width: COMPONENT_SIZES.RELAY_WIDTH,
  height: COMPONENT_SIZES.RELAY_HEIGHT,
  symbol: 'relay_nc',
};

/**
 * Power source (VCC) definition.
 * Always outputs signal high (1).
 */
export const POWER: ComponentDefinition = {
  id: 'power',
  name: 'Power (VCC)',
  type: 'power',
  era: 'relay',
  ports: [
    {
      id: 'out',
      name: 'Output',
      direction: 'output',
      position: { x: 20, y: 40 },
    },
  ],
  locked: false,
  width: COMPONENT_SIZES.SOURCE_SIZE,
  height: COMPONENT_SIZES.SOURCE_SIZE,
  symbol: 'power',
};

/**
 * Ground connection definition.
 * Always accepts signal (sink to ground).
 */
export const GROUND: ComponentDefinition = {
  id: 'ground',
  name: 'Ground (GND)',
  type: 'ground',
  era: 'relay',
  ports: [
    {
      id: 'in',
      name: 'Input',
      direction: 'input',
      position: { x: 20, y: 0 },
    },
  ],
  locked: false,
  width: COMPONENT_SIZES.SOURCE_SIZE,
  height: COMPONENT_SIZES.SOURCE_SIZE,
  symbol: 'ground',
};

/**
 * External input definition.
 * User can toggle this to provide input signals to the circuit.
 */
export const INPUT: ComponentDefinition = {
  id: 'input',
  name: 'Input',
  type: 'input',
  era: 'relay',
  ports: [
    {
      id: 'out',
      name: 'Output',
      direction: 'output',
      position: { x: 30, y: 15 },
    },
  ],
  locked: false,
  width: COMPONENT_SIZES.PORT_SIZE,
  height: COMPONENT_SIZES.PORT_SIZE,
  symbol: 'input',
};

/**
 * External output definition.
 * Displays the output value from the circuit.
 */
export const OUTPUT: ComponentDefinition = {
  id: 'output',
  name: 'Output',
  type: 'output',
  era: 'relay',
  ports: [
    {
      id: 'in',
      name: 'Input',
      direction: 'input',
      position: { x: 0, y: 15 },
    },
  ],
  locked: false,
  width: COMPONENT_SIZES.PORT_SIZE,
  height: COMPONENT_SIZES.PORT_SIZE,
  symbol: 'output',
};

// ============================================================================
// Unlockable Gate Definitions
// These are initially locked and must be built from primitives
// ============================================================================

/**
 * NOT gate definition (unlockable).
 * Build from 1 NC relay to unlock.
 */
export const NOT_GATE: ComponentDefinition = {
  id: 'not',
  name: 'NOT Gate',
  type: 'user_gate',
  era: 'gate',
  ports: [
    {
      id: 'in',
      name: 'Input',
      direction: 'input',
      position: { x: 0, y: 20 },
    },
    {
      id: 'out',
      name: 'Output',
      direction: 'output',
      position: { x: 60, y: 20 },
    },
  ],
  locked: true,
  unlockRequirement: 'Build from NC relay',
  width: 60,
  height: 40,
  symbol: 'not',
};

/**
 * AND gate definition (unlockable).
 * Build from 2 NO relays in series to unlock.
 */
export const AND_GATE: ComponentDefinition = {
  id: 'and',
  name: 'AND Gate',
  type: 'user_gate',
  era: 'gate',
  ports: [
    {
      id: 'a',
      name: 'Input A',
      direction: 'input',
      position: { x: 0, y: 10 },
    },
    {
      id: 'b',
      name: 'Input B',
      direction: 'input',
      position: { x: 0, y: 30 },
    },
    {
      id: 'out',
      name: 'Output',
      direction: 'output',
      position: { x: 60, y: 20 },
    },
  ],
  locked: true,
  unlockRequirement: 'Build from 2 NO relays in series',
  width: 60,
  height: 40,
  symbol: 'and',
};

/**
 * OR gate definition (unlockable).
 * Build from 2 NO relays in parallel to unlock.
 */
export const OR_GATE: ComponentDefinition = {
  id: 'or',
  name: 'OR Gate',
  type: 'user_gate',
  era: 'gate',
  ports: [
    {
      id: 'a',
      name: 'Input A',
      direction: 'input',
      position: { x: 0, y: 10 },
    },
    {
      id: 'b',
      name: 'Input B',
      direction: 'input',
      position: { x: 0, y: 30 },
    },
    {
      id: 'out',
      name: 'Output',
      direction: 'output',
      position: { x: 60, y: 20 },
    },
  ],
  locked: true,
  unlockRequirement: 'Build from 2 NO relays in parallel',
  width: 60,
  height: 40,
  symbol: 'or',
};

/**
 * NAND gate definition (unlockable).
 * Build from AND + NOT to unlock.
 */
export const NAND_GATE: ComponentDefinition = {
  id: 'nand',
  name: 'NAND Gate',
  type: 'user_gate',
  era: 'gate',
  ports: [
    {
      id: 'a',
      name: 'Input A',
      direction: 'input',
      position: { x: 0, y: 10 },
    },
    {
      id: 'b',
      name: 'Input B',
      direction: 'input',
      position: { x: 0, y: 30 },
    },
    {
      id: 'out',
      name: 'Output',
      direction: 'output',
      position: { x: 60, y: 20 },
    },
  ],
  locked: true,
  unlockRequirement: 'Build from AND + NOT',
  width: 60,
  height: 40,
  symbol: 'nand',
};

/**
 * NOR gate definition (unlockable).
 * Build from OR + NOT to unlock.
 */
export const NOR_GATE: ComponentDefinition = {
  id: 'nor',
  name: 'NOR Gate',
  type: 'user_gate',
  era: 'gate',
  ports: [
    {
      id: 'a',
      name: 'Input A',
      direction: 'input',
      position: { x: 0, y: 10 },
    },
    {
      id: 'b',
      name: 'Input B',
      direction: 'input',
      position: { x: 0, y: 30 },
    },
    {
      id: 'out',
      name: 'Output',
      direction: 'output',
      position: { x: 60, y: 20 },
    },
  ],
  locked: true,
  unlockRequirement: 'Build from OR + NOT',
  width: 60,
  height: 40,
  symbol: 'nor',
};

/**
 * XOR gate definition (unlockable).
 * Build from combination of gates.
 */
export const XOR_GATE: ComponentDefinition = {
  id: 'xor',
  name: 'XOR Gate',
  type: 'user_gate',
  era: 'gate',
  ports: [
    {
      id: 'a',
      name: 'Input A',
      direction: 'input',
      position: { x: 0, y: 10 },
    },
    {
      id: 'b',
      name: 'Input B',
      direction: 'input',
      position: { x: 0, y: 30 },
    },
    {
      id: 'out',
      name: 'Output',
      direction: 'output',
      position: { x: 60, y: 20 },
    },
  ],
  locked: true,
  unlockRequirement: 'Build from NAND gates or other combinations',
  width: 60,
  height: 40,
  symbol: 'xor',
};

// ============================================================================
// Component Registry and Helpers
// ============================================================================

/**
 * All base component definitions.
 */
export const BASE_COMPONENTS: ComponentDefinition[] = [
  RELAY_NO,
  RELAY_NC,
  POWER,
  GROUND,
  INPUT,
  OUTPUT,
];

/**
 * All unlockable gate definitions.
 */
export const UNLOCKABLE_GATES: ComponentDefinition[] = [
  NOT_GATE,
  AND_GATE,
  OR_GATE,
  NAND_GATE,
  NOR_GATE,
  XOR_GATE,
];

/**
 * All component definitions.
 */
export const ALL_COMPONENTS: ComponentDefinition[] = [
  ...BASE_COMPONENTS,
  ...UNLOCKABLE_GATES,
];

/**
 * Component registry for quick lookup by ID.
 */
export const COMPONENT_REGISTRY: Map<string, ComponentDefinition> = new Map(
  ALL_COMPONENTS.map((c) => [c.id, c])
);

/**
 * Get a component definition by ID.
 * @param id Component definition ID
 * @returns ComponentDefinition or undefined
 */
export function getComponentDefinition(id: string): ComponentDefinition | undefined {
  return COMPONENT_REGISTRY.get(id);
}

/**
 * Get components available for a given era.
 * Includes base components and unlocked gates.
 * @param era Technology era
 * @param unlockedIds IDs of unlocked components
 * @returns Array of available component definitions
 */
export function getAvailableComponents(
  _era: Era,
  unlockedIds: string[] = []
): ComponentDefinition[] {
  const available: ComponentDefinition[] = [];

  for (const component of ALL_COMPONENTS) {
    // Base components are always available in relay era
    if (component.era === 'relay' && !component.locked) {
      available.push(component);
    }
    // Unlockable gates are available if unlocked
    else if (unlockedIds.includes(component.id)) {
      available.push({ ...component, locked: false });
    }
  }

  return available;
}

/**
 * Get components that can be unlocked (currently locked but have requirements).
 * @returns Array of locked component definitions with unlock requirements
 */
export function getUnlockableComponents(): ComponentDefinition[] {
  return UNLOCKABLE_GATES.filter((c) => c.locked);
}

// ============================================================================
// Truth Tables for Gate Verification
// ============================================================================

/**
 * NOT gate truth table.
 * IN=0 -> OUT=1
 * IN=1 -> OUT=0
 */
export const NOT_TRUTH_TABLE: TruthTable = {
  inputs: ['in'],
  outputs: ['out'],
  rows: [
    [0, 1],
    [1, 0],
  ],
};

/**
 * AND gate truth table.
 * A=0,B=0 -> OUT=0
 * A=0,B=1 -> OUT=0
 * A=1,B=0 -> OUT=0
 * A=1,B=1 -> OUT=1
 */
export const AND_TRUTH_TABLE: TruthTable = {
  inputs: ['a', 'b'],
  outputs: ['out'],
  rows: [
    [0, 0, 0],
    [0, 1, 0],
    [1, 0, 0],
    [1, 1, 1],
  ],
};

/**
 * OR gate truth table.
 * A=0,B=0 -> OUT=0
 * A=0,B=1 -> OUT=1
 * A=1,B=0 -> OUT=1
 * A=1,B=1 -> OUT=1
 */
export const OR_TRUTH_TABLE: TruthTable = {
  inputs: ['a', 'b'],
  outputs: ['out'],
  rows: [
    [0, 0, 0],
    [0, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
};

/**
 * NAND gate truth table.
 * A=0,B=0 -> OUT=1
 * A=0,B=1 -> OUT=1
 * A=1,B=0 -> OUT=1
 * A=1,B=1 -> OUT=0
 */
export const NAND_TRUTH_TABLE: TruthTable = {
  inputs: ['a', 'b'],
  outputs: ['out'],
  rows: [
    [0, 0, 1],
    [0, 1, 1],
    [1, 0, 1],
    [1, 1, 0],
  ],
};

/**
 * NOR gate truth table.
 * A=0,B=0 -> OUT=1
 * A=0,B=1 -> OUT=0
 * A=1,B=0 -> OUT=0
 * A=1,B=1 -> OUT=0
 */
export const NOR_TRUTH_TABLE: TruthTable = {
  inputs: ['a', 'b'],
  outputs: ['out'],
  rows: [
    [0, 0, 1],
    [0, 1, 0],
    [1, 0, 0],
    [1, 1, 0],
  ],
};

/**
 * XOR gate truth table.
 * A=0,B=0 -> OUT=0
 * A=0,B=1 -> OUT=1
 * A=1,B=0 -> OUT=1
 * A=1,B=1 -> OUT=0
 */
export const XOR_TRUTH_TABLE: TruthTable = {
  inputs: ['a', 'b'],
  outputs: ['out'],
  rows: [
    [0, 0, 0],
    [0, 1, 1],
    [1, 0, 1],
    [1, 1, 0],
  ],
};

/**
 * Map of gate IDs to their truth tables.
 */
export const TRUTH_TABLE_REGISTRY: Map<string, TruthTable> = new Map([
  ['not', NOT_TRUTH_TABLE],
  ['and', AND_TRUTH_TABLE],
  ['or', OR_TRUTH_TABLE],
  ['nand', NAND_TRUTH_TABLE],
  ['nor', NOR_TRUTH_TABLE],
  ['xor', XOR_TRUTH_TABLE],
]);

/**
 * Get truth table for a gate.
 * @param gateId Gate definition ID
 * @returns TruthTable or undefined
 */
export function getTruthTable(gateId: string): TruthTable | undefined {
  return TRUTH_TABLE_REGISTRY.get(gateId);
}

// ============================================================================
// Unlock Requirements
// ============================================================================

/**
 * Unlock requirements for each gate.
 */
export const UNLOCK_REQUIREMENTS: UnlockRequirement[] = [
  {
    componentId: 'not',
    name: 'NOT Gate',
    description: 'Build an inverter using a Normally Closed (NC) relay',
    truthTable: NOT_TRUTH_TABLE,
    hint: 'When the coil is energized, an NC relay opens its switch...',
  },
  {
    componentId: 'and',
    name: 'AND Gate',
    description: 'Build an AND gate using two Normally Open (NO) relays in series',
    truthTable: AND_TRUTH_TABLE,
    hint: 'When two switches are in series, both must be closed for current to flow.',
  },
  {
    componentId: 'or',
    name: 'OR Gate',
    description: 'Build an OR gate using two Normally Open (NO) relays in parallel',
    truthTable: OR_TRUTH_TABLE,
    hint: 'When two switches are in parallel, either one being closed allows current.',
  },
  {
    componentId: 'nand',
    name: 'NAND Gate',
    description: 'Build a NAND gate by combining AND and NOT',
    truthTable: NAND_TRUTH_TABLE,
    hint: 'NAND = NOT(AND). Add an inverter to the output of an AND gate.',
  },
  {
    componentId: 'nor',
    name: 'NOR Gate',
    description: 'Build a NOR gate by combining OR and NOT',
    truthTable: NOR_TRUTH_TABLE,
    hint: 'NOR = NOT(OR). Add an inverter to the output of an OR gate.',
  },
  {
    componentId: 'xor',
    name: 'XOR Gate',
    description: 'Build an XOR gate from NAND gates or other combinations',
    truthTable: XOR_TRUTH_TABLE,
    hint: 'XOR can be built from 4 NAND gates, or using the formula A XOR B = (A OR B) AND NOT(A AND B).',
  },
];

/**
 * Get unlock requirement for a gate.
 * @param gateId Gate definition ID
 * @returns UnlockRequirement or undefined
 */
export function getUnlockRequirement(gateId: string): UnlockRequirement | undefined {
  return UNLOCK_REQUIREMENTS.find((r) => r.componentId === gateId);
}
