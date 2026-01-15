# Micro4 CPU Emulator Makefile

CC ?= gcc
CFLAGS = -Wall -Wextra -std=c99 -g -O2
LDFLAGS =

# Output binaries
TARGET = micro4
DISASM = disasm
DEBUGGER = micro4-dbg

# Source files for emulator
SRCS = main.c cpu.c assembler.c
OBJS = $(SRCS:.c=.o)

# Source files for disassembler (standalone)
DISASM_SRCS = disasm.c
DISASM_OBJS = $(DISASM_SRCS:.c=.o)

# Debugger source files
DBG_SRCS = debugger.c cpu.c assembler.c
DBG_OBJS = $(DBG_SRCS:.c=.o)

# Default target
all: $(TARGET) $(DISASM) $(DEBUGGER)

# Link emulator
$(TARGET): $(OBJS)
	$(CC) $(LDFLAGS) -o $@ $^

# Link disassembler
$(DISASM): $(DISASM_OBJS)
	$(CC) $(LDFLAGS) -o $@ $^

# Link debugger
$(DEBUGGER): debugger.o cpu.o assembler.o
	$(CC) $(LDFLAGS) -o $@ $^

# Compile
%.o: %.c
	$(CC) $(CFLAGS) -c -o $@ $<

# Dependencies
main.o: main.c cpu.h assembler.h
cpu.o: cpu.c cpu.h
assembler.o: assembler.c assembler.h cpu.h
disasm.o: disasm.c
debugger.o: debugger.c debugger.h cpu.h assembler.h

# Clean
clean:
	rm -f $(OBJS) $(DISASM_OBJS) debugger.o $(TARGET) $(DISASM) $(DEBUGGER)

# Install to parent bin directory
install: $(TARGET) $(DISASM) $(DEBUGGER)
	mkdir -p ../../bin
	cp $(TARGET) $(DISASM) $(DEBUGGER) ../../bin/

# Run tests
test: $(TARGET)
	@echo "Running test programs..."
	@echo ""
	@echo "=== Test 1: Add two numbers ==="
	./$(TARGET) run ../../programs/add.asm || true
	@echo ""
	@echo "=== Test 2: Count down ==="
	./$(TARGET) run ../../programs/countdown.asm || true
	@echo ""
	@echo "=== Test 3: Multiply ==="
	./$(TARGET) run ../../programs/multiply.asm || true

# Help
help:
	@echo "Micro4 Makefile targets:"
	@echo "  make          Build the emulator, disassembler, and debugger"
	@echo "  make micro4   Build only the emulator"
	@echo "  make disasm   Build only the disassembler"
	@echo "  make micro4-dbg  Build only the debugger"
	@echo "  make clean    Remove build artifacts"
	@echo "  make install  Install to bin directory"
	@echo "  make test     Run test programs"
	@echo "  make help     Show this help"

.PHONY: all clean install test help micro4 disasm micro4-dbg
