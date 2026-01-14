; add.asm - Add two numbers
; Result: 5 + 3 = 8 (stored at RESULT)

        ORG 0x00            ; Code starts at address 0

START:  LDA NUM1            ; Load first number
        ADD NUM2            ; Add second number
        STA RESULT          ; Store result
        HLT                 ; Halt

; Data section
        ORG 0x20            ; Data starts at 0x20 (code is only ~14 nibbles)
NUM1:   DB  5               ; First number = 5
NUM2:   DB  3               ; Second number = 3
RESULT: DB  0               ; Result stored here (will be 8)
