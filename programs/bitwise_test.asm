; bitwise_test.asm - Test all new instructions (opcodes 0x8-0xF)
; Tests: AND, OR, XOR, NOT, SHL, SHR, INC, DEC
;
; Each test section verifies one instruction and stores result
; Final result at RESULT: 0xF = all tests passed, 0 = failure

        ORG 0x00

START:
        ; === Test AND (A & mem) ===
        ; 0xF AND 0x5 = 0x5 (1111 & 0101 = 0101)
        LDI 15              ; A = 0xF
        AND MASK5           ; A = 0xF & 0x5 = 0x5
        SUB FIVE            ; A = 0x5 - 0x5 = 0
        JZ  TEST_OR         ; If zero, AND worked
        JMP FAIL

TEST_OR:
        ; === Test OR (A | mem) ===
        ; 0x5 OR 0xA = 0xF (0101 | 1010 = 1111)
        LDI 5               ; A = 0x5
        OR  MASK_A          ; A = 0x5 | 0xA = 0xF
        SUB FIFTEEN         ; A = 0xF - 0xF = 0
        JZ  TEST_XOR
        JMP FAIL

TEST_XOR:
        ; === Test XOR (A ^ mem) ===
        ; 0xF XOR 0xF = 0x0 (1111 ^ 1111 = 0000)
        LDI 15              ; A = 0xF
        XOR FIFTEEN         ; A = 0xF ^ 0xF = 0x0
        JZ  TEST_NOT        ; Should be zero
        JMP FAIL

TEST_NOT:
        ; === Test NOT (~A) ===
        ; NOT 0x5 = 0xA (in 4-bit: ~0101 = 1010)
        LDI 5               ; A = 0x5
        NOT                 ; A = ~0x5 = 0xA
        SUB MASK_A          ; A = 0xA - 0xA = 0
        JZ  TEST_SHL
        JMP FAIL

TEST_SHL:
        ; === Test SHL (shift left) ===
        ; 0x3 << 1 = 0x6 (0011 << 1 = 0110)
        LDI 3               ; A = 0x3
        SHL                 ; A = 0x6
        SUB SIX             ; A = 0x6 - 0x6 = 0
        JZ  TEST_SHR
        JMP FAIL

TEST_SHR:
        ; === Test SHR (shift right) ===
        ; 0x6 >> 1 = 0x3 (0110 >> 1 = 0011)
        LDI 6               ; A = 0x6
        SHR                 ; A = 0x3
        SUB THREE           ; A = 0x3 - 0x3 = 0
        JZ  TEST_INC
        JMP FAIL

TEST_INC:
        ; === Test INC (A + 1) ===
        LDI 7               ; A = 0x7
        INC                 ; A = 0x8
        SUB EIGHT           ; A = 0x8 - 0x8 = 0
        JZ  TEST_DEC
        JMP FAIL

TEST_DEC:
        ; === Test DEC (A - 1) ===
        LDI 5               ; A = 0x5
        DEC                 ; A = 0x4
        SUB FOUR            ; A = 0x4 - 0x4 = 0
        JZ  TEST_WRAP
        JMP FAIL

TEST_WRAP:
        ; === Test INC wrap-around (0xF + 1 = 0x0) ===
        LDI 15              ; A = 0xF
        INC                 ; A = 0x0 (wrap)
        JZ  PASS            ; Should be zero
        JMP FAIL

PASS:
        ; All tests passed!
        LDI 15              ; A = 0xF (success code)
        STA RESULT
        HLT

FAIL:
        ; Test failed
        LDI 0               ; A = 0x0 (failure code)
        STA RESULT
        HLT

; Data section
        ORG 0x60

; Test values
MASK5:   DB  5              ; 0x5 = 0101
MASK_A:  DB  10             ; 0xA = 1010
FIFTEEN: DB  15             ; 0xF
FIVE:    DB  5
SIX:     DB  6
THREE:   DB  3
EIGHT:   DB  8
FOUR:    DB  4

; Result location
RESULT:  DB  0              ; 0xF = success, 0 = fail

; Expected: RESULT = 0xF, A = 0xF
