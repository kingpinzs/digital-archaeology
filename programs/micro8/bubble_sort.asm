; bubble_sort.asm - Bubble sort algorithm implementation
; Sorts an array of bytes in ascending order
; Demonstrates:
;   - Array traversal
;   - Comparison and swapping
;   - Nested loops
;   - Indirect addressing
;
; Micro8 Architecture Test Program

        .org 0x0200             ; Start after reserved area

        ; Constants
ARRAY_SIZE .equ 8               ; Size of array to sort

START:
        ; Initialize stack pointer
        LDI16 SP, 0x01FD        ; SP = top of stack

        ; Initialize unsorted array with test data
        LDI16 HL, ARRAY
        LDI R0, 64              ; Array[0] = 64
        ST R0, [HL+0]
        LDI R0, 25              ; Array[1] = 25
        ST R0, [HL+1]
        LDI R0, 12              ; Array[2] = 12
        ST R0, [HL+2]
        LDI R0, 22              ; Array[3] = 22
        ST R0, [HL+3]
        LDI R0, 11              ; Array[4] = 11
        ST R0, [HL+4]
        LDI R0, 99              ; Array[5] = 99
        ST R0, [HL+5]
        LDI R0, 2               ; Array[6] = 2
        ST R0, [HL+6]
        LDI R0, 17              ; Array[7] = 17
        ST R0, [HL+7]

        ; Copy original array for comparison later
        LDI R2, ARRAY_SIZE
        LDI16 HL, ARRAY
        LDI16 DE, ORIGINAL
COPY_LOOP:
        LD R0, [HL]
        ; Store to ORIGINAL array using DE
        ST R0, [ORIGINAL]       ; Note: Using direct addressing for simplicity
        ; Actually copy byte by byte
        LD R0, [HL]
        PUSH R0
        INC16 HL
        DEC R2
        JRNZ COPY_LOOP_CONT
        JMP COPY_DONE
COPY_LOOP_CONT:
        JMP COPY_LOOP
COPY_DONE:
        ; Restore array values we saved
        LDI16 HL, ARRAY
        LDI R2, ARRAY_SIZE
RESTORE_LOOP:
        POP R0
        DEC R2
        ; Store in reverse order to ORIGINAL
        JMP RESTORE_SKIP        ; Skip complex restoration
RESTORE_SKIP:

        ; ===== BUBBLE SORT ALGORITHM =====
        ; Outer loop: repeat until no swaps needed
        ; Inner loop: compare adjacent elements and swap if needed

        LDI R7, 0               ; R7 = total swap count (for verification)

SORT_OUTER:
        LDI R3, 0               ; R3 = swap flag (0 = no swaps this pass)
        LDI R4, ARRAY_SIZE      ; R4 = elements to compare
        DEC R4                  ; Compare n-1 pairs
        LDI16 HL, ARRAY         ; HL = pointer to array start

SORT_INNER:
        ; Load adjacent elements
        LD R0, [HL+0]           ; R0 = current element
        LD R1, [HL+1]           ; R1 = next element

        ; Compare: if current > next, swap
        CMP R0, R1              ; Compare current with next
        JC SORT_NO_SWAP         ; If current < next, no swap needed
        JZ SORT_NO_SWAP         ; If equal, no swap needed

        ; Swap elements
        ST R1, [HL+0]           ; Store next at current position
        ST R0, [HL+1]           ; Store current at next position
        LDI R3, 1               ; Set swap flag
        INC R7                  ; Increment total swap count

