# /cpt:init - Initialize Parallel Development

When the user runs /cpt:init, perform the following initialization process:

## Step 1: Project Detection

Analyze the current project state:

1. **Check for existing configuration:**
   - Does CLAUDE.md exist? If yes, read it and note existing instructions
   - Does .claude/ directory exist? Note existing commands/skills
   - Is this a git repository? Check git status
   - Is this a bare repo setup already? (check for .bare/ or worktree structure)

2. **Detect project type:**
   - Check for package.json (Node.js)
   - Check for pyproject.toml, setup.py, requirements.txt (Python)
   - Check for go.mod (Go)
   - Check for Cargo.toml (Rust)
   - Check for pom.xml, build.gradle (Java)
   - Check for Gemfile (Ruby)
   - Check for other indicators

3. **Analyze project structure:**
   - Identify source directories (src/, lib/, app/, etc.)
   - Identify test directories (test/, tests/, __tests__/, spec/)
   - Identify config files
   - Identify documentation
   - Note the overall architecture pattern (monolith, monorepo, microservices)

4. **Check for existing tooling:**
   - CI/CD configuration (.github/workflows/, .gitlab-ci.yml, etc.)
   - Linting/formatting configs (eslint, prettier, ruff, etc.)
   - Build tools (webpack, vite, esbuild, etc.)
   - Test frameworks

5. **Check for recommended Claude Code plugins:**
   - Run: `claude plugin list 2>/dev/null | grep -q "ralph-wiggum"`
   - If ralph-wiggum not found, display warning:
     ```
     ⚠️  Recommended: Install ralph-wiggum plugin for better autonomous agents
        Run: claude plugin add ralph-wiggum
     ```

## Step 2: Ask Clarifying Questions

Based on detection, ask the user:

1. **If CLAUDE.md exists:**
   - "I found an existing CLAUDE.md. Should I merge parallel development instructions into it, or replace it?"

2. **Project context:**
   - "What is this project? (brief description)"
   - "What are the main areas/modules of this codebase?"

3. **Development workflow:**
   - "How do you typically run tests?" (if not auto-detected)
   - "How do you build/compile the project?" (if not auto-detected)
   - "Any specific coding conventions I should follow?"

4. **Parallelization goals:**
   - "What kind of tasks do you want to parallelize?"
     - [ ] Feature development
     - [ ] Bug fixes
     - [ ] Refactoring
     - [ ] Testing
     - [ ] Documentation
     - [ ] All of the above

## Step 3: Generate Project-Specific CLAUDE.md

Create or update CLAUDE.md with:

1. **Project overview** (from user input and detection)
2. **Build/test commands** (detected + confirmed)
3. **Architecture notes** (detected patterns)
4. **Parallel development protocol** (from base template)
5. **Project-specific task patterns** (what makes sense to parallelize)

## Step 4: Scope Mapping

Create a scope map for parallel task assignment:

1. **Identify independent modules:**
   - Map each source directory to its purpose
   - Note dependencies between modules
   - Identify shared files that should NEVER be modified by parallel agents

2. **Define scope boundaries:**
   ```
   Scope Map:
   ────────────────────
   src/auth/        → Authentication logic
   src/api/         → API endpoints
   src/ui/          → Frontend components
   src/db/          → Database layer
   tests/           → Test files (scope by feature)

   FORBIDDEN (shared files):
   - package.json, package-lock.json
   - tsconfig.json, .eslintrc
   - Any root config files
   - Database migrations (serialize these)
   ```

3. **Scope validation rules:**
   - Each parallel task MUST have an assigned scope
   - Scopes MUST NOT overlap between parallel agents
   - If a task requires multiple scopes, it should NOT be parallelized
   - Shared config changes must be queued for post-merge

## Step 5: Check for Existing Plan

Check if a persistent plan already exists:

```bash
if [[ -f ".claude/parallel-plan.json" ]]; then
    echo "Found existing plan:"
    .claude/skills/parallel-executor/plan.sh status
fi
```

If an active plan exists, ask: "Continue with existing plan, or create a new one?"

## Step 6: Offer Plan Creation from Detected Work

If GitHub issues, TODOs, or other work items were detected, offer to create a plan:

```
────────────────────────────────────────
📋 Detected Work Items
────────────────────────────────────────
GitHub Issues (parallelizable):
  - #42: Add OAuth support         → src/auth/
  - #33: Add dark mode             → src/ui/

TODOs in code:
  - TODO: Add caching layer        → src/cache/
  - FIXME: Memory leak in parser   → src/parser/

Would you like to create a persistent plan from these items?
This allows you to:
  • Track progress across sessions/machines
  • Run /cpt:continue to spawn agents
  • See status with /cpt:plan-status
```

**On confirmation:**
```bash
source .claude/skills/parallel-executor/plan.sh
plan_init "Project work from initialization"
# Add detected items as tasks...
```

## Step 7: Enter Plan Mode

After initialization, automatically enter plan mode to:

1. Present a summary of the project analysis
2. Show the scope map for parallel development
3. Identify potential areas for parallel development
4. Show existing plan status (if any)
5. Suggest an initial task breakdown if the user has a goal in mind
6. Wait for user approval before any implementation

## Output Format

```
═══════════════════════════════════════════════════════════════
                    Parallel Development Init
═══════════════════════════════════════════════════════════════

📁 Project Detection
────────────────────
Type: [detected type]
Root: [project root]
Git: [yes/no, branch info]
Existing CLAUDE.md: [yes/no]

📦 Detected Stack
────────────────────
Language: [detected]
Framework: [detected]
Build: [command]
Test: [command]
Lint: [command]

🔌 Plugins
────────────────────
ralph-wiggum: [installed/not installed]
  (If not installed, show recommendation)

🏗️ Architecture
────────────────────
Pattern: [monolith/monorepo/etc]
Main directories:
  - src/: [description]
  - tests/: [description]
  ...

🎯 Scope Map (for parallel agents)
────────────────────
Available scopes:
  - src/auth/**     → Authentication
  - src/api/**      → API endpoints
  - src/ui/**       → UI components
  ...

Forbidden files (no parallel modification):
  - package.json, tsconfig.json, etc.

📋 Existing Plan
────────────────────
[If .claude/parallel-plan.json exists, show status:]
  Plan: plan_20260114_abc123
  Goal: Build authentication system
  Progress: 2/5 tasks merged
  Ready to continue: 2 tasks

[If no plan exists:]
  No persistent plan found.
  Use /cpt:quick "goal" or let me create one from detected work.

📝 Detected Work Items
────────────────────
GitHub Issues: 5 open (3 parallelizable)
TODOs: 12 found
FIXMEs: 3 found

❓ Questions
────────────────────
[Ask clarifying questions here]
```

After gathering information, proceed to generate CLAUDE.md and enter plan mode.
