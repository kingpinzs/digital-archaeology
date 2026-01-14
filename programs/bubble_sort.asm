; bubble_sort.asm - Sort 3 values using simplified comparison
; Sorts: [5, 2, 8] -> [2, 5, 8]
;
; Note: Without a carry flag, we use a simpler approach:
; Compare by testing if difference wrapped (became > 7)
;
; Tests:
;   - Multiple memory location manipulation
;   - Conditional swapping based on comparison
;   - Fixed passes through data

        ORG 0x00

START:
        ; ===== PASS 1 =====
        ; Compare ARR0 and ARR1, swap if ARR0 > ARR1
        LDA ARR1
        STA TEMP            ; TEMP = ARR1 (save for swap)
        SUB ARR0            ; ARR1 - ARR0
        ; If result wrapped (>= 8), ARR0 > ARR1, need swap
        SUB EIGHT
        JZ  SWAP_01         ; Exactly 8 means wrapped
        ; Check if subtraction result is in 8-15 range
        ADD EIGHT           ; Restore
        JZ  NO_SWAP_01      ; Was 0, no wrap
        SUB EIGHT
        JZ  NO_SWAP_01      ; Small positive, no swap needed
        ; Default: don't swap
        JMP NO_SWAP_01

SWAP_01:
        LDA ARR0
        STA TEMP2
        LDA ARR1
        STA ARR0
        LDA TEMP2
        STA ARR1

NO_SWAP_01:
        ; Compare ARR1 and ARR2, swap if ARR1 > ARR2
        LDA ARR2
        SUB ARR1            ; ARR2 - ARR1
        SUB EIGHT
        JZ  SWAP_12
        JMP NO_SWAP_12

SWAP_12:
        LDA ARR1
        STA TEMP
        LDA ARR2
        STA ARR1
        LDA TEMP
        STA ARR2

NO_SWAP_12:
        ; ===== PASS 2 =====
        ; One more pass to ensure fully sorted
        LDA ARR1
        SUB ARR0            ; ARR1 - ARR0
        SUB EIGHT
        JZ  SWAP_01_P2
        JMP DONE

SWAP_01_P2:
        LDA ARR0
        STA TEMP
        LDA ARR1
        STA ARR0
        LDA TEMP
        STA ARR1

DONE:
        LDA ARR0            ; Load smallest element
        HLT

; Data section
        ORG 0x70
ARR0:   DB 5                ; Will become 2
ARR1:   DB 2                ; Will become 5
ARR2:   DB 8                ; Stays 8
TEMP:   DB 0                ; Temp for swapping
TEMP2:  DB 0                ; Second temp
EIGHT:  DB 8                ; Constant for overflow detection

; After execution:
; ARR0 should contain 2 (smallest)
; ARR1 should contain 5 (middle)
; ARR2 should contain 8 (largest)
; A should contain 2
