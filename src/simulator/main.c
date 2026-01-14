/*
 * M4HDL Simulator CLI
 *
 * Usage:
 *   m4sim <file.m4hdl>           - Load and simulate
 *   m4sim test                   - Run built-in tests
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "circuit.h"

/* Build a half adder programmatically */
void build_half_adder(Circuit *c) {
    /* Inputs */
    int a = circuit_add_wire(c, "a", 1);
    int b = circuit_add_wire(c, "b", 1);
    c->wires[a].is_input = true;
    c->wires[b].is_input = true;

    /* Outputs */
    int sum = circuit_add_wire(c, "sum", 1);
    int carry = circuit_add_wire(c, "carry", 1);
    c->wires[sum].is_output = true;
    c->wires[carry].is_output = true;

    /* Gates */
    circuit_add_xor(c, "X1", a, b, sum);
    circuit_add_and(c, "A1", a, b, carry);
}

/* Build a full adder */
void build_full_adder(Circuit *c) {
    /* Inputs */
    int a = circuit_add_wire(c, "a", 1);
    int b = circuit_add_wire(c, "b", 1);
    int cin = circuit_add_wire(c, "cin", 1);
    c->wires[a].is_input = true;
    c->wires[b].is_input = true;
    c->wires[cin].is_input = true;

    /* Outputs */
    int sum = circuit_add_wire(c, "sum", 1);
    int cout = circuit_add_wire(c, "cout", 1);
    c->wires[sum].is_output = true;
    c->wires[cout].is_output = true;

    /* Internal wires */
    int s1 = circuit_add_wire(c, "s1", 1);
    int c1 = circuit_add_wire(c, "c1", 1);
    int c2 = circuit_add_wire(c, "c2", 1);

    /* Half adder 1: a + b */
    circuit_add_xor(c, "X1", a, b, s1);
    circuit_add_and(c, "A1", a, b, c1);

    /* Half adder 2: s1 + cin */
    circuit_add_xor(c, "X2", s1, cin, sum);
    circuit_add_and(c, "A2", s1, cin, c2);

    /* OR for carry out */
    circuit_add_or(c, "O1", c1, c2, cout);
}

