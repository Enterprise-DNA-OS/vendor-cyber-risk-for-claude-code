---
description: Add a vendor, evidence record, finding or note from the operator brief.
---

# add

Add a vendor, evidence record, finding or note from the operator brief.

Read CLAUDE.md. Resolve ambiguous names by showing the candidates, never guessing.

```bash
node scripts/risk.mjs add <vendor|evidence|finding|note> --data='<JSON object>' --actor="<operator>"
```

Use --json when composing a report. Read related records before a change. Explain unknowns. Never send a message.
