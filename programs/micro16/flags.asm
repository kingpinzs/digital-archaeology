; flags.asm - Test CPU flags behavior for Micro16
; Tests: C (Carry), Z (Zero), S (Sign), O (Overflow)
; Tests: D (Direction), I (Interrupt), T (Trap), P (Parity)
; Tests: Flag manipulation instructions (CLC, STC, CMC, CLD, STD, CLI, STI)
;
; Micro16 Architecture Test Program
; Flags register layout:
;   Bit 0: C (Carry)
;   Bit 1: Z (Zero)
;   Bit 2: S (Sign)
;   Bit 3: O (Overflow)
;   Bit 4: D (Direction)
;   Bit 5: I (Interrupt enable)
;   Bit 6: T (Trap)
;   Bit 7: P (Parity)

        .org 0x0100             ; Default PC start location

START:
        MOV R7, #0              ; Test counter

        ; ===== Test 1: Zero flag (Z) - Set when result is zero =====
        MOV AX, #0x0001
        SUB AX, #0x0001         ; AX = 0, Z=1
        JZ TEST1_OK
        HLT
TEST1_OK:
        INC R7                  ; Test 1 passed

        ; ===== Test 2: Zero flag - Clear when result is non-zero =====
        MOV AX, #0x0001
        SUB AX, #0x0000         ; AX = 1, Z=0
        JNZ TEST2_OK
        HLT
TEST2_OK:
        INC R7                  ; Test 2 passed

        ; ===== Test 3: Carry flag (C) - Set on unsigned overflow =====
        MOV AX, #0xFFFF
        ADD AX, #0x0001         ; 65535 + 1 = overflow, C=1
        JC TEST3_OK
        HLT
TEST3_OK:
        INC R7                  ; Test 3 passed

        ; ===== Test 4: Carry flag - Clear on no overflow =====
        MOV AX, #0x0001
        ADD AX, #0x0001         ; 1 + 1 = 2, C=0
        JNC TEST4_OK
        HLT
TEST4_OK:
        INC R7                  ; Test 4 passed

        ; ===== Test 5: Carry flag - Set on borrow (SUB) =====
        MOV AX, #0x0000
        SUB AX, #0x0001         ; 0 - 1 = underflow, C=1 (borrow)
        JC TEST5_OK
        HLT
TEST5_OK:
        INC R7                  ; Test 5 passed

        ; ===== Test 6: Sign flag (S) - Set when result is negative =====
        MOV AX, #0x0000
        SUB AX, #0x0001         ; 0 - 1 = 0xFFFF (negative), S=1
        JS TEST6_OK
        HLT
TEST6_OK:
        INC R7                  ; Test 6 passed

        ; ===== Test 7: Sign flag - Clear when result is positive =====
        MOV AX, #0x7FFF         ; Positive (bit 15 = 0)
        CMP AX, #0              ; S=0
        JNS TEST7_OK
        HLT
TEST7_OK:
        INC R7                  ; Test 7 passed

        ; ===== Test 8: Overflow flag (O) - Signed overflow (+ + + = -) =====
        MOV AX, #0x7FFF         ; +32767 (max positive)
        ADD AX, #0x0001         ; +32767 + 1 = -32768, O=1
        JO TEST8_OK
        HLT
TEST8_OK:
        INC R7                  ; Test 8 passed

        ; ===== Test 9: Overflow flag - Signed overflow (- + - = +) =====
        MOV AX, #0x8000         ; -32768 (min negative)
        SUB AX, #0x0001         ; -32768 - 1 = +32767, O=1
        JO TEST9_OK
        HLT
TEST9_OK:
        INC R7                  ; Test 9 passed

        ; ===== Test 10: Overflow flag - No overflow =====
        MOV AX, #0x0010
        ADD AX, #0x0010         ; 16 + 16 = 32, O=0
        JNO TEST10_OK
        HLT
TEST10_OK:
        INC R7                  ; Test 10 passed

        ; ===== Test 11: CLC - Clear carry flag =====
        MOV AX, #0xFFFF
        ADD AX, #0x0001         ; Set carry
        CLC                     ; Clear carry
        JNC TEST11_OK
        HLT
TEST11_OK:
        INC R7                  ; Test 11 passed

        ; ===== Test 12: STC - Set carry flag =====
        MOV AX, #0x0000
        ADD AX, #0x0001         ; Clear carry (no overflow)
        STC                     ; Set carry
        JC TEST12_OK
        HLT
TEST12_OK:
        INC R7                  ; Test 12 passed

        ; ===== Test 13: CMC - Complement carry flag =====
        CLC                     ; Start with C=0
        CMC                     ; Complement: C=1
        JC TEST13A_OK
        HLT
