/*
 * Micro8 Standalone Disassembler
 *
 * Disassembles Micro8 binary files into readable assembly.
 * Supports all ~80 instructions with 8 addressing modes.
 * Handles variable-length instructions (1-4 bytes).
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

/* Memory size: 64KB */
#define MEM_SIZE 65536

/* Maximum labels for jump targets */
#define MAX_LABELS 4096

/* Register names */
static const char *REG_NAMES[] = {
    "R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7"
};

/* Register pair names */
static const char *REG_PAIR_NAMES[] = {
    "HL", "BC", "DE", "SP"
};

/* Jump target tracking */
static uint16_t jump_targets[MAX_LABELS];
static int jump_target_count = 0;

/* Memory buffer */
static uint8_t memory[MEM_SIZE];
static int mem_size = 0;
static uint16_t base_address = 0x0200;  /* Default start address */

/*
 * Instruction length table
 * Returns the byte length for each opcode
 */
static int get_instruction_length(uint8_t opcode) {
    /* NOP, HLT */
    if (opcode == 0x00 || opcode == 0x01) return 1;

    /* MOV Rd, Rs (0x40-0x7F when bits[7:6]=01) */
    if ((opcode & 0xC0) == 0x40) return 1;

    /* LDI Rd, #imm (0x06-0x0D) */
    if (opcode >= 0x06 && opcode <= 0x0D) return 2;

    /* LD Rd, [addr] (0x0E-0x15) */
    if (opcode >= 0x0E && opcode <= 0x15) return 3;

    /* LDZ Rd, [zp] (0x16-0x1D) */
    if (opcode >= 0x16 && opcode <= 0x1D) return 2;

    /* ST Rd, [addr] (0x1E-0x25) */
    if (opcode >= 0x1E && opcode <= 0x25) return 3;

    /* STZ Rd, [zp] (0x26-0x2D) */
    if (opcode >= 0x26 && opcode <= 0x2D) return 2;

    /* LD Rd, [HL] (0x2E) */
    if (opcode == 0x2E) return 1;

    /* ST Rd, [HL] (0x2F) */
    if (opcode == 0x2F) return 1;

    /* LD Rd, [HL+d] (0x30) */
    if (opcode == 0x30) return 2;

    /* ST Rd, [HL+d] (0x31) */
    if (opcode == 0x31) return 2;

    /* LDI16 HL, #imm16 (0x32) */
    if (opcode == 0x32) return 3;

    /* LDI16 BC, #imm16 (0x33) */
    if (opcode == 0x33) return 3;

    /* LDI16 DE, #imm16 (0x34) */
    if (opcode == 0x34) return 3;

    /* LDI16 SP, #imm16 (0x35) */
    if (opcode == 0x35) return 3;

    /* MOV16 HL, SP (0x36) */
    if (opcode == 0x36) return 1;

    /* MOV16 SP, HL (0x37) */
    if (opcode == 0x37) return 1;

    /* ANDI Rd, #imm (0x38) */
    if (opcode == 0x38) return 2;

    /* ORI Rd, #imm (0x39) */
    if (opcode == 0x39) return 2;

    /* XORI Rd, #imm (0x3A) */
    if (opcode == 0x3A) return 2;

    /* SHL, SHR, SAR, ROL, ROR (0x3B-0x3F) */
    if (opcode >= 0x3B && opcode <= 0x3F) return 1;

    /* ADD Rd, Rs (0x40-0x47) - Note: conflicts with MOV encoding */
    /* ADC Rd, Rs (0x48-0x4F) */
    /* SUB Rd, Rs (0x50-0x57) */
    /* SBC Rd, Rs (0x58-0x5F) */
    /* These are all covered by MOV encoding check above */

    /* ADDI Rd, #imm (0x60-0x67) */
    if (opcode >= 0x60 && opcode <= 0x67) return 2;

    /* SUBI Rd, #imm (0x68-0x6F) */
    if (opcode >= 0x68 && opcode <= 0x6F) return 2;

    /* INC Rd (0x70-0x77) */
    if (opcode >= 0x70 && opcode <= 0x77) return 1;

    /* DEC Rd (0x78-0x7F) */
    if (opcode >= 0x78 && opcode <= 0x7F) return 1;

    /* CMP Rd, Rs (0x80-0x87) */
    if (opcode >= 0x80 && opcode <= 0x87) return 1;

    /* CMPI Rd, #imm (0x88-0x8F) */
    if (opcode >= 0x88 && opcode <= 0x8F) return 2;

    /* INC16 HL (0x90), DEC16 HL (0x91) */
    if (opcode == 0x90 || opcode == 0x91) return 1;

    /* INC16 BC (0x92), DEC16 BC (0x93) */
    if (opcode == 0x92 || opcode == 0x93) return 1;

    /* ADD16 HL, BC (0x94), ADD16 HL, DE (0x95) */
    if (opcode == 0x94 || opcode == 0x95) return 1;

    /* NEG Rd (0x96) */
    if (opcode == 0x96) return 1;

    /* AND Rd, Rs (0xA0-0xA7) */
    if (opcode >= 0xA0 && opcode <= 0xA7) return 1;

    /* OR Rd, Rs (0xA8-0xAF) */
    if (opcode >= 0xA8 && opcode <= 0xAF) return 1;

    /* XOR Rd, Rs (0xB0-0xB7) */
    if (opcode >= 0xB0 && opcode <= 0xB7) return 1;

    /* NOT Rd (0xB8-0xBF) */
    if (opcode >= 0xB8 && opcode <= 0xBF) return 1;

    /* JMP addr (0xC0) */
    if (opcode == 0xC0) return 3;

    /* JR offset (0xC1) */
    if (opcode == 0xC1) return 2;

    /* JZ, JNZ, JC, JNC, JS, JNS, JO, JNO addr (0xC2-0xC9) */
    if (opcode >= 0xC2 && opcode <= 0xC9) return 3;

    /* JRZ, JRNZ, JRC, JRNC offset (0xCA-0xCD) */
    if (opcode >= 0xCA && opcode <= 0xCD) return 2;

    /* JP HL (0xCE) */
    if (opcode == 0xCE) return 1;

    /* CALL addr (0xCF) */
    if (opcode == 0xCF) return 3;

    /* RET (0xD0) */
    if (opcode == 0xD0) return 1;

    /* RETI (0xD1) */
    if (opcode == 0xD1) return 1;

    /* PUSH Rd (0xD2-0xD9) */
    if (opcode >= 0xD2 && opcode <= 0xD9) return 1;

    /* POP Rd (0xDA-0xE1) */
    if (opcode >= 0xDA && opcode <= 0xE1) return 1;

    /* PUSH16 HL (0xE2), POP16 HL (0xE3) */
    if (opcode == 0xE2 || opcode == 0xE3) return 1;

    /* PUSH16 BC (0xE4), POP16 BC (0xE5) */
    if (opcode == 0xE4 || opcode == 0xE5) return 1;

    /* PUSHF (0xE6), POPF (0xE7) */
    if (opcode == 0xE6 || opcode == 0xE7) return 1;

    /* EI (0xE8), DI (0xE9) */
    if (opcode == 0xE8 || opcode == 0xE9) return 1;

    /* SCF (0xEA), CCF (0xEB), CMF (0xEC) */
    if (opcode >= 0xEA && opcode <= 0xEC) return 1;

    /* IN Rd, port (0xED) */
    if (opcode == 0xED) return 2;

    /* OUT port, Rd (0xEE) */
    if (opcode == 0xEE) return 2;

    /* SWAP Rd (0xEF) */
    if (opcode == 0xEF) return 1;

    /* Unknown/Reserved (0xFx and others) */
    return 1;
}

