/*
 * Micro4 Assembler - Implementation
 *
 * Two-pass assembler
 */

#define _GNU_SOURCE
#include "assembler.h"
#include "cpu.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <ctype.h>

/* Initialize assembler */
void asm_init(Assembler *as) {
    memset(as, 0, sizeof(Assembler));
    as->origin = 0;
    as->current_addr = 0;
}

/* Helper: Skip whitespace */
static char* skip_whitespace(char *s) {
    while (*s && isspace(*s)) s++;
    return s;
}

/* Helper: Check if string starts with (case insensitive) */
static bool starts_with_ci(const char *str, const char *prefix) {
    while (*prefix) {
        if (toupper(*str) != toupper(*prefix)) return false;
        str++;
        prefix++;
    }
    return true;
}

/* Helper: Parse number (hex or decimal) */
static int parse_number(const char *s, uint16_t *value) {
    char *end;
    if (s[0] == '0' && (s[1] == 'x' || s[1] == 'X')) {
        *value = (uint16_t)strtol(s, &end, 16);
    } else {
        *value = (uint16_t)strtol(s, &end, 10);
    }
    return (end != s) ? (end - s) : 0;
}

/* Helper: Look up label */
static int find_label(Assembler *as, const char *name) {
    for (int i = 0; i < as->label_count; i++) {
        if (strcasecmp(as->labels[i].name, name) == 0) {
            return as->labels[i].address;
        }
    }
    return -1;
}

/* Helper: Add label */
static bool add_label(Assembler *as, const char *name, uint8_t addr) {
    if (as->label_count >= MAX_LABELS) {
        snprintf(as->error_msg, sizeof(as->error_msg), "Too many labels");
        as->error = true;
        return false;
    }

    /* Check for duplicate */
    if (find_label(as, name) >= 0) {
        snprintf(as->error_msg, sizeof(as->error_msg),
                 "Duplicate label: %s", name);
        as->error = true;
        return false;
    }

    strncpy(as->labels[as->label_count].name, name, MAX_LABEL_LEN - 1);
    as->labels[as->label_count].address = addr;
    as->label_count++;
    return true;
}

/* Helper: Emit a nibble */
static void emit_nibble(Assembler *as, uint8_t value) {
    if (as->current_addr < MAX_OUTPUT) {
        as->output[as->current_addr] = value & 0x0F;
        if (as->current_addr > as->max_addr) {
            as->max_addr = as->current_addr;
        }
        as->current_addr++;
        as->bytes_generated++;
    }
}

/* Helper: Emit a byte (two nibbles: high then low) */
static void emit_byte(Assembler *as, uint8_t value) {
    emit_nibble(as, (value >> 4) & 0x0F);
    emit_nibble(as, value & 0x0F);
}

/* Parse operand - returns address or immediate value */
static int parse_operand(Assembler *as, char *s, uint16_t *value, bool pass2) {
    s = skip_whitespace(s);

    /* Try as number first */
    int len = parse_number(s, value);
    if (len > 0) {
        return len;
    }

    /* Try as label */
    char label[MAX_LABEL_LEN];
    int i = 0;
    while (s[i] && (isalnum(s[i]) || s[i] == '_') && i < MAX_LABEL_LEN - 1) {
        label[i] = s[i];
        i++;
    }
    label[i] = '\0';

    if (i > 0) {
        int addr = find_label(as, label);
        if (addr >= 0) {
            *value = (uint16_t)addr;
            return i;
        } else if (pass2) {
            snprintf(as->error_msg, sizeof(as->error_msg),
                     "Undefined label: %s", label);
            as->error = true;
            return 0;
        }
        /* Pass 1: assume it will be defined later */
        *value = 0;
        return i;
    }

    return 0;
}

