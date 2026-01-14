/*
 * Micro4 Interactive Debugger/Monitor
 *
 * Provides an interactive debugging interface for the Micro4 CPU
 * with breakpoints, single-stepping, memory inspection, and more.
 */

#ifndef MICRO4_DEBUGGER_H
#define MICRO4_DEBUGGER_H

#include "cpu.h"
#include <stdbool.h>

/* Maximum number of breakpoints */
#define MAX_BREAKPOINTS 16

/* Debugger state */
typedef struct {
    Micro4CPU *cpu;                     /* Pointer to CPU being debugged */
    uint8_t breakpoints[MAX_BREAKPOINTS]; /* Breakpoint addresses */
    bool bp_active[MAX_BREAKPOINTS];    /* Whether each breakpoint is active */
    int bp_count;                       /* Number of active breakpoints */
    bool running;                       /* Debugger is running (not quit) */
} Debugger;

/* Initialize debugger with a CPU instance */
void dbg_init(Debugger *dbg, Micro4CPU *cpu);

/* Run the interactive debugger loop */
void dbg_run(Debugger *dbg);

/* Breakpoint management */
bool dbg_set_breakpoint(Debugger *dbg, uint8_t addr);
bool dbg_clear_breakpoint(Debugger *dbg, uint8_t addr);
bool dbg_has_breakpoint(Debugger *dbg, uint8_t addr);
void dbg_list_breakpoints(Debugger *dbg);

/* Execution control */
int dbg_step(Debugger *dbg);                    /* Execute one instruction */
int dbg_run_until_break(Debugger *dbg, int max_cycles); /* Run until halt/breakpoint */

/* Display functions */
void dbg_show_regs(Debugger *dbg);
void dbg_show_memory(Debugger *dbg, uint8_t start, uint8_t end);
void dbg_show_current_instruction(Debugger *dbg);
void dbg_show_help(void);

/* File operations */
bool dbg_load_file(Debugger *dbg, const char *filename);

#endif /* MICRO4_DEBUGGER_H */
