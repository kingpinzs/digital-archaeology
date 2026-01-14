/*
 * Micro8 Interactive Debugger/Monitor
 *
 * Provides an interactive debugging interface for the Micro8 CPU
 * with breakpoints, single-stepping, memory inspection, stack viewing,
 * and disassembly.
 */

#ifndef MICRO8_DEBUGGER_H
#define MICRO8_DEBUGGER_H

#include "cpu.h"
#include <stdbool.h>

/* Maximum number of breakpoints */
#define MAX_BREAKPOINTS 32

/* Debugger state */
typedef struct {
    Micro8CPU *cpu;                         /* Pointer to CPU being debugged */
    uint16_t breakpoints[MAX_BREAKPOINTS];  /* Breakpoint addresses (16-bit) */
    bool bp_active[MAX_BREAKPOINTS];        /* Whether each breakpoint is active */
    int bp_count;                           /* Number of active breakpoints */
    bool running;                           /* Debugger is running (not quit) */
} Micro8Debugger;

/* Initialize debugger with a CPU instance */
void dbg_init(Micro8Debugger *dbg, Micro8CPU *cpu);

/* Run the interactive debugger loop */
void dbg_run(Micro8Debugger *dbg);

/* Breakpoint management */
bool dbg_set_breakpoint(Micro8Debugger *dbg, uint16_t addr);
bool dbg_clear_breakpoint(Micro8Debugger *dbg, uint16_t addr);
bool dbg_has_breakpoint(Micro8Debugger *dbg, uint16_t addr);
void dbg_list_breakpoints(Micro8Debugger *dbg);

/* Execution control */
int dbg_step(Micro8Debugger *dbg);                      /* Execute one instruction */
int dbg_run_until_break(Micro8Debugger *dbg, int max_cycles); /* Run until halt/breakpoint */

/* Display functions */
void dbg_show_regs(Micro8Debugger *dbg);
void dbg_show_memory(Micro8Debugger *dbg, uint16_t start, uint16_t end);
void dbg_show_stack(Micro8Debugger *dbg, int count);
void dbg_show_current_instruction(Micro8Debugger *dbg);
void dbg_show_help(void);

/* File operations */
bool dbg_load_binary(Micro8Debugger *dbg, const char *filename, uint16_t addr);

#endif /* MICRO8_DEBUGGER_H */
