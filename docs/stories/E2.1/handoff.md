# Handoff: E2.1 Intake States and Closure Consequences

**Current phase:** Phase 7 — Product Owner acceptance
**Status:** Accepted by Product Owner 2026-10-22; implementation committed and pushed; merge authorization pending.
**Branch:** `feature/story-e2.1-intake-states`
**Commit:** `e2bedda` (`feat: clarify nomination intake submissions`)
**Remote:** `origin/feature/story-e2.1-intake-states`

## Product Owner Request

Clarify nomination intake submission count and make proposed names numbered and ordered alphabetically. The current UI's `submissions.length` is the number of stored proposed-name rows, not the number of submitting profiles.

## Decisions Recorded (2026-10-22)

- Count distinct browser profiles with a current non-empty submitted name list. Replacing the list does not increase the count; clearing it removes the profile from the current count.
- Count transition is current-state based: first successful non-empty submit 0→1, edits remain 1, withdrawal 1→0, and later non-empty resubmission 0→1.
- Treat this as a profile-level attendance cross-check only, not a verified count of people. Multiple profiles/devices and cleared browser storage can cause mismatch.
- Keep names free-form; order the displayed list alphabetically by full name, case-insensitively, and number it.
- Public primary submit action is labeled `Submit names`; success feedback says the names were submitted.
- Keep the number of profiles separate from the number of proposed names; duplicate names remain separate until admin consolidation.
- Allow a profile to withdraw all names while intake is open; the profile then leaves the current contributor count. Closed intake remains read-only.
- Require confirmation before admin closure and before full-list withdrawal.
- On successful withdrawal, clear saved and unsaved name fields; on cancel or failure, preserve fields.
- Live updates announce counts and changed names without profile identity or attribution.
- Keep unavailable/invalid links distinct from valid closed intakes.
- No historical event count, identity verification, or structured first/last-name fields are in scope.

## Repository Findings

- Admin responses contain one row per current name and a distinct profile count derived from the same fetched rows; device tokens are not serialized.
- Public empty-list replacement withdraws that profile's rows only while intake is open; count and list update in GET and SSE snapshots.
- Admin names are sorted case-insensitively, shown as an ordered list, and duplicates remain visible.
- After closure, the intake summary/counts and consolidation workflow remain visible; only the separate Submitted names list is collapsed by default and can be expanded for review.
- Admin closure and public withdrawal use confirmation dialogs. Successful withdrawal clears saved and unsaved fields; cancel/failure preserves form state.
- Public nomination PUT returns only `{ submittedNames }`, not a full intake. The page now merges returned names into existing intake metadata instead of replacing it; this preserves `nameLimit` after withdrawal so Add another name can append a field and resubmission remains anonymous.
- SSE close/subscription ordering and count/list snapshot consistency findings were fixed. A regression test verifies a subscriber connecting after closure receives one closed snapshot and the stream completes.
- `docs/development-workflow.md` remains untracked and was preserved. Do not stage it unless explicitly asked.

## Files Changed During Refinement

- `docs/stories/E2.1/requirements.md`
- `docs/stories/E2.1/implementation-plan.md`
- `docs/stories/E2.1/handoff.md`

## Implementation and Review

- `ux-designer` produced `ux-design.md`; Product Owner approved significant UX decisions on 2026-10-22.
- `backend-developer` implemented contributor count, empty-list withdrawal semantics, deterministic ordering, and API integration coverage.
- `frontend-developer` implemented distinct counts, ordered names, live announcements, closure/withdrawal confirmation, and public withdrawal behavior.
- `qa-engineer` produced `qa-report.md`; functional acceptance checklist passed.
- `code-reviewer` produced `review.md`; previous SSE race and count/list consistency findings are resolved. No blocking findings remain.
- `ux-designer` produced and refreshed `ux-validation.md`; public/admin load recovery and post-close focus findings were fixed and regression-tested. No source-level UX blocker remains.
- No merge or deployment was performed.

## Validation

- Focused API integration test `PostgresElectionIntegrationTest.nominationIntakeSupportsAnonymousDeviceEditsClosureAndConsolidation`: passed with JDK 25 and `--rerun-tasks`; latest run executed all 5 tasks successfully, including the closed-before-subscribe regression assertion.
- Full frontend suite: 67 tests passed across 5 files.
- Final focused App suite after UX validation fixes: 56 tests passed, including admin/public load retries and post-close focus.
- Frontend TypeScript check and production build: passed.
- After the profile-count fallback and `Submit names` updates: focused App suite passed 56 tests; frontend production build passed.
- After fixing withdrawal → Add another name: focused App suite passed 56 tests with the mock matching the API's partial `{ submittedNames }` response; frontend build and `git diff --check` passed.
- After approval, rebuilt/restarted the dev API from this branch using `devBootRun` and local `apps/api/.env`. `http://127.0.0.1:8080/api/health` returned HTTP 200 with `{"status":"ok"}`.
- `git diff --check`: passed during implementation/review.
- Full API suite: reports an unrelated closed-round reset failure and XML result-file write errors; not attributed to E2.1.
- Not performed: rendered browser/responsive review, keyboard-only manual run, screen-reader check, and measured contrast verification. Full accessibility conformance is not claimed.

## Next Action

Product Owner accepted E2.1 on 2026-10-22. Implementation is pushed on the feature branch. Next action: review the branch/PR and obtain explicit merge authorization before Phase 8 merge/closure. Rendered responsive/accessibility verification remains unperformed. Do not merge or deploy without explicit authorization.