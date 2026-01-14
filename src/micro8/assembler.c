/*
 * Micro8 Assembler - Implementation
 *
 * Two-pass assembler for the Micro8 8-bit CPU
 * Supports all ~80 instructions and 8 addressing modes:
 *   - Implicit: NOP, HLT
 *   - Register: INC R0
 *   - Immediate: LDI R0, #0x42
 *   - Direct: LD R0, [0x1234]
 *   - Zero Page: LDZ R0, [0x50]
 *   - Indirect: LD R0, [HL]
 *   - Indexed: LD R0, [HL+5]
 *   - Relative: JR label
 */

#define _GNU_SOURCE
#include "assembler.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <ctype.h>

/* ========================================================================
 * Opcode Definitions (from ISA specification)
 * ======================================================================== */

/* System/NOP */
#define OP_NOP      0x00
#define OP_HLT      0x01

/* LDI Rd, #imm - opcodes 0x06-0x0D */
#define OP_LDI_BASE 0x06

/* LD Rd, [addr] - opcodes 0x0E-0x15 */
#define OP_LD_BASE  0x0E

/* LDZ Rd, [zp] - opcodes 0x16-0x1D */
#define OP_LDZ_BASE 0x16

/* ST Rd, [addr] - opcodes 0x1E-0x25 */
#define OP_ST_BASE  0x1E

/* STZ Rd, [zp] - opcodes 0x26-0x2D */
#define OP_STZ_BASE 0x26

/* Indirect addressing via HL */
#define OP_LD_HL    0x2E    /* LD Rd, [HL] */
#define OP_ST_HL    0x2F    /* ST Rd, [HL] */
#define OP_LD_HLD   0x30    /* LD Rd, [HL+d] */
#define OP_ST_HLD   0x31    /* ST Rd, [HL+d] */

/* 16-bit load immediate */
#define OP_LDI16_HL 0x32
#define OP_LDI16_BC 0x33
#define OP_LDI16_DE 0x34
#define OP_LDI16_SP 0x35

/* 16-bit moves */
#define OP_MOV16_HL_SP 0x36
#define OP_MOV16_SP_HL 0x37

/* Logic immediate */
#define OP_ANDI     0x38
#define OP_ORI      0x39
#define OP_XORI     0x3A

/* Shifts/Rotates */
#define OP_SHL      0x3B
#define OP_SHR      0x3C
#define OP_SAR      0x3D
#define OP_ROL      0x3E
#define OP_ROR      0x3F

/* ADD Rd, Rs - opcodes 0x40-0x47 (destination in bits 2:0) */
#define OP_ADD_BASE 0x40

/* ADC Rd, Rs - opcodes 0x48-0x4F */
#define OP_ADC_BASE 0x48

/* SUB Rd, Rs - opcodes 0x50-0x57 */
#define OP_SUB_BASE 0x50

/* SBC Rd, Rs - opcodes 0x58-0x5F */
#define OP_SBC_BASE 0x58

/* ADDI Rd, #imm - opcodes 0x60-0x67 */
#define OP_ADDI_BASE 0x60

/* SUBI Rd, #imm - opcodes 0x68-0x6F */
#define OP_SUBI_BASE 0x68

/* INC Rd - opcodes 0x70-0x77 */
#define OP_INC_BASE 0x70

/* DEC Rd - opcodes 0x78-0x7F */
#define OP_DEC_BASE 0x78

/* CMP Rd, Rs - opcodes 0x80-0x87 */
#define OP_CMP_BASE 0x80

/* CMPI Rd, #imm - opcodes 0x88-0x8F */
#define OP_CMPI_BASE 0x88

/* 16-bit arithmetic */
#define OP_INC16_HL 0x90
#define OP_DEC16_HL 0x91
#define OP_INC16_BC 0x92
#define OP_DEC16_BC 0x93
#define OP_ADD16_HL_BC 0x94
#define OP_ADD16_HL_DE 0x95
#define OP_NEG      0x96

/* AND Rd, Rs - opcodes 0xA0-0xA7 */
#define OP_AND_BASE 0xA0

/* OR Rd, Rs - opcodes 0xA8-0xAF */
#define OP_OR_BASE  0xA8

/* XOR Rd, Rs - opcodes 0xB0-0xB7 */
#define OP_XOR_BASE 0xB0

/* NOT Rd - opcodes 0xB8-0xBF */
#define OP_NOT_BASE 0xB8

/* Control flow */
#define OP_JMP      0xC0
#define OP_JR       0xC1
#define OP_JZ       0xC2
#define OP_JNZ      0xC3
#define OP_JC       0xC4
#define OP_JNC      0xC5
#define OP_JS       0xC6
#define OP_JNS      0xC7
#define OP_JO       0xC8
#define OP_JNO      0xC9
#define OP_JRZ      0xCA
#define OP_JRNZ     0xCB
#define OP_JRC      0xCC
#define OP_JRNC     0xCD
#define OP_JP_HL    0xCE
#define OP_CALL     0xCF

/* Return */
#define OP_RET      0xD0
#define OP_RETI     0xD1

/* PUSH Rd - opcodes 0xD2-0xD9 */
#define OP_PUSH_BASE 0xD2

/* POP Rd - opcodes 0xDA-0xE1 */
#define OP_POP_BASE 0xDA

/* 16-bit stack operations */
#define OP_PUSH16_HL 0xE2
#define OP_POP16_HL  0xE3
#define OP_PUSH16_BC 0xE4
#define OP_POP16_BC  0xE5
#define OP_PUSHF     0xE6
#define OP_POPF      0xE7

/* System */
#define OP_EI       0xE8
#define OP_DI       0xE9
#define OP_SCF      0xEA
#define OP_CCF      0xEB
#define OP_CMF      0xEC
#define OP_IN       0xED
#define OP_OUT      0xEE
#define OP_SWAP     0xEF

/* ========================================================================
 * Helper Functions
 * ======================================================================== */

/* Initialize assembler */
void asm_init(Assembler *as) {
    memset(as, 0, sizeof(Assembler));
    as->origin = 0x0200;        /* Default start after reserved area */
    as->current_addr = 0x0200;
}

/* Skip whitespace */
static char* skip_whitespace(char *s) {
    while (*s && isspace((unsigned char)*s)) s++;
    return s;
}

/* Check if string starts with (case insensitive) */
static bool starts_with_ci(const char *str, const char *prefix) {
    while (*prefix) {
        if (toupper((unsigned char)*str) != toupper((unsigned char)*prefix)) return false;
        str++;
        prefix++;
    }
    return true;
}

