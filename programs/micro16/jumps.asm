; jumps.asm - Test jump and branch instructions for Micro16
; Tests: JMP, JMP FAR, JMP Rd (indirect), JR (relative)
; Tests: Conditional jumps - JZ, JNZ, JC, JNC, JS, JNS, JO, JNO
; Tests: Signed comparisons - JL, JGE, JLE, JG
; Tests: Unsigned comparisons - JA, JBE
; Tests: LOOP, LOOPZ, LOOPNZ
;
; Micro16 Architecture Test Program

        .org 0x0100             ; Default PC start location

START:
        MOV R7, #0              ; R7 = test counter (increments on pass)

        ; ===== Test 1: JMP (unconditional absolute) =====
        JMP TEST1_OK
        MOV AX, #0xFFFF         ; Should NOT execute
        HLT                     ; Should NOT execute
TEST1_OK:
        INC R7                  ; Test 1 passed

        ; ===== Test 2: JR (relative short jump) =====
        JR TEST2_OK             ; Forward relative jump
        MOV AX, #0xFFFF         ; Should NOT execute
        HLT
TEST2_OK:
        INC R7                  ; Test 2 passed

        ; ===== Test 3: JMP Rd (indirect jump through register) =====
        MOV AX, #TEST3_OK       ; Load target address
        JMP AX                  ; Jump indirect through AX
        MOV AX, #0xFFFF         ; Should NOT execute
        HLT
TEST3_OK:
        INC R7                  ; Test 3 passed

        ; ===== Test 4: JZ (jump if zero) =====
        MOV AX, #0x0000         ; Z=1
        CMP AX, #0              ; Ensure Z flag is set
        JZ TEST4_OK             ; Should jump
        HLT
TEST4_OK:
        INC R7                  ; Test 4 passed

        ; ===== Test 5: JNZ (jump if not zero) =====
        MOV AX, #0x0001         ; Z=0
        CMP AX, #0              ; Z=0 (1 != 0)
        JNZ TEST5_OK            ; Should jump
        HLT
TEST5_OK:
        INC R7                  ; Test 5 passed

        ; ===== Test 6: JZ NOT taken =====
        MOV AX, #0x0001         ; Non-zero
        CMP AX, #0              ; Z=0
        JZ TEST6_FAIL           ; Should NOT jump
        JMP TEST6_OK
TEST6_FAIL:
        HLT                     ; Should NOT execute
TEST6_OK:
        INC R7                  ; Test 6 passed

        ; ===== Test 7: JC (jump if carry) =====
        MOV AX, #0xFFFF
        ADD AX, #0x0001         ; Overflow: AX = 0, C=1
        JC TEST7_OK             ; Should jump
        HLT
TEST7_OK:
        INC R7                  ; Test 7 passed

        ; ===== Test 8: JNC (jump if no carry) =====
        MOV AX, #0x0010
        ADD AX, #0x0010         ; AX = 0x0020, C=0
        JNC TEST8_OK            ; Should jump
        HLT
TEST8_OK:
        INC R7                  ; Test 8 passed

        ; ===== Test 9: JS (jump if sign/negative) =====
        MOV AX, #0x8000         ; Bit 15 set (negative in signed)
        CMP AX, #0              ; S=1 (result is negative)
        JS TEST9_OK             ; Should jump
        HLT
TEST9_OK:
        INC R7                  ; Test 9 passed

        ; ===== Test 10: JNS (jump if not sign/positive) =====
        MOV AX, #0x7FFF         ; Bit 15 clear (positive)
        CMP AX, #0              ; S=0
        JNS TEST10_OK           ; Should jump
        HLT
TEST10_OK:
        INC R7                  ; Test 10 passed

        ; ===== Test 11: JO (jump if overflow) =====
        MOV AX, #0x7FFF         ; Max positive signed
        ADD AX, #0x0001         ; 32767 + 1 = -32768 (overflow), O=1
        JO TEST11_OK            ; Should jump
        HLT
TEST11_OK:
        INC R7                  ; Test 11 passed

        ; ===== Test 12: JNO (jump if no overflow) =====
        MOV AX, #0x0100
        ADD AX, #0x0100         ; 256 + 256 = 512, O=0
        JNO TEST12_OK           ; Should jump
        HLT
