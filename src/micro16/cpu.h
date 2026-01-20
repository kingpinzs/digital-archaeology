/*
 * Micro16 CPU Emulator
 *
 * 16-bit CPU with expanded capabilities:
 * - 16-bit data bus
 * - 20-bit address bus (1MB addressable)
 * - 8 x 16-bit general purpose registers (R0-R7)
 * - 4 segment registers (CS, DS, SS, ES)
 * - Stack pointer (SP)
 * - Program counter (PC)
 * - Extended flags: Zero, Carry, Sign, Overflow, Direction, Interrupt
 * - Hardware multiply/divide support
 * - Memory-mapped I/O region
 */

#ifndef MICRO16_CPU_H
#define MICRO16_CPU_H

#include <stdint.h>
#include <stdbool.h>

/* ========================================================================
 * Memory Configuration
 * ======================================================================== */

/* Physical memory: 1MB (20-bit address bus) */
#define MEM_SIZE        0x100000    /* 1,048,576 bytes */

/* Segment size: 64KB (16-bit offset within segment) */
#define SEGMENT_SIZE    0x10000

/* Default segment values */
#define DEFAULT_CS      0x0000      /* Code segment at physical 0x00000 */
#define DEFAULT_DS      0x0000      /* Data segment at physical 0x00000 */
#define DEFAULT_SS      0x0F00      /* Stack segment at physical 0xF0000 */
#define DEFAULT_ES      0x0000      /* Extra segment at physical 0x00000 */

/* Default stack pointer (within stack segment) */
#define DEFAULT_SP      0xFFFE

/* Default program counter (within code segment) */
#define DEFAULT_PC      0x0100

/* Interrupt vector table: 256 vectors x 4 bytes = 1KB at address 0 */
#define IVT_BASE        0x00000
#define IVT_SIZE        0x00400     /* 1KB */
#define IVT_ENTRIES     256

/* Memory-mapped I/O region: last 64KB of address space */
#define MMIO_BASE       0xF0000
#define MMIO_SIZE       0x10000

/* ========================================================================
 * Register Definitions
 * ======================================================================== */

/* General purpose register indices */
#define REG_R0  0   /* AX - Accumulator */
#define REG_R1  1   /* BX - Base */
#define REG_R2  2   /* CX - Counter */
#define REG_R3  3   /* DX - Data */
#define REG_R4  4   /* SI - Source Index */
#define REG_R5  5   /* DI - Destination Index */
#define REG_R6  6   /* BP - Base Pointer */
#define REG_R7  7   /* General purpose */

/* Segment register indices */
#define SEG_CS  0   /* Code Segment */
#define SEG_DS  1   /* Data Segment */
#define SEG_SS  2   /* Stack Segment */
#define SEG_ES  3   /* Extra Segment */

/* ========================================================================
 * Flags Register
 * ======================================================================== */

/* Flags register bit positions */
#define FLAG_C  0x0001   /* Bit 0: Carry flag */
#define FLAG_Z  0x0002   /* Bit 1: Zero flag */
#define FLAG_S  0x0004   /* Bit 2: Sign flag (negative) */
#define FLAG_O  0x0008   /* Bit 3: Overflow flag */
#define FLAG_D  0x0010   /* Bit 4: Direction flag (for string ops) */
#define FLAG_I  0x0020   /* Bit 5: Interrupt enable flag */
#define FLAG_T  0x0040   /* Bit 6: Trap flag (single step) */
#define FLAG_P  0x0080   /* Bit 7: Parity flag */

/* ========================================================================
 * Opcode Definitions
 * Preliminary encoding - will be expanded as ISA is finalized
 * ======================================================================== */

/* System Instructions (0x00-0x0F) */
#define OP_NOP      0x00    /* No operation */
#define OP_HLT      0x01    /* Halt CPU */
#define OP_WAIT     0x02    /* Wait for interrupt */
#define OP_LOCK     0x03    /* Bus lock prefix */
#define OP_INT      0x04    /* Software interrupt */
#define OP_IRET     0x05    /* Return from interrupt */
#define OP_CLI      0x06    /* Clear interrupt flag */
#define OP_STI      0x07    /* Set interrupt flag */
#define OP_CLC      0x08    /* Clear carry flag */
#define OP_STC      0x09    /* Set carry flag */
#define OP_CMC      0x0A    /* Complement carry flag */
#define OP_CLD      0x0B    /* Clear direction flag */
#define OP_STD      0x0C    /* Set direction flag */
#define OP_PUSHF    0x0D    /* Push flags */
#define OP_POPF     0x0E    /* Pop flags */

