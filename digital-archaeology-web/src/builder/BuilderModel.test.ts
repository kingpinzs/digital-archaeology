// src/builder/BuilderModel.test.ts
// Unit tests for BuilderModel

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BuilderModel } from './BuilderModel';

describe('BuilderModel', () => {
  let model: BuilderModel;

  beforeEach(() => {
    model = new BuilderModel();
  });

  describe('constructor', () => {
    it('creates an empty circuit by default', () => {
      const circuit = model.getCircuit();
      expect(circuit.components).toHaveLength(0);
      expect(circuit.wires).toHaveLength(0);
      expect(circuit.inputs).toHaveLength(0);
      expect(circuit.outputs).toHaveLength(0);
      expect(circuit.era).toBe('relay');
    });

    it('accepts an initial circuit', () => {
      const initial = {
        id: 'test-id',
        name: 'Test Circuit',
        era: 'relay' as const,
        components: [],
        wires: [],
        inputs: [],
        outputs: [],
      };
      const model = new BuilderModel(initial);
      expect(model.getName()).toBe('Test Circuit');
    });
  });

  describe('addComponent', () => {
    it('adds a relay component', () => {
      const component = model.addComponent('relay_no', { x: 100, y: 200 });
      expect(component).not.toBeNull();
      expect(component!.definitionId).toBe('relay_no');
      expect(component!.position).toEqual({ x: 100, y: 200 });
      expect(model.getComponents()).toHaveLength(1);
    });

    it('adds a relay_nc component', () => {
      const component = model.addComponent('relay_nc', { x: 50, y: 50 });
      expect(component).not.toBeNull();
      expect(component!.definitionId).toBe('relay_nc');
    });

    it('adds power and ground components', () => {
      model.addComponent('power', { x: 0, y: 0 });
      model.addComponent('ground', { x: 0, y: 100 });
      expect(model.getComponents()).toHaveLength(2);
    });

    it('returns null for unknown component types', () => {
      const component = model.addComponent('unknown_type', { x: 0, y: 0 });
      expect(component).toBeNull();
    });

    it('returns null for locked components', () => {
      const component = model.addComponent('not', { x: 0, y: 0 });
      expect(component).toBeNull();
    });

    it('adds input components to external inputs', () => {
      model.addComponent('input', { x: 0, y: 0 });
      expect(model.getInputs()).toHaveLength(1);
    });

    it('adds output components to external outputs', () => {
      model.addComponent('output', { x: 0, y: 0 });
      expect(model.getOutputs()).toHaveLength(1);
    });
  });

  describe('removeComponent', () => {
    it('removes a component', () => {
      const component = model.addComponent('relay_no', { x: 0, y: 0 });
      expect(model.getComponents()).toHaveLength(1);

      model.removeComponent(component!.id);
      expect(model.getComponents()).toHaveLength(0);
    });

    it('removes connected wires when removing component', () => {
      const relay1 = model.addComponent('relay_no', { x: 0, y: 0 });
      const relay2 = model.addComponent('relay_no', { x: 100, y: 0 });

      model.addWire(relay1!.id, 'contact_out', relay2!.id, 'coil_in');
      expect(model.getWires()).toHaveLength(1);

      model.removeComponent(relay1!.id);
      expect(model.getWires()).toHaveLength(0);
    });

    it('returns false for non-existent component', () => {
      const result = model.removeComponent('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('moveComponent', () => {
    it('moves a component to new position', () => {
      const component = model.addComponent('relay_no', { x: 0, y: 0 });
      model.moveComponent(component!.id, { x: 100, y: 200 });

      const moved = model.getComponent(component!.id);
      expect(moved!.position).toEqual({ x: 100, y: 200 });
    });

    it('returns false for non-existent component', () => {
      const result = model.moveComponent('non-existent', { x: 0, y: 0 });
      expect(result).toBe(false);
    });
  });

  describe('addWire', () => {
    it('adds a wire between two components', () => {
      const relay1 = model.addComponent('relay_no', { x: 0, y: 0 });
      const relay2 = model.addComponent('relay_no', { x: 100, y: 0 });

      const wire = model.addWire(relay1!.id, 'contact_out', relay2!.id, 'coil_in');
      expect(wire).not.toBeNull();
      expect(model.getWires()).toHaveLength(1);
    });

    it('returns null for invalid source component', () => {
      const relay = model.addComponent('relay_no', { x: 0, y: 0 });
      const wire = model.addWire('invalid', 'contact_out', relay!.id, 'coil_in');
      expect(wire).toBeNull();
    });

    it('returns null for invalid port', () => {
      const relay1 = model.addComponent('relay_no', { x: 0, y: 0 });
      const relay2 = model.addComponent('relay_no', { x: 100, y: 0 });

      const wire = model.addWire(relay1!.id, 'invalid_port', relay2!.id, 'coil_in');
      expect(wire).toBeNull();
    });

    it('prevents duplicate wires', () => {
      const relay1 = model.addComponent('relay_no', { x: 0, y: 0 });
      const relay2 = model.addComponent('relay_no', { x: 100, y: 0 });

      model.addWire(relay1!.id, 'contact_out', relay2!.id, 'coil_in');
      const duplicate = model.addWire(relay1!.id, 'contact_out', relay2!.id, 'coil_in');

      expect(duplicate).toBeNull();
      expect(model.getWires()).toHaveLength(1);
    });

    it('prevents self-connections', () => {
      const relay = model.addComponent('relay_no', { x: 0, y: 0 });
      const wire = model.addWire(relay!.id, 'contact_out', relay!.id, 'contact_out');
      expect(wire).toBeNull();
    });
  });

  describe('removeWire', () => {
    it('removes a wire', () => {
      const relay1 = model.addComponent('relay_no', { x: 0, y: 0 });
      const relay2 = model.addComponent('relay_no', { x: 100, y: 0 });
      const wire = model.addWire(relay1!.id, 'contact_out', relay2!.id, 'coil_in');

      model.removeWire(wire!.id);
      expect(model.getWires()).toHaveLength(0);
    });
  });

  describe('selection', () => {
    it('selects a component', () => {
      const component = model.addComponent('relay_no', { x: 0, y: 0 });
      model.selectComponent(component!.id);

      const selection = model.getSelection();
      expect(selection.components).toContain(component!.id);
    });

    it('clears selection when selecting new component without shift', () => {
      const c1 = model.addComponent('relay_no', { x: 0, y: 0 });
      const c2 = model.addComponent('relay_no', { x: 100, y: 0 });

      model.selectComponent(c1!.id);
      model.selectComponent(c2!.id, false);

      const selection = model.getSelection();
      expect(selection.components).toHaveLength(1);
      expect(selection.components).toContain(c2!.id);
    });

    it('adds to selection when using addToSelection', () => {
      const c1 = model.addComponent('relay_no', { x: 0, y: 0 });
      const c2 = model.addComponent('relay_no', { x: 100, y: 0 });

      model.selectComponent(c1!.id);
      model.selectComponent(c2!.id, true);

      const selection = model.getSelection();
      expect(selection.components).toHaveLength(2);
    });

    it('clears selection', () => {
      const component = model.addComponent('relay_no', { x: 0, y: 0 });
      model.selectComponent(component!.id);
      model.clearSelection();

      const selection = model.getSelection();
      expect(selection.components).toHaveLength(0);
    });

    it('deletes selection', () => {
      const component = model.addComponent('relay_no', { x: 0, y: 0 });
      model.selectComponent(component!.id);
      model.deleteSelection();

      expect(model.getComponents()).toHaveLength(0);
    });
  });

  describe('undo/redo', () => {
    it('undoes adding a component', () => {
      model.addComponent('relay_no', { x: 0, y: 0 });
      expect(model.getComponents()).toHaveLength(1);

      model.undo();
      expect(model.getComponents()).toHaveLength(0);
    });

    it('redoes after undo', () => {
      model.addComponent('relay_no', { x: 0, y: 0 });
      model.undo();
      model.redo();

      expect(model.getComponents()).toHaveLength(1);
    });

    it('reports canUndo correctly', () => {
      expect(model.canUndo()).toBe(false);

      model.addComponent('relay_no', { x: 0, y: 0 });
      expect(model.canUndo()).toBe(true);
    });

    it('reports canRedo correctly', () => {
      expect(model.canRedo()).toBe(false);

      model.addComponent('relay_no', { x: 0, y: 0 });
      model.undo();
      expect(model.canRedo()).toBe(true);
    });
  });

  describe('events', () => {
    it('emits componentAdded event', () => {
      const callback = vi.fn();
      model.on('componentAdded', callback);

      model.addComponent('relay_no', { x: 0, y: 0 });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].type).toBe('componentAdded');
    });

    it('emits componentRemoved event', () => {
      const callback = vi.fn();
      const component = model.addComponent('relay_no', { x: 0, y: 0 });

      model.on('componentRemoved', callback);
      model.removeComponent(component!.id);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('emits wireAdded event', () => {
      const callback = vi.fn();
      const relay1 = model.addComponent('relay_no', { x: 0, y: 0 });
      const relay2 = model.addComponent('relay_no', { x: 100, y: 0 });

      model.on('wireAdded', callback);
      model.addWire(relay1!.id, 'contact_out', relay2!.id, 'coil_in');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes from events', () => {
      const callback = vi.fn();
      const unsubscribe = model.on('componentAdded', callback);

      model.addComponent('relay_no', { x: 0, y: 0 });
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      model.addComponent('relay_no', { x: 100, y: 0 });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('circuit operations', () => {
    it('clears the circuit', () => {
      model.addComponent('relay_no', { x: 0, y: 0 });
      model.addComponent('relay_no', { x: 100, y: 0 });
      model.clear();

      expect(model.getComponents()).toHaveLength(0);
    });

    it('exports and imports circuit JSON', () => {
      model.addComponent('relay_no', { x: 100, y: 200 });
      model.setName('Test Export');

      const json = model.exportCircuit();
      const newModel = new BuilderModel();
      newModel.importCircuit(json);

      expect(newModel.getName()).toBe('Test Export');
      expect(newModel.getComponents()).toHaveLength(1);
      expect(newModel.getComponents()[0].position).toEqual({ x: 100, y: 200 });
    });

    it('creates a new circuit', () => {
      model.addComponent('relay_no', { x: 0, y: 0 });
      model.newCircuit('New Circuit');

      expect(model.getName()).toBe('New Circuit');
      expect(model.getComponents()).toHaveLength(0);
    });
  });

  describe('hit testing', () => {
    it('finds component at position', () => {
      const component = model.addComponent('relay_no', { x: 100, y: 100 });
      const foundId = model.getComponentAtPosition({ x: 120, y: 150 });
      expect(foundId).toBe(component!.id);
    });

    it('returns null when no component at position', () => {
      model.addComponent('relay_no', { x: 100, y: 100 });
      const foundId = model.getComponentAtPosition({ x: 0, y: 0 });
      expect(foundId).toBeNull();
    });

    it('finds port at position', () => {
      const component = model.addComponent('relay_no', { x: 100, y: 100 });
      // coil_in port is at position (0, 25) relative to component
      const port = model.getPortAtPosition({ x: 100, y: 125 }, 15);
      expect(port).not.toBeNull();
      expect(port!.componentId).toBe(component!.id);
      expect(port!.portId).toBe('coil_in');
    });
  });
});
