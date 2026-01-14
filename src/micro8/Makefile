# Micro8 CPU Emulator & Tools Makefile

CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -g -O2
LDFLAGS =

# Main emulator (uses debugger as library)
TARGET = micro8

# Additional tools
ASSEMBLER = micro8-asm
DISASM = micro8-disasm
DEBUGGER = micro8-dbg

# Source files for main emulator (debugger as library)
MAIN_SRCS = main.c cpu.c debugger.c
MAIN_OBJS = main.o cpu.o debugger_lib.o

# Default target - build all tools
all: $(TARGET) $(ASSEMBLER) $(DISASM) $(DEBUGGER)

# Main emulator (with integrated debugger)
$(TARGET): $(MAIN_OBJS)
	$(CC) $(LDFLAGS) -o $@ $^

# Compile with debugger as library
debugger_lib.o: debugger.c debugger.h cpu.h
	$(CC) $(CFLAGS) -DDEBUGGER_AS_LIBRARY -c -o $@ $<

main.o: main.c cpu.h debugger.h
	$(CC) $(CFLAGS) -c -o $@ $<

cpu.o: cpu.c cpu.h
	$(CC) $(CFLAGS) -c -o $@ $<

# Assembler (CLI wrapper + library)
$(ASSEMBLER): asm_main.o assembler.o
	$(CC) $(LDFLAGS) -o $@ $^

asm_main.o: asm_main.c assembler.h
	$(CC) $(CFLAGS) -c -o $@ $<

assembler.o: assembler.c assembler.h
	$(CC) $(CFLAGS) -c -o $@ $<

# Disassembler (standalone - has own main)
$(DISASM): disasm.c cpu.h
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $<

# Standalone debugger (has own main)
$(DEBUGGER): debugger.c cpu.o cpu.h
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ debugger.c cpu.o

# Clean
clean:
	rm -f *.o $(TARGET) $(ASSEMBLER) $(DISASM) $(DEBUGGER)

# Install to parent bin directory
install: all
	mkdir -p ../../bin
	cp $(TARGET) $(ASSEMBLER) $(DISASM) $(DEBUGGER) ../../bin/

# Run sanity test
test: $(TARGET) $(ASSEMBLER)
	@echo "=== Micro8 Test Suite ==="
	@echo ""
	@echo "1. Building basic_mov.asm..."
	./$(ASSEMBLER) ../../programs/micro8/basic_mov.asm -o /tmp/basic_mov.bin
	@echo ""
	@echo "2. Running program..."
	./$(TARGET) run /tmp/basic_mov.bin
	@echo ""
	@echo "Test complete."
	@rm -f /tmp/basic_mov.bin

# Test all programs
test-all: $(TARGET) $(ASSEMBLER)
	@echo "=== Building and Testing All Programs ==="
	@for f in ../../programs/micro8/*.asm; do \
		base=$$(basename $$f .asm); \
		echo "Building $$base..."; \
		./$(ASSEMBLER) $$f -o /tmp/$$base.bin || exit 1; \
		echo "Running $$base..."; \
		./$(TARGET) run /tmp/$$base.bin; \
		rm -f /tmp/$$base.bin; \
		echo ""; \
	done
	@echo "All tests complete."

# Disassemble a binary
disasm: $(DISASM)
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make disasm FILE=<binary>"; \
	else \
		./$(DISASM) $(FILE); \
	fi

# Debug a binary
debug: $(TARGET)
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make debug FILE=<binary>"; \
	else \
		./$(TARGET) debug $(FILE); \
	fi

# Help
help:
	@echo "Micro8 Makefile targets:"
	@echo "  make              Build all tools (emulator, assembler, disasm, debugger)"
	@echo "  make micro8       Build main emulator only"
	@echo "  make micro8-asm   Build assembler only"
	@echo "  make micro8-disasm Build disassembler only"
	@echo "  make micro8-dbg   Build standalone debugger only"
	@echo "  make clean        Remove build artifacts"
	@echo "  make install      Install all tools to bin directory"
	@echo "  make test         Run basic sanity test"
	@echo "  make test-all     Build and run all test programs"
	@echo "  make disasm FILE=x Disassemble a binary file"
	@echo "  make debug FILE=x  Debug a binary file"
	@echo "  make help         Show this help"

.PHONY: all clean install test test-all disasm debug help