/*
 * Add a jump target if not already present
 */
static void add_jump_target(uint16_t addr) {
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
static bool is_jump_target(uint16_t addr) {
    for (int i = 0; i < jump_target_count; i++) {
        if (jump_targets[i] == addr) return true;
    }
    return false;
}

/*
 * Generate label name for address
 */
static void get_label_name(uint16_t addr, char *buf, size_t bufsize) {
    snprintf(buf, bufsize, "L_%04X", addr);
}

/*
 * Load binary file into memory
 */
static int load_binary(const char *filename) {
    FILE *f = fopen(filename, "rb");
    if (!f) {
        fprintf(stderr, "Error: cannot open file '%s'\n", filename);
        return -1;
    }

    mem_size = (int)fread(memory, 1, MEM_SIZE, f);
    fclose(f);
    return mem_size;
}

/*
 * Load hex dump file into memory
 * Hex format: space/newline separated hex values
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
                    memory[mem_size++] = val & 0xFF;
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

    while (addr < mem_size) {
        uint8_t opcode = memory[addr];
        int len = get_instruction_length(opcode);

        /* Check for jump/call instructions */
        switch (opcode) {
            case 0xC0:  /* JMP addr */
            case 0xC2:  /* JZ addr */
            case 0xC3:  /* JNZ addr */
            case 0xC4:  /* JC addr */
            case 0xC5:  /* JNC addr */
            case 0xC6:  /* JS addr */
            case 0xC7:  /* JNS addr */
            case 0xC8:  /* JO addr */
            case 0xC9:  /* JNO addr */
            case 0xCF:  /* CALL addr */
                if (addr + 2 < mem_size) {
                    uint16_t target = memory[addr + 1] | (memory[addr + 2] << 8);
                    add_jump_target(target);
                }
                break;

            case 0xC1:  /* JR offset */
            case 0xCA:  /* JRZ offset */
            case 0xCB:  /* JRNZ offset */
            case 0xCC:  /* JRC offset */
            case 0xCD:  /* JRNC offset */
                if (addr + 1 < mem_size) {
                    int8_t offset = (int8_t)memory[addr + 1];
                    uint16_t target = (uint16_t)(base_address + addr + 2 + offset);
                    add_jump_target(target);
                }
                break;
        }

        addr += len;
        if (len == 0) addr++;  /* Safety: avoid infinite loop */
    }
}

