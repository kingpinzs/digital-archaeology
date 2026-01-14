/*
 * Micro8 CPU Emulator - Implementation
 */

#include "cpu.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Instruction names */
const char* OPCODE_NAMES[] = {
    [OP_NOP]    = "NOP",
    [OP_HLT]    = "HLT",
    [OP_MOV_RR] = "MOV",
    [OP_MOV_RI] = "MOV",
    [OP_MOV_RM] = "MOV",
    [OP_MOV_MR] = "MOV",
    [OP_ADD_RR] = "ADD",
    [OP_ADD_RI] = "ADD",
    [OP_SUB_RR] = "SUB",
    [OP_SUB_RI] = "SUB",
    [OP_PUSH]   = "PUSH",
    [OP_POP]    = "POP",
    [OP_JMP]    = "JMP",
    [OP_JZ]     = "JZ",
    [OP_JNZ]    = "JNZ",
    [OP_JC]     = "JC",
    [OP_JNC]    = "JNC",
    [OP_CALL]   = "CALL",
    [OP_RET]    = "RET",
};

/* Register names */
static const char* REG_NAMES[] = {
    "R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7"
};

/*
 * Update flags based on result
 */
static void update_flags_zs(Micro8CPU *cpu, uint8_t result) {
    /* Zero flag */
    if (result == 0) {
        cpu->flags |= FLAG_Z;
    } else {
        cpu->flags &= ~FLAG_Z;
    }

    /* Sign flag (bit 7) */
    if (result & 0x80) {
        cpu->flags |= FLAG_S;
    } else {
        cpu->flags &= ~FLAG_S;
    }
}

/*
 * Update flags for addition
 */
static void update_flags_add(Micro8CPU *cpu, uint8_t a, uint8_t b, uint16_t result) {
    update_flags_zs(cpu, (uint8_t)result);

    /* Carry flag */
    if (result > 0xFF) {
        cpu->flags |= FLAG_C;
    } else {
        cpu->flags &= ~FLAG_C;
    }

    /* Overflow flag: set if sign of result differs from expected */
    uint8_t res8 = (uint8_t)result;
    if (((a ^ res8) & (b ^ res8) & 0x80) != 0) {
        cpu->flags |= FLAG_O;
    } else {
        cpu->flags &= ~FLAG_O;
    }
}

/*
 * Update flags for subtraction
 */
static void update_flags_sub(Micro8CPU *cpu, uint8_t a, uint8_t b, uint16_t result) {
    update_flags_zs(cpu, (uint8_t)result);

    /* Carry flag (borrow) */
    if (a < b) {
        cpu->flags |= FLAG_C;
    } else {
        cpu->flags &= ~FLAG_C;
    }

    /* Overflow flag */
    uint8_t res8 = (uint8_t)result;
    if (((a ^ b) & (a ^ res8) & 0x80) != 0) {
        cpu->flags |= FLAG_O;
    } else {
        cpu->flags &= ~FLAG_O;
    }
}

/*
 * Initialize CPU to default state
 */
bool cpu_init(Micro8CPU *cpu) {
    memset(cpu, 0, sizeof(Micro8CPU));

    /* Allocate memory */
    cpu->memory = (uint8_t *)calloc(MEM_SIZE, sizeof(uint8_t));
    if (cpu->memory == NULL) {
        cpu->error = true;
        snprintf(cpu->error_msg, sizeof(cpu->error_msg), "Failed to allocate memory");
        return false;
    }

    cpu_reset(cpu);
    return true;
}

/*
 * Free CPU resources
 */
void cpu_free(Micro8CPU *cpu) {
    if (cpu->memory != NULL) {
        free(cpu->memory);
        cpu->memory = NULL;
    }
}

/*
 * Reset CPU (but keep memory contents)
 */
void cpu_reset(Micro8CPU *cpu) {
    /* Clear registers */
    for (int i = 0; i < 8; i++) {
        cpu->r[i] = 0;
    }

    cpu->pc = 0;
    cpu->sp = 0xFFFF;  /* Stack grows downward from top of memory */
    cpu->flags = 0;

    cpu->ir = 0;
    cpu->mar = 0;
    cpu->mdr = 0;

    cpu->halted = false;
    cpu->error = false;
    cpu->error_msg[0] = '\0';
    cpu->cycles = 0;
    cpu->instructions = 0;
}

