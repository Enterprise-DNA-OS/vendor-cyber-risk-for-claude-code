---
description: Record the human decision after checking assessment blockers.
---

# decide

Record the human decision after checking assessment blockers.

Read CLAUDE.md. Resolve ambiguous names by showing the candidates, never guessing.

```bash
node scripts/risk.mjs decide "<assessment>" --decision=approved --reviewer="<reviewer>" --rationale="<reason>" --next-review=YYYY-MM-DD --actor="<operator>"
```

Use --json when composing a report. Read related records before a change. Explain unknowns. Never send a message. 
The operator must authorise the exact decision in this session. Never infer a reviewer or approver. A recorded name is not an authenticated signature.
