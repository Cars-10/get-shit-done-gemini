## v1 Requirements

### Intelligence & Automation
- [x] **WATCHER-01**: Standalone daemon (`npm run gsd-watch`) using `chokidar` for real-time file monitoring.
- [x] **INTEL-01**: SQLite graph schema (`nodes`, `edges`) implemented via `sql.js` (WASM) for portable graph storage.
- [x] **INTEL-02**: Automatic indexing of JS/TS exports and imports on file save to keep the graph current.
- [x] **INTEL-03**: Incremental "Semantic Purpose" generation for new files using sub-agents.

### Prompt Engineering
- [x] **CONTEXT-01**: Implementation of "Reference Tiers" in the `gsd-planner` to utilize Gemini's massive context window.
- [x] **CONTEXT-02**: Automatic ingestion of relevant subdirectories into the Reference Tier for 1M+ token context.

### Verification (Multimodal)
- [x] **UAT-01**: Support for `checkpoint:visual-verify` in execution plans to enable screenshot-based verification.
- [x] **UAT-02**: Visual comparison logic (Gemini vision) to catch CSS regressions and visual bugs.

### Self-Healing
- [ ] **HEAL-01**: Post-milestone "Retrospective Agent" to analyze git history and update style guides.

### Out of Scope (v2)
- Native Gemini CLI hooks (requires Google support).
- Cloud-hosted indexing service (keeping it local-first).
- Advanced vector embeddings for semantic search (focus on graph first).

## Traceability
*To be populated by roadmap*