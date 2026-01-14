; memory.asm - Test memory addressing modes for Micro16
; Tests: LD, ST, LDB, STB (direct, indexed, indirect)
; Tests: LEA, LDS, LES (load effective address, load with segment)
;
; Micro16 Architecture Test Program
; - 20-bit physical addressing (segment:offset)
; - Word (16-bit) and byte memory operations
; - Multiple addressing modes

        .org 0x0100             ; Default PC start location

START:
        ; ===== Test 1: Direct word load/store =====
        MOV AX, #0x1234         ; AX = 0x1234
        ST AX, [DATA1]          ; Store word to DATA1
        MOV AX, #0x0000         ; Clear AX
        LD AX, [DATA1]          ; Load word from DATA1
        ST AX, [RESULT1]        ; Store: should be 0x1234

        ; ===== Test 2: Direct byte load/store =====
        MOV AX, #0x00AB         ; AX low byte = 0xAB
        STB AX, [BYTE1]         ; Store byte (low byte of AX)
        MOV AX, #0xFFFF         ; Fill AX with 1s
        LDB AX, [BYTE1]         ; Load byte (zero-extended)
        ST AX, [RESULT2]        ; Store: should be 0x00AB

        ; ===== Test 3: Multiple word stores =====
        MOV AX, #0x1111
        MOV BX, #0x2222
        MOV CX, #0x3333
        ST AX, [DATA2]
        ST BX, [DATA3]
        ST CX, [DATA4]
        ; Load back into different registers
        LD DX, [DATA2]          ; DX = 0x1111
        LD SI, [DATA3]          ; SI = 0x2222
        LD DI, [DATA4]          ; DI = 0x3333
        ST DX, [RESULT3A]
        ST SI, [RESULT3B]
        ST DI, [RESULT3C]

        ; ===== Test 4: Indexed addressing [Rs + offset] =====
        MOV BX, #ARRAY1         ; BX = base address of ARRAY1
        MOV AX, #0xAA00
        ST AX, [BX+0]           ; Store at ARRAY1[0]
        MOV AX, #0xBB00
        ST AX, [BX+2]           ; Store at ARRAY1[1] (word = 2 bytes)
        MOV AX, #0xCC00
        ST AX, [BX+4]           ; Store at ARRAY1[2]

        ; Load back using indexed addressing
        LD CX, [BX+0]           ; CX = 0xAA00
        LD DX, [BX+2]           ; DX = 0xBB00
        LD SI, [BX+4]           ; SI = 0xCC00
        ST CX, [RESULT4A]
        ST DX, [RESULT4B]
        ST SI, [RESULT4C]

        ; ===== Test 5: Indexed addressing with register base =====
        MOV SI, #ARRAY2         ; SI = base address
        MOV AX, #0x1000
        ST AX, [SI+0]           ; ARRAY2[0] = 0x1000
        MOV AX, #0x2000
        ST AX, [SI+2]           ; ARRAY2[1] = 0x2000
        MOV AX, #0x3000
        ST AX, [SI+4]           ; ARRAY2[2] = 0x3000
        MOV AX, #0x4000
        ST AX, [SI+6]           ; ARRAY2[3] = 0x4000

        ; Sum the array elements
        LD AX, [SI+0]           ; AX = 0x1000
        LD BX, [SI+2]           ; BX = 0x2000
        ADD AX, BX              ; AX = 0x3000
        LD BX, [SI+4]           ; BX = 0x3000
        ADD AX, BX              ; AX = 0x6000
        LD BX, [SI+6]           ; BX = 0x4000
        ADD AX, BX              ; AX = 0xA000
        ST AX, [RESULT5]        ; Store sum: 0xA000

        ; ===== Test 6: LEA (Load Effective Address) =====
        MOV BX, #0x1000         ; Base address
        LEA AX, [BX+0x0100]     ; AX = 0x1000 + 0x0100 = 0x1100
        ST AX, [RESULT6]        ; Store: 0x1100

        ; ===== Test 7: Byte array access =====
        MOV SI, #BYTE_ARRAY
        MOV AX, #0x0011
        STB AX, [SI+0]          ; Store 0x11
        MOV AX, #0x0022
        STB AX, [SI+1]          ; Store 0x22
        MOV AX, #0x0033
        STB AX, [SI+2]          ; Store 0x33
        MOV AX, #0x0044
        STB AX, [SI+3]          ; Store 0x44

        ; Read back bytes
        LDB AX, [SI+0]          ; AX = 0x0011
        LDB BX, [SI+1]          ; BX = 0x0022
        LDB CX, [SI+2]          ; CX = 0x0033
        LDB DX, [SI+3]          ; DX = 0x0044

        ; Combine into word
        SHL BX, #8              ; BX = 0x2200
        OR AX, BX               ; AX = 0x2211
        ST AX, [RESULT7A]       ; Store: 0x2211

        SHL DX, #8              ; DX = 0x4400
        OR CX, DX               ; CX = 0x4433
        ST CX, [RESULT7B]       ; Store: 0x4433

        ; ===== Test 8: Memory-to-memory via register =====
        MOV AX, #0xDEAD
        ST AX, [SOURCE]         ; Store source value
        LD BX, [SOURCE]         ; Load from source
        ST BX, [DEST]           ; Store to destination
        LD CX, [DEST]           ; Verify
        ST CX, [RESULT8]        ; Store: 0xDEAD

        ; ===== Test 9: Array fill loop =====
        MOV DI, #ARRAY3         ; DI = destination array
        MOV CX, #5              ; CX = count (5 elements)
        MOV AX, #0x0100         ; Starting value
