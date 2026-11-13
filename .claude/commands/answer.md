---
description: Record a reviewed answer with its evidence reference.
---

# answer

Record a reviewed answer with its evidence reference.

Read CLAUDE.md. Resolve ambiguous names by showing the candidates, never guessing.

```bash
node scripts/risk.mjs answer "<assessment>" <control-code> --answer=yes --note="<review rationale>" --evidence="<evidence name>" --actor="<operator>"
```

Use --json when composing a report. Read related records before a change. Explain unknowns. Never send a message. 
Read the evidence yourself before recording yes. For no, record the deficiency and add a finding. For na, record why the question does not apply.
