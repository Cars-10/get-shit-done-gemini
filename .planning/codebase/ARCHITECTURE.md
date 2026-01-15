# Architecture

**Analysis Date:** 2026-01-14

## Pattern Overview

**Overall:** Meta-Prompting / Command-Driven System

**Key Characteristics:**
- Logic encapsulated in Markdown/TOML prompts
- Stateless execution with file-based persistence
- Parallel orchestration of specialized agents
- Self-documenting and evolutionary

## Layers

**Command Layer:**
- Purpose: Entry point for user interactions within the AI agent
- Contains: `gsd:` commands defined in `commands/gsd/` and `.gemini/commands/gsd/`
- Depends on: Workflow layer
- Used by: AI Agent (Gemini/Gemini)

**Workflow Layer:**
- Purpose: Multi-step procedures and complex logic
- Contains: `get-shit-done/workflows/*.md`
- Depends on: Reference layer, Template layer
- Used by: Command layer

**Template Layer:**
- Purpose: Structural definitions for state files
- Contains: `get-shit-done/templates/*.md`
- Used by: Workflow layer to generate project artifacts

**Reference Layer:**
- Purpose: Philosophy, principles, and style guides
- Contains: `get-shit-done/references/*.md`, `GSD-STYLE.md`
- Used by: All layers for context and behavior guidance

## Data Flow

**Command Execution:**

1. User invokes `/gsd:command`
2. Agent reads command definition (`commands/gsd/command.md`)
3. Command references workflows (`get-shit-done/workflows/`)
4. Workflows read/write state in `.planning/`
5. Results are committed to Git
6. Agent presents status and next steps

**State Management:**
- Persistent state stored in `.planning/PROJECT.md`, `ROADMAP.md`, `STATE.md`, etc.
- Synchronous updates to filesystem during workflow execution

## Key Abstractions

**Phase:**
- Purpose: High-level milestone containing multiple plans
- Pattern: Documented in `ROADMAP.md`

**Plan:**
- Purpose: Specific execution unit for a sub-agent
- Examples: `PLAN-001.md`
- Pattern: Hypotheses, Tasks, and Verification

**Explore Agent:**
- Purpose: Parallel analysis of codebase or problems
- Examples: Used in `map-codebase.md`

## Entry Points

**Installer:**
- Location: `bin/install.js`
- Triggers: `npx .` or direct execution
- Responsibilities: Copying files to agent config directories with path mapping

**AI Command:**
- Location: `/gsd:<command>`
- Triggers: User input in AI CLI
- Responsibilities: Initiating GSD workflows

## Error Handling

**Strategy:** Bubbling to user via AI agent's natural language feedback

**Patterns:**
- Exit codes in shell commands
- Descriptive error messages in workflow steps

## Cross-Cutting Concerns

**Logging:**
- State summaries logged to `.planning/STATE.md`
- Phase history logged to `agent-history.md` templates

**Style:**
- Strictly enforced via `GSD-STYLE.md`

---

*Architecture analysis: 2026-01-14*
*Update when major patterns change*
