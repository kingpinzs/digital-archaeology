/*
 * Micro16 Interactive Debugger/Monitor - Implementation
 *
 * Provides interactive debugging for the Micro16 CPU with:
 * - Breakpoint management (set, list, delete, conditional)
 * - Watchpoints on registers
 * - Single-step execution
 * - Run until halt/breakpoint/watchpoint
 * - Register display (R0-R7/AX-R7, CS/DS/SS/ES, SP, PC, flags)
 * - Memory dump (hex + ASCII) with segment:offset addressing
 * - Stack viewing
 * - Disassembly of current instruction
 * - Color output for changed register values
 */

#include "debugger.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <stdarg.h>
#include <strings.h>  /* for strcasecmp */

/* ANSI color codes */
#define COLOR_RESET     "\033[0m"
#define COLOR_YELLOW    "\033[1;33m"
#define COLOR_GREEN     "\033[1;32m"
#define COLOR_RED       "\033[1;31m"
#define COLOR_CYAN      "\033[1;36m"
#define COLOR_MAGENTA   "\033[1;35m"

/* Check if terminal supports colors */
static bool use_colors = true;

/* Print with optional color */
static void print_value(const char *color, const char *fmt, ...) {
    va_list args;
    va_start(args, fmt);
    if (use_colors && color) {
        printf("%s", color);
    }
    vprintf(fmt, args);
    if (use_colors && color) {
        printf("%s", COLOR_RESET);
    }
    va_end(args);
}

/* ========================================================================
 * Initialization
 * ======================================================================== */

void dbg_init(Micro16Debugger *dbg, Micro16CPU *cpu) {
    dbg->cpu = cpu;
    dbg->bp_count = 0;
    dbg->wp_count = 0;
    dbg->running = true;

    for (int i = 0; i < MAX_BREAKPOINTS; i++) {
        dbg->breakpoints[i].active = false;
    }

    for (int i = 0; i < MAX_WATCHPOINTS; i++) {
        dbg->watchpoints[i].active = false;
    }

    /* Initialize previous state */
    dbg_save_prev_state(dbg);

    /* Check for color support */
    const char *term = getenv("TERM");
    use_colors = (term != NULL && strstr(term, "color") != NULL) ||
                 (term != NULL && strcmp(term, "xterm") == 0) ||
                 (term != NULL && strcmp(term, "xterm-256color") == 0) ||
                 (term != NULL && strcmp(term, "screen") == 0);
}

void dbg_save_prev_state(Micro16Debugger *dbg) {
    Micro16CPU *cpu = dbg->cpu;
    for (int i = 0; i < 8; i++) {
        dbg->prev_r[i] = cpu->r[i];
    }
    for (int i = 0; i < 4; i++) {
        dbg->prev_seg[i] = cpu->seg[i];
    }
    dbg->prev_sp = cpu->sp;
    dbg->prev_pc = cpu->pc;
    dbg->prev_flags = cpu->flags;
}

/* ========================================================================
 * Breakpoint Management
 * ======================================================================== */

bool dbg_set_breakpoint(Micro16Debugger *dbg, uint16_t segment, uint16_t offset) {
    return dbg_set_conditional_breakpoint(dbg, segment, offset, -1, COND_NONE, 0);
}

bool dbg_set_conditional_breakpoint(Micro16Debugger *dbg, uint16_t segment, uint16_t offset,
                                    int reg, ConditionOp op, uint16_t value) {
    /* Check if breakpoint already exists at this address */
    for (int i = 0; i < MAX_BREAKPOINTS; i++) {
        if (dbg->breakpoints[i].active &&
            dbg->breakpoints[i].segment == segment &&
            dbg->breakpoints[i].offset == offset) {
            printf("Breakpoint already set at %04X:%04X\n", segment, offset);
            return true;
        }
    }

    /* Find empty slot */
    for (int i = 0; i < MAX_BREAKPOINTS; i++) {
        if (!dbg->breakpoints[i].active) {
            dbg->breakpoints[i].active = true;
            dbg->breakpoints[i].segment = segment;
            dbg->breakpoints[i].offset = offset;
            dbg->breakpoints[i].has_condition = (reg >= 0);
            dbg->breakpoints[i].cond_register = reg;
            dbg->breakpoints[i].cond_op = op;
            dbg->breakpoints[i].cond_value = value;
            dbg->bp_count++;

            printf("Breakpoint %d set at %04X:%04X", i, segment, offset);
            if (reg >= 0) {
                const char *op_str = "?";
                switch (op) {
                    case COND_EQ: op_str = "=="; break;
                    case COND_NE: op_str = "!="; break;
                    case COND_LT: op_str = "<"; break;
                    case COND_LE: op_str = "<="; break;
                    case COND_GT: op_str = ">"; break;
                    case COND_GE: op_str = ">="; break;
                    default: break;
                }
                printf(" if %s%s0x%04X", cpu_reg_name(reg), op_str, value);
            }
            printf("\n");
            return true;
        }
    }

    printf("Error: Maximum breakpoints (%d) reached\n", MAX_BREAKPOINTS);
    return false;
}

bool dbg_clear_breakpoint(Micro16Debugger *dbg, int index) {
    if (index < 0 || index >= MAX_BREAKPOINTS) {
        printf("Invalid breakpoint index: %d\n", index);
        return false;
    }

    if (!dbg->breakpoints[index].active) {
        printf("Breakpoint %d is not active\n", index);
        return false;
    }

    dbg->breakpoints[index].active = false;
    dbg->bp_count--;
    printf("Breakpoint %d cleared\n", index);
    return true;
}

