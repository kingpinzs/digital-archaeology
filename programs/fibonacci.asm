; fibonacci.asm - Calculate Fibonacci sequence
; Calculates: 1, 1, 2, 3, 5, 8, 13...
; Result stored in FIB_N

        ORG 0x00

START:  LDI 1               ; A = 1
        STA FIB_A           ; FIB_A = 1 (F(n-2))
        STA FIB_B           ; FIB_B = 1 (F(n-1))

LOOP:   LDA FIB_A           ; Load F(n-2)
        ADD FIB_B           ; A = F(n-2) + F(n-1) = F(n)
        STA FIB_N           ; Store result

        ; Update: FIB_A = FIB_B, FIB_B = FIB_N
        LDA FIB_B
        STA FIB_A
        LDA FIB_N
        STA FIB_B

        ; Decrement counter
        LDA COUNT
        SUB ONE
        STA COUNT
        JZ  DONE
        JMP LOOP

DONE:   LDA FIB_N           ; Load final Fibonacci number
        HLT

; Data (code is ~52 nibbles, use 0x40)
        ORG 0x40
FIB_A:  DB  0               ; F(n-2)
FIB_B:  DB  0               ; F(n-1)
FIB_N:  DB  0               ; F(n) - result
COUNT:  DB  5               ; Number of iterations
ONE:    DB  1               ; Constant 1

; Fibonacci: 1, 1, 2, 3, 5, 8, 13...
; 5 iterations from (1,1) gives F(6) = 13 (0xD)
