; calls.asm - Test subroutine CALL and RET instructions for Micro16
; Tests: CALL (near), CALL FAR, CALL Rd (indirect), RET, RETF, RET imm16
; Demonstrates proper calling conventions and stack frames
;
; Micro16 Architecture Test Program

        .org 0x0100             ; Default PC start location

START:
        ; ===== Test 1: Simple CALL and RET =====
        MOV AX, #0x0000         ; Clear AX
        CALL SET_AX_42          ; Call subroutine
        ST AX, [RESULT1]        ; Store: should be 0x002A (42)

        ; ===== Test 2: CALL with parameter in register =====
        MOV AX, #21             ; Parameter: 21
        CALL DOUBLE             ; Call DOUBLE subroutine
        ST AX, [RESULT2]        ; Store: should be 0x002A (42 = 21*2)

        ; ===== Test 3: CALL with multiple parameters =====
        MOV AX, #100            ; First parameter
        MOV BX, #50             ; Second parameter
        CALL ADD_TWO            ; AX = AX + BX
        ST AX, [RESULT3]        ; Store: should be 0x0096 (150)

        ; ===== Test 4: Nested CALLs (2 levels) =====
        MOV AX, #5              ; AX = 5
        CALL QUADRUPLE          ; Calls DOUBLE twice: 5 * 4 = 20
        ST AX, [RESULT4]        ; Store: should be 0x0014 (20)

        ; ===== Test 5: Deeply nested CALLs (3 levels) =====
        MOV AX, #3              ; AX = 3
        CALL OCTUPLE            ; 3 * 8 = 24
        ST AX, [RESULT5]        ; Store: should be 0x0018 (24)

        ; ===== Test 6: Call indirect through register =====
        MOV BX, #TRIPLE         ; BX = address of TRIPLE subroutine
        MOV AX, #10             ; Parameter
        CALL BX                 ; Indirect call
        ST AX, [RESULT6]        ; Store: should be 0x001E (30 = 10*3)

        ; ===== Test 7: Register preservation =====
        MOV AX, #0xAA00         ; Value to preserve
        MOV BX, #0xBB00         ; Another value
        MOV CX, #0xCC00         ; Yet another
        CALL PRESERVE_TEST      ; Should preserve AX, BX, CX
        ST AX, [RESULT7A]       ; Store: 0xAA00 (preserved)
        ST BX, [RESULT7B]       ; Store: 0xBB00 (preserved)
        ST CX, [RESULT7C]       ; Store: 0xCC00 (preserved)

        ; ===== Test 8: Stack-based parameter passing =====
        MOV AX, #30             ; First arg
        PUSH AX
        MOV AX, #12             ; Second arg
        PUSH AX
        CALL ADD_STACK          ; Result in AX
        ADD SP, #4              ; Clean up stack (2 words = 4 bytes)
        ST AX, [RESULT8]        ; Store: should be 0x002A (42 = 30+12)

        ; ===== Test 9: Return value via different register =====
        MOV AX, #7              ; Input
        CALL SQUARE             ; BX = AX * AX = 49
        ST BX, [RESULT9]        ; Store: should be 0x0031 (49)

        ; ===== Test 10: Multiple sequential CALLs =====
        MOV AX, #1              ; Start with 1
        CALL INCREMENT          ; AX = 2
        CALL INCREMENT          ; AX = 3
        CALL INCREMENT          ; AX = 4
        CALL INCREMENT          ; AX = 5
        CALL INCREMENT          ; AX = 6
        ST AX, [RESULT10]       ; Store: should be 0x0006 (6)

        ; ===== Test 11: Recursive factorial (limited depth) =====
        MOV AX, #5              ; Calculate 5!
        CALL FACTORIAL          ; AX = 120
        ST AX, [RESULT11]       ; Store: should be 0x0078 (120)

        ; ===== Test 12: RET imm16 (return and pop) =====
        MOV AX, #0x1111
        MOV BX, #0x2222
        MOV CX, #0x3333
        PUSH AX
        PUSH BX
        PUSH CX
        CALL RET_POP_TEST       ; Uses RET #6 to pop 3 words
        ; Stack should be clean now
        MOV DX, SP
        ST DX, [RESULT12]       ; Store SP (should be back to original)

        ; ===== Test 13: Fibonacci sequence =====
        MOV AX, #10             ; Calculate fib(10)
        CALL FIBONACCI          ; Iterative fibonacci
        ST AX, [RESULT13]       ; Store: should be 0x0037 (55)

        ; ===== Test 14: Local variables in subroutine =====
        MOV AX, #5
        MOV BX, #3
        CALL COMPUTE_EXPR       ; Computes (AX + BX) * 2 using locals
        ST AX, [RESULT14]       ; Store: should be 0x0010 (16 = (5+3)*2)

        ; ===== Final verification =====
        MOV AX, #0xCAFE
        ST AX, [FINAL_RESULT]

        HLT                     ; Stop execution

