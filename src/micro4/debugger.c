/*
 * Micro4 Interactive Debugger/Monitor - Implementation
 */

#include "debugger.h"
#include "assembler.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

/* Initialize debugger */
void dbg_init(Debugger *dbg, Micro4CPU *cpu) {
    dbg->cpu = cpu;
    dbg->bp_count = 0;
    dbg->running = true;
    for (int i = 0; i < MAX_BREAKPOINTS; i++) {
        dbg->bp_active[i] = false;
        dbg->breakpoints[i] = 0;
    }
}

/* Set a breakpoint at the given address */
bool dbg_set_breakpoint(Debugger *dbg, uint8_t addr) {
    /* Check if breakpoint already exists */
    for (int i = 0; i < MAX_BREAKPOINTS; i++) {
        if (dbg->bp_active[i] && dbg->breakpoints[i] == addr) {
            printf("Breakpoint already set at 0x%02X\n", addr);
            return true;
        }
    }

    /* Find empty slot */
    for (int i = 0; i < MAX_BREAKPOINTS; i++) {
        if (!dbg->bp_active[i]) {
            dbg->breakpoints[i] = addr;
            dbg->bp_active[i] = true;
            dbg->bp_count++;
            printf("Breakpoint set at 0x%02X\n", addr);
            return true;
        }
    }

    printf("Error: Maximum breakpoints (%d) reached\n", MAX_BREAKPOINTS);
    return false;
}

/* Clear a breakpoint at the given address */
bool dbg_clear_breakpoint(Debugger *dbg, uint8_t addr) {
    for (int i = 0; i < MAX_BREAKPOINTS; i++) {
        if (dbg->bp_active[i] && dbg->breakpoints[i] == addr) {
            dbg->bp_active[i] = false;
            dbg->bp_count--;
            printf("Breakpoint cleared at 0x%02X\n", addr);
            return true;
        }
    }

    printf("No breakpoint at 0x%02X\n", addr);
    return false;
}

/* Check if address has a breakpoint */
bool dbg_has_breakpoint(Debugger *dbg, uint8_t addr) {
    for (int i = 0; i < MAX_BREAKPOINTS; i++) {
        if (dbg->bp_active[i] && dbg->breakpoints[i] == addr) {
            return true;
        }
    }
    return false;
}

/* List all breakpoints */
void dbg_list_breakpoints(Debugger *dbg) {
    if (dbg->bp_count == 0) {
        printf("No breakpoints set\n");
        return;
    }

    printf("Breakpoints:\n");
    for (int i = 0; i < MAX_BREAKPOINTS; i++) {
        if (dbg->bp_active[i]) {
            printf("  0x%02X\n", dbg->breakpoints[i]);
        }
    }
}

/* Execute one instruction */
int dbg_step(Debugger *dbg) {
    if (dbg->cpu->halted) {
        printf("CPU is halted\n");
        return 0;
    }

    int cycles = cpu_step(dbg->cpu);
    return cycles;
}

/* Run until halt or breakpoint */
int dbg_run_until_break(Debugger *dbg, int max_cycles) {
    int total_cycles = 0;

    while (!dbg->cpu->halted && (max_cycles <= 0 || total_cycles < max_cycles)) {
        /* Check for breakpoint at current PC */
        if (dbg_has_breakpoint(dbg, dbg->cpu->pc)) {
            printf("Breakpoint hit at 0x%02X\n", dbg->cpu->pc);
            return total_cycles;
        }

        int cycles = cpu_step(dbg->cpu);
        if (cycles == 0) break;
        total_cycles += cycles;
    }

    if (dbg->cpu->halted) {
        printf("CPU halted\n");
    }

    return total_cycles;
}

/* Show register state */
void dbg_show_regs(Debugger *dbg) {
    cpu_dump_state(dbg->cpu);
}

/* Show memory range */
void dbg_show_memory(Debugger *dbg, uint8_t start, uint8_t end) {
    cpu_dump_memory(dbg->cpu, start, end);
}

/* Show current instruction */
void dbg_show_current_instruction(Debugger *dbg) {
    Micro4CPU *cpu = dbg->cpu;

    if (cpu->halted) {
        printf("[HALTED]\n");
        return;
    }

    uint8_t opcode = (cpu->memory[cpu->pc] << 4) | cpu->memory[cpu->pc + 1];
    uint8_t operand = 0;
    uint8_t op = (opcode >> 4) & 0x0F;

    if (op >= OP_LDA && op <= OP_JZ && cpu->pc + 3 < MEM_SIZE) {
        operand = (cpu->memory[cpu->pc + 2] << 4) | cpu->memory[cpu->pc + 3];
    }

    char bp_marker = dbg_has_breakpoint(dbg, cpu->pc) ? '*' : ' ';
    printf("%c[PC=0x%02X A=%X Z=%d] %s\n",
           bp_marker, cpu->pc, cpu->a, cpu->z, cpu_disassemble(opcode, operand));
}

/* Show help message */
void dbg_show_help(void) {
    printf("Micro4 Debugger Commands:\n");
    printf("  step, s            Execute one instruction\n");
    printf("  run, r             Run until halt or breakpoint\n");
    printf("  break <addr>, b    Set breakpoint at address (hex)\n");
    printf("  clear <addr>, c    Clear breakpoint at address\n");
    printf("  list, l            List all breakpoints\n");
    printf("  regs, d            Show register state\n");
    printf("  mem <start> [end]  Dump memory (hex addresses)\n");
    printf("  load <file>        Load and assemble program file\n");
    printf("  reset              Reset CPU (keep memory)\n");
    printf("  help, h, ?         Show this help\n");
    printf("  quit, q            Exit debugger\n");
}