bool dbg_has_breakpoint(Micro16Debugger *dbg, uint16_t segment, uint16_t offset) {
    for (int i = 0; i < MAX_BREAKPOINTS; i++) {
        if (dbg->breakpoints[i].active &&
            dbg->breakpoints[i].segment == segment &&
            dbg->breakpoints[i].offset == offset) {
            return true;
        }
    }
    return false;
}

/* Check if any breakpoint is hit; returns index or -1 */
int dbg_check_breakpoint(Micro16Debugger *dbg) {
    Micro16CPU *cpu = dbg->cpu;

    for (int i = 0; i < MAX_BREAKPOINTS; i++) {
        if (!dbg->breakpoints[i].active) continue;

        if (dbg->breakpoints[i].segment == cpu->seg[SEG_CS] &&
            dbg->breakpoints[i].offset == cpu->pc) {

            /* Check condition if present */
            if (dbg->breakpoints[i].has_condition) {
                int reg = dbg->breakpoints[i].cond_register;
                uint16_t reg_val = (reg >= 0 && reg < 8) ? cpu->r[reg] : 0;
                uint16_t cmp_val = dbg->breakpoints[i].cond_value;
                bool cond_met = false;

                switch (dbg->breakpoints[i].cond_op) {
                    case COND_EQ: cond_met = (reg_val == cmp_val); break;
                    case COND_NE: cond_met = (reg_val != cmp_val); break;
                    case COND_LT: cond_met = (reg_val < cmp_val); break;
                    case COND_LE: cond_met = (reg_val <= cmp_val); break;
                    case COND_GT: cond_met = (reg_val > cmp_val); break;
                    case COND_GE: cond_met = (reg_val >= cmp_val); break;
                    default: cond_met = true; break;
                }

                if (!cond_met) continue;  /* Condition not met, skip */
            }

            return i;  /* Breakpoint hit */
        }
    }
    return -1;
}

void dbg_list_breakpoints(Micro16Debugger *dbg) {
    if (dbg->bp_count == 0) {
        printf("No breakpoints set\n");
        return;
    }

    printf("Breakpoints (%d active):\n", dbg->bp_count);
    for (int i = 0; i < MAX_BREAKPOINTS; i++) {
        if (dbg->breakpoints[i].active) {
            printf("  [%2d] %04X:%04X",
                   i,
                   dbg->breakpoints[i].segment,
                   dbg->breakpoints[i].offset);

            if (dbg->breakpoints[i].has_condition) {
                const char *op_str = "?";
                switch (dbg->breakpoints[i].cond_op) {
                    case COND_EQ: op_str = "=="; break;
                    case COND_NE: op_str = "!="; break;
                    case COND_LT: op_str = "<"; break;
                    case COND_LE: op_str = "<="; break;
                    case COND_GT: op_str = ">"; break;
                    case COND_GE: op_str = ">="; break;
                    default: break;
                }
                printf("  if %s%s0x%04X",
                       cpu_reg_name(dbg->breakpoints[i].cond_register),
                       op_str,
                       dbg->breakpoints[i].cond_value);
            }
            printf("\n");
        }
    }
}

/* ========================================================================
 * Watchpoint Management
 * ======================================================================== */

bool dbg_set_watchpoint(Micro16Debugger *dbg, int register_num) {
    /* Check if watchpoint already exists */
    for (int i = 0; i < MAX_WATCHPOINTS; i++) {
        if (dbg->watchpoints[i].active &&
            dbg->watchpoints[i].register_num == register_num) {
            printf("Watchpoint already set on %s\n",
                   register_num < 8 ? cpu_reg_name(register_num) : cpu_seg_name(register_num - 8));
            return true;
        }
    }

    /* Find empty slot */
    for (int i = 0; i < MAX_WATCHPOINTS; i++) {
        if (!dbg->watchpoints[i].active) {
            dbg->watchpoints[i].active = true;
            dbg->watchpoints[i].register_num = register_num;

            /* Initialize last value */
            if (register_num < 8) {
                dbg->watchpoints[i].last_value = dbg->cpu->r[register_num];
            } else if (register_num < 12) {
                dbg->watchpoints[i].last_value = dbg->cpu->seg[register_num - 8];
            }

            dbg->wp_count++;
            printf("Watchpoint %d set on %s (current value: 0x%04X)\n",
                   i,
                   register_num < 8 ? cpu_reg_name(register_num) : cpu_seg_name(register_num - 8),
                   dbg->watchpoints[i].last_value);
            return true;
        }
    }

    printf("Error: Maximum watchpoints (%d) reached\n", MAX_WATCHPOINTS);
    return false;
}

bool dbg_clear_watchpoint(Micro16Debugger *dbg, int index) {
    if (index < 0 || index >= MAX_WATCHPOINTS) {
        printf("Invalid watchpoint index: %d\n", index);
        return false;
    }

    if (!dbg->watchpoints[index].active) {
        printf("Watchpoint %d is not active\n", index);
        return false;
    }

    dbg->watchpoints[index].active = false;
    dbg->wp_count--;
    printf("Watchpoint %d cleared\n", index);
    return true;
}

int dbg_check_watchpoints(Micro16Debugger *dbg) {
    Micro16CPU *cpu = dbg->cpu;

    for (int i = 0; i < MAX_WATCHPOINTS; i++) {
        if (!dbg->watchpoints[i].active) continue;

        int reg = dbg->watchpoints[i].register_num;
        uint16_t current_value;

        if (reg < 8) {
            current_value = cpu->r[reg];
        } else if (reg < 12) {
            current_value = cpu->seg[reg - 8];
        } else {
            continue;
        }

        if (current_value != dbg->watchpoints[i].last_value) {
            printf("Watchpoint %d: %s changed from 0x%04X to 0x%04X\n",
                   i,
                   reg < 8 ? cpu_reg_name(reg) : cpu_seg_name(reg - 8),
                   dbg->watchpoints[i].last_value,
                   current_value);
            dbg->watchpoints[i].last_value = current_value;
            return i;
        }
    }
    return -1;
}

