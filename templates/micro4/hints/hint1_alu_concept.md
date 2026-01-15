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
