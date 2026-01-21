# Roadmap: GSD Ultra

## Phase 1: The Living Foundation (Complete)
**Goal:** Establish the "Sidecar" architecture with a standalone Watcher Daemon and SQLite graph database. This restores the "Dynamic Intelligence" capability found in the upstream Claude version.

**Requirements:**
- WATCHER-01 (Daemon)
- INTEL-01 (SQLite Graph)
- INTEL-02 (Auto-indexing)

**Success Criteria:**
1. `npm run gsd-watch` starts a persistent daemon.
2. Modifying a `.ts` file automatically updates `.planning/intel/graph.db`.
3. CLI commands can read the graph without locking issues.

## Phase 2: Massive Context Intelligence (Complete)
**Goal:** Upgrade the `gsd-planner` to leverage the new Intelligence Graph and Gemini's 1M+ token window.

**Plans:**
- [x] 02-01-PLAN.md — Context Engine Core
- [x] 02-02-PLAN.md — Orchestrator Integration
- [x] 02-03-PLAN.md — Intelligence Polish

**Requirements:**
- CONTEXT-01 (Reference Tiers)
- CONTEXT-02 (Auto-ingestion)
- INTEL-03 (Semantic Purpose)

**Success Criteria:**
1. Planner prompts include "Reference Context" containing full directory listings and relevant file contents.
2. Plans reference internal APIs correctly without manual research steps.
3. "Semantic Purpose" descriptions are generated for new files.

## Phase 3: Multimodal Verification (Complete)
**Goal:** Enable visual verification of UI tasks using Gemini's native vision capabilities.

**Requirements:**
- UAT-01 (Visual Checkpoints)
- UAT-02 (Visual Comparison Logic)

**Success Criteria:**
1. `PLAN.md` can specify `<task type="checkpoint:visual-verify">`.
2. Executor prompts user for a screenshot.
3. Gemini correctly identifies visual discrepancies against requirements.

## Phase 4: Self-Healing & Polish (Complete)
**Goal:** Close the loop by enabling the system to learn from its own execution history.

**Requirements:**
- HEAL-01 (Retrospective Agent)

**Success Criteria:**
1. Post-milestone command runs a retrospective.
2. `GSD-STYLE.md` is updated with at least one new convention based on observed errors.
