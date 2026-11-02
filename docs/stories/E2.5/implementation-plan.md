# E2.5 Implementation Plan: Restore Current Position Workflow State on Revisit

## Status

Approved by Product Owner 2026-11-01. Implementation completed locally; merge and deployment are not authorized.

## Objective

When an administrator opens or revisits a position workflow, hydrate its current intake and round state from the existing authenticated APIs so the page presents the authoritative state rather than a progress-derived setup task.

## Scope

- Frontend position-workflow initialization and revisit behavior.
- Existing authenticated intake, round, and result API contracts only.
- Loading, retry/error, no-intake, open-intake, and closed-intake states.
- Focused regression tests for navigation away and reopening a position.

No backend, schema, API-contract, participant-view, presentation-view, or product-policy changes are planned. Loading must not create an intake. Existing unsaved-draft confirmation, privacy rules, active-round result concealment, and navigation behavior remain in force.

## Current Evidence and Hypothesis

`NominationAdminPanel` initializes with no intake and a collapsed workflow. Its current intake GET is called by the manual “Open nomination intake” action. `App.openElection` refreshes election metadata before mounting the panel, but that metadata does not include intake submissions. The existing admin intake endpoint returns the current intake snapshot, including anonymous submitted names and profile count; round and closed-result endpoints already load separately.

Hypothesis: moving intake loading into position-panel initialization, while distinguishing “not yet loaded” from “no intake exists,” will restore open/closed intake views without changing server contracts. Existing uncommitted changes already touch `App.tsx`, `NominationAdminPanel.tsx`, `App.test.tsx`, and `styles.css`; implementation must inspect and preserve those edits rather than replace them.

## Implementation Tasks

1. Reconcile the current uncommitted changes in the frontend panel and tests with this story before editing. Preserve all unrelated changes; make no branch or cleanup operation until implementation is approved.
2. Refactor position initialization to fetch the current intake automatically using `getNominationIntake`. Treat the API’s not-found response as the authoritative no-intake state; treat other failures as unknown state with a clear error and retry action. Loading must never create an intake.
3. Keep the workflow in a loading/unknown presentation until current intake state is resolved, so stale progress metadata cannot show a misleading setup or review task. For open intake, restore the current profile count and all names without exposing profile/device identity. For closed intake, restore the saved review/consolidation state.
4. Coordinate intake hydration with the existing rounds/results load path. Ensure round state is refreshed for current closed intake; preserve concealment for unrevealed and active rounds, and avoid stale async responses after navigation/unmount.
5. Add or adapt focused tests for revisit after open-intake submissions, count and names, no intake, closed intake, loading, recoverable failure/retry, and stale request/navigation behavior. Retain tests for unsaved-draft navigation confirmation and active-round totals remaining hidden.

## Delegation and Ownership

- Tech Lead: reconcile existing worktree changes, own integration and review.
- Frontend Developer: implement hydration and focused component tests after approval.
- QA Engineer: execute the acceptance-criteria checklist and broader frontend checks after implementation.
- Code Reviewer: independently review correctness, async lifecycle, privacy, and regression coverage.
- UX design phase: not required as a separate deliverable; this story restores existing states and introduces no new workflow or visual pattern. Loading and error feedback will follow established UI conventions.

No development agents are invoked during this planning/approval phase.

## Validation Plan

1. Focused Vitest coverage for the position workflow and revisit sequence.
2. Full frontend test suite: `cd apps/web && npm test`.
3. Frontend typecheck/production build: `cd apps/web && npm run build`.
4. Frontend lint: `cd apps/web && npm run lint`.
5. If investigation reveals an API contract change is necessary, stop and request separate review/approval before expanding scope; otherwise no backend tests are required.

## Risks and Safeguards

- A 404 must mean no intake only where confirmed by the authenticated admin intake contract; transport/auth failures must not become an empty setup state.
- Intake, rounds, and results may resolve out of order. Use cancellation or request-generation guards so an obsolete position cannot overwrite current state.
- Initial hydration may affect existing unsaved-draft and navigation guards. Preserve those semantics and test navigation while requests are in flight.
- Keep open-round totals hidden and never render submitter/device identity. Continue relying on server authorization for church scope.
- Existing dirty files overlap the likely implementation surface; changes must be reviewed in context and not reverted or overwritten.

## Approval Gate

Product Owner approval of this plan is required before implementation. After approval, re-check Git status, preserve existing user changes, and proceed with the frontend work only. Do not merge or deploy without separate explicit authorization.