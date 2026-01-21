const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js/dist/sql-asm.js');

class ReferenceContextBuilder {
  constructor(dbPath) {
    this.dbPath = dbPath || path.join(process.cwd(), '.planning', 'intel', 'graph.db');
    this.db = null;
    // Token budget soft limit
    this.tokenBudget = 500000;
  }

  /**
   * Initialize the database connection
   */
  async init() {
    const SQL = await initSqlJs();
    
    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
      this.hasData = true;
    } else {
      // If DB doesn't exist, we can't do much. 
      // Initialize empty just to prevent crashes, but warn.
      this.db = new SQL.Database();
      this.hasData = false;
      console.warn(`Warning: Graph database not found at ${this.dbPath}. Context will be empty.`);
    }
  }

  /**
   * Estimate token count (heuristic: ~3.5 chars per token)
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 3.5);
  }

  /**
   * Get recursive dependencies using CTE
   * Tier 1: Direct imports
   * Tier 2: Imports of imports
   */
  getDependencies(targetFile, maxDepth = 2) {
    if (!this.db || !this.hasData) return [];

    const stmt = this.db.prepare(`
      WITH RECURSIVE deps(source, target, depth) AS (
        -- Base case: Direct imports (Tier 1)
        SELECT source, target, 1 
        FROM edges 
        WHERE source = :targetFile AND relationship = 'depends_on'
        
        UNION
        
        -- Recursive step: Imports of imports
        SELECT e.source, e.target, d.depth + 1
        FROM edges e
        JOIN deps d ON e.source = d.target
        WHERE d.depth < :maxDepth AND e.relationship = 'depends_on'
      )
      SELECT DISTINCT target, depth FROM deps ORDER BY depth, target;
    `);

    // Target file needs to be converted to ID format used in DB (slug)
    // The hook uses 'src-lib-db' format.
    // Wait, the hook stores `source` and `target` as IDs (slugs).
    // But `nodes` table has `path` in the JSON body.
    // I need to resolve `targetFile` path to an ID first.

    // Let's look up the ID for the file path.
    const lookupStmt = this.db.prepare(`
        SELECT id FROM nodes 
        WHERE json_extract(body, '$.path') = :filePath
        OR json_extract(body, '$.path') = :absPath
    `);
    
    const absPath = path.resolve(targetFile);
    lookupStmt.bind({ ':filePath': targetFile, ':absPath': absPath });
    
    let entityId = null;
    if (lookupStmt.step()) {
        entityId = lookupStmt.getAsObject().id;
    }
    lookupStmt.free();

    if (!entityId) {
        // Fallback: try to generate slug manually if not found (might match)
        entityId = this.generateSlug(targetFile);
    }

    const results = [];
    stmt.bind({ ':targetFile': entityId, ':maxDepth': maxDepth });
    
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();

    return results; // [{ target: 'slug', depth: 1 }, ...]
  }

  /**
   * Generate slug from file path (matching hook logic)
   */
  generateSlug(filePath) {
    return filePath
      .replace(/^\/+/, '')           // Remove leading slashes
      .replace(/\.[^.]+$/, '')       // Remove extension
      .replace(/[\/\\]/g, '-')       // Replace path separators with hyphens
      .replace(/[^a-zA-Z0-9-]/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/-+/g, '-')           // Collapse multiple hyphens
      .replace(/^-|-$/g, '')         // Remove leading/trailing hyphens
      .toLowerCase();
  }

  /**
   * Resolve entity ID to file path
   */
  resolvePath(entityId) {
    if (!this.db) return null;
    
    const stmt = this.db.prepare(`
      SELECT json_extract(body, '$.path') as path 
      FROM nodes WHERE id = :id
    `);
    stmt.bind({ ':id': entityId });
    
    let filePath = null;
    if (stmt.step()) {
      filePath = stmt.getAsObject().path;
    }
    stmt.free();
    
    return filePath;
  }

  /**
   * Build the XML context string
   */
  async buildContext(targetFile) {
    if (!this.db) await this.init();

    // 1. Get Dependencies
    const dependencies = this.getDependencies(targetFile);
    
    // 2. Collect files (Target + Deps)
    const filesToRead = [
        { path: targetFile, depth: 0, id: 'target' } // Target
    ];

    for (const dep of dependencies) {
        const depPath = this.resolvePath(dep.target);
        if (depPath) {
            filesToRead.push({ path: depPath, depth: dep.depth, id: dep.target });
        }
    }

    // 3. Read content and format
    let output = '<reference_context>\n';
    let currentTokens = 0;

    for (const file of filesToRead) {
        try {
            // Resolve relative to cwd
            // If path is absolute, use as is. If relative, join with cwd.
            // The DB stores what was passed to it. Usually relative or absolute.
            // fs.readFileSync handles both if correct.
            
            // Check existence
            if (!fs.existsSync(file.path)) continue;

            const content = fs.readFileSync(file.path, 'utf8');
            const fileTokens = this.estimateTokens(content);
            
            // Budget check
            if (currentTokens + fileTokens > this.tokenBudget) {
                // If we hit the limit, maybe just skip or truncate?
                // Research says "summarize Tier 2 if needed".
                // For now, strict cutoff or just include what fits.
                // We'll prioritize Tier 1 (depth 1) over Tier 2.
                // filesToRead is ordered by depth (0, then 1, then 2).
                // So we just stop if full.
                if (file.depth === 0) {
                    // Always include target, even if huge (maybe truncate?)
                    // Passing through for now.
                } else {
                    console.warn(`Skipping ${file.path} (depth ${file.depth}) due to token budget.`);
                    continue; 
                }
            }

            output += `  <file path="${file.path}" depth="${file.depth}">\n`;
            output += `<![CDATA[\n${content}\n]]>\n`;
            output += `  </file>\n`;
            
            currentTokens += fileTokens;

        } catch (e) {
            console.error(`Error reading ${file.path}: ${e.message}`);
        }
    }

    output += '</reference_context>';
    return output;
  }
}

module.exports = ReferenceContextBuilder;
