/*
 * Micro4 Hardware Simulator - Implementation
 */

#define _GNU_SOURCE
#include "circuit.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <ctype.h>

/* String representations */
const char* wire_state_str(WireState s) {
    switch (s) {
        case WIRE_0: return "0";
        case WIRE_1: return "1";
        case WIRE_X: return "X";
        case WIRE_Z: return "Z";
        default: return "?";
    }
}

const char* gate_type_str(GateType t) {
    switch (t) {
        case GATE_NOT:    return "NOT";
        case GATE_AND:    return "AND";
        case GATE_OR:     return "OR";
        case GATE_NAND:   return "NAND";
        case GATE_NOR:    return "NOR";
        case GATE_XOR:    return "XOR";
        case GATE_XNOR:   return "XNOR";
        case GATE_BUF:    return "BUF";
        case GATE_MUX2:   return "MUX2";
        case GATE_DFF:    return "DFF";
        case GATE_DLATCH: return "DLATCH";
        case GATE_NMOS:   return "NMOS";
        case GATE_PMOS:   return "PMOS";
        case GATE_CONST:  return "CONST";
        case GATE_MODULE: return "MODULE";
        default: return "???";
    }
}

/* Initialize circuit */
void circuit_init(Circuit *c) {
    memset(c, 0, sizeof(Circuit));
    c->current_module = -1;

    /* Add constant wires: GND (0) and VDD (1) */
    int gnd = circuit_add_wire(c, "gnd", 1);
    int vdd = circuit_add_wire(c, "vdd", 1);
    circuit_set_wire(c, gnd, 0, WIRE_0);
    circuit_set_wire(c, vdd, 0, WIRE_1);
}

/* Reset circuit state */
void circuit_reset(Circuit *c) {
    /* Reset all wires to X (except constants) */
    for (int i = 2; i < c->num_wires; i++) {
        for (int b = 0; b < c->wires[i].width; b++) {
            c->wires[i].state[b] = WIRE_X;
            c->wires[i].next_state[b] = WIRE_X;
        }
    }
    /* Reset flip-flops */
    for (int i = 0; i < c->num_gates; i++) {
        if (c->gates[i].type == GATE_DFF) {
            c->gates[i].stored_value = WIRE_0;
        }
    }
    c->cycle_count = 0;
    c->stable = false;
}

/* Add a wire */
int circuit_add_wire(Circuit *c, const char *name, int width) {
    if (c->num_wires >= MAX_WIRES) {
        c->error = true;
        snprintf(c->error_msg, sizeof(c->error_msg), "Too many wires");
        return -1;
    }

    /* Check for existing wire */
    int existing = circuit_find_wire(c, name);
    if (existing >= 0) return existing;

    int idx = c->num_wires++;
    Wire *w = &c->wires[idx];
    strncpy(w->name, name, MAX_NAME_LEN - 1);
    w->width = width;
    w->state = calloc(width, sizeof(WireState));
    w->next_state = calloc(width, sizeof(WireState));
    for (int i = 0; i < width; i++) {
        w->state[i] = WIRE_X;
        w->next_state[i] = WIRE_X;
    }
    w->is_input = false;
    w->is_output = false;

    return idx;
}

/* Find a wire by name */
int circuit_find_wire(Circuit *c, const char *name) {
    for (int i = 0; i < c->num_wires; i++) {
        if (strcmp(c->wires[i].name, name) == 0) {
            return i;
        }
    }
    return -1;
}

/* Set wire state */
void circuit_set_wire(Circuit *c, int wire_idx, int bit, WireState state) {
    if (wire_idx < 0 || wire_idx >= c->num_wires) return;
    Wire *w = &c->wires[wire_idx];
    if (bit < 0 || bit >= w->width) return;
    w->state[bit] = state;
    w->next_state[bit] = state;  /* Also set next_state to prevent overwrite */
}

