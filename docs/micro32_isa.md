# Micro32: A 32-bit CPU Architecture with Protected Mode

## Design Philosophy

**GOAL:** Evolve from Micro16's segmented architecture to a full 32-bit CPU with protected mode and paging. Every new feature exists to solve a real limitation from the previous stage.

### Why These Changes?

| Micro16 Limitation | Micro32 Solution |
|-------------------|-----------------|
| 20-bit address = 1MB max | 32-bit address = 4GB address space |
| Real mode only = no protection | Protected mode with privilege rings |
| Segment-only memory = fragmentation | Paging with 4KB pages |
| 16-bit registers = limited computation | 32-bit registers for modern workloads |
| No task isolation | Hardware task switching |
| No memory protection | Page-level R/W/Execute permissions |
| 16-bit data bus = 2 cycles for 32-bit | 32-bit data bus = single cycle |

### Historical Context

Micro32 is inspired by the Intel 80386 (1985), the first true 32-bit x86 processor:
- Full 32-bit registers and data bus
- Flat 4GB address space
- Protected mode with four privilege rings
- Demand paging with virtual memory
- Backwards compatibility with 16-bit code (V86 mode)

---

## Architecture Overview

```
+=====================================================================+
|                           MICRO32 CPU                                |
+=====================================================================+
|                                                                      |
|   +---------------------------------------------------------------+  |
|   |                     REGISTER FILE                              |  |
|   |  +-------+-------+-------+-------+-------+-------+-------+---+ |  |
|   |  |  EAX  |  EBX  |  ECX  |  EDX  |  ESI  |  EDI  |  EBP  |ESP| |  |
|   |  +-------+-------+-------+-------+-------+-------+-------+---+ |  |
|   |       8 x 32-bit General Purpose Registers                     |  |
|   |                                                                |  |
|   |  +-------+-------+-------+-------+-------+-------+            |  |
|   |  |  CS   |  DS   |  SS   |  ES   |  FS   |  GS   |            |  |
|   |  +-------+-------+-------+-------+-------+-------+            |  |
|   |       6 x 16-bit Segment Selectors                            |  |
|   +---------------------------------------------------------------+  |
|                                 |                                    |
|   +-------------+   +-----------+----------+   +-----------------+   |
|   |     EIP     |   |          ALU         |   |     EFLAGS      |   |
|   |  (32-bit)   |   |       (32-bit)       |   |    (32-bit)     |   |
|   +-------------+   +----------------------+   +-----------------+   |
|                                                                      |
|   +-------------+   +----------------------+   +-----------------+   |
|   |    CR0-CR4  |   |    Paging Unit       |   |      TLB        |   |
|   |  (Control)  |   |    (MMU)             |   |  (32 entries)   |   |
|   +-------------+   +----------------------+   +-----------------+   |
|                                                                      |
|   +-------------+   +----------------------+   +-----------------+   |
|   |   GDTR/IDTR |   |   Descriptor Cache   |   |  Debug Regs     |   |
|   |   LDTR/TR   |   |    (Segments)        |   |   DR0-DR7       |   |
|   +-------------+   +----------------------+   +-----------------+   |
|                                                                      |
+======================================================================+
|                        32-bit Address Bus                            |
|                         32-bit Data Bus                              |
+======================================================================+
```

---

## Registers

### General Purpose Registers (8 x 32-bit)

Micro32 provides eight 32-bit general purpose registers with accessible sub-registers:

```
                        32 bits
     +--------------------------------------------------+
     |                       EAX                         |  (Accumulator)
     |                +-------------------+              |
     |                |        AX         |              |  (16-bit)
     |                +--------+----------+              |
     |                |   AH   |    AL    |              |  (8-bit high/low)
     +----------------+--------+----------+--------------+

Register   32-bit   16-bit   8-bit High   8-bit Low   Primary Use
--------   ------   ------   ----------   ---------   ---------------------
   0        EAX       AX        AH          AL        Accumulator, multiply/divide
   1        EBX       BX        BH          BL        Base pointer, general
   2        ECX       CX        CH          CL        Counter, shifts, loops
   3        EDX       DX        DH          DL        Data, I/O, multiply high
   4        ESI       SI        -           -         Source index
   5        EDI       DI        -           -         Destination index
   6        EBP       BP        -           -         Base/frame pointer
   7        ESP       SP        -           -         Stack pointer
```

**Register Encoding (3 bits):**
```
Code   32-bit   16-bit   8-bit (mod=0)   8-bit (mod=1)
----   ------   ------   -------------   -------------
000     EAX       AX          AL              AL
001     ECX       CX          CL              CL
010     EDX       DX          DL              DL
011     EBX       BX          BL              BL
100     ESP       SP          AH              AH
101     EBP       BP          CH              CH
110     ESI       SI          DH              DH
111     EDI       DI          BH              BH
```

### Instruction Pointer

```
+----------------------------------------------------------------+
|  EIP  [31:0]   Extended Instruction Pointer (32-bit)            |
+----------------------------------------------------------------+

In protected mode: EIP is an offset within the current code segment.
With paging: The linear address (segment base + EIP) is translated to physical.
```

### Stack Pointer

```
+----------------------------------------------------------------+
|  ESP  [31:0]   Extended Stack Pointer (32-bit)                  |
+----------------------------------------------------------------+

ESP points to the last pushed value (top of stack).
Stack grows DOWNWARD (toward lower addresses).
PUSH: ESP = ESP - 4, then store
POP:  load, then ESP = ESP + 4
```

### Segment Registers (6 x 16-bit Selectors)

```
Register   Index   Description                    Default Use
--------   -----   ---------------------------    -------------------------
   CS        0     Code Segment                   Instruction fetch
   DS        1     Data Segment                   Data references
   SS        2     Stack Segment                  Stack operations (PUSH/POP)
   ES        3     Extra Segment                  String destination
   FS        4     Extra Segment 2                Thread-local storage
   GS        5     Extra Segment 3                Additional data segment
```

**Segment Selector Format (Protected Mode):**
```
   15                                    3    2    1   0
  +---------------------------------------+----+--------+
  |              Index                    | TI |  RPL   |
  +---------------------------------------+----+--------+

Index [15:3]: Descriptor table index (8192 entries max)
TI    [2]:    Table Indicator (0=GDT, 1=LDT)
RPL   [1:0]:  Requested Privilege Level (0-3)
```

### EFLAGS Register (32-bit)

```
  31                              16 15                              0
 +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 |  |  |  |  |  |  |  |  |  |  |ID|VP|VF|AC|VM|RF|  |NT|IO|IO|OF|DF|IF|
 +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
                                                          PL PL
  +--+--+--+--+--+--+--+--+
  |TF|SF|ZF|  |AF|  |PF|  |CF|
  +--+--+--+--+--+--+--+--+

Bit    Name         Description
---    ----         ----------------------------------------
 0      CF          Carry Flag - unsigned overflow/borrow
 2      PF          Parity Flag - even parity of low byte
 4      AF          Auxiliary Carry - BCD arithmetic
 6      ZF          Zero Flag - result is zero
 7      SF          Sign Flag - result is negative
 8      TF          Trap Flag - single-step debugging
 9      IF          Interrupt Flag - enable/disable interrupts
10      DF          Direction Flag - string operation direction
11      OF          Overflow Flag - signed overflow
12-13   IOPL        I/O Privilege Level (0-3)
14      NT          Nested Task flag
16      RF          Resume Flag - debug exception control
17      VM          Virtual-8086 Mode
18      AC          Alignment Check (ring 3 only)
19      VIF         Virtual Interrupt Flag
20      VIP         Virtual Interrupt Pending
21      ID          CPUID available
```

**Status Flags (CF, PF, AF, ZF, SF, OF):**
```
Example: 0x7FFFFFFF + 1 = 0x80000000

CF = 0  (no unsigned overflow: result fits in 32 bits)
PF = ?  (depends on low byte)
AF = 1  (carry from bit 3 to 4)
ZF = 0  (result not zero)
SF = 1  (bit 31 set - negative in signed interpretation)
OF = 1  (signed overflow: positive + positive = negative)
```

### Control Registers (CR0-CR4)

**CR0 - Control Register 0:**
```
  31                              16 15                              0
 +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 |PG|CD|NW|  |  |  |  |  |  |  |  |  |AM|  |WP|  |  |  |  |  |NE|ET|TS|
 +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+

 +--+--+--+--+
 |EM|MP|PE|
 +--+--+--+--+

Bit   Name   Description
---   ----   ----------------------------------------
 0     PE    Protection Enable (0=real, 1=protected)
 1     MP    Monitor Coprocessor
 2     EM    Emulation (no FPU)
 3     TS    Task Switched
 4     ET    Extension Type (387 present)
 5     NE    Numeric Error (FPU error reporting)
16     WP    Write Protect (applies to ring 0)
18     AM    Alignment Mask
29     NW    Not Write-through
30     CD    Cache Disable
31     PG    Paging Enable
```

**CR2 - Page Fault Linear Address:**
```
+----------------------------------------------------------------+
|  CR2  [31:0]   Linear address that caused page fault            |
+----------------------------------------------------------------+
```

**CR3 - Page Directory Base Register (PDBR):**
```
  31                              12 11                4 3    2    0
 +----------------------------------+-------------------+----+-----+
 |     Page Directory Base          |     Reserved      |PCD |PWT  |
 +----------------------------------+-------------------+----+-----+

Bits [31:12]: Physical address of page directory (4KB aligned)
Bit  [4]:     PCD - Page-level Cache Disable
Bit  [3]:     PWT - Page-level Write-Through
```

**CR4 - Control Register 4 (Extended Features):**
```
Bit   Name   Description
---   ----   ----------------------------------------
 0     VME   Virtual-8086 Mode Extensions
 1     PVI   Protected-mode Virtual Interrupts
 2     TSD   Time Stamp Disable (RDTSC restricted)
 3     DE    Debugging Extensions (DR4/DR5 trap)
 4     PSE   Page Size Extensions (4MB pages)
 5     PAE   Physical Address Extension (>4GB)
 6     MCE   Machine-Check Enable
 7     PGE   Page Global Enable
```

### System Table Registers

**GDTR - Global Descriptor Table Register:**
```
+----------------+----------------------------------+
|   Limit [15:0] |        Base Address [31:0]       |
+----------------+----------------------------------+
      16 bits                  32 bits

Limit: Size of GDT minus 1 (max 65535 = 8192 descriptors)
Base:  Linear address of GDT
```

