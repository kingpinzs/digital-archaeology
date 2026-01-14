# Micro8: An 8-bit CPU Architecture

## Design Philosophy

**GOAL:** Evolve from Micro4's minimal design to a practical 8-bit CPU. Every new feature exists to solve a real limitation from the previous stage.

### Why These Changes?

| Micro4 Limitation | Micro8 Solution |
|-------------------|-----------------|
| 4-bit data = tiny numbers (0-15) | 8-bit data = useful range (0-255) |
| 256 nibbles = 128 bytes memory | 64KB address space |
| 1 accumulator = constant shuffling | 8 general-purpose registers |
| 4-level hardware stack = shallow | Memory-based stack = unlimited depth |
| No flags = can't detect overflow | Full flags register (Z, C, S, O) |
| No subroutines = code duplication | CALL/RET with proper stack |
| No interrupts = can't respond to events | Single interrupt level |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         MICRO8 CPU                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    REGISTER FILE                         │   │
│   │  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐     │   │
│   │  │ R0  │ R1  │ R2  │ R3  │ R4  │ R5  │ R6  │ R7  │     │   │
│   │  │(A)  │(B)  │(C)  │(D)  │(E)  │(H)  │(L)  │     │     │   │
│   │  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘     │   │
│   │          8 x 8-bit General Purpose Registers             │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│   ┌──────────────┐   ┌──────┴──────┐   ┌──────────────────┐    │
│   │      PC      │   │     ALU     │   │      FLAGS       │    │
│   │   (16-bit)   │   │   (8-bit)   │   │   [Z][C][S][O]   │    │
│   └──────────────┘   └─────────────┘   └──────────────────┘    │
│                                                                  │
│   ┌──────────────┐   ┌─────────────┐   ┌──────────────────┐    │
│   │      SP      │   │     IR      │   │  Interrupt Logic │    │
│   │   (16-bit)   │   │  (8-24 bit) │   │     [IE][IF]     │    │
│   └──────────────┘   └─────────────┘   └──────────────────┘    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                       16-bit Address Bus                         │
│                        8-bit Data Bus                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Registers

### General Purpose Registers (8 x 8-bit)

```
Register  Alias   Common Use                    Encoding
────────  ─────   ──────────────────────────    ────────
R0        A       Accumulator (primary math)    000
R1        B       Counter, secondary math       001
R2        C       Counter for loops             010
R3        D       Data register                 011
R4        E       Extended accumulator          100
R5        H       High byte of address          101
R6        L       Low byte of address           110
R7        -       General purpose               111
```

**Register Pairs (16-bit operations):**

```
Pair   Registers   Typical Use
────   ─────────   ─────────────────────────
BC     R1:R2       Counter, memory operations
DE     R3:R4       Data pointer, destination
HL     R5:R6       Memory pointer, source
```

The HL pair is special: it can be used for indirect memory addressing.

### Special Registers

```
┌────────────────────────────────────────────────────────────────┐
│  PC  [15:0]   Program Counter - Next instruction address       │
│  SP  [15:0]   Stack Pointer - Top of stack in memory          │
│  F   [7:0]    Flags Register (only 4 bits used)               │
│  IE  [0]      Interrupt Enable flag                           │
└────────────────────────────────────────────────────────────────┘
```

### Flags Register (F)

```
  Bit 7   Bit 6   Bit 5   Bit 4   Bit 3   Bit 2   Bit 1   Bit 0
┌───────┬───────┬───────┬───────┬───────┬───────┬───────┬───────┐
│   S   │   Z   │   -   │   -   │   -   │   O   │   -   │   C   │
│ Sign  │ Zero  │       │       │       │ Over- │       │ Carry │
│       │       │       │       │       │ flow  │       │       │
└───────┴───────┴───────┴───────┴───────┴───────┴───────┴───────┘
```

**Flag Definitions:**

| Flag | Name | Set When |
|------|------|----------|
| Z | Zero | Result is zero |
| C | Carry | Unsigned overflow/borrow occurred |
| S | Sign | Result bit 7 is set (negative in signed math) |
| O | Overflow | Signed overflow occurred |

**Example:** `0x7F + 0x01 = 0x80`
- Z=0 (result not zero)
- C=0 (no unsigned overflow: 127 + 1 = 128, fits in 8 bits)
- S=1 (bit 7 set)
- O=1 (signed overflow: 127 + 1 = -128 in signed math)

---

## Memory Map

```
┌────────────────────────────────────────────────┐ 0xFFFF
│                                                │
│              General Purpose RAM               │
│                   (63.5 KB)                    │
│                                                │
├────────────────────────────────────────────────┤ 0x0200
│           Interrupt Vector Table               │
│               (2 bytes: address)               │
├────────────────────────────────────────────────┤ 0x01FE
│                                                │
│              Stack Area (grows down)           │
│                                                │
├────────────────────────────────────────────────┤ 0x0100
│                                                │
│           Zero Page (fast access)              │
│                                                │
├────────────────────────────────────────────────┤ 0x0000

Address Range     Size      Purpose
─────────────     ────      ───────────────────────────
0x0000-0x00FF     256B      Zero Page (direct addressing)
0x0100-0x01FD     254B      Default Stack Area
0x01FE-0x01FF     2B        Interrupt Vector
0x0200-0xFFFF     63.5KB    General Purpose RAM/ROM
```

