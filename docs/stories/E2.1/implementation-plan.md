# E2.1 Implementation Plan: Intake Status and Submission Review

**Status:** Approved by Product Owner 2026-10-22; implementation in progress
**Date:** 2026-10-22
**Branch:** `feature/story-e2.1-intake-states`

## Objective

Make nomination intake state and its current submissions scannable to the administrator, distinguishing the number of contributing browser profiles from the number of proposed names.

## Scope

- Add a server-derived count of distinct browser profiles with at least one current submitted name to the admin intake response.
- Show the count with wording that does not imply verified person identity. A profile contributes one on its first non-empty submit; replacing its list leaves the count unchanged; withdrawal removes its contribution; a later non-empty resubmission adds it again.
- Let a submitter withdraw all current names while the intake is open; ensure the live admin snapshot removes those name rows and updates the contributor count.
- Render the proposed names in full-name alphabetical order as a numbered list while intake is open and after it closes.
- Keep duplicate names as distinct submitted suggestions. Existing administrator consolidation remains the mechanism for merging/correcting names.
- Preserve existing live updates, closure behavior, anonymity from church users, and tenant authorization.
- Include intake status, per-profile name limit, link usability, empty states, and accessible update/closure feedback as required by E2.1.

## Proposed Implementation

1. Extend the admin nomination-intake response with a contributor count, calculated as the number of distinct `device_token` values having current submission rows for the intake. Do not return the tokens or per-profile identity.
2. Ensure the initial GET response and live-update snapshots use the same count calculation, including after list replacement and withdrawal to an empty list. The public submit/withdraw PUT returns only `{ submittedNames }`; merge that partial response into existing intake state so metadata such as `nameLimit` is preserved.
3. Replace the ambiguous name-count presentation with a profile-submission count and a separate proposed-name count where useful.
4. Render the existing full-name alphabetical result as an ordered list in both open and closed intake views. Preserve deterministic ordering, including identical names.
5. Permit an empty replacement list only for explicit withdrawal while intake is open. Preserve validation for null lists, blank entries, over-limit lists, and closed intake.
6. Add API tests for multiple profiles, multiple names per profile, replacement without count growth, withdrawal to an empty list removing a contributor, duplicate names, tenant scoping, and live snapshot consistency. Add frontend tests for confirm/cancel/failure/success withdrawal, unsaved-field clearing only on success, separate counts, order/numbering, open/closed states, and accessibility announcements.

## Work Breakdown

| Task | Owner | Deliverable |
| --- | --- | --- |
| UX discovery | `ux-designer` | `ux-design.md` covering count wording, status/link states, list presentation, responsive behavior, and accessibility; completed and approved 2026-10-22 |
| API contract and calculation | `backend-developer` | Add `currentContributorCount` to admin intake snapshots and permit empty list only for explicit open-intake withdrawal; focused API tests |
| Admin intake presentation | `frontend-developer` | Confirmed withdrawal flow and dialog, counts, ordered names, accessibility/live announcements; focused UI tests |
| Verification | `qa-engineer` | `qa-report.md` covering acceptance criteria and regressions |
| Independent review | `code-reviewer` | `review.md` for privacy, count correctness, API consistency, and test adequacy |
| UX validation | `ux-designer` | Review implementation against approved UX specification |

Delegate frontend and backend in disjoint files. QA, independent review, and UX validation follow after implementation. Do not merge or deploy.

## Validation Strategy

- Backend: run nomination service/controller tests for contributor counting, tenant scoping, replacement, and event-stream snapshots.
- Frontend: run the focused intake workflow tests, then the full web test suite and production build.
- Review the rendered open, closed, and empty states; confirm profile count is not conflated with the number of names and no profile token or identity is exposed.
- Run `git diff --check` before review/commit.

## Risks and Constraints

- A browser profile is not a verified person. The count is a current-contributor count and must not be described as an attendance or unique-person guarantee.
- A user may clear their submitted list; that should reduce the current-contributor count. Historical submission actions are not in scope.
- Public withdrawal is allowed only while intake is open; closed intake remains read-only.
- The count is derived from current submission rows and must be identical in GET and live-update responses.
- No database migration is expected if the count can be derived from existing rows; implementation must verify query cost and indexing before finalizing.

## Approved UX Decisions (2026-10-22)

- Admin closure requires confirmation.
- Full-list withdrawal requires confirmation.
- Successful withdrawal clears saved and unsaved form fields; cancel/failure preserves them.
- Live updates announce counts and changed names, without profile identity or attribution.
- Invalid/unavailable links remain distinct from valid closed-intake responses.

## API Contract Findings

- `ReplaceNominationSubmissionRequest` currently requires a non-empty list. The public withdrawal action must send an empty list; the API should accept it only while intake is open and apply normal locking/transaction behavior.
- The admin response currently contains one row per current proposed-name entry and is ordered by full name then ID. Add a distinct profile count without exposing device tokens.
- The public submission PUT response is `SubmittedNamesResponse`, containing only `submittedNames`; frontend code must not replace the complete `PublicNominationIntake` state with this partial response.
- The event-stream snapshot is built from the same admin response mapper, so it must carry the same count and ordered names after replacement/withdrawal.
- No standalone `docs/technical/api-contract.md` exists in this checkout; update the DTO/client contract and story plan. No schema migration is expected.

## Phase 3 Complete

Requirements, plan, and significant UX decisions are approved. The feature branch is `feature/story-e2.1-intake-states`; backend and frontend scopes are disjoint. Implementation may proceed. Do not merge or deploy without explicit authorization.