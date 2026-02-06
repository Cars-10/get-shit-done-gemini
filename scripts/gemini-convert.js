const fs = require('fs');
const path = require('path');

// Configuration
const replacements = [
  { from: new RegExp('Claude Code', 'g'), to: 'Gemini CLI' },
  { from: new RegExp('Claude', 'g'), to: 'Gemini' },
  { from: new RegExp('claude-code', 'g'), to: 'gemini-cli' },
  { from: new RegExp('~/.claude', 'g'), to: '~/.gemini' },
  { from: new RegExp('\./\.claude', 'g'), to: './.gemini' },
  { from: new RegExp('--claude', 'g'), to: '--gemini' },
  { from: new RegExp('\.claude(?![a-zA-Z0-9])', 'g'), to: '.gemini' },
  { from: new RegExp('\'claude\'', 'g'), to: '\'gemini\'' },
  { from: new RegExp('CLAUDE_CONFIG_DIR', 'g'), to: 'GEMINI_CONFIG_DIR' },
  { from: new RegExp('CLAUDE\.md', 'g'), to: 'GEMINI.md' },
  { from: new RegExp('get-shit-done-cc', 'g'), to: 'get-shit-done-gemini' },
  { from: new RegExp('claude --dangerously', 'g'), to: 'gemini --dangerously' },
  { from: new RegExp('claudeDir', 'g'), to: 'geminiDir' },
  { from: new RegExp('claudeResult', 'g'), to: 'geminiResult' },
  { from: new RegExp('<solo_developer_claude>', 'g'), to: '<solo_developer_gemini>' },
  { from: new RegExp('</solo_developer_claude>', 'g'), to: '</solo_developer_gemini>' },
  { from: new RegExp('<claude_automates>', 'g'), to: '<gemini_automates>' },
  { from: new RegExp('</claude_automates>', 'g'), to: '</gemini_automates>' },
  { from: new RegExp('<sub>', 'g'), to: '' },
  { from: new RegExp('</sub>', 'g'), to: '' }
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

// 2. TOML Generation for GSD Commands
function generateTomlConfigs() {
  console.log('--- Generating TOML Configurations ---');
  const commandsDir = path.join('commands', 'gsd');

  if (!fs.existsSync(commandsDir)) {
    console.log('commands/gsd directory not found. Skipping TOML generation.');
    return;
  }

  const files = fs.readdirSync(commandsDir);

  files.forEach(file => {
    if (file.endsWith('.md')) {
      const mdPath = path.join(commandsDir, file);
      const tomlPath = path.join(commandsDir, file.replace('.md', '.toml'));

      try {
        const content = fs.readFileSync(mdPath, 'utf8');

        // Parse Frontmatter using RegExp constructor to avoid syntax errors in file writing
        // Matches: Start of file, ---, newlines, content (group 1), newlines, ---, newlines, rest (group 2)
        const frontmatterRegex = new RegExp('^---\s*[\\r\\n]+([\\s\\S]*?)[\\r\\n]+---\s*[\\r\\n]+([\\s\\S]*)$');
        const match = content.match(frontmatterRegex);

        if (match) {
          const frontmatter = match[1];
          const body = match[2].trim();

          // Extract description
          const descMatch = frontmatter.match(new RegExp('description:\s*(.+)'));
          let description = descMatch ? descMatch[1].trim() : 'No description provided';

          // Clean quotes if present - Simplified logic
          if (description.length >= 2) {
            const first = description[0];
            const last = description[description.length - 1];
            if (first === last && (first === '"' || first === "'")) {
              description = description.slice(1, -1);
            }
          }

          // Escape backslashes first, then quotes for TOML
          const safeDescription = description.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

          // Escape backslashes first, then double quotes in body
          const safeBody = body.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

          const tomlContent = `description = "${safeDescription}"\n\nprompt = """
${safeBody}
"""
`;

          fs.writeFileSync(tomlPath, tomlContent);
          // console.log(`Generated: ${tomlPath}`); // reduce noise
        } else {
          console.log(`Skipping ${file}: Invalid frontmatter format`);
        }
      } catch (err) {
        console.error(`Error processing ${file}: ${err.message}`);
      }
    }
  });
  console.log(`Checked/Generated TOML configs in ${commandsDir}`);
}

// 3. Content Replacement
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

      // --- REMOVALS FOR GEMINI CLI COMPATIBILITY ---

      // Remove forceStatusline flag
      content = content.replace(/const forceStatusline = args.includes\('--force-statusline'\);/g, '');

      // Remove cleanupOrphanedHooks (match until verifyInstalled)
      // Use lookahead to stop at verifyInstalled
      content = content.replace(/\/\*\*[\s\S]*?Clean up orphaned hook registrations[\s\S]*?(?=\/\*\*[\s\S]*?Verify a directory)/g, '');

      // Remove readSettings/writeSettings (match until copyWithPathReplacement)
      // These are usually before copyWithPathReplacement in upstream
      // But let's just match the specific function blocks if we can, or just nuke them by name
      content = content.replace(/\/\*\*[\s\S]*?Read and parse settings.json[\s\S]*?return \{\}\;\n\}/g, '');
      content = content.replace(/\/\*\*[\s\S]*?Write settings.json[\s\S]*?function writeSettings\(settingsPath, settings\) \{[\s\S]*?\n\}/g, '');

      // Remove finishInstall (match until handleStatusline or promptLocation)
      // In upstream it's before handleStatusline
      content = content.replace(/\/\*\*[\s\S]*?Apply statusline config[\s\S]*?function finishInstall[\s\S]*?(?=\/\*\*[\s\S]*?Handle statusline)/g, '');

      // Remove handleStatusline (match until promptLocation)
      content = content.replace(/\/\*\*[\s\S]*?Handle statusline configuration[\s\S]*?function handleStatusline[\s\S]*?(?=\/\*\*[\s\S]*?Prompt for install location)/g, '');

      // Remove hooks copying block (explicit match)
      content = content.replace(/\s+\/\* hooks[\s\S]*?failures.push\('hooks'\);\n\s+\}/g, '');

      // Remove settings.json configuration block at the end of install()
      // Matches from "const settingsPath =" to the end of the return statement
      content = content.replace(/const settingsPath = path.join\(geminiDir, 'settings\.json'\);[\s\S]*?return \{ settingsPath, settings, statuslineCommand \};/g, '');

      // Clean up the install function signature/return to be void or simple
      content = content.replace(/return \{ settingsPath, settings, statuslineCommand \};/g, '');

      // Remove calls to handleStatusline/finishInstall in main block
      // Replace complicated logic with simple install() calls
      content = content.replace(/const \{ settingsPath, settings, statuslineCommand \} = install\(true\);[\s\S]*?finishInstall\(settingsPath, settings, statuslineCommand, shouldInstallStatusline\);\n\s+\}\);/g, 'install(true);');
      content = content.replace(/const \{ settingsPath, settings, statuslineCommand \} = install\(false\);[\s\S]*?finishInstall\(settingsPath, settings, statuslineCommand, shouldInstallStatusline\);\n\s+\}\);/g, 'install(false);');
      content = content.replace(/const \{ settingsPath, settings, statuslineCommand \} = install\(isGlobal\);[\s\S]*?finishInstall\(settingsPath, settings, statuslineCommand, shouldInstallStatusline\);\n\s+\}\);/g, 'install(isGlobal);');

      // Remove the non-interactive fallback block inside promptLocation
      content = content.replace(/const \{ settingsPath, settings, statuslineCommand \} = install\(true\);[\s\S]*?finishInstall\(settingsPath, settings, statuslineCommand, shouldInstallStatusline\);\n\s+\}/g, 'install(true);');


      // --- INJECTIONS ---

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

      if (!content.includes("Installed CHANGELOG-gemini.md")) {
        const changelogGeminiBlock =
            "    }\n" +
            "  }\n\n" +
            "  // Copy CHANGELOG-gemini.md\n" +
            "  const changelogGeminiSrc = path.join(src, 'CHANGELOG-gemini.md');\n" +
            "  const changelogGeminiDest = path.join(geminiDir, 'get-shit-done', 'CHANGELOG-gemini.md');\n" +
            "  if (fs.existsSync(changelogGeminiSrc)) {\n" +
            "    fs.copyFileSync(changelogGeminiSrc, changelogGeminiDest);\n" +
            "    if (verifyFileInstalled(changelogGeminiDest, 'CHANGELOG-gemini.md')) {\n" +
            "      console.log(`  ${green}✓${reset} Installed CHANGELOG-gemini.md`);\n" +
            "    } else {\n" +
            "      failures.push('CHANGELOG-gemini.md');\n" +
            "    }\n" +
            "  }";

        // Insert after the CHANGELOG.md block
        // We look for the closing brace of the CHANGELOG.md block
        // The pattern in bin/install.js ends with failures.push('CHANGELOG.md'); } }

        // A more robust anchor: "failures.push('CHANGELOG.md');"
        // followed by closing braces.
        const searchStr = "failures.push('CHANGELOG.md');\n    }\n  }";
        content = content.replace(searchStr, searchStr + "\n" + changelogGeminiBlock);
      }

      // Cleanup any duplicate newlines created by removals
      content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
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
      // Using RegExp constructor for safety
      const isChangeLog = entry.name === 'CHANGELOG.md';
      const isSelf = entry.name.includes('gemini-convert.js');
      if (new RegExp("\\.(md|js|json|toml|txt|svg)$").test(entry.name) && !isSelf && !isChangeLog) {
        processFile(fullPath);
      }
    }
  }
}

