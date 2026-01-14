; factorial.asm - Compute factorial using repeated multiplication
; Calculates: 4! = 4 * 3 * 2 * 1 = 24 (but 24 > 15, so use 3! = 6)
; Actually computes: 3! = 3 * 2 * 1 = 6
; Algorithm: Multiply result by counter, decrement counter until 1
;
; Tests:
;   - Nested loop structure (multiply within factorial loop)
;   - Decrementing counter
;   - Result fits in 4 bits (max factorial: 4! = 24, but we use 3! = 6)

        ORG 0x00

START:  LDA N               ; Load N (the number to compute factorial of)
        STA COUNTER         ; Counter = N
        LDI 1               ; Result starts at 1
        STA RESULT

        ; Main factorial loop: result = result * counter; counter--
FACT_LOOP:
        LDA COUNTER
        SUB ONE             ; Check if counter <= 1
        JZ  DONE            ; If counter was 1, we're done

        ; Multiply RESULT by COUNTER using repeated addition
        ; RESULT = RESULT * COUNTER
        LDA RESULT
        STA MULT_A          ; First operand = current result
        LDA COUNTER
        STA MULT_B          ; Second operand = counter
        LDI 0
        STA MULT_RESULT     ; Clear multiply result

MULT_LOOP:
        LDA MULT_B
        JZ  MULT_DONE       ; If multiplier is 0, done
        SUB ONE
        STA MULT_B
        LDA MULT_RESULT
        ADD MULT_A
        STA MULT_RESULT
        JMP MULT_LOOP

MULT_DONE:
        LDA MULT_RESULT     ; Get multiplication result
        STA RESULT          ; Update factorial result

        ; Decrement counter
        LDA COUNTER
        SUB ONE
        STA COUNTER

        JMP FACT_LOOP

DONE:   LDA RESULT          ; Load final factorial into A
        HLT

; Data section (code ~110 nibbles, use 0x70)
        ORG 0x70
N:           DB 3           ; Compute 3! = 6
COUNTER:     DB 0           ; Loop counter (counts down from N)
RESULT:      DB 0           ; Factorial result (will be 6)
MULT_A:      DB 0           ; Multiplicand for inner multiply
MULT_B:      DB 0           ; Multiplier for inner multiply
MULT_RESULT: DB 0           ; Result of inner multiply
ONE:         DB 1           ; Constant 1

; After execution:
; RESULT (0x52) should contain 6 (3! = 6)
; A should contain 6
