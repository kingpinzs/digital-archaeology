// src/builder/ProgressTracker.ts
// Tracks user progress through the circuit builder

import type { Era, UserProgress, ProgressStats, TruthTable, VerificationResult } from './types';
import { UNLOCK_REQUIREMENTS, getTruthTable } from './ComponentDefinitions';
import type { BuilderCircuit } from './types';
import { RelaySimulator } from './RelaySimulator';

/**
 * Default initial progress.
 */
function createInitialProgress(): UserProgress {
  return {
    currentEra: 'relay',
    unlockedComponents: [],
    savedGates: [],
    achievements: [],
    stats: {
      circuitsCreated: 0,
      componentsPlaced: 0,
      wiresDrawn: 0,
      gatesUnlocked: 0,
    },
  };
}

/**
 * Achievement definitions.
 */
export const ACHIEVEMENTS = {
  first_circuit: {
    id: 'first_circuit',
    name: 'Hello, Relay!',
    description: 'Create your first circuit',
    icon: '🔌',
  },
  not_gate: {
    id: 'not_gate',
    name: 'Logic Inverter',
    description: 'Build a working NOT gate',
    icon: '🔄',
  },
  and_gate: {
    id: 'and_gate',
    name: 'Series Circuit',
    description: 'Build a working AND gate',
    icon: '🔗',
  },
  or_gate: {
    id: 'or_gate',
    name: 'Parallel Path',
    description: 'Build a working OR gate',
    icon: '⚡',
  },
  all_basic_gates: {
    id: 'all_basic_gates',
    name: 'Gate Master',
    description: 'Unlock NOT, AND, OR, NAND, NOR gates',
    icon: '🎓',
  },
  xor_gate: {
    id: 'xor_gate',
    name: 'Exclusive Logic',
    description: 'Build a working XOR gate',
    icon: '✨',
  },
  relay_master: {
    id: 'relay_master',
    name: 'Relay Master',
    description: 'Unlock all gates using relays',
    icon: '🏆',
  },
  ten_circuits: {
    id: 'ten_circuits',
    name: 'Circuit Designer',
    description: 'Create 10 circuits',
    icon: '📐',
  },
  hundred_components: {
    id: 'hundred_components',
    name: 'Component Collector',
    description: 'Place 100 components',
    icon: '🔧',
  },
} as const;

/**
 * ProgressTracker manages user progress through the circuit builder.
 */
export class ProgressTracker {
  private progress: UserProgress;
  private onProgressChange?: (progress: UserProgress) => void;
  private onAchievementUnlocked?: (achievementId: string) => void;
  private onGateUnlocked?: (gateId: string) => void;

  constructor(
    initialProgress?: UserProgress,
    callbacks?: {
      onProgressChange?: (progress: UserProgress) => void;
      onAchievementUnlocked?: (achievementId: string) => void;
      onGateUnlocked?: (gateId: string) => void;
    }
  ) {
    this.progress = initialProgress ?? createInitialProgress();
    this.onProgressChange = callbacks?.onProgressChange;
    this.onAchievementUnlocked = callbacks?.onAchievementUnlocked;
    this.onGateUnlocked = callbacks?.onGateUnlocked;
  }

  /**
   * Get current progress.
   */
  getProgress(): Readonly<UserProgress> {
    return this.progress;
  }

  /**
   * Get current era.
   */
  getCurrentEra(): Era {
    return this.progress.currentEra;
  }

  /**
   * Get unlocked components.
   */
  getUnlockedComponents(): string[] {
    return [...this.progress.unlockedComponents];
  }

  /**
   * Check if a component is unlocked.
   */
  isComponentUnlocked(componentId: string): boolean {
    return this.progress.unlockedComponents.includes(componentId);
  }

  /**
   * Get saved gates.
   */
  getSavedGates(): string[] {
    return [...this.progress.savedGates];
  }

  /**
   * Get achievements.
   */
  getAchievements(): string[] {
    return [...this.progress.achievements];
  }

  /**
   * Get statistics.
   */
  getStats(): Readonly<ProgressStats> {
    return this.progress.stats;
  }