FILL_LOOP:
        ST AX, [DI+0]           ; Store current value
        ADD DI, #2              ; Move to next word
        ADD AX, #0x0100         ; Increment value by 0x100
        DEC CX                  ; Decrement counter
        JNZ FILL_LOOP           ; Loop if not zero

        ; Verify first and last elements
        LD AX, [ARRAY3]         ; First = 0x0100
        LD BX, [ARRAY3+8]       ; Last = 0x0500 (0x100 + 4*0x100)
        ST AX, [RESULT9A]       ; Store: 0x0100
        ST BX, [RESULT9B]       ; Store: 0x0500

        ; ===== Test 10: Word alignment test =====
        ; Words should be stored as little-endian
        MOV AX, #0x1234
        ST AX, [ALIGN_TEST]     ; Store 0x1234
        LDB BX, [ALIGN_TEST]    ; Load low byte = 0x34
        LDB CX, [ALIGN_TEST+1]  ; Load high byte = 0x12
        ST BX, [RESULT10A]      ; Store: 0x0034
        ST CX, [RESULT10B]      ; Store: 0x0012

        ; ===== Test 11: Pointer indirection =====
        MOV AX, #DATA5          ; Get address of DATA5
        ST AX, [PTR]            ; Store pointer
        MOV AX, #0xBEEF
        ST AX, [DATA5]          ; Store value at DATA5

        ; Now load through pointer
        LD BX, [PTR]            ; BX = address of DATA5
        LD CX, [BX+0]           ; CX = value at DATA5 = 0xBEEF
        ST CX, [RESULT11]       ; Store: 0xBEEF

        ; ===== Test 12: Structure-like access =====
        ; Simulate struct: { word field1; word field2; byte field3; }
        MOV BX, #STRUCT1
        MOV AX, #0x0001
        ST AX, [BX+0]           ; field1 = 0x0001
        MOV AX, #0x0002
        ST AX, [BX+2]           ; field2 = 0x0002
        MOV AX, #0x0003
        STB AX, [BX+4]          ; field3 = 0x03

        ; Read back
        LD CX, [BX+0]           ; CX = field1
        LD DX, [BX+2]           ; DX = field2
        ADD CX, DX              ; CX = field1 + field2 = 3
        LDB AX, [BX+4]          ; AX = field3 = 3
        ADD CX, AX              ; CX = 3 + 3 = 6
        ST CX, [RESULT12]       ; Store: 0x0006

        ; ===== Final verification =====
        MOV AX, #0xCAFE
        ST AX, [FINAL_RESULT]

        HLT                     ; Stop execution

; Data section
        .org 0x0500

; Test data storage
DATA1:        .dw 0
DATA2:        .dw 0
DATA3:        .dw 0
DATA4:        .dw 0
DATA5:        .dw 0

BYTE1:        .db 0
              .db 0             ; Padding for alignment

; Arrays (word-aligned)
ARRAY1:       .dw 0, 0, 0       ; 3 words
ARRAY2:       .dw 0, 0, 0, 0    ; 4 words
ARRAY3:       .dw 0, 0, 0, 0, 0 ; 5 words

; Byte array
BYTE_ARRAY:   .db 0, 0, 0, 0

; Pointer test
PTR:          .dw 0
SOURCE:       .dw 0
DEST:         .dw 0

; Alignment test
ALIGN_TEST:   .dw 0

; Structure test
STRUCT1:      .dw 0, 0          ; field1, field2
              .db 0             ; field3

; Results section
        .org 0x0600

RESULT1:      .dw 0             ; Expected: 0x1234
RESULT2:      .dw 0             ; Expected: 0x00AB

RESULT3A:     .dw 0             ; Expected: 0x1111
RESULT3B:     .dw 0             ; Expected: 0x2222
RESULT3C:     .dw 0             ; Expected: 0x3333

RESULT4A:     .dw 0             ; Expected: 0xAA00
RESULT4B:     .dw 0             ; Expected: 0xBB00
RESULT4C:     .dw 0             ; Expected: 0xCC00

RESULT5:      .dw 0             ; Expected: 0xA000 (sum)

RESULT6:      .dw 0             ; Expected: 0x1100 (LEA)

RESULT7A:     .dw 0             ; Expected: 0x2211
RESULT7B:     .dw 0             ; Expected: 0x4433

RESULT8:      .dw 0             ; Expected: 0xDEAD

RESULT9A:     .dw 0             ; Expected: 0x0100 (first)
RESULT9B:     .dw 0             ; Expected: 0x0500 (last)

RESULT10A:    .dw 0             ; Expected: 0x0034 (low byte)
RESULT10B:    .dw 0             ; Expected: 0x0012 (high byte)

RESULT11:     .dw 0             ; Expected: 0xBEEF (indirect)

RESULT12:     .dw 0             ; Expected: 0x0006 (struct sum)

FINAL_RESULT: .dw 0             ; Expected: 0xCAFE (success)

; Notes on Micro16 memory:
; - 20-bit physical address = (segment << 4) + offset
; - Word access should be word-aligned (even address)
; - Little-endian byte order (low byte at lower address)
; - LDB zero-extends byte to 16-bit register
; - STB stores only low byte of register