/* Load and assemble a file */
bool dbg_load_file(Debugger *dbg, const char *filename) {
    Assembler as;

    printf("Assembling %s...\n", filename);

    if (!asm_assemble_file(&as, filename)) {
        printf("Assembly error at line %d: %s\n",
               asm_get_error_line(&as), asm_get_error(&as));
        return false;
    }

    printf("Assembly successful: %d nibbles generated\n", asm_get_output_size(&as));

    /* Reset CPU and load program */
    cpu_init(dbg->cpu);
    memcpy(dbg->cpu->memory, asm_get_output(&as), asm_get_output_size(&as));

    return true;
}

/* Parse a hex or decimal number */
static bool parse_number(const char *str, uint8_t *value) {
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
        val = strtol(str, &end, 16);  /* Default to hex */
    }

    if (*end != '\0' && !isspace((unsigned char)*end)) {
        return false;
    }

    if (val < 0 || val > 255) {
        return false;
    }

    *value = (uint8_t)val;
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
static void process_command(Debugger *dbg, char *line) {
    char *cmd = strtok(line, " \t");
    if (cmd == NULL) return;

    /* Convert command to lowercase for comparison */
    for (char *p = cmd; *p; p++) {
        *p = tolower((unsigned char)*p);
    }

    if (strcmp(cmd, "step") == 0 || strcmp(cmd, "s") == 0) {
        int cycles = dbg_step(dbg);
        if (cycles > 0) {
            printf("Executed in %d cycles\n", cycles);
            dbg_show_current_instruction(dbg);
        }
    }
    else if (strcmp(cmd, "run") == 0 || strcmp(cmd, "r") == 0) {
        printf("Running...\n");
        int cycles = dbg_run_until_break(dbg, 100000);
        printf("Executed %d cycles\n", cycles);
        dbg_show_current_instruction(dbg);
    }
    else if (strcmp(cmd, "break") == 0 || strcmp(cmd, "b") == 0) {
        char *arg = strtok(NULL, " \t");
        if (arg == NULL) {
            printf("Usage: break <addr>\n");
            return;
        }
        uint8_t addr;
        if (!parse_number(arg, &addr)) {
            printf("Invalid address: %s\n", arg);
            return;
        }
        dbg_set_breakpoint(dbg, addr);
    }
    else if (strcmp(cmd, "clear") == 0 || strcmp(cmd, "c") == 0) {
        char *arg = strtok(NULL, " \t");
        if (arg == NULL) {
            printf("Usage: clear <addr>\n");
            return;
        }
        uint8_t addr;
        if (!parse_number(arg, &addr)) {
            printf("Invalid address: %s\n", arg);
            return;
        }
        dbg_clear_breakpoint(dbg, addr);
    }
    else if (strcmp(cmd, "list") == 0 || strcmp(cmd, "l") == 0) {
        dbg_list_breakpoints(dbg);
    }
    else if (strcmp(cmd, "regs") == 0 || strcmp(cmd, "d") == 0 || strcmp(cmd, "dump") == 0) {
        dbg_show_regs(dbg);
    }
    else if (strcmp(cmd, "mem") == 0 || strcmp(cmd, "m") == 0 || strcmp(cmd, "memory") == 0) {
        char *arg1 = strtok(NULL, " \t");
        char *arg2 = strtok(NULL, " \t");

        uint8_t start = 0;
        uint8_t end = 0x3F;  /* Default: first 64 nibbles */

        if (arg1 != NULL) {
            if (!parse_number(arg1, &start)) {
                printf("Invalid start address: %s\n", arg1);
                return;
            }
            end = start + 0x1F;  /* Default range of 32 nibbles */
            if (end < start) end = 0xFF;
        }

        if (arg2 != NULL) {
            if (!parse_number(arg2, &end)) {
                printf("Invalid end address: %s\n", arg2);
                return;
            }
        }

        dbg_show_memory(dbg, start, end);
    }
    else if (strcmp(cmd, "load") == 0) {
        char *arg = strtok(NULL, " \t");
        if (arg == NULL) {
            printf("Usage: load <filename>\n");
            return;
        }
        arg = trim(arg);
        if (dbg_load_file(dbg, arg)) {
            printf("Program loaded. CPU reset.\n");
            dbg_show_current_instruction(dbg);
        }
    }
    else if (strcmp(cmd, "reset") == 0) {
        cpu_reset(dbg->cpu);
        printf("CPU reset\n");
        dbg_show_current_instruction(dbg);
    }
    else if (strcmp(cmd, "help") == 0 || strcmp(cmd, "h") == 0 || strcmp(cmd, "?") == 0) {
        dbg_show_help();
    }
    else if (strcmp(cmd, "quit") == 0 || strcmp(cmd, "q") == 0) {
        dbg->running = false;
    }
    else {
        printf("Unknown command: %s (type 'help' for commands)\n", cmd);
    }
}

/* Run the interactive debugger loop */
void dbg_run(Debugger *dbg) {
    char line[256];

    printf("Micro4 Interactive Debugger\n");
    printf("Type 'help' for available commands.\n");
    printf("----------------------------------------\n");

    /* Show initial state */
    dbg_show_current_instruction(dbg);

    while (dbg->running) {
        printf("dbg> ");
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
 */
int main(int argc, char *argv[]) {
    Micro4CPU cpu;
    Debugger dbg;

    cpu_init(&cpu);
    dbg_init(&dbg, &cpu);

    if (argc >= 2) {
        /* Load file specified on command line */
        if (!dbg_load_file(&dbg, argv[1])) {
            return 1;
        }
    } else {
        printf("No program loaded. Use 'load <file>' to load a program.\n");
    }

    dbg_run(&dbg);

    return cpu.error ? 1 : 0;
}