**Zero Page:** The first 256 bytes can be accessed with a single-byte address, making instructions shorter and faster.

**Stack:** Grows downward from 0x01FD. SP is initialized to 0x01FD on reset.

**Interrupt Vector:** Address 0x01FE-0x01FF contains the 16-bit address of the interrupt handler.

---

## Instruction Formats

Micro8 uses variable-length instructions (1-3 bytes) to balance code density with flexibility.

### Format 1: Register Operations (1 byte)

```
┌───────────────┬───────────────┐
│  Opcode [7:3] │   Reg [2:0]   │
│    5 bits     │    3 bits     │
└───────────────┴───────────────┘
```

Example: `INC R3` → `00101 011` = 0x2B

### Format 2: Register-to-Register (1 byte)

```
┌───────────┬───────────┬───────────┐
│ Opcode[7:6]│  Dst[5:3] │  Src[2:0] │
│   2 bits   │  3 bits   │  3 bits   │
└───────────┴───────────┴───────────┘
```

Example: `MOV R2, R5` → `01 010 101` = 0x55

### Format 3: Immediate (2 bytes)

```
Byte 1: ┌───────────────┬───────────────┐
        │  Opcode [7:3] │   Reg [2:0]   │
        │    5 bits     │    3 bits     │
        └───────────────┴───────────────┘
Byte 2: ┌───────────────────────────────┐
        │       Immediate [7:0]         │
        │           8 bits              │
        └───────────────────────────────┘
```

Example: `LDI R0, 0x42` → 0x06 0x42

### Format 4: Direct Address (3 bytes)

```
Byte 1: ┌───────────────┬───────────────┐
        │  Opcode [7:3] │   Reg [2:0]   │
        │    5 bits     │    3 bits     │
        └───────────────┴───────────────┘
Byte 2: ┌───────────────────────────────┐
        │       Address Low [7:0]       │
        └───────────────────────────────┘
Byte 3: ┌───────────────────────────────┐
        │       Address High [7:0]      │
        └───────────────────────────────┘
```

Example: `LD R0, [0x1234]` → 0x0E 0x34 0x12 (little-endian)

### Format 5: Zero Page (2 bytes)

```
Byte 1: ┌───────────────┬───────────────┐
        │  Opcode [7:3] │   Reg [2:0]   │
        │    5 bits     │    3 bits     │
        └───────────────┴───────────────┘
Byte 2: ┌───────────────────────────────┐
        │    Zero Page Address [7:0]    │
        └───────────────────────────────┘
```

Example: `LDZ R0, [0x50]` → 0x16 0x50

### Format 6: Relative Jump (2 bytes)

```
Byte 1: ┌───────────────────────────────┐
        │         Opcode [7:0]          │
        └───────────────────────────────┘
Byte 2: ┌───────────────────────────────┐
        │    Signed Offset [7:0]        │
        │    (-128 to +127 bytes)       │
        └───────────────────────────────┘
```

Example: `JR -5` → 0xC0 0xFB

---

## Addressing Modes

| Mode | Syntax | Description | Example |
|------|--------|-------------|---------|
| Implicit | `NOP` | Operand implied by opcode | `NOP` |
| Register | `Rn` | Operand in register | `INC R0` |
| Immediate | `#n` | Operand in instruction | `LDI R0, #0x42` |
| Direct | `[addr]` | Operand at memory address | `LD R0, [0x1234]` |
| Zero Page | `[zp]` | Direct within page 0 | `LDZ R0, [0x50]` |
| Indirect | `[HL]` | Address in HL register pair | `LD R0, [HL]` |
| Indexed | `[HL+d]` | HL plus signed offset | `LD R0, [HL+5]` |
| Relative | `label` | PC plus signed offset | `JR loop` |

---

## Complete Instruction Set

### Instruction Set Summary (~80 instructions)

| Category | Count | Description |
|----------|-------|-------------|
| Data Movement | 18 | MOV, LD, ST, PUSH, POP, etc. |
| Arithmetic | 16 | ADD, SUB, INC, DEC, CMP, etc. |
| Logic | 12 | AND, OR, XOR, NOT, shifts |
| Control Flow | 18 | JMP, JR, CALL, RET, branches |
| Stack Operations | 6 | PUSH, POP, stack manipulation |
| System | 10 | NOP, HLT, EI, DI, etc. |
| **Total** | **80** | |

---

### Data Movement Instructions

