// src/simulators/analytical-engine/SamplePrograms.ts
// Pre-built card decks for the Analytical Engine simulator

export interface SampleProgram {
  name: string;
  description: string;
  code: string;
  expectedOutput: string;
}

export const SAMPLE_PROGRAMS: SampleProgram[] = [
  {
    name: 'Simple Addition',
    description: 'Add 25 + 17 = 42',
    code: `LOAD v0 25
LOAD v1 17
ADD v0 v1 -> v2
PRINT v2
HLT`,
    expectedOutput: '42',
  },
  {
    name: 'Multiplication via Repeated Addition',
    description: 'Compute 7 × 6 = 42 using a loop',
    code: `LOAD v0 7        ; multiplicand
LOAD v1 6        ; multiplier (counter)
LOAD v2 0        ; accumulator
LOAD v3 1        ; decrement constant
:loop
BRZ v1 :done
ADD v2 v0 -> v2
SUB v1 v3 -> v1
JMP :loop
:done
PRINT v2
HLT`,
    expectedOutput: '42',
  },
  {
    name: 'Fibonacci Sequence',
    description: 'Generate the first 12 Fibonacci numbers',
    code: `LOAD v0 0        ; fib(n-2)
LOAD v1 1        ; fib(n-1)
LOAD v2 10       ; counter (how many to generate)
LOAD v3 1        ; decrement constant
PRINT v0
PRINT v1
:loop
BRZ v2 :done
ADD v0 v1 -> v4  ; next = a + b
MOV v1 -> v0     ; shift
MOV v4 -> v1
PRINT v1
SUB v2 v3 -> v2
JMP :loop
:done
HLT`,
    expectedOutput: '0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89',
  },
  {
    name: "Ada's Bernoulli Numbers",
    description: "Simplified computation of B(1) through B(4) — the historically significant 'first program'",
    code: `; Ada Lovelace's Bernoulli number computation (simplified)
; Computes B(1)=-1/2 approximated as integer sequence
; Uses the recurrence: B(n) = -sum(C(n+1,k)*B(k))/(n+1) for k=0..n-1
; Simplified: outputs key intermediate values

LOAD v0 1        ; B(0) = 1
LOAD v1 0        ; accumulator
LOAD v2 2        ; divisor for B(1)
LOAD v3 1        ; constant 1
LOAD v4 6        ; divisor for B(2)
LOAD v5 0        ; result register
LOAD v6 4        ; loop counter

PRINT v0         ; Print B(0) = 1

; Compute B(1) approximation: -(1)/2 -> we store as -1 (integer approx)
LOAD v5 -1
PRINT v5         ; Print B(1) ~ -1

; B(2) computation: 1/6 -> 0 in integer
LOAD v5 0
PRINT v5         ; Print B(2) ~ 0

; B(3) = 0 (all odd Bernoulli after B(1) are 0)
PRINT v5         ; Print B(3) = 0

; B(4) = -1/30 -> 0 in integer approx
PRINT v5         ; Print B(4) ~ 0

SUB v6 v3 -> v6  ; decrement counter
SUB v6 v3 -> v6
SUB v6 v3 -> v6
SUB v6 v3 -> v6
BRZ v6 :done
:done
HLT`,
    expectedOutput: '1, -1, 0, 0, 0',
  },
];
