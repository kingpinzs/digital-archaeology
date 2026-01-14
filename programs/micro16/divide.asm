; divide.asm - Test hardware divide instructions for Micro16
; Tests: DIV (unsigned), IDIV (signed)
; Tests: 32/16 -> 16 bit quotient and remainder
;
; Micro16 Architecture Test Program
; - DIV/IDIV take 32-bit dividend in DX:AX
; - Divisor is 16-bit register
; - Quotient in AX, remainder in DX

        .org 0x0100             ; Default PC start location

START:
        ; ===== Test 1: DIV - Simple unsigned divide =====
        MOV DX, #0              ; High word = 0
        MOV AX, #100            ; Low word = 100
        MOV BX, #10             ; Divisor = 10
        DIV AX, BX              ; 100 / 10 = 10 remainder 0
        ST AX, [DIV_SIMPLE_Q]   ; Quotient: 10 (0x000A)
        ST DX, [DIV_SIMPLE_R]   ; Remainder: 0 (0x0000)

        ; ===== Test 2: DIV - With remainder =====
        MOV DX, #0
        MOV AX, #107            ; 107
        MOV BX, #10             ; Divisor = 10
        DIV AX, BX              ; 107 / 10 = 10 remainder 7
        ST AX, [DIV_REM_Q]      ; Quotient: 10
        ST DX, [DIV_REM_R]      ; Remainder: 7

        ; ===== Test 3: DIV - Larger dividend (32-bit) =====
        MOV DX, #0x0001         ; High word = 1
        MOV AX, #0x0000         ; Low word = 0, so DX:AX = 65536
        MOV BX, #256            ; Divisor
        DIV AX, BX              ; 65536 / 256 = 256 remainder 0
        ST AX, [DIV_32_Q]       ; Quotient: 256 (0x0100)
        ST DX, [DIV_32_R]       ; Remainder: 0

        ; ===== Test 4: DIV - Large dividend with remainder =====
        MOV DX, #0x0001         ; High word = 1
        MOV AX, #0x0003         ; Low word = 3, so DX:AX = 65539
        MOV BX, #1000           ; Divisor
        DIV AX, BX              ; 65539 / 1000 = 65 remainder 539
        ST AX, [DIV_LR_Q]       ; Quotient: 65 (0x0041)
        ST DX, [DIV_LR_R]       ; Remainder: 539 (0x021B)

        ; ===== Test 5: DIV - By one =====
        MOV DX, #0
        MOV AX, #12345
        MOV BX, #1
        DIV AX, BX              ; 12345 / 1 = 12345 remainder 0
        ST AX, [DIV_ONE_Q]      ; Quotient: 12345 (0x3039)
        ST DX, [DIV_ONE_R]      ; Remainder: 0

        ; ===== Test 6: DIV - Divisor larger than dividend =====
        MOV DX, #0
        MOV AX, #5              ; Dividend = 5
        MOV BX, #10             ; Divisor = 10
        DIV AX, BX              ; 5 / 10 = 0 remainder 5
        ST AX, [DIV_SMALL_Q]    ; Quotient: 0
        ST DX, [DIV_SMALL_R]    ; Remainder: 5

        ; ===== Test 7: DIV - Maximum unsigned values =====
        MOV DX, #0
        MOV AX, #0xFFFF         ; 65535
        MOV BX, #0xFFFF         ; 65535
        DIV AX, BX              ; 65535 / 65535 = 1 remainder 0
        ST AX, [DIV_MAX_Q]      ; Quotient: 1
        ST DX, [DIV_MAX_R]      ; Remainder: 0

        ; ===== Test 8: DIV - Power of 2 (compare with shift) =====
        MOV DX, #0
        MOV AX, #0x0100         ; 256
        MOV BX, #4              ; Divisor = 4
        DIV AX, BX              ; 256 / 4 = 64 remainder 0
        ST AX, [DIV_POW2_Q]     ; Quotient: 64 (0x0040)
        ST DX, [DIV_POW2_R]     ; Remainder: 0

        ; ===== Test 9: IDIV - Positive / Positive =====
        MOV DX, #0
        MOV AX, #100            ; +100
        MOV BX, #10             ; +10
        IDIV AX, BX             ; 100 / 10 = 10 remainder 0
        ST AX, [IDIV_PP_Q]      ; Quotient: 10
        ST DX, [IDIV_PP_R]      ; Remainder: 0

        ; ===== Test 10: IDIV - Negative / Positive =====
        MOV DX, #0xFFFF         ; Sign extend -100
        MOV AX, #0xFF9C         ; -100 (two's complement)
        MOV BX, #10             ; +10
        IDIV AX, BX             ; (-100) / 10 = -10 remainder 0
        ST AX, [IDIV_NP_Q]      ; Quotient: -10 (0xFFF6)
        ST DX, [IDIV_NP_R]      ; Remainder: 0

        ; ===== Test 11: IDIV - Positive / Negative =====
        MOV DX, #0
        MOV AX, #100            ; +100
        MOV BX, #0xFFF6         ; -10
        IDIV AX, BX             ; 100 / (-10) = -10 remainder 0
        ST AX, [IDIV_PN_Q]      ; Quotient: -10 (0xFFF6)
        ST DX, [IDIV_PN_R]      ; Remainder: 0

        ; ===== Test 12: IDIV - Negative / Negative =====
        MOV DX, #0xFFFF
        MOV AX, #0xFF9C         ; -100
        MOV BX, #0xFFF6         ; -10
        IDIV AX, BX             ; (-100) / (-10) = +10 remainder 0
        ST AX, [IDIV_NN_Q]      ; Quotient: 10
        ST DX, [IDIV_NN_R]      ; Remainder: 0

        ; ===== Test 13: IDIV - With signed remainder =====
        MOV DX, #0xFFFF
        MOV AX, #0xFF9B         ; -101
        MOV BX, #10             ; +10
        IDIV AX, BX             ; (-101) / 10 = -10 remainder -1
        ST AX, [IDIV_SR_Q]      ; Quotient: -10 (0xFFF6)
        ST DX, [IDIV_SR_R]      ; Remainder: -1 (0xFFFF)

        ; ===== Test 14: IDIV - Positive with remainder =====
        MOV DX, #0
        MOV AX, #107            ; +107
        MOV BX, #10             ; +10
        IDIV AX, BX             ; 107 / 10 = 10 remainder 7
        ST AX, [IDIV_PR_Q]      ; Quotient: 10
        ST DX, [IDIV_PR_R]      ; Remainder: 7

        ; ===== Test 15: DIV vs IDIV comparison =====
        ; For 0xFFFF:
        ; - Unsigned: 65535 / 2 = 32767 remainder 1
        ; - Signed: (-1) / 2 = 0 remainder -1
        MOV DX, #0
        MOV AX, #0xFFFF
        MOV BX, #2
        DIV AX, BX              ; Unsigned
        ST AX, [DIV_VS_Q]       ; Quotient: 32767 (0x7FFF)
        ST DX, [DIV_VS_R]       ; Remainder: 1

        MOV DX, #0xFFFF         ; Sign extend -1
        MOV AX, #0xFFFF         ; -1
        MOV BX, #2
        IDIV AX, BX             ; Signed
        ST AX, [IDIV_VS_Q]      ; Quotient: 0
        ST DX, [IDIV_VS_R]      ; Remainder: -1 (0xFFFF)

        ; ===== Test 16: Division in loop (compute powers) =====
        ; Start with 1000, divide by 10 until < 10
        MOV AX, #10000          ; Starting value
        MOV BX, #10             ; Divisor
        MOV CX, #0              ; Count divisions