| Opcode | Mnemonic | Operation | Bytes | Cycles | Flags |
|--------|----------|-----------|-------|--------|-------|
| 0x00 | `NOP` | No operation | 1 | 1 | - |
| 0x01 | `HLT` | Halt CPU | 1 | 1 | - |
| 0x02-0x09 | `MOV Rd, Rs` | Rd ← Rs | 1 | 1 | - |
| 0x06-0x0D | `LDI Rd, #imm` | Rd ← imm8 | 2 | 2 | - |
| 0x0E-0x15 | `LD Rd, [addr]` | Rd ← mem[addr] | 3 | 4 | - |
| 0x16-0x1D | `LDZ Rd, [zp]` | Rd ← mem[0x00:zp] | 2 | 3 | - |
| 0x1E-0x25 | `ST Rd, [addr]` | mem[addr] ← Rd | 3 | 4 | - |
| 0x26-0x2D | `STZ Rd, [zp]` | mem[0x00:zp] ← Rd | 2 | 3 | - |
| 0x2E | `LD Rd, [HL]` | Rd ← mem[HL] | 1 | 2 | - |
| 0x2F | `ST Rd, [HL]` | mem[HL] ← Rd | 1 | 2 | - |
| 0x30 | `LD Rd, [HL+d]` | Rd ← mem[HL+d] | 2 | 3 | - |
| 0x31 | `ST Rd, [HL+d]` | mem[HL+d] ← Rd | 2 | 3 | - |
| 0x32 | `LDI16 HL, #imm16` | HL ← imm16 | 3 | 3 | - |
| 0x33 | `LDI16 BC, #imm16` | BC ← imm16 | 3 | 3 | - |
| 0x34 | `LDI16 DE, #imm16` | DE ← imm16 | 3 | 3 | - |
| 0x35 | `LDI16 SP, #imm16` | SP ← imm16 | 3 | 3 | - |
| 0x36 | `MOV16 HL, SP` | HL ← SP | 1 | 1 | - |
| 0x37 | `MOV16 SP, HL` | SP ← HL | 1 | 1 | - |

---

### Arithmetic Instructions

| Opcode | Mnemonic | Operation | Bytes | Cycles | Flags |
|--------|----------|-----------|-------|--------|-------|
| 0x40-0x47 | `ADD Rd, Rs` | Rd ← Rd + Rs | 1 | 1 | Z,C,S,O |
| 0x48-0x4F | `ADC Rd, Rs` | Rd ← Rd + Rs + C | 1 | 1 | Z,C,S,O |
| 0x50-0x57 | `SUB Rd, Rs` | Rd ← Rd - Rs | 1 | 1 | Z,C,S,O |
| 0x58-0x5F | `SBC Rd, Rs` | Rd ← Rd - Rs - C | 1 | 1 | Z,C,S,O |
| 0x60-0x67 | `ADDI Rd, #imm` | Rd ← Rd + imm | 2 | 2 | Z,C,S,O |
| 0x68-0x6F | `SUBI Rd, #imm` | Rd ← Rd - imm | 2 | 2 | Z,C,S,O |
| 0x70-0x77 | `INC Rd` | Rd ← Rd + 1 | 1 | 1 | Z,S,O |
| 0x78-0x7F | `DEC Rd` | Rd ← Rd - 1 | 1 | 1 | Z,S,O |
| 0x80-0x87 | `CMP Rd, Rs` | Rd - Rs (flags only) | 1 | 1 | Z,C,S,O |
| 0x88-0x8F | `CMPI Rd, #imm` | Rd - imm (flags only) | 2 | 2 | Z,C,S,O |
| 0x90 | `INC16 HL` | HL ← HL + 1 | 1 | 1 | - |
| 0x91 | `DEC16 HL` | HL ← HL - 1 | 1 | 1 | - |
| 0x92 | `INC16 BC` | BC ← BC + 1 | 1 | 1 | - |
| 0x93 | `DEC16 BC` | BC ← BC - 1 | 1 | 1 | - |
| 0x94 | `ADD16 HL, BC` | HL ← HL + BC | 1 | 2 | C |
| 0x95 | `ADD16 HL, DE` | HL ← HL + DE | 1 | 2 | C |
| 0x96 | `NEG Rd` | Rd ← 0 - Rd | 1 | 1 | Z,C,S,O |

---

### Logic Instructions

| Opcode | Mnemonic | Operation | Bytes | Cycles | Flags |
|--------|----------|-----------|-------|--------|-------|
| 0xA0-0xA7 | `AND Rd, Rs` | Rd ← Rd & Rs | 1 | 1 | Z,S |
| 0xA8-0xAF | `OR Rd, Rs` | Rd ← Rd \| Rs | 1 | 1 | Z,S |
| 0xB0-0xB7 | `XOR Rd, Rs` | Rd ← Rd ^ Rs | 1 | 1 | Z,S |
| 0xB8-0xBF | `NOT Rd` | Rd ← ~Rd | 1 | 1 | Z,S |
| 0x38 | `ANDI Rd, #imm` | Rd ← Rd & imm | 2 | 2 | Z,S |
| 0x39 | `ORI Rd, #imm` | Rd ← Rd \| imm | 2 | 2 | Z,S |
| 0x3A | `XORI Rd, #imm` | Rd ← Rd ^ imm | 2 | 2 | Z,S |
| 0x3B | `SHL Rd` | Rd ← Rd << 1, C ← bit7 | 1 | 1 | Z,C,S |
| 0x3C | `SHR Rd` | Rd ← Rd >> 1, C ← bit0 | 1 | 1 | Z,C |
| 0x3D | `SAR Rd` | Rd ← Rd >> 1 (signed) | 1 | 1 | Z,C,S |
| 0x3E | `ROL Rd` | Rotate left through C | 1 | 1 | Z,C,S |
| 0x3F | `ROR Rd` | Rotate right through C | 1 | 1 | Z,C |

---

