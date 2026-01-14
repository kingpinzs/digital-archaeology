; multiply.asm - 8-bit multiplication routines
; Demonstrates multiple multiplication algorithms:
;   1. Repeated addition (simple, slow)
;   2. Shift-and-add (efficient, standard)
;   3. 8x8 -> 16-bit result
;
; Micro8 Architecture Test Program

        .org 0x0200             ; Start after reserved area

START:
        ; Initialize stack pointer
        LDI16 SP, 0x01FD        ; SP = top of stack

        ; ===== Test 1: Simple 3 x 4 = 12 =====
        LDI R0, 3               ; Multiplicand
        LDI R1, 4               ; Multiplier
        CALL MUL_SIMPLE         ; R0 = result
        ST R0, [RESULT1]        ; Expected: 12 (0x0C)

        ; ===== Test 2: 7 x 8 = 56 =====
        LDI R0, 7
        LDI R1, 8
        CALL MUL_SIMPLE
        ST R0, [RESULT2]        ; Expected: 56 (0x38)

        ; ===== Test 3: Shift-and-add 6 x 7 = 42 =====
        LDI R0, 6               ; Multiplicand
        LDI R1, 7               ; Multiplier
        CALL MUL_SHIFT_ADD      ; R0 = result
        ST R0, [RESULT3]        ; Expected: 42 (0x2A)

        ; ===== Test 4: 15 x 15 = 225 =====
        LDI R0, 15
        LDI R1, 15
        CALL MUL_SHIFT_ADD
        ST R0, [RESULT4]        ; Expected: 225 (0xE1)

        ; ===== Test 5: 16-bit result: 200 x 3 = 600 =====
        LDI R0, 200             ; Multiplicand
        LDI R1, 3               ; Multiplier
        CALL MUL_16BIT          ; R1:R0 = 16-bit result
        ST R0, [RESULT5_L]      ; Expected: 0x58 (low byte of 600)
        ST R1, [RESULT5_H]      ; Expected: 0x02 (high byte of 600)

        ; ===== Test 6: 16-bit result: 255 x 255 = 65025 =====
        LDI R0, 255             ; Multiplicand
        LDI R1, 255             ; Multiplier
        CALL MUL_16BIT          ; R1:R0 = 16-bit result
        ST R0, [RESULT6_L]      ; Expected: 0x01 (low byte of 65025)
        ST R1, [RESULT6_H]      ; Expected: 0xFE (high byte of 65025)

        ; ===== Test 7: Multiply by zero =====
        LDI R0, 42
        LDI R1, 0
        CALL MUL_SIMPLE
        ST R0, [RESULT7]        ; Expected: 0

        ; ===== Test 8: Multiply by one =====
        LDI R0, 123
        LDI R1, 1
        CALL MUL_SIMPLE
        ST R0, [RESULT8]        ; Expected: 123 (0x7B)

        ; ===== Test 9: Powers of 2 (shift optimization) =====
        LDI R0, 5
        LDI R1, 8               ; 8 = 2^3, can be done with 3 shifts
        CALL MUL_SHIFT_ADD
        ST R0, [RESULT9]        ; Expected: 40 (0x28)

        ; ===== Test 10: Square a number =====
        LDI R0, 12
        CALL SQUARE             ; R0 = R0 * R0
        ST R0, [RESULT10]       ; Expected: 144 (0x90)

        HLT                     ; Stop execution

; ========================================
; SUBROUTINES
; ========================================

; MUL_SIMPLE: Simple multiplication using repeated addition
; Input: R0 = multiplicand, R1 = multiplier
; Output: R0 = product (8-bit, overflow ignored)
; Destroys: R1, R2
MUL_SIMPLE:
        PUSH R2                 ; Save R2
        MOV R2, R0              ; R2 = multiplicand
        LDI R0, 0               ; R0 = product = 0

MUL_SIMPLE_LOOP:
        OR R1, R1               ; Test multiplier
        JZ MUL_SIMPLE_DONE      ; If zero, done
        ADD R0, R2              ; product += multiplicand
        DEC R1                  ; multiplier--
        JMP MUL_SIMPLE_LOOP

