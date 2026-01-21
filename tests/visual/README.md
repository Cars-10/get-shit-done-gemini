# Visual Verification Assets

This directory stores screenshot artifacts for `checkpoint:visual-verify` tasks.

## Naming Convention

```
{phase}-{plan}-{slug}.png
```

Example: `03-01-terminal-check.png`

## How to Capture

1. Resize window to be reasonably small/focused.
2. Clean up clutter.
3. Take a window-scoped screenshot.
4. Save to this directory with the exact name requested by the agent.

## Git Tracking

- `*.png` are ignored by default to prevent repo bloat.
- `*-golden.png` are exceptions and SHOULD be committed as reference images.
