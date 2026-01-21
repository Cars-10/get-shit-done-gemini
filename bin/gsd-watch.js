#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const initSqlJs = require('sql.js');

// Configuration
const INTEL_DIR = path.resolve(process.cwd(), '.planning/intel');
const GRAPH_DB_PATH = path.join(INTEL_DIR, 'graph.db');
const PID_FILE = path.join(INTEL_DIR, 'gsd-watch.pid');
const LOG_FILE = path.resolve(process.cwd(), '.gemini/gsd-watch.log');

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
    // Initialize Schema (matching hooks/gsd-intel-index.js)
    db.run(`
      CREATE TABLE IF NOT EXISTS nodes (
        id TEXT PRIMARY KEY,
        type TEXT,
        path TEXT,
        hash TEXT,
        metadata TEXT
      );
      CREATE TABLE IF NOT EXISTS edges (
        source TEXT,
        target TEXT,
        type TEXT,
        metadata TEXT,
        PRIMARY KEY (source, target, type)
      );
    `);
    log('Created new graph DB.');
  }

  const saveDb = debounce(() => {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(GRAPH_DB_PATH, buffer);
    log('Graph saved to disk.');
  }, 1000);

  // Watcher
  const watcher = chokidar.watch('.', {
    ignored: [
      /(^|[\\/])\..*/, // dotfiles
      '**/node_modules/**',
      '**/dist/**',
      '**/.planning/**',
      '**/.gemini/**'
    ],
    persistent: true,
    ignoreInitial: true // Lazy mode
  });

  watcher.on('add', path => processFile(path, db, saveDb));
  watcher.on('change', path => processFile(path, db, saveDb));
  watcher.on('unlink', path => removeFile(path, db, saveDb));

  log('Watching for changes...');

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  function cleanup() {
    log('Stopping...');
    watcher.close();
    fs.unlinkSync(PID_FILE);
    process.exit(0);
  }
}

function processFile(filePath, db, save) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.ts')) return;
  log(`Processing: ${filePath}`);
  // TODO: Add regex parsing logic here (similar to gsd-intel-index.js)
  // For now, just a placeholder to verify architecture
  save();
}

function removeFile(filePath, db, save) {
  log(`Removed: ${filePath}`);
  // TODO: Remove nodes from DB
  save();
}

start().catch(err => {
  log(`Error: ${err.message}`);
  process.exit(1);
});