MUL_SIMPLE_DONE:
        POP R2                  ; Restore R2
        RET

; MUL_SHIFT_ADD: Efficient multiplication using shift-and-add
; Input: R0 = multiplicand, R1 = multiplier
; Output: R0 = product (8-bit, overflow ignored)
; Algorithm: For each bit in multiplier, if set, add shifted multiplicand
; Destroys: R1, R2, R3
MUL_SHIFT_ADD:
        PUSH R2
        PUSH R3

        MOV R2, R0              ; R2 = multiplicand (will be shifted)
        LDI R0, 0               ; R0 = product = 0
        LDI R3, 8               ; R3 = bit counter (8 bits)

MUL_SHIFT_LOOP:
        ; Check if least significant bit of multiplier is set
        MOV R4, R1              ; Copy multiplier
        ANDI R4, 0x01           ; Mask LSB
        JZ MUL_SHIFT_SKIP       ; If bit is 0, skip addition
        ADD R0, R2              ; product += shifted multiplicand

MUL_SHIFT_SKIP:
        SHL R2                  ; Shift multiplicand left
        SHR R1                  ; Shift multiplier right
        DEC R3                  ; Decrement bit counter
        JRNZ MUL_SHIFT_LOOP     ; Continue if bits remaining

        POP R3
        POP R2
        RET

; MUL_16BIT: 8x8 multiplication with 16-bit result
; Input: R0 = multiplicand, R1 = multiplier
; Output: R1:R0 = 16-bit product (R1=high, R0=low)
; Algorithm: Shift-and-add with carry propagation
; Destroys: R2, R3, R4
MUL_16BIT:
        PUSH R2
        PUSH R3
        PUSH R4
        PUSH R5

        MOV R2, R0              ; R2 = multiplicand (low, will shift)
        LDI R3, 0               ; R3 = multiplicand high (starts at 0)
        MOV R4, R1              ; R4 = multiplier
        LDI R0, 0               ; R0 = product low
        LDI R1, 0               ; R1 = product high
        LDI R5, 8               ; R5 = bit counter

MUL_16BIT_LOOP:
        ; Check LSB of multiplier
        MOV R6, R4              ; Use R6 temporarily
        ANDI R6, 0x01
        JZ MUL_16BIT_SKIP

        ; Add 16-bit multiplicand to 16-bit product
        ADD R0, R2              ; Add low bytes
        JNC MUL_16BIT_NO_CARRY1
        INC R1                  ; Carry to high byte
MUL_16BIT_NO_CARRY1:
        ADD R1, R3              ; Add high bytes

MUL_16BIT_SKIP:
        ; Shift multiplicand left (16-bit)
        SHL R2                  ; Shift low byte, C = MSB
        ROL R3                  ; Rotate high byte, brings in carry

        ; Shift multiplier right
        SHR R4

        DEC R5                  ; Decrement counter
        JRNZ MUL_16BIT_LOOP

        POP R5
        POP R4
        POP R3
        POP R2
        RET

; SQUARE: Calculate R0 = R0 * R0
; Input: R0 = value
; Output: R0 = square (8-bit)
; Destroys: R1
SQUARE:
        MOV R1, R0              ; R1 = copy of value
        CALL MUL_SHIFT_ADD      ; R0 = R0 * R1
        RET

; Data section
        .org 0x0300
RESULT1:      .db 0             ; Expected: 0x0C (12)
RESULT2:      .db 0             ; Expected: 0x38 (56)
RESULT3:      .db 0             ; Expected: 0x2A (42)
RESULT4:      .db 0             ; Expected: 0xE1 (225)
RESULT5_L:    .db 0             ; Expected: 0x58 (low of 600)
RESULT5_H:    .db 0             ; Expected: 0x02 (high of 600)
RESULT6_L:    .db 0             ; Expected: 0x01 (low of 65025)
RESULT6_H:    .db 0             ; Expected: 0xFE (high of 65025)
RESULT7:      .db 0             ; Expected: 0x00 (0)
RESULT8:      .db 0             ; Expected: 0x7B (123)
RESULT9:      .db 0             ; Expected: 0x28 (40)
RESULT10:     .db 0             ; Expected: 0x90 (144)
