---
description: Start a scoped review with a deadline.
---

# open-assessment

Start a scoped review with a deadline.

Read CLAUDE.md. Resolve ambiguous names by showing the candidates, never guessing.

```bash
node scripts/risk.mjs open-assessment "<vendor>" --name="<unique review name>" --scope="<scope>" --due=YYYY-MM-DD --actor="<operator>"
```

Use --json when composing a report. Read related records before a change. Explain unknowns. Never send a message.