void dbg_update_watchpoint_values(Micro16Debugger *dbg) {
    Micro16CPU *cpu = dbg->cpu;

    for (int i = 0; i < MAX_WATCHPOINTS; i++) {
        if (!dbg->watchpoints[i].active) continue;

        int reg = dbg->watchpoints[i].register_num;
        if (reg < 8) {
            dbg->watchpoints[i].last_value = cpu->r[reg];
        } else if (reg < 12) {
            dbg->watchpoints[i].last_value = cpu->seg[reg - 8];
        }
    }
}

void dbg_list_watchpoints(Micro16Debugger *dbg) {
    if (dbg->wp_count == 0) {
        printf("No watchpoints set\n");
        return;
    }

    printf("Watchpoints (%d active):\n", dbg->wp_count);
    for (int i = 0; i < MAX_WATCHPOINTS; i++) {
        if (dbg->watchpoints[i].active) {
            int reg = dbg->watchpoints[i].register_num;
            uint16_t current;

            if (reg < 8) {
                current = dbg->cpu->r[reg];
            } else {
                current = dbg->cpu->seg[reg - 8];
            }

            printf("  [%2d] %s (current: 0x%04X)\n",
                   i,
                   reg < 8 ? cpu_reg_name(reg) : cpu_seg_name(reg - 8),
                   current);
        }
    }
}

/* ========================================================================
 * Execution Control
 * ======================================================================== */

int dbg_step(Micro16Debugger *dbg) {
    if (dbg->cpu->halted) {
        printf("CPU is halted\n");
        return 0;
    }

    dbg_save_prev_state(dbg);
    int cycles = cpu_step(dbg->cpu);
    return cycles;
}

int dbg_run_until_break(Micro16Debugger *dbg, int max_cycles) {
    int total_cycles = 0;
    bool first = true;

    dbg_save_prev_state(dbg);
    dbg_update_watchpoint_values(dbg);

    while (!dbg->cpu->halted && !dbg->cpu->error &&
           (max_cycles <= 0 || total_cycles < max_cycles)) {

        /* Check for breakpoint (skip first to allow continuing from breakpoint) */
        if (!first) {
            int bp = dbg_check_breakpoint(dbg);
            if (bp >= 0) {
                printf("Breakpoint %d hit at %04X:%04X\n",
                       bp, dbg->cpu->seg[SEG_CS], dbg->cpu->pc);
                return total_cycles;
            }
        }
        first = false;

        /* Execute one instruction */
        int cycles = cpu_step(dbg->cpu);
        if (cycles == 0) break;
        total_cycles += cycles;

        /* Check for watchpoint hits */
        int wp = dbg_check_watchpoints(dbg);
        if (wp >= 0) {
            return total_cycles;
        }
    }

    if (dbg->cpu->halted) {
        printf("CPU halted\n");
    } else if (dbg->cpu->error) {
        printf("CPU error: %s\n", dbg->cpu->error_msg);
    } else if (max_cycles > 0 && total_cycles >= max_cycles) {
        printf("Max cycles (%d) reached\n", max_cycles);
    }

    return total_cycles;
}

/* ========================================================================
 * Display Functions
 * ======================================================================== */

void dbg_show_regs(Micro16Debugger *dbg) {
    Micro16CPU *cpu = dbg->cpu;

    printf("=== General Purpose Registers ===\n");

    /* Row 1: AX, BX, CX, DX */
    for (int i = 0; i < 4; i++) {
        bool changed = (cpu->r[i] != dbg->prev_r[i]);
        const char *color = changed ? COLOR_YELLOW : NULL;
        printf("%s=", cpu_reg_name(i));
        print_value(color, "%04X", cpu->r[i]);
        printf(" (%5d)  ", cpu->r[i]);
    }
    printf("\n");

    /* Row 2: SI, DI, BP, R7 */
    for (int i = 4; i < 8; i++) {
        bool changed = (cpu->r[i] != dbg->prev_r[i]);
        const char *color = changed ? COLOR_YELLOW : NULL;
        printf("%s=", cpu_reg_name(i));
        print_value(color, "%04X", cpu->r[i]);
        printf(" (%5d)  ", cpu->r[i]);
    }
    printf("\n");

    /* SP and PC */
    printf("\n");
    {
        bool sp_changed = (cpu->sp != dbg->prev_sp);
        bool pc_changed = (cpu->pc != dbg->prev_pc);
        printf("SP=");
        print_value(sp_changed ? COLOR_YELLOW : NULL, "%04X", cpu->sp);
        printf("  PC=");
        print_value(pc_changed ? COLOR_YELLOW : NULL, "%04X", cpu->pc);
    }
    printf("\n");

    /* Statistics */
    printf("\nCycles: %lu  Instructions: %lu\n",
           (unsigned long)cpu->cycles,
           (unsigned long)cpu->instructions);

    printf("Halted: %s  Error: %s\n",
           cpu->halted ? "YES" : "NO",
           cpu->error ? "YES" : "NO");
    if (cpu->error) {
        printf("Error: %s\n", cpu->error_msg);
    }
}