/*
 * Load a program into memory
 */
void cpu_load_program(Micro8CPU *cpu, const uint8_t *program, uint16_t size, uint16_t start_addr) {
    for (uint32_t i = 0; i < size && (start_addr + i) < MEM_SIZE; i++) {
        cpu->memory[start_addr + i] = program[i];
    }
}

/*
 * Read from memory
 */
uint8_t cpu_read_mem(Micro8CPU *cpu, uint16_t addr) {
    cpu->mar = addr;
    cpu->mdr = cpu->memory[addr];
    return cpu->mdr;
}

/*
 * Write to memory
 */
void cpu_write_mem(Micro8CPU *cpu, uint16_t addr, uint8_t value) {
    cpu->mar = addr;
    cpu->mdr = value;
    cpu->memory[addr] = value;
}

/*
 * Fetch byte from memory at PC, increment PC
 */
static uint8_t fetch_byte(Micro8CPU *cpu) {
    uint8_t value = cpu_read_mem(cpu, cpu->pc);
    cpu->pc++;
    return value;
}

/*
 * Fetch 16-bit word from memory (little-endian)
 */
static uint16_t fetch_word(Micro8CPU *cpu) {
    uint8_t low = fetch_byte(cpu);
    uint8_t high = fetch_byte(cpu);
    return (uint16_t)low | ((uint16_t)high << 8);
}

/*
 * Push byte onto stack
 */
static void push_byte(Micro8CPU *cpu, uint8_t value) {
    cpu_write_mem(cpu, cpu->sp, value);
    cpu->sp--;
}

/*
 * Pop byte from stack
 */
static uint8_t pop_byte(Micro8CPU *cpu) {
    cpu->sp++;
    return cpu_read_mem(cpu, cpu->sp);
}

/*
 * Push 16-bit word onto stack (high byte first, so low byte at lower address)
 */
static void push_word(Micro8CPU *cpu, uint16_t value) {
    push_byte(cpu, (uint8_t)(value >> 8));   /* High byte */
    push_byte(cpu, (uint8_t)(value & 0xFF)); /* Low byte */
}

/*
 * Pop 16-bit word from stack
 */
static uint16_t pop_word(Micro8CPU *cpu) {
    uint8_t low = pop_byte(cpu);
    uint8_t high = pop_byte(cpu);
    return (uint16_t)low | ((uint16_t)high << 8);
}

/*
 * Execute one instruction
 * Returns number of cycles used
 */
