/*
 * Micro8 Interactive Debugger/Monitor - Implementation
 *
 * Provides interactive debugging for the Micro8 CPU with:
 * - Breakpoint management (set, list, delete)
 * - Single-step execution
 * - Run until halt/breakpoint
 * - Register display (R0-R7, SP, PC, flags)
 * - Memory dump (hex + ASCII)
 * - Stack viewing
 * - Disassembly of current instruction
 */

#include "debugger.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

/* Initialize debugger */
void dbg_init(Micro8Debugger *dbg, Micro8CPU *cpu) {
    dbg->cpu = cpu;
    dbg->bp_count = 0;
    dbg->running = true;
    for (int i = 0; i < MAX_BREAKPOINTS; i++) {
        dbg->bp_active[i] = false;
        dbg->breakpoints[i] = 0;
    }
}

/* Set a breakpoint at the given address */
bool dbg_set_breakpoint(Micro8Debugger *dbg, uint16_t addr) {
    /* Check if breakpoint already exists */
    for (int i = 0; i < MAX_BREAKPOINTS; i++) {
        if (dbg->bp_active[i] && dbg->breakpoints[i] == addr) {
            printf("Breakpoint already set at 0x%04X\n", addr);
            return true;
        }
    }

    /* Find empty slot */
    for (int i = 0; i < MAX_BREAKPOINTS; i++) {
        if (!dbg->bp_active[i]) {
            dbg->breakpoints[i] = addr;
            dbg->bp_active[i] = true;
            dbg->bp_count++;
            printf("Breakpoint %d set at 0x%04X\n", i, addr);
            return true;
        }
    }

    printf("Error: Maximum breakpoints (%d) reached\n", MAX_BREAKPOINTS);
    return false;
}

/* Clear a breakpoint at the given address */
bool dbg_clear_breakpoint(Micro8Debugger *dbg, uint16_t addr) {
    for (int i = 0; i < MAX_BREAKPOINTS; i++) {
        if (dbg->bp_active[i] && dbg->breakpoints[i] == addr) {
            dbg->bp_active[i] = false;
            dbg->bp_count--;
            printf("Breakpoint cleared at 0x%04X\n", addr);
            return true;
        }
    }

    printf("No breakpoint at 0x%04X\n", addr);
    return false;
}

/* Check if address has a breakpoint */
bool dbg_has_breakpoint(Micro8Debugger *dbg, uint16_t addr) {
    for (int i = 0; i < MAX_BREAKPOINTS; i++) {
        if (dbg->bp_active[i] && dbg->breakpoints[i] == addr) {
            return true;
        }
    }
    return false;
}

/* List all breakpoints */
void dbg_list_breakpoints(Micro8Debugger *dbg) {
    if (dbg->bp_count == 0) {
        printf("No breakpoints set\n");
        return;
    }

    printf("Breakpoints (%d active):\n", dbg->bp_count);
    for (int i = 0; i < MAX_BREAKPOINTS; i++) {
        if (dbg->bp_active[i]) {
            printf("  [%2d] 0x%04X\n", i, dbg->breakpoints[i]);
        }
    }
}

/* Execute one instruction */
int dbg_step(Micro8Debugger *dbg) {
    if (dbg->cpu->halted) {
        printf("CPU is halted\n");
        return 0;
    }

    int cycles = cpu_step(dbg->cpu);
    return cycles;
}

/* Run until halt or breakpoint */
int dbg_run_until_break(Micro8Debugger *dbg, int max_cycles) {
    int total_cycles = 0;
    bool first = true;

    while (!dbg->cpu->halted && (max_cycles <= 0 || total_cycles < max_cycles)) {
        /* Check for breakpoint at current PC (skip first iteration to allow continuing from breakpoint) */
        if (!first && dbg_has_breakpoint(dbg, dbg->cpu->pc)) {
            printf("Breakpoint hit at 0x%04X\n", dbg->cpu->pc);
            return total_cycles;
        }
        first = false;

        int cycles = cpu_step(dbg->cpu);
        if (cycles == 0) break;
        total_cycles += cycles;
    }

    if (dbg->cpu->halted) {
        printf("CPU halted\n");
    } else if (max_cycles > 0 && total_cycles >= max_cycles) {
        printf("Max cycles (%d) reached\n", max_cycles);
    }

    return total_cycles;
}