void dbg_show_segs(Micro16Debugger *dbg) {
    Micro16CPU *cpu = dbg->cpu;

    printf("=== Segment Registers ===\n");

    const char *seg_names[] = {"CS", "DS", "SS", "ES"};
    for (int i = 0; i < 4; i++) {
        bool changed = (cpu->seg[i] != dbg->prev_seg[i]);
        const char *color = changed ? COLOR_YELLOW : NULL;
        printf("%s=", seg_names[i]);
        print_value(color, "%04X", cpu->seg[i]);
        printf(" (base: %05X)  ", (uint32_t)cpu->seg[i] << 4);
    }
    printf("\n");

    /* Show current addresses */
    printf("\nCurrent Addresses:\n");
    printf("  CS:PC = %04X:%04X -> Physical: %05X\n",
           cpu->seg[SEG_CS], cpu->pc,
           seg_offset_to_phys(cpu->seg[SEG_CS], cpu->pc));
    printf("  SS:SP = %04X:%04X -> Physical: %05X\n",
           cpu->seg[SEG_SS], cpu->sp,
           seg_offset_to_phys(cpu->seg[SEG_SS], cpu->sp));
    printf("  DS:0  = %04X:0000 -> Physical: %05X\n",
           cpu->seg[SEG_DS],
           seg_offset_to_phys(cpu->seg[SEG_DS], 0));
    printf("  ES:0  = %04X:0000 -> Physical: %05X\n",
           cpu->seg[SEG_ES],
           seg_offset_to_phys(cpu->seg[SEG_ES], 0));
}

void dbg_show_flags(Micro16Debugger *dbg) {
    Micro16CPU *cpu = dbg->cpu;
    bool changed = (cpu->flags != dbg->prev_flags);

    printf("=== Flags Register ===\n");

    printf("Flags: ");
    print_value(changed ? COLOR_YELLOW : NULL, "%04X", cpu->flags);
    printf("\n\n");

    printf("  Carry     (C): %d    Zero      (Z): %d\n",
           cpu_get_flag(cpu, FLAG_C) ? 1 : 0,
           cpu_get_flag(cpu, FLAG_Z) ? 1 : 0);
    printf("  Sign      (S): %d    Overflow  (O): %d\n",
           cpu_get_flag(cpu, FLAG_S) ? 1 : 0,
           cpu_get_flag(cpu, FLAG_O) ? 1 : 0);
    printf("  Parity    (P): %d    Direction (D): %d\n",
           cpu_get_flag(cpu, FLAG_P) ? 1 : 0,
           cpu_get_flag(cpu, FLAG_D) ? 1 : 0);
    printf("  Interrupt (I): %d    Trap      (T): %d\n",
           cpu_get_flag(cpu, FLAG_I) ? 1 : 0,
           cpu_get_flag(cpu, FLAG_T) ? 1 : 0);

    printf("\nFlag summary: ");
    printf("%c", cpu_get_flag(cpu, FLAG_S) ? 'S' : '-');
    printf("%c", cpu_get_flag(cpu, FLAG_Z) ? 'Z' : '-');
    printf("%c", cpu_get_flag(cpu, FLAG_P) ? 'P' : '-');
    printf("%c", cpu_get_flag(cpu, FLAG_O) ? 'O' : '-');
    printf("%c", cpu_get_flag(cpu, FLAG_C) ? 'C' : '-');
    printf("%c", cpu_get_flag(cpu, FLAG_I) ? 'I' : '-');
    printf("%c", cpu_get_flag(cpu, FLAG_D) ? 'D' : '-');
    printf("%c", cpu_get_flag(cpu, FLAG_T) ? 'T' : '-');
    printf("\n");
}

void dbg_show_memory(Micro16Debugger *dbg, uint16_t segment, uint16_t offset, int count) {
    Micro16CPU *cpu = dbg->cpu;

    if (count <= 0) count = 128;  /* Default to 128 bytes */

    uint32_t phys_start = seg_offset_to_phys(segment, offset);
    uint32_t phys_end = phys_start + count - 1;

    if (phys_end >= MEM_SIZE) phys_end = MEM_SIZE - 1;

    /* Align to 16-byte boundary */
    uint32_t aligned_start = phys_start & 0xFFFF0;

    printf("Memory [%04X:%04X - physical %05X]:\n", segment, offset, phys_start);

    for (uint32_t addr = aligned_start; addr <= phys_end; addr += 16) {
        /* Calculate segment:offset for this line */
        uint16_t line_offset = (uint16_t)((addr - (segment << 4)) & 0xFFFF);

        printf("%04X:%04X  ", segment, line_offset);

        /* Hex dump */
        for (int i = 0; i < 16; i++) {
            uint32_t curr_addr = addr + i;
            if (curr_addr >= phys_start && curr_addr <= phys_end && curr_addr < MEM_SIZE) {
                printf("%02X ", cpu->memory[curr_addr]);
            } else {
                printf("   ");
            }
            if (i == 7) printf(" ");  /* Extra space in middle */
        }

        printf(" |");

        /* ASCII dump */
        for (int i = 0; i < 16; i++) {
            uint32_t curr_addr = addr + i;
            if (curr_addr >= phys_start && curr_addr <= phys_end && curr_addr < MEM_SIZE) {
                uint8_t c = cpu->memory[curr_addr];
                printf("%c", (c >= 32 && c < 127) ? c : '.');
            } else {
                printf(" ");
            }
        }

        printf("|\n");
    }
}

