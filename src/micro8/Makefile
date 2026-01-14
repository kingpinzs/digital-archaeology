# Micro8 CPU Emulator Makefile

CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -g -O2
LDFLAGS =

# Output binary
TARGET = micro8

# Source files
SRCS = main.c cpu.c
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
main.o: main.c cpu.h
cpu.o: cpu.c cpu.h

# Clean
clean:
	rm -f $(OBJS) $(TARGET)

# Install to parent bin directory
install: $(TARGET)
	mkdir -p ../../bin
	cp $(TARGET) ../../bin/

# Run a simple test
test: $(TARGET)
	@echo "Running basic sanity test..."
	@echo "Creating test program: MOV R0, 0x42; HLT"
	@printf '\x11\x00\x42\x01' > /tmp/micro8_test.bin
	./$(TARGET) run /tmp/micro8_test.bin
	@rm -f /tmp/micro8_test.bin

# Help
help:
	@echo "Micro8 Makefile targets:"
	@echo "  make          Build the emulator"
	@echo "  make clean    Remove build artifacts"
	@echo "  make install  Install to bin directory"
	@echo "  make test     Run basic sanity test"
	@echo "  make help     Show this help"

.PHONY: all clean install test help
