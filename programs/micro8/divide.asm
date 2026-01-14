; divide.asm - 8-bit division routines
; Demonstrates unsigned integer division:
;   1. Repeated subtraction (simple, slow)
;   2. Shift-and-subtract (efficient, standard)
;   3. Division with remainder (modulo)
;
; Micro8 Architecture Test Program

        .org 0x0200             ; Start after reserved area

START:
        ; Initialize stack pointer
        LDI16 SP, 0x01FD        ; SP = top of stack

        ; ===== Test 1: Simple 12 / 4 = 3 =====
        LDI R0, 12              ; Dividend
        LDI R1, 4               ; Divisor
        CALL DIV_SIMPLE         ; R0 = quotient, R1 = remainder
        ST R0, [RESULT1_Q]      ; Expected: 3
        ST R1, [RESULT1_R]      ; Expected: 0

        ; ===== Test 2: 17 / 5 = 3 remainder 2 =====
        LDI R0, 17              ; Dividend
        LDI R1, 5               ; Divisor
        CALL DIV_SIMPLE
        ST R0, [RESULT2_Q]      ; Expected: 3
        ST R1, [RESULT2_R]      ; Expected: 2

        ; ===== Test 3: 100 / 10 = 10 =====
        LDI R0, 100
        LDI R1, 10
        CALL DIV_SHIFT          ; Use efficient algorithm
        ST R0, [RESULT3_Q]      ; Expected: 10 (0x0A)
        ST R1, [RESULT3_R]      ; Expected: 0

        ; ===== Test 4: 255 / 16 = 15 remainder 15 =====
        LDI R0, 255
        LDI R1, 16
        CALL DIV_SHIFT
        ST R0, [RESULT4_Q]      ; Expected: 15 (0x0F)
        ST R1, [RESULT4_R]      ; Expected: 15 (0x0F)

        ; ===== Test 5: Division by 1 =====
        LDI R0, 42
        LDI R1, 1
        CALL DIV_SIMPLE
        ST R0, [RESULT5_Q]      ; Expected: 42 (0x2A)
        ST R1, [RESULT5_R]      ; Expected: 0

        ; ===== Test 6: Dividend smaller than divisor =====
        LDI R0, 3               ; Dividend
        LDI R1, 10              ; Divisor (larger)
        CALL DIV_SIMPLE
        ST R0, [RESULT6_Q]      ; Expected: 0
        ST R1, [RESULT6_R]      ; Expected: 3

        ; ===== Test 7: Division by zero (returns max/original) =====
        LDI R0, 50
        LDI R1, 0
        CALL DIV_SAFE           ; Safe division handles div-by-zero
        ST R0, [RESULT7_Q]      ; Expected: 0xFF (error indicator)
        ST R1, [RESULT7_R]      ; Expected: 0xFF (error indicator)

        ; ===== Test 8: Modulo operation =====
        LDI R0, 23
        LDI R1, 7
        CALL MOD                ; R0 = R0 % R1
        ST R0, [RESULT8]        ; Expected: 2 (23 % 7 = 2)

        ; ===== Test 9: Power of 2 division (optimization test) =====
        LDI R0, 200
        LDI R1, 8               ; 8 = 2^3
        CALL DIV_SHIFT
        ST R0, [RESULT9_Q]      ; Expected: 25 (0x19)
        ST R1, [RESULT9_R]      ; Expected: 0

        ; ===== Test 10: Large division 240 / 15 = 16 =====
        LDI R0, 240
        LDI R1, 15
        CALL DIV_SHIFT
        ST R0, [RESULT10_Q]     ; Expected: 16 (0x10)
        ST R1, [RESULT10_R]     ; Expected: 0

        ; ===== Test 11: GCD calculation using repeated division =====
        LDI R0, 48              ; First number
        LDI R1, 18              ; Second number
        CALL GCD                ; R0 = GCD(48, 18)
        ST R0, [RESULT11]       ; Expected: 6

        HLT                     ; Stop execution

; ========================================
; SUBROUTINES
; ========================================

; DIV_SIMPLE: Simple division using repeated subtraction
; Input: R0 = dividend, R1 = divisor
; Output: R0 = quotient, R1 = remainder
; Destroys: R2
DIV_SIMPLE:
        ; Check for division by zero
        CMPI R1, 0
        JZ DIV_SIMPLE_ERROR

        PUSH R2
        MOV R2, R1              ; R2 = divisor (save)
        LDI R1, 0               ; R1 = quotient counter

DIV_SIMPLE_LOOP:
        CMP R0, R2              ; Compare dividend with divisor
        JC DIV_SIMPLE_DONE      ; If dividend < divisor, done
        SUB R0, R2              ; dividend -= divisor
        INC R1                  ; quotient++
        JMP DIV_SIMPLE_LOOP

DIV_SIMPLE_DONE:
        ; R0 = remainder, R1 = quotient
        ; Swap so R0 = quotient, R1 = remainder
        MOV R2, R0              ; R2 = remainder
        MOV R0, R1              ; R0 = quotient
        MOV R1, R2              ; R1 = remainder
        POP R2
        RET