/* Show register state */
void dbg_show_regs(Micro8Debugger *dbg) {
    Micro8CPU *cpu = dbg->cpu;

    printf("=== Registers ===\n");
    printf("PC: 0x%04X    SP: 0x%04X\n", cpu->pc, cpu->sp);
    printf("Flags: %c%c%c%c (0x%02X)\n",
           (cpu->flags & FLAG_Z) ? 'Z' : '-',
           (cpu->flags & FLAG_C) ? 'C' : '-',
           (cpu->flags & FLAG_S) ? 'S' : '-',
           (cpu->flags & FLAG_O) ? 'O' : '-',
           cpu->flags);
    printf("\n");
    printf("R0: 0x%02X (%3d)    R4: 0x%02X (%3d)\n",
           cpu->r[0], cpu->r[0], cpu->r[4], cpu->r[4]);
    printf("R1: 0x%02X (%3d)    R5: 0x%02X (%3d)  [H]\n",
           cpu->r[1], cpu->r[1], cpu->r[5], cpu->r[5]);
    printf("R2: 0x%02X (%3d)    R6: 0x%02X (%3d)  [L]\n",
           cpu->r[2], cpu->r[2], cpu->r[6], cpu->r[6]);
    printf("R3: 0x%02X (%3d)    R7: 0x%02X (%3d)\n",
           cpu->r[3], cpu->r[3], cpu->r[7], cpu->r[7]);
    printf("\n");
    printf("HL: 0x%02X%02X    Cycles: %lu    Instructions: %lu\n",
           cpu->r[5], cpu->r[6],
           (unsigned long)cpu->cycles,
           (unsigned long)cpu->instructions);
    printf("Halted: %s    Error: %s\n",
           cpu->halted ? "YES" : "NO",
           cpu->error ? "YES" : "NO");
    if (cpu->error) {
        printf("Error: %s\n", cpu->error_msg);
    }
}

