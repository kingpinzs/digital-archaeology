/*
 * Micro16 Standalone Disassembler
 *
 * Disassembles Micro16 binary files into readable assembly.
 * Supports all ~120 instructions with segment:offset addressing.
 * Handles variable-length instructions (1-5 bytes).
 *
 * Usage:
 *   micro16-disasm <file.bin>       - Disassemble binary file
 *   micro16-disasm -x <file.hex>    - Disassemble hex dump file
 *   micro16-disasm -h               - Show help
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <stdbool.h>
#include <ctype.h>

/* ========================================================================
 * Configuration
 * ======================================================================== */

/* Memory size: 1MB (20-bit address) */
#define MEM_SIZE        0x100000

/* Maximum labels for jump targets */
#define MAX_LABELS      8192

/* Output buffer for disassembly */
#define MAX_OUTPUT      256

/* ========================================================================
 * Opcode Definitions (from cpu.h)
 * ======================================================================== */

/* System Instructions (0x00-0x0E) */
#define OP_NOP      0x00
#define OP_HLT      0x01
#define OP_WAIT     0x02
#define OP_LOCK     0x03
#define OP_INT      0x04
#define OP_IRET     0x05
#define OP_CLI      0x06
#define OP_STI      0x07
#define OP_CLC      0x08
#define OP_STC      0x09
#define OP_CMC      0x0A
#define OP_CLD      0x0B
#define OP_STD      0x0C
#define OP_PUSHF    0x0D
#define OP_POPF     0x0E

/* Data Transfer - Register (0x10-0x14) */
#define OP_MOV_RR   0x10
#define OP_MOV_RI   0x11
#define OP_XCHG     0x12
#define OP_MOV_SR   0x13
#define OP_MOV_RS   0x14

/* Data Transfer - Memory (0x20-0x28) */
#define OP_LD       0x20
#define OP_ST       0x21
#define OP_LDB      0x22
#define OP_STB      0x23
#define OP_LD_IDX   0x24
#define OP_ST_IDX   0x25
#define OP_LEA      0x26
#define OP_LDS      0x27
#define OP_LES      0x28

/* Stack Operations (0x40-0x47) */
#define OP_PUSH_R   0x40
#define OP_POP_R    0x41
#define OP_PUSH_S   0x42
#define OP_POP_S    0x43
#define OP_PUSHA    0x44
#define OP_POPA     0x45
#define OP_ENTER    0x46
#define OP_LEAVE    0x47

/* Arithmetic Operations (0x50-0x63) */
#define OP_ADD_RR   0x50
#define OP_ADD_RI   0x51
#define OP_ADC_RR   0x52
#define OP_ADC_RI   0x53
#define OP_SUB_RR   0x54
#define OP_SUB_RI   0x55
#define OP_SBC_RR   0x56
#define OP_SBC_RI   0x57
#define OP_CMP_RR   0x58
#define OP_CMP_RI   0x59
#define OP_NEG      0x5A
#define OP_INC      0x5B
#define OP_DEC      0x5C
#define OP_MUL      0x60
#define OP_IMUL     0x61
#define OP_DIV      0x62
#define OP_IDIV     0x63

/* Logic Operations (0x70-0x78) */
#define OP_AND_RR   0x70
#define OP_AND_RI   0x71
#define OP_OR_RR    0x72
#define OP_OR_RI    0x73
#define OP_XOR_RR   0x74
#define OP_XOR_RI   0x75
#define OP_NOT      0x76
#define OP_TEST_RR  0x77
#define OP_TEST_RI  0x78

/* Shift/Rotate Operations (0x80-0x86) */
#define OP_SHL      0x80
#define OP_SHR      0x81
#define OP_SAR      0x82
#define OP_ROL      0x83
#define OP_ROR      0x84
#define OP_RCL      0x85
#define OP_RCR      0x86

/* Control Flow - Jumps (0xA0-0xA3) */
#define OP_JMP      0xA0
#define OP_JMP_FAR  0xA1
#define OP_JMP_R    0xA2
#define OP_JR       0xA3

/* Control Flow - Conditional Jumps (0xB0-0xBD) */
#define OP_JZ       0xB0
#define OP_JNZ      0xB1
#define OP_JC       0xB2
#define OP_JNC      0xB3
#define OP_JS       0xB4
#define OP_JNS      0xB5
#define OP_JO       0xB6
#define OP_JNO      0xB7
#define OP_JL       0xB8
#define OP_JGE      0xB9
#define OP_JLE      0xBA
#define OP_JG       0xBB
#define OP_JA       0xBC
#define OP_JBE      0xBD

/* Control Flow - Calls/Returns (0xC0-0xC5) */
#define OP_CALL     0xC0
#define OP_CALL_FAR 0xC1
#define OP_CALL_R   0xC2
#define OP_RET      0xC3
#define OP_RET_FAR  0xC4
#define OP_RET_I    0xC5

/* Loop Instructions (0xD0-0xD2) */
#define OP_LOOP     0xD0
#define OP_LOOPZ    0xD1
#define OP_LOOPNZ   0xD2

/* String Operations (0xE0-0xEA) */
#define OP_MOVSB    0xE0
#define OP_MOVSW    0xE1
#define OP_CMPSB    0xE2
#define OP_CMPSW    0xE3
#define OP_STOSB    0xE4
#define OP_STOSW    0xE5
#define OP_LODSB    0xE6
#define OP_LODSW    0xE7
#define OP_REP      0xE8
#define OP_REPZ     0xE9
#define OP_REPNZ    0xEA

/* I/O Operations (0xF0-0xF3) */
#define OP_IN       0xF0
#define OP_OUT      0xF1
#define OP_INB      0xF2
#define OP_OUTB     0xF3

/* ========================================================================
 * Global State
 * ======================================================================== */

/* Register names */
static const char *REG_NAMES[] = {
    "AX", "BX", "CX", "DX", "SI", "DI", "BP", "R7"
};

