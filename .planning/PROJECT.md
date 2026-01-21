# PROJECT: GSD Ultra

**Vision:** The next generation of Get Shit Done (GSD), optimized for Gemini's unique strengths (massive context, multimodal) while restoring the dynamic intelligence features of the original Claude-based system.

## What This Is
GSD Ultra is an evolution of the Gemini Edition that bridges the "automation gap" through a standalone watcher daemon and leverages Gemini's 1M+ token window to provide unprecedented codebase awareness. It transforms GSD from a static toolset into a living development partner.

## Core Value
Restore real-time codebase intelligence and leverage Gemini's massive context to eliminate hallucinations and manual re-indexing.

## Context

### Why
- The current Gemini fork is "static" because it lacks the background hooks of the Claude CLI.
- Gemini's massive context window (1M+ tokens) is currently underutilized by GSD's "small-batch" planning logic.
- UI verification currently lacks visual awareness, despite Gemini being natively multimodal.

### Problem
- Manual `/gsd:analyze-codebase` runs are required whenever the code changes.
- Planning context is often too restricted, leading to missed type definitions or API patterns.
- Verification is limited to text output and human eyes.

## Requirements

### Validated
- ✓ Meta-Prompting Engine — core GSD logic works in Gemini CLI
- ✓ Slash Command Integration — custom commands registered and functional
- ✓ Spec-Driven Development — plan -> execute -> verify workflow
- ✓ Multi-Agent Orchestration — parallel sub-agents for research and planning

### Active
- [ ] **WATCHER-01**: Watcher Daemon (`npm run gsd-watch`) for real-time file indexing
- [ ] **INTEL-01**: SQLite-backed codebase graph (exports, imports, dependencies) using `sql.js`
- [ ] **CONTEXT-01**: Big Context Refactor — distinct Reasoning vs. Reference tiers in prompts
- [ ] **UAT-01**: Multimodal Verification — `checkpoint:visual-verify` using screenshots
- [ ] **HEAL-01**: Self-Healing Conventions — retrospective agents updating style guides

### Out of Scope
- Native Gemini CLI hooks — until Google provides an official plugin/hook API.
- Cloud-hosted indexing — maintaining local-first, zero-external-dependency philosophy.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Standalone Watcher | Restores auto-indexing without needing native CLI hooks. | — Pending |
| SQLite (sql.js) | High-performance graph queries while remaining portable. | — Pending |
| Reference Context Tier | Uses Gemini's 1M token window to prevent hallucinations of internal APIs. | — Pending |

## Last Updated
*Last updated: 2026-01-20 after initialization*