/*
 * Disassemble a single instruction
 * Returns the instruction length in bytes
 */
static int disassemble_instruction(int addr, char *mnemonic, size_t mnem_size,
                                   char *operands, size_t oper_size) {
    if (addr >= mem_size) {
        snprintf(mnemonic, mnem_size, "???");
        operands[0] = '\0';
        return 1;
    }

    uint8_t opcode = memory[addr];
    int len = get_instruction_length(opcode);

    /* Helper macros for operand bytes */
    #define BYTE1 (addr + 1 < mem_size ? memory[addr + 1] : 0)
    #define BYTE2 (addr + 2 < mem_size ? memory[addr + 2] : 0)
    #define ADDR16 ((uint16_t)(BYTE1 | (BYTE2 << 8)))

    operands[0] = '\0';

    /* NOP (0x00) */
    if (opcode == 0x00) {
        snprintf(mnemonic, mnem_size, "NOP");
        return 1;
    }

    /* HLT (0x01) */
    if (opcode == 0x01) {
        snprintf(mnemonic, mnem_size, "HLT");
        return 1;
    }

    /* Reserved 0x02-0x05 */
    if (opcode >= 0x02 && opcode <= 0x05) {
        snprintf(mnemonic, mnem_size, "DB");
        snprintf(operands, oper_size, "0x%02X", opcode);
        return 1;
    }

    /* LDI Rd, #imm (0x06-0x0D) */
    if (opcode >= 0x06 && opcode <= 0x0D) {
        int reg = opcode - 0x06;
        snprintf(mnemonic, mnem_size, "LDI");
        snprintf(operands, oper_size, "%s, #0x%02X", REG_NAMES[reg], BYTE1);
        return 2;
    }

    /* LD Rd, [addr] (0x0E-0x15) */
    if (opcode >= 0x0E && opcode <= 0x15) {
        int reg = opcode - 0x0E;
        snprintf(mnemonic, mnem_size, "LD");
        snprintf(operands, oper_size, "%s, [0x%04X]", REG_NAMES[reg], ADDR16);
        return 3;
    }

    /* LDZ Rd, [zp] (0x16-0x1D) */
    if (opcode >= 0x16 && opcode <= 0x1D) {
        int reg = opcode - 0x16;
        snprintf(mnemonic, mnem_size, "LDZ");
        snprintf(operands, oper_size, "%s, [0x%02X]", REG_NAMES[reg], BYTE1);
        return 2;
    }

    /* ST Rd, [addr] (0x1E-0x25) */
    if (opcode >= 0x1E && opcode <= 0x25) {
        int reg = opcode - 0x1E;
        snprintf(mnemonic, mnem_size, "ST");
        snprintf(operands, oper_size, "%s, [0x%04X]", REG_NAMES[reg], ADDR16);
        return 3;
    }

    /* STZ Rd, [zp] (0x26-0x2D) */
    if (opcode >= 0x26 && opcode <= 0x2D) {
        int reg = opcode - 0x26;
        snprintf(mnemonic, mnem_size, "STZ");
        snprintf(operands, oper_size, "%s, [0x%02X]", REG_NAMES[reg], BYTE1);
        return 2;
    }

    /* LD Rd, [HL] (0x2E) - Note: ISA shows this with Rd encoded */
    if (opcode == 0x2E) {
        snprintf(mnemonic, mnem_size, "LD");
        snprintf(operands, oper_size, "R0, [HL]");
        return 1;
    }

    /* ST Rd, [HL] (0x2F) */
    if (opcode == 0x2F) {
        snprintf(mnemonic, mnem_size, "ST");
        snprintf(operands, oper_size, "R0, [HL]");
        return 1;
    }

    /* LD Rd, [HL+d] (0x30) */
    if (opcode == 0x30) {
        int8_t offset = (int8_t)BYTE1;
        snprintf(mnemonic, mnem_size, "LD");
        if (offset >= 0) {
            snprintf(operands, oper_size, "R0, [HL+%d]", offset);
        } else {
            snprintf(operands, oper_size, "R0, [HL%d]", offset);
        }
        return 2;
    }

    /* ST Rd, [HL+d] (0x31) */
    if (opcode == 0x31) {
        int8_t offset = (int8_t)BYTE1;
        snprintf(mnemonic, mnem_size, "ST");
        if (offset >= 0) {
            snprintf(operands, oper_size, "R0, [HL+%d]", offset);
        } else {
            snprintf(operands, oper_size, "R0, [HL%d]", offset);
        }
        return 2;
    }

    /* LDI16 HL, #imm16 (0x32) */
    if (opcode == 0x32) {
        snprintf(mnemonic, mnem_size, "LDI16");
        snprintf(operands, oper_size, "HL, #0x%04X", ADDR16);
        return 3;
    }

    /* LDI16 BC, #imm16 (0x33) */
    if (opcode == 0x33) {
        snprintf(mnemonic, mnem_size, "LDI16");
        snprintf(operands, oper_size, "BC, #0x%04X", ADDR16);
        return 3;
    }

    /* LDI16 DE, #imm16 (0x34) */
    if (opcode == 0x34) {
        snprintf(mnemonic, mnem_size, "LDI16");
        snprintf(operands, oper_size, "DE, #0x%04X", ADDR16);
        return 3;
    }

    /* LDI16 SP, #imm16 (0x35) */
    if (opcode == 0x35) {
        snprintf(mnemonic, mnem_size, "LDI16");
        snprintf(operands, oper_size, "SP, #0x%04X", ADDR16);
        return 3;
    }

    /* MOV16 HL, SP (0x36) */
    if (opcode == 0x36) {
        snprintf(mnemonic, mnem_size, "MOV16");
        snprintf(operands, oper_size, "HL, SP");
        return 1;
    }

    /* MOV16 SP, HL (0x37) */
    if (opcode == 0x37) {
        snprintf(mnemonic, mnem_size, "MOV16");
        snprintf(operands, oper_size, "SP, HL");
        return 1;
    }

    /* ANDI Rd, #imm (0x38) */
    if (opcode == 0x38) {
        snprintf(mnemonic, mnem_size, "ANDI");
        snprintf(operands, oper_size, "R0, #0x%02X", BYTE1);
        return 2;
    }

    /* ORI Rd, #imm (0x39) */
    if (opcode == 0x39) {
        snprintf(mnemonic, mnem_size, "ORI");
        snprintf(operands, oper_size, "R0, #0x%02X", BYTE1);
        return 2;
    }

    /* XORI Rd, #imm (0x3A) */
    if (opcode == 0x3A) {
        snprintf(mnemonic, mnem_size, "XORI");
        snprintf(operands, oper_size, "R0, #0x%02X", BYTE1);
        return 2;
    }

    /* SHL Rd (0x3B) */
    if (opcode == 0x3B) {
        snprintf(mnemonic, mnem_size, "SHL");
        snprintf(operands, oper_size, "R0");
        return 1;
    }

    /* SHR Rd (0x3C) */
    if (opcode == 0x3C) {
        snprintf(mnemonic, mnem_size, "SHR");
        snprintf(operands, oper_size, "R0");
        return 1;
    }

    /* SAR Rd (0x3D) */
    if (opcode == 0x3D) {
        snprintf(mnemonic, mnem_size, "SAR");
        snprintf(operands, oper_size, "R0");
        return 1;
    }

    /* ROL Rd (0x3E) */
    if (opcode == 0x3E) {
        snprintf(mnemonic, mnem_size, "ROL");
        snprintf(operands, oper_size, "R0");
        return 1;
    }

    /* ROR Rd (0x3F) */
    if (opcode == 0x3F) {
        snprintf(mnemonic, mnem_size, "ROR");
        snprintf(operands, oper_size, "R0");
        return 1;
    }

    /* MOV Rd, Rs (0x40-0x7F when bits[7:6]=01) */
    /* According to ISA, MOV uses format: 01 ddd sss */
    /* This conflicts with ADD/ADC/SUB/SBC/INC/DEC range */
    /* Based on opcode map, we need to check if this is MOV or ALU op */

    /* ADD Rd, Rs (0x40-0x47) */
    if (opcode >= 0x40 && opcode <= 0x47) {
        int src = opcode & 0x07;
        snprintf(mnemonic, mnem_size, "ADD");
        snprintf(operands, oper_size, "R0, %s", REG_NAMES[src]);
        return 1;
    }

    /* ADC Rd, Rs (0x48-0x4F) */
    if (opcode >= 0x48 && opcode <= 0x4F) {
        int src = opcode & 0x07;
        snprintf(mnemonic, mnem_size, "ADC");
        snprintf(operands, oper_size, "R0, %s", REG_NAMES[src]);
        return 1;
    }

    /* SUB Rd, Rs (0x50-0x57) */
    if (opcode >= 0x50 && opcode <= 0x57) {
        int src = opcode & 0x07;
        snprintf(mnemonic, mnem_size, "SUB");
        snprintf(operands, oper_size, "R0, %s", REG_NAMES[src]);
        return 1;
    }

    /* SBC Rd, Rs (0x58-0x5F) */
    if (opcode >= 0x58 && opcode <= 0x5F) {
        int src = opcode & 0x07;
        snprintf(mnemonic, mnem_size, "SBC");
        snprintf(operands, oper_size, "R0, %s", REG_NAMES[src]);
        return 1;
    }

    /* ADDI Rd, #imm (0x60-0x67) */
    if (opcode >= 0x60 && opcode <= 0x67) {
        int reg = opcode & 0x07;
        snprintf(mnemonic, mnem_size, "ADDI");
        snprintf(operands, oper_size, "%s, #0x%02X", REG_NAMES[reg], BYTE1);
        return 2;
    }

    /* SUBI Rd, #imm (0x68-0x6F) */
    if (opcode >= 0x68 && opcode <= 0x6F) {
        int reg = opcode & 0x07;
        snprintf(mnemonic, mnem_size, "SUBI");
        snprintf(operands, oper_size, "%s, #0x%02X", REG_NAMES[reg], BYTE1);
        return 2;
    }

    /* INC Rd (0x70-0x77) */
    if (opcode >= 0x70 && opcode <= 0x77) {
        int reg = opcode & 0x07;
        snprintf(mnemonic, mnem_size, "INC");
        snprintf(operands, oper_size, "%s", REG_NAMES[reg]);
        return 1;
    }

    /* DEC Rd (0x78-0x7F) */
    if (opcode >= 0x78 && opcode <= 0x7F) {
        int reg = opcode & 0x07;
        snprintf(mnemonic, mnem_size, "DEC");
        snprintf(operands, oper_size, "%s", REG_NAMES[reg]);
        return 1;
    }

    /* CMP Rd, Rs (0x80-0x87) */
    if (opcode >= 0x80 && opcode <= 0x87) {
        int src = opcode & 0x07;
        snprintf(mnemonic, mnem_size, "CMP");
        snprintf(operands, oper_size, "R0, %s", REG_NAMES[src]);
        return 1;
    }

    /* CMPI Rd, #imm (0x88-0x8F) */
    if (opcode >= 0x88 && opcode <= 0x8F) {
        int reg = opcode & 0x07;
        snprintf(mnemonic, mnem_size, "CMPI");
        snprintf(operands, oper_size, "%s, #0x%02X", REG_NAMES[reg], BYTE1);
        return 2;
    }

    /* INC16 HL (0x90) */
    if (opcode == 0x90) {
        snprintf(mnemonic, mnem_size, "INC16");
        snprintf(operands, oper_size, "HL");
        return 1;
    }

    /* DEC16 HL (0x91) */
    if (opcode == 0x91) {
        snprintf(mnemonic, mnem_size, "DEC16");
        snprintf(operands, oper_size, "HL");
        return 1;
    }

    /* INC16 BC (0x92) */
    if (opcode == 0x92) {
        snprintf(mnemonic, mnem_size, "INC16");
        snprintf(operands, oper_size, "BC");
        return 1;
    }

    /* DEC16 BC (0x93) */
    if (opcode == 0x93) {
        snprintf(mnemonic, mnem_size, "DEC16");
        snprintf(operands, oper_size, "BC");
        return 1;
    }

    /* ADD16 HL, BC (0x94) */
    if (opcode == 0x94) {
        snprintf(mnemonic, mnem_size, "ADD16");
        snprintf(operands, oper_size, "HL, BC");
        return 1;
    }

    /* ADD16 HL, DE (0x95) */
    if (opcode == 0x95) {
        snprintf(mnemonic, mnem_size, "ADD16");
        snprintf(operands, oper_size, "HL, DE");
        return 1;
    }

    /* NEG Rd (0x96) */
    if (opcode == 0x96) {
        snprintf(mnemonic, mnem_size, "NEG");
        snprintf(operands, oper_size, "R0");
        return 1;
    }

    /* Reserved 0x97-0x9F */
    if (opcode >= 0x97 && opcode <= 0x9F) {
        snprintf(mnemonic, mnem_size, "DB");
        snprintf(operands, oper_size, "0x%02X", opcode);
        return 1;
    }

    /* AND Rd, Rs (0xA0-0xA7) */
    if (opcode >= 0xA0 && opcode <= 0xA7) {
        int src = opcode & 0x07;
        snprintf(mnemonic, mnem_size, "AND");
        snprintf(operands, oper_size, "R0, %s", REG_NAMES[src]);
        return 1;
    }

    /* OR Rd, Rs (0xA8-0xAF) */
    if (opcode >= 0xA8 && opcode <= 0xAF) {
        int src = opcode & 0x07;
        snprintf(mnemonic, mnem_size, "OR");
        snprintf(operands, oper_size, "R0, %s", REG_NAMES[src]);
        return 1;
    }

    /* XOR Rd, Rs (0xB0-0xB7) */
    if (opcode >= 0xB0 && opcode <= 0xB7) {
        int src = opcode & 0x07;
        snprintf(mnemonic, mnem_size, "XOR");
        snprintf(operands, oper_size, "R0, %s", REG_NAMES[src]);
        return 1;
    }

    /* NOT Rd (0xB8-0xBF) */
    if (opcode >= 0xB8 && opcode <= 0xBF) {
        int reg = opcode & 0x07;
        snprintf(mnemonic, mnem_size, "NOT");
        snprintf(operands, oper_size, "%s", REG_NAMES[reg]);
        return 1;
    }

    /* JMP addr (0xC0) */
    if (opcode == 0xC0) {
        uint16_t target = ADDR16;
        snprintf(mnemonic, mnem_size, "JMP");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "0x%04X", target);
        }
        return 3;
    }

    /* JR offset (0xC1) */
    if (opcode == 0xC1) {
        int8_t offset = (int8_t)BYTE1;
        uint16_t target = (uint16_t)(base_address + addr + 2 + offset);
        snprintf(mnemonic, mnem_size, "JR");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "%d", offset);
        }
        return 2;
    }

    /* JZ addr (0xC2) */
    if (opcode == 0xC2) {
        uint16_t target = ADDR16;
        snprintf(mnemonic, mnem_size, "JZ");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "0x%04X", target);
        }
        return 3;
    }

    /* JNZ addr (0xC3) */
    if (opcode == 0xC3) {
        uint16_t target = ADDR16;
        snprintf(mnemonic, mnem_size, "JNZ");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "0x%04X", target);
        }
        return 3;
    }

    /* JC addr (0xC4) */
    if (opcode == 0xC4) {
        uint16_t target = ADDR16;
        snprintf(mnemonic, mnem_size, "JC");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "0x%04X", target);
        }
        return 3;
    }

    /* JNC addr (0xC5) */
    if (opcode == 0xC5) {
        uint16_t target = ADDR16;
        snprintf(mnemonic, mnem_size, "JNC");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "0x%04X", target);
        }
        return 3;
    }

    /* JS addr (0xC6) */
    if (opcode == 0xC6) {
        uint16_t target = ADDR16;
        snprintf(mnemonic, mnem_size, "JS");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "0x%04X", target);
        }
        return 3;
    }

    /* JNS addr (0xC7) */
    if (opcode == 0xC7) {
        uint16_t target = ADDR16;
        snprintf(mnemonic, mnem_size, "JNS");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "0x%04X", target);
        }
        return 3;
    }

    /* JO addr (0xC8) */
    if (opcode == 0xC8) {
        uint16_t target = ADDR16;
        snprintf(mnemonic, mnem_size, "JO");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "0x%04X", target);
        }
        return 3;
    }

    /* JNO addr (0xC9) */
    if (opcode == 0xC9) {
        uint16_t target = ADDR16;
        snprintf(mnemonic, mnem_size, "JNO");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "0x%04X", target);
        }
        return 3;
    }

    /* JRZ offset (0xCA) */
    if (opcode == 0xCA) {
        int8_t offset = (int8_t)BYTE1;
        uint16_t target = (uint16_t)(base_address + addr + 2 + offset);
        snprintf(mnemonic, mnem_size, "JRZ");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "%d", offset);
        }
        return 2;
    }

    /* JRNZ offset (0xCB) */
    if (opcode == 0xCB) {
        int8_t offset = (int8_t)BYTE1;
        uint16_t target = (uint16_t)(base_address + addr + 2 + offset);
        snprintf(mnemonic, mnem_size, "JRNZ");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "%d", offset);
        }
        return 2;
    }

    /* JRC offset (0xCC) */
    if (opcode == 0xCC) {
        int8_t offset = (int8_t)BYTE1;
        uint16_t target = (uint16_t)(base_address + addr + 2 + offset);
        snprintf(mnemonic, mnem_size, "JRC");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "%d", offset);
        }
        return 2;
    }

    /* JRNC offset (0xCD) */
    if (opcode == 0xCD) {
        int8_t offset = (int8_t)BYTE1;
        uint16_t target = (uint16_t)(base_address + addr + 2 + offset);
        snprintf(mnemonic, mnem_size, "JRNC");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "%d", offset);
        }
        return 2;
    }

    /* JP HL (0xCE) */
    if (opcode == 0xCE) {
        snprintf(mnemonic, mnem_size, "JP");
        snprintf(operands, oper_size, "HL");
        return 1;
    }

    /* CALL addr (0xCF) */
    if (opcode == 0xCF) {
        uint16_t target = ADDR16;
        snprintf(mnemonic, mnem_size, "CALL");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "0x%04X", target);
        }
        return 3;
    }

    /* RET (0xD0) */
    if (opcode == 0xD0) {
        snprintf(mnemonic, mnem_size, "RET");
        return 1;
    }

    /* RETI (0xD1) */
    if (opcode == 0xD1) {
        snprintf(mnemonic, mnem_size, "RETI");
        return 1;
    }

    /* PUSH Rd (0xD2-0xD9) */
    if (opcode >= 0xD2 && opcode <= 0xD9) {
        int reg = opcode - 0xD2;
        snprintf(mnemonic, mnem_size, "PUSH");
        snprintf(operands, oper_size, "%s", REG_NAMES[reg]);
        return 1;
    }

    /* POP Rd (0xDA-0xE1) */
    if (opcode >= 0xDA && opcode <= 0xE1) {
        int reg = opcode - 0xDA;
        snprintf(mnemonic, mnem_size, "POP");
        snprintf(operands, oper_size, "%s", REG_NAMES[reg]);
        return 1;
    }

    /* PUSH16 HL (0xE2) */
    if (opcode == 0xE2) {
        snprintf(mnemonic, mnem_size, "PUSH16");
        snprintf(operands, oper_size, "HL");
        return 1;
    }

    /* POP16 HL (0xE3) */
    if (opcode == 0xE3) {
        snprintf(mnemonic, mnem_size, "POP16");
        snprintf(operands, oper_size, "HL");
        return 1;
    }

    /* PUSH16 BC (0xE4) */
    if (opcode == 0xE4) {
        snprintf(mnemonic, mnem_size, "PUSH16");
        snprintf(operands, oper_size, "BC");
        return 1;
    }

    /* POP16 BC (0xE5) */
    if (opcode == 0xE5) {
        snprintf(mnemonic, mnem_size, "POP16");
        snprintf(operands, oper_size, "BC");
        return 1;
    }

    /* PUSHF (0xE6) */
    if (opcode == 0xE6) {
        snprintf(mnemonic, mnem_size, "PUSHF");
        return 1;
    }

    /* POPF (0xE7) */
    if (opcode == 0xE7) {
        snprintf(mnemonic, mnem_size, "POPF");
        return 1;
    }

    /* EI (0xE8) */
    if (opcode == 0xE8) {
        snprintf(mnemonic, mnem_size, "EI");
        return 1;
    }

    /* DI (0xE9) */
    if (opcode == 0xE9) {
        snprintf(mnemonic, mnem_size, "DI");
        return 1;
    }

    /* SCF (0xEA) */
    if (opcode == 0xEA) {
        snprintf(mnemonic, mnem_size, "SCF");
        return 1;
    }

    /* CCF (0xEB) */
    if (opcode == 0xEB) {
        snprintf(mnemonic, mnem_size, "CCF");
        return 1;
    }

    /* CMF (0xEC) */
    if (opcode == 0xEC) {
        snprintf(mnemonic, mnem_size, "CMF");
        return 1;
    }

    /* IN Rd, port (0xED) */
    if (opcode == 0xED) {
        snprintf(mnemonic, mnem_size, "IN");
        snprintf(operands, oper_size, "R0, 0x%02X", BYTE1);
        return 2;
    }

    /* OUT port, Rd (0xEE) */
    if (opcode == 0xEE) {
        snprintf(mnemonic, mnem_size, "OUT");
        snprintf(operands, oper_size, "0x%02X, R0", BYTE1);
        return 2;
    }

    /* SWAP Rd (0xEF) */
    if (opcode == 0xEF) {
        snprintf(mnemonic, mnem_size, "SWAP");
        snprintf(operands, oper_size, "R0");
        return 1;
    }

    /* Reserved 0xF0-0xFF */
    snprintf(mnemonic, mnem_size, "DB");
    snprintf(operands, oper_size, "0x%02X", opcode);
    return 1;

    #undef BYTE1
    #undef BYTE2
    #undef ADDR16
}