void dbg_show_stack(Micro16Debugger *dbg, int count) {
    Micro16CPU *cpu = dbg->cpu;

    if (count <= 0) count = 16;

    printf("=== Stack (SS:SP = %04X:%04X) ===\n",
           cpu->seg[SEG_SS], cpu->sp);

    uint32_t stack_phys = seg_offset_to_phys(cpu->seg[SEG_SS], cpu->sp);
    printf("Stack physical address: %05X\n\n", stack_phys);

    if (cpu->sp >= 0xFFFE) {
        printf("Stack is empty or near bottom\n");
        return;
    }

    printf("Offset    Word      Bytes\n");
    printf("------    ----      -----\n");

    uint16_t sp = cpu->sp;
    for (int i = 0; i < count && sp < 0xFFFE; i++, sp += 2) {
        uint16_t word = cpu_read_word((Micro16CPU*)cpu, cpu->seg[SEG_SS], sp);
        printf("%04X:%04X  %04X      %02X %02X",
               cpu->seg[SEG_SS], sp, word,
               (uint8_t)(word & 0xFF), (uint8_t)(word >> 8));

        if (sp == cpu->sp) {
            printf("  <- SP");
        }
        printf("\n");
    }
}

void dbg_show_current_instruction(Micro16Debugger *dbg) {
    Micro16CPU *cpu = dbg->cpu;

    if (cpu->halted) {
        printf("[HALTED]");
        if (cpu->error) {
            printf(" Error: %s", cpu->error_msg);
        }
        printf("\n");
        return;
    }

    uint32_t phys = seg_offset_to_phys(cpu->seg[SEG_CS], cpu->pc);
    int instr_len;
    const char *disasm = cpu_disassemble(cpu, phys, &instr_len);

    char bp_marker = dbg_has_breakpoint(dbg, cpu->seg[SEG_CS], cpu->pc) ? '*' : ' ';

    /* Show segment:offset and raw bytes */
    printf("%c%04X:%04X: ", bp_marker, cpu->seg[SEG_CS], cpu->pc);
    for (int i = 0; i < instr_len && i < 6; i++) {
        printf("%02X ", cpu->memory[phys + i]);
    }
    /* Pad for alignment */
    for (int i = instr_len; i < 6; i++) {
        printf("   ");
    }

    /* Show disassembly */
    printf("  %s\n", disasm);
}

void dbg_disassemble_at(Micro16Debugger *dbg, uint16_t segment, uint16_t offset, int count) {
    Micro16CPU *cpu = dbg->cpu;

    if (count <= 0) count = 10;

    printf("Disassembly at %04X:%04X:\n", segment, offset);

    for (int i = 0; i < count; i++) {
        uint32_t phys = seg_offset_to_phys(segment, offset);
        if (phys >= MEM_SIZE) break;

        int instr_len;
        const char *disasm = cpu_disassemble(cpu, phys, &instr_len);

        char bp_marker = dbg_has_breakpoint(dbg, segment, offset) ? '*' : ' ';
        char pc_marker = (segment == cpu->seg[SEG_CS] && offset == cpu->pc) ? '>' : ' ';

        printf("%c%c%04X:%04X: ", bp_marker, pc_marker, segment, offset);
        for (int j = 0; j < instr_len && j < 6; j++) {
            printf("%02X ", cpu->memory[phys + j]);
        }
        for (int j = instr_len; j < 6; j++) {
            printf("   ");
        }
        printf("  %s\n", disasm);

        offset += instr_len;
    }
}

void dbg_show_help(void) {
    printf("Micro16 Debugger Commands:\n");
    printf("\n");
    printf("  Execution:\n");
    printf("    step, s                Execute one instruction\n");
    printf("    run, r                 Run until halt, breakpoint, or watchpoint\n");
    printf("    reset                  Reset CPU (keep memory)\n");
    printf("\n");
    printf("  Breakpoints:\n");
    printf("    break <seg:off>, b     Set breakpoint at segment:offset\n");
    printf("    break <seg:off> if <reg>==<val>  Conditional breakpoint\n");
    printf("    delete <n>, d          Delete breakpoint by index\n");
    printf("    list, l                List all breakpoints\n");
    printf("\n");
    printf("  Watchpoints:\n");
    printf("    watch <reg>, w         Break when register changes\n");
    printf("    unwatch <n>            Remove watchpoint by index\n");
    printf("    watchlist, wl          List all watchpoints\n");
    printf("\n");
    printf("  Display:\n");
    printf("    regs, reg              Show general purpose registers\n");
    printf("    segs, seg              Show segment registers\n");
    printf("    flags, f               Show flags register\n");
    printf("    mem <seg:off> [count]  Dump memory at segment:offset\n");
    printf("    stack [count]          Show stack contents\n");
    printf("    disasm [seg:off] [n]   Disassemble n instructions\n");
    printf("\n");
    printf("  Files:\n");
    printf("    load <file> [addr]     Load binary at physical address (default 0x0100)\n");
    printf("\n");
    printf("  Other:\n");
    printf("    help, h, ?             Show this help\n");
    printf("    quit, q                Exit debugger\n");
    printf("\n");
    printf("Address format: seg:off (e.g., 0000:0100 or CS:0100)\n");
    printf("Register names: AX, BX, CX, DX, SI, DI, BP, R7, CS, DS, SS, ES\n");
    printf("Condition operators: ==, !=, <, <=, >, >=\n");
}

/* ========================================================================
 * File Operations
 * ======================================================================== */