/* Segment register names */
static const char *SEG_NAMES[] = {
    "CS", "DS", "SS", "ES"
};

/* Jump target tracking */
static uint32_t jump_targets[MAX_LABELS];
static int jump_target_count = 0;

/* Memory buffer */
static uint8_t *memory = NULL;
static int mem_size = 0;

/* Base segment:offset - default CS:0x0100 */
static uint16_t base_segment = 0x0000;
static uint16_t base_offset = 0x0100;

/* ========================================================================
 * Instruction Length Calculator
 * ======================================================================== */

static int get_instruction_length(const uint8_t *bytes, int remaining) {
    if (remaining < 1) return 1;

    uint8_t opcode = bytes[0];

    switch (opcode) {
    /* 1-byte instructions */
    case OP_NOP:
    case OP_HLT:
    case OP_WAIT:
    case OP_LOCK:
    case OP_IRET:
    case OP_CLI:
    case OP_STI:
    case OP_CLC:
    case OP_STC:
    case OP_CMC:
    case OP_CLD:
    case OP_STD:
    case OP_PUSHF:
    case OP_POPF:
    case OP_PUSHA:
    case OP_POPA:
    case OP_LEAVE:
    case OP_RET:
    case OP_RET_FAR:
    case OP_MOVSB:
    case OP_MOVSW:
    case OP_CMPSB:
    case OP_CMPSW:
    case OP_STOSB:
    case OP_STOSW:
    case OP_LODSB:
    case OP_LODSW:
        return 1;

    /* 2-byte instructions */
    case OP_INT:        /* INT n */
    case OP_MOV_RR:     /* MOV Rd, Rs (opcode + regs) */
    case OP_XCHG:       /* XCHG Rd, Rs */
    case OP_MOV_SR:     /* MOV Seg, Rs */
    case OP_MOV_RS:     /* MOV Rd, Seg */
    case OP_PUSH_R:     /* PUSH Rd */
    case OP_POP_R:      /* POP Rd */
    case OP_PUSH_S:     /* PUSH Seg */
    case OP_POP_S:      /* POP Seg */
    case OP_ADD_RR:     /* ADD Rd, Rs */
    case OP_ADC_RR:     /* ADC Rd, Rs */
    case OP_SUB_RR:     /* SUB Rd, Rs */
    case OP_SBC_RR:     /* SBC Rd, Rs */
    case OP_CMP_RR:     /* CMP Rd, Rs */
    case OP_NEG:        /* NEG Rd */
    case OP_INC:        /* INC Rd */
    case OP_DEC:        /* DEC Rd */
    case OP_MUL:        /* MUL Rs */
    case OP_IMUL:       /* IMUL Rs */
    case OP_DIV:        /* DIV Rs */
    case OP_IDIV:       /* IDIV Rs */
    case OP_AND_RR:     /* AND Rd, Rs */
    case OP_OR_RR:      /* OR Rd, Rs */
    case OP_XOR_RR:     /* XOR Rd, Rs */
    case OP_NOT:        /* NOT Rd */
    case OP_TEST_RR:    /* TEST Rd, Rs */
    case OP_SHL:        /* SHL Rd, count */
    case OP_SHR:        /* SHR Rd, count */
    case OP_SAR:        /* SAR Rd, count */
    case OP_ROL:        /* ROL Rd, count */
    case OP_ROR:        /* ROR Rd, count */
    case OP_RCL:        /* RCL Rd, count */
    case OP_RCR:        /* RCR Rd, count */
    case OP_JMP_R:      /* JMP Rd */
    case OP_JR:         /* JR offset */
    case OP_CALL_R:     /* CALL Rd */
    case OP_LOOP:       /* LOOP offset */
    case OP_LOOPZ:      /* LOOPZ offset */
    case OP_LOOPNZ:     /* LOOPNZ offset */
    case OP_REP:        /* REP string_op */
    case OP_REPZ:       /* REPZ string_op */
    case OP_REPNZ:      /* REPNZ string_op */
        return 2;

    /* 3-byte instructions */
    case OP_JMP:        /* JMP addr16 */
    case OP_JZ:         /* JZ addr16 */
    case OP_JNZ:        /* JNZ addr16 */
    case OP_JC:         /* JC addr16 */
    case OP_JNC:        /* JNC addr16 */
    case OP_JS:         /* JS addr16 */
    case OP_JNS:        /* JNS addr16 */
    case OP_JO:         /* JO addr16 */
    case OP_JNO:        /* JNO addr16 */
    case OP_JL:         /* JL addr16 */
    case OP_JGE:        /* JGE addr16 */
    case OP_JLE:        /* JLE addr16 */
    case OP_JG:         /* JG addr16 */
    case OP_JA:         /* JA addr16 */
    case OP_JBE:        /* JBE addr16 */
    case OP_CALL:       /* CALL addr16 */
    case OP_RET_I:      /* RET imm16 */
        return 3;

    /* 4-byte instructions */
    case OP_MOV_RI:     /* MOV Rd, #imm16 (opcode + reg + imm16) */
    case OP_LD:         /* LD Rd, [addr16] */
    case OP_ST:         /* ST [addr16], Rs */
    case OP_LDB:        /* LDB Rd, [addr16] */
    case OP_STB:        /* STB [addr16], Rs */
    case OP_LD_IDX:     /* LD Rd, [Rs + offset16] */
    case OP_ST_IDX:     /* ST [Rd + offset16], Rs */
    case OP_LEA:        /* LEA Rd, [addr16] */
    case OP_LDS:        /* LDS Rd, [addr16] */
    case OP_LES:        /* LES Rd, [addr16] */
    case OP_ADD_RI:     /* ADD Rd, #imm16 */
    case OP_ADC_RI:     /* ADC Rd, #imm16 */
    case OP_SUB_RI:     /* SUB Rd, #imm16 */
    case OP_SBC_RI:     /* SBC Rd, #imm16 */
    case OP_CMP_RI:     /* CMP Rd, #imm16 */
    case OP_AND_RI:     /* AND Rd, #imm16 */
    case OP_OR_RI:      /* OR Rd, #imm16 */
    case OP_XOR_RI:     /* XOR Rd, #imm16 */
    case OP_TEST_RI:    /* TEST Rd, #imm16 */
    case OP_IN:         /* IN Rd, port16 */
    case OP_OUT:        /* OUT port16, Rs */
    case OP_INB:        /* INB Rd, port16 */
    case OP_OUTB:       /* OUTB port16, Rs */
    case OP_ENTER:      /* ENTER size16, level8 */
        return 4;

    /* 5-byte instructions */
    case OP_JMP_FAR:    /* JMP seg:offset */
    case OP_CALL_FAR:   /* CALL seg:offset */
        return 5;

    default:
        return 1;  /* Unknown - treat as single byte data */
    }
}

