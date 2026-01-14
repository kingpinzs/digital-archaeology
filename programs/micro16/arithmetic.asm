; arithmetic.asm - Test arithmetic instructions for Micro16
; Tests: ADD, ADC, SUB, SBC, CMP, NEG, INC, DEC (register and immediate forms)
; Note: MUL/DIV tested separately in multiply.asm and divide.asm
;
; Micro16 Architecture Test Program
; - 16-bit arithmetic operations
; - Full flag updates (C, Z, S, O)

        .org 0x0100             ; Default PC start location

START:
        ; ===== Test 1: ADD register-register =====
        MOV AX, #1000           ; AX = 1000
        MOV BX, #2345           ; BX = 2345
        ADD AX, BX              ; AX = 1000 + 2345 = 3345
        ST AX, [ADD_RR]         ; Store: 3345 (0x0D11)

        ; ===== Test 2: ADD register-immediate =====
        MOV AX, #5000           ; AX = 5000
        ADD AX, #1234           ; AX = 5000 + 1234 = 6234
        ST AX, [ADD_RI]         ; Store: 6234 (0x185A)

        ; ===== Test 3: ADD with carry generation =====
        MOV AX, #0xFFFF         ; AX = 65535
        MOV BX, #0x0001         ; BX = 1
        ADD AX, BX              ; AX = 0, C=1 (overflow)
        ST AX, [ADD_CARRY]      ; Store: 0x0000

        ; ===== Test 4: ADD 16-bit overflow wrap =====
        MOV AX, #0x8000         ; AX = 32768
        MOV BX, #0x8000         ; BX = 32768
        ADD AX, BX              ; AX = 0x0000, C=1
        ST AX, [ADD_WRAP]       ; Store: 0x0000

        ; ===== Test 5: ADC (add with carry) =====
        ; First set carry by causing overflow
        MOV AX, #0xFFFF
        ADD AX, #0x0001         ; AX = 0, C=1
        MOV AX, #100            ; AX = 100
        MOV BX, #50             ; BX = 50
        ADC AX, BX              ; AX = 100 + 50 + 1 = 151
        ST AX, [ADC_RESULT]     ; Store: 151 (0x0097)

        ; ===== Test 6: ADC immediate =====
        MOV AX, #0xFFFF
        ADD AX, #0x0001         ; C=1
        MOV AX, #200
        ADC AX, #55             ; AX = 200 + 55 + 1 = 256
        ST AX, [ADC_IMM]        ; Store: 256 (0x0100)

        ; ===== Test 7: SUB register-register =====
        MOV AX, #5000           ; AX = 5000
        MOV BX, #1234           ; BX = 1234
        SUB AX, BX              ; AX = 5000 - 1234 = 3766
        ST AX, [SUB_RR]         ; Store: 3766 (0x0EB6)

        ; ===== Test 8: SUB register-immediate =====
        MOV AX, #10000          ; AX = 10000
        SUB AX, #4567           ; AX = 10000 - 4567 = 5433
        ST AX, [SUB_RI]         ; Store: 5433 (0x1539)

        ; ===== Test 9: SUB with borrow (underflow) =====
        MOV AX, #0x0000         ; AX = 0
        MOV BX, #0x0001         ; BX = 1
        SUB AX, BX              ; AX = 0xFFFF, C=1 (borrow)
        ST AX, [SUB_BORROW]     ; Store: 0xFFFF

        ; ===== Test 10: SBC (subtract with borrow) =====
        ; First set carry/borrow
        MOV AX, #0x0000
        SUB AX, #0x0001         ; AX = 0xFFFF, C=1 (borrow set)
        MOV AX, #100            ; AX = 100
        MOV BX, #30             ; BX = 30
        SBC AX, BX              ; AX = 100 - 30 - 1 = 69
        ST AX, [SBC_RESULT]     ; Store: 69 (0x0045)

        ; ===== Test 11: SBC immediate =====
        MOV AX, #0x0000
        SUB AX, #0x0001         ; C=1 (borrow)
        MOV AX, #500
        SBC AX, #100            ; AX = 500 - 100 - 1 = 399
        ST AX, [SBC_IMM]        ; Store: 399 (0x018F)

        ; ===== Test 12: CMP register-register (no result stored) =====
        MOV AX, #500            ; AX = 500
        MOV BX, #300            ; BX = 300
        CMP AX, BX              ; Compare: 500 - 300, Z=0, C=0, S=0
        ST AX, [CMP_RR]         ; Store: 500 (unchanged)

        ; ===== Test 13: CMP equal values =====
        MOV AX, #1234           ; AX = 1234
        MOV BX, #1234           ; BX = 1234
        CMP AX, BX              ; Compare: equal, Z=1
        JZ CMP_EQ_OK
        MOV CX, #0xFFFF         ; Should not execute
        JMP CMP_EQ_DONE
