# Move the vendor assessment desk from UpGuard

This moves vendor records and dated rating observations into an owned review desk. It does not reproduce UpGuard's external monitoring, proprietary scores or Trust Exchange network. Keep a monitoring provider if the business needs that service. Enterprise DNA can connect the chosen provider to the owned desk under a separate agreed scope.

## Export

Use UpGuard's [Bulk Export Vendor Information](https://help.upguard.com/en/articles/3764608-how-to-bulk-export-vendor-information), checked 2026-11-13. Its documented fields are name, primary_domain, score and labels. Have the authorised account administrator prepare the export in UpGuard's own environment; no credential belongs in this repository.

The help page's Ruby example writes a header and CSV rows. Quote labels containing commas with a CSV-capable writer; its illustrative join-based code does not safely quote commas. Its curl/jq example writes a stream of JSON arrays despite naming the file .csv. Both correctly quoted CSV and that array stream are accepted here. A raw JSON object containing a vendors array is also accepted and avoids the quoting issue. The importer rejects malformed files rather than guessing columns.

## One command

```bash
node scripts/risk.mjs import upguard --file="vendors.csv" --as-of=2026-11-13 --actor="Your name" --dry-run
```

Use the actual date of the rating export. Review counts, then repeat without --dry-run. No network request is made. Domain is the stable match key, normalised to lowercase. A record without a domain matches on its name, case-insensitively, only among records without domains. Duplicate keys in one file or ambiguous matches stop the whole import. Older rating snapshots cannot overwrite newer ones. Repeated imports update the imported fields without overwriting local ownership, scope, review dates or decisions.

## Mapping

| UpGuard field | Owned record |
|---|---|
| name | Vendor name |
| primary_domain | Normalised primary domain, nullable |
| score | Imported score, nullable and dated by --as-of |
| labels | List of label strings |
| Other fields in raw JSON | Preserved in source_record, not interpreted |

The supplied fixtures are fictional examples of documented shapes, not exports from a customer account. Scores must be whole numbers from 0 to 950. Unknown scores stay unknown. New vendors start pending and unclassified, without an invented owner or approval.

## Reconcile

Compare imported counts, every domain, a sample of names, labels and scores with the original file. Run vendors, rating-freshness and compliance. Review no-domain matches manually. Set the actual service, owner and privacy scope. Keep the original source export privately. Compare the review desk during one real review cycle before retiring the old workflow.

## History outside this export

This four-field export does not contain questionnaire responses, evidence files, assessment decisions, risk waivers, remediation history, audit events or fourth-party links. Archive and map those separately from the exports your account provides. Do not represent the initial vendor import as migration of the whole account. Document the mapping and check counts before importing additional history.

Run `node scripts/risk.mjs export` to write every owned record to CSV and a lossless JSON snapshot. CSV is for analysis; snapshot.json preserves types and decision history. The export is not a database backup or automatic restore. Keep PostgreSQL backups for a shared deployment or copy the embedded data directory only while the application is closed.
