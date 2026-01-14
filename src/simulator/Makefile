# M4HDL Simulator Makefile

CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -g -O2
LDFLAGS =

TARGET = m4sim

SRCS = main.c circuit.c parser.c
OBJS = $(SRCS:.c=.o)

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(LDFLAGS) -o $@ $^

%.o: %.c
	$(CC) $(CFLAGS) -c -o $@ $<

main.o: main.c circuit.h
circuit.o: circuit.c circuit.h
parser.o: parser.c circuit.h

clean:
	rm -f $(OBJS) $(TARGET)

install: $(TARGET)
	mkdir -p ../../bin
	cp $(TARGET) ../../bin/

test: $(TARGET)
	./$(TARGET) test

.PHONY: all clean install test