/* ========================================================================
 * Jump Target Management
 * ======================================================================== */

static void add_jump_target(uint16_t offset) {
    for (int i = 0; i < jump_target_count; i++) {
        if (jump_targets[i] == offset) return;
    }
    if (jump_target_count < MAX_LABELS) {
        jump_targets[jump_target_count++] = offset;
    }
}

static bool is_jump_target(uint16_t offset) {
    for (int i = 0; i < jump_target_count; i++) {
        if (jump_targets[i] == offset) return true;
    }
    return false;
}

static void get_label_name(uint16_t offset, char *buf, size_t bufsize) {
    snprintf(buf, bufsize, "L_%04X", offset);
}

/* ========================================================================
 * File Loading
 * ======================================================================== */

static int load_binary(const char *filename) {
    FILE *f = fopen(filename, "rb");
    if (!f) {
        fprintf(stderr, "Error: cannot open file '%s'\n", filename);
        return -1;
    }

    /* Get file size */
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);

    if (size > MEM_SIZE) {
        size = MEM_SIZE;
    }

    memory = (uint8_t *)malloc(size);
    if (!memory) {
        fprintf(stderr, "Error: out of memory\n");
        fclose(f);
        return -1;
    }

    mem_size = (int)fread(memory, 1, size, f);
    fclose(f);
    return mem_size;
}

static int load_hex(const char *filename) {
    FILE *f = fopen(filename, "r");
    if (!f) {
        fprintf(stderr, "Error: cannot open file '%s'\n", filename);
        return -1;
    }

    /* Allocate max buffer */
    memory = (uint8_t *)malloc(MEM_SIZE);
    if (!memory) {
        fprintf(stderr, "Error: out of memory\n");
        fclose(f);
        return -1;
    }

    mem_size = 0;
    char line[1024];

    while (fgets(line, sizeof(line), f) && mem_size < MEM_SIZE) {
        char *p = line;
        while (*p && mem_size < MEM_SIZE) {
            while (*p && (isspace((unsigned char)*p) || *p == ',' || *p == ':')) p++;
            if (!*p) break;
            if (*p == ';' || *p == '#') break;

            if (isxdigit((unsigned char)*p)) {
                unsigned int val;
                if (sscanf(p, "%x", &val) == 1) {
                    memory[mem_size++] = val & 0xFF;
                }
                while (*p && isxdigit((unsigned char)*p)) p++;
            } else {
                p++;
            }
        }
    }

    fclose(f);
    return mem_size;
}

/* ========================================================================
 * First Pass: Find Jump Targets
 * ======================================================================== */

static void find_jump_targets(void) {
    jump_target_count = 0;
    int offset = 0;

    while (offset < mem_size) {
        uint8_t opcode = memory[offset];
        int len = get_instruction_length(&memory[offset], mem_size - offset);

        /* Check for jump/call instructions */
        switch (opcode) {
        /* Absolute jumps/calls (3-byte: opcode + addr16) */
        case OP_JMP:
        case OP_CALL:
        case OP_JZ:
        case OP_JNZ:
        case OP_JC:
        case OP_JNC:
        case OP_JS:
        case OP_JNS:
        case OP_JO:
        case OP_JNO:
        case OP_JL:
        case OP_JGE:
        case OP_JLE:
        case OP_JG:
        case OP_JA:
        case OP_JBE:
            if (offset + 2 < mem_size) {
                uint16_t target = memory[offset + 1] | (memory[offset + 2] << 8);
                add_jump_target(target);
            }
            break;

        /* Relative jumps (2-byte: opcode + offset8) */
        case OP_JR:
        case OP_LOOP:
        case OP_LOOPZ:
        case OP_LOOPNZ:
            if (offset + 1 < mem_size) {
                int8_t rel = (int8_t)memory[offset + 1];
                uint16_t target = (uint16_t)(base_offset + offset + 2 + rel);
                add_jump_target(target);
            }
            break;
        }

        offset += len;
        if (len == 0) offset++;  /* Safety */
    }
}

/* ========================================================================
 * Disassemble Single Instruction
 * Returns number of bytes consumed
 * ======================================================================== */

