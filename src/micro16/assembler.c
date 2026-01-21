/*
 * Micro16 Assembler - Implementation
 *
 * Two-pass assembler for the Micro16 16-bit CPU
 * Supports all ~120 instructions and addressing modes:
 *   - Implicit: NOP, HLT, RET, IRET
 *   - Register: INC AX, DEC BX, PUSH AX
 *   - Register-Register: MOV AX, BX; ADD AX, CX
 *   - Immediate: MOV AX, #0x1234
 *   - Direct: MOV AX, [0x1000]; MOV [0x1000], AX
 *   - Indexed: MOV AX, [BX+10]
 *   - Segment: MOV AX, DS; MOV DS, AX
 *   - Relative: JR label, LOOP label
 *   - Far: JMP 0x1000:0x0100, CALL seg:offset
 */

#define _GNU_SOURCE
#include "assembler.h"
#include "cpu.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <ctype.h>

/* ========================================================================
 * Helper Functions
 * ======================================================================== */

/* Initialize assembler */
void asm_init(Assembler *as) {
    memset(as, 0, sizeof(Assembler));
    as->origin = 0x0100;         /* Default start (like DOS COM files) */
    as->current_addr = 0x0100;
    as->current_cs = DEFAULT_CS;
    as->current_ds = DEFAULT_DS;
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
static int parse_number(const char *s, uint32_t *value) {
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
    *value = (uint32_t)v;
    return (end != s) ? (int)(end - s) : 0;
}

/* Look up label */
static int find_label(Assembler *as, const char *name, uint32_t *addr) {
    for (int i = 0; i < as->label_count; i++) {
        if (strcasecmp(as->labels[i].name, name) == 0) {
            *addr = as->labels[i].address;
            return 1;
        }
    }
    return 0;
}

/* Look up equate */
static int find_equate(Assembler *as, const char *name, uint32_t *value) {
    for (int i = 0; i < as->equate_count; i++) {
        if (strcasecmp(as->equates[i].name, name) == 0) {
            *value = as->equates[i].value;
            return 1;
        }
    }
    return 0;
}

/* Add label */
static bool add_label(Assembler *as, const char *name, uint32_t addr) {
    if (as->label_count >= MAX_LABELS) {
        snprintf(as->error_msg, sizeof(as->error_msg), "Too many labels");
        as->error = true;
        return false;
    }

    /* Check for duplicate */
    uint32_t dummy;
    if (find_label(as, name, &dummy) || find_equate(as, name, &dummy)) {
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
static bool add_equate(Assembler *as, const char *name, uint32_t value) {
    if (as->equate_count >= MAX_EQUATES) {
        snprintf(as->error_msg, sizeof(as->error_msg), "Too many equates");
        as->error = true;
        return false;
    }

    /* Check for duplicate */
    uint32_t dummy;
    if (find_label(as, name, &dummy) || find_equate(as, name, &dummy)) {
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

    /* Check for aliases: AX, BX, CX, DX, SI, DI, BP, R7 */
    if (starts_with_ci(s, "AX") && !isalnum((unsigned char)s[2])) { *len += 2; return 0; }
    if (starts_with_ci(s, "BX") && !isalnum((unsigned char)s[2])) { *len += 2; return 1; }
    if (starts_with_ci(s, "CX") && !isalnum((unsigned char)s[2])) { *len += 2; return 2; }
    if (starts_with_ci(s, "DX") && !isalnum((unsigned char)s[2])) { *len += 2; return 3; }
    if (starts_with_ci(s, "SI") && !isalnum((unsigned char)s[2])) { *len += 2; return 4; }
    if (starts_with_ci(s, "DI") && !isalnum((unsigned char)s[2])) { *len += 2; return 5; }
    if (starts_with_ci(s, "BP") && !isalnum((unsigned char)s[2])) { *len += 2; return 6; }
    if (starts_with_ci(s, "SP") && !isalnum((unsigned char)s[2])) { *len += 2; return -2; }  /* SP is special */

    return -1;
}

/* Parse segment register (CS, DS, SS, ES), returns 0-3 or -1 on error */
static int parse_segment(const char *s, int *len) {
    *len = 0;

    while (isspace((unsigned char)*s)) { s++; (*len)++; }

    if (starts_with_ci(s, "CS") && !isalnum((unsigned char)s[2])) { *len += 2; return 0; }
    if (starts_with_ci(s, "DS") && !isalnum((unsigned char)s[2])) { *len += 2; return 1; }
    if (starts_with_ci(s, "SS") && !isalnum((unsigned char)s[2])) { *len += 2; return 2; }
    if (starts_with_ci(s, "ES") && !isalnum((unsigned char)s[2])) { *len += 2; return 3; }

    return -1;
}

/* Parse operand (value, label, or label+offset) */
static int parse_operand(Assembler *as, char *s, uint32_t *value, bool pass2) {
    s = skip_whitespace(s);

    /* Try as character literal first (e.g., 'A', 'x', '\n') */
    if (*s == '\'') {
        if (s[1] == '\\' && s[2] && s[3] == '\'') {
            /* Escape sequence */
            switch (s[2]) {
                case 'n': *value = '\n'; break;
                case 'r': *value = '\r'; break;
                case 't': *value = '\t'; break;
                case '0': *value = '\0'; break;
                case '\\': *value = '\\'; break;
                case '\'': *value = '\''; break;
                default: *value = s[2]; break;
            }
            return 4;
        } else if (s[1] && s[2] == '\'') {
            /* Simple character literal */
            *value = (uint8_t)s[1];
            return 3;
        }
    }

    /* Try as number */
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
        if (find_equate(as, label, value)) {
            /* Found equate */
        } else if (find_label(as, label, value)) {
            /* Found label */
        } else if (pass2) {
            snprintf(as->error_msg, sizeof(as->error_msg),
                     "Undefined symbol: %s", label);
            as->error = true;
            return 0;
        } else {
            /* Pass 1: assume it will be defined later */
            *value = 0;
        }

        /* Check for +/- offset after label */
        char *p = s + i;
        while (isspace((unsigned char)*p)) { p++; i++; }
        if (*p == '+' || *p == '-') {
            uint32_t offset;
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
    INSTR_REG,           /* Single register: INC AX, DEC BX */
    INSTR_REG_REG,       /* Two registers: MOV AX, BX; ADD AX, CX */
    INSTR_REG_IMM16,     /* Register and 16-bit immediate: MOV AX, #0x1234 */
    INSTR_REG_MEM,       /* Register and memory: MOV AX, [addr] */
    INSTR_MEM_REG,       /* Memory and register: MOV [addr], AX */
    INSTR_ADDR16,        /* 16-bit address: JMP addr, CALL addr */
    INSTR_REL8,          /* Relative offset: JR offset */
    INSTR_SEG_REG,       /* Segment to register: MOV AX, DS */
    INSTR_REG_SEG,       /* Register to segment: MOV DS, AX */
    INSTR_PUSH_SEG,      /* Push segment: PUSH DS */
    INSTR_POP_SEG,       /* Pop segment: POP DS */
    INSTR_FAR,           /* Far jump/call: JMP seg:offset */
} InstrType;

/* Instruction definition */
typedef struct {
    const char *mnemonic;
    uint8_t base_opcode;
    InstrType type;
} InstrDef;

/* Instruction table */
static const InstrDef instructions[] = {
    /* System */
    {"NOP",     OP_NOP,      INSTR_IMPLICIT},
    {"HLT",     OP_HLT,      INSTR_IMPLICIT},
    {"WAIT",    OP_WAIT,     INSTR_IMPLICIT},
    {"CLI",     OP_CLI,      INSTR_IMPLICIT},
    {"STI",     OP_STI,      INSTR_IMPLICIT},
    {"CLC",     OP_CLC,      INSTR_IMPLICIT},
    {"STC",     OP_STC,      INSTR_IMPLICIT},
    {"CMC",     OP_CMC,      INSTR_IMPLICIT},
    {"CLD",     OP_CLD,      INSTR_IMPLICIT},
    {"STD",     OP_STD,      INSTR_IMPLICIT},
    {"PUSHF",   OP_PUSHF,    INSTR_IMPLICIT},
    {"POPF",    OP_POPF,     INSTR_IMPLICIT},
    {"IRET",    OP_IRET,     INSTR_IMPLICIT},
    {"PUSHA",   OP_PUSHA,    INSTR_IMPLICIT},
    {"POPA",    OP_POPA,     INSTR_IMPLICIT},
    {"LEAVE",   OP_LEAVE,    INSTR_IMPLICIT},
    {"RET",     OP_RET,      INSTR_IMPLICIT},
    {"RETF",    OP_RET_FAR,  INSTR_IMPLICIT},

    /* Arithmetic - single register */
    {"INC",     OP_INC,      INSTR_REG},
    {"DEC",     OP_DEC,      INSTR_REG},
    {"NEG",     OP_NEG,      INSTR_REG},
    {"NOT",     OP_NOT,      INSTR_REG},

    /* Stack - single register */
    {"PUSH",    OP_PUSH_R,   INSTR_REG},
    {"POP",     OP_POP_R,    INSTR_REG},

    /* Control flow - absolute jumps */
    {"JMP",     OP_JMP,      INSTR_ADDR16},
    {"CALL",    OP_CALL,     INSTR_ADDR16},
    {"JZ",      OP_JZ,       INSTR_ADDR16},
    {"JE",      OP_JZ,       INSTR_ADDR16},
    {"JNZ",     OP_JNZ,      INSTR_ADDR16},
    {"JNE",     OP_JNZ,      INSTR_ADDR16},
    {"JC",      OP_JC,       INSTR_ADDR16},
    {"JB",      OP_JC,       INSTR_ADDR16},
    {"JNC",     OP_JNC,      INSTR_ADDR16},
    {"JAE",     OP_JNC,      INSTR_ADDR16},
    {"JS",      OP_JS,       INSTR_ADDR16},
    {"JNS",     OP_JNS,      INSTR_ADDR16},
    {"JO",      OP_JO,       INSTR_ADDR16},
    {"JNO",     OP_JNO,      INSTR_ADDR16},
    {"JL",      OP_JL,       INSTR_ADDR16},
    {"JGE",     OP_JGE,      INSTR_ADDR16},
    {"JLE",     OP_JLE,      INSTR_ADDR16},
    {"JG",      OP_JG,       INSTR_ADDR16},
    {"JA",      OP_JA,       INSTR_ADDR16},
    {"JBE",     OP_JBE,      INSTR_ADDR16},

    /* Control flow - relative jumps */
    {"JR",      OP_JR,       INSTR_REL8},
    {"LOOP",    OP_LOOP,     INSTR_REL8},
    {"LOOPZ",   OP_LOOPZ,    INSTR_REL8},
    {"LOOPE",   OP_LOOPZ,    INSTR_REL8},
    {"LOOPNZ",  OP_LOOPNZ,   INSTR_REL8},
    {"LOOPNE",  OP_LOOPNZ,   INSTR_REL8},

    /* String operations */
    {"MOVSB",   OP_MOVSB,    INSTR_IMPLICIT},
    {"MOVSW",   OP_MOVSW,    INSTR_IMPLICIT},
    {"CMPSB",   OP_CMPSB,    INSTR_IMPLICIT},
    {"CMPSW",   OP_CMPSW,    INSTR_IMPLICIT},
    {"STOSB",   OP_STOSB,    INSTR_IMPLICIT},
    {"STOSW",   OP_STOSW,    INSTR_IMPLICIT},
    {"LODSB",   OP_LODSB,    INSTR_IMPLICIT},
    {"LODSW",   OP_LODSW,    INSTR_IMPLICIT},

    {NULL, 0, 0}  /* End marker */
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
        uint32_t value;
        if (parse_number(p, &value) > 0) {
            if (value < as->origin) {
                as->origin = value;
            }
            as->current_addr = value;
        } else {
            snprintf(as->error_msg, sizeof(as->error_msg), "Invalid ORG operand");
            as->error = true;
            return false;
        }
        return true;
    }

    /* SEGMENT directive */
    if (starts_with_ci(p, "SEGMENT") || starts_with_ci(p, ".SEGMENT")) {
        p = skip_whitespace(p + (p[0] == '.' ? 8 : 7));
        uint32_t value;
        if (parse_number(p, &value) > 0) {
            as->current_cs = (uint16_t)value;
        }
        return true;
    }

    /* DB directive (define byte) */
    if (starts_with_ci(p, "DB") || starts_with_ci(p, ".DB") || starts_with_ci(p, ".BYTE")) {
        int skip = 2;
        if (p[0] == '.') skip = starts_with_ci(p, ".BYTE") ? 5 : 3;
        p = skip_whitespace(p + skip);
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
                uint32_t value;
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
    if (starts_with_ci(p, "DW") || starts_with_ci(p, ".DW") || starts_with_ci(p, ".WORD")) {
        int skip = 2;
        if (p[0] == '.') skip = starts_with_ci(p, ".WORD") ? 5 : 3;
        p = skip_whitespace(p + skip);
        while (*p && *p != ';') {
            uint32_t value;
            int len = parse_operand(as, p, &value, pass2);
            if (len > 0) {
                if (pass2) {
                    emit_word(as, (uint16_t)value);
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

    /* DD directive (define double word - 32 bit, little endian) */
    if (starts_with_ci(p, "DD") || starts_with_ci(p, ".DD") || starts_with_ci(p, ".DWORD")) {
        int skip = 2;
        if (p[0] == '.') skip = starts_with_ci(p, ".DWORD") ? 6 : 3;
        p = skip_whitespace(p + skip);
        while (*p && *p != ';') {
            uint32_t value;
            int len = parse_operand(as, p, &value, pass2);
            if (len > 0) {
                if (pass2) {
                    emit_word(as, (uint16_t)(value & 0xFFFF));
                    emit_word(as, (uint16_t)(value >> 16));
                } else {
                    as->current_addr += 4;
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
    if (starts_with_ci(p, "DS") || starts_with_ci(p, ".DS") || starts_with_ci(p, ".SPACE")) {
        int skip = 2;
        if (p[0] == '.') skip = starts_with_ci(p, ".SPACE") ? 6 : 3;
        p = skip_whitespace(p + skip);
        uint32_t value;
        if (parse_number(p, &value) > 0) {
            if (pass2) {
                for (uint32_t i = 0; i < value; i++) {
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

    /* Skip empty lines and full-line comments */
    if (*p == '\0' || *p == ';') {
        return true;
    }

    /* Strip trailing comments */
    char *comment = strchr(p, ';');
    if (comment) *comment = '\0';

    /* Trim trailing whitespace */
    int line_len = strlen(p);
    while (line_len > 0 && isspace((unsigned char)p[line_len - 1])) {
        p[--line_len] = '\0';
    }
    if (line_len == 0) return true;

    /* Check for EQU */
    char temp_line[MAX_LINE_LEN];
    strncpy(temp_line, p, sizeof(temp_line) - 1);
    temp_line[sizeof(temp_line) - 1] = '\0';
    char *equ_word = strcasestr(temp_line, "EQU");
    char *equals = strchr(p, '=');

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
        if (starts_with_ci(val_start, ".EQU")) {
            val_start = skip_whitespace(val_start + 4);
        } else if (starts_with_ci(val_start, "EQU")) {
            val_start = skip_whitespace(val_start + 3);
        }

        uint32_t value;
        if (parse_number(val_start, &value) > 0) {
            if (!pass2) {
                if (!add_equate(as, label, value)) {
                    return false;
                }
            }
            return true;
        }
    }

    /* Check for label */
    char *colon = strchr(p, ':');
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

    /* Handle complex instructions that need special parsing */

    /* INT n */
    if (strcasecmp(mnemonic, "INT") == 0) {
        p = skip_whitespace(p);
        uint32_t vector;
        if (parse_operand(as, p, &vector, pass2) == 0 && pass2) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected interrupt vector");
            as->error = true;
            return false;
        }
        if (pass2) {
            emit_byte(as, OP_INT);
            emit_byte(as, (uint8_t)vector);
        } else {
            as->current_addr += 2;
        }
        return true;
    }

    /* REP prefix */
    if (strcasecmp(mnemonic, "REP") == 0) {
        p = skip_whitespace(p);
        /* Parse the following string instruction */
        char next_mnemonic[16];
        int ni = 0;
        while (p[ni] && isalnum((unsigned char)p[ni]) && ni < 15) {
            next_mnemonic[ni] = p[ni];
            ni++;
        }
        next_mnemonic[ni] = '\0';
        
        const InstrDef *next_instr = find_instruction(next_mnemonic);
        if (next_instr == NULL) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Unknown instruction after REP: %s", next_mnemonic);
            as->error = true;
            return false;
        }
        if (pass2) {
            emit_byte(as, OP_REP);
            emit_byte(as, next_instr->base_opcode);
        } else {
            as->current_addr += 2;
        }
        return true;
    }

    /* REPZ/REPE prefix */
    if (strcasecmp(mnemonic, "REPZ") == 0 || strcasecmp(mnemonic, "REPE") == 0) {
        p = skip_whitespace(p);
        char next_mnemonic[16];
        int ni = 0;
        while (p[ni] && isalnum((unsigned char)p[ni]) && ni < 15) {
            next_mnemonic[ni] = p[ni];
            ni++;
        }
        next_mnemonic[ni] = '\0';
        
        const InstrDef *next_instr = find_instruction(next_mnemonic);
        if (next_instr == NULL) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Unknown instruction after REPZ: %s", next_mnemonic);
            as->error = true;
            return false;
        }
        if (pass2) {
            emit_byte(as, OP_REPZ);
            emit_byte(as, next_instr->base_opcode);
        } else {
            as->current_addr += 2;
        }
        return true;
    }

    /* REPNZ/REPNE prefix */
    if (strcasecmp(mnemonic, "REPNZ") == 0 || strcasecmp(mnemonic, "REPNE") == 0) {
        p = skip_whitespace(p);
        char next_mnemonic[16];
        int ni = 0;
        while (p[ni] && isalnum((unsigned char)p[ni]) && ni < 15) {
            next_mnemonic[ni] = p[ni];
            ni++;
        }
        next_mnemonic[ni] = '\0';
        
        const InstrDef *next_instr = find_instruction(next_mnemonic);
        if (next_instr == NULL) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Unknown instruction after REPNZ: %s", next_mnemonic);
            as->error = true;
            return false;
        }
        if (pass2) {
            emit_byte(as, OP_REPNZ);
            emit_byte(as, next_instr->base_opcode);
        } else {
            as->current_addr += 2;
        }
        return true;
    }

    /* MOV instruction - complex, multiple forms */
    if (strcasecmp(mnemonic, "MOV") == 0) {
        p = skip_whitespace(p);
        int reg_len, seg_len;
        int rd = parse_register(p, &reg_len);
        int sd = parse_segment(p, &seg_len);

        if (rd >= 0) {
            /* MOV Rd, ... */
            p += reg_len;
            p = skip_whitespace(p);
            if (*p == ',') p++;
            p = skip_whitespace(p);

            int rs = parse_register(p, &reg_len);
            int ss = parse_segment(p, &seg_len);

            if (rs >= 0) {
                /* MOV Rd, Rs */
                if (pass2) {
                    emit_byte(as, OP_MOV_RR);
                    emit_byte(as, (rd << 4) | rs);
                } else {
                    as->current_addr += 2;
                }
                return true;
            } else if (rs == -2) {
                /* MOV Rd, SP */
                if (pass2) {
                    emit_byte(as, OP_MOV_R_SP);
                    emit_byte(as, rd);
                } else {
                    as->current_addr += 2;
                }
                return true;
            } else if (ss >= 0) {
                /* MOV Rd, Seg */
                if (pass2) {
                    emit_byte(as, OP_MOV_RS);
                    emit_byte(as, (rd << 4) | ss);
                } else {
                    as->current_addr += 2;
                }
                return true;
            } else if (*p == '#') {
                /* MOV Rd, #imm16 */
                p++;
                uint32_t imm;
                if (parse_operand(as, p, &imm, pass2) == 0 && pass2) {
                    snprintf(as->error_msg, sizeof(as->error_msg), "Expected immediate value");
                    as->error = true;
                    return false;
                }
                if (pass2) {
                    emit_byte(as, OP_MOV_RI);
                    emit_byte(as, rd);
                    emit_word(as, (uint16_t)imm);
                } else {
                    as->current_addr += 4;
                }
                return true;
            } else if (*p == '[') {
                /* MOV Rd, [addr] */
                p++;
                uint32_t addr;
                if (parse_operand(as, p, &addr, pass2) == 0 && pass2) {
                    snprintf(as->error_msg, sizeof(as->error_msg), "Expected address");
                    as->error = true;
                    return false;
                }
                if (pass2) {
                    emit_byte(as, OP_LD);
                    emit_byte(as, rd);
                    emit_word(as, (uint16_t)addr);
                } else {
                    as->current_addr += 4;
                }
                return true;
            } else {
                /* MOV Rd, imm16 (without #) */
                uint32_t imm;
                if (parse_operand(as, p, &imm, pass2) == 0 && pass2) {
                    snprintf(as->error_msg, sizeof(as->error_msg), "Expected operand");
                    as->error = true;
                    return false;
                }
                if (pass2) {
                    emit_byte(as, OP_MOV_RI);
                    emit_byte(as, rd);
                    emit_word(as, (uint16_t)imm);
                } else {
                    as->current_addr += 4;
                }
                return true;
            }
        } else if (rd == -2) {
            /* MOV SP, Rs */
            p += reg_len;
            p = skip_whitespace(p);
            if (*p == ',') p++;
            p = skip_whitespace(p);
            int rs = parse_register(p, &reg_len);
            if (rs < 0) {
                snprintf(as->error_msg, sizeof(as->error_msg), "Expected register");
                as->error = true;
                return false;
            }
            if (pass2) {
                emit_byte(as, OP_MOV_SP_R);
                emit_byte(as, rs);
            } else {
                as->current_addr += 2;
            }
            return true;
        } else if (sd >= 0) {
            /* MOV Seg, Rs */
            p += seg_len;
            p = skip_whitespace(p);
            if (*p == ',') p++;
            int rs = parse_register(p, &reg_len);
            if (rs < 0) {
                snprintf(as->error_msg, sizeof(as->error_msg), "Expected register");
                as->error = true;
                return false;
            }
            if (pass2) {
                emit_byte(as, OP_MOV_SR);
                emit_byte(as, (sd << 4) | rs);
            } else {
                as->current_addr += 2;
            }
            return true;
        } else if (*p == '[') {
            /* MOV [addr], Rs */
            p++;
            uint32_t addr;
            int addr_len = parse_operand(as, p, &addr, pass2);
            if (addr_len == 0 && pass2) {
                snprintf(as->error_msg, sizeof(as->error_msg), "Expected address");
                as->error = true;
                return false;
            }
            p += addr_len;
            while (*p && *p != ']') p++;
            if (*p == ']') p++;
            p = skip_whitespace(p);
            if (*p == ',') p++;
            int rs = parse_register(p, &reg_len);
            if (rs < 0) {
                snprintf(as->error_msg, sizeof(as->error_msg), "Expected register");
                as->error = true;
                return false;
            }
            if (pass2) {
                emit_byte(as, OP_ST);
                emit_byte(as, rs);
                emit_word(as, (uint16_t)addr);
            } else {
                as->current_addr += 4;
            }
            return true;
        }

        snprintf(as->error_msg, sizeof(as->error_msg), "Invalid MOV operands");
        as->error = true;
        return false;
    }

    /* XCHG Rd, Rs */
    if (strcasecmp(mnemonic, "XCHG") == 0) {
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
        int rs = parse_register(p, &reg_len);
        if (rs < 0) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected register");
            as->error = true;
            return false;
        }
        if (pass2) {
            emit_byte(as, OP_XCHG);
            emit_byte(as, (rd << 4) | rs);
        } else {
            as->current_addr += 2;
        }
        return true;
    }

    /* Special case: ADD SP, #imm16 */
    if (strcasecmp(mnemonic, "ADD") == 0) {
        int reg_len;
        int rd = parse_register(p, &reg_len);
        if (rd == -2) {  /* SP */
            p += reg_len;
            p = skip_whitespace(p);
            if (*p == ',') p++;
            p = skip_whitespace(p);
            if (*p == '#') p++;
            uint32_t imm;
            if (parse_operand(as, p, &imm, pass2) == 0 && pass2) {
                snprintf(as->error_msg, sizeof(as->error_msg), "Expected immediate");
                as->error = true;
                return false;
            }
            if (pass2) {
                emit_byte(as, OP_ADD_SP_I);
                emit_word(as, (uint16_t)imm);
            } else {
                as->current_addr += 3;
            }
            return true;
        }
    }

    /* Special case: SUB SP, #imm16 */
    if (strcasecmp(mnemonic, "SUB") == 0) {
        int reg_len;
        int rd = parse_register(p, &reg_len);
        if (rd == -2) {  /* SP */
            p += reg_len;
            p = skip_whitespace(p);
            if (*p == ',') p++;
            p = skip_whitespace(p);
            if (*p == '#') p++;
            uint32_t imm;
            if (parse_operand(as, p, &imm, pass2) == 0 && pass2) {
                snprintf(as->error_msg, sizeof(as->error_msg), "Expected immediate");
                as->error = true;
                return false;
            }
            if (pass2) {
                emit_byte(as, OP_SUB_SP_I);
                emit_word(as, (uint16_t)imm);
            } else {
                as->current_addr += 3;
            }
            return true;
        }
    }

    /* Two-operand arithmetic: ADD, ADC, SUB, SBC, AND, OR, XOR, CMP, TEST */
    if (strcasecmp(mnemonic, "ADD") == 0 || strcasecmp(mnemonic, "ADC") == 0 ||
        strcasecmp(mnemonic, "SUB") == 0 || strcasecmp(mnemonic, "SBC") == 0 ||
        strcasecmp(mnemonic, "AND") == 0 || strcasecmp(mnemonic, "OR") == 0 ||
        strcasecmp(mnemonic, "XOR") == 0 || strcasecmp(mnemonic, "CMP") == 0 ||
        strcasecmp(mnemonic, "TEST") == 0) {

        uint8_t op_rr, op_ri;
        if (strcasecmp(mnemonic, "ADD") == 0) { op_rr = OP_ADD_RR; op_ri = OP_ADD_RI; }
        else if (strcasecmp(mnemonic, "ADC") == 0) { op_rr = OP_ADC_RR; op_ri = OP_ADC_RI; }
        else if (strcasecmp(mnemonic, "SUB") == 0) { op_rr = OP_SUB_RR; op_ri = OP_SUB_RI; }
        else if (strcasecmp(mnemonic, "SBC") == 0) { op_rr = OP_SBC_RR; op_ri = OP_SBC_RI; }
        else if (strcasecmp(mnemonic, "AND") == 0) { op_rr = OP_AND_RR; op_ri = OP_AND_RI; }
        else if (strcasecmp(mnemonic, "OR") == 0) { op_rr = OP_OR_RR; op_ri = OP_OR_RI; }
        else if (strcasecmp(mnemonic, "XOR") == 0) { op_rr = OP_XOR_RR; op_ri = OP_XOR_RI; }
        else if (strcasecmp(mnemonic, "CMP") == 0) { op_rr = OP_CMP_RR; op_ri = OP_CMP_RI; }
        else { op_rr = OP_TEST_RR; op_ri = OP_TEST_RI; }

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

        int rs = parse_register(p, &reg_len);
        if (rs >= 0) {
            /* Rd, Rs */
            if (pass2) {
                emit_byte(as, op_rr);
                emit_byte(as, (rd << 4) | rs);
            } else {
                as->current_addr += 2;
            }
        } else {
            /* Rd, #imm16 */
            if (*p == '#') p++;
            uint32_t imm;
            if (parse_operand(as, p, &imm, pass2) == 0 && pass2) {
                snprintf(as->error_msg, sizeof(as->error_msg), "Expected operand");
                as->error = true;
                return false;
            }
            if (pass2) {
                emit_byte(as, op_ri);
                emit_byte(as, rd);
                emit_word(as, (uint16_t)imm);
            } else {
                as->current_addr += 4;
            }
        }
        return true;
    }

    /* Shift/Rotate: SHL, SHR, SAR, ROL, ROR, RCL, RCR */
    if (strcasecmp(mnemonic, "SHL") == 0 || strcasecmp(mnemonic, "SHR") == 0 ||
        strcasecmp(mnemonic, "SAR") == 0 || strcasecmp(mnemonic, "ROL") == 0 ||
        strcasecmp(mnemonic, "ROR") == 0 || strcasecmp(mnemonic, "RCL") == 0 ||
        strcasecmp(mnemonic, "RCR") == 0) {
        
        uint8_t opcode;
        if (strcasecmp(mnemonic, "SHL") == 0) opcode = OP_SHL;
        else if (strcasecmp(mnemonic, "SHR") == 0) opcode = OP_SHR;
        else if (strcasecmp(mnemonic, "SAR") == 0) opcode = OP_SAR;
        else if (strcasecmp(mnemonic, "ROL") == 0) opcode = OP_ROL;
        else if (strcasecmp(mnemonic, "ROR") == 0) opcode = OP_ROR;
        else if (strcasecmp(mnemonic, "RCL") == 0) opcode = OP_RCL;
        else opcode = OP_RCR;

        int reg_len;
        int rd = parse_register(p, &reg_len);
        if (rd < 0) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected register");
            as->error = true;
            return false;
        }
        p += reg_len;
        p = skip_whitespace(p);
        
        uint8_t count = 1;  /* Default shift count */
        if (*p == ',') {
            p++;
            p = skip_whitespace(p);
            if (*p == '#') p++;
            uint32_t cnt;
            if (parse_number(p, &cnt) > 0) {
                count = (uint8_t)(cnt & 0x0F);
            } else if (starts_with_ci(p, "CL") || starts_with_ci(p, "CX")) {
                count = 0;  /* Use CX as count */
            }
        }

        if (pass2) {
            emit_byte(as, opcode);
            emit_byte(as, (rd << 4) | count);
        } else {
            as->current_addr += 2;
        }
        return true;
    }

    /* MUL, IMUL, DIV, IDIV - syntax: OP Rd, Rs (or just OP Rs) */
    /* For DIV/IDIV: DX:AX / Rs -> AX=quotient, DX=remainder */
    /* For MUL/IMUL: AX * Rs -> DX:AX */
    if (strcasecmp(mnemonic, "MUL") == 0 || strcasecmp(mnemonic, "IMUL") == 0 ||
        strcasecmp(mnemonic, "DIV") == 0 || strcasecmp(mnemonic, "IDIV") == 0) {

        uint8_t opcode;
        if (strcasecmp(mnemonic, "MUL") == 0) opcode = OP_MUL;
        else if (strcasecmp(mnemonic, "IMUL") == 0) opcode = OP_IMUL;
        else if (strcasecmp(mnemonic, "DIV") == 0) opcode = OP_DIV;
        else opcode = OP_IDIV;

        int reg_len;
        int rs = parse_register(p, &reg_len);
        if (rs < 0) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected register");
            as->error = true;
            return false;
        }
        p += reg_len;
        p = skip_whitespace(p);

        /* Check for two-operand form: OP Rd, Rs (skip Rd, use Rs) */
        if (*p == ',') {
            p++;
            p = skip_whitespace(p);
            rs = parse_register(p, &reg_len);
            if (rs < 0) {
                snprintf(as->error_msg, sizeof(as->error_msg), "Expected source register");
                as->error = true;
                return false;
            }
        }

        if (pass2) {
            emit_byte(as, opcode);
            emit_byte(as, rs);
        } else {
            as->current_addr += 2;
        }
        return true;
    }

    /* ENTER size, level */
    if (strcasecmp(mnemonic, "ENTER") == 0) {
        p = skip_whitespace(p);
        uint32_t size;
        if (parse_operand(as, p, &size, pass2) == 0 && pass2) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected size");
            as->error = true;
            return false;
        }
        /* Find comma */
        while (*p && *p != ',') p++;
        if (*p == ',') p++;
        p = skip_whitespace(p);
        uint32_t level = 0;
        parse_operand(as, p, &level, pass2);

        if (pass2) {
            emit_byte(as, OP_ENTER);
            emit_word(as, (uint16_t)size);
            emit_byte(as, (uint8_t)level);
        } else {
            as->current_addr += 4;
        }
        return true;
    }

    /* RET imm16 */
    if (strcasecmp(mnemonic, "RETI") == 0) {
        p = skip_whitespace(p);
        if (*p && *p != ';') {
            uint32_t imm;
            if (parse_operand(as, p, &imm, pass2) > 0) {
                if (pass2) {
                    emit_byte(as, OP_RET_I);
                    emit_word(as, (uint16_t)imm);
                } else {
                    as->current_addr += 3;
                }
                return true;
            }
        }
        /* Plain RETI (return from interrupt) */
        if (pass2) {
            emit_byte(as, OP_IRET);
        } else {
            as->current_addr++;
        }
        return true;
    }

    /* LD Rd, [addr] or LD Rd, [Rs+offset] - Load word from memory */
    if (strcasecmp(mnemonic, "LD") == 0) {
        p = skip_whitespace(p);
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

        if (*p != '[') {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected '[' for memory operand");
            as->error = true;
            return false;
        }
        p++;  /* Skip '[' */
        p = skip_whitespace(p);

        /* Try indexed: [Rs+offset] or [Rs-offset] or [SP+offset] */
        int base_reg = parse_register(p, &reg_len);
        if (base_reg >= 0 || base_reg == -2) {
            bool use_sp = (base_reg == -2);
            p += reg_len;
            p = skip_whitespace(p);
            int16_t offset = 0;
            if (*p == '+' || *p == '-') {
                char sign = *p++;
                p = skip_whitespace(p);
                if (*p == '#') p++;
                uint32_t off_val = 0;
                parse_operand(as, p, &off_val, pass2);
                offset = (sign == '-') ? -(int16_t)off_val : (int16_t)off_val;
                while (*p && *p != ']') p++;
            }
            if (*p == ']') p++;
            if (pass2) {
                if (use_sp) {
                    emit_byte(as, OP_LD_IDX_SP);
                    emit_byte(as, rd);
                } else {
                    emit_byte(as, OP_LD_IDX);
                    emit_byte(as, (rd << 4) | base_reg);
                }
                emit_word(as, (uint16_t)offset);
            } else {
                as->current_addr += 4;
            }
            return true;
        }

        /* Direct: [addr] */
        uint32_t addr;
        parse_operand(as, p, &addr, pass2);
        while (*p && *p != ']') p++;
        if (pass2) {
            emit_byte(as, OP_LD);
            emit_byte(as, rd);
            emit_word(as, (uint16_t)addr);
        } else {
            as->current_addr += 4;
        }
        return true;
    }

    /* ST [addr], Rs or ST Rs, [addr] - Store word to memory */
    if (strcasecmp(mnemonic, "ST") == 0) {
        p = skip_whitespace(p);
        int reg_len;

        /* Check if first operand is register or [addr] */
        if (*p == '[') {
            /* ST [addr], Rs or ST [Rd+offset], Rs */
            p++;  /* Skip '[' */
            p = skip_whitespace(p);

            /* Try indexed: [Rd+offset], Rs or [SP+offset], Rs */
            int base_reg = parse_register(p, &reg_len);
            if (base_reg >= 0 || base_reg == -2) {
                bool use_sp = (base_reg == -2);
                p += reg_len;
                p = skip_whitespace(p);
                int16_t offset = 0;
                if (*p == '+' || *p == '-') {
                    char sign = *p++;
                    p = skip_whitespace(p);
                    if (*p == '#') p++;
                    uint32_t off_val = 0;
                    parse_operand(as, p, &off_val, pass2);
                    offset = (sign == '-') ? -(int16_t)off_val : (int16_t)off_val;
                    while (*p && *p != ']') p++;
                }
                if (*p == ']') p++;
                p = skip_whitespace(p);
                if (*p == ',') p++;
                p = skip_whitespace(p);
                int rs = parse_register(p, &reg_len);
                if (rs < 0) {
                    snprintf(as->error_msg, sizeof(as->error_msg), "Expected source register");
                    as->error = true;
                    return false;
                }
                if (pass2) {
                    if (use_sp) {
                        emit_byte(as, OP_ST_IDX_SP);
                        emit_byte(as, rs);
                    } else {
                        emit_byte(as, OP_ST_IDX);
                        emit_byte(as, (base_reg << 4) | rs);
                    }
                    emit_word(as, (uint16_t)offset);
                } else {
                    as->current_addr += 4;
                }
                return true;
            }

            /* Direct: [addr], Rs */
            uint32_t addr;
            parse_operand(as, p, &addr, pass2);
            while (*p && *p != ']') p++;
            if (*p == ']') p++;
            p = skip_whitespace(p);
            if (*p == ',') p++;
            p = skip_whitespace(p);
            int rs = parse_register(p, &reg_len);
            if (rs < 0) {
                snprintf(as->error_msg, sizeof(as->error_msg), "Expected source register");
                as->error = true;
                return false;
            }
            if (pass2) {
                emit_byte(as, OP_ST);
                emit_byte(as, rs);
                emit_word(as, (uint16_t)addr);
            } else {
                as->current_addr += 4;
            }
            return true;
        } else {
            /* ST Rs, [addr] - alternate syntax */
            int rs = parse_register(p, &reg_len);
            if (rs < 0) {
                snprintf(as->error_msg, sizeof(as->error_msg), "Expected register or '['");
                as->error = true;
                return false;
            }
            p += reg_len;
            p = skip_whitespace(p);
            if (*p == ',') p++;
            p = skip_whitespace(p);
            if (*p != '[') {
                snprintf(as->error_msg, sizeof(as->error_msg), "Expected '[' for memory operand");
                as->error = true;
                return false;
            }
            p++;  /* Skip '[' */
            p = skip_whitespace(p);

            /* Check for indexed addressing or SP-indexed */
            int base_reg = parse_register(p, &reg_len);
            if (base_reg >= 0 || base_reg == -2) {
                bool use_sp = (base_reg == -2);
                p += reg_len;
                p = skip_whitespace(p);
                int16_t offset = 0;
                if (*p == '+' || *p == '-') {
                    char sign = *p++;
                    p = skip_whitespace(p);
                    if (*p == '#') p++;
                    uint32_t off_val = 0;
                    parse_operand(as, p, &off_val, pass2);
                    offset = (sign == '-') ? -(int16_t)off_val : (int16_t)off_val;
                    while (*p && *p != ']') p++;
                }
                if (*p == ']') p++;
                if (pass2) {
                    if (use_sp) {
                        emit_byte(as, OP_ST_IDX_SP);
                        emit_byte(as, rs);
                    } else {
                        emit_byte(as, OP_ST_IDX);
                        emit_byte(as, (base_reg << 4) | rs);
                    }
                    emit_word(as, (uint16_t)offset);
                } else {
                    as->current_addr += 4;
                }
                return true;
            }

            uint32_t addr;
            parse_operand(as, p, &addr, pass2);
            if (pass2) {
                emit_byte(as, OP_ST);
                emit_byte(as, rs);
                emit_word(as, (uint16_t)addr);
            } else {
                as->current_addr += 4;
            }
            return true;
        }
    }

    /* LDB Rd, [addr] or LDB Rd, [Rs+offset] - Load byte from memory */
    if (strcasecmp(mnemonic, "LDB") == 0) {
        p = skip_whitespace(p);
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

        if (*p != '[') {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected '[' for memory operand");
            as->error = true;
            return false;
        }
        p++;  /* Skip '[' */
        p = skip_whitespace(p);

        /* Check for indexed: [Rs+offset] */
        int base_reg = parse_register(p, &reg_len);
        if (base_reg >= 0) {
            p += reg_len;
            p = skip_whitespace(p);
            int16_t offset = 0;
            if (*p == '+' || *p == '-') {
                char sign = *p++;
                p = skip_whitespace(p);
                if (*p == '#') p++;
                uint32_t off_val = 0;
                parse_operand(as, p, &off_val, pass2);
                offset = (sign == '-') ? -(int16_t)off_val : (int16_t)off_val;
                while (*p && *p != ']') p++;
            }
            if (*p == ']') p++;
            if (pass2) {
                emit_byte(as, OP_LDB);
                emit_byte(as, (rd << 4) | base_reg);
                emit_word(as, (uint16_t)offset);
            } else {
                as->current_addr += 4;
            }
            return true;
        }

        /* Direct: [addr] */
        uint32_t addr;
        parse_operand(as, p, &addr, pass2);
        while (*p && *p != ']') p++;
        if (pass2) {
            emit_byte(as, OP_LDB);
            emit_byte(as, rd);
            emit_word(as, (uint16_t)addr);
        } else {
            as->current_addr += 4;
        }
        return true;
    }

    /* STB [addr], Rs or STB Rs, [addr] or STB [Rd+offset], Rs - Store byte to memory */
    if (strcasecmp(mnemonic, "STB") == 0) {
        p = skip_whitespace(p);
        int reg_len;

        if (*p == '[') {
            /* STB [addr], Rs or STB [Rd+offset], Rs */
            p++;  /* Skip '[' */
            p = skip_whitespace(p);

            /* Check for indexed: [Rd+offset], Rs */
            int base_reg = parse_register(p, &reg_len);
            if (base_reg >= 0) {
                p += reg_len;
                p = skip_whitespace(p);
                int16_t offset = 0;
                if (*p == '+' || *p == '-') {
                    char sign = *p++;
                    p = skip_whitespace(p);
                    if (*p == '#') p++;
                    uint32_t off_val = 0;
                    parse_operand(as, p, &off_val, pass2);
                    offset = (sign == '-') ? -(int16_t)off_val : (int16_t)off_val;
                    while (*p && *p != ']') p++;
                }
                if (*p == ']') p++;
                p = skip_whitespace(p);
                if (*p == ',') p++;
                p = skip_whitespace(p);
                int rs = parse_register(p, &reg_len);
                if (rs < 0) {
                    snprintf(as->error_msg, sizeof(as->error_msg), "Expected source register");
                    as->error = true;
                    return false;
                }
                if (pass2) {
                    emit_byte(as, OP_STB);
                    emit_byte(as, (base_reg << 4) | rs);
                    emit_word(as, (uint16_t)offset);
                } else {
                    as->current_addr += 4;
                }
                return true;
            }

            /* Direct: [addr], Rs */
            uint32_t addr;
            parse_operand(as, p, &addr, pass2);
            while (*p && *p != ']') p++;
            if (*p == ']') p++;
            p = skip_whitespace(p);
            if (*p == ',') p++;
            p = skip_whitespace(p);
            int rs = parse_register(p, &reg_len);
            if (rs < 0) {
                snprintf(as->error_msg, sizeof(as->error_msg), "Expected source register");
                as->error = true;
                return false;
            }
            if (pass2) {
                emit_byte(as, OP_STB);
                emit_byte(as, rs);
                emit_word(as, (uint16_t)addr);
            } else {
                as->current_addr += 4;
            }
            return true;
        } else {
            /* STB Rs, [addr] or STB Rs, [Rd+offset] - alternate syntax */
            int rs = parse_register(p, &reg_len);
            if (rs < 0) {
                snprintf(as->error_msg, sizeof(as->error_msg), "Expected register or '['");
                as->error = true;
                return false;
            }
            p += reg_len;
            p = skip_whitespace(p);
            if (*p == ',') p++;
            p = skip_whitespace(p);
            if (*p != '[') {
                snprintf(as->error_msg, sizeof(as->error_msg), "Expected '[' for memory operand");
                as->error = true;
                return false;
            }
            p++;  /* Skip '[' */
            p = skip_whitespace(p);

            /* Check for indexed addressing */
            int base_reg = parse_register(p, &reg_len);
            if (base_reg >= 0) {
                p += reg_len;
                p = skip_whitespace(p);
                int16_t offset = 0;
                if (*p == '+' || *p == '-') {
                    char sign = *p++;
                    p = skip_whitespace(p);
                    if (*p == '#') p++;
                    uint32_t off_val = 0;
                    parse_operand(as, p, &off_val, pass2);
                    offset = (sign == '-') ? -(int16_t)off_val : (int16_t)off_val;
                    while (*p && *p != ']') p++;
                }
                if (*p == ']') p++;
                if (pass2) {
                    emit_byte(as, OP_STB);
                    emit_byte(as, (base_reg << 4) | rs);
                    emit_word(as, (uint16_t)offset);
                } else {
                    as->current_addr += 4;
                }
                return true;
            }

            uint32_t addr;
            parse_operand(as, p, &addr, pass2);
            if (pass2) {
                emit_byte(as, OP_STB);
                emit_byte(as, rs);
                emit_word(as, (uint16_t)addr);
            } else {
                as->current_addr += 4;
            }
            return true;
        }
    }

    /* LEA Rd, [addr] or LEA Rd, [Rs+offset] - Load effective address */
    if (strcasecmp(mnemonic, "LEA") == 0) {
        p = skip_whitespace(p);
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

        if (*p != '[') {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected '[' for address operand");
            as->error = true;
            return false;
        }
        p++;  /* Skip '[' */
        p = skip_whitespace(p);

        /* Check for indexed: [Rs+offset] */
        int base_reg = parse_register(p, &reg_len);
        if (base_reg >= 0) {
            /* LEA Rd, [Rs+offset] - compute effective address at assembly time */
            p += reg_len;
            p = skip_whitespace(p);
            int16_t offset = 0;
            if (*p == '+' || *p == '-') {
                char sign = *p++;
                p = skip_whitespace(p);
                if (*p == '#') p++;
                uint32_t off_val = 0;
                parse_operand(as, p, &off_val, pass2);
                offset = (sign == '-') ? -(int16_t)off_val : (int16_t)off_val;
                while (*p && *p != ']') p++;
            }
            if (*p == ']') p++;
            /* For LEA with register base, we store as indexed load address */
            if (pass2) {
                emit_byte(as, OP_LEA);
                emit_byte(as, (rd << 4) | base_reg);
                emit_word(as, (uint16_t)offset);
            } else {
                as->current_addr += 4;
            }
            return true;
        }

        /* Direct: [addr] */
        uint32_t addr;
        parse_operand(as, p, &addr, pass2);
        while (*p && *p != ']') p++;
        if (pass2) {
            emit_byte(as, OP_LEA);
            emit_byte(as, rd);
            emit_word(as, (uint16_t)addr);
        } else {
            as->current_addr += 4;
        }
        return true;
    }

    /* LDS Rd, [addr] - Load far pointer with DS */
    if (strcasecmp(mnemonic, "LDS") == 0) {
        p = skip_whitespace(p);
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

        if (*p != '[') {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected '[' for address operand");
            as->error = true;
            return false;
        }
        p++;  /* Skip '[' */
        p = skip_whitespace(p);
        uint32_t addr;
        parse_operand(as, p, &addr, pass2);
        while (*p && *p != ']') p++;
        if (pass2) {
            emit_byte(as, OP_LDS);
            emit_byte(as, rd);
            emit_word(as, (uint16_t)addr);
        } else {
            as->current_addr += 4;
        }
        return true;
    }

    /* LES Rd, [addr] - Load far pointer with ES */
    if (strcasecmp(mnemonic, "LES") == 0) {
        p = skip_whitespace(p);
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

        if (*p != '[') {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected '[' for address operand");
            as->error = true;
            return false;
        }
        p++;  /* Skip '[' */
        p = skip_whitespace(p);
        uint32_t addr;
        parse_operand(as, p, &addr, pass2);
        while (*p && *p != ']') p++;
        if (pass2) {
            emit_byte(as, OP_LES);
            emit_byte(as, rd);
            emit_word(as, (uint16_t)addr);
        } else {
            as->current_addr += 4;
        }
        return true;
    }

    /* IN Rd, port */
    if (strcasecmp(mnemonic, "IN") == 0) {
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
        uint32_t port;
        if (parse_operand(as, p, &port, pass2) == 0 && pass2) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected port number");
            as->error = true;
            return false;
        }
        if (pass2) {
            emit_byte(as, OP_IN);
            emit_byte(as, rd);
            emit_word(as, (uint16_t)port);
        } else {
            as->current_addr += 4;
        }
        return true;
    }

    /* OUT port, Rs */
    if (strcasecmp(mnemonic, "OUT") == 0) {
        p = skip_whitespace(p);
        uint32_t port;
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
            emit_byte(as, OP_OUT);
            emit_byte(as, rs);
            emit_word(as, (uint16_t)port);
        } else {
            as->current_addr += 4;
        }
        return true;
    }

    /* INB Rd, port - Input byte */
    if (strcasecmp(mnemonic, "INB") == 0) {
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
        uint32_t port;
        if (parse_operand(as, p, &port, pass2) == 0 && pass2) {
            snprintf(as->error_msg, sizeof(as->error_msg), "Expected port number");
            as->error = true;
            return false;
        }
        if (pass2) {
            emit_byte(as, OP_INB);
            emit_byte(as, rd);
            emit_word(as, (uint16_t)port);
        } else {
            as->current_addr += 4;
        }
        return true;
    }

    /* OUTB port, Rs - Output byte */
    if (strcasecmp(mnemonic, "OUTB") == 0) {
        p = skip_whitespace(p);
        uint32_t port;
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
            emit_byte(as, OP_OUTB);
            emit_byte(as, rs);
            emit_word(as, (uint16_t)port);
        } else {
            as->current_addr += 4;
        }
        return true;
    }

    /* PUSH - check for segment register first */
    if (strcasecmp(mnemonic, "PUSH") == 0) {
        p = skip_whitespace(p);
        int seg_len;
        int seg = parse_segment(p, &seg_len);
        if (seg >= 0) {
            /* PUSH Seg */
            if (pass2) {
                emit_byte(as, OP_PUSH_S);
                emit_byte(as, seg);
            } else {
                as->current_addr += 2;
            }
            return true;
        }
        /* Fall through to instruction table for PUSH Rd */
    }

    /* POP - check for segment register first */
    if (strcasecmp(mnemonic, "POP") == 0) {
        p = skip_whitespace(p);
        int seg_len;
        int seg = parse_segment(p, &seg_len);
        if (seg >= 0) {
            /* POP Seg */
            if (pass2) {
                emit_byte(as, OP_POP_S);
                emit_byte(as, seg);
            } else {
                as->current_addr += 2;
            }
            return true;
        }
        /* Fall through to instruction table for POP Rd */
    }

    /* JMP - check for indirect (register) operand */
    if (strcasecmp(mnemonic, "JMP") == 0) {
        p = skip_whitespace(p);
        int reg_len;
        int rd = parse_register(p, &reg_len);
        if (rd >= 0) {
            /* JMP Rd - indirect jump */
            if (pass2) {
                emit_byte(as, OP_JMP_R);
                emit_byte(as, rd);
            } else {
                as->current_addr += 2;
            }
            return true;
        }
        /* Fall through to instruction table for JMP addr */
    }

    /* CALL - check for indirect (register) operand */
    if (strcasecmp(mnemonic, "CALL") == 0) {
        p = skip_whitespace(p);
        int reg_len;
        int rd = parse_register(p, &reg_len);
        if (rd >= 0) {
            /* CALL Rd - indirect call */
            if (pass2) {
                emit_byte(as, OP_CALL_R);
                emit_byte(as, rd);
            } else {
                as->current_addr += 2;
            }
            return true;
        }
        /* Fall through to instruction table for CALL addr */
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
                emit_byte(as, instr->base_opcode);
                emit_byte(as, rd);
            } else {
                as->current_addr += 2;
            }
            break;
        }

        case INSTR_ADDR16: {
            p = skip_whitespace(p);
            uint32_t addr;
            if (parse_operand(as, p, &addr, pass2) == 0 && pass2) {
                snprintf(as->error_msg, sizeof(as->error_msg),
                         "Expected address");
                as->error = true;
                return false;
            }
            if (pass2) {
                emit_byte(as, instr->base_opcode);
                emit_word(as, (uint16_t)addr);
            } else {
                as->current_addr += 3;
            }
            break;
        }

        case INSTR_REL8: {
            p = skip_whitespace(p);
            uint32_t target;
            if (parse_operand(as, p, &target, pass2) == 0 && pass2) {
                snprintf(as->error_msg, sizeof(as->error_msg),
                         "Expected label or offset");
                as->error = true;
                return false;
            }

            if (pass2) {
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
    return as->max_addr - as->origin + 1;
}

uint32_t asm_get_origin(const Assembler *as) {
    return as->origin;
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
        printf("  %s = 0x%05X\n", as->labels[i].name, as->labels[i].address);
    }
    printf("=== Equates (%d) ===\n", as->equate_count);
    for (int i = 0; i < as->equate_count; i++) {
        printf("  %s = 0x%05X\n", as->equates[i].name, as->equates[i].value);
    }
}

/* Debug: dump output */
void asm_dump_output(const Assembler *as) {
    printf("=== Output (%d bytes, origin 0x%05X) ===\n",
           as->bytes_generated, as->origin);
    for (uint32_t i = as->origin; i <= as->max_addr; i += 16) {
        printf("0x%05X: ", i);
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

/* Write output to Intel HEX file */
bool asm_write_hex(const Assembler *as, const char *filename) {
    FILE *f = fopen(filename, "w");
    if (!f) {
        return false;
    }

    uint32_t addr = as->origin;
    while (addr <= as->max_addr) {
        /* Calculate bytes for this record (max 16) */
        int count = 16;
        if (addr + count > as->max_addr + 1) {
            count = as->max_addr + 1 - addr;
        }

        /* Record type 00 = data */
        uint8_t checksum = count + (addr >> 8) + (addr & 0xFF) + 0x00;
        fprintf(f, ":%02X%04X00", count, (uint16_t)addr);

        for (int i = 0; i < count; i++) {
            fprintf(f, "%02X", as->output[addr + i]);
            checksum += as->output[addr + i];
        }

        checksum = (~checksum) + 1;
        fprintf(f, "%02X\n", checksum);

        addr += count;
    }

    /* End-of-file record */
    fprintf(f, ":00000001FF\n");
    fclose(f);

    return true;
}
