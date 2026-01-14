; jumps.asm - Test jump and branch instructions
; Tests: JMP, JR, JZ, JNZ, JC, JNC, JS, JNS, JO, JNO
; Tests: JRZ, JRNZ, JRC, JRNC, JP HL
;
; Micro8 Architecture Test Program

        .org 0x0200             ; Start after reserved area

START:
        LDI R7, 0x00            ; R7 = test counter (increments on each passed test)

        ; ===== Test JMP (unconditional absolute jump) =====
        JMP TEST_JMP_OK
        LDI R0, 0xFF            ; Should NOT execute
        HLT                     ; Should NOT execute
TEST_JMP_OK:
        INC R7                  ; Test 1 passed

        ; ===== Test JR (unconditional relative jump) =====
        JR TEST_JR_OK           ; Forward relative jump
        LDI R0, 0xFF            ; Should NOT execute
        HLT                     ; Should NOT execute
TEST_JR_OK:
        INC R7                  ; Test 2 passed

        ; ===== Test JZ (jump if zero) =====
        LDI R0, 0x00            ; R0 = 0, sets Z=1
        OR R0, R0               ; Ensure Z flag is set
        JZ TEST_JZ_OK           ; Should jump
        LDI R0, 0xFF            ; Should NOT execute
        HLT
TEST_JZ_OK:
        INC R7                  ; Test 3 passed

        ; ===== Test JNZ (jump if not zero) =====
        LDI R0, 0x01            ; R0 = 1, Z=0
        OR R0, R0               ; Ensure Z flag is clear
        JNZ TEST_JNZ_OK         ; Should jump
        LDI R0, 0xFF            ; Should NOT execute
        HLT
TEST_JNZ_OK:
        INC R7                  ; Test 4 passed

        ; ===== Test JZ NOT taken =====
        LDI R0, 0x01            ; R0 = 1, Z=0
        OR R0, R0
        JZ JZ_FAIL              ; Should NOT jump
        JMP JZ_NOT_TAKEN_OK     ; Skip failure path
JZ_FAIL:
        HLT                     ; Should NOT execute
JZ_NOT_TAKEN_OK:
        INC R7                  ; Test 5 passed

        ; ===== Test JNZ NOT taken =====
        LDI R0, 0x00            ; R0 = 0, Z=1
        OR R0, R0
        JNZ JNZ_FAIL            ; Should NOT jump
        JMP JNZ_NOT_TAKEN_OK    ; Skip failure path
JNZ_FAIL:
        HLT                     ; Should NOT execute
JNZ_NOT_TAKEN_OK:
        INC R7                  ; Test 6 passed

        ; ===== Test JC (jump if carry) =====
        LDI R0, 0xFF            ; R0 = 255
        LDI R1, 0x01            ; R1 = 1
        ADD R0, R1              ; 255 + 1 = 256, overflows, C=1
        JC TEST_JC_OK           ; Should jump
        HLT
TEST_JC_OK:
        INC R7                  ; Test 7 passed

        ; ===== Test JNC (jump if no carry) =====
        LDI R0, 0x10            ; R0 = 16
        LDI R1, 0x10            ; R1 = 16
        ADD R0, R1              ; 16 + 16 = 32, no overflow, C=0
        JNC TEST_JNC_OK         ; Should jump
        HLT
TEST_JNC_OK:
        INC R7                  ; Test 8 passed

        ; ===== Test JS (jump if sign/negative) =====
        LDI R0, 0x80            ; R0 = 128 (bit 7 set, S=1)
        OR R0, R0               ; Set S flag based on value
        JS TEST_JS_OK           ; Should jump (S=1)
        HLT
TEST_JS_OK:
        INC R7                  ; Test 9 passed

        ; ===== Test JNS (jump if not sign/positive) =====
        LDI R0, 0x7F            ; R0 = 127 (bit 7 clear, S=0)
        OR R0, R0               ; Set S flag based on value
        JNS TEST_JNS_OK         ; Should jump (S=0)
        HLT
TEST_JNS_OK:
        INC R7                  ; Test 10 passed

        ; ===== Test JO (jump if overflow) =====
        ; Signed overflow: 127 + 1 = 128 (0x80), which is -128 in signed
        LDI R0, 0x7F            ; R0 = 127 (max positive signed)
        LDI R1, 0x01            ; R1 = 1
        ADD R0, R1              ; 127 + 1 = -128 (signed overflow), O=1
        JO TEST_JO_OK           ; Should jump
        HLT
TEST_JO_OK:
        INC R7                  ; Test 11 passed

        ; ===== Test JNO (jump if no overflow) =====
        LDI R0, 0x10            ; R0 = 16
        LDI R1, 0x10            ; R1 = 16
        ADD R0, R1              ; 16 + 16 = 32, no signed overflow, O=0
        JNO TEST_JNO_OK         ; Should jump
        HLT
TEST_JNO_OK:
        INC R7                  ; Test 12 passed

        ; ===== Test JRZ (relative jump if zero) =====
        LDI R0, 0x00            ; Z=1
        OR R0, R0
        JRZ TEST_JRZ_OK         ; Should take relative jump
        HLT
TEST_JRZ_OK:
        INC R7                  ; Test 13 passed

        ; ===== Test JRNZ (relative jump if not zero) =====
        LDI R0, 0x01            ; Z=0
        OR R0, R0
        JRNZ TEST_JRNZ_OK       ; Should take relative jump
        HLT
TEST_JRNZ_OK:
        INC R7                  ; Test 14 passed

        ; ===== Test JRC (relative jump if carry) =====
        LDI R0, 0xFF
        LDI R1, 0x01
        ADD R0, R1              ; C=1
        JRC TEST_JRC_OK         ; Should take relative jump
        HLT
TEST_JRC_OK:
        INC R7                  ; Test 15 passed

        ; ===== Test JRNC (relative jump if no carry) =====
        LDI R0, 0x10
        LDI R1, 0x10
        ADD R0, R1              ; C=0
        JRNC TEST_JRNC_OK       ; Should take relative jump
        HLT
TEST_JRNC_OK:
        INC R7                  ; Test 16 passed

        ; ===== Test JP HL (indirect jump through HL) =====
        LDI16 HL, TEST_JP_HL_OK ; Load target address into HL
        JP HL                   ; Jump to address in HL
        HLT                     ; Should NOT execute
TEST_JP_HL_OK:
        INC R7                  ; Test 17 passed

        ; ===== Test backward relative jump (loop) =====
        LDI R0, 3               ; Loop counter
LOOP_TEST:
        DEC R0                  ; Decrement counter
        JRNZ LOOP_TEST          ; Loop back if not zero
        INC R7                  ; Test 18 passed (loop completed)

        ; ===== Store final test count =====
        ST R7, [TEST_COUNT]     ; Store: should be 18 (0x12)

        ; Final verification
        CMPI R7, 18             ; Compare with expected count
        JZ ALL_TESTS_PASSED
        LDI R0, 0xFF            ; Failure marker
        ST R0, [FINAL_RESULT]
        HLT

ALL_TESTS_PASSED:
        LDI R0, 0x00            ; Success marker
        ST R0, [FINAL_RESULT]

        HLT                     ; Stop execution

; Data section
        .org 0x0500
TEST_COUNT:   .db 0             ; Expected: 0x12 (18 tests passed)
FINAL_RESULT: .db 0xFF          ; Expected: 0x00 (success)