/* Get wire state */
WireState circuit_get_wire(Circuit *c, int wire_idx, int bit) {
    if (wire_idx < 0 || wire_idx >= c->num_wires) return WIRE_X;
    Wire *w = &c->wires[wire_idx];
    if (bit < 0 || bit >= w->width) return WIRE_X;
    return w->state[bit];
}

/* Add a gate */
int circuit_add_gate(Circuit *c, GateType type, const char *name) {
    if (c->num_gates >= MAX_GATES) {
        c->error = true;
        snprintf(c->error_msg, sizeof(c->error_msg), "Too many gates");
        return -1;
    }

    int idx = c->num_gates++;
    Gate *g = &c->gates[idx];
    memset(g, 0, sizeof(Gate));
    strncpy(g->name, name, MAX_NAME_LEN - 1);
    g->type = type;
    g->stored_value = WIRE_0;
    g->const_value = WIRE_0;
    g->module_ref = -1;

    return idx;
}

/* Add input to gate */
void circuit_gate_add_input(Circuit *c, int gate_idx, int wire_idx, int bit) {
    if (gate_idx < 0 || gate_idx >= c->num_gates) return;
    Gate *g = &c->gates[gate_idx];
    if (g->num_inputs >= MAX_INPUTS) return;
    g->inputs[g->num_inputs] = wire_idx;
    g->input_bits[g->num_inputs] = bit;
    g->num_inputs++;
}

/* Add output to gate */
void circuit_gate_add_output(Circuit *c, int gate_idx, int wire_idx, int bit) {
    if (gate_idx < 0 || gate_idx >= c->num_gates) return;
    Gate *g = &c->gates[gate_idx];
    if (g->num_outputs >= MAX_OUTPUTS) return;
    g->outputs[g->num_outputs] = wire_idx;
    g->output_bits[g->num_outputs] = bit;
    g->num_outputs++;
}

/* === High-level gate creation === */

int circuit_add_not(Circuit *c, const char *name, int in_wire, int out_wire) {
    int g = circuit_add_gate(c, GATE_NOT, name);
    circuit_gate_add_input(c, g, in_wire, 0);
    circuit_gate_add_output(c, g, out_wire, 0);
    return g;
}

int circuit_add_and(Circuit *c, const char *name, int in1, int in2, int out) {
    int g = circuit_add_gate(c, GATE_AND, name);
    circuit_gate_add_input(c, g, in1, 0);
    circuit_gate_add_input(c, g, in2, 0);
    circuit_gate_add_output(c, g, out, 0);
    return g;
}

int circuit_add_or(Circuit *c, const char *name, int in1, int in2, int out) {
    int g = circuit_add_gate(c, GATE_OR, name);
    circuit_gate_add_input(c, g, in1, 0);
    circuit_gate_add_input(c, g, in2, 0);
    circuit_gate_add_output(c, g, out, 0);
    return g;
}

int circuit_add_nand(Circuit *c, const char *name, int in1, int in2, int out) {
    int g = circuit_add_gate(c, GATE_NAND, name);
    circuit_gate_add_input(c, g, in1, 0);
    circuit_gate_add_input(c, g, in2, 0);
    circuit_gate_add_output(c, g, out, 0);
    return g;
}

int circuit_add_nor(Circuit *c, const char *name, int in1, int in2, int out) {
    int g = circuit_add_gate(c, GATE_NOR, name);
    circuit_gate_add_input(c, g, in1, 0);
    circuit_gate_add_input(c, g, in2, 0);
    circuit_gate_add_output(c, g, out, 0);
    return g;
}

int circuit_add_xor(Circuit *c, const char *name, int in1, int in2, int out) {
    int g = circuit_add_gate(c, GATE_XOR, name);
    circuit_gate_add_input(c, g, in1, 0);
    circuit_gate_add_input(c, g, in2, 0);
    circuit_gate_add_output(c, g, out, 0);
    return g;
}

