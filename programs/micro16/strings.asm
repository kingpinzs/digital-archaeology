; strings.asm - Test string operations for Micro16
; Tests: MOVSB, MOVSW (move string)
; Tests: CMPSB, CMPSW (compare string)
; Tests: STOSB, STOSW (store string)
; Tests: LODSB, LODSW (load string)
; Tests: REP, REPZ, REPNZ prefixes
;
; Micro16 Architecture Test Program
; - String operations use SI (source) and DI (destination)
; - Direction flag (D): 0=increment, 1=decrement
; - REP prefix repeats CX times

        .org 0x0100             ; Default PC start location

START:
        ; Initialize for string operations
        CLD                     ; Clear direction flag (auto-increment)

        ; ===== Test 1: MOVSB - Move single byte =====
        MOV SI, #SRC_BYTE       ; Source address
        MOV DI, #DST_BYTE       ; Destination address
        MOVSB                   ; Move byte [SI] -> [DI], inc SI, inc DI
        LDB AX, [DST_BYTE]      ; Load result
        ST AX, [RESULT1]        ; Store: should be 0x00AA

        ; ===== Test 2: MOVSW - Move single word =====
        MOV SI, #SRC_WORD       ; Source address
        MOV DI, #DST_WORD       ; Destination address
        MOVSW                   ; Move word [SI] -> [DI], SI+=2, DI+=2
        LD AX, [DST_WORD]       ; Load result
        ST AX, [RESULT2]        ; Store: should be 0x1234

        ; ===== Test 3: REP MOVSB - Move byte string =====
        MOV SI, #SRC_STRING     ; Source string
        MOV DI, #DST_STRING     ; Destination buffer
        MOV CX, #5              ; Count = 5 bytes
        REP MOVSB               ; Repeat move CX times

        ; Verify first and last bytes copied
        LDB AX, [DST_STRING]    ; First byte
        ST AX, [RESULT3A]       ; Store: should be 0x0048 ('H')
        LDB AX, [DST_STRING+4]  ; Last byte
        ST AX, [RESULT3B]       ; Store: should be 0x006F ('o')

        ; ===== Test 4: REP MOVSW - Move word string =====
        MOV SI, #SRC_WORDS      ; Source word array
        MOV DI, #DST_WORDS      ; Destination buffer
        MOV CX, #4              ; Count = 4 words
        REP MOVSW               ; Repeat move CX times

        ; Verify words copied
        LD AX, [DST_WORDS]      ; First word
        ST AX, [RESULT4A]       ; Store: should be 0x1111
        LD AX, [DST_WORDS+6]    ; Last word
        ST AX, [RESULT4B]       ; Store: should be 0x4444

        ; ===== Test 5: STOSB - Store byte =====
        MOV DI, #FILL_BYTE      ; Destination
        MOV AX, #0x00FF         ; Value (low byte used)
        STOSB                   ; Store AL at [DI], inc DI
        LDB BX, [FILL_BYTE]     ; Load back
        ST BX, [RESULT5]        ; Store: should be 0x00FF

        ; ===== Test 6: STOSW - Store word =====
        MOV DI, #FILL_WORD      ; Destination
        MOV AX, #0xBEEF         ; Value
        STOSW                   ; Store AX at [DI], DI+=2
        LD BX, [FILL_WORD]      ; Load back
        ST BX, [RESULT6]        ; Store: should be 0xBEEF

        ; ===== Test 7: REP STOSB - Fill memory with byte =====
        MOV DI, #FILL_BUFFER    ; Destination
        MOV AX, #0x00AA         ; Fill value
        MOV CX, #8              ; Count
        REP STOSB               ; Fill 8 bytes with 0xAA

        ; Verify fill
        LDB AX, [FILL_BUFFER]   ; First byte
        ST AX, [RESULT7A]       ; Store: 0x00AA
        LDB AX, [FILL_BUFFER+7] ; Last byte
        ST AX, [RESULT7B]       ; Store: 0x00AA

        ; ===== Test 8: REP STOSW - Fill memory with word =====
        MOV DI, #FILL_WORDS     ; Destination
        MOV AX, #0xDEAD         ; Fill value
        MOV CX, #4              ; Count = 4 words
        REP STOSW               ; Fill 4 words with 0xDEAD

        ; Verify fill
        LD AX, [FILL_WORDS]     ; First word
        ST AX, [RESULT8A]       ; Store: 0xDEAD
        LD AX, [FILL_WORDS+6]   ; Last word
        ST AX, [RESULT8B]       ; Store: 0xDEAD

        ; ===== Test 9: LODSB - Load byte =====
        MOV SI, #LOAD_SRC       ; Source
        LODSB                   ; Load byte at [SI] into AL, inc SI
        ST AX, [RESULT9]        ; Store: should be 0x0055

        ; ===== Test 10: LODSW - Load word =====
        MOV SI, #LOAD_SRC_W     ; Source
        LODSW                   ; Load word at [SI] into AX, SI+=2
        ST AX, [RESULT10]       ; Store: should be 0x1234

        ; ===== Test 11: CMPSB - Compare bytes =====
        MOV SI, #CMP_STR1       ; First string
        MOV DI, #CMP_STR2       ; Second string (same)
        CMPSB                   ; Compare [SI] vs [DI]
        JZ CMP11_EQUAL
        MOV AX, #0xFFFF         ; Not equal
        JMP CMP11_DONE
