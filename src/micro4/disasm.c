/*
 * Micro4 Standalone Disassembler
 *
 * Disassembles Micro4 binary files or hex dumps into readable assembly.
 * Supports automatic label generation for jump targets.
 *
 * Usage:
 *   disasm <file.bin>       - Disassemble binary file
 *   disasm -x <file.hex>    - Disassemble hex dump file
 *   disasm -h               - Show help
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <stdbool.h>
#include <ctype.h>

/* Memory size: 256 nibbles */
#define MEM_SIZE 256

/* Opcodes */
#define OP_HLT  0x0
#define OP_LDA  0x1
#define OP_STA  0x2
#define OP_ADD  0x3
#define OP_SUB  0x4
#define OP_JMP  0x5
#define OP_JZ   0x6
#define OP_LDI  0x7

/* Instruction names */
static const char* OPCODE_NAMES[] = {
    "HLT", "LDA", "STA", "ADD", "SUB", "JMP", "JZ", "LDI",
    "???", "???", "???", "???", "???", "???", "???", "???"
};

/* Jump target tracking */
#define MAX_LABELS 128
static uint8_t jump_targets[MAX_LABELS];
static int jump_target_count = 0;

/* Memory buffer (nibbles) */
static uint8_t memory[MEM_SIZE];
static int mem_size = 0;

/*
 * Add a jump target if not already present
 */
static void add_jump_target(uint8_t addr) {
    for (int i = 0; i < jump_target_count; i++) {
        if (jump_targets[i] == addr) return;
    }
    if (jump_target_count < MAX_LABELS) {
        jump_targets[jump_target_count++] = addr;
    }
}

/*
 * Check if address is a jump target
 */
static bool is_jump_target(uint8_t addr) {
    for (int i = 0; i < jump_target_count; i++) {
        if (jump_targets[i] == addr) return true;
    }
    return false;
}

/*
 * Generate label name for address
 */
static void get_label_name(uint8_t addr, char *buf, size_t bufsize) {
    snprintf(buf, bufsize, "L_%02X", addr);
}

/*
 * Load binary file into memory
 * Binary format: raw bytes, each byte becomes two nibbles
 */
static int load_binary(const char *filename) {
    FILE *f = fopen(filename, "rb");
    if (!f) {
        fprintf(stderr, "Error: cannot open file '%s'\n", filename);
        return -1;
    }

    /* Read bytes and split into nibbles */
    int byte;
    mem_size = 0;
    while ((byte = fgetc(f)) != EOF && mem_size < MEM_SIZE - 1) {
        memory[mem_size++] = (byte >> 4) & 0x0F;  /* High nibble */
        memory[mem_size++] = byte & 0x0F;          /* Low nibble */
    }

    fclose(f);
    return mem_size;
}

/*
 * Load hex dump file into memory
 * Hex format: space/newline separated hex values (e.g., "1 0 2 0 3 0 0 0")
 * Each value is a single nibble (0-F)
 */
static int load_hex(const char *filename) {
    FILE *f = fopen(filename, "r");
    if (!f) {
        fprintf(stderr, "Error: cannot open file '%s'\n", filename);
        return -1;
    }

    mem_size = 0;
    char line[1024];

    while (fgets(line, sizeof(line), f) && mem_size < MEM_SIZE) {
        char *p = line;
        while (*p && mem_size < MEM_SIZE) {
            /* Skip whitespace and punctuation */
            while (*p && (isspace(*p) || *p == ',' || *p == ':')) p++;
            if (!*p) break;

            /* Skip comments */
            if (*p == ';' || *p == '#') break;

            /* Parse hex value */
            if (isxdigit(*p)) {
                unsigned int val;
                if (sscanf(p, "%x", &val) == 1) {
                    /* If value > 0xF, treat as byte and split */
                    if (val > 0xF) {
                        memory[mem_size++] = (val >> 4) & 0x0F;
                        if (mem_size < MEM_SIZE) {
                            memory[mem_size++] = val & 0x0F;
                        }
                    } else {
                        memory[mem_size++] = val & 0x0F;
                    }
                }
                /* Skip past the hex digits */
                while (*p && isxdigit(*p)) p++;
            } else {
                p++;
            }
        }
    }

    fclose(f);
    return mem_size;
}

/*
 * First pass: identify all jump targets
 */
