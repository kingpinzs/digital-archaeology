; flags.asm - Test CPU flag behavior
; Tests: Z (Zero), C (Carry), S (Sign), O (Overflow) flags
; Tests: SCF, CCF, CMF flag manipulation instructions
;
; Flags register layout:
;   Bit 7: S (Sign)    - Set when result bit 7 is set
;   Bit 6: Z (Zero)    - Set when result is zero
;   Bit 2: O (Overflow)- Set on signed overflow
;   Bit 0: C (Carry)   - Set on unsigned overflow/borrow
;
; Micro8 Architecture Test Program

        .org 0x0200             ; Start after reserved area

START:
        LDI R7, 0x00            ; Test counter

        ; ===== Test Zero Flag (Z) =====

        ; Test Z=1 when result is zero
        LDI R0, 0x05
        LDI R1, 0x05
        SUB R0, R1              ; 5 - 5 = 0, Z=1
        JZ Z_SET_OK1
        JMP FAIL
Z_SET_OK1:
        INC R7                  ; Test 1 passed

        ; Test Z=0 when result is non-zero
        LDI R0, 0x05
        LDI R1, 0x03
        SUB R0, R1              ; 5 - 3 = 2, Z=0
        JNZ Z_CLEAR_OK1
        JMP FAIL
Z_CLEAR_OK1:
        INC R7                  ; Test 2 passed

        ; Test Z with XOR clearing register
        LDI R0, 0xAA
        XOR R0, R0              ; R0 = 0, Z=1
        JZ Z_SET_XOR
        JMP FAIL
Z_SET_XOR:
        INC R7                  ; Test 3 passed

        ; Test Z with DEC to zero
        LDI R0, 0x01
        DEC R0                  ; 1 - 1 = 0, Z=1
        JZ Z_SET_DEC
        JMP FAIL
Z_SET_DEC:
        INC R7                  ; Test 4 passed

        ; Test Z with INC from 0xFF to 0x00
        LDI R0, 0xFF
        INC R0                  ; 255 + 1 = 0 (wrap), Z=1
        JZ Z_SET_INC_WRAP
        JMP FAIL
Z_SET_INC_WRAP:
        INC R7                  ; Test 5 passed

        ; ===== Test Carry Flag (C) =====

        ; Test C=1 on unsigned overflow (ADD)
        LDI R0, 0xFF
        LDI R1, 0x01
        ADD R0, R1              ; 255 + 1 = 256, C=1
        JC C_SET_ADD
        JMP FAIL
C_SET_ADD:
        INC R7                  ; Test 6 passed

        ; Test C=0 on no overflow
        LDI R0, 0x50
        LDI R1, 0x30
        ADD R0, R1              ; 80 + 48 = 128, C=0
        JNC C_CLEAR_ADD
        JMP FAIL
C_CLEAR_ADD:
        INC R7                  ; Test 7 passed

        ; Test C=1 on borrow (SUB)
        LDI R0, 0x10
        LDI R1, 0x20
        SUB R0, R1              ; 16 - 32 = -16 (borrow), C=1
        JC C_SET_SUB
        JMP FAIL
C_SET_SUB:
        INC R7                  ; Test 8 passed

        ; Test C=0 on no borrow
        LDI R0, 0x30
        LDI R1, 0x10
        SUB R0, R1              ; 48 - 16 = 32, C=0
        JNC C_CLEAR_SUB
        JMP FAIL
C_CLEAR_SUB:
        INC R7                  ; Test 9 passed

        ; Test C with shift (SHL)
        LDI R0, 0x80            ; Bit 7 set
        SHL R0                  ; Shift left, bit 7 goes to C
        JC C_SET_SHL
        JMP FAIL
C_SET_SHL:
        INC R7                  ; Test 10 passed

        ; Test C with shift (SHR)
        LDI R0, 0x01            ; Bit 0 set
        SHR R0                  ; Shift right, bit 0 goes to C
        JC C_SET_SHR
        JMP FAIL
C_SET_SHR:
        INC R7                  ; Test 11 passed

        ; ===== Test Sign Flag (S) =====

        ; Test S=1 when result is negative (bit 7 set)
        LDI R0, 0x80            ; 128 unsigned, -128 signed
        OR R0, R0               ; Set flags
        JS S_SET_OK
        JMP FAIL
S_SET_OK:
        INC R7                  ; Test 12 passed

        ; Test S=0 when result is positive
        LDI R0, 0x7F            ; 127, max positive
        OR R0, R0               ; Set flags
        JNS S_CLEAR_OK
        JMP FAIL