CMP11_EQUAL:
        MOV AX, #0x0001         ; Equal
CMP11_DONE:
        ST AX, [RESULT11]       ; Store: 0x0001 (bytes equal)

        ; ===== Test 12: CMPSW - Compare words =====
        MOV SI, #CMP_WORD1      ; First word
        MOV DI, #CMP_WORD2      ; Second word (same)
        CMPSW                   ; Compare [SI] vs [DI]
        JZ CMP12_EQUAL
        MOV AX, #0xFFFF
        JMP CMP12_DONE
CMP12_EQUAL:
        MOV AX, #0x0002
CMP12_DONE:
        ST AX, [RESULT12]       ; Store: 0x0002 (words equal)

        ; ===== Test 13: REPZ CMPSB - Compare strings until different =====
        MOV SI, #STR_MATCH1     ; "HELLO"
        MOV DI, #STR_MATCH2     ; "HELLO"
        MOV CX, #5              ; Length
        REPZ CMPSB              ; Compare while equal (Z=1)
        ; If strings match, CX = 0 and Z = 1
        JNZ CMP13_DIFF
        CMP CX, #0
        JNZ CMP13_DIFF
        MOV AX, #0x0003         ; Strings match
        JMP CMP13_DONE
CMP13_DIFF:
        MOV AX, #0xFFFF
CMP13_DONE:
        ST AX, [RESULT13]       ; Store: 0x0003 (match)

        ; ===== Test 14: REPZ CMPSB - Find first difference =====
        MOV SI, #STR_DIFF1      ; "HELLO"
        MOV DI, #STR_DIFF2      ; "HELXO" (differs at position 3)
        MOV CX, #5              ; Length
        REPZ CMPSB              ; Compare while equal
        ; CX will be 2 (stopped at position 3, decremented before check)
        ; SI points to position after mismatch
        MOV AX, CX
        ST AX, [RESULT14]       ; Store: CX value (indicates where diff found)

        ; ===== Test 15: REPNZ SCASB - Search for byte =====
        ; SCASB compares AL with [DI]
        ; Note: Using manual search since REPNZ SCASB needs to be on same line
        ; REPNZ SCASB would search for AL in string at [DI], decrementing CX
        ; Manual search implementation below:
        MOV DI, #SEARCH_STR
        MOV CX, #6
SEARCH_LOOP:
        LDB BX, [DI+0]          ; Load byte
        CMP BX, #0x0044         ; Compare with 'D'
        JZ FOUND_IT
        INC DI
        DEC CX
        JNZ SEARCH_LOOP
        MOV AX, #0xFFFF         ; Not found
        JMP SEARCH_DONE
FOUND_IT:
        ; DI points to 'D'
        MOV AX, DI
        SUB AX, #SEARCH_STR     ; Offset = position
        ; Position should be 3 (0-indexed)
SEARCH_DONE:
        ST AX, [RESULT15]       ; Store: 0x0003 (position of 'D')

        ; ===== Test 16: String with direction flag set (decrement) =====
        STD                     ; Set direction flag (decrement)
        MOV SI, #REV_SRC+4      ; Point to last byte of source
        MOV DI, #REV_DST+4      ; Point to last byte of destination
        MOV CX, #5
REV_COPY:
        MOVSB                   ; Copy byte, decrement SI and DI
        DEC CX
        JNZ REV_COPY

        CLD                     ; Clear direction flag back to normal

        ; Verify reverse copy worked
        LDB AX, [REV_DST]       ; First byte
        ST AX, [RESULT16A]      ; Store: should match REV_SRC[0]
        LDB AX, [REV_DST+4]     ; Last byte
        ST AX, [RESULT16B]      ; Store: should match REV_SRC[4]

        ; ===== Final verification =====
        MOV AX, #0xCAFE
        ST AX, [FINAL_RESULT]

        HLT                     ; Stop execution

; Data section - Source data
        .org 0x0500

; Single byte/word sources
SRC_BYTE:     .db 0xAA
SRC_WORD:     .dw 0x1234

