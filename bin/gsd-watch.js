#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
// Use ASM.js version consistent with other modules
const initSqlJs = require('sql.js/dist/sql-asm.js');
const { runSubagent } = require('../lib/intel/subagent-host');

// Configuration
const INTEL_DIR = path.resolve(process.cwd(), '.planning/intel');
const GRAPH_DB_PATH = path.join(INTEL_DIR, 'graph.db');
const PID_FILE = path.join(INTEL_DIR, 'gsd-watch.pid');
const LOG_FILE = path.resolve(process.cwd(), '.gemini/gsd-watch.log');
const INDEXER_SCRIPT = path.resolve(__dirname, '../agents/indexer.js');

// Ensure directories exist
if (!fs.existsSync(INTEL_DIR)) fs.mkdirSync(INTEL_DIR, { recursive: true });
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

function log(msg) {
  const entry = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, entry);
  if (process.env.GSD_DEBUG) console.log(entry.trim());
}

// Simple debounce implementation
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// PID Management
if (fs.existsSync(PID_FILE)) {
  const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'), 10);
  try {
    process.kill(pid, 0);
    console.error(`Daemon already running (PID: ${pid})`);
    process.exit(1);
  } catch (e) {
    log('Stale PID found. removing.');
    fs.unlinkSync(PID_FILE);
  }
}
fs.writeFileSync(PID_FILE, process.pid.toString());

log('Daemon starting...');

async function start() {
  const SQL = await initSqlJs();
  let db;

  if (fs.existsSync(GRAPH_DB_PATH)) {
    const filebuffer = fs.readFileSync(GRAPH_DB_PATH);
    db = new SQL.Database(filebuffer);
    log('Loaded existing graph DB.');
  } else {
    db = new SQL.Database();
    log('Initialized new graph DB (schema will be created by subagent).');
  }

  // Batch Processing
  const processQueue = new Set();
  let isProcessing = false;

  const processBatch = debounce(async () => {
    if (isProcessing) {
      processBatch(); // Re-schedule checks
      return;
    }

    if (processQueue.size === 0) return;

    isProcessing = true;
    const files = [...processQueue];
    processQueue.clear();

    log(`Batch processing ${files.length} files...`);

    const manifestPath = path.join(INTEL_DIR, `batch-${Date.now()}.json`);
    try {
      fs.writeFileSync(manifestPath, JSON.stringify(files));

      // Hand off DB to subagent
      db = await runSubagent(db, GRAPH_DB_PATH, INDEXER_SCRIPT, [manifestPath]);
      
      log(`Batch complete`);
    } catch (e) {
      log(`Subagent failed: ${e.message}`);
      // Recover DB connection manually since runSubagent might have failed
      // (though runSubagent tries to reload, if it rejects, we need to handle here)
      try {
        if (db) { try { db.close(); } catch(e2){} }
        
        if (fs.existsSync(GRAPH_DB_PATH)) {
          const fb = fs.readFileSync(GRAPH_DB_PATH);
          db = new SQL.Database(fb);
        } else {
          db = new SQL.Database();
        }
        log('DB connection recovered.');
      } catch (recErr) {
        log(`CRITICAL: Failed to recover DB: ${recErr.message}`);
        // If we can't recover DB, we might need to exit or restart
        process.exit(1);
      }
    } finally {
      if (fs.existsSync(manifestPath)) fs.unlinkSync(manifestPath);
      isProcessing = false;

      // If more items came in while processing, trigger again
      if (processQueue.size > 0) processBatch();
    }
  }, 1000);

  // Watcher
  const watcher = chokidar.watch('.', {
    ignored: [
      /(^|[\/\\])\../, // dotfiles
      '**/node_modules/**',
      '**/dist/**',
      '**/.planning/**',
      '**/.gemini/**'
    ],
    persistent: true,
    ignoreInitial: false // Scan on start
  });

  watcher.on('add', path => { processQueue.add(path); processBatch(); });
  watcher.on('change', path => { processQueue.add(path); processBatch(); });
  watcher.on('unlink', path => { processQueue.add(path); processBatch(); }); // Indexer handles existence checks
  watcher.on('error', error => log(`Watcher error: ${error}`));

  log('Watching for changes...');

  // Keep process alive
  setInterval(() => {}, 1 << 30);

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  function cleanup() {
    log('Stopping...');
    watcher.close();
    if (db) {
        try {
            const data = db.export();
            fs.writeFileSync(GRAPH_DB_PATH, Buffer.from(data));
            db.close();
        } catch(e) { log(`Save on exit failed: ${e.message}`); }
    }
    fs.unlinkSync(PID_FILE);
    process.exit(0);
  }
}

start().catch(err => {
  log(`Error: ${err.message}`);
  process.exit(1);
});