DIV_LOOP:
        CMP AX, #10
        JL DIV_LOOP_DONE
        MOV DX, #0              ; Clear high word
        DIV AX, BX              ; AX = AX / 10
        INC CX
        JMP DIV_LOOP
DIV_LOOP_DONE:
        ST CX, [DIV_COUNT]      ; Store: 4 (10000 -> 1000 -> 100 -> 10 -> 1)
        ST AX, [DIV_FINAL]      ; Store: 1

        ; ===== Test 17: Modulo operation (remainder only) =====
        ; Compute 12345 mod 100
        MOV DX, #0
        MOV AX, #12345
        MOV BX, #100
        DIV AX, BX
        ST DX, [MOD_RESULT]     ; Remainder: 45 (0x002D)

        ; ===== Test 18: Even/odd check using modulo =====
        MOV DX, #0
        MOV AX, #12345          ; Odd number
        MOV BX, #2
        DIV AX, BX
        ST DX, [ODD_CHECK]      ; Remainder: 1 (odd)

        MOV DX, #0
        MOV AX, #12346          ; Even number
        MOV BX, #2
        DIV AX, BX
        ST DX, [EVEN_CHECK]     ; Remainder: 0 (even)

        ; ===== Final verification =====
        MOV AX, #0xCAFE
        ST AX, [FINAL_RESULT]

        HLT                     ; Stop execution

; Data section
        .org 0x0500

; Simple DIV results
DIV_SIMPLE_Q:  .dw 0            ; Expected: 0x000A (10)
DIV_SIMPLE_R:  .dw 0            ; Expected: 0x0000

