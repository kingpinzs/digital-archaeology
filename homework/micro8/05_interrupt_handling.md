# Exercise 05: Interrupt Handling

**Difficulty:** ⭐⭐⭐ Hard
**Time:** ~60-90 minutes
**Prerequisites:** Exercise 03 (Stack Operations), Exercise 04 (Subroutine Calls)

---

## Goal

Implement hardware interrupt support with an interrupt vector table, enable/disable instructions (EI/DI), and return from interrupt (RETI). Interrupts allow the CPU to respond to external events without polling.

---

## Background

### What is an Interrupt?

An **interrupt** is a signal that temporarily stops normal execution to handle an urgent event:
- Timer tick (for scheduling)
- Keyboard input
- Disk I/O completion
- Hardware errors

Without interrupts, the CPU would need to constantly poll devices:

```assembly
; Polling (wasteful)
WAIT_KEY:
        IN R0, KEYBOARD_STATUS
        CMPI R0, 0
        JZ WAIT_KEY             ; Loop until key pressed
        IN R0, KEYBOARD_DATA    ; Read key
```

With interrupts, the CPU works on other tasks until a key arrives:

```assembly
; Main program runs freely
MAIN:
        ; Do useful work
        JMP MAIN

; CPU automatically calls this when key is pressed
KEYBOARD_ISR:
        IN R0, KEYBOARD_DATA
        ST R0, [KEY_BUFFER]
        RETI
```

### Interrupt Sequence

When an interrupt occurs:

1. **CPU finishes current instruction** (atomic completion)
2. **CPU checks if interrupts enabled** (IE flag)
3. If enabled:
   - **Disable interrupts** (prevent nested interrupts)
   - **Push PC** (return address to resume)
   - **Jump to ISR** via interrupt vector
4. ISR runs, ends with `RETI`:
   - **Pop PC** (restore return address)
   - **Enable interrupts** (ready for next interrupt)
5. Normal execution resumes

---

## Current State in HDL

From `hdl/05_micro8_cpu.m4hdl`:

```
# Interrupt Enable flag
wire ie;            # Interrupt enable
wire ie_next;
wire ie_load;

# Interrupt pending
wire int_pending;
wire int_ack;       # Interrupt acknowledge

# Interrupt control instructions
wire is_ei;            # 0xE8 - Enable Interrupts
wire is_di;            # 0xE9 - Disable Interrupts
wire is_reti;          # 0xD1 - Return from Interrupt
```

---

## What to Implement

### Step 1: Interrupt Vector Table

The **interrupt vector** tells the CPU where to jump when an interrupt occurs.

For Micro8, use a fixed location:
- **Vector address**: 0x01FE-0x01FF
- **Format**: 16-bit address (little-endian)

```assembly
; Set up interrupt vector at startup
        LDI16 HL, MY_ISR        ; Address of ISR
        ST R6, [0x01FE]         ; Store low byte
        ST R5, [0x01FF]         ; Store high byte
```

### Step 2: EI (Enable Interrupts)

`EI` sets the Interrupt Enable (IE) flag:

```assembly
EI      ; IE = 1, interrupts can occur
```

**HDL:**
```
; When is_ei is active in execute state:
ie_next = 1
ie_load = 1
```

### Step 3: DI (Disable Interrupts)

`DI` clears the IE flag:

```assembly
DI      ; IE = 0, interrupts blocked
```

**HDL:**
```
; When is_di is active in execute state:
ie_next = 0
ie_load = 1
```

### Step 4: Hardware Interrupt Handling

When the INT pin is asserted and IE=1:

1. Set IE=0 (prevent nested interrupts)
2. Push PC (16-bit, like CALL)
3. Load PC from vector (0x01FE-0x01FF)

**HDL state machine addition:**

