/*
 * Micro8 CPU Emulator
 *
 * 8-bit CPU with expanded capabilities:
 * - 8-bit data bus
 * - 16-bit address bus (64KB)
 * - 8 x 8-bit general purpose registers (R0-R7)
 * - Register pairs: BC (R1:R2), DE (R3:R4), HL (R5:R6)
 * - Stack pointer (SP)
 * - Program counter (PC)
 * - Flags: Zero, Carry, Sign, Overflow
 * - Single interrupt level with EI/DI
 */

#ifndef MICRO8_CPU_H
#define MICRO8_CPU_H

#include <stdint.h>
#include <stdbool.h>

/* Memory size: 64KB */
#define MEM_SIZE 65536

/* Default stack location */
#define DEFAULT_SP 0xFFFF

/* Default program start */
#define DEFAULT_PC 0x0200

/* Interrupt vector address */
#define INT_VECTOR 0x0008

/* ========================================================================
 * Register Definitions
 * ======================================================================== */

/* Register indices */
#define REG_R0  0   /* A - Accumulator */
#define REG_R1  1   /* B - Counter */
#define REG_R2  2   /* C - Counter */
#define REG_R3  3   /* D - Data */
#define REG_R4  4   /* E - Extended */
#define REG_R5  5   /* H - High address byte */
#define REG_R6  6   /* L - Low address byte */
#define REG_R7  7   /* General purpose */

/* Register pair indices (for 16-bit ops) */
#define PAIR_HL 0
#define PAIR_BC 1
#define PAIR_DE 2
#define PAIR_SP 3

/* ========================================================================
 * Opcode Definitions (from ISA specification)
 * Encoding matches assembler.c for compatibility
 * ======================================================================== */

/* System (0x00-0x01) */
#define OP_NOP      0x00
#define OP_HLT      0x01

/* LDI Rd, #imm8 - opcodes 0x06-0x0D (register in bits 2:0) */
#define OP_LDI_BASE 0x06

/* LD Rd, [addr16] - opcodes 0x0E-0x15 */
#define OP_LD_BASE  0x0E

/* LDZ Rd, [zp] - opcodes 0x16-0x1D (zero page) */
#define OP_LDZ_BASE 0x16

/* ST [addr16], Rd - opcodes 0x1E-0x25 */
#define OP_ST_BASE  0x1E

/* STZ [zp], Rd - opcodes 0x26-0x2D (zero page) */
#define OP_STZ_BASE 0x26

/* Indirect addressing via HL */
#define OP_LD_HL    0x2E    /* LD Rd, [HL] - uses next byte for Rd */
#define OP_ST_HL    0x2F    /* ST [HL], Rs - uses next byte for Rs */
#define OP_LD_HLD   0x30    /* LD Rd, [HL+d] - indexed */
#define OP_ST_HLD   0x31    /* ST [HL+d], Rs - indexed */

/* 16-bit load immediate */
#define OP_LDI16_HL 0x32
#define OP_LDI16_BC 0x33
#define OP_LDI16_DE 0x34
#define OP_LDI16_SP 0x35

/* 16-bit moves */
#define OP_MOV16_HL_SP 0x36  /* MOV16 SP, HL */
#define OP_MOV16_SP_HL 0x37  /* MOV16 HL, SP */

/* Logic immediate (0x38-0x3A) */
#define OP_ANDI     0x38
#define OP_ORI      0x39
#define OP_XORI     0x3A

/* Shifts/Rotates (0x3B-0x3F) - register in next byte */
#define OP_SHL      0x3B
#define OP_SHR      0x3C
#define OP_SAR      0x3D    /* Arithmetic shift right (preserves sign) */
#define OP_ROL      0x3E
#define OP_ROR      0x3F

/* Arithmetic register-register: destination is ALWAYS R0
 * Format: base_opcode + source_register
 * Example: ADD R0, R3 = 0x40 + 3 = 0x43 */
