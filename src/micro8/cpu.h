/*
 * Micro8 CPU Emulator
 *
 * 8-bit CPU with expanded capabilities:
 * - 8-bit data bus
 * - 16-bit address bus (64KB)
 * - 8 x 8-bit general purpose registers (R0-R7)
 * - Stack pointer (SP)
 * - Program counter (PC)
 * - Flags: Zero, Carry, Sign, Overflow
 */

#ifndef MICRO8_CPU_H
#define MICRO8_CPU_H

#include <stdint.h>
#include <stdbool.h>

/* Memory size: 64KB */
#define MEM_SIZE 65536

/* Register indices */
#define REG_R0 0
#define REG_R1 1
#define REG_R2 2
#define REG_R3 3
#define REG_R4 4
#define REG_R5 5
#define REG_R6 6
#define REG_R7 7

/* Opcodes */
#define OP_NOP   0x00   /* No operation */
#define OP_HLT   0x01   /* Halt execution */

/* Data movement */
#define OP_MOV_RR  0x10   /* MOV Rd, Rs - Register to register */
#define OP_MOV_RI  0x11   /* MOV Rd, imm8 - Immediate to register */
#define OP_MOV_RM  0x12   /* MOV Rd, [addr16] - Memory to register */
#define OP_MOV_MR  0x13   /* MOV [addr16], Rs - Register to memory */

/* Arithmetic */
#define OP_ADD_RR  0x20   /* ADD Rd, Rs - Rd = Rd + Rs */
#define OP_ADD_RI  0x21   /* ADD Rd, imm8 - Rd = Rd + imm8 */
#define OP_SUB_RR  0x22   /* SUB Rd, Rs - Rd = Rd - Rs */
#define OP_SUB_RI  0x23   /* SUB Rd, imm8 - Rd = Rd - imm8 */

/* Stack operations */
#define OP_PUSH    0x30   /* PUSH Rs - Push register to stack */
#define OP_POP     0x31   /* POP Rd - Pop from stack to register */

/* Control flow */
#define OP_JMP     0x40   /* JMP addr16 - Unconditional jump */
#define OP_JZ      0x41   /* JZ addr16 - Jump if zero */
#define OP_JNZ     0x42   /* JNZ addr16 - Jump if not zero */
#define OP_JC      0x43   /* JC addr16 - Jump if carry */
#define OP_JNC     0x44   /* JNC addr16 - Jump if not carry */
#define OP_CALL    0x50   /* CALL addr16 - Call subroutine */
#define OP_RET     0x51   /* RET - Return from subroutine */

/* Flags register bits */
#define FLAG_Z  0x01   /* Zero flag */
#define FLAG_C  0x02   /* Carry flag */
#define FLAG_S  0x04   /* Sign flag (negative) */
#define FLAG_O  0x08   /* Overflow flag */

/* CPU State */
typedef struct {
    /* General purpose registers */
    uint8_t r[8];      /* R0-R7 */

    /* Special registers */
    uint16_t pc;       /* Program Counter (16-bit) */
    uint16_t sp;       /* Stack Pointer (16-bit) */
    uint8_t  flags;    /* Flags register (Z, C, S, O) */

    /* Internal registers (for debugging/visualization) */
    uint8_t  ir;       /* Instruction Register */
    uint16_t mar;      /* Memory Address Register */
    uint8_t  mdr;      /* Memory Data Register */

    /* Memory */
    uint8_t *memory;   /* 64KB memory (dynamically allocated) */

    /* State */
    bool    halted;    /* CPU has executed HLT */
    bool    error;     /* An error occurred */
    char    error_msg[128];

    /* Statistics */
    uint64_t cycles;       /* Total clock cycles */
    uint64_t instructions; /* Instructions executed */
} Micro8CPU;

/* CPU Lifecycle */
bool cpu_init(Micro8CPU *cpu);
void cpu_free(Micro8CPU *cpu);
void cpu_reset(Micro8CPU *cpu);

/* Memory Operations */
void cpu_load_program(Micro8CPU *cpu, const uint8_t *program, uint16_t size, uint16_t start_addr);
uint8_t cpu_read_mem(Micro8CPU *cpu, uint16_t addr);
void cpu_write_mem(Micro8CPU *cpu, uint16_t addr, uint8_t value);

/* Execution */
int cpu_step(Micro8CPU *cpu);           /* Execute one instruction, returns cycles used */
int cpu_run(Micro8CPU *cpu, int max_cycles);  /* Run until halt or max_cycles */

/* Debugging */
void cpu_dump_state(const Micro8CPU *cpu);
void cpu_dump_memory(const Micro8CPU *cpu, uint16_t start, uint16_t end);
const char* cpu_disassemble(const Micro8CPU *cpu, uint16_t addr, int *instr_len);

/* Instruction names for debugging */
extern const char* OPCODE_NAMES[];

#endif /* MICRO8_CPU_H */
