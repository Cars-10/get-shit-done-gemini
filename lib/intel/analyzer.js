/**
 * Pure analysis logic for JS/TS code.
 * Decoupled from file system and database for subagent use.
 */

/**
 * Extract import sources from file content
 * Returns array of import source paths (e.g., 'react', './utils', '@org/pkg')
 */
function extractImports(content) {
  const imports = new Set();

  // ES6 imports: import { x } from 'y', import x from 'y', import * as x from 'y'
  const es6Named = /import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'":]+)['"]/g;
  let match;
  while ((match = es6Named.exec(content)) !== null) {
    imports.add(match[1]);
  }

  // ES6 side-effect imports: import 'y'
  const es6SideEffect = /import\s+['"]([^'":]+)['"]/g;
  while ((match = es6SideEffect.exec(content)) !== null) {
    // Avoid matching 'from' part of previous pattern
    if (!content.slice(Math.max(0, match.index - 10), match.index).includes('from')) {
      imports.add(match[1]);
    }
  }

  // CommonJS: require('y')
  const cjs = /require\s*\(\s*['"]([^'":]+)['"]\s*\)/g;
  while ((match = cjs.exec(content)) !== null) {
    imports.add(match[1]);
  }

  return Array.from(imports);
}

/**
 * Extract exported symbol names from file content
 * Returns array of export names (e.g., 'functionA', 'ClassB', 'default')
 */
function extractExports(content) {
  const exports = new Set();

  // Named exports: export { x, y, z }
  const namedExport = /export\s*\{([^}]+)\}/g;
  let match;
  while ((match = namedExport.exec(content)) !== null) {
    const names = match[1].split(',').map(n => {
      // Handle "x as y" syntax - export the alias
      const parts = n.trim().split(/\s+as\s+/);
      return parts[parts.length - 1].trim();
    }).filter(n => n);
    names.forEach(n => exports.add(n));
  }

  // Declaration exports: export const|let|var|function|async function|class
  const declExport = /export\s+(?:default\s+)?(?:async\s+)?(?:const|let|var|function|class)\s+(\w+)/g;
  while ((match = declExport.exec(content)) !== null) {
    exports.add(match[1]);
  }

  // Default exports
  if (/export\s+default/.test(content)) {
    exports.add('default');
  }

  // CommonJS exports
  if (/module\.exports\s*=/.test(content)) {
    exports.add('default'); // simplified
  }

  return Array.from(exports);
}

/**
 * Generate analysis entities from source code.
 * @param {string} source - File content.
 * @param {string} filePath - File path (for ID generation).
 * @returns {Object} Structured entity data.
 */
function generateEntities(source, filePath) {
  const imports = extractImports(source);
  const exports = extractExports(source);
  
  // Normalize ID (lowercase, forward slashes)
  // This must match how the graph DB expects IDs
  // We use the file path as the ID for file-level entities
  const id = filePath.toLowerCase().replace(/\\/g, '/').replace(/^\.\//, '');

  return {
    id,
    path: filePath,
    type: 'file',
    imports,
    exports
  };
}

module.exports = { generateEntities, extractImports, extractExports };
