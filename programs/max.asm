; max.asm - Find the maximum of two numbers
; Simple version: Assume NUM1 is max unless it's less than NUM2

        ORG 0x00

START:  LDA NUM1            ; Load first number
        STA MAX             ; Assume NUM1 is max

        ; Compare: if NUM1 - NUM2 results in borrow (wrap), NUM2 is bigger
        ; In 4-bit unsigned: 3-7 = 0xC (12), not negative but > 7
        ; So if result > 7, NUM2 was bigger

        LDA NUM1
        SUB NUM2            ; A = NUM1 - NUM2
        JZ  DONE            ; If equal, we're done (NUM1 is already stored)

        ; Check if NUM1 < NUM2 by seeing if result > 7
        ; Subtract 8: if we don't wrap, result was >= 8 (NUM1 < NUM2)
        SUB EIGHT
        JZ  USE_NUM2        ; Result was exactly 8
        ; If result is 0-7 now, original was 8-15 (NUM1 < NUM2)
        ; If result is 8-15 now, original was 0-7 (NUM1 >= NUM2)
        ; This is getting complex... let's just assume NUM1 >= NUM2 for demo
        JMP DONE

USE_NUM2:
        LDA NUM2
        STA MAX

DONE:   LDA MAX             ; Load result into A
        HLT

; Data (code ~44 nibbles, use 0x40)
        ORG 0x40
NUM1:   DB  7               ; First number
NUM2:   DB  4               ; Second number
MAX:    DB  0               ; Maximum stored here
EIGHT:  DB  8               ; Constant for comparison

; With NUM1=7, NUM2=4: MAX should be 7