int circuit_add_dff(Circuit *c, const char *name, int d, int clk, int q) {
    int g = circuit_add_gate(c, GATE_DFF, name);
    circuit_gate_add_input(c, g, d, 0);    /* Input 0: D */
    circuit_gate_add_input(c, g, clk, 0);  /* Input 1: CLK */
    circuit_gate_add_output(c, g, q, 0);   /* Output 0: Q */
    return g;
}

/* === Gate evaluation === */

static WireState eval_not(WireState a) {
    if (a == WIRE_0) return WIRE_1;
    if (a == WIRE_1) return WIRE_0;
    return WIRE_X;
}

static WireState eval_and(WireState a, WireState b) {
    if (a == WIRE_0 || b == WIRE_0) return WIRE_0;
    if (a == WIRE_1 && b == WIRE_1) return WIRE_1;
    return WIRE_X;
}

static WireState eval_or(WireState a, WireState b) {
    if (a == WIRE_1 || b == WIRE_1) return WIRE_1;
    if (a == WIRE_0 && b == WIRE_0) return WIRE_0;
    return WIRE_X;
}

static WireState eval_xor(WireState a, WireState b) {
    if (a == WIRE_X || b == WIRE_X) return WIRE_X;
    if (a == WIRE_Z || b == WIRE_Z) return WIRE_X;
    return (a != b) ? WIRE_1 : WIRE_0;
}

static WireState eval_nand(WireState a, WireState b) {
    return eval_not(eval_and(a, b));
}

static WireState eval_nor(WireState a, WireState b) {
    return eval_not(eval_or(a, b));
}

static WireState eval_xnor(WireState a, WireState b) {
    return eval_not(eval_xor(a, b));
}

/* Evaluate a single gate */
static void eval_gate(Circuit *c, Gate *g) {
    WireState result = WIRE_X;
    WireState in0, in1;

    /* Get inputs */
    if (g->num_inputs >= 1) {
        in0 = circuit_get_wire(c, g->inputs[0], g->input_bits[0]);
    } else {
        in0 = WIRE_X;
    }
    if (g->num_inputs >= 2) {
        in1 = circuit_get_wire(c, g->inputs[1], g->input_bits[1]);
    } else {
        in1 = WIRE_X;
    }

    /* Evaluate based on type */
    switch (g->type) {
        case GATE_NOT:
            result = eval_not(in0);
            break;
        case GATE_BUF:
            result = in0;
            break;
        case GATE_AND:
            result = in0;
            for (int i = 1; i < g->num_inputs; i++) {
                WireState next = circuit_get_wire(c, g->inputs[i], g->input_bits[i]);
                result = eval_and(result, next);
            }
            break;
        case GATE_OR:
            result = in0;
            for (int i = 1; i < g->num_inputs; i++) {
                WireState next = circuit_get_wire(c, g->inputs[i], g->input_bits[i]);
                result = eval_or(result, next);
            }
            break;
        case GATE_NAND:
            result = in0;
            for (int i = 1; i < g->num_inputs; i++) {
                WireState next = circuit_get_wire(c, g->inputs[i], g->input_bits[i]);
                result = eval_and(result, next);
            }
            result = eval_not(result);
            break;
        case GATE_NOR:
            result = in0;
            for (int i = 1; i < g->num_inputs; i++) {
                WireState next = circuit_get_wire(c, g->inputs[i], g->input_bits[i]);
                result = eval_or(result, next);
            }
            result = eval_not(result);
            break;
        case GATE_XOR:
            result = eval_xor(in0, in1);
            break;
        case GATE_XNOR:
            result = eval_xnor(in0, in1);
            break;
        case GATE_MUX2:
            /* Input 0: A, Input 1: B, Input 2: SEL */
            if (g->num_inputs >= 3) {
                WireState sel = circuit_get_wire(c, g->inputs[2], g->input_bits[2]);
                if (sel == WIRE_0) {
                    result = in0;
                } else if (sel == WIRE_1) {
                    result = in1;
                } else {
                    result = WIRE_X;
                }
            }
            break;
        case GATE_DFF:
            /* Output is stored value (not input) */
            result = g->stored_value;
            break;
        case GATE_CONST:
            result = g->const_value;
            break;
        default:
            result = WIRE_X;
            break;
    }

    /* Set output */
    if (g->num_outputs >= 1) {
        Wire *out_wire = &c->wires[g->outputs[0]];
        int bit = g->output_bits[0];
        if (out_wire->state[bit] != result) {
            c->stable = false;
        }
        out_wire->next_state[bit] = result;
    }
}