static int disassemble_instruction(int offset, char *mnemonic, size_t mnem_size,
                                   char *operands, size_t oper_size) {
    if (offset >= mem_size) {
        snprintf(mnemonic, mnem_size, "???");
        operands[0] = '\0';
        return 1;
    }

    uint8_t opcode = memory[offset];
    int len = get_instruction_length(&memory[offset], mem_size - offset);

    /* Helper macros */
    #define BYTE1 (offset + 1 < mem_size ? memory[offset + 1] : 0)
    #define BYTE2 (offset + 2 < mem_size ? memory[offset + 2] : 0)
    #define BYTE3 (offset + 3 < mem_size ? memory[offset + 3] : 0)
    #define BYTE4 (offset + 4 < mem_size ? memory[offset + 4] : 0)
    #define WORD12 ((uint16_t)(BYTE1 | (BYTE2 << 8)))
    #define WORD23 ((uint16_t)(BYTE2 | (BYTE3 << 8)))
    #define WORD34 ((uint16_t)(BYTE3 | (BYTE4 << 8)))

    operands[0] = '\0';

    switch (opcode) {

    /* ========== System Instructions ========== */
    case OP_NOP:
        snprintf(mnemonic, mnem_size, "NOP");
        return 1;

    case OP_HLT:
        snprintf(mnemonic, mnem_size, "HLT");
        return 1;

    case OP_WAIT:
        snprintf(mnemonic, mnem_size, "WAIT");
        return 1;

    case OP_LOCK:
        snprintf(mnemonic, mnem_size, "LOCK");
        return 1;

    case OP_INT:
        snprintf(mnemonic, mnem_size, "INT");
        snprintf(operands, oper_size, "0x%02X", BYTE1);
        return 2;

    case OP_IRET:
        snprintf(mnemonic, mnem_size, "IRET");
        return 1;

    case OP_CLI:
        snprintf(mnemonic, mnem_size, "CLI");
        return 1;

    case OP_STI:
        snprintf(mnemonic, mnem_size, "STI");
        return 1;

    case OP_CLC:
        snprintf(mnemonic, mnem_size, "CLC");
        return 1;

    case OP_STC:
        snprintf(mnemonic, mnem_size, "STC");
        return 1;

    case OP_CMC:
        snprintf(mnemonic, mnem_size, "CMC");
        return 1;

    case OP_CLD:
        snprintf(mnemonic, mnem_size, "CLD");
        return 1;

    case OP_STD:
        snprintf(mnemonic, mnem_size, "STD");
        return 1;

    case OP_PUSHF:
        snprintf(mnemonic, mnem_size, "PUSHF");
        return 1;

    case OP_POPF:
        snprintf(mnemonic, mnem_size, "POPF");
        return 1;

    /* ========== Data Transfer - Register ========== */
    case OP_MOV_RR: {
        int rd = (BYTE1 >> 4) & 0x07;
        int rs = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "MOV");
        snprintf(operands, oper_size, "%s, %s", REG_NAMES[rd], REG_NAMES[rs]);
        return 2;
    }

    case OP_MOV_RI: {
        int rd = BYTE1 & 0x07;
        uint16_t imm = WORD23;
        snprintf(mnemonic, mnem_size, "MOV");
        snprintf(operands, oper_size, "%s, #0x%04X", REG_NAMES[rd], imm);
        return 4;
    }

    case OP_XCHG: {
        int rd = (BYTE1 >> 4) & 0x07;
        int rs = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "XCHG");
        snprintf(operands, oper_size, "%s, %s", REG_NAMES[rd], REG_NAMES[rs]);
        return 2;
    }

    case OP_MOV_SR: {
        int seg = (BYTE1 >> 4) & 0x03;
        int rs = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "MOV");
        snprintf(operands, oper_size, "%s, %s", SEG_NAMES[seg], REG_NAMES[rs]);
        return 2;
    }

    case OP_MOV_RS: {
        int rd = (BYTE1 >> 4) & 0x07;
        int seg = BYTE1 & 0x03;
        snprintf(mnemonic, mnem_size, "MOV");
        snprintf(operands, oper_size, "%s, %s", REG_NAMES[rd], SEG_NAMES[seg]);
        return 2;
    }

    /* ========== Data Transfer - Memory ========== */
    case OP_LD: {
        int rd = BYTE1 & 0x07;
        uint16_t addr = WORD23;
        snprintf(mnemonic, mnem_size, "MOV");
        snprintf(operands, oper_size, "%s, [0x%04X]", REG_NAMES[rd], addr);
        return 4;
    }

    case OP_ST: {
        int rs = BYTE1 & 0x07;
        uint16_t addr = WORD23;
        snprintf(mnemonic, mnem_size, "MOV");
        snprintf(operands, oper_size, "[0x%04X], %s", addr, REG_NAMES[rs]);
        return 4;
    }

    case OP_LDB: {
        int rd = BYTE1 & 0x07;
        uint16_t addr = WORD23;
        snprintf(mnemonic, mnem_size, "MOVB");
        snprintf(operands, oper_size, "%s, [0x%04X]", REG_NAMES[rd], addr);
        return 4;
    }

    case OP_STB: {
        int rs = BYTE1 & 0x07;
        uint16_t addr = WORD23;
        snprintf(mnemonic, mnem_size, "MOVB");
        snprintf(operands, oper_size, "[0x%04X], %s", addr, REG_NAMES[rs]);
        return 4;
    }

    case OP_LD_IDX: {
        int rd = (BYTE1 >> 4) & 0x07;
        int rb = BYTE1 & 0x07;
        int16_t disp = (int16_t)WORD23;
        snprintf(mnemonic, mnem_size, "MOV");
        if (disp >= 0) {
            snprintf(operands, oper_size, "%s, [%s+%d]", REG_NAMES[rd], REG_NAMES[rb], disp);
        } else {
            snprintf(operands, oper_size, "%s, [%s%d]", REG_NAMES[rd], REG_NAMES[rb], disp);
        }
        return 4;
    }

    case OP_ST_IDX: {
        int rb = (BYTE1 >> 4) & 0x07;
        int rs = BYTE1 & 0x07;
        int16_t disp = (int16_t)WORD23;
        snprintf(mnemonic, mnem_size, "MOV");
        if (disp >= 0) {
            snprintf(operands, oper_size, "[%s+%d], %s", REG_NAMES[rb], disp, REG_NAMES[rs]);
        } else {
            snprintf(operands, oper_size, "[%s%d], %s", REG_NAMES[rb], disp, REG_NAMES[rs]);
        }
        return 4;
    }

    case OP_LEA: {
        int rd = BYTE1 & 0x07;
        uint16_t addr = WORD23;
        snprintf(mnemonic, mnem_size, "LEA");
        snprintf(operands, oper_size, "%s, [0x%04X]", REG_NAMES[rd], addr);
        return 4;
    }

    case OP_LDS: {
        int rd = BYTE1 & 0x07;
        uint16_t addr = WORD23;
        snprintf(mnemonic, mnem_size, "LDS");
        snprintf(operands, oper_size, "%s, [0x%04X]", REG_NAMES[rd], addr);
        return 4;
    }

    case OP_LES: {
        int rd = BYTE1 & 0x07;
        uint16_t addr = WORD23;
        snprintf(mnemonic, mnem_size, "LES");
        snprintf(operands, oper_size, "%s, [0x%04X]", REG_NAMES[rd], addr);
        return 4;
    }

    /* ========== Stack Operations ========== */
    case OP_PUSH_R: {
        int rd = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "PUSH");
        snprintf(operands, oper_size, "%s", REG_NAMES[rd]);
        return 2;
    }

    case OP_POP_R: {
        int rd = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "POP");
        snprintf(operands, oper_size, "%s", REG_NAMES[rd]);
        return 2;
    }

    case OP_PUSH_S: {
        int seg = BYTE1 & 0x03;
        snprintf(mnemonic, mnem_size, "PUSH");
        snprintf(operands, oper_size, "%s", SEG_NAMES[seg]);
        return 2;
    }

    case OP_POP_S: {
        int seg = BYTE1 & 0x03;
        snprintf(mnemonic, mnem_size, "POP");
        snprintf(operands, oper_size, "%s", SEG_NAMES[seg]);
        return 2;
    }

    case OP_PUSHA:
        snprintf(mnemonic, mnem_size, "PUSHA");
        return 1;

    case OP_POPA:
        snprintf(mnemonic, mnem_size, "POPA");
        return 1;

    case OP_ENTER: {
        uint16_t size = WORD12;
        uint8_t level = BYTE3;
        snprintf(mnemonic, mnem_size, "ENTER");
        snprintf(operands, oper_size, "%d, %d", size, level);
        return 4;
    }

    case OP_LEAVE:
        snprintf(mnemonic, mnem_size, "LEAVE");
        return 1;

    /* ========== Arithmetic Operations ========== */
    case OP_ADD_RR: {
        int rd = (BYTE1 >> 4) & 0x07;
        int rs = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "ADD");
        snprintf(operands, oper_size, "%s, %s", REG_NAMES[rd], REG_NAMES[rs]);
        return 2;
    }

    case OP_ADD_RI: {
        int rd = BYTE1 & 0x07;
        uint16_t imm = WORD23;
        snprintf(mnemonic, mnem_size, "ADD");
        snprintf(operands, oper_size, "%s, #0x%04X", REG_NAMES[rd], imm);
        return 4;
    }

    case OP_ADC_RR: {
        int rd = (BYTE1 >> 4) & 0x07;
        int rs = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "ADC");
        snprintf(operands, oper_size, "%s, %s", REG_NAMES[rd], REG_NAMES[rs]);
        return 2;
    }

    case OP_ADC_RI: {
        int rd = BYTE1 & 0x07;
        uint16_t imm = WORD23;
        snprintf(mnemonic, mnem_size, "ADC");
        snprintf(operands, oper_size, "%s, #0x%04X", REG_NAMES[rd], imm);
        return 4;
    }

    case OP_SUB_RR: {
        int rd = (BYTE1 >> 4) & 0x07;
        int rs = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "SUB");
        snprintf(operands, oper_size, "%s, %s", REG_NAMES[rd], REG_NAMES[rs]);
        return 2;
    }

    case OP_SUB_RI: {
        int rd = BYTE1 & 0x07;
        uint16_t imm = WORD23;
        snprintf(mnemonic, mnem_size, "SUB");
        snprintf(operands, oper_size, "%s, #0x%04X", REG_NAMES[rd], imm);
        return 4;
    }

    case OP_SBC_RR: {
        int rd = (BYTE1 >> 4) & 0x07;
        int rs = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "SBC");
        snprintf(operands, oper_size, "%s, %s", REG_NAMES[rd], REG_NAMES[rs]);
        return 2;
    }

    case OP_SBC_RI: {
        int rd = BYTE1 & 0x07;
        uint16_t imm = WORD23;
        snprintf(mnemonic, mnem_size, "SBC");
        snprintf(operands, oper_size, "%s, #0x%04X", REG_NAMES[rd], imm);
        return 4;
    }

    case OP_CMP_RR: {
        int rd = (BYTE1 >> 4) & 0x07;
        int rs = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "CMP");
        snprintf(operands, oper_size, "%s, %s", REG_NAMES[rd], REG_NAMES[rs]);
        return 2;
    }

    case OP_CMP_RI: {
        int rd = BYTE1 & 0x07;
        uint16_t imm = WORD23;
        snprintf(mnemonic, mnem_size, "CMP");
        snprintf(operands, oper_size, "%s, #0x%04X", REG_NAMES[rd], imm);
        return 4;
    }

    case OP_NEG: {
        int rd = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "NEG");
        snprintf(operands, oper_size, "%s", REG_NAMES[rd]);
        return 2;
    }

    case OP_INC: {
        int rd = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "INC");
        snprintf(operands, oper_size, "%s", REG_NAMES[rd]);
        return 2;
    }

    case OP_DEC: {
        int rd = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "DEC");
        snprintf(operands, oper_size, "%s", REG_NAMES[rd]);
        return 2;
    }

    case OP_MUL: {
        int rs = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "MUL");
        snprintf(operands, oper_size, "%s", REG_NAMES[rs]);
        return 2;
    }

    case OP_IMUL: {
        int rs = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "IMUL");
        snprintf(operands, oper_size, "%s", REG_NAMES[rs]);
        return 2;
    }

    case OP_DIV: {
        int rs = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "DIV");
        snprintf(operands, oper_size, "%s", REG_NAMES[rs]);
        return 2;
    }

    case OP_IDIV: {
        int rs = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "IDIV");
        snprintf(operands, oper_size, "%s", REG_NAMES[rs]);
        return 2;
    }

    /* ========== Logic Operations ========== */
    case OP_AND_RR: {
        int rd = (BYTE1 >> 4) & 0x07;
        int rs = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "AND");
        snprintf(operands, oper_size, "%s, %s", REG_NAMES[rd], REG_NAMES[rs]);
        return 2;
    }

    case OP_AND_RI: {
        int rd = BYTE1 & 0x07;
        uint16_t imm = WORD23;
        snprintf(mnemonic, mnem_size, "AND");
        snprintf(operands, oper_size, "%s, #0x%04X", REG_NAMES[rd], imm);
        return 4;
    }

    case OP_OR_RR: {
        int rd = (BYTE1 >> 4) & 0x07;
        int rs = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "OR");
        snprintf(operands, oper_size, "%s, %s", REG_NAMES[rd], REG_NAMES[rs]);
        return 2;
    }

    case OP_OR_RI: {
        int rd = BYTE1 & 0x07;
        uint16_t imm = WORD23;
        snprintf(mnemonic, mnem_size, "OR");
        snprintf(operands, oper_size, "%s, #0x%04X", REG_NAMES[rd], imm);
        return 4;
    }

    case OP_XOR_RR: {
        int rd = (BYTE1 >> 4) & 0x07;
        int rs = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "XOR");
        snprintf(operands, oper_size, "%s, %s", REG_NAMES[rd], REG_NAMES[rs]);
        return 2;
    }

    case OP_XOR_RI: {
        int rd = BYTE1 & 0x07;
        uint16_t imm = WORD23;
        snprintf(mnemonic, mnem_size, "XOR");
        snprintf(operands, oper_size, "%s, #0x%04X", REG_NAMES[rd], imm);
        return 4;
    }

    case OP_NOT: {
        int rd = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "NOT");
        snprintf(operands, oper_size, "%s", REG_NAMES[rd]);
        return 2;
    }

    case OP_TEST_RR: {
        int rd = (BYTE1 >> 4) & 0x07;
        int rs = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "TEST");
        snprintf(operands, oper_size, "%s, %s", REG_NAMES[rd], REG_NAMES[rs]);
        return 2;
    }

    case OP_TEST_RI: {
        int rd = BYTE1 & 0x07;
        uint16_t imm = WORD23;
        snprintf(mnemonic, mnem_size, "TEST");
        snprintf(operands, oper_size, "%s, #0x%04X", REG_NAMES[rd], imm);
        return 4;
    }

    /* ========== Shift/Rotate Operations ========== */
    case OP_SHL: {
        int rd = (BYTE1 >> 4) & 0x07;
        int count = BYTE1 & 0x0F;
        snprintf(mnemonic, mnem_size, "SHL");
        if (count == 0) {
            snprintf(operands, oper_size, "%s, CL", REG_NAMES[rd]);
        } else {
            snprintf(operands, oper_size, "%s, %d", REG_NAMES[rd], count);
        }
        return 2;
    }

    case OP_SHR: {
        int rd = (BYTE1 >> 4) & 0x07;
        int count = BYTE1 & 0x0F;
        snprintf(mnemonic, mnem_size, "SHR");
        if (count == 0) {
            snprintf(operands, oper_size, "%s, CL", REG_NAMES[rd]);
        } else {
            snprintf(operands, oper_size, "%s, %d", REG_NAMES[rd], count);
        }
        return 2;
    }

    case OP_SAR: {
        int rd = (BYTE1 >> 4) & 0x07;
        int count = BYTE1 & 0x0F;
        snprintf(mnemonic, mnem_size, "SAR");
        if (count == 0) {
            snprintf(operands, oper_size, "%s, CL", REG_NAMES[rd]);
        } else {
            snprintf(operands, oper_size, "%s, %d", REG_NAMES[rd], count);
        }
        return 2;
    }

    case OP_ROL: {
        int rd = (BYTE1 >> 4) & 0x07;
        int count = BYTE1 & 0x0F;
        snprintf(mnemonic, mnem_size, "ROL");
        if (count == 0) {
            snprintf(operands, oper_size, "%s, CL", REG_NAMES[rd]);
        } else {
            snprintf(operands, oper_size, "%s, %d", REG_NAMES[rd], count);
        }
        return 2;
    }

    case OP_ROR: {
        int rd = (BYTE1 >> 4) & 0x07;
        int count = BYTE1 & 0x0F;
        snprintf(mnemonic, mnem_size, "ROR");
        if (count == 0) {
            snprintf(operands, oper_size, "%s, CL", REG_NAMES[rd]);
        } else {
            snprintf(operands, oper_size, "%s, %d", REG_NAMES[rd], count);
        }
        return 2;
    }

    case OP_RCL: {
        int rd = (BYTE1 >> 4) & 0x07;
        int count = BYTE1 & 0x0F;
        snprintf(mnemonic, mnem_size, "RCL");
        if (count == 0) {
            snprintf(operands, oper_size, "%s, CL", REG_NAMES[rd]);
        } else {
            snprintf(operands, oper_size, "%s, %d", REG_NAMES[rd], count);
        }
        return 2;
    }

    case OP_RCR: {
        int rd = (BYTE1 >> 4) & 0x07;
        int count = BYTE1 & 0x0F;
        snprintf(mnemonic, mnem_size, "RCR");
        if (count == 0) {
            snprintf(operands, oper_size, "%s, CL", REG_NAMES[rd]);
        } else {
            snprintf(operands, oper_size, "%s, %d", REG_NAMES[rd], count);
        }
        return 2;
    }

    /* ========== Control Flow - Jumps ========== */
    case OP_JMP: {
        uint16_t target = WORD12;
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

    case OP_JMP_FAR: {
        uint16_t off = WORD12;
        uint16_t seg = WORD34;
        snprintf(mnemonic, mnem_size, "JMP");
        snprintf(operands, oper_size, "%04X:%04X", seg, off);
        return 5;
    }

    case OP_JMP_R: {
        int rd = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "JMP");
        snprintf(operands, oper_size, "%s", REG_NAMES[rd]);
        return 2;
    }

    case OP_JR: {
        int8_t rel = (int8_t)BYTE1;
        uint16_t target = (uint16_t)(base_offset + offset + 2 + rel);
        snprintf(mnemonic, mnem_size, "JR");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "%d", rel);
        }
        return 2;
    }

    /* ========== Conditional Jumps ========== */
    case OP_JZ: {
        uint16_t target = WORD12;
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

    case OP_JNZ: {
        uint16_t target = WORD12;
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

    case OP_JC: {
        uint16_t target = WORD12;
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

    case OP_JNC: {
        uint16_t target = WORD12;
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

    case OP_JS: {
        uint16_t target = WORD12;
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

    case OP_JNS: {
        uint16_t target = WORD12;
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

    case OP_JO: {
        uint16_t target = WORD12;
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

    case OP_JNO: {
        uint16_t target = WORD12;
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

    case OP_JL: {
        uint16_t target = WORD12;
        snprintf(mnemonic, mnem_size, "JL");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "0x%04X", target);
        }
        return 3;
    }

    case OP_JGE: {
        uint16_t target = WORD12;
        snprintf(mnemonic, mnem_size, "JGE");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "0x%04X", target);
        }
        return 3;
    }

    case OP_JLE: {
        uint16_t target = WORD12;
        snprintf(mnemonic, mnem_size, "JLE");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "0x%04X", target);
        }
        return 3;
    }

    case OP_JG: {
        uint16_t target = WORD12;
        snprintf(mnemonic, mnem_size, "JG");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "0x%04X", target);
        }
        return 3;
    }

    case OP_JA: {
        uint16_t target = WORD12;
        snprintf(mnemonic, mnem_size, "JA");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "0x%04X", target);
        }
        return 3;
    }

    case OP_JBE: {
        uint16_t target = WORD12;
        snprintf(mnemonic, mnem_size, "JBE");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "0x%04X", target);
        }
        return 3;
    }

    /* ========== Calls/Returns ========== */
    case OP_CALL: {
        uint16_t target = WORD12;
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

    case OP_CALL_FAR: {
        uint16_t off = WORD12;
        uint16_t seg = WORD34;
        snprintf(mnemonic, mnem_size, "CALL");
        snprintf(operands, oper_size, "%04X:%04X", seg, off);
        return 5;
    }

    case OP_CALL_R: {
        int rd = BYTE1 & 0x07;
        snprintf(mnemonic, mnem_size, "CALL");
        snprintf(operands, oper_size, "%s", REG_NAMES[rd]);
        return 2;
    }

    case OP_RET:
        snprintf(mnemonic, mnem_size, "RET");
        return 1;

    case OP_RET_FAR:
        snprintf(mnemonic, mnem_size, "RETF");
        return 1;

    case OP_RET_I: {
        uint16_t imm = WORD12;
        snprintf(mnemonic, mnem_size, "RET");
        snprintf(operands, oper_size, "%d", imm);
        return 3;
    }

    /* ========== Loop Instructions ========== */
    case OP_LOOP: {
        int8_t rel = (int8_t)BYTE1;
        uint16_t target = (uint16_t)(base_offset + offset + 2 + rel);
        snprintf(mnemonic, mnem_size, "LOOP");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "%d", rel);
        }
        return 2;
    }

    case OP_LOOPZ: {
        int8_t rel = (int8_t)BYTE1;
        uint16_t target = (uint16_t)(base_offset + offset + 2 + rel);
        snprintf(mnemonic, mnem_size, "LOOPZ");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "%d", rel);
        }
        return 2;
    }

    case OP_LOOPNZ: {
        int8_t rel = (int8_t)BYTE1;
        uint16_t target = (uint16_t)(base_offset + offset + 2 + rel);
        snprintf(mnemonic, mnem_size, "LOOPNZ");
        if (is_jump_target(target)) {
            char label[32];
            get_label_name(target, label, sizeof(label));
            snprintf(operands, oper_size, "%s", label);
        } else {
            snprintf(operands, oper_size, "%d", rel);
        }
        return 2;
    }

    /* ========== String Operations ========== */
    case OP_MOVSB:
        snprintf(mnemonic, mnem_size, "MOVSB");
        return 1;

    case OP_MOVSW:
        snprintf(mnemonic, mnem_size, "MOVSW");
        return 1;

    case OP_CMPSB:
        snprintf(mnemonic, mnem_size, "CMPSB");
        return 1;

    case OP_CMPSW:
        snprintf(mnemonic, mnem_size, "CMPSW");
        return 1;

    case OP_STOSB:
        snprintf(mnemonic, mnem_size, "STOSB");
        return 1;

    case OP_STOSW:
        snprintf(mnemonic, mnem_size, "STOSW");
        return 1;

    case OP_LODSB:
        snprintf(mnemonic, mnem_size, "LODSB");
        return 1;

    case OP_LODSW:
        snprintf(mnemonic, mnem_size, "LODSW");
        return 1;

    case OP_REP: {
        /* REP followed by string operation */
        uint8_t next_op = BYTE1;
        const char *str_op = "???";
        switch (next_op) {
            case OP_MOVSB: str_op = "MOVSB"; break;
            case OP_MOVSW: str_op = "MOVSW"; break;
            case OP_STOSB: str_op = "STOSB"; break;
            case OP_STOSW: str_op = "STOSW"; break;
            case OP_LODSB: str_op = "LODSB"; break;
            case OP_LODSW: str_op = "LODSW"; break;
            case OP_CMPSB: str_op = "CMPSB"; break;
            case OP_CMPSW: str_op = "CMPSW"; break;
        }
        snprintf(mnemonic, mnem_size, "REP");
        snprintf(operands, oper_size, "%s", str_op);
        return 2;
    }

    case OP_REPZ: {
        uint8_t next_op = BYTE1;
        const char *str_op = "???";
        switch (next_op) {
            case OP_CMPSB: str_op = "CMPSB"; break;
            case OP_CMPSW: str_op = "CMPSW"; break;
        }
        snprintf(mnemonic, mnem_size, "REPZ");
        snprintf(operands, oper_size, "%s", str_op);
        return 2;
    }

    case OP_REPNZ: {
        uint8_t next_op = BYTE1;
        const char *str_op = "???";
        switch (next_op) {
            case OP_CMPSB: str_op = "CMPSB"; break;
            case OP_CMPSW: str_op = "CMPSW"; break;
        }
        snprintf(mnemonic, mnem_size, "REPNZ");
        snprintf(operands, oper_size, "%s", str_op);
        return 2;
    }

    /* ========== I/O Operations ========== */
    case OP_IN: {
        int rd = BYTE1 & 0x07;
        uint16_t port = WORD23;
        snprintf(mnemonic, mnem_size, "IN");
        snprintf(operands, oper_size, "%s, 0x%04X", REG_NAMES[rd], port);
        return 4;
    }

    case OP_OUT: {
        int rs = BYTE1 & 0x07;
        uint16_t port = WORD23;
        snprintf(mnemonic, mnem_size, "OUT");
        snprintf(operands, oper_size, "0x%04X, %s", port, REG_NAMES[rs]);
        return 4;
    }

    case OP_INB: {
        int rd = BYTE1 & 0x07;
        uint16_t port = WORD23;
        snprintf(mnemonic, mnem_size, "INB");
        snprintf(operands, oper_size, "%s, 0x%04X", REG_NAMES[rd], port);
        return 4;
    }

    case OP_OUTB: {
        int rs = BYTE1 & 0x07;
        uint16_t port = WORD23;
        snprintf(mnemonic, mnem_size, "OUTB");
        snprintf(operands, oper_size, "0x%04X, %s", port, REG_NAMES[rs]);
        return 4;
    }

    /* ========== Unknown/Reserved ========== */
    default:
        snprintf(mnemonic, mnem_size, "DB");
        snprintf(operands, oper_size, "0x%02X", opcode);
        return 1;
    }

    #undef BYTE1
    #undef BYTE2
    #undef BYTE3
    #undef BYTE4
    #undef WORD12
    #undef WORD23
    #undef WORD34
}

