# CPU Development Plan

## Project Goal
Build a CPU incrementally, starting from the simplest possible 4-bit design and progressively adding features until reaching a modern, capable processor.

## Development Stages Overview

```
Stage 1: Micro4    (4-bit)   - Most basic working CPU
Stage 2: Micro8    (8-bit)   - Expanded registers, addressing modes
Stage 3: Micro16   (16-bit)  - Segmentation, hardware multiply
Stage 4: Micro32   (32-bit)  - Protected mode, paging
Stage 5: Micro32-P (32-bit)  - Pipelining, cache, FPU
Stage 6: Micro32-S (32-bit)  - Superscalar, branch prediction
```

## Stage Progression

### Stage 1: Micro4 (4-bit) ✅ CURRENT FOCUS
- ~45 instructions
- 4KB address space (12-bit addresses)
- 16 x 4-bit registers
- Hardware stack (4 levels)
- Single-cycle execution

### Stage 2: Micro8 (8-bit)
- ~80 instructions
- 64KB address space (16-bit addresses)
- 8 x 8-bit general purpose registers
- Memory-based stack with SP
- Flags register (Z, C, S, O)
- Single interrupt level
- Multiple addressing modes

### Stage 3: Micro16 (16-bit)
- Segmented memory model
- 1MB address space (20-bit physical)
- Hardware multiply/divide
- Vectored interrupts (256)
- String operations
- Instruction prefetch queue

### Stage 4: Micro32 (32-bit)
- Flat 4GB address space
- Protected mode (rings 0-3)
- Paging with TLB
- Virtual 8086 mode
- Debug registers
- Task switching

### Stage 5: Micro32-P (Pipelined)
- 5-stage pipeline (F-D-E-M-W)
- L1 cache (8KB)
- Integrated FPU
- Most instructions = 1 CPI

### Stage 6: Micro32-S (Superscalar)
- Dual-issue pipeline
- Separate I-cache/D-cache
- Branch prediction (BTB)
- Out-of-order hooks

## Implementation Strategy

### Phase 1: Software Emulator
- Write CPU emulator in C or Rust
- Fast iteration, easy debugging
- Build assembler alongside

### Phase 2: HDL Implementation
- Port working design to Verilog/VHDL
- Test with Verilator first
- Deploy to FPGA (iCE40 or ECP5)

### Phase 3: Hardware Integration
- Add real I/O peripherals
- Memory controller
- Debug interface (UART/JTAG)

## Tools to Build

For each stage:
1. [ ] Instruction Set Architecture (ISA) document
2. [ ] Assembler
3. [ ] Disassembler
4. [ ] Emulator/Simulator
5. [ ] Test suite
6. [ ] Monitor/debugger program
7. [ ] HDL implementation (later)

## Success Criteria

Each stage is "complete" when:
- All documented instructions work correctly
- Test suite passes 100%
- Can run a non-trivial program
- Performance metrics documented
- Ready to add next stage's features

## Timeline

No fixed timeline - this is a learning project. Each stage takes as long as it takes to understand deeply.

## Resources

- Documentation in `/docs/`
- Source code in `/src/`
- Test programs in `/tests/`
- HDL code in `/hdl/` (future)
