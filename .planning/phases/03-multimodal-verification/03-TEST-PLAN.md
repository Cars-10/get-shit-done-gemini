---
phase: 03-multimodal-verification
plan: TEST
type: execute
autonomous: true
---

<objective>
Smoke test the visual checkpoint protocol.
</objective>

<tasks>
<task type="checkpoint:visual-verify">
  <name>Verify Terminal Setup</name>
  <instruction>Take a screenshot of your terminal window showing the `ls tests/visual` command output.</instruction>
  <slug>terminal-check</slug>
  <verify>Ensure the terminal shows the README.md inside tests/visual.</verify>
</task>
</tasks>