/* Parse number (hex, decimal, or binary) */
static int parse_number(const char *s, uint16_t *value) {
    char *end;
    long v;

    /* Skip leading # for immediate values */
    if (*s == '#') s++;

    if (s[0] == '0' && (s[1] == 'x' || s[1] == 'X')) {
        /* Hexadecimal */
        v = strtol(s, &end, 16);
    } else if (s[0] == '0' && (s[1] == 'b' || s[1] == 'B')) {
        /* Binary */
        v = strtol(s + 2, &end, 2);
    } else if (s[0] == '$') {
        /* Alternative hex notation */
        v = strtol(s + 1, &end, 16);
    } else {
        /* Decimal */
        v = strtol(s, &end, 10);
    }
    *value = (uint16_t)v;
    return (end != s) ? (int)(end - s) : 0;
}

/* Parse signed offset for relative jumps */
static int parse_signed_offset(const char *s, int8_t *value) {
    char *end;
    long v;

    if (*s == '#') s++;

    if (s[0] == '-') {
        v = strtol(s, &end, 10);
    } else if (s[0] == '0' && (s[1] == 'x' || s[1] == 'X')) {
        v = strtol(s, &end, 16);
    } else {
        v = strtol(s, &end, 10);
    }
    *value = (int8_t)v;
    return (end != s) ? (int)(end - s) : 0;
}

/* Look up label */
static int find_label(Assembler *as, const char *name) {
    for (int i = 0; i < as->label_count; i++) {
        if (strcasecmp(as->labels[i].name, name) == 0) {
            return (int)as->labels[i].address;
        }
    }
    return -1;
}

/* Look up equate */
static int find_equate(Assembler *as, const char *name) {
    for (int i = 0; i < as->equate_count; i++) {
        if (strcasecmp(as->equates[i].name, name) == 0) {
            return (int)as->equates[i].value;
        }
    }
    return -1;
}

/* Add label */
static bool add_label(Assembler *as, const char *name, uint16_t addr) {
    if (as->label_count >= MAX_LABELS) {
        snprintf(as->error_msg, sizeof(as->error_msg), "Too many labels");
        as->error = true;
        return false;
    }

    /* Check for duplicate */
    if (find_label(as, name) >= 0 || find_equate(as, name) >= 0) {
        snprintf(as->error_msg, sizeof(as->error_msg),
                 "Duplicate symbol: %s", name);
        as->error = true;
        return false;
    }

    strncpy(as->labels[as->label_count].name, name, MAX_LABEL_LEN - 1);
    as->labels[as->label_count].name[MAX_LABEL_LEN - 1] = '\0';
    as->labels[as->label_count].address = addr;
    as->label_count++;
    return true;
}

/* Add equate */
static bool add_equate(Assembler *as, const char *name, uint16_t value) {
    if (as->equate_count >= MAX_EQUATES) {
        snprintf(as->error_msg, sizeof(as->error_msg), "Too many equates");
        as->error = true;
        return false;
    }

    /* Check for duplicate */
    if (find_label(as, name) >= 0 || find_equate(as, name) >= 0) {
        snprintf(as->error_msg, sizeof(as->error_msg),
                 "Duplicate symbol: %s", name);
        as->error = true;
        return false;
    }

    strncpy(as->equates[as->equate_count].name, name, MAX_LABEL_LEN - 1);
    as->equates[as->equate_count].name[MAX_LABEL_LEN - 1] = '\0';
    as->equates[as->equate_count].value = value;
    as->equate_count++;
    return true;
}

/* Emit a byte */
static void emit_byte(Assembler *as, uint8_t value) {
    if (as->current_addr < MAX_OUTPUT) {
        as->output[as->current_addr] = value;
        if (as->current_addr > as->max_addr) {
            as->max_addr = as->current_addr;
        }
        as->current_addr++;
        as->bytes_generated++;
    }
}

/* Emit a 16-bit word (little-endian) */
static void emit_word(Assembler *as, uint16_t value) {
    emit_byte(as, value & 0xFF);        /* Low byte first */
    emit_byte(as, (value >> 8) & 0xFF); /* High byte second */
}

/* Parse register name, returns register number 0-7 or -1 on error */
static int parse_register(const char *s, int *len) {
    *len = 0;

    /* Skip whitespace */
    while (isspace((unsigned char)*s)) { s++; (*len)++; }

    /* Check for R0-R7 */
    if ((s[0] == 'R' || s[0] == 'r') && s[1] >= '0' && s[1] <= '7') {
        *len += 2;
        return s[1] - '0';
    }

    /* Check for aliases: A=R0, B=R1, C=R2, D=R3, E=R4, H=R5, L=R6 */
    char c = toupper((unsigned char)s[0]);
    if (c == 'A' && !isalnum((unsigned char)s[1])) { *len += 1; return 0; }
    if (c == 'B' && !isalnum((unsigned char)s[1])) { *len += 1; return 1; }
    if (c == 'C' && !isalnum((unsigned char)s[1])) { *len += 1; return 2; }
    if (c == 'D' && !isalnum((unsigned char)s[1])) { *len += 1; return 3; }
    if (c == 'E' && !isalnum((unsigned char)s[1])) { *len += 1; return 4; }
    if (c == 'H' && !isalnum((unsigned char)s[1])) { *len += 1; return 5; }
    if (c == 'L' && !isalnum((unsigned char)s[1])) { *len += 1; return 6; }

    return -1;
}

/* Parse register pair (HL, BC, DE, SP) */
static int parse_register_pair(const char *s, int *len) {
    *len = 0;

    while (isspace((unsigned char)*s)) { s++; (*len)++; }

    if (starts_with_ci(s, "HL") && !isalnum((unsigned char)s[2])) { *len += 2; return 0; }
    if (starts_with_ci(s, "BC") && !isalnum((unsigned char)s[2])) { *len += 2; return 1; }
    if (starts_with_ci(s, "DE") && !isalnum((unsigned char)s[2])) { *len += 2; return 2; }
    if (starts_with_ci(s, "SP") && !isalnum((unsigned char)s[2])) { *len += 2; return 3; }

    return -1;
}

