/*
 * Micro16 CPU Emulator - Implementation
 *
 * 16-bit CPU with ~120 instructions supporting:
 * - 8 general purpose 16-bit registers (R0-R7)
 * - 4 segment registers (CS, DS, SS, ES)
 * - 20-bit physical address space (1MB)
 * - Segmented memory model
 * - Hardware multiply/divide
 * - String operations
 * - Interrupt system
 */

#include "cpu.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ========================================================================
 * Flag Update Helpers
 * ======================================================================== */

/*
 * Update Zero and Sign flags based on 16-bit result
 */
static void update_flags_zs(Micro16CPU *cpu, uint16_t result) {
    cpu_set_flag(cpu, FLAG_Z, result == 0);
    cpu_set_flag(cpu, FLAG_S, (result & 0x8000) != 0);
}

/*
 * Update parity flag (count of set bits in low byte)
 */
static void update_flag_p(Micro16CPU *cpu, uint16_t result) {
    uint8_t low = result & 0xFF;
    int bits = 0;
    while (low) {
        bits += low & 1;
        low >>= 1;
    }
    cpu_set_flag(cpu, FLAG_P, (bits & 1) == 0);  /* Even parity */
}

/*
 * Update all flags for 16-bit addition
 */
static void update_flags_add16(Micro16CPU *cpu, uint16_t a, uint16_t b, uint32_t result) {
    uint16_t res16 = (uint16_t)result;
    update_flags_zs(cpu, res16);
    update_flag_p(cpu, res16);

    /* Carry flag */
    cpu_set_flag(cpu, FLAG_C, result > 0xFFFF);

    /* Overflow flag: set if sign of result differs from expected */
    bool overflow = ((a ^ res16) & (b ^ res16) & 0x8000) != 0;
    cpu_set_flag(cpu, FLAG_O, overflow);
}

/*
 * Update all flags for 16-bit subtraction
 */
static void update_flags_sub16(Micro16CPU *cpu, uint16_t a, uint16_t b, uint32_t result) {
    uint16_t res16 = (uint16_t)result;
    update_flags_zs(cpu, res16);
    update_flag_p(cpu, res16);

    /* Carry flag (borrow) - set if a < b */
    cpu_set_flag(cpu, FLAG_C, a < b);

    /* Overflow flag */
    bool overflow = ((a ^ b) & (a ^ res16) & 0x8000) != 0;
    cpu_set_flag(cpu, FLAG_O, overflow);
}

/*
 * Update flags for logic operations (Z, S, P; clear C, O)
 */
static void update_flags_logic(Micro16CPU *cpu, uint16_t result) {
    update_flags_zs(cpu, result);
    update_flag_p(cpu, result);
    cpu_set_flag(cpu, FLAG_C, false);
    cpu_set_flag(cpu, FLAG_O, false);
}

/* ========================================================================
 * CPU Lifecycle
 * ======================================================================== */

bool cpu_init(Micro16CPU *cpu) {
    memset(cpu, 0, sizeof(Micro16CPU));

    cpu->memory = (uint8_t *)calloc(MEM_SIZE, sizeof(uint8_t));
    if (cpu->memory == NULL) {
        cpu->error = true;
        snprintf(cpu->error_msg, sizeof(cpu->error_msg), "Failed to allocate memory");
        return false;
    }

    cpu_reset(cpu);
    return true;
}

void cpu_free(Micro16CPU *cpu) {
    if (cpu->memory != NULL) {
        free(cpu->memory);
        cpu->memory = NULL;
    }
}

void cpu_reset(Micro16CPU *cpu) {
    /* Clear general purpose registers */
    for (int i = 0; i < 8; i++) {
        cpu->r[i] = 0;
    }

    /* Initialize segment registers */
    cpu->seg[SEG_CS] = DEFAULT_CS;
    cpu->seg[SEG_DS] = DEFAULT_DS;
    cpu->seg[SEG_SS] = DEFAULT_SS;
    cpu->seg[SEG_ES] = DEFAULT_ES;

    /* Initialize special registers */
    cpu->pc = DEFAULT_PC;
    cpu->sp = DEFAULT_SP;
    cpu->flags = 0;

    /* Clear interrupt state */
    cpu->int_pending = false;
    cpu->int_vector = 0;

    /* Clear internal registers */
    cpu->ir = 0;
    cpu->mar = 0;
    cpu->mdr = 0;

    /* Clear state */
    cpu->halted = false;
    cpu->waiting = false;
    cpu->error = false;
    cpu->error_msg[0] = '\0';

    /* Clear statistics */
    cpu->cycles = 0;
    cpu->instructions = 0;
}

/* ========================================================================
 * Memory Operations - Physical Address
 * ======================================================================== */

uint8_t cpu_read_phys_byte(Micro16CPU *cpu, uint32_t addr) {
    if (addr >= MEM_SIZE) {
        cpu->error = true;
        snprintf(cpu->error_msg, sizeof(cpu->error_msg),
                 "Physical address out of range: 0x%05X", addr);
        return 0;
    }

    cpu->mar = addr;
    cpu->mdr = cpu->memory[addr];

    /* Check for MMIO region */
    if (is_mmio_addr(addr)) {
        /* TODO: Handle memory-mapped I/O reads */
    }

    return cpu->memory[addr];
}

uint16_t cpu_read_phys_word(Micro16CPU *cpu, uint32_t addr) {
    uint8_t low = cpu_read_phys_byte(cpu, addr);
    uint8_t high = cpu_read_phys_byte(cpu, addr + 1);
    return (uint16_t)low | ((uint16_t)high << 8);
}

void cpu_write_phys_byte(Micro16CPU *cpu, uint32_t addr, uint8_t value) {
    if (addr >= MEM_SIZE) {
        cpu->error = true;
        snprintf(cpu->error_msg, sizeof(cpu->error_msg),
                 "Physical address out of range: 0x%05X", addr);
        return;
    }

    cpu->mar = addr;
    cpu->mdr = value;

    /* Check for MMIO region */
    if (is_mmio_addr(addr)) {
        /* TODO: Handle memory-mapped I/O writes */
    }

    cpu->memory[addr] = value;
}

void cpu_write_phys_word(Micro16CPU *cpu, uint32_t addr, uint16_t value) {
    cpu_write_phys_byte(cpu, addr, (uint8_t)(value & 0xFF));
    cpu_write_phys_byte(cpu, addr + 1, (uint8_t)(value >> 8));
}

/* ========================================================================
 * Memory Operations - Segmented Address
 * ======================================================================== */

uint32_t cpu_seg_to_phys(uint16_t segment, uint16_t offset) {
    return seg_offset_to_phys(segment, offset);
}

uint8_t cpu_read_byte(Micro16CPU *cpu, uint16_t segment, uint16_t offset) {
    uint32_t phys = seg_offset_to_phys(segment, offset);
    return cpu_read_phys_byte(cpu, phys);
}

uint16_t cpu_read_word(Micro16CPU *cpu, uint16_t segment, uint16_t offset) {
    uint32_t phys = seg_offset_to_phys(segment, offset);
    return cpu_read_phys_word(cpu, phys);
}

void cpu_write_byte(Micro16CPU *cpu, uint16_t segment, uint16_t offset, uint8_t value) {
    uint32_t phys = seg_offset_to_phys(segment, offset);
    cpu_write_phys_byte(cpu, phys, value);
}

void cpu_write_word(Micro16CPU *cpu, uint16_t segment, uint16_t offset, uint16_t value) {
    uint32_t phys = seg_offset_to_phys(segment, offset);
    cpu_write_phys_word(cpu, phys, value);
}

/* ========================================================================
 * Program Loading
 * ======================================================================== */