### Control Flow Instructions

| Opcode | Mnemonic | Operation | Bytes | Cycles | Flags |
|--------|----------|-----------|-------|--------|-------|
| 0xC0 | `JMP addr` | PC ← addr | 3 | 3 | - |
| 0xC1 | `JR offset` | PC ← PC + offset | 2 | 2 | - |
| 0xC2 | `JZ addr` | if Z: PC ← addr | 3 | 3/2 | - |
| 0xC3 | `JNZ addr` | if !Z: PC ← addr | 3 | 3/2 | - |
| 0xC4 | `JC addr` | if C: PC ← addr | 3 | 3/2 | - |
| 0xC5 | `JNC addr` | if !C: PC ← addr | 3 | 3/2 | - |
| 0xC6 | `JS addr` | if S: PC ← addr | 3 | 3/2 | - |
| 0xC7 | `JNS addr` | if !S: PC ← addr | 3 | 3/2 | - |
| 0xC8 | `JO addr` | if O: PC ← addr | 3 | 3/2 | - |
| 0xC9 | `JNO addr` | if !O: PC ← addr | 3 | 3/2 | - |
| 0xCA | `JRZ offset` | if Z: PC ← PC + offset | 2 | 2/1 | - |
| 0xCB | `JRNZ offset` | if !Z: PC ← PC + offset | 2 | 2/1 | - |
| 0xCC | `JRC offset` | if C: PC ← PC + offset | 2 | 2/1 | - |
| 0xCD | `JRNC offset` | if !C: PC ← PC + offset | 2 | 2/1 | - |
| 0xCE | `JP HL` | PC ← HL | 1 | 1 | - |
| 0xCF | `CALL addr` | PUSH PC, PC ← addr | 3 | 5 | - |
| 0xD0 | `RET` | PC ← POP | 1 | 3 | - |
| 0xD1 | `RETI` | PC ← POP, EI | 1 | 4 | - |

---

### Stack Instructions

| Opcode | Mnemonic | Operation | Bytes | Cycles | Flags |
|--------|----------|-----------|-------|--------|-------|
| 0xD2-0xD9 | `PUSH Rd` | SP←SP-1, mem[SP]←Rd | 1 | 2 | - |
| 0xDA-0xE1 | `POP Rd` | Rd←mem[SP], SP←SP+1 | 1 | 2 | - |
| 0xE2 | `PUSH16 HL` | Push HL (H first) | 1 | 3 | - |
| 0xE3 | `POP16 HL` | Pop HL (L first) | 1 | 3 | - |
| 0xE4 | `PUSH16 BC` | Push BC | 1 | 3 | - |
| 0xE5 | `POP16 BC` | Pop BC | 1 | 3 | - |
| 0xE6 | `PUSHF` | Push Flags | 1 | 2 | - |
| 0xE7 | `POPF` | Pop Flags | 1 | 2 | All |

---

### System Instructions

| Opcode | Mnemonic | Operation | Bytes | Cycles | Flags |
|--------|----------|-----------|-------|--------|-------|
| 0x00 | `NOP` | No operation | 1 | 1 | - |
| 0x01 | `HLT` | Halt CPU | 1 | - | - |
| 0xE8 | `EI` | Enable interrupts | 1 | 1 | - |
| 0xE9 | `DI` | Disable interrupts | 1 | 1 | - |
| 0xEA | `SCF` | Set carry flag | 1 | 1 | C=1 |
| 0xEB | `CCF` | Clear carry flag | 1 | 1 | C=0 |
| 0xEC | `CMF` | Complement carry | 1 | 1 | C=!C |
| 0xED | `IN Rd, port` | Rd ← IO[port] | 2 | 3 | - |
| 0xEE | `OUT port, Rd` | IO[port] ← Rd | 2 | 3 | - |
| 0xEF | `SWAP Rd` | Swap nibbles | 1 | 1 | Z,S |

---

## Interrupt Handling

### Single-Level Interrupt System

Micro8 provides a simple but effective interrupt mechanism:

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERRUPT FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. External INT pin goes HIGH                                   │
│                          │                                       │
│                          ▼                                       │
│  2. CPU checks IE flag after current instruction                 │
│         ┌────────────────┴────────────────┐                     │
│         │                                 │                      │
│     IE = 0                            IE = 1                     │
│   (disabled)                        (enabled)                    │
│         │                                 │                      │
│         ▼                                 ▼                      │
│  Interrupt ignored              3. CPU acknowledges interrupt    │
│                                          │                       │
│                                          ▼                       │
│                                 4. DI (disable further ints)     │
│                                          │                       │
│                                          ▼                       │
│                                 5. PUSH PC (save return addr)    │
│                                          │                       │
│                                          ▼                       │
│                                 6. PC ← mem[0x01FE:0x01FF]       │
│                                          │                       │
│                                          ▼                       │
│                                 7. Execute ISR                   │
│                                          │                       │
│                                          ▼                       │
│                                 8. RETI (POP PC, EI)             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Interrupt Vector

The interrupt handler address is stored at 0x01FE-0x01FF (little-endian):

```
Address   Content          Purpose
──────    ───────          ─────────────────────
0x01FE    Low byte         ISR address bits 7:0
0x01FF    High byte        ISR address bits 15:8
```

