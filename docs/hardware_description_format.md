# Micro4 Hardware Description Language (M4HDL)

A simple, educational hardware description format for defining digital circuits at the gate and transistor level.

## Design Philosophy

1. **Readable** - Human-friendly syntax
2. **Hierarchical** - Build complex from simple
3. **Simulatable** - C simulator can execute it
4. **Synthesizable** - Can convert to real Verilog/VHDL later

## Abstraction Levels

You can work at different levels:

```
Level 0: Transistors (NMOS, PMOS)
Level 1: Basic Gates (AND, OR, NOT, NAND, NOR, XOR)
Level 2: Functional Blocks (MUX, DECODER, ADDER, FLIP-FLOP)
Level 3: Components (REGISTER, ALU, COUNTER)
Level 4: System (CPU)
```

---

## File Format

### Comments
```
# This is a comment
// This also works
```

### Wires and Buses
```
wire clk;                    # Single wire
wire [3:0] data;             # 4-bit bus (data[0] to data[3])
wire [7:0] address;          # 8-bit bus
```

### Basic Gates (Level 1)
```
# NOT gate
not N1 (input: a, output: y);           # y = NOT a

# AND gate
and A1 (input: a b, output: y);         # y = a AND b

# OR gate
or O1 (input: a b, output: y);          # y = a OR b

# NAND gate
nand NA1 (input: a b, output: y);       # y = NOT (a AND b)

# NOR gate
nor NO1 (input: a b, output: y);        # y = NOT (a OR b)

# XOR gate
xor X1 (input: a b, output: y);         # y = a XOR b

# XNOR gate
xnor XN1 (input: a b, output: y);       # y = NOT (a XOR b)

# Buffer (for delays/fan-out)
buf B1 (input: a, output: y);           # y = a
```

### Multi-input Gates
```
and3 A1 (input: a b c, output: y);      # 3-input AND
or4 O1 (input: a b c d, output: y);     # 4-input OR
nand8 NA1 (input: d[7:0], output: y);   # 8-input NAND
```

### Transistor Level (Level 0)
```
# NMOS transistor: conducts when gate is HIGH
nmos T1 (gate: g, drain: d, source: s);

# PMOS transistor: conducts when gate is LOW
pmos T2 (gate: g, drain: d, source: s);

# Power and Ground
wire vdd = 1;    # Power supply
wire gnd = 0;    # Ground
```

### Building a NOT gate from transistors:
```
module not_transistor (input: a, output: y);
    wire vdd = 1;
    wire gnd = 0;

    pmos P1 (gate: a, drain: y, source: vdd);  # Pull up when a=0
    nmos N1 (gate: a, drain: y, source: gnd);  # Pull down when a=1
endmodule
```

### Building a NAND gate from transistors:
```
module nand_transistor (input: a b, output: y);
    wire vdd = 1;
    wire gnd = 0;
    wire mid;

    # Pull-up network (parallel PMOS)
    pmos P1 (gate: a, drain: y, source: vdd);
    pmos P2 (gate: b, drain: y, source: vdd);

    # Pull-down network (series NMOS)
    nmos N1 (gate: a, drain: y, source: mid);
    nmos N2 (gate: b, drain: mid, source: gnd);
endmodule
```

---

## Module Definition

```
module <name> (input: <inputs>, output: <outputs>);
    # Internal wires
    wire <internal_wires>;

    # Gates and submodules
    <gate/module instances>
endmodule
```

### Example: Half Adder
```
module half_adder (input: a b, output: sum carry);
    xor X1 (input: a b, output: sum);      # sum = a XOR b
    and A1 (input: a b, output: carry);    # carry = a AND b
endmodule
```

### Example: Full Adder
```
module full_adder (input: a b cin, output: sum cout);
    wire s1, c1, c2;

    half_adder HA1 (input: a b, output: s1 c1);
    half_adder HA2 (input: s1 cin, output: sum c2);
    or O1 (input: c1 c2, output: cout);
endmodule
```

### Example: 4-bit Adder
```
module adder4 (input: a[3:0] b[3:0] cin, output: sum[3:0] cout);
    wire c0, c1, c2;

    full_adder FA0 (input: a[0] b[0] cin, output: sum[0] c0);
    full_adder FA1 (input: a[1] b[1] c0,  output: sum[1] c1);
    full_adder FA2 (input: a[2] b[2] c1,  output: sum[2] c2);
    full_adder FA3 (input: a[3] b[3] c2,  output: sum[3] cout);
endmodule
```

