/*
 * Micro16 Emulator CLI
 *
 * Usage:
 *   micro16 run <file.bin>     - Load and run binary
 *   micro16 debug <file.bin>   - Load and debug interactively
 *   micro16 help               - Show help
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cpu.h"

/* Print usage */
static void print_usage(const char *prog) {
    printf("Micro16 CPU Emulator v1.0\n");
    printf("=========================\n\n");
    printf("Usage:\n");
    printf("  %s run <file.bin>     Load and run binary program\n", prog);
    printf("  %s debug <file.bin>   Load and run in debug mode (TODO)\n", prog);
    printf("  %s help               Show this help\n", prog);
    printf("\n");
    printf("Options:\n");
    printf("  -v, --verbose         Verbose output during execution\n");
    printf("  -c, --cycles <n>      Maximum cycles to execute (default: 10M)\n");
    printf("  -a, --addr <hex>      Load address (default: CS:0100)\n");
    printf("\n");
    printf("Architecture:\n");
    printf("  16-bit data bus, 20-bit address bus (1MB)\n");
    printf("  8 general purpose registers: AX, BX, CX, DX, SI, DI, BP, R7\n");
    printf("  4 segment registers: CS, DS, SS, ES\n");
    printf("  Stack pointer (SP), Program counter (PC)\n");
    printf("  Flags: Zero, Carry, Sign, Overflow, Direction, Interrupt, Trap, Parity\n");
    printf("\n");
    printf("Memory Map:\n");
    printf("  0x00000 - 0x003FF  Interrupt Vector Table (256 x 4 bytes)\n");
    printf("  0x00400 - 0xEFFFF  General memory\n");
    printf("  0xF0000 - 0xFFFFF  Memory-mapped I/O (64KB)\n");
    printf("\n");
    printf("Segment:Offset Addressing:\n");
    printf("  Physical address = (Segment << 4) + Offset\n");
    printf("  Each segment can address 64KB\n");
    printf("  Default: CS=0000, DS=0000, SS=0F00, ES=0000\n");
    printf("  Default: PC=0100 (loaded at physical 0x00100)\n");
    printf("\n");
    printf("Key Instructions:\n");
    printf("  MOV Rd, Rs       Register to register\n");
    printf("  MOV Rd, #imm16   Immediate to register\n");
    printf("  MOV Rd, [addr]   Memory to register\n");
    printf("  MOV [addr], Rs   Register to memory\n");
    printf("  ADD, SUB, MUL, DIV  Arithmetic operations\n");
    printf("  AND, OR, XOR, NOT   Logic operations\n");
    printf("  SHL, SHR, SAR       Shift operations\n");
    printf("  PUSH, POP           Stack operations\n");
    printf("  JMP, CALL, RET      Control flow\n");
    printf("  JZ, JNZ, JC, JNC    Conditional jumps\n");
    printf("  INT n, IRET         Software interrupts\n");
}

/* Load binary file into CPU memory */
static bool load_binary(const char *filename, Micro16CPU *cpu, uint32_t load_addr) {
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
    if (load_addr + size > MEM_SIZE) {
        printf("Error: File too large (%ld bytes at 0x%05X, max %d)\n",
               size, load_addr, MEM_SIZE);
        fclose(f);
        return false;
    }

    /* Read into memory */
    size_t read = fread(&cpu->memory[load_addr], 1, size, f);
    fclose(f);

    printf("Loaded %zu bytes from '%s' at physical 0x%05X\n", read, filename, load_addr);
    return true;
}

/* Run mode */
static int cmd_run(const char *filename, int max_cycles, uint32_t load_addr, bool verbose) {
    Micro16CPU cpu;

    if (!cpu_init(&cpu)) {
        printf("Error: Failed to initialize CPU\n");
        return 1;
    }

    if (!load_binary(filename, &cpu, load_addr)) {
        cpu_free(&cpu);
        return 1;
    }

    /* Set PC to point to loaded code (within CS) */
    /* load_addr = (CS << 4) + PC, so PC = load_addr - (CS << 4) */
    cpu.pc = load_addr - ((uint32_t)cpu.seg[SEG_CS] << 4);

    printf("\nRunning...\n");
    if (verbose) {
        printf("Initial state:\n");
        cpu_dump_state(&cpu);
    }
    printf("----------------------------------------\n");

    int cycles = cpu_run(&cpu, max_cycles);

    printf("----------------------------------------\n");
    printf("Execution complete. (%d cycles)\n\n", cycles);
    cpu_dump_state(&cpu);

    if (cpu.error) {
        printf("\nERROR: %s\n", cpu.error_msg);
    }

    int result = cpu.error ? 1 : 0;
    cpu_free(&cpu);
    return result;
}

