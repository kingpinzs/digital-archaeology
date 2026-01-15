# Task: Literature - Basic Concepts

## Goal
Create foundational educational articles for CPU basics

## Context
- These articles support Micro4 and early Micro8 learning
- Written for students with programming but not hardware background
- Each article standalone but builds on previous

## Requirements
1. Create literature/ directory articles:
   - 01_binary_basics.md (~500 lines)
   - 02_logic_gates.md (~400 lines)
   - 03_combinational_logic.md (~600 lines)
   - 04_sequential_logic.md (~500 lines)
   - 05_alu_design.md (~600 lines)
   - 06_cpu_datapath.md (~700 lines)

2. Each article follows template:
   - Prerequisites
   - Learning Objectives
   - Introduction
   - Core Concepts (with diagrams)
   - Worked Example
   - Try It Yourself (links to HDL/visualizer)
   - Common Mistakes
   - Historical Context
   - Further Reading
   - Summary

3. Include ASCII diagrams for all circuits
4. Link to relevant homework exercises

## Article Summaries

### 01_binary_basics.md
- Binary, hexadecimal, octal
- Unsigned integers
- Two's complement signed integers
- Binary arithmetic
- Overflow detection

### 02_logic_gates.md
- AND, OR, NOT truth tables
- NAND, NOR as universal gates
- XOR, XNOR
- Multiple input gates
- Gate symbols (ANSI and traditional)

### 03_combinational_logic.md
- Half adder, full adder
- Ripple carry adder
- Multiplexer (2:1, 4:1, 8:1)
- Decoder (2:4, 3:8)
- Encoder, priority encoder
- Comparator

### 04_sequential_logic.md
- SR latch, problem with both inputs high
- D latch, D flip-flop
- Edge triggering
- Register (group of D flip-flops)
- Counter (ripple, synchronous)

### 05_alu_design.md
- ALU inputs: A, B, operation
- ALU outputs: result, flags
- Operation selection via multiplexer
- Flag generation (Z, C, S, O)
- Typical ALU operations

### 06_cpu_datapath.md
- Registers and buses
- Register file design
- Memory interface
- Control signals
- Single-cycle datapath example

## Files to Read First
- docs/optimization_homework.md (writing style)
- hdl/04_micro4_cpu.m4hdl (examples to reference)
- visualizer/index.html (visualization links)

## Verification
- Articles readable by programming students
- Diagrams render correctly in markdown
- Links to visualizer work
- Exercises in "Try It Yourself" are doable
