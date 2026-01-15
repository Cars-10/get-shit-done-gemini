<overview>
GSD supports both single-branch and branch-per-feature workflows. While solo developers often prefer the simplicity of atomic commits on a single branch, team environments or complex projects may benefit from isolated feature branches.
</overview>

<branching_strategies>

### Strategy 1: Atomic Main (Default)
**Best for:** Solo developers, small projects, rapid prototyping.

- All work happens on the `main` (or active) branch.
- Each task produces an atomic commit: `feat(XX-YY): task name`.
- High velocity, zero merge overhead.
- Git history serves as the primary context for Gemini.

### Strategy 2: Branch-per-Phase
**Best for:** Medium projects, features requiring isolation before integration.

- Create a branch for each roadmap phase: `feature/phase-XX-name`.
- Execute all plans for that phase on the branch.
- Merge back to `main` once the phase is complete and verified.

### Strategy 3: Branch-per-Plan
**Best for:** Large projects, experimental features, collaborative environments.

- Create a branch for each specific plan: `feature/XX-YY-name`.
- Execute the plan, then merge back immediately after completion.
- Keeps `main` stable at the cost of more frequent merges.

</branching_strategies>

<implementation_guide>

### Enabling Branching in Plans

To use a branching strategy, specify the branch name in the `PLAN.md` frontmatter:

```yaml
---
phase: 04-authentication
plan: 01
type: execute
branch: feature/04-01-jwt-setup
---
```

### Workflow Integration

When a `branch` is specified in a plan:

1. **Before Execution:**
   - Gemini checks if the branch exists: `git branch --list {branch_name}`.
   - If it doesn't exist, it creates it: `git checkout -b {branch_name}`.
   - If it exists, it switches to it: `git checkout {branch_name}`.

2. **During Execution:**
   - All atomic task commits happen on the feature branch.

3. **After Completion (SUMMARY created):**
   - The final metadata commit happens on the feature branch.
   - Gemini asks the user: "Plan complete on branch {branch_name}. Merge to main now?"
   - If "Yes":
     - `git checkout main`
     - `git merge {branch_name}`
     - `git branch -d {branch_name}` (optional)
   - If "No": Remains on the feature branch for further work or manual merge.

</implementation_guide>

<naming_conventions>

Recommended branch naming:
- `feature/[phase]-[plan]-[description]` (e.g., `feature/04-01-jwt-setup`)
- `fix/[phase]-[plan]-[description]` (e.g., `fix/02-02-auth-loop`)
- `research/[phase]-[description]` (e.g., `research/05-shader-performance`)

</naming_conventions>

<benefits_and_tradeoffs>

| Strategy | Benefits | Tradeoffs |
|----------|----------|-----------|
| **Atomic Main** | Maximum speed, simplest mental model, clear linear history. | `main` can be broken mid-phase, harder to isolate experimental work. |
| **Branching** | `main` stays stable, easy to discard failed experiments, better for multi-agent/parallel work. | Merge overhead, potential for stale branches, more complex history. |

</benefits_and_tradeoffs>
