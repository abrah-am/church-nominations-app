# WEB-NEXT-M2: Position Workspace core (proposal)

Status: planning and UX design authorized 2026-11-09. Story scope, references
and implementation require Product Owner approval. No M2 application code yet.

As an administrator, I want to inspect a position, its polls and candidates
while keeping the participant session unchanged.

## Proposed acceptance criteria

- REQ-001: Within the accepted M1 shell, show position name, openings, effective
  elected count, accepted/filled count and remaining openings. Display each
  opening's assigned elected candidate and separate latest response. An opening
  is filled only after an Elected candidate accepts. Show lifecycle/derived
  condition read-only; no finalization or replacement actions.
- REQ-002: Keep a persistent compact active-session/share toolbar independent
  of the viewed position/poll. Identify active position, poll and status.
  Copy, QR and preview/open affordances never activate or switch a session.
  M2 uses explicitly mock links only; no real participant/presentation capability,
  viewer implementation, publication controls or credentials are introduced.
  UX must distinguish previewing the mock active session from viewing history.
- REQ-003: Show compact typed nomination/voting poll history with status and
  separate Viewed and Active indicators. Selecting any poll changes only admin
  viewing state, retaining the active-session identity, status and links.
  Position/context browsing and Polls/Candidates navigation also never activate.
- REQ-004: Selected-poll read-only views cover approved nomination roster,
  open/draft/closed voting snapshots, aggregate results where available and
  recorded election decisions. Preserve original-name/consolidation traceability
  by disclosure for approved nominations. No raw ballot choices/identity.
  Closed voting results and recorded decisions are grouped; Audit is separate.
  Preserve existing admin access to aggregate totals for open polls, shown as a
  mock read snapshot in M2; this does not authorize audience publication.
  Do not render mutation controls, even as disabled invitations to future work.
- REQ-005: Provide separate Polls and position-wide Candidates views. Candidate
  view distinguishes current effective decisions from selected-poll historical
  records and candidate responses. Preserve source roster/name snapshots.
  Results sort votes descending then candidate name A-Z, and percentages use
  ballots cast; multi-selection percentages can exceed100%. Zero ballots does
  not divide by zero. No automatic majority/tie/outcome recommendations.
- REQ-006: Use deterministic realistic mock data based on Prototype V2 through
  a typed read-only application port. Domain owns derivations; mocks only supply
  snapshots. Keep tenant/term/position scope, errors and independent snapshots.
  No HTTP adapter, backend changes, auth simulation or production parity claim.
  Missing, loading and recoverable error states retain context and do not fall
  back to another tenant, poll or session.
- REQ-007: Preserve accepted shadcn system and modular feature structure.
  Design references at1440px,390px,320px must show real content, historical poll
  selection versus open active session, Candidates view, no-active/empty state,
  and responsive toolbar/history behavior. Future implementation must pass
  lint/tests/types/build, keyboard/focus, no page overflow, and UX/QA review.
- REQ-008: No nomination, voting, decision, response, finalization, reopen,
  replacement, reveal/publication, activation or setup mutations. No backend
  scope expansion. Preserve existing frontend/backend/Prototype V2. M2 code
  requires explicit Product Owner scope and UX approval.

## Boundaries and approval holds

The [approved Prototype V2](../../prototype-v2/README.md) is the workflow
reference; the [accepted M1 shell](../WEB-NEXT-M1/handoff.md) is the visual frame.
Existing [C1-C4 policy discrepancies](../WEB-NEXT-M0/dependencies.md) remain
unresolved, not implicitly decided by a read-only screen. Show admin aggregate
results only; no audience policy is specified here. Legacy fixture decision
`Declined` must be clearly identified as a legacy recorded value, never a new
decision option or a substitute for candidate response.

M0's reduced domain model excludes invitations/replacements. Do not apply it to
replacement-bearing data as though it were a complete lifecycle projection.
Initial M2 fixtures omit replacement events; future support requires separate
approved model extension and tests. Real API/session links remain separate
integration dependencies. Proposed mock preview presentation and detailed
screen grouping are subject to UX/scope approval, not implementation permission.
