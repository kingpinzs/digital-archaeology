; stack.asm - Test stack operations for Micro16
; Tests: PUSH, POP (registers and segments), PUSHA, POPA, PUSHF, POPF
; Tests: ENTER, LEAVE (stack frame setup/teardown)
;
; Micro16 Architecture Test Program
; - Stack grows downward (decrement before push)
; - SP points to last pushed value
; - 16-bit stack operations (words)

        .org 0x0100             ; Default PC start location

START:
        ; Note: SP is initialized to 0xFFFE in SS segment (0x0F00:0xFFFE)
        ; We'll use a local stack area for testing

        ; ===== Test 1: Basic PUSH/POP =====
        MOV AX, #0xAAAA         ; AX = 0xAAAA
        PUSH AX                 ; Push AX onto stack
        MOV AX, #0x0000         ; Clear AX
        POP AX                  ; Pop back into AX
        ST AX, [RESULT1]        ; Store: should be 0xAAAA

        ; ===== Test 2: PUSH/POP multiple registers =====
        MOV AX, #0x1111
        MOV BX, #0x2222
        MOV CX, #0x3333
        PUSH AX                 ; Push 0x1111
        PUSH BX                 ; Push 0x2222
        PUSH CX                 ; Push 0x3333

        ; Pop in reverse order (LIFO)
        POP DX                  ; DX = 0x3333 (last in, first out)
        POP SI                  ; SI = 0x2222
        POP DI                  ; DI = 0x1111 (first in, last out)

        ST DX, [RESULT2A]       ; Store: 0x3333
        ST SI, [RESULT2B]       ; Store: 0x2222
        ST DI, [RESULT2C]       ; Store: 0x1111

        ; ===== Test 3: Stack order verification =====
        MOV AX, #0x0001         ; First value
        MOV BX, #0x0002         ; Second value
        MOV CX, #0x0003         ; Third value
        MOV DX, #0x0004         ; Fourth value

        PUSH AX
        PUSH BX
        PUSH CX
        PUSH DX

        ; Pop into different registers to verify order
        POP R7                  ; R7 = 4 (most recent)
        POP BP                  ; BP = 3
        POP DI                  ; DI = 2
        POP SI                  ; SI = 1 (oldest)

        ; Sum should be 1+2+3+4 = 10
        MOV AX, R7
        ADD AX, BP
        ADD AX, DI
        ADD AX, SI
        ST AX, [RESULT3]        ; Store: 0x000A (10)

        ; ===== Test 4: Push segment register =====
        MOV AX, DS              ; Get current DS
        PUSH DS                 ; Push DS
        MOV AX, #0x1234         ; Change AX
        MOV DS, AX              ; Temporarily change DS (dangerous!)
        MOV BX, DS              ; BX = 0x1234
        POP DS                  ; Restore DS
        MOV CX, DS              ; CX = original DS
        ST BX, [RESULT4A]       ; Store: 0x1234 (modified)
        ST CX, [RESULT4B]       ; Store: 0x0000 (original, restored)

        ; ===== Test 5: PUSHF/POPF (flags) =====
        ; Create known flag state: set Z and C
        MOV AX, #0xFFFF
        ADD AX, #0x0001         ; AX = 0, Z=1, C=1
        PUSHF                   ; Save flags

        ; Change flags
        MOV AX, #0x0005         ; Non-zero, no carry
        ADD AX, #0x0003         ; Z=0, C=0

        POPF                    ; Restore flags (Z=1, C=1)

        ; Test that Z flag was restored
        JZ FLAGS_OK
        MOV AX, #0xFFFF         ; Should not execute
        JMP FLAGS_DONE
FLAGS_OK:
        MOV AX, #0x0001         ; Flag restore worked