void cpu_load_program(Micro16CPU *cpu, const uint8_t *program, uint32_t size, uint32_t phys_addr) {
    for (uint32_t i = 0; i < size && (phys_addr + i) < MEM_SIZE; i++) {
        cpu->memory[phys_addr + i] = program[i];
    }
}

/* ========================================================================
 * Fetch Helpers
 * ======================================================================== */

static uint8_t fetch_byte(Micro16CPU *cpu) {
    uint8_t value = cpu_read_byte(cpu, cpu->seg[SEG_CS], cpu->pc);
    cpu->pc++;
    return value;
}

static uint16_t fetch_word(Micro16CPU *cpu) {
    uint8_t low = fetch_byte(cpu);
    uint8_t high = fetch_byte(cpu);
    return (uint16_t)low | ((uint16_t)high << 8);
}

/* ========================================================================
 * Stack Operations
 * ======================================================================== */

static void push_word(Micro16CPU *cpu, uint16_t value) {
    cpu->sp -= 2;
    cpu_write_word(cpu, cpu->seg[SEG_SS], cpu->sp, value);
}

static uint16_t pop_word(Micro16CPU *cpu) {
    uint16_t value = cpu_read_word(cpu, cpu->seg[SEG_SS], cpu->sp);
    cpu->sp += 2;
    return value;
}

/* ========================================================================
 * Interrupt Support
 * ======================================================================== */

void cpu_request_interrupt(Micro16CPU *cpu, uint8_t vector) {
    cpu->int_pending = true;
    cpu->int_vector = vector;
}

static void handle_interrupt(Micro16CPU *cpu, uint8_t vector) {
    /* Push flags and return address */
    push_word(cpu, cpu->flags);
    push_word(cpu, cpu->seg[SEG_CS]);
    push_word(cpu, cpu->pc);

    /* Clear interrupt flag and trap flag */
    cpu_set_flag(cpu, FLAG_I, false);
    cpu_set_flag(cpu, FLAG_T, false);

    /* Read interrupt vector from IVT */
    uint32_t ivt_entry = IVT_BASE + (vector * 4);
    uint16_t new_pc = cpu_read_phys_word(cpu, ivt_entry);
    uint16_t new_cs = cpu_read_phys_word(cpu, ivt_entry + 2);

    cpu->pc = new_pc;
    cpu->seg[SEG_CS] = new_cs;
}

static void check_interrupt(Micro16CPU *cpu) {
    if (cpu->int_pending && cpu_get_flag(cpu, FLAG_I)) {
        cpu->int_pending = false;
        handle_interrupt(cpu, cpu->int_vector);
    }
}

/* ========================================================================
 * Instruction Execution
 * ======================================================================== */