### Interrupt Service Routine Requirements

```asm
; ISR must preserve all registers it uses!
ISR:
    PUSH R0          ; Save registers
    PUSH R1
    PUSHF            ; Save flags

    ; ... handle interrupt ...

    POPF             ; Restore flags
    POP R1           ; Restore registers
    POP R0
    RETI             ; Return and re-enable interrupts
```

### Interrupt Timing

| Event | Cycles |
|-------|--------|
| Interrupt acknowledge | 1 |
| Push PC (2 bytes) | 4 |
| Load vector | 2 |
| **Total overhead** | **7 cycles** |

---

## Instruction Encoding Details

### Register Encoding

```
Code  Register  Pair
────  ────────  ────
000   R0 (A)    -
001   R1 (B)    BC high
010   R2 (C)    BC low
011   R3 (D)    DE high
100   R4 (E)    DE low
101   R5 (H)    HL high
110   R6 (L)    HL low
111   R7        -
```

### MOV Instruction Encoding

The MOV instruction uses a compact 2-bit opcode with 6 bits for registers:

```
┌────────┬─────────┬─────────┐
│  0 1   │  Dst    │   Src   │
│ opcode │  [5:3]  │  [2:0]  │
└────────┴─────────┴─────────┘

Examples:
MOV R0, R1  →  01 000 001  →  0x41
MOV R3, R5  →  01 011 101  →  0x5D
MOV R7, R0  →  01 111 000  →  0x78
```

**Note:** `MOV Rx, Rx` is a valid NOP alternative.

---

## Execution Cycles Breakdown

### Single-Byte Instructions

```
┌─────────────────────────────────────────────────────────────────┐
│ Cycle │ Phase    │ Action                                       │
├───────┼──────────┼──────────────────────────────────────────────┤
│   1   │ Fetch    │ IR ← mem[PC], PC ← PC + 1                    │
│   2   │ Execute  │ Perform operation                            │
└───────┴──────────┴──────────────────────────────────────────────┘
```

### Two-Byte Instructions (Immediate/Zero Page)

```
┌─────────────────────────────────────────────────────────────────┐
│ Cycle │ Phase    │ Action                                       │
├───────┼──────────┼──────────────────────────────────────────────┤
│   1   │ Fetch    │ IR ← mem[PC], PC ← PC + 1                    │
│   2   │ Fetch2   │ Operand ← mem[PC], PC ← PC + 1               │
│   3   │ Execute  │ Perform operation                            │
└───────┴──────────┴──────────────────────────────────────────────┘
```

### Three-Byte Instructions (Direct Address)

```
┌─────────────────────────────────────────────────────────────────┐
│ Cycle │ Phase    │ Action                                       │
├───────┼──────────┼──────────────────────────────────────────────┤
│   1   │ Fetch    │ IR ← mem[PC], PC ← PC + 1                    │
│   2   │ Fetch2   │ AddrLo ← mem[PC], PC ← PC + 1                │
│   3   │ Fetch3   │ AddrHi ← mem[PC], PC ← PC + 1                │
│   4   │ Execute  │ Access mem[Addr], perform operation          │
└───────┴──────────┴──────────────────────────────────────────────┘
```

---

## Example Programs

### Example 1: Add Two Numbers

```asm
; Add two 8-bit numbers and store result
; Simple demonstration of basic operations

        ORG 0x0200          ; Start after reserved area

START:
        LDI R0, #25         ; R0 = 25
        LDI R1, #17         ; R1 = 17
        ADD R0, R1          ; R0 = R0 + R1 = 42
        ST R0, [RESULT]     ; Store result
        HLT                 ; Stop

RESULT: DB 0                ; Result stored here

; Machine code:
; 0200: 06 19       LDI R0, #25
; 0202: 07 11       LDI R1, #17
; 0204: 40          ADD R0, R1
; 0205: 1E 09 02    ST R0, [0x0209]
; 0208: 01          HLT
; 0209: 00          (result)
```

### Example 2: Count Down Loop

```asm
; Count from 10 down to 0
; Demonstrates loops and conditional jumps

        ORG 0x0200

START:
        LDI R0, #10         ; Counter = 10

LOOP:
        DEC R0              ; Counter--
        JRNZ LOOP           ; If not zero, continue

        HLT                 ; Done

; Machine code:
; 0200: 06 0A       LDI R0, #10
; 0202: 70          DEC R0
; 0203: CB FD       JRNZ -3 (back to 0x0202)
; 0205: 01          HLT
```

### Example 3: Sum an Array

```asm
; Sum an array of 5 bytes
; Demonstrates indirect addressing with HL

        ORG 0x0200

START:
        LDI16 HL, #ARRAY    ; HL points to array
        LDI R2, #5          ; R2 = count
        LDI R0, #0          ; R0 = sum (accumulator)

LOOP:
        LD R1, [HL]         ; R1 = current element
        ADD R0, R1          ; sum += element
        INC16 HL            ; point to next element
        DEC R2              ; count--
        JRNZ LOOP           ; continue if not done

        ST R0, [SUM]        ; store result
        HLT

ARRAY:  DB 10, 20, 30, 40, 50   ; Array to sum
SUM:    DB 0                     ; Result: should be 150

; Expected result: 10+20+30+40+50 = 150 (0x96)
```

