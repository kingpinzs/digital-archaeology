; logic.asm - Test logic instructions
; Tests: AND, OR, XOR, NOT, ANDI, ORI, XORI
; Tests: SHL, SHR, SAR, ROL, ROR, SWAP
;
; Micro8 Architecture Test Program

        .org 0x0200             ; Start after reserved area

START:
        ; ===== Test AND =====
        LDI R0, 0xF0            ; R0 = 11110000
        LDI R1, 0x3C            ; R1 = 00111100
        AND R0, R1              ; R0 = 00110000 = 0x30
        ST R0, [AND_RESULT]     ; Store: 0x30 (48)

        ; ===== Test OR =====
        LDI R0, 0xF0            ; R0 = 11110000
        LDI R1, 0x0F            ; R1 = 00001111
        OR R0, R1               ; R0 = 11111111 = 0xFF
        ST R0, [OR_RESULT]      ; Store: 0xFF (255)

        ; ===== Test XOR =====
        LDI R0, 0xAA            ; R0 = 10101010
        LDI R1, 0xFF            ; R1 = 11111111
        XOR R0, R1              ; R0 = 01010101 = 0x55
        ST R0, [XOR_RESULT]     ; Store: 0x55 (85)

        ; ===== Test NOT =====
        LDI R0, 0xAA            ; R0 = 10101010
        NOT R0                  ; R0 = 01010101 = 0x55
        ST R0, [NOT_RESULT]     ; Store: 0x55 (85)

        ; ===== Test ANDI (immediate) =====
        LDI R0, 0xFF            ; R0 = 11111111
        ANDI R0, 0x0F           ; R0 = 00001111 = 0x0F
        ST R0, [ANDI_RESULT]    ; Store: 0x0F (15)

        ; ===== Test ORI (immediate) =====
        LDI R0, 0xF0            ; R0 = 11110000
        ORI R0, 0x0A            ; R0 = 11111010 = 0xFA
        ST R0, [ORI_RESULT]     ; Store: 0xFA (250)

        ; ===== Test XORI (immediate) =====
        LDI R0, 0xFF            ; R0 = 11111111
        XORI R0, 0xAA           ; R0 = 01010101 = 0x55
        ST R0, [XORI_RESULT]    ; Store: 0x55 (85)

        ; ===== Test XOR for clearing register =====
        LDI R0, 0x42            ; R0 = some value
        XOR R0, R0              ; R0 = 0 (common idiom for clearing)
        ST R0, [XOR_CLEAR]      ; Store: 0x00

        ; ===== Test SHL (shift left) =====
        LDI R0, 0x01            ; R0 = 00000001
        SHL R0                  ; R0 = 00000010 = 0x02, C = 0
        ST R0, [SHL_RESULT1]    ; Store: 0x02

        LDI R0, 0x81            ; R0 = 10000001
        SHL R0                  ; R0 = 00000010 = 0x02, C = 1 (bit 7 shifted out)
        ST R0, [SHL_RESULT2]    ; Store: 0x02

        ; Multiple shifts = multiply by power of 2
        LDI R0, 0x05            ; R0 = 5
        SHL R0                  ; R0 = 10
        SHL R0                  ; R0 = 20
        SHL R0                  ; R0 = 40
        ST R0, [SHL_MUL8]       ; Store: 0x28 (40 = 5 * 8)

        ; ===== Test SHR (logical shift right) =====
        LDI R0, 0x80            ; R0 = 10000000
        SHR R0                  ; R0 = 01000000 = 0x40, C = 0
        ST R0, [SHR_RESULT1]    ; Store: 0x40

        LDI R0, 0x81            ; R0 = 10000001
        SHR R0                  ; R0 = 01000000 = 0x40, C = 1 (bit 0 shifted out)
        ST R0, [SHR_RESULT2]    ; Store: 0x40

        ; Multiple shifts = divide by power of 2
        LDI R0, 0x40            ; R0 = 64
        SHR R0                  ; R0 = 32
        SHR R0                  ; R0 = 16
        SHR R0                  ; R0 = 8
        ST R0, [SHR_DIV8]       ; Store: 0x08 (8 = 64 / 8)

        ; ===== Test SAR (arithmetic shift right - preserves sign) =====
        LDI R0, 0x80            ; R0 = 10000000 (-128 signed)
        SAR R0                  ; R0 = 11000000 = 0xC0 (-64), sign preserved
        ST R0, [SAR_RESULT1]    ; Store: 0xC0

        LDI R0, 0xFE            ; R0 = 11111110 (-2 signed)
        SAR R0                  ; R0 = 11111111 = 0xFF (-1), sign preserved
        ST R0, [SAR_RESULT2]    ; Store: 0xFF

        LDI R0, 0x40            ; R0 = 01000000 (64 signed, positive)
        SAR R0                  ; R0 = 00100000 = 0x20 (32), sign preserved
        ST R0, [SAR_RESULT3]    ; Store: 0x20

        ; ===== Test ROL (rotate left through carry) =====
        CCF                     ; Clear carry first
        LDI R0, 0x80            ; R0 = 10000000
        ROL R0                  ; R0 = 00000000, C = 1 (bit 7 to carry)
        ST R0, [ROL_RESULT1]    ; Store: 0x00
        ROL R0                  ; R0 = 00000001 (carry rotates back in)
        ST R0, [ROL_RESULT2]    ; Store: 0x01

        ; ===== Test ROR (rotate right through carry) =====
        CCF                     ; Clear carry first
        LDI R0, 0x01            ; R0 = 00000001
        ROR R0                  ; R0 = 00000000, C = 1 (bit 0 to carry)
        ST R0, [ROR_RESULT1]    ; Store: 0x00
        ROR R0                  ; R0 = 10000000 (carry rotates back in)
        ST R0, [ROR_RESULT2]    ; Store: 0x80

        ; ===== Test SWAP (swap nibbles) =====
        LDI R0, 0x12            ; R0 = 00010010
        SWAP R0                 ; R0 = 00100001 = 0x21
        ST R0, [SWAP_RESULT1]   ; Store: 0x21

        LDI R0, 0xAB            ; R0 = 10101011
        SWAP R0                 ; R0 = 10111010 = 0xBA
        ST R0, [SWAP_RESULT2]   ; Store: 0xBA

        ; ===== Test OR for testing if zero =====
        LDI R0, 0x00            ; R0 = 0
        OR R0, R0               ; Sets Z flag without changing R0
        JZ ZERO_OK              ; Should jump
        LDI R1, 0xFF            ; Should not execute
        JMP DONE