---

## Sequential Logic (Flip-Flops)

### D Flip-Flop (edge-triggered)
```
module dff (input: d clk, output: q qn);
    # Built from gates (master-slave configuration)
    wire clkn, d_master, dn_master;
    wire m_q, m_qn;

    not N1 (input: clk, output: clkn);

    # Master latch (transparent when clk=0)
    nand NA1 (input: d clkn, output: d_master);
    nand NA2 (input: d_master clkn, output: dn_master);  # inverted input
    nand NA3 (input: d_master m_qn, output: m_q);
    nand NA4 (input: dn_master m_q, output: m_qn);

    # Slave latch (transparent when clk=1)
    # ... (similar structure)
endmodule
```

### Simplified D Flip-Flop (behavioral)
```
module dff_simple (input: d clk rst, output: q);
    @posedge(clk) {
        if (rst) {
            q = 0;
        } else {
            q = d;
        }
    }
endmodule
```

---

## Multiplexers

### 2-to-1 MUX
```
module mux2 (input: a b sel, output: y);
    wire seln, t1, t2;

    not N1 (input: sel, output: seln);
    and A1 (input: a seln, output: t1);
    and A2 (input: b sel, output: t2);
    or O1 (input: t1 t2, output: y);
endmodule
```

### 4-to-1 MUX
```
module mux4 (input: d[3:0] sel[1:0], output: y);
    wire t1, t2;

    mux2 M1 (input: d[0] d[1] sel[0], output: t1);
    mux2 M2 (input: d[2] d[3] sel[0], output: t2);
    mux2 M3 (input: t1 t2 sel[1], output: y);
endmodule
```

---

## Registers

### 4-bit Register
```
module reg4 (input: d[3:0] clk rst load, output: q[3:0]);
    wire d_in[3:0];

    # MUX: load new data or keep old
    mux2 M0 (input: q[0] d[0] load, output: d_in[0]);
    mux2 M1 (input: q[1] d[1] load, output: d_in[1]);
    mux2 M2 (input: q[2] d[2] load, output: d_in[2]);
    mux2 M3 (input: q[3] d[3] load, output: d_in[3]);

    # Flip-flops
    dff D0 (input: d_in[0] clk rst, output: q[0]);
    dff D1 (input: d_in[1] clk rst, output: q[1]);
    dff D2 (input: d_in[2] clk rst, output: q[2]);
    dff D3 (input: d_in[3] clk rst, output: q[3]);
endmodule
```

---

## Special Syntax

### Bus operations
```
wire [7:0] addr;
wire [3:0] high = addr[7:4];    # Upper nibble
wire [3:0] low = addr[3:0];     # Lower nibble
wire [7:0] combined = {high, low};  # Concatenation
```

### Constants
```
wire vdd = 1;
wire gnd = 0;
wire [3:0] five = 4'b0101;      # Binary
wire [3:0] ten = 4'd10;         # Decimal
wire [3:0] hex = 4'hA;          # Hexadecimal
```

### Tri-state
```
module tristate (input: data enable, output: bus);
    if (enable) {
        bus = data;
    } else {
        bus = Z;  # High impedance
    }
endmodule
```

---

## File Organization

```
hdl/
├── primitives/
│   ├── gates.m4hdl         # Basic gates from transistors
│   └── transistors.m4hdl   # NMOS, PMOS definitions
├── components/
│   ├── adders.m4hdl        # Half adder, full adder, ripple carry
│   ├── mux.m4hdl           # Multiplexers
│   ├── flipflops.m4hdl     # D flip-flop, SR latch
│   └── registers.m4hdl     # N-bit registers
├── blocks/
│   ├── alu.m4hdl           # Arithmetic Logic Unit
│   ├── regfile.m4hdl       # Register file
│   └── control.m4hdl       # Control unit state machine
└── cpu/
    └── micro4.m4hdl        # Top-level CPU
```

---

## Simulation

The C simulator will:
1. Parse the .m4hdl files
2. Build a directed graph of gates
3. Propagate signals through the graph
4. Handle clocked elements (flip-flops)
5. Provide debugging output

```c
// Usage
simulator_t *sim = sim_load("hdl/cpu/micro4.m4hdl");
sim_set_input(sim, "clk", 0);
sim_set_input(sim, "reset", 1);
sim_step(sim);  // Propagate combinational logic
sim_clock(sim); // Trigger flip-flops
```