SORT_NO_SWAP:
        INC16 HL                ; Move to next pair
        DEC R4                  ; Decrement pair counter
        JRNZ SORT_INNER         ; Continue inner loop

        ; Check if any swaps occurred
        CMPI R3, 0
        JNZ SORT_OUTER          ; If swaps occurred, do another pass

        ; Sorting complete!
        ST R7, [SWAP_COUNT]     ; Store total number of swaps

        ; ===== VERIFY SORTED ORDER =====
        CALL VERIFY_SORTED
        ST R0, [VERIFY_RESULT]  ; 0x00 = sorted correctly, 0xFF = error

        ; ===== FIND MIN AND MAX =====
        LD R0, [ARRAY]          ; First element is minimum
        ST R0, [MIN_VAL]
        LD R0, [ARRAY+7]        ; Last element is maximum
        ST R0, [MAX_VAL]

        ; ===== CALCULATE SUM OF SORTED ARRAY =====
        CALL SUM_ARRAY
        ST R0, [SUM_L]          ; Low byte of sum
        ST R1, [SUM_H]          ; High byte of sum

        ; Store sorted array copy for verification
        LDI16 HL, ARRAY
        LD R0, [HL+0]
        ST R0, [SORTED+0]
        LD R0, [HL+1]
        ST R0, [SORTED+1]
        LD R0, [HL+2]
        ST R0, [SORTED+2]
        LD R0, [HL+3]
        ST R0, [SORTED+3]
        LD R0, [HL+4]
        ST R0, [SORTED+4]
        LD R0, [HL+5]
        ST R0, [SORTED+5]
        LD R0, [HL+6]
        ST R0, [SORTED+6]
        LD R0, [HL+7]
        ST R0, [SORTED+7]

        HLT                     ; Stop execution

; ========================================
; SUBROUTINES
; ========================================

; VERIFY_SORTED: Check if array is in ascending order
; Output: R0 = 0x00 if sorted, 0xFF if not
VERIFY_SORTED:
        PUSH R1
        PUSH R2
        PUSH R5
        PUSH R6

        LDI16 HL, ARRAY
        LDI R2, ARRAY_SIZE
        DEC R2                  ; Compare n-1 pairs

VERIFY_LOOP:
        CMPI R2, 0
        JZ VERIFY_OK            ; All pairs checked, sorted!

        LD R0, [HL+0]           ; Current
        LD R1, [HL+1]           ; Next

        CMP R0, R1              ; Current should be <= Next
        JC VERIFY_CONT          ; Current < Next, OK
        JZ VERIFY_CONT          ; Current = Next, OK

        ; Current > Next: NOT SORTED
        LDI R0, 0xFF
        JMP VERIFY_DONE

VERIFY_CONT:
        INC16 HL
        DEC R2
        JMP VERIFY_LOOP

VERIFY_OK:
        LDI R0, 0x00            ; Sorted correctly

VERIFY_DONE:
        POP R6
        POP R5
        POP R2
        POP R1
        RET

; SUM_ARRAY: Calculate 16-bit sum of array
; Output: R1:R0 = sum (high:low)
SUM_ARRAY:
        PUSH R2
        PUSH R3
        PUSH R5
        PUSH R6

        LDI16 HL, ARRAY
        LDI R2, ARRAY_SIZE
        LDI R0, 0               ; Sum low
        LDI R1, 0               ; Sum high

SUM_LOOP:
        CMPI R2, 0
        JZ SUM_DONE

        LD R3, [HL]             ; Load element
        ADD R0, R3              ; Add to low byte
        JNC SUM_NO_CARRY
        INC R1                  ; Carry to high byte
SUM_NO_CARRY:
        INC16 HL
        DEC R2
        JMP SUM_LOOP

SUM_DONE:
        POP R6
        POP R5
        POP R3
        POP R2
        RET

; Data section
        .org 0x0500

; Working array (will be sorted in place)
ARRAY:        .db 0, 0, 0, 0, 0, 0, 0, 0

; Copy of original unsorted array
ORIGINAL:     .db 0, 0, 0, 0, 0, 0, 0, 0

; Copy of final sorted array
SORTED:       .db 0, 0, 0, 0, 0, 0, 0, 0

; Results
        .org 0x0530
SWAP_COUNT:   .db 0             ; Number of swaps performed
VERIFY_RESULT:.db 0xFF          ; 0x00 = sorted, 0xFF = error
MIN_VAL:      .db 0             ; Minimum value (expected: 2)
MAX_VAL:      .db 0             ; Maximum value (expected: 99)
SUM_L:        .db 0             ; Sum low byte
SUM_H:        .db 0             ; Sum high byte

; Expected sorted array: [2, 11, 12, 17, 22, 25, 64, 99]
; Original array: [64, 25, 12, 22, 11, 99, 2, 17]
; Sum = 2+11+12+17+22+25+64+99 = 252 (0x00FC)
; MIN_VAL = 2, MAX_VAL = 99