CMP_EQ_OK:
        MOV CX, #0x0001         ; Z=1 confirmed
CMP_EQ_DONE:
        ST CX, [CMP_EQUAL]      ; Store: 0x0001

        ; ===== Test 14: CMP register-immediate =====
        MOV AX, #5000           ; AX = 5000
        CMP AX, #5000           ; Compare with immediate, Z=1
        JZ CMP_RI_OK
        MOV CX, #0xFFFF         ; Should not execute
        JMP CMP_RI_DONE
CMP_RI_OK:
        MOV CX, #0x0002         ; CMP immediate works
CMP_RI_DONE:
        ST CX, [CMP_RI]         ; Store: 0x0002

        ; ===== Test 15: NEG (two's complement) =====
        MOV AX, #100            ; AX = 100
        NEG AX                  ; AX = -100 = 0xFF9C (65436)
        ST AX, [NEG_RESULT]     ; Store: 0xFF9C

        ; ===== Test 16: NEG of negative number =====
        MOV AX, #0xFF9C         ; AX = -100 (signed)
        NEG AX                  ; AX = 100
        ST AX, [NEG_NEG]        ; Store: 100 (0x0064)

        ; ===== Test 17: NEG of zero =====
        MOV AX, #0x0000         ; AX = 0
        NEG AX                  ; AX = 0 (unchanged)
        ST AX, [NEG_ZERO]       ; Store: 0x0000

        ; ===== Test 18: INC register =====
        MOV AX, #0x1234         ; AX = 0x1234
        INC AX                  ; AX = 0x1235
        ST AX, [INC_RESULT]     ; Store: 0x1235

        ; ===== Test 19: INC wrap around =====
        MOV AX, #0xFFFF         ; AX = 65535
        INC AX                  ; AX = 0x0000 (wrap)
        ST AX, [INC_WRAP]       ; Store: 0x0000

        ; ===== Test 20: DEC register =====
        MOV AX, #0x1234         ; AX = 0x1234
        DEC AX                  ; AX = 0x1233
        ST AX, [DEC_RESULT]     ; Store: 0x1233

        ; ===== Test 21: DEC to zero (tests Z flag) =====
        MOV AX, #0x0001         ; AX = 1
        DEC AX                  ; AX = 0, Z=1
        ST AX, [DEC_ZERO]       ; Store: 0x0000
        JZ DEC_Z_OK
        MOV BX, #0xFFFF
        JMP DEC_Z_DONE
DEC_Z_OK:
        MOV BX, #0x0003
DEC_Z_DONE:
        ST BX, [DEC_ZFLAG]      ; Store: 0x0003

        ; ===== Test 22: DEC wrap around =====
        MOV AX, #0x0000         ; AX = 0
        DEC AX                  ; AX = 0xFFFF (wrap)
        ST AX, [DEC_WRAP]       ; Store: 0xFFFF

        ; ===== Test 23: Multi-precision addition (32-bit using ADC) =====
        ; Add 0x12345678 + 0x00001111
        ; Low word: 0x5678 + 0x1111 = 0x6789
        ; High word: 0x1234 + 0x0000 + carry = 0x1234
        MOV AX, #0x5678         ; Low word of first number
        ADD AX, #0x1111         ; Add low word of second number
        ST AX, [ADD32_LO]       ; Store low result: 0x6789
        MOV AX, #0x1234         ; High word of first number
        ADC AX, #0x0000         ; Add high word with carry
        ST AX, [ADD32_HI]       ; Store high result: 0x1234

        ; ===== Test 24: Multi-precision with carry propagation =====
        ; 0x0000FFFF + 0x00000001 = 0x00010000
        MOV AX, #0xFFFF         ; Low word
        ADD AX, #0x0001         ; Overflow, C=1
        ST AX, [ADD32P_LO]      ; Store: 0x0000
        MOV AX, #0x0000         ; High word
        ADC AX, #0x0000         ; Add carry
        ST AX, [ADD32P_HI]      ; Store: 0x0001

        ; ===== Final verification =====
        MOV AX, #0xCAFE         ; Success marker
        ST AX, [FINAL_RESULT]

        HLT                     ; Stop execution

; Data section
        .org 0x0500

; ADD results
ADD_RR:       .dw 0             ; Expected: 0x0D11 (3345)
ADD_RI:       .dw 0             ; Expected: 0x185A (6234)
ADD_CARRY:    .dw 0             ; Expected: 0x0000
ADD_WRAP:     .dw 0             ; Expected: 0x0000

; ADC results
ADC_RESULT:   .dw 0             ; Expected: 0x0097 (151)
ADC_IMM:      .dw 0             ; Expected: 0x0100 (256)

; SUB results
SUB_RR:       .dw 0             ; Expected: 0x0EB6 (3766)
SUB_RI:       .dw 0             ; Expected: 0x1539 (5433)
SUB_BORROW:   .dw 0             ; Expected: 0xFFFF

; SBC results
SBC_RESULT:   .dw 0             ; Expected: 0x0045 (69)
SBC_IMM:      .dw 0             ; Expected: 0x018F (399)

; CMP results
CMP_RR:       .dw 0             ; Expected: 0x01F4 (500, unchanged)
CMP_EQUAL:    .dw 0             ; Expected: 0x0001 (Z flag test)
CMP_RI:       .dw 0             ; Expected: 0x0002 (imm test)

; NEG results
NEG_RESULT:   .dw 0             ; Expected: 0xFF9C (-100)
NEG_NEG:      .dw 0             ; Expected: 0x0064 (100)
NEG_ZERO:     .dw 0             ; Expected: 0x0000

; INC results
INC_RESULT:   .dw 0             ; Expected: 0x1235
INC_WRAP:     .dw 0             ; Expected: 0x0000

; DEC results
DEC_RESULT:   .dw 0             ; Expected: 0x1233
DEC_ZERO:     .dw 0             ; Expected: 0x0000
DEC_ZFLAG:    .dw 0             ; Expected: 0x0003 (Z flag confirmed)
DEC_WRAP:     .dw 0             ; Expected: 0xFFFF

; 32-bit arithmetic results
ADD32_LO:     .dw 0             ; Expected: 0x6789
ADD32_HI:     .dw 0             ; Expected: 0x1234
ADD32P_LO:    .dw 0             ; Expected: 0x0000
ADD32P_HI:    .dw 0             ; Expected: 0x0001

; Final result
FINAL_RESULT: .dw 0             ; Expected: 0xCAFE (success)

; Notes on flags:
; - ADD/SUB/CMP affect C, Z, S, O flags
; - ADC/SBC use and affect C flag
; - INC/DEC affect Z, S, O but NOT C (x86-like behavior)
; - NEG sets C=1 unless operand is 0
