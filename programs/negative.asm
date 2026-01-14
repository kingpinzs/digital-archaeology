; negative.asm - Test negative number handling (two's complement behavior)
; Demonstrates how subtraction wraps in 4-bit unsigned arithmetic
;
; Tests:
;   - Underflow behavior (5 - 7 wraps to 14 in 4-bit)
;   - Zero flag after operations
;   - Edge cases: 0 - 1, max - 1, etc.

        ORG 0x00

START:
        ; Test 1: Simple underflow (5 - 7)
        ; In 4-bit unsigned: 5 - 7 = -2 = 14 (0xE) due to wrap
        LDI 5
        STA TEST1_A
        SUB SEVEN
        STA TEST1_RESULT    ; Should be 14 (0xE)

        ; Test 2: Zero minus one (0 - 1)
        ; Should wrap to 15 (0xF)
        LDI 0
        SUB ONE
        STA TEST2_RESULT    ; Should be 15 (0xF)

        ; Test 3: Max value handling (15 + 1)
        ; Should wrap to 0
        LDI 15              ; 0xF
        ADD ONE
        STA TEST3_RESULT    ; Should be 0 (wrapped)

        ; Test 4: Check zero flag
        ; 5 - 5 should set zero flag
        LDI 5
        SUB FIVE
        JZ  ZERO_OK         ; Should jump (zero flag set)
        LDI 0               ; Failed - zero flag not set
        STA TEST4_RESULT
        JMP TEST5

ZERO_OK:
        LDI 1               ; Success - zero flag was set
        STA TEST4_RESULT

TEST5:
        ; Test 5: Detecting "negative" results
        ; If A - B wraps (result > A when B > 0), B was larger
        ; 3 - 7 = 12; 12 > 3, so we know 7 > 3
        LDI 3
        STA SMALL
        LDA SMALL
        SUB SEVEN
        STA DIFF            ; DIFF = 12 (0xC)

        ; Check if DIFF > SMALL (indicates underflow)
        ; DIFF - SMALL = 12 - 3 = 9 (positive, so DIFF > SMALL)
        LDA DIFF
        SUB SMALL
        STA TEST5_RESULT    ; Should be 9 (non-zero = underflow detected)

        ; Test 6: Edge case - subtracting from 1
        ; 1 - 2 = 15 (0xF)
        LDI 1
        SUB TWO
        STA TEST6_RESULT    ; Should be 15 (0xF)

        ; Load success indicator
        LDA SUCCESS
        HLT

; Data section (code ~106 nibbles, use 0x70)
        ORG 0x70
ONE:          DB 1          ; Constant 1
TWO:          DB 2          ; Constant 2
FIVE:         DB 5          ; Constant 5
SEVEN:        DB 7          ; Constant 7
SUCCESS:      DB 0xF        ; Success indicator

TEST1_A:      DB 0          ; Test 1 operand storage
TEST1_RESULT: DB 0          ; Test 1: 5-7 = 14 (0xE)
TEST2_RESULT: DB 0          ; Test 2: 0-1 = 15 (0xF)
TEST3_RESULT: DB 0          ; Test 3: 15+1 = 0 (wrapped)
TEST4_RESULT: DB 0          ; Test 4: 1 if zero flag worked
TEST5_RESULT: DB 0          ; Test 5: 9 if underflow detected
TEST6_RESULT: DB 0          ; Test 6: 1-2 = 15 (0xF)

SMALL:        DB 0          ; Temporary storage
DIFF:         DB 0          ; Difference calculation

; After execution:
; TEST1_RESULT (0x46): 14 (0xE) - underflow from 5-7
; TEST2_RESULT (0x47): 15 (0xF) - underflow from 0-1
; TEST3_RESULT (0x48): 0 - overflow from 15+1
; TEST4_RESULT (0x49): 1 - zero flag works
; TEST5_RESULT (0x4A): 9 - underflow detection works
; TEST6_RESULT (0x4B): 15 (0xF) - underflow from 1-2
; A should contain 15 (0xF) success indicator