int cpu_step(Micro16CPU *cpu) {
    if (cpu->halted || cpu->error) {
        return 0;
    }

    /* If waiting, check for interrupt */
    if (cpu->waiting) {
        if (cpu->int_pending && cpu_get_flag(cpu, FLAG_I)) {
            cpu->waiting = false;
        } else {
            return 1;  /* Still waiting */
        }
    }

    /* Check for pending interrupts */
    check_interrupt(cpu);

    int cycles = 1;  /* Fetch cycle */

    /* Fetch opcode */
    cpu->ir = fetch_byte(cpu);
    uint8_t opcode = cpu->ir;

    /* Instruction operands */
    uint8_t reg, reg2, seg;
    uint16_t imm16, addr16;
    int8_t offset8;
    uint32_t result32;
    (void)addr16;  /* May be unused in skeleton */

    /* Decode and execute */
    switch (opcode) {

    /* ========== System Instructions (0x00-0x0E) ========== */
    case OP_NOP:
        cycles += 1;
        break;

    case OP_HLT:
        cpu->halted = true;
        cycles += 1;
        break;

    case OP_WAIT:
        cpu->waiting = true;
        cycles += 1;
        break;

    case OP_INT:
        imm16 = fetch_byte(cpu);  /* Interrupt vector number */
        handle_interrupt(cpu, (uint8_t)imm16);
        cycles += 5;
        break;

    case OP_IRET:
        cpu->pc = pop_word(cpu);
        cpu->seg[SEG_CS] = pop_word(cpu);
        cpu->flags = pop_word(cpu);
        cycles += 5;
        break;

    case OP_CLI:
        cpu_set_flag(cpu, FLAG_I, false);
        cycles += 1;
        break;

    case OP_STI:
        cpu_set_flag(cpu, FLAG_I, true);
        cycles += 1;
        break;

    case OP_CLC:
        cpu_set_flag(cpu, FLAG_C, false);
        cycles += 1;
        break;

    case OP_STC:
        cpu_set_flag(cpu, FLAG_C, true);
        cycles += 1;
        break;

    case OP_CMC:
        cpu_set_flag(cpu, FLAG_C, !cpu_get_flag(cpu, FLAG_C));
        cycles += 1;
        break;

    case OP_CLD:
        cpu_set_flag(cpu, FLAG_D, false);
        cycles += 1;
        break;

    case OP_STD:
        cpu_set_flag(cpu, FLAG_D, true);
        cycles += 1;
        break;

    case OP_PUSHF:
        push_word(cpu, cpu->flags);
        cycles += 2;
        break;

    case OP_POPF:
        cpu->flags = pop_word(cpu);
        cycles += 2;
        break;

    /* ========== Data Transfer - Register (0x10-0x14) ========== */
    case OP_MOV_RR:
        reg = fetch_byte(cpu);
        reg2 = reg & 0x07;
        reg = (reg >> 4) & 0x07;
        cpu->r[reg] = cpu->r[reg2];
        cycles += 2;
        break;

    case OP_MOV_RI:
        reg = fetch_byte(cpu) & 0x07;
        imm16 = fetch_word(cpu);
        cpu->r[reg] = imm16;
        cycles += 3;
        break;

    case OP_XCHG:
        reg = fetch_byte(cpu);
        reg2 = reg & 0x07;
        reg = (reg >> 4) & 0x07;
        imm16 = cpu->r[reg];
        cpu->r[reg] = cpu->r[reg2];
        cpu->r[reg2] = imm16;
        cycles += 3;
        break;

    case OP_MOV_SR:
        reg = fetch_byte(cpu);
        seg = (reg >> 4) & 0x03;
        reg2 = reg & 0x07;
        cpu->seg[seg] = cpu->r[reg2];
        cycles += 2;
        break;

    case OP_MOV_RS:
        reg = fetch_byte(cpu);
        reg2 = (reg >> 4) & 0x07;
        seg = reg & 0x03;
        cpu->r[reg2] = cpu->seg[seg];
        cycles += 2;
        break;

    /* ========== Data Transfer - Memory (0x20-0x28) ========== */
    case OP_LD:
        /* LD Rd, [addr] - Load 16-bit word from memory */
        reg = fetch_byte(cpu) & 0x07;
        addr16 = fetch_word(cpu);
        cpu->r[reg] = cpu_read_word(cpu, cpu->seg[SEG_DS], addr16);
        cycles += 4;
        break;

    case OP_ST:
        /* ST [addr], Rs - Store 16-bit word to memory */
        reg = fetch_byte(cpu) & 0x07;
        addr16 = fetch_word(cpu);
        cpu_write_word(cpu, cpu->seg[SEG_DS], addr16, cpu->r[reg]);
        cycles += 4;
        break;

    case OP_LDB:
        /* LDB Rd, [addr] - Load byte from memory (zero-extend) */
        reg = fetch_byte(cpu) & 0x07;
        addr16 = fetch_word(cpu);
        cpu->r[reg] = cpu_read_byte(cpu, cpu->seg[SEG_DS], addr16);
        cycles += 4;
        break;

    case OP_STB:
        /* STB [addr], Rs - Store low byte to memory */
        reg = fetch_byte(cpu) & 0x07;
        addr16 = fetch_word(cpu);
        cpu_write_byte(cpu, cpu->seg[SEG_DS], addr16, (uint8_t)(cpu->r[reg] & 0xFF));
        cycles += 4;
        break;

    case OP_LD_IDX:
        /* LD Rd, [Rs + offset] - Indexed load */
        {
            uint8_t regs = fetch_byte(cpu);
            reg = (regs >> 4) & 0x07;   /* Destination */
            reg2 = regs & 0x07;         /* Base register */
            int16_t offset = (int16_t)fetch_word(cpu);
            uint16_t eff_addr = cpu->r[reg2] + offset;
            cpu->r[reg] = cpu_read_word(cpu, cpu->seg[SEG_DS], eff_addr);
        }
        cycles += 5;
        break;

    case OP_ST_IDX:
        /* ST [Rd + offset], Rs - Indexed store */
        {
            uint8_t regs = fetch_byte(cpu);
            reg = (regs >> 4) & 0x07;   /* Base register */
            reg2 = regs & 0x07;         /* Source register */
            int16_t offset = (int16_t)fetch_word(cpu);
            uint16_t eff_addr = cpu->r[reg] + offset;
            cpu_write_word(cpu, cpu->seg[SEG_DS], eff_addr, cpu->r[reg2]);
        }
        cycles += 5;
        break;

    case OP_LEA:
        /* LEA Rd, [addr] - Load effective address */
        reg = fetch_byte(cpu) & 0x07;
        addr16 = fetch_word(cpu);
        cpu->r[reg] = addr16;  /* Just load the address, don't dereference */
        cycles += 3;
        break;

    case OP_LDS:
        /* LDS Rd, [addr] - Load pointer into DS:Rd */
        reg = fetch_byte(cpu) & 0x07;
        addr16 = fetch_word(cpu);
        cpu->r[reg] = cpu_read_word(cpu, cpu->seg[SEG_DS], addr16);
        cpu->seg[SEG_DS] = cpu_read_word(cpu, cpu->seg[SEG_DS], addr16 + 2);
        cycles += 6;
        break;

    case OP_LES:
        /* LES Rd, [addr] - Load pointer into ES:Rd */
        reg = fetch_byte(cpu) & 0x07;
        addr16 = fetch_word(cpu);
        cpu->r[reg] = cpu_read_word(cpu, cpu->seg[SEG_DS], addr16);
        cpu->seg[SEG_ES] = cpu_read_word(cpu, cpu->seg[SEG_DS], addr16 + 2);
        cycles += 6;
        break;

    /* ========== Stack Operations (0x40-0x47) ========== */
    case OP_PUSH_R:
        reg = fetch_byte(cpu) & 0x07;
        push_word(cpu, cpu->r[reg]);
        cycles += 2;
        break;

    case OP_POP_R:
        reg = fetch_byte(cpu) & 0x07;
        cpu->r[reg] = pop_word(cpu);
        cycles += 2;
        break;

    case OP_PUSH_S:
        seg = fetch_byte(cpu) & 0x03;
        push_word(cpu, cpu->seg[seg]);
        cycles += 2;
        break;

    case OP_POP_S:
        seg = fetch_byte(cpu) & 0x03;
        cpu->seg[seg] = pop_word(cpu);
        cycles += 2;
        break;

    case OP_PUSHA:
        /* Push all general purpose registers */
        for (int i = 0; i < 8; i++) {
            push_word(cpu, cpu->r[i]);
        }
        cycles += 10;
        break;

    case OP_POPA:
        /* Pop all general purpose registers (reverse order) */
        for (int i = 7; i >= 0; i--) {
            cpu->r[i] = pop_word(cpu);
        }
        cycles += 10;
        break;

    case OP_ENTER:
        /* Create stack frame: ENTER size, level */
        {
            uint16_t size = fetch_word(cpu);
            uint8_t level = fetch_byte(cpu);
            push_word(cpu, cpu->r[REG_R6]);  /* Push BP */
            uint16_t frame_ptr = cpu->sp;
            if (level > 0) {
                for (int i = 1; i < level; i++) {
                    cpu->r[REG_R6] -= 2;
                    push_word(cpu, cpu_read_word(cpu, cpu->seg[SEG_SS], cpu->r[REG_R6]));
                }
                push_word(cpu, frame_ptr);
            }
            cpu->r[REG_R6] = frame_ptr;  /* BP = frame pointer */
            cpu->sp -= size;  /* Reserve local space */
        }
        cycles += 10;
        break;

    case OP_LEAVE:
        /* Destroy stack frame: LEAVE */
        cpu->sp = cpu->r[REG_R6];  /* SP = BP */
        cpu->r[REG_R6] = pop_word(cpu);  /* Pop BP */
        cycles += 4;
        break;

    /* ========== Arithmetic Operations (0x50-0x5C) ========== */
    case OP_ADD_RR:
        reg = fetch_byte(cpu);
        reg2 = reg & 0x07;
        reg = (reg >> 4) & 0x07;
        result32 = (uint32_t)cpu->r[reg] + (uint32_t)cpu->r[reg2];
        update_flags_add16(cpu, cpu->r[reg], cpu->r[reg2], result32);
        cpu->r[reg] = (uint16_t)result32;
        cycles += 2;
        break;

    case OP_ADD_RI:
        reg = fetch_byte(cpu) & 0x07;
        imm16 = fetch_word(cpu);
        result32 = (uint32_t)cpu->r[reg] + (uint32_t)imm16;
        update_flags_add16(cpu, cpu->r[reg], imm16, result32);
        cpu->r[reg] = (uint16_t)result32;
        cycles += 3;
        break;

    case OP_ADC_RR:
        reg = fetch_byte(cpu);
        reg2 = reg & 0x07;
        reg = (reg >> 4) & 0x07;
        result32 = (uint32_t)cpu->r[reg] + (uint32_t)cpu->r[reg2];
        if (cpu_get_flag(cpu, FLAG_C)) result32++;
        update_flags_add16(cpu, cpu->r[reg], cpu->r[reg2], result32);
        cpu->r[reg] = (uint16_t)result32;
        cycles += 2;
        break;

    case OP_ADC_RI:
        reg = fetch_byte(cpu) & 0x07;
        imm16 = fetch_word(cpu);
        result32 = (uint32_t)cpu->r[reg] + (uint32_t)imm16;
        if (cpu_get_flag(cpu, FLAG_C)) result32++;
        update_flags_add16(cpu, cpu->r[reg], imm16, result32);
        cpu->r[reg] = (uint16_t)result32;
        cycles += 3;
        break;

    case OP_SUB_RR:
        reg = fetch_byte(cpu);
        reg2 = reg & 0x07;
        reg = (reg >> 4) & 0x07;
        result32 = (uint32_t)cpu->r[reg] - (uint32_t)cpu->r[reg2];
        update_flags_sub16(cpu, cpu->r[reg], cpu->r[reg2], result32);
        cpu->r[reg] = (uint16_t)result32;
        cycles += 2;
        break;

    case OP_SUB_RI:
        reg = fetch_byte(cpu) & 0x07;
        imm16 = fetch_word(cpu);
        result32 = (uint32_t)cpu->r[reg] - (uint32_t)imm16;
        update_flags_sub16(cpu, cpu->r[reg], imm16, result32);
        cpu->r[reg] = (uint16_t)result32;
        cycles += 3;
        break;

    case OP_SBC_RR:
        reg = fetch_byte(cpu);
        reg2 = reg & 0x07;
        reg = (reg >> 4) & 0x07;
        result32 = (uint32_t)cpu->r[reg] - (uint32_t)cpu->r[reg2];
        if (cpu_get_flag(cpu, FLAG_C)) result32--;  /* Subtract borrow */
        update_flags_sub16(cpu, cpu->r[reg], cpu->r[reg2], result32);
        cpu->r[reg] = (uint16_t)result32;
        cycles += 2;
        break;

    case OP_SBC_RI:
        reg = fetch_byte(cpu) & 0x07;
        imm16 = fetch_word(cpu);
        result32 = (uint32_t)cpu->r[reg] - (uint32_t)imm16;
        if (cpu_get_flag(cpu, FLAG_C)) result32--;  /* Subtract borrow */
        update_flags_sub16(cpu, cpu->r[reg], imm16, result32);
        cpu->r[reg] = (uint16_t)result32;
        cycles += 3;
        break;

    case OP_CMP_RR:
        reg = fetch_byte(cpu);
        reg2 = reg & 0x07;
        reg = (reg >> 4) & 0x07;
        result32 = (uint32_t)cpu->r[reg] - (uint32_t)cpu->r[reg2];
        update_flags_sub16(cpu, cpu->r[reg], cpu->r[reg2], result32);
        /* Don't store result */
        cycles += 2;
        break;

    case OP_CMP_RI:
        reg = fetch_byte(cpu) & 0x07;
        imm16 = fetch_word(cpu);
        result32 = (uint32_t)cpu->r[reg] - (uint32_t)imm16;
        update_flags_sub16(cpu, cpu->r[reg], imm16, result32);
        cycles += 3;
        break;

    case OP_NEG:
        reg = fetch_byte(cpu) & 0x07;
        result32 = (uint32_t)(-(int16_t)cpu->r[reg]);
        update_flags_sub16(cpu, 0, cpu->r[reg], result32);
        cpu->r[reg] = (uint16_t)result32;
        cycles += 2;
        break;

    case OP_INC:
        reg = fetch_byte(cpu) & 0x07;
        result32 = (uint32_t)cpu->r[reg] + 1;
        /* INC doesn't affect carry flag */
        {
            bool old_c = cpu_get_flag(cpu, FLAG_C);
            update_flags_add16(cpu, cpu->r[reg], 1, result32);
            cpu_set_flag(cpu, FLAG_C, old_c);
        }
        cpu->r[reg] = (uint16_t)result32;
        cycles += 1;
        break;

    case OP_DEC:
        reg = fetch_byte(cpu) & 0x07;
        result32 = (uint32_t)cpu->r[reg] - 1;
        /* DEC doesn't affect carry flag */
        {
            bool old_c = cpu_get_flag(cpu, FLAG_C);
            update_flags_sub16(cpu, cpu->r[reg], 1, result32);
            cpu_set_flag(cpu, FLAG_C, old_c);
        }
        cpu->r[reg] = (uint16_t)result32;
        cycles += 1;
        break;

    /* ========== Multiply/Divide (0x60-0x63) ========== */
    case OP_MUL:
        /* Unsigned multiply: DX:AX = AX * Rs */
        reg = fetch_byte(cpu) & 0x07;
        result32 = (uint32_t)cpu->r[REG_R0] * (uint32_t)cpu->r[reg];
        cpu_set_r0r3(cpu, result32);
        cpu_set_flag(cpu, FLAG_C, (result32 >> 16) != 0);
        cpu_set_flag(cpu, FLAG_O, (result32 >> 16) != 0);
        cycles += 10;
        break;

    case OP_IMUL:
        /* Signed multiply: DX:AX = AX * Rs */
        reg = fetch_byte(cpu) & 0x07;
        {
            int32_t signed_result = (int32_t)(int16_t)cpu->r[REG_R0] *
                                    (int32_t)(int16_t)cpu->r[reg];
            cpu_set_r0r3(cpu, (uint32_t)signed_result);
            int16_t ax_signed = (int16_t)(signed_result & 0xFFFF);
            cpu_set_flag(cpu, FLAG_C, signed_result != ax_signed);
            cpu_set_flag(cpu, FLAG_O, signed_result != ax_signed);
        }
        cycles += 12;
        break;

    case OP_DIV:
        /* Unsigned divide: AX = DX:AX / Rs, DX = DX:AX % Rs */
        reg = fetch_byte(cpu) & 0x07;
        if (cpu->r[reg] == 0) {
            /* Division by zero - trigger interrupt */
            handle_interrupt(cpu, 0);
        } else {
            uint32_t dividend = cpu_get_r0r3(cpu);
            uint16_t quotient = dividend / cpu->r[reg];
            uint16_t remainder = dividend % cpu->r[reg];
            cpu->r[REG_R0] = quotient;
            cpu->r[REG_R3] = remainder;
        }
        cycles += 15;
        break;

    case OP_IDIV:
        /* Signed divide */
        reg = fetch_byte(cpu) & 0x07;
        if (cpu->r[reg] == 0) {
            handle_interrupt(cpu, 0);
        } else {
            int32_t dividend = (int32_t)cpu_get_r0r3(cpu);
            int16_t divisor = (int16_t)cpu->r[reg];
            int16_t quotient = dividend / divisor;
            int16_t remainder = dividend % divisor;
            cpu->r[REG_R0] = (uint16_t)quotient;
            cpu->r[REG_R3] = (uint16_t)remainder;
        }
        cycles += 18;
        break;

    /* ========== Logic Operations (0x70-0x78) ========== */
    case OP_AND_RR:
        reg = fetch_byte(cpu);
        reg2 = reg & 0x07;
        reg = (reg >> 4) & 0x07;
        cpu->r[reg] &= cpu->r[reg2];
        update_flags_logic(cpu, cpu->r[reg]);
        cycles += 2;
        break;

    case OP_AND_RI:
        reg = fetch_byte(cpu) & 0x07;
        imm16 = fetch_word(cpu);
        cpu->r[reg] &= imm16;
        update_flags_logic(cpu, cpu->r[reg]);
        cycles += 3;
        break;

    case OP_OR_RR:
        reg = fetch_byte(cpu);
        reg2 = reg & 0x07;
        reg = (reg >> 4) & 0x07;
        cpu->r[reg] |= cpu->r[reg2];
        update_flags_logic(cpu, cpu->r[reg]);
        cycles += 2;
        break;

    case OP_OR_RI:
        reg = fetch_byte(cpu) & 0x07;
        imm16 = fetch_word(cpu);
        cpu->r[reg] |= imm16;
        update_flags_logic(cpu, cpu->r[reg]);
        cycles += 3;
        break;

    case OP_XOR_RR:
        reg = fetch_byte(cpu);
        reg2 = reg & 0x07;
        reg = (reg >> 4) & 0x07;
        cpu->r[reg] ^= cpu->r[reg2];
        update_flags_logic(cpu, cpu->r[reg]);
        cycles += 2;
        break;

    case OP_XOR_RI:
        reg = fetch_byte(cpu) & 0x07;
        imm16 = fetch_word(cpu);
        cpu->r[reg] ^= imm16;
        update_flags_logic(cpu, cpu->r[reg]);
        cycles += 3;
        break;

    case OP_NOT:
        reg = fetch_byte(cpu) & 0x07;
        cpu->r[reg] = ~cpu->r[reg];
        /* NOT doesn't affect flags */
        cycles += 2;
        break;

    case OP_TEST_RR:
        reg = fetch_byte(cpu);
        reg2 = reg & 0x07;
        reg = (reg >> 4) & 0x07;
        update_flags_logic(cpu, cpu->r[reg] & cpu->r[reg2]);
        cycles += 2;
        break;

    case OP_TEST_RI:
        reg = fetch_byte(cpu) & 0x07;
        imm16 = fetch_word(cpu);
        update_flags_logic(cpu, cpu->r[reg] & imm16);
        cycles += 3;
        break;

    /* ========== Shift/Rotate Operations (0x80-0x86) ========== */
    case OP_SHL:
        reg = fetch_byte(cpu);
        reg2 = reg & 0x0F;  /* Shift count (low nibble) or use CL */
        reg = (reg >> 4) & 0x07;
        if (reg2 == 0) reg2 = cpu->r[REG_R2] & 0x0F;  /* Use CX if count is 0 */
        while (reg2--) {
            cpu_set_flag(cpu, FLAG_C, (cpu->r[reg] & 0x8000) != 0);
            cpu->r[reg] <<= 1;
        }
        update_flags_zs(cpu, cpu->r[reg]);
        cycles += 3;
        break;

    case OP_SHR:
        reg = fetch_byte(cpu);
        reg2 = reg & 0x0F;
        reg = (reg >> 4) & 0x07;
        if (reg2 == 0) reg2 = cpu->r[REG_R2] & 0x0F;
        while (reg2--) {
            cpu_set_flag(cpu, FLAG_C, (cpu->r[reg] & 0x0001) != 0);
            cpu->r[reg] >>= 1;
        }
        update_flags_zs(cpu, cpu->r[reg]);
        cycles += 3;
        break;

    case OP_SAR:
        reg = fetch_byte(cpu);
        reg2 = reg & 0x0F;
        reg = (reg >> 4) & 0x07;
        if (reg2 == 0) reg2 = cpu->r[REG_R2] & 0x0F;
        while (reg2--) {
            cpu_set_flag(cpu, FLAG_C, (cpu->r[reg] & 0x0001) != 0);
            cpu->r[reg] = (cpu->r[reg] >> 1) | (cpu->r[reg] & 0x8000);
        }
        update_flags_zs(cpu, cpu->r[reg]);
        cycles += 3;
        break;

    case OP_ROL:
        reg = fetch_byte(cpu);
        reg2 = reg & 0x0F;
        reg = (reg >> 4) & 0x07;
        if (reg2 == 0) reg2 = cpu->r[REG_R2] & 0x0F;
        while (reg2--) {
            bool msb = (cpu->r[reg] & 0x8000) != 0;
            cpu->r[reg] = (cpu->r[reg] << 1) | (msb ? 1 : 0);
            cpu_set_flag(cpu, FLAG_C, msb);
        }
        cycles += 3;
        break;

    case OP_ROR:
        reg = fetch_byte(cpu);
        reg2 = reg & 0x0F;
        reg = (reg >> 4) & 0x07;
        if (reg2 == 0) reg2 = cpu->r[REG_R2] & 0x0F;
        while (reg2--) {
            bool lsb = (cpu->r[reg] & 0x0001) != 0;
            cpu->r[reg] = (cpu->r[reg] >> 1) | (lsb ? 0x8000 : 0);
            cpu_set_flag(cpu, FLAG_C, lsb);
        }
        cycles += 3;
        break;

    case OP_RCL:
        /* Rotate left through carry */
        reg = fetch_byte(cpu);
        reg2 = reg & 0x0F;
        reg = (reg >> 4) & 0x07;
        if (reg2 == 0) reg2 = cpu->r[REG_R2] & 0x0F;
        while (reg2--) {
            bool old_c = cpu_get_flag(cpu, FLAG_C);
            cpu_set_flag(cpu, FLAG_C, (cpu->r[reg] & 0x8000) != 0);
            cpu->r[reg] = (cpu->r[reg] << 1) | (old_c ? 1 : 0);
        }
        cycles += 3;
        break;

    case OP_RCR:
        /* Rotate right through carry */
        reg = fetch_byte(cpu);
        reg2 = reg & 0x0F;
        reg = (reg >> 4) & 0x07;
        if (reg2 == 0) reg2 = cpu->r[REG_R2] & 0x0F;
        while (reg2--) {
            bool old_c = cpu_get_flag(cpu, FLAG_C);
            cpu_set_flag(cpu, FLAG_C, (cpu->r[reg] & 0x0001) != 0);
            cpu->r[reg] = (cpu->r[reg] >> 1) | (old_c ? 0x8000 : 0);
        }
        cycles += 3;
        break;

    /* ========== Control Flow - Jumps (0xA0-0xA3) ========== */
    case OP_JMP:
        addr16 = fetch_word(cpu);
        cpu->pc = addr16;
        cycles += 3;
        break;

    case OP_JMP_FAR:
        addr16 = fetch_word(cpu);  /* Offset */
        imm16 = fetch_word(cpu);   /* Segment */
        cpu->pc = addr16;
        cpu->seg[SEG_CS] = imm16;
        cycles += 4;
        break;

    case OP_JMP_R:
        reg = fetch_byte(cpu) & 0x07;
        cpu->pc = cpu->r[reg];
        cycles += 2;
        break;

    case OP_JR:
        offset8 = (int8_t)fetch_byte(cpu);
        cpu->pc += offset8;
        cycles += 2;
        break;

    /* ========== Conditional Jumps (0xB0-0xBD) ========== */
    case OP_JZ:
        addr16 = fetch_word(cpu);
        if (cpu_get_flag(cpu, FLAG_Z)) cpu->pc = addr16;
        cycles += 3;
        break;

    case OP_JNZ:
        addr16 = fetch_word(cpu);
        if (!cpu_get_flag(cpu, FLAG_Z)) cpu->pc = addr16;
        cycles += 3;
        break;

    case OP_JC:
        addr16 = fetch_word(cpu);
        if (cpu_get_flag(cpu, FLAG_C)) cpu->pc = addr16;
        cycles += 3;
        break;

    case OP_JNC:
        addr16 = fetch_word(cpu);
        if (!cpu_get_flag(cpu, FLAG_C)) cpu->pc = addr16;
        cycles += 3;
        break;

    case OP_JS:
        addr16 = fetch_word(cpu);
        if (cpu_get_flag(cpu, FLAG_S)) cpu->pc = addr16;
        cycles += 3;
        break;

    case OP_JNS:
        addr16 = fetch_word(cpu);
        if (!cpu_get_flag(cpu, FLAG_S)) cpu->pc = addr16;
        cycles += 3;
        break;

    case OP_JO:
        addr16 = fetch_word(cpu);
        if (cpu_get_flag(cpu, FLAG_O)) cpu->pc = addr16;
        cycles += 3;
        break;

    case OP_JNO:
        addr16 = fetch_word(cpu);
        if (!cpu_get_flag(cpu, FLAG_O)) cpu->pc = addr16;
        cycles += 3;
        break;

    case OP_JL:
        /* Jump if less (signed): SF != OF */
        addr16 = fetch_word(cpu);
        if (cpu_get_flag(cpu, FLAG_S) != cpu_get_flag(cpu, FLAG_O))
            cpu->pc = addr16;
        cycles += 3;
        break;

    case OP_JGE:
        /* Jump if greater or equal (signed): SF == OF */
        addr16 = fetch_word(cpu);
        if (cpu_get_flag(cpu, FLAG_S) == cpu_get_flag(cpu, FLAG_O))
            cpu->pc = addr16;
        cycles += 3;
        break;

    case OP_JLE:
        /* Jump if less or equal (signed): ZF=1 or SF != OF */
        addr16 = fetch_word(cpu);
        if (cpu_get_flag(cpu, FLAG_Z) ||
            (cpu_get_flag(cpu, FLAG_S) != cpu_get_flag(cpu, FLAG_O)))
            cpu->pc = addr16;
        cycles += 3;
        break;

    case OP_JG:
        /* Jump if greater (signed): ZF=0 and SF == OF */
        addr16 = fetch_word(cpu);
        if (!cpu_get_flag(cpu, FLAG_Z) &&
            (cpu_get_flag(cpu, FLAG_S) == cpu_get_flag(cpu, FLAG_O)))
            cpu->pc = addr16;
        cycles += 3;
        break;

    case OP_JA:
        /* Jump if above (unsigned): CF=0 and ZF=0 */
        addr16 = fetch_word(cpu);
        if (!cpu_get_flag(cpu, FLAG_C) && !cpu_get_flag(cpu, FLAG_Z))
            cpu->pc = addr16;
        cycles += 3;
        break;

    case OP_JBE:
        /* Jump if below or equal (unsigned): CF=1 or ZF=1 */
        addr16 = fetch_word(cpu);
        if (cpu_get_flag(cpu, FLAG_C) || cpu_get_flag(cpu, FLAG_Z))
            cpu->pc = addr16;
        cycles += 3;
        break;

    /* ========== Calls/Returns (0xC0-0xC5) ========== */
    case OP_CALL:
        addr16 = fetch_word(cpu);
        push_word(cpu, cpu->pc);
        cpu->pc = addr16;
        cycles += 4;
        break;

    case OP_CALL_FAR:
        addr16 = fetch_word(cpu);  /* Offset */
        imm16 = fetch_word(cpu);   /* Segment */
        push_word(cpu, cpu->seg[SEG_CS]);
        push_word(cpu, cpu->pc);
        cpu->pc = addr16;
        cpu->seg[SEG_CS] = imm16;
        cycles += 6;
        break;

    case OP_CALL_R:
        reg = fetch_byte(cpu) & 0x07;
        push_word(cpu, cpu->pc);
        cpu->pc = cpu->r[reg];
        cycles += 3;
        break;

    case OP_RET:
        cpu->pc = pop_word(cpu);
        cycles += 3;
        break;

    case OP_RET_FAR:
        cpu->pc = pop_word(cpu);
        cpu->seg[SEG_CS] = pop_word(cpu);
        cycles += 4;
        break;

    case OP_RET_I:
        imm16 = fetch_word(cpu);  /* Bytes to pop from stack after return */
        cpu->pc = pop_word(cpu);
        cpu->sp += imm16;
        cycles += 4;
        break;

    /* ========== Loop Instructions (0xD0-0xD2) ========== */
    case OP_LOOP:
        offset8 = (int8_t)fetch_byte(cpu);
        cpu->r[REG_R2]--;  /* Decrement CX */
        if (cpu->r[REG_R2] != 0) {
            cpu->pc += offset8;
        }
        cycles += 2;
        break;

    case OP_LOOPZ:
        offset8 = (int8_t)fetch_byte(cpu);
        cpu->r[REG_R2]--;
        if (cpu->r[REG_R2] != 0 && cpu_get_flag(cpu, FLAG_Z)) {
            cpu->pc += offset8;
        }
        cycles += 2;
        break;

    case OP_LOOPNZ:
        offset8 = (int8_t)fetch_byte(cpu);
        cpu->r[REG_R2]--;
        if (cpu->r[REG_R2] != 0 && !cpu_get_flag(cpu, FLAG_Z)) {
            cpu->pc += offset8;
        }
        cycles += 2;
        break;

    /* ========== String Operations (0xE0-0xEA) ========== */
    case OP_MOVSB:
        /* Move string byte: ES:[DI] = DS:[SI], update SI/DI */
        {
            uint8_t byte = cpu_read_byte(cpu, cpu->seg[SEG_DS], cpu->r[REG_R4]);
            cpu_write_byte(cpu, cpu->seg[SEG_ES], cpu->r[REG_R5], byte);
            if (cpu_get_flag(cpu, FLAG_D)) {
                cpu->r[REG_R4]--;
                cpu->r[REG_R5]--;
            } else {
                cpu->r[REG_R4]++;
                cpu->r[REG_R5]++;
            }
        }
        cycles += 4;
        break;

    case OP_MOVSW:
        /* Move string word: ES:[DI] = DS:[SI], update SI/DI by 2 */
        {
            uint16_t word = cpu_read_word(cpu, cpu->seg[SEG_DS], cpu->r[REG_R4]);
            cpu_write_word(cpu, cpu->seg[SEG_ES], cpu->r[REG_R5], word);
            if (cpu_get_flag(cpu, FLAG_D)) {
                cpu->r[REG_R4] -= 2;
                cpu->r[REG_R5] -= 2;
            } else {
                cpu->r[REG_R4] += 2;
                cpu->r[REG_R5] += 2;
            }
        }
        cycles += 4;
        break;

    case OP_CMPSB:
        /* Compare string byte: DS:[SI] - ES:[DI], update SI/DI */
        {
            uint8_t src = cpu_read_byte(cpu, cpu->seg[SEG_DS], cpu->r[REG_R4]);
            uint8_t dst = cpu_read_byte(cpu, cpu->seg[SEG_ES], cpu->r[REG_R5]);
            result32 = (uint32_t)src - (uint32_t)dst;
            update_flags_sub16(cpu, src, dst, result32);
            if (cpu_get_flag(cpu, FLAG_D)) {
                cpu->r[REG_R4]--;
                cpu->r[REG_R5]--;
            } else {
                cpu->r[REG_R4]++;
                cpu->r[REG_R5]++;
            }
        }
        cycles += 4;
        break;

    case OP_CMPSW:
        /* Compare string word */
        {
            uint16_t src = cpu_read_word(cpu, cpu->seg[SEG_DS], cpu->r[REG_R4]);
            uint16_t dst = cpu_read_word(cpu, cpu->seg[SEG_ES], cpu->r[REG_R5]);
            result32 = (uint32_t)src - (uint32_t)dst;
            update_flags_sub16(cpu, src, dst, result32);
            if (cpu_get_flag(cpu, FLAG_D)) {
                cpu->r[REG_R4] -= 2;
                cpu->r[REG_R5] -= 2;
            } else {
                cpu->r[REG_R4] += 2;
                cpu->r[REG_R5] += 2;
            }
        }
        cycles += 4;
        break;

    case OP_STOSB:
        /* Store string byte: ES:[DI] = AL, update DI */
        cpu_write_byte(cpu, cpu->seg[SEG_ES], cpu->r[REG_R5], (uint8_t)(cpu->r[REG_R0] & 0xFF));
        if (cpu_get_flag(cpu, FLAG_D)) {
            cpu->r[REG_R5]--;
        } else {
            cpu->r[REG_R5]++;
        }
        cycles += 3;
        break;

    case OP_STOSW:
        /* Store string word: ES:[DI] = AX, update DI by 2 */
        cpu_write_word(cpu, cpu->seg[SEG_ES], cpu->r[REG_R5], cpu->r[REG_R0]);
        if (cpu_get_flag(cpu, FLAG_D)) {
            cpu->r[REG_R5] -= 2;
        } else {
            cpu->r[REG_R5] += 2;
        }
        cycles += 3;
        break;

    case OP_LODSB:
        /* Load string byte: AL = DS:[SI], update SI */
        cpu->r[REG_R0] = (cpu->r[REG_R0] & 0xFF00) | cpu_read_byte(cpu, cpu->seg[SEG_DS], cpu->r[REG_R4]);
        if (cpu_get_flag(cpu, FLAG_D)) {
            cpu->r[REG_R4]--;
        } else {
            cpu->r[REG_R4]++;
        }
        cycles += 3;
        break;

    case OP_LODSW:
        /* Load string word: AX = DS:[SI], update SI by 2 */
        cpu->r[REG_R0] = cpu_read_word(cpu, cpu->seg[SEG_DS], cpu->r[REG_R4]);
        if (cpu_get_flag(cpu, FLAG_D)) {
            cpu->r[REG_R4] -= 2;
        } else {
            cpu->r[REG_R4] += 2;
        }
        cycles += 3;
        break;

    case OP_REP:
        /* REP prefix - repeat next string operation CX times */
        {
            uint8_t next_op = fetch_byte(cpu);
            while (cpu->r[REG_R2] != 0) {
                /* Execute the string operation */
                switch (next_op) {
                    case OP_MOVSB: {
                        uint8_t byte = cpu_read_byte(cpu, cpu->seg[SEG_DS], cpu->r[REG_R4]);
                        cpu_write_byte(cpu, cpu->seg[SEG_ES], cpu->r[REG_R5], byte);
                        if (cpu_get_flag(cpu, FLAG_D)) { cpu->r[REG_R4]--; cpu->r[REG_R5]--; }
                        else { cpu->r[REG_R4]++; cpu->r[REG_R5]++; }
                        break;
                    }
                    case OP_MOVSW: {
                        uint16_t word = cpu_read_word(cpu, cpu->seg[SEG_DS], cpu->r[REG_R4]);
                        cpu_write_word(cpu, cpu->seg[SEG_ES], cpu->r[REG_R5], word);
                        if (cpu_get_flag(cpu, FLAG_D)) { cpu->r[REG_R4] -= 2; cpu->r[REG_R5] -= 2; }
                        else { cpu->r[REG_R4] += 2; cpu->r[REG_R5] += 2; }
                        break;
                    }
                    case OP_STOSB:
                        cpu_write_byte(cpu, cpu->seg[SEG_ES], cpu->r[REG_R5], (uint8_t)(cpu->r[REG_R0] & 0xFF));
                        if (cpu_get_flag(cpu, FLAG_D)) cpu->r[REG_R5]--;
                        else cpu->r[REG_R5]++;
                        break;
                    case OP_STOSW:
                        cpu_write_word(cpu, cpu->seg[SEG_ES], cpu->r[REG_R5], cpu->r[REG_R0]);
                        if (cpu_get_flag(cpu, FLAG_D)) cpu->r[REG_R5] -= 2;
                        else cpu->r[REG_R5] += 2;
                        break;
                    case OP_LODSB:
                        cpu->r[REG_R0] = (cpu->r[REG_R0] & 0xFF00) | cpu_read_byte(cpu, cpu->seg[SEG_DS], cpu->r[REG_R4]);
                        if (cpu_get_flag(cpu, FLAG_D)) cpu->r[REG_R4]--;
                        else cpu->r[REG_R4]++;
                        break;
                    case OP_LODSW:
                        cpu->r[REG_R0] = cpu_read_word(cpu, cpu->seg[SEG_DS], cpu->r[REG_R4]);
                        if (cpu_get_flag(cpu, FLAG_D)) cpu->r[REG_R4] -= 2;
                        else cpu->r[REG_R4] += 2;
                        break;
                    default:
                        cpu->error = true;
                        snprintf(cpu->error_msg, sizeof(cpu->error_msg),
                                 "Invalid opcode after REP: 0x%02X", next_op);
                        return cycles;
                }
                cpu->r[REG_R2]--;
                cycles += 2;
            }
        }
        break;

    case OP_REPZ:
        /* REPZ/REPE prefix - repeat while zero/equal */
        {
            uint8_t next_op = fetch_byte(cpu);
            while (cpu->r[REG_R2] != 0) {
                switch (next_op) {
                    case OP_CMPSB: {
                        uint8_t src = cpu_read_byte(cpu, cpu->seg[SEG_DS], cpu->r[REG_R4]);
                        uint8_t dst = cpu_read_byte(cpu, cpu->seg[SEG_ES], cpu->r[REG_R5]);
                        result32 = (uint32_t)src - (uint32_t)dst;
                        update_flags_sub16(cpu, src, dst, result32);
                        if (cpu_get_flag(cpu, FLAG_D)) { cpu->r[REG_R4]--; cpu->r[REG_R5]--; }
                        else { cpu->r[REG_R4]++; cpu->r[REG_R5]++; }
                        break;
                    }
                    case OP_CMPSW: {
                        uint16_t src = cpu_read_word(cpu, cpu->seg[SEG_DS], cpu->r[REG_R4]);
                        uint16_t dst = cpu_read_word(cpu, cpu->seg[SEG_ES], cpu->r[REG_R5]);
                        result32 = (uint32_t)src - (uint32_t)dst;
                        update_flags_sub16(cpu, src, dst, result32);
                        if (cpu_get_flag(cpu, FLAG_D)) { cpu->r[REG_R4] -= 2; cpu->r[REG_R5] -= 2; }
                        else { cpu->r[REG_R4] += 2; cpu->r[REG_R5] += 2; }
                        break;
                    }
                    default:
                        cpu->error = true;
                        snprintf(cpu->error_msg, sizeof(cpu->error_msg),
                                 "Invalid opcode after REPZ: 0x%02X", next_op);
                        return cycles;
                }
                cpu->r[REG_R2]--;
                cycles += 2;
                if (!cpu_get_flag(cpu, FLAG_Z)) break;  /* Stop if not equal */
            }
        }
        break;

    case OP_REPNZ:
        /* REPNZ/REPNE prefix - repeat while not zero/not equal */
        {
            uint8_t next_op = fetch_byte(cpu);
            while (cpu->r[REG_R2] != 0) {
                switch (next_op) {
                    case OP_CMPSB: {
                        uint8_t src = cpu_read_byte(cpu, cpu->seg[SEG_DS], cpu->r[REG_R4]);
                        uint8_t dst = cpu_read_byte(cpu, cpu->seg[SEG_ES], cpu->r[REG_R5]);
                        result32 = (uint32_t)src - (uint32_t)dst;
                        update_flags_sub16(cpu, src, dst, result32);
                        if (cpu_get_flag(cpu, FLAG_D)) { cpu->r[REG_R4]--; cpu->r[REG_R5]--; }
                        else { cpu->r[REG_R4]++; cpu->r[REG_R5]++; }
                        break;
                    }
                    case OP_CMPSW: {
                        uint16_t src = cpu_read_word(cpu, cpu->seg[SEG_DS], cpu->r[REG_R4]);
                        uint16_t dst = cpu_read_word(cpu, cpu->seg[SEG_ES], cpu->r[REG_R5]);
                        result32 = (uint32_t)src - (uint32_t)dst;
                        update_flags_sub16(cpu, src, dst, result32);
                        if (cpu_get_flag(cpu, FLAG_D)) { cpu->r[REG_R4] -= 2; cpu->r[REG_R5] -= 2; }
                        else { cpu->r[REG_R4] += 2; cpu->r[REG_R5] += 2; }
                        break;
                    }
                    default:
                        cpu->error = true;
                        snprintf(cpu->error_msg, sizeof(cpu->error_msg),
                                 "Invalid opcode after REPNZ: 0x%02X", next_op);
                        return cycles;
                }
                cpu->r[REG_R2]--;
                cycles += 2;
                if (cpu_get_flag(cpu, FLAG_Z)) break;  /* Stop if equal */
            }
        }
        break;

    /* ========== I/O Operations (0xF0-0xF3) ========== */
    case OP_IN:
        /* IN Rd, port - Input word from port */
        reg = fetch_byte(cpu) & 0x07;
        imm16 = fetch_word(cpu);  /* Port number */
        /* For now, just read from MMIO region */
        {
            uint32_t io_addr = MMIO_BASE + (imm16 & 0xFFFF);
            cpu->r[reg] = cpu_read_phys_word(cpu, io_addr);
        }
        cycles += 4;
        break;

    case OP_OUT:
        /* OUT port, Rs - Output word to port */
        reg = fetch_byte(cpu) & 0x07;
        imm16 = fetch_word(cpu);  /* Port number */
        {
            uint32_t io_addr = MMIO_BASE + (imm16 & 0xFFFF);
            cpu_write_phys_word(cpu, io_addr, cpu->r[reg]);
        }
        cycles += 4;
        break;

    case OP_INB:
        /* INB Rd, port - Input byte from port */
        reg = fetch_byte(cpu) & 0x07;
        imm16 = fetch_word(cpu);  /* Port number */
        {
            uint32_t io_addr = MMIO_BASE + (imm16 & 0xFFFF);
            cpu->r[reg] = cpu_read_phys_byte(cpu, io_addr);
        }
        cycles += 4;
        break;

    case OP_OUTB:
        /* OUTB port, Rs - Output byte to port */
        reg = fetch_byte(cpu) & 0x07;
        imm16 = fetch_word(cpu);  /* Port number */
        {
            uint32_t io_addr = MMIO_BASE + (imm16 & 0xFFFF);
            cpu_write_phys_byte(cpu, io_addr, (uint8_t)(cpu->r[reg] & 0xFF));
        }
        cycles += 4;
        break;

    /* ========== Unknown Opcode ========== */
    default:
        cpu->error = true;
        snprintf(cpu->error_msg, sizeof(cpu->error_msg),
                 "Unknown opcode: 0x%02X at CS:PC=%04X:%04X (phys %05X)",
                 opcode, cpu->seg[SEG_CS], cpu->pc - 1,
                 seg_offset_to_phys(cpu->seg[SEG_CS], cpu->pc - 1));
        cpu->halted = true;
        return cycles;
    }

    cpu->instructions++;
    cpu->cycles += cycles;

    return cycles;
}

