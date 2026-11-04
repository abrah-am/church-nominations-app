# E4.2 Implementation Plan: Active Voting Workspace

**Status:** Product Owner approved 2026-11-03; implementation in progress.

## Objective

After **Start voting** succeeds, show one focused active-voting card with profile/link submission progress and clear **Cancel active voting** and **Close voting** actions. Remove nomination review and round disclosure clutter from this active state while preserving ballot confidentiality. Keep result reveal explicit in this scope; automatic viewer reveal depends on E6.8/E6.11.

## Implementation Anchors

- `apps/web/src/features/nominations/NominationAdminPanel.tsx` owns the confirmed nomination list, voting-round configuration, active round disclosure, progress polling, close/reveal/reopen/reset actions, and presentation visibility state.
- `apps/web/src/App.test.tsx` contains the cross-feature start-voting test that currently opens the active-round disclosure before it can assert progress.
- `docs/prototype/prototype.html` shows the intended active card: **Voting is active**, received of expected profile/link submissions, explanatory privacy text, and **Close voting**.
- The round and result APIs currently implement start, close, explicit reveal, reopen, and reset as lifecycle operations. Inspect their contracts and backend tests before deciding whether new server operations are needed for cancelling an active attempt and close-with-conditional-reveal.

## Planned Work

1. Make active round status a first-class branch in the position workspace. Hide the consolidated list and confirmed-change history while a round is active; restore appropriate review/history when the active state ends.
2. Replace the active-state **Voting round configuration** summary/title, active-round jump button, and `Round N` disclosure row with a single active card titled **Voting is active**.
3. Move progress into the card as `{received} of {expected} profile/link submissions`; keep the qualification that this is not a verified-person count and never surface candidate totals or ballot choices.
4. Keep **Close voting** as a distinct action. After closure, retain the existing explicit **Reveal results** action; do not publish results to viewer surfaces as part of this story.
5. Add **Cancel active voting** with an accessible confirmation naming the round and warning that ballots and current decisions will be permanently deleted in this local POC. On confirmation, use a server-authoritative lifecycle transition to stop ballot access, reset the active attempt, and return the UI to fresh setup with zero progress/results. Preserve the reset audit event.
6. Preserve existing reopen and closed-round reset behavior as separate actions. Failed transitions retain accurate state and provide an actionable error.
7. Add focused component/workflow tests for active layout, count privacy, cancel-confirm/cancel-dismiss, close and explicit reveal, transition failures, and regression coverage for reopen/reset.

## Acceptance Verification

- Run the focused `App.test.tsx` cases for round start, active progress, close/reveal, cancellation, and lifecycle recovery.
- Run `npm test`, `npm run lint`, and `npm run build` in `apps/web`.
- If backend contracts change, add focused API/integration coverage and run the relevant Gradle tests using the repository's configured JDK 25.
- Verify desktop and mobile active-round layout in the running app; capture evidence without overwriting existing approved screenshots.
- Run `git diff --check`.

## Risks and Boundaries

- Voting-result viewer publication is not implemented by the current nomination presentation endpoint. Do not route ballot results through that endpoint; E6.8/E6.11 own viewer support and auto-reveal follow-up.
- Closing and revealing must not expose participation status, voter identity, individual ballots, or live candidate totals. Active progress is profile/link submissions, not verified people.
- Active cancellation is not the same as ordinary close or reopen. It uses POC reset semantics, permanently deleting ballots and current decisions while preserving the reset audit event; production retention remains open.
- Do not alter nomination consolidation, expected-count/cutoff rules, ballot semantics, next-round decisions, or tenant authorization outside this story's lifecycle requirements.
- This implementation plan was approved by the Product Owner on 2026-11-03.