/*
 * Disassemble and output
 */
static void disassemble(bool show_comments, bool show_hex) {
    printf("; Micro8 Disassembly\n");
    printf("; Generated by micro8-disasm\n");
    printf("; Total size: %d bytes\n", mem_size);
    printf("; Base address: 0x%04X\n", base_address);
    printf(";\n\n");

    int addr = 0;
    char label_buf[32];
    char mnemonic[16];
    char operands[64];

    while (addr < mem_size) {
        uint16_t abs_addr = base_address + addr;

        /* Check for label at this address */
        if (is_jump_target(abs_addr)) {
            get_label_name(abs_addr, label_buf, sizeof(label_buf));
            printf("\n%s:\n", label_buf);
        }

        /* Disassemble instruction */
        int len = disassemble_instruction(addr, mnemonic, sizeof(mnemonic),
                                          operands, sizeof(operands));

        /* Output address */
        printf("  ");

        if (show_hex) {
            printf("%04X: ", abs_addr);

            /* Print hex bytes */
            for (int i = 0; i < 4; i++) {
                if (i < len && addr + i < mem_size) {
                    printf("%02X ", memory[addr + i]);
                } else {
                    printf("   ");
                }
            }
        }

        /* Print mnemonic and operands */
        if (operands[0]) {
            printf("%-8s%s", mnemonic, operands);
        } else {
            printf("%s", mnemonic);
        }

        printf("\n");

        addr += len;
        if (len == 0) addr++;  /* Safety: avoid infinite loop */
    }
}