/* ========================================================================
 * Run CPU
 * ======================================================================== */

int cpu_run(Micro16CPU *cpu, int max_cycles) {
    int total_cycles = 0;

    while (!cpu->halted && !cpu->error && (max_cycles <= 0 || total_cycles < max_cycles)) {
        int cycles = cpu_step(cpu);
        if (cycles == 0) break;
        total_cycles += cycles;
    }

    return total_cycles;
}

/* ========================================================================
 * Debug Support
 * ======================================================================== */

void cpu_dump_state(const Micro16CPU *cpu) {
    printf("=== Micro16 CPU State ===\n");
    printf("CS:PC = %04X:%04X (phys %05X)    SS:SP = %04X:%04X (phys %05X)\n",
           cpu->seg[SEG_CS], cpu->pc, seg_offset_to_phys(cpu->seg[SEG_CS], cpu->pc),
           cpu->seg[SEG_SS], cpu->sp, seg_offset_to_phys(cpu->seg[SEG_SS], cpu->sp));
    printf("DS    = %04X                     ES    = %04X\n",
           cpu->seg[SEG_DS], cpu->seg[SEG_ES]);
    printf("\n");
    printf("Flags: %c%c%c%c%c%c%c%c (0x%04X)\n",
           cpu_get_flag(cpu, FLAG_S) ? 'S' : '-',
           cpu_get_flag(cpu, FLAG_Z) ? 'Z' : '-',
           cpu_get_flag(cpu, FLAG_P) ? 'P' : '-',
           cpu_get_flag(cpu, FLAG_O) ? 'O' : '-',
           cpu_get_flag(cpu, FLAG_C) ? 'C' : '-',
           cpu_get_flag(cpu, FLAG_I) ? 'I' : '-',
           cpu_get_flag(cpu, FLAG_D) ? 'D' : '-',
           cpu_get_flag(cpu, FLAG_T) ? 'T' : '-',
           cpu->flags);
    printf("\n");
    printf("AX=%04X  BX=%04X  CX=%04X  DX=%04X\n",
           cpu->r[0], cpu->r[1], cpu->r[2], cpu->r[3]);
    printf("SI=%04X  DI=%04X  BP=%04X  R7=%04X\n",
           cpu->r[4], cpu->r[5], cpu->r[6], cpu->r[7]);
    printf("\n");
    printf("IR: 0x%02X  MAR: 0x%05X  MDR: 0x%04X\n",
           cpu->ir, cpu->mar, cpu->mdr);
    printf("Halted: %s  Waiting: %s  Error: %s\n",
           cpu->halted ? "YES" : "NO",
           cpu->waiting ? "YES" : "NO",
           cpu->error ? "YES" : "NO");
    if (cpu->error) {
        printf("Error: %s\n", cpu->error_msg);
    }
    printf("Cycles: %lu  Instructions: %lu\n",
           (unsigned long)cpu->cycles,
           (unsigned long)cpu->instructions);
    printf("=========================\n");
}