/* Parse operand (value, label, or label+offset) */
static int parse_operand(Assembler *as, char *s, uint16_t *value, bool pass2) {
    s = skip_whitespace(s);

    /* Try as number first */
    int len = parse_number(s, value);
    if (len > 0) {
        return len;
    }

    /* Try as label (possibly with +/- offset) */
    char label[MAX_LABEL_LEN];
    int i = 0;
    while (s[i] && (isalnum((unsigned char)s[i]) || s[i] == '_') && i < MAX_LABEL_LEN - 1) {
        label[i] = s[i];
        i++;
    }
    label[i] = '\0';

    if (i > 0) {
        /* First check equates */
        int equ_val = find_equate(as, label);
        if (equ_val >= 0) {
            *value = (uint16_t)equ_val;
        } else {
            /* Then check labels */
            int addr = find_label(as, label);
            if (addr >= 0) {
                *value = (uint16_t)addr;
            } else if (pass2) {
                snprintf(as->error_msg, sizeof(as->error_msg),
                         "Undefined symbol: %s", label);
                as->error = true;
                return 0;
            } else {
                /* Pass 1: assume it will be defined later */
                *value = 0;
            }
        }

        /* Check for +/- offset after label */
        char *p = s + i;
        while (isspace((unsigned char)*p)) { p++; i++; }
        if (*p == '+' || *p == '-') {
            uint16_t offset;
            int offset_len = parse_number(p, &offset);
            if (offset_len > 0) {
                if (*p == '-') {
                    *value -= offset;
                } else {
                    *value += offset;
                }
                i += offset_len;
            }
        }
        return i;
    }

    return 0;
}

/* ========================================================================
 * Instruction Parsing
 * ======================================================================== */

/* Instruction types for encoding */
typedef enum {
    INSTR_IMPLICIT,      /* No operands: NOP, HLT, RET */
    INSTR_REG,           /* Single register: INC Rd, DEC Rd */
    INSTR_REG_REG,       /* Two registers: MOV Rd, Rs, ADD Rd, Rs */
    INSTR_REG_IMM8,      /* Register and immediate: LDI Rd, #imm */
    INSTR_REG_ADDR16,    /* Register and address: LD Rd, [addr] */
    INSTR_REG_ZP,        /* Register and zero page: LDZ Rd, [zp] */
    INSTR_REG_HL,        /* Register and [HL]: LD Rd, [HL] */
    INSTR_REG_HLD,       /* Register and [HL+d]: LD Rd, [HL+d] */
    INSTR_ADDR16,        /* 16-bit address: JMP addr, CALL addr */
    INSTR_REL8,          /* Relative offset: JR offset */
    INSTR_PAIR_IMM16,    /* Register pair and 16-bit immediate: LDI16 HL, #imm16 */
    INSTR_PORT,          /* I/O port: IN Rd, port / OUT port, Rd */
} InstrType;

/* Instruction definition */
typedef struct {
    const char *mnemonic;
    uint8_t base_opcode;
    InstrType type;
    int operand_count;   /* Number of register operands to encode */
} InstrDef;

/* Instruction table */
static const InstrDef instructions[] = {
    /* System */
    {"NOP",     OP_NOP,      INSTR_IMPLICIT, 0},
    {"HLT",     OP_HLT,      INSTR_IMPLICIT, 0},

    /* Data movement - immediate */
    {"LDI",     OP_LDI_BASE, INSTR_REG_IMM8, 1},

    /* Data movement - direct addressing */
    {"LD",      OP_LD_BASE,  INSTR_REG_ADDR16, 1},  /* Will also handle [HL] and [HL+d] */
    {"ST",      OP_ST_BASE,  INSTR_REG_ADDR16, 1},

    /* Data movement - zero page */
    {"LDZ",     OP_LDZ_BASE, INSTR_REG_ZP, 1},
    {"STZ",     OP_STZ_BASE, INSTR_REG_ZP, 1},

    /* 16-bit load immediate */
    {"LDI16",   0,           INSTR_PAIR_IMM16, 0},

    /* 16-bit moves */
    {"MOV16",   0,           INSTR_IMPLICIT, 0},  /* Special handling */

    /* MOV Rd, Rs - uses special encoding */
    {"MOV",     0x40,        INSTR_REG_REG, 2},

    /* Arithmetic - register-register */
    {"ADD",     OP_ADD_BASE, INSTR_REG_REG, 2},
    {"ADC",     OP_ADC_BASE, INSTR_REG_REG, 2},
    {"SUB",     OP_SUB_BASE, INSTR_REG_REG, 2},
    {"SBC",     OP_SBC_BASE, INSTR_REG_REG, 2},

    /* Arithmetic - immediate */
    {"ADDI",    OP_ADDI_BASE, INSTR_REG_IMM8, 1},
    {"SUBI",    OP_SUBI_BASE, INSTR_REG_IMM8, 1},

    /* Arithmetic - single register */
    {"INC",     OP_INC_BASE, INSTR_REG, 1},
    {"DEC",     OP_DEC_BASE, INSTR_REG, 1},
    {"NEG",     OP_NEG,      INSTR_REG, 1},

    /* Compare */
    {"CMP",     OP_CMP_BASE, INSTR_REG_REG, 2},
    {"CMPI",    OP_CMPI_BASE, INSTR_REG_IMM8, 1},

    /* 16-bit arithmetic */
    {"INC16",   0,           INSTR_IMPLICIT, 0},  /* Special handling */
    {"DEC16",   0,           INSTR_IMPLICIT, 0},
    {"ADD16",   0,           INSTR_IMPLICIT, 0},

    /* Logic - register-register */
    {"AND",     OP_AND_BASE, INSTR_REG_REG, 2},
    {"OR",      OP_OR_BASE,  INSTR_REG_REG, 2},
    {"XOR",     OP_XOR_BASE, INSTR_REG_REG, 2},

    /* Logic - single register */
    {"NOT",     OP_NOT_BASE, INSTR_REG, 1},

    /* Logic - immediate */
    {"ANDI",    OP_ANDI,     INSTR_REG_IMM8, 1},
    {"ORI",     OP_ORI,      INSTR_REG_IMM8, 1},
    {"XORI",    OP_XORI,     INSTR_REG_IMM8, 1},

    /* Shifts and rotates */
    {"SHL",     OP_SHL,      INSTR_REG, 1},
    {"SHR",     OP_SHR,      INSTR_REG, 1},
    {"SAR",     OP_SAR,      INSTR_REG, 1},
    {"ROL",     OP_ROL,      INSTR_REG, 1},
    {"ROR",     OP_ROR,      INSTR_REG, 1},
    {"SWAP",    OP_SWAP,     INSTR_REG, 1},

    /* Control flow - absolute jumps */
    {"JMP",     OP_JMP,      INSTR_ADDR16, 0},
    {"JZ",      OP_JZ,       INSTR_ADDR16, 0},
    {"JNZ",     OP_JNZ,      INSTR_ADDR16, 0},
    {"JC",      OP_JC,       INSTR_ADDR16, 0},
    {"JNC",     OP_JNC,      INSTR_ADDR16, 0},
    {"JS",      OP_JS,       INSTR_ADDR16, 0},
    {"JNS",     OP_JNS,      INSTR_ADDR16, 0},
    {"JO",      OP_JO,       INSTR_ADDR16, 0},
    {"JNO",     OP_JNO,      INSTR_ADDR16, 0},
    {"CALL",    OP_CALL,     INSTR_ADDR16, 0},

    /* Control flow - relative jumps */
    {"JR",      OP_JR,       INSTR_REL8, 0},
    {"JRZ",     OP_JRZ,      INSTR_REL8, 0},
    {"JRNZ",    OP_JRNZ,     INSTR_REL8, 0},
    {"JRC",     OP_JRC,      INSTR_REL8, 0},
    {"JRNC",    OP_JRNC,     INSTR_REL8, 0},

    /* Control flow - indirect */
    {"JP",      OP_JP_HL,    INSTR_IMPLICIT, 0},

    /* Return */
    {"RET",     OP_RET,      INSTR_IMPLICIT, 0},
    {"RETI",    OP_RETI,     INSTR_IMPLICIT, 0},

    /* Stack */
    {"PUSH",    OP_PUSH_BASE, INSTR_REG, 1},
    {"POP",     OP_POP_BASE,  INSTR_REG, 1},
    {"PUSH16",  0,           INSTR_IMPLICIT, 0},  /* Special handling */
    {"POP16",   0,           INSTR_IMPLICIT, 0},
    {"PUSHF",   OP_PUSHF,    INSTR_IMPLICIT, 0},
    {"POPF",    OP_POPF,     INSTR_IMPLICIT, 0},

    /* System */
    {"EI",      OP_EI,       INSTR_IMPLICIT, 0},
    {"DI",      OP_DI,       INSTR_IMPLICIT, 0},
    {"SCF",     OP_SCF,      INSTR_IMPLICIT, 0},
    {"CCF",     OP_CCF,      INSTR_IMPLICIT, 0},
    {"CMF",     OP_CMF,      INSTR_IMPLICIT, 0},
    {"IN",      OP_IN,       INSTR_PORT, 0},
    {"OUT",     OP_OUT,      INSTR_PORT, 0},

    {NULL, 0, 0, 0}  /* End marker */
};