### Example 4: Subroutine Call

```asm
; Demonstrate subroutine call and return
; Multiply R0 by 2 using a subroutine

        ORG 0x0200

START:
        LDI R0, #21         ; Value to double
        CALL DOUBLE         ; Call subroutine
        ST R0, [RESULT]     ; Store result (42)
        HLT

; Subroutine: Double the value in R0
DOUBLE:
        ADD R0, R0          ; R0 = R0 + R0
        RET                 ; Return to caller

RESULT: DB 0
```

### Example 5: 16-bit Addition

```asm
; Add two 16-bit numbers using register pairs
; Demonstrates multi-byte arithmetic

        ORG 0x0200

START:
        ; Load first 16-bit number into HL (0x1234)
        LDI16 HL, #0x1234

        ; Load second 16-bit number into BC (0x0567)
        LDI16 BC, #0x0567

        ; Add BC to HL
        ADD16 HL, BC        ; HL = 0x1234 + 0x0567 = 0x179B

        ; Store result
        ST R5, [RESULT+1]   ; Store high byte (H)
        ST R6, [RESULT]     ; Store low byte (L)

        HLT

RESULT: DW 0                ; 16-bit result

; Expected: 0x179B (6043 decimal)
```

### Example 6: Interrupt Handler

```asm
; Simple interrupt demonstration
; Main loop increments R7, ISR increments R0

        ORG 0x0200

START:
        ; Set up interrupt vector
        LDI16 HL, #ISR
        ST R6, [0x01FE]     ; Low byte of ISR address
        ST R5, [0x01FF]     ; High byte of ISR address

        ; Initialize
        LDI R0, #0          ; Interrupt counter
        LDI R7, #0          ; Main loop counter

        ; Enable interrupts
        EI

MAIN:
        INC R7              ; Increment main counter
        JMP MAIN            ; Loop forever

; Interrupt Service Routine
ISR:
        PUSH R1             ; Save R1
        PUSHF               ; Save flags

        INC R0              ; Count interrupts

        POPF                ; Restore flags
        POP R1              ; Restore R1
        RETI                ; Return from interrupt
```

---

## Hardware Interface

### I/O Ports

Micro8 supports 256 I/O ports accessed via IN and OUT instructions:

```
Port Range    Suggested Use
──────────    ─────────────────────────
0x00-0x0F     System control
0x10-0x1F     Serial/UART
0x20-0x2F     Parallel I/O
0x30-0x3F     Timer/Counter
0x40-0xFF     User defined
```

### Timing Signals

```
        ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐
CLK  ───┘  └──┘  └──┘  └──┘  └──┘  └──┘  └──

        ▼ Fetch ▼     ▼Execute▼
        ├───────┤     ├───────┤
        │ Read  │     │ Write │
        │ Opcode│     │ Result│
```

---

## Comparison: Micro4 vs Micro8

| Feature | Micro4 | Micro8 |
|---------|--------|--------|
| Data width | 4-bit | 8-bit |
| Address space | 256 nibbles | 64 KB |
| Registers | 1 accumulator | 8 general purpose |
| Stack | 4-level hardware | Memory-based (unlimited) |
| Flags | Z only | Z, C, S, O |
| Instructions | 8 | 80 |
| Addressing modes | 2 | 8 |
| Interrupts | None | 1 level |
| Subroutines | None | CALL/RET |
| Gate count (est.) | ~425 | ~2,500 |

---

## What Micro8 CANNOT Do

These limitations become homework for Micro16:

1. **No hardware multiply/divide** - Must use software routines
2. **Single interrupt level** - Can't prioritize interrupts
3. **No segment registers** - Limited to 64KB total memory
4. **No protection** - Any code can access any memory
5. **No string instructions** - Must move bytes individually
6. **No instruction prefetch** - Wait for each fetch

---

## Implementation Notes

### Estimated Complexity

```
Component                          Estimated Gates
─────────────────────────────────  ───────────────
8-bit ALU (add/sub/logic)          ~400
Register file (8 x 8-bit)          ~320
16-bit PC with incrementer         ~200
16-bit SP with inc/dec             ~200
Flags register + logic             ~50
Instruction decoder                ~300
Address calculation unit           ~200
Memory interface                   ~150
Interrupt logic                    ~100
Control state machine              ~500
─────────────────────────────────────────────────
TOTAL                              ~2,500 gates
```

### Suggested Test Programs

1. **Arithmetic test:** Verify all ALU operations and flags
2. **Memory test:** Read/write patterns to verify addressing
3. **Stack test:** Push/pop sequences to verify stack operations
4. **Subroutine test:** Nested CALLs to verify return address handling
5. **Interrupt test:** Verify ISR entry/exit and register preservation

---

## Assembly Language Reference

### Assembler Directives

| Directive | Purpose | Example |
|-----------|---------|---------|
| `ORG addr` | Set assembly address | `ORG 0x0200` |
| `DB val` | Define byte(s) | `DB 0x42, 0x00` |
| `DW val` | Define word (16-bit) | `DW 0x1234` |
| `DS n` | Define space (n bytes) | `DS 32` |
| `EQU` | Define constant | `COUNT EQU 10` |

