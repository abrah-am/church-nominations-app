# E6.9: Hide Nomination Names Until Reveal and Edit One Shared List

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (high)
- **Workflow status:** Backlog; UX design approved 2026-10-22
- **User story:** As an administrator, I want to see only the submission count while nomination intake is open, then reveal and edit one shared list after closure so names are not exposed early and changes are observable to the meeting.

## Acceptance Criteria
- While intake is open, the admin interface and its API responses expose the submission count only; submitted names are not returned or exposed through previews, notifications, accessibility text, presentation data, or logs intended for the UI.
- Closing intake stops submissions but does not reveal names. The admin sees the count and an explicit `Reveal results` action.
- Names are shown only after an authorized admin reveal is confirmed by the server. Reveal loads one shared list directly; there is no separate raw-submission review followed by a refined/deduplicated list.
- The initial list preserves server-recorded submission order and within-submission order. Duplicate names remain distinct rows; no automatic merge, suppression, or silent removal occurs.
- The admin can explicitly add, correct, remove, reorder, and restore entries in the authenticated workspace. Only server-confirmed changes are treated as saved or broadcast.
- Each confirmed edit/removal/reorder/restore is recorded with sufficient before/after state, actor, and time to make changes reviewable. A removed entry is inactive but remains visible as a labeled tombstone/history item; a correction shows the prior and current value.
- Save failure preserves the last confirmed server value, identifies unsaved changes, and offers recovery. Conflicts do not silently overwrite concurrent edits. A failed removal leaves the entry active.
- After reveal, the same list is mirrored read-only to the presentation view. No edit controls appear there.
- The workflow is usable by keyboard and screen readers and handles long names and narrow viewports without clipping.

## Scope and Dependencies
Replaces the current separate nomination consolidation/refined-list step in US-009 for this flow. Depends on US-008 intake and E6.10 policy for change-history retention/access. Candidate selection into a voting round remains an explicit downstream admin workflow and is not an automatic part of reveal.

## Privacy Constraints
Do not expose submitter/device identity or associate a person with a submitted name. Submission count is not a verified count of people. Keep public submission/edit access separate from the admin's revealed shared list.