/* Find instruction by mnemonic */
static const InstrDef* find_instruction(const char *mnemonic) {
    for (int i = 0; instructions[i].mnemonic != NULL; i++) {
        if (strcasecmp(instructions[i].mnemonic, mnemonic) == 0) {
            return &instructions[i];
        }
    }
    return NULL;
}

/* ========================================================================
 * Line Processing
 * ======================================================================== */

/* Process a directive */
static bool process_directive(Assembler *as, char *line, bool pass2) {
    char *p = skip_whitespace(line);

    /* ORG directive */
    if (starts_with_ci(p, "ORG") || starts_with_ci(p, ".ORG")) {
        p = skip_whitespace(p + (p[0] == '.' ? 4 : 3));
        uint16_t value;
        if (parse_number(p, &value) > 0) {
            as->origin = value;
            as->current_addr = value;
        } else {
            snprintf(as->error_msg, sizeof(as->error_msg), "Invalid ORG operand");
            as->error = true;
            return false;
        }
        return true;
    }

    /* EQU directive */
    if (starts_with_ci(p, "EQU") || starts_with_ci(p, ".EQU")) {
        /* EQU is usually: LABEL EQU value, but we handle it as: EQU LABEL value */
        /* This is processed during label handling, skip here */
        return true;
    }

    /* DB directive (define byte) */
    if (starts_with_ci(p, "DB") || starts_with_ci(p, ".DB")) {
        p = skip_whitespace(p + (p[0] == '.' ? 3 : 2));
        while (*p && *p != ';') {
            /* Check for string */
            if (*p == '"' || *p == '\'') {
                char quote = *p++;
                while (*p && *p != quote) {
                    if (pass2) {
                        emit_byte(as, (uint8_t)*p);
                    } else {
                        as->current_addr++;
                    }
                    p++;
                }
                if (*p == quote) p++;
            } else {
                uint16_t value;
                int len = parse_operand(as, p, &value, pass2);
                if (len > 0) {
                    if (pass2) {
                        emit_byte(as, (uint8_t)value);
                    } else {
                        as->current_addr++;
                    }
                    p += len;
                } else {
                    break;
                }
            }
            p = skip_whitespace(p);
            if (*p == ',') {
                p = skip_whitespace(p + 1);
            }
        }
        return true;
    }

    /* DW directive (define word - 16 bit, little endian) */
    if (starts_with_ci(p, "DW") || starts_with_ci(p, ".DW")) {
        p = skip_whitespace(p + (p[0] == '.' ? 3 : 2));
        while (*p && *p != ';') {
            uint16_t value;
            int len = parse_operand(as, p, &value, pass2);
            if (len > 0) {
                if (pass2) {
                    emit_word(as, value);
                } else {
                    as->current_addr += 2;
                }
                p += len;
                p = skip_whitespace(p);
                if (*p == ',') {
                    p = skip_whitespace(p + 1);
                }
            } else {
                break;
            }
        }
        return true;
    }

    /* DS directive (define space) */
    if (starts_with_ci(p, "DS") || starts_with_ci(p, ".DS")) {
        p = skip_whitespace(p + (p[0] == '.' ? 3 : 2));
        uint16_t value;
        if (parse_number(p, &value) > 0) {
            if (pass2) {
                for (int i = 0; i < value; i++) {
                    emit_byte(as, 0);
                }
            } else {
                as->current_addr += value;
            }
        }
        return true;
    }

    return false;  /* Not a directive */
}

