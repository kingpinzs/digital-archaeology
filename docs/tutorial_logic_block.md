# Tutorial: Building Your First Logic Block

This tutorial walks through creating a simple logic circuit using the Micro4 Circuit Builder. You'll learn how power flows through gates and how to build a basic 2-bit decoder.

## Understanding Power Flow

Before building circuits, it's essential to understand where signals come from.

### The Power Rails

Every digital circuit has two power rails:

- **VDD** (Power Supply): Always outputs `1` (HIGH, +5V typically)
- **GND** (Ground): Always outputs `0` (LOW, 0V)

When a gate outputs `1`, it's actually connecting its output to VDD internally.
When a gate outputs `0`, it's connecting its output to GND internally.

### Try the Power Demo

1. Open the Circuit Builder (`visualizer/index.html`)
2. Click **"Power Demo"**
3. Observe:
   - Top LED: Connected directly to VDD → LED is ON (green)
   - Bottom LED: GND → NOT gate → LED is ON

The NOT gate receives `0` from GND, inverts it to `1`, and the LED lights up. But where does that `1` come from? The NOT gate internally routes VDD to its output when its input is `0`.

## Building a Simple Inverter Circuit

Let's build a basic circuit from scratch.

### Step 1: Add Power and Ground

1. Click **Clear** to start fresh
2. Drag **VDD** from the Power section to the canvas (top-left area)
3. Drag **GND** below it

These represent your power supply rails.

### Step 2: Add an Input Switch

1. Drag a **Switch** to the right of the power rails
2. This will be your input signal

### Step 3: Add a NOT Gate

1. Drag a **NOT** gate to the right of the switch
2. Position it so the input port aligns with the switch

### Step 4: Add an Output LED

1. Drag an **LED** to the right of the NOT gate
2. This shows the output state

### Step 5: Wire It Up

1. Click and drag from the Switch's output port (right side)
2. Release on the NOT gate's input port (left side)
3. Click and drag from the NOT gate's output port
4. Release on the LED's input port

### Step 6: Test It

1. Click **Simulate**
2. The LED should be ON (switch is OFF=0, NOT inverts to 1)
3. Click the switch to toggle it ON
4. The LED should turn OFF (switch is ON=1, NOT inverts to 0)

Watch the green electrons flow when signals are active!

## Building a 2-Input AND Gate Demo

Now let's build something more complex.

### Circuit Overview

```
Switch A ──┐
           ├──[AND]──── LED
Switch B ──┘
```

The LED only lights when BOTH switches are ON.

### Steps

1. Click **Clear**
2. Add two **Switches** (vertically stacked on the left)
3. Add an **AND** gate in the middle
4. Add an **LED** on the right
5. Wire Switch A → AND input 0 (top)
6. Wire Switch B → AND input 1 (bottom)
7. Wire AND output → LED
8. Click **Simulate**

### Truth Table Test

| Switch A | Switch B | LED |
|----------|----------|-----|
| OFF (0)  | OFF (0)  | OFF |
| OFF (0)  | ON (1)   | OFF |
| ON (1)   | OFF (0)  | OFF |
| ON (1)   | ON (1)   | ON  |

Try all four combinations by clicking the switches!

## Building a Half Adder

A half adder adds two 1-bit numbers and produces a sum and carry.

### Circuit Overview

```
         ┌──[XOR]──── Sum LED
Input A ─┤
         └──[AND]──── Carry LED
Input B ─┤
         ├──[XOR]
         └──[AND]
```

### Logic

- **Sum** = A XOR B (1 when inputs differ)
- **Carry** = A AND B (1 when both inputs are 1)

### Steps

1. Click **"Adder Example"** to load a pre-built half adder
2. Or build it manually:
   - Two switches for inputs A and B
   - XOR gate for Sum output
   - AND gate for Carry output
   - Two LEDs for outputs

### Truth Table

| A | B | Sum | Carry |
|---|---|-----|-------|
| 0 | 0 |  0  |   0   |
| 0 | 1 |  1  |   0   |
| 1 | 0 |  1  |   0   |
| 1 | 1 |  0  |   1   |

The last row shows: 1 + 1 = 10 in binary (Sum=0, Carry=1)

## Building a 2-to-4 Decoder

A decoder takes a binary input and activates exactly one output line.

### What It Does

- 2-bit input (A, B) selects one of 4 output lines (Y0-Y3)
- Input 00 → Y0 active
- Input 01 → Y1 active
- Input 10 → Y2 active
- Input 11 → Y3 active

### Logic Equations

```
Y0 = NOT(A) AND NOT(B)  -- Active when A=0, B=0
Y1 = NOT(A) AND B       -- Active when A=0, B=1
Y2 = A AND NOT(B)       -- Active when A=1, B=0
Y3 = A AND B            -- Active when A=1, B=1
```

### Building It

1. **Inputs**: Two switches (A and B)
2. **Inverters**: Two NOT gates for A' and B'
3. **AND gates**: Four 2-input AND gates
4. **Outputs**: Four LEDs (Y0, Y1, Y2, Y3)

### Wiring

```
A ────┬─────────────────┬─[AND]─ Y2
      │                 │
      └─[NOT]─┬─────────┼─[AND]─ Y0
              │         │
              └─────────┼─[AND]─ Y1
                        │
B ────┬─────────────────┼─[AND]─ Y3
      │                 │
      └─[NOT]───────────┘
```

Each AND gate receives the appropriate combination of A/A' and B/B'.

## Loading HDL-Exported Circuits

The simulator can export circuits to JSON format:

```bash
./micro4_sim test.m4hdl --export circuit.json
```

Then load in the visualizer:
1. Click **"Load JSON"**
2. Select your exported `.json` file
3. The circuit appears with VDD, GND, switches for inputs, and LEDs for outputs

## Tips and Tricks

### Deleting Components
- Right-click a component to delete it and its wires

### Moving Components
- Click and drag any component to reposition it

### Understanding Wire Colors
- **Green**: Signal is HIGH (1) - power is flowing
- **Dark Gray**: Signal is LOW (0) - no power
- **Medium Gray**: Signal is unknown (X) - not yet simulated

### Reading Gate Displays
Gates show their boolean operation inside:
- `!0=1` - NOT gate with input 0, output 1
- `1&1=1` - AND gate with both inputs 1, output 1
- `0|1=1` - OR gate with inputs 0 and 1, output 1

## Next Steps

1. Build a full adder (half adder + carry input)
2. Create an SR latch from two NOR gates
3. Design a 4-bit counter
4. Load your HDL circuits and visualize them

Happy circuit building!