```
state INTERRUPT_ACK:
    ie_next = 0
    ie_load = 1
    sp_dec = 1              ; SP--
    next_state = INTERRUPT_PUSH_H

state INTERRUPT_PUSH_H:
    mar = sp
    mdr = pc[15:8]
    mem_write = 1
    sp_dec = 1              ; SP--
    next_state = INTERRUPT_PUSH_L

state INTERRUPT_PUSH_L:
    mar = sp
    mdr = pc[7:0]
    mem_write = 1
    next_state = INTERRUPT_LOAD_VEC_L

state INTERRUPT_LOAD_VEC_L:
    mar = 0x01FE
    mem_read = 1
    next_state = INTERRUPT_LOAD_VEC_H

state INTERRUPT_LOAD_VEC_H:
    operand1 = mdr          ; Low byte of ISR address
    mar = 0x01FF
    mem_read = 1
    next_state = INTERRUPT_JUMP

state INTERRUPT_JUMP:
    operand2 = mdr          ; High byte of ISR address
    pc = {operand2, operand1}
    int_ack = 1             ; Acknowledge interrupt
    next_state = FETCH
```

### Step 5: RETI (Return from Interrupt)

`RETI` is like `RET` but also re-enables interrupts:

```assembly
MY_ISR:
        ; Save registers
        PUSH R0
        PUSHF

        ; Handle interrupt
        ; ...

        ; Restore registers
        POPF
        POP R0

        RETI                    ; Return AND enable interrupts
```

**HDL execution:**
```
; Pop return address (like RET)
; Then set IE=1 (unlike RET)
```

---

## Test Program

Simulate timer interrupt handling:

```assembly
; interrupt_test.asm - Test interrupt system
; Simulates timer interrupts that increment a counter

        .org 0x0200

START:
        ; Initialize stack
        LDI16 SP, 0x01FD

        ; Set up interrupt vector
        LDI16 HL, TIMER_ISR
        ST R6, [0x01FE]         ; Vector low byte
        ST R5, [0x01FF]         ; Vector high byte

        ; Initialize interrupt counter
        LDI R0, 0
        ST R0, [INT_COUNT]

        ; Enable interrupts
        EI

        ; Main loop - counts while waiting for interrupts
        LDI R0, 0
        ST R0, [MAIN_COUNT]

MAIN_LOOP:
        ; Increment main counter
        LD R0, [MAIN_COUNT]
        INC R0
        ST R0, [MAIN_COUNT]

        ; Check if we've received 10 interrupts
        LD R1, [INT_COUNT]
        CMPI R1, 10
        JZ DONE

        ; Simulate interrupt (in real hardware, this would be external)
        ; For testing, we CALL the ISR directly after DI/EI cycle
        CALL SIMULATE_INT

        JMP MAIN_LOOP

DONE:
        DI                      ; Disable interrupts
        LDI R0, 0x00            ; Success marker
        ST R0, [RESULT]
        HLT

; Simulates what hardware does when interrupt occurs
SIMULATE_INT:
        DI                      ; Hardware disables interrupts
        CALL ISR_BODY           ; Call ISR body
        EI                      ; RETI would do this
        RET

; The actual interrupt service routine body
ISR_BODY:
        PUSH R0
        PUSHF

        ; Increment interrupt counter
        LD R0, [INT_COUNT]
        INC R0
        ST R0, [INT_COUNT]

        POPF
        POP R0
        RET

; Full ISR with proper RETI (for real hardware)
TIMER_ISR:
        PUSH R0
        PUSH R1
        PUSHF

        ; Handle timer interrupt
        LD R0, [INT_COUNT]
        INC R0
        ST R0, [INT_COUNT]

        ; Acknowledge interrupt (hardware-specific)
        ; OUT TIMER_ACK, R0

        POPF
        POP R1
        POP R0
        RETI                    ; Return and re-enable interrupts

; Data section
        .org 0x0500
INT_COUNT:  .db 0               ; Expected: 0x0A (10)
MAIN_COUNT: .db 0               ; Should be non-zero
RESULT:     .db 0xFF            ; Expected: 0x00 (success)
```

**Expected Results:**
- INT_COUNT = 10 (0x0A)
- RESULT = 0x00 (success)

---

## Progressive Hints

<details>
<summary>Hint 1: Detecting Interrupt Request</summary>