; DIV with remainder
DIV_REM_Q:     .dw 0            ; Expected: 0x000A (10)
DIV_REM_R:     .dw 0            ; Expected: 0x0007 (7)

; 32-bit dividend
DIV_32_Q:      .dw 0            ; Expected: 0x0100 (256)
DIV_32_R:      .dw 0            ; Expected: 0x0000

; Large with remainder
DIV_LR_Q:      .dw 0            ; Expected: 0x0041 (65)
DIV_LR_R:      .dw 0            ; Expected: 0x021B (539)

; Divide by one
DIV_ONE_Q:     .dw 0            ; Expected: 0x3039 (12345)
DIV_ONE_R:     .dw 0            ; Expected: 0x0000

; Small dividend
DIV_SMALL_Q:   .dw 0            ; Expected: 0x0000
DIV_SMALL_R:   .dw 0            ; Expected: 0x0005

; Maximum values
DIV_MAX_Q:     .dw 0            ; Expected: 0x0001
DIV_MAX_R:     .dw 0            ; Expected: 0x0000

; Power of 2
DIV_POW2_Q:    .dw 0            ; Expected: 0x0040 (64)
DIV_POW2_R:    .dw 0            ; Expected: 0x0000

; IDIV positive/positive
IDIV_PP_Q:     .dw 0            ; Expected: 0x000A (10)
IDIV_PP_R:     .dw 0            ; Expected: 0x0000

; IDIV negative/positive
IDIV_NP_Q:     .dw 0            ; Expected: 0xFFF6 (-10)
IDIV_NP_R:     .dw 0            ; Expected: 0x0000

; IDIV positive/negative
IDIV_PN_Q:     .dw 0            ; Expected: 0xFFF6 (-10)
IDIV_PN_R:     .dw 0            ; Expected: 0x0000

; IDIV negative/negative
IDIV_NN_Q:     .dw 0            ; Expected: 0x000A (10)
IDIV_NN_R:     .dw 0            ; Expected: 0x0000

; IDIV signed remainder
IDIV_SR_Q:     .dw 0            ; Expected: 0xFFF6 (-10)
IDIV_SR_R:     .dw 0            ; Expected: 0xFFFF (-1)

; IDIV positive remainder
IDIV_PR_Q:     .dw 0            ; Expected: 0x000A (10)
IDIV_PR_R:     .dw 0            ; Expected: 0x0007 (7)

; DIV vs IDIV comparison
DIV_VS_Q:      .dw 0            ; Expected: 0x7FFF (32767)
DIV_VS_R:      .dw 0            ; Expected: 0x0001
IDIV_VS_Q:     .dw 0            ; Expected: 0x0000
IDIV_VS_R:     .dw 0            ; Expected: 0xFFFF (-1)

; Division loop
DIV_COUNT:     .dw 0            ; Expected: 0x0004 (4 divisions)
DIV_FINAL:     .dw 0            ; Expected: 0x0001

; Modulo result
MOD_RESULT:    .dw 0            ; Expected: 0x002D (45)

; Even/odd check
ODD_CHECK:     .dw 0            ; Expected: 0x0001 (odd)
EVEN_CHECK:    .dw 0            ; Expected: 0x0000 (even)

FINAL_RESULT:  .dw 0            ; Expected: 0xCAFE (success)

; Division instruction notes:
;
; DIV (unsigned divide):
;   DIV Rd, Rs
;   - Divides DX:AX (32-bit) by Rs (16-bit)
;   - Quotient in AX, Remainder in DX
;   - Division by zero generates INT 0
;   - Overflow (quotient > 16 bits) generates INT 0
;
; IDIV (signed divide):
;   IDIV Rd, Rs
;   - Same as DIV but treats operands as signed
;   - Quotient truncated toward zero
;   - Remainder has same sign as dividend
;
; Important considerations:
;   - Always clear DX before dividing 16-bit value!
;   - For signed division, sign-extend AX into DX
;   - Division by zero is undefined (hardware trap)
;   - Overflow possible if DX:AX / Rs > 0xFFFF
;
; Common patterns:
;   - Modulo: use DX after DIV
;   - Even/odd: DIV by 2, check remainder
;   - Digit extraction: DIV by 10 repeatedly
;   - Fixed-point: DIV to convert fractions
;
; Signed remainder rules:
;   - Remainder has same sign as dividend
;   - (-7) / 2 = -3 remainder -1
;   - 7 / (-2) = -3 remainder 1
;   - (-7) / (-2) = 3 remainder -1
