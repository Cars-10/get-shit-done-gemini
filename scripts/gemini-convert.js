const fs = require('fs');
const path = require('path');

// Configuration
const replacements = [
  { from: new RegExp('Claude Code', 'g'), to: 'Gemini CLI' },
  { from: new RegExp('Claude', 'g'), to: 'Gemini' },
  { from: new RegExp('claude-code', 'g'), to: 'gemini-cli' },
  { from: new RegExp('~/\.claude/', 'g'), to: '~/.gemini/' },
  { from: new RegExp('\./\.claude/', 'g'), to: './.gemini/' },
  { from: new RegExp('\.claude/', 'g'), to: '.gemini/' },
  { from: new RegExp('CLAUDE_CONFIG_DIR', 'g'), to: 'GEMINI_CONFIG_DIR' },
  { from: new RegExp('CLAUDE\.md', 'g'), to: 'GEMINI.md' },
  { from: new RegExp('get-shit-done-cc', 'g'), to: 'get-shit-done-gemini' },
  { from: new RegExp('claude --dangerously', 'g'), to: 'gemini --dangerously' },
  { from: new RegExp('<solo_developer_claude>', 'g'), to: '<solo_developer_gemini>' },
  { from: new RegExp('</solo_developer_claude>', 'g'), to: '</solo_developer_gemini>' },
  { from: new RegExp('<claude_automates>', 'g'), to: '<gemini_automates>' },
  { from: new RegExp('</claude_automates>', 'g'), to: '</gemini_automates>' }
];

const ignoreDirs = ['.git', 'node_modules', '.gemini']; 

// 1. File Structure Normalization
function normalizeStructure() {
  console.log('--- Normalizing Directory Structure ---');
  
  // Move .claude to .gemini if it exists
  if (fs.existsSync('.claude')) {
    console.log('Moving .claude to .gemini...');
    fs.renameSync('.claude', '.gemini');
  }

  // Ensure .gemini exists for temp moves
  if (!fs.existsSync('.gemini')) {
    fs.mkdirSync('.gemini');
  }

  // Handle Rules: .gemini/rules -> ./rules
  const geminiRules = path.join('.gemini', 'rules');
  const rootRules = 'rules';
  if (fs.existsSync(geminiRules)) {
    console.log('Moving rules to root...');
    if (!fs.existsSync(rootRules)) fs.mkdirSync(rootRules);
    copyRecursiveSync(geminiRules, rootRules);
    fs.rmSync(geminiRules, { recursive: true, force: true });
  }

  // Handle Commands: .gemini/commands/gsd/*.toml -> ./commands/gsd/
  const geminiCommands = path.join('.gemini', 'commands', 'gsd');
  const rootCommands = path.join('commands', 'gsd');
  if (fs.existsSync(geminiCommands)) {
    console.log('Moving TOML commands to root...');
    const files = fs.readdirSync(geminiCommands);
    files.forEach(file => {
      if (file.endsWith('.toml')) {
        const src = path.join(geminiCommands, file);
        const dest = path.join(rootCommands, file);
        fs.copyFileSync(src, dest);
        fs.unlinkSync(src);
      }
    });
  }
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 2. Content Replacement
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Apply replacements
    for (const { from, to } of replacements) {
      content = content.replace(from, to);
    }

    // Specific fix for bin/install.js
    if (filePath.endsWith('bin/install.js')) {
      if (!content.includes("entry.name.endsWith('.toml')")) {
        content = content.replace(
          "entry.name.endsWith('.md')",
          "entry.name.endsWith('.md') || entry.name.endsWith('.toml')"
        );
      }
      if (!content.includes("Installed rules")) {
         const rulesInstallBlock = 
  "\n  // Copy rules with path replacement\n" +
  "  const rulesSrc = path.join(src, 'rules');\n" +
  "  const rulesDest = path.join(geminiDir, 'rules');\n" +
  "  if (fs.existsSync(rulesSrc)) {\n" +
  "    copyWithPathReplacement(rulesSrc, rulesDest, pathPrefix);\n" +
  "    console.log(`  ${green}✓${reset} Installed rules`);\n" +
  "  }\n\n" +
  "  // Copy CHANGELOG.md";
  
        content = content.replace('// Copy CHANGELOG.md', rulesInstallBlock);
      }
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoreDirs.includes(entry.name)) {
        walk(fullPath);
      }
    } else if (entry.isFile()) {
       // Filter for text-based files we want to edit
       if (/\.(md|js|json|toml|txt|svg)$/.test(entry.name) && !entry.name.includes('gemini-convert.js')) {
         processFile(fullPath);
       }
    }
  }
}

// 3. Package.json Updates
function updatePackageJson() {
  const pkgPath = 'package.json';
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    let changed = false;

    if (pkg.name !== 'get-shit-done-gemini') {
      pkg.name = 'get-shit-done-gemini';
      changed = true;
    }
    if (pkg.bin && pkg.bin['get-shit-done-cc']) {
      pkg.bin['get-shit-done-gemini'] = pkg.bin['get-shit-done-cc'];
      delete pkg.bin['get-shit-done-cc'];
      changed = true;
    }
    if (!pkg.keywords.includes('gemini')) {
      pkg.keywords = pkg.keywords.filter(k => k !== 'claude' && k !== 'claude-code');
      pkg.keywords.push('gemini', 'gemini-cli');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      console.log('Updated package.json');
    }
  }
}

// Main Execution
console.log('Starting Gemini Conversion...');
normalizeStructure();
updatePackageJson();
walk('.');
console.log('Conversion Complete.');