### Common Patterns

**Clear a register:**
```asm
XOR R0, R0          ; R0 = 0 (1 byte, fast)
; or
LDI R0, #0          ; R0 = 0 (2 bytes)
```

**Test if zero:**
```asm
OR R0, R0           ; Set Z flag without changing R0
JZ IS_ZERO
```

**Negate a value:**
```asm
NEG R0              ; R0 = 0 - R0
```

**Copy register pair:**
```asm
; Copy HL to DE
MOV R3, R5          ; D = H
MOV R4, R6          ; E = L
```

---

## Appendix A: Opcode Map

```
       0    1    2    3    4    5    6    7    8    9    A    B    C    D    E    F
     ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
  0x │NOP │HLT │    │    │    │    │LDI │LDI │LDI │LDI │LDI │LDI │LDI │LDI │ LD │ LD │
     │    │    │    │    │    │    │ R0 │ R1 │ R2 │ R3 │ R4 │ R5 │ R6 │ R7 │ R0 │ R1 │
     ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
  1x │ LD │ LD │ LD │ LD │ LD │ LD │LDZ │LDZ │LDZ │LDZ │LDZ │LDZ │LDZ │LDZ │ ST │ ST │
     │ R2 │ R3 │ R4 │ R5 │ R6 │ R7 │ R0 │ R1 │ R2 │ R3 │ R4 │ R5 │ R6 │ R7 │ R0 │ R1 │
     ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
  2x │ ST │ ST │ ST │ ST │ ST │ ST │STZ │STZ │STZ │STZ │STZ │STZ │STZ │STZ │LD  │ST  │
     │ R2 │ R3 │ R4 │ R5 │ R6 │ R7 │ R0 │ R1 │ R2 │ R3 │ R4 │ R5 │ R6 │ R7 │[HL]│[HL]│
     ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
  3x │ LD │ ST │LD16│LD16│LD16│LD16│MOV │MOV │ANDI│ORI │XORI│SHL │SHR │SAR │ROL │ROR │
     │+d  │+d  │ HL │ BC │ DE │ SP │HL  │SP  │    │    │    │    │    │    │    │    │
     ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
  4x │ADD │ADD │ADD │ADD │ADD │ADD │ADD │ADD │ADC │ADC │ADC │ADC │ADC │ADC │ADC │ADC │
     │0,0 │0,1 │0,2 │0,3 │0,4 │0,5 │0,6 │0,7 │0,0 │0,1 │0,2 │0,3 │0,4 │0,5 │0,6 │0,7 │
     ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
  5x │SUB │SUB │SUB │SUB │SUB │SUB │SUB │SUB │SBC │SBC │SBC │SBC │SBC │SBC │SBC │SBC │
     │0,0 │0,1 │0,2 │0,3 │0,4 │0,5 │0,6 │0,7 │0,0 │0,1 │0,2 │0,3 │0,4 │0,5 │0,6 │0,7 │
     ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
  6x │ADDI│ADDI│ADDI│ADDI│ADDI│ADDI│ADDI│ADDI│SUBI│SUBI│SUBI│SUBI│SUBI│SUBI│SUBI│SUBI│
     │ R0 │ R1 │ R2 │ R3 │ R4 │ R5 │ R6 │ R7 │ R0 │ R1 │ R2 │ R3 │ R4 │ R5 │ R6 │ R7 │
     ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
  7x │INC │INC │INC │INC │INC │INC │INC │INC │DEC │DEC │DEC │DEC │DEC │DEC │DEC │DEC │
     │ R0 │ R1 │ R2 │ R3 │ R4 │ R5 │ R6 │ R7 │ R0 │ R1 │ R2 │ R3 │ R4 │ R5 │ R6 │ R7 │
     ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
  8x │CMP │CMP │CMP │CMP │CMP │CMP │CMP │CMP │CMPI│CMPI│CMPI│CMPI│CMPI│CMPI│CMPI│CMPI│
     │0,0 │0,1 │0,2 │0,3 │0,4 │0,5 │0,6 │0,7 │ R0 │ R1 │ R2 │ R3 │ R4 │ R5 │ R6 │ R7 │
     ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
  9x │INC │DEC │INC │DEC │ADD │ADD │NEG │    │    │    │    │    │    │    │    │    │
     │HL  │HL  │BC  │BC  │HL  │HL  │    │    │    │    │    │    │    │    │    │    │
     │    │    │    │    │BC  │DE  │    │    │    │    │    │    │    │    │    │    │
     ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
  Ax │AND │AND │AND │AND │AND │AND │AND │AND │ OR │ OR │ OR │ OR │ OR │ OR │ OR │ OR │
     │0,0 │0,1 │0,2 │0,3 │0,4 │0,5 │0,6 │0,7 │0,0 │0,1 │0,2 │0,3 │0,4 │0,5 │0,6 │0,7 │
     ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
  Bx │XOR │XOR │XOR │XOR │XOR │XOR │XOR │XOR │NOT │NOT │NOT │NOT │NOT │NOT │NOT │NOT │
     │0,0 │0,1 │0,2 │0,3 │0,4 │0,5 │0,6 │0,7 │ R0 │ R1 │ R2 │ R3 │ R4 │ R5 │ R6 │ R7 │
     ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
  Cx │JMP │ JR │ JZ │JNZ │ JC │JNC │ JS │JNS │ JO │JNO │JRZ │JRNZ│JRC │JRNC│JP  │CALL│
     │    │    │    │    │    │    │    │    │    │    │    │    │    │    │HL  │    │
     ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
  Dx │RET │RETI│PSH │PSH │PSH │PSH │PSH │PSH │PSH │PSH │POP │POP │POP │POP │POP │POP │
     │    │    │ R0 │ R1 │ R2 │ R3 │ R4 │ R5 │ R6 │ R7 │ R0 │ R1 │ R2 │ R3 │ R4 │ R5 │
     ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
  Ex │POP │POP │PSH │POP │PSH │POP │PSHF│POPF│ EI │ DI │SCF │CCF │CMF │ IN │OUT │SWAP│
     │ R6 │ R7 │HL  │HL  │BC  │BC  │    │    │    │    │    │    │    │    │    │    │
     ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
  Fx │    │    │    │    │    │    │    │    │    │    │    │    │    │    │    │    │
     │ -- │ -- │ -- │ -- │ -- │ -- │ -- │ -- │ -- │ -- │ -- │ -- │ -- │ -- │ -- │ -- │
     └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘

Note: MOV Rd,Rs instructions occupy 0x40-0x7F when bits[7:6]=01
      This overlaps with shown opcodes - actual encoding is context-dependent
      0xFx reserved for future expansion
```