**IDTR - Interrupt Descriptor Table Register:**
```
+----------------+----------------------------------+
|   Limit [15:0] |        Base Address [31:0]       |
+----------------+----------------------------------+
      16 bits                  32 bits

Limit: Size of IDT minus 1 (max 2047 = 256 descriptors)
Base:  Linear address of IDT
```

**LDTR - Local Descriptor Table Register:**
```
+--------------------+
|  Selector [15:0]   |  (visible part)
+--------------------+
|  Base [31:0]       |  (hidden, cached from descriptor)
|  Limit [31:0]      |
|  Attributes        |
+--------------------+
```

**TR - Task Register:**
```
+--------------------+
|  Selector [15:0]   |  (visible part - TSS selector)
+--------------------+
|  Base [31:0]       |  (hidden, cached from descriptor)
|  Limit [31:0]      |
|  Attributes        |
+--------------------+
```

### Debug Registers (DR0-DR7)

```
Register   Purpose
--------   ----------------------------------------
DR0        Linear breakpoint address 0
DR1        Linear breakpoint address 1
DR2        Linear breakpoint address 2
DR3        Linear breakpoint address 3
DR4        Reserved (alias for DR6 if CR4.DE=0)
DR5        Reserved (alias for DR7 if CR4.DE=0)
DR6        Debug Status Register
DR7        Debug Control Register
```

**DR7 - Debug Control:**
```
  31  30  29  28  27  26  25  24  23  22  21  20  19  18  17  16
 +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 |LEN3 |R/W3 |LEN2 |R/W2 |LEN1 |R/W1 |LEN0 |R/W0 | 0 | 0 |GD | 0 |
 +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+

 15  14  13  12  11  10   9   8   7   6   5   4   3   2   1   0
 +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 | 0 | 0 | 0 | 0 | 0 | 0 |GE |LE |G3 |L3 |G2 |L2 |G1 |L1 |G0 |L0 |
 +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+

Ln/Gn: Local/Global enable for breakpoint n
R/Wn:  00=exec, 01=write, 10=I/O, 11=read/write
LENn:  00=1 byte, 01=2 bytes, 10=undefined, 11=4 bytes
```

---

## Memory Model

### Address Spaces

Micro32 supports three address spaces:

1. **Logical Address:** segment:offset (selector + 32-bit offset)
2. **Linear Address:** 32-bit address after segmentation (0 - 4GB)
3. **Physical Address:** 32-bit address after paging (0 - 4GB)

```
                Segmentation              Paging
                    Unit                   Unit

Logical     +---------------+    +---------------+
Address  -->| Base + Offset |    |   Page Table  |    Physical
seg:off     |   + Checks    |--->|   Lookup      |--> Address
            +---------------+    +---------------+
                Linear               (if PG=1)
                Address
```

### Memory Map (Default Configuration)

```
Physical Address Range     Size       Description
----------------------     ----       -----------------------------
0x00000000 - 0x000003FF    1 KB       Real Mode IVT (256 x 4 bytes)
0x00000400 - 0x000004FF    256 B      BIOS Data Area
0x00000500 - 0x0009FFFF    639 KB     Conventional Memory
0x000A0000 - 0x000BFFFF    128 KB     Video Memory
0x000C0000 - 0x000FFFFF    256 KB     ROM/BIOS Area
0x00100000 - 0xFFFFFFFF    ~4 GB      Extended Memory

Protected Mode Structures (typical locations):
0x00001000 - 0x00001FFF    4 KB       Page Directory
0x00002000 - 0x00002FFF    4 KB       GDT (up to 8192 descriptors)
0x00003000 - 0x00003FFF    4 KB       IDT (256 descriptors)
0x00004000 - 0x00004FFF    4 KB       Initial TSS
```

### Segmentation

In protected mode, segment registers hold selectors that index into descriptor tables.

**Segment Descriptor Format (8 bytes):**
```
  63              56 55   52 51  48 47              40 39   32
 +------------------+-------+------+-----------------+--------+
 |   Base [31:24]   |Flags  |Limit |   Access Byte   |Base    |
 |                  |       |19:16 |                 |[23:16] |
 +------------------+-------+------+-----------------+--------+

  31                              16 15                      0
 +----------------------------------+------------------------+
 |         Base [15:0]              |      Limit [15:0]      |
 +----------------------------------+------------------------+

Flags [55:52]:
  Bit 55 (G):    Granularity (0=byte, 1=4KB pages)
  Bit 54 (D/B):  Default operation size (0=16-bit, 1=32-bit)
  Bit 53 (L):    Long mode (reserved, set to 0)
  Bit 52 (AVL):  Available for software use

Access Byte [47:40]:
  Bit 47 (P):    Present
  Bits 46:45 (DPL): Descriptor Privilege Level (0-3)
  Bit 44 (S):    Descriptor type (0=system, 1=code/data)
  Bits 43:40 (Type): Segment type
```

**Code Segment Types (S=1, Type[43]=1):**
```
Type[43:40]   Description
-----------   ------------------------------------
1000 (0x8)    Execute-only
1001 (0x9)    Execute-only, accessed
1010 (0xA)    Execute/Read
1011 (0xB)    Execute/Read, accessed
1100 (0xC)    Execute-only, conforming
1101 (0xD)    Execute-only, conforming, accessed
1110 (0xE)    Execute/Read, conforming
1111 (0xF)    Execute/Read, conforming, accessed
```

**Data Segment Types (S=1, Type[43]=0):**
```
Type[43:40]   Description
-----------   ------------------------------------
0000 (0x0)    Read-only
0001 (0x1)    Read-only, accessed
0010 (0x2)    Read/Write
0011 (0x3)    Read/Write, accessed
0100 (0x4)    Read-only, expand-down
0101 (0x5)    Read-only, expand-down, accessed
0110 (0x6)    Read/Write, expand-down
0111 (0x7)    Read/Write, expand-down, accessed
```

**System Segment Types (S=0):**
```
Type[43:40]   Description
-----------   ------------------------------------
0001 (0x1)    16-bit TSS (Available)
0010 (0x2)    LDT
0011 (0x3)    16-bit TSS (Busy)
0100 (0x4)    16-bit Call Gate
0101 (0x5)    Task Gate
0110 (0x6)    16-bit Interrupt Gate
0111 (0x7)    16-bit Trap Gate
1001 (0x9)    32-bit TSS (Available)
1011 (0xB)    32-bit TSS (Busy)
1100 (0xC)    32-bit Call Gate
1110 (0xE)    32-bit Interrupt Gate
1111 (0xF)    32-bit Trap Gate
```

### Paging

When CR0.PG = 1, linear addresses are translated through a two-level page table.

**Linear Address Format:**
```
  31              22 21              12 11                      0
 +------------------+------------------+------------------------+
 |   Directory      |     Table        |        Offset          |
 |   Index [9:0]    |   Index [9:0]    |        [11:0]          |
 +------------------+------------------+------------------------+
     10 bits            10 bits              12 bits

1024 dir entries x 1024 page entries x 4KB pages = 4GB addressable
```

**Page Directory Entry (PDE):**
```
  31                              12 11  9  8  7  6  5  4  3  2  1  0
 +----------------------------------+-----+--+--+--+--+--+--+--+--+--+
 |   Page Table Base [31:12]        |AVL  |G |PS| 0|A |CD|WT|US|RW|P |
 +----------------------------------+-----+--+--+--+--+--+--+--+--+--+

Bit 0 (P):    Present - page table is in memory
Bit 1 (R/W):  Read/Write - 0=read-only, 1=read-write
Bit 2 (U/S):  User/Supervisor - 0=supervisor only, 1=all levels
Bit 3 (PWT):  Page Write-Through
Bit 4 (PCD):  Page Cache Disable
Bit 5 (A):    Accessed - set by CPU on access
Bit 6:        Reserved (0)
Bit 7 (PS):   Page Size - 0=4KB pages, 1=4MB pages (if CR4.PSE=1)
Bit 8 (G):    Global (ignored in PDE for 4KB pages)
Bits 11:9:    Available for software use
Bits 31:12:   Page table physical address (4KB aligned)
```

**Page Table Entry (PTE):**
```
  31                              12 11  9  8  7  6  5  4  3  2  1  0
 +----------------------------------+-----+--+--+--+--+--+--+--+--+--+
 |   Page Frame [31:12]             |AVL  |G | 0|D |A |CD|WT|US|RW|P |
 +----------------------------------+-----+--+--+--+--+--+--+--+--+--+

Bit 0 (P):    Present - page is in memory
Bit 1 (R/W):  Read/Write
Bit 2 (U/S):  User/Supervisor
Bit 3 (PWT):  Page Write-Through
Bit 4 (PCD):  Page Cache Disable
Bit 5 (A):    Accessed - set by CPU on any access
Bit 6 (D):    Dirty - set by CPU on write
Bit 7 (PAT):  Page Attribute Table (reserved if not supported)
Bit 8 (G):    Global - don't flush from TLB on CR3 write
Bits 11:9:    Available for software use
Bits 31:12:   Page frame physical address (4KB aligned)
```

**Address Translation Example:**
```
Linear Address: 0x12345678

Directory Index = bits [31:22] = 0x048 = 72
Table Index     = bits [21:12] = 0x345 = 837
Page Offset     = bits [11:0]  = 0x678 = 1656

1. Read PDE at CR3 + (72 * 4) = CR3 + 0x120
2. Extract page table base from PDE
3. Read PTE at page_table_base + (837 * 4) = base + 0xD14
4. Extract page frame from PTE
5. Physical Address = page_frame + 0x678
```

---

## Instruction Format

Micro32 uses variable-length instructions (1-15 bytes) for compact encoding.

### General Instruction Format

```
+--------+--------+--------+---------+-----------+-------------+
| Prefix | Opcode | ModR/M |   SIB   | Displace- |  Immediate  |
|  0-4   |  1-2   |  0-1   |   0-1   |   ment    |    0-4      |
| bytes  | bytes  | bytes  |  bytes  |   0-4     |   bytes     |
+--------+--------+--------+---------+-----------+-------------+
```

### Prefix Bytes

