# E4.3: Improve Guest Ballot Mobile and Recovery States

- **Epic:** E4 Ballot Operations
- **Priority:** P1 (proposed)
- **Workflow status:** Backlog; not formally accepted
- **User story:** As a guest voter, I want to understand how many candidates to select and whether my ballot was saved or replaced.

## Acceptance Criteria
- Ballot shows position, selection count, clear privacy wording, and progress toward the exact required number of choices.
- Submit/replace remains unavailable until the exact count is selected; prior choices are restored when the same profile returns.
- Loading, inactive, save success, and save failure states are distinguishable and announced accessibly.
- Layout and controls remain usable at mobile viewport sizes and by keyboard.

## Scope and Dependencies
Guest ballot UX, recovery feedback, mobile and keyboard usability. Depends on US-011 and E7 accessibility/responsive target.

## Relevant Approved Decisions
Ballot requires exact distinct selection count; the same browser profile may replace its ballot while active. Do not claim real-world person or physical-device uniqueness.
