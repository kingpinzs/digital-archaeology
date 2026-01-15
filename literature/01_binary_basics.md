# Binary Basics: The Language of Computers

## Prerequisites

- Basic arithmetic (addition, subtraction, multiplication, division)
- Understanding of place value in decimal numbers
- Familiarity with any programming language (helpful, not required)

## Learning Objectives

After completing this chapter, you will be able to:

1. Convert numbers between binary, decimal, hexadecimal, and octal
2. Perform arithmetic operations in binary
3. Represent negative numbers using two's complement
4. Detect overflow in signed and unsigned arithmetic
5. Explain why computers use binary instead of decimal

---

## Introduction

Every digital computer, from the simplest calculator to the most powerful supercomputer, speaks one language at its core: binary. But why binary? Why not decimal, which humans find so natural?

The answer lies in physics. Electronic circuits can reliably distinguish between two states—high voltage and low voltage, on and off, 1 and 0. Trying to distinguish ten different voltage levels (for decimal) would be prone to errors. Binary is simple, reliable, and fast.

In this chapter, we'll explore how computers represent and manipulate numbers using just these two symbols.

---

## Core Concepts

### 1. Positional Number Systems

Before diving into binary, let's review how positional number systems work.

In decimal (base 10), each position represents a power of 10:

```
    4   7   2   3
    ↓   ↓   ↓   ↓
   10³ 10² 10¹ 10⁰
  1000 100  10   1

4723 = 4×1000 + 7×100 + 2×10 + 3×1
     = 4000 + 700 + 20 + 3
     = 4723
```

Binary (base 2) works exactly the same way, but each position represents a power of 2:

```
    1   0   1   1
    ↓   ↓   ↓   ↓
   2³  2²  2¹  2⁰
    8   4   2   1

1011₂ = 1×8 + 0×4 + 1×2 + 1×1
      = 8 + 0 + 2 + 1
      = 11₁₀
```

The subscript indicates the base (₂ for binary, ₁₀ for decimal).

### 2. Powers of Two

Memorize these—you'll use them constantly:

```
2⁰  = 1         2⁸  = 256
2¹  = 2         2⁹  = 512
2²  = 4         2¹⁰ = 1024 (1K)
2³  = 8         2¹¹ = 2048
2⁴  = 16        2¹² = 4096 (4K)
2⁵  = 32        2¹³ = 8192
2⁶  = 64        2¹⁴ = 16384
2⁷  = 128       2¹⁵ = 32768
                2¹⁶ = 65536 (64K)
```

**Useful patterns:**
- 2¹⁰ ≈ 1,000 (actually 1,024)—this is why 1 KB ≈ 1,000 bytes
- Every 10 powers of 2 multiplies by roughly 1,000

### 3. Binary to Decimal Conversion

**Method: Sum the powers of 2 where there's a 1**

```
Convert 11010110₂ to decimal:

Position:  7  6  5  4  3  2  1  0
Binary:    1  1  0  1  0  1  1  0
Value:   128 64  0 16  0  4  2  0

Sum = 128 + 64 + 16 + 4 + 2 = 214₁₀
```

### 4. Decimal to Binary Conversion

**Method 1: Repeated Division**

Divide by 2 and collect remainders (read bottom to top):

```
Convert 214 to binary:

214 ÷ 2 = 107 remainder 0  ↑
107 ÷ 2 = 53  remainder 1  │
53  ÷ 2 = 26  remainder 1  │
26  ÷ 2 = 13  remainder 0  │ Read upward
13  ÷ 2 = 6   remainder 1  │
6   ÷ 2 = 3   remainder 0  │
3   ÷ 2 = 1   remainder 1  │
1   ÷ 2 = 0   remainder 1  │

Result: 11010110₂
```

**Method 2: Subtract Powers of 2**

Find the largest power of 2 that fits, subtract, repeat:

```
Convert 214 to binary:

214 - 128 = 86   → bit 7 = 1
86  - 64  = 22   → bit 6 = 1
22  - 32? No     → bit 5 = 0
22  - 16  = 6    → bit 4 = 1
6   - 8?  No     → bit 3 = 0
6   - 4   = 2    → bit 2 = 1
2   - 2   = 0    → bit 1 = 1
0   - 1?  No     → bit 0 = 0

Result: 11010110₂
```

### 5. Hexadecimal (Base 16)

Binary numbers get long. Hexadecimal (hex) provides a compact representation.

**Hex digits:** 0-9 and A-F (where A=10, B=11, C=12, D=13, E=14, F=15)

