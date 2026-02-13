/**
 * Micro8 CPU Emulator - Emscripten JavaScript Bindings
 *
 * PURPOSE:
 *   Provides JavaScript-callable wrapper functions for the Micro8 CPU emulator.
 *   Uses a global CPU instance for simplicity (Web Worker has single-threaded access).
 *
 * USAGE:
 *   This file is compiled alongside cpu.c by build.sh to produce micro8-cpu.wasm.
 *   Functions marked with EMSCRIPTEN_KEEPALIVE are exported to JavaScript.
 *
 * PATTERN:
 *   Mirrors the cpu-bindings.c pattern from Micro4 (Story 4.1).
 *   Global instance avoids complex memory management in JavaScript.
 *
 * KEY DIFFERENCES FROM MICRO4:
 *   - Memory is dynamically allocated (cpu_init returns bool)
 *   - 8 general-purpose registers accessed by index
 *   - 16-bit PC and SP (vs 8-bit in Micro4)
 *   - 4 flags: Zero, Carry, Sign, Overflow (vs just Zero in Micro4)
 *   - 64KB address space (vs 256 bytes in Micro4)
 */

#include <emscripten.h>
#include "cpu.h"
#include <stdlib.h>
#include <string.h>

/* Global CPU instance - single-threaded Web Worker makes this safe */
static Micro8CPU g_cpu;
static bool g_initialized = false;

/* ============================================================================
 * CPU Lifecycle Functions
 * ============================================================================ */

/**
 * Initialize the CPU to its default state.
 * Allocates 64KB memory. Must be called before any other CPU operations.
 *
 * @return 1 on success, 0 on failure (memory allocation failed)
 */
EMSCRIPTEN_KEEPALIVE
int cpu_init_instance(void) {
    if (g_initialized) {
        cpu_free(&g_cpu);
    }
    g_initialized = cpu_init(&g_cpu);
    return g_initialized ? 1 : 0;
}

/**
 * Reset the CPU state while preserving memory contents.
 * Useful for re-running a loaded program.
 */
EMSCRIPTEN_KEEPALIVE
void cpu_reset_instance(void) {
    if (g_initialized) {
        cpu_reset(&g_cpu);
    }
}

/**
 * Execute one instruction and return the number of cycles used.
 *
 * @return Number of cycles consumed (0 if halted or error)
 */
EMSCRIPTEN_KEEPALIVE
int cpu_step_instance(void) {
    if (!g_initialized) return 0;
    return cpu_step(&g_cpu);
}

/**
 * Load a program into CPU memory.
 *
 * IMPORTANT: The 'program' pointer must point to memory allocated via _malloc
 * in JavaScript. The caller is responsible for freeing the memory.
 *
 * @param program    Pointer to program data (bytes)
 * @param size       Number of bytes to load (must be non-negative)
 * @param start_addr Starting address in CPU memory (16-bit, 0x0000-0xFFFF)
 */
EMSCRIPTEN_KEEPALIVE
void cpu_load_program_instance(const uint8_t* program, int size, uint16_t start_addr) {
    if (!g_initialized || size < 0 || size > MEM_SIZE) return;
    // Full-memory restore: direct memcpy avoids uint16_t overflow (65536 wraps to 0)
    if (size == MEM_SIZE && start_addr == 0) {
        memcpy(g_cpu.memory, program, MEM_SIZE);
    } else {
        cpu_load_program(&g_cpu, program, (uint16_t)size, start_addr);
    }
}

/* ============================================================================
 * Register Accessors
 * ============================================================================ */

/**
 * Get a general-purpose register value by index.
 *
 * @param index Register index (0-7 for R0-R7)
 * @return 8-bit register value, or 0 if index out of range
 */
EMSCRIPTEN_KEEPALIVE
uint8_t get_reg(int index) {
    if (!g_initialized || index < 0 || index > 7) return 0;
    return g_cpu.r[index];
}

/**
 * Get the Stack Pointer value.
 * @return 16-bit SP value (0x0000-0xFFFF)
 */
EMSCRIPTEN_KEEPALIVE
uint16_t get_sp(void) {
    if (!g_initialized) return 0;
    return g_cpu.sp;
}

