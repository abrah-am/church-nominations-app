# Product Decisions

This is the register for product-wide questions that block final acceptance or production readiness. A decision remains **Open** until the Product Owner records an outcome. Story-specific implementation decisions remain in their requirements documents. Approved policies are recorded in the relevant story requirements and technical docs; this register does not silently resolve them.

| ID | Decision needed | Affected stories | Status |
| --- | --- | --- | --- |
| PD-001 | Select production administrator identity provider and define verification, account lifecycle, recovery, session/token policy, and transport protections. | E8.1, US-004, US-005, US-002, US-003 | Open; production blocker |
| PD-002 | Confirm church profile fields and whether production permits multiple admins per church or multiple churches per admin. | US-003, US-005, US-006, E8.1 | Open; POC cardinality is one admin per church and one church per admin |
| PD-003 | Define board session fields and attendance correction/audit behavior; confirm exceptions to one board per church/year. | US-006 | Open; POC uses dated sessions and replacing the attended-member set |
| PD-004 | Define ballot browser-profile credential storage, recovery, cleared-storage/device-switch behavior, and operational retention. | US-011, E4.4, E8.2, E8.3 | Partially decided 2026-10-23: association is usable while that poll may be reopened/current; invalidate when superseded or session ends. Other lifecycle details remain open. |
| PD-005 | Define nomination submission retention, correction/deletion, audit expectations, and operational requirements beyond current shared-link POC behavior. | US-008, US-009, E2.1, E2.2, E8.2 | Open |
| PD-006 | Define report/history audience within `admin` and `guest`, fields, participation visibility, exports, access duration, and retention. | US-012, US-013, E6.3, E6.4, E6.5, E8.2 | Open; report area approved in principle, specifics absent |
| PD-007 | Decide whether reset is allowed after reveal before a later round starts, and define voided-result handling and ballot deletion versus restricted retention. | E4.5, E4.2, E6.3, E8.2 | Open |
| PD-008 | Define which participation status administrators may see and ensure it cannot be joined to candidate selections. | US-011, US-012, E4.2, E6.4, E8.2 | Open |
| PD-009 | Identify privacy/compliance jurisdiction, accessibility conformance target, supported languages, browser/device matrix, and correction/deletion obligations. | E7.1, E7.2, E7.3, E8.2, E8.3 | Open |
| PD-010 | Set expected scale, hosting provider/region, availability objectives, budget, backup/restore objectives, monitoring, incident ownership, and recovery procedure. | E8.4, E8.1, E8.3, US-001, US-013 | Open; production blocker |
| PD-011 | Resolve completion behavior for unresolved ties, withdrawals, no-advancement cases, and user actions after completion. | E6.1, E6.2, E1.1, E1.2, US-012 | Open; E1.1's current derived contract covers elected-opening count only |
| PD-012 | Define historical results-only participant access, publication timing, and retention; current-session aggregate publication is decided separately in E6.10. | E6.4, E6.5, US-012, US-013 | Partially open; E6.10 approves current-session aggregate results after explicit reveal, not historical-report access |
| PD-013 | Confirm authorized undo behavior for an `ADVANCED` candidate when a later draft already includes that candidate. | E5.4, E3.2, E3.3, E2.4 | Open |
| PD-014 | Confirm the POC migration handling for elections attached to legacy unclaimed church records and how account ownership is established. | US-005, US-002 | Open operational/data migration detail |
| PD-015 | Define the administrator's options when no candidate reaches a strict majority outside the specified multi-opening runoff rules; confirm whether any recommendation beyond the majority indicator is desired. | US-011, US-012, E5.1, E6.1 | Open; current rule leaves regular single-opening outcomes to administrator/committee |
| PD-016 | Approve one stable session-level participant link that resolves the authorized current intake/poll/results phase, including no-active-phase behavior, link audience/forwarding/expiry/revocation, tenant enforcement, and browser-profile ballot uniqueness across rounds. | E6.10, E6.11, US-008, US-011, E6.8 | Decided 2026-10-23 in E6.10; implementation contract/security review remains |

## Approved Decisions to Preserve

- The proposed modular-monolith architecture, React/TypeScript, Java/Spring Boot, and PostgreSQL are approved. See `docs/technical/architecture.md`.
- MVP roles are `admin` and `guest`; guest voters do not sign in. Local POC self-registration, BCrypt credentials, dev-only HTTP Basic, one admin per church, and one church per admin are defined POC behavior.
- Board members are named for attendance but need no accounts; board membership/attendance must not connect a named person to ballot participation or choices.
- Nomination POC uses shared position-scoped links, admin closure, a committee-set per-intake name limit, and profile-local edits while intake is open. This does not establish a real-world submitter identity.
- Voting links do not expire and resolve only while their poll is active; otherwise current behavior returns 404. Ballot selections require exact distinct-choice count; no live totals; admin may close/reopen under cutoff policy.
- A two-candidate, one-selection round with an even expected count `N` automatically closes after `N - 1` ballots; expected count is fixed at poll start. This may count profile/link submissions rather than verified people.
- Privacy promise is confidentiality from church users, not system operators or metadata correlation. Ballot choices must not be joined to voter identity in UI, audit, or church-facing reports.
- E1.1 lifecycle status contract approved 2026-10-21: `SETUP`, `IN_PROGRESS`, `COMPLETE`; draft alone is not progress; nomination intake, active/closed rounds, or current candidate decisions count as progress; completion uses current elected count versus configured openings and can regress.
- E1.2 handoff records Product Owner approval and acceptance on 2026-10-21, with merge commit `a23033e`; verify target-branch provenance before treating this as confirmed completed dashboard status.
- **E6.10 (2026-10-23):** One unexpired, revocable session-level bearer participant link resolves only its own current phase; one ballot is allowed per browser profile per poll, with its opaque association valid while that poll may be reopened/current and invalidated when superseded or the session ends; explicit reveal makes only candidate names and aggregate vote totals available for the current round. The separate read-only presentation view is opened by an authenticated admin action and has independent show/hide/end controls; poll reopen clears current results. This does not grant access to historical reports. See E6.10 requirements for constraints and remaining implementation gates.

## Recording an Outcome

For each decision, add decision date, Product Owner outcome, rationale, constraints, affected story updates, and any required implementation/test follow-up. Do not overwrite the historical question; retain the decision record here and update dependent story requirements.
