/**
 * Micro4 Assembler - Emscripten JavaScript Bindings
 *
 * This file provides the JavaScript-callable wrapper functions for the
 * Micro4 assembler. It exposes a minimal API for:
 *   - Assembling source code
 *   - Retrieving binary output
 *   - Getting error information
 *
 * These functions are marked with EMSCRIPTEN_KEEPALIVE to ensure they
 * survive dead code elimination and are exported in the WASM module.
 *
 * Usage from JavaScript (in Web Worker):
 *   const Module = await createModule();
 *   const assemble = Module.cwrap('assemble_source', 'number', ['string']);
 *   const success = assemble(sourceCode);
 *   if (success) {
 *     const outputPtr = Module._get_output();
 *     const outputSize = Module._get_output_size();
 *     const binary = Module.HEAPU8.slice(outputPtr, outputPtr + outputSize);
 *   } else {
 *     const errorMsg = Module.UTF8ToString(Module._get_error());
 *     const errorLine = Module._get_error_line();
 *   }
 */

#include <emscripten.h>
#include "assembler.h"
#include <stdlib.h>
#include <string.h>

/* Global assembler instance
 * Using a global simplifies memory management from JavaScript.
 * The assembler is stateless between calls (re-initialized each time).
 */
static Assembler g_assembler;

/**
 * Assemble source code string.
 *
 * @param source The assembly source code (null-terminated string)
 * @return 1 on success, 0 on failure
 *
 * After calling:
 * - On success: call get_output() and get_output_size() for binary
 * - On failure: call get_error() and get_error_line() for error info
 */
EMSCRIPTEN_KEEPALIVE
int assemble_source(const char* source) {
    /* Initialize assembler state (clears previous results) */
    asm_init(&g_assembler);

    /* Perform assembly */
    bool success = asm_assemble(&g_assembler, source);

    return success ? 1 : 0;
}

/**
 * Get pointer to binary output.
 *
 * @return Pointer to uint8_t array containing assembled nibbles
 *
 * Use with get_output_size() to determine array length.
 * The pointer is valid until the next call to assemble_source().
 *
 * JavaScript usage:
 *   const ptr = Module._get_output();
 *   const size = Module._get_output_size();
 *   const binary = Module.HEAPU8.slice(ptr, ptr + size);
 */
EMSCRIPTEN_KEEPALIVE
const uint8_t* get_output(void) {
    return asm_get_output(&g_assembler);
}

/**
 * Get size of binary output in bytes (nibbles).
 *
 * @return Number of bytes in the output array
 *
 * For Micro4, each byte represents one 4-bit nibble.
 * The output covers addresses from origin to max_addr.
 */
EMSCRIPTEN_KEEPALIVE
int get_output_size(void) {
    return asm_get_output_size(&g_assembler);
}

/**
 * Get error message string.
 *
 * @return Pointer to null-terminated error message string
 *
 * Returns empty string if no error occurred.
 * The pointer is valid until the next call to assemble_source().
 *
 * JavaScript usage:
 *   const errorMsg = Module.UTF8ToString(Module._get_error());
 */
EMSCRIPTEN_KEEPALIVE
const char* get_error(void) {
    return asm_get_error(&g_assembler);
}

/**
 * Get line number where error occurred.
 *
 * @return Line number (1-based), or 0 if no error
 *
 * Useful for highlighting the error location in the editor.
 */
EMSCRIPTEN_KEEPALIVE
int get_error_line(void) {
    return asm_get_error_line(&g_assembler);
}
