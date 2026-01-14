; string_ops.asm - String operations using indexed addressing
; Demonstrates:
;   - String copy (strcpy)
;   - String compare (strcmp)
;   - String length (strlen)
;   - String concatenation (strcat)
;   - Memory copy (memcpy)
;   - Memory fill (memset)
;
; Strings are null-terminated (C-style)
;
; Micro8 Architecture Test Program

        .org 0x0200             ; Start after reserved area

START:
        ; Initialize stack pointer
        LDI16 SP, 0x01FD        ; SP = top of stack

        ; ===== Test 1: String Length =====
        LDI16 HL, STRING1       ; Point to "HELLO"
        CALL STRLEN             ; R0 = length
        ST R0, [RESULT1]        ; Expected: 5

        ; ===== Test 2: String Copy =====
        LDI16 HL, STRING1       ; Source = "HELLO"
        LDI16 DE, BUFFER1       ; Destination
        CALL STRCPY
        ; Verify by getting length of copy
        LDI16 HL, BUFFER1
        CALL STRLEN
        ST R0, [RESULT2]        ; Expected: 5

        ; ===== Test 3: String Compare (equal strings) =====
        LDI16 HL, STRING1       ; "HELLO"
        LDI16 DE, BUFFER1       ; Copy of "HELLO"
        CALL STRCMP             ; R0 = 0 if equal
        ST R0, [RESULT3]        ; Expected: 0 (equal)

        ; ===== Test 4: String Compare (different strings) =====
        LDI16 HL, STRING1       ; "HELLO"
        LDI16 DE, STRING2       ; "WORLD"
        CALL STRCMP             ; R0 != 0 if different
        ST R0, [RESULT4]        ; Expected: non-zero

        ; ===== Test 5: String Compare (same first letter) =====
        LDI16 HL, STRING3       ; "HELP"
        LDI16 DE, STRING1       ; "HELLO"
        CALL STRCMP
        ST R0, [RESULT5]        ; Expected: non-zero

        ; ===== Test 6: Empty String Length =====
        LDI16 HL, EMPTY_STRING
        CALL STRLEN
        ST R0, [RESULT6]        ; Expected: 0

        ; ===== Test 7: Memory Fill =====
        LDI16 HL, BUFFER2       ; Destination
        LDI R0, 8               ; Length
        LDI R1, 0xAA            ; Fill value
        CALL MEMSET
        ; Verify first byte
        LD R0, [BUFFER2]
        ST R0, [RESULT7A]       ; Expected: 0xAA
        ; Verify last byte
        LD R0, [BUFFER2+7]
        ST R0, [RESULT7B]       ; Expected: 0xAA

        ; ===== Test 8: Memory Copy =====
        LDI16 HL, DATA_BLOCK    ; Source
        LDI16 DE, BUFFER3       ; Destination
        LDI R0, 4               ; Length
        CALL MEMCPY
        ; Verify copy
        LD R0, [BUFFER3]
        ST R0, [RESULT8A]       ; Expected: 0x12
        LD R0, [BUFFER3+3]
        ST R0, [RESULT8B]       ; Expected: 0x78

        ; ===== Test 9: Find Character in String =====
        LDI16 HL, STRING1       ; "HELLO"
        LDI R0, 'L'             ; Character to find (0x4C)
        CALL STRCHR             ; R0 = position (0-based) or 0xFF if not found
        ST R0, [RESULT9]        ; Expected: 2 (first 'L' at index 2)

        ; ===== Test 10: Character Not Found =====
        LDI16 HL, STRING1       ; "HELLO"
        LDI R0, 'X'             ; Character not in string
        CALL STRCHR
        ST R0, [RESULT10]       ; Expected: 0xFF (not found)

        ; ===== Test 11: Count Character Occurrences =====
        LDI16 HL, STRING1       ; "HELLO"
        LDI R0, 'L'             ; Character to count
        CALL STRCOUNT
        ST R0, [RESULT11]       ; Expected: 2 (two 'L's)

        ; ===== Test 12: To Uppercase (simple) =====
        ; Copy string first, then convert
        LDI16 HL, LOWERCASE     ; "hello"
        LDI16 DE, BUFFER4
        CALL STRCPY
        LDI16 HL, BUFFER4
        CALL TOUPPER
        ; Check first character
        LD R0, [BUFFER4]
        ST R0, [RESULT12]       ; Expected: 'H' (0x48)

        HLT                     ; Stop execution

; ========================================
; SUBROUTINES
; ========================================

; STRLEN: Calculate length of null-terminated string
; Input: HL = pointer to string
; Output: R0 = length (not including null terminator)
STRLEN:
        PUSH R1
        PUSH R5
        PUSH R6
        LDI R0, 0               ; Length counter