// 4. Package.json Updates
function updatePackageJson() {
  const pkgPath = 'package.json';
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    let changed = false;

    if (pkg.name !== 'get-shit-done-gemini') {
      pkg.name = 'get-shit-done-gemini';
      changed = true;
    }
    if (pkg.author !== 'Cars10') {
      pkg.author = 'Cars10';
      pkg.contributors = ['TÂCHES (Original Author)'];
      changed = true;
    }
    // Enforce fork repository URL
    const forkUrl = 'git+https://github.com/Cars-10/get-shit-done-gemini.git';
    if (!pkg.repository || pkg.repository.url !== forkUrl) {
      pkg.repository = {
        type: 'git',
        url: forkUrl
      };
      changed = true;
    }
    // Enforce upstream field
    const upstreamUrl = 'https://github.com/glittercowboy/get-shit-done.git';
    if (pkg.upstream !== upstreamUrl) {
      pkg.upstream = upstreamUrl;
      changed = true;
    }
    // Ensure version has '-g' suffix
    if (!pkg.version.endsWith('-g')) {
      if (pkg.version.endsWith('g')) {
        // Fix old format (1.6.3g -> 1.6.3-g)
        pkg.version = pkg.version.slice(0, -1) + '-g';
      } else {
        pkg.version = pkg.version + '-g';
      }
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
generateTomlConfigs();
updatePackageJson();
walk('.');
console.log('Conversion Complete.');