```
Prefix      Encoding   Description
------      --------   ------------------------------------
LOCK        0xF0       Assert LOCK# for atomic operations
REPNE/REPNZ 0xF2       Repeat while not equal/not zero
REP/REPE/REPZ 0xF3     Repeat / Repeat while equal/zero
CS override 0x2E       Use CS segment
SS override 0x36       Use SS segment
DS override 0x3E       Use DS segment
ES override 0x26       Use ES segment
FS override 0x64       Use FS segment
GS override 0x65       Use GS segment
Operand size 0x66      Toggle operand size (32<->16)
Address size 0x67      Toggle address size (32<->16)
```

### ModR/M Byte

```
   7    6    5    4    3    2    1    0
 +-------+------------+----------------+
 |  Mod  |    Reg     |      R/M       |
 +-------+------------+----------------+
  2 bits    3 bits        3 bits

Mod: Addressing mode
  00 = [register]           Memory, no displacement
  01 = [register + disp8]   Memory, 8-bit signed displacement
  10 = [register + disp32]  Memory, 32-bit displacement
  11 = register             Register direct

Reg: Register operand or opcode extension

R/M: Register/Memory operand
  With Mod=11: register
  With Mod!=11: memory addressing mode
```

**ModR/M Addressing Modes (32-bit mode):**
```
Mod  R/M   Addressing Mode
---  ---   ----------------------------------------
00   000   [EAX]
00   001   [ECX]
00   010   [EDX]
00   011   [EBX]
00   100   [SIB]                    (SIB byte follows)
00   101   [disp32]                 (32-bit displacement only)
00   110   [ESI]
00   111   [EDI]

01   000   [EAX + disp8]
01   001   [ECX + disp8]
01   010   [EDX + disp8]
01   011   [EBX + disp8]
01   100   [SIB + disp8]
01   101   [EBP + disp8]
01   110   [ESI + disp8]
01   111   [EDI + disp8]

10   000   [EAX + disp32]
10   001   [ECX + disp32]
10   010   [EDX + disp32]
10   011   [EBX + disp32]
10   100   [SIB + disp32]
10   101   [EBP + disp32]
10   110   [ESI + disp32]
10   111   [EDI + disp32]

11   rrr   Register (see register encoding)
```

### SIB Byte (Scale-Index-Base)

```
   7    6    5    4    3    2    1    0
 +-------+------------+----------------+
 | Scale |   Index    |      Base      |
 +-------+------------+----------------+
  2 bits    3 bits        3 bits

Effective Address = Base + (Index * Scale) + Displacement

Scale:
  00 = x1
  01 = x2
  10 = x4
  11 = x8

Index (3 bits): Any register except ESP (100 = no index)
Base (3 bits): Any register (EBP=101 with Mod=00 means no base)
```

**SIB Examples:**
```
[EBX + ESI*4]        = Mod=00, R/M=100, Scale=10, Index=110, Base=011
[EBP + EDI*8 + 16]   = Mod=01, R/M=100, Scale=11, Index=111, Base=101, disp8=16
[ESI*2 + 0x1000]     = Mod=00, R/M=100, Scale=01, Index=110, Base=101, disp32=0x1000
```

---

## Addressing Modes

| Mode | Syntax | Description | Example |
|------|--------|-------------|---------|
| Immediate | imm | Constant value in instruction | `MOV EAX, 42` |
| Register | reg | Value in register | `MOV EAX, EBX` |
| Direct | [addr] | Value at memory address | `MOV EAX, [0x1000]` |
| Register Indirect | [reg] | Address in register | `MOV EAX, [EBX]` |
| Based | [reg+disp] | Base register + displacement | `MOV EAX, [EBP+8]` |
| Indexed | [reg+reg*s] | Base + scaled index | `MOV EAX, [EBX+ESI*4]` |
| Based Indexed | [reg+reg*s+disp] | Full SIB addressing | `MOV EAX, [EBP+ECX*4+16]` |
| Relative | [EIP+disp] | PC-relative (jumps/calls) | `JMP label` |
| Segment Override | seg:[addr] | Explicit segment | `MOV EAX, ES:[EDI]` |

---

## Complete Instruction Set

### Instruction Set Summary (~200 instructions)

| Category | Count | Description |
|----------|-------|-------------|
| Data Movement | 32 | MOV, PUSH, POP, XCHG, LEA, etc. |
| Arithmetic | 28 | ADD, SUB, MUL, DIV, INC, DEC, etc. |
| Logic | 16 | AND, OR, XOR, NOT, TEST |
| Shift/Rotate | 14 | SHL, SHR, SAR, ROL, ROR, etc. |
| Control Flow | 35 | JMP, Jcc, CALL, RET, LOOP, etc. |
| String Operations | 12 | MOVS, CMPS, SCAS, STOS, LODS |
| Flag Manipulation | 10 | STC, CLC, STI, CLI, etc. |
| Stack Operations | 8 | PUSH, POP, PUSHA, POPA, etc. |
| System | 25 | LGDT, LIDT, MOV CRn, INT, etc. |
| I/O | 4 | IN, OUT, INS, OUTS |
| Bit Operations | 6 | BT, BTS, BTR, BTC, BSF, BSR |
| Miscellaneous | 10 | NOP, HLT, CPUID, etc. |
| **Total** | **~200** | |

---

### Data Movement Instructions

| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| 88 | `MOV r/m8, r8` | Move byte reg to r/m | 2+ | - |
| 89 | `MOV r/m32, r32` | Move dword reg to r/m | 2+ | - |
| 8A | `MOV r8, r/m8` | Move byte r/m to reg | 2+ | - |
| 8B | `MOV r32, r/m32` | Move dword r/m to reg | 2+ | - |
| 8C | `MOV r/m16, Sreg` | Move segment reg to r/m | 2+ | - |
| 8E | `MOV Sreg, r/m16` | Move r/m to segment reg | 2+ | - |
| A0 | `MOV AL, moffs8` | Move byte at offset to AL | 5 | - |
| A1 | `MOV EAX, moffs32` | Move dword at offset to EAX | 5 | - |
| A2 | `MOV moffs8, AL` | Move AL to byte at offset | 5 | - |
| A3 | `MOV moffs32, EAX` | Move EAX to dword at offset | 5 | - |
| B0+rb | `MOV r8, imm8` | Move immediate byte to reg | 2 | - |
| B8+rd | `MOV r32, imm32` | Move immediate dword to reg | 5 | - |
| C6 | `MOV r/m8, imm8` | Move immediate byte to r/m | 3+ | - |
| C7 | `MOV r/m32, imm32` | Move immediate dword to r/m | 6+ | - |

**Exchange:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| 86 | `XCHG r/m8, r8` | Exchange byte | 2+ | - |
| 87 | `XCHG r/m32, r32` | Exchange dword | 2+ | - |
| 90+rd | `XCHG EAX, r32` | Exchange with EAX | 1 | - |

**Stack:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| 50+rd | `PUSH r32` | Push register | 1 | - |
| 58+rd | `POP r32` | Pop register | 1 | - |
| 06/0E/16/1E | `PUSH seg` | Push segment register | 1 | - |
| 07/17/1F | `POP seg` | Pop segment register | 1 | - |
| 68 | `PUSH imm32` | Push immediate | 5 | - |
| 6A | `PUSH imm8` | Push sign-extended byte | 2 | - |
| FF /6 | `PUSH r/m32` | Push memory/register | 2+ | - |
| 8F /0 | `POP r/m32` | Pop memory/register | 2+ | - |
| 60 | `PUSHAD` | Push all registers | 1 | - |
| 61 | `POPAD` | Pop all registers | 1 | - |
| 9C | `PUSHFD` | Push EFLAGS | 1 | - |
| 9D | `POPFD` | Pop EFLAGS | 1 | All |

**Address Calculation:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| 8D | `LEA r32, m` | Load effective address | 2+ | - |
| C5 | `LDS r32, m` | Load pointer using DS | 2+ | - |
| C4 | `LES r32, m` | Load pointer using ES | 2+ | - |
| 0F B4 | `LFS r32, m` | Load pointer using FS | 3+ | - |
| 0F B5 | `LGS r32, m` | Load pointer using GS | 3+ | - |
| 0F B2 | `LSS r32, m` | Load pointer using SS | 3+ | - |

**Type Conversion:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| 98 | `CWDE` | Sign-extend AX to EAX | 1 | - |
| 99 | `CDQ` | Sign-extend EAX to EDX:EAX | 1 | - |
| 0F B6 | `MOVZX r32, r/m8` | Zero-extend byte to dword | 3+ | - |
| 0F B7 | `MOVZX r32, r/m16` | Zero-extend word to dword | 3+ | - |
| 0F BE | `MOVSX r32, r/m8` | Sign-extend byte to dword | 3+ | - |
| 0F BF | `MOVSX r32, r/m16` | Sign-extend word to dword | 3+ | - |

---

### Arithmetic Instructions

**Addition:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| 00 | `ADD r/m8, r8` | Add byte | 2+ | O,S,Z,A,P,C |
| 01 | `ADD r/m32, r32` | Add dword | 2+ | O,S,Z,A,P,C |
| 02 | `ADD r8, r/m8` | Add byte | 2+ | O,S,Z,A,P,C |
| 03 | `ADD r32, r/m32` | Add dword | 2+ | O,S,Z,A,P,C |
| 04 | `ADD AL, imm8` | Add immediate to AL | 2 | O,S,Z,A,P,C |
| 05 | `ADD EAX, imm32` | Add immediate to EAX | 5 | O,S,Z,A,P,C |
| 80 /0 | `ADD r/m8, imm8` | Add immediate byte | 3+ | O,S,Z,A,P,C |
| 81 /0 | `ADD r/m32, imm32` | Add immediate dword | 6+ | O,S,Z,A,P,C |
| 83 /0 | `ADD r/m32, imm8` | Add sign-extended byte | 3+ | O,S,Z,A,P,C |

**Addition with Carry:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| 10 | `ADC r/m8, r8` | Add with carry byte | 2+ | O,S,Z,A,P,C |
| 11 | `ADC r/m32, r32` | Add with carry dword | 2+ | O,S,Z,A,P,C |
| 12 | `ADC r8, r/m8` | Add with carry byte | 2+ | O,S,Z,A,P,C |
| 13 | `ADC r32, r/m32` | Add with carry dword | 2+ | O,S,Z,A,P,C |
| 14 | `ADC AL, imm8` | ADC immediate to AL | 2 | O,S,Z,A,P,C |
| 15 | `ADC EAX, imm32` | ADC immediate to EAX | 5 | O,S,Z,A,P,C |