bool dbg_load_binary(Micro16Debugger *dbg, const char *filename, uint32_t phys_addr) {
    FILE *f = fopen(filename, "rb");
    if (!f) {
        printf("Error: Cannot open file '%s'\n", filename);
        return false;
    }

    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);

    if (size <= 0) {
        printf("Error: File is empty or cannot determine size\n");
        fclose(f);
        return false;
    }

    if (phys_addr + size > MEM_SIZE) {
        printf("Warning: File truncated to fit in memory\n");
        size = MEM_SIZE - phys_addr;
    }

    size_t bytes_read = fread(&dbg->cpu->memory[phys_addr], 1, size, f);
    fclose(f);

    if (bytes_read != (size_t)size) {
        printf("Warning: Only read %zu of %ld bytes\n", bytes_read, size);
    }

    printf("Loaded %zu bytes from '%s' at physical 0x%05X\n", bytes_read, filename, phys_addr);
    return true;
}

/* ========================================================================
 * Parsing Helpers
 * ======================================================================== */

/* Parse segment:offset address (e.g., "0000:0100" or "CS:0100") */
static bool parse_seg_offset(Micro16Debugger *dbg, const char *str,
                             uint16_t *segment, uint16_t *offset) {
    if (str == NULL || *str == '\0') return false;

    /* Look for colon separator */
    const char *colon = strchr(str, ':');
    if (colon == NULL) {
        /* No colon - treat as offset only, use CS */
        char *end;
        long val = strtol(str, &end, 16);
        if (*end != '\0' && !isspace((unsigned char)*end)) return false;
        if (val < 0 || val > 0xFFFF) return false;
        *segment = dbg->cpu->seg[SEG_CS];
        *offset = (uint16_t)val;
        return true;
    }

    /* Extract segment part */
    char seg_str[16];
    size_t seg_len = colon - str;
    if (seg_len >= sizeof(seg_str)) return false;
    strncpy(seg_str, str, seg_len);
    seg_str[seg_len] = '\0';

    /* Check for named segments */
    if (strcasecmp(seg_str, "CS") == 0) {
        *segment = dbg->cpu->seg[SEG_CS];
    } else if (strcasecmp(seg_str, "DS") == 0) {
        *segment = dbg->cpu->seg[SEG_DS];
    } else if (strcasecmp(seg_str, "SS") == 0) {
        *segment = dbg->cpu->seg[SEG_SS];
    } else if (strcasecmp(seg_str, "ES") == 0) {
        *segment = dbg->cpu->seg[SEG_ES];
    } else {
        /* Parse as hex */
        char *end;
        long val = strtol(seg_str, &end, 16);
        if (*end != '\0') return false;
        if (val < 0 || val > 0xFFFF) return false;
        *segment = (uint16_t)val;
    }

    /* Parse offset part */
    char *end;
    long val = strtol(colon + 1, &end, 16);
    if (*end != '\0' && !isspace((unsigned char)*end)) return false;
    if (val < 0 || val > 0xFFFF) return false;
    *offset = (uint16_t)val;

    return true;
}

/* Parse register name, returns register index or -1 */
static int parse_register(const char *str) {
    if (str == NULL) return -1;

    /* General purpose registers */
    if (strcasecmp(str, "AX") == 0 || strcasecmp(str, "R0") == 0) return 0;
    if (strcasecmp(str, "BX") == 0 || strcasecmp(str, "R1") == 0) return 1;
    if (strcasecmp(str, "CX") == 0 || strcasecmp(str, "R2") == 0) return 2;
    if (strcasecmp(str, "DX") == 0 || strcasecmp(str, "R3") == 0) return 3;
    if (strcasecmp(str, "SI") == 0 || strcasecmp(str, "R4") == 0) return 4;
    if (strcasecmp(str, "DI") == 0 || strcasecmp(str, "R5") == 0) return 5;
    if (strcasecmp(str, "BP") == 0 || strcasecmp(str, "R6") == 0) return 6;
    if (strcasecmp(str, "R7") == 0) return 7;

    /* Segment registers (offset by 8) */
    if (strcasecmp(str, "CS") == 0) return 8;
    if (strcasecmp(str, "DS") == 0) return 9;
    if (strcasecmp(str, "SS") == 0) return 10;
    if (strcasecmp(str, "ES") == 0) return 11;

    return -1;
}

/* Parse hex value */
static bool parse_hex(const char *str, uint16_t *value) {
    if (str == NULL || *str == '\0') return false;

    /* Skip 0x prefix if present */
    if (strncmp(str, "0x", 2) == 0 || strncmp(str, "0X", 2) == 0) {
        str += 2;
    }

    char *end;
    long val = strtol(str, &end, 16);
    if (*end != '\0' && !isspace((unsigned char)*end)) return false;
    if (val < 0 || val > 0xFFFF) return false;

    *value = (uint16_t)val;
    return true;
}

/* Parse physical address */
static bool parse_phys_addr(const char *str, uint32_t *addr) {
    if (str == NULL || *str == '\0') return false;

    if (strncmp(str, "0x", 2) == 0 || strncmp(str, "0X", 2) == 0) {
        str += 2;
    }

    char *end;
    long val = strtol(str, &end, 16);
    if (*end != '\0' && !isspace((unsigned char)*end)) return false;
    if (val < 0 || val > (long)MEM_SIZE) return false;

    *addr = (uint32_t)val;
    return true;
}

/* Trim whitespace */
static char *trim(char *str) {
    while (isspace((unsigned char)*str)) str++;
    if (*str == '\0') return str;

    char *end = str + strlen(str) - 1;
    while (end > str && isspace((unsigned char)*end)) end--;
    end[1] = '\0';

    return str;
}

/* ========================================================================
 * Command Processing
 * ======================================================================== */

