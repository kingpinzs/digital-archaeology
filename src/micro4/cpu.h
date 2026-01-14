/*
 * Micro4 Minimal CPU Emulator
 *
 * The most basic 4-bit CPU implementation
 * - 4-bit data bus
 * - 8-bit address bus (256 nibbles)
 * - Accumulator architecture
 * - 8 instructions
 */

#ifndef MICRO4_CPU_H
#define MICRO4_CPU_H

#include <stdint.h>
#include <stdbool.h>

/* Memory size: 256 nibbles (128 bytes) */
#define MEM_SIZE 256

/* Opcodes */
#define OP_HLT  0x0   /* Halt execution */
#define OP_LDA  0x1   /* Load accumulator from memory */
#define OP_STA  0x2   /* Store accumulator to memory */
#define OP_ADD  0x3   /* Add memory to accumulator */
#define OP_SUB  0x4   /* Subtract memory from accumulator */
#define OP_JMP  0x5   /* Unconditional jump */
#define OP_JZ   0x6   /* Jump if zero flag set */
#define OP_LDI  0x7   /* Load immediate (4-bit value) */

/* CPU State */
typedef struct {
    /* Registers */
    uint8_t pc;        /* Program Counter (8-bit) */
    uint8_t a;         /* Accumulator (4-bit, stored in low nibble) */
    bool    z;         /* Zero flag */

    /* Internal registers (for debugging/visualization) */
    uint8_t ir;        /* Instruction Register */
    uint8_t mar;       /* Memory Address Register */
    uint8_t mdr;       /* Memory Data Register */

    /* Memory */
    uint8_t memory[MEM_SIZE];  /* Each element is a nibble (4-bit) */

    /* State */
    bool    halted;    /* CPU has executed HLT */
    bool    error;     /* An error occurred */
    char    error_msg[128];

    /* Statistics */
    uint64_t cycles;       /* Total clock cycles */
    uint64_t instructions; /* Instructions executed */
} Micro4CPU;

/* CPU Lifecycle */
void cpu_init(Micro4CPU *cpu);
void cpu_reset(Micro4CPU *cpu);

/* Memory Operations */
void cpu_load_program(Micro4CPU *cpu, const uint8_t *program, uint16_t size, uint8_t start_addr);
uint8_t cpu_read_mem(Micro4CPU *cpu, uint8_t addr);
void cpu_write_mem(Micro4CPU *cpu, uint8_t addr, uint8_t value);

/* Execution */
int cpu_step(Micro4CPU *cpu);           /* Execute one instruction, returns cycles used */
int cpu_run(Micro4CPU *cpu, int max_cycles);  /* Run until halt or max_cycles */

/* Debugging */
void cpu_dump_state(const Micro4CPU *cpu);
void cpu_dump_memory(const Micro4CPU *cpu, uint8_t start, uint8_t end);
const char* cpu_disassemble(uint8_t opcode, uint8_t operand);

/* Instruction names for debugging */
extern const char* OPCODE_NAMES[16];

#endif /* MICRO4_CPU_H */