**Subtraction:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| 28 | `SUB r/m8, r8` | Subtract byte | 2+ | O,S,Z,A,P,C |
| 29 | `SUB r/m32, r32` | Subtract dword | 2+ | O,S,Z,A,P,C |
| 2A | `SUB r8, r/m8` | Subtract byte | 2+ | O,S,Z,A,P,C |
| 2B | `SUB r32, r/m32` | Subtract dword | 2+ | O,S,Z,A,P,C |
| 2C | `SUB AL, imm8` | Subtract immediate from AL | 2 | O,S,Z,A,P,C |
| 2D | `SUB EAX, imm32` | Subtract immediate from EAX | 5 | O,S,Z,A,P,C |

**Subtraction with Borrow:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| 18 | `SBB r/m8, r8` | Subtract with borrow byte | 2+ | O,S,Z,A,P,C |
| 19 | `SBB r/m32, r32` | Subtract with borrow dword | 2+ | O,S,Z,A,P,C |
| 1A | `SBB r8, r/m8` | Subtract with borrow byte | 2+ | O,S,Z,A,P,C |
| 1B | `SBB r32, r/m32` | Subtract with borrow dword | 2+ | O,S,Z,A,P,C |

**Increment/Decrement:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| 40+rd | `INC r32` | Increment register | 1 | O,S,Z,A,P |
| 48+rd | `DEC r32` | Decrement register | 1 | O,S,Z,A,P |
| FE /0 | `INC r/m8` | Increment byte | 2+ | O,S,Z,A,P |
| FE /1 | `DEC r/m8` | Decrement byte | 2+ | O,S,Z,A,P |
| FF /0 | `INC r/m32` | Increment dword | 2+ | O,S,Z,A,P |
| FF /1 | `DEC r/m32` | Decrement dword | 2+ | O,S,Z,A,P |

**Comparison:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| 38 | `CMP r/m8, r8` | Compare bytes | 2+ | O,S,Z,A,P,C |
| 39 | `CMP r/m32, r32` | Compare dwords | 2+ | O,S,Z,A,P,C |
| 3A | `CMP r8, r/m8` | Compare bytes | 2+ | O,S,Z,A,P,C |
| 3B | `CMP r32, r/m32` | Compare dwords | 2+ | O,S,Z,A,P,C |
| 3C | `CMP AL, imm8` | Compare AL with immediate | 2 | O,S,Z,A,P,C |
| 3D | `CMP EAX, imm32` | Compare EAX with immediate | 5 | O,S,Z,A,P,C |

**Negation:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| F6 /3 | `NEG r/m8` | Two's complement byte | 2+ | O,S,Z,A,P,C |
| F7 /3 | `NEG r/m32` | Two's complement dword | 2+ | O,S,Z,A,P,C |

**Multiplication:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| F6 /4 | `MUL r/m8` | Unsigned AX = AL * r/m8 | 2+ | O,C |
| F7 /4 | `MUL r/m32` | Unsigned EDX:EAX = EAX * r/m32 | 2+ | O,C |
| F6 /5 | `IMUL r/m8` | Signed AX = AL * r/m8 | 2+ | O,C |
| F7 /5 | `IMUL r/m32` | Signed EDX:EAX = EAX * r/m32 | 2+ | O,C |
| 0F AF | `IMUL r32, r/m32` | Signed r32 = r32 * r/m32 | 3+ | O,C |
| 69 | `IMUL r32, r/m32, imm32` | Signed r32 = r/m32 * imm32 | 6+ | O,C |
| 6B | `IMUL r32, r/m32, imm8` | Signed r32 = r/m32 * imm8 | 3+ | O,C |

**Division:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| F6 /6 | `DIV r/m8` | Unsigned AL=AX/r/m8, AH=AX%r/m8 | 2+ | Undef |
| F7 /6 | `DIV r/m32` | Unsigned EAX=EDX:EAX/r/m32, EDX=rem | 2+ | Undef |
| F6 /7 | `IDIV r/m8` | Signed AL=AX/r/m8, AH=AX%r/m8 | 2+ | Undef |
| F7 /7 | `IDIV r/m32` | Signed EAX=EDX:EAX/r/m32, EDX=rem | 2+ | Undef |

---

### Logic Instructions

| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| 20 | `AND r/m8, r8` | Logical AND byte | 2+ | O=0,S,Z,P,C=0 |
| 21 | `AND r/m32, r32` | Logical AND dword | 2+ | O=0,S,Z,P,C=0 |
| 22 | `AND r8, r/m8` | Logical AND byte | 2+ | O=0,S,Z,P,C=0 |
| 23 | `AND r32, r/m32` | Logical AND dword | 2+ | O=0,S,Z,P,C=0 |
| 24 | `AND AL, imm8` | AND AL with immediate | 2 | O=0,S,Z,P,C=0 |
| 25 | `AND EAX, imm32` | AND EAX with immediate | 5 | O=0,S,Z,P,C=0 |
| 08 | `OR r/m8, r8` | Logical OR byte | 2+ | O=0,S,Z,P,C=0 |
| 09 | `OR r/m32, r32` | Logical OR dword | 2+ | O=0,S,Z,P,C=0 |
| 0A | `OR r8, r/m8` | Logical OR byte | 2+ | O=0,S,Z,P,C=0 |
| 0B | `OR r32, r/m32` | Logical OR dword | 2+ | O=0,S,Z,P,C=0 |
| 0C | `OR AL, imm8` | OR AL with immediate | 2 | O=0,S,Z,P,C=0 |
| 0D | `OR EAX, imm32` | OR EAX with immediate | 5 | O=0,S,Z,P,C=0 |
| 30 | `XOR r/m8, r8` | Logical XOR byte | 2+ | O=0,S,Z,P,C=0 |
| 31 | `XOR r/m32, r32` | Logical XOR dword | 2+ | O=0,S,Z,P,C=0 |
| 32 | `XOR r8, r/m8` | Logical XOR byte | 2+ | O=0,S,Z,P,C=0 |
| 33 | `XOR r32, r/m32` | Logical XOR dword | 2+ | O=0,S,Z,P,C=0 |
| 34 | `XOR AL, imm8` | XOR AL with immediate | 2 | O=0,S,Z,P,C=0 |
| 35 | `XOR EAX, imm32` | XOR EAX with immediate | 5 | O=0,S,Z,P,C=0 |
| F6 /2 | `NOT r/m8` | One's complement byte | 2+ | - |
| F7 /2 | `NOT r/m32` | One's complement dword | 2+ | - |
| 84 | `TEST r/m8, r8` | AND without storing (flags only) | 2+ | O=0,S,Z,P,C=0 |
| 85 | `TEST r/m32, r32` | AND without storing (flags only) | 2+ | O=0,S,Z,P,C=0 |
| A8 | `TEST AL, imm8` | Test AL with immediate | 2 | O=0,S,Z,P,C=0 |
| A9 | `TEST EAX, imm32` | Test EAX with immediate | 5 | O=0,S,Z,P,C=0 |

---

### Shift and Rotate Instructions

**Shift:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| D0 /4 | `SHL r/m8, 1` | Shift left by 1 | 2+ | O,S,Z,P,C |
| D1 /4 | `SHL r/m32, 1` | Shift left by 1 | 2+ | O,S,Z,P,C |
| D2 /4 | `SHL r/m8, CL` | Shift left by CL | 2+ | O,S,Z,P,C |
| D3 /4 | `SHL r/m32, CL` | Shift left by CL | 2+ | O,S,Z,P,C |
| C0 /4 | `SHL r/m8, imm8` | Shift left by immediate | 3+ | O,S,Z,P,C |
| C1 /4 | `SHL r/m32, imm8` | Shift left by immediate | 3+ | O,S,Z,P,C |
| D0 /5 | `SHR r/m8, 1` | Logical shift right by 1 | 2+ | O,S,Z,P,C |
| D1 /5 | `SHR r/m32, 1` | Logical shift right by 1 | 2+ | O,S,Z,P,C |
| D2 /5 | `SHR r/m8, CL` | Logical shift right by CL | 2+ | O,S,Z,P,C |
| D3 /5 | `SHR r/m32, CL` | Logical shift right by CL | 2+ | O,S,Z,P,C |
| D0 /7 | `SAR r/m8, 1` | Arithmetic shift right by 1 | 2+ | O,S,Z,P,C |
| D1 /7 | `SAR r/m32, 1` | Arithmetic shift right by 1 | 2+ | O,S,Z,P,C |
| D2 /7 | `SAR r/m8, CL` | Arithmetic shift right by CL | 2+ | O,S,Z,P,C |
| D3 /7 | `SAR r/m32, CL` | Arithmetic shift right by CL | 2+ | O,S,Z,P,C |

**Rotate:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| D0 /0 | `ROL r/m8, 1` | Rotate left by 1 | 2+ | O,C |
| D1 /0 | `ROL r/m32, 1` | Rotate left by 1 | 2+ | O,C |
| D2 /0 | `ROL r/m8, CL` | Rotate left by CL | 2+ | O,C |
| D3 /0 | `ROL r/m32, CL` | Rotate left by CL | 2+ | O,C |
| D0 /1 | `ROR r/m8, 1` | Rotate right by 1 | 2+ | O,C |
| D1 /1 | `ROR r/m32, 1` | Rotate right by 1 | 2+ | O,C |
| D0 /2 | `RCL r/m8, 1` | Rotate left through carry | 2+ | O,C |
| D1 /2 | `RCL r/m32, 1` | Rotate left through carry | 2+ | O,C |
| D0 /3 | `RCR r/m8, 1` | Rotate right through carry | 2+ | O,C |
| D1 /3 | `RCR r/m32, 1` | Rotate right through carry | 2+ | O,C |

**Double Precision Shift:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| 0F A4 | `SHLD r/m32, r32, imm8` | Double precision left shift | 4+ | O,S,Z,P,C |
| 0F A5 | `SHLD r/m32, r32, CL` | Double precision left shift | 3+ | O,S,Z,P,C |
| 0F AC | `SHRD r/m32, r32, imm8` | Double precision right shift | 4+ | O,S,Z,P,C |
| 0F AD | `SHRD r/m32, r32, CL` | Double precision right shift | 3+ | O,S,Z,P,C |

---

### Control Flow Instructions