/* Data Transfer - Register (0x10-0x1F) */
#define OP_MOV_RR   0x10    /* MOV Rd, Rs (reg to reg) */
#define OP_MOV_RI   0x11    /* MOV Rd, #imm16 (immediate to reg) */
#define OP_XCHG     0x12    /* XCHG Rd, Rs */
#define OP_MOV_SR   0x13    /* MOV Seg, Rs (reg to seg) */
#define OP_MOV_RS   0x14    /* MOV Rd, Seg (seg to reg) */
#define OP_MOV_R_SP 0x15    /* MOV Rd, SP (SP to reg) */
#define OP_MOV_SP_R 0x16    /* MOV SP, Rs (reg to SP) */
#define OP_ADD_SP_I 0x17    /* ADD SP, #imm16 */
#define OP_SUB_SP_I 0x18    /* SUB SP, #imm16 */

/* Data Transfer - Memory (0x20-0x3F) */
#define OP_LD       0x20    /* LD Rd, [addr] (memory to reg) */
#define OP_ST       0x21    /* ST [addr], Rs (reg to memory) */
#define OP_LDB      0x22    /* LD Rd, [addr] byte */
#define OP_STB      0x23    /* ST [addr], Rs byte */
#define OP_LD_IDX   0x24    /* LD Rd, [Rs + offset] indexed */
#define OP_ST_IDX   0x25    /* ST [Rd + offset], Rs indexed */
#define OP_LEA      0x26    /* LEA Rd, [addr] (load effective address) */
#define OP_LDS      0x27    /* LDS Rd, [addr] (load reg + DS) */
#define OP_LES      0x28    /* LES Rd, [addr] (load reg + ES) */
#define OP_LD_IDX_SP 0x29   /* LD Rd, [SP + offset] indexed via SP */
#define OP_ST_IDX_SP 0x2A   /* ST [SP + offset], Rs indexed via SP */

/* Stack Operations (0x40-0x4F) */
#define OP_PUSH_R   0x40    /* PUSH Rd */
#define OP_POP_R    0x41    /* POP Rd */
#define OP_PUSH_S   0x42    /* PUSH Seg */
#define OP_POP_S    0x43    /* POP Seg */
#define OP_PUSHA    0x44    /* Push all registers */
#define OP_POPA     0x45    /* Pop all registers */
#define OP_ENTER    0x46    /* Create stack frame */
#define OP_LEAVE    0x47    /* Destroy stack frame */

/* Arithmetic Operations (0x50-0x6F) */
#define OP_ADD_RR   0x50    /* ADD Rd, Rs */
#define OP_ADD_RI   0x51    /* ADD Rd, #imm16 */
#define OP_ADC_RR   0x52    /* ADC Rd, Rs (with carry) */
#define OP_ADC_RI   0x53    /* ADC Rd, #imm16 */
#define OP_SUB_RR   0x54    /* SUB Rd, Rs */
#define OP_SUB_RI   0x55    /* SUB Rd, #imm16 */
#define OP_SBC_RR   0x56    /* SBC Rd, Rs (with borrow) */
#define OP_SBC_RI   0x57    /* SBC Rd, #imm16 */
#define OP_CMP_RR   0x58    /* CMP Rd, Rs */
#define OP_CMP_RI   0x59    /* CMP Rd, #imm16 */
#define OP_NEG      0x5A    /* NEG Rd (two's complement) */
#define OP_INC      0x5B    /* INC Rd */
#define OP_DEC      0x5C    /* DEC Rd */
#define OP_MUL      0x60    /* MUL Rd, Rs (unsigned multiply) */
#define OP_IMUL     0x61    /* IMUL Rd, Rs (signed multiply) */
#define OP_DIV      0x62    /* DIV Rd, Rs (unsigned divide) */
#define OP_IDIV     0x63    /* IDIV Rd, Rs (signed divide) */

/* Logic Operations (0x70-0x7F) */
#define OP_AND_RR   0x70    /* AND Rd, Rs */
#define OP_AND_RI   0x71    /* AND Rd, #imm16 */
#define OP_OR_RR    0x72    /* OR Rd, Rs */
#define OP_OR_RI    0x73    /* OR Rd, #imm16 */
#define OP_XOR_RR   0x74    /* XOR Rd, Rs */
#define OP_XOR_RI   0x75    /* XOR Rd, #imm16 */
#define OP_NOT      0x76    /* NOT Rd */
#define OP_TEST_RR  0x77    /* TEST Rd, Rs (AND without storing) */
#define OP_TEST_RI  0x78    /* TEST Rd, #imm16 */

/* Shift/Rotate Operations (0x80-0x8F) */
#define OP_SHL      0x80    /* SHL Rd, count */
#define OP_SHR      0x81    /* SHR Rd, count (logical) */
#define OP_SAR      0x82    /* SAR Rd, count (arithmetic) */
#define OP_ROL      0x83    /* ROL Rd, count */
#define OP_ROR      0x84    /* ROR Rd, count */
#define OP_RCL      0x85    /* RCL Rd, count (through carry) */
#define OP_RCR      0x86    /* RCR Rd, count (through carry) */

