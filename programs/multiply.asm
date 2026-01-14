; multiply.asm - Multiply two numbers using repeated addition
; Calculates: 3 * 4 = 12 (0xC)
; Algorithm: Add MULTIPLICAND to RESULT, MULTIPLIER times

        ORG 0x00

START:  LDA MULTIPLIER      ; Load counter
        STA COUNTER         ; Store as counter
        LDI 0               ; Clear accumulator
        STA RESULT          ; Result = 0

LOOP:   LDA COUNTER         ; Load counter
        JZ  DONE            ; If counter is 0, done
        SUB ONE             ; Decrement counter
        STA COUNTER         ; Store counter
        LDA RESULT          ; Load current result
        ADD MULTIPLICAND    ; Add multiplicand
        STA RESULT          ; Store result
        JMP LOOP            ; Repeat

DONE:   LDA RESULT          ; Load final result into A
        HLT                 ; Halt

; Data section - MUST be after code!
        ORG 0x40            ; Data starts at 0x40 (after code)
MULTIPLICAND: DB 3          ; First number (3)
MULTIPLIER:   DB 4          ; Second number (4)
RESULT:       DB 0          ; Result: 3 * 4 = 12 (0xC)
COUNTER:      DB 0          ; Loop counter
ONE:          DB 1          ; Constant 1

; After execution:
; RESULT (0x42) should contain 0xC (12)
; A should contain 0xC (12)
