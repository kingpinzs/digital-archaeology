; multiply.asm - Test hardware multiply instructions for Micro16
; Tests: MUL (unsigned), IMUL (signed)
; Tests: 16x16 -> 32 bit results in DX:AX
;
; Micro16 Architecture Test Program
; - MUL/IMUL perform 16-bit multiplication
; - Result is 32 bits stored in DX (high) : AX (low)

        .org 0x0100             ; Default PC start location

START:
        ; ===== Test 1: MUL - Simple unsigned multiply =====
        MOV AX, #10             ; Multiplicand = 10
        MOV BX, #5              ; Multiplier = 5
        MUL AX, BX              ; AX = 10 * 5 = 50, DX = 0
        ST AX, [MUL_SIMPLE_LO]  ; Store: 0x0032 (50)
        ST DX, [MUL_SIMPLE_HI]  ; Store: 0x0000

        ; ===== Test 2: MUL - Larger numbers (no overflow) =====
        MOV AX, #1000           ; 1000
        MOV BX, #50             ; 50
        MUL AX, BX              ; 1000 * 50 = 50000
        ST AX, [MUL_LARGE_LO]   ; Store: 0xC350 (50000)
        ST DX, [MUL_LARGE_HI]   ; Store: 0x0000

        ; ===== Test 3: MUL - Result exceeds 16 bits =====
        MOV AX, #1000           ; 1000
        MOV BX, #1000           ; 1000
        MUL AX, BX              ; 1000 * 1000 = 1,000,000 = 0x000F4240
        ST AX, [MUL_OVER_LO]    ; Store: 0x4240 (low word)
        ST DX, [MUL_OVER_HI]    ; Store: 0x000F (high word)

        ; ===== Test 4: MUL - Maximum values =====
        MOV AX, #0xFFFF         ; 65535
        MOV BX, #0xFFFF         ; 65535
        MUL AX, BX              ; 65535 * 65535 = 4,294,836,225 = 0xFFFE0001
        ST AX, [MUL_MAX_LO]     ; Store: 0x0001
        ST DX, [MUL_MAX_HI]     ; Store: 0xFFFE

        ; ===== Test 5: MUL - By zero =====
        MOV AX, #12345          ; Any number
        MOV BX, #0              ; Zero
        MUL AX, BX              ; 12345 * 0 = 0
        ST AX, [MUL_ZERO_LO]    ; Store: 0x0000
        ST DX, [MUL_ZERO_HI]    ; Store: 0x0000

        ; ===== Test 6: MUL - By one =====
        MOV AX, #0xABCD         ; 43981
        MOV BX, #1              ; One
        MUL AX, BX              ; 43981 * 1 = 43981
        ST AX, [MUL_ONE_LO]     ; Store: 0xABCD
        ST DX, [MUL_ONE_HI]     ; Store: 0x0000

        ; ===== Test 7: MUL - Power of 2 (should match shift) =====
        MOV AX, #0x0100         ; 256
        MOV BX, #0x0100         ; 256
        MUL AX, BX              ; 256 * 256 = 65536 = 0x00010000
        ST AX, [MUL_POW2_LO]    ; Store: 0x0000
        ST DX, [MUL_POW2_HI]    ; Store: 0x0001

        ; ===== Test 8: IMUL - Simple signed multiply (positive * positive) =====
        MOV AX, #10             ; +10
        MOV BX, #5              ; +5
        IMUL AX, BX             ; 10 * 5 = 50
        ST AX, [IMUL_PP_LO]     ; Store: 0x0032 (50)
        ST DX, [IMUL_PP_HI]     ; Store: 0x0000

        ; ===== Test 9: IMUL - Positive * Negative =====
        MOV AX, #10             ; +10
        MOV BX, #0xFFFB         ; -5 (two's complement)
        IMUL AX, BX             ; 10 * (-5) = -50 = 0xFFFFFFCE
        ST AX, [IMUL_PN_LO]     ; Store: 0xFFCE (-50 low)
        ST DX, [IMUL_PN_HI]     ; Store: 0xFFFF (sign extension)

        ; ===== Test 10: IMUL - Negative * Positive =====
        MOV AX, #0xFFF6         ; -10
        MOV BX, #5              ; +5
        IMUL AX, BX             ; (-10) * 5 = -50 = 0xFFFFFFCE
        ST AX, [IMUL_NP_LO]     ; Store: 0xFFCE
        ST DX, [IMUL_NP_HI]     ; Store: 0xFFFF

        ; ===== Test 11: IMUL - Negative * Negative =====
        MOV AX, #0xFFF6         ; -10
        MOV BX, #0xFFFB         ; -5
        IMUL AX, BX             ; (-10) * (-5) = +50 = 0x00000032
        ST AX, [IMUL_NN_LO]     ; Store: 0x0032
        ST DX, [IMUL_NN_HI]     ; Store: 0x0000

        ; ===== Test 12: IMUL - Large negative result =====
        MOV AX, #0x8000         ; -32768 (minimum signed 16-bit)
        MOV BX, #2              ; 2
        IMUL AX, BX             ; -32768 * 2 = -65536 = 0xFFFF0000
        ST AX, [IMUL_LN_LO]     ; Store: 0x0000
        ST DX, [IMUL_LN_HI]     ; Store: 0xFFFF

        ; ===== Test 13: IMUL - Maximum positive signed =====
        MOV AX, #0x7FFF         ; +32767 (maximum signed 16-bit)
        MOV BX, #2              ; 2
        IMUL AX, BX             ; 32767 * 2 = 65534 = 0x0000FFFE
        ST AX, [IMUL_MP_LO]     ; Store: 0xFFFE
        ST DX, [IMUL_MP_HI]     ; Store: 0x0000

        ; ===== Test 14: IMUL - Zero with negative =====
        MOV AX, #0              ; 0
        MOV BX, #0xFFFF         ; -1
        IMUL AX, BX             ; 0 * (-1) = 0
        ST AX, [IMUL_ZN_LO]     ; Store: 0x0000
        ST DX, [IMUL_ZN_HI]     ; Store: 0x0000

        ; ===== Test 15: Verify MUL vs IMUL difference =====
        ; For unsigned interpretation:
        ; 0xFFFF = 65535, 0xFFFF * 0x0002 = 131070 = 0x0001FFFE
        ; For signed interpretation:
        ; 0xFFFF = -1, (-1) * 2 = -2 = 0xFFFFFFFE
        MOV AX, #0xFFFF
        MOV BX, #2
        MUL AX, BX              ; Unsigned: 65535 * 2 = 131070
        ST AX, [MUL_VS_LO]      ; Store: 0xFFFE
        ST DX, [MUL_VS_HI]      ; Store: 0x0001

        MOV AX, #0xFFFF
        MOV BX, #2
        IMUL AX, BX             ; Signed: (-1) * 2 = -2
        ST AX, [IMUL_VS_LO]     ; Store: 0xFFFE
        ST DX, [IMUL_VS_HI]     ; Store: 0xFFFF

        ; ===== Test 16: Multiply loop (compute factorial) =====
        ; Compute 6! = 720
        MOV CX, #6              ; Counter
        MOV AX, #1              ; Accumulator