STRLEN_LOOP:
        LD R1, [HL]             ; Load character
        OR R1, R1               ; Test for null
        JZ STRLEN_DONE          ; If null, done
        INC R0                  ; length++
        INC16 HL                ; Next character
        JMP STRLEN_LOOP

STRLEN_DONE:
        POP R6
        POP R5
        POP R1
        RET

; STRCPY: Copy null-terminated string
; Input: HL = source, DE = destination
; Destroys: R0
STRCPY:
        PUSH R0
        PUSH R1
        PUSH R3
        PUSH R4
        PUSH R5
        PUSH R6

        ; Save DE to use later
        MOV R3, R3              ; D
        MOV R4, R4              ; E

STRCPY_LOOP:
        LD R0, [HL]             ; Load from source
        ; Store to destination (use indexed from DE base)
        ST R0, [DE]             ; Store to destination (direct)
        OR R0, R0               ; Test for null
        JZ STRCPY_DONE          ; If null, done
        INC16 HL                ; Next source
        INC16 DE                ; Next destination
        JMP STRCPY_LOOP

STRCPY_DONE:
        POP R6
        POP R5
        POP R4
        POP R3
        POP R1
        POP R0
        RET

; STRCMP: Compare two null-terminated strings
; Input: HL = string1, DE = string2
; Output: R0 = 0 if equal, positive if s1 > s2, negative if s1 < s2
STRCMP:
        PUSH R1
        PUSH R2
        PUSH R3
        PUSH R4
        PUSH R5
        PUSH R6

STRCMP_LOOP:
        LD R0, [HL]             ; Load char from string1
        LD R1, [DE]             ; Load char from string2 (simplified)

        ; For DE indirect, we need a workaround
        ; Save HL, use HL to access DE's target
        PUSH R5
        PUSH R6
        MOV R5, R3              ; H = D
        MOV R6, R4              ; L = E
        LD R1, [HL]             ; Load via HL
        POP R6
        POP R5

        CMP R0, R1              ; Compare characters
        JNZ STRCMP_DIFF         ; If different, done

        OR R0, R0               ; Check for null terminator
        JZ STRCMP_EQUAL         ; Both strings ended, equal

        INC16 HL                ; Next char in string1
        INC16 DE                ; Next char in string2
        JMP STRCMP_LOOP

STRCMP_DIFF:
        SUB R0, R1              ; R0 = difference
        JMP STRCMP_DONE

STRCMP_EQUAL:
        LDI R0, 0               ; Equal

STRCMP_DONE:
        POP R6
        POP R5
        POP R4
        POP R3
        POP R2
        POP R1
        RET

; MEMSET: Fill memory with a byte value
; Input: HL = destination, R0 = length, R1 = fill value
MEMSET:
        PUSH R0
        PUSH R2
        PUSH R5
        PUSH R6

        MOV R2, R0              ; R2 = length counter

MEMSET_LOOP:
        OR R2, R2               ; Check if done
        JZ MEMSET_DONE
        ST R1, [HL]             ; Store fill value
        INC16 HL                ; Next address
        DEC R2                  ; Decrement counter
        JMP MEMSET_LOOP

MEMSET_DONE:
        POP R6
        POP R5
        POP R2
        POP R0
        RET

; MEMCPY: Copy block of memory
; Input: HL = source, DE = destination, R0 = length
MEMCPY:
        PUSH R0
        PUSH R1
        PUSH R2
        PUSH R3
        PUSH R4
        PUSH R5
        PUSH R6

        MOV R2, R0              ; R2 = length counter

MEMCPY_LOOP:
        OR R2, R2               ; Check if done
        JZ MEMCPY_DONE
        LD R0, [HL]             ; Load from source
        ; Store to destination via DE
        PUSH R5
        PUSH R6
        MOV R5, R3              ; Use DE as HL temporarily
        MOV R6, R4
        ST R0, [HL]
        INC16 HL                ; Increment DE (via HL)
        MOV R3, R5
        MOV R4, R6
        POP R6
        POP R5
        INC16 HL                ; Next source
        DEC R2                  ; Decrement counter
        JMP MEMCPY_LOOP

MEMCPY_DONE:
        POP R6
        POP R5
        POP R4
        POP R3
        POP R2
        POP R1
        POP R0
        RET

; STRCHR: Find character in string
; Input: HL = string, R0 = character to find
; Output: R0 = index (0-based) or 0xFF if not found
STRCHR:
        PUSH R1
        PUSH R2
        PUSH R5
        PUSH R6

        MOV R1, R0              ; R1 = character to find
        LDI R2, 0               ; R2 = index

