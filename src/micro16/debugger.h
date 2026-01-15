/*
 * Micro16 Interactive Debugger/Monitor
 *
 * Provides an interactive debugging interface for the Micro16 CPU
 * with breakpoints, watchpoints, single-stepping, memory inspection,
 * segment viewing, and disassembly.
 *
 * Key differences from Micro8 debugger:
 * - 20-bit physical addresses (segment:offset format)
 * - 4 segment registers (CS, DS, SS, ES)
 * - 8 x 16-bit general purpose registers
 * - Conditional breakpoints
 * - Register watchpoints
 */

#ifndef MICRO16_DEBUGGER_H
#define MICRO16_DEBUGGER_H

#include "cpu.h"
#include <stdbool.h>

/* Maximum breakpoints and watchpoints */
#define MAX_BREAKPOINTS 32
#define MAX_WATCHPOINTS 16

/* Condition operators for conditional breakpoints */
typedef enum {
    COND_NONE = 0,      /* No condition (always break) */
    COND_EQ,            /* == */
    COND_NE,            /* != */
    COND_LT,            /* < */
    COND_LE,            /* <= */
    COND_GT,            /* > */
    COND_GE             /* >= */
} ConditionOp;

/* Breakpoint structure with optional condition */
typedef struct {
    bool active;                /* Whether this breakpoint is enabled */
    uint16_t segment;           /* Segment of breakpoint address */
    uint16_t offset;            /* Offset of breakpoint address */
    bool has_condition;         /* Whether condition is set */
    int cond_register;          /* Register to check (-1 = none, 0-7 = R0-R7) */
    ConditionOp cond_op;        /* Comparison operator */
    uint16_t cond_value;        /* Value to compare against */
} Breakpoint;

/* Watchpoint structure (break when register changes) */
typedef struct {
    bool active;                /* Whether this watchpoint is enabled */
    int register_num;           /* Register to watch (0-7 for R0-R7, 8-11 for CS/DS/SS/ES) */
    uint16_t last_value;        /* Last known value (for change detection) */
} Watchpoint;

/* Debugger state */
typedef struct {
    Micro16CPU *cpu;                        /* Pointer to CPU being debugged */
    Breakpoint breakpoints[MAX_BREAKPOINTS]; /* Breakpoint list */
    int bp_count;                           /* Number of active breakpoints */
    Watchpoint watchpoints[MAX_WATCHPOINTS]; /* Watchpoint list */
    int wp_count;                           /* Number of active watchpoints */
    bool running;                           /* Debugger is running (not quit) */

    /* Previous register values for highlighting changes */
    uint16_t prev_r[8];                     /* Previous general registers */
    uint16_t prev_seg[4];                   /* Previous segment registers */
    uint16_t prev_sp;                       /* Previous stack pointer */
    uint16_t prev_pc;                       /* Previous program counter */
    uint16_t prev_flags;                    /* Previous flags */
} Micro16Debugger;

/* Initialize debugger with a CPU instance */
void dbg_init(Micro16Debugger *dbg, Micro16CPU *cpu);

/* Run the interactive debugger loop */
void dbg_run(Micro16Debugger *dbg);

/* Breakpoint management */
bool dbg_set_breakpoint(Micro16Debugger *dbg, uint16_t segment, uint16_t offset);
bool dbg_set_conditional_breakpoint(Micro16Debugger *dbg, uint16_t segment, uint16_t offset,
                                    int reg, ConditionOp op, uint16_t value);
bool dbg_clear_breakpoint(Micro16Debugger *dbg, int index);
bool dbg_has_breakpoint(Micro16Debugger *dbg, uint16_t segment, uint16_t offset);
int  dbg_check_breakpoint(Micro16Debugger *dbg);  /* Returns breakpoint index or -1 */
void dbg_list_breakpoints(Micro16Debugger *dbg);

/* Watchpoint management */
bool dbg_set_watchpoint(Micro16Debugger *dbg, int register_num);
bool dbg_clear_watchpoint(Micro16Debugger *dbg, int index);
int  dbg_check_watchpoints(Micro16Debugger *dbg);  /* Returns watchpoint index or -1 */
void dbg_list_watchpoints(Micro16Debugger *dbg);
void dbg_update_watchpoint_values(Micro16Debugger *dbg);

/* Execution control */
int dbg_step(Micro16Debugger *dbg);                       /* Execute one instruction */
int dbg_run_until_break(Micro16Debugger *dbg, int max_cycles); /* Run until halt/breakpoint/watchpoint */

/* Display functions */
void dbg_show_regs(Micro16Debugger *dbg);
void dbg_show_segs(Micro16Debugger *dbg);
void dbg_show_flags(Micro16Debugger *dbg);
void dbg_show_memory(Micro16Debugger *dbg, uint16_t segment, uint16_t offset, int count);
void dbg_show_stack(Micro16Debugger *dbg, int count);
void dbg_show_current_instruction(Micro16Debugger *dbg);
void dbg_disassemble_at(Micro16Debugger *dbg, uint16_t segment, uint16_t offset, int count);
void dbg_show_help(void);

/* File operations */
bool dbg_load_binary(Micro16Debugger *dbg, const char *filename, uint32_t phys_addr);

/* Utility: save previous register state for change detection */
void dbg_save_prev_state(Micro16Debugger *dbg);

#endif /* MICRO16_DEBUGGER_H */
