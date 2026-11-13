---
description: Record an explicitly authorised temporary risk exception.
---

# waive

Record an explicitly authorised temporary risk exception.

Read CLAUDE.md. Resolve ambiguous names by showing the candidates, never guessing.

```bash
node scripts/risk.mjs waive "<finding>" --until=YYYY-MM-DD --reason="<compensating control>" --approver="<named decision maker>" --actor="<operator>"
```

Use --json when composing a report. Read related records before a change. Explain unknowns. Never send a message. 
The operator must authorise the exact decision in this session. Never infer a reviewer or approver. A recorded name is not an authenticated signature.
