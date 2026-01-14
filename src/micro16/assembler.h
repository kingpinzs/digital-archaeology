/*
 * Micro16 Assembler Header
 *
 * Two-pass assembler for the Micro16 16-bit CPU
 * Supports ~120 instructions and multiple addressing modes:
 *   - Implicit: NOP, HLT, RET
 *   - Register: INC AX, DEC BX
 *   - Immediate: MOV AX, #0x1234
 *   - Direct: MOV AX, [0x1000]
 *   - Indexed: MOV AX, [BX+10]
 *   - Relative: JR label
 *   - Segment: MOV AX, DS
 *   - Far: JMP 0x1000:0x0100
 */

#ifndef MICRO16_ASSEMBLER_H
#define MICRO16_ASSEMBLER_H

#include <stdint.h>
#include <stdbool.h>

/* ========================================================================
 * Constants
 * ======================================================================== */

#define MAX_LABELS      512
#define MAX_EQUATES     256
#define MAX_LABEL_LEN   64
#define MAX_LINE_LEN    256
#define MAX_OUTPUT      0x100000   /* 1MB maximum output */

/* ========================================================================
 * Data Structures
 * ======================================================================== */

/* Label entry */
typedef struct {
    char name[MAX_LABEL_LEN];
    uint32_t address;   /* 20-bit physical address */
} AsmLabel;

/* Equate (constant) entry */
typedef struct {
    char name[MAX_LABEL_LEN];
    uint32_t value;
} AsmEquate;

/* Assembler state */
typedef struct {
    /* Symbol tables */
    AsmLabel labels[MAX_LABELS];
    int label_count;

    AsmEquate equates[MAX_EQUATES];
    int equate_count;

    /* Current assembly state */
    uint32_t origin;        /* Current origin (ORG directive) */
    uint32_t current_addr;  /* Current output address */
    uint32_t max_addr;      /* Maximum address written */

    /* Segment tracking */
    uint16_t current_cs;    /* Current code segment */
    uint16_t current_ds;    /* Current data segment */

    /* Output buffer */
    uint8_t output[MAX_OUTPUT];
    int bytes_generated;

    /* Error handling */
    bool error;
    char error_msg[256];
    int error_line;

    /* Statistics */
    int lines_processed;
} Assembler;

/* ========================================================================
 * Function Declarations
 * ======================================================================== */

/* Initialize assembler state */
void asm_init(Assembler *as);

/* Assemble source code from string */
bool asm_assemble(Assembler *as, const char *source);

/* Assemble source code from file */
bool asm_assemble_file(Assembler *as, const char *filename);

/* Get output buffer */
const uint8_t* asm_get_output(const Assembler *as);

/* Get output size (from origin to max_addr) */
int asm_get_output_size(const Assembler *as);

/* Get origin address */
uint32_t asm_get_origin(const Assembler *as);

/* Get error message */
const char* asm_get_error(const Assembler *as);

/* Get error line number */
int asm_get_error_line(const Assembler *as);

/* Debug: dump symbol tables */
void asm_dump_labels(const Assembler *as);

/* Debug: dump output */
void asm_dump_output(const Assembler *as);

/* Write output to binary file */
bool asm_write_binary(const Assembler *as, const char *filename);

/* Write output to Intel HEX file */
bool asm_write_hex(const Assembler *as, const char *filename);

#endif /* MICRO16_ASSEMBLER_H */