/* Build a 4-bit adder */
void build_adder4(Circuit *c) {
    /* Inputs: a[3:0], b[3:0], cin */
    int a = circuit_add_wire(c, "a", 4);
    int b = circuit_add_wire(c, "b", 4);
    int cin = circuit_add_wire(c, "cin", 1);
    c->wires[a].is_input = true;
    c->wires[b].is_input = true;
    c->wires[cin].is_input = true;

    /* Outputs: sum[3:0], cout */
    int sum = circuit_add_wire(c, "sum", 4);
    int cout = circuit_add_wire(c, "cout", 1);
    c->wires[sum].is_output = true;
    c->wires[cout].is_output = true;

    /* Internal carry wires */
    int c0 = circuit_add_wire(c, "c0", 1);
    int c1 = circuit_add_wire(c, "c1", 1);
    int c2 = circuit_add_wire(c, "c2", 1);

    /* Internal wires for each full adder */
    int s0_t = circuit_add_wire(c, "s0_t", 1);
    int c0_t1 = circuit_add_wire(c, "c0_t1", 1);
    int c0_t2 = circuit_add_wire(c, "c0_t2", 1);

    int s1_t = circuit_add_wire(c, "s1_t", 1);
    int c1_t1 = circuit_add_wire(c, "c1_t1", 1);
    int c1_t2 = circuit_add_wire(c, "c1_t2", 1);

    int s2_t = circuit_add_wire(c, "s2_t", 1);
    int c2_t1 = circuit_add_wire(c, "c2_t1", 1);
    int c2_t2 = circuit_add_wire(c, "c2_t2", 1);

    int s3_t = circuit_add_wire(c, "s3_t", 1);
    int c3_t1 = circuit_add_wire(c, "c3_t1", 1);
    int c3_t2 = circuit_add_wire(c, "c3_t2", 1);

    /* Full Adder 0 */
    int g = circuit_add_gate(c, GATE_XOR, "FA0_X1");
    circuit_gate_add_input(c, g, a, 0);
    circuit_gate_add_input(c, g, b, 0);
    circuit_gate_add_output(c, g, s0_t, 0);

    g = circuit_add_gate(c, GATE_AND, "FA0_A1");
    circuit_gate_add_input(c, g, a, 0);
    circuit_gate_add_input(c, g, b, 0);
    circuit_gate_add_output(c, g, c0_t1, 0);

    g = circuit_add_gate(c, GATE_XOR, "FA0_X2");
    circuit_gate_add_input(c, g, s0_t, 0);
    circuit_gate_add_input(c, g, cin, 0);
    circuit_gate_add_output(c, g, sum, 0);

    g = circuit_add_gate(c, GATE_AND, "FA0_A2");
    circuit_gate_add_input(c, g, s0_t, 0);
    circuit_gate_add_input(c, g, cin, 0);
    circuit_gate_add_output(c, g, c0_t2, 0);

    g = circuit_add_gate(c, GATE_OR, "FA0_O1");
    circuit_gate_add_input(c, g, c0_t1, 0);
    circuit_gate_add_input(c, g, c0_t2, 0);
    circuit_gate_add_output(c, g, c0, 0);

    /* Full Adder 1 */
    g = circuit_add_gate(c, GATE_XOR, "FA1_X1");
    circuit_gate_add_input(c, g, a, 1);
    circuit_gate_add_input(c, g, b, 1);
    circuit_gate_add_output(c, g, s1_t, 0);

    g = circuit_add_gate(c, GATE_AND, "FA1_A1");
    circuit_gate_add_input(c, g, a, 1);
    circuit_gate_add_input(c, g, b, 1);
    circuit_gate_add_output(c, g, c1_t1, 0);

    g = circuit_add_gate(c, GATE_XOR, "FA1_X2");
    circuit_gate_add_input(c, g, s1_t, 0);
    circuit_gate_add_input(c, g, c0, 0);
    circuit_gate_add_output(c, g, sum, 1);

    g = circuit_add_gate(c, GATE_AND, "FA1_A2");
    circuit_gate_add_input(c, g, s1_t, 0);
    circuit_gate_add_input(c, g, c0, 0);
    circuit_gate_add_output(c, g, c1_t2, 0);

    g = circuit_add_gate(c, GATE_OR, "FA1_O1");
    circuit_gate_add_input(c, g, c1_t1, 0);
    circuit_gate_add_input(c, g, c1_t2, 0);
    circuit_gate_add_output(c, g, c1, 0);

    /* Full Adder 2 */
    g = circuit_add_gate(c, GATE_XOR, "FA2_X1");
    circuit_gate_add_input(c, g, a, 2);
    circuit_gate_add_input(c, g, b, 2);
    circuit_gate_add_output(c, g, s2_t, 0);

    g = circuit_add_gate(c, GATE_AND, "FA2_A1");
    circuit_gate_add_input(c, g, a, 2);
    circuit_gate_add_input(c, g, b, 2);
    circuit_gate_add_output(c, g, c2_t1, 0);

    g = circuit_add_gate(c, GATE_XOR, "FA2_X2");
    circuit_gate_add_input(c, g, s2_t, 0);
    circuit_gate_add_input(c, g, c1, 0);
    circuit_gate_add_output(c, g, sum, 2);

    g = circuit_add_gate(c, GATE_AND, "FA2_A2");
    circuit_gate_add_input(c, g, s2_t, 0);
    circuit_gate_add_input(c, g, c1, 0);
    circuit_gate_add_output(c, g, c2_t2, 0);

    g = circuit_add_gate(c, GATE_OR, "FA2_O1");
    circuit_gate_add_input(c, g, c2_t1, 0);
    circuit_gate_add_input(c, g, c2_t2, 0);
    circuit_gate_add_output(c, g, c2, 0);

    /* Full Adder 3 */
    g = circuit_add_gate(c, GATE_XOR, "FA3_X1");
    circuit_gate_add_input(c, g, a, 3);
    circuit_gate_add_input(c, g, b, 3);
    circuit_gate_add_output(c, g, s3_t, 0);

    g = circuit_add_gate(c, GATE_AND, "FA3_A1");
    circuit_gate_add_input(c, g, a, 3);
    circuit_gate_add_input(c, g, b, 3);
    circuit_gate_add_output(c, g, c3_t1, 0);

    g = circuit_add_gate(c, GATE_XOR, "FA3_X2");
    circuit_gate_add_input(c, g, s3_t, 0);
    circuit_gate_add_input(c, g, c2, 0);
    circuit_gate_add_output(c, g, sum, 3);

    g = circuit_add_gate(c, GATE_AND, "FA3_A2");
    circuit_gate_add_input(c, g, s3_t, 0);
    circuit_gate_add_input(c, g, c2, 0);
    circuit_gate_add_output(c, g, c3_t2, 0);

    g = circuit_add_gate(c, GATE_OR, "FA3_O1");
    circuit_gate_add_input(c, g, c3_t1, 0);
    circuit_gate_add_input(c, g, c3_t2, 0);
    circuit_gate_add_output(c, g, cout, 0);
}