/* Debug mode - simple step-by-step execution */
static int cmd_debug(const char *filename, uint32_t load_addr) {
    Micro16CPU cpu;

    if (!cpu_init(&cpu)) {
        printf("Error: Failed to initialize CPU\n");
        return 1;
    }

    if (!load_binary(filename, &cpu, load_addr)) {
        cpu_free(&cpu);
        return 1;
    }

    /* Set PC to point to loaded code */
    cpu.pc = load_addr - ((uint32_t)cpu.seg[SEG_CS] << 4);

    printf("\nMicro16 Debugger\n");
    printf("================\n");
    printf("Commands: s(tep), r(un), q(uit), reg(isters), mem <addr> [len]\n\n");

    char line[256];
    bool running = true;

    while (running && !cpu.halted && !cpu.error) {
        /* Show current instruction */
        uint32_t phys_pc = seg_offset_to_phys(cpu.seg[SEG_CS], cpu.pc);
        int len;
        const char *disasm = cpu_disassemble(&cpu, phys_pc, &len);
        printf("%04X:%04X  %s\n", cpu.seg[SEG_CS], cpu.pc, disasm);

        /* Get command */
        printf("> ");
        fflush(stdout);

        if (fgets(line, sizeof(line), stdin) == NULL) {
            break;
        }

        /* Remove newline */
        line[strcspn(line, "\n")] = 0;

        /* Parse command */
        if (line[0] == '\0' || strcmp(line, "s") == 0 || strcmp(line, "step") == 0) {
            cpu_step(&cpu);
        }
        else if (strcmp(line, "r") == 0 || strcmp(line, "run") == 0) {
            int cycles = cpu_run(&cpu, 1000000);
            printf("Ran %d cycles\n", cycles);
        }
        else if (strcmp(line, "q") == 0 || strcmp(line, "quit") == 0) {
            running = false;
        }
        else if (strcmp(line, "reg") == 0 || strcmp(line, "regs") == 0 ||
                 strcmp(line, "registers") == 0) {
            cpu_dump_state(&cpu);
        }
        else if (strncmp(line, "mem ", 4) == 0) {
            uint32_t addr = 0;
            int count = 64;
            if (sscanf(line + 4, "%x %d", &addr, &count) >= 1) {
                cpu_dump_memory(&cpu, addr, addr + count - 1);
            } else {
                printf("Usage: mem <addr> [count]\n");
            }
        }
        else if (strcmp(line, "help") == 0 || strcmp(line, "?") == 0) {
            printf("Commands:\n");
            printf("  s, step      Execute one instruction\n");
            printf("  r, run       Run until halt or breakpoint\n");
            printf("  reg, regs    Show all registers\n");
            printf("  mem <a> [n]  Dump n bytes of memory at address a\n");
            printf("  q, quit      Exit debugger\n");
            printf("  help, ?      Show this help\n");
        }
        else {
            printf("Unknown command: %s (type 'help' for commands)\n", line);
        }
    }

    if (cpu.halted) {
        printf("\nCPU halted.\n");
    }
    if (cpu.error) {
        printf("\nERROR: %s\n", cpu.error_msg);
    }

    cpu_dump_state(&cpu);

    int result = cpu.error ? 1 : 0;
    cpu_free(&cpu);
    return result;
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        print_usage(argv[0]);
        return 1;
    }

    /* Parse arguments */
    const char *cmd = NULL;
    const char *filename = NULL;
    int max_cycles = 10000000;  /* 10M default */
    uint32_t load_addr = seg_offset_to_phys(DEFAULT_CS, DEFAULT_PC);  /* 0x00100 */
    bool verbose = false;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "help") == 0 || strcmp(argv[i], "--help") == 0 ||
            strcmp(argv[i], "-h") == 0) {
            print_usage(argv[0]);
            return 0;
        }
        else if (strcmp(argv[i], "-v") == 0 || strcmp(argv[i], "--verbose") == 0) {
            verbose = true;
        }
        else if ((strcmp(argv[i], "-c") == 0 || strcmp(argv[i], "--cycles") == 0) &&
                 i + 1 < argc) {
            max_cycles = atoi(argv[++i]);
        }
        else if ((strcmp(argv[i], "-a") == 0 || strcmp(argv[i], "--addr") == 0) &&
                 i + 1 < argc) {
            load_addr = strtoul(argv[++i], NULL, 16);
        }
        else if (cmd == NULL) {
            cmd = argv[i];
        }
        else if (filename == NULL) {
            filename = argv[i];
        }
    }

    if (cmd == NULL) {
        printf("Error: No command specified\n\n");
        print_usage(argv[0]);
        return 1;
    }

    if (strcmp(cmd, "run") == 0) {
        if (filename == NULL) {
            printf("Error: Missing filename\n\n");
            print_usage(argv[0]);
            return 1;
        }
        return cmd_run(filename, max_cycles, load_addr, verbose);
    }
    else if (strcmp(cmd, "debug") == 0) {
        if (filename == NULL) {
            printf("Error: Missing filename\n\n");
            print_usage(argv[0]);
            return 1;
        }
        return cmd_debug(filename, load_addr);
    }
    else {
        printf("Unknown command: %s\n\n", cmd);
        print_usage(argv[0]);
        return 1;
    }
}
