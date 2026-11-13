# Vendor Cyber Risk for Claude Code

For an owner, security lead or operations manager who reviews suppliers handling business or personal data. Set your business name in brand.json. Demo records are fictional.

## Operating rules

Read from the CLI before answering. Never invent a supplier fact, current rating, certificate, reviewer or legal conclusion. Read evidence before recording a positive answer. Say unknown when records are missing.

Use `node scripts/risk.mjs help` for syntax. Mutations require `--actor` supplied by the operator. This records attribution, not authentication. A shared deployment needs separate access controls and an authenticated operator identity. RLS blocks public access by default; use a private owner connection and never expose it to a browser.

Risk decisions and waivers need the operator's explicit instruction. Never send messages, scan domains, fetch evidence URLs, delete history, or publish reports from this repository. Drafts stay in drafts/. Retire a vendor instead of deleting it. Keep evidence in an access-controlled store; the database records references, not the files.

The five-question checklist is ours, not a licensed questionnaire or a certification standard. Review and adapt it to the service. A positive answer does not certify a vendor. The compliance command flags missing review records against cited obligations; a human assesses applicability and adequacy.

## Routing

- /vendors: List vendors and their recorded risk position.
- /card: Read one vendor with all evidence, assessments, findings and notes.
- /assessments: List assessment owners, dates and decisions.
- /controls: Read the original five-question assessment checklist.
- /questionnaire: Review every answer and its evidence for one assessment.
- /evidence: List source references, reviewers and expiry dates.
- /findings: Review likelihood, impact and unresolved risks.
- /waivers: Review accepted exceptions and their expiry dates.
- /fourth-parties: Read the declared providers used by your vendors.
- /concentration: Find providers shared by several vendors, including indirect dependencies.
- /reviews-due: Prepare the next month of vendor reviews.
- /rating-freshness: Find stale imported ratings without treating them as live monitoring.
- /decisions: Read frozen assessment decisions and their evidence.
- /audit: Read recent record changes and the named operator.
- /attention: Triage overdue reviews, findings, expired evidence and expired waivers.
- /compliance: Check missing safeguards records and cross-border review evidence with cited sources.
- /check-assessment: Show precisely what blocks a decision.
- /weekly-review: Prepare the Monday review from attention, reviews-due, concentration and compliance.
- /add: Add a vendor, evidence record, finding or note from the operator brief.
- /set: Change the scope or review date of a vendor.
- /open-assessment: Start a scoped review with a deadline.
- /answer: Record a reviewed answer with its evidence reference.
- /resolve-finding: Close a finding only with a recorded resolution reference.
- /waive: Record an explicitly authorised temporary risk exception.
- /revoke-waiver: End a recorded exception without deleting its history.
- /decide: Record the human decision after checking assessment blockers.
- /link: Add a declared dependency after reading both vendor records.
- /log: Keep an operator note against a vendor.
- /import: Import the documented UpGuard vendor export with a test run first.
- /export: Export every record, including evidence references and decisions.
- /draft-remediation: Prepare a vendor remediation request for human review.
- /draft-weekly-review: Write the weekly review to the drafts folder.
- /customise: author and test a migration for the requested change.
- /new-view: add a read-only branded report.

## Locations

scripts/risk.mjs is the sole domain CLI. scripts/lib/db.mjs chooses embedded PGlite or DATABASE_URL. supabase/migrations holds forward migrations. docs/compliance.md defines rules and limits. docs/replace-upguard.md defines the exact import contract. README.md holds setup instructions. AGENTS.md points every agent here.