static void find_jump_targets(void) {
    jump_target_count = 0;
    int addr = 0;

    while (addr < mem_size - 1) {
        /* Read opcode byte (two nibbles) */
        uint8_t opcode_byte = (memory[addr] << 4) | memory[addr + 1];
        uint8_t opcode = (opcode_byte >> 4) & 0x0F;

        /* Check instruction type */
        if (opcode == OP_HLT || opcode == OP_LDI || opcode > OP_LDI) {
            /* 1-byte instruction or unknown */
            addr += 2;
        } else if (opcode >= OP_LDA && opcode <= OP_JZ) {
            /* 2-byte instruction - has address operand */
            if (addr + 3 < mem_size) {
                uint8_t operand = (memory[addr + 2] << 4) | memory[addr + 3];

                /* Track jump targets */
                if (opcode == OP_JMP || opcode == OP_JZ) {
                    add_jump_target(operand);
                }
            }
            addr += 4;
        } else {
            /* Unknown, skip one byte */
            addr += 2;
        }
    }
}

/*
 * Get instruction comment based on opcode
 */
static const char* get_comment(uint8_t opcode) {
    switch (opcode) {
        case OP_HLT: return "Halt execution";
        case OP_LDA: return "Load accumulator from memory";
        case OP_STA: return "Store accumulator to memory";
        case OP_ADD: return "Add memory to accumulator";
        case OP_SUB: return "Subtract memory from accumulator";
        case OP_JMP: return "Unconditional jump";
        case OP_JZ:  return "Jump if zero flag set";
        case OP_LDI: return "Load immediate value";
        default:     return "Unknown instruction";
    }
}

/*
 * Disassemble and output
 */
static void disassemble(bool show_comments, bool show_hex) {
    printf("; Micro4 Disassembly\n");
    printf("; Generated by micro4-disasm\n");
    printf("; Total size: %d nibbles (%d bytes)\n", mem_size, mem_size / 2);
    printf(";\n\n");

    int addr = 0;
    char label_buf[32];

    while (addr < mem_size - 1) {
        /* Check for label at this address */
        if (is_jump_target(addr)) {
            get_label_name(addr, label_buf, sizeof(label_buf));
            printf("\n%s:\n", label_buf);
        }

        /* Read opcode byte */
        uint8_t opcode_byte = (memory[addr] << 4) | memory[addr + 1];
        uint8_t opcode = (opcode_byte >> 4) & 0x0F;
        uint8_t imm = opcode_byte & 0x0F;

        /* Output address */
        printf("  ");

        if (show_hex) {
            printf("[%02X] ", addr);
        }

        /* Disassemble based on opcode */
        if (opcode == OP_HLT) {
            /* HLT - 1 byte */
            if (show_hex) printf("%02X       ", opcode_byte);
            printf("%-8s", "HLT");
            if (show_comments) printf("        ; %s", get_comment(opcode));
            printf("\n");
            addr += 2;
        }
        else if (opcode == OP_LDI) {
            /* LDI n - 1 byte with immediate */
            if (show_hex) printf("%02X       ", opcode_byte);
            printf("LDI     %d", imm);
            if (show_comments) printf("     ; %s (A = %d)", get_comment(opcode), imm);
            printf("\n");
            addr += 2;
        }
        else if (opcode >= OP_LDA && opcode <= OP_JZ) {
            /* 2-byte instruction */
            if (addr + 3 < mem_size) {
                uint8_t operand = (memory[addr + 2] << 4) | memory[addr + 3];

                if (show_hex) printf("%02X %02X    ", opcode_byte, operand);

                /* Use label for jump targets */
                if ((opcode == OP_JMP || opcode == OP_JZ) && is_jump_target(operand)) {
                    get_label_name(operand, label_buf, sizeof(label_buf));
                    printf("%-8s%s", OPCODE_NAMES[opcode], label_buf);
                } else {
                    printf("%-8s0x%02X", OPCODE_NAMES[opcode], operand);
                }

                if (show_comments) printf("   ; %s", get_comment(opcode));
                printf("\n");
                addr += 4;
            } else {
                /* Incomplete instruction at end */
                if (show_hex) printf("%02X       ", opcode_byte);
                printf("%-8s???", OPCODE_NAMES[opcode]);
                if (show_comments) printf("      ; Incomplete instruction");
                printf("\n");
                addr += 2;
            }
        }
        else if (opcode > OP_LDI) {
            /* Unknown opcode - treat as data */
            if (show_hex) printf("%02X       ", opcode_byte);
            printf("DB      0x%02X", opcode_byte);
            if (show_comments) printf("   ; Unknown opcode 0x%X", opcode);
            printf("\n");
            addr += 2;
        }
        else {
            /* Fallback - data byte */
            if (show_hex) printf("%02X       ", opcode_byte);
            printf("DB      0x%02X", opcode_byte);
            printf("\n");
            addr += 2;
        }
    }

    /* Handle odd trailing nibble */
    if (addr == mem_size - 1) {
        printf("  ");
        if (show_hex) printf("[%02X] ", addr);
        printf("DB      0x%X", memory[addr] & 0x0F);
        if (show_comments) printf("     ; Trailing nibble");
        printf("\n");
    }
}

