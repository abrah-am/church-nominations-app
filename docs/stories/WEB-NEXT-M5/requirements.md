# WEB-NEXT-M5 — Progressive Admin Completion

## Status

Product Owner approved M5a/M5b scope and the policy clarifications below on
2026-11-11. **M5a was accepted by the Product Owner on 2026-11-11** after a
focused browser keyboard smoke test (see [handoff.md](./handoff.md)); the
M5a work is on `main` via PR #39. M5b is not started and requires explicit
authorization. Do not integrate the backend or deploy.

## Goal and boundaries

Complete Admin decision, response, history, lifecycle, and replacement
workflows in `apps/web-next`, using the existing typed in-memory mock service.
Preserve the accepted M0-M4 work and keep Voter and Presentation privacy-safe.
Mock state remains ephemeral and resets on refresh.

No backend or legacy-client changes, persistence, authentication simulation,
automatic nomination, candidate ranking/recommendation across rounds, or
committee/quorum workflow.

## Approved product rules

1. The system calculates strict-majority qualification under the existing
   opening-cap and runoff rules. It is guidance only: an Admin explicitly
   confirms each Elected decision before it is recorded. Never silently elect.
2. Record Elected/Advanced/Eliminated as election decision events and
   Accepted/Declined as separate response events associated with a candidate
   and opening. Preserve event history. Awaiting Acceptance is derived.
3. An opening is filled only after its Elected candidate is Accepted.
   Finalization requires all openings Accepted and no open poll. Finalization
   and reopen are explicit, confirmed, and audited. Reopen does not create or
   start a poll.
4. Saving decisions does not create a poll. **Create Next Poll** is explicit;
   Advanced candidates are preselected for Admin review and roster
   confirmation. New polls start with fresh totals and historical records
   remain unchanged.
5. Direct replacement recommendations use Advanced candidates from the most
   recent completed, non-voided round associated with the declined candidate.
   Exclude candidates Elected for another opening in this position election,
   candidates who declined this position, and Eliminated/Removed candidates.
   Results from other positions/departments do not affect eligibility.
6. Rank direct candidates by votes. Recommend a unique top candidate;
   tied highest candidates require an Admin-confirmed fresh tie-break poll
   containing only the tied candidates. The Admin explicitly chooses each
   invitation. No automatic offers or numeric cap; after a decline the Admin
   may explicitly choose the next ranked candidate or another allowed path.
7. If direct recommendations are unavailable/exhausted, the Admin may start
   a replacement poll with any number of names manually entered/selected from
   historical nomination or round data for the same position election. The
   Admin uses judgment: the application does not rank or filter this manual
   roster by prior Elected, Declined, or Eliminated status. Require an audited
   reason; preserve historical polls, decisions, responses, and results.
8. Do not source replacement names from another position/department or
   automatically nominate. If the position has no historical names for a
   replacement roster, keep Vacancy; a new candidate source needs separate
   Product Owner approval.
9. Keep decisions, responses, and audit history Admin-only. Never expose
   voter identities or individual ballots to any experience.

## M5a — Essential Admin workflow

### Requirements

- **REQ-M5-001 — Decision recording:** After poll closure, show final
  aggregates and one explicit Admin decision per candidate. Majority
  qualification is calculated but never writes an Elected decision. Validate
  decision sets against existing opening-cap/runoff and next-round rules.
- **REQ-M5-002 — Separate responses:** Record Accepted/Declined independently
  from decisions, associate each response with its candidate, opening, and
  Elected decision event, preserve response history, and derive Awaiting
  Acceptance. Do not collect contact details or overwrite/correct prior
  responses.
- **REQ-M5-003 — Explicit next poll:** Only a separate Create Next Poll action
  creates a draft. Preselect Advanced candidates for Admin review and
  confirmation; initialize a fresh tally.
- **REQ-M5-004 — Historical integrity:** Preserve prior poll snapshots,
  aggregate results, decision/response events, and audit entries. Legacy
  Declined decisions display as Declined (Legacy), without migration.

### Acceptance criteria

1. Admin sees closed-poll totals and majority guidance; no Elected decision is
   recorded until explicitly confirmed.
2. Invalid or incomplete decision sets are rejected with actionable feedback;
   valid decisions append events and audit history without mutating poll
   results or previous decisions.
3. Candidate responses are separately recorded, visible with their event
   history, and linked to the relevant Elected decision and opening. Accepted
   alone fills an opening; Declined leaves it vacant.
4. Saving decisions creates no poll. Create Next Poll explicitly opens
   Advanced candidates for review, requires Admin confirmation, and creates a
   fresh draft with zero votes.
5. The accepted M0-M4 workflows, legacy display, and separation of viewed
   context from active participant session remain intact.

## M5b — Position lifecycle and replacement

### Requirements

- **REQ-M5-005 — Finalization:** Finalize only when every opening is Accepted
  and no poll is open. Require explicit confirmation and append a lifecycle
  audit event. The participant view becomes neutral; Presentation publication
  remains unchanged.
- **REQ-M5-006 — Reopen:** Reopening a finalized position is explicit,
  confirmed, and audited. It preserves prior polls, decisions, responses, and
  results and creates/starts no poll.
- **REQ-M5-007 — Direct replacement:** Derive the PD-018 candidate pool and
  ranking from the approved position-scoped source round and exclusions.
  Present recommendations only; require Admin action for each invitation.
  Require a confirmed tie-break poll for tied top candidates.
- **REQ-M5-008 — Manual replacement poll:** Allow an Admin-selected roster
  from historical nomination/round names within this position election,
  including names previously Elected, Declined, or Eliminated. Do not impose
  automatic rank/status filtering or a count cap. Require an audited reason
  and fresh poll totals. If no historical names exist, leave Vacancy and
  report that a separately approved candidate source is required.

### Acceptance criteria

1. Opening summaries distinguish unfilled, Awaiting Acceptance, Filled, and
   Vacancy; only Accepted responses fill an opening.
2. Finalization is unavailable with any unaccepted opening or open poll.
   Reopen is available only through explicit confirmation and does not
   auto-create a draft.
3. A decline preserves the associated decision and poll. Direct
   recommendations use only Advanced candidates from the associated
   completed, non-voided round, apply same-position exclusions, and do not
   filter based on other positions.
4. The Admin can explicitly invite a unique top recommendation; a tied top
   requires a confirmed poll containing only tied candidates. No offer is
   sent automatically, and each next invitation remains an Admin action.
5. The manual replacement path records its reason, permits any number of
   historically sourced names without status filtering, and starts a fresh
   poll without changing prior records. An empty historical source leaves
   Vacancy and does not create an empty poll.
6. Results, decisions, responses, reasons, and history remain absent from
   Voter and Presentation projections.

## Open decisions outside M5

- Response correction/reversal and contact-date/details remain open in E6.6;
  M5 supports append-only responses and collects no contact details.
- Committee/quorum process and automatic nomination are excluded.
- If no historical names exist at all, Vacancy remains until a new candidate
  source is approved; M5 does not define or implement that source.
- PD-015's additional majority recommendations outside existing runoff rules
  remain open. M5 does not add recommendations beyond the approved majority
  qualification indicator and explicit Admin decisions.
- Generating a representative/ranked candidate list across rounds is future
  work; the manual replacement poll remains Admin-directed.
