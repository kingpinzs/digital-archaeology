; logic.asm - Test logic and shift/rotate instructions for Micro16
; Tests: AND, OR, XOR, NOT, TEST (register and immediate forms)
; Tests: SHL, SHR, SAR, ROL, ROR, RCL, RCR
;
; Micro16 Architecture Test Program
; - 16-bit logical operations
; - Shift/rotate with count operand

        .org 0x0100             ; Default PC start location

START:
        ; ===== Test 1: AND register-register =====
        MOV AX, #0xFF00         ; AX = 1111111100000000
        MOV BX, #0x0FF0         ; BX = 0000111111110000
        AND AX, BX              ; AX = 0000111100000000 = 0x0F00
        ST AX, [AND_RR]         ; Store: 0x0F00

        ; ===== Test 2: AND register-immediate =====
        MOV AX, #0xABCD         ; AX = 1010101111001101
        AND AX, #0x00FF         ; AX = 0000000011001101 = 0x00CD
        ST AX, [AND_RI]         ; Store: 0x00CD

        ; ===== Test 3: OR register-register =====
        MOV AX, #0xF000         ; AX = 1111000000000000
        MOV BX, #0x000F         ; BX = 0000000000001111
        OR AX, BX               ; AX = 1111000000001111 = 0xF00F
        ST AX, [OR_RR]          ; Store: 0xF00F

        ; ===== Test 4: OR register-immediate =====
        MOV AX, #0x1234         ; AX = 0001001000110100
        OR AX, #0x8000          ; AX = 1001001000110100 = 0x9234
        ST AX, [OR_RI]          ; Store: 0x9234

        ; ===== Test 5: XOR register-register =====
        MOV AX, #0xAAAA         ; AX = 1010101010101010
        MOV BX, #0xFFFF         ; BX = 1111111111111111
        XOR AX, BX              ; AX = 0101010101010101 = 0x5555
        ST AX, [XOR_RR]         ; Store: 0x5555

        ; ===== Test 6: XOR register-immediate =====
        MOV AX, #0x1234         ; AX = 0001001000110100
        XOR AX, #0x1234         ; AX = 0 (XOR with self clears)
        ST AX, [XOR_RI]         ; Store: 0x0000

        ; ===== Test 7: XOR for clearing register =====
        MOV AX, #0xBEEF
        XOR AX, AX              ; AX = 0 (common idiom)
        ST AX, [XOR_CLEAR]      ; Store: 0x0000

        ; ===== Test 8: NOT (one's complement) =====
        MOV AX, #0x00FF         ; AX = 0000000011111111
        NOT AX                  ; AX = 1111111100000000 = 0xFF00
        ST AX, [NOT_RESULT]     ; Store: 0xFF00

        ; ===== Test 9: NOT of zero =====
        MOV AX, #0x0000
        NOT AX                  ; AX = 0xFFFF
        ST AX, [NOT_ZERO]       ; Store: 0xFFFF

        ; ===== Test 10: TEST register-register (AND without storing) =====
        MOV AX, #0xFF00
        MOV BX, #0x00FF
        TEST AX, BX             ; Result = 0, Z=1, AX unchanged
        ST AX, [TEST_RR]        ; Store: 0xFF00 (unchanged)
        JZ TEST_Z_OK
        MOV CX, #0xFFFF
        JMP TEST_Z_DONE
TEST_Z_OK:
        MOV CX, #0x0001
TEST_Z_DONE:
        ST CX, [TEST_ZFLAG]     ; Store: 0x0001

        ; ===== Test 11: TEST register-immediate =====
        MOV AX, #0x8000         ; Bit 15 set
        TEST AX, #0x8000        ; Test if bit 15 is set, Z=0
        JNZ TEST_RI_OK
        MOV CX, #0xFFFF
        JMP TEST_RI_DONE
TEST_RI_OK:
        MOV CX, #0x0002
TEST_RI_DONE:
        ST CX, [TEST_RI]        ; Store: 0x0002

        ; ===== Test 12: SHL (shift left logical) =====
        MOV AX, #0x0001         ; AX = 0000000000000001
        SHL AX, #1              ; AX = 0000000000000010 = 0x0002
        ST AX, [SHL_1]          ; Store: 0x0002

        ; ===== Test 13: SHL by 4 (multiply by 16) =====
        MOV AX, #0x0010         ; AX = 16
        SHL AX, #4              ; AX = 16 * 16 = 256 = 0x0100
        ST AX, [SHL_4]          ; Store: 0x0100

        ; ===== Test 14: SHL with carry out =====
        MOV AX, #0x8000         ; AX = 1000000000000000
        SHL AX, #1              ; AX = 0, C=1
        ST AX, [SHL_CARRY]      ; Store: 0x0000

        ; ===== Test 15: SHR (shift right logical) =====
        MOV AX, #0x8000         ; AX = 1000000000000000
        SHR AX, #1              ; AX = 0100000000000000 = 0x4000
        ST AX, [SHR_1]          ; Store: 0x4000

        ; ===== Test 16: SHR by 4 (divide by 16) =====
        MOV AX, #0x0100         ; AX = 256
        SHR AX, #4              ; AX = 256 / 16 = 16 = 0x0010
        ST AX, [SHR_4]          ; Store: 0x0010

        ; ===== Test 17: SAR (shift arithmetic right - preserves sign) =====
        MOV AX, #0x8000         ; AX = -32768 signed (bit 15 = 1)
        SAR AX, #1              ; AX = 1100000000000000 = 0xC000 (-16384)
        ST AX, [SAR_1]          ; Store: 0xC000

        ; ===== Test 18: SAR on positive number =====
        MOV AX, #0x4000         ; AX = 16384 (positive, bit 15 = 0)
        SAR AX, #1              ; AX = 0010000000000000 = 0x2000 (8192)
        ST AX, [SAR_POS]        ; Store: 0x2000

        ; ===== Test 19: SAR by 4 =====
        MOV AX, #0xFFF0         ; AX = -16 signed
        SAR AX, #4              ; AX = 1111111111111111 = 0xFFFF (-1)
        ST AX, [SAR_4]          ; Store: 0xFFFF

        ; ===== Test 20: ROL (rotate left) =====
        MOV AX, #0x8001         ; AX = 1000000000000001
        ROL AX, #1              ; AX = 0000000000000011 = 0x0003, C=1
        ST AX, [ROL_1]          ; Store: 0x0003

        ; ===== Test 21: ROL by 4 =====
        MOV AX, #0x1234         ; AX = 0001001000110100
        ROL AX, #4              ; AX = 0010001101000001 = 0x2341
        ST AX, [ROL_4]          ; Store: 0x2341

        ; ===== Test 22: ROR (rotate right) =====
        MOV AX, #0x0003         ; AX = 0000000000000011
        ROR AX, #1              ; AX = 1000000000000001 = 0x8001, C=1
        ST AX, [ROR_1]          ; Store: 0x8001

        ; ===== Test 23: ROR by 4 =====
        MOV AX, #0x1234         ; AX = 0001001000110100
        ROR AX, #4              ; AX = 0100000100100011 = 0x4123
        ST AX, [ROR_4]          ; Store: 0x4123

        ; ===== Test 24: RCL (rotate left through carry) =====
        CLC                     ; Clear carry first
        MOV AX, #0x8000         ; AX = 1000000000000000
        RCL AX, #1              ; AX = 0000000000000000, C=1
        ST AX, [RCL_1A]         ; Store: 0x0000
        RCL AX, #1              ; AX = 0000000000000001, C=0 (carry rotates in)
        ST AX, [RCL_1B]         ; Store: 0x0001

        ; ===== Test 25: RCR (rotate right through carry) =====
        CLC                     ; Clear carry first
        MOV AX, #0x0001         ; AX = 0000000000000001
        RCR AX, #1              ; AX = 0000000000000000, C=1
        ST AX, [RCR_1A]         ; Store: 0x0000
        RCR AX, #1              ; AX = 1000000000000000, C=0 (carry rotates in)
        ST AX, [RCR_1B]         ; Store: 0x8000

        ; ===== Test 26: Combined logic operations =====
        ; Compute (AX AND 0xFF00) OR (BX AND 0x00FF) - byte merge
        MOV AX, #0xAB00         ; High byte source
        MOV BX, #0x00CD         ; Low byte source
        AND AX, #0xFF00         ; Keep high byte
        AND BX, #0x00FF         ; Keep low byte
        OR AX, BX               ; Merge: 0xABCD
        ST AX, [MERGE_RESULT]   ; Store: 0xABCD

        ; ===== Test 27: Bit manipulation =====
        MOV AX, #0x0000         ; Start with 0
        OR AX, #0x0001          ; Set bit 0
        OR AX, #0x0080          ; Set bit 7
        OR AX, #0x8000          ; Set bit 15
        ST AX, [BIT_SET]        ; Store: 0x8081

        MOV AX, #0xFFFF         ; Start with all 1s
        AND AX, #0xFFFE         ; Clear bit 0
        AND AX, #0xFF7F         ; Clear bit 7
        AND AX, #0x7FFF         ; Clear bit 15
        ST AX, [BIT_CLEAR]      ; Store: 0x7F7E

        ; ===== Test 28: Toggle bits with XOR =====
        MOV AX, #0xAAAA         ; AX = 1010101010101010
        XOR AX, #0x00FF         ; Toggle lower 8 bits
        ST AX, [BIT_TOGGLE]     ; Store: 0xAA55

        ; ===== Final verification =====
        MOV AX, #0xCAFE
        ST AX, [FINAL_RESULT]

        HLT                     ; Stop execution

; Data section
        .org 0x0500

; AND results
AND_RR:       .dw 0             ; Expected: 0x0F00
AND_RI:       .dw 0             ; Expected: 0x00CD

; OR results
OR_RR:        .dw 0             ; Expected: 0xF00F
OR_RI:        .dw 0             ; Expected: 0x9234

; XOR results
XOR_RR:       .dw 0             ; Expected: 0x5555
XOR_RI:       .dw 0             ; Expected: 0x0000
XOR_CLEAR:    .dw 0             ; Expected: 0x0000

; NOT results
NOT_RESULT:   .dw 0             ; Expected: 0xFF00
NOT_ZERO:     .dw 0             ; Expected: 0xFFFF

; TEST results
TEST_RR:      .dw 0             ; Expected: 0xFF00 (unchanged)
TEST_ZFLAG:   .dw 0             ; Expected: 0x0001 (Z=1)
TEST_RI:      .dw 0             ; Expected: 0x0002 (bit test)

; SHL results
SHL_1:        .dw 0             ; Expected: 0x0002
SHL_4:        .dw 0             ; Expected: 0x0100
SHL_CARRY:    .dw 0             ; Expected: 0x0000

; SHR results
SHR_1:        .dw 0             ; Expected: 0x4000
SHR_4:        .dw 0             ; Expected: 0x0010

; SAR results
SAR_1:        .dw 0             ; Expected: 0xC000
SAR_POS:      .dw 0             ; Expected: 0x2000
SAR_4:        .dw 0             ; Expected: 0xFFFF

; ROL results
ROL_1:        .dw 0             ; Expected: 0x0003
ROL_4:        .dw 0             ; Expected: 0x2341

; ROR results
ROR_1:        .dw 0             ; Expected: 0x8001
ROR_4:        .dw 0             ; Expected: 0x4123

; RCL results
RCL_1A:       .dw 0             ; Expected: 0x0000
RCL_1B:       .dw 0             ; Expected: 0x0001

; RCR results
RCR_1A:       .dw 0             ; Expected: 0x0000
RCR_1B:       .dw 0             ; Expected: 0x8000

; Combined operations
MERGE_RESULT: .dw 0             ; Expected: 0xABCD
BIT_SET:      .dw 0             ; Expected: 0x8081
BIT_CLEAR:    .dw 0             ; Expected: 0x7F7E
BIT_TOGGLE:   .dw 0             ; Expected: 0xAA55

; Final result
FINAL_RESULT: .dw 0             ; Expected: 0xCAFE (success)

; Notes on shift/rotate:
; - SHL/SHR: Logical shifts, fill with 0
; - SAR: Arithmetic right shift, preserves sign bit
; - ROL/ROR: Rotate within register (17-bit rotation including C)
; - RCL/RCR: Rotate through carry (17-bit rotation)