/* Control Flow - Jumps (0xA0-0xAF) */
#define OP_JMP      0xA0    /* JMP addr (absolute) */
#define OP_JMP_FAR  0xA1    /* JMP seg:offset (far jump) */
#define OP_JMP_R    0xA2    /* JMP Rd (indirect) */
#define OP_JR       0xA3    /* JR offset (relative short) */

/* Control Flow - Conditional Jumps (0xB0-0xBF) */
#define OP_JZ       0xB0    /* JZ/JE addr */
#define OP_JNZ      0xB1    /* JNZ/JNE addr */
#define OP_JC       0xB2    /* JC/JB addr */
#define OP_JNC      0xB3    /* JNC/JAE addr */
#define OP_JS       0xB4    /* JS addr (sign) */
#define OP_JNS      0xB5    /* JNS addr */
#define OP_JO       0xB6    /* JO addr (overflow) */
#define OP_JNO      0xB7    /* JNO addr */
#define OP_JL       0xB8    /* JL addr (signed less) */
#define OP_JGE      0xB9    /* JGE addr (signed greater/equal) */
#define OP_JLE      0xBA    /* JLE addr (signed less/equal) */
#define OP_JG       0xBB    /* JG addr (signed greater) */
#define OP_JA       0xBC    /* JA addr (unsigned above) */
#define OP_JBE      0xBD    /* JBE addr (unsigned below/equal) */

/* Control Flow - Calls/Returns (0xC0-0xCF) */
#define OP_CALL     0xC0    /* CALL addr (near) */
#define OP_CALL_FAR 0xC1    /* CALL seg:offset (far) */
#define OP_CALL_R   0xC2    /* CALL Rd (indirect) */
#define OP_RET      0xC3    /* RET (near return) */
#define OP_RET_FAR  0xC4    /* RETF (far return) */
#define OP_RET_I    0xC5    /* RET imm16 (return and pop) */

/* Loop Instructions (0xD0-0xD3) */
#define OP_LOOP     0xD0    /* LOOP offset (decrement CX, jump if not zero) */
#define OP_LOOPZ    0xD1    /* LOOPZ offset (loop while zero) */
#define OP_LOOPNZ   0xD2    /* LOOPNZ offset (loop while not zero) */

/* String Operations (0xE0-0xEF) */
#define OP_MOVSB    0xE0    /* Move string byte */
#define OP_MOVSW    0xE1    /* Move string word */
#define OP_CMPSB    0xE2    /* Compare string byte */
#define OP_CMPSW    0xE3    /* Compare string word */
#define OP_STOSB    0xE4    /* Store string byte */
#define OP_STOSW    0xE5    /* Store string word */
#define OP_LODSB    0xE6    /* Load string byte */
#define OP_LODSW    0xE7    /* Load string word */
#define OP_REP      0xE8    /* Repeat prefix */
#define OP_REPZ     0xE9    /* Repeat while zero prefix */
#define OP_REPNZ    0xEA    /* Repeat while not zero prefix */

/* I/O Operations (0xF0-0xF3) */
#define OP_IN       0xF0    /* IN Rd, port */
#define OP_OUT      0xF1    /* OUT port, Rs */
#define OP_INB      0xF2    /* IN byte */
#define OP_OUTB     0xF3    /* OUT byte */

/* ========================================================================
 * CPU State Structure
 * ======================================================================== */

typedef struct {
    /* General purpose registers (16-bit) */
    uint16_t r[8];          /* R0-R7 (AX, BX, CX, DX, SI, DI, BP, R7) */

    /* Segment registers (16-bit, shifted left 4 for physical address) */
    uint16_t seg[4];        /* CS, DS, SS, ES */

    /* Special registers */
    uint16_t pc;            /* Program Counter (offset within CS) */
    uint16_t sp;            /* Stack Pointer (offset within SS) */
    uint16_t flags;         /* Flags register */

    /* Interrupt state */
    bool    int_pending;    /* Hardware interrupt pending */
    uint8_t int_vector;     /* Pending interrupt vector number */

    /* Internal registers (for debugging/visualization) */
    uint8_t  ir;            /* Instruction Register */
    uint32_t mar;           /* Memory Address Register (20-bit) */
    uint16_t mdr;           /* Memory Data Register */

    /* Memory (1MB, dynamically allocated) */
    uint8_t *memory;

    /* State */
    bool    halted;         /* CPU has executed HLT */
    bool    waiting;        /* CPU is in WAIT state */
    bool    error;          /* An error occurred */
    char    error_msg[128];

    /* Statistics */
    uint64_t cycles;        /* Total clock cycles */
    uint64_t instructions;  /* Instructions executed */
} Micro16CPU;