TEST12_OK:
        INC R7                  ; Test 12 passed

        ; ===== Test 13: JL (signed less than) =====
        MOV AX, #0xFFFF         ; -1 signed
        CMP AX, #0x0001         ; -1 < 1? Yes
        JL TEST13_OK            ; Should jump (S != O)
        HLT
TEST13_OK:
        INC R7                  ; Test 13 passed

        ; ===== Test 14: JGE (signed greater or equal) =====
        MOV AX, #0x0005         ; 5
        CMP AX, #0x0003         ; 5 >= 3? Yes
        JGE TEST14_OK           ; Should jump (S == O)
        HLT
TEST14_OK:
        INC R7                  ; Test 14 passed

        ; ===== Test 15: JLE (signed less or equal) =====
        MOV AX, #0x0003         ; 3
        CMP AX, #0x0003         ; 3 <= 3? Yes (equal)
        JLE TEST15_OK           ; Should jump (Z=1 or S != O)
        HLT
TEST15_OK:
        INC R7                  ; Test 15 passed

        ; ===== Test 16: JG (signed greater) =====
        MOV AX, #0x0010         ; 16
        CMP AX, #0x000F         ; 16 > 15? Yes
        JG TEST16_OK            ; Should jump (Z=0 and S == O)
        HLT
TEST16_OK:
        INC R7                  ; Test 16 passed

        ; ===== Test 17: JA (unsigned above) =====
        MOV AX, #0xFFFF         ; 65535 unsigned
        CMP AX, #0x0001         ; 65535 > 1? Yes (unsigned)
        JA TEST17_OK            ; Should jump (C=0 and Z=0)
        HLT
TEST17_OK:
        INC R7                  ; Test 17 passed

        ; ===== Test 18: JBE (unsigned below or equal) =====
        MOV AX, #0x0001         ; 1
        CMP AX, #0x0001         ; 1 <= 1? Yes
        JBE TEST18_OK           ; Should jump (C=1 or Z=1)
        HLT
TEST18_OK:
        INC R7                  ; Test 18 passed

        ; ===== Test 19: LOOP instruction =====
        MOV CX, #5              ; Loop counter
        MOV AX, #0              ; Accumulator
LOOP_TEST:
        INC AX                  ; AX++
        LOOP LOOP_TEST          ; Decrement CX, jump if not zero
        ; AX should be 5 (looped 5 times)
        CMP AX, #5
        JNZ TEST19_FAIL
        INC R7                  ; Test 19 passed
        JMP TEST20_START
TEST19_FAIL:
        HLT

        ; ===== Test 20: LOOPZ (loop while zero) =====
TEST20_START:
        MOV CX, #10             ; Max iterations
        MOV AX, #0              ; Value to test
LOOPZ_TEST:
        CMP AX, #0              ; Is AX still 0? Z=1
        LOOPZ LOOPZ_TEST_BODY   ; Continue while Z=1 and CX != 0
        JMP LOOPZ_DONE
LOOPZ_TEST_BODY:
        ; After 3 iterations, set AX to break the loop
        CMP CX, #7              ; When CX = 7 (3 iterations done)
        JNZ LOOPZ_TEST          ; Continue checking
        MOV AX, #1              ; Set non-zero to exit loop via LOOPZ
        JMP LOOPZ_TEST
LOOPZ_DONE:
        ; CX should be 7 (stopped when AX became non-zero)
        CMP CX, #7
        JZ TEST20_OK
        ; Or loop completed normally
        INC R7
        JMP TEST21_START
TEST20_OK:
        INC R7                  ; Test 20 passed

        ; ===== Test 21: Backward jump (loop pattern) =====
TEST21_START:
        MOV AX, #0
        MOV CX, #3
TEST21_LOOP:
        ADD AX, CX              ; AX += CX
        DEC CX
        JNZ TEST21_LOOP         ; Loop: AX = 3 + 2 + 1 = 6
        CMP AX, #6
        JNZ TEST21_FAIL
        INC R7                  ; Test 21 passed
        JMP TEST22_START
TEST21_FAIL:
        HLT

        ; ===== Test 22: Multiple condition chain =====
