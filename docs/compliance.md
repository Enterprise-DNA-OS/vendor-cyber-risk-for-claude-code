# Vendor review rules and sources
Checked 2026-11-13. These are record-completeness checks for a human reviewer. A missing record is not a finding that a business broke the law. A passing check is not proof of compliance, vendor security, certification or suitability. This desk does not carry out regulated certification, make legal decisions or issue breach notifications.

## New Zealand
NZ_SECURITY flags a personal-data vendor with NZ scope when no currently valid, verified safeguards evidence is recorded. [Privacy Act principle 5](https://www.privacy.org.nz/privacy-principles/5/) requires reasonable security safeguards and reasonable steps to prevent service providers misusing or disclosing information. The law does not prescribe our checklist or evidence expiry dates.

NZ_TRANSFER flags an unknown transfer classification or an overseas processor/disclosure without a reviewed basis. [Principle 12](https://www.privacy.org.nz/privacy-principles/12/) concerns disclosure to foreign persons or entities and permits several legal bases. [The Commissioner's decision tree](https://www.privacy.org.nz/responsibilities/disclosing-personal-information-outside-new-zealand/decision-tree-page/) distinguishes an agent processing solely for the agency from a disclosure. Record the actual arrangement and rationale. Overseas hosting alone is not automatically a disclosure.

## Australia
AU_SECURITY applies the same evidence-completeness check for vendors marked AU or both. [APP 11 guidance](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information) describes reasonable protective steps for APP entities. The reviewer determines whether the organisation is an APP entity and which information falls within scope.

AU_TRANSFER asks for a reviewed classification and basis. [APP 8 guidance](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-8-app-8-cross-border-disclosure-of-personal-information) covers reasonable steps before overseas disclosure, accountability and exceptions. Processing under effective control can be use rather than disclosure. The command does not decide this from country alone.

## Local review policy

These defaults are business policy, not statutory thresholds:
- Assign an owner, service description, criticality, personal-data scope and privacy regime before approval.
- Answer all five controls. Positive answers require current, verified evidence. Not applicable requires a rationale. Negative answers block approval until remedied.
- Likelihood and impact each range from 1 to 5. Their product is an internal priority score. It is not an UpGuard security rating or a probability of loss.
- An open finding scoring 12 or more blocks a decision unless a current waiver names an approver and compensating control. Waivers remain valid through their expiry date. Expired or revoked waivers do not suppress a finding.
- Any remaining open finding means a conditional decision, even when waived. Full approval requires none. Rejection can record an incomplete review honestly.
- Decisions freeze their vendor context, questionnaire, evidence metadata, findings, waivers and immediate dependencies. Reopen as a new assessment; never rewrite the decision.
- A review due today is due, not overdue. The queue looks ahead 30 calendar days. Ratings older than 30 days are labelled stale. Neither interval is a legal deadline.
- Evidence validity is inclusive of its expiry date. A reviewer verifies the document and chooses an appropriate date. The application does not inspect or validate the document's claims.

The local database audit is append-only for normal writes, but a database owner can alter the schema. It is not an externally notarised audit trail. Identity, backups, encryption, access policy and off-site evidence retention must be set for the real business.
