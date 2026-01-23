/**
 * Micro4 CPU Emulator - Emscripten JavaScript Bindings
 *
 * PURPOSE:
 *   Provides JavaScript-callable wrapper functions for the Micro4 CPU emulator.
 *   Uses a global CPU instance for simplicity (Web Worker has single-threaded access).
 *
 * USAGE:
 *   This file is compiled alongside cpu.c by build.sh to produce micro4-cpu.wasm.
 *   Functions marked with EMSCRIPTEN_KEEPALIVE are exported to JavaScript.
 *
 * PATTERN:
 *   Mirrors the assembler-bindings.c pattern from Story 3.1.
 *   Global instance avoids complex memory management in JavaScript.
 */

#include <emscripten.h>
#include "cpu.h"
#include <stdlib.h>
#include <string.h>

/* Global CPU instance - single-threaded Web Worker makes this safe */
static Micro4CPU g_cpu;

/* ============================================================================
 * CPU Lifecycle Functions
 * ============================================================================ */

/**
 * Initialize the CPU to its default state.
 * Must be called before any other CPU operations.
 */
EMSCRIPTEN_KEEPALIVE
void cpu_init_instance(void) {
    cpu_init(&g_cpu);
}

/**
 * Reset the CPU state while preserving memory contents.
 * Useful for re-running a loaded program.
 */
EMSCRIPTEN_KEEPALIVE
void cpu_reset_instance(void) {
    cpu_reset(&g_cpu);
}

/**
 * Execute one instruction and return the number of cycles used.
 *
 * @return Number of cycles consumed (0 if halted or error)
 */
EMSCRIPTEN_KEEPALIVE
int cpu_step_instance(void) {
    return cpu_step(&g_cpu);
}

/**
 * Load a program into CPU memory.
 *
 * IMPORTANT: The 'program' pointer must point to memory allocated via _malloc
 * in JavaScript. The caller is responsible for freeing the memory.
 *
 * @param program   Pointer to program data (nibbles)
 * @param size      Number of nibbles to load (must be non-negative)
 * @param start_addr Starting address in CPU memory (0-255)
 */
EMSCRIPTEN_KEEPALIVE
void cpu_load_program_instance(const uint8_t* program, int size, uint8_t start_addr) {
    if (size < 0) return;  /* Silently ignore invalid size */
    cpu_load_program(&g_cpu, program, (uint16_t)size, start_addr);
}

/* ============================================================================
 * State Accessor Functions
 * ============================================================================ */

/**
 * Get the current Program Counter value.
 * @return 8-bit PC value (0-255)
 */
EMSCRIPTEN_KEEPALIVE
uint8_t get_pc(void) {
    return g_cpu.pc;
}

/**
 * Get the current Accumulator value.
 * @return 4-bit value (0-15), stored in low nibble
 */
EMSCRIPTEN_KEEPALIVE
uint8_t get_accumulator(void) {
    return g_cpu.a;
}

/**
 * Get the Zero flag status.
 * @return 1 if zero flag is set, 0 otherwise
 */
EMSCRIPTEN_KEEPALIVE
int get_zero_flag(void) {
    return g_cpu.z ? 1 : 0;
}

/**
 * Check if the CPU has halted (HLT instruction or error).
 * @return 1 if halted, 0 if still running
 */
EMSCRIPTEN_KEEPALIVE
int is_halted(void) {
    return g_cpu.halted ? 1 : 0;
}

/**
 * Check if the CPU has encountered an error.
 * @return 1 if error occurred, 0 otherwise
 */
EMSCRIPTEN_KEEPALIVE
int has_error(void) {
    return g_cpu.error ? 1 : 0;
}

/**
 * Get the error message string.
 *
 * IMPORTANT: The returned pointer is valid only until the next CPU operation
 * (init, reset, step, load_program). Copy the string immediately using
 * UTF8ToString() in JavaScript before calling any other CPU functions.
 *
 * @return Pointer to null-terminated error message string.
 *         Use UTF8ToString() in JavaScript to convert.
 *         Returns empty string if no error.
 */
EMSCRIPTEN_KEEPALIVE
const char* get_error_message(void) {
    return g_cpu.error_msg;
}

/**
 * Get a pointer to the CPU memory array.
 *
 * USAGE: In JavaScript, create a Uint8Array view over HEAPU8:
 *   new Uint8Array(Module.HEAPU8.buffer, Module._get_memory_ptr(), 256)
 *
 * @return Pointer to the 256-nibble memory array
 */
EMSCRIPTEN_KEEPALIVE
uint8_t* get_memory_ptr(void) {
    return g_cpu.memory;
}

/* ============================================================================
 * Internal Register Accessors (for debugging/visualization)
 * ============================================================================ */

/**
 * Get the Instruction Register value.
 * Contains the last fetched instruction byte.
 * @return 8-bit IR value
 */
EMSCRIPTEN_KEEPALIVE
uint8_t get_ir(void) {
    return g_cpu.ir;
}

/**
 * Get the Memory Address Register value.
 * Contains the last memory address accessed.
 * @return 8-bit MAR value
 */
EMSCRIPTEN_KEEPALIVE
uint8_t get_mar(void) {
    return g_cpu.mar;
}

/**
 * Get the Memory Data Register value.
 * Contains the last data read from/written to memory.
 * @return 4-bit MDR value
 */
EMSCRIPTEN_KEEPALIVE
uint8_t get_mdr(void) {
    return g_cpu.mdr;
}

/* ============================================================================
 * Statistics Accessors
 * ============================================================================ */

/**
 * Get the total number of CPU cycles executed.
 * @return 64-bit cycle count
 */
EMSCRIPTEN_KEEPALIVE
uint64_t get_cycles(void) {
    return g_cpu.cycles;
}

/**
 * Get the total number of instructions executed.
 * @return 64-bit instruction count
 */
EMSCRIPTEN_KEEPALIVE
uint64_t get_instructions(void) {
    return g_cpu.instructions;
}