/* ========================================================================
 * Function Declarations
 * ======================================================================== */

/* CPU Lifecycle */
bool cpu_init(Micro16CPU *cpu);
void cpu_free(Micro16CPU *cpu);
void cpu_reset(Micro16CPU *cpu);

/* Memory Operations (segmented) */
uint32_t cpu_seg_to_phys(uint16_t segment, uint16_t offset);
uint8_t  cpu_read_byte(Micro16CPU *cpu, uint16_t segment, uint16_t offset);
uint16_t cpu_read_word(Micro16CPU *cpu, uint16_t segment, uint16_t offset);
void     cpu_write_byte(Micro16CPU *cpu, uint16_t segment, uint16_t offset, uint8_t value);
void     cpu_write_word(Micro16CPU *cpu, uint16_t segment, uint16_t offset, uint16_t value);

/* Memory Operations (physical - for DMA, debugging) */
uint8_t  cpu_read_phys_byte(Micro16CPU *cpu, uint32_t addr);
uint16_t cpu_read_phys_word(Micro16CPU *cpu, uint32_t addr);
void     cpu_write_phys_byte(Micro16CPU *cpu, uint32_t addr, uint8_t value);
void     cpu_write_phys_word(Micro16CPU *cpu, uint32_t addr, uint16_t value);

/* Program Loading */
void cpu_load_program(Micro16CPU *cpu, const uint8_t *program, uint32_t size, uint32_t phys_addr);

/* Execution */
int cpu_step(Micro16CPU *cpu);              /* Execute one instruction, returns cycles */
int cpu_run(Micro16CPU *cpu, int max_cycles); /* Run until halt or max_cycles */

/* Interrupts */
void cpu_request_interrupt(Micro16CPU *cpu, uint8_t vector);

/* Debugging */
void cpu_dump_state(const Micro16CPU *cpu);
void cpu_dump_memory(const Micro16CPU *cpu, uint32_t phys_start, uint32_t phys_end);
const char* cpu_disassemble(const Micro16CPU *cpu, uint32_t phys_addr, int *instr_len);

/* ========================================================================
 * Inline Helpers
 * ======================================================================== */

/* Convert segment:offset to 20-bit physical address */
static inline uint32_t seg_offset_to_phys(uint16_t segment, uint16_t offset) {
    return ((uint32_t)segment << 4) + offset;
}

/* Get current code address (CS:PC) */
static inline uint32_t cpu_get_code_addr(const Micro16CPU *cpu) {
    return seg_offset_to_phys(cpu->seg[SEG_CS], cpu->pc);
}

/* Get current stack address (SS:SP) */
static inline uint32_t cpu_get_stack_addr(const Micro16CPU *cpu) {
    return seg_offset_to_phys(cpu->seg[SEG_SS], cpu->sp);
}

/* Get data address (DS:offset) */
static inline uint32_t cpu_get_data_addr(const Micro16CPU *cpu, uint16_t offset) {
    return seg_offset_to_phys(cpu->seg[SEG_DS], offset);
}

/* Get extra segment address (ES:offset) */
static inline uint32_t cpu_get_extra_addr(const Micro16CPU *cpu, uint16_t offset) {
    return seg_offset_to_phys(cpu->seg[SEG_ES], offset);
}

/* Check if address is in MMIO region */
static inline bool is_mmio_addr(uint32_t phys_addr) {
    return phys_addr >= MMIO_BASE;
}

/* Flag manipulation helpers */
static inline bool cpu_get_flag(const Micro16CPU *cpu, uint16_t flag) {
    return (cpu->flags & flag) != 0;
}

static inline void cpu_set_flag(Micro16CPU *cpu, uint16_t flag, bool value) {
    if (value) {
        cpu->flags |= flag;
    } else {
        cpu->flags &= ~flag;
    }
}

/* Register pair access (for 32-bit operations) */
static inline uint32_t cpu_get_r0r3(const Micro16CPU *cpu) {
    return ((uint32_t)cpu->r[REG_R3] << 16) | cpu->r[REG_R0];  /* DX:AX */
}

static inline void cpu_set_r0r3(Micro16CPU *cpu, uint32_t value) {
    cpu->r[REG_R0] = (uint16_t)(value & 0xFFFF);
    cpu->r[REG_R3] = (uint16_t)(value >> 16);
}

/* Register name lookup */
static inline const char* cpu_reg_name(int reg) {
    static const char* names[] = {"AX", "BX", "CX", "DX", "SI", "DI", "BP", "R7"};
    return (reg >= 0 && reg < 8) ? names[reg] : "??";
}

static inline const char* cpu_seg_name(int seg) {
    static const char* names[] = {"CS", "DS", "SS", "ES"};
    return (seg >= 0 && seg < 4) ? names[seg] : "??";
}

#endif /* MICRO16_CPU_H */
