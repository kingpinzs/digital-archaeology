/*
 * Micro8 Emulator CLI
 *
 * Usage:
 *   micro8 run <file.bin>     - Load and run binary
 *   micro8 debug <file.bin>   - Load and debug interactively
 *   micro8 help               - Show help
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cpu.h"
#include "debugger.h"

/* Print usage */
static void print_usage(const char *prog) {
    printf("Micro8 CPU Emulator v1.0\n");
    printf("========================\n\n");
    printf("Usage:\n");
    printf("  %s run <file.bin>     Load and run binary program\n", prog);
    printf("  %s debug <file.bin>   Load and run in debug mode\n", prog);
    printf("  %s help               Show this help\n", prog);
    printf("\n");
    printf("Debug mode commands:\n");
    printf("  step, s              Execute one instruction\n");
    printf("  run, r               Run until halt or breakpoint\n");
    printf("  break <addr>, b      Set breakpoint at address (hex)\n");
    printf("  delete <addr>, d     Delete breakpoint at address\n");
    printf("  list, l              List all breakpoints\n");
    printf("  regs, reg            Show all registers\n");
    printf("  mem <start> [end]    Dump memory (hex addresses)\n");
    printf("  stack [count]        Show stack contents\n");
    printf("  reset                Reset CPU (keep memory)\n");
    printf("  load <file> [addr]   Load binary file at address\n");
    printf("  help, h, ?           Show help\n");
    printf("  quit, q              Exit debugger\n");
    printf("\n");
    printf("Architecture:\n");
    printf("  8-bit data bus, 16-bit address bus (64KB)\n");
    printf("  8 general purpose registers: R0-R7\n");
    printf("  Stack pointer (SP), Program counter (PC)\n");
    printf("  Flags: Zero (Z), Carry (C), Sign (S), Overflow (O)\n");
    printf("\n");
    printf("Instructions:\n");
    printf("  NOP              No operation\n");
    printf("  HLT              Halt execution\n");
    printf("  MOV Rd, Rs       Register to register\n");
    printf("  MOV Rd, imm8     Immediate to register\n");
    printf("  MOV Rd, [addr]   Memory to register\n");
    printf("  MOV [addr], Rs   Register to memory\n");
    printf("  ADD Rd, Rs       Rd = Rd + Rs\n");
    printf("  ADD Rd, imm8     Rd = Rd + imm8\n");
    printf("  SUB Rd, Rs       Rd = Rd - Rs\n");
    printf("  SUB Rd, imm8     Rd = Rd - imm8\n");
    printf("  PUSH Rs          Push register to stack\n");
    printf("  POP Rd           Pop from stack to register\n");
    printf("  JMP addr         Unconditional jump\n");
    printf("  JZ addr          Jump if zero flag set\n");
    printf("  JNZ addr         Jump if zero flag not set\n");
    printf("  JC addr          Jump if carry flag set\n");
    printf("  JNC addr         Jump if carry flag not set\n");
    printf("  CALL addr        Call subroutine\n");
    printf("  RET              Return from subroutine\n");
}

/* Load binary file into CPU memory at DEFAULT_PC (0x0200) */
static bool load_binary(const char *filename, Micro8CPU *cpu) {
    FILE *f = fopen(filename, "rb");
    if (!f) {
        printf("Error: Cannot open file '%s'\n", filename);
        return false;
    }

    /* Get file size */
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);

    /* Check if it fits in memory from load address */
    if (DEFAULT_PC + size > MEM_SIZE) {
        printf("Error: File too large (%ld bytes at 0x%04X, max %d)\n",
               size, DEFAULT_PC, MEM_SIZE);
        fclose(f);
        return false;
    }

    /* Read into memory starting at DEFAULT_PC (0x0200) */
    size_t read = fread(&cpu->memory[DEFAULT_PC], 1, size, f);
    fclose(f);

    printf("Loaded %zu bytes from '%s' at 0x%04X\n", read, filename, DEFAULT_PC);
    return true;
}

/* Run mode */
static int cmd_run(const char *filename) {
    Micro8CPU cpu;

    if (!cpu_init(&cpu)) {
        printf("Error: Failed to initialize CPU\n");
        return 1;
    }

    if (!load_binary(filename, &cpu)) {
        cpu_free(&cpu);
        return 1;
    }

    printf("\nRunning...\n");
    printf("----------------------------------------\n");

    int cycles = cpu_run(&cpu, 1000000);  /* Max 1M cycles */

    printf("----------------------------------------\n");
    printf("Execution complete. (%d cycles)\n\n", cycles);
    cpu_dump_state(&cpu);

    int result = cpu.error ? 1 : 0;
    cpu_free(&cpu);
    return result;
}

/* Debug mode - use the full interactive debugger */
static int cmd_debug(const char *filename) {
    Micro8CPU cpu;
    Micro8Debugger dbg;

    if (!cpu_init(&cpu)) {
        printf("Error: Failed to initialize CPU\n");
        return 1;
    }

    /* Initialize debugger */
    dbg_init(&dbg, &cpu);

    /* Load the binary file */
    if (!dbg_load_binary(&dbg, filename, DEFAULT_PC)) {
        cpu_free(&cpu);
        return 1;
    }

    /* Run the interactive debugger */
    dbg_run(&dbg);

    int result = cpu.error ? 1 : 0;
    cpu_free(&cpu);
    return result;
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        print_usage(argv[0]);
        return 1;
    }

    const char *cmd = argv[1];

    if (strcmp(cmd, "help") == 0 || strcmp(cmd, "--help") == 0 || strcmp(cmd, "-h") == 0) {
        print_usage(argv[0]);
        return 0;
    }

    if (argc < 3) {
        printf("Error: missing filename\n\n");
        print_usage(argv[0]);
        return 1;
    }

    const char *filename = argv[2];

    if (strcmp(cmd, "run") == 0) {
        return cmd_run(filename);
    } else if (strcmp(cmd, "debug") == 0) {
        return cmd_debug(filename);
    } else {
        printf("Unknown command: %s\n\n", cmd);
        print_usage(argv[0]);
        return 1;
    }
}
