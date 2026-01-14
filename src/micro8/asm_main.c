/*
 * Micro8 Assembler CLI
 *
 * Command-line interface for the Micro8 two-pass assembler.
 *
 * Usage:
 *   micro8-asm <input.asm> -o <output.bin>    Assemble to binary
 *   micro8-asm <input.asm> -l                 List labels/symbols
 *   micro8-asm <input.asm> -d                 Dump output hex
 *   micro8-asm -h                             Show help
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include "assembler.h"

/* Print usage information */
static void print_usage(const char *prog) {
    printf("Micro8 Assembler v1.0\n");
    printf("=====================\n\n");
    printf("Usage:\n");
    printf("  %s <input.asm> [-o <output.bin>] [-l] [-d] [-v]\n", prog);
    printf("\n");
    printf("Options:\n");
    printf("  -o <file>    Write binary output to file\n");
    printf("  -l           List all labels and their addresses\n");
    printf("  -d           Dump output in hex format\n");
    printf("  -v           Verbose output (show statistics)\n");
    printf("  -h, --help   Show this help message\n");
    printf("\n");
    printf("Examples:\n");
    printf("  %s program.asm -o program.bin\n", prog);
    printf("  %s test.asm -l -d              # Show labels and hex dump\n", prog);
    printf("  %s -h                          # Show this help\n", prog);
    printf("\n");
    printf("Supported features:\n");
    printf("  - All ~80 Micro8 instructions\n");
    printf("  - 8 addressing modes (immediate, direct, indirect, etc.)\n");
    printf("  - Labels and forward references\n");
    printf("  - Directives: .org, .db, .dw, .ds, .equ\n");
    printf("  - Comments (semicolon to end of line)\n");
    printf("\n");
    printf("Assembly syntax:\n");
    printf("  label:       Define a label at current address\n");
    printf("  .org ADDR    Set origin address\n");
    printf("  .db VAL,...  Define byte(s)\n");
    printf("  .dw VAL,...  Define word(s) (16-bit, little-endian)\n");
    printf("  .ds SIZE     Reserve SIZE bytes of space\n");
    printf("  NAME .equ V  Define constant NAME with value V\n");
}

int main(int argc, char *argv[]) {
    const char *input_file = NULL;
    const char *output_file = NULL;
    bool list_labels = false;
    bool dump_output = false;
    bool verbose = false;

    /* Parse command line arguments */
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0) {
            print_usage(argv[0]);
            return 0;
        } else if (strcmp(argv[i], "-o") == 0) {
            if (i + 1 >= argc) {
                fprintf(stderr, "Error: -o requires an output filename\n");
                return 1;
            }
            output_file = argv[++i];
        } else if (strcmp(argv[i], "-l") == 0) {
            list_labels = true;
        } else if (strcmp(argv[i], "-d") == 0) {
            dump_output = true;
        } else if (strcmp(argv[i], "-v") == 0) {
            verbose = true;
        } else if (argv[i][0] == '-') {
            fprintf(stderr, "Error: Unknown option '%s'\n", argv[i]);
            fprintf(stderr, "Use -h for help\n");
            return 1;
        } else {
            if (input_file != NULL) {
                fprintf(stderr, "Error: Multiple input files specified\n");
                return 1;
            }
            input_file = argv[i];
        }
    }

    /* Validate arguments */
    if (input_file == NULL) {
        fprintf(stderr, "Error: No input file specified\n");
        fprintf(stderr, "Use -h for help\n");
        return 1;
    }

    /* Initialize assembler */
    Assembler as;
    asm_init(&as);

    /* Assemble the file */
    printf("Assembling: %s\n", input_file);

    if (!asm_assemble_file(&as, input_file)) {
        fprintf(stderr, "Assembly failed at line %d:\n  %s\n",
                asm_get_error_line(&as), asm_get_error(&as));
        return 1;
    }

    /* Show statistics */
    if (verbose) {
        printf("Assembly complete:\n");
        printf("  Lines processed: %d\n", as.lines_processed);
        printf("  Bytes generated: %d\n", asm_get_output_size(&as));
        printf("  Origin: 0x%04X\n", as.origin);
        printf("  Address range: 0x%04X - 0x%04X\n", as.origin, as.max_addr);
    } else {
        printf("OK: %d bytes generated\n", asm_get_output_size(&as));
    }

    /* List labels if requested */
    if (list_labels) {
        printf("\n");
        asm_dump_labels(&as);
    }

    /* Dump output if requested */
    if (dump_output) {
        printf("\n");
        asm_dump_output(&as);
    }

    /* Write output file if specified */
    if (output_file != NULL) {
        if (!asm_write_binary(&as, output_file)) {
            fprintf(stderr, "Error: Failed to write output file '%s'\n", output_file);
            return 1;
        }
        printf("Written: %s (%d bytes)\n", output_file, asm_get_output_size(&as));
    } else if (!list_labels && !dump_output) {
        /* Warn if no output was specified */
        printf("Note: No output file specified (use -o <file> to save binary)\n");
    }

    return 0;
}
