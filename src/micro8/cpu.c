/*
 * Micro8 CPU Emulator - Implementation
 *
 * 8-bit CPU with ~80 instructions supporting:
 * - 8 general purpose registers (R0-R7)
 * - Register pairs: BC (R1:R2), DE (R3:R4), HL (R5:R6)
 * - 16-bit address space (64KB)
 * - Stack operations
 * - Interrupts
 * - I/O ports
 */

#include "cpu.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Register names */
static const char* REG_NAMES[] = {
    "R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7"
};

/* ========================================================================
 * Flag Update Helpers
 * ======================================================================== */

/*
 * Update Zero and Sign flags based on result
 */
static void update_flags_zs(Micro8CPU *cpu, uint8_t result) {
    if (result == 0) {
        cpu->flags |= FLAG_Z;
    } else {
        cpu->flags &= ~FLAG_Z;
    }

    if (result & 0x80) {
        cpu->flags |= FLAG_S;
    } else {
        cpu->flags &= ~FLAG_S;
    }
}

/*
 * Update all flags for addition
 */
static void update_flags_add(Micro8CPU *cpu, uint8_t a, uint8_t b, uint16_t result) {
    uint8_t res8 = (uint8_t)result;
    update_flags_zs(cpu, res8);

    /* Carry flag */
    if (result > 0xFF) {
        cpu->flags |= FLAG_C;
    } else {
        cpu->flags &= ~FLAG_C;
    }

    /* Overflow flag: set if sign of result differs from expected */
    if (((a ^ res8) & (b ^ res8) & 0x80) != 0) {
        cpu->flags |= FLAG_O;
    } else {
        cpu->flags &= ~FLAG_O;
    }
}

/*
 * Update all flags for subtraction
 */
static void update_flags_sub(Micro8CPU *cpu, uint8_t a, uint8_t b, uint16_t result) {
    uint8_t res8 = (uint8_t)result;
    update_flags_zs(cpu, res8);

    /* Carry flag (borrow) - set if a < b */
    if (a < b) {
        cpu->flags |= FLAG_C;
    } else {
        cpu->flags &= ~FLAG_C;
    }

    /* Overflow flag */
    if (((a ^ b) & (a ^ res8) & 0x80) != 0) {
        cpu->flags |= FLAG_O;
    } else {
        cpu->flags &= ~FLAG_O;
    }
}

/*
 * Update flags for logic operations (Z, S only; clear C, O)
 */
static void update_flags_logic(Micro8CPU *cpu, uint8_t result) {
    update_flags_zs(cpu, result);
    cpu->flags &= ~(FLAG_C | FLAG_O);
}

/* ========================================================================
 * CPU Lifecycle
 * ======================================================================== */

bool cpu_init(Micro8CPU *cpu) {
    memset(cpu, 0, sizeof(Micro8CPU));

    cpu->memory = (uint8_t *)calloc(MEM_SIZE, sizeof(uint8_t));
    if (cpu->memory == NULL) {
        cpu->error = true;
        snprintf(cpu->error_msg, sizeof(cpu->error_msg), "Failed to allocate memory");
        return false;
    }

    cpu_reset(cpu);
    return true;
}

void cpu_free(Micro8CPU *cpu) {
    if (cpu->memory != NULL) {
        free(cpu->memory);
        cpu->memory = NULL;
    }
}

void cpu_reset(Micro8CPU *cpu) {
    for (int i = 0; i < 8; i++) {
        cpu->r[i] = 0;
    }

    cpu->pc = DEFAULT_PC;
    cpu->sp = DEFAULT_SP;
    cpu->flags = 0;

    cpu->ie = false;
    cpu->int_pending = false;

    cpu->ir = 0;
    cpu->mar = 0;
    cpu->mdr = 0;

    memset(cpu->ports, 0, sizeof(cpu->ports));

    cpu->halted = false;
    cpu->error = false;
    cpu->error_msg[0] = '\0';
    cpu->cycles = 0;
    cpu->instructions = 0;
}

/* ========================================================================
 * Memory Operations
 * ======================================================================== */

void cpu_load_program(Micro8CPU *cpu, const uint8_t *program, uint16_t size, uint16_t start_addr) {
    for (uint32_t i = 0; i < size && (start_addr + i) < MEM_SIZE; i++) {
        cpu->memory[start_addr + i] = program[i];
    }
}