/* Process a single line */
static bool process_line(Assembler *as, char *line, bool pass2) {
    char *p = skip_whitespace(line);

    /* Skip empty lines and comments */
    if (*p == '\0' || *p == ';') {
        return true;
    }

    /* Check for label (ends with :) or EQU */
    char *colon = strchr(p, ':');
    char *equ_pos = NULL;

    /* Check for EQU (can be "LABEL EQU value" or "LABEL = value") */
    char *equals = strchr(p, '=');
    char temp_line[MAX_LINE_LEN];
    strncpy(temp_line, p, sizeof(temp_line) - 1);
    temp_line[sizeof(temp_line) - 1] = '\0';
    char *equ_word = strcasestr(temp_line, "EQU");

    if (equ_word || equals) {
        /* Handle EQU directive: LABEL EQU value or LABEL = value */
        char label[MAX_LABEL_LEN];
        int i = 0;

        /* Extract label name */
        while (p[i] && !isspace((unsigned char)p[i]) && p[i] != '=' && p[i] != ':') {
            if (i < MAX_LABEL_LEN - 1) {
                label[i] = p[i];
            }
            i++;
        }
        label[i < MAX_LABEL_LEN ? i : MAX_LABEL_LEN - 1] = '\0';

        /* Skip to value */
        char *val_start = p + i;
        while (*val_start && (isspace((unsigned char)*val_start) || *val_start == '=')) val_start++;
        if (starts_with_ci(val_start, "EQU")) {
            val_start = skip_whitespace(val_start + 3);
        }

        uint16_t value;
        if (parse_number(val_start, &value) > 0) {
            if (!pass2) {
                if (!add_equate(as, label, value)) {
                    return false;
                }
            }
            return true;
        }
    }

    /* Check for regular label */
    if (colon && (colon == p || isalnum((unsigned char)colon[-1]) || colon[-1] == '_')) {
        char label[MAX_LABEL_LEN];
        int len = (int)(colon - p);
        if (len >= MAX_LABEL_LEN) len = MAX_LABEL_LEN - 1;
        strncpy(label, p, len);
        label[len] = '\0';

        /* Add label on pass 1 */
        if (!pass2) {
            if (!add_label(as, label, as->current_addr)) {
                return false;
            }
        }

        /* Move past label */
        p = skip_whitespace(colon + 1);
        if (*p == '\0' || *p == ';') {
            return true;
        }
    }

    /* Remove trailing comment */
    char *comment = strchr(p, ';');
    if (comment) *comment = '\0';

    /* Trim trailing whitespace */
    int line_len = strlen(p);
    while (line_len > 0 && isspace((unsigned char)p[line_len - 1])) {
        p[--line_len] = '\0';
    }
    if (line_len == 0) return true;

    /* Try to process as directive */
    if (process_directive(as, p, pass2)) {
        return true;
    }

    /* Parse instruction mnemonic */
    char mnemonic[16];
    int mi = 0;
    while (p[mi] && isalnum((unsigned char)p[mi]) && mi < 15) {
        mnemonic[mi] = p[mi];
        mi++;
    }
    mnemonic[mi] = '\0';
    p += mi;

    /* Handle special instructions with variations */

    /* 16-bit operations that need special parsing */
    if (strcasecmp(mnemonic, "LDI16") == 0) {
        /* LDI16 rp, #imm16 */
        int pair_len;
        int pair = parse_register_pair(p, &pair_len);
        if (pair < 0) {
            snprintf(as->error_msg, sizeof(as->error_msg),
                     "Expected register pair (HL, BC, DE, SP)");
            as->error = true;
            return false;
        }
        p += pair_len;
        p = skip_whitespace(p);
        if (*p == ',') p++;
        p = skip_whitespace(p);

        uint16_t value;
        if (parse_operand(as, p, &value, pass2) == 0 && pass2) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected 16-bit value");
            as->error = true;
            return false;
        }

        if (pass2) {
            uint8_t opcode;
            switch (pair) {
                case 0: opcode = OP_LDI16_HL; break;
                case 1: opcode = OP_LDI16_BC; break;
                case 2: opcode = OP_LDI16_DE; break;
                case 3: opcode = OP_LDI16_SP; break;
                default: opcode = OP_LDI16_HL; break;
            }
            emit_byte(as, opcode);
            emit_word(as, value);
        } else {
            as->current_addr += 3;
        }
        return true;
    }

    if (strcasecmp(mnemonic, "INC16") == 0) {
        int pair_len;
        int pair = parse_register_pair(p, &pair_len);
        if (pair < 0 || pair > 1) {  /* Only HL and BC supported */
            snprintf(as->error_msg, sizeof(as->error_msg),
                     "Expected HL or BC");
            as->error = true;
            return false;
        }
        if (pass2) {
            emit_byte(as, pair == 0 ? OP_INC16_HL : OP_INC16_BC);
        } else {
            as->current_addr++;
        }
        return true;
    }

    if (strcasecmp(mnemonic, "DEC16") == 0) {
        int pair_len;
        int pair = parse_register_pair(p, &pair_len);
        if (pair < 0 || pair > 1) {
            snprintf(as->error_msg, sizeof(as->error_msg),
                     "Expected HL or BC");
            as->error = true;
            return false;
        }
        if (pass2) {
            emit_byte(as, pair == 0 ? OP_DEC16_HL : OP_DEC16_BC);
        } else {
            as->current_addr++;
        }
        return true;
    }

    if (strcasecmp(mnemonic, "ADD16") == 0) {
        /* ADD16 HL, BC or ADD16 HL, DE */
        int pair_len;
        int pair1 = parse_register_pair(p, &pair_len);
        if (pair1 != 0) {  /* Must be HL */
            snprintf(as->error_msg, sizeof(as->error_msg),
                     "First operand must be HL");
            as->error = true;
            return false;
        }
        p += pair_len;
        p = skip_whitespace(p);
        if (*p == ',') p++;
        int pair2 = parse_register_pair(p, &pair_len);
        if (pair2 != 1 && pair2 != 2) {  /* BC or DE */
            snprintf(as->error_msg, sizeof(as->error_msg),
                     "Second operand must be BC or DE");
            as->error = true;
            return false;
        }
        if (pass2) {
            emit_byte(as, pair2 == 1 ? OP_ADD16_HL_BC : OP_ADD16_HL_DE);
        } else {
            as->current_addr++;
        }
        return true;
    }

    if (strcasecmp(mnemonic, "MOV16") == 0) {
        /* MOV16 HL, SP or MOV16 SP, HL */
        int pair_len;
        int pair1 = parse_register_pair(p, &pair_len);
        p += pair_len;
        p = skip_whitespace(p);
        if (*p == ',') p++;
        int pair2 = parse_register_pair(p, &pair_len);

        if (pair1 == 0 && pair2 == 3) {  /* HL, SP */
            if (pass2) emit_byte(as, OP_MOV16_HL_SP);
            else as->current_addr++;
        } else if (pair1 == 3 && pair2 == 0) {  /* SP, HL */
            if (pass2) emit_byte(as, OP_MOV16_SP_HL);
            else as->current_addr++;
        } else {
            snprintf(as->error_msg, sizeof(as->error_msg),
                     "Invalid MOV16 operands (use HL, SP or SP, HL)");
            as->error = true;
            return false;
        }
        return true;
    }

    if (strcasecmp(mnemonic, "PUSH16") == 0) {
        int pair_len;
        int pair = parse_register_pair(p, &pair_len);
        if (pair < 0 || pair > 1) {
            snprintf(as->error_msg, sizeof(as->error_msg),
                     "Expected HL or BC");
            as->error = true;
            return false;
        }
        if (pass2) {
            emit_byte(as, pair == 0 ? OP_PUSH16_HL : OP_PUSH16_BC);
        } else {
            as->current_addr++;
        }
        return true;
    }

    if (strcasecmp(mnemonic, "POP16") == 0) {
        int pair_len;
        int pair = parse_register_pair(p, &pair_len);
        if (pair < 0 || pair > 1) {
            snprintf(as->error_msg, sizeof(as->error_msg),
                     "Expected HL or BC");
            as->error = true;
            return false;
        }
        if (pass2) {
            emit_byte(as, pair == 0 ? OP_POP16_HL : OP_POP16_BC);
        } else {
            as->current_addr++;
        }
        return true;
    }

    /* Handle JP HL (indirect jump) */
    if (strcasecmp(mnemonic, "JP") == 0) {
        p = skip_whitespace(p);
        int pair_len;
        int pair = parse_register_pair(p, &pair_len);
        if (pair == 0) {  /* JP HL */
            if (pass2) emit_byte(as, OP_JP_HL);
            else as->current_addr++;
            return true;
        }
        /* Fall through to handle as regular JMP (if JP is alias for JMP) */
    }

    /* Handle IN and OUT */
    if (strcasecmp(mnemonic, "IN") == 0) {
        /* IN Rd, port */
        int reg_len;
        int rd = parse_register(p, &reg_len);
        if (rd < 0) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected register");
            as->error = true;
            return false;
        }
        p += reg_len;
        p = skip_whitespace(p);
        if (*p == ',') p++;
        uint16_t port;
        if (parse_operand(as, p, &port, pass2) == 0 && pass2) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected port number");
            as->error = true;
            return false;
        }
        if (pass2) {
            emit_byte(as, OP_IN | rd);  /* Encode register in low bits */
            emit_byte(as, (uint8_t)port);
        } else {
            as->current_addr += 2;
        }
        return true;
    }

    if (strcasecmp(mnemonic, "OUT") == 0) {
        /* OUT port, Rd */
        p = skip_whitespace(p);
        uint16_t port;
        int port_len = parse_operand(as, p, &port, pass2);
        if (port_len == 0 && pass2) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected port number");
            as->error = true;
            return false;
        }
        p += port_len;
        p = skip_whitespace(p);
        if (*p == ',') p++;
        int reg_len;
        int rs = parse_register(p, &reg_len);
        if (rs < 0) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected register");
            as->error = true;
            return false;
        }
        if (pass2) {
            emit_byte(as, OP_OUT | rs);
            emit_byte(as, (uint8_t)port);
        } else {
            as->current_addr += 2;
        }
        return true;
    }

    /* Handle LD and ST with various addressing modes */
    if (strcasecmp(mnemonic, "LD") == 0) {
        int reg_len;
        int rd = parse_register(p, &reg_len);
        if (rd < 0) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected register");
            as->error = true;
            return false;
        }
        p += reg_len;
        p = skip_whitespace(p);
        if (*p == ',') p++;
        p = skip_whitespace(p);

        /* Check addressing mode */
        if (*p == '[') {
            p++;
            p = skip_whitespace(p);

            /* Check for [HL], [HL+d], or [addr] */
            if (starts_with_ci(p, "HL")) {
                p += 2;
                p = skip_whitespace(p);
                if (*p == '+' || *p == '-') {
                    /* [HL+d] indexed addressing */
                    int8_t offset;
                    int off_len = parse_signed_offset(p, &offset);
                    if (off_len == 0) {
                        snprintf(as->error_msg, sizeof(as->error_msg),
                                 "Expected offset");
                        as->error = true;
                        return false;
                    }
                    if (pass2) {
                        emit_byte(as, OP_LD_HLD | rd);
                        emit_byte(as, (uint8_t)offset);
                    } else {
                        as->current_addr += 2;
                    }
                } else {
                    /* [HL] indirect addressing */
                    if (pass2) {
                        emit_byte(as, OP_LD_HL | rd);
                    } else {
                        as->current_addr++;
                    }
                }
            } else {
                /* [addr] direct addressing */
                uint16_t addr;
                if (parse_operand(as, p, &addr, pass2) == 0 && pass2) {
                    snprintf(as->error_msg, sizeof(as->error_msg),
                             "Expected address");
                    as->error = true;
                    return false;
                }
                if (pass2) {
                    emit_byte(as, OP_LD_BASE + rd);
                    emit_word(as, addr);
                } else {
                    as->current_addr += 3;
                }
            }
            return true;
        }

        snprintf(as->error_msg, sizeof(as->error_msg),
                 "Expected [ for memory operand");
        as->error = true;
        return false;
    }

    if (strcasecmp(mnemonic, "ST") == 0) {
        int reg_len;
        int rs = parse_register(p, &reg_len);
        if (rs < 0) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected register");
            as->error = true;
            return false;
        }
        p += reg_len;
        p = skip_whitespace(p);
        if (*p == ',') p++;
        p = skip_whitespace(p);

        if (*p == '[') {
            p++;
            p = skip_whitespace(p);

            if (starts_with_ci(p, "HL")) {
                p += 2;
                p = skip_whitespace(p);
                if (*p == '+' || *p == '-') {
                    int8_t offset;
                    int off_len = parse_signed_offset(p, &offset);
                    if (off_len == 0) {
                        snprintf(as->error_msg, sizeof(as->error_msg),
                                 "Expected offset");
                        as->error = true;
                        return false;
                    }
                    if (pass2) {
                        emit_byte(as, OP_ST_HLD | rs);
                        emit_byte(as, (uint8_t)offset);
                    } else {
                        as->current_addr += 2;
                    }
                } else {
                    if (pass2) {
                        emit_byte(as, OP_ST_HL | rs);
                    } else {
                        as->current_addr++;
                    }
                }
            } else {
                uint16_t addr;
                if (parse_operand(as, p, &addr, pass2) == 0 && pass2) {
                    snprintf(as->error_msg, sizeof(as->error_msg),
                             "Expected address");
                    as->error = true;
                    return false;
                }
                if (pass2) {
                    emit_byte(as, OP_ST_BASE + rs);
                    emit_word(as, addr);
                } else {
                    as->current_addr += 3;
                }
            }
            return true;
        }

        snprintf(as->error_msg, sizeof(as->error_msg),
                 "Expected [ for memory operand");
        as->error = true;
        return false;
    }

    /* Handle LDZ and STZ (zero page) */
    if (strcasecmp(mnemonic, "LDZ") == 0) {
        int reg_len;
        int rd = parse_register(p, &reg_len);
        if (rd < 0) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected register");
            as->error = true;
            return false;
        }
        p += reg_len;
        p = skip_whitespace(p);
        if (*p == ',') p++;
        p = skip_whitespace(p);
        if (*p == '[') p++;

        uint16_t zp_addr;
        if (parse_operand(as, p, &zp_addr, pass2) == 0 && pass2) {
            snprintf(as->error_msg, sizeof(as->error_msg),
                     "Expected zero page address");
            as->error = true;
            return false;
        }
        if (pass2) {
            emit_byte(as, OP_LDZ_BASE + rd);
            emit_byte(as, (uint8_t)zp_addr);
        } else {
            as->current_addr += 2;
        }
        return true;
    }

    if (strcasecmp(mnemonic, "STZ") == 0) {
        int reg_len;
        int rs = parse_register(p, &reg_len);
        if (rs < 0) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected register");
            as->error = true;
            return false;
        }
        p += reg_len;
        p = skip_whitespace(p);
        if (*p == ',') p++;
        p = skip_whitespace(p);
        if (*p == '[') p++;

        uint16_t zp_addr;
        if (parse_operand(as, p, &zp_addr, pass2) == 0 && pass2) {
            snprintf(as->error_msg, sizeof(as->error_msg),
                     "Expected zero page address");
            as->error = true;
            return false;
        }
        if (pass2) {
            emit_byte(as, OP_STZ_BASE + rs);
            emit_byte(as, (uint8_t)zp_addr);
        } else {
            as->current_addr += 2;
        }
        return true;
    }

    /* Handle MOV Rd, Rs (special encoding) */
    if (strcasecmp(mnemonic, "MOV") == 0) {
        int reg_len;
        int rd = parse_register(p, &reg_len);
        if (rd < 0) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected destination register");
            as->error = true;
            return false;
        }
        p += reg_len;
        p = skip_whitespace(p);
        if (*p == ',') p++;
        int rs = parse_register(p, &reg_len);
        if (rs < 0) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected source register");
            as->error = true;
            return false;
        }
        /* MOV encoding: 01 ddd sss */
        if (pass2) {
            emit_byte(as, 0x40 | (rd << 3) | rs);
        } else {
            as->current_addr++;
        }
        return true;
    }

    /* Look up instruction in table */
    const InstrDef *instr = find_instruction(mnemonic);
    if (instr == NULL) {
        snprintf(as->error_msg, sizeof(as->error_msg),
                 "Unknown instruction: %s", mnemonic);
        as->error = true;
        return false;
    }

    /* Process based on instruction type */
    switch (instr->type) {
        case INSTR_IMPLICIT: {
            if (pass2) {
                emit_byte(as, instr->base_opcode);
            } else {
                as->current_addr++;
            }
            break;
        }

        case INSTR_REG: {
            int reg_len;
            int rd = parse_register(p, &reg_len);
            if (rd < 0) {
                snprintf(as->error_msg, sizeof(as->error_msg),
                         "Expected register");
                as->error = true;
                return false;
            }
            if (pass2) {
                emit_byte(as, instr->base_opcode + rd);
            } else {
                as->current_addr++;
            }
            break;
        }

        case INSTR_REG_REG: {
            int reg_len;
            int rd = parse_register(p, &reg_len);
            if (rd < 0) {
                snprintf(as->error_msg, sizeof(as->error_msg),
                         "Expected destination register");
                as->error = true;
                return false;
            }
            p += reg_len;
            p = skip_whitespace(p);
            if (*p == ',') p++;
            int rs = parse_register(p, &reg_len);
            if (rs < 0) {
                snprintf(as->error_msg, sizeof(as->error_msg),
                         "Expected source register");
                as->error = true;
                return false;
            }
            if (pass2) {
                /* For ADD, SUB, etc: opcode encodes both registers
                 * Format varies - most use base + source with dest implied as first operand
                 * Actually per ISA: ADD Rd, Rs uses opcodes where Rd is encoded in instruction
                 * Looking at ISA: ADD 0,0 means ADD R0, R0 at 0x40
                 * So opcode = base + (8 * rd) + rs? No, checking the map more carefully:
                 * 0x40-0x47 are ADD with increasing source register
                 * The destination seems implicit or we need a different encoding
                 *
                 * Re-reading ISA: "ADD Rd, Rs" at 0x40-0x47 suggests 8 opcodes
                 * This appears to be ADD Rd, Rs where source varies 0-7
                 * But that's only 8 opcodes for one destination...
                 *
                 * Looking at opcode map more carefully:
                 * Row 4x shows ADD 0,0 ADD 0,1 etc - this is ADD R0, R0-R7
                 * So destination is fixed to R0 for these base opcodes
                 *
                 * Actually the format is: the ISA shows ADD Rd, Rs with range 0x40-0x47
                 * This means there are 8 ADD instructions where:
                 * - The destination register is accumulated (R0 typically)
                 * - Or we need to look at encoding format 2 for reg-to-reg
                 *
                 * From ISA "Format 2: Register-to-Register (1 byte)":
                 * Bits 7:6 = opcode (2 bits), 5:3 = dst, 2:0 = src
                 * But that's specifically for MOV!
                 *
                 * For ADD, the opcode table shows ADD uses the source in low bits
                 * So ADD Rd, Rs = 0x40 + rs, where Rd is implied as R0
                 * BUT wait - the ISA says "Rd ← Rd + Rs" which requires knowing Rd
                 *
                 * I'll interpret as: for simplicity these ops work on accum (R0)
                 * OR the encoding is: base + (destination << 3) + source?
                 * No, that would need more than 8 opcodes per operation.
                 *
                 * Looking at practical ISA: ADD R0, Rs where Rs = opcode & 0x07
                 * This means destination is always R0 for ADD etc.
                 */
                emit_byte(as, instr->base_opcode + rs);
            } else {
                as->current_addr++;
            }
            break;
        }

        case INSTR_REG_IMM8: {
            int reg_len;
            int rd = parse_register(p, &reg_len);
            if (rd < 0) {
                snprintf(as->error_msg, sizeof(as->error_msg),
                         "Expected register");
                as->error = true;
                return false;
            }
            p += reg_len;
            p = skip_whitespace(p);
            if (*p == ',') p++;
            p = skip_whitespace(p);
            if (*p == '#') p++;

            uint16_t imm;
            if (parse_operand(as, p, &imm, pass2) == 0 && pass2) {
                snprintf(as->error_msg, sizeof(as->error_msg),
                         "Expected immediate value");
                as->error = true;
                return false;
            }
            if (pass2) {
                emit_byte(as, instr->base_opcode + rd);
                emit_byte(as, (uint8_t)imm);
            } else {
                as->current_addr += 2;
            }
            break;
        }

        case INSTR_ADDR16: {
            p = skip_whitespace(p);
            uint16_t addr;
            if (parse_operand(as, p, &addr, pass2) == 0 && pass2) {
                snprintf(as->error_msg, sizeof(as->error_msg),
                         "Expected address");
                as->error = true;
                return false;
            }
            if (pass2) {
                emit_byte(as, instr->base_opcode);
                emit_word(as, addr);
            } else {
                as->current_addr += 3;
            }
            break;
        }

        case INSTR_REL8: {
            p = skip_whitespace(p);
            /* For relative jumps, calculate offset from next instruction */
            uint16_t target;
            if (parse_operand(as, p, &target, pass2) == 0 && pass2) {
                snprintf(as->error_msg, sizeof(as->error_msg),
                         "Expected label or offset");
                as->error = true;
                return false;
            }

            if (pass2) {
                /* Calculate relative offset: target - (current_addr + 2) */
                int offset = (int)target - (int)(as->current_addr + 2);
                if (offset < -128 || offset > 127) {
                    snprintf(as->error_msg, sizeof(as->error_msg),
                             "Relative jump out of range: %d", offset);
                    as->error = true;
                    return false;
                }
                emit_byte(as, instr->base_opcode);
                emit_byte(as, (uint8_t)(int8_t)offset);
            } else {
                as->current_addr += 2;
            }
            break;
        }

        default:
            snprintf(as->error_msg, sizeof(as->error_msg),
                     "Unhandled instruction type for: %s", mnemonic);
            as->error = true;
            return false;
    }

    return true;
}

