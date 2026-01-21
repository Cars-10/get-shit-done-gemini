---
name: gsd:retrospective
description: Analyze recent work and update style guide
---

<objective>
Analyze recent git history and project evolution to identify patterns, anti-patterns, and improvements for the `GSD-STYLE.md` guide.
</objective>

<process>
1. **Gather Context**
   - Determine the range of history to analyze (e.g., since last tag or last N commits).
   - Extract relevant commit messages and file changes.

2. **Invoke Retrospective Agent**
   - Spawn `gsd-retrospective-agent`.
   - Provide the gathered history and current `GSD-STYLE.md`.

3. **Apply Updates**
   - The agent will modify `GSD-STYLE.md` directly or propose changes.
   - Review and verify changes.
</process>
