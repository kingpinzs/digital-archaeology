/*
 * Micro4 Hardware Simulator
 *
 * Simulates digital circuits at the gate level
 */

#ifndef CIRCUIT_H
#define CIRCUIT_H

#include <stdint.h>
#include <stdbool.h>

/* Maximum limits */
#define MAX_WIRES       1024
#define MAX_GATES       2048
#define MAX_MODULES     128
#define MAX_NAME_LEN    64
#define MAX_INPUTS      16
#define MAX_OUTPUTS     8

/* Wire states */
typedef enum {
    WIRE_0 = 0,     /* Logic low */
    WIRE_1 = 1,     /* Logic high */
    WIRE_X = 2,     /* Unknown/uninitialized */
    WIRE_Z = 3      /* High impedance (tri-state) */
} WireState;

/* Gate types */
typedef enum {
    GATE_NOT,
    GATE_AND,
    GATE_OR,
    GATE_NAND,
    GATE_NOR,
    GATE_XOR,
    GATE_XNOR,
    GATE_BUF,
    GATE_MUX2,      /* 2:1 multiplexer */
    GATE_DFF,       /* D flip-flop */
    GATE_DLATCH,    /* D latch */
    /* Transistor level */
    GATE_NMOS,
    GATE_PMOS,
    /* Special */
    GATE_CONST,     /* Constant 0 or 1 */
    GATE_MODULE     /* Instance of another module */
} GateType;

/* Wire definition */
typedef struct {
    char name[MAX_NAME_LEN];
    int width;              /* 1 for single wire, >1 for bus */
    WireState *state;       /* Array of states (size = width) */
    WireState *next_state;  /* Next state (for sequential logic) */
    bool is_input;          /* External input */
    bool is_output;         /* External output */
} Wire;

/* Gate definition */
typedef struct {
    char name[MAX_NAME_LEN];
    GateType type;
    int num_inputs;
    int inputs[MAX_INPUTS];     /* Wire indices */
    int input_bits[MAX_INPUTS]; /* Which bit of the wire (for buses) */
    int num_outputs;
    int outputs[MAX_OUTPUTS];   /* Wire indices */
    int output_bits[MAX_OUTPUTS];
    /* For DFF */
    WireState stored_value;
    /* For CONST */
    WireState const_value;
    /* For MODULE */
    int module_ref;             /* Index of referenced module */
} Gate;

/* Module definition (hierarchical) */
typedef struct {
    char name[MAX_NAME_LEN];
    /* Ports */
    int num_inputs;
    char input_names[MAX_INPUTS][MAX_NAME_LEN];
    int input_widths[MAX_INPUTS];
    int num_outputs;
    char output_names[MAX_OUTPUTS][MAX_NAME_LEN];
    int output_widths[MAX_OUTPUTS];
    /* Internal wires and gates */
    int wire_start;     /* First wire index */
    int wire_count;
    int gate_start;     /* First gate index */
    int gate_count;
} Module;

/* Circuit (top-level container) */
typedef struct {
    /* Wires */
    Wire wires[MAX_WIRES];
    int num_wires;
    /* Gates */
    Gate gates[MAX_GATES];
    int num_gates;
    /* Modules */
    Module modules[MAX_MODULES];
    int num_modules;
    /* Current module being parsed */
    int current_module;
    /* Simulation state */
    uint64_t cycle_count;
    bool stable;        /* No signal changes in last propagation */
    /* Error handling */
    bool error;
    char error_msg[256];
} Circuit;

/* === Circuit creation === */
void circuit_init(Circuit *c);
void circuit_reset(Circuit *c);

/* === Wire operations === */
int circuit_add_wire(Circuit *c, const char *name, int width);
int circuit_find_wire(Circuit *c, const char *name);
void circuit_set_wire(Circuit *c, int wire_idx, int bit, WireState state);
WireState circuit_get_wire(Circuit *c, int wire_idx, int bit);

/* === Gate operations === */
int circuit_add_gate(Circuit *c, GateType type, const char *name);
void circuit_gate_add_input(Circuit *c, int gate_idx, int wire_idx, int bit);
void circuit_gate_add_output(Circuit *c, int gate_idx, int wire_idx, int bit);

/* === High-level gate creation === */
int circuit_add_not(Circuit *c, const char *name, int in_wire, int out_wire);
int circuit_add_and(Circuit *c, const char *name, int in1, int in2, int out);
int circuit_add_or(Circuit *c, const char *name, int in1, int in2, int out);
int circuit_add_nand(Circuit *c, const char *name, int in1, int in2, int out);
int circuit_add_nor(Circuit *c, const char *name, int in1, int in2, int out);
int circuit_add_xor(Circuit *c, const char *name, int in1, int in2, int out);
int circuit_add_dff(Circuit *c, const char *name, int d, int clk, int q);

/* === Simulation === */
void circuit_propagate(Circuit *c);     /* Propagate combinational logic */
void circuit_clock(Circuit *c);         /* Clock all flip-flops */
void circuit_step(Circuit *c);          /* One full cycle (propagate + clock) */
void circuit_run(Circuit *c, int cycles);

/* === Loading/Parsing === */
bool circuit_load_file(Circuit *c, const char *filename);
bool circuit_parse(Circuit *c, const char *source);

/* === Debugging === */
void circuit_dump_wires(Circuit *c);
void circuit_dump_gates(Circuit *c);
void circuit_dump_state(Circuit *c);
const char* wire_state_str(WireState s);
const char* gate_type_str(GateType t);

/* === JSON Export for Visualizer === */
void circuit_export_json(Circuit *c, const char *filename);
void circuit_export_json_state(Circuit *c, const char *filename);

/* === Timing Analysis === */
typedef struct {
    int critical_path_depth;    /* Longest combinational path (gate delays) */
    int total_gates;            /* Total gate count */
    int total_transistors;      /* Estimated transistor count */
    int num_flip_flops;         /* Number of sequential elements */
} CircuitTiming;

void circuit_analyze_timing(Circuit *c, CircuitTiming *timing);
void circuit_print_clock_speeds(CircuitTiming *timing);

#endif /* CIRCUIT_H */
