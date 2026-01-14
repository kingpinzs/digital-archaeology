# Digital Archaeology

Build CPUs incrementally from 4-bit to 32-bit superscalar.

## Quick Start

```bash
# Build and test
cd src/micro4 && make && make test

# For parallel development with Claude
claude plugin add ralph-wiggum
```

## 6-Stage CPU Evolution

| Stage | CPU | Data | Status |
|-------|-----|------|--------|
| 1 | Micro4 | 4-bit | Complete |
| 2 | Micro8 | 8-bit | In Progress |
| 3 | Micro16 | 16-bit | Planned |
| 4 | Micro32 | 32-bit | Planned |
| 5 | Micro32-P | Pipelined | Planned |
| 6 | Micro32-S | Superscalar | Planned |

## Documentation

- [Project Status](docs/PROJECT_STATUS.md) - Complete status and next steps
- [Development Plan](docs/development_plan.md) - Roadmap
- [Micro8 ISA](docs/micro8_isa.md) - 8-bit instruction set (80 instructions)
- [Optimization Homework](docs/optimization_homework.md) - 90 exercises
- [Historical Homework](docs/historical_homework.md) - 80 exercises

## Directory Structure

```
src/
├── micro4/      # 4-bit CPU emulator (complete)
├── micro8/      # 8-bit CPU emulator (in progress)
└── simulator/   # M4HDL circuit simulator

hdl/             # Hardware description files
programs/        # Assembly test programs
docs/            # Architecture documentation
```

## Parallel Development

See [CLAUDE.md](CLAUDE.md) for parallel development protocol.

```bash
/cpt:quick "Complete Micro8 toolchain"
```
