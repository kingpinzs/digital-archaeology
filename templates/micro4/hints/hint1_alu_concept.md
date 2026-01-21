<<<<<<< HEAD
# Hint 1: ALU Concepts

## What You're Trying to Achieve

The ALU (Arithmetic Logic Unit) is the "brain" of your CPU - it performs all calculations. Your Micro4 CPU needs an ALU that can:

- **ADD** two 4-bit numbers
- **SUB** (subtract) two 4-bit numbers
- **PASS** a value through unchanged (for load instructions)

## Key Insight: The ALU is a Function Box

Think of the ALU as a box with:

```
        +---------+
A[3:0] -|         |-> R[3:0]  (Result)
        |   ALU   |
B[3:0] -|         |-> Z       (Zero flag: is result 0?)
        |         |-> C       (Carry flag: did it overflow?)
OP[1:0]-|         |
        +---------+
```

- **Inputs A and B**: The two numbers to operate on
- **Input OP**: Selects which operation (ADD=00, SUB=01, PASS=10)
- **Output R**: The result of the operation
- **Output Z**: A flag that's 1 when the result is zero
- **Output C**: A flag that's 1 when addition overflows

## Questions to Think About

Before looking at the next hint, try to answer:

1. How do you add two binary numbers? (Think about how you add decimal numbers by hand)
2. How can subtraction be done using addition? (Research: two's complement)
3. How would you detect if a result is zero using only logic gates?

## Don't Start Coding Yet!

Understanding the concept is more important than rushing to implementation. Make sure you can explain how binary addition works before moving on.

---

**Still stuck?** Open `hint2_alu_structure.md` for the architecture.
=======
# Hint 1: ALU Concept

## What is an ALU?

The **Arithmetic Logic Unit (ALU)** is the "calculator" inside your CPU. It takes two inputs and performs an operation on them to produce a single output.

Think of it like a Swiss Army knife with multiple tools:
- Addition (A + B)
- Subtraction (A - B)
- AND, OR, XOR (bitwise operations)
- Comparisons

But unlike a Swiss Army knife, the ALU can only use ONE tool at a time. A **control signal** tells it which operation to perform.

## The Key Insight

**The ALU computes ALL possible results simultaneously, then a multiplexer selects which one to output.**

This is counterintuitive! You might think "why waste energy computing things we don't need?" But in hardware, it's actually simpler and faster to:

1. Let adders, ANDers, and other circuits all run in parallel
2. Use a multiplexer at the end to pick the right result

## What You Need to Build

For the Micro4 CPU, your ALU needs to support at minimum:
- **ADD**: A + B (for the ADD instruction)
- **SUB**: A - B (for the SUB instruction)

Both operations take:
- **Input A**: The accumulator (4 bits)
- **Input B**: Data from memory via MDR (4 bits)
- **Operation select**: Which operation to perform (1 bit: 0=ADD, 1=SUB)

And produce:
- **Result**: The 4-bit answer
- **Zero flag**: Is the result equal to 0000?
- **Carry flag** (optional): Did the addition overflow?

## Questions to Guide Your Thinking

1. How do you add two 4-bit numbers in hardware?
   - Start with a 1-bit full adder
   - Chain four together (ripple-carry adder)

2. How do you subtract in hardware?
   - Remember: A - B = A + (~B) + 1
   - Invert B and set carry-in to 1

3. How do you detect if a 4-bit result is zero?
   - What logic gate outputs 1 when ALL inputs are 0?

## Don't Start Coding Yet!

Before writing any HDL:
1. Draw a block diagram of your ALU
2. Label all inputs and outputs
3. Identify what sub-circuits you need (adder, inverter, mux, etc.)

---

**Still stuck?** See `hint2_alu_structure.md` for the block diagram and structure.
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700
