#!/bin/bash
# ============================================================================
# Digital Archaeology WASM Build Script
# ============================================================================
#
# PURPOSE:
#   Compiles CPU emulators and assemblers from C to WebAssembly
#   using Emscripten. The outputs can run in Web Workers in the browser.
#   Currently supports: Micro4 (assembler + CPU), Micro8 (assembler + CPU).
#
# PREREQUISITES:
#   1. Emscripten SDK (emsdk) must be installed and activated:
#
#      # One-time setup:
#      git clone https://github.com/emscripten-core/emsdk.git
#      cd emsdk
#      ./emsdk install latest
#      ./emsdk activate latest
#
#      # Before each session (or add to .bashrc/.zshrc):
#      source /path/to/emsdk/emsdk_env.sh
#
#   2. Verify emcc is available:
#      emcc --version
#
# USAGE:
#   cd digital-archaeology-web/wasm-build
#   ./build.sh
#
# OUTPUT:
#   ../public/wasm/micro4-asm.js   - Micro4 assembler glue code (ES6 module)
#   ../public/wasm/micro4-asm.wasm - Micro4 assembler WebAssembly binary
#   ../public/wasm/micro4-cpu.js   - Micro4 CPU emulator glue code (ES6 module)
#   ../public/wasm/micro4-cpu.wasm - Micro4 CPU emulator WebAssembly binary
#   ../public/wasm/micro8-asm.js   - Micro8 assembler glue code (ES6 module)
#   ../public/wasm/micro8-asm.wasm - Micro8 assembler WebAssembly binary
#   ../public/wasm/micro8-cpu.js   - Micro8 CPU emulator glue code (ES6 module)
#   ../public/wasm/micro8-cpu.wasm - Micro8 CPU emulator WebAssembly binary
#
# CONFIGURATION:
#   Build settings are in emscripten-config.json (optional, for reference).
#   Actual flags are documented inline below for maintainability.
#
# ============================================================================