#define OP_ADD_BASE  0x40   /* 0x40-0x47: ADD R0, Rs */
#define OP_ADC_BASE  0x48   /* 0x48-0x4F */
#define OP_SUB_BASE  0x50   /* 0x50-0x57 */
#define OP_SBC_BASE  0x58   /* 0x58-0x5F */

/* Arithmetic register-immediate */
#define OP_ADDI_BASE 0x60   /* 0x60-0x67 */
#define OP_SUBI_BASE 0x68   /* 0x68-0x6F */

/* Increment/Decrement (register in bits 2:0) */
#define OP_INC_BASE  0x70   /* 0x70-0x77 */
#define OP_DEC_BASE  0x78   /* 0x78-0x7F */

/* Compare operations */
#define OP_CMP_BASE  0x80   /* 0x80-0x87 CMP Rd, Rs */
#define OP_CMPI_BASE 0x88   /* 0x88-0x8F CMPI Rd, #imm8 */

/* 16-bit arithmetic */
#define OP_INC16_HL    0x90
#define OP_DEC16_HL    0x91
#define OP_INC16_BC    0x92
#define OP_DEC16_BC    0x93
#define OP_ADD16_HL_BC 0x94
#define OP_ADD16_HL_DE 0x95
#define OP_NEG         0x96  /* NEG Rd - two's complement (uses next byte for Rd) */

/* Logic register-register (dest in bits 2:0, src in next byte) */
#define OP_AND_BASE  0xA0   /* 0xA0-0xA7 */
#define OP_OR_BASE   0xA8   /* 0xA8-0xAF */
#define OP_XOR_BASE  0xB0   /* 0xB0-0xB7 */
#define OP_NOT_BASE  0xB8   /* 0xB8-0xBF NOT Rd */

/* Control flow - Absolute jumps (0xC0-0xC9) */
#define OP_JMP      0xC0    /* JMP addr16 */
#define OP_JR       0xC1    /* JR offset8 (relative) */
#define OP_JZ       0xC2    /* JZ addr16 */
#define OP_JNZ      0xC3    /* JNZ addr16 */
#define OP_JC       0xC4    /* JC addr16 */
#define OP_JNC      0xC5    /* JNC addr16 */
#define OP_JS       0xC6    /* JS addr16 (jump if sign/negative) */
#define OP_JNS      0xC7    /* JNS addr16 */
#define OP_JO       0xC8    /* JO addr16 (jump if overflow) */
#define OP_JNO      0xC9    /* JNO addr16 */

/* Control flow - Relative jumps (0xCA-0xCD) */
#define OP_JRZ      0xCA    /* JRZ offset8 */
#define OP_JRNZ     0xCB    /* JRNZ offset8 */
#define OP_JRC      0xCC    /* JRC offset8 */
#define OP_JRNC     0xCD    /* JRNC offset8 */

/* Control flow - Indirect and calls */
#define OP_JP_HL    0xCE    /* JP HL - jump to address in HL */
#define OP_CALL     0xCF    /* CALL addr16 */

/* Returns */
#define OP_RET      0xD0    /* RET - return from subroutine */
#define OP_RETI     0xD1    /* RETI - return from interrupt */

/* Stack operations - PUSH (0xD2-0xD9) */
#define OP_PUSH_BASE 0xD2   /* PUSH Rd - register in bits 2:0 */

/* Stack operations - POP (0xDA-0xE1) */
#define OP_POP_BASE  0xDA   /* POP Rd - register in bits 2:0 */

/* 16-bit stack operations */
#define OP_PUSH16_HL 0xE2
#define OP_POP16_HL  0xE3
#define OP_PUSH16_BC 0xE4
#define OP_POP16_BC  0xE5

/* Flags stack */
#define OP_PUSHF    0xE6
#define OP_POPF     0xE7

/* System - Interrupt control */
#define OP_EI       0xE8    /* Enable interrupts */
#define OP_DI       0xE9    /* Disable interrupts */

/* System - Flag manipulation */
#define OP_SCF      0xEA    /* Set carry flag */
#define OP_CCF      0xEB    /* Clear carry flag */
#define OP_CMF      0xEC    /* Complement (toggle) carry flag */

