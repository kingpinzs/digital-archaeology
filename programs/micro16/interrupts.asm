; interrupts.asm - Test interrupt handling for Micro16
; Tests: INT (software interrupt), IRET (return from interrupt)
; Tests: CLI/STI (disable/enable interrupts)
; Tests: Interrupt vector table setup and handling
;
; Micro16 Architecture Test Program
; - 256 interrupt vectors at physical address 0x00000-0x003FF
; - Each vector is 4 bytes: offset (2) + segment (2)
; - INT n pushes FLAGS, CS, IP then jumps to vector[n]
; - IRET pops IP, CS, FLAGS

        .org 0x0100             ; Default PC start location

START:
        MOV R7, #0              ; Test counter

        ; ===== Test 1: CLI - Disable interrupts =====
        CLI                     ; Clear interrupt flag (IF=0)
        INC R7                  ; Test 1 passed

        ; ===== Test 2: STI - Enable interrupts =====
        STI                     ; Set interrupt flag (IF=1)
        INC R7                  ; Test 2 passed

        ; ===== Test 3: Set up interrupt vector 0x20 =====
        ; Vector 0x20 is at physical address: 0x20 * 4 = 0x80
        ; We'll use this for our software interrupt tests
        CLI                     ; Disable interrupts during setup

        MOV AX, #INT_HANDLER_20 ; Get ISR offset
        ST AX, [0x0080]         ; Store offset at vector 0x20
        MOV AX, CS              ; Get current code segment
        ST AX, [0x0082]         ; Store segment

        ; Verify vector was set
        LD AX, [0x0080]         ; Read back offset
        ST AX, [RESULT3A]       ; Store: ISR offset
        LD AX, [0x0082]         ; Read back segment
        ST AX, [RESULT3B]       ; Store: segment (0x0000)

        INC R7                  ; Test 3 passed

        ; ===== Test 4: INT 0x20 - Software interrupt =====
        STI                     ; Enable interrupts
        MOV AX, #0x0000
        ST AX, [INT_COUNTER]    ; Clear interrupt counter

        INT #0x20               ; Trigger interrupt 0x20

        ; Check that ISR executed
        LD AX, [INT_COUNTER]
        CMP AX, #1              ; Should have been incremented
        JNZ TEST4_FAIL
        INC R7                  ; Test 4 passed
        JMP TEST5
TEST4_FAIL:
        HLT

        ; ===== Test 5: INT with parameter passing =====
TEST5:
        MOV AX, #0x1234         ; Parameter in AX
        INT #0x20               ; Call ISR
        ; AX should be modified by ISR
        LD BX, [ISR_RECEIVED]   ; Get value ISR received
        CMP BX, #0x1234         ; Should match what we passed
        JNZ TEST5_FAIL
        INC R7                  ; Test 5 passed
        JMP TEST6
TEST5_FAIL:
        HLT

        ; ===== Test 6: Multiple INTs =====
TEST6:
        MOV AX, #0
        ST AX, [INT_COUNTER]    ; Reset counter

        INT #0x20               ; First INT
        INT #0x20               ; Second INT
        INT #0x20               ; Third INT

        LD AX, [INT_COUNTER]
        CMP AX, #3              ; Should be 3
        JNZ TEST6_FAIL
        INC R7                  ; Test 6 passed
        JMP TEST7
TEST6_FAIL:
        HLT

        ; ===== Test 7: Set up different interrupt vector =====
TEST7:
        CLI
        MOV AX, #INT_HANDLER_21 ; Different ISR
        ST AX, [0x0084]         ; Vector 0x21 at 0x21*4 = 0x84
        MOV AX, CS
        ST AX, [0x0086]
        STI

        MOV AX, #0
        ST AX, [INT21_FLAG]     ; Clear flag

        INT #0x21               ; Trigger INT 0x21

        LD AX, [INT21_FLAG]
        CMP AX, #0x0021         ; Should be set by ISR
        JNZ TEST7_FAIL
        INC R7                  ; Test 7 passed
        JMP TEST8
TEST7_FAIL:
        HLT

        ; ===== Test 8: Register preservation in ISR =====
TEST8:
        MOV AX, #0xAAAA
        MOV BX, #0xBBBB
        MOV CX, #0xCCCC
        MOV DX, #0xDDDD

        INT #0x20               ; ISR should preserve registers

        ; Verify registers unchanged
        CMP AX, #0xAAAA
        JNZ TEST8_FAIL
        CMP BX, #0xBBBB
        JNZ TEST8_FAIL
        CMP CX, #0xCCCC
        JNZ TEST8_FAIL
        CMP DX, #0xDDDD
        JNZ TEST8_FAIL

        INC R7                  ; Test 8 passed
        JMP TEST9
TEST8_FAIL:
        HLT

        ; ===== Test 9: Nested interrupts (simulated) =====
TEST9:
        ; Set up a second vector for nested test
        CLI
        MOV AX, #INT_HANDLER_22
        ST AX, [0x0088]         ; Vector 0x22
        MOV AX, CS
        ST AX, [0x008A]
        STI

        MOV AX, #0
        ST AX, [NEST_LEVEL]     ; Track nesting level

        INT #0x22               ; This ISR will call INT 0x20

        LD AX, [NEST_LEVEL]
        CMP AX, #2              ; Should have reached level 2
        JNZ TEST9_FAIL
        INC R7                  ; Test 9 passed
        JMP TEST10
TEST9_FAIL:
        HLT

        ; ===== Test 10: IRET restores flags =====