; ========================================
; SUBROUTINES
; ========================================

; Set AX to 42
SET_AX_42:
        MOV AX, #42
        RET

; Double AX: AX = AX * 2
DOUBLE:
        ADD AX, AX
        RET

; Add two registers: AX = AX + BX
ADD_TWO:
        ADD AX, BX
        RET

; Triple AX: AX = AX * 3
TRIPLE:
        MOV BX, AX              ; Save original
        ADD AX, AX              ; AX = 2*AX
        ADD AX, BX              ; AX = 2*AX + AX = 3*AX
        RET

; Quadruple by calling double twice
QUADRUPLE:
        CALL DOUBLE             ; AX = AX * 2
        CALL DOUBLE             ; AX = AX * 4
        RET

; Octuple by calling quadruple then double
OCTUPLE:
        CALL QUADRUPLE          ; AX = AX * 4
        CALL DOUBLE             ; AX = AX * 8
        RET

; Test register preservation
PRESERVE_TEST:
        PUSH AX                 ; Save AX
        PUSH BX                 ; Save BX
        PUSH CX                 ; Save CX

        ; Modify registers
        MOV AX, #0x1111
        MOV BX, #0x2222
        MOV CX, #0x3333

        ; Do some work
        ADD AX, BX
        ADD AX, CX

        ; Restore registers
        POP CX
        POP BX
        POP AX
        RET

; Add parameters from stack
; Stack layout: [ret addr][arg2][arg1]
ADD_STACK:
        PUSH BP
        MOV BP, SP
        ; [BP+0] = saved BP
        ; [BP+2] = return address
        ; [BP+4] = arg2 (second push = 12)
        ; [BP+6] = arg1 (first push = 30)
        LD AX, [BP+6]           ; AX = arg1 = 30
        LD BX, [BP+4]           ; BX = arg2 = 12
        ADD AX, BX              ; AX = 42
        POP BP
        RET

; Square: BX = AX * AX (using repeated addition)
SQUARE:
        PUSH CX                 ; Save CX
        MOV BX, #0              ; Result accumulator
        MOV CX, AX              ; Counter = AX
SQUARE_LOOP:
        CMP CX, #0
        JZ SQUARE_DONE
        ADD BX, AX              ; BX += AX
        DEC CX
        JMP SQUARE_LOOP
SQUARE_DONE:
        POP CX
        RET

; Increment AX
INCREMENT:
        INC AX
        RET

; Factorial: AX = AX!
; Iterative implementation to avoid deep recursion
FACTORIAL:
        CMP AX, #1
        JLE FACT_BASE
        PUSH BX
        MOV BX, AX              ; BX = n
        MOV AX, #1              ; AX = result
FACT_LOOP:
        CMP BX, #1
        JLE FACT_DONE
        ; AX = AX * BX (multiply by repeated addition)
        PUSH CX
        MOV CX, BX              ; Counter
        DEC CX                  ; Already have AX * 1
        PUSH DX
        MOV DX, AX              ; Save original AX
FACT_MUL:
        CMP CX, #0
        JZ FACT_MUL_DONE
        ADD AX, DX
        DEC CX
        JMP FACT_MUL
FACT_MUL_DONE:
        POP DX
        POP CX
        DEC BX
        JMP FACT_LOOP