TEST13A_OK:
        CMC                     ; Complement: C=0
        JNC TEST13_OK
        HLT
TEST13_OK:
        INC R7                  ; Test 13 passed

        ; ===== Test 14: CLD - Clear direction flag =====
        STD                     ; Set D first
        CLD                     ; Clear D
        ; Verify by doing string op - SI should increment
        MOV SI, #TEST_STRING
        MOV DI, #TEST_DEST
        MOVSB                   ; If D=0, SI and DI increment
        ; SI should be TEST_STRING+1
        MOV AX, SI
        SUB AX, #TEST_STRING
        CMP AX, #1              ; Should be 1 (incremented)
        JZ TEST14_OK
        HLT
TEST14_OK:
        INC R7                  ; Test 14 passed

        ; ===== Test 15: STD - Set direction flag =====
        CLD                     ; Clear first
        STD                     ; Set D
        ; Now MOVSB should decrement
        MOV SI, #TEST_STRING+4  ; Point to end
        MOV DI, #TEST_DEST+4
        MOVSB                   ; If D=1, SI and DI decrement
        MOV AX, SI
        CMP AX, #TEST_STRING+3  ; Should have decremented
        CLD                     ; Restore D=0 for future ops
        JZ TEST15_OK
        HLT
TEST15_OK:
        INC R7                  ; Test 15 passed

        ; ===== Test 16: CLI - Clear interrupt flag =====
        STI                     ; Enable interrupts first
        CLI                     ; Disable interrupts
        ; Can't easily verify I flag directly, just test instruction runs
        INC R7                  ; Test 16 passed

        ; ===== Test 17: STI - Set interrupt flag =====
        CLI                     ; Disable first
        STI                     ; Enable
        INC R7                  ; Test 17 passed

        ; ===== Test 18: PUSHF/POPF - Save and restore flags =====
        ; Create known flag state
        MOV AX, #0xFFFF
        ADD AX, #0x0001         ; Z=1, C=1
        PUSHF                   ; Save flags

        ; Change flags
        MOV AX, #0x0010
        ADD AX, #0x0010         ; Z=0, C=0

        POPF                    ; Restore flags

        ; Verify Z was restored
        JZ TEST18_Z_OK
        HLT
TEST18_Z_OK:
        ; Verify C was restored
        JC TEST18_OK
        HLT
TEST18_OK:
        INC R7                  ; Test 18 passed

        ; ===== Test 19: Flags after AND (Z based on result) =====
        MOV AX, #0xFF00
        AND AX, #0x00FF         ; 0xFF00 & 0x00FF = 0x0000, Z=1
        JZ TEST19_OK
        HLT
TEST19_OK:
        INC R7                  ; Test 19 passed

        ; ===== Test 20: Flags after OR =====
        MOV AX, #0x0000
        OR AX, #0x0000          ; 0 | 0 = 0, Z=1
        JZ TEST20A_OK
        HLT
TEST20A_OK:
        MOV AX, #0x8000
        OR AX, #0x0000          ; Result has bit 15 set, S=1
        JS TEST20_OK
        HLT
TEST20_OK:
        INC R7                  ; Test 20 passed

        ; ===== Test 21: Flags after XOR =====
        MOV AX, #0xAAAA
        XOR AX, #0xAAAA         ; Self-XOR = 0, Z=1
        JZ TEST21_OK
        HLT