set -e  # Exit on any error

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Source paths (relative to project root's parent - the cpu_ideas repo)
MICRO4_SRC="$(dirname "$PROJECT_ROOT")/src/micro4"
MICRO8_SRC="$(dirname "$PROJECT_ROOT")/src/micro8"

# Output path
OUTPUT_DIR="$PROJECT_ROOT/public/wasm"

# ---------------------------------------------------------------------------
# Prerequisite Checks
# ---------------------------------------------------------------------------

echo "=========================================="
echo "Digital Archaeology WASM Build"
echo "=========================================="
echo ""

# Check for emcc
if ! command -v emcc &> /dev/null; then
    echo "ERROR: emcc (Emscripten compiler) not found!"
    echo ""
    echo "Please install and activate the Emscripten SDK:"
    echo "  git clone https://github.com/emscripten-core/emsdk.git"
    echo "  cd emsdk"
    echo "  ./emsdk install latest"
    echo "  ./emsdk activate latest"
    echo "  source ./emsdk_env.sh"
    echo ""
    exit 1
fi

# Check for source files
if [ ! -f "$MICRO4_SRC/assembler.c" ]; then
    echo "ERROR: Micro4 assembler source not found at: $MICRO4_SRC/assembler.c"
    echo "Expected project structure:"
    echo "  cpu_ideas/"
    echo "    ├── src/micro4/assembler.c"
    echo "    └── digital-archaeology-web/"
    echo "            └── wasm-build/build.sh (this script)"
    exit 1
fi

# Check for bindings files
if [ ! -f "$SCRIPT_DIR/assembler-bindings.c" ]; then
    echo "ERROR: Emscripten bindings not found at: $SCRIPT_DIR/assembler-bindings.c"
    echo "Please create the assembler-bindings.c file with JavaScript-callable wrappers."
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/cpu-bindings.c" ]; then
    echo "ERROR: CPU bindings not found at: $SCRIPT_DIR/cpu-bindings.c"
    echo "Please create the cpu-bindings.c file with JavaScript-callable wrappers."
    exit 1
fi

# Check for CPU source file
if [ ! -f "$MICRO4_SRC/cpu.c" ]; then
    echo "ERROR: Micro4 CPU source not found at: $MICRO4_SRC/cpu.c"
    exit 1
fi

# Check for Micro8 source files
if [ ! -f "$MICRO8_SRC/cpu.c" ]; then
    echo "ERROR: Micro8 CPU source not found at: $MICRO8_SRC/cpu.c"
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/micro8-cpu-bindings.c" ]; then
    echo "ERROR: Micro8 CPU bindings not found at: $SCRIPT_DIR/micro8-cpu-bindings.c"
    echo "Please create the micro8-cpu-bindings.c file with JavaScript-callable wrappers."
    exit 1
fi

# Check for Micro8 assembler source and bindings
if [ ! -f "$MICRO8_SRC/assembler.c" ]; then
    echo "ERROR: Micro8 assembler source not found at: $MICRO8_SRC/assembler.c"
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/micro8-assembler-bindings.c" ]; then
    echo "ERROR: Micro8 assembler bindings not found at: $SCRIPT_DIR/micro8-assembler-bindings.c"
    echo "Please create the micro8-assembler-bindings.c file with JavaScript-callable wrappers."
    exit 1
fi

# ---------------------------------------------------------------------------
# Ensure output directory exists
# ---------------------------------------------------------------------------

mkdir -p "$OUTPUT_DIR"

# ---------------------------------------------------------------------------
# Compile with Emscripten
# ---------------------------------------------------------------------------

echo "Source directories:"
echo "  Micro4: $MICRO4_SRC"
echo "  Micro8: $MICRO8_SRC"
echo "Output directory: $OUTPUT_DIR"
echo "Emscripten version: $(emcc --version | head -1)"
echo ""
echo "Compiling..."

# Emscripten flags explained:
#
# -O2                     Optimization level 2 (good balance of size/speed)
# -s MODULARIZE=1         Wrap in factory function for clean ES6 import
# -s EXPORT_ES6=1         Output ES6 module syntax
# -s ENVIRONMENT='worker' Target Web Worker environment (no DOM access)
# -s EXPORTED_FUNCTIONS   C functions to expose to JavaScript
# -s EXPORTED_RUNTIME_METHODS   Emscripten helpers for JS interop
# -s ALLOW_MEMORY_GROWTH=1      Allow dynamic memory allocation
# -s INITIAL_MEMORY=1MB   Starting memory (grows as needed)
# -s STACK_SIZE=64KB      Stack size for C code
# -I                      Include path for headers

emcc \
  -O2 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s ENVIRONMENT='worker' \
  -s EXPORTED_FUNCTIONS='["_assemble_source","_get_output","_get_output_size","_get_error","_get_error_line","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","UTF8ToString","stringToUTF8","lengthBytesUTF8","HEAPU8"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s INITIAL_MEMORY=1048576 \
  -s STACK_SIZE=65536 \
  -I"$MICRO4_SRC" \
  "$MICRO4_SRC/assembler.c" \
  "$SCRIPT_DIR/assembler-bindings.c" \
  -o "$OUTPUT_DIR/micro4-asm.js"

# ---------------------------------------------------------------------------
# Compile CPU Emulator
# ---------------------------------------------------------------------------

echo ""
echo "Compiling CPU emulator..."

# CPU emulator compilation
# Same flags as assembler, but different source files and exported functions

emcc \
  -O2 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s ENVIRONMENT='worker' \
  -s EXPORTED_FUNCTIONS='["_cpu_init_instance","_cpu_reset_instance","_cpu_step_instance","_cpu_load_program_instance","_get_pc","_get_accumulator","_get_zero_flag","_is_halted","_has_error","_get_error_message","_get_memory_ptr","_get_ir","_get_mar","_get_mdr","_get_cycles","_get_instructions","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","UTF8ToString","HEAPU8"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s INITIAL_MEMORY=1048576 \
  -s STACK_SIZE=65536 \
  -I"$MICRO4_SRC" \
  "$MICRO4_SRC/cpu.c" \
  "$SCRIPT_DIR/cpu-bindings.c" \
  -o "$OUTPUT_DIR/micro4-cpu.js"

# ---------------------------------------------------------------------------
# Compile Micro8 CPU Emulator
# ---------------------------------------------------------------------------

echo ""
echo "Compiling Micro8 CPU emulator..."

# Micro8 CPU emulator compilation
# Same flags as Micro4, adapted for Micro8's larger state (8 regs, 64KB memory)

emcc \
  -O2 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s ENVIRONMENT='worker' \
  -s EXPORTED_FUNCTIONS='["_cpu_init_instance","_cpu_reset_instance","_cpu_step_instance","_cpu_load_program_instance","_get_reg","_get_sp","_get_pc","_get_flags","_get_zero_flag","_get_carry_flag","_get_sign_flag","_get_overflow_flag","_is_halted","_has_error","_get_error_message","_get_memory_ptr","_get_ir","_get_mar","_get_mdr","_get_cycles","_get_instructions","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","UTF8ToString","HEAPU8"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s INITIAL_MEMORY=1048576 \
  -s STACK_SIZE=65536 \
  -I"$MICRO8_SRC" \
  "$MICRO8_SRC/cpu.c" \
  "$SCRIPT_DIR/micro8-cpu-bindings.c" \
  -o "$OUTPUT_DIR/micro8-cpu.js"

# ---------------------------------------------------------------------------
# Compile Micro8 Assembler
# ---------------------------------------------------------------------------

echo ""
echo "Compiling Micro8 assembler..."

# Micro8 assembler compilation
# Same flags as Micro4 assembler, with Micro8 source paths and output filename.
# The exported functions are identical — the assembler API is the same for all stages.

emcc \
  -O2 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s ENVIRONMENT='worker' \
  -s EXPORTED_FUNCTIONS='["_assemble_source","_get_output","_get_output_size","_get_error","_get_error_line","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","UTF8ToString","stringToUTF8","lengthBytesUTF8","HEAPU8"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s INITIAL_MEMORY=1048576 \
  -s STACK_SIZE=65536 \
  -I"$MICRO8_SRC" \
  "$MICRO8_SRC/assembler.c" \
  "$SCRIPT_DIR/micro8-assembler-bindings.c" \
  -o "$OUTPUT_DIR/micro8-asm.js"

# ---------------------------------------------------------------------------
# Verify Output
# ---------------------------------------------------------------------------

echo ""
echo "Build complete!"
echo ""

# Check assembler output files exist
if [ ! -f "$OUTPUT_DIR/micro4-asm.js" ]; then
    echo "ERROR: Expected output file not found: $OUTPUT_DIR/micro4-asm.js"
    exit 1
fi

if [ ! -f "$OUTPUT_DIR/micro4-asm.wasm" ]; then
    echo "ERROR: Expected output file not found: $OUTPUT_DIR/micro4-asm.wasm"
    exit 1
fi

# Check CPU output files exist
if [ ! -f "$OUTPUT_DIR/micro4-cpu.js" ]; then
    echo "ERROR: Expected output file not found: $OUTPUT_DIR/micro4-cpu.js"
    exit 1
fi

if [ ! -f "$OUTPUT_DIR/micro4-cpu.wasm" ]; then
    echo "ERROR: Expected output file not found: $OUTPUT_DIR/micro4-cpu.wasm"
    exit 1
fi

# Check Micro8 CPU output files exist
if [ ! -f "$OUTPUT_DIR/micro8-cpu.js" ]; then
    echo "ERROR: Expected output file not found: $OUTPUT_DIR/micro8-cpu.js"
    exit 1
fi

if [ ! -f "$OUTPUT_DIR/micro8-cpu.wasm" ]; then
    echo "ERROR: Expected output file not found: $OUTPUT_DIR/micro8-cpu.wasm"
    exit 1
fi

# Check Micro8 assembler output files exist
if [ ! -f "$OUTPUT_DIR/micro8-asm.js" ]; then
    echo "ERROR: Expected output file not found: $OUTPUT_DIR/micro8-asm.js"
    exit 1
fi

if [ ! -f "$OUTPUT_DIR/micro8-asm.wasm" ]; then
    echo "ERROR: Expected output file not found: $OUTPUT_DIR/micro8-asm.wasm"
    exit 1
fi

# Report file sizes
ASM_JS_SIZE=$(ls -lh "$OUTPUT_DIR/micro4-asm.js" | awk '{print $5}')
ASM_WASM_SIZE=$(ls -lh "$OUTPUT_DIR/micro4-asm.wasm" | awk '{print $5}')
M4_CPU_JS_SIZE=$(ls -lh "$OUTPUT_DIR/micro4-cpu.js" | awk '{print $5}')
M4_CPU_WASM_SIZE=$(ls -lh "$OUTPUT_DIR/micro4-cpu.wasm" | awk '{print $5}')
M8_CPU_JS_SIZE=$(ls -lh "$OUTPUT_DIR/micro8-cpu.js" | awk '{print $5}')
M8_CPU_WASM_SIZE=$(ls -lh "$OUTPUT_DIR/micro8-cpu.wasm" | awk '{print $5}')
M8_ASM_JS_SIZE=$(ls -lh "$OUTPUT_DIR/micro8-asm.js" | awk '{print $5}')
M8_ASM_WASM_SIZE=$(ls -lh "$OUTPUT_DIR/micro8-asm.wasm" | awk '{print $5}')

echo "Output files:"
echo "  Micro4 Assembler:"
echo "    $OUTPUT_DIR/micro4-asm.js   ($ASM_JS_SIZE)"
echo "    $OUTPUT_DIR/micro4-asm.wasm ($ASM_WASM_SIZE)"
echo "  Micro4 CPU Emulator:"
echo "    $OUTPUT_DIR/micro4-cpu.js   ($M4_CPU_JS_SIZE)"
echo "    $OUTPUT_DIR/micro4-cpu.wasm ($M4_CPU_WASM_SIZE)"
echo "  Micro8 Assembler:"
echo "    $OUTPUT_DIR/micro8-asm.js   ($M8_ASM_JS_SIZE)"
echo "    $OUTPUT_DIR/micro8-asm.wasm ($M8_ASM_WASM_SIZE)"
echo "  Micro8 CPU Emulator:"
echo "    $OUTPUT_DIR/micro8-cpu.js   ($M8_CPU_JS_SIZE)"
echo "    $OUTPUT_DIR/micro8-cpu.wasm ($M8_CPU_WASM_SIZE)"
echo ""

# Size sanity checks
ASM_WASM_BYTES=$(stat -c%s "$OUTPUT_DIR/micro4-asm.wasm" 2>/dev/null || stat -f%z "$OUTPUT_DIR/micro4-asm.wasm")
M4_CPU_WASM_BYTES=$(stat -c%s "$OUTPUT_DIR/micro4-cpu.wasm" 2>/dev/null || stat -f%z "$OUTPUT_DIR/micro4-cpu.wasm")
M8_CPU_WASM_BYTES=$(stat -c%s "$OUTPUT_DIR/micro8-cpu.wasm" 2>/dev/null || stat -f%z "$OUTPUT_DIR/micro8-cpu.wasm")
M8_ASM_WASM_BYTES=$(stat -c%s "$OUTPUT_DIR/micro8-asm.wasm" 2>/dev/null || stat -f%z "$OUTPUT_DIR/micro8-asm.wasm")

if [ "$ASM_WASM_BYTES" -gt 102400 ]; then
    echo "WARNING: Micro4 assembler WASM file is larger than expected (>100KB)."
fi

if [ "$M4_CPU_WASM_BYTES" -gt 51200 ]; then
    echo "WARNING: Micro4 CPU WASM file is larger than expected (>50KB)."
fi

if [ "$M8_CPU_WASM_BYTES" -gt 204800 ]; then
    echo "WARNING: Micro8 CPU WASM file is larger than expected (>200KB)."
fi

if [ "$M8_ASM_WASM_BYTES" -gt 204800 ]; then
    echo "WARNING: Micro8 assembler WASM file is larger than expected (>200KB)."
fi

echo "=========================================="
echo "Build successful!"
echo "=========================================="