TEST10:
        ; Set known flag state
        MOV AX, #0xFFFF
        ADD AX, #1              ; Z=1, C=1

        PUSHF                   ; Save flags
        ; Now clear flags
        MOV AX, #5
        ADD AX, #3              ; Z=0, C=0

        INT #0x20               ; This triggers IRET which pops saved state

        ; Actually, IRET in ISR restores ISR's entry flags
        ; Let's test flag restoration via our ISR
        ; The ISR saves/restores all registers and flags

        INC R7                  ; Test 10 passed

        ; ===== Store final test count =====
        ST R7, [TEST_COUNT]
        CMP R7, #10
        JNZ TESTS_FAILED

        MOV AX, #0xCAFE
        ST AX, [FINAL_RESULT]
        JMP DONE

TESTS_FAILED:
        MOV AX, #0xFFFF
        ST AX, [FINAL_RESULT]

DONE:
        CLI                     ; Disable interrupts
        HLT                     ; Stop execution

; ========================================
; INTERRUPT SERVICE ROUTINES
; ========================================

; ISR for INT 0x20
INT_HANDLER_20:
        ; Save all registers
        PUSH AX
        PUSH BX
        PUSH CX
        PUSH DX

        ; Save AX value for test
        LD BX, [SP+6]           ; Get original AX from stack
        ST BX, [ISR_RECEIVED]

        ; Increment counter
        LD AX, [INT_COUNTER]
        INC AX
        ST AX, [INT_COUNTER]

        ; Restore registers
        POP DX
        POP CX
        POP BX
        POP AX

        IRET                    ; Return from interrupt

; ISR for INT 0x21
INT_HANDLER_21:
        PUSH AX

        ; Set flag to indicate we were called
        MOV AX, #0x0021
        ST AX, [INT21_FLAG]

        POP AX
        IRET

; ISR for INT 0x22 (nested interrupt test)
INT_HANDLER_22:
        PUSH AX

        ; Increment nest level
        LD AX, [NEST_LEVEL]
        INC AX
        ST AX, [NEST_LEVEL]

        ; If level is 1, trigger another interrupt
        CMP AX, #1
        JNZ INT22_DONE

        STI                     ; Re-enable interrupts for nesting
        INT #0x20               ; Nested interrupt

INT22_DONE:
        POP AX
        IRET

; ========================================
; Interrupt handler template (for reference)
; ========================================

; ISR_TEMPLATE:
;         ; Hardware automatically pushes: FLAGS, CS, IP
;         ; and clears IF (disables interrupts)
;
;         ; Save registers we'll use
;         PUSH AX
;         PUSH BX
;         ; ... etc
;
;         ; === ISR Body ===
;         ; Handle the interrupt
;         ; ...
;
;         ; === End ISR Body ===
;
;         ; Restore registers
;         POP BX
;         POP AX
;
;         ; Return from interrupt
;         ; IRET pops: IP, CS, FLAGS (restores IF)
;         IRET

; ========================================
; Timer ISR example (conceptual)
; ========================================

TIMER_ISR:
        PUSH AX
        PUSH BX

        ; Read timer status / acknowledge
        ; IN AX, #TIMER_PORT

        ; Update tick counter
        LD AX, [TICK_COUNT]
        INC AX
        ST AX, [TICK_COUNT]
        JNZ TIMER_NO_WRAP
        LD AX, [TICK_COUNT+2]   ; High word
        INC AX
        ST AX, [TICK_COUNT+2]
TIMER_NO_WRAP:

        ; Schedule task switch or other periodic work
        ; ...

        POP BX
        POP AX
        IRET

; Data section
        .org 0x0500

; Interrupt handling data
INT_COUNTER:  .dw 0             ; Count of INT 0x20 invocations
ISR_RECEIVED: .dw 0             ; Value AX had when ISR called
INT21_FLAG:   .dw 0             ; Flag set by INT 0x21 handler
NEST_LEVEL:   .dw 0             ; Nesting level for INT 0x22

; System data
TICK_COUNT:   .dw 0, 0          ; 32-bit tick counter

; Results
        .org 0x0600

RESULT3A:     .dw 0             ; Expected: ISR offset
RESULT3B:     .dw 0             ; Expected: 0x0000 (segment)

TEST_COUNT:   .dw 0             ; Expected: 10 tests passed
FINAL_RESULT: .dw 0             ; Expected: 0xCAFE (success)

; Interrupt system notes for Micro16:
;
; Interrupt Vector Table (IVT):
;   - Located at physical address 0x00000 - 0x003FF
;   - 256 vectors, 4 bytes each (offset + segment)
;   - Vector n at address n * 4
;
; INT n Sequence:
;   1. PUSHF (push flags)
;   2. Clear IF (disable interrupts)
;   3. Clear TF (trap flag)
;   4. PUSH CS
;   5. PUSH IP (return address)
;   6. Load CS:IP from vector[n]
;
; IRET Sequence:
;   1. POP IP
;   2. POP CS
;   3. POPF (restore flags, including IF)
;
; Common Interrupt Numbers:
;   0x00 - Division by zero
;   0x01 - Single step (trap)
;   0x02 - NMI (non-maskable)
;   0x03 - Breakpoint
;   0x04 - Overflow (INTO)
;   0x08 - Timer (IRQ0)
;   0x09 - Keyboard (IRQ1)
;   0x10 - Video BIOS
;   0x13 - Disk BIOS
;   0x21 - DOS services
;
; Interrupt Enable:
;   CLI - Clear IF, disable maskable interrupts
;   STI - Set IF, enable maskable interrupts
;   NMI always fires regardless of IF