Check for pending interrupt at the end of each instruction:

```
state FETCH:
    if int_pending AND ie:
        next_state = INTERRUPT_ACK
    else:
        ; normal fetch
        mar = pc
        mem_read = 1
        next_state = DECODE
```

The interrupt is sampled at instruction boundaries to ensure atomic instruction execution.
</details>

<details>
<summary>Hint 2: Vector Table Alternatives</summary>

Different CPUs use different interrupt vector schemes:

1. **Fixed address** (simple, like Micro8):
   - Vector at 0x01FE
   - Only one interrupt source

2. **Multiple vectors** (more flexible):
   - Different addresses for different sources
   - e.g., 0x00-0x07 for INT0, 0x08-0x0F for INT1

3. **Vectored interrupt controller**:
   - External chip provides vector number
   - CPU uses table lookup

For this exercise, the fixed address approach is sufficient.
</details>

<details>
<summary>Hint 3: Why Save All Registers?</summary>

The ISR must preserve all registers it uses because:
1. Main program doesn't know when interrupt occurs
2. Any register could be in use
3. Main program expects registers unchanged

The pattern is:
```assembly
ISR:
    PUSH R0
    PUSH R1
    PUSHF           ; Save flags too!

    ; ... do work that modifies R0, R1, flags ...

    POPF
    POP R1
    POP R0
    RETI
```

Forgetting to save a register = random corruption in main program!
</details>

<details>
<summary>Hint 4: Interrupt Latency</summary>

**Interrupt latency** = time from interrupt signal to ISR execution

Components:
1. Finish current instruction (0-N cycles, depends on instruction)
2. Detect interrupt (1 cycle)
3. Push PC (4 cycles)
4. Read vector (2 cycles)
5. Jump to ISR (1 cycle)
6. ISR prologue (PUSH saves)

For Micro8: ~7-10 cycles minimum + instruction completion + ISR overhead.
</details>

<details>
<summary>Hint 5: Nested Interrupts</summary>

By default, interrupts are disabled in ISR (prevents nesting). To allow nesting:

```assembly
NESTED_ISR:
    PUSH R0
    PUSHF

    EI              ; Re-enable interrupts!

    ; Now higher-priority interrupts can occur
    ; (requires priority logic in hardware)

    ; ... handle interrupt ...

    DI              ; Disable before returning
    POPF
    POP R0
    RETI
```

This is advanced - most systems avoid nested interrupts initially.
</details>

---

## Literature References

- **Intel 8259A Programmable Interrupt Controller**: Industry standard interrupt handling
- **Patterson & Hennessy**: Exception and interrupt handling
- **ARM Architecture Reference Manual**: Exception model
- **Tanenbaum, "Structured Computer Organization"**: Interrupt concepts

---

## Expected Outcome

When complete, you should be able to:

1. Set up the interrupt vector table
2. Enable/disable interrupts with EI/DI
3. Write interrupt service routines (ISRs)
4. Return from interrupts with RETI
5. Understand interrupt latency and timing

---

## Verification Checklist

- [ ] Interrupt vector at 0x01FE-0x01FF contains ISR address
- [ ] `EI` enables interrupts (IE = 1)
- [ ] `DI` disables interrupts (IE = 0)
- [ ] Interrupt pushes PC and jumps to vector when IE=1
- [ ] `RETI` pops PC and sets IE=1
- [ ] ISR correctly preserves all modified registers
- [ ] Test program counts 10 interrupts

---

## Challenge Extensions

1. **Multiple interrupt sources**: Add priority logic
2. **Interrupt controller**: External 8259-style controller
3. **Timer interrupt**: Hardware timer with programmable period
4. **Software interrupt (SWI)**: Trap instruction for system calls
5. **Non-maskable interrupt (NMI)**: Can't be disabled by DI

---

## Next Steps

Interrupts are the most complex control flow feature. With them complete, explore:
- **Exercise 06**: Addressing Modes - more ways to access memory
- **Exercise 08**: Critical Path - optimize interrupt latency
