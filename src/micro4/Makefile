# Micro4 CPU Emulator Makefile

CC = gcc-14
CFLAGS = -Wall -Wextra -std=c99 -g -O2
LDFLAGS =

# Output binaries
TARGET = micro4
DEBUGGER = micro4-dbg

# Source files
SRCS = main.c cpu.c assembler.c
OBJS = $(SRCS:.c=.o)

# Debugger source files
DBG_SRCS = debugger.c cpu.c assembler.c
DBG_OBJS = $(DBG_SRCS:.c=.o)

# Default target
all: $(TARGET) $(DEBUGGER)

# Link
$(TARGET): $(OBJS)
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
debugger.o: debugger.c debugger.h cpu.h assembler.h

# Clean
clean:
	rm -f $(OBJS) debugger.o $(TARGET) $(DEBUGGER)

# Install to parent bin directory
install: $(TARGET) $(DEBUGGER)
	mkdir -p ../../bin
	cp $(TARGET) $(DEBUGGER) ../../bin/

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
	@echo "  make          Build the emulator and debugger"
	@echo "  make micro4   Build just the emulator"
	@echo "  make micro4-dbg  Build just the debugger"
	@echo "  make clean    Remove build artifacts"
	@echo "  make install  Install to bin directory"
	@echo "  make test     Run test programs"
	@echo "  make help     Show this help"

.PHONY: all clean install test help
