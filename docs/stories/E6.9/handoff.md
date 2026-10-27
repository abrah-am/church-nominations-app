# E6.9 Handoff

**Updated:** 2026-10-26
**Branch:** `feature/story-e6.9-live-nomination-presentation`
**Phase/status:** Product Owner accepted 2026-10-26 as a single-instance POC; implementation and QA complete. Push is authorized; not merged or deployed.

## Completed

- Closed nominations create an alphabetized, duplicate-preserving shared list; open-intake admin view exposes counts/state only.
- Admins can correct names, remove with a reason, and restore removed entries. Changes are revision-checked and append-only audited; adding and reordering are unsupported.
- Admin rows use an editable name textbox followed by save/remove icon controls. Accessible labels are screen-reader-only.
- Closed intake is audit-only during active voting. The UI loads round state even when all names are removed, waits until that state is ready, refreshes the authoritative rounds list before restore, and blocks restore if any round is active. The API also calls `assertNoActiveRound` before restoring.
- Separate opaque-token, read-only presentation supports neutral pre-reveal state, confirmed live snapshots/change history, SSE updates, and hide/end revocation. Viewer calls do not use admin credentials.
- Presentation event projections now retain only generated pseudonymous administrator labels; legacy actor values are normalized to `Administrator` to prevent email disclosure. Focused PostgreSQL integration coverage seeds a legacy email and verifies it is absent from the viewer response.
- Draft round captures the nomination revision; stale round-one drafts cannot start. Shared-list changes are locked during active voting.
- The API task now loads `apps/api/.env` and runs `devBootRun`. With explicit authorization, local Flyway checksum metadata was reconciled; V14-V16 applied without resetting or deleting application data. Local API was verified at `/api/health` (200), schema v16.

## Changed Files

- Backend: nomination services/controllers/DTOs/audit entities and repositories; voting-round revision handling; security/CORS; migrations V15/V16; `PostgresElectionIntegrationTest.java`.
- Frontend: `NominationAdminPanel.tsx`, `NominationPresentationPage.tsx`, nomination/round API clients, `App.tsx`, styles, and `App.test.tsx`.
- Docs/config: `.vscode/tasks.json`, E6.9 requirements/plan/QA/handoff, backlog, and API contract.

## Validation

- Frontend focused restore lifecycle and round-navigation checks: 5 passed.
- Full frontend suite: 76/76 passed.
- Frontend production build: passed.
- Frontend lint: zero errors; one existing non-null assertion warning in `apps/web/src/main.tsx`.
- `git diff --check`: passed.
- Focused API integration test `PostgresElectionIntegrationTest.adminCannotReadNominationNamesBeforeExplicitReveal`: passed after legacy actor redaction.
- Earlier E6.9 evidence records a passing API full suite and a passing focused API integration test after V16. The additional API test attempted for active-round restore in this continuation was removed after its setup repeatedly failed before the restore assertion; do not claim that new API regression passed. The service guard is present in `NominationIntakeService.restoreSharedListEntry`.
- Browser QA was limited to the neutral presentation at 320px (no horizontal overflow); successful API-backed viewer reconnect was not manually verified.

## Decisions and Open Issues

- Product Owner decisions dated 2026-10-23 remain authoritative: explicit reveal, separate read-only presentation, no submitter/device identity exposure, and retained nomination audit history.
- Product Owner acceptance recorded 2026-10-26; push authorized. Merge and deployment still require separate authorization.
- Production remains blocked on PD-005/E8.2 retention/deletion policy and multi-instance SSE/session coordination.
- Full screen-reader/contrast review and stronger direct integration coverage for `OTHER` detail persistence remain outstanding.

## Git State

Current branch is `feature/story-e6.9-live-nomination-presentation`. The working tree contains the E6.9 implementation and documentation as modified/untracked files; changes are uncommitted. No merge or deployment occurred.

## Exact Next Action

Push only the E6.9 changes after final full-suite validation. Keep the branch unmerged and undeployed until separately authorized. E9.1 planning documents are untracked and must remain excluded from the E6.9 commit/push.
