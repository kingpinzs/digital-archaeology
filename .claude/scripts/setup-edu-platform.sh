#!/bin/bash
# Setup Educational Platform Directory Structure
# Run this script to initialize all directories needed for parallel agent work

set -e

echo "========================================"
echo " Digital Archaeology Educational Platform"
echo " Directory Structure Setup"
echo "========================================"
echo ""

# Get project root (parent of .claude directory)
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "Project root: $PROJECT_ROOT"
echo ""

# Reference implementations (retrofit existing)
echo "Creating reference implementation directories..."
mkdir -p reference/micro4/{hdl,src,tests}
mkdir -p reference/micro8/{hdl,src,tests}
mkdir -p reference/micro16/{hdl,src,tests}
mkdir -p reference/micro32/{hdl,src,tests}
mkdir -p reference/micro32p/{hdl,src,tests}
mkdir -p reference/micro32s/{hdl,src,tests}

# Student templates
echo "Creating student template directories..."
mkdir -p templates/micro4/{hdl,hints,expected}
mkdir -p templates/micro8/{hdl,hints,expected}
mkdir -p templates/micro16/{hdl,hints,expected}
mkdir -p templates/micro32/{hdl,hints,expected}
mkdir -p templates/micro32p/{hdl,hints,expected}
mkdir -p templates/micro32s/{hdl,hints,expected}

# Homework exercises
echo "Creating homework exercise directories..."
mkdir -p homework/micro4
mkdir -p homework/micro8
mkdir -p homework/micro16
mkdir -p homework/micro32
mkdir -p homework/micro32p
mkdir -p homework/micro32s

# Literature/educational articles
echo "Creating literature directory..."
mkdir -p literature

# Visualizer modules
echo "Creating visualizer module directories..."
mkdir -p visualizer/modules
mkdir -p visualizer/themes

# Agent prompts and logs
echo "Creating agent infrastructure directories..."
mkdir -p .claude/prompts
mkdir -p .claude/scripts
mkdir -p logs

echo ""
echo "========================================"
echo " Directory Structure Created!"
echo "========================================"
echo ""
echo "Directory layout:"
echo ""
echo "  reference/          # Reference implementations (copy existing)"
echo "  ├── micro4/"
echo "  ├── micro8/"
echo "  ├── micro16/"
echo "  ├── micro32/"
echo "  ├── micro32p/"
echo "  └── micro32s/"
echo ""
echo "  templates/          # Student starter templates"
echo "  ├── micro4/"
echo "  │   ├── hdl/        # Starter HDL with TODOs"
echo "  │   ├── hints/      # Progressive hint files"
echo "  │   └── expected/   # Expected test outputs"
echo "  └── ..."
echo ""
echo "  homework/           # Optimization exercises"
echo "  ├── micro4/         # 5 exercises"
echo "  ├── micro8/         # 8 exercises"
echo "  ├── micro16/        # 10 exercises"
echo "  ├── micro32/        # 12 exercises"
echo "  ├── micro32p/       # 10 exercises"
echo "  └── micro32s/       # 8 exercises"
echo ""
echo "  literature/         # Educational articles (20 total)"
echo ""
echo "  visualizer/modules/ # Modular visualizer components"
echo ""
echo "========================================"
echo " Next Steps"
echo "========================================"
echo ""
echo "1. Review task prompts in .claude/prompts/*.md"
echo ""
echo "2. Check parallel plan in .claude/parallel-plan.json"
echo ""
echo "3. Start parallel agents:"
echo "   /cpt:parallel sprint1-visualizer    # Visualizer modules"
echo "   /cpt:parallel sprint2-micro4-edu    # Micro4 templates"
echo ""
echo "4. Or spawn individual agents:"
echo '   claude -p "$(cat .claude/prompts/vis-core-engine.md)"'
echo ""
echo "5. Monitor progress:"
echo "   tail -f logs/*.log"
echo ""