int cpu_step(Micro8CPU *cpu) {
    if (cpu->halted) {
        return 0;
    }

    int cycles = 0;

    /* Fetch opcode */
    cpu->ir = fetch_byte(cpu);
    cycles++;

    uint8_t opcode = cpu->ir;
    uint8_t reg_d, reg_s;
    uint8_t imm8;
    uint16_t addr16;
    uint16_t result16;

    switch (opcode) {
        case OP_NOP:  /* No operation */
            cycles++;
            break;

        case OP_HLT:  /* Halt */
            cpu->halted = true;
            cycles++;
            break;

        case OP_MOV_RR:  /* MOV Rd, Rs */
            reg_d = fetch_byte(cpu) & 0x07;
            reg_s = fetch_byte(cpu) & 0x07;
            cpu->r[reg_d] = cpu->r[reg_s];
            cycles += 2;
            break;

        case OP_MOV_RI:  /* MOV Rd, imm8 */
            reg_d = fetch_byte(cpu) & 0x07;
            imm8 = fetch_byte(cpu);
            cpu->r[reg_d] = imm8;
            cycles += 2;
            break;

        case OP_MOV_RM:  /* MOV Rd, [addr16] */
            reg_d = fetch_byte(cpu) & 0x07;
            addr16 = fetch_word(cpu);
            cpu->r[reg_d] = cpu_read_mem(cpu, addr16);
            cycles += 4;
            break;

        case OP_MOV_MR:  /* MOV [addr16], Rs */
            reg_s = fetch_byte(cpu) & 0x07;
            addr16 = fetch_word(cpu);
            cpu_write_mem(cpu, addr16, cpu->r[reg_s]);
            cycles += 4;
            break;

        case OP_ADD_RR:  /* ADD Rd, Rs */
            reg_d = fetch_byte(cpu) & 0x07;
            reg_s = fetch_byte(cpu) & 0x07;
            result16 = (uint16_t)cpu->r[reg_d] + (uint16_t)cpu->r[reg_s];
            update_flags_add(cpu, cpu->r[reg_d], cpu->r[reg_s], result16);
            cpu->r[reg_d] = (uint8_t)result16;
            cycles += 2;
            break;

        case OP_ADD_RI:  /* ADD Rd, imm8 */
            reg_d = fetch_byte(cpu) & 0x07;
            imm8 = fetch_byte(cpu);
            result16 = (uint16_t)cpu->r[reg_d] + (uint16_t)imm8;
            update_flags_add(cpu, cpu->r[reg_d], imm8, result16);
            cpu->r[reg_d] = (uint8_t)result16;
            cycles += 2;
            break;

        case OP_SUB_RR:  /* SUB Rd, Rs */
            reg_d = fetch_byte(cpu) & 0x07;
            reg_s = fetch_byte(cpu) & 0x07;
            result16 = (uint16_t)cpu->r[reg_d] - (uint16_t)cpu->r[reg_s];
            update_flags_sub(cpu, cpu->r[reg_d], cpu->r[reg_s], result16);
            cpu->r[reg_d] = (uint8_t)result16;
            cycles += 2;
            break;

        case OP_SUB_RI:  /* SUB Rd, imm8 */
            reg_d = fetch_byte(cpu) & 0x07;
            imm8 = fetch_byte(cpu);
            result16 = (uint16_t)cpu->r[reg_d] - (uint16_t)imm8;
            update_flags_sub(cpu, cpu->r[reg_d], imm8, result16);
            cpu->r[reg_d] = (uint8_t)result16;
            cycles += 2;
            break;

        case OP_PUSH:  /* PUSH Rs */
            reg_s = fetch_byte(cpu) & 0x07;
            push_byte(cpu, cpu->r[reg_s]);
            cycles += 3;
            break;

        case OP_POP:  /* POP Rd */
            reg_d = fetch_byte(cpu) & 0x07;
            cpu->r[reg_d] = pop_byte(cpu);
            cycles += 3;
            break;

        case OP_JMP:  /* JMP addr16 */
            addr16 = fetch_word(cpu);
            cpu->pc = addr16;
            cycles += 3;
            break;

        case OP_JZ:  /* JZ addr16 */
            addr16 = fetch_word(cpu);
            if (cpu->flags & FLAG_Z) {
                cpu->pc = addr16;
            }
            cycles += 3;
            break;

        case OP_JNZ:  /* JNZ addr16 */
            addr16 = fetch_word(cpu);
            if (!(cpu->flags & FLAG_Z)) {
                cpu->pc = addr16;
            }
            cycles += 3;
            break;

        case OP_JC:  /* JC addr16 */
            addr16 = fetch_word(cpu);
            if (cpu->flags & FLAG_C) {
                cpu->pc = addr16;
            }
            cycles += 3;
            break;

        case OP_JNC:  /* JNC addr16 */
            addr16 = fetch_word(cpu);
            if (!(cpu->flags & FLAG_C)) {
                cpu->pc = addr16;
            }
            cycles += 3;
            break;

        case OP_CALL:  /* CALL addr16 */
            addr16 = fetch_word(cpu);
            push_word(cpu, cpu->pc);  /* Push return address */
            cpu->pc = addr16;
            cycles += 5;
            break;

        case OP_RET:  /* RET */
            cpu->pc = pop_word(cpu);
            cycles += 4;
            break;

        default:
            /* Unknown opcode */
            cpu->error = true;
            snprintf(cpu->error_msg, sizeof(cpu->error_msg),
                     "Unknown opcode: 0x%02X at PC=0x%04X", opcode, cpu->pc - 1);
            cpu->halted = true;
            return cycles;
    }

    cpu->instructions++;
    cpu->cycles += cycles;

    return cycles;
}

/*
 * Run CPU until halted or max_cycles reached
 * Returns total cycles executed
 */
int cpu_run(Micro8CPU *cpu, int max_cycles) {
    int total_cycles = 0;

    while (!cpu->halted && (max_cycles <= 0 || total_cycles < max_cycles)) {
        int cycles = cpu_step(cpu);
        if (cycles == 0) break;
        total_cycles += cycles;
    }

    return total_cycles;
}