  /**
   * Record a circuit creation.
   */
  recordCircuitCreated(): void {
    this.progress.stats.circuitsCreated++;
    this.notifyChange();

    // Check achievements
    if (this.progress.stats.circuitsCreated === 1) {
      this.unlockAchievement('first_circuit');
    }
    if (this.progress.stats.circuitsCreated >= 10) {
      this.unlockAchievement('ten_circuits');
    }
  }

  /**
   * Record a component placement.
   */
  recordComponentPlaced(): void {
    this.progress.stats.componentsPlaced++;
    this.notifyChange();

    // Check achievements
    if (this.progress.stats.componentsPlaced >= 100) {
      this.unlockAchievement('hundred_components');
    }
  }

  /**
   * Record a wire drawn.
   */
  recordWireDrawn(): void {
    this.progress.stats.wiresDrawn++;
    this.notifyChange();
  }

  /**
   * Unlock a component/gate.
   */
  unlockComponent(componentId: string): boolean {
    if (this.progress.unlockedComponents.includes(componentId)) {
      return false; // Already unlocked
    }

    this.progress.unlockedComponents.push(componentId);
    this.progress.stats.gatesUnlocked++;
    this.notifyChange();
    this.onGateUnlocked?.(componentId);

    // Check gate-specific achievements
    switch (componentId) {
      case 'not':
        this.unlockAchievement('not_gate');
        break;
      case 'and':
        this.unlockAchievement('and_gate');
        break;
      case 'or':
        this.unlockAchievement('or_gate');
        break;
      case 'xor':
        this.unlockAchievement('xor_gate');
        break;
    }

    // Check for all basic gates
    const basicGates = ['not', 'and', 'or', 'nand', 'nor'];
    if (basicGates.every((g) => this.progress.unlockedComponents.includes(g))) {
      this.unlockAchievement('all_basic_gates');
    }

    // Check for relay master
    const allGates = ['not', 'and', 'or', 'nand', 'nor', 'xor'];
    if (allGates.every((g) => this.progress.unlockedComponents.includes(g))) {
      this.unlockAchievement('relay_master');
    }

    return true;
  }

  /**
   * Save a user-created gate.
   */
  saveGate(gateId: string): boolean {
    if (this.progress.savedGates.includes(gateId)) {
      return false; // Already saved
    }

    this.progress.savedGates.push(gateId);
    this.notifyChange();
    return true;
  }

  /**
   * Remove a saved gate.
   */
  removeGate(gateId: string): boolean {
    const index = this.progress.savedGates.indexOf(gateId);
    if (index === -1) {
      return false;
    }

    this.progress.savedGates.splice(index, 1);
    this.notifyChange();
    return true;
  }

  /**
   * Unlock an achievement.
   */
  private unlockAchievement(achievementId: string): boolean {
    if (this.progress.achievements.includes(achievementId)) {
      return false;
    }

    this.progress.achievements.push(achievementId);
    this.notifyChange();
    this.onAchievementUnlocked?.(achievementId);
    return true;
  }

  /**
   * Advance to the next era.
   */
  advanceEra(): void {
    const eras: Era[] = ['relay', 'transistor', 'cmos', 'gate'];
    const currentIndex = eras.indexOf(this.progress.currentEra);
    if (currentIndex < eras.length - 1) {
      this.progress.currentEra = eras[currentIndex + 1];
      this.notifyChange();
    }
  }

  /**
   * Reset progress.
   */
  reset(): void {
    this.progress = createInitialProgress();
    this.notifyChange();
  }

  /**
   * Export progress as JSON.
   */
  exportProgress(): string {
    return JSON.stringify(this.progress);
  }