/* Show memory range with hex and ASCII */
void dbg_show_memory(Micro8Debugger *dbg, uint16_t start, uint16_t end) {
    Micro8CPU *cpu = dbg->cpu;

    /* Align start to 16-byte boundary for nice display */
    uint16_t aligned_start = start & 0xFFF0;

    printf("Memory [0x%04X - 0x%04X]:\n", start, end);

    for (uint32_t addr = aligned_start; addr <= end; addr += 16) {
        printf("0x%04X: ", (uint16_t)addr);

        /* Hex dump */
        for (int i = 0; i < 16; i++) {
            uint32_t curr_addr = addr + i;
            if (curr_addr >= start && curr_addr <= end) {
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
            if (curr_addr >= start && curr_addr <= end) {
                uint8_t c = cpu->memory[curr_addr];
                printf("%c", (c >= 32 && c < 127) ? c : '.');
            } else {
                printf(" ");
            }
        }

        printf("|\n");
    }
}

/* Show stack contents */
void dbg_show_stack(Micro8Debugger *dbg, int count) {
    Micro8CPU *cpu = dbg->cpu;

    if (count <= 0) count = 16;  /* Default to showing 16 bytes */

    printf("=== Stack (SP=0x%04X) ===\n", cpu->sp);

    if (cpu->sp == 0xFFFF) {
        printf("Stack is empty\n");
        return;
    }

    /* Stack grows downward, so show from SP+1 upward */
    uint32_t stack_top = cpu->sp + 1;
    uint32_t stack_end = stack_top + count - 1;
    if (stack_end > 0xFFFF) stack_end = 0xFFFF;

    printf("Addr    Value    (as pair)\n");
    printf("------  -----    ----------\n");

    for (uint32_t addr = stack_top; addr <= stack_end; addr++) {
        printf("0x%04X: 0x%02X", (uint16_t)addr, cpu->memory[addr]);

        /* Show paired 16-bit value if there's a next byte */
        if (addr + 1 <= stack_end) {
            uint16_t word = cpu->memory[addr] | ((uint16_t)cpu->memory[addr + 1] << 8);
            printf("     (0x%04X with next)", word);
        }

        /* Mark current SP */
        if (addr == stack_top) {
            printf("  <- Top");
        }

        printf("\n");
    }
}

/* Show current instruction with disassembly */
void dbg_show_current_instruction(Micro8Debugger *dbg) {
    Micro8CPU *cpu = dbg->cpu;

    if (cpu->halted) {
        printf("[HALTED]");
        if (cpu->error) {
            printf(" Error: %s", cpu->error_msg);
        }
        printf("\n");
        return;
    }

    int instr_len;
    const char *disasm = cpu_disassemble(cpu, cpu->pc, &instr_len);

    char bp_marker = dbg_has_breakpoint(dbg, cpu->pc) ? '*' : ' ';

    /* Show address and raw bytes */
    printf("%c0x%04X: ", bp_marker, cpu->pc);
    for (int i = 0; i < instr_len && i < 4; i++) {
        printf("%02X ", cpu->memory[cpu->pc + i]);
    }
    /* Pad for alignment */
    for (int i = instr_len; i < 4; i++) {
        printf("   ");
    }

    /* Show disassembly */
    printf("  %s\n", disasm);
}

/* Show help message */
void dbg_show_help(void) {
    printf("Micro8 Debugger Commands:\n");
    printf("  step, s              Execute one instruction\n");
    printf("  run, r               Run until halt or breakpoint\n");
    printf("  break <addr>, b      Set breakpoint at address (hex)\n");
    printf("  delete <addr>, d     Delete breakpoint at address\n");
    printf("  list, l              List all breakpoints\n");
    printf("  regs, reg            Show all registers\n");
    printf("  mem <start> [end]    Dump memory (hex addresses)\n");
    printf("  stack [count]        Show stack contents\n");
    printf("  reset                Reset CPU (keep memory)\n");
    printf("  load <file> [addr]   Load binary file at address (default 0x0000)\n");
    printf("  help, h, ?           Show this help\n");
    printf("  quit, q              Exit debugger\n");
    printf("\n");
    printf("Address format: hex (e.g., 0x1234, $1234, or just 1234)\n");
}

/* Load a binary file into memory at specified address */
bool dbg_load_binary(Micro8Debugger *dbg, const char *filename, uint16_t addr) {
    FILE *f = fopen(filename, "rb");
    if (!f) {
        printf("Error: Cannot open file '%s'\n", filename);
        return false;
    }

    /* Get file size */
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);

    if (size <= 0) {
        printf("Error: File is empty or cannot determine size\n");
        fclose(f);
        return false;
    }

    /* Check if it fits in memory */
    if ((uint32_t)addr + size > MEM_SIZE) {
        printf("Warning: File truncated to fit in memory\n");
        size = MEM_SIZE - addr;
    }

    /* Read file into memory */
    size_t bytes_read = fread(&dbg->cpu->memory[addr], 1, size, f);
    fclose(f);

    if (bytes_read != (size_t)size) {
        printf("Warning: Only read %zu of %ld bytes\n", bytes_read, size);
    }

    printf("Loaded %zu bytes from '%s' at 0x%04X\n", bytes_read, filename, addr);
    return true;
}

/* Parse a hex or decimal number (16-bit) */
static bool parse_address(const char *str, uint16_t *value) {
    if (str == NULL || *str == '\0') {
        return false;
    }

    char *end;
    long val;

    if (strncmp(str, "0x", 2) == 0 || strncmp(str, "0X", 2) == 0) {
        val = strtol(str + 2, &end, 16);
    } else if (str[0] == '$') {
        val = strtol(str + 1, &end, 16);
    } else {
        /* Default to hex for addresses */
        val = strtol(str, &end, 16);
    }

    if (*end != '\0' && !isspace((unsigned char)*end)) {
        return false;
    }

    if (val < 0 || val > 0xFFFF) {
        return false;
    }

    *value = (uint16_t)val;
    return true;
}

/* Trim whitespace from string */
static char *trim(char *str) {
    while (isspace((unsigned char)*str)) str++;
    if (*str == '\0') return str;

    char *end = str + strlen(str) - 1;
    while (end > str && isspace((unsigned char)*end)) end--;
    end[1] = '\0';

    return str;
}