/* ========================================================================
 * Main Disassembly Output
 * ======================================================================== */

static void disassemble(bool show_hex) {
    printf("; Micro16 Disassembly\n");
    printf("; Generated by micro16-disasm\n");
    printf("; Total size: %d bytes\n", mem_size);
    printf("; Base address: %04X:%04X\n", base_segment, base_offset);
    printf(";\n\n");

    int offset = 0;
    char label_buf[32];
    char mnemonic[16];
    char operands[64];

    while (offset < mem_size) {
        uint16_t abs_offset = base_offset + offset;

        /* Check for label at this address */
        if (is_jump_target(abs_offset)) {
            get_label_name(abs_offset, label_buf, sizeof(label_buf));
            printf("\n%s:\n", label_buf);
        }

        /* Disassemble instruction */
        int len = disassemble_instruction(offset, mnemonic, sizeof(mnemonic),
                                          operands, sizeof(operands));

        /* Output address in segment:offset format */
        printf("  ");

        if (show_hex) {
            printf("%04X:%04X  ", base_segment, abs_offset);

            /* Print hex bytes */
            for (int i = 0; i < 5; i++) {
                if (i < len && offset + i < mem_size) {
                    printf("%02X ", memory[offset + i]);
                } else {
                    printf("   ");
                }
            }
            printf(" ");
        }

        /* Print mnemonic and operands */
        if (operands[0]) {
            printf("%-8s%s", mnemonic, operands);
        } else {
            printf("%s", mnemonic);
        }

        printf("\n");

        offset += len;
        if (len == 0) offset++;  /* Safety */
    }
}

