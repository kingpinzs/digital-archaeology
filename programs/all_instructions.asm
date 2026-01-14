; all_instructions.asm - Test all 8 instructions
; This program exercises every instruction in the Micro4 ISA

        ORG 0x00

START:
        ; LDI - Load Immediate
        LDI 5               ; A = 5

        ; STA - Store Accumulator
        STA TEMP            ; TEMP = 5

        ; LDA - Load Accumulator
        LDA DATA1           ; A = 3

        ; ADD - Add
        ADD TEMP            ; A = 3 + 5 = 8

        ; SUB - Subtract
        SUB DATA2           ; A = 8 - 2 = 6

        ; STA result
        STA RESULT          ; RESULT = 6

        ; JZ - Jump if Zero (should NOT jump)
        LDI 1               ; A = 1 (not zero)
        JZ  FAIL            ; Should not jump

        ; JZ - Jump if Zero (SHOULD jump)
        LDI 0               ; A = 0
        JZ  PASS1           ; Should jump
        JMP FAIL            ; If we get here, test failed

PASS1:
        ; JMP - Unconditional Jump
        JMP PASS2           ; Should always jump
        JMP FAIL            ; If we get here, test failed

PASS2:
        ; HLT - Halt
        LDI 15              ; A = 0xF (success code)
        STA RESULT          ; Store success code
        HLT                 ; All tests passed!

FAIL:
        LDI 0               ; A = 0 (failure code)
        STA RESULT          ; Store failure code
        HLT                 ; Test failed

; Data (code ~56 nibbles, use 0x40)
        ORG 0x40
DATA1:  DB  3
DATA2:  DB  2
TEMP:   DB  0
RESULT: DB  0               ; Final result: 0xF = success, 0 = fail

; Expected: RESULT = 0xF, A = 0xF