/* Process a debugger command */
static void process_command(Micro8Debugger *dbg, char *line) {
    char *cmd = strtok(line, " \t");
    if (cmd == NULL) return;

    /* Convert command to lowercase for comparison */
    for (char *p = cmd; *p; p++) {
        *p = tolower((unsigned char)*p);
    }

    if (strcmp(cmd, "step") == 0 || strcmp(cmd, "s") == 0) {
        int cycles = dbg_step(dbg);
        if (cycles > 0) {
            printf("Executed in %d cycle%s\n", cycles, cycles == 1 ? "" : "s");
        }
        dbg_show_current_instruction(dbg);
    }
    else if (strcmp(cmd, "run") == 0 || strcmp(cmd, "r") == 0) {
        printf("Running...\n");
        int cycles = dbg_run_until_break(dbg, 1000000);
        printf("Executed %d cycles\n", cycles);
        dbg_show_current_instruction(dbg);
    }
    else if (strcmp(cmd, "break") == 0 || strcmp(cmd, "b") == 0) {
        char *arg = strtok(NULL, " \t");
        if (arg == NULL) {
            printf("Usage: break <addr>\n");
            return;
        }
        uint16_t addr;
        if (!parse_address(arg, &addr)) {
            printf("Invalid address: %s\n", arg);
            return;
        }
        dbg_set_breakpoint(dbg, addr);
    }
    else if (strcmp(cmd, "delete") == 0 || strcmp(cmd, "d") == 0) {
        char *arg = strtok(NULL, " \t");
        if (arg == NULL) {
            printf("Usage: delete <addr>\n");
            return;
        }
        uint16_t addr;
        if (!parse_address(arg, &addr)) {
            printf("Invalid address: %s\n", arg);
            return;
        }
        dbg_clear_breakpoint(dbg, addr);
    }
    else if (strcmp(cmd, "list") == 0 || strcmp(cmd, "l") == 0) {
        dbg_list_breakpoints(dbg);
    }
    else if (strcmp(cmd, "regs") == 0 || strcmp(cmd, "reg") == 0 ||
             strcmp(cmd, "registers") == 0) {
        dbg_show_regs(dbg);
    }
    else if (strcmp(cmd, "mem") == 0 || strcmp(cmd, "m") == 0 ||
             strcmp(cmd, "memory") == 0) {
        char *arg1 = strtok(NULL, " \t");
        char *arg2 = strtok(NULL, " \t");

        uint16_t start = 0;
        uint16_t end = 0x00FF;  /* Default: first 256 bytes */

        if (arg1 != NULL) {
            if (!parse_address(arg1, &start)) {
                printf("Invalid start address: %s\n", arg1);
                return;
            }
            end = start + 0x7F;  /* Default range of 128 bytes */
            if (end < start) end = 0xFFFF;
        }

        if (arg2 != NULL) {
            if (!parse_address(arg2, &end)) {
                printf("Invalid end address: %s\n", arg2);
                return;
            }
        }

        dbg_show_memory(dbg, start, end);
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
    else if (strcmp(cmd, "load") == 0) {
        char *filename = strtok(NULL, " \t");
        char *addr_str = strtok(NULL, " \t");

        if (filename == NULL) {
            printf("Usage: load <filename> [addr]\n");
            return;
        }

        uint16_t addr = 0;
        if (addr_str != NULL) {
            if (!parse_address(addr_str, &addr)) {
                printf("Invalid address: %s\n", addr_str);
                return;
            }
        }

        if (dbg_load_binary(dbg, trim(filename), addr)) {
            printf("Program loaded. Use 'reset' to reset CPU state.\n");
        }
    }
    else if (strcmp(cmd, "reset") == 0) {
        cpu_reset(dbg->cpu);
        printf("CPU reset (SP=0x%04X, PC=0x%04X)\n", dbg->cpu->sp, dbg->cpu->pc);
        dbg_show_current_instruction(dbg);
    }
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

/* Run the interactive debugger loop */
void dbg_run(Micro8Debugger *dbg) {
    char line[256];

    printf("Micro8 Interactive Debugger\n");
    printf("8-bit CPU | 64KB Memory | 8 Registers\n");
    printf("Type 'help' for available commands.\n");
    printf("========================================\n");

    /* Show initial state */
    dbg_show_current_instruction(dbg);

    while (dbg->running) {
        printf("m8dbg> ");
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

/*
 * Main entry point for standalone debugger
 * Only compiled when building debugger as standalone executable
 */
#ifndef DEBUGGER_AS_LIBRARY
int main(int argc, char *argv[]) {
    Micro8CPU cpu;
    Micro8Debugger dbg;

    if (!cpu_init(&cpu)) {
        fprintf(stderr, "Failed to initialize CPU\n");
        return 1;
    }

    dbg_init(&dbg, &cpu);

    if (argc >= 2) {
        /* Load file specified on command line */
        uint16_t load_addr = 0;
        if (argc >= 3) {
            if (!parse_address(argv[2], &load_addr)) {
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