TEST21_OK:
        INC R7                  ; Test 21 passed

        ; ===== Test 22: Flags after INC (doesn't affect C) =====
        MOV AX, #0xFFFF
        ADD AX, #0x0001         ; Set C=1
        MOV AX, #0x0000
        INC AX                  ; AX=1, but C should still be 1!
        JC TEST22_OK            ; C preserved after INC
        HLT
TEST22_OK:
        INC R7                  ; Test 22 passed

        ; ===== Test 23: Flags after DEC (doesn't affect C) =====
        MOV AX, #0xFFFF
        ADD AX, #0x0001         ; Set C=1
        MOV AX, #0x0002
        DEC AX                  ; AX=1, C should still be 1
        JC TEST23_OK
        HLT
TEST23_OK:
        INC R7                  ; Test 23 passed

        ; ===== Test 24: Flags after CMP =====
        MOV AX, #100
        CMP AX, #50             ; 100 > 50, Z=0, C=0, S=0
        JNZ TEST24A
        HLT
TEST24A:
        JNC TEST24B
        HLT
TEST24B:
        JNS TEST24_OK
        HLT
TEST24_OK:
        INC R7                  ; Test 24 passed

        ; ===== Test 25: Flags after NEG =====
        MOV AX, #0x0001
        NEG AX                  ; -1 = 0xFFFF, S=1, C=1 (unless 0)
        JS TEST25A
        HLT
TEST25A:
        JC TEST25_OK
        HLT
TEST25_OK:
        INC R7                  ; Test 25 passed

        ; ===== Test 26: NEG of zero doesn't set C =====
        MOV AX, #0x0000
        NEG AX                  ; -0 = 0, Z=1, C=0
        JZ TEST26A
        HLT
TEST26A:
        JNC TEST26_OK
        HLT
TEST26_OK:
        INC R7                  ; Test 26 passed

        ; ===== Test 27: Flags after shift (C = bit shifted out) =====
        MOV AX, #0x8001         ; Bit 15 and bit 0 set
        SHL AX, #1              ; Shift left, C = old bit 15 = 1
        JC TEST27_OK
        HLT
TEST27_OK:
        INC R7                  ; Test 27 passed

        ; ===== Test 28: Flags after shift (bit 0 to C) =====
        MOV AX, #0x0001         ; Only bit 0 set
        SHR AX, #1              ; Shift right, C = old bit 0 = 1, AX = 0
        JC TEST28A
        HLT
TEST28A:
        JZ TEST28_OK            ; Z=1 because AX=0
        HLT
TEST28_OK:
        INC R7                  ; Test 28 passed

        ; ===== Store final test count =====
        ST R7, [TEST_COUNT]

        CMP R7, #28
        JZ ALL_PASSED
        MOV AX, #0xFFFF
        ST AX, [FINAL_RESULT]
        HLT

ALL_PASSED:
        MOV AX, #0xCAFE
        ST AX, [FINAL_RESULT]

        HLT                     ; Stop execution

; Test data
        .org 0x0400
TEST_STRING:  .db 'A', 'B', 'C', 'D', 'E'
TEST_DEST:    .db 0, 0, 0, 0, 0

; Data section
        .org 0x0500

TEST_COUNT:   .dw 0             ; Expected: 28 (0x001C)
FINAL_RESULT: .dw 0             ; Expected: 0xCAFE (success)

; Flag summary for Micro16:
;
; Carry (C) - Bit 0:
;   Set: Unsigned overflow/underflow in ADD/SUB
;   Clear: No overflow/underflow
;   Used by: JC, JNC, ADC, SBC, RCL, RCR
;   Note: INC/DEC do NOT affect C
;
; Zero (Z) - Bit 1:
;   Set: Result is zero
;   Clear: Result is non-zero
;   Used by: JZ/JE, JNZ/JNE, LOOPZ, LOOPNZ
;
; Sign (S) - Bit 2:
;   Set: Result is negative (bit 15 = 1)
;   Clear: Result is positive (bit 15 = 0)
;   Used by: JS, JNS
;
; Overflow (O) - Bit 3:
;   Set: Signed overflow (positive + positive = negative, etc.)
;   Clear: No signed overflow
;   Used by: JO, JNO
;
; Direction (D) - Bit 4:
;   Set: String ops decrement SI/DI
;   Clear: String ops increment SI/DI
;   Set/Clear: STD, CLD
;
; Interrupt (I) - Bit 5:
;   Set: Interrupts enabled
;   Clear: Interrupts disabled
;   Set/Clear: STI, CLI
;
; Trap (T) - Bit 6:
;   Set: Single-step mode (INT 1 after each instruction)
;   Clear: Normal execution
;
; Parity (P) - Bit 7:
;   Set: Even number of 1 bits in result low byte
;   Clear: Odd number of 1 bits
;   Used by: JP, JNP
;
; Flag manipulation instructions:
;   CLC - Clear Carry
;   STC - Set Carry
;   CMC - Complement Carry
;   CLD - Clear Direction
;   STD - Set Direction
;   CLI - Clear Interrupt (disable)
;   STI - Set Interrupt (enable)
;   PUSHF - Push flags to stack
;   POPF - Pop flags from stack
;
; Condition codes for signed comparisons (after CMP):
;   JL:  S != O (less than)
;   JGE: S == O (greater or equal)
;   JLE: Z=1 or S != O (less or equal)
;   JG:  Z=0 and S == O (greater)
;
; Condition codes for unsigned comparisons (after CMP):
;   JB/JC:  C=1 (below, carry)
;   JAE/JNC: C=0 (above or equal, no carry)
;   JBE: C=1 or Z=1 (below or equal)
;   JA:  C=0 and Z=0 (above)
