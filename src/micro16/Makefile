# Micro16 CPU Emulator & Tools Makefile

CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -g -O2
LDFLAGS =

# Main emulator
TARGET = micro16

# Additional tools
ASSEMBLER = micro16-asm
DISASM = micro16-disasm
DEBUGGER = micro16-dbg

# Source files for main emulator
MAIN_SRCS = main.c cpu.c
MAIN_OBJS = main.o cpu.o

# Source files for assembler
ASM_SRCS = asm_main.c assembler.c
ASM_OBJS = asm_main.o assembler.o

# Default target - build all tools
all: $(TARGET) $(ASSEMBLER) $(DISASM)

# Main emulator
$(TARGET): $(MAIN_OBJS)
	$(CC) $(LDFLAGS) -o $@ $^

main.o: main.c cpu.h
	$(CC) $(CFLAGS) -c -o $@ $<

cpu.o: cpu.c cpu.h
	$(CC) $(CFLAGS) -c -o $@ $<

# Assembler
$(ASSEMBLER): $(ASM_OBJS)
	$(CC) $(LDFLAGS) -o $@ $^

asm_main.o: asm_main.c assembler.h cpu.h
	$(CC) $(CFLAGS) -c -o $@ $<

assembler.o: assembler.c assembler.h cpu.h
	$(CC) $(CFLAGS) -c -o $@ $<

# Disassembler (standalone, single file)
$(DISASM): disasm.c
	$(CC) $(CFLAGS) -o $@ $<

# Clean
clean:
	rm -f *.o $(TARGET) $(ASSEMBLER) $(DISASM) $(DEBUGGER)

# Install to parent bin directory
install: all
	mkdir -p ../../bin
	cp $(TARGET) ../../bin/

# Run sanity test with a simple program
# Opcodes: 0x11=MOV_RI (reg byte, imm16), 0x01=HLT
# MOV AX, 0x1234 = 0x11 0x00 0x34 0x12 (4 bytes)
# HLT = 0x01 (1 byte)
test: $(TARGET)
	@echo "=== Micro16 Build Test ==="
	@echo ""
	@echo "Creating simple test program..."
	@echo '11 00 34 12 01' | xxd -r -p > /tmp/micro16_test.bin
	@echo "Test binary: MOV AX, #0x1234; HLT"
	@echo ""
	@echo "Running program..."
	@./$(TARGET) run /tmp/micro16_test.bin
	@echo ""
	@echo "Verifying AX = 0x1234..."
	@./$(TARGET) run /tmp/micro16_test.bin 2>&1 | grep -q "AX=1234" && echo "PASS: AX correctly set to 0x1234" || echo "FAIL: AX not set correctly"
	@echo ""
	@echo "Test complete."
	@rm -f /tmp/micro16_test.bin

# Debug a binary
debug: $(TARGET)
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make debug FILE=<binary>"; \
	else \
		./$(TARGET) debug $(FILE); \
	fi

# Help
help:
	@echo "Micro16 Makefile targets:"
	@echo "  make              Build main emulator, assembler, and disassembler"
	@echo "  make micro16      Build main emulator"
	@echo "  make micro16-asm  Build assembler"
	@echo "  make micro16-disasm Build disassembler"
	@echo "  make clean        Remove build artifacts"
	@echo "  make install      Install emulator to bin directory"
	@echo "  make test         Run basic sanity test"
	@echo "  make debug FILE=x Debug a binary file"
	@echo "  make help         Show this help"
	@echo ""
	@echo "Future targets (not yet implemented):"
	@echo "  make micro16-dbg   Build standalone debugger"

.PHONY: all clean install test debug help