static void process_command(Micro16Debugger *dbg, char *line) {
    char *cmd = strtok(line, " \t");
    if (cmd == NULL) return;

    /* Convert command to lowercase */
    for (char *p = cmd; *p; p++) {
        *p = tolower((unsigned char)*p);
    }

    /* ===== Execution Commands ===== */
    if (strcmp(cmd, "step") == 0 || strcmp(cmd, "s") == 0) {
        int cycles = dbg_step(dbg);
        if (cycles > 0) {
            printf("Executed in %d cycle%s\n", cycles, cycles == 1 ? "" : "s");
        }
        dbg_show_current_instruction(dbg);
    }
    else if (strcmp(cmd, "run") == 0 || strcmp(cmd, "r") == 0) {
        printf("Running...\n");
        int cycles = dbg_run_until_break(dbg, 10000000);
        printf("Executed %d cycles\n", cycles);
        dbg_show_current_instruction(dbg);
    }
    else if (strcmp(cmd, "reset") == 0) {
        cpu_reset(dbg->cpu);
        dbg_save_prev_state(dbg);
        printf("CPU reset. CS:PC=%04X:%04X SS:SP=%04X:%04X\n",
               dbg->cpu->seg[SEG_CS], dbg->cpu->pc,
               dbg->cpu->seg[SEG_SS], dbg->cpu->sp);
        dbg_show_current_instruction(dbg);
    }

    /* ===== Breakpoint Commands ===== */
    else if (strcmp(cmd, "break") == 0 || strcmp(cmd, "b") == 0) {
        char *arg = strtok(NULL, " \t");
        if (arg == NULL) {
            printf("Usage: break <seg:off> [if <reg>==<val>]\n");
            return;
        }

        uint16_t segment, offset;
        if (!parse_seg_offset(dbg, arg, &segment, &offset)) {
            printf("Invalid address: %s\n", arg);
            return;
        }

        /* Check for conditional breakpoint */
        char *if_kw = strtok(NULL, " \t");
        if (if_kw != NULL && strcasecmp(if_kw, "if") == 0) {
            char *condition = strtok(NULL, "");
            if (condition == NULL) {
                printf("Missing condition after 'if'\n");
                return;
            }

            /* Parse condition: REG op VALUE */
            condition = trim(condition);

            /* Find operator */
            char *op_pos = NULL;
            ConditionOp op = COND_NONE;

            if ((op_pos = strstr(condition, "==")) != NULL) { op = COND_EQ; }
            else if ((op_pos = strstr(condition, "!=")) != NULL) { op = COND_NE; }
            else if ((op_pos = strstr(condition, "<=")) != NULL) { op = COND_LE; }
            else if ((op_pos = strstr(condition, ">=")) != NULL) { op = COND_GE; }
            else if ((op_pos = strchr(condition, '<')) != NULL) { op = COND_LT; }
            else if ((op_pos = strchr(condition, '>')) != NULL) { op = COND_GT; }

            if (op_pos == NULL) {
                printf("Invalid condition: %s\n", condition);
                return;
            }

            /* Extract register name */
            char reg_str[16];
            size_t reg_len = op_pos - condition;
            if (reg_len >= sizeof(reg_str)) {
                printf("Invalid register in condition\n");
                return;
            }
            strncpy(reg_str, condition, reg_len);
            reg_str[reg_len] = '\0';
            char *trimmed_reg = trim(reg_str);

            int reg = parse_register(trimmed_reg);
            if (reg < 0 || reg >= 8) {  /* Only GP registers for now */
                printf("Invalid register: %s (use AX-R7)\n", trimmed_reg);
                return;
            }

            /* Extract value */
            char *val_str = op_pos + (op == COND_LE || op == COND_GE || op == COND_EQ || op == COND_NE ? 2 : 1);
            val_str = trim(val_str);
            uint16_t value;
            if (!parse_hex(val_str, &value)) {
                printf("Invalid value: %s\n", val_str);
                return;
            }

            dbg_set_conditional_breakpoint(dbg, segment, offset, reg, op, value);
        } else {
            dbg_set_breakpoint(dbg, segment, offset);
        }
    }
    else if (strcmp(cmd, "delete") == 0 || strcmp(cmd, "d") == 0) {
        char *arg = strtok(NULL, " \t");
        if (arg == NULL) {
            printf("Usage: delete <breakpoint_index>\n");
            return;
        }
        int index = atoi(arg);
        dbg_clear_breakpoint(dbg, index);
    }
    else if (strcmp(cmd, "list") == 0 || strcmp(cmd, "l") == 0) {
        dbg_list_breakpoints(dbg);
    }

    /* ===== Watchpoint Commands ===== */
    else if (strcmp(cmd, "watch") == 0 || strcmp(cmd, "w") == 0) {
        char *arg = strtok(NULL, " \t");
        if (arg == NULL) {
            printf("Usage: watch <register>\n");
            return;
        }
        int reg = parse_register(arg);
        if (reg < 0) {
            printf("Invalid register: %s\n", arg);
            return;
        }
        dbg_set_watchpoint(dbg, reg);
    }
    else if (strcmp(cmd, "unwatch") == 0) {
        char *arg = strtok(NULL, " \t");
        if (arg == NULL) {
            printf("Usage: unwatch <watchpoint_index>\n");
            return;
        }
        int index = atoi(arg);
        dbg_clear_watchpoint(dbg, index);
    }
    else if (strcmp(cmd, "watchlist") == 0 || strcmp(cmd, "wl") == 0) {
        dbg_list_watchpoints(dbg);
    }

    /* ===== Display Commands ===== */
    else if (strcmp(cmd, "regs") == 0 || strcmp(cmd, "reg") == 0 ||
             strcmp(cmd, "registers") == 0) {
        dbg_show_regs(dbg);
    }
    else if (strcmp(cmd, "segs") == 0 || strcmp(cmd, "seg") == 0 ||
             strcmp(cmd, "segments") == 0) {
        dbg_show_segs(dbg);
    }
    else if (strcmp(cmd, "flags") == 0 || strcmp(cmd, "f") == 0) {
        dbg_show_flags(dbg);
    }
    else if (strcmp(cmd, "mem") == 0 || strcmp(cmd, "m") == 0 ||
             strcmp(cmd, "memory") == 0) {
        char *arg1 = strtok(NULL, " \t");
        char *arg2 = strtok(NULL, " \t");

        uint16_t segment = dbg->cpu->seg[SEG_DS];
        uint16_t offset = 0;
        int count = 128;

        if (arg1 != NULL) {
            if (!parse_seg_offset(dbg, arg1, &segment, &offset)) {
                printf("Invalid address: %s\n", arg1);
                return;
            }
        }
        if (arg2 != NULL) {
            count = atoi(arg2);
            if (count <= 0) count = 128;
        }

        dbg_show_memory(dbg, segment, offset, count);
    }
    else if (strcmp(cmd, "stack") == 0) {
        char *arg = strtok(NULL, " \t");
        int count = 16;
        if (arg != NULL) {
            count = atoi(arg);
            if (count <= 0) count = 16;
        }
        dbg_show_stack(dbg, count);
    }
    else if (strcmp(cmd, "disasm") == 0 || strcmp(cmd, "dis") == 0 ||
             strcmp(cmd, "u") == 0) {
        char *arg1 = strtok(NULL, " \t");
        char *arg2 = strtok(NULL, " \t");

        uint16_t segment = dbg->cpu->seg[SEG_CS];
        uint16_t offset = dbg->cpu->pc;
        int count = 10;

        if (arg1 != NULL) {
            if (!parse_seg_offset(dbg, arg1, &segment, &offset)) {
                printf("Invalid address: %s\n", arg1);
                return;
            }
        }
        if (arg2 != NULL) {
            count = atoi(arg2);
            if (count <= 0) count = 10;
        }

        dbg_disassemble_at(dbg, segment, offset, count);
    }

    /* ===== File Commands ===== */
    else if (strcmp(cmd, "load") == 0) {
        char *filename = strtok(NULL, " \t");
        char *addr_str = strtok(NULL, " \t");

        if (filename == NULL) {
            printf("Usage: load <filename> [phys_addr]\n");
            return;
        }

        uint32_t addr = seg_offset_to_phys(DEFAULT_CS, DEFAULT_PC);  /* Default: 0x0100 */
        if (addr_str != NULL) {
            if (!parse_phys_addr(addr_str, &addr)) {
                printf("Invalid address: %s\n", addr_str);
                return;
            }
        }

        if (dbg_load_binary(dbg, trim(filename), addr)) {
            printf("Program loaded. Use 'reset' to reset CPU state.\n");
        }
    }

    /* ===== Other Commands ===== */
    else if (strcmp(cmd, "help") == 0 || strcmp(cmd, "h") == 0 ||
             strcmp(cmd, "?") == 0) {
        dbg_show_help();
    }
    else if (strcmp(cmd, "quit") == 0 || strcmp(cmd, "q") == 0 ||
             strcmp(cmd, "exit") == 0) {
        dbg->running = false;
    }
    else {
        printf("Unknown command: %s (type 'help' for commands)\n", cmd);
    }
}

