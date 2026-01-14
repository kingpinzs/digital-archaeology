; memory.asm - Test memory access instructions
; Tests: LD, ST, LDZ, STZ, LD/ST [HL], LD/ST [HL+d]
; Tests: Direct addressing, zero page, indirect, indexed
;
; Micro8 Architecture Test Program

        .org 0x0200             ; Start after reserved area

START:
        ; ===== Test 1: Direct Load/Store (16-bit address) =====
        LDI R0, 0xAA            ; R0 = 0xAA
        ST R0, [DATA1]          ; Store to DATA1
        LDI R0, 0x00            ; Clear R0
        LD R0, [DATA1]          ; Load back from DATA1
        ST R0, [RESULT1]        ; Store result: should be 0xAA

        ; ===== Test 2: Store to multiple addresses =====
        LDI R0, 0x11
        LDI R1, 0x22
        LDI R2, 0x33
        ST R0, [DATA2]
        ST R1, [DATA3]
        ST R2, [DATA4]
        ; Load them back into different registers
        LD R3, [DATA2]          ; R3 = 0x11
        LD R4, [DATA3]          ; R4 = 0x22
        LD R5, [DATA4]          ; R5 = 0x33
        ST R3, [RESULT2A]
        ST R4, [RESULT2B]
        ST R5, [RESULT2C]

        ; ===== Test 3: Zero Page Load/Store (8-bit address) =====
        LDI R0, 0xBB
        STZ R0, [0x50]          ; Store to zero page address 0x0050
        LDI R0, 0x00            ; Clear R0
        LDZ R0, [0x50]          ; Load from zero page
        ST R0, [RESULT3]        ; Store result: should be 0xBB

        ; ===== Test 4: Multiple Zero Page accesses =====
        LDI R0, 0x10
        LDI R1, 0x20
        LDI R2, 0x30
        STZ R0, [0x60]
        STZ R1, [0x61]
        STZ R2, [0x62]
        ; Load back
        LDZ R3, [0x60]
        LDZ R4, [0x61]
        LDZ R5, [0x62]
        ; Verify by summing
        ADD R3, R4              ; R3 = 0x30
        ADD R3, R5              ; R3 = 0x60
        ST R3, [RESULT4]        ; Store: should be 0x60

        ; ===== Test 5: Indirect addressing via HL =====
        LDI16 HL, DATA5         ; HL points to DATA5
        LDI R0, 0xCC
        ST R0, [HL]             ; Store 0xCC at address in HL
        LDI R0, 0x00            ; Clear R0
        LD R0, [HL]             ; Load from address in HL
        ST R0, [RESULT5]        ; Store result: should be 0xCC

        ; ===== Test 6: Indirect with HL increment =====
        LDI16 HL, ARRAY1        ; HL points to start of array
        LDI R0, 0x01
        ST R0, [HL]             ; Store 1 at ARRAY1[0]
        INC16 HL                ; HL++
        LDI R0, 0x02
        ST R0, [HL]             ; Store 2 at ARRAY1[1]
        INC16 HL                ; HL++
        LDI R0, 0x03
        ST R0, [HL]             ; Store 3 at ARRAY1[2]

        ; Read back and verify
        LDI16 HL, ARRAY1
        LD R0, [HL]             ; R0 = 1
        INC16 HL
        LD R1, [HL]             ; R1 = 2
        INC16 HL
        LD R2, [HL]             ; R2 = 3
        ADD R0, R1              ; R0 = 3
        ADD R0, R2              ; R0 = 6
        ST R0, [RESULT6]        ; Store: should be 0x06

        ; ===== Test 7: Indexed addressing [HL+d] =====
        LDI16 HL, ARRAY2        ; HL points to base of array
        LDI R0, 0xA0
        ST R0, [HL+0]           ; Store at offset 0
        LDI R0, 0xB0
        ST R0, [HL+1]           ; Store at offset 1
        LDI R0, 0xC0
        ST R0, [HL+2]           ; Store at offset 2
        LDI R0, 0xD0
        ST R0, [HL+3]           ; Store at offset 3

        ; Read back using indexed addressing
        LD R0, [HL+0]           ; R0 = 0xA0
        LD R1, [HL+1]           ; R1 = 0xB0
        LD R2, [HL+2]           ; R2 = 0xC0
        LD R3, [HL+3]           ; R3 = 0xD0
        ST R0, [RESULT7A]
        ST R1, [RESULT7B]
        ST R2, [RESULT7C]
        ST R3, [RESULT7D]

        ; ===== Test 8: Negative indexed offset =====
        LDI16 HL, ARRAY2+2      ; HL points to middle of array
        LD R0, [HL-2]           ; Load from ARRAY2[0] using negative offset
        LD R1, [HL-1]           ; Load from ARRAY2[1]
        LD R2, [HL+0]           ; Load from ARRAY2[2]
        LD R3, [HL+1]           ; Load from ARRAY2[3]
        ; Sum them: 0xA0 + 0xB0 + 0xC0 + 0xD0 = 0x340 (overflow to 0x40)
        ADD R0, R1
        ADD R0, R2
        ADD R0, R3
        ST R0, [RESULT8]        ; Store: should be 0x40 (with overflow)

        ; ===== Test 9: Array traversal using loop =====
        LDI16 HL, ARRAY3        ; Destination array
        LDI R2, 5               ; Counter = 5
        LDI R0, 0x10            ; Starting value