---

## Appendix B: Instruction Quick Reference

```
Data Movement:
  NOP              No operation
  HLT              Halt CPU
  MOV Rd, Rs       Rd ← Rs
  LDI Rd, #imm     Rd ← immediate
  LD  Rd, [addr]   Rd ← memory
  LDZ Rd, [zp]     Rd ← zero page
  ST  Rd, [addr]   memory ← Rd
  STZ Rd, [zp]     zero page ← Rd
  LD  Rd, [HL]     Rd ← mem[HL]
  ST  Rd, [HL]     mem[HL] ← Rd
  LD  Rd, [HL+d]   Rd ← mem[HL+offset]
  ST  Rd, [HL+d]   mem[HL+offset] ← Rd
  LDI16 rp, #imm16 register pair ← 16-bit immediate

Arithmetic:
  ADD Rd, Rs       Rd ← Rd + Rs
  ADC Rd, Rs       Rd ← Rd + Rs + C
  SUB Rd, Rs       Rd ← Rd - Rs
  SBC Rd, Rs       Rd ← Rd - Rs - C
  ADDI Rd, #imm    Rd ← Rd + immediate
  SUBI Rd, #imm    Rd ← Rd - immediate
  INC Rd           Rd ← Rd + 1
  DEC Rd           Rd ← Rd - 1
  CMP Rd, Rs       flags ← Rd - Rs
  CMPI Rd, #imm    flags ← Rd - immediate
  NEG Rd           Rd ← 0 - Rd
  INC16 rp         register pair += 1
  DEC16 rp         register pair -= 1
  ADD16 HL, rp     HL ← HL + register pair

Logic:
  AND Rd, Rs       Rd ← Rd & Rs
  OR  Rd, Rs       Rd ← Rd | Rs
  XOR Rd, Rs       Rd ← Rd ^ Rs
  NOT Rd           Rd ← ~Rd
  ANDI Rd, #imm    Rd ← Rd & immediate
  ORI  Rd, #imm    Rd ← Rd | immediate
  XORI Rd, #imm    Rd ← Rd ^ immediate
  SHL Rd           Rd ← Rd << 1
  SHR Rd           Rd ← Rd >> 1 (logical)
  SAR Rd           Rd ← Rd >> 1 (arithmetic)
  ROL Rd           Rotate left through carry
  ROR Rd           Rotate right through carry
  SWAP Rd          Swap nibbles

Control Flow:
  JMP addr         PC ← address
  JR  offset       PC ← PC + signed offset
  JZ  addr         Jump if Zero
  JNZ addr         Jump if Not Zero
  JC  addr         Jump if Carry
  JNC addr         Jump if No Carry
  JS  addr         Jump if Sign (negative)
  JNS addr         Jump if Not Sign
  JO  addr         Jump if Overflow
  JNO addr         Jump if No Overflow
  JRZ offset       Relative jump if Zero
  JRNZ offset      Relative jump if Not Zero
  JRC offset       Relative jump if Carry
  JRNC offset      Relative jump if No Carry
  JP  HL           PC ← HL (indirect jump)
  CALL addr        Push PC, PC ← address
  RET              PC ← Pop
  RETI             PC ← Pop, enable interrupts

Stack:
  PUSH Rd          Push register
  POP  Rd          Pop register
  PUSH16 rp        Push register pair
  POP16  rp        Pop register pair
  PUSHF            Push flags
  POPF             Pop flags

System:
  EI               Enable interrupts
  DI               Disable interrupts
  SCF              Set carry flag
  CCF              Clear carry flag
  CMF              Complement carry flag
  IN  Rd, port     Rd ← I/O port
  OUT port, Rd     I/O port ← Rd
```

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024 | Initial specification |

---

*Micro8: Building on Micro4's foundation to create a practical 8-bit computer.*