S_CLEAR_OK:
        INC R7                  ; Test 13 passed

        ; Test S after ADD creating negative result
        LDI R0, 0x70
        LDI R1, 0x20
        ADD R0, R1              ; 0x70 + 0x20 = 0x90 (bit 7 set)
        JS S_SET_ADD
        JMP FAIL
S_SET_ADD:
        INC R7                  ; Test 14 passed

        ; ===== Test Overflow Flag (O) =====

        ; Test O=1 on signed overflow (positive + positive = negative)
        LDI R0, 0x7F            ; 127 (max positive)
        LDI R1, 0x01            ; 1
        ADD R0, R1              ; 127 + 1 = 128 (0x80 = -128), O=1
        JO O_SET_POS_POS
        JMP FAIL
O_SET_POS_POS:
        INC R7                  ; Test 15 passed

        ; Test O=1 on signed overflow (negative + negative = positive)
        LDI R0, 0x80            ; -128
        LDI R1, 0x80            ; -128
        ADD R0, R1              ; -128 + -128 = -256 -> 0x00 (wrapped), O=1
        JO O_SET_NEG_NEG
        JMP FAIL
O_SET_NEG_NEG:
        INC R7                  ; Test 16 passed

        ; Test O=0 when no signed overflow
        LDI R0, 0x10            ; 16
        LDI R1, 0x20            ; 32
        ADD R0, R1              ; 16 + 32 = 48, O=0
        JNO O_CLEAR_OK
        JMP FAIL
O_CLEAR_OK:
        INC R7                  ; Test 17 passed

        ; ===== Test Flag Manipulation Instructions =====

        ; Test SCF (Set Carry Flag)
        CCF                     ; Clear carry first
        SCF                     ; Set carry
        JC SCF_OK
        JMP FAIL
SCF_OK:
        INC R7                  ; Test 18 passed

        ; Test CCF (Clear Carry Flag)
        SCF                     ; Set carry first
        CCF                     ; Clear carry
        JNC CCF_OK
        JMP FAIL
CCF_OK:
        INC R7                  ; Test 19 passed

        ; Test CMF (Complement Carry Flag)
        CCF                     ; Clear carry (C=0)
        CMF                     ; Complement (C=1)
        JC CMF_OK1
        JMP FAIL
CMF_OK1:
        CMF                     ; Complement again (C=0)
        JNC CMF_OK2
        JMP FAIL
CMF_OK2:
        INC R7                  ; Test 20 passed

        ; ===== Test ADC/SBC with Carry =====

        ; Test ADC includes carry
        SCF                     ; Set carry
        LDI R0, 0x10
        LDI R1, 0x05
        ADC R0, R1              ; 16 + 5 + 1 = 22
        CMPI R0, 22
        JZ ADC_OK
        JMP FAIL
ADC_OK:
        INC R7                  ; Test 21 passed

        ; Test SBC includes carry (borrow)
        SCF                     ; Set carry (borrow)
        LDI R0, 0x20
        LDI R1, 0x05
        SBC R0, R1              ; 32 - 5 - 1 = 26
        CMPI R0, 26
        JZ SBC_OK
        JMP FAIL
SBC_OK:
        INC R7                  ; Test 22 passed

        ; ===== Test CMP sets flags without modifying register =====
        LDI R0, 0x50
        LDI R1, 0x50
        CMP R0, R1              ; 80 - 80 = 0, Z=1, R0 unchanged
        JNZ FAIL                ; Z should be set
        CMPI R0, 0x50           ; R0 should still be 0x50
        JNZ FAIL
        INC R7                  ; Test 23 passed

        ; ===== Store results =====
        ST R7, [TEST_COUNT]     ; Store test count

        ; Verify all tests passed
        CMPI R7, 23
        JZ ALL_PASSED
        JMP FAIL

ALL_PASSED:
        LDI R0, 0x00            ; Success marker
        ST R0, [FINAL_RESULT]
        JMP DONE

FAIL:
        LDI R0, 0xFF            ; Failure marker
        ST R0, [FINAL_RESULT]
        ST R7, [FAIL_AT_TEST]   ; Store which test failed

DONE:
        HLT                     ; Stop execution

; Data section
        .org 0x0500
TEST_COUNT:   .db 0             ; Expected: 0x17 (23)
FINAL_RESULT: .db 0xFF          ; Expected: 0x00 (success)
FAIL_AT_TEST: .db 0             ; Test number where failure occurred
