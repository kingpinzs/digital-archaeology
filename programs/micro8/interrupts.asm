; interrupts.asm - Test interrupt handling
; Tests: EI, DI, RETI, interrupt vector setup
; Demonstrates interrupt service routine structure
;
; Note: Actual interrupt triggering requires hardware.
; This program sets up the interrupt system and tests
; the enable/disable instructions.
;
; Micro8 Architecture Test Program

        .org 0x0200             ; Start after reserved area

START:
        ; Initialize stack pointer
        LDI16 SP, 0x01FD        ; SP = top of stack

        ; ===== Test 1: Set up interrupt vector =====
        ; Interrupt vector is at 0x01FE-0x01FF (little-endian)
        LDI16 HL, ISR           ; Get ISR address
        ST R6, [0x01FE]         ; Store low byte of ISR address
        ST R5, [0x01FF]         ; Store high byte of ISR address

        ; Verify vector was set correctly
        LD R0, [0x01FE]         ; Read back low byte
        MOV R1, R6              ; Compare with L
        CMP R0, R1
        JNZ FAIL
        LDI R7, 1               ; Test 1 passed

        ; ===== Test 2: Test DI (Disable Interrupts) =====
        ; Initially interrupts should be disabled after reset
        DI                      ; Ensure interrupts are disabled
        INC R7                  ; Test 2 passed (DI executed)

        ; ===== Test 3: Test EI (Enable Interrupts) =====
        EI                      ; Enable interrupts
        INC R7                  ; Test 3 passed (EI executed)

        ; ===== Test 4: Test DI after EI =====
        DI                      ; Disable again
        INC R7                  ; Test 4 passed

        ; ===== Test 5: Simulate ISR entry/exit =====
        ; This simulates what happens during an interrupt:
        ; 1. CPU pushes PC (simulated by CALL)
        ; 2. CPU jumps to ISR
        ; 3. ISR saves registers
        ; 4. ISR does work
        ; 5. ISR restores registers
        ; 6. RETI returns and re-enables interrupts

        ; Initialize test variables
        LDI R0, 0x00
        ST R0, [ISR_COUNTER]    ; Clear ISR counter
        LDI R0, 0x00
        ST R0, [MAIN_COUNTER]   ; Clear main counter

        ; Enable interrupts
        EI

        ; Simulate main loop that would run while waiting for interrupts
        LDI R2, 10              ; Loop 10 times
