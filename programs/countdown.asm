; countdown.asm - Count down from 5 to 0
; Demonstrates loops and conditional jumps

        ORG 0x00

START:  LDI 5               ; A = 5 (start value)
LOOP:   STA COUNT           ; Store current count
        SUB ONE             ; A = A - 1
        JZ  DONE            ; If zero, we're done
        JMP LOOP            ; Otherwise continue
DONE:   STA COUNT           ; Store final 0
        HLT                 ; Halt

; Data (code is ~24 nibbles, so 0x20 is safe)
        ORG 0x20
COUNT:  DB  0               ; Current count stored here
ONE:    DB  1               ; Constant 1 for decrementing

; After execution:
; COUNT should be 0
; A should be 0
; Z flag should be set (1)