/* Test the half adder */
void test_half_adder(void) {
    printf("=== Testing Half Adder ===\n\n");

    Circuit c;
    circuit_init(&c);
    build_half_adder(&c);

    int a = circuit_find_wire(&c, "a");
    int b = circuit_find_wire(&c, "b");
    int sum = circuit_find_wire(&c, "sum");
    int carry = circuit_find_wire(&c, "carry");

    printf("Truth Table:\n");
    printf("  A B | Sum Carry\n");
    printf("  ----+-----------\n");

    for (int va = 0; va <= 1; va++) {
        for (int vb = 0; vb <= 1; vb++) {
            circuit_set_wire(&c, a, 0, va ? WIRE_1 : WIRE_0);
            circuit_set_wire(&c, b, 0, vb ? WIRE_1 : WIRE_0);
            circuit_propagate(&c);

            WireState s = circuit_get_wire(&c, sum, 0);
            WireState cy = circuit_get_wire(&c, carry, 0);

            printf("  %d %d |  %s    %s\n", va, vb,
                   wire_state_str(s), wire_state_str(cy));
        }
    }
    printf("\n");
}

/* Test the full adder */
void test_full_adder(void) {
    printf("=== Testing Full Adder ===\n\n");

    Circuit c;
    circuit_init(&c);
    build_full_adder(&c);

    int a = circuit_find_wire(&c, "a");
    int b = circuit_find_wire(&c, "b");
    int cin = circuit_find_wire(&c, "cin");
    int sum = circuit_find_wire(&c, "sum");
    int cout = circuit_find_wire(&c, "cout");

    printf("Truth Table:\n");
    printf("  A B Cin | Sum Cout\n");
    printf("  --------+---------\n");

    for (int va = 0; va <= 1; va++) {
        for (int vb = 0; vb <= 1; vb++) {
            for (int vc = 0; vc <= 1; vc++) {
                circuit_set_wire(&c, a, 0, va ? WIRE_1 : WIRE_0);
                circuit_set_wire(&c, b, 0, vb ? WIRE_1 : WIRE_0);
                circuit_set_wire(&c, cin, 0, vc ? WIRE_1 : WIRE_0);
                circuit_propagate(&c);

                WireState s = circuit_get_wire(&c, sum, 0);
                WireState co = circuit_get_wire(&c, cout, 0);

                printf("  %d %d  %d  |  %s    %s\n", va, vb, vc,
                       wire_state_str(s), wire_state_str(co));
            }
        }
    }
    printf("\n");
}