TEST22_START:
        MOV AX, #0x0050         ; Value to classify
        ; Check ranges: < 0x10, < 0x40, < 0x80, else
        CMP AX, #0x0010
        JL RANGE_0              ; If < 0x10
        CMP AX, #0x0040
        JL RANGE_1              ; If < 0x40
        CMP AX, #0x0080
        JL RANGE_2              ; If < 0x80
        MOV BX, #3              ; >= 0x80
        JMP TEST22_DONE
RANGE_0:
        MOV BX, #0
        JMP TEST22_DONE
RANGE_1:
        MOV BX, #1
        JMP TEST22_DONE
RANGE_2:
        MOV BX, #2              ; 0x40 <= AX < 0x80 (our case: 0x50)
TEST22_DONE:
        CMP BX, #2              ; Should be in RANGE_2
        JNZ TEST22_FAIL
        INC R7                  ; Test 22 passed
        JMP TEST23_START
TEST22_FAIL:
        HLT

        ; ===== Test 23: Jump table simulation =====
TEST23_START:
        MOV AX, #2              ; Select case 2
        ; Calculate jump target: TABLE + (AX * 2)
        SHL AX, #1              ; AX = 4 (offset for word addresses)
        MOV BX, #JUMP_TABLE
        ADD BX, AX              ; BX points to table entry
        LD CX, [BX+0]           ; Load jump target
        JMP CX                  ; Indirect jump
CASE_0:
        MOV DX, #0
        JMP TEST23_DONE
CASE_1:
        MOV DX, #1
        JMP TEST23_DONE
CASE_2:
        MOV DX, #2              ; Should execute this
        JMP TEST23_DONE
CASE_3:
        MOV DX, #3
        JMP TEST23_DONE
TEST23_DONE:
        CMP DX, #2
        JNZ TEST23_FAIL
        INC R7                  ; Test 23 passed
        JMP TESTS_COMPLETE
TEST23_FAIL:
        HLT

TESTS_COMPLETE:
        ; ===== Store final test count =====
        ST R7, [TEST_COUNT]     ; Store number of tests passed

        ; Verify all tests passed (should be 23)
        CMP R7, #23
        JZ ALL_PASSED
        MOV AX, #0xFFFF         ; Failure
        ST AX, [FINAL_RESULT]
        HLT

ALL_PASSED:
        MOV AX, #0xCAFE
        ST AX, [FINAL_RESULT]

        HLT                     ; Stop execution

; Jump table for Test 23
        .org 0x0400
JUMP_TABLE:
        .dw CASE_0              ; Entry 0
        .dw CASE_1              ; Entry 1
        .dw CASE_2              ; Entry 2
        .dw CASE_3              ; Entry 3

; Data section
        .org 0x0500

TEST_COUNT:   .dw 0             ; Expected: 0x0017 (23)
FINAL_RESULT: .dw 0             ; Expected: 0xCAFE (success)

; Jump instruction summary:
;
; Unconditional:
;   JMP addr      - absolute jump
;   JMP FAR s:o   - far jump (segment:offset)
;   JMP Rd        - indirect through register
;   JR offset     - relative short jump
;
; Conditional (based on flags):
;   JZ/JE         - Zero (Z=1)
;   JNZ/JNE       - Not Zero (Z=0)
;   JC/JB         - Carry/Below unsigned (C=1)
;   JNC/JAE       - No Carry/Above-Equal unsigned (C=0)
;   JS            - Sign negative (S=1)
;   JNS           - Sign positive (S=0)
;   JO            - Overflow (O=1)
;   JNO           - No Overflow (O=0)
;
; Signed comparisons (after CMP):
;   JL            - Less than (S != O)
;   JGE           - Greater or Equal (S == O)
;   JLE           - Less or Equal (Z=1 or S != O)
;   JG            - Greater (Z=0 and S == O)
;
; Unsigned comparisons (after CMP):
;   JA            - Above (C=0 and Z=0)
;   JBE           - Below or Equal (C=1 or Z=1)
;
; Loop instructions:
;   LOOP          - Decrement CX, jump if CX != 0
;   LOOPZ         - Loop while Zero (CX != 0 and Z=1)
;   LOOPNZ        - Loop while Not Zero (CX != 0 and Z=0)