/* ========================================================================
 * Main Debugger Loop
 * ======================================================================== */

void dbg_run(Micro16Debugger *dbg) {
    char line[256];

    printf("Micro16 Interactive Debugger\n");
    printf("16-bit CPU | 1MB Memory | Segmented Addressing\n");
    printf("Type 'help' for available commands.\n");
    printf("================================================\n");

    /* Show initial state */
    dbg_show_current_instruction(dbg);

    while (dbg->running) {
        printf("m16dbg> ");
        fflush(stdout);

        if (!fgets(line, sizeof(line), stdin)) {
            break;
        }

        /* Remove newline */
        line[strcspn(line, "\n")] = '\0';

        /* Skip empty lines */
        char *trimmed = trim(line);
        if (*trimmed == '\0') continue;

        process_command(dbg, trimmed);
    }

    printf("Goodbye.\n");
}

/* ========================================================================
 * Main Entry Point
 * ======================================================================== */

#ifndef DEBUGGER_AS_LIBRARY
int main(int argc, char *argv[]) {
    Micro16CPU cpu;
    Micro16Debugger dbg;

    if (!cpu_init(&cpu)) {
        fprintf(stderr, "Failed to initialize CPU\n");
        return 1;
    }

    dbg_init(&dbg, &cpu);

    if (argc >= 2) {
        /* Load file specified on command line */
        uint32_t load_addr = seg_offset_to_phys(DEFAULT_CS, DEFAULT_PC);
        if (argc >= 3) {
            if (!parse_phys_addr(argv[2], &load_addr)) {
                fprintf(stderr, "Invalid load address: %s\n", argv[2]);
                cpu_free(&cpu);
                return 1;
            }
        }

        if (!dbg_load_binary(&dbg, argv[1], load_addr)) {
            cpu_free(&cpu);
            return 1;
        }
    } else {
        printf("No program loaded. Use 'load <file>' to load a program.\n");
    }

    dbg_run(&dbg);

    cpu_free(&cpu);
    return cpu.error ? 1 : 0;
}
#endif /* DEBUGGER_AS_LIBRARY */
