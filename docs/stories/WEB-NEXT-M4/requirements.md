# WEB-NEXT-M4 — Essential Mock Interactions

## Status

**Product Owner scope confirmed 2026-11-10.** M4 implementation is authorized
within this scope. M3 is accepted and remains unmerged/undeployed.

## Goal

Implement essential, realistic interactions across Admin, Voter, and
Presentation using the existing `apps/web-next` architecture and replaceable
mock services. The three experiences read and update the same in-memory
election state. No backend or legacy application integration.

## Proposed scope

### Shared mock state

- Use one typed application-level mock service/store as the source of truth
  for Admin, Voter, and Presentation.
- State changes are visible across routes during the current app session;
  refreshing resets to the explicit fixture. Do not use browser persistence or
  backend calls.
- Keep poll history and prior submissions/results immutable. New user actions
  append or update only the current mock workflow state through explicit,
  validated service operations.
- Keep voter-session context synthetic and private. Never expose voter
  identities, ballot-to-voter mappings, or individual ballot choices.

### Admin nomination and poll basics

- Configure and explicitly start/close a nomination intake poll, including its
  configured free-text name limit.
- Review submitted names without submitter identity, correct spelling, and
  manually consolidate duplicates/variants; explicitly confirm the resulting
  nominee roster before setting up a voting poll.
- Configure and explicitly start/close a voting poll from the confirmed
  roster. Show lifecycle/status and validation feedback.
- Keep poll creation an explicit Admin action. Saving other data must not
  silently create or start a poll. Advanced decisions, next-poll workflows,
  candidate responses, finalization, and replacement workflows remain M5.

### Voter nomination and voting

- An eligible synthetic participant may submit multiple free-text names up
  to the configured limit, once per open nomination poll. Submission is final;
  no editing or resubmission. After submission, show only that participant's
  own submitted names.
- Validate ballots against the configured exact distinct-choice count for
  single- or multiple-selection polls, present a review/confirmation step, and
  show success/waiting feedback. Preserve the approved current-poll behavior
  for replacing a ballot while the poll remains open; prevent new or
  replacement ballots after closure.
- Show waiting/closed/no-active-poll states without leaking other
  participants' submissions, identities, or ballots.

### Presentation controls

- Admin may independently show/hide aggregate voting results and aggregate
  participation count, including while a poll is open.
- Presentation reflects both shared settings immediately. Participation means
  ballots cast in the current poll only; never show an eligible-voter
  denominator, identities, or individual ballot information.
- Show nomination names only according to the already approved nomination
  presentation lifecycle/privacy rules. Do not conflate nomination-list
  visibility with result or participation settings.

## Guardrails

- Preserve the approved product and domain rules, Prototype V2 behavior, M3
  route/navigation behavior, shadcn design system, and feature boundaries.
- Keep changes in `apps/web-next`; no API calls, backend changes, or edits to
  `apps/web` or `docs/prototype-v2`.
- Preserve M3's separation between Admin's viewed context and the active
  participant session.
- Do not implement M5 decisions, automatic election recording, candidate
  responses, finalization, or replacement workflows.
- No production authentication, authorization, link issuance, or identity
  simulation.

## Proposed acceptance criteria

1. Shared mock operations update typed state and are reflected consistently in
   Admin, Voter, and Presentation while navigating routes; page refresh resets
   to the documented fixture.
2. Admin can configure, start, review/consolidate, confirm, and close
   nomination intake with explicit validation and no submitter identities.
3. Admin can configure, start, and close a voting poll from the confirmed
   roster; prior poll snapshots remain unchanged.
4. Voter nomination limits, final one-time submission, own-name review, and
   unavailable states are enforced by the mock service and tests.
5. Single- and multiple-selection ballot counts, confirmation, submission,
   ballot replacement while open, and closure behavior match approved rules.
6. Presentation results and participation controls are independent, update
   shared state, and render only privacy-safe aggregates.
7. Focused tests cover rules, errors, route-shared state, history immutability,
   and privacy. Lint, typecheck, and production build pass; browser checks cover
   1440, 390, and 320 px layouts and critical keyboard interactions.

## Confirmed scope decisions

1. Admin scope covers nomination intake and the first voting
   poll's setup/open/close only; all post-vote decisions and explicit next-poll
   workflows remain M5.
2. Shared mock state is in-memory for the current browser session and resets
   on refresh; no local/session storage is added.
3. Voting allows the already approved replacement of a ballot while the same
   poll is open; nomination submission remains final and non-editable.
4. Nomination-list presentation behavior stays separate from the independent
   result and participation controls.