/*
 * Print usage information
 */
static void print_usage(const char *prog) {
    printf("Micro8 Disassembler v1.0\n");
    printf("========================\n\n");
    printf("Usage:\n");
    printf("  %s [options] <file>\n\n", prog);
    printf("Options:\n");
    printf("  -x           Input is hex dump (default: binary)\n");
    printf("  -c           Show comments for instructions\n");
    printf("  -a           Show hex addresses and bytes\n");
    printf("  -l           Suppress label generation for jump targets\n");
    printf("  -b <addr>    Set base address (hex, default: 0x0200)\n");
    printf("  -h, --help   Show this help\n\n");
    printf("Input formats:\n");
    printf("  Binary: Raw bytes\n");
    printf("  Hex:    Space/newline separated hex values\n\n");
    printf("Examples:\n");
    printf("  %s program.bin              Disassemble binary file\n", prog);
    printf("  %s -x program.hex           Disassemble hex dump\n", prog);
    printf("  %s -a program.bin           With addresses and hex bytes\n", prog);
    printf("  %s -b 0x1000 program.bin    Set base address to 0x1000\n", prog);
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
        else if (strcmp(argv[i], "-b") == 0 && i + 1 < argc) {
            base_address = (uint16_t)strtol(argv[++i], NULL, 16);
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

    /* First pass: find jump targets */
    if (gen_labels) {
        find_jump_targets();
    }

    /* Second pass: disassemble */
    disassemble(show_comments, show_hex);

    return 0;
}