FACT_LOOP:
        MOV BX, CX              ; Multiplier = counter
        MUL AX, BX              ; AX = AX * CX (ignore DX for small numbers)
        DEC CX
        JNZ FACT_LOOP
        ST AX, [FACTORIAL]      ; Store: 0x02D0 (720 = 6!)

        ; ===== Test 17: Multiply for array index scaling =====
        ; array[i] where element size is 10 bytes
        ; Address = base + i * 10
        MOV AX, #5              ; Index i = 5
        MOV BX, #10             ; Element size
        MUL AX, BX              ; Offset = 50
        ADD AX, #0x1000         ; Base address
        ST AX, [ARRAY_ADDR]     ; Store: 0x1032 (0x1000 + 50)

        ; ===== Test 18: 32x32 multiply using 16-bit ops (demo) =====
        ; Multiply 0x00010000 * 0x00000002 = 0x00020000
        ; We can only show the concept here with 16-bit values
        ; High word * Low word contributions
        MOV AX, #0x0001         ; High word of first number
        MOV BX, #0x0002         ; Low word of second number
        MUL AX, BX              ; 1 * 2 = 2 (this is partial result for high*low)
        ST AX, [MUL32_DEMO]     ; Store: 0x0002

        ; ===== Final verification =====
        MOV AX, #0xCAFE
        ST AX, [FINAL_RESULT]

        HLT                     ; Stop execution

; Data section
        .org 0x0500

