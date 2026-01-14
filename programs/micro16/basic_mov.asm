; basic_mov.asm - Test data transfer instructions for Micro16
; Tests: MOV Rd,Rs, MOV Rd,#imm16, XCHG, MOV Seg,Rs, MOV Rd,Seg
; Tests register-to-register, immediate loads, segment register access
;
; Micro16 Architecture Test Program
; - 8 x 16-bit general purpose registers (R0-R7 / AX-R7)
; - 4 segment registers (CS, DS, SS, ES)
; - 16-bit data operations

        .org 0x0100             ; Default PC start location

START:
        ; ===== Test 1: Load immediate 16-bit values into registers =====
        MOV AX, #0x1234         ; AX (R0) = 0x1234
        MOV BX, #0x5678         ; BX (R1) = 0x5678
        MOV CX, #0x9ABC         ; CX (R2) = 0x9ABC
        MOV DX, #0xDEF0         ; DX (R3) = 0xDEF0
        MOV SI, #0xAAAA         ; SI (R4) = 0xAAAA
        MOV DI, #0x5555         ; DI (R5) = 0x5555
        MOV BP, #0xFF00         ; BP (R6) = 0xFF00
        MOV R7, #0x00FF         ; R7 = 0x00FF

        ; Store initial values for verification
        ST AX, [RESULT_AX]      ; Store AX
        ST BX, [RESULT_BX]      ; Store BX
        ST CX, [RESULT_CX]      ; Store CX

        ; ===== Test 2: Register to register moves =====
        MOV AX, BX              ; AX = 0x5678 (copy from BX)
        MOV CX, DX              ; CX = 0xDEF0 (copy from DX)
        ST AX, [MOV_RR_1]       ; Store: should be 0x5678
        ST CX, [MOV_RR_2]       ; Store: should be 0xDEF0

        ; ===== Test 3: Chain of moves =====
        MOV AX, #0xBEEF         ; AX = 0xBEEF
        MOV BX, AX              ; BX = 0xBEEF
        MOV CX, BX              ; CX = 0xBEEF
        MOV DX, CX              ; DX = 0xBEEF
        ST DX, [CHAIN_RESULT]   ; Store: should be 0xBEEF

        ; ===== Test 4: XCHG (exchange registers) =====
        MOV AX, #0x1111         ; AX = 0x1111
        MOV BX, #0x2222         ; BX = 0x2222
        XCHG AX, BX             ; Swap: AX=0x2222, BX=0x1111
        ST AX, [XCHG_AX]        ; Store: should be 0x2222
        ST BX, [XCHG_BX]        ; Store: should be 0x1111

        ; ===== Test 5: XCHG with same register (no-op) =====
        MOV AX, #0x3333         ; AX = 0x3333
        XCHG AX, AX             ; No change
        ST AX, [XCHG_SELF]      ; Store: should be 0x3333

        ; ===== Test 6: Move to segment register =====
        MOV AX, #0x1000         ; Segment value for DS
        MOV DS, AX              ; DS = 0x1000 (physical base = 0x10000)
        MOV BX, #0x2000         ; Segment value for ES
        MOV ES, BX              ; ES = 0x2000 (physical base = 0x20000)

        ; ===== Test 7: Move from segment register to GPR =====
        MOV CX, DS              ; CX = DS = 0x1000
        MOV DX, ES              ; DX = ES = 0x2000
        ST CX, [SEG_DS_COPY]    ; Store: should be 0x1000
        ST DX, [SEG_ES_COPY]    ; Store: should be 0x2000

        ; ===== Test 8: Read CS and SS (read-only test) =====
        MOV AX, CS              ; AX = current code segment
        MOV BX, SS              ; BX = current stack segment
        ST AX, [SEG_CS_VAL]     ; Store CS value
        ST BX, [SEG_SS_VAL]     ; Store SS value

        ; ===== Test 9: Move zero and max values =====
        MOV AX, #0x0000         ; Test zero
        MOV BX, #0xFFFF         ; Test max 16-bit value
        ST AX, [ZERO_VAL]       ; Store: should be 0x0000
        ST BX, [MAX_VAL]        ; Store: should be 0xFFFF

        ; ===== Test 10: Move between high/low registers =====
        MOV SI, #0x1234         ; SI = 0x1234
        MOV R7, SI              ; R7 = 0x1234 (low to high)
        MOV DI, R7              ; DI = 0x1234 (high to mid)
        ST DI, [HIGH_LOW]       ; Store: should be 0x1234

        ; ===== Test 11: Restore DS to default =====
        MOV AX, #0x0000         ; Restore DS
        MOV DS, AX              ; DS = 0x0000

        ; ===== Final verification =====
        MOV AX, #0xCAFE         ; Success marker
        ST AX, [FINAL_RESULT]

        HLT                     ; Stop execution

; Data section
        .org 0x0500

; Initial load results
RESULT_AX:    .dw 0             ; Expected: 0x1234
RESULT_BX:    .dw 0             ; Expected: 0x5678
RESULT_CX:    .dw 0             ; Expected: 0x9ABC

; Register-to-register move results
MOV_RR_1:     .dw 0             ; Expected: 0x5678
MOV_RR_2:     .dw 0             ; Expected: 0xDEF0

; Chain move result
CHAIN_RESULT: .dw 0             ; Expected: 0xBEEF

; XCHG results
XCHG_AX:      .dw 0             ; Expected: 0x2222
XCHG_BX:      .dw 0             ; Expected: 0x1111
XCHG_SELF:    .dw 0             ; Expected: 0x3333

; Segment register results
SEG_DS_COPY:  .dw 0             ; Expected: 0x1000
SEG_ES_COPY:  .dw 0             ; Expected: 0x2000
SEG_CS_VAL:   .dw 0             ; Expected: 0x0000 (default CS)
SEG_SS_VAL:   .dw 0             ; Expected: 0x0F00 (default SS)

; Boundary value tests
ZERO_VAL:     .dw 0             ; Expected: 0x0000
MAX_VAL:      .dw 0             ; Expected: 0xFFFF

; High/low register test
HIGH_LOW:     .dw 0             ; Expected: 0x1234

; Final result
FINAL_RESULT: .dw 0             ; Expected: 0xCAFE (success)

; Expected final state:
; - All ST results should match expected values in comments
; - DS restored to 0x0000
; - FINAL_RESULT = 0xCAFE indicates successful completion
