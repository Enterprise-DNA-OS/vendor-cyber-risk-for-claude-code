# Vendor Cyber Risk for Claude Code

Own the vendor review record: security questions, evidence, findings, expiring exceptions and the providers behind your suppliers. Free software under the MIT licence. Built by Enterprise DNA for Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Install the free version below. | Your questions, rules and UpGuard records mapped into your version. [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=upguard&utm_medium=readme). | Installed, connected and operated through Omni by Enterprise DNA. One setup fee, then a retainer. [See the offer](https://enterprisedna.co/omni/instead-of/upguard?utm_source=github&utm_medium=readme&utm_campaign=upguard). |

This is a vendor assessment desk, not a clone of UpGuard's internet scanning or proprietary rating service. It runs without an API account. Imported ratings are dated observations. Keep your monitoring service where that is required.

## Quick start

Node 20 or 22:

```bash
git clone https://github.com/Enterprise-DNA-OS/vendor-cyber-risk-for-claude-code.git
cd vendor-cyber-risk-for-claude-code
npm install
npm test
npm run demo
npm run view
npm run docs
```

The demo has seven fictional vendors, three assessments, five original control questions, three findings, two exceptions and shared provider dependencies. Dates are relative to the seed date. It deliberately includes overdue reviews, stale evidence, expired waivers and unclassified vendors. Re-running seed preserves your changes.

The local PGlite database lives in .data/db. No server is needed. For shared use, set DATABASE_URL to a private PostgreSQL database and run npm run migrate. Seed only a disposable demo database with `npm run seed -- --demo-database`. The owner connection bypasses RLS and must never be exposed to end users. Configure authenticated access, backups and evidence storage before real shared use.

## Your first hour: ten things to ask for

1. "Which reviews are overdue, who owns them and how critical are those vendors?" (`node scripts/risk.mjs reviews-due`)
2. "Which unresolved findings are both overdue and no longer covered by an exception?" (`node scripts/risk.mjs attention`)
3. "Which service providers do several critical vendors depend on?" (`node scripts/risk.mjs concentration`)
4. "Which imported ratings are stale or missing?" (`node scripts/risk.mjs rating-freshness`)
5. "Which suppliers handle personal data without current evidence of safeguards?" (`node scripts/risk.mjs compliance`)
6. "Which overseas arrangements have no recorded disclosure or processing rationale?" (`node scripts/risk.mjs compliance`)
7. "Which assessment answers rely on evidence that has expired?" (`node scripts/risk.mjs questionnaire "Harbour annual review"`)
8. "Which findings are still open but temporarily accepted, and until when?" (`node scripts/risk.mjs waivers`)
9. "What exact evidence and findings supported a past decision?" (`node scripts/risk.mjs decisions`)
10. "What needs the Monday meeting across review dates, risk and shared providers?" (`node scripts/risk.mjs weekly-review`)

These are implemented cross-record questions, not claims that UpGuard can never be configured to answer them. Ask /customise to add a question or a field, and /new-view to turn an answer into a branded report.

## Commands

- `/vendors`: List vendors and their recorded risk position.
- `/card`: Read one vendor with all evidence, assessments, findings and notes.
- `/assessments`: List assessment owners, dates and decisions.
- `/controls`: Read the original five-question assessment checklist.
- `/questionnaire`: Review every answer and its evidence for one assessment.
- `/evidence`: List source references, reviewers and expiry dates.
- `/findings`: Review likelihood, impact and unresolved risks.
- `/waivers`: Review accepted exceptions and their expiry dates.
- `/fourth-parties`: Read the declared providers used by your vendors.
- `/concentration`: Find providers shared by several vendors, including indirect dependencies.
- `/reviews-due`: Prepare the next month of vendor reviews.
- `/rating-freshness`: Find stale imported ratings without treating them as live monitoring.
- `/decisions`: Read frozen assessment decisions and their evidence.
- `/audit`: Read recent record changes and the named operator.
- `/attention`: Triage overdue reviews, findings, expired evidence and expired waivers.
- `/compliance`: Check missing safeguards records and cross-border review evidence with cited sources.
- `/check-assessment`: Show precisely what blocks a decision.
- `/weekly-review`: Prepare the Monday review from attention, reviews-due, concentration and compliance.
- `/add`: Add a vendor, evidence record, finding or note from the operator brief.
- `/set`: Change the scope or review date of a vendor.
- `/open-assessment`: Start a scoped review with a deadline.
- `/answer`: Record a reviewed answer with its evidence reference.
- `/resolve-finding`: Close a finding only with a recorded resolution reference.
- `/waive`: Record an explicitly authorised temporary risk exception.
- `/revoke-waiver`: End a recorded exception without deleting its history.
- `/decide`: Record the human decision after checking assessment blockers.
- `/link`: Add a declared dependency after reading both vendor records.
- `/log`: Keep an operator note against a vendor.
- `/import`: Import the documented UpGuard vendor export with a test run first.
- `/export`: Export every record, including evidence references and decisions.
- `/draft-remediation`: Prepare a vendor remediation request for human review.
- `/draft-weekly-review`: Write the weekly review to the drafts folder.
- `/customise`: add fields or change local policy through a tested forward migration.
- `/new-view`: add a read-only report.

All domain actions use `node scripts/risk.mjs`. Use --json for machine output. Names match case-insensitively and IDs by prefix. Ambiguous matches list candidates and exit unsuccessfully. Writes require --actor. Read the exact syntax with help.

## Decisions that keep their evidence

Approval requires complete answers, current evidence, a recorded service scope and no unwaived high-risk finding. An open finding means a conditional decision. Decisions store an immutable snapshot. Later evidence or waiver changes do not rewrite history. A fresh review requires a new assessment. Actor and reviewer names are recorded attribution, not authenticated signatures.

The five controls are an original checklist. They are not copied from ISO, SIG or any proprietary questionnaire. The compliance command flags missing review evidence against NZ privacy principles 5 and 12 and Australian APPs 8 and 11, with citations. It does not certify compliance or replace the reviewer's judgment. [Rules and source details](docs/compliance.md).

## Paperwork and views

Edit brand.json once for the business name, colours and logo. `npm run docs` renders vendor review packs, draft remediation plans and completed decision records. `npm run view` renders this week's review queue, evidence and exception dates, and shared provider exposure. Both produce escaped, read-only HTML. Draft requests stay in drafts/. Nothing sends or opens a public service.

## Bring the vendor list across

`node scripts/risk.mjs import upguard --file=vendors.csv --as-of=2026-11-13 --actor="Your name" --dry-run`

Replace the date with the export's real date. Inspect the result, then remove --dry-run. CSV, raw vendor JSON and the documented JSON array stream are accepted. The four-field vendor export does not include questionnaire or remediation history. [Exact mapping and reconciliation](docs/replace-upguard.md).

## Why own it

Add your service-specific questions, change the review rules and keep the record without a per-vendor software licence. Database hosting, agent subscriptions, monitoring providers and managed service work have their own costs. [What the free desk does and does not provide](docs/why-no-front-end.md).

## Validation

`npm test` creates a temporary database, migrates and seeds it twice, checks imports, approval gates, immutable decisions, dependency cycles, audit attribution and report output. CI runs on Windows and Linux with Node 20 and 22, plus PostgreSQL 16. Fixtures use fictional .example domains. No live scans, email or vendor API calls occur.

## Licence

MIT. Copyright 2026 Enterprise DNA. Independent software, not affiliated with or endorsed by UpGuard.
