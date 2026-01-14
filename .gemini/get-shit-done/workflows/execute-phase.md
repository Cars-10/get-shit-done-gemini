<purpose>
Execute all plans in a phase using wave-based sequential execution.
</purpose>

<core_principle>
The agent executes plans one by one, respecting dependency waves.
</core_principle>

<required_reading>
Read STATE.md before any operation to load project context.
</required_reading>

<process>

<step name="load_project_state" priority="first">
Before any operation, read project state:

```bash
cat .planning/STATE.md 2>/dev/null
```

**If file exists:** Parse and internalize:
- Current position (phase, plan, status)
- Accumulated decisions (constraints on this execution)
- Deferred issues (context for deviations)
- Blockers/concerns (things to watch for)

**If file missing but .planning/ exists:**
```
STATE.md missing but planning artifacts exist.
Options:
1. Reconstruct from existing artifacts
2. Continue without project state (may lose accumulated context)
```

**If .planning/ doesn't exist:** Error - project not initialized.
</step>

<step name="validate_phase">
Confirm phase exists and has plans:

```bash
PHASE_DIR=$(ls -d .planning/phases/${PHASE_ARG}* 2>/dev/null | head -1)
if [ -z "$PHASE_DIR" ]; then
  echo "ERROR: No phase directory matching '${PHASE_ARG}'"
  exit 1
fi

PLAN_COUNT=$(ls -1 "$PHASE_DIR"/*-PLAN.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$PLAN_COUNT" -eq 0 ]; then
  echo "ERROR: No plans found in $PHASE_DIR"
  exit 1
fi
```

Report: "Found {N} plans in {phase_dir}"
</step>

<step name="discover_plans">
List all plans and extract metadata:

```bash
# Get all plans
ls -1 "$PHASE_DIR"/*-PLAN.md 2>/dev/null | sort

# Get completed plans (have SUMMARY.md)
ls -1 "$PHASE_DIR"/*-SUMMARY.md 2>/dev/null | sort
```

For each plan, read frontmatter to extract:
- `wave: N` - Execution wave (pre-computed)
- `autonomous: true/false` - Whether plan has checkpoints

Build plan inventory:
- Plan path
- Plan ID (e.g., "03-01")
- Wave number
- Autonomous flag
- Completion status (SUMMARY exists = complete)

Skip completed plans. If all complete, report "Phase already executed" and exit.
</step>

<step name="group_by_wave">
Read `wave` from each plan's frontmatter and group by wave number:

```bash
# For each plan, extract wave from frontmatter
for plan in $PHASE_DIR/*-PLAN.md; do
  wave=$(grep "^wave:" "$plan" | cut -d: -f2 | tr -d ' ')
  autonomous=$(grep "^autonomous:" "$plan" | cut -d: -f2 | tr -d ' ')
  echo "$plan:$wave:$autonomous"
done
```

**Group plans:**
```
waves = {
  1: [plan-01, plan-02],
  2: [plan-03, plan-04],
  3: [plan-05]
}
```

**No dependency analysis needed.** Wave numbers are pre-computed during `/gsd:plan-phase`.

Report wave structure to user:
```
Execution Plan:
  Wave 1: 03-01, 03-02
  Wave 2: 03-03 [checkpoint], 03-04
  Wave 3: 03-05

Total: 5 plans in 3 waves
```
</step>

<step name="execute_waves">
Execute each wave in sequence. Within each wave, execute plans sequentially.

**For each wave:**

1. **Identify plans in current wave.**

2. **For each plan in the wave:**
   
   a. **Load Context:**
      - Read the plan file: `@{plan_path}`
      - Read execution workflow: `@./.gemini/get-shit-done/workflows/execute-plan.md`

   b. **Execute Plan:**
      - Follow the instructions in `execute-plan.md` to execute the plan.
      - Perform all tasks.
      - Create commits.
      - Update `STATE.md`.
      - Create `SUMMARY.md`.

   c. **Verify Completion:**
      - Confirm `SUMMARY.md` exists.
      - If failed, ask user whether to continue to next plan or stop.

3. **Proceed to next wave.**

</step>

<step name="aggregate_results">
After all waves complete, aggregate results:

```markdown
## Phase {X}: {Name} Execution Complete

**Waves executed:** {N}
**Plans completed:** {M} of {total}

### Wave Summary

| Wave | Plans | Status |
|------|-------|--------|
| 1 | plan-01, plan-02 | ✓ Complete |
| CP | plan-03 | ✓ Verified |
| 2 | plan-04 | ✓ Complete |
| 3 | plan-05 | ✓ Complete |

### Plan Details

1. **03-01**: [one-liner from SUMMARY.md]
2. **03-02**: [one-liner from SUMMARY.md]
...

### Issues Encountered
[Aggregate from all SUMMARYs, or "None"]
```
</step>

<step name="update_roadmap">
Update ROADMAP.md to reflect phase completion:

```bash
# Mark phase complete
# Update completion date
# Update status
```

Commit roadmap update:
```bash
git add .planning/ROADMAP.md
git commit -m "docs(phase-{X}): complete phase execution"
```
</step>

<step name="offer_next">
Present next steps based on milestone status:

**If more phases remain:**
```
## Next Up

**Phase {X+1}: {Name}** — {Goal}

`/gsd:plan-phase {X+1}`

<sub>`/clear` first for fresh context</sub>
```

**If milestone complete:**
```
MILESTONE COMPLETE!

All {N} phases executed.

`/gsd:complete-milestone`
```
</step>

</process>

<resumption>
**Resuming interrupted execution:**

If phase execution was interrupted (context limit, user exit, error):

1. Run `/gsd:execute-phase {phase}` again
2. discover_plans finds completed SUMMARYs
3. Skips completed plans
4. Resumes from first incomplete plan
5. Continues wave-based execution

**STATE.md tracks:**
- Last completed plan
- Current wave
- Any pending checkpoints
</resumption>