**Unconditional Jump:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| EB | `JMP rel8` | Short jump (8-bit relative) | 2 | - |
| E9 | `JMP rel32` | Near jump (32-bit relative) | 5 | - |
| FF /4 | `JMP r/m32` | Indirect near jump | 2+ | - |
| EA | `JMP ptr16:32` | Far jump (segment:offset) | 7 | - |
| FF /5 | `JMP m16:32` | Indirect far jump | 2+ | - |

**Conditional Jumps:**
| Opcode | Mnemonic | Condition | Description |
|--------|----------|-----------|-------------|
| 70 / 0F 80 | `JO rel` | OF=1 | Jump if overflow |
| 71 / 0F 81 | `JNO rel` | OF=0 | Jump if not overflow |
| 72 / 0F 82 | `JB/JC/JNAE rel` | CF=1 | Jump if below/carry |
| 73 / 0F 83 | `JAE/JNB/JNC rel` | CF=0 | Jump if above or equal |
| 74 / 0F 84 | `JE/JZ rel` | ZF=1 | Jump if equal/zero |
| 75 / 0F 85 | `JNE/JNZ rel` | ZF=0 | Jump if not equal/zero |
| 76 / 0F 86 | `JBE/JNA rel` | CF=1 or ZF=1 | Jump if below or equal |
| 77 / 0F 87 | `JA/JNBE rel` | CF=0 and ZF=0 | Jump if above |
| 78 / 0F 88 | `JS rel` | SF=1 | Jump if sign (negative) |
| 79 / 0F 89 | `JNS rel` | SF=0 | Jump if not sign |
| 7A / 0F 8A | `JP/JPE rel` | PF=1 | Jump if parity even |
| 7B / 0F 8B | `JNP/JPO rel` | PF=0 | Jump if parity odd |
| 7C / 0F 8C | `JL/JNGE rel` | SF!=OF | Jump if less (signed) |
| 7D / 0F 8D | `JGE/JNL rel` | SF=OF | Jump if greater or equal |
| 7E / 0F 8E | `JLE/JNG rel` | ZF=1 or SF!=OF | Jump if less or equal |
| 7F / 0F 8F | `JG/JNLE rel` | ZF=0 and SF=OF | Jump if greater |

**Call and Return:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| E8 | `CALL rel32` | Near call (push EIP, jump) | 5 | - |
| FF /2 | `CALL r/m32` | Indirect near call | 2+ | - |
| 9A | `CALL ptr16:32` | Far call | 7 | - |
| FF /3 | `CALL m16:32` | Indirect far call | 2+ | - |
| C3 | `RET` | Near return | 1 | - |
| C2 | `RET imm16` | Near return, pop imm16 bytes | 3 | - |
| CB | `RETF` | Far return | 1 | - |
| CA | `RETF imm16` | Far return, pop imm16 bytes | 3 | - |

**Loop Control:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| E2 | `LOOP rel8` | Dec ECX, jump if ECX!=0 | 2 | - |
| E1 | `LOOPE/LOOPZ rel8` | Dec ECX, jump if ECX!=0 and ZF=1 | 2 | - |
| E0 | `LOOPNE/LOOPNZ rel8` | Dec ECX, jump if ECX!=0 and ZF=0 | 2 | - |
| E3 | `JECXZ rel8` | Jump if ECX=0 | 2 | - |

**Interrupt:**
| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| CC | `INT 3` | Breakpoint interrupt | 1 | - |
| CD | `INT imm8` | Software interrupt | 2 | IF=0,TF=0 |
| CE | `INTO` | Interrupt on overflow (if OF=1) | 1 | IF=0,TF=0 |
| CF | `IRETD` | Return from interrupt | 1 | All |

---

### String Instructions

String instructions operate on blocks of memory using ESI (source) and EDI (destination).

| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| A4 | `MOVSB` | Move byte [DS:ESI] to [ES:EDI] | 1 | - |
| A5 | `MOVSD` | Move dword [DS:ESI] to [ES:EDI] | 1 | - |
| A6 | `CMPSB` | Compare byte [DS:ESI] with [ES:EDI] | 1 | O,S,Z,A,P,C |
| A7 | `CMPSD` | Compare dword [DS:ESI] with [ES:EDI] | 1 | O,S,Z,A,P,C |
| AE | `SCASB` | Compare AL with byte [ES:EDI] | 1 | O,S,Z,A,P,C |
| AF | `SCASD` | Compare EAX with dword [ES:EDI] | 1 | O,S,Z,A,P,C |
| AA | `STOSB` | Store AL to byte [ES:EDI] | 1 | - |
| AB | `STOSD` | Store EAX to dword [ES:EDI] | 1 | - |
| AC | `LODSB` | Load byte [DS:ESI] to AL | 1 | - |
| AD | `LODSD` | Load dword [DS:ESI] to EAX | 1 | - |
| 6C | `INSB` | Input byte from port DX to [ES:EDI] | 1 | - |
| 6D | `INSD` | Input dword from port DX to [ES:EDI] | 1 | - |
| 6E | `OUTSB` | Output byte [DS:ESI] to port DX | 1 | - |
| 6F | `OUTSD` | Output dword [DS:ESI] to port DX | 1 | - |

**Repeat Prefixes:**
```
REP   (F3)  - Repeat while ECX != 0
REPE  (F3)  - Repeat while ECX != 0 and ZF = 1
REPNE (F2)  - Repeat while ECX != 0 and ZF = 0
```

String operations auto-increment or auto-decrement ESI/EDI based on DF flag:
- DF = 0: Increment (forward)
- DF = 1: Decrement (backward)

---

### Flag Manipulation Instructions

| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| F8 | `CLC` | Clear carry flag | 1 | C=0 |
| F9 | `STC` | Set carry flag | 1 | C=1 |
| F5 | `CMC` | Complement carry flag | 1 | C=!C |
| FC | `CLD` | Clear direction flag | 1 | D=0 |
| FD | `STD` | Set direction flag | 1 | D=1 |
| FA | `CLI` | Clear interrupt flag | 1 | I=0 |
| FB | `STI` | Set interrupt flag | 1 | I=1 |
| 9E | `SAHF` | Store AH into flags | 1 | S,Z,A,P,C |
| 9F | `LAHF` | Load flags into AH | 1 | - |
| 9C | `PUSHFD` | Push EFLAGS | 1 | - |
| 9D | `POPFD` | Pop EFLAGS | 1 | All |

---

### Bit Operations

| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| 0F A3 | `BT r/m32, r32` | Bit test (CF = bit) | 3+ | C |
| 0F BA /4 | `BT r/m32, imm8` | Bit test immediate | 4+ | C |
| 0F AB | `BTS r/m32, r32` | Bit test and set | 3+ | C |
| 0F BA /5 | `BTS r/m32, imm8` | Bit test and set | 4+ | C |
| 0F B3 | `BTR r/m32, r32` | Bit test and reset | 3+ | C |
| 0F BA /6 | `BTR r/m32, imm8` | Bit test and reset | 4+ | C |
| 0F BB | `BTC r/m32, r32` | Bit test and complement | 3+ | C |
| 0F BA /7 | `BTC r/m32, imm8` | Bit test and complement | 4+ | C |
| 0F BC | `BSF r32, r/m32` | Bit scan forward | 3+ | Z |
| 0F BD | `BSR r32, r/m32` | Bit scan reverse | 3+ | Z |

---

### I/O Instructions

| Opcode | Mnemonic | Operation | Bytes | Flags |
|--------|----------|-----------|-------|-------|
| E4 | `IN AL, imm8` | Input byte from immediate port | 2 | - |
| E5 | `IN EAX, imm8` | Input dword from immediate port | 2 | - |
| EC | `IN AL, DX` | Input byte from port in DX | 1 | - |
| ED | `IN EAX, DX` | Input dword from port in DX | 1 | - |
| E6 | `OUT imm8, AL` | Output byte to immediate port | 2 | - |
| E7 | `OUT imm8, EAX` | Output dword to immediate port | 2 | - |
| EE | `OUT DX, AL` | Output byte to port in DX | 1 | - |
| EF | `OUT DX, EAX` | Output dword to port in DX | 1 | - |

---

### System Instructions

**Descriptor Table Operations:**
| Opcode | Mnemonic | Operation | Priv | Bytes |
|--------|----------|-----------|------|-------|
| 0F 01 /2 | `LGDT m` | Load GDTR | 0 | 3+ |
| 0F 01 /0 | `SGDT m` | Store GDTR | Any | 3+ |
| 0F 01 /3 | `LIDT m` | Load IDTR | 0 | 3+ |
| 0F 01 /1 | `SIDT m` | Store IDTR | Any | 3+ |
| 0F 00 /2 | `LLDT r/m16` | Load LDTR | 0 | 3+ |
| 0F 00 /0 | `SLDT r/m16` | Store LDTR | Any | 3+ |
| 0F 00 /3 | `LTR r/m16` | Load Task Register | 0 | 3+ |
| 0F 00 /1 | `STR r/m16` | Store Task Register | Any | 3+ |

**Control Register Operations:**
| Opcode | Mnemonic | Operation | Priv | Bytes |
|--------|----------|-----------|------|-------|
| 0F 20 /r | `MOV r32, CRn` | Move from control register | 0 | 3 |
| 0F 22 /r | `MOV CRn, r32` | Move to control register | 0 | 3 |
| 0F 21 /r | `MOV r32, DRn` | Move from debug register | 0 | 3 |
| 0F 23 /r | `MOV DRn, r32` | Move to debug register | 0 | 3 |

**Segment Verification:**
| Opcode | Mnemonic | Operation | Priv | Bytes |
|--------|----------|-----------|------|-------|
| 0F 00 /4 | `VERR r/m16` | Verify segment readable | Any | 3+ |
| 0F 00 /5 | `VERW r/m16` | Verify segment writable | Any | 3+ |
| 0F 02 | `LAR r32, r/m16` | Load access rights | Any | 3+ |
| 0F 03 | `LSL r32, r/m16` | Load segment limit | Any | 3+ |
| 63 | `ARPL r/m16, r16` | Adjust RPL | Any | 2+ |

**Cache and TLB:**
| Opcode | Mnemonic | Operation | Priv | Bytes |
|--------|----------|-----------|------|-------|
| 0F 06 | `CLTS` | Clear task-switched flag | 0 | 2 |
| 0F 08 | `INVD` | Invalidate cache | 0 | 2 |
| 0F 09 | `WBINVD` | Write-back and invalidate cache | 0 | 2 |
| 0F 01 /7 | `INVLPG m` | Invalidate TLB entry | 0 | 3+ |