ZERO_OK:
        LDI R1, 0x01            ; R1 = 1 (zero test passed)
        ST R1, [ZERO_TEST]      ; Store: 0x01

DONE:
        HLT                     ; Stop execution

; Data section
        .org 0x0300
AND_RESULT:   .db 0             ; Expected: 0x30
OR_RESULT:    .db 0             ; Expected: 0xFF
XOR_RESULT:   .db 0             ; Expected: 0x55
NOT_RESULT:   .db 0             ; Expected: 0x55
ANDI_RESULT:  .db 0             ; Expected: 0x0F
ORI_RESULT:   .db 0             ; Expected: 0xFA
XORI_RESULT:  .db 0             ; Expected: 0x55
XOR_CLEAR:    .db 0             ; Expected: 0x00
SHL_RESULT1:  .db 0             ; Expected: 0x02
SHL_RESULT2:  .db 0             ; Expected: 0x02
SHL_MUL8:     .db 0             ; Expected: 0x28 (40)
SHR_RESULT1:  .db 0             ; Expected: 0x40
SHR_RESULT2:  .db 0             ; Expected: 0x40
SHR_DIV8:     .db 0             ; Expected: 0x08
SAR_RESULT1:  .db 0             ; Expected: 0xC0
SAR_RESULT2:  .db 0             ; Expected: 0xFF
SAR_RESULT3:  .db 0             ; Expected: 0x20
ROL_RESULT1:  .db 0             ; Expected: 0x00
ROL_RESULT2:  .db 0             ; Expected: 0x01
ROR_RESULT1:  .db 0             ; Expected: 0x00
ROR_RESULT2:  .db 0             ; Expected: 0x80
SWAP_RESULT1: .db 0             ; Expected: 0x21
SWAP_RESULT2: .db 0             ; Expected: 0xBA
ZERO_TEST:    .db 0             ; Expected: 0x01