void cpu_dump_memory(const Micro16CPU *cpu, uint32_t phys_start, uint32_t phys_end) {
    printf("Memory [0x%05X - 0x%05X]:\n", phys_start, phys_end);

    for (uint32_t addr = phys_start; addr <= phys_end && addr < MEM_SIZE; addr += 16) {
        printf("0x%05X: ", addr);
        for (int i = 0; i < 16 && (addr + i) <= phys_end && (addr + i) < MEM_SIZE; i++) {
            printf("%02X ", cpu->memory[addr + i]);
        }
        printf(" |");
        for (int i = 0; i < 16 && (addr + i) <= phys_end && (addr + i) < MEM_SIZE; i++) {
            uint8_t c = cpu->memory[addr + i];
            printf("%c", (c >= 32 && c < 127) ? c : '.');
        }
        printf("|\n");
    }
}

/*
 * Disassemble a single instruction (simplified)
 * For full disassembly, use the standalone disasm tool
 */
static char disasm_buf[64];

const char* cpu_disassemble(const Micro16CPU *cpu, uint32_t phys_addr, int *instr_len) {
    uint8_t opcode = cpu->memory[phys_addr];
    *instr_len = 1;

    switch (opcode) {
    case OP_NOP:
        snprintf(disasm_buf, sizeof(disasm_buf), "NOP");
        break;
    case OP_HLT:
        snprintf(disasm_buf, sizeof(disasm_buf), "HLT");
        break;
    case OP_RET:
        snprintf(disasm_buf, sizeof(disasm_buf), "RET");
        break;
    case OP_IRET:
        snprintf(disasm_buf, sizeof(disasm_buf), "IRET");
        break;
    case OP_CLI:
        snprintf(disasm_buf, sizeof(disasm_buf), "CLI");
        break;
    case OP_STI:
        snprintf(disasm_buf, sizeof(disasm_buf), "STI");
        break;
    case OP_PUSHF:
        snprintf(disasm_buf, sizeof(disasm_buf), "PUSHF");
        break;
    case OP_POPF:
        snprintf(disasm_buf, sizeof(disasm_buf), "POPF");
        break;
    case OP_JMP:
        {
            uint16_t target = cpu->memory[phys_addr + 1] |
                             ((uint16_t)cpu->memory[phys_addr + 2] << 8);
            snprintf(disasm_buf, sizeof(disasm_buf), "JMP 0x%04X", target);
            *instr_len = 3;
        }
        break;
    case OP_CALL:
        {
            uint16_t target = cpu->memory[phys_addr + 1] |
                             ((uint16_t)cpu->memory[phys_addr + 2] << 8);
            snprintf(disasm_buf, sizeof(disasm_buf), "CALL 0x%04X", target);
            *instr_len = 3;
        }
        break;
    case OP_MOV_RI:
        {
            uint8_t reg = cpu->memory[phys_addr + 1] & 0x07;
            uint16_t imm = cpu->memory[phys_addr + 2] |
                          ((uint16_t)cpu->memory[phys_addr + 3] << 8);
            snprintf(disasm_buf, sizeof(disasm_buf), "MOV %s, 0x%04X",
                     cpu_reg_name(reg), imm);
            *instr_len = 4;
        }
        break;
    default:
        snprintf(disasm_buf, sizeof(disasm_buf), "DB 0x%02X", opcode);
        break;
    }

    return disasm_buf;
}
