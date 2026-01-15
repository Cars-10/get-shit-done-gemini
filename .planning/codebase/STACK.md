# Technology Stack

**Analysis Date:** 2026-01-14

## Languages

**Primary:**
- JavaScript (Node.js) - Installer script (`bin/install.js`)
- Markdown - Command definitions, workflows, templates, and reference guides

**Secondary:**
- TOML - Configuration for Gemini commands (`.gemini/commands/gsd/*.toml`)
- XML - Semantic tags within Markdown for structured prompting

## Runtime

**Environment:**
- Node.js >=16.7.0 - Required by `package.json` engines

**Package Manager:**
- npm - Used for project manifest and distribution
- Lockfile: Not detected in root directory

## Frameworks

**Core:**
- None - Zero-dependency meta-prompting system

**Testing:**
- Vitest - Prescribed for projects managed by this system (but not used for the repo itself)

**Build/Dev:**
- None - Logic is interpreted by AI agents (Gemini/Gemini)

## Key Dependencies

**Critical:**
- None - The system relies on Node.js built-ins (`fs`, `path`, `os`, `readline`) to maintain a zero-dependency footprint.

**Infrastructure:**
- git - Required for state management and version control integration
- bash - Required for executing commands and workflows

## Configuration

**Environment:**
- `GEMINI_CONFIG_DIR` - Optional override for installation path
- Configuration also managed via `get-shit-done/templates/config.json`

**Build:**
- `package.json` - Defines entry points and engine requirements

## Platform Requirements

**Development:**
- macOS/Linux/WSL (Darwin detected)
- Node.js >=16.7.0
- Git

**Production:**
- AI Agent environment (Gemini CLI or Gemini CLI)
- Filesystem access for `.planning/` directory management

---

*Stack analysis: 2026-01-14*
*Update after major dependency changes*
