; arithmetic.asm - Test arithmetic instructions
; Tests: ADD, SUB, ADC, SBC, ADDI, SUBI, INC, DEC, CMP, NEG
; Also tests 16-bit arithmetic: INC16, DEC16, ADD16
;
; Micro8 Architecture Test Program

        .org 0x0200             ; Start after reserved area

START:
        ; ===== Test ADD =====
        LDI R0, 25              ; R0 = 25
        LDI R1, 17              ; R1 = 17
        ADD R0, R1              ; R0 = 25 + 17 = 42
        ST R0, [ADD_RESULT]     ; Store: 42 (0x2A)

        ; ===== Test SUB =====
        LDI R0, 100             ; R0 = 100
        LDI R1, 58              ; R1 = 58
        SUB R0, R1              ; R0 = 100 - 58 = 42
        ST R0, [SUB_RESULT]     ; Store: 42 (0x2A)

        ; ===== Test ADDI (immediate) =====
        LDI R0, 30              ; R0 = 30
        ADDI R0, 12             ; R0 = 30 + 12 = 42
        ST R0, [ADDI_RESULT]    ; Store: 42 (0x2A)

        ; ===== Test SUBI (immediate) =====
        LDI R0, 50              ; R0 = 50
        SUBI R0, 8              ; R0 = 50 - 8 = 42
        ST R0, [SUBI_RESULT]    ; Store: 42 (0x2A)

        ; ===== Test INC =====
        LDI R0, 41              ; R0 = 41
        INC R0                  ; R0 = 42
        ST R0, [INC_RESULT]     ; Store: 42 (0x2A)

        ; ===== Test DEC =====
        LDI R0, 43              ; R0 = 43
        DEC R0                  ; R0 = 42
        ST R0, [DEC_RESULT]     ; Store: 42 (0x2A)

        ; ===== Test ADC (add with carry) =====
        ; First, create a carry condition
        LDI R0, 0xFF            ; R0 = 255
        LDI R1, 0x01            ; R1 = 1
        ADD R0, R1              ; R0 = 0, C = 1 (overflow)
        LDI R0, 10              ; R0 = 10
        LDI R1, 5               ; R1 = 5
        ADC R0, R1              ; R0 = 10 + 5 + 1 = 16 (includes carry)
        ST R0, [ADC_RESULT]     ; Store: 16 (0x10)

        ; ===== Test SBC (subtract with carry/borrow) =====
        ; First, clear carry by doing a subtraction that doesn't borrow
        LDI R0, 100             ; R0 = 100
        LDI R1, 50              ; R1 = 50
        SUB R0, R1              ; R0 = 50, C = 0 (no borrow)
        LDI R0, 20              ; R0 = 20
        LDI R1, 5               ; R1 = 5
        SBC R0, R1              ; R0 = 20 - 5 - 0 = 15
        ST R0, [SBC_RESULT]     ; Store: 15 (0x0F)

        ; ===== Test NEG =====
        LDI R0, 10              ; R0 = 10
        NEG R0                  ; R0 = -10 = 0xF6 (two's complement)
        ST R0, [NEG_RESULT]     ; Store: 0xF6 (246 unsigned, -10 signed)

        ; ===== Test CMP (compare - flags only) =====
        LDI R0, 50              ; R0 = 50
        LDI R1, 30              ; R1 = 30
        CMP R0, R1              ; Compare: 50 - 30 = 20, Z=0, C=0 (no borrow)
        ; R0 unchanged, just sets flags
        ST R0, [CMP_RESULT1]    ; Store: 50 (unchanged)

        LDI R0, 30              ; R0 = 30
        LDI R1, 30              ; R1 = 30
        CMP R0, R1              ; Compare: 30 - 30 = 0, Z=1
        ST R0, [CMP_RESULT2]    ; Store: 30 (unchanged)

        ; ===== Test CMPI (compare immediate) =====
        LDI R0, 42              ; R0 = 42
        CMPI R0, 42             ; Compare with 42, Z=1
        ST R0, [CMPI_RESULT]    ; Store: 42 (unchanged)

        ; ===== Test 16-bit arithmetic =====
        ; INC16 HL
        LDI16 HL, 0x00FF        ; HL = 0x00FF
        INC16 HL                ; HL = 0x0100 (tests carry propagation)
        ST R5, [INC16_H]        ; Store H = 0x01
        ST R6, [INC16_L]        ; Store L = 0x00

        ; DEC16 HL
        LDI16 HL, 0x0100        ; HL = 0x0100
        DEC16 HL                ; HL = 0x00FF (tests borrow propagation)
        ST R5, [DEC16_H]        ; Store H = 0x00
        ST R6, [DEC16_L]        ; Store L = 0xFF

        ; INC16 BC / DEC16 BC
        LDI16 BC, 0x1234        ; BC = 0x1234
        INC16 BC                ; BC = 0x1235
        DEC16 BC                ; BC = 0x1234
        ; Store BC result (R1=B, R2=C)
        ST R1, [BC_B]           ; Store B = 0x12
        ST R2, [BC_C]           ; Store C = 0x34

        ; ADD16 HL, BC
        LDI16 HL, 0x1000        ; HL = 0x1000
        LDI16 BC, 0x0234        ; BC = 0x0234
        ADD16 HL, BC            ; HL = 0x1234
        ST R5, [ADD16_H]        ; Store H = 0x12
        ST R6, [ADD16_L]        ; Store L = 0x34

        ; ADD16 HL, DE
        LDI16 HL, 0x1000        ; HL = 0x1000
        LDI16 DE, 0x0567        ; DE = 0x0567
        ADD16 HL, DE            ; HL = 0x1567
        ST R5, [ADD16_DE_H]     ; Store H = 0x15
        ST R6, [ADD16_DE_L]     ; Store L = 0x67

        ; Test overflow in 16-bit add
        LDI16 HL, 0xFFF0        ; HL = 0xFFF0
        LDI16 BC, 0x0020        ; BC = 0x0020
        ADD16 HL, BC            ; HL = 0x0010 (wraps, C=1)
        ST R5, [ADD16_OV_H]     ; Store H = 0x00
        ST R6, [ADD16_OV_L]     ; Store L = 0x10

        HLT                     ; Stop execution

; Data section
        .org 0x0500
ADD_RESULT:   .db 0             ; Expected: 0x2A (42)
SUB_RESULT:   .db 0             ; Expected: 0x2A (42)
ADDI_RESULT:  .db 0             ; Expected: 0x2A (42)
SUBI_RESULT:  .db 0             ; Expected: 0x2A (42)
INC_RESULT:   .db 0             ; Expected: 0x2A (42)
DEC_RESULT:   .db 0             ; Expected: 0x2A (42)
ADC_RESULT:   .db 0             ; Expected: 0x10 (16)
SBC_RESULT:   .db 0             ; Expected: 0x0F (15)
NEG_RESULT:   .db 0             ; Expected: 0xF6 (-10 signed)
CMP_RESULT1:  .db 0             ; Expected: 0x32 (50)
CMP_RESULT2:  .db 0             ; Expected: 0x1E (30)
CMPI_RESULT:  .db 0             ; Expected: 0x2A (42)
INC16_H:      .db 0             ; Expected: 0x01
INC16_L:      .db 0             ; Expected: 0x00
DEC16_H:      .db 0             ; Expected: 0x00
DEC16_L:      .db 0             ; Expected: 0xFF
BC_B:         .db 0             ; Expected: 0x12
BC_C:         .db 0             ; Expected: 0x34
ADD16_H:      .db 0             ; Expected: 0x12
ADD16_L:      .db 0             ; Expected: 0x34
ADD16_DE_H:   .db 0             ; Expected: 0x15
ADD16_DE_L:   .db 0             ; Expected: 0x67
ADD16_OV_H:   .db 0             ; Expected: 0x00 (overflow wrap)
ADD16_OV_L:   .db 0             ; Expected: 0x10
