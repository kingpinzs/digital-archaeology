; fibonacci.asm - Calculate Fibonacci sequence
; Showcase program demonstrating Micro8 capabilities
;
; Calculates Fibonacci numbers: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144...
; Stores sequence in memory array until overflow would occur
;
; Uses:
;   - Subroutine calls
;   - Indirect addressing
;   - Loop constructs
;   - Overflow detection
;
; Micro8 Architecture Test Program

        .org 0x0200             ; Start after reserved area

        ; Constants
FIB_MAX .equ 13                 ; Maximum Fibonacci numbers to calculate

START:
        ; Initialize stack pointer
        LDI16 SP, 0x01FD        ; SP = top of stack

        ; Initialize Fibonacci sequence
        LDI16 HL, FIB_ARRAY     ; HL = pointer to array
        LDI R0, 1               ; First Fibonacci number
        LDI R1, 1               ; Second Fibonacci number
        LDI R2, FIB_MAX         ; Counter

        ; Store first two numbers
        ST R0, [HL]             ; FIB[0] = 1
        INC16 HL
        ST R1, [HL]             ; FIB[1] = 1
        INC16 HL
        SUBI R2, 2              ; Counter -= 2 (we stored 2 already)

        ; Calculate remaining Fibonacci numbers
FIB_LOOP:
        ; Check if done
        CMPI R2, 0 ; Test counter
        JZ FIB_DONE

        ; Calculate next: F(n) = F(n-1) + F(n-2)
        ; R0 = F(n-2), R1 = F(n-1)
        MOV R3, R0              ; R3 = F(n-2) (save for later)
        ADD R0, R1              ; R0 = F(n-2) + F(n-1) = F(n)

        ; Check for overflow (C flag set)
        JC FIB_OVERFLOW         ; Stop if overflow

        ; Store new Fibonacci number
        ST R0, [HL]             ; Store F(n)
        INC16 HL                ; Advance pointer

        ; Shift values: F(n-2) = F(n-1), F(n-1) = F(n)
        MOV R3, R1              ; R3 = old F(n-1)
        MOV R1, R0              ; R1 = new F(n-1) = old F(n)
        MOV R0, R3              ; R0 = new F(n-2) = old F(n-1)

        ; Decrement counter and continue
        DEC R2
        JMP FIB_LOOP

FIB_OVERFLOW:
        ; Record that we stopped due to overflow
        LDI R0, 0xFF
        ST R0, [OVERFLOW_FLAG]
        JMP STORE_COUNT

FIB_DONE:
        ; Normal completion
        LDI R0, 0x00
        ST R0, [OVERFLOW_FLAG]

STORE_COUNT:
        ; Calculate how many numbers we stored
        ; HL points one past last stored number
        ; FIB_COUNT = (HL - FIB_ARRAY)

        ; Store the count
        LDI R0, FIB_MAX
        SUB R0, R2              ; R0 = FIB_MAX - remaining = numbers stored
        ST R0, [FIB_COUNT]

        ; ===== Calculate sum of all Fibonacci numbers =====
        CALL SUM_FIBS
        ST R0, [FIB_SUM_L]      ; Store low byte of sum
        ST R1, [FIB_SUM_H]      ; Store high byte of sum

        ; ===== Find the largest Fibonacci number =====
        CALL MAX_FIB
        ST R0, [FIB_MAX_VAL]    ; Store largest value

        ; ===== Verify sequence is correct by checking F(10) = 89 =====
        LD R0, [FIB_ARRAY+9]    ; Load F(10) (0-indexed, so index 9)
        CMPI R0, 89             ; Should be 89
        JZ VERIFY_OK
        LDI R0, 0xFF
        ST R0, [VERIFY_RESULT]
        JMP DONE
VERIFY_OK:
        LDI R0, 0x00
        ST R0, [VERIFY_RESULT]

DONE:
        HLT                     ; Stop execution

; ========================================
; SUBROUTINES
; ========================================

; SUM_FIBS: Calculate 16-bit sum of all Fibonacci numbers in array
; Returns: R1:R0 = sum (high:low)
SUM_FIBS:
        PUSH R2                 ; Save registers
        PUSH R3
        PUSH R5
        PUSH R6

        LDI16 HL, FIB_ARRAY     ; Point to array
        LD R2, [FIB_COUNT]      ; Get count
        LDI R0, 0               ; Sum low = 0
        LDI R1, 0               ; Sum high = 0

SUM_LOOP:
        CMPI R2, 0 ; Check counter
        JZ SUM_DONE

        LD R3, [HL]             ; Load Fibonacci number
        ADD R0, R3              ; Add to low byte
        JNC SUM_NO_CARRY        ; If no carry, skip
        INC R1                  ; Carry to high byte
SUM_NO_CARRY:
        INC16 HL                ; Next element
        DEC R2                  ; Decrement counter
        JMP SUM_LOOP

SUM_DONE:
        POP R6                  ; Restore registers
        POP R5
        POP R3
        POP R2
        RET

; MAX_FIB: Find the largest Fibonacci number in array
; Returns: R0 = largest value
MAX_FIB:
        PUSH R1
        PUSH R2
        PUSH R5
        PUSH R6

        LDI16 HL, FIB_ARRAY     ; Point to array
        LD R2, [FIB_COUNT]      ; Get count
        LDI R0, 0               ; Max = 0

MAX_LOOP:
        CMPI R2, 0 ; Check counter
        JZ MAX_DONE

        LD R1, [HL]             ; Load current element
        CMP R0, R1              ; Compare max with current
        JNC MAX_NO_UPDATE       ; If max >= current, skip
        MOV R0, R1              ; Update max
MAX_NO_UPDATE:
        INC16 HL                ; Next element
        DEC R2                  ; Decrement counter
        JMP MAX_LOOP

MAX_DONE:
        POP R6
        POP R5
        POP R2
        POP R1
        RET

; Data section
        .org 0x0500

FIB_ARRAY:    .db 0, 0, 0, 0, 0, 0, 0, 0  ; Fibonacci numbers
              .db 0, 0, 0, 0, 0, 0, 0, 0  ; (space for 16 numbers)

; Results
        .org 0x0520
FIB_COUNT:    .db 0             ; Number of Fibonacci numbers calculated
OVERFLOW_FLAG:.db 0             ; 0xFF if stopped due to overflow
FIB_SUM_L:    .db 0             ; Low byte of sum
FIB_SUM_H:    .db 0             ; High byte of sum
FIB_MAX_VAL:  .db 0             ; Largest Fibonacci number
VERIFY_RESULT:.db 0xFF          ; 0x00 if F(10)=89, 0xFF if error

; Expected results (for FIB_MAX=13):
; FIB_ARRAY: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233
; FIB_COUNT: 13
; OVERFLOW_FLAG: 0x00 (no overflow with 13 numbers)
; FIB_SUM_L: 0x59 (low byte of 609)
; FIB_SUM_H: 0x02 (high byte of 609)
; FIB_MAX_VAL: 233 (0xE9)
; VERIFY_RESULT: 0x00 (F(10) = 89 verified)