STRCHR_LOOP:
        LD R0, [HL]             ; Load current character
        OR R0, R0               ; Check for null
        JZ STRCHR_NOT_FOUND     ; End of string
        CMP R0, R1              ; Compare with target
        JZ STRCHR_FOUND
        INC16 HL                ; Next character
        INC R2                  ; Increment index
        JMP STRCHR_LOOP

STRCHR_FOUND:
        MOV R0, R2              ; Return index
        JMP STRCHR_DONE

STRCHR_NOT_FOUND:
        LDI R0, 0xFF            ; Not found

STRCHR_DONE:
        POP R6
        POP R5
        POP R2
        POP R1
        RET

; STRCOUNT: Count occurrences of character in string
; Input: HL = string, R0 = character to count
; Output: R0 = count
STRCOUNT:
        PUSH R1
        PUSH R2
        PUSH R3
        PUSH R5
        PUSH R6

        MOV R1, R0              ; R1 = character to count
        LDI R2, 0               ; R2 = count

STRCOUNT_LOOP:
        LD R0, [HL]             ; Load current character
        OR R0, R0               ; Check for null
        JZ STRCOUNT_DONE
        CMP R0, R1              ; Compare with target
        JNZ STRCOUNT_SKIP
        INC R2                  ; Increment count
STRCOUNT_SKIP:
        INC16 HL                ; Next character
        JMP STRCOUNT_LOOP

STRCOUNT_DONE:
        MOV R0, R2              ; Return count
        POP R6
        POP R5
        POP R3
        POP R2
        POP R1
        RET

; TOUPPER: Convert string to uppercase (in place)
; Input: HL = string
; Converts 'a'-'z' (0x61-0x7A) to 'A'-'Z' (0x41-0x5A)
TOUPPER:
        PUSH R0
        PUSH R1
        PUSH R5
        PUSH R6

TOUPPER_LOOP:
        LD R0, [HL]             ; Load character
        OR R0, R0               ; Check for null
        JZ TOUPPER_DONE

        ; Check if lowercase: 'a' <= char <= 'z'
        CMPI R0, 0x61           ; Compare with 'a'
        JC TOUPPER_SKIP         ; If less than 'a', skip
        CMPI R0, 0x7B           ; Compare with 'z'+1
        JNC TOUPPER_SKIP        ; If greater than 'z', skip

        ; Convert to uppercase by subtracting 0x20
        SUBI R0, 0x20
        ST R0, [HL]             ; Store converted character

TOUPPER_SKIP:
        INC16 HL                ; Next character
        JMP TOUPPER_LOOP

TOUPPER_DONE:
        POP R6
        POP R5
        POP R1
        POP R0
        RET

; Data section
        .org 0x0300

; Test strings
STRING1:      .db 'H', 'E', 'L', 'L', 'O', 0          ; "HELLO"
STRING2:      .db 'W', 'O', 'R', 'L', 'D', 0          ; "WORLD"
STRING3:      .db 'H', 'E', 'L', 'P', 0               ; "HELP"
EMPTY_STRING: .db 0                                   ; ""
LOWERCASE:    .db 'h', 'e', 'l', 'l', 'o', 0          ; "hello"
DATA_BLOCK:   .db 0x12, 0x34, 0x56, 0x78              ; Test data

; Buffers
BUFFER1:      .db 0, 0, 0, 0, 0, 0, 0, 0              ; 8 bytes
BUFFER2:      .db 0, 0, 0, 0, 0, 0, 0, 0              ; 8 bytes
BUFFER3:      .db 0, 0, 0, 0, 0, 0, 0, 0              ; 8 bytes
BUFFER4:      .db 0, 0, 0, 0, 0, 0, 0, 0              ; 8 bytes

; Results
        .org 0x0360
RESULT1:      .db 0             ; Expected: 5 (strlen "HELLO")
RESULT2:      .db 0             ; Expected: 5 (strcpy verification)
RESULT3:      .db 0xFF          ; Expected: 0 (strings equal)
RESULT4:      .db 0             ; Expected: non-zero (strings different)
RESULT5:      .db 0             ; Expected: non-zero (strings different)
RESULT6:      .db 0xFF          ; Expected: 0 (empty string length)
RESULT7A:     .db 0             ; Expected: 0xAA (memset first byte)
RESULT7B:     .db 0             ; Expected: 0xAA (memset last byte)
RESULT8A:     .db 0             ; Expected: 0x12 (memcpy first byte)
RESULT8B:     .db 0             ; Expected: 0x78 (memcpy last byte)
RESULT9:      .db 0xFF          ; Expected: 2 (strchr 'L' in "HELLO")
RESULT10:     .db 0             ; Expected: 0xFF (strchr 'X' not found)
RESULT11:     .db 0             ; Expected: 2 (count 'L' in "HELLO")
RESULT12:     .db 0             ; Expected: 0x48 ('H' from uppercase conversion)