/* Test the 4-bit adder */
void test_adder4(void) {
    printf("=== Testing 4-bit Adder ===\n\n");

    Circuit c;
    circuit_init(&c);
    build_adder4(&c);

    int a = circuit_find_wire(&c, "a");
    int b = circuit_find_wire(&c, "b");
    int cin = circuit_find_wire(&c, "cin");
    int sum = circuit_find_wire(&c, "sum");
    int cout = circuit_find_wire(&c, "cout");

    printf("Testing: 5 + 3 = ?\n");

    /* Set a = 5 (0101) */
    circuit_set_wire(&c, a, 0, WIRE_1);
    circuit_set_wire(&c, a, 1, WIRE_0);
    circuit_set_wire(&c, a, 2, WIRE_1);
    circuit_set_wire(&c, a, 3, WIRE_0);

    /* Set b = 3 (0011) */
    circuit_set_wire(&c, b, 0, WIRE_1);
    circuit_set_wire(&c, b, 1, WIRE_1);
    circuit_set_wire(&c, b, 2, WIRE_0);
    circuit_set_wire(&c, b, 3, WIRE_0);

    /* Set cin = 0 */
    circuit_set_wire(&c, cin, 0, WIRE_0);

    circuit_propagate(&c);

    /* Read result */
    int result = 0;
    for (int i = 0; i < 4; i++) {
        if (circuit_get_wire(&c, sum, i) == WIRE_1) {
            result |= (1 << i);
        }
    }
    int carry_out = circuit_get_wire(&c, cout, 0) == WIRE_1 ? 1 : 0;

    printf("  A = 5 (0101)\n");
    printf("  B = 3 (0011)\n");
    printf("  Cin = 0\n");
    printf("  ---------\n");
    printf("  Sum = %d (", result);
    for (int i = 3; i >= 0; i--) {
        printf("%s", wire_state_str(circuit_get_wire(&c, sum, i)));
    }
    printf(")\n");
    printf("  Cout = %d\n", carry_out);
    printf("\n");

    /* Test overflow: 15 + 1 */
    printf("Testing: 15 + 1 = ?\n");

    /* Set a = 15 (1111) */
    for (int i = 0; i < 4; i++) {
        circuit_set_wire(&c, a, i, WIRE_1);
    }

    /* Set b = 1 (0001) */
    circuit_set_wire(&c, b, 0, WIRE_1);
    circuit_set_wire(&c, b, 1, WIRE_0);
    circuit_set_wire(&c, b, 2, WIRE_0);
    circuit_set_wire(&c, b, 3, WIRE_0);

    circuit_propagate(&c);

    result = 0;
    for (int i = 0; i < 4; i++) {
        if (circuit_get_wire(&c, sum, i) == WIRE_1) {
            result |= (1 << i);
        }
    }
    carry_out = circuit_get_wire(&c, cout, 0) == WIRE_1 ? 1 : 0;

    printf("  A = 15 (1111)\n");
    printf("  B = 1  (0001)\n");
    printf("  Cin = 0\n");
    printf("  ---------\n");
    printf("  Sum = %d (", result);
    for (int i = 3; i >= 0; i--) {
        printf("%s", wire_state_str(circuit_get_wire(&c, sum, i)));
    }
    printf(")\n");
    printf("  Cout = %d (overflow!)\n", carry_out);
    printf("\n");
}

void print_usage(const char *prog) {
    printf("M4HDL Circuit Simulator v1.0\n");
    printf("============================\n\n");
    printf("Usage:\n");
    printf("  %s <file.m4hdl>          Load and simulate circuit\n", prog);
    printf("  %s test                  Run built-in tests\n", prog);
    printf("  %s visualize [circuit]   Export circuit for web visualizer\n", prog);
    printf("  %s export <out.json>     Export test circuit to JSON\n", prog);
    printf("\n");
    printf("Visualizer:\n");
    printf("  After running 'visualize', open visualizer/index.html in a browser\n");
    printf("\n");
}

/* Export a demo circuit for visualization */
void export_demo_circuit(const char *json_file) {
    Circuit c;
    circuit_init(&c);
    build_full_adder(&c);

    /* Set some test inputs */
    int a = circuit_find_wire(&c, "a");
    int b = circuit_find_wire(&c, "b");
    int cin = circuit_find_wire(&c, "cin");

    circuit_set_wire(&c, a, 0, WIRE_1);
    circuit_set_wire(&c, b, 0, WIRE_1);
    circuit_set_wire(&c, cin, 0, WIRE_0);

    circuit_propagate(&c);

    circuit_export_json(&c, json_file);
    printf("Exported circuit to %s\n", json_file);
}