/* Process a single line */
static bool process_line(Assembler *as, char *line, bool pass2) {
    char *p = skip_whitespace(line);

    /* Skip empty lines and comments */
    if (*p == '\0' || *p == ';') {
        return true;
    }

    /* Check for label (ends with :) */
    char *colon = strchr(p, ':');
    if (colon && (colon == p || isalnum(colon[-1]) || colon[-1] == '_')) {
        /* Extract label */
        char label[MAX_LABEL_LEN];
        int len = colon - p;
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

    /* Parse directive or instruction */
    uint16_t value;

    /* ORG directive */
    if (starts_with_ci(p, "ORG")) {
        p = skip_whitespace(p + 3);
        if (parse_number(p, &value) > 0) {
            as->origin = (uint8_t)value;
            as->current_addr = (uint8_t)value;
        } else {
            snprintf(as->error_msg, sizeof(as->error_msg),
                     "Invalid ORG operand");
            as->error = true;
            return false;
        }
        return true;
    }

    /* DB directive (define byte) */
    if (starts_with_ci(p, "DB")) {
        p = skip_whitespace(p + 2);
        while (*p && *p != ';') {
            int len = parse_number(p, &value);
            if (len > 0) {
                if (pass2) {
                    emit_nibble(as, (uint8_t)value);
                } else {
                    as->current_addr++;
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

    /* Instructions */
    uint8_t opcode = 0xFF;
    bool needs_addr = false;
    bool is_immediate = false;

    if (starts_with_ci(p, "HLT")) {
        opcode = OP_HLT;
        p += 3;
    } else if (starts_with_ci(p, "LDA")) {
        opcode = OP_LDA;
        needs_addr = true;
        p += 3;
    } else if (starts_with_ci(p, "STA")) {
        opcode = OP_STA;
        needs_addr = true;
        p += 3;
    } else if (starts_with_ci(p, "ADD")) {
        opcode = OP_ADD;
        needs_addr = true;
        p += 3;
    } else if (starts_with_ci(p, "SUB")) {
        opcode = OP_SUB;
        needs_addr = true;
        p += 3;
    } else if (starts_with_ci(p, "JMP")) {
        opcode = OP_JMP;
        needs_addr = true;
        p += 3;
    } else if (starts_with_ci(p, "JZ")) {
        opcode = OP_JZ;
        needs_addr = true;
        p += 2;
    } else if (starts_with_ci(p, "LDI")) {
        opcode = OP_LDI;
        is_immediate = true;
        p += 3;
    } else if (starts_with_ci(p, "AND")) {
        opcode = OP_AND;
        needs_addr = true;
        p += 3;
    } else if (starts_with_ci(p, "XOR")) {
        opcode = OP_XOR;
        needs_addr = true;
        p += 3;
    } else if (starts_with_ci(p, "OR")) {
        opcode = OP_OR;
        needs_addr = true;
        p += 2;
    } else if (starts_with_ci(p, "NOT")) {
        opcode = OP_NOT;
        p += 3;
    } else if (starts_with_ci(p, "SHL")) {
        opcode = OP_SHL;
        p += 3;
    } else if (starts_with_ci(p, "SHR")) {
        opcode = OP_SHR;
        p += 3;
    } else if (starts_with_ci(p, "INC")) {
        opcode = OP_INC;
        p += 3;
    } else if (starts_with_ci(p, "DEC")) {
        opcode = OP_DEC;
        p += 3;
    }

    if (opcode == 0xFF) {
        /* Check if line is just whitespace */
        p = skip_whitespace(p);
        if (*p == '\0') return true;

        snprintf(as->error_msg, sizeof(as->error_msg),
                 "Unknown instruction: %.20s", line);
        as->error = true;
        return false;
    }

    /* Parse operand if needed */
    value = 0;
    if (needs_addr || is_immediate) {
        p = skip_whitespace(p);
        if (parse_operand(as, p, &value, pass2) == 0 && pass2) {
            if (!as->error) {
                snprintf(as->error_msg, sizeof(as->error_msg),
                         "Expected operand");
                as->error = true;
            }
            return false;
        }
    }

    /* Emit instruction */
    if (pass2) {
        if (is_immediate) {
            /* LDI: opcode in high nibble, immediate in low nibble */
            emit_byte(as, (opcode << 4) | (value & 0x0F));
        } else if (needs_addr) {
            /* Two-byte instruction */
            emit_byte(as, (opcode << 4));
            emit_byte(as, (uint8_t)value);
        } else {
            /* One-byte instruction (HLT) */
            emit_byte(as, (opcode << 4));
        }
    } else {
        /* Pass 1: just count bytes */
        if (is_immediate) {
            as->current_addr += 2;  /* 1 byte = 2 nibbles */
        } else if (needs_addr) {
            as->current_addr += 4;  /* 2 bytes = 4 nibbles */
        } else {
            as->current_addr += 2;  /* 1 byte = 2 nibbles */
        }
    }

    return true;
}

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

    /* Pass 1: Collect labels */
    char *line = strtok(src_copy, "\n");
    int line_num = 1;

    while (line != NULL) {
        if (!process_line(as, line, false)) {
            as->error_line = line_num;
            free(src_copy);
            return false;
        }
        line = strtok(NULL, "\n");
        line_num++;
    }

    /* Reset for pass 2 */
    as->current_addr = as->origin;
    as->max_addr = 0;
    as->bytes_generated = 0;

    /* Pass 2: Generate code */
    free(src_copy);
    src_copy = strdup(source);
    if (!src_copy) {
        snprintf(as->error_msg, sizeof(as->error_msg), "Out of memory");
        as->error = true;
        return false;
    }

    line = strtok(src_copy, "\n");
    line_num = 1;

    while (line != NULL) {
        if (!process_line(as, line, true)) {
            as->error_line = line_num;
            free(src_copy);
            return false;
        }
        as->lines_processed++;
        line = strtok(NULL, "\n");
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
        printf("  %s = 0x%02X\n", as->labels[i].name, as->labels[i].address);
    }
}

/* Debug: dump output */
void asm_dump_output(const Assembler *as) {
    printf("=== Output (%d nibbles) ===\n", as->max_addr + 1);
    for (int i = 0; i <= as->max_addr; i += 16) {
        printf("0x%02X: ", i);
        for (int j = 0; j < 16 && (i + j) <= as->max_addr; j++) {
            printf("%X ", as->output[i + j]);
        }
        printf("\n");
    }
}
