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
    printf("  s, step      Execute one instruction\n");
    printf("  r, run       Run until halt\n");
    printf("  c, continue  Same as run\n");
    printf("  d, dump      Dump CPU state\n");
    printf("  m, memory    Dump memory (prompts for range)\n");
    printf("  b, break     Set breakpoint (not implemented)\n");
    printf("  q, quit      Exit debugger\n");
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

/* Load binary file into CPU memory */
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

    if (size > MEM_SIZE) {
        printf("Error: File too large (%ld bytes, max %d)\n", size, MEM_SIZE);
        fclose(f);
        return false;
    }

    /* Read into memory starting at address 0 */
    size_t read = fread(cpu->memory, 1, size, f);
    fclose(f);

    printf("Loaded %zu bytes from '%s'\n", read, filename);
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

/* Debug mode */
static int cmd_debug(const char *filename) {
    Micro8CPU cpu;

    if (!cpu_init(&cpu)) {
        printf("Error: Failed to initialize CPU\n");
        return 1;
    }

    if (!load_binary(filename, &cpu)) {
        cpu_free(&cpu);
        return 1;
    }

    printf("\nDebug mode. Type 'help' for commands.\n");
    printf("----------------------------------------\n");

    char line[256];
    bool running = true;

    while (running && !cpu.halted) {
        /* Show current instruction */
        int instr_len;
        const char *disasm = cpu_disassemble(&cpu, cpu.pc, &instr_len);

        printf("\n[PC=0x%04X SP=0x%04X Flags=%c%c%c%c] %s\n",
               cpu.pc, cpu.sp,
               (cpu.flags & FLAG_Z) ? 'Z' : '-',
               (cpu.flags & FLAG_C) ? 'C' : '-',
               (cpu.flags & FLAG_S) ? 'S' : '-',
               (cpu.flags & FLAG_O) ? 'O' : '-',
               disasm);
        printf("debug> ");
        fflush(stdout);

        if (!fgets(line, sizeof(line), stdin)) {
            break;
        }

        /* Remove newline */
        line[strcspn(line, "\n")] = '\0';

        /* Parse command */
        if (strcmp(line, "s") == 0 || strcmp(line, "step") == 0) {
            int cycles = cpu_step(&cpu);
            printf("Executed in %d cycles\n", cycles);
        } else if (strcmp(line, "r") == 0 || strcmp(line, "run") == 0 ||
                   strcmp(line, "c") == 0 || strcmp(line, "continue") == 0) {
            printf("Running...\n");
            cpu_run(&cpu, 1000000);
            printf("Stopped.\n");
        } else if (strcmp(line, "d") == 0 || strcmp(line, "dump") == 0) {
            cpu_dump_state(&cpu);
        } else if (strcmp(line, "m") == 0 || strcmp(line, "memory") == 0) {
            unsigned int start, end;
            printf("Start address (hex): ");
            fflush(stdout);
            if (fgets(line, sizeof(line), stdin) && sscanf(line, "%x", &start) == 1) {
                printf("End address (hex): ");
                fflush(stdout);
                if (fgets(line, sizeof(line), stdin) && sscanf(line, "%x", &end) == 1) {
                    if (start <= 0xFFFF && end <= 0xFFFF && start <= end) {
                        cpu_dump_memory(&cpu, (uint16_t)start, (uint16_t)end);
                    } else {
                        printf("Invalid address range\n");
                    }
                }
            }
        } else if (strcmp(line, "q") == 0 || strcmp(line, "quit") == 0) {
            running = false;
        } else if (strcmp(line, "help") == 0 || strcmp(line, "h") == 0) {
            printf("Commands:\n");
            printf("  s, step      Execute one instruction\n");
            printf("  r, run       Run until halt\n");
            printf("  d, dump      Dump CPU state\n");
            printf("  m, memory    Dump memory range\n");
            printf("  q, quit      Exit debugger\n");
        } else if (line[0] != '\0') {
            printf("Unknown command: %s\n", line);
        }
    }

    if (cpu.halted) {
        printf("\nCPU halted.\n");
        cpu_dump_state(&cpu);
    }

    cpu_free(&cpu);
    return 0;
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
