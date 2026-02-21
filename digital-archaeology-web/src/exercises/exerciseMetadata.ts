// src/exercises/exerciseMetadata.ts
// Exercise definitions with metadata for the Exercise Browser
// Story 21.1: Create Exercise Browser

import type { ExerciseMetadata, ExerciseDifficulty } from './types';
import type { LabStage } from '@ui/StageSelector';

/**
 * All exercise definitions. Ordered by stage, then difficulty.
 * Capstone exercises (Stories 21-8 through 21-14) will be appended in later stories.
 *
 * Data sections use ORG directives to pin addresses, enabling test case validation.
 * - Micro4: ORG 0xF0 (address 240)
 * - Micro8: .org 0x100 (address 256)
 * - Micro16: .org 0x200 (address 512)
 */
export const EXERCISES: readonly ExerciseMetadata[] = [
  // ── Micro4 Exercises ──────────────────────────────────────
  {
    id: 'ex-m4-hello-nibble',
    title: 'Hello Nibble',
    stage: 'micro4',
    difficulty: 'beginner',
    description: 'Load a value into the accumulator and store it to memory. Your first program on the simplest CPU.',
    concepts: ['accumulator', 'load', 'store', 'memory'],
    estimatedMinutes: 5,
    prerequisites: [],
    starterCode: `; Exercise: Hello Nibble
; Goal: Load the value 7 into the accumulator and store it at RESULT
;
; The accumulator is the Micro4's only register.
; LDA loads a value, STA stores it.

; TODO: Load the value at VALUE into the accumulator

; TODO: Store the accumulator to RESULT

HLT

  ORG 0xF0
VALUE: DB 7
RESULT: DB 0
`,
    testCases: [
      { label: 'RESULT', address: 0xF1, expected: 7 },
    ],
    hints: [
      'The Micro4 has two key instructions: LDA (load) and STA (store).',
      'LDA loads a value FROM a memory label INTO the accumulator.',
      'After loading VALUE with LDA, use STA RESULT to store it.',
    ],
  },
  {
    id: 'ex-m4-simple-addition',
    title: 'Simple Addition',
    stage: 'micro4',
    difficulty: 'beginner',
    description: 'Add two values stored in memory and write the result back. Learn how a 4-bit ALU performs arithmetic.',
    concepts: ['arithmetic', 'add', 'memory', 'accumulator'],
    estimatedMinutes: 10,
    prerequisites: ['ex-m4-hello-nibble'],
    starterCode: `; Exercise: Simple Addition
; Goal: Add NUM1 and NUM2, store the sum at RESULT
;
; Remember: LDA loads into accumulator, ADD adds memory to accumulator
; The result stays in the accumulator until you store it.

; TODO: Load NUM1 into accumulator

; TODO: Add NUM2 to accumulator

; TODO: Store result

HLT

  ORG 0xF0
NUM1: DB 3
NUM2: DB 5
RESULT: DB 0
`,
    testCases: [
      { label: 'RESULT (3+5)', address: 0xF2, expected: 8 },
    ],
    hints: [
      'You need three instructions: LDA, ADD, and STA.',
      'First LDA NUM1 to load 3 into the accumulator.',
      'Then ADD NUM2 — the ALU adds memory to the accumulator.',
      'Finally STA RESULT to write the sum to memory.',
    ],
  },
  {
    id: 'ex-m4-countdown-loop',
    title: 'Countdown Loop',
    stage: 'micro4',
    difficulty: 'intermediate',
    description: 'Count down from a starting value to zero using conditional jumps. Discover why loops need flags.',
    concepts: ['loops', 'conditional-jump', 'flags', 'decrement'],
    estimatedMinutes: 15,
    prerequisites: ['ex-m4-simple-addition'],
    starterCode: `; Exercise: Countdown Loop
; Goal: Count down from START to 0, storing final value at RESULT
;
; Hint: SUB subtracts, JZ jumps if zero flag is set
; The zero flag is set automatically when the result equals 0.

START: LDA COUNT

LOOP:
  ; TODO: Store current value to RESULT

  ; TODO: Subtract ONE from accumulator

  ; TODO: Jump to DONE if zero

  ; TODO: Jump back to LOOP

DONE:
  STA RESULT
  HLT

  ORG 0xF0
COUNT: DB 5
ONE: DB 1
RESULT: DB 0
`,
    testCases: [
      { label: 'RESULT (countdown to 0)', address: 0xF2, expected: 0 },
    ],
    hints: [
      'Inside the loop, you need to store, subtract, check, and jump.',
      'STA RESULT saves the current value. SUB ONE decreases by 1.',
      'JZ DONE jumps to the done label when the accumulator reaches zero.',
      'JMP LOOP goes back unconditionally to repeat the loop body.',
      'The loop exits naturally when SUB makes the accumulator zero and JZ fires.',
    ],
  },
  {
    id: 'ex-m4-max-of-two',
    title: 'Max of Two',
    stage: 'micro4',
    difficulty: 'intermediate',
    description: 'Compare two values and keep the larger one. Learn how comparison works with only subtraction and flags.',
    concepts: ['comparison', 'conditional-jump', 'flags', 'subtraction'],
    estimatedMinutes: 15,
    prerequisites: ['ex-m4-countdown-loop'],
    starterCode: `; Exercise: Max of Two
; Goal: Find the larger of NUM1 and NUM2, store it at RESULT
;
; The Micro4 has no CMP instruction!
; Trick: Subtract B from A. If the carry flag is set, A < B.

; TODO: Load NUM1 into accumulator

; TODO: Subtract NUM2 — if carry flag set, NUM2 is larger

; TODO: Use JC (jump if carry) to handle the case where NUM2 > NUM1

; If we get here, NUM1 >= NUM2
  LDA NUM1
  STA RESULT
  JMP DONE

IS_NUM2:
  ; TODO: Load NUM2 and store at RESULT

DONE:
  HLT

  ORG 0xF0
NUM1: DB 9
NUM2: DB 6
RESULT: DB 0
`,
    testCases: [
      { label: 'RESULT (max of 9,6)', address: 0xF2, expected: 9 },
    ],
    hints: [
      'Without CMP, you compare by subtracting and checking the carry flag.',
      'LDA NUM1, then SUB NUM2. If carry is set, NUM1 was smaller.',
      'JC IS_NUM2 jumps to the branch where NUM2 is larger.',
      'In the IS_NUM2 block: LDA NUM2 then STA RESULT then JMP DONE.',
    ],
  },
  {
    id: 'ex-m4-bit-shift-multiply',
    title: 'Bit Shift Multiply',
    stage: 'micro4',
    difficulty: 'advanced',
    description: 'Multiply a value by 2 using left shift. Understand why early CPUs had no multiply instruction.',
    concepts: ['bit-shift', 'multiplication', 'accumulator', 'carry-flag'],
    estimatedMinutes: 20,
    prerequisites: ['ex-m4-max-of-two'],
    starterCode: `; Exercise: Bit Shift Multiply
; Goal: Multiply VALUE by 2 using left shift, store at RESULT
;
; Left shift = add the number to itself!
; A << 1 is the same as A + A
; Watch for overflow: 4 bits can only hold 0-15.

; TODO: Load VALUE into accumulator

; TODO: Add VALUE to accumulator (this doubles it)

; TODO: Store result

HLT

  ORG 0xF0
; Try different values (keep result under 15!)
VALUE: DB 3
RESULT: DB 0
`,
    testCases: [
      { label: 'RESULT (3*2)', address: 0xF1, expected: 6 },
    ],
    hints: [
      'Left shift by 1 is the same as multiplying by 2.',
      'Adding a number to itself doubles it: A + A = 2A.',
      'LDA VALUE loads the value, then ADD VALUE adds it again.',
      'STA RESULT writes the doubled value to memory.',
    ],
  },

  // ── Micro8 Exercises ──────────────────────────────────────
  {
    id: 'ex-m8-register-swap',
    title: 'Register Swap',
    stage: 'micro8',
    difficulty: 'beginner',
    description: 'Swap the values of two registers without losing data. Feel the luxury of having 8 registers.',
    concepts: ['registers', 'move', 'temporary-storage'],
    estimatedMinutes: 5,
    prerequisites: [],
    starterCode: `; Exercise: Register Swap
; Goal: Swap the values of R0 and R1 using a third register
;
; Micro8 has 8 registers (R0-R7) — a huge upgrade from Micro4!
; MOV copies one register to another.

LDI R0, 0x42     ; R0 = 0x42
LDI R1, 0xAB     ; R1 = 0xAB

; TODO: Copy R0 into a temporary register (R2)

; TODO: Copy R1 into R0

; TODO: Copy the temporary register into R1

; Store results to verify
ST R0, [SWAP_A]
ST R1, [SWAP_B]
HLT

  .org 0x100
SWAP_A: .db 0
SWAP_B: .db 0
`,
    testCases: [
      { label: 'SWAP_A (was R1=0xAB)', address: 0x100, expected: 0xAB },
      { label: 'SWAP_B (was R0=0x42)', address: 0x101, expected: 0x42 },
    ],
    hints: [
      'To swap two values, you need a temporary "holding area" — use R2.',
      'MOV R2, R0 saves R0 before you overwrite it.',
      'MOV R0, R1 puts R1\'s value into R0. Now MOV R1, R2 completes the swap.',
    ],
  },
  {
    id: 'ex-m8-array-sum',
    title: 'Array Sum',
    stage: 'micro8',
    difficulty: 'beginner',
    description: 'Sum an array of values stored in memory using a loop and index register. Learn indirect addressing.',
    concepts: ['arrays', 'loops', 'indirect-addressing', 'accumulator'],
    estimatedMinutes: 15,
    prerequisites: ['ex-m8-register-swap'],
    starterCode: `; Exercise: Array Sum
; Goal: Sum all values in ARRAY, store total at RESULT
;
; Use HL as a pointer to walk through memory.
; LDI16 HL, addr loads a 16-bit address into the HL pair.

LDI R0, 0        ; R0 = running sum
LDI R1, 5        ; R1 = array length (counter)
LDI16 HL, ARRAY  ; HL points to start of array

LOOP:
  ; TODO: Load byte at [HL] into R2

  ; TODO: Add R2 to R0 (running sum)

  ; TODO: Increment HL to point to next element

  ; TODO: Decrement R1 (counter)

  ; TODO: Jump to LOOP if R1 is not zero

ST R0, [RESULT]
HLT

  .org 0x100
ARRAY: .db 10, 20, 30, 40, 50
RESULT: .db 0
`,
    testCases: [
      { label: 'RESULT (10+20+30+40+50)', address: 0x105, expected: 150 },
    ],
    hints: [
      'Use LD R2, [HL] to load the byte that HL points to into R2.',
      'ADD R0, R2 adds the loaded element to your running sum in R0.',
      'INC HL moves the pointer to the next array element.',
      'DEC R1 decreases the counter. JNZ LOOP repeats if counter is not zero.',
    ],
  },
  {
    id: 'ex-m8-string-length',
    title: 'String Length',
    stage: 'micro8',
    difficulty: 'intermediate',
    description: 'Count characters in a null-terminated string. Discover how early computers handled text.',
    concepts: ['strings', 'null-terminator', 'loops', 'indirect-addressing'],
    estimatedMinutes: 15,
    prerequisites: ['ex-m8-array-sum'],
    starterCode: `; Exercise: String Length
; Goal: Count characters in STRING until null (0x00), store count at RESULT
;
; Strings are just bytes in memory ending with 0x00.
; Use HL to walk byte by byte and R0 to count.

LDI R0, 0         ; R0 = character count
LDI16 HL, STRING  ; HL points to first character

LOOP:
  ; TODO: Load byte at [HL] into R1

  ; TODO: If R1 is zero, jump to DONE (found null terminator)

  ; TODO: Increment R0 (count)

  ; TODO: Increment HL (next character)

  ; TODO: Jump back to LOOP

DONE:
  ST R0, [RESULT]
  HLT

  .org 0x100
STRING: .db 0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x00  ; "Hello\\0"
RESULT: .db 0
`,
    testCases: [
      { label: 'RESULT (length of "Hello")', address: 0x106, expected: 5 },
    ],
    hints: [
      'Load the byte at [HL] into R1, then test if it is zero.',
      'LD R1, [HL] reads the current character. CMP R1, 0 or OR R1, R1 tests for null.',
      'JZ DONE exits the loop when R1 is zero (null terminator found).',
      'INC R0 counts the character, INC HL advances to the next byte, JMP LOOP repeats.',
    ],
  },
  {
    id: 'ex-m8-bubble-sort',
    title: 'Bubble Sort',
    stage: 'micro8',
    difficulty: 'intermediate',
    description: 'Sort an array of numbers in place. Implement the classic algorithm with nested loops and swaps.',
    concepts: ['sorting', 'nested-loops', 'comparison', 'arrays'],
    estimatedMinutes: 25,
    prerequisites: ['ex-m8-string-length'],
    starterCode: `; Exercise: Bubble Sort
; Goal: Sort ARRAY in ascending order using bubble sort
;
; Algorithm: Compare adjacent pairs, swap if out of order.
; Repeat until no swaps needed.
; R3 = swapped flag (1 = at least one swap happened)

LDI R4, 5            ; array length

OUTER:
  LDI R3, 0          ; swapped = false
  LDI R5, 4          ; inner loop count = length - 1
  LDI16 HL, ARRAY    ; reset pointer to start

  INNER:
    ; TODO: Load ARRAY[i] into R0 via [HL]

    ; TODO: Increment HL, load ARRAY[i+1] into R1

    ; TODO: Compare R0 and R1 — if R0 <= R1, skip swap

    ; TODO: Swap: store R0 at [HL], decrement HL, store R1 at [HL], increment HL

    ; TODO: Set R3 = 1 (swapped flag)

  NO_SWAP:
    ; TODO: Decrement R5 (inner counter)

    ; TODO: Jump to INNER if R5 > 0

  ; TODO: If R3 == 1, jump to OUTER (more passes needed)

HLT

  .org 0x100
ARRAY: .db 64, 25, 12, 22, 11
`,
    testCases: [
      { label: 'ARRAY[0] (smallest)', address: 0x100, expected: 11 },
      { label: 'ARRAY[1]', address: 0x101, expected: 12 },
      { label: 'ARRAY[2]', address: 0x102, expected: 22 },
      { label: 'ARRAY[3]', address: 0x103, expected: 25 },
      { label: 'ARRAY[4] (largest)', address: 0x104, expected: 64 },
    ],
    hints: [
      'Bubble sort compares adjacent pairs and swaps if out of order.',
      'Load [HL] into R0, increment HL, load [HL] into R1 to get adjacent pair.',
      'Compare R0 > R1: use CMP R0, R1 or subtract and check flags. Skip swap if already in order.',
      'To swap: store R0 at current [HL], decrement HL, store R1 at [HL], then increment HL back.',
      'Set R3=1 after each swap. After inner loop, if R3==1 repeat outer. If R3==0, array is sorted.',
    ],
  },
  {
    id: 'ex-m8-fibonacci',
    title: 'Fibonacci Sequence',
    stage: 'micro8',
    difficulty: 'advanced',
    description: 'Generate the first N Fibonacci numbers using subroutines. Experience the power of CALL/RET.',
    concepts: ['subroutines', 'stack', 'recursion-alternative', 'registers'],
    estimatedMinutes: 25,
    prerequisites: ['ex-m8-bubble-sort'],
    starterCode: `; Exercise: Fibonacci Sequence
; Goal: Generate first 8 Fibonacci numbers, store in FIB_OUT
;
; F(0)=0, F(1)=1, F(n) = F(n-1) + F(n-2)
; Use CALL/RET for a subroutine that computes next number.

LDI R0, 0           ; F(n-2) = 0
LDI R1, 1           ; F(n-1) = 1
LDI R6, 8           ; count = 8
LDI16 HL, FIB_OUT   ; output pointer

; Store first two values
ST R0, [HL]
INC HL
ST R1, [HL]
INC HL
LDI R6, 6           ; remaining count

LOOP:
  ; TODO: CALL the NEXT_FIB subroutine

  ; TODO: Store result (R2) at [HL]

  ; TODO: Increment HL

  ; TODO: Update R0 = R1, R1 = R2 for next iteration

  ; TODO: Decrement R6, jump to LOOP if not zero

HLT

; Subroutine: compute next Fibonacci number
; Input: R0 = F(n-2), R1 = F(n-1)
; Output: R2 = F(n)
NEXT_FIB:
  ; TODO: R2 = R0 + R1

  RET

  .org 0x100
FIB_OUT: .db 0, 0, 0, 0, 0, 0, 0, 0
`,
    testCases: [
      { label: 'FIB[0]', address: 0x100, expected: 0 },
      { label: 'FIB[1]', address: 0x101, expected: 1 },
      { label: 'FIB[2]', address: 0x102, expected: 1 },
      { label: 'FIB[3]', address: 0x103, expected: 2 },
      { label: 'FIB[4]', address: 0x104, expected: 3 },
      { label: 'FIB[5]', address: 0x105, expected: 5 },
      { label: 'FIB[6]', address: 0x106, expected: 8 },
      { label: 'FIB[7]', address: 0x107, expected: 13 },
    ],
    hints: [
      'CALL NEXT_FIB pushes the return address onto the stack and jumps to the subroutine.',
      'In NEXT_FIB, MOV R2, R0 then ADD R2, R1 computes R2 = F(n-2) + F(n-1).',
      'After CALL returns, ST R2, [HL] saves the result, INC HL advances the pointer.',
      'Update for next iteration: MOV R0, R1 then MOV R1, R2 shifts the window forward.',
      'DEC R6 then JNZ LOOP repeats until all 6 remaining numbers are generated.',
    ],
  },

  // ── Micro16 Exercises ──────────────────────────────────────
  {
    id: 'ex-m16-segment-basics',
    title: 'Segment Basics',
    stage: 'micro16',
    difficulty: 'beginner',
    description: 'Load and store values across different memory segments. Understand why 16-bit needed segmentation.',
    concepts: ['segments', 'addressing', '16-bit', 'memory-model'],
    estimatedMinutes: 10,
    prerequisites: [],
    starterCode: `; Exercise: Segment Basics
; Goal: Set up DS to point to a data segment, load and store values
;
; In Micro16, memory is divided into segments.
; DS (Data Segment) determines which 64KB block you access.

; TODO: Load data segment address into AX
;       MOV AX, #0x1000

; TODO: Set DS register from AX
;       MOV DS, AX

; TODO: Load a value and store it using DS-relative addressing
;       MOV AX, #0xBEEF
;       ST AX, [RESULT]

HLT

  .org 0x200
RESULT: .dw 0
`,
    testCases: [
      { label: 'RESULT (0xBEEF)', address: 0x200, expected: 0xBEEF },
    ],
    hints: [
      'Micro16 uses segment registers. DS (Data Segment) determines where data reads/writes go.',
      'MOV AX, #0x1000 loads the segment address. MOV DS, AX sets the data segment.',
      'After setting DS, load your value: MOV AX, #0xBEEF then ST AX, [RESULT].',
    ],
  },
  {
    id: 'ex-m16-hardware-multiply',
    title: 'Hardware Multiply',
    stage: 'micro16',
    difficulty: 'beginner',
    description: 'Use the hardware MUL instruction instead of shift-and-add. Feel the speed of dedicated circuitry.',
    concepts: ['multiplication', 'hardware-multiply', 'performance'],
    estimatedMinutes: 10,
    prerequisites: ['ex-m16-segment-basics'],
    starterCode: `; Exercise: Hardware Multiply
; Goal: Multiply two 16-bit values using the MUL instruction
;
; In Micro4 you had to shift and add. In Micro16, MUL does it in one cycle!
; MUL AX, BX multiplies AX by BX, result in AX.

; TODO: Load first operand into AX
;       MOV AX, #25

; TODO: Load second operand into BX
;       MOV BX, #13

; TODO: Multiply AX by BX
;       MUL AX, BX

; TODO: Store the result
;       ST AX, [PRODUCT]

HLT

  .org 0x200
PRODUCT: .dw 0
`,
    testCases: [
      { label: 'PRODUCT (25*13)', address: 0x200, expected: 325 },
    ],
    hints: [
      'This is much simpler than Micro4 multiplication — just use the MUL instruction!',
      'MOV AX, #25 loads the first operand. MOV BX, #13 loads the second.',
      'MUL AX, BX multiplies in hardware. The result lands in AX.',
      'ST AX, [PRODUCT] writes the 16-bit result to memory.',
    ],
  },
  {
    id: 'ex-m16-memory-block-copy',
    title: 'Memory Block Copy',
    stage: 'micro16',
    difficulty: 'intermediate',
    description: 'Copy a block of memory between segments. Implement the operation that early OSes used constantly.',
    concepts: ['memory-copy', 'segments', 'loops', 'block-operations'],
    estimatedMinutes: 20,
    prerequisites: ['ex-m16-hardware-multiply'],
    starterCode: `; Exercise: Memory Block Copy
; Goal: Copy COUNT words from SOURCE to DEST
;
; Use SI as source index, DI as destination index.
; This is how early OSes moved data around.

MOV CX, #5         ; CX = word count
MOV SI, #SOURCE    ; SI = source pointer
MOV DI, #DEST      ; DI = destination pointer

COPY_LOOP:
  ; TODO: Load word at [SI] into AX

  ; TODO: Store AX to [DI]

  ; TODO: Advance SI by 2 (word size)

  ; TODO: Advance DI by 2

  ; TODO: Decrement CX

  ; TODO: Jump to COPY_LOOP if CX != 0

HLT

  .org 0x200
SOURCE: .dw 0x1111, 0x2222, 0x3333, 0x4444, 0x5555
  .org 0x220
DEST:   .dw 0, 0, 0, 0, 0
`,
    testCases: [
      { label: 'DEST[0]', address: 0x220, expected: 0x1111 },
      { label: 'DEST[1]', address: 0x222, expected: 0x2222 },
      { label: 'DEST[2]', address: 0x224, expected: 0x3333 },
      { label: 'DEST[3]', address: 0x226, expected: 0x4444 },
      { label: 'DEST[4]', address: 0x228, expected: 0x5555 },
    ],
    hints: [
      'The loop body loads from source, stores to dest, advances both pointers, and decrements the counter.',
      'LD AX, [SI] reads a word from the source pointer. ST AX, [DI] writes it to the destination.',
      'ADD SI, #2 and ADD DI, #2 advance both pointers by one word (2 bytes per 16-bit word).',
      'DEC CX decreases the word count. JNZ COPY_LOOP repeats until CX reaches zero.',
    ],
  },
  {
    id: 'ex-m16-string-reverse',
    title: 'String Reverse',
    stage: 'micro16',
    difficulty: 'intermediate',
    description: 'Reverse a string stored in memory using two pointers. Classic algorithm, 16-bit style.',
    concepts: ['strings', 'pointers', 'two-pointer-technique', 'memory'],
    estimatedMinutes: 20,
    prerequisites: ['ex-m16-memory-block-copy'],
    starterCode: `; Exercise: String Reverse
; Goal: Reverse STRING in place using two pointers
;
; SI points to start, DI points to end.
; Swap characters and move pointers inward until they meet.

MOV SI, #STRING    ; front pointer
MOV DI, #STRING    ; back pointer — advance to end first

; First, find the end of the string
; TODO: Walk DI forward until [DI] == 0 (null terminator)

; TODO: Decrement DI by 2 (point to last real character, word-sized)

REVERSE_LOOP:
  ; TODO: If SI >= DI, we're done — jump to DONE

  ; TODO: Load [SI] into AX, load [DI] into BX

  ; TODO: Store BX at [SI], store AX at [DI] (swap)

  ; TODO: Increment SI by 2, decrement DI by 2

  ; TODO: Jump to REVERSE_LOOP

DONE:
  HLT

  .org 0x200
STRING: .dw 0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x00  ; "Hello\\0"
`,
    testCases: [
      { label: 'STRING[0] (was o)', address: 0x200, expected: 0x6F },
      { label: 'STRING[1] (was l)', address: 0x202, expected: 0x6C },
      { label: 'STRING[2] (unchanged l)', address: 0x204, expected: 0x6C },
      { label: 'STRING[3] (was e)', address: 0x206, expected: 0x65 },
      { label: 'STRING[4] (was H)', address: 0x208, expected: 0x48 },
    ],
    hints: [
      'First find the end: loop DI forward while [DI] != 0. Then DI points past the null terminator.',
      'SUB DI, #2 moves DI back to the last real character (each char is 2 bytes in Micro16).',
      'The stop condition is SI >= DI — use CMP SI, DI and JGE DONE.',
      'Swap: LD AX, [SI] and LD BX, [DI], then ST BX, [SI] and ST AX, [DI].',
      'After swapping, ADD SI, #2 and SUB DI, #2 move the pointers inward. JMP REVERSE_LOOP.',
    ],
  },
  {
    id: 'ex-m16-linked-list',
    title: 'Linked List Traversal',
    stage: 'micro16',
    difficulty: 'advanced',
    description: 'Walk a linked list stored in memory, counting nodes. Discover why dynamic data needs address space.',
    concepts: ['linked-list', 'pointers', 'dynamic-data', 'memory-management'],
    estimatedMinutes: 30,
    prerequisites: ['ex-m16-string-reverse'],
    starterCode: `; Exercise: Linked List Traversal
; Goal: Walk a linked list, count nodes, store count at RESULT
;
; Each node: [value (1 word)] [next pointer (1 word)]
; A next pointer of 0x0000 means end of list.
; SI = current node pointer, CX = count

MOV SI, #NODE1       ; point to first node
MOV CX, #0           ; node count = 0

WALK:
  ; TODO: If SI == 0, jump to DONE (null pointer = end of list)

  ; TODO: Increment CX (count this node)

  ; TODO: Read the 'next' pointer — it's at offset +2 from SI
  ;       Load [SI + 2] into SI

  ; TODO: Jump to WALK

DONE:
  ST CX, [RESULT]
  HLT

  .org 0x200
; Linked list: 3 nodes
; Node 1: value=10, next=NODE2
NODE1: .dw 10
       .dw NODE2
; Node 2: value=20, next=NODE3
NODE2: .dw 20
       .dw NODE3
; Node 3: value=30, next=0 (end)
NODE3: .dw 30
       .dw 0

RESULT: .dw 0
`,
    testCases: [
      { label: 'RESULT (3 nodes)', address: 0x218, expected: 3 },
    ],
    hints: [
      'A linked list node has two fields: value at offset 0 and next-pointer at offset +2.',
      'Check if SI == 0 to detect end of list. CMP SI, #0 then JZ DONE.',
      'INC CX counts each node you visit.',
      'To follow the next pointer: LD SI, [SI + 2] reads the next-pointer field into SI.',
      'JMP WALK repeats the traversal with the new SI pointing to the next node.',
    ],
  },
] as const;

