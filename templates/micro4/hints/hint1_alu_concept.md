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