/* Propagate combinational logic until stable */
void circuit_propagate(Circuit *c) {
    int max_iterations = 100;  /* Prevent infinite loops */
    int iteration = 0;

    do {
        c->stable = true;

        /* Evaluate all gates */
        for (int i = 0; i < c->num_gates; i++) {
            eval_gate(c, &c->gates[i]);
        }

        /* Copy next_state to state */
        for (int i = 0; i < c->num_wires; i++) {
            Wire *w = &c->wires[i];
            for (int b = 0; b < w->width; b++) {
                if (w->state[b] != w->next_state[b]) {
                    c->stable = false;
                    w->state[b] = w->next_state[b];
                }
            }
        }

        iteration++;
    } while (!c->stable && iteration < max_iterations);

    if (iteration >= max_iterations) {
        c->error = true;
        snprintf(c->error_msg, sizeof(c->error_msg),
                 "Circuit did not stabilize after %d iterations", max_iterations);
    }
}

/* Clock all flip-flops (capture D input on rising edge) */
void circuit_clock(Circuit *c) {
    for (int i = 0; i < c->num_gates; i++) {
        Gate *g = &c->gates[i];
        if (g->type == GATE_DFF && g->num_inputs >= 1) {
            /* Capture D input */
            g->stored_value = circuit_get_wire(c, g->inputs[0], g->input_bits[0]);
        }
    }
    c->cycle_count++;
}

/* One full simulation step */
void circuit_step(Circuit *c) {
    circuit_propagate(c);
    circuit_clock(c);
    circuit_propagate(c);  /* Propagate new flip-flop outputs */
}

/* Run for multiple cycles */
void circuit_run(Circuit *c, int cycles) {
    for (int i = 0; i < cycles && !c->error; i++) {
        circuit_step(c);
    }
}

/* === Debugging === */

void circuit_dump_wires(Circuit *c) {
    printf("=== Wires (%d) ===\n", c->num_wires);
    for (int i = 0; i < c->num_wires; i++) {
        Wire *w = &c->wires[i];
        printf("  [%3d] %-20s [%d bits]: ", i, w->name, w->width);
        for (int b = w->width - 1; b >= 0; b--) {
            printf("%s", wire_state_str(w->state[b]));
        }
        if (w->is_input) printf(" (input)");
        if (w->is_output) printf(" (output)");
        printf("\n");
    }
}

void circuit_dump_gates(Circuit *c) {
    printf("=== Gates (%d) ===\n", c->num_gates);
    for (int i = 0; i < c->num_gates; i++) {
        Gate *g = &c->gates[i];
        printf("  [%3d] %-20s %-6s  ", i, g->name, gate_type_str(g->type));
        printf("in: ");
        for (int j = 0; j < g->num_inputs; j++) {
            printf("%s[%d] ", c->wires[g->inputs[j]].name, g->input_bits[j]);
        }
        printf(" -> out: ");
        for (int j = 0; j < g->num_outputs; j++) {
            printf("%s[%d] ", c->wires[g->outputs[j]].name, g->output_bits[j]);
        }
        if (g->type == GATE_DFF) {
            printf(" (stored=%s)", wire_state_str(g->stored_value));
        }
        printf("\n");
    }
}

void circuit_dump_state(Circuit *c) {
    printf("=== Circuit State ===\n");
    printf("Cycle: %lu\n", (unsigned long)c->cycle_count);
    printf("Stable: %s\n", c->stable ? "YES" : "NO");
    if (c->error) {
        printf("Error: %s\n", c->error_msg);
    }
    circuit_dump_wires(c);
}

