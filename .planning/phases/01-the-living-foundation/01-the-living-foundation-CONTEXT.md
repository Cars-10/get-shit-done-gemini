# Phase 1: The Living Foundation - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the "Sidecar" architecture with a standalone Watcher Daemon and SQLite graph database. This restores the "Dynamic Intelligence" capability found in the upstream version. 
Includes: Watcher Daemon, SQLite Graph (sql.js), and Auto-indexing logic.

</domain>

<decisions>
## Implementation Decisions

### Daemon Control & Visibility
- **Start Mode:** Detached (background) by default.
- **Auto-Start:** The CLI will automatically start the daemon if it's not running when a command is executed.
- **Stopping:** Managed via PID (checking for a `.pid` file) or manual `kill`.
- **Status Feedback:** CLI will explicitly warn if intelligence is offline (though it will try to auto-start).
- **Logs:** Written to a dedicated log file (e.g., `.gemini/gsd-watch.log`).

### Graph Storage & Authority
- **Persistence:** Local-only `graph.db` (gitignored). No binary commits.
- **Location:** `.planning/intel/graph.db`.
- **Data Authority:** CLI will trust and read the existing `graph.db` even if the daemon is currently offline (stale data is acceptable over no data).
- **Schema Updates:** Use "Nuke and rebuild" strategy for any breaking schema changes.

### Indexing Strategy
- **Scan Mode:** Lazy indexing. Index files as they are modified rather than performing a full aggressive scan on every daemon start.
- **Ignore Strategy:** Strictly respect `.gitignore` and `.geminiignore`, plus hardcoded defaults for `node_modules`, `.git`, etc.
- **Large Files:** Index filename only for large/minified files; skip deep content analysis to preserve performance.

### Communication
- **Method:** Shared file access. Daemon writes to the SQLite DB; CLI reads directly from it. 
- **Liveness:** CLI verifies daemon status via a `.pid` file.

### Gemini's Discretion
- Exact SQLite schema design for the graph.
- Specific threshold for what constitutes a "large file" for indexing.
- Internal IPC/locking mechanisms for the shared SQLite file.

</decisions>

<specifics>
## Specific Ideas

- "I want it to work like a background service that I don't have to manually manage most of the time."
- CLI should feel robust even if the background process has a hiccup (hence trusting the existing DB).

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-the-living-foundation*
*Context gathered: 2026-01-21*