/* Interactive visualizer mode */
void run_visualizer(const char *circuit_type) {
    Circuit c;
    circuit_init(&c);

    /* Build the requested circuit */
    if (circuit_type == NULL || strcmp(circuit_type, "full_adder") == 0) {
        printf("Building Full Adder circuit...\n");
        build_full_adder(&c);
    } else if (strcmp(circuit_type, "half_adder") == 0) {
        printf("Building Half Adder circuit...\n");
        build_half_adder(&c);
    } else if (strcmp(circuit_type, "adder4") == 0) {
        printf("Building 4-bit Adder circuit...\n");
        build_adder4(&c);
    } else {
        printf("Unknown circuit: %s\n", circuit_type);
        printf("Available: half_adder, full_adder, adder4\n");
        return;
    }

    /* Export initial state */
    circuit_export_json(&c, "../../visualizer/circuit.json");
    printf("Exported to visualizer/circuit.json\n");
    printf("\nOpen visualizer/index.html in your browser!\n");
    printf("\nInteractive mode - enter commands:\n");
    printf("  set <wire> <bit> <0|1>  - Set wire state\n");
    printf("  step                     - Propagate signals\n");
    printf("  clock                    - Clock flip-flops\n");
    printf("  export                   - Update JSON file\n");
    printf("  quit                     - Exit\n\n");

    char line[256];
    while (1) {
        printf("sim> ");
        if (!fgets(line, sizeof(line), stdin)) break;

        line[strcspn(line, "\n")] = 0;

        if (strcmp(line, "quit") == 0 || strcmp(line, "q") == 0) {
            break;
        } else if (strcmp(line, "step") == 0 || strcmp(line, "s") == 0) {
            circuit_propagate(&c);
            circuit_export_json(&c, "../../visualizer/circuit.json");
            printf("Propagated. Refresh browser to see changes.\n");
        } else if (strcmp(line, "clock") == 0 || strcmp(line, "c") == 0) {
            circuit_clock(&c);
            circuit_propagate(&c);
            circuit_export_json(&c, "../../visualizer/circuit.json");
            printf("Clocked. Refresh browser to see changes.\n");
        } else if (strcmp(line, "export") == 0 || strcmp(line, "e") == 0) {
            circuit_export_json(&c, "../../visualizer/circuit.json");
            printf("Exported.\n");
        } else if (strcmp(line, "dump") == 0 || strcmp(line, "d") == 0) {
            circuit_dump_wires(&c);
        } else if (strncmp(line, "set ", 4) == 0) {
            char wire_name[64];
            int bit, val;
            if (sscanf(line + 4, "%s %d %d", wire_name, &bit, &val) == 3) {
                int wire_idx = circuit_find_wire(&c, wire_name);
                if (wire_idx >= 0) {
                    circuit_set_wire(&c, wire_idx, bit, val ? WIRE_1 : WIRE_0);
                    circuit_propagate(&c);
                    circuit_export_json(&c, "../../visualizer/circuit.json");
                    printf("Set %s[%d] = %d. Refresh browser.\n", wire_name, bit, val);
                } else {
                    printf("Wire not found: %s\n", wire_name);
                }
            } else {
                printf("Usage: set <wire> <bit> <0|1>\n");
            }
        } else if (line[0] != '\0') {
            printf("Unknown command: %s\n", line);
        }
    }
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        print_usage(argv[0]);
        return 1;
    }

    if (strcmp(argv[1], "test") == 0) {
        test_half_adder();
        test_full_adder();
        test_adder4();
        return 0;
    }

    if (strcmp(argv[1], "visualize") == 0) {
        const char *circuit_type = argc > 2 ? argv[2] : NULL;
        run_visualizer(circuit_type);
        return 0;
    }

    if (strcmp(argv[1], "export") == 0) {
        const char *outfile = argc > 2 ? argv[2] : "circuit.json";
        export_demo_circuit(outfile);
        return 0;
    }

    /* Load file */
    Circuit c;
    circuit_init(&c);

    printf("Loading %s...\n", argv[1]);
    if (!circuit_load_file(&c, argv[1])) {
        printf("Error: %s\n", c.error_msg);
        return 1;
    }

    printf("Loaded successfully.\n\n");
    circuit_dump_gates(&c);
    circuit_dump_wires(&c);

    printf("\nPropagating signals...\n");
    circuit_propagate(&c);

    printf("\nFinal state:\n");
    circuit_dump_wires(&c);

    /* Also export JSON for visualizer */
    circuit_export_json(&c, "circuit.json");
    printf("\nExported to circuit.json for visualizer\n");

    return 0;
}