DIV_SIMPLE_ERROR:
        LDI R0, 0xFF            ; Error: quotient = max
        LDI R1, 0xFF            ; Error: remainder = max
        RET

; DIV_SHIFT: Efficient division using shift-and-subtract
; Input: R0 = dividend, R1 = divisor
; Output: R0 = quotient, R1 = remainder
; Algorithm: Binary long division
; Destroys: R2, R3, R4
DIV_SHIFT:
        ; Check for division by zero
        CMPI R1, 0
        JZ DIV_SHIFT_ERROR

        PUSH R2
        PUSH R3
        PUSH R4

        MOV R2, R1              ; R2 = divisor
        LDI R1, 0               ; R1 = quotient
        LDI R3, 0               ; R3 = remainder
        LDI R4, 8               ; R4 = bit counter

DIV_SHIFT_LOOP:
        ; Shift remainder left, bring in MSB of dividend
        SHL R3                  ; Shift remainder left
        ; Get MSB of dividend
        MOV R5, R0
        ANDI R5, 0x80           ; Mask MSB
        JZ DIV_SHIFT_NO_BIT
        ORI R3, 0x01            ; Set LSB of remainder
DIV_SHIFT_NO_BIT:
        SHL R0                  ; Shift dividend left

        ; Shift quotient left
        SHL R1

        ; Compare remainder with divisor
        CMP R3, R2
        JC DIV_SHIFT_SKIP       ; If remainder < divisor, skip
        SUB R3, R2              ; remainder -= divisor
        ORI R1, 0x01            ; Set LSB of quotient

DIV_SHIFT_SKIP:
        DEC R4
        JRNZ DIV_SHIFT_LOOP

        ; R1 = quotient, R3 = remainder
        MOV R0, R1              ; R0 = quotient
        MOV R1, R3              ; R1 = remainder

        POP R4
        POP R3
        POP R2
        RET

DIV_SHIFT_ERROR:
        LDI R0, 0xFF
        LDI R1, 0xFF
        RET

; DIV_SAFE: Safe division that handles edge cases
; Input: R0 = dividend, R1 = divisor
; Output: R0 = quotient, R1 = remainder (0xFF,0xFF on error)
DIV_SAFE:
        ; Check for division by zero
        CMPI R1, 0
        JZ DIV_SAFE_ERROR

        ; Use efficient division
        JMP DIV_SHIFT

DIV_SAFE_ERROR:
        LDI R0, 0xFF
        LDI R1, 0xFF
        RET

; MOD: Modulo operation (remainder only)
; Input: R0 = dividend, R1 = divisor
; Output: R0 = remainder
MOD:
        CALL DIV_SHIFT          ; R0 = quotient, R1 = remainder
        MOV R0, R1              ; R0 = remainder
        RET

; GCD: Greatest Common Divisor using Euclidean algorithm
; Input: R0 = first number, R1 = second number
; Output: R0 = GCD
; Algorithm: GCD(a,b) = GCD(b, a mod b) until b = 0
GCD:
        PUSH R2
        PUSH R3

GCD_LOOP:
        ; If R1 = 0, R0 is the GCD
        CMPI R1, 0
        JZ GCD_DONE

        ; R2 = R0 mod R1
        PUSH R0
        PUSH R1
        CALL MOD                ; R0 = R0 mod R1
        MOV R2, R0              ; R2 = remainder
        POP R1
        POP R0

        ; a = b, b = remainder
        MOV R0, R1              ; R0 = old R1
        MOV R1, R2              ; R1 = remainder
        JMP GCD_LOOP

GCD_DONE:
        POP R3
        POP R2
        RET

; Data section
        .org 0x0500
RESULT1_Q:    .db 0             ; Expected: 0x03 (3)
RESULT1_R:    .db 0             ; Expected: 0x00 (0)
RESULT2_Q:    .db 0             ; Expected: 0x03 (3)
RESULT2_R:    .db 0             ; Expected: 0x02 (2)
RESULT3_Q:    .db 0             ; Expected: 0x0A (10)
RESULT3_R:    .db 0             ; Expected: 0x00 (0)
RESULT4_Q:    .db 0             ; Expected: 0x0F (15)
RESULT4_R:    .db 0             ; Expected: 0x0F (15)
RESULT5_Q:    .db 0             ; Expected: 0x2A (42)
RESULT5_R:    .db 0             ; Expected: 0x00 (0)
RESULT6_Q:    .db 0             ; Expected: 0x00 (0)
RESULT6_R:    .db 0             ; Expected: 0x03 (3)
RESULT7_Q:    .db 0             ; Expected: 0xFF (error)
RESULT7_R:    .db 0             ; Expected: 0xFF (error)
RESULT8:      .db 0             ; Expected: 0x02 (2)
RESULT9_Q:    .db 0             ; Expected: 0x19 (25)
RESULT9_R:    .db 0             ; Expected: 0x00 (0)
RESULT10_Q:   .db 0             ; Expected: 0x10 (16)
RESULT10_R:   .db 0             ; Expected: 0x00 (0)
RESULT11:     .db 0             ; Expected: 0x06 (6 = GCD(48,18))
