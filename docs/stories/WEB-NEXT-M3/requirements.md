# WEB-NEXT-M3 — Three-Experience Visual Foundation

## Status and approval

Product Owner approved implementation on 2026-11-10. Scope is limited to a
navigable, mock-driven visual foundation for Admin, Voter, and Presentation.
Do not begin M4 workflows, merge, or deploy before separate approval.

**Product Owner acceptance:** Accepted 2026-11-10 after review of the
deliverables, contingent on final screenshots matching the approved UX
direction. The reviewed Admin, Voter, and Presentation screenshots follow the
approved hierarchy, responsive behavior, and visual direction. The remaining
Presentation browser keyboard/focus check is documented as a limitation in the
QA report and does not change the accepted M3 scope.

## References and constraints

- Preserve the accepted M2 Admin shell and read-only Position Workspace.
- Follow approved Prototype V2 behavior and visual language, plus the accepted
  shadcn `base-nova` design system and `apps/web-next` feature boundaries.
- All code changes stay in `apps/web-next`; do not change `apps/web`,
  `apps/api`, or `docs/prototype-v2`.
- Use shared realistic mock data and typed read-only contracts. No backend
  requests, actual nominations, ballots, decisions, poll changes, publication,
  or persistence.
- Distinguish viewed polls from the active participant session. Viewer state
  navigation must never activate or mutate a participant session. Voter and
  Presentation previews represent the shared active-session fixture, not the
  Admin's current viewing selection.
- No individual ballots or voter identities may be represented or displayed.
- Preserve the approved multiple-opening outcome policy. Flag for later
  clarification the distinction between automatic majority calculations and
  automatically recording Elected decisions; M3 must not change this policy.

## Minimum experience scope

### Admin

- Keep all accepted M2 screens and read-only behavior.
- Add navigable, clearly labeled mock-preview entry points to Voter and
  Presentation, without changing viewed context or active-session state.

### Voter

- Mobile-first participant experience with nomination, voting, confirmation,
  waiting/no-active-poll, and closed states.
- Nomination and ballot examples use the shared mock election context.
- Selection and state navigation may be previewed locally; clearly indicate
  that nothing is submitted or persisted. Do not create submission services or
  mutate poll data. Show only the current mock voter's own submitted names.

### Presentation

- Large-screen active-session/status display using the same context and
  aggregate snapshot as Admin and Voter.
- Provide hidden-results and visible aggregate-results layouts. Results and
  ballots-cast-only participation count are read-only mock projections.
- Previewing visibility is navigation/view state only; it must not write an
  Admin publication setting or persist state. Never show individual ballots
  or voter identities.

## Acceptance criteria

1. Admin remains at `/admin` with its existing shell, workspace, context
   selection, and read-only semantics intact.
2. Admin can navigate to and back from Voter and Presentation mock previews;
   previews do not change the active participant session or viewed poll.
3. Voter can navigate among mock nomination, voting, confirmation, waiting,
   and closed screens, with no network calls or persistent/real submissions.
4. Voter's current poll and position match the shared Admin fixture. Ballot
   selection limit and displayed candidate names agree with the mock snapshot.
5. Presentation can navigate between hidden and visible result views without
   changing poll or publication data. Visible aggregates match Admin's
   current snapshot; participation, if shown, is ballots cast only.
6. All three experiences remain keyboard accessible, have visible focus, and
   work without horizontal overflow at 1440px, 390px, and 320px.
7. Focused tests cover route/state transitions, read-only boundaries, and
   privacy-safe display. Lint, tests, and production build pass.
8. Capture screenshots for the required widths and record UX/QA evidence.

## Deferred

Actual nominations, ballots, confirmation writes, decision/response changes,
poll lifecycle mutations, Presentation publication controls, API integration,
advanced Admin workflows, and policy changes are out of scope.