**Miscellaneous System:**
| Opcode | Mnemonic | Operation | Priv | Bytes |
|--------|----------|-----------|------|-------|
| 90 | `NOP` | No operation | Any | 1 |
| F4 | `HLT` | Halt processor | 0 | 1 |
| 0F 31 | `RDTSC` | Read timestamp counter | Any* | 2 |
| 0F A2 | `CPUID` | CPU identification | Any | 2 |
| 0F 30 | `WRMSR` | Write model-specific register | 0 | 2 |
| 0F 32 | `RDMSR` | Read model-specific register | 0 | 2 |

---

## Protected Mode

### Overview

Protected mode provides:
- Memory protection via segmentation and paging
- Four privilege levels (rings 0-3)
- Hardware task switching
- Virtual memory support

### Privilege Levels

```
Ring 0 (Kernel)     - Most privileged, direct hardware access
Ring 1              - Device drivers (rarely used)
Ring 2              - Device drivers (rarely used)
Ring 3 (User)       - Least privileged, applications
```

**Privilege Checks:**
- CPL (Current Privilege Level): RPL of CS selector
- DPL (Descriptor Privilege Level): In segment descriptor
- RPL (Requested Privilege Level): In selector

**Access Rules:**
- Data access: CPL <= DPL and RPL <= DPL
- Code transfer (non-conforming): CPL = DPL
- Code transfer (conforming): CPL >= DPL
- Privileged instructions: CPL = 0

### Entering Protected Mode

```asm
; 1. Disable interrupts
CLI

; 2. Load GDT
LGDT [gdt_descriptor]

; 3. Set PE bit in CR0
MOV EAX, CR0
OR EAX, 1
MOV CR0, EAX

; 4. Far jump to load CS (clears prefetch queue)
JMP 0x08:protected_entry    ; 0x08 = code segment selector

protected_entry:
    ; 5. Load data segment registers
    MOV AX, 0x10            ; 0x10 = data segment selector
    MOV DS, AX
    MOV ES, AX
    MOV SS, AX
    MOV FS, AX
    MOV GS, AX

    ; 6. Enable interrupts
    STI
```

### Global Descriptor Table (GDT)

Typical GDT layout:

```
Index   Selector   Description
-----   --------   ---------------------
  0     0x00       Null descriptor (required)
  1     0x08       Kernel code segment (DPL=0)
  2     0x10       Kernel data segment (DPL=0)
  3     0x18       User code segment (DPL=3)
  4     0x20       User data segment (DPL=3)
  5     0x28       TSS descriptor
  ...
```

**Null Descriptor:**
```
Offset 0x00: 00 00 00 00 00 00 00 00
```

**Kernel Code Segment (Ring 0, Execute/Read):**
```
Base = 0x00000000, Limit = 0xFFFFF (4GB with G=1)
Access = 0x9A (P=1, DPL=0, S=1, Type=Execute/Read)
Flags = 0xC (G=1, D=1)

Bytes: 0xFFFF 0x0000 0x00 0x9A 0xCF 0x00
```

**Kernel Data Segment (Ring 0, Read/Write):**
```
Base = 0x00000000, Limit = 0xFFFFF (4GB with G=1)
Access = 0x92 (P=1, DPL=0, S=1, Type=Read/Write)
Flags = 0xC (G=1, D=1)

Bytes: 0xFFFF 0x0000 0x00 0x92 0xCF 0x00
```

### Interrupt Descriptor Table (IDT)

**Gate Descriptor Format (8 bytes):**
```
  63              48 47 46  45 44 43    40 39        32
 +------------------+--+-----+--+----------+----------+
 | Offset [31:16]   |P | DPL |0 | Type     | Reserved |
 +------------------+--+-----+--+----------+----------+

  31              16 15                              0
 +------------------+--------------------------------+
 | Segment Selector |       Offset [15:0]            |
 +------------------+--------------------------------+

Type:
  0xE = 32-bit Interrupt Gate (clears IF)
  0xF = 32-bit Trap Gate (preserves IF)
  0x5 = Task Gate
```

**Standard Exception Vectors:**
```
Vector   Name                    Type       Error Code
------   ----------------------  ---------  ----------
  0      Divide Error            Fault      No
  1      Debug                   Fault/Trap No
  2      NMI                     Interrupt  No
  3      Breakpoint              Trap       No
  4      Overflow                Trap       No
  5      Bound Range Exceeded    Fault      No
  6      Invalid Opcode          Fault      No
  7      Device Not Available    Fault      No
  8      Double Fault            Abort      Yes (0)
  9      Coprocessor Segment     Fault      No
 10      Invalid TSS             Fault      Yes
 11      Segment Not Present     Fault      Yes
 12      Stack Fault             Fault      Yes
 13      General Protection      Fault      Yes
 14      Page Fault              Fault      Yes
 15      Reserved                -          -
 16      x87 FPU Error           Fault      No
 17      Alignment Check         Fault      Yes (0)
 18      Machine Check           Abort      No
 19-31   Reserved                -          -
 32-255  User-defined            -          No
```

### Task State Segment (TSS)

The TSS stores CPU state for hardware task switching.

**32-bit TSS Format (104 bytes minimum):**
```
Offset   Size    Field
------   ----    ---------------------------
0x00     2       Previous Task Link
0x04     4       ESP0 (Ring 0 stack pointer)
0x08     2       SS0 (Ring 0 stack segment)
0x0C     4       ESP1 (Ring 1 stack pointer)
0x10     2       SS1 (Ring 1 stack segment)
0x14     4       ESP2 (Ring 2 stack pointer)
0x18     2       SS2 (Ring 2 stack segment)
0x1C     4       CR3 (Page directory base)
0x20     4       EIP
0x24     4       EFLAGS
0x28     4       EAX
0x2C     4       ECX
0x30     4       EDX
0x34     4       EBX
0x38     4       ESP
0x3C     4       EBP
0x40     4       ESI
0x44     4       EDI
0x48     2       ES
0x4C     2       CS
0x50     2       SS
0x54     2       DS
0x58     2       FS
0x5C     2       GS
0x60     2       LDT Selector
0x64     2       Reserved
0x66     2       I/O Map Base Address
```

---

## Paging

### Enabling Paging

```asm
; 1. Create page directory and page tables
; 2. Load page directory base into CR3
MOV EAX, page_directory
MOV CR3, EAX

; 3. Enable paging (CR0.PG = 1)
MOV EAX, CR0
OR EAX, 0x80000000
MOV CR0, EAX
```

### Identity Mapping Example

Map first 4MB of physical memory:

```
Page Directory at 0x1000:
  Entry 0: 0x00002003  (Page table at 0x2000, P=1, R/W=1, U/S=0)
  Entry 1-1023: 0x00000000

Page Table at 0x2000:
  Entry 0:   0x00000003  (Physical 0x00000, P=1, R/W=1)
  Entry 1:   0x00001003  (Physical 0x01000, P=1, R/W=1)
  Entry 2:   0x00002003  (Physical 0x02000, P=1, R/W=1)
  ...
  Entry 1023: 0x003FF003 (Physical 0x3FF000, P=1, R/W=1)
```

### Page Fault Handling

When a page fault occurs (vector 14):

1. CPU pushes error code onto stack
2. CR2 contains the faulting linear address
3. Error code format:
```
Bit 0 (P):    0 = Page not present, 1 = Protection violation
Bit 1 (W/R):  0 = Read access, 1 = Write access
Bit 2 (U/S):  0 = Supervisor mode, 1 = User mode
Bit 3 (RSVD): 1 = Reserved bit set in page table
Bit 4 (I/D):  1 = Instruction fetch (if NX supported)
```

### TLB Management

The Translation Lookaside Buffer caches page translations:

- INVLPG instruction invalidates a single entry
- Writing to CR3 flushes entire TLB (except global pages)
- Global pages (PTE.G=1) persist across CR3 writes

---

## Interrupts and Exceptions

### Exception Classes

1. **Faults:** Correctable, instruction restarts (e.g., Page Fault)
2. **Traps:** After instruction completes (e.g., Breakpoint)
3. **Aborts:** Unrecoverable, cannot continue (e.g., Double Fault)

### Interrupt Handling Flow

```
1. CPU determines vector number
2. Vector * 8 indexes into IDT
3. Gate descriptor specifies handler address and segment
4. Check privilege levels (CPL, DPL)
5. If ring change (e.g., ring 3 to ring 0):
   - Load ESP and SS from TSS (ESP0, SS0)
   - Push old SS and ESP
6. Push EFLAGS
7. Clear IF and TF (for interrupt gates)
8. Push CS and EIP
9. Push error code (if applicable)
10. Load CS:EIP from gate descriptor
11. Execute handler
```

### Stack Frame (Ring 3 to Ring 0):

```
              Higher Addresses
        +------------------------+
        |     Old SS             |  +20
        +------------------------+
        |     Old ESP            |  +16
        +------------------------+
        |     EFLAGS             |  +12
        +------------------------+
        |     Old CS             |  +8
        +------------------------+
        |     Old EIP            |  +4
        +------------------------+
        |     Error Code         |  <- ESP (if present)
        +------------------------+
              Lower Addresses
```

### Returning from Interrupt

```asm
; If error code was pushed, remove it first
ADD ESP, 4          ; Skip error code

IRETD               ; Pop EIP, CS, EFLAGS (and SS:ESP if ring change)
```

---

## Example Programs

### Example 1: Hello World (Real Mode Boot)

```asm
; Boot sector that prints "Hello, Micro32!" and halts
; Assemble and write to first sector of disk

    ORG 0x7C00          ; BIOS loads boot sector here

start:
    ; Set up segments
    XOR AX, AX
    MOV DS, AX
    MOV ES, AX

    ; Print message
    MOV SI, message

.print_loop:
    LODSB               ; AL = [DS:SI], SI++
    TEST AL, AL         ; Check for null terminator
    JZ .done
    MOV AH, 0x0E        ; BIOS teletype function
    INT 0x10            ; Video interrupt
    JMP .print_loop

.done:
    HLT                 ; Halt processor
    JMP .done           ; In case of interrupt

message:
    DB "Hello, Micro32!", 0x0D, 0x0A, 0

    ; Boot signature
    TIMES 510-($-$$) DB 0
    DW 0xAA55
```

### Example 2: Protected Mode Entry

