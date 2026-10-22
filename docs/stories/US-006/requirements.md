# US-006: Register an Election Board and Record Attendance

- **Epic:** POC Identity and Onboarding
- **Priority:** P0
- **Workflow status:** Implemented for local POC; formal acceptance not recorded
- **User story:** As an authorized church administrator, I can register an election board for my church so election administration has a defined owner.

## Acceptance Criteria
- An election board is the church committee responsible for proposing people for positions and participating in their election.
- The POC enforces one board per church per year; its board membership may change from year to year, and prior-year board and membership history is retained.
- An authorized church administrator can register and maintain a year's board within a church; each board belongs to exactly one church and is associated with its year.
- The board has a non-empty named member roster for attendance purposes; members do not need application accounts or passwords for MVP participation.
- An authorized administrator can create sessions identified by date and record which named board members attended each session. Attendance is not inferred from nomination or voting activity.
- Board members propose candidates through the nomination workflow and vote through the existing guest-link flow, without signing in or entering a password.
- Named board membership and session attendance are stored separately from ballot records; no attendance entry, member identity, or participation status can be joined to a ballot or its selections.
- Tests cover board creation, listing/detail/update, year association, prior-year history, per-session attendance, anonymous guest-link voting, and cross-church access denial.

## Scope and Dependencies
Annual board roster and dated sessions/attendance. Depends on church registration, tenant authorization, nomination intake, and guest voting. Attendance correction/audit policy and multiple-board exceptions remain open.

## Relevant Decisions
Board members have no application accounts; they use guest nomination and voting links. Attendance and member identity must not map to ballot participation or choices.

## Implementation Notes and Limitations
Backlog reports one board per church/year, non-empty roster, dated sessions, replace-attendance save semantics, scoped APIs, and migration/API/UI coverage. Production hardening and changes to the POC cardinality rule are not included.