FLAGS_DONE:
        ST AX, [RESULT5]        ; Store: 0x0001

        ; ===== Test 6: PUSHA (push all registers) =====
        MOV AX, #0x0100
        MOV BX, #0x0200
        MOV CX, #0x0300
        MOV DX, #0x0400
        MOV SI, #0x0500
        MOV DI, #0x0600
        MOV BP, #0x0700

        PUSHA                   ; Push all general registers

        ; Clear all registers
        MOV AX, #0
        MOV BX, #0
        MOV CX, #0
        MOV DX, #0
        MOV SI, #0
        MOV DI, #0
        MOV BP, #0

        POPA                    ; Restore all registers

        ; Verify registers restored
        ST AX, [RESULT6A]       ; Store: 0x0100
        ST BX, [RESULT6B]       ; Store: 0x0200
        ST CX, [RESULT6C]       ; Store: 0x0300
        ST DX, [RESULT6D]       ; Store: 0x0400

        ; ===== Test 7: ENTER (create stack frame) =====
        ; ENTER creates: PUSH BP; MOV BP, SP; SUB SP, #locals
        MOV AX, #0xBEEF         ; Value to preserve
        PUSH AX                 ; Save AX before ENTER

        ENTER #4                ; Create frame with 4 bytes local space

        ; Now BP points to saved BP, locals are below SP
        ; Use BP-relative addressing for locals
        MOV AX, #0x1234
        ST AX, [BP-2]           ; Store in local variable 1
        MOV BX, #0x5678
        ST BX, [BP-4]           ; Store in local variable 2

        ; Read back locals
        LD CX, [BP-2]           ; CX = 0x1234
        LD DX, [BP-4]           ; DX = 0x5678

        LEAVE                   ; Destroy frame: MOV SP, BP; POP BP

        POP AX                  ; Restore AX (should be 0xBEEF)
        ST AX, [RESULT7A]       ; Store: 0xBEEF
        ST CX, [RESULT7B]       ; Store: 0x1234
        ST DX, [RESULT7C]       ; Store: 0x5678

        ; ===== Test 8: Nested function calls simulation =====
        MOV AX, #0x0001         ; Argument
        PUSH AX                 ; Push argument
        CALL NESTED_FUNC        ; Call function
        ADD SP, #2              ; Clean up argument
        ST AX, [RESULT8]        ; Store result: should be computed

        ; ===== Test 9: Stack depth test =====
        ; Push many values and pop them back
        MOV CX, #10             ; Push 10 values
        MOV AX, #0
PUSH_LOOP:
        INC AX
        PUSH AX
        DEC CX
        JNZ PUSH_LOOP

        ; Now pop and sum them (should be 1+2+...+10 = 55)
        MOV CX, #10
        MOV BX, #0              ; Sum accumulator
POP_LOOP:
        POP AX
        ADD BX, AX
        DEC CX
        JNZ POP_LOOP

        ST BX, [RESULT9]        ; Store: 0x0037 (55)

        ; ===== Test 10: Exchange via stack =====
        MOV AX, #0x1111
        MOV BX, #0x2222
        ; Exchange AX and BX using stack
        PUSH AX
        PUSH BX
        POP AX                  ; AX = 0x2222 (was BX)
        POP BX                  ; BX = 0x1111 (was AX)
        ST AX, [RESULT10A]      ; Store: 0x2222
        ST BX, [RESULT10B]      ; Store: 0x1111

        ; ===== Final verification =====
        MOV AX, #0xCAFE
        ST AX, [FINAL_RESULT]

        HLT                     ; Stop execution

; ========================================
; SUBROUTINES
; ========================================

NESTED_FUNC:
        ; Stack frame: [ret addr][argument]
        ; BP setup
        PUSH BP
        MOV BP, SP

        ; Get argument from [BP+4] (skip saved BP and return address)
        LD AX, [BP+4]           ; AX = argument (0x0001)

        ; Compute result: AX * 2 + 10
        ADD AX, AX              ; AX = 2
        ADD AX, #10             ; AX = 12

        ; Cleanup
        POP BP
        RET

; Data section
        .org 0x0500

; Results
RESULT1:      .dw 0             ; Expected: 0xAAAA

RESULT2A:     .dw 0             ; Expected: 0x3333 (last pushed)
RESULT2B:     .dw 0             ; Expected: 0x2222
RESULT2C:     .dw 0             ; Expected: 0x1111 (first pushed)

RESULT3:      .dw 0             ; Expected: 0x000A (10)

RESULT4A:     .dw 0             ; Expected: 0x1234 (modified DS)
RESULT4B:     .dw 0             ; Expected: 0x0000 (restored DS)

RESULT5:      .dw 0             ; Expected: 0x0001 (flags restored)

RESULT6A:     .dw 0             ; Expected: 0x0100 (AX)
RESULT6B:     .dw 0             ; Expected: 0x0200 (BX)
RESULT6C:     .dw 0             ; Expected: 0x0300 (CX)
RESULT6D:     .dw 0             ; Expected: 0x0400 (DX)

RESULT7A:     .dw 0             ; Expected: 0xBEEF (preserved)
RESULT7B:     .dw 0             ; Expected: 0x1234 (local 1)
RESULT7C:     .dw 0             ; Expected: 0x5678 (local 2)

RESULT8:      .dw 0             ; Expected: 0x000C (12 = 1*2+10)

RESULT9:      .dw 0             ; Expected: 0x0037 (55)

RESULT10A:    .dw 0             ; Expected: 0x2222 (exchanged)
RESULT10B:    .dw 0             ; Expected: 0x1111 (exchanged)

FINAL_RESULT: .dw 0             ; Expected: 0xCAFE (success)

; Stack usage notes for Micro16:
; - PUSH: SP -= 2, [SS:SP] = value
; - POP:  value = [SS:SP], SP += 2
; - PUSHA: pushes AX, BX, CX, DX, SI, DI, BP (original SP)
; - POPA:  pops in reverse order
; - ENTER #n: PUSH BP; MOV BP,SP; SUB SP,#n
; - LEAVE: MOV SP,BP; POP BP
; - Call convention: args pushed right-to-left, caller cleans up
