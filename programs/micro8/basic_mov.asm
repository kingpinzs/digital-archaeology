; basic_mov.asm - Test MOV instructions between registers
; Tests: MOV Rd, Rs for various register combinations
; Expected: Each register ends with specific test value
;
; Micro8 Architecture Test Program

        .org 0x0200             ; Start after reserved area

START:
        ; Test 1: Load immediate values into all registers
        LDI R0, 0x10            ; R0 = 0x10 (16)
        LDI R1, 0x21            ; R1 = 0x21 (33)
        LDI R2, 0x32            ; R2 = 0x32 (50)
        LDI R3, 0x43            ; R3 = 0x43 (67)
        LDI R4, 0x54            ; R4 = 0x54 (84)
        LDI R5, 0x65            ; R5 = 0x65 (101)
        LDI R6, 0x76            ; R6 = 0x76 (118)
        LDI R7, 0x87            ; R7 = 0x87 (135)

        ; Test 2: MOV between low registers
        MOV R0, R1              ; R0 = 0x21
        MOV R1, R2              ; R1 = 0x32

        ; Test 3: MOV between high registers
        MOV R6, R7              ; R6 = 0x87
        MOV R5, R6              ; R5 = 0x87

        ; Test 4: Cross-register MOV (low to high, high to low)
        MOV R3, R7              ; R3 = 0x87 (copy from high to mid)
        MOV R4, R0              ; R4 = 0x21 (copy R0's new value)

        ; Test 5: Chain of MOVs
        LDI R0, 0xAA            ; R0 = 0xAA
        MOV R1, R0              ; R1 = 0xAA
        MOV R2, R1              ; R2 = 0xAA
        MOV R7, R2              ; R7 = 0xAA

        ; Test 6: MOV to/from R7 (edge case - highest register)
        LDI R7, 0xFF            ; R7 = 0xFF
        MOV R0, R7              ; R0 = 0xFF
        MOV R7, R0              ; R7 = 0xFF (no change, but test both directions)

        ; Test 7: Self-copy (essentially NOP but valid)
        MOV R0, R0              ; R0 unchanged

        ; Test 8: 16-bit register pair moves
        LDI16 HL, 0x1234        ; H=0x12, L=0x34
        MOV16 SP, HL            ; SP = 0x1234
        LDI16 HL, 0x5678        ; H=0x56, L=0x78
        MOV16 HL, SP            ; HL = 0x1234 (restored from SP)

        ; Store final results for verification
        ST R0, [RESULT0]
        ST R1, [RESULT1]
        ST R2, [RESULT2]
        ST R5, [RESULT5]
        ST R6, [RESULT6]
        ST R7, [RESULT7]

        HLT                     ; Stop execution

; Data section
        .org 0x0300
RESULT0: .db 0                  ; Expected: 0xFF
RESULT1: .db 0                  ; Expected: 0xAA
RESULT2: .db 0                  ; Expected: 0xAA
RESULT5: .db 0                  ; Expected: 0x12 (H from HL=0x1234)
RESULT6: .db 0                  ; Expected: 0x34 (L from HL=0x1234)
RESULT7: .db 0                  ; Expected: 0xAA

; Expected final state:
; R0 = 0xFF, R1 = 0xAA, R2 = 0xAA
; R5 = 0x12 (H), R6 = 0x34 (L) from HL = 0x1234
; R7 = 0xAA