```
Decimal:     0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
Hexadecimal: 0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F
Binary:   0000  0001  0010  0011  0100  0101  0110  0111
          1000  1001  1010  1011  1100  1101  1110  1111
```

**Key insight:** Each hex digit = exactly 4 binary bits (a "nibble")

```
Binary:      1101 0110
             ↓    ↓
Hex:          D    6

11010110₂ = D6₁₆ = 0xD6
```

The "0x" prefix is common notation for hexadecimal numbers.

**Hex to Decimal:**

```
0xD6 = D×16 + 6×1
     = 13×16 + 6
     = 208 + 6
     = 214
```

### 6. Octal (Base 8)

Octal uses digits 0-7, with each digit representing 3 binary bits.

```
Octal digits: 0  1  2  3  4  5  6  7
Binary:      000 001 010 011 100 101 110 111
```

Octal was popular in early computing (PDP-8, Unix file permissions) but hex is more common now.

```
Binary: 011 010 110
         ↓   ↓   ↓
Octal:   3   2   6

11010110₂ = 326₈
```

### 7. Binary Arithmetic

#### Addition

Binary addition follows simple rules:

```
0 + 0 = 0
0 + 1 = 1
1 + 0 = 1
1 + 1 = 10  (0, carry 1)
1 + 1 + 1 = 11  (1, carry 1)
```

**Example: 1011 + 0110**

```
  Carry:  1 1 1 0
          1 0 1 1
        + 0 1 1 0
        ---------
        1 0 0 0 1

1011₂ (11) + 0110₂ (6) = 10001₂ (17)
```

#### Subtraction

Subtraction with borrowing:

```
0 - 0 = 0
1 - 0 = 1
1 - 1 = 0
0 - 1 = 1 (borrow 1 from next position)
```

**Example: 1011 - 0110**

```
  Borrow: 0 1 0 0
          1 0 1 1
        - 0 1 1 0
        ---------
          0 1 0 1

1011₂ (11) - 0110₂ (6) = 0101₂ (5)
```

However, computers usually don't subtract directly. Instead, they use **two's complement** to convert subtraction to addition.

### 8. Unsigned Integers

With n bits, we can represent 2ⁿ different values.

| Bits | Range | Values |
|------|-------|--------|
| 4 | 0 to 15 | 16 |
| 8 | 0 to 255 | 256 |
| 16 | 0 to 65,535 | 65,536 |
| 32 | 0 to 4,294,967,295 | 4.3 billion |

**Formula:** n bits can represent 0 to 2ⁿ - 1

### 9. Signed Integers: Two's Complement

How do we represent negative numbers with only 1s and 0s?

**Two's complement** is the standard solution. The key insight: the most significant bit (MSB) represents a *negative* power of 2.

For an 8-bit two's complement number:

```
Bit position:   7    6    5    4    3    2    1    0
Weight:       -128  64   32   16    8    4    2    1
              ↑
              Negative!
```

**Example: What is 10110100 in two's complement?**

```
10110100₂ = -128 + 32 + 16 + 4 = -128 + 52 = -76
```

**Range with n bits:** -2ⁿ⁻¹ to 2ⁿ⁻¹ - 1

| Bits | Range |
|------|-------|
| 4 | -8 to +7 |
| 8 | -128 to +127 |
| 16 | -32,768 to +32,767 |
| 32 | -2,147,483,648 to +2,147,483,647 |

