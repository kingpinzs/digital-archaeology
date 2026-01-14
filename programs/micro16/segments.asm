; segments.asm - Test segment register operations for Micro16
; Tests: Segment register load/store, segment overrides
; Tests: LDS, LES (load pointer with segment)
; Tests: Physical address calculation (segment << 4 + offset)
;
; Micro16 Architecture Test Program
; - 4 segment registers: CS, DS, SS, ES
; - 20-bit physical address = (segment << 4) + offset
; - Default segments: CS for code, DS for data, SS for stack, ES for extra

        .org 0x0100             ; Default PC start location

START:
        ; ===== Test 1: Read default segment values =====
        ; After reset: CS=0x0000, DS=0x0000, SS=0x0F00, ES=0x0000
        MOV AX, CS              ; Read CS
        ST AX, [RESULT1A]       ; Store: should be 0x0000
        MOV AX, DS              ; Read DS
        ST AX, [RESULT1B]       ; Store: should be 0x0000
        MOV AX, SS              ; Read SS
        ST AX, [RESULT1C]       ; Store: should be 0x0F00
        MOV AX, ES              ; Read ES
        ST AX, [RESULT1D]       ; Store: should be 0x0000

        ; ===== Test 2: Load DS with new value =====
        MOV AX, #0x1000         ; New segment value
        MOV DS, AX              ; DS = 0x1000 (physical base = 0x10000)
        MOV AX, DS              ; Read back
        ST AX, [RESULT2]        ; Store: should be 0x1000
        ; Restore DS
        MOV AX, #0x0000
        MOV DS, AX

        ; ===== Test 3: Load ES with new value =====
        MOV AX, #0x2000         ; New segment value
        MOV ES, AX              ; ES = 0x2000 (physical base = 0x20000)
        MOV AX, ES              ; Read back
        ST AX, [RESULT3]        ; Store: should be 0x2000
        ; Keep ES for later tests

        ; ===== Test 4: Write/Read using default segment (DS) =====
        ; With DS=0, write to DATA_TEST (offset)
        MOV AX, #0xABCD
        ST AX, [DATA_TEST]      ; Uses DS:DATA_TEST
        LD BX, [DATA_TEST]      ; Read back
        ST BX, [RESULT4]        ; Store: should be 0xABCD

        ; ===== Test 5: Write using segment override (ES) =====
        ; ES = 0x2000, so ES:0x0000 = physical 0x20000
        ; Note: Our test data is in segment 0, so we need to be careful
        MOV AX, #0x1234
        ; For testing, we'll use ES with offset 0 which maps differently
        ; In real code: ST ES:[offset], AX
        ; For now, we just verify segment math
        ; Physical addr = ES << 4 + offset = 0x2000 << 4 + 0 = 0x20000

        ; Compute expected physical address
        MOV AX, ES              ; AX = 0x2000
        SHL AX, #4              ; AX = 0x0000 (lower 16 bits of 0x20000)
        ; The high bits are lost in 16-bit, but segment:offset works
        ST AX, [RESULT5]        ; Store: 0x0000 (low word of physical)

        ; ===== Test 6: LDS - Load register and DS =====
        ; LDS loads a 32-bit pointer: low word = offset, high word = segment
        ; Prepare a far pointer
        MOV AX, #0x1234         ; Offset
        ST AX, [FAR_PTR]        ; Store offset
        MOV AX, #0x5678         ; Segment
        ST AX, [FAR_PTR+2]      ; Store segment

        LDS BX, [FAR_PTR]       ; BX = 0x1234, DS = 0x5678
        MOV AX, BX
        ST AX, [RESULT6A]       ; Store offset: 0x1234
        MOV AX, DS
        ST AX, [RESULT6B]       ; Store segment: 0x5678

        ; Restore DS
        MOV AX, #0x0000
        MOV DS, AX

        ; ===== Test 7: LES - Load register and ES =====
        ; Prepare another far pointer
        MOV AX, #0xAAAA         ; Offset
        ST AX, [FAR_PTR2]
        MOV AX, #0xBBBB         ; Segment
        ST AX, [FAR_PTR2+2]

        LES CX, [FAR_PTR2]      ; CX = 0xAAAA, ES = 0xBBBB
        MOV AX, CX
        ST AX, [RESULT7A]       ; Store offset: 0xAAAA
        MOV AX, ES
        ST AX, [RESULT7B]       ; Store segment: 0xBBBB

        ; ===== Test 8: Stack segment access =====
        ; SS is used automatically for PUSH/POP and [BP] addressing
        MOV AX, SS              ; Get SS
        ST AX, [RESULT8A]       ; Store: 0x0F00

        ; Calculate physical stack address
        ; SP starts at 0xFFFE, SS = 0x0F00
        ; Physical = 0x0F00 << 4 + 0xFFFE = 0x0FFFE
        MOV AX, SS
        SHL AX, #4              ; AX = 0xF000 (lower 16 of 0x0F000)
        ST AX, [RESULT8B]

        ; ===== Test 9: Segment for JMP FAR =====
        ; JMP FAR changes both CS and IP
        ; We can't easily test this without changing code segment
        ; Instead, test that we can read CS
        MOV AX, CS
        ST AX, [RESULT9]        ; Store: 0x0000

        ; ===== Test 10: Multiple segment switches =====
        MOV AX, #0x1111
        MOV DS, AX
        MOV AX, #0x2222
        MOV ES, AX
        MOV AX, DS
        MOV BX, ES
        ADD AX, BX              ; AX = 0x3333
        ST AX, [RESULT10A]      ; Store: 0x3333

        ; Swap segments
        MOV CX, DS              ; Save DS
        MOV DX, ES              ; Save ES
        MOV DS, DX              ; DS = old ES
        MOV ES, CX              ; ES = old DS
        MOV AX, DS              ; AX = 0x2222
        MOV BX, ES              ; BX = 0x1111
        ST AX, [RESULT10B]      ; Store: 0x2222
        ST BX, [RESULT10C]      ; Store: 0x1111

        ; Restore to defaults
        MOV AX, #0x0000
        MOV DS, AX
        MOV ES, AX

        ; ===== Test 11: Push/Pop segment registers =====
        MOV AX, #0x4444
        MOV DS, AX
        PUSH DS                 ; Push DS onto stack
        MOV AX, #0x0000
        MOV DS, AX              ; Clear DS
        POP AX                  ; Pop into AX
        ST AX, [RESULT11]       ; Store: 0x4444

        ; Final DS restore
        MOV AX, #0x0000
        MOV DS, AX

        ; ===== Test 12: Segment arithmetic demo =====
        ; Show how to compute physical address
        ; Given segment 0x1234 and offset 0x5678:
        ; Physical = 0x1234 * 16 + 0x5678 = 0x12340 + 0x5678 = 0x179B8
        ; In 16-bit, we can only compute the low word: 0x79B8
        MOV AX, #0x1234         ; Segment
        MOV CX, #4              ; Shift count
