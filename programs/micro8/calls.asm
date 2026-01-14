; calls.asm - Test subroutine CALL and RET instructions
; Tests: CALL, RET, nested calls, parameter passing
; Demonstrates proper stack-based subroutine calling convention
;
; Micro8 Architecture Test Program

        .org 0x0200             ; Start after reserved area

START:
        ; Initialize stack pointer
        LDI16 SP, 0x01FD        ; SP = top of stack area

        ; ===== Test 1: Simple CALL and RET =====
        LDI R0, 0x00            ; Clear R0
        CALL SET_R0_TO_42       ; Call subroutine
        ST R0, [RESULT1]        ; Store: should be 0x2A (42)

        ; ===== Test 2: CALL with parameter in register =====
        LDI R0, 21              ; Parameter: 21
        CALL DOUBLE             ; Call DOUBLE subroutine
        ST R0, [RESULT2]        ; Store: should be 0x2A (42 = 21*2)

        ; ===== Test 3: CALL that modifies multiple registers =====
        LDI R0, 0x10            ; R0 = 16
        LDI R1, 0x20            ; R1 = 32
        CALL ADD_R0_R1          ; R0 = R0 + R1
        ST R0, [RESULT3]        ; Store: should be 0x30 (48)

        ; ===== Test 4: Nested CALLs (2 levels) =====
        LDI R0, 5               ; R0 = 5
        CALL QUADRUPLE          ; Calls DOUBLE twice
        ST R0, [RESULT4]        ; Store: should be 0x14 (20 = 5*4)

        ; ===== Test 5: Deeply nested CALLs (3 levels) =====
        LDI R0, 2               ; R0 = 2
        CALL OCTUPLE            ; 2 * 8 = 16
        ST R0, [RESULT5]        ; Store: should be 0x10 (16)

        ; ===== Test 6: CALL with register preservation =====
        LDI R0, 0xAA            ; Value we want preserved
        LDI R1, 0xBB            ; Another value
        CALL PRESERVE_TEST      ; Should preserve R0, modify R1
        ST R0, [RESULT6A]       ; Store: should be 0xAA (preserved)
        ST R1, [RESULT6B]       ; Store: should be 0x55 (modified by subroutine)

        ; ===== Test 7: Subroutine that returns value in different register =====
        LDI R0, 10              ; Input in R0
        CALL COMPUTE_SQUARE     ; R1 = R0 * R0 (simplified: R0 + R0... R0 times)
        ST R1, [RESULT7]        ; Store: should be 0x64 (100 = 10*10)

        ; ===== Test 8: Multiple sequential CALLs =====
        LDI R0, 1               ; Start with 1
        CALL INCREMENT          ; R0 = 2
        CALL INCREMENT          ; R0 = 3
        CALL INCREMENT          ; R0 = 4
        CALL INCREMENT          ; R0 = 5
        ST R0, [RESULT8]        ; Store: should be 0x05

        ; ===== Test 9: Recursive countdown (limited depth) =====
        LDI R0, 5               ; Countdown from 5
        CALL COUNTDOWN          ; Recursive countdown
        ST R0, [RESULT9]        ; Store: should be 0x00 (counted down to 0)

        ; Store success marker
        LDI R0, 0x00            ; Success
        ST R0, [FINAL_RESULT]

        HLT                     ; Stop execution

; ========================================
; SUBROUTINES
; ========================================

; Simple subroutine: sets R0 to 42
SET_R0_TO_42:
        LDI R0, 42              ; R0 = 42
        RET

; Double R0: R0 = R0 * 2
DOUBLE:
        ADD R0, R0              ; R0 = R0 + R0
        RET

; Add R0 and R1: R0 = R0 + R1
ADD_R0_R1:
        ADD R0, R1              ; R0 = R0 + R1
        RET

; Quadruple R0 by calling DOUBLE twice
QUADRUPLE:
        CALL DOUBLE             ; R0 = R0 * 2
        CALL DOUBLE             ; R0 = R0 * 4
        RET

; Octuple R0 by calling QUADRUPLE then DOUBLE
OCTUPLE:
        CALL QUADRUPLE          ; R0 = R0 * 4
        CALL DOUBLE             ; R0 = R0 * 8
        RET

; Test register preservation
; Preserves R0, sets R1 to 0x55
PRESERVE_TEST:
        PUSH R0                 ; Save R0 on stack
        LDI R0, 0x55            ; Modify R0 temporarily
        MOV R1, R0              ; R1 = 0x55
        POP R0                  ; Restore R0
        RET

; Compute R0 squared, result in R1
; Uses repeated addition: R1 = R0 * R0
COMPUTE_SQUARE:
        PUSH R2                 ; Save counter register
        MOV R2, R0              ; R2 = counter = R0
        LDI R1, 0               ; R1 = accumulator = 0
SQUARE_LOOP:
        OR R2, R2               ; Test if counter is zero
        JZ SQUARE_DONE          ; If zero, done
        ADD R1, R0              ; R1 = R1 + R0
        DEC R2                  ; counter--
        JMP SQUARE_LOOP
SQUARE_DONE:
        POP R2                  ; Restore R2
        RET

; Simple increment
INCREMENT:
        INC R0                  ; R0 = R0 + 1
        RET

; Recursive countdown: decrements R0 until 0
; Uses tail recursion pattern
COUNTDOWN:
        OR R0, R0               ; Test if R0 is zero
        JZ COUNTDOWN_DONE       ; If zero, return
        DEC R0                  ; R0--
        CALL COUNTDOWN          ; Recursive call
COUNTDOWN_DONE:
        RET

; Data section
        .org 0x0300
RESULT1:      .db 0             ; Expected: 0x2A (42)
RESULT2:      .db 0             ; Expected: 0x2A (42)
RESULT3:      .db 0             ; Expected: 0x30 (48)
RESULT4:      .db 0             ; Expected: 0x14 (20)
RESULT5:      .db 0             ; Expected: 0x10 (16)
RESULT6A:     .db 0             ; Expected: 0xAA (preserved)
RESULT6B:     .db 0             ; Expected: 0x55 (modified)
RESULT7:      .db 0             ; Expected: 0x64 (100)
RESULT8:      .db 0             ; Expected: 0x05 (5)
RESULT9:      .db 0             ; Expected: 0x00 (counted to 0)
FINAL_RESULT: .db 0xFF          ; Expected: 0x00 (success)
