# Phase 1 Research: The Living Foundation

**Status:** Complete
**Date:** 2026-01-21

## Standard Stack

*   **Watcher:** `chokidar` (industry standard for Node.js). Do not use native `fs.watch`.
*   **Database:** `sql.js` (WASM).
    *   *Why:* Zero-dependency, file-based portability, standard SQL queries.
*   **Process Management:** Node.js `child_process.spawn` (detached).
    *   *PID Management:* Write PID to `.planning/intel/gsd-watch.pid`.
*   **Parsing:** Regex-based initially (matching `hooks/gsd-intel-index.js`), with path to upgrade to AST if needed.

## Architecture Patterns

### Sidecar Daemon
1.  **Boot:** Check/Create `graph.db`.
2.  **Watch:** Initialize `chokidar` on root with ignores.
3.  **Loop:** On file change -> Debounce -> Parse -> Update DB.
4.  **Signal:** Handle `SIGTERM`/`SIGINT` to close DB gracefully.

### Shared File Authority (Read-Only CLI)
*   **Daemon:** Writer. Has exclusive write lock (conceptually, or via `sql.js` flush).
*   **CLI:** Reader. Reads the `.db` file.
*   **Conflict:** `sql.js` is in-memory and writes to disk.
    *   *Critical Detail:* `sql.js` does NOT support concurrent access to the *same file on disk* like native SQLite.
    *   *Solution:* The Daemon owns the memory DB and periodically writes to disk. The CLI reads the disk file. The CLI *cannot* write to the graph in this architecture. This matches "Watcher-only updates".

## Don't Hand-Roll

*   **File Watching:** Use `chokidar`. It handles cross-platform weirdness (macOS FSEvents vs Linux inotify).
*   **Debouncing:** Use `lodash.debounce` or similar. Do not write custom timers for file churn.
*   **SQL Queries:** Use standard SQL. Do not write custom graph traversal in JS if SQL Recursive CTEs can do it.

## Common Pitfalls

1.  **`sql.js` Persistence:** It is **NOT** auto-saving. You must explicitly call `.export()` and write the buffer to disk.
    *   *Fix:* Daemon saves on every graph update (or debounced).
2.  **PID Staleness:** Process crashes but PID file remains.
    *   *Fix:* On start, check if PID exists AND if process `kill(pid, 0)` returns true. If not, delete PID and start.
3.  **Ignore Hell:** Watching `node_modules` kills CPU.
    *   *Fix:* Load `.gitignore` AND hardcode `['node_modules', '.git', 'dist', '.planning']`.

## Code Examples

### PID Check
```javascript
function isRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}
```

### sql.js Save
```javascript
const data = db.export();
const buffer = Buffer.from(data);
fs.writeFileSync('graph.db', buffer);
```
