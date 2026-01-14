/*
 * Micro16 Assembler CLI
 *
 * Usage:
 *   micro16-asm <input.asm>              Assemble to input.bin
 *   micro16-asm <input.asm> -o out.bin   Assemble to specified output
 *   micro16-asm <input.asm> -hex         Output Intel HEX format
 *   micro16-asm <input.asm> -v           Verbose output
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "assembler.h"
#include "cpu.h"

static void print_usage(const char *prog) {
    printf("Micro16 Assembler v1.0\n");
    printf("======================\n\n");
    printf("Usage:\n");
    printf("  %s <input.asm> [options]\n\n", prog);
    printf("Options:\n");
    printf("  -o <file>     Output file (default: input.bin)\n");
    printf("  -hex          Output Intel HEX format instead of binary\n");
    printf("  -v, --verbose Verbose output\n");
    printf("  -s, --symbols Dump symbol table\n");
    printf("  -h, --help    Show this help\n");
    printf("\n");
    printf("Examples:\n");
    printf("  %s program.asm                  Assemble to program.bin\n", prog);
    printf("  %s program.asm -o test.bin      Assemble to test.bin\n", prog);
    printf("  %s program.asm -hex -o prog.hex Output Intel HEX\n", prog);
    printf("\n");
    printf("Directives:\n");
    printf("  ORG addr      Set origin address\n");
    printf("  EQU name val  Define constant (or: name = val)\n");
    printf("  DB values     Define bytes (comma-separated or string)\n");
    printf("  DW values     Define 16-bit words\n");
    printf("  DD values     Define 32-bit dwords\n");
    printf("  DS count      Reserve space (count bytes)\n");
    printf("\n");
    printf("Addressing modes:\n");
    printf("  MOV AX, BX         Register to register\n");
    printf("  MOV AX, #0x1234    Immediate value\n");
    printf("  MOV AX, [0x1000]   Direct memory\n");
    printf("  MOV AX, DS         Segment register\n");
    printf("  JMP label          Absolute jump\n");
    printf("  JR label           Relative jump (-128..+127)\n");
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        print_usage(argv[0]);
        return 1;
    }

    /* Parse arguments */
    const char *input_file = NULL;
    const char *output_file = NULL;
    bool hex_output = false;
    bool verbose = false;
    bool dump_symbols = false;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0) {
            print_usage(argv[0]);
            return 0;
        }
        else if (strcmp(argv[i], "-o") == 0 && i + 1 < argc) {
            output_file = argv[++i];
        }
        else if (strcmp(argv[i], "-hex") == 0) {
            hex_output = true;
        }
        else if (strcmp(argv[i], "-v") == 0 || strcmp(argv[i], "--verbose") == 0) {
            verbose = true;
        }
        else if (strcmp(argv[i], "-s") == 0 || strcmp(argv[i], "--symbols") == 0) {
            dump_symbols = true;
        }
        else if (argv[i][0] != '-') {
            input_file = argv[i];
        }
        else {
            fprintf(stderr, "Unknown option: %s\n", argv[i]);
            return 1;
        }
    }

    if (input_file == NULL) {
        fprintf(stderr, "Error: No input file specified\n\n");
        print_usage(argv[0]);
        return 1;
    }

    /* Generate default output filename if not specified */
    char default_output[256];
    if (output_file == NULL) {
        strncpy(default_output, input_file, sizeof(default_output) - 5);
        default_output[sizeof(default_output) - 5] = '\0';
        
        /* Replace extension */
        char *dot = strrchr(default_output, '.');
        if (dot != NULL) {
            *dot = '\0';
        }
        strcat(default_output, hex_output ? ".hex" : ".bin");
        output_file = default_output;
    }

    if (verbose) {
        printf("Micro16 Assembler\n");
        printf("Input:  %s\n", input_file);
        printf("Output: %s\n", output_file);
        printf("\n");
    }

    /* Assemble */
    Assembler as;
    if (!asm_assemble_file(&as, input_file)) {
        fprintf(stderr, "Error on line %d: %s\n", 
                asm_get_error_line(&as), asm_get_error(&as));
        return 1;
    }

    if (verbose) {
        printf("Assembly successful!\n");
        printf("  Lines processed: %d\n", as.lines_processed);
        printf("  Labels defined:  %d\n", as.label_count);
        printf("  Constants:       %d\n", as.equate_count);
        printf("  Bytes generated: %d\n", as.bytes_generated);
        printf("  Origin:          0x%05X\n", as.origin);
        printf("  End address:     0x%05X\n", as.max_addr);
        printf("\n");
    }

    if (dump_symbols) {
        asm_dump_labels(&as);
        printf("\n");
    }

    if (verbose) {
        asm_dump_output(&as);
        printf("\n");
    }

    /* Write output */
    bool success;
    if (hex_output) {
        success = asm_write_hex(&as, output_file);
    } else {
        success = asm_write_binary(&as, output_file);
    }

    if (!success) {
        fprintf(stderr, "Error: Failed to write output file: %s\n", output_file);
        return 1;
    }

    if (verbose) {
        printf("Output written to: %s\n", output_file);
    } else {
        printf("%s: %d bytes written to %s\n", 
               input_file, asm_get_output_size(&as), output_file);
    }

    return 0;
}
