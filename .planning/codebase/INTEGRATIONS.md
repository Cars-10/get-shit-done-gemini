# External Integrations

**Analysis Date:** 2026-01-14

## APIs & External Services

**AI Agents:**
- Gemini CLI - Primary execution environment for `.md` commands
- Gemini CLI - Secondary execution environment for `.toml` commands

## Data Storage

**Databases:**
- None - State is persisted in local Markdown files

**File Storage:**
- Local Filesystem - All state lives in `.planning/` directory within the target project

## Authentication & Identity

**Auth Provider:**
- None - Inherits permissions from the AI agent's execution context

## Monitoring & Observability

**Error Tracking:**
- AI Agent Logs - Standard output and error streams of the host agent

**Analytics:**
- None

## CI/CD & Deployment

**Hosting:**
- Local Machine - Commands are installed to user's home directory (`~/.gemini/` or `~/.gemini/`)

**CI Pipeline:**
- None detected - Project is currently managed manually

## Environment Configuration

**Development:**
- Local directory structure mirroring installation target (`commands/`, `get-shit-done/`)

**Production:**
- Installed via `bin/install.js` to agent-specific configuration paths

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

---

*Integration audit: 2026-01-14*
*Update when adding/removing external services*
