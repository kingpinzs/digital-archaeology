; stack.asm - Test stack operations
; Tests: PUSH, POP, PUSH16, POP16, PUSHF, POPF
; Tests stack pointer manipulation and order of operations
;
; Micro8 Architecture Test Program

        .org 0x0200             ; Start after reserved area

START:
        ; Initialize stack pointer
        LDI16 SP, 0x01FD        ; SP = top of stack area

        ; ===== Test basic PUSH/POP =====
        LDI R0, 0xAA            ; R0 = 0xAA
        PUSH R0                 ; Push 0xAA onto stack
        LDI R0, 0x00            ; Clear R0
        POP R0                  ; Pop back into R0
        ST R0, [POP_RESULT1]    ; Store: should be 0xAA

        ; ===== Test PUSH/POP order (LIFO) =====
        LDI R0, 0x11            ; First value
        LDI R1, 0x22            ; Second value
        LDI R2, 0x33            ; Third value
        PUSH R0                 ; Push 0x11
        PUSH R1                 ; Push 0x22
        PUSH R2                 ; Push 0x33

        ; Pop in reverse order
        POP R3                  ; R3 = 0x33 (last in, first out)
        POP R4                  ; R4 = 0x22
        POP R5                  ; R5 = 0x11 (first in, last out)

        ST R3, [LIFO_RESULT1]   ; Store: 0x33
        ST R4, [LIFO_RESULT2]   ; Store: 0x22
        ST R5, [LIFO_RESULT3]   ; Store: 0x11

        ; ===== Test PUSH/POP with different registers =====
        LDI R7, 0x77            ; R7 = 0x77
        PUSH R7                 ; Push from R7
        POP R0                  ; Pop into R0
        ST R0, [REG_RESULT]     ; Store: 0x77

        ; ===== Test PUSH16/POP16 with HL =====
        LDI16 HL, 0x1234        ; HL = 0x1234
        PUSH16 HL               ; Push HL (H first, then L)
        LDI16 HL, 0x0000        ; Clear HL
        POP16 HL                ; Pop back into HL
        ST R5, [HL16_H]         ; Store H = 0x12
        ST R6, [HL16_L]         ; Store L = 0x34

        ; ===== Test PUSH16/POP16 with BC =====
        LDI16 BC, 0xABCD        ; BC = 0xABCD
        PUSH16 BC               ; Push BC
        LDI16 BC, 0x0000        ; Clear BC
        POP16 BC                ; Pop back into BC
        ST R1, [BC16_B]         ; Store B = 0xAB
        ST R2, [BC16_C]         ; Store C = 0xCD

        ; ===== Test PUSHF/POPF (flags) =====
        ; Create known flag state
        LDI R0, 0xFF            ; R0 = 255
        LDI R1, 0x01            ; R1 = 1
        ADD R0, R1              ; R0 = 0, sets Z=1, C=1
        PUSHF                   ; Save flags

        ; Change flags
        LDI R0, 0x01            ; R0 = 1
        ADD R0, R1              ; R0 = 2, Z=0, C=0

        POPF                    ; Restore flags (Z=1, C=1)
        ; Now Z should be 1
        JZ FLAGS_OK             ; Should jump because Z was restored
        LDI R0, 0xFF            ; This should NOT execute
        JMP FLAGS_DONE
FLAGS_OK:
        LDI R0, 0x01            ; Flag restore worked
FLAGS_DONE:
        ST R0, [FLAGS_RESULT]   ; Store: 0x01 if flags restored correctly

        ; ===== Test nested PUSH/POP =====
        LDI R0, 0x10
        LDI R1, 0x20
        LDI R2, 0x30
        LDI R3, 0x40
        PUSH R0
        PUSH R1
        PUSH R2
        PUSH R3
        ; Now pop into different registers
        POP R7                  ; R7 = 0x40
        POP R6                  ; R6 = 0x30 (note: this is L)
        POP R5                  ; R5 = 0x20 (note: this is H)
        POP R4                  ; R4 = 0x10
        ST R7, [NESTED1]        ; Store: 0x40
        ST R4, [NESTED4]        ; Store: 0x10

        ; ===== Test stack with subroutine simulation =====
        ; Save registers before "work"
        LDI R0, 0xDE
        LDI R1, 0xAD
        PUSH R0
        PUSH R1
        ; Do some "work" that changes registers
        LDI R0, 0x00
        LDI R1, 0x00
        ; Restore registers
        POP R1
        POP R0
        ST R0, [SAVE_R0]        ; Store: 0xDE
        ST R1, [SAVE_R1]        ; Store: 0xAD

        ; ===== Test mixed 8-bit and 16-bit push/pop =====
        LDI R0, 0x55
        PUSH R0                 ; Push 8-bit
        LDI16 HL, 0x1234
        PUSH16 HL               ; Push 16-bit
        LDI R1, 0x66
        PUSH R1                 ; Push 8-bit

        POP R2                  ; R2 = 0x66
        POP16 HL                ; HL = 0x1234
        POP R3                  ; R3 = 0x55

        ST R2, [MIXED1]         ; Store: 0x66
        ST R5, [MIXED_H]        ; Store: 0x12
        ST R6, [MIXED_L]        ; Store: 0x34
        ST R3, [MIXED2]         ; Store: 0x55

        HLT                     ; Stop execution

; Data section
        .org 0x0500
POP_RESULT1:  .db 0             ; Expected: 0xAA
LIFO_RESULT1: .db 0             ; Expected: 0x33
LIFO_RESULT2: .db 0             ; Expected: 0x22
LIFO_RESULT3: .db 0             ; Expected: 0x11
REG_RESULT:   .db 0             ; Expected: 0x77
HL16_H:       .db 0             ; Expected: 0x12
HL16_L:       .db 0             ; Expected: 0x34
BC16_B:       .db 0             ; Expected: 0xAB
BC16_C:       .db 0             ; Expected: 0xCD
FLAGS_RESULT: .db 0             ; Expected: 0x01
NESTED1:      .db 0             ; Expected: 0x40
NESTED4:      .db 0             ; Expected: 0x10
SAVE_R0:      .db 0             ; Expected: 0xDE
SAVE_R1:      .db 0             ; Expected: 0xAD
MIXED1:       .db 0             ; Expected: 0x66
MIXED_H:      .db 0             ; Expected: 0x12
MIXED_L:      .db 0             ; Expected: 0x34
MIXED2:       .db 0             ; Expected: 0x55