/* === JSON Export for Visualizer === */

void circuit_export_json(Circuit *c, const char *filename) {
    FILE *f = fopen(filename, "w");
    if (!f) {
        fprintf(stderr, "Cannot open %s for writing\n", filename);
        return;
    }

    fprintf(f, "{\n");
    fprintf(f, "  \"cycle\": %lu,\n", (unsigned long)c->cycle_count);
    fprintf(f, "  \"stable\": %s,\n", c->stable ? "true" : "false");

    /* Export wires */
    fprintf(f, "  \"wires\": [\n");
    for (int i = 0; i < c->num_wires; i++) {
        Wire *w = &c->wires[i];
        fprintf(f, "    {\n");
        fprintf(f, "      \"id\": %d,\n", i);
        fprintf(f, "      \"name\": \"%s\",\n", w->name);
        fprintf(f, "      \"width\": %d,\n", w->width);
        fprintf(f, "      \"is_input\": %s,\n", w->is_input ? "true" : "false");
        fprintf(f, "      \"is_output\": %s,\n", w->is_output ? "true" : "false");
        fprintf(f, "      \"state\": [");
        for (int b = 0; b < w->width; b++) {
            fprintf(f, "%d", w->state[b]);
            if (b < w->width - 1) fprintf(f, ", ");
        }
        fprintf(f, "]\n");
        fprintf(f, "    }%s\n", i < c->num_wires - 1 ? "," : "");
    }
    fprintf(f, "  ],\n");

    /* Export gates */
    fprintf(f, "  \"gates\": [\n");
    for (int i = 0; i < c->num_gates; i++) {
        Gate *g = &c->gates[i];
        fprintf(f, "    {\n");
        fprintf(f, "      \"id\": %d,\n", i);
        fprintf(f, "      \"name\": \"%s\",\n", g->name);
        fprintf(f, "      \"type\": \"%s\",\n", gate_type_str(g->type));
        fprintf(f, "      \"inputs\": [");
        for (int j = 0; j < g->num_inputs; j++) {
            fprintf(f, "{\"wire\": %d, \"bit\": %d}", g->inputs[j], g->input_bits[j]);
            if (j < g->num_inputs - 1) fprintf(f, ", ");
        }
        fprintf(f, "],\n");
        fprintf(f, "      \"outputs\": [");
        for (int j = 0; j < g->num_outputs; j++) {
            fprintf(f, "{\"wire\": %d, \"bit\": %d}", g->outputs[j], g->output_bits[j]);
            if (j < g->num_outputs - 1) fprintf(f, ", ");
        }
        fprintf(f, "]");
        if (g->type == GATE_DFF) {
            fprintf(f, ",\n      \"stored\": %d", g->stored_value);
        }
        fprintf(f, "\n    }%s\n", i < c->num_gates - 1 ? "," : "");
    }
    fprintf(f, "  ]\n");
    fprintf(f, "}\n");

    fclose(f);
}

/* Export just the current state (for animation updates) */
void circuit_export_json_state(Circuit *c, const char *filename) {
    FILE *f = fopen(filename, "w");
    if (!f) return;

    fprintf(f, "{\n");
    fprintf(f, "  \"cycle\": %lu,\n", (unsigned long)c->cycle_count);
    fprintf(f, "  \"stable\": %s,\n", c->stable ? "true" : "false");
    fprintf(f, "  \"wire_states\": [");
    for (int i = 0; i < c->num_wires; i++) {
        Wire *w = &c->wires[i];
        fprintf(f, "[");
        for (int b = 0; b < w->width; b++) {
            fprintf(f, "%d", w->state[b]);
            if (b < w->width - 1) fprintf(f, ",");
        }
        fprintf(f, "]");
        if (i < c->num_wires - 1) fprintf(f, ",");
    }
    fprintf(f, "],\n");
    fprintf(f, "  \"dff_states\": [");
    int first_dff = 1;
    for (int i = 0; i < c->num_gates; i++) {
        if (c->gates[i].type == GATE_DFF) {
            if (!first_dff) fprintf(f, ",");
            fprintf(f, "{\"id\":%d,\"stored\":%d}", i, c->gates[i].stored_value);
            first_dff = 0;
        }
    }
    fprintf(f, "]\n}\n");
    fclose(f);
}