```asm
; Enter protected mode and set up flat memory model

    ORG 0x7C00

    BITS 16                 ; 16-bit real mode

start:
    CLI                     ; Disable interrupts

    ; Load GDT
    LGDT [gdt_descriptor]

    ; Enable protected mode
    MOV EAX, CR0
    OR EAX, 1
    MOV CR0, EAX

    ; Far jump to flush pipeline and load CS
    JMP 0x08:protected_mode

    BITS 32                 ; 32-bit protected mode

protected_mode:
    ; Set up segment registers
    MOV AX, 0x10            ; Data segment selector
    MOV DS, AX
    MOV ES, AX
    MOV FS, AX
    MOV GS, AX
    MOV SS, AX
    MOV ESP, 0x90000        ; Stack at 576KB

    ; Clear screen
    MOV EDI, 0xB8000        ; Video memory
    MOV ECX, 80*25
    MOV EAX, 0x0F200F20     ; Two spaces (white on black)
    REP STOSD

    ; Print "PM" at top-left
    MOV DWORD [0xB8000], 0x0F4D0F50  ; 'P' and 'M'

    HLT

; GDT
gdt_start:
    ; Null descriptor
    DQ 0

    ; Code segment descriptor
    DW 0xFFFF               ; Limit 0-15
    DW 0x0000               ; Base 0-15
    DB 0x00                 ; Base 16-23
    DB 0x9A                 ; Access: present, ring 0, code, execute/read
    DB 0xCF                 ; Flags + Limit 16-19
    DB 0x00                 ; Base 24-31

    ; Data segment descriptor
    DW 0xFFFF               ; Limit 0-15
    DW 0x0000               ; Base 0-15
    DB 0x00                 ; Base 16-23
    DB 0x92                 ; Access: present, ring 0, data, read/write
    DB 0xCF                 ; Flags + Limit 16-19
    DB 0x00                 ; Base 24-31

gdt_end:

gdt_descriptor:
    DW gdt_end - gdt_start - 1  ; Limit
    DD gdt_start                 ; Base

    TIMES 510-($-$$) DB 0
    DW 0xAA55
```

### Example 3: Enabling Paging

```asm
; Enable paging with identity mapping for first 4MB

    BITS 32

enable_paging:
    ; Set up page directory at 0x100000 (1MB)
    MOV EDI, 0x100000
    MOV ECX, 1024
    XOR EAX, EAX
    REP STOSD               ; Clear page directory

    ; Set up page table at 0x101000 (1MB + 4KB)
    MOV EDI, 0x101000
    MOV EAX, 0x00000003     ; Present, Read/Write
    MOV ECX, 1024

.fill_page_table:
    STOSD                   ; Store and advance EDI
    ADD EAX, 0x1000         ; Next page (4KB)
    LOOP .fill_page_table

    ; Link page directory entry 0 to page table
    MOV DWORD [0x100000], 0x00101003  ; Page table at 0x101000

    ; Load page directory base into CR3
    MOV EAX, 0x100000
    MOV CR3, EAX

    ; Enable paging
    MOV EAX, CR0
    OR EAX, 0x80000000      ; Set PG bit
    MOV CR0, EAX

    RET
```

### Example 4: Interrupt Handler

```asm
; Simple timer interrupt handler (IRQ 0, vector 32)

    BITS 32

; IDT entry for timer interrupt
idt_timer:
    DW timer_isr & 0xFFFF       ; Offset low
    DW 0x08                      ; Code segment selector
    DB 0                         ; Reserved
    DB 0x8E                      ; Interrupt gate, ring 0
    DW timer_isr >> 16          ; Offset high

; Timer ISR
timer_isr:
    PUSHAD                      ; Save all registers

    ; Increment tick counter
    INC DWORD [tick_count]

    ; Send EOI to PIC
    MOV AL, 0x20
    OUT 0x20, AL

    POPAD                       ; Restore all registers
    IRETD                       ; Return from interrupt

tick_count:
    DD 0
```

### Example 5: System Call Handler

```asm
; Software interrupt for system calls (INT 0x80)

    BITS 32

; System call numbers in EAX
SYS_EXIT    EQU 1
SYS_WRITE   EQU 4

syscall_handler:
    CMP EAX, SYS_EXIT
    JE .sys_exit
    CMP EAX, SYS_WRITE
    JE .sys_write

    ; Unknown syscall
    MOV EAX, -1
    IRETD

.sys_exit:
    ; Exit code in EBX
    HLT
    JMP .sys_exit

.sys_write:
    ; EBX = file descriptor (ignored, always stdout)
    ; ECX = buffer pointer
    ; EDX = count
    PUSH ESI
    PUSH EDI

    MOV ESI, ECX
    MOV EDI, 0xB8000            ; Video memory
    ADD EDI, [cursor_pos]
    MOV ECX, EDX

.write_loop:
    LODSB
    MOV AH, 0x0F                ; White on black
    STOSW
    LOOP .write_loop

    ; Update cursor
    SUB EDI, 0xB8000
    MOV [cursor_pos], EDI

    POP EDI
    POP ESI
    MOV EAX, EDX                ; Return bytes written
    IRETD

cursor_pos:
    DD 0
```

### Example 6: Memory Copy Using String Instructions

```asm
; Copy 1KB from source to destination using REP MOVSD

    BITS 32

memcpy_1k:
    ; Arguments: ESI = source, EDI = destination
    ; Preserves: EBX, EBP
    ; Returns: nothing

    PUSH ECX
    PUSH ESI
    PUSH EDI

    CLD                         ; Clear direction flag (forward)
    MOV ECX, 256                ; 256 dwords = 1024 bytes
    REP MOVSD                   ; Copy dwords

    POP EDI
    POP ESI
    POP ECX
    RET
```

---

## Opcode Encoding Tables

### One-Byte Opcodes (Primary)

```
     0    1    2    3    4    5    6    7    8    9    A    B    C    D    E    F
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
00 |ADD |ADD |ADD |ADD |ADD |ADD |PUSH|POP |OR  |OR  |OR  |OR  |OR  |OR  |PUSH|0F  |
   |Eb,G|Ev,G|Gb,E|Gv,E|AL,I|EAX,|ES  |ES  |Eb,G|Ev,G|Gb,E|Gv,E|AL,I|EAX,|CS  |ESC |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
10 |ADC |ADC |ADC |ADC |ADC |ADC |PUSH|POP |SBB |SBB |SBB |SBB |SBB |SBB |PUSH|POP |
   |Eb,G|Ev,G|Gb,E|Gv,E|AL,I|EAX,|SS  |SS  |Eb,G|Ev,G|Gb,E|Gv,E|AL,I|EAX,|DS  |DS  |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
20 |AND |AND |AND |AND |AND |AND |ES: |DAA |SUB |SUB |SUB |SUB |SUB |SUB |CS: |DAS |
   |Eb,G|Ev,G|Gb,E|Gv,E|AL,I|EAX,|    |    |Eb,G|Ev,G|Gb,E|Gv,E|AL,I|EAX,|    |    |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
30 |XOR |XOR |XOR |XOR |XOR |XOR |SS: |AAA |CMP |CMP |CMP |CMP |CMP |CMP |DS: |AAS |
   |Eb,G|Ev,G|Gb,E|Gv,E|AL,I|EAX,|    |    |Eb,G|Ev,G|Gb,E|Gv,E|AL,I|EAX,|    |    |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
40 |INC |INC |INC |INC |INC |INC |INC |INC |DEC |DEC |DEC |DEC |DEC |DEC |DEC |DEC |
   |EAX |ECX |EDX |EBX |ESP |EBP |ESI |EDI |EAX |ECX |EDX |EBX |ESP |EBP |ESI |EDI |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
50 |PUSH|PUSH|PUSH|PUSH|PUSH|PUSH|PUSH|PUSH|POP |POP |POP |POP |POP |POP |POP |POP |
   |EAX |ECX |EDX |EBX |ESP |EBP |ESI |EDI |EAX |ECX |EDX |EBX |ESP |EBP |ESI |EDI |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
60 |PSHD|POPD|BOUN|ARPL|FS: |GS: |OP: |AD: |PUSH|IMUL|PUSH|IMUL|INSB|INSD|OUTS|OUTS|
   |A   |A   |D   |    |    |    |SZ  |SZ  |Iv  |Gv, |Ib  |Gv, |    |    |B   |D   |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
70 |JO  |JNO |JB  |JAE |JE  |JNE |JBE |JA  |JS  |JNS |JP  |JNP |JL  |JGE |JLE |JG  |
   |Jb  |Jb  |Jb  |Jb  |Jb  |Jb  |Jb  |Jb  |Jb  |Jb  |Jb  |Jb  |Jb  |Jb  |Jb  |Jb  |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
80 |GRP1|GRP1|GRP1|GRP1|TEST|TEST|XCHG|XCHG|MOV |MOV |MOV |MOV |MOV |LEA |MOV |POP |
   |Eb,I|Ev,I|Eb,I|Ev,I|Eb,G|Ev,G|Eb,G|Ev,G|Eb,G|Ev,G|Gb,E|Gv,E|Sw,E|Gv,M|Ew,S|Ev  |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
90 |NOP |XCHG|XCHG|XCHG|XCHG|XCHG|XCHG|XCHG|CWDE|CDQ |CALL|WAIT|PSHF|POPF|SAHF|LAHF|
   |    |CX  |DX  |BX  |SP  |BP  |SI  |DI  |    |    |Ap  |    |D   |D   |    |    |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
A0 |MOV |MOV |MOV |MOV |MOVS|MOVS|CMPS|CMPS|TEST|TEST|STOS|STOS|LODS|LODS|SCAS|SCAS|
   |AL,O|EAX,|Ob,A|Ov,E|B   |D   |B   |D   |AL,I|EAX,|B   |D   |B   |D   |B   |D   |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
B0 |MOV |MOV |MOV |MOV |MOV |MOV |MOV |MOV |MOV |MOV |MOV |MOV |MOV |MOV |MOV |MOV |
   |AL,I|CL,I|DL,I|BL,I|AH,I|CH,I|DH,I|BH,I|EAX,|ECX,|EDX,|EBX,|ESP,|EBP,|ESI,|EDI,|
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
C0 |GRP2|GRP2|RET |RET |LES |LDS |MOV |MOV |ENTR|LEAV|RETF|RETF|INT |INT |INTO|IRET|
   |Eb,I|Ev,I|Iw  |    |Gv,M|Gv,M|Eb,I|Ev,I|Iw,I|E   |Iw  |    |3   |Ib  |    |D   |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
D0 |GRP2|GRP2|GRP2|GRP2|AAM |AAD |    |XLAT|FPU |FPU |FPU |FPU |FPU |FPU |FPU |FPU |
   |Eb,1|Ev,1|Eb,C|Ev,C|Ib  |Ib  |    |    |    |    |    |    |    |    |    |    |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
E0 |LOOP|LOOP|LOOP|JECX|IN  |IN  |OUT |OUT |CALL|JMP |JMP |JMP |IN  |IN  |OUT |OUT |
   |NZ  |Z   |    |Z   |AL,I|EAX,|Ib,A|Ib,E|Jv  |Jv  |Ap  |Jb  |AL,D|EAX,|DX,A|DX,E|
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
F0 |LOCK|    |REPN|REP |HLT |CMC |GRP3|GRP3|CLC |STC |CLI |STI |CLD |STD |GRP4|GRP5|
   |    |    |E   |    |    |    |Eb  |Ev  |    |    |    |    |    |    |Eb  |Ev  |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
```