/*
 * Dump CPU state for debugging
 */
void cpu_dump_state(const Micro8CPU *cpu) {
    printf("=== Micro8 CPU State ===\n");
    printf("PC: 0x%04X  SP: 0x%04X\n", cpu->pc, cpu->sp);
    printf("Flags: %c%c%c%c (0x%02X)\n",
           (cpu->flags & FLAG_Z) ? 'Z' : '-',
           (cpu->flags & FLAG_C) ? 'C' : '-',
           (cpu->flags & FLAG_S) ? 'S' : '-',
           (cpu->flags & FLAG_O) ? 'O' : '-',
           cpu->flags);
    printf("R0: 0x%02X  R1: 0x%02X  R2: 0x%02X  R3: 0x%02X\n",
           cpu->r[0], cpu->r[1], cpu->r[2], cpu->r[3]);
    printf("R4: 0x%02X  R5: 0x%02X  R6: 0x%02X  R7: 0x%02X\n",
           cpu->r[4], cpu->r[5], cpu->r[6], cpu->r[7]);
    printf("IR: 0x%02X  MAR: 0x%04X  MDR: 0x%02X\n",
           cpu->ir, cpu->mar, cpu->mdr);
    printf("Halted: %s  Error: %s\n",
           cpu->halted ? "YES" : "NO",
           cpu->error ? "YES" : "NO");
    if (cpu->error) {
        printf("Error: %s\n", cpu->error_msg);
    }
    printf("Cycles: %lu  Instructions: %lu\n",
           (unsigned long)cpu->cycles,
           (unsigned long)cpu->instructions);
    printf("========================\n");
}

/*
 * Dump memory range
 */
void cpu_dump_memory(const Micro8CPU *cpu, uint16_t start, uint16_t end) {
    printf("Memory [0x%04X - 0x%04X]:\n", start, end);

    for (uint32_t addr = start; addr <= end; addr += 16) {
        printf("0x%04X: ", (uint16_t)addr);
        for (int i = 0; i < 16 && (addr + i) <= end; i++) {
            printf("%02X ", cpu->memory[addr + i]);
        }
        printf(" |");
        for (int i = 0; i < 16 && (addr + i) <= end; i++) {
            uint8_t c = cpu->memory[addr + i];
            printf("%c", (c >= 32 && c < 127) ? c : '.');
        }
        printf("|\n");
    }
}

/*
 * Disassemble a single instruction at given address
 * Returns pointer to static buffer, sets instr_len to instruction length
 */
static char disasm_buf[64];