/* I/O operations */
#define OP_IN       0xED    /* IN Rd, port8 */
#define OP_OUT      0xEE    /* OUT port8, Rs */

/* Miscellaneous */
#define OP_SWAP     0xEF    /* SWAP Rd - swap nibbles */

/* Register-to-register MOV (0xF0) - 2 byte: opcode, (rd<<4)|rs */
#define OP_MOV_RR   0xF0    /* MOV Rd, Rs - register to register */

/* ========================================================================
 * Flags Register
 * ======================================================================== */

/* Flags register bit positions (matching ISA spec) */
#define FLAG_C  0x01   /* Bit 0: Carry flag */
#define FLAG_O  0x04   /* Bit 2: Overflow flag */
#define FLAG_Z  0x40   /* Bit 6: Zero flag */
#define FLAG_S  0x80   /* Bit 7: Sign flag (negative) */

/* ========================================================================
 * CPU State Structure
 * ======================================================================== */

typedef struct {
    /* General purpose registers */
    uint8_t r[8];      /* R0-R7 */

    /* Special registers */
    uint16_t pc;       /* Program Counter (16-bit) */
    uint16_t sp;       /* Stack Pointer (16-bit) */
    uint8_t  flags;    /* Flags register (Z, C, S, O) */

    /* Interrupt state */
    bool    ie;        /* Interrupt enable flag */
    bool    int_pending; /* Interrupt pending */

    /* Internal registers (for debugging/visualization) */
    uint8_t  ir;       /* Instruction Register */
    uint16_t mar;      /* Memory Address Register */
    uint8_t  mdr;      /* Memory Data Register */

    /* Memory */
    uint8_t *memory;   /* 64KB memory (dynamically allocated) */

    /* I/O ports (256 ports) */
    uint8_t ports[256];

    /* State */
    bool    halted;    /* CPU has executed HLT */
    bool    error;     /* An error occurred */
    char    error_msg[128];

    /* Statistics */
    uint64_t cycles;       /* Total clock cycles */
    uint64_t instructions; /* Instructions executed */
} Micro8CPU;

/* ========================================================================
 * Function Declarations
 * ======================================================================== */

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

/* Interrupts */
void cpu_request_interrupt(Micro8CPU *cpu);

/* Debugging */
void cpu_dump_state(const Micro8CPU *cpu);
void cpu_dump_memory(const Micro8CPU *cpu, uint16_t start, uint16_t end);
const char* cpu_disassemble(const Micro8CPU *cpu, uint16_t addr, int *instr_len);

/* Register pair helpers */
static inline uint16_t cpu_get_hl(const Micro8CPU *cpu) {
    return ((uint16_t)cpu->r[REG_R5] << 8) | cpu->r[REG_R6];
}

static inline void cpu_set_hl(Micro8CPU *cpu, uint16_t val) {
    cpu->r[REG_R5] = (uint8_t)(val >> 8);
    cpu->r[REG_R6] = (uint8_t)(val & 0xFF);
}

static inline uint16_t cpu_get_bc(const Micro8CPU *cpu) {
    return ((uint16_t)cpu->r[REG_R1] << 8) | cpu->r[REG_R2];
}

static inline void cpu_set_bc(Micro8CPU *cpu, uint16_t val) {
    cpu->r[REG_R1] = (uint8_t)(val >> 8);
    cpu->r[REG_R2] = (uint8_t)(val & 0xFF);
}

static inline uint16_t cpu_get_de(const Micro8CPU *cpu) {
    return ((uint16_t)cpu->r[REG_R3] << 8) | cpu->r[REG_R4];
}

static inline void cpu_set_de(Micro8CPU *cpu, uint16_t val) {
    cpu->r[REG_R3] = (uint8_t)(val >> 8);
    cpu->r[REG_R4] = (uint8_t)(val & 0xFF);
}

#endif /* MICRO8_CPU_H */
