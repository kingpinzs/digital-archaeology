/*
 * Micro8 Assembler - Header
 *
 * Two-pass assembler for the Micro8 8-bit CPU
 * Supports all ~80 instructions and 8 addressing modes
 */

#ifndef MICRO8_ASSEMBLER_H
#define MICRO8_ASSEMBLER_H

#include <stdint.h>
#include <stdbool.h>

/* Limits */
#define MAX_LABELS     256
#define MAX_LABEL_LEN  64
#define MAX_OUTPUT     65536   /* 64KB address space */
#define MAX_LINE_LEN   256
#define MAX_EQUATES    256

/* Label entry */
typedef struct {
    char name[MAX_LABEL_LEN];
    uint16_t address;
} Label;

/* Equate entry (for EQU directive) */
typedef struct {
    char name[MAX_LABEL_LEN];
    uint16_t value;
} Equate;

/* Assembler state */
typedef struct {
    /* Symbol tables */
    Label labels[MAX_LABELS];
    int label_count;
    Equate equates[MAX_EQUATES];
    int equate_count;

    /* Output buffer */
    uint8_t output[MAX_OUTPUT];
    uint16_t origin;
    uint16_t current_addr;
    uint16_t max_addr;

    /* Error handling */
    bool error;
    char error_msg[256];
    int error_line;

    /* Statistics */
    int lines_processed;
    int bytes_generated;
} Assembler;

/* Assembler lifecycle */
void asm_init(Assembler *as);

/* Assembly functions */
bool asm_assemble(Assembler *as, const char *source);
bool asm_assemble_file(Assembler *as, const char *filename);

/* Output access */
const uint8_t* asm_get_output(const Assembler *as);
int asm_get_output_size(const Assembler *as);

/* Error access */
const char* asm_get_error(const Assembler *as);
int asm_get_error_line(const Assembler *as);

/* Debug utilities */
void asm_dump_labels(const Assembler *as);
void asm_dump_output(const Assembler *as);

/* Write output to binary file */
bool asm_write_binary(const Assembler *as, const char *filename);

#endif /* MICRO8_ASSEMBLER_H */
