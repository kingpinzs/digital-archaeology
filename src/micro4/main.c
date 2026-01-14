/*
 * Micro4 Emulator and Assembler CLI
 *
 * Usage:
 *   micro4 run <file.asm>     - Assemble and run
 *   micro4 asm <file.asm>     - Assemble and show output
 *   micro4 debug <file.asm>   - Assemble and debug interactively
 *   micro4 help               - Show help
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cpu.h"
#include "assembler.h"

/* Print usage */
static void print_usage(const char *prog) {
    printf("Micro4 CPU Emulator v1.0\n");
    printf("========================\n\n");
    printf("Usage:\n");
    printf("  %s run <file.asm>     Assemble and run program\n", prog);
    printf("  %s asm <file.asm>     Assemble and show machine code\n", prog);
    printf("  %s debug <file.asm>   Assemble and run in debug mode\n", prog);
    printf("  %s help               Show this help\n", prog);
    printf("\n");
    printf("Debug mode commands:\n");
    printf("  s, step      Execute one instruction\n");
    printf("  r, run       Run until halt\n");
    printf("  c, continue  Same as run\n");
    printf("  d, dump      Dump CPU state\n");
    printf("  m, memory    Dump memory\n");
    printf("  q, quit      Exit debugger\n");
    printf("\n");
    printf("Assembly syntax:\n");
    printf("  HLT          Halt execution\n");
    printf("  LDA addr     Load A from memory\n");
    printf("  STA addr     Store A to memory\n");
    printf("  ADD addr     A = A + mem[addr]\n");
    printf("  SUB addr     A = A - mem[addr]\n");
    printf("  JMP addr     Jump to address\n");
    printf("  JZ  addr     Jump if zero flag set\n");
    printf("  LDI n        Load immediate (0-15)\n");
    printf("\n");
    printf("Directives:\n");
    printf("  ORG addr     Set origin address\n");
    printf("  DB  n,...    Define byte(s)\n");
    printf("  label:       Define label\n");
    printf("  ; comment    Comment\n");
}

/* Assemble file and load into CPU */
static bool assemble_and_load(const char *filename, Assembler *as, Micro4CPU *cpu) {
    printf("Assembling %s...\n", filename);

    if (!asm_assemble_file(as, filename)) {
        printf("Assembly error at line %d: %s\n",
               asm_get_error_line(as), asm_get_error(as));
        return false;
    }

    printf("Assembly successful: %d nibbles generated\n", asm_get_output_size(as));

    /* Load into CPU */
    cpu_init(cpu);
    memcpy(cpu->memory, asm_get_output(as), asm_get_output_size(as));

    return true;
}

/* Run mode */
static int cmd_run(const char *filename) {
    Assembler as;
    Micro4CPU cpu;

    if (!assemble_and_load(filename, &as, &cpu)) {
        return 1;
    }

    printf("\nRunning...\n");
    printf("----------------------------------------\n");

    int cycles = cpu_run(&cpu, 10000);  /* Max 10000 cycles to prevent infinite loops */

    printf("----------------------------------------\n");
    printf("Execution complete.\n\n");
    cpu_dump_state(&cpu);

    printf("\nMemory at 0x20-0x2F (typical data area):\n");
    cpu_dump_memory(&cpu, 0x20, 0x2F);

    return cpu.error ? 1 : 0;
}

/* Assemble mode */
static int cmd_asm(const char *filename) {
    Assembler as;

    printf("Assembling %s...\n", filename);

    if (!asm_assemble_file(&as, filename)) {
        printf("Assembly error at line %d: %s\n",
               asm_get_error_line(&as), asm_get_error(&as));
        return 1;
    }

    printf("Assembly successful!\n\n");

    asm_dump_labels(&as);
    printf("\n");
    asm_dump_output(&as);

    /* Also show disassembly */
    printf("\n=== Disassembly ===\n");
    const uint8_t *out = asm_get_output(&as);
    int size = asm_get_output_size(&as);
    int addr = 0;

    while (addr < size - 1) {
        uint8_t opcode = (out[addr] << 4) | out[addr + 1];
        uint8_t op = (opcode >> 4) & 0x0F;

        if (op == OP_HLT || op == OP_LDI) {
            /* 1-byte instruction */
            printf("0x%02X: %02X       %s\n", addr, opcode,
                   cpu_disassemble(opcode, 0));
            addr += 2;
        } else if (op >= OP_LDA && op <= OP_JZ) {
            /* 2-byte instruction */
            if (addr + 3 < size) {
                uint8_t operand = (out[addr + 2] << 4) | out[addr + 3];
                printf("0x%02X: %02X %02X    %s\n", addr, opcode, operand,
                       cpu_disassemble(opcode, operand));
                addr += 4;
            } else {
                printf("0x%02X: %02X       (incomplete)\n", addr, opcode);
                addr += 2;
            }
        } else {
            /* Data or unknown */
            printf("0x%02X: %02X       DB 0x%02X\n", addr, opcode, opcode);
            addr += 2;
        }
    }

    return 0;
}

/* Debug mode */
static int cmd_debug(const char *filename) {
    Assembler as;
    Micro4CPU cpu;

    if (!assemble_and_load(filename, &as, &cpu)) {
        return 1;
    }

    printf("\nDebug mode. Type 'help' for commands.\n");
    printf("----------------------------------------\n");

    char line[256];
    bool running = true;

    while (running && !cpu.halted) {
        /* Show current instruction */
        uint8_t opcode = (cpu.memory[cpu.pc] << 4) | cpu.memory[cpu.pc + 1];
        uint8_t operand = 0;
        uint8_t op = (opcode >> 4) & 0x0F;

        if (op >= OP_LDA && op <= OP_JZ && cpu.pc + 3 < MEM_SIZE) {
            operand = (cpu.memory[cpu.pc + 2] << 4) | cpu.memory[cpu.pc + 3];
        }

        printf("\n[PC=0x%02X A=%X Z=%d] %s\n",
               cpu.pc, cpu.a, cpu.z, cpu_disassemble(opcode, operand));
        printf("debug> ");

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
            cpu_run(&cpu, 10000);
            printf("Stopped.\n");
        } else if (strcmp(line, "d") == 0 || strcmp(line, "dump") == 0) {
            cpu_dump_state(&cpu);
        } else if (strcmp(line, "m") == 0 || strcmp(line, "memory") == 0) {
            cpu_dump_memory(&cpu, 0x00, 0x3F);
        } else if (strcmp(line, "q") == 0 || strcmp(line, "quit") == 0) {
            running = false;
        } else if (strcmp(line, "help") == 0 || strcmp(line, "h") == 0) {
            printf("Commands:\n");
            printf("  s, step      Execute one instruction\n");
            printf("  r, run       Run until halt\n");
            printf("  d, dump      Dump CPU state\n");
            printf("  m, memory    Dump memory (0x00-0x3F)\n");
            printf("  q, quit      Exit debugger\n");
        } else if (line[0] != '\0') {
            printf("Unknown command: %s\n", line);
        }
    }

    if (cpu.halted) {
        printf("\nCPU halted.\n");
        cpu_dump_state(&cpu);
    }

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
    } else if (strcmp(cmd, "asm") == 0) {
        return cmd_asm(filename);
    } else if (strcmp(cmd, "debug") == 0) {
        return cmd_debug(filename);
    } else {
        printf("Unknown command: %s\n\n", cmd);
        print_usage(argv[0]);
        return 1;
    }
}