/**
 * Get the current Program Counter value.
 * @return 16-bit PC value (0x0000-0xFFFF)
 */
EMSCRIPTEN_KEEPALIVE
uint16_t get_pc(void) {
    if (!g_initialized) return 0;
    return g_cpu.pc;
}

/* ============================================================================
 * Flag Accessors
 * ============================================================================ */

/**
 * Get the raw flags register value.
 * @return 8-bit flags (bits: 7=Sign, 6=Zero, 2=Overflow, 0=Carry)
 */
EMSCRIPTEN_KEEPALIVE
uint8_t get_flags(void) {
    if (!g_initialized) return 0;
    return g_cpu.flags;
}

/**
 * Get the Zero flag status.
 * @return 1 if zero flag is set, 0 otherwise
 */
EMSCRIPTEN_KEEPALIVE
int get_zero_flag(void) {
    if (!g_initialized) return 0;
    return (g_cpu.flags & FLAG_Z) ? 1 : 0;
}

/**
 * Get the Carry flag status.
 * @return 1 if carry flag is set, 0 otherwise
 */
EMSCRIPTEN_KEEPALIVE
int get_carry_flag(void) {
    if (!g_initialized) return 0;
    return (g_cpu.flags & FLAG_C) ? 1 : 0;
}

/**
 * Get the Sign flag status.
 * @return 1 if sign flag is set, 0 otherwise
 */
EMSCRIPTEN_KEEPALIVE
int get_sign_flag(void) {
    if (!g_initialized) return 0;
    return (g_cpu.flags & FLAG_S) ? 1 : 0;
}

/**
 * Get the Overflow flag status.
 * @return 1 if overflow flag is set, 0 otherwise
 */
EMSCRIPTEN_KEEPALIVE
int get_overflow_flag(void) {
    if (!g_initialized) return 0;
    return (g_cpu.flags & FLAG_O) ? 1 : 0;
}

/* ============================================================================
 * State Accessors
 * ============================================================================ */

/**
 * Check if the CPU has halted (HLT instruction or error).
 * @return 1 if halted, 0 if still running
 */
EMSCRIPTEN_KEEPALIVE
int is_halted(void) {
    if (!g_initialized) return 0;
    return g_cpu.halted ? 1 : 0;
}

/**
 * Check if the CPU has encountered an error.
 * @return 1 if error occurred, 0 otherwise
 */
EMSCRIPTEN_KEEPALIVE
int has_error(void) {
    if (!g_initialized) return 0;
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
    if (!g_initialized) return "";
    return g_cpu.error_msg;
}

/**
 * Get a pointer to the CPU memory array.
 *
 * USAGE: In JavaScript, create a Uint8Array view over HEAPU8:
 *   new Uint8Array(Module.HEAPU8.buffer, Module._get_memory_ptr(), 65536)
 *
 * IMPORTANT: Do NOT cache this view. With ALLOW_MEMORY_GROWTH=1, the
 * underlying ArrayBuffer can be replaced when WASM memory grows,
 * invalidating any previously created views.
 *
 * @return Pointer to the 64KB memory array, or NULL if not initialized
 */
EMSCRIPTEN_KEEPALIVE
uint8_t* get_memory_ptr(void) {
    if (!g_initialized) return NULL;
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
    if (!g_initialized) return 0;
    return g_cpu.ir;
}

/**
 * Get the Memory Address Register value.
 * Contains the last memory address accessed.
 * @return 16-bit MAR value
 */
EMSCRIPTEN_KEEPALIVE
uint16_t get_mar(void) {
    if (!g_initialized) return 0;
    return g_cpu.mar;
}

/**
 * Get the Memory Data Register value.
 * Contains the last data read from/written to memory.
 * @return 8-bit MDR value
 */
EMSCRIPTEN_KEEPALIVE
uint8_t get_mdr(void) {
    if (!g_initialized) return 0;
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
    if (!g_initialized) return 0;
    return g_cpu.cycles;
}

/**
 * Get the total number of instructions executed.
 * @return 64-bit instruction count
 */
EMSCRIPTEN_KEEPALIVE
uint64_t get_instructions(void) {
    if (!g_initialized) return 0;
    return g_cpu.instructions;
}