/*
 * Print usage information
 */
static void print_usage(const char *prog) {
    printf("Micro4 Disassembler v1.0\n");
    printf("========================\n\n");
    printf("Usage:\n");
    printf("  %s [options] <file>\n\n", prog);
    printf("Options:\n");
    printf("  -x           Input is hex dump (default: binary)\n");
    printf("  -c           Show comments for instructions\n");
    printf("  -a           Show hex addresses and bytes\n");
    printf("  -l           Suppress label generation for jump targets\n");
    printf("  -r <start>   Start disassembly at address (hex)\n");
    printf("  -s <count>   Disassemble only <count> bytes\n");
    printf("  -h, --help   Show this help\n\n");
    printf("Input formats:\n");
    printf("  Binary: Raw bytes, each byte becomes two nibbles\n");
    printf("  Hex:    Space/newline separated hex values (nibbles or bytes)\n\n");
    printf("Examples:\n");
    printf("  %s program.bin              Disassemble binary file\n", prog);
    printf("  %s -x program.hex           Disassemble hex dump\n", prog);
    printf("  %s -c -a program.bin        With comments and addresses\n", prog);
    printf("  %s -r 10 -s 20 program.bin  Disassemble 20 bytes from 0x10\n", prog);
}

/*
 * Main entry point
 */
int main(int argc, char *argv[]) {
    const char *filename = NULL;
    bool hex_input = false;
    bool show_comments = false;
    bool show_hex = false;
    bool gen_labels = true;
    int start_addr = 0;
    int byte_count = -1;

    /* Parse arguments */
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0) {
            print_usage(argv[0]);
            return 0;
        }
        else if (strcmp(argv[i], "-x") == 0) {
            hex_input = true;
        }
        else if (strcmp(argv[i], "-c") == 0) {
            show_comments = true;
        }
        else if (strcmp(argv[i], "-a") == 0) {
            show_hex = true;
        }
        else if (strcmp(argv[i], "-l") == 0) {
            gen_labels = false;
        }
        else if (strcmp(argv[i], "-r") == 0 && i + 1 < argc) {
            start_addr = (int)strtol(argv[++i], NULL, 16);
        }
        else if (strcmp(argv[i], "-s") == 0 && i + 1 < argc) {
            byte_count = (int)strtol(argv[++i], NULL, 10);
        }
        else if (argv[i][0] != '-') {
            filename = argv[i];
        }
        else {
            fprintf(stderr, "Unknown option: %s\n", argv[i]);
            return 1;
        }
    }

    if (!filename) {
        fprintf(stderr, "Error: no input file specified\n\n");
        print_usage(argv[0]);
        return 1;
    }

    /* Load file */
    int loaded;
    if (hex_input) {
        loaded = load_hex(filename);
    } else {
        loaded = load_binary(filename);
    }

    if (loaded < 0) {
        return 1;
    }

    if (loaded == 0) {
        fprintf(stderr, "Error: file is empty or could not be parsed\n");
        return 1;
    }

    /* Apply start address offset */
    if (start_addr > 0 && start_addr < mem_size) {
        memmove(memory, memory + start_addr, mem_size - start_addr);
        mem_size -= start_addr;
    }

    /* Apply byte count limit */
    if (byte_count > 0 && byte_count * 2 < mem_size) {
        mem_size = byte_count * 2;
    }

    /* First pass: find jump targets */
    if (gen_labels) {
        find_jump_targets();
    }

    /* Second pass: disassemble */
    disassemble(show_comments, show_hex);

    return 0;
}