**Converting to Negative (Two's Complement):**

1. Invert all bits (0→1, 1→0)
2. Add 1

```
Find -5 in 8-bit two's complement:

Step 1: Start with +5:        00000101
Step 2: Invert all bits:      11111010
Step 3: Add 1:                11111011

-5 = 11111011₂
```

**Verify:** -128 + 64 + 32 + 16 + 8 + 2 + 1 = -128 + 123 = -5 ✓

**Why Two's Complement Works:**

The genius of two's complement is that addition works the same for both signed and unsigned numbers! The CPU doesn't need separate "signed add" and "unsigned add" circuits.

```
  5 + (-3) = 2

    00000101  (+5)
  + 11111101  (-3)
  ----------
   100000010

Discard carry → 00000010 = 2 ✓
```

### 10. Overflow Detection

**Unsigned Overflow:** Occurs when the result exceeds the maximum value.

```
8-bit unsigned: 255 + 1

  11111111
+ 00000001
----------
 100000000  ← 9 bits! The carry out indicates overflow.

Result wraps to 0.
```

**Signed Overflow:** Occurs when adding two numbers of the same sign produces a result of opposite sign.

```
8-bit signed: 127 + 1

  01111111  (+127)
+ 00000001  (+1)
----------
  10000000  (-128!)  ← Positive + Positive = Negative? OVERFLOW!
```

**Overflow Rule:** If the carry into the MSB differs from the carry out of the MSB, overflow occurred.

---

## Worked Example

**Problem:** A 4-bit CPU has an accumulator containing 0111 (7). What happens when we ADD 0011 (3)?

**Solution:**

```
   0 1 1 1   (7)
 + 0 0 1 1   (3)
 ----------
   1 0 1 0   (?)
```

**Unsigned interpretation:** 1010₂ = 10. Correct! 7 + 3 = 10.

**Signed interpretation:** 1010₂ = -8 + 2 = -6. This is wrong!

The signed operation overflowed:
- Both operands were positive (MSB = 0)
- Result is negative (MSB = 1)
- Carry into MSB = 1, Carry out of MSB = 0 → Overflow!

**Key insight:** The *same* bits can mean different things depending on interpretation. The Micro4 CPU's Z (zero) flag and future C (carry) and V (overflow) flags help programs detect these conditions.

---

## Try It Yourself

1. **Visualizer Practice:**
   - Open the Micro4 Circuit Builder (`visualizer/index.html`)
   - Load the "Adder Example" - this is a half adder
   - Toggle switches A and B to see binary addition: A + B = Sum with Carry
   - Verify: 0+0=0, 0+1=1, 1+0=1, 1+1=10 (sum=0, carry=1)

2. **HDL Exploration:**
   - Examine `hdl/03_alu.m4hdl` to see how the ALU performs addition
   - Note how the carry propagates through each bit position

3. **Assembly Practice:**
   - Look at `programs/math_test.asm` - how does the Micro4 handle overflow?

---

## Common Mistakes

### 1. Forgetting That Bits Have Limited Range

```
4-bit unsigned:  15 + 1 = 0 (not 16!)
4-bit signed:     7 + 1 = -8 (not 8!)
```

### 2. Confusing Signed and Unsigned

The bit pattern 1111₂ means:
- 15 if unsigned
- -1 if signed (two's complement)

The bits are the same; the interpretation differs.

### 3. Wrong Direction in Two's Complement

To negate: invert then add 1 (not add 1 then invert!)

```
Wrong: +5 → 00000101 → 00000110 → 11111001 ≠ -5
Right: +5 → 00000101 → 11111010 → 11111011 = -5
```

### 4. Sign Extension Errors

When moving a signed number to more bits, extend the sign bit:

```
4-bit -3: 1101
8-bit -3: 11111101  (extend the leading 1)

4-bit +3: 0011
8-bit +3: 00000011  (extend the leading 0)
```

---

## Historical Context

### The Long Road to Binary

- **Ancient Civilizations:** Used base 60 (Babylonians) and base 10 (nearly everyone else)
- **1679:** Gottfried Leibniz documented the binary system
- **1847:** George Boole developed Boolean algebra
- **1937:** Claude Shannon's thesis connected Boolean algebra to electrical circuits
- **1945:** ENIAC used decimal (each digit needed 10 vacuum tubes!)
- **1946:** John von Neumann advocated binary for its simplicity
- **Today:** Binary reigns supreme in all digital systems

### Why Two's Complement Won

Early computers experimented with different negative number representations:
- **Sign-magnitude:** Use one bit for sign (problem: two zeros: +0 and -0)
- **One's complement:** Invert bits for negative (problem: still two zeros)
- **Two's complement:** Invert and add 1 (winner: one zero, addition works naturally)

The IBM System/360 (1964) standardized two's complement, and it's been universal ever since.

---

## Further Reading

### In This Project
- `docs/micro4_isa.md` - How the Micro4 uses binary in its instruction set
- `hdl/03_alu.m4hdl` - Binary arithmetic implemented in hardware

### External Resources
- *CODE: The Hidden Language of Computer Hardware and Software* by Charles Petzold - Excellent introduction
- *Computer Organization and Design* by Patterson & Hennessy - Standard textbook

---

## Summary

| Concept | Key Points |
|---------|------------|
| Binary | Base 2: only 0 and 1. Each position is a power of 2. |
| Hexadecimal | Base 16: compact way to write binary (4 bits = 1 hex digit) |
| Unsigned | n bits → range 0 to 2ⁿ - 1 |
| Two's Complement | n bits → range -2ⁿ⁻¹ to 2ⁿ⁻¹ - 1. MSB has negative weight. |
| Overflow | Unsigned: carry out. Signed: carry in ≠ carry out of MSB. |
| Addition | Same circuit works for both signed and unsigned! |

**Next Chapter:** [Logic Gates](02_logic_gates.md) - How transistors implement binary operations