const char* cpu_disassemble(const Micro8CPU *cpu, uint16_t addr, int *instr_len) {
    uint8_t opcode = cpu->memory[addr];
    uint8_t reg_d, reg_s, imm8;
    uint16_t addr16;

    *instr_len = 1;  /* Default */

    switch (opcode) {
        case OP_NOP:
            snprintf(disasm_buf, sizeof(disasm_buf), "NOP");
            *instr_len = 1;
            break;

        case OP_HLT:
            snprintf(disasm_buf, sizeof(disasm_buf), "HLT");
            *instr_len = 1;
            break;

        case OP_MOV_RR:
            reg_d = cpu->memory[addr + 1] & 0x07;
            reg_s = cpu->memory[addr + 2] & 0x07;
            snprintf(disasm_buf, sizeof(disasm_buf), "MOV %s, %s",
                     REG_NAMES[reg_d], REG_NAMES[reg_s]);
            *instr_len = 3;
            break;

        case OP_MOV_RI:
            reg_d = cpu->memory[addr + 1] & 0x07;
            imm8 = cpu->memory[addr + 2];
            snprintf(disasm_buf, sizeof(disasm_buf), "MOV %s, 0x%02X",
                     REG_NAMES[reg_d], imm8);
            *instr_len = 3;
            break;

        case OP_MOV_RM:
            reg_d = cpu->memory[addr + 1] & 0x07;
            addr16 = cpu->memory[addr + 2] | ((uint16_t)cpu->memory[addr + 3] << 8);
            snprintf(disasm_buf, sizeof(disasm_buf), "MOV %s, [0x%04X]",
                     REG_NAMES[reg_d], addr16);
            *instr_len = 4;
            break;

        case OP_MOV_MR:
            reg_s = cpu->memory[addr + 1] & 0x07;
            addr16 = cpu->memory[addr + 2] | ((uint16_t)cpu->memory[addr + 3] << 8);
            snprintf(disasm_buf, sizeof(disasm_buf), "MOV [0x%04X], %s",
                     addr16, REG_NAMES[reg_s]);
            *instr_len = 4;
            break;

        case OP_ADD_RR:
            reg_d = cpu->memory[addr + 1] & 0x07;
            reg_s = cpu->memory[addr + 2] & 0x07;
            snprintf(disasm_buf, sizeof(disasm_buf), "ADD %s, %s",
                     REG_NAMES[reg_d], REG_NAMES[reg_s]);
            *instr_len = 3;
            break;

        case OP_ADD_RI:
            reg_d = cpu->memory[addr + 1] & 0x07;
            imm8 = cpu->memory[addr + 2];
            snprintf(disasm_buf, sizeof(disasm_buf), "ADD %s, 0x%02X",
                     REG_NAMES[reg_d], imm8);
            *instr_len = 3;
            break;

        case OP_SUB_RR:
            reg_d = cpu->memory[addr + 1] & 0x07;
            reg_s = cpu->memory[addr + 2] & 0x07;
            snprintf(disasm_buf, sizeof(disasm_buf), "SUB %s, %s",
                     REG_NAMES[reg_d], REG_NAMES[reg_s]);
            *instr_len = 3;
            break;

        case OP_SUB_RI:
            reg_d = cpu->memory[addr + 1] & 0x07;
            imm8 = cpu->memory[addr + 2];
            snprintf(disasm_buf, sizeof(disasm_buf), "SUB %s, 0x%02X",
                     REG_NAMES[reg_d], imm8);
            *instr_len = 3;
            break;

        case OP_PUSH:
            reg_s = cpu->memory[addr + 1] & 0x07;
            snprintf(disasm_buf, sizeof(disasm_buf), "PUSH %s", REG_NAMES[reg_s]);
            *instr_len = 2;
            break;

        case OP_POP:
            reg_d = cpu->memory[addr + 1] & 0x07;
            snprintf(disasm_buf, sizeof(disasm_buf), "POP %s", REG_NAMES[reg_d]);
            *instr_len = 2;
            break;

        case OP_JMP:
            addr16 = cpu->memory[addr + 1] | ((uint16_t)cpu->memory[addr + 2] << 8);
            snprintf(disasm_buf, sizeof(disasm_buf), "JMP 0x%04X", addr16);
            *instr_len = 3;
            break;

        case OP_JZ:
            addr16 = cpu->memory[addr + 1] | ((uint16_t)cpu->memory[addr + 2] << 8);
            snprintf(disasm_buf, sizeof(disasm_buf), "JZ 0x%04X", addr16);
            *instr_len = 3;
            break;

        case OP_JNZ:
            addr16 = cpu->memory[addr + 1] | ((uint16_t)cpu->memory[addr + 2] << 8);
            snprintf(disasm_buf, sizeof(disasm_buf), "JNZ 0x%04X", addr16);
            *instr_len = 3;
            break;

        case OP_JC:
            addr16 = cpu->memory[addr + 1] | ((uint16_t)cpu->memory[addr + 2] << 8);
            snprintf(disasm_buf, sizeof(disasm_buf), "JC 0x%04X", addr16);
            *instr_len = 3;
            break;

        case OP_JNC:
            addr16 = cpu->memory[addr + 1] | ((uint16_t)cpu->memory[addr + 2] << 8);
            snprintf(disasm_buf, sizeof(disasm_buf), "JNC 0x%04X", addr16);
            *instr_len = 3;
            break;

        case OP_CALL:
            addr16 = cpu->memory[addr + 1] | ((uint16_t)cpu->memory[addr + 2] << 8);
            snprintf(disasm_buf, sizeof(disasm_buf), "CALL 0x%04X", addr16);
            *instr_len = 3;
            break;

        case OP_RET:
            snprintf(disasm_buf, sizeof(disasm_buf), "RET");
            *instr_len = 1;
            break;

        default:
            snprintf(disasm_buf, sizeof(disasm_buf), "DB 0x%02X", opcode);
            *instr_len = 1;
            break;
    }

    return disasm_buf;
}
