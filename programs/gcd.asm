; gcd.asm - Greatest Common Divisor using subtraction method
; Calculates: GCD(6, 4) = 2
; Algorithm: While a != b: if a > b then a = a - b, else b = b - a
;
; Note: We detect a > b by checking if (a - b) < a
; If a - b >= a after subtraction (impossible without wrap), then b > a
;
; Tests:
;   - Classic Euclidean GCD via subtraction
;   - Comparison using wrap detection
;   - Values must be in range 1-7 for reliable wrap detection

        ORG 0x00

START:  LDA NUM_A           ; Initialize working copies
        STA A_VAL
        LDA NUM_B
        STA B_VAL

        ; Main GCD loop: while A != B
GCD_LOOP:
        LDA A_VAL
        SUB B_VAL
        JZ  DONE            ; If A == B, we found GCD

        ; Try A - B and check if it wrapped
        ; If A >= B: result is valid (0 to A-1)
        ; If A < B: result wraps to 16-(B-A), which is > A
        LDA A_VAL
        STA ORIG_A          ; Save original A
        SUB B_VAL
        STA DIFF            ; DIFF = A - B

        ; Compare DIFF with original A
        ; If DIFF > ORIG_A, we wrapped (meaning A < B)
        ; Check: ORIG_A - DIFF. If this wraps, DIFF > ORIG_A
        LDA ORIG_A
        SUB DIFF
        STA TEMP            ; TEMP = ORIG_A - DIFF

        ; If TEMP wrapped (TEMP > ORIG_A), then DIFF > ORIG_A, so A < B
        ; Check if TEMP > ORIG_A by doing ORIG_A - TEMP
        LDA ORIG_A
        SUB TEMP            ; ORIG_A - TEMP
        STA TEMP2
        ; If this is negative (wrapped to high), TEMP > ORIG_A -> DIFF > ORIG_A -> A < B
        ; Simple check: if TEMP2 >= 8, assume wrapped
        LDA TEMP2
        SUB SEVEN           ; If TEMP2 > 7, result is 0-8
        JZ  B_BIGGER        ; TEMP2 was 8, so wrapped
        SUB ONE
        JZ  B_BIGGER        ; TEMP2 was 9
        SUB ONE
        JZ  B_BIGGER        ; TEMP2 was 10
        ; Continue checking...
        SUB ONE
        JZ  B_BIGGER        ; 11
        SUB ONE
        JZ  B_BIGGER        ; 12
        SUB ONE
        JZ  B_BIGGER        ; 13
        SUB ONE
        JZ  B_BIGGER        ; 14
        SUB ONE
        JZ  B_BIGGER        ; 15

        ; A >= B: subtract B from A
        LDA A_VAL
        SUB B_VAL
        STA A_VAL
        JMP GCD_LOOP

B_BIGGER:
        ; A < B: subtract A from B
        LDA B_VAL
        SUB A_VAL
        STA B_VAL
        JMP GCD_LOOP

DONE:   LDA A_VAL           ; GCD is the common value
        STA RESULT
        HLT

; Data section (code ~178 nibbles, use 0xC0)
        ORG 0xC0
NUM_A:    DB 6              ; First number
NUM_B:    DB 4              ; Second number
RESULT:   DB 0              ; GCD result (will be 2)
A_VAL:    DB 0              ; Working copy of A
B_VAL:    DB 0              ; Working copy of B
ORIG_A:   DB 0              ; Original A for comparison
DIFF:     DB 0              ; Difference
TEMP:     DB 0              ; Temporary
TEMP2:    DB 0              ; Temporary 2
ONE:      DB 1              ; Constant 1
SEVEN:    DB 7              ; Constant 7

; After execution:
; RESULT should contain 2
; A should contain 2
; Trace: 6,4 -> 2,4 -> 2,2 -> done, GCD=2