uint8_t cpu_read_mem(Micro8CPU *cpu, uint16_t addr) {
    cpu->mar = addr;
    cpu->mdr = cpu->memory[addr];
    return cpu->mdr;
}

void cpu_write_mem(Micro8CPU *cpu, uint16_t addr, uint8_t value) {
    cpu->mar = addr;
    cpu->mdr = value;
    cpu->memory[addr] = value;
}

/* ========================================================================
 * Fetch Helpers
 * ======================================================================== */

static uint8_t fetch_byte(Micro8CPU *cpu) {
    uint8_t value = cpu_read_mem(cpu, cpu->pc);
    cpu->pc++;
    return value;
}

static uint16_t fetch_word(Micro8CPU *cpu) {
    uint8_t low = fetch_byte(cpu);
    uint8_t high = fetch_byte(cpu);
    return (uint16_t)low | ((uint16_t)high << 8);
}

/* ========================================================================
 * Stack Operations
 * ======================================================================== */

static void push_byte(Micro8CPU *cpu, uint8_t value) {
    cpu_write_mem(cpu, cpu->sp, value);
    cpu->sp--;
}

static uint8_t pop_byte(Micro8CPU *cpu) {
    cpu->sp++;
    return cpu_read_mem(cpu, cpu->sp);
}

static void push_word(Micro8CPU *cpu, uint16_t value) {
    push_byte(cpu, (uint8_t)(value >> 8));   /* High byte first */
    push_byte(cpu, (uint8_t)(value & 0xFF)); /* Low byte */
}

static uint16_t pop_word(Micro8CPU *cpu) {
    uint8_t low = pop_byte(cpu);
    uint8_t high = pop_byte(cpu);
    return (uint16_t)low | ((uint16_t)high << 8);
}

/* ========================================================================
 * Interrupt Support
 * ======================================================================== */

void cpu_request_interrupt(Micro8CPU *cpu) {
    cpu->int_pending = true;
}

static void handle_interrupt(Micro8CPU *cpu) {
    if (cpu->ie && cpu->int_pending) {
        cpu->int_pending = false;
        cpu->ie = false;  /* Disable interrupts during handling */
        push_word(cpu, cpu->pc);
        push_byte(cpu, cpu->flags);
        cpu->pc = INT_VECTOR;
    }
}

/* ========================================================================
 * Instruction Execution
 * ======================================================================== */

