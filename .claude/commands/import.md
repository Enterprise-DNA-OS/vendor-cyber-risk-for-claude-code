---
description: Import the documented UpGuard vendor export with a test run first.
---

# import

Import the documented UpGuard vendor export with a test run first.

Read CLAUDE.md. Resolve ambiguous names by showing the candidates, never guessing.

```bash
node scripts/risk.mjs import upguard --file="<export.csv>" --as-of=YYYY-MM-DD --dry-run --actor="<operator>"
```

Use --json when composing a report. Read related records before a change. Explain unknowns. Never send a message. 
Read docs/replace-upguard.md. Check counts and sample rows in the dry run, then repeat without --dry-run. Keep the export date; never label an old rating as current.