/* === Timing Analysis === */

/* Get transistor count for a gate type */
static int gate_transistor_count(GateType type) {
    switch (type) {
        case GATE_NOT:    return 2;   /* 1 NMOS + 1 PMOS */
        case GATE_BUF:    return 4;   /* 2 inverters */
        case GATE_AND:    return 6;   /* NAND + NOT */
        case GATE_OR:     return 6;   /* NOR + NOT */
        case GATE_NAND:   return 4;   /* 2 NMOS + 2 PMOS */
        case GATE_NOR:    return 4;   /* 2 NMOS + 2 PMOS */
        case GATE_XOR:    return 12;  /* Complex gate */
        case GATE_XNOR:   return 12;  /* Complex gate */
        case GATE_MUX2:   return 12;  /* Transmission gates + inverter */
        case GATE_DFF:    return 40;  /* Master-slave latch */
        case GATE_DLATCH: return 20;  /* D latch */
        case GATE_NMOS:   return 1;
        case GATE_PMOS:   return 1;
        case GATE_CONST:  return 0;
        case GATE_MODULE: return 0;   /* Counted separately */
        default:          return 4;
    }
}

/* Analyze circuit timing */
void circuit_analyze_timing(Circuit *c, CircuitTiming *timing) {
    timing->total_gates = 0;
    timing->total_transistors = 0;
    timing->num_flip_flops = 0;
    timing->critical_path_depth = 0;

    /* Count gates and transistors */
    for (int i = 0; i < c->num_gates; i++) {
        Gate *g = &c->gates[i];
        timing->total_gates++;
        timing->total_transistors += gate_transistor_count(g->type);
        if (g->type == GATE_DFF || g->type == GATE_DLATCH) {
            timing->num_flip_flops++;
        }
    }

    /* Calculate critical path using level propagation */
    /* Each wire gets a level = max(input_levels) + 1 */
    int *wire_levels = calloc(c->num_wires, sizeof(int));
    int max_iterations = c->num_gates + 1;

    for (int iter = 0; iter < max_iterations; iter++) {
        int changed = 0;
        for (int i = 0; i < c->num_gates; i++) {
            Gate *g = &c->gates[i];
            /* Skip flip-flops for combinational path */
            if (g->type == GATE_DFF || g->type == GATE_DLATCH) continue;

            /* Find max input level */
            int max_level = 0;
            for (int j = 0; j < g->num_inputs; j++) {
                int wire_idx = g->inputs[j];
                if (wire_idx >= 0 && wire_idx < c->num_wires) {
                    if (wire_levels[wire_idx] > max_level) {
                        max_level = wire_levels[wire_idx];
                    }
                }
            }

            /* Set output level = max_input + 1 */
            for (int j = 0; j < g->num_outputs; j++) {
                int wire_idx = g->outputs[j];
                if (wire_idx >= 0 && wire_idx < c->num_wires) {
                    int new_level = max_level + 1;
                    if (new_level > wire_levels[wire_idx]) {
                        wire_levels[wire_idx] = new_level;
                        changed = 1;
                    }
                }
            }
        }
        if (!changed) break;
    }

    /* Find maximum level */
    for (int i = 0; i < c->num_wires; i++) {
        if (wire_levels[i] > timing->critical_path_depth) {
            timing->critical_path_depth = wire_levels[i];
        }
    }

    free(wire_levels);
}