int cpu_step(Micro8CPU *cpu) {
    if (cpu->halted) {
        return 0;
    }

    /* Check for pending interrupts */
    handle_interrupt(cpu);

    int cycles = 1;  /* Fetch cycle */

    /* Fetch opcode */
    cpu->ir = fetch_byte(cpu);
    uint8_t opcode = cpu->ir;

    uint8_t reg, src, imm8;
    int8_t offset;
    uint16_t addr16, result16;
    uint32_t result32;

    /* ========== System Instructions (0x00-0x01) ========== */
    if (opcode == OP_NOP) {
        cycles += 1;
    }
    else if (opcode == OP_HLT) {
        cpu->halted = true;
        cycles += 1;
    }

    /* ========== LDI Rd, #imm8 (0x06-0x0D) ========== */
    else if (opcode >= OP_LDI_BASE && opcode <= OP_LDI_BASE + 7) {
        reg = opcode - OP_LDI_BASE;
        imm8 = fetch_byte(cpu);
        cpu->r[reg] = imm8;
        cycles += 2;
    }

    /* ========== LD Rd, [addr16] (0x0E-0x15) ========== */
    else if (opcode >= OP_LD_BASE && opcode <= OP_LD_BASE + 7) {
        reg = opcode - OP_LD_BASE;
        addr16 = fetch_word(cpu);
        cpu->r[reg] = cpu_read_mem(cpu, addr16);
        cycles += 4;
    }

    /* ========== LDZ Rd, [zp] (0x16-0x1D) ========== */
    else if (opcode >= OP_LDZ_BASE && opcode <= OP_LDZ_BASE + 7) {
        reg = opcode - OP_LDZ_BASE;
        imm8 = fetch_byte(cpu);
        cpu->r[reg] = cpu_read_mem(cpu, (uint16_t)imm8);
        cycles += 3;
    }

    /* ========== ST Rd, [addr16] (0x1E-0x25) ========== */
    else if (opcode >= OP_ST_BASE && opcode <= OP_ST_BASE + 7) {
        reg = opcode - OP_ST_BASE;
        addr16 = fetch_word(cpu);
        cpu_write_mem(cpu, addr16, cpu->r[reg]);
        cycles += 4;
    }

    /* ========== STZ Rd, [zp] (0x26-0x2D) ========== */
    else if (opcode >= OP_STZ_BASE && opcode <= OP_STZ_BASE + 7) {
        reg = opcode - OP_STZ_BASE;
        imm8 = fetch_byte(cpu);
        cpu_write_mem(cpu, (uint16_t)imm8, cpu->r[reg]);
        cycles += 3;
    }

    /* ========== LD Rd, [HL] (0x2E) ========== */
    else if (opcode == OP_LD_HL) {
        reg = fetch_byte(cpu) & 0x07;
        cpu->r[reg] = cpu_read_mem(cpu, cpu_get_hl(cpu));
        cycles += 3;
    }

    /* ========== ST [HL], Rs (0x2F) ========== */
    else if (opcode == OP_ST_HL) {
        reg = fetch_byte(cpu) & 0x07;
        cpu_write_mem(cpu, cpu_get_hl(cpu), cpu->r[reg]);
        cycles += 3;
    }

    /* ========== LD Rd, [HL+d] (0x30) ========== */
    else if (opcode == OP_LD_HLD) {
        reg = fetch_byte(cpu) & 0x07;
        offset = (int8_t)fetch_byte(cpu);
        addr16 = cpu_get_hl(cpu) + offset;
        cpu->r[reg] = cpu_read_mem(cpu, addr16);
        cycles += 4;
    }

    /* ========== ST [HL+d], Rs (0x31) ========== */
    else if (opcode == OP_ST_HLD) {
        reg = fetch_byte(cpu) & 0x07;
        offset = (int8_t)fetch_byte(cpu);
        addr16 = cpu_get_hl(cpu) + offset;
        cpu_write_mem(cpu, addr16, cpu->r[reg]);
        cycles += 4;
    }

    /* ========== LDI16 pair, #imm16 (0x32-0x35) ========== */
    else if (opcode == OP_LDI16_HL) {
        addr16 = fetch_word(cpu);
        cpu_set_hl(cpu, addr16);
        cycles += 3;
    }
    else if (opcode == OP_LDI16_BC) {
        addr16 = fetch_word(cpu);
        cpu_set_bc(cpu, addr16);
        cycles += 3;
    }
    else if (opcode == OP_LDI16_DE) {
        addr16 = fetch_word(cpu);
        cpu_set_de(cpu, addr16);
        cycles += 3;
    }
    else if (opcode == OP_LDI16_SP) {
        cpu->sp = fetch_word(cpu);
        cycles += 3;
    }

    /* ========== MOV16 (0x36-0x37) ========== */
    else if (opcode == OP_MOV16_HL_SP) {
        cpu_set_hl(cpu, cpu->sp);
        cycles += 2;
    }
    else if (opcode == OP_MOV16_SP_HL) {
        cpu->sp = cpu_get_hl(cpu);
        cycles += 2;
    }

    /* ========== Logic Immediate (0x38-0x3A) ========== */
    else if (opcode == OP_ANDI) {
        reg = fetch_byte(cpu) & 0x07;
        imm8 = fetch_byte(cpu);
        cpu->r[reg] &= imm8;
        update_flags_logic(cpu, cpu->r[reg]);
        cycles += 3;
    }
    else if (opcode == OP_ORI) {
        reg = fetch_byte(cpu) & 0x07;
        imm8 = fetch_byte(cpu);
        cpu->r[reg] |= imm8;
        update_flags_logic(cpu, cpu->r[reg]);
        cycles += 3;
    }
    else if (opcode == OP_XORI) {
        reg = fetch_byte(cpu) & 0x07;
        imm8 = fetch_byte(cpu);
        cpu->r[reg] ^= imm8;
        update_flags_logic(cpu, cpu->r[reg]);
        cycles += 3;
    }

    /* ========== Shifts/Rotates (0x3B-0x3F) ========== */
    else if (opcode == OP_SHL) {
        reg = fetch_byte(cpu) & 0x07;
        uint8_t val = cpu->r[reg];
        cpu->flags = (cpu->flags & ~FLAG_C) | ((val & 0x80) ? FLAG_C : 0);
        cpu->r[reg] = val << 1;
        update_flags_zs(cpu, cpu->r[reg]);
        cycles += 2;
    }
    else if (opcode == OP_SHR) {
        reg = fetch_byte(cpu) & 0x07;
        uint8_t val = cpu->r[reg];
        cpu->flags = (cpu->flags & ~FLAG_C) | ((val & 0x01) ? FLAG_C : 0);
        cpu->r[reg] = val >> 1;
        update_flags_zs(cpu, cpu->r[reg]);
        cycles += 2;
    }
    else if (opcode == OP_SAR) {
        reg = fetch_byte(cpu) & 0x07;
        uint8_t val = cpu->r[reg];
        cpu->flags = (cpu->flags & ~FLAG_C) | ((val & 0x01) ? FLAG_C : 0);
        cpu->r[reg] = (val >> 1) | (val & 0x80);  /* Preserve sign bit */
        update_flags_zs(cpu, cpu->r[reg]);
        cycles += 2;
    }
    else if (opcode == OP_ROL) {
        reg = fetch_byte(cpu) & 0x07;
        uint8_t val = cpu->r[reg];
        uint8_t carry_in = (cpu->flags & FLAG_C) ? 1 : 0;
        cpu->flags = (cpu->flags & ~FLAG_C) | ((val & 0x80) ? FLAG_C : 0);
        cpu->r[reg] = (val << 1) | carry_in;
        update_flags_zs(cpu, cpu->r[reg]);
        cycles += 2;
    }
    else if (opcode == OP_ROR) {
        reg = fetch_byte(cpu) & 0x07;
        uint8_t val = cpu->r[reg];
        uint8_t carry_in = (cpu->flags & FLAG_C) ? 0x80 : 0;
        cpu->flags = (cpu->flags & ~FLAG_C) | ((val & 0x01) ? FLAG_C : 0);
        cpu->r[reg] = (val >> 1) | carry_in;
        update_flags_zs(cpu, cpu->r[reg]);
        cycles += 2;
    }

    /* ========== ADD R0, Rs (0x40-0x47) ========== */
    else if (opcode >= OP_ADD_BASE && opcode <= OP_ADD_BASE + 7) {
        src = opcode & 0x07;
        result16 = (uint16_t)cpu->r[0] + (uint16_t)cpu->r[src];
        update_flags_add(cpu, cpu->r[0], cpu->r[src], result16);
        cpu->r[0] = (uint8_t)result16;
        cycles += 1;
    }

    /* ========== ADC R0, Rs (0x48-0x4F) ========== */
    else if (opcode >= OP_ADC_BASE && opcode <= OP_ADC_BASE + 7) {
        src = opcode & 0x07;
        uint8_t carry = (cpu->flags & FLAG_C) ? 1 : 0;
        result16 = (uint16_t)cpu->r[0] + (uint16_t)cpu->r[src] + carry;
        update_flags_add(cpu, cpu->r[0], cpu->r[src] + carry, result16);
        cpu->r[0] = (uint8_t)result16;
        cycles += 1;
    }

    /* ========== SUB R0, Rs (0x50-0x57) ========== */
    else if (opcode >= OP_SUB_BASE && opcode <= OP_SUB_BASE + 7) {
        src = opcode & 0x07;
        result16 = (uint16_t)cpu->r[0] - (uint16_t)cpu->r[src];
        update_flags_sub(cpu, cpu->r[0], cpu->r[src], result16);
        cpu->r[0] = (uint8_t)result16;
        cycles += 1;
    }

    /* ========== SBC R0, Rs (0x58-0x5F) ========== */
    else if (opcode >= OP_SBC_BASE && opcode <= OP_SBC_BASE + 7) {
        src = opcode & 0x07;
        uint8_t borrow = (cpu->flags & FLAG_C) ? 1 : 0;
        result16 = (uint16_t)cpu->r[0] - (uint16_t)cpu->r[src] - borrow;
        update_flags_sub(cpu, cpu->r[0], cpu->r[src] + borrow, result16);
        cpu->r[0] = (uint8_t)result16;
        cycles += 1;
    }

    /* ========== ADDI Rd, #imm8 (0x60-0x67) ========== */
    else if (opcode >= OP_ADDI_BASE && opcode <= OP_ADDI_BASE + 7) {
        reg = opcode & 0x07;
        imm8 = fetch_byte(cpu);
        result16 = (uint16_t)cpu->r[reg] + (uint16_t)imm8;
        update_flags_add(cpu, cpu->r[reg], imm8, result16);
        cpu->r[reg] = (uint8_t)result16;
        cycles += 2;
    }

    /* ========== SUBI Rd, #imm8 (0x68-0x6F) ========== */
    else if (opcode >= OP_SUBI_BASE && opcode <= OP_SUBI_BASE + 7) {
        reg = opcode & 0x07;
        imm8 = fetch_byte(cpu);
        result16 = (uint16_t)cpu->r[reg] - (uint16_t)imm8;
        update_flags_sub(cpu, cpu->r[reg], imm8, result16);
        cpu->r[reg] = (uint8_t)result16;
        cycles += 2;
    }

    /* ========== INC Rd (0x70-0x77) ========== */
    else if (opcode >= OP_INC_BASE && opcode <= OP_INC_BASE + 7) {
        reg = opcode & 0x07;
        uint8_t old = cpu->r[reg];
        cpu->r[reg]++;
        /* INC doesn't affect carry */
        update_flags_zs(cpu, cpu->r[reg]);
        /* Overflow if went from 0x7F to 0x80 */
        if (old == 0x7F) cpu->flags |= FLAG_O; else cpu->flags &= ~FLAG_O;
        cycles += 1;
    }

    /* ========== DEC Rd (0x78-0x7F) ========== */
    else if (opcode >= OP_DEC_BASE && opcode <= OP_DEC_BASE + 7) {
        reg = opcode & 0x07;
        uint8_t old = cpu->r[reg];
        cpu->r[reg]--;
        update_flags_zs(cpu, cpu->r[reg]);
        /* Overflow if went from 0x80 to 0x7F */
        if (old == 0x80) cpu->flags |= FLAG_O; else cpu->flags &= ~FLAG_O;
        cycles += 1;
    }

    /* ========== CMP R0, Rs (0x80-0x87) ========== */
    else if (opcode >= OP_CMP_BASE && opcode <= OP_CMP_BASE + 7) {
        src = opcode & 0x07;
        result16 = (uint16_t)cpu->r[0] - (uint16_t)cpu->r[src];
        update_flags_sub(cpu, cpu->r[0], cpu->r[src], result16);
        /* Don't store result - just update flags */
        cycles += 1;
    }

    /* ========== CMPI Rd, #imm8 (0x88-0x8F) ========== */
    else if (opcode >= OP_CMPI_BASE && opcode <= OP_CMPI_BASE + 7) {
        reg = opcode & 0x07;
        imm8 = fetch_byte(cpu);
        result16 = (uint16_t)cpu->r[reg] - (uint16_t)imm8;
        update_flags_sub(cpu, cpu->r[reg], imm8, result16);
        cycles += 2;
    }

    /* ========== 16-bit Arithmetic (0x90-0x96) ========== */
    else if (opcode == OP_INC16_HL) {
        cpu_set_hl(cpu, cpu_get_hl(cpu) + 1);
        cycles += 2;
    }
    else if (opcode == OP_DEC16_HL) {
        cpu_set_hl(cpu, cpu_get_hl(cpu) - 1);
        cycles += 2;
    }
    else if (opcode == OP_INC16_BC) {
        cpu_set_bc(cpu, cpu_get_bc(cpu) + 1);
        cycles += 2;
    }
    else if (opcode == OP_DEC16_BC) {
        cpu_set_bc(cpu, cpu_get_bc(cpu) - 1);
        cycles += 2;
    }
    else if (opcode == OP_ADD16_HL_BC) {
        result32 = (uint32_t)cpu_get_hl(cpu) + (uint32_t)cpu_get_bc(cpu);
        cpu_set_hl(cpu, (uint16_t)result32);
        if (result32 > 0xFFFF) cpu->flags |= FLAG_C; else cpu->flags &= ~FLAG_C;
        cycles += 3;
    }
    else if (opcode == OP_ADD16_HL_DE) {
        result32 = (uint32_t)cpu_get_hl(cpu) + (uint32_t)cpu_get_de(cpu);
        cpu_set_hl(cpu, (uint16_t)result32);
        if (result32 > 0xFFFF) cpu->flags |= FLAG_C; else cpu->flags &= ~FLAG_C;
        cycles += 3;
    }
    else if (opcode == OP_NEG) {
        reg = fetch_byte(cpu) & 0x07;
        result16 = (uint16_t)(-(int8_t)cpu->r[reg]);
        update_flags_sub(cpu, 0, cpu->r[reg], result16);
        cpu->r[reg] = (uint8_t)result16;
        cycles += 2;
    }

    /* ========== Logic Register-Register (0xA0-0xBF) ========== */
    else if (opcode >= OP_AND_BASE && opcode <= OP_AND_BASE + 7) {
        src = opcode & 0x07;
        cpu->r[0] &= cpu->r[src];
        update_flags_logic(cpu, cpu->r[0]);
        cycles += 1;
    }
    else if (opcode >= OP_OR_BASE && opcode <= OP_OR_BASE + 7) {
        src = opcode & 0x07;
        cpu->r[0] |= cpu->r[src];
        update_flags_logic(cpu, cpu->r[0]);
        cycles += 1;
    }
    else if (opcode >= OP_XOR_BASE && opcode <= OP_XOR_BASE + 7) {
        src = opcode & 0x07;
        cpu->r[0] ^= cpu->r[src];
        update_flags_logic(cpu, cpu->r[0]);
        cycles += 1;
    }
    else if (opcode >= OP_NOT_BASE && opcode <= OP_NOT_BASE + 7) {
        reg = opcode & 0x07;
        cpu->r[reg] = ~cpu->r[reg];
        update_flags_logic(cpu, cpu->r[reg]);
        cycles += 1;
    }

    /* ========== Control Flow - Absolute Jumps (0xC0-0xC9) ========== */
    else if (opcode == OP_JMP) {
        cpu->pc = fetch_word(cpu);
        cycles += 3;
    }
    else if (opcode == OP_JR) {
        offset = (int8_t)fetch_byte(cpu);
        cpu->pc += offset;
        cycles += 2;
    }
    else if (opcode == OP_JZ) {
        addr16 = fetch_word(cpu);
        if (cpu->flags & FLAG_Z) cpu->pc = addr16;
        cycles += 3;
    }
    else if (opcode == OP_JNZ) {
        addr16 = fetch_word(cpu);
        if (!(cpu->flags & FLAG_Z)) cpu->pc = addr16;
        cycles += 3;
    }
    else if (opcode == OP_JC) {
        addr16 = fetch_word(cpu);
        if (cpu->flags & FLAG_C) cpu->pc = addr16;
        cycles += 3;
    }
    else if (opcode == OP_JNC) {
        addr16 = fetch_word(cpu);
        if (!(cpu->flags & FLAG_C)) cpu->pc = addr16;
        cycles += 3;
    }
    else if (opcode == OP_JS) {
        addr16 = fetch_word(cpu);
        if (cpu->flags & FLAG_S) cpu->pc = addr16;
        cycles += 3;
    }
    else if (opcode == OP_JNS) {
        addr16 = fetch_word(cpu);
        if (!(cpu->flags & FLAG_S)) cpu->pc = addr16;
        cycles += 3;
    }
    else if (opcode == OP_JO) {
        addr16 = fetch_word(cpu);
        if (cpu->flags & FLAG_O) cpu->pc = addr16;
        cycles += 3;
    }
    else if (opcode == OP_JNO) {
        addr16 = fetch_word(cpu);
        if (!(cpu->flags & FLAG_O)) cpu->pc = addr16;
        cycles += 3;
    }

    /* ========== Control Flow - Relative Jumps (0xCA-0xCD) ========== */
    else if (opcode == OP_JRZ) {
        offset = (int8_t)fetch_byte(cpu);
        if (cpu->flags & FLAG_Z) cpu->pc += offset;
        cycles += 2;
    }
    else if (opcode == OP_JRNZ) {
        offset = (int8_t)fetch_byte(cpu);
        if (!(cpu->flags & FLAG_Z)) cpu->pc += offset;
        cycles += 2;
    }
    else if (opcode == OP_JRC) {
        offset = (int8_t)fetch_byte(cpu);
        if (cpu->flags & FLAG_C) cpu->pc += offset;
        cycles += 2;
    }
    else if (opcode == OP_JRNC) {
        offset = (int8_t)fetch_byte(cpu);
        if (!(cpu->flags & FLAG_C)) cpu->pc += offset;
        cycles += 2;
    }

    /* ========== Control Flow - Indirect and Calls (0xCE-0xCF) ========== */
    else if (opcode == OP_JP_HL) {
        cpu->pc = cpu_get_hl(cpu);
        cycles += 2;
    }
    else if (opcode == OP_CALL) {
        addr16 = fetch_word(cpu);
        push_word(cpu, cpu->pc);
        cpu->pc = addr16;
        cycles += 5;
    }

    /* ========== Returns (0xD0-0xD1) ========== */
    else if (opcode == OP_RET) {
        cpu->pc = pop_word(cpu);
        cycles += 4;
    }
    else if (opcode == OP_RETI) {
        cpu->flags = pop_byte(cpu);
        cpu->pc = pop_word(cpu);
        cpu->ie = true;  /* Re-enable interrupts */
        cycles += 5;
    }

    /* ========== Stack Operations - PUSH (0xD2-0xD9) ========== */
    else if (opcode >= OP_PUSH_BASE && opcode <= OP_PUSH_BASE + 7) {
        reg = opcode & 0x07;
        push_byte(cpu, cpu->r[reg]);
        cycles += 2;
    }

    /* ========== Stack Operations - POP (0xDA-0xE1) ========== */
    else if (opcode >= OP_POP_BASE && opcode <= OP_POP_BASE + 7) {
        reg = opcode & 0x07;
        cpu->r[reg] = pop_byte(cpu);
        cycles += 2;
    }

    /* ========== 16-bit Stack Operations (0xE2-0xE5) ========== */
    else if (opcode == OP_PUSH16_HL) {
        push_word(cpu, cpu_get_hl(cpu));
        cycles += 3;
    }
    else if (opcode == OP_POP16_HL) {
        cpu_set_hl(cpu, pop_word(cpu));
        cycles += 3;
    }
    else if (opcode == OP_PUSH16_BC) {
        push_word(cpu, cpu_get_bc(cpu));
        cycles += 3;
    }
    else if (opcode == OP_POP16_BC) {
        cpu_set_bc(cpu, pop_word(cpu));
        cycles += 3;
    }

    /* ========== Flags Stack (0xE6-0xE7) ========== */
    else if (opcode == OP_PUSHF) {
        push_byte(cpu, cpu->flags);
        cycles += 2;
    }
    else if (opcode == OP_POPF) {
        cpu->flags = pop_byte(cpu);
        cycles += 2;
    }

    /* ========== Interrupt Control (0xE8-0xE9) ========== */
    else if (opcode == OP_EI) {
        cpu->ie = true;
        cycles += 1;
    }
    else if (opcode == OP_DI) {
        cpu->ie = false;
        cycles += 1;
    }

    /* ========== Flag Manipulation (0xEA-0xEC) ========== */
    else if (opcode == OP_SCF) {
        cpu->flags |= FLAG_C;
        cycles += 1;
    }
    else if (opcode == OP_CCF) {
        cpu->flags &= ~FLAG_C;
        cycles += 1;
    }
    else if (opcode == OP_CMF) {
        cpu->flags ^= FLAG_C;
        cycles += 1;
    }

    /* ========== I/O Operations (0xED-0xEE) ========== */
    else if (opcode == OP_IN) {
        reg = fetch_byte(cpu) & 0x07;
        imm8 = fetch_byte(cpu);  /* Port number */
        cpu->r[reg] = cpu->ports[imm8];
        cycles += 3;
    }
    else if (opcode == OP_OUT) {
        imm8 = fetch_byte(cpu);  /* Port number */
        reg = fetch_byte(cpu) & 0x07;
        cpu->ports[imm8] = cpu->r[reg];
        cycles += 3;
    }

    /* ========== SWAP (0xEF) ========== */
    else if (opcode == OP_SWAP) {
        reg = fetch_byte(cpu) & 0x07;
        uint8_t val = cpu->r[reg];
        cpu->r[reg] = ((val & 0x0F) << 4) | ((val & 0xF0) >> 4);
        update_flags_zs(cpu, cpu->r[reg]);
        cycles += 2;
    }

    /* ========== MOV Rd, Rs (0xF0) ========== */
    else if (opcode == OP_MOV_RR) {
        uint8_t operand = fetch_byte(cpu);
        uint8_t rd = (operand >> 4) & 0x07;
        uint8_t rs = operand & 0x07;
        cpu->r[rd] = cpu->r[rs];
        cycles += 2;
    }

    /* ========== Unknown Opcode ========== */
    else {
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

/* ========================================================================
 * Run CPU
 * ======================================================================== */

int cpu_run(Micro8CPU *cpu, int max_cycles) {
    int total_cycles = 0;

    while (!cpu->halted && (max_cycles <= 0 || total_cycles < max_cycles)) {
        int cycles = cpu_step(cpu);
        if (cycles == 0) break;
        total_cycles += cycles;
    }

    return total_cycles;
}

/* ========================================================================
 * Debug Support
 * ======================================================================== */

void cpu_dump_state(const Micro8CPU *cpu) {
    printf("=== Micro8 CPU State ===\n");
    printf("PC: 0x%04X  SP: 0x%04X  IE: %s\n",
           cpu->pc, cpu->sp, cpu->ie ? "ON" : "OFF");
    printf("Flags: %c%c%c%c (0x%02X)\n",
           (cpu->flags & FLAG_S) ? 'S' : '-',
           (cpu->flags & FLAG_Z) ? 'Z' : '-',
           (cpu->flags & FLAG_O) ? 'O' : '-',
           (cpu->flags & FLAG_C) ? 'C' : '-',
           cpu->flags);
    printf("R0: 0x%02X  R1: 0x%02X  R2: 0x%02X  R3: 0x%02X\n",
           cpu->r[0], cpu->r[1], cpu->r[2], cpu->r[3]);
    printf("R4: 0x%02X  R5: 0x%02X  R6: 0x%02X  R7: 0x%02X\n",
           cpu->r[4], cpu->r[5], cpu->r[6], cpu->r[7]);
    printf("HL: 0x%04X  BC: 0x%04X  DE: 0x%04X\n",
           cpu_get_hl(cpu), cpu_get_bc(cpu), cpu_get_de(cpu));
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
 * Disassemble a single instruction
 * Note: For full disassembly, use the standalone disasm tool
 */
static char disasm_buf[64];

const char* cpu_disassemble(const Micro8CPU *cpu, uint16_t addr, int *instr_len) {
    uint8_t opcode = cpu->memory[addr];
    *instr_len = 1;

    /* This is a simplified disassembler for debugging
     * Full disassembly is done by disasm.c */

    if (opcode == OP_NOP) {
        snprintf(disasm_buf, sizeof(disasm_buf), "NOP");
    }
    else if (opcode == OP_HLT) {
        snprintf(disasm_buf, sizeof(disasm_buf), "HLT");
    }
    else if (opcode >= OP_LDI_BASE && opcode <= OP_LDI_BASE + 7) {
        int reg = opcode - OP_LDI_BASE;
        snprintf(disasm_buf, sizeof(disasm_buf), "LDI %s, #0x%02X",
                 REG_NAMES[reg], cpu->memory[addr + 1]);
        *instr_len = 2;
    }
    else if (opcode >= OP_INC_BASE && opcode <= OP_INC_BASE + 7) {
        snprintf(disasm_buf, sizeof(disasm_buf), "INC %s", REG_NAMES[opcode & 7]);
    }
    else if (opcode >= OP_DEC_BASE && opcode <= OP_DEC_BASE + 7) {
        snprintf(disasm_buf, sizeof(disasm_buf), "DEC %s", REG_NAMES[opcode & 7]);
    }
    else if (opcode == OP_JMP) {
        uint16_t target = cpu->memory[addr + 1] | ((uint16_t)cpu->memory[addr + 2] << 8);
        snprintf(disasm_buf, sizeof(disasm_buf), "JMP 0x%04X", target);
        *instr_len = 3;
    }
    else if (opcode == OP_CALL) {
        uint16_t target = cpu->memory[addr + 1] | ((uint16_t)cpu->memory[addr + 2] << 8);
        snprintf(disasm_buf, sizeof(disasm_buf), "CALL 0x%04X", target);
        *instr_len = 3;
    }
    else if (opcode == OP_RET) {
        snprintf(disasm_buf, sizeof(disasm_buf), "RET");
    }
    else if (opcode == OP_MOV_RR) {
        uint8_t operand = cpu->memory[addr + 1];
        int rd = (operand >> 4) & 0x07;
        int rs = operand & 0x07;
        snprintf(disasm_buf, sizeof(disasm_buf), "MOV %s, %s", REG_NAMES[rd], REG_NAMES[rs]);
        *instr_len = 2;
    }
    else {
        snprintf(disasm_buf, sizeof(disasm_buf), "DB 0x%02X", opcode);
    }

    return disasm_buf;
}