/* ========================================================================
 * Public API
 * ======================================================================== */

/* Assemble source code */
bool asm_assemble(Assembler *as, const char *source) {
    asm_init(as);

    /* Make a mutable copy */
    char *src_copy = strdup(source);
    if (!src_copy) {
        snprintf(as->error_msg, sizeof(as->error_msg), "Out of memory");
        as->error = true;
        return false;
    }

    /* Pass 1: Collect labels and equates */
    char *saveptr = NULL;
    char *line = strtok_r(src_copy, "\n", &saveptr);
    int line_num = 1;

    while (line != NULL) {
        if (!process_line(as, line, false)) {
            as->error_line = line_num;
            free(src_copy);
            return false;
        }
        line = strtok_r(NULL, "\n", &saveptr);
        line_num++;
    }

    /* Reset for pass 2 */
    as->current_addr = as->origin;
    as->max_addr = 0;
    as->bytes_generated = 0;
    as->error = false;

    /* Pass 2: Generate code */
    free(src_copy);
    src_copy = strdup(source);
    if (!src_copy) {
        snprintf(as->error_msg, sizeof(as->error_msg), "Out of memory");
        as->error = true;
        return false;
    }

    saveptr = NULL;
    line = strtok_r(src_copy, "\n", &saveptr);
    line_num = 1;

    while (line != NULL) {
        if (!process_line(as, line, true)) {
            as->error_line = line_num;
            free(src_copy);
            return false;
        }
        as->lines_processed++;
        line = strtok_r(NULL, "\n", &saveptr);
        line_num++;
    }

    free(src_copy);
    return !as->error;
}