### Two-Byte Opcodes (0F prefix)

```
     0    1    2    3    4    5    6    7    8    9    A    B    C    D    E    F
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
00 |GRP6|GRP7|LAR |LSL |    |    |CLTS|    |INVD|WBIN|    |    |    |    |    |    |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
20 |MOV |MOV |MOV |MOV |    |    |    |    |    |    |    |    |    |    |    |    |
   |Rd,C|Rd,D|Cd,R|Dd,R|    |    |    |    |    |    |    |    |    |    |    |    |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
30 |WMSR|RDTS|RDMS|RDPM|    |    |    |    |    |    |    |    |    |    |    |    |
   |    |C   |R   |C   |    |    |    |    |    |    |    |    |    |    |    |    |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
80 |JO  |JNO |JB  |JAE |JE  |JNE |JBE |JA  |JS  |JNS |JP  |JNP |JL  |JGE |JLE |JG  |
   |Jv  |Jv  |Jv  |Jv  |Jv  |Jv  |Jv  |Jv  |Jv  |Jv  |Jv  |Jv  |Jv  |Jv  |Jv  |Jv  |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
90 |SETO|SETN|SETB|SETA|SETE|SETN|SETB|SETA|SETS|SETN|SETP|SETN|SETL|SETG|SETL|SETG|
   |    |O   |    |E   |    |E   |E   |    |    |S   |    |P   |    |E   |E   |    |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
A0 |PUSH|POP |CPUI|BT  |SHLD|SHLD|    |    |PUSH|POP |    |BTS |SHRD|SHRD|GRP |IMUL|
   |FS  |FS  |D   |Ev,G|    |CL  |    |    |GS  |GS  |    |Ev,G|    |CL  |15  |Gv,E|
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
B0 |CMPX|CMPX|LSS |BTR |LFS |LGS |MOVZ|MOVZ|    |    |GRP8|BTC |BSF |BSR |MOVS|MOVS|
   |CHG |CHG |Gv,M|Ev,G|Gv,M|Gv,M|X Gb|X Gv|    |    |Ev,I|Ev,G|Gv,E|Gv,E|X Gb|X Gv|
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
C0 |XADD|XADD|    |    |    |    |    |    |BSWA|BSWA|BSWA|BSWA|BSWA|BSWA|BSWA|BSWA|
   |Eb,G|Ev,G|    |    |    |    |    |    |P   |P   |P   |P   |P   |P   |P   |P   |
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
```

### Group Opcode Tables

**Group 1 (80-83, /r):**
```
/0 = ADD    /1 = OR     /2 = ADC    /3 = SBB
/4 = AND    /5 = SUB    /6 = XOR    /7 = CMP
```

**Group 2 (C0-C1, D0-D3, /r):**
```
/0 = ROL    /1 = ROR    /2 = RCL    /3 = RCR
/4 = SHL    /5 = SHR    /6 = SHL    /7 = SAR
```

**Group 3 (F6-F7, /r):**
```
/0 = TEST   /1 = TEST   /2 = NOT    /3 = NEG
/4 = MUL    /5 = IMUL   /6 = DIV    /7 = IDIV
```

**Group 4 (FE, /r):**
```
/0 = INC Eb     /1 = DEC Eb
```

**Group 5 (FF, /r):**
```
/0 = INC Ev     /1 = DEC Ev     /2 = CALL Ev (near)
/3 = CALL Mp (far)  /4 = JMP Ev (near)  /5 = JMP Mp (far)
/6 = PUSH Ev
```

**Group 6 (0F 00, /r):**
```
/0 = SLDT   /1 = STR    /2 = LLDT   /3 = LTR
/4 = VERR   /5 = VERW
```

**Group 7 (0F 01, /r):**
```
/0 = SGDT   /1 = SIDT   /2 = LGDT   /3 = LIDT
/4 = SMSW   /5 = -      /6 = LMSW   /7 = INVLPG
```

---

## Comparison: Micro16 vs Micro32

| Feature | Micro16 | Micro32 |
|---------|---------|---------|
| Data width | 16-bit | 32-bit |
| Address bus | 20-bit (1MB) | 32-bit (4GB) |
| Registers | 8 x 16-bit | 8 x 32-bit + subregisters |
| Segment registers | 4 (CS, DS, SS, ES) | 6 (+ FS, GS) |
| Addressing modes | 8 | 12+ (with SIB) |
| Segmentation | Real mode only | Real + Protected |
| Paging | None | 4KB pages, TLB |
| Protection | None | 4 privilege rings |
| Descriptor tables | None | GDT, LDT, IDT |
| Task switching | Software | Hardware TSS |
| Control registers | None | CR0-CR4 |
| Debug registers | None | DR0-DR7 |
| String operations | Basic | REP prefix |
| Gate count (est.) | ~5,000 | ~275,000 |

---

## What Micro32 CANNOT Do

These limitations become homework for Micro32-P (pipelined):

1. **Single-cycle execution** - Multi-cycle complex instructions
2. **No branch prediction** - Pipeline stalls on branches
3. **No out-of-order execution** - Instructions execute in order
4. **No speculative execution** - Waits for dependencies
5. **No L1 cache** - Memory access at DRAM speeds
6. **No superscalar** - One instruction at a time
7. **No FPU** - Software floating-point only

---

## Implementation Notes

### Estimated Complexity

```
Component                              Estimated Gates
-------------------------------------  ---------------
32-bit ALU (add/sub/logic/shifts)      ~2,500
Register file (8 x 32-bit)             ~1,500
Segment unit (6 registers + cache)     ~1,000
Paging unit (TLB + walker)             ~8,000
Protection unit (priv checks)          ~500
32-bit barrel shifter                  ~2,000
Multiplier (32x32)                     ~10,000
Divider (32-bit)                       ~8,000
Instruction decoder                    ~3,000
Address generation unit                ~1,500
Memory interface                       ~1,000
Interrupt controller                   ~500
Debug unit                             ~500
Control state machine                  ~5,000
Microcode ROM                          ~30,000
-------------------------------------  ---------------
TOTAL                                  ~275,000 gates
```

### Suggested Test Programs

1. **Protected mode test:** Enter protected mode, verify segment checks
2. **Paging test:** Enable paging, verify address translation
3. **Exception test:** Trigger divide by zero, verify handler
4. **Ring transition test:** Call gate from ring 3 to ring 0
5. **Task switch test:** Hardware task switch via TSS
6. **Page fault test:** Access unmapped page, handle fault
7. **TLB test:** Verify TLB operation and invalidation

---

## Assembly Language Reference

### Assembler Directives

| Directive | Purpose | Example |
|-----------|---------|---------|
| `ORG addr` | Set assembly address | `ORG 0x7C00` |
| `BITS n` | Set code bitness | `BITS 32` |
| `SECTION name` | Define section | `SECTION .text` |
| `DB val` | Define byte(s) | `DB 0x42, 0, "Hi"` |
| `DW val` | Define word (16-bit) | `DW 0x1234` |
| `DD val` | Define dword (32-bit) | `DD 0x12345678` |
| `DQ val` | Define qword (64-bit) | `DQ 0` |
| `RESB n` | Reserve n bytes | `RESB 512` |
| `RESW n` | Reserve n words | `RESW 256` |
| `RESD n` | Reserve n dwords | `RESD 128` |
| `TIMES n` | Repeat n times | `TIMES 510 DB 0` |
| `EQU` | Define constant | `SIZE EQU 1024` |
| `ALIGN n` | Align to n bytes | `ALIGN 4096` |

### Common Patterns

**Clear a register:**
```asm
XOR EAX, EAX        ; EAX = 0 (2 bytes, fast)
; or
MOV EAX, 0          ; EAX = 0 (5 bytes)
```

**Test if zero:**
```asm
TEST EAX, EAX       ; Set ZF without changing EAX
JZ is_zero
```

**Check specific bit:**
```asm
TEST EAX, 0x80      ; Check bit 7
JNZ bit_is_set
; or
BT EAX, 7           ; CF = bit 7
JC bit_is_set
```

**Compare and branch:**
```asm
CMP EAX, 100
JL less_than        ; Signed less than
JB below            ; Unsigned below
JE equal
```

**Function prologue/epilogue:**
```asm
my_function:
    PUSH EBP
    MOV EBP, ESP
    SUB ESP, 16         ; Local variables

    ; ... function body ...

    MOV ESP, EBP        ; or LEAVE
    POP EBP
    RET
```

**Save/restore registers:**
```asm
    PUSHAD              ; Save all (EAX,ECX,EDX,EBX,ESP,EBP,ESI,EDI)
    ; ... use registers ...
    POPAD               ; Restore all
```

**Copy memory block:**
```asm
    MOV ESI, source
    MOV EDI, dest
    MOV ECX, count      ; Dword count
    CLD                 ; Forward direction
    REP MOVSD           ; Copy dwords
```

**Search for byte in buffer:**
```asm
    MOV EDI, buffer
    MOV ECX, length
    MOV AL, target
    CLD
    REPNE SCASB         ; Scan until AL found or ECX=0
    JNE not_found
    DEC EDI             ; EDI points to byte after match
```

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024 | Initial specification |

---

*Micro32: A 32-bit CPU with protected mode and paging, building on Micro16's foundation.*