/* Print clock speed estimates */
void circuit_print_clock_speeds(CircuitTiming *timing) {
    printf("\n=== Circuit Timing Analysis ===\n");
    printf("Total gates:        %d\n", timing->total_gates);
    printf("Total transistors:  ~%d\n", timing->total_transistors);
    printf("Flip-flops:         %d\n", timing->num_flip_flops);
    printf("Critical path:      %d gate delays\n", timing->critical_path_depth);

    if (timing->critical_path_depth == 0) {
        printf("\n(No combinational logic path found)\n");
        return;
    }

    printf("\n=== Estimated Clock Speeds ===\n");
    printf("%-20s | %-12s | %-12s | %-12s\n",
           "Technology", "Gate Delay", "Max Clock", "MIPS (est)");
    printf("---------------------|--------------|--------------|-------------\n");

    /* Technology specs: name, gate_delay_ns, description */
    struct {
        const char *name;
        double gate_delay_ns;
    } technologies[] = {
        {"Relay (1940s)",       10000000.0},  /* 10 ms */
        {"Vacuum Tube (1950s)", 100000.0},    /* 100 us */
        {"RTL (1960s)",         50.0},        /* 50 ns */
        {"DTL (1965)",          30.0},        /* 30 ns */
        {"TTL (1970s)",         10.0},        /* 10 ns */
        {"NMOS (1980s)",        5.0},         /* 5 ns */
        {"CMOS 1um (1985)",     2.0},         /* 2 ns */
        {"CMOS 350nm (1995)",   0.5},         /* 0.5 ns */
        {"CMOS 65nm (2005)",    0.1},         /* 100 ps */
        {"CMOS 7nm (2020)",     0.01},        /* 10 ps */
    };
    int num_tech = sizeof(technologies) / sizeof(technologies[0]);

    for (int i = 0; i < num_tech; i++) {
        double total_delay_ns = timing->critical_path_depth * technologies[i].gate_delay_ns;
        double max_freq_hz = 1.0e9 / total_delay_ns;
        double mips = max_freq_hz / 5.0e6;  /* Assume 5 cycles per instruction */

        /* Format frequency */
        char freq_str[32];
        if (max_freq_hz >= 1e9) {
            snprintf(freq_str, sizeof(freq_str), "%.2f GHz", max_freq_hz / 1e9);
        } else if (max_freq_hz >= 1e6) {
            snprintf(freq_str, sizeof(freq_str), "%.2f MHz", max_freq_hz / 1e6);
        } else if (max_freq_hz >= 1e3) {
            snprintf(freq_str, sizeof(freq_str), "%.2f kHz", max_freq_hz / 1e3);
        } else {
            snprintf(freq_str, sizeof(freq_str), "%.2f Hz", max_freq_hz);
        }

        /* Format gate delay */
        char delay_str[32];
        if (technologies[i].gate_delay_ns >= 1e6) {
            snprintf(delay_str, sizeof(delay_str), "%.0f ms", technologies[i].gate_delay_ns / 1e6);
        } else if (technologies[i].gate_delay_ns >= 1e3) {
            snprintf(delay_str, sizeof(delay_str), "%.0f us", technologies[i].gate_delay_ns / 1e3);
        } else if (technologies[i].gate_delay_ns >= 1.0) {
            snprintf(delay_str, sizeof(delay_str), "%.0f ns", technologies[i].gate_delay_ns);
        } else {
            snprintf(delay_str, sizeof(delay_str), "%.0f ps", technologies[i].gate_delay_ns * 1000);
        }

        /* Format MIPS */
        char mips_str[32];
        if (mips >= 1000) {
            snprintf(mips_str, sizeof(mips_str), "%.0f", mips);
        } else if (mips >= 1) {
            snprintf(mips_str, sizeof(mips_str), "%.1f", mips);
        } else if (mips >= 0.001) {
            snprintf(mips_str, sizeof(mips_str), "%.4f", mips);
        } else {
            snprintf(mips_str, sizeof(mips_str), "%.2e", mips);
        }

        printf("%-20s | %-12s | %-12s | %-12s\n",
               technologies[i].name, delay_str, freq_str, mips_str);
    }
    printf("\n");
}
