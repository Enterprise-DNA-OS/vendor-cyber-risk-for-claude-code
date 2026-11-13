---
description: Prepare a vendor remediation request for human review.
---

# draft-remediation

Prepare a vendor remediation request for human review.

Read CLAUDE.md. Resolve ambiguous names by showing the candidates, never guessing.

```bash
node scripts/risk.mjs draft-remediation "<vendor>"
```

Use --json when composing a report. Read related records before a change. Explain unknowns. Never send a message.
