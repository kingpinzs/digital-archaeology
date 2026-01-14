/*
 * Micro4 Minimal CPU Emulator - Implementation
 */

#include "cpu.h"
#include <stdio.h>
#include <string.h>

/* Instruction names */
const char* OPCODE_NAMES[16] = {
    "HLT", "LDA", "STA", "ADD", "SUB", "JMP", "JZ", "LDI",
    "???", "???", "???", "???", "???", "???", "???", "???"
};

/* Mask to keep values to 4 bits */
#define NIBBLE_MASK 0x0F

/*
 * Initialize CPU to default state
 */
void cpu_init(Micro4CPU *cpu) {
    memset(cpu, 0, sizeof(Micro4CPU));
    cpu_reset(cpu);
}

/*
 * Reset CPU (but keep memory contents)
 */
void cpu_reset(Micro4CPU *cpu) {
    cpu->pc = 0;
    cpu->a = 0;
    cpu->z = false;
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
void cpu_load_program(Micro4CPU *cpu, const uint8_t *program, uint16_t size, uint8_t start_addr) {
    for (uint16_t i = 0; i < size && (start_addr + i) < MEM_SIZE; i++) {
        cpu->memory[start_addr + i] = program[i] & NIBBLE_MASK;
    }
}

/*
 * Read from memory
 */
uint8_t cpu_read_mem(Micro4CPU *cpu, uint8_t addr) {
    return cpu->memory[addr] & NIBBLE_MASK;
}

/*
 * Write to memory
 */
void cpu_write_mem(Micro4CPU *cpu, uint8_t addr, uint8_t value) {
    cpu->memory[addr] = value & NIBBLE_MASK;
}

/*
 * Fetch byte from memory at PC, increment PC
 * Returns the full 8-bit value (two nibbles packed)
 */
static uint8_t fetch_byte(Micro4CPU *cpu) {
    uint8_t high = cpu->memory[cpu->pc] & NIBBLE_MASK;
    cpu->pc++;
    uint8_t low = cpu->memory[cpu->pc] & NIBBLE_MASK;
    cpu->pc++;
    return (high << 4) | low;
}

/*
 * Execute one instruction
 * Returns number of cycles used
 */
int cpu_step(Micro4CPU *cpu) {
    if (cpu->halted) {
        return 0;
    }

    if (cpu->pc >= MEM_SIZE - 1) {
        cpu->error = true;
        snprintf(cpu->error_msg, sizeof(cpu->error_msg),
                 "PC out of bounds: 0x%02X", cpu->pc);
        cpu->halted = true;
        return 0;
    }

    int cycles = 0;

    /* Fetch instruction (opcode byte) */
    cpu->ir = fetch_byte(cpu);
    cycles += 2;  /* Fetch takes 2 cycles (2 nibble reads) */

    uint8_t opcode = (cpu->ir >> 4) & NIBBLE_MASK;
    uint8_t operand = cpu->ir & NIBBLE_MASK;

    uint8_t addr;
    uint8_t value;

    switch (opcode) {
        case OP_HLT:  /* Halt */
            cpu->halted = true;
            cycles += 1;
            break;

        case OP_LDA:  /* Load Accumulator from memory */
            /* Fetch address byte */
            addr = fetch_byte(cpu);
            cycles += 2;
            /* Read from memory */
            cpu->mar = addr;
            cpu->mdr = cpu_read_mem(cpu, addr);
            cpu->a = cpu->mdr;
            cpu->z = (cpu->a == 0);
            cycles += 1;
            break;

        case OP_STA:  /* Store Accumulator to memory */
            /* Fetch address byte */
            addr = fetch_byte(cpu);
            cycles += 2;
            /* Write to memory */
            cpu->mar = addr;
            cpu->mdr = cpu->a;
            cpu_write_mem(cpu, addr, cpu->a);
            cycles += 1;
            break;

        case OP_ADD:  /* Add memory to Accumulator */
            /* Fetch address byte */
            addr = fetch_byte(cpu);
            cycles += 2;
            /* Read and add */
            cpu->mar = addr;
            cpu->mdr = cpu_read_mem(cpu, addr);
            cpu->a = (cpu->a + cpu->mdr) & NIBBLE_MASK;
            cpu->z = (cpu->a == 0);
            cycles += 1;
            break;

        case OP_SUB:  /* Subtract memory from Accumulator */
            /* Fetch address byte */
            addr = fetch_byte(cpu);
            cycles += 2;
            /* Read and subtract */
            cpu->mar = addr;
            cpu->mdr = cpu_read_mem(cpu, addr);
            cpu->a = (cpu->a - cpu->mdr) & NIBBLE_MASK;
            cpu->z = (cpu->a == 0);
            cycles += 1;
            break;

        case OP_JMP:  /* Unconditional Jump */
            /* Fetch address byte */
            addr = fetch_byte(cpu);
            cycles += 2;
            /* Jump */
            cpu->pc = addr;
            break;

        case OP_JZ:   /* Jump if Zero */
            /* Fetch address byte */
            addr = fetch_byte(cpu);
            cycles += 2;
            /* Conditional jump */
            if (cpu->z) {
                cpu->pc = addr;
            }
            cycles += 1;
            break;

        case OP_LDI:  /* Load Immediate */
            cpu->a = operand;
            cpu->z = (cpu->a == 0);
            cycles += 1;
            break;

        default:
            /* Unknown opcode */
            cpu->error = true;
            snprintf(cpu->error_msg, sizeof(cpu->error_msg),
                     "Unknown opcode: 0x%X at PC=0x%02X", opcode, cpu->pc - 2);
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
int cpu_run(Micro4CPU *cpu, int max_cycles) {
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
void cpu_dump_state(const Micro4CPU *cpu) {
    printf("=== Micro4 CPU State ===\n");
    printf("PC: 0x%02X  A: 0x%X  Z: %d\n",
           cpu->pc, cpu->a, cpu->z);
    printf("IR: 0x%02X  MAR: 0x%02X  MDR: 0x%X\n",
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
void cpu_dump_memory(const Micro4CPU *cpu, uint8_t start, uint8_t end) {
    printf("Memory [0x%02X - 0x%02X]:\n", start, end);

    for (uint16_t addr = start; addr <= end; addr += 16) {
        printf("0x%02X: ", (uint8_t)addr);
        for (int i = 0; i < 16 && (addr + i) <= end; i++) {
            printf("%X ", cpu->memory[addr + i]);
        }
        printf("\n");
    }
}

/*
 * Disassemble a single instruction
 */
static char disasm_buf[64];

const char* cpu_disassemble(uint8_t opcode, uint8_t operand) {
    uint8_t op = (opcode >> 4) & NIBBLE_MASK;
    uint8_t imm = opcode & NIBBLE_MASK;

    switch (op) {
        case OP_HLT:
            snprintf(disasm_buf, sizeof(disasm_buf), "HLT");
            break;
        case OP_LDA:
            snprintf(disasm_buf, sizeof(disasm_buf), "LDA 0x%02X", operand);
            break;
        case OP_STA:
            snprintf(disasm_buf, sizeof(disasm_buf), "STA 0x%02X", operand);
            break;
        case OP_ADD:
            snprintf(disasm_buf, sizeof(disasm_buf), "ADD 0x%02X", operand);
            break;
        case OP_SUB:
            snprintf(disasm_buf, sizeof(disasm_buf), "SUB 0x%02X", operand);
            break;
        case OP_JMP:
            snprintf(disasm_buf, sizeof(disasm_buf), "JMP 0x%02X", operand);
            break;
        case OP_JZ:
            snprintf(disasm_buf, sizeof(disasm_buf), "JZ  0x%02X", operand);
            break;
        case OP_LDI:
            snprintf(disasm_buf, sizeof(disasm_buf), "LDI %d", imm);
            break;
        default:
            snprintf(disasm_buf, sizeof(disasm_buf), "??? 0x%02X", opcode);
            break;
    }

    return disasm_buf;
}