; Simple MUL results
MUL_SIMPLE_LO: .dw 0            ; Expected: 0x0032 (50)
MUL_SIMPLE_HI: .dw 0            ; Expected: 0x0000

; Large MUL results
MUL_LARGE_LO:  .dw 0            ; Expected: 0xC350 (50000)
MUL_LARGE_HI:  .dw 0            ; Expected: 0x0000

; Overflow MUL results
MUL_OVER_LO:   .dw 0            ; Expected: 0x4240
MUL_OVER_HI:   .dw 0            ; Expected: 0x000F

; Maximum MUL results
MUL_MAX_LO:    .dw 0            ; Expected: 0x0001
MUL_MAX_HI:    .dw 0            ; Expected: 0xFFFE

; Zero MUL results
MUL_ZERO_LO:   .dw 0            ; Expected: 0x0000
MUL_ZERO_HI:   .dw 0            ; Expected: 0x0000

; Multiply by one
MUL_ONE_LO:    .dw 0            ; Expected: 0xABCD
MUL_ONE_HI:    .dw 0            ; Expected: 0x0000

; Power of 2 multiply
MUL_POW2_LO:   .dw 0            ; Expected: 0x0000
MUL_POW2_HI:   .dw 0            ; Expected: 0x0001

; IMUL positive * positive
IMUL_PP_LO:    .dw 0            ; Expected: 0x0032 (50)
IMUL_PP_HI:    .dw 0            ; Expected: 0x0000

; IMUL positive * negative
IMUL_PN_LO:    .dw 0            ; Expected: 0xFFCE (-50)
IMUL_PN_HI:    .dw 0            ; Expected: 0xFFFF

; IMUL negative * positive
IMUL_NP_LO:    .dw 0            ; Expected: 0xFFCE
IMUL_NP_HI:    .dw 0            ; Expected: 0xFFFF

; IMUL negative * negative
IMUL_NN_LO:    .dw 0            ; Expected: 0x0032 (50)
IMUL_NN_HI:    .dw 0            ; Expected: 0x0000

; IMUL large negative
IMUL_LN_LO:    .dw 0            ; Expected: 0x0000
IMUL_LN_HI:    .dw 0            ; Expected: 0xFFFF

; IMUL max positive
IMUL_MP_LO:    .dw 0            ; Expected: 0xFFFE
IMUL_MP_HI:    .dw 0            ; Expected: 0x0000

; IMUL zero with negative
IMUL_ZN_LO:    .dw 0            ; Expected: 0x0000
IMUL_ZN_HI:    .dw 0            ; Expected: 0x0000

; MUL vs IMUL comparison
MUL_VS_LO:     .dw 0            ; Expected: 0xFFFE
MUL_VS_HI:     .dw 0            ; Expected: 0x0001 (unsigned)
IMUL_VS_LO:    .dw 0            ; Expected: 0xFFFE
IMUL_VS_HI:    .dw 0            ; Expected: 0xFFFF (signed)

; Factorial result
FACTORIAL:     .dw 0            ; Expected: 0x02D0 (720)

; Array address calculation
ARRAY_ADDR:    .dw 0            ; Expected: 0x1032

; 32-bit multiply demo
MUL32_DEMO:    .dw 0            ; Expected: 0x0002

FINAL_RESULT:  .dw 0            ; Expected: 0xCAFE (success)

; Multiply instruction notes:
;
; MUL (unsigned multiply):
;   MUL Rd, Rs
;   - Multiplies Rd by Rs (both treated as unsigned)
;   - 32-bit result stored in DX:AX (DX = high, AX = low)
;   - Flags: C and O set if DX != 0 (result doesn't fit in 16 bits)
;
; IMUL (signed multiply):
;   IMUL Rd, Rs
;   - Multiplies Rd by Rs (both treated as signed)
;   - 32-bit result stored in DX:AX (sign-extended)
;   - Flags: C and O set if DX:AX != sign-extend(AX)
;
; Key differences:
;   - MUL treats operands as unsigned (0x8000 = 32768)
;   - IMUL treats operands as signed (0x8000 = -32768)
;   - Result placement is the same (DX:AX)
;
; Common patterns:
;   - Multiply by power of 2: use SHL instead (faster)
;   - Array indexing: MUL index by element size
;   - 32-bit multiply: use multiple 16-bit MULs with ADD