/** Set of all valid exercise IDs for quick lookup */
export const EXERCISE_IDS: ReadonlySet<string> = new Set(EXERCISES.map(e => e.id));

/** Stages that have exercises defined */
export const STAGES_WITH_EXERCISES: readonly LabStage[] = ['micro4', 'micro8', 'micro16'] as const;

/** Get exercises filtered by stage */
export function getExercisesByStage(stage: LabStage): readonly ExerciseMetadata[] {
  return EXERCISES.filter(e => e.stage === stage);
}

/** Get exercise count per stage */
export function getExerciseCountByStage(stage: LabStage): number {
  return EXERCISES.filter(e => e.stage === stage).length;
}

/** Find an exercise by ID */
export function findExerciseById(id: string): ExerciseMetadata | undefined {
  return EXERCISES.find(e => e.id === id);
}

/** Get exercises filtered by difficulty */
export function getExercisesByDifficulty(difficulty: ExerciseDifficulty): readonly ExerciseMetadata[] {
  return EXERCISES.filter(e => e.difficulty === difficulty);
}

/** Stage display labels for exercise sections */
export const STAGE_EXERCISE_LABELS: Record<string, string> = {
  micro4: 'Micro4 — 4-bit',
  micro8: 'Micro8 — 8-bit',
  micro16: 'Micro16 — 16-bit',
};