FILL_LOOP:
        ST R0, [HL]             ; Store current value
        ADDI R0, 0x10           ; Value += 16
        INC16 HL                ; Next address
        DEC R2                  ; Counter--
        JRNZ FILL_LOOP          ; Loop if not done

        ; Verify: read back first and last elements
        LD R0, [ARRAY3]         ; First = 0x10
        LD R1, [ARRAY3+4]       ; Last = 0x50 (0x10 + 4*0x10)
        ST R0, [RESULT9A]
        ST R1, [RESULT9B]

        ; ===== Test 10: 16-bit address load =====
        LDI16 HL, 0x0400        ; Load high address
        LDI R0, 0xEE
        ST R0, [0x0400]         ; Store at 0x0400
        LD R1, [0x0400]         ; Load back
        ST R1, [RESULT10]       ; Store: should be 0xEE

        ; ===== Test 11: Store all registers to memory =====
        LDI R0, 0x00
        LDI R1, 0x11
        LDI R2, 0x22
        LDI R3, 0x33
        LDI R4, 0x44
        LDI R5, 0x55
        LDI R6, 0x66
        LDI R7, 0x77
        LDI16 HL, REG_DUMP
        ST R0, [HL+0]
        ST R1, [HL+1]
        ST R2, [HL+2]
        ST R3, [HL+3]
        ST R4, [HL+4]
        ; Note: R5 and R6 are H and L, so we use direct store
        LDI R0, 0x55
        ST R0, [REG_DUMP+5]
        LDI R0, 0x66
        ST R0, [REG_DUMP+6]
        ST R7, [REG_DUMP+7]

        ; Verify R7 was stored correctly
        LD R0, [REG_DUMP+7]
        ST R0, [RESULT11]       ; Store: should be 0x77

        HLT                     ; Stop execution

; Data section - Zero Page
        .org 0x0050
ZP_DATA:      .db 0             ; Zero page test area

; Data section - Main RAM
        .org 0x0500
DATA1:        .db 0             ; Direct addressing test
DATA2:        .db 0
DATA3:        .db 0
DATA4:        .db 0
DATA5:        .db 0             ; Indirect addressing test
ARRAY1:       .db 0, 0, 0       ; 3-byte array
ARRAY2:       .db 0, 0, 0, 0    ; 4-byte array for indexed test
ARRAY3:       .db 0, 0, 0, 0, 0 ; 5-byte array for loop test
REG_DUMP:     .db 0, 0, 0, 0, 0, 0, 0, 0  ; 8-byte register dump

; Results section
        .org 0x0550
RESULT1:      .db 0             ; Expected: 0xAA
RESULT2A:     .db 0             ; Expected: 0x11
RESULT2B:     .db 0             ; Expected: 0x22
RESULT2C:     .db 0             ; Expected: 0x33
RESULT3:      .db 0             ; Expected: 0xBB
RESULT4:      .db 0             ; Expected: 0x60
RESULT5:      .db 0             ; Expected: 0xCC
RESULT6:      .db 0             ; Expected: 0x06
RESULT7A:     .db 0             ; Expected: 0xA0
RESULT7B:     .db 0             ; Expected: 0xB0
RESULT7C:     .db 0             ; Expected: 0xC0
RESULT7D:     .db 0             ; Expected: 0xD0
RESULT8:      .db 0             ; Expected: 0x40 (sum with overflow)
RESULT9A:     .db 0             ; Expected: 0x10
RESULT9B:     .db 0             ; Expected: 0x50
RESULT10:     .db 0             ; Expected: 0xEE
RESULT11:     .db 0             ; Expected: 0x77