/* ========================================================================
 * Print Usage
 * ======================================================================== */

static void print_usage(const char *prog) {
    printf("Micro16 Disassembler v1.0\n");
    printf("==========================\n\n");
    printf("Usage:\n");
    printf("  %s [options] <file>\n\n", prog);
    printf("Options:\n");
    printf("  -x           Input is hex dump (default: binary)\n");
    printf("  -a           Show hex addresses and bytes\n");
    printf("  -l           Suppress label generation for jump targets\n");
    printf("  -s <seg>     Set base segment (hex, default: 0x0000)\n");
    printf("  -o <off>     Set base offset (hex, default: 0x0100)\n");
    printf("  -h, --help   Show this help\n\n");
    printf("Input formats:\n");
    printf("  Binary: Raw bytes\n");
    printf("  Hex:    Space/newline separated hex values\n\n");
    printf("Output format:\n");
    printf("  segment:offset  [bytes]  mnemonic operands\n");
    printf("  e.g., 0000:0100  B8 34 12  MOV AX, #0x1234\n\n");
    printf("Examples:\n");
    printf("  %s program.bin              Disassemble binary file\n", prog);
    printf("  %s -x program.hex           Disassemble hex dump\n", prog);
    printf("  %s -a program.bin           With addresses and hex bytes\n", prog);
    printf("  %s -s 0x1000 program.bin    Set base segment to 0x1000\n", prog);
}

/* ========================================================================
 * Main Entry Point
 * ======================================================================== */

int main(int argc, char *argv[]) {
    const char *filename = NULL;
    bool hex_input = false;
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
        else if (strcmp(argv[i], "-a") == 0) {
            show_hex = true;
        }
        else if (strcmp(argv[i], "-l") == 0) {
            gen_labels = false;
        }
        else if (strcmp(argv[i], "-s") == 0 && i + 1 < argc) {
            base_segment = (uint16_t)strtol(argv[++i], NULL, 16);
        }
        else if (strcmp(argv[i], "-o") == 0 && i + 1 < argc) {
            base_offset = (uint16_t)strtol(argv[++i], NULL, 16);
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
    disassemble(show_hex);

    /* Cleanup */
    if (memory) {
        free(memory);
    }

    return 0;
}
