/*
 * Micro4 Assembler
 *
 * Simple two-pass assembler for the Micro4 CPU
 * Supports:
 *   - All 8 instructions
 *   - Labels
 *   - ORG directive (set origin)
 *   - DB directive (define byte/nibble)
 *   - Comments (;)
 *   - Hexadecimal (0x) and decimal numbers
 */

#ifndef MICRO4_ASSEMBLER_H
#define MICRO4_ASSEMBLER_H

#include <stdint.h>
#include <stdbool.h>

#define MAX_LABELS 64
#define MAX_LABEL_LEN 32
#define MAX_LINE_LEN 256
#define MAX_OUTPUT 256

/* Label entry */
typedef struct {
    char name[MAX_LABEL_LEN];
    uint8_t address;
} Label;

/* Assembler state */
typedef struct {
    /* Symbol table */
    Label labels[MAX_LABELS];
    int label_count;

    /* Output */
    uint8_t output[MAX_OUTPUT];   /* Nibbles */
    uint8_t origin;               /* Current origin */
    uint8_t current_addr;         /* Current assembly address */
    uint8_t max_addr;             /* Highest address written */

    /* Error handling */
    bool error;
    char error_msg[256];
    int error_line;

    /* Statistics */
    int lines_processed;
    int bytes_generated;
} Assembler;

/* Initialize assembler */
void asm_init(Assembler *as);

/* Assemble source code (string) */
bool asm_assemble(Assembler *as, const char *source);

/* Assemble from file */
bool asm_assemble_file(Assembler *as, const char *filename);

/* Get output */
const uint8_t* asm_get_output(const Assembler *as);
int asm_get_output_size(const Assembler *as);

/* Get error info */
const char* asm_get_error(const Assembler *as);
int asm_get_error_line(const Assembler *as);

/* Debug */
void asm_dump_labels(const Assembler *as);
void asm_dump_output(const Assembler *as);

#endif /* MICRO4_ASSEMBLER_H */
