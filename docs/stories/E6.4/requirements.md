# E6.4: Define Historical Result and Report Access

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (decision blocker)
- **Workflow status:** Blocked / Product Owner and security decision needed
- **User story:** Discovery story to define audiences and fields for historical results/reports.

## Acceptance Criteria
- Decide which of `admin` and `guest` may access revealed results and history.
- Decide visible participation fields, exports, and retention period.
- Record privacy constraints and acceptance criteria before implementing exports or public history.

## Scope and Dependencies
Policy decision only. Blocks E6.3, E6.5 and report implementation US-013. Depends on privacy/retention decisions E8.2.

## Relevant Decisions
The MVP has only `admin` and `guest` roles. Possession of a shared bearer voting link must not be presumed to authorize reports/results. No active-round aggregate results.
