; divide.asm - Integer division using repeated subtraction
; Calculates: 9 / 3 = 3 remainder 0
; Algorithm: Subtract divisor repeatedly while result stays valid
;
; Tests:
;   - Division algorithm via repeated subtraction
;   - Loop counting pattern
;   - Clean division (no remainder)

        ORG 0x00

START:  LDI 0               ; Initialize quotient = 0
        STA QUOTIENT
        LDA DIVIDEND        ; Copy dividend to remainder (working value)
        STA REMAINDER

        ; Division loop: subtract divisor while remainder >= divisor
LOOP:   LDA REMAINDER
        JZ  DONE            ; If remainder is 0, done
        SUB DIVISOR         ; Try subtracting divisor
        STA REMAINDER       ; Store new remainder

        ; Increment quotient
        LDA QUOTIENT
        ADD ONE
        STA QUOTIENT

        JMP LOOP            ; Continue

DONE:   LDA QUOTIENT        ; Load quotient into A for display
        HLT

; Data section (code ~36 nibbles, use 0x30)
        ORG 0x30
DIVIDEND:  DB 9             ; Dividend
DIVISOR:   DB 3             ; Divisor
QUOTIENT:  DB 0             ; Result: 9 / 3 = 3
REMAINDER: DB 0             ; Remainder: 9 % 3 = 0
ONE:       DB 1             ; Constant 1

; After execution:
; QUOTIENT (0x32) should contain 3
; REMAINDER (0x33) should contain 0
; A should contain 3