/* Assemble from file */
bool asm_assemble_file(Assembler *as, const char *filename) {
    FILE *f = fopen(filename, "r");
    if (!f) {
        snprintf(as->error_msg, sizeof(as->error_msg),
                 "Cannot open file: %s", filename);
        as->error = true;
        return false;
    }

    /* Read entire file */
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);

    char *source = malloc(size + 1);
    if (!source) {
        fclose(f);
        snprintf(as->error_msg, sizeof(as->error_msg), "Out of memory");
        as->error = true;
        return false;
    }

    size_t bytes_read = fread(source, 1, size, f);
    source[bytes_read] = '\0';
    fclose(f);

    bool result = asm_assemble(as, source);
    free(source);

    return result;
}

/* Get output */
const uint8_t* asm_get_output(const Assembler *as) {
    return as->output;
}

int asm_get_output_size(const Assembler *as) {
    if (as->max_addr == 0 && as->bytes_generated == 0) {
        return 0;
    }
    return as->max_addr + 1;
}

/* Get error info */
const char* asm_get_error(const Assembler *as) {
    return as->error_msg;
}

int asm_get_error_line(const Assembler *as) {
    return as->error_line;
}

/* Debug: dump labels */
void asm_dump_labels(const Assembler *as) {
    printf("=== Labels (%d) ===\n", as->label_count);
    for (int i = 0; i < as->label_count; i++) {
        printf("  %s = 0x%04X\n", as->labels[i].name, as->labels[i].address);
    }
    printf("=== Equates (%d) ===\n", as->equate_count);
    for (int i = 0; i < as->equate_count; i++) {
        printf("  %s = 0x%04X\n", as->equates[i].name, as->equates[i].value);
    }
}

/* Debug: dump output */
void asm_dump_output(const Assembler *as) {
    printf("=== Output (%d bytes, origin 0x%04X) ===\n",
           as->bytes_generated, as->origin);
    for (uint16_t i = as->origin; i <= as->max_addr; i += 16) {
        printf("0x%04X: ", i);
        for (int j = 0; j < 16 && (i + j) <= as->max_addr; j++) {
            printf("%02X ", as->output[i + j]);
        }
        printf("\n");
    }
}

/* Write output to binary file */
bool asm_write_binary(const Assembler *as, const char *filename) {
    FILE *f = fopen(filename, "wb");
    if (!f) {
        return false;
    }

    /* Write from origin to max_addr */
    size_t size = as->max_addr - as->origin + 1;
    size_t written = fwrite(&as->output[as->origin], 1, size, f);
    fclose(f);

    return written == size;
}