  /**
   * Import progress from JSON.
   */
  importProgress(json: string): boolean {
    try {
      const data = JSON.parse(json) as UserProgress;
      if (data.currentEra && data.unlockedComponents && data.savedGates) {
        this.progress = data;
        this.notifyChange();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Notify progress change callback.
   */
  private notifyChange(): void {
    this.onProgressChange?.(this.progress);
  }
}

/**
 * UnlockChecker verifies if a circuit matches a gate's expected behavior.
 */
export class UnlockChecker {
  private simulator: RelaySimulator;

  constructor() {
    this.simulator = new RelaySimulator();
  }

  /**
   * Check if a circuit matches a gate's truth table.
   * @param circuit The circuit to verify
   * @param gateId The gate to check against
   * @returns Verification result
   */
  checkGateUnlock(circuit: BuilderCircuit, gateId: string): VerificationResult {
    const truthTable = getTruthTable(gateId);
    if (!truthTable) {
      return {
        passed: false,
        passedRows: [],
        failedRows: [],
        errorMessage: `No truth table found for gate: ${gateId}`,
      };
    }

    // Validate circuit has correct inputs/outputs
    if (circuit.inputs.length !== truthTable.inputs.length) {
      return {
        passed: false,
        passedRows: [],
        failedRows: [],
        errorMessage: `Circuit has ${circuit.inputs.length} inputs, expected ${truthTable.inputs.length}`,
      };
    }

    if (circuit.outputs.length !== truthTable.outputs.length) {
      return {
        passed: false,
        passedRows: [],
        failedRows: [],
        errorMessage: `Circuit has ${circuit.outputs.length} outputs, expected ${truthTable.outputs.length}`,
      };
    }

    // Load circuit into simulator
    this.simulator.loadCircuit(circuit);

    // Test each row of the truth table
    const passedRows: number[] = [];
    const failedRows: number[] = [];

    for (let rowIndex = 0; rowIndex < truthTable.rows.length; rowIndex++) {
      const row = truthTable.rows[rowIndex];

      // Set inputs
      for (let i = 0; i < truthTable.inputs.length; i++) {
        const inputComponent = circuit.inputs[i];
        this.simulator.setInput(inputComponent.componentId, row[i]);
      }

      // Run simulation
      const result = this.simulator.step();

      if (!result.converged) {
        failedRows.push(rowIndex);
        continue;
      }

      // Check outputs
      let rowPassed = true;
      for (let i = 0; i < truthTable.outputs.length; i++) {
        const outputComponent = circuit.outputs[i];
        const expectedValue = row[truthTable.inputs.length + i];
        const actualValue = this.simulator.getOutput(outputComponent.componentId);

        if (actualValue !== expectedValue) {
          rowPassed = false;
          break;
        }
      }

      if (rowPassed) {
        passedRows.push(rowIndex);
      } else {
        failedRows.push(rowIndex);
      }

      // Reset for next test
      this.simulator.reset();
    }

    return {
      passed: failedRows.length === 0,
      passedRows,
      failedRows,
      errorMessage: failedRows.length > 0
        ? `Failed ${failedRows.length} of ${truthTable.rows.length} test cases`
        : undefined,
    };
  }

  /**
   * Check all unlock requirements and return which gates can be unlocked.
   * @param circuit The circuit to check
   * @returns Array of gate IDs that can be unlocked
   */
  checkAllUnlocks(circuit: BuilderCircuit): string[] {
    const unlockable: string[] = [];

    for (const req of UNLOCK_REQUIREMENTS) {
      const result = this.checkGateUnlock(circuit, req.componentId);
      if (result.passed) {
        unlockable.push(req.componentId);
      }
    }

    return unlockable;
  }

  /**
   * Run a custom truth table test.
   */
  testTruthTable(
    circuit: BuilderCircuit,
    truthTable: TruthTable
  ): VerificationResult {
    // Load circuit
    this.simulator.loadCircuit(circuit);

    // Get input/output component IDs
    const inputIds = circuit.inputs.map((i) => i.componentId);
    const outputIds = circuit.outputs.map((o) => o.componentId);

    // Verify against truth table
    const result = this.simulator.verifyTruthTable(
      inputIds,
      outputIds,
      truthTable.rows
    );

    const passedRows: number[] = [];
    for (let i = 0; i < truthTable.rows.length; i++) {
      if (!result.failedRows.includes(i)) {
        passedRows.push(i);
      }
    }

    return {
      passed: result.passed,
      passedRows,
      failedRows: result.failedRows,
      errorMessage: result.passed
        ? undefined
        : `Failed ${result.failedRows.length} of ${truthTable.rows.length} test cases`,
    };
  }
}