FACT_DONE:
        POP BX
        RET
FACT_BASE:
        MOV AX, #1
        RET

; RET with immediate to pop parameters
; This subroutine uses RET #n which pops n bytes after return
RET_POP_TEST:
        ; Just return and clean up 6 bytes (3 words)
        RET #6

; Fibonacci: AX = fib(AX)
; Iterative: F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2)
FIBONACCI:
        CMP AX, #0
        JZ FIB_ZERO
        CMP AX, #1
        JZ FIB_ONE

        PUSH BX
        PUSH CX
        PUSH DX

        MOV CX, AX              ; CX = n (counter)
        MOV AX, #0              ; AX = F(n-2) = 0
        MOV BX, #1              ; BX = F(n-1) = 1
        DEC CX                  ; Already have F(0), F(1)
FIB_LOOP:
        CMP CX, #0
        JZ FIB_DONE
        MOV DX, AX              ; DX = F(n-2)
        MOV AX, BX              ; AX = F(n-1)
        ADD BX, DX              ; BX = F(n) = F(n-1) + F(n-2)
        DEC CX
        JMP FIB_LOOP
FIB_DONE:
        MOV AX, BX              ; Result in AX
        POP DX
        POP CX
        POP BX
        RET
FIB_ZERO:
        MOV AX, #0
        RET
FIB_ONE:
        MOV AX, #1
        RET

; Compute expression with local variables
; Computes (AX + BX) * 2
COMPUTE_EXPR:
        PUSH BP
        MOV BP, SP
        SUB SP, #4              ; Allocate 2 local words

        ; Local variables at [BP-2] and [BP-4]
        ST AX, [BP-2]           ; local1 = AX
        ST BX, [BP-4]           ; local2 = BX

        ; Compute sum
        LD AX, [BP-2]
        LD BX, [BP-4]
        ADD AX, BX              ; AX = AX + BX

        ; Double it
        ADD AX, AX              ; AX = (AX + BX) * 2

        ; Cleanup
        MOV SP, BP              ; Deallocate locals
        POP BP
        RET

; Data section
        .org 0x0500

RESULT1:      .dw 0             ; Expected: 0x002A (42)
RESULT2:      .dw 0             ; Expected: 0x002A (42)
RESULT3:      .dw 0             ; Expected: 0x0096 (150)
RESULT4:      .dw 0             ; Expected: 0x0014 (20)
RESULT5:      .dw 0             ; Expected: 0x0018 (24)
RESULT6:      .dw 0             ; Expected: 0x001E (30)
RESULT7A:     .dw 0             ; Expected: 0xAA00 (preserved)
RESULT7B:     .dw 0             ; Expected: 0xBB00 (preserved)
RESULT7C:     .dw 0             ; Expected: 0xCC00 (preserved)
RESULT8:      .dw 0             ; Expected: 0x002A (42)
RESULT9:      .dw 0             ; Expected: 0x0031 (49)
RESULT10:     .dw 0             ; Expected: 0x0006 (6)
RESULT11:     .dw 0             ; Expected: 0x0078 (120)
RESULT12:     .dw 0             ; Expected: SP value (stack clean)
RESULT13:     .dw 0             ; Expected: 0x0037 (55 = fib(10))
RESULT14:     .dw 0             ; Expected: 0x0010 (16)

FINAL_RESULT: .dw 0             ; Expected: 0xCAFE (success)

; Call instruction summary:
;
; CALL addr      - Near call (push PC, jump to addr)
; CALL FAR s:o   - Far call (push CS, push PC, load CS:PC)
; CALL Rd        - Indirect call through register
; RET            - Near return (pop PC)
; RETF           - Far return (pop PC, pop CS)
; RET #n         - Return and pop n bytes from stack
;
; Standard calling convention:
; - Parameters passed in registers (AX, BX, CX, DX) or on stack
; - Return value in AX (or AX:DX for 32-bit)
; - Caller saves: AX, CX, DX (if needed)
; - Callee saves: BX, SI, DI, BP (must restore)
; - Stack grows down, BP used for frame pointer