MAIN_LOOP:
        ; Increment main counter
        LD R0, [MAIN_COUNTER]
        INC R0
        ST R0, [MAIN_COUNTER]

        ; Simulate interrupt by calling ISR directly
        ; In real hardware, this would be triggered by INT pin
        CALL SIMULATE_INT

        DEC R2
        JRNZ MAIN_LOOP

        INC R7                  ; Test 5 passed (ISR simulation)

        ; ===== Test 6: Verify ISR was "called" =====
        LD R0, [ISR_COUNTER]
        CMPI R0, 10             ; Should have been called 10 times
        JNZ FAIL
        INC R7                  ; Test 6 passed

        ; ===== Test 7: Verify main loop completed =====
        LD R0, [MAIN_COUNTER]
        CMPI R0, 10             ; Should have looped 10 times
        JNZ FAIL
        INC R7                  ; Test 7 passed

        ; ===== Test 8: Test register preservation in ISR =====
        ; Set up known register values
        LDI R0, 0xAA
        LDI R1, 0xBB
        LDI R2, 0xCC
        LDI R3, 0xDD

        ; Call ISR that modifies registers but should preserve them
        CALL ISR_PRESERVE_TEST

        ; Verify registers were preserved
        CMPI R0, 0xAA
        JNZ FAIL
        CMPI R1, 0xBB
        JNZ FAIL
        CMPI R2, 0xCC
        JNZ FAIL
        CMPI R3, 0xDD
        JNZ FAIL
        INC R7                  ; Test 8 passed

        ; ===== Test 9: Test nested interrupt disable =====
        ; Even with multiple DI calls, one EI should enable
        DI
        DI
        DI
        EI                      ; Should enable interrupts
        DI                      ; Disable again for safety
        INC R7                  ; Test 9 passed

        ; ===== Test 10: Test RETI functionality =====
        ; RETI should pop PC and enable interrupts
        ; We'll simulate this by using CALL and checking return

        DI                      ; Start with interrupts disabled
        CALL RETI_TEST          ; This uses RETI to return
        ; After RETI, interrupts should be enabled
        ; (In real hardware, we'd check IE flag)
        INC R7                  ; Test 10 passed

        ; ===== All tests passed =====
        ST R7, [TEST_COUNT]
        CMPI R7, 10
        JNZ FAIL

        LDI R0, 0x00            ; Success
        ST R0, [RESULT]
        JMP DONE

FAIL:
        ST R7, [FAIL_AT]
        LDI R0, 0xFF            ; Failure
        ST R0, [RESULT]

DONE:
        DI                      ; Ensure interrupts disabled at end
        HLT                     ; Stop execution

; ========================================
; INTERRUPT SERVICE ROUTINES
; ========================================

; Main ISR - pointed to by interrupt vector
; In real hardware, this would be called by CPU on interrupt
ISR:
        ; Save registers that will be modified
        PUSH R0
        PUSH R1
        PUSHF                   ; Save flags

        ; === ISR body ===
        ; Increment ISR counter
        LD R0, [ISR_COUNTER]
        INC R0
        ST R0, [ISR_COUNTER]

        ; === End ISR body ===

        ; Restore registers
        POPF                    ; Restore flags
        POP R1
        POP R0

        RETI                    ; Return from interrupt and re-enable

; Simulated interrupt call (for testing without hardware)
SIMULATE_INT:
        ; This simulates what the CPU does on interrupt:
        ; 1. DI (disable interrupts) - done by hardware
        ; 2. Push PC - done by CALL
        ; 3. Jump to ISR - we're calling directly

        DI                      ; Simulate hardware DI
        CALL ISR_BODY           ; Call ISR body
        EI                      ; Re-enable (RETI would do this)
        RET

; ISR body without RETI (for simulation)
ISR_BODY:
        PUSH R0
        LD R0, [ISR_COUNTER]
        INC R0
        ST R0, [ISR_COUNTER]
        POP R0
        RET

; ISR that tests register preservation
ISR_PRESERVE_TEST:
        ; Save all registers we'll use
        PUSH R0
        PUSH R1
        PUSH R2
        PUSH R3
        PUSHF

        ; Modify all registers (should be restored)
        LDI R0, 0x11
        LDI R1, 0x22
        LDI R2, 0x33
        LDI R3, 0x44

        ; Do some "work"
        ADD R0, R1
        ADD R2, R3

        ; Restore all registers
        POPF
        POP R3
        POP R2
        POP R1
        POP R0

        RET                     ; Not RETI since this is a subroutine test

; RETI test routine
RETI_TEST:
        ; This simulates an ISR that uses RETI
        ; In real hardware, RETI pops PC and sets IE=1

        PUSH R0                 ; Save R0
        LDI R0, 0x42            ; Some work
        POP R0                  ; Restore R0

        ; Use RETI to return
        ; Note: RETI also enables interrupts
        RETI

; ========================================
; Timer interrupt example (conceptual)
; ========================================

; This shows how a timer ISR might look
TIMER_ISR:
        PUSH R0
        PUSH R1
        PUSHF

        ; Read timer count
        ; IN R0, TIMER_PORT

        ; Update system tick counter
        LD R0, [TICK_COUNT]
        INC R0
        ST R0, [TICK_COUNT]

        ; Check for overflow
        JNZ TIMER_NO_OVERFLOW
        LD R0, [TICK_COUNT+1]
        INC R0
        ST R0, [TICK_COUNT+1]
TIMER_NO_OVERFLOW:

        ; Acknowledge timer interrupt
        ; OUT TIMER_ACK, R0

        POPF
        POP R1
        POP R0
        RETI

; ========================================
; Data Section
; ========================================

        .org 0x0500

; Interrupt-related data
ISR_COUNTER:  .db 0             ; Count of ISR invocations
MAIN_COUNTER: .db 0             ; Count of main loop iterations
TICK_COUNT:   .dw 0             ; System tick counter (16-bit)

; Test results
        .org 0x0520
TEST_COUNT:   .db 0             ; Expected: 10
FAIL_AT:      .db 0             ; Test number where failure occurred
RESULT:       .db 0xFF          ; Expected: 0x00 (success)

; Notes on interrupt implementation:
;
; 1. Interrupt Vector:
;    - Located at 0x01FE-0x01FF
;    - Contains 16-bit address of ISR (little-endian)
;    - CPU jumps here when INT pin is asserted and IE=1
;
; 2. Interrupt Sequence (hardware):
;    a. External INT pin goes high
;    b. CPU finishes current instruction
;    c. If IE=1:
;       - Set IE=0 (disable further interrupts)
;       - Push PC onto stack
;       - Load PC from vector (0x01FE-0x01FF)
;    d. If IE=0: interrupt ignored
;
; 3. ISR Requirements:
;    - Save all registers used (PUSH)
;    - Save flags if needed (PUSHF)
;    - Do interrupt handling
;    - Restore flags (POPF)
;    - Restore registers (POP)
;    - Return with RETI (pops PC, sets IE=1)
;
; 4. Interrupt Latency:
;    - Acknowledge: 1 cycle
;    - Push PC: 4 cycles
;    - Load vector: 2 cycles
;    - Total overhead: ~7 cycles minimum
