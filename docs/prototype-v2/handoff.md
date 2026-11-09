# Prototype v2 Handoff

## Status

Product Owner approved this standalone prototype as the functional and UX baseline on 2026-11-08. It is a browser-local UX-validation prototype, not a production-ready application. This handoff records the approved scope and current limitations for the baseline PR.

## Scope

- Isolated React/TypeScript/Vite experience under `docs/prototype-v2/` for Administrator, Voter, and Presentation.
- Compact Election Position Workspace with position summary, permanent participant/presentation toolbar, separate Candidates view, compact poll history, and one selected-poll workspace.
- Nomination intake, anonymous raw submissions, consolidation/correction/exclusion with original submission traceability, explicit final-roster approval, nomination and voting poll history, multiple rounds, ballots, admin results, election decisions, candidate responses, position finalization/reopening, and supported PD-018 vacancy paths.
- Stable prototype `/vote` and `/presentation` paths resolve the active position/session separately from the administrator's historical poll selection.
- Voting setup uses the selected source poll's name/tally/decision snapshots; approved roster names carry into voting drafts and ballots.
- Admin and Presentation candidate results sort by vote count descending, then candidate name A-Z, with percentages calculated from ballots cast.

## Approved Workflow Decisions Preserved

- Election decisions (`Elected`, `Advanced`, `Eliminated`) are distinct from candidate responses (`Awaiting response`, `Accepted`, `Declined`). Responses are append-only and audited.
- An opening counts as filled only after an Elected candidate's separate Accepted response. Finalization requires all openings accepted and no open poll.
- Position lifecycle states are In Progress, Finalized, and Reopened; Awaiting Acceptance, Ready to Finalize, and Vacancy are derived conditions.
- Finalize and Reopen require confirmation and audit events. A finalized position is read-only by default; prior polls, ballots, results, election decisions, and audit history remain accessible and unchanged.
- Finalization ends participant activity and gives the participant view a neutral completed state. It does not publish new names/results or change/clear previously revealed Presentation content; explicit audience controls remain independent.
- A later decline appends a Declined response without replacing Accepted or Elected and leaves the lifecycle Finalized with a derived Vacancy until explicit Reopen.
- Supported replacement paths use the PD-018 source round and eligibility rules. The administrator chooses and confirms a direct invitation or a fresh/tie-break poll path; no candidate is auto-elected, and no poll is auto-created or activated.
- Closed voting Results and election Decisions appear together; Audit remains separate. Candidate response actions are distinct and only shown for elected candidates.
- Original nomination submissions do not expose nominator identity or per-submitter grouping. Approved rosters are read-only and show candidate names and nomination counts; original submissions and consolidation traceability are available through a collapsed detail disclosure.
- Changing the admin's viewed poll, workspace tab, copying/opening links, or previewing a view does not change the active participant session.

## Known Prototype Limitations

- State uses browser `localStorage`, `sessionStorage`, BroadcastChannel, and same-origin storage events. It has no server persistence, authentication, authorization, encrypted transport, or durable audit service.
- Ballot and nomination privacy are UX simulations only. Browser access can inspect local state; browser-profile uniqueness is not real-world identity or eligibility enforcement.
- The prototype intentionally permits aggregate participation display on Presentation, unlike current product policy. This is documented as prototype-only behavior in `README.md`; product requirements remain unchanged.
- Source fixture examples are demonstrations, not authoritative election policy. No automatic majority, tie, cutoff, replacement election, candidate selection, or next-round behavior is implied beyond the explicitly implemented approved PD-018 tie-break flow.
- Response correction/reversal, contact details, committee/quorum process, offer/replacement caps, no-eligible-candidate resolution, and election-level lifecycle mapping remain deferred in the reconciled product documents.
- Desktop/mobile screenshots exist in `screenshots/`. The approved roster captures are `approved-roster-desktop-1440x900.png` and `approved-roster-mobile-390x844.png`. Lifecycle captures were refreshed during implementation, but should be visually re-captured against the final PR checkout if the review relies on those screens.
- Browser-interaction evidence was gathered using the VS Code integrated browser. A standalone screenshot runner could not reliably launch Chromium; keyboard and screen-reader testing were not performed.

## Validation

Run from this directory using Node 23:

```sh
npm test
npm run build
git diff --check
```

Record the exact results from the final baseline commit/PR validation in the PR description. Do not treat successful prototype checks as production-readiness evidence.

## Baseline Boundaries

- Do not modify `apps/web`, `apps/api`, production APIs, database migrations, or backend behavior as part of this prototype baseline.
- Do not begin the shadcn/ui migration in this baseline task.
- The UX-to-Frontend workflow standard is documented separately in `docs/development-workflow.md`.
- Reconciled position-finalization and replacement rules are documented in product/story requirements and are included here as scope; this prototype does not resolve deferred product questions.