; String source
SRC_STRING:   .db 'H', 'e', 'l', 'l', 'o'  ; "Hello"

; Word array source
SRC_WORDS:    .dw 0x1111, 0x2222, 0x3333, 0x4444

; Load test sources
LOAD_SRC:     .db 0x55
LOAD_SRC_W:   .dw 0x1234

; Compare test strings
CMP_STR1:     .db 0x41          ; 'A'
CMP_STR2:     .db 0x41          ; 'A'

CMP_WORD1:    .dw 0x5678
CMP_WORD2:    .dw 0x5678

STR_MATCH1:   .db 'H', 'E', 'L', 'L', 'O'
STR_MATCH2:   .db 'H', 'E', 'L', 'L', 'O'

STR_DIFF1:    .db 'H', 'E', 'L', 'L', 'O'
STR_DIFF2:    .db 'H', 'E', 'L', 'X', 'O'  ; Differs at position 3

; Search test string
SEARCH_STR:   .db 'A', 'B', 'C', 'D', 'E', 'F'

; Reverse copy source
REV_SRC:      .db 0x11, 0x22, 0x33, 0x44, 0x55

; Destination buffers
        .org 0x0600

DST_BYTE:     .db 0
DST_WORD:     .dw 0
DST_STRING:   .db 0, 0, 0, 0, 0
DST_WORDS:    .dw 0, 0, 0, 0

FILL_BYTE:    .db 0
FILL_WORD:    .dw 0
FILL_BUFFER:  .db 0, 0, 0, 0, 0, 0, 0, 0
FILL_WORDS:   .dw 0, 0, 0, 0

REV_DST:      .db 0, 0, 0, 0, 0

; Results section
        .org 0x0700

RESULT1:      .dw 0             ; Expected: 0x00AA (MOVSB)
RESULT2:      .dw 0             ; Expected: 0x1234 (MOVSW)

RESULT3A:     .dw 0             ; Expected: 0x0048 ('H')
RESULT3B:     .dw 0             ; Expected: 0x006F ('o')

RESULT4A:     .dw 0             ; Expected: 0x1111
RESULT4B:     .dw 0             ; Expected: 0x4444

RESULT5:      .dw 0             ; Expected: 0x00FF (STOSB)
RESULT6:      .dw 0             ; Expected: 0xBEEF (STOSW)

RESULT7A:     .dw 0             ; Expected: 0x00AA (fill byte)
RESULT7B:     .dw 0             ; Expected: 0x00AA (fill byte)

RESULT8A:     .dw 0             ; Expected: 0xDEAD (fill word)
RESULT8B:     .dw 0             ; Expected: 0xDEAD (fill word)

RESULT9:      .dw 0             ; Expected: 0x0055 (LODSB)
RESULT10:     .dw 0             ; Expected: 0x1234 (LODSW)

RESULT11:     .dw 0             ; Expected: 0x0001 (CMPSB equal)
RESULT12:     .dw 0             ; Expected: 0x0002 (CMPSW equal)
RESULT13:     .dw 0             ; Expected: 0x0003 (strings match)
RESULT14:     .dw 0             ; Expected: CX at mismatch

RESULT15:     .dw 0             ; Expected: 0x0003 (position of 'D')

RESULT16A:    .dw 0             ; Expected: 0x0011 (REV_SRC[0])
RESULT16B:    .dw 0             ; Expected: 0x0055 (REV_SRC[4])

FINAL_RESULT: .dw 0             ; Expected: 0xCAFE (success)

; String instruction summary:
;
; Move:
;   MOVSB - Move byte [DS:SI] to [ES:DI], adjust SI/DI
;   MOVSW - Move word [DS:SI] to [ES:DI], adjust SI/DI by 2
;
; Store:
;   STOSB - Store AL at [ES:DI], adjust DI
;   STOSW - Store AX at [ES:DI], adjust DI by 2
;
; Load:
;   LODSB - Load [DS:SI] into AL, adjust SI
;   LODSW - Load [DS:SI] into AX, adjust SI by 2
;
; Compare:
;   CMPSB - Compare [DS:SI] with [ES:DI], adjust SI/DI
;   CMPSW - Compare words, adjust by 2
;   SCASB - Compare AL with [ES:DI], adjust DI
;   SCASW - Compare AX with [ES:DI], adjust DI by 2
;
; Repeat prefixes:
;   REP   - Repeat CX times (for MOVS, STOS)
;   REPZ  - Repeat while Z=1 (for CMPS, SCAS - find difference)
;   REPNZ - Repeat while Z=0 (for CMPS, SCAS - find match)
;
; Direction flag:
;   CLD - Clear D, SI/DI increment
;   STD - Set D, SI/DI decrement