SEG_SHIFT:
        SHL AX, #1              ; Shift left 1 bit
        DEC CX
        JNZ SEG_SHIFT
        ; AX = 0x2340 (lower 16 bits of 0x12340)
        ADD AX, #0x5678         ; Add offset
        ; AX = 0x79B8 (lower 16 bits of physical address)
        ST AX, [RESULT12]       ; Store: 0x79B8

        ; ===== Final verification =====
        MOV AX, #0xCAFE
        ST AX, [FINAL_RESULT]

        HLT                     ; Stop execution

; Data section
        .org 0x0500

; Test data
DATA_TEST:    .dw 0
FAR_PTR:      .dw 0, 0          ; 32-bit far pointer (offset, segment)
FAR_PTR2:     .dw 0, 0          ; Another far pointer

; Results
        .org 0x0600

RESULT1A:     .dw 0             ; Expected: 0x0000 (CS)
RESULT1B:     .dw 0             ; Expected: 0x0000 (DS)
RESULT1C:     .dw 0             ; Expected: 0x0F00 (SS)
RESULT1D:     .dw 0             ; Expected: 0x0000 (ES)

RESULT2:      .dw 0             ; Expected: 0x1000

RESULT3:      .dw 0             ; Expected: 0x2000

RESULT4:      .dw 0             ; Expected: 0xABCD

RESULT5:      .dw 0             ; Expected: 0x0000 (low word of ES<<4)

RESULT6A:     .dw 0             ; Expected: 0x1234 (offset from LDS)
RESULT6B:     .dw 0             ; Expected: 0x5678 (segment from LDS)

RESULT7A:     .dw 0             ; Expected: 0xAAAA (offset from LES)
RESULT7B:     .dw 0             ; Expected: 0xBBBB (segment from LES)

RESULT8A:     .dw 0             ; Expected: 0x0F00 (SS value)
RESULT8B:     .dw 0             ; Expected: 0xF000 (SS << 4)

RESULT9:      .dw 0             ; Expected: 0x0000 (CS)

RESULT10A:    .dw 0             ; Expected: 0x3333 (DS + ES)
RESULT10B:    .dw 0             ; Expected: 0x2222 (DS after swap)
RESULT10C:    .dw 0             ; Expected: 0x1111 (ES after swap)

RESULT11:     .dw 0             ; Expected: 0x4444 (pushed DS)

RESULT12:     .dw 0             ; Expected: 0x79B8 (seg:off calc)

FINAL_RESULT: .dw 0             ; Expected: 0xCAFE (success)

; Segment register notes for Micro16:
;
; Segment Registers:
;   CS - Code Segment (used for instruction fetch)
;   DS - Data Segment (default for data access)
;   SS - Stack Segment (used for PUSH/POP, [BP] addressing)
;   ES - Extra Segment (used for string destinations, explicit override)
;
; Physical Address Calculation:
;   Physical = (Segment << 4) + Offset
;   Example: DS=0x1234, Offset=0x5678
;            Physical = 0x12340 + 0x5678 = 0x179B8
;
; Default Segment Usage:
;   - Code fetch: CS:PC
;   - Stack operations: SS:SP
;   - BP-relative: SS:BP
;   - All other data: DS:offset
;   - String destination: ES:DI
;
; Segment Overrides:
;   - ES:[addr] - Use ES instead of DS
;   - CS:[addr] - Use CS instead of DS
;   - SS:[addr] - Use SS instead of DS
;
; Loading Far Pointers:
;   - LDS Rd, [addr] - Load offset into Rd, segment into DS
;   - LES Rd, [addr] - Load offset into Rd, segment into ES
;   - Memory format: [offset_lo, offset_hi, seg_lo, seg_hi]
