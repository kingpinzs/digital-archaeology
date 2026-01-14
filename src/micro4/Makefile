# Micro4 CPU Emulator Makefile

CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -g -O2
LDFLAGS =

# Output binary
TARGET = micro4

# Source files
SRCS = main.c cpu.c assembler.c
OBJS = $(SRCS:.c=.o)

# Default target
all: $(TARGET)

# Link
$(TARGET): $(OBJS)
	$(CC) $(LDFLAGS) -o $@ $^

# Compile
%.o: %.c
	$(CC) $(CFLAGS) -c -o $@ $<

# Dependencies
main.o: main.c cpu.h assembler.h
cpu.o: cpu.c cpu.h
assembler.o: assembler.c assembler.h cpu.h

# Clean
clean:
	rm -f $(OBJS) $(TARGET)

# Install to parent bin directory
install: $(TARGET)
	mkdir -p ../../bin
	cp $(TARGET) ../../bin/

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
	@echo "  make          Build the emulator"
	@echo "  make clean    Remove build artifacts"
	@echo "  make install  Install to bin directory"
	@echo "  make test     Run test programs"
	@echo "  make help     Show this help"

.PHONY: all clean install test help
