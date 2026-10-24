# E6.9: Review Nominations and Share Live List Changes

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (high)
- **Workflow status:** Product Owner scope clarified 2026-10-23; implementation plan pending approval
- **User story:** As an administrator, I want to view all proposed names when nomination intake closes, then reveal the shared list in a separate presentation tab and refine it live by correcting misspellings, removing duplicates, and recording nominees who decline, so everyone present can follow the changes and verify the list as I prepare it.

## Acceptance Criteria
- While intake is open, the admin interface and admin API expose the number of distinct browser profiles with a current non-empty submitted list, configured name limit, and intake state only. Submitted names and the proposed-name-entry count are not returned or exposed through previews, notifications, accessibility text, presentation data, or UI-intended logs.
- Closing intake stops public submissions. The authenticated admin can review all anonymous proposed names and the profile count; closing alone does not publish names to the presentation.
- Closing creates one shared list from the original submissions; there is no separate raw-submission review followed by another refined list. The initial list is alphabetized case-insensitively by full name with deterministic tie ordering. Duplicate submissions remain separate entries until an admin explicitly removes duplicates.
- An explicit `Reveal results` action publishes the server-confirmed list to a separately opened presentation tab. Before reveal, the presentation remains neutral. After reveal, each confirmed admin change is reflected in the active presentation in real time.
- In the authenticated admin workspace, the admin may correct a name, remove a duplicate, record/remove a nominee who declines, remove another entry with a reason, and restore a removed entry. Adding names and changing the initial alphabetical order are not allowed.
- The presentation tab is read-only. It shows the current active list and a chronological, append-only change log for the revealed nomination session. The log makes corrections (before and after text), removals (including duplicate or declined reason when selected), and restorations visible as they are confirmed. It identifies the acting administrator by a non-sensitive display label and timestamp; it never exposes account email, submitter/device identity, or unrelated audit data.
- A removed entry disappears from the active list, while its removal event remains visible in the change log. Restoration returns it to the active list and appends a restoration event. Corrections, removals, and restorations are auditable; the public change log is not editable or deletable through the UI.
- Save failures preserve the last server-confirmed list and change log, identify unsaved edits, and provide a retry/recovery path. Concurrent edits must not silently overwrite one another. A failed operation is not shown as confirmed on the presentation.
- Save failures preserve the last server-confirmed list and identify unsaved edits with a retry/recovery path. Concurrent edits must not silently overwrite one another. A failed removal leaves the entry active.
- The original anonymous submitted names are retained with the election; browser-profile/device tokens are discarded when the shared list is created at close. The initial shared list is alphabetic, so original sequence need not determine display order. Retention duration for names and removal audit entries remains governed by PD-005/E8.2. Do not expose or retain a mapping from a name to its submitter/device after close.
- Before explicit presentation reveal, the presentation remains neutral and shows no submitted names, proposed-entry count, or profile count. The admin workspace displays the list after closure regardless of presentation state.
- After reveal, the active shared list and confirmed change log are mirrored to the separate read-only presentation tab. Removed names are not active list rows but their removal events remain visible. No edit controls appear there. Hiding/ending presentation clears displayed content; reopening it shows current list and authorized change history only after reveal.
- The workflow is usable by keyboard and screen readers and handles long names and narrow viewports without clipping.

## Scope and Dependencies
Replaces the current separate nomination consolidation/refined-list step in US-009 for this flow. Depends on US-008 intake and E6.10 policy for change-history retention/access. Candidate selection into a voting round remains an explicit downstream admin workflow and is not an automatic part of reveal.

## Privacy Constraints
Do not expose submitter/device identity or associate a person with a submitted name. Submission count is not a verified count of people. Keep public submission/edit access separate from the admin's revealed shared list.

## Roles and Capabilities

- **Admin:** An authenticated administrator with permission to correct names, remove duplicates or declined nominees, restore entries, and control reveal/presentation lifecycle.
- **Viewer:** A presentation-only audience mode. A viewer can see the currently revealed active list and its confirmed live change log, but cannot edit, remove, restore, reveal, hide, or otherwise mutate nominations. Viewer is not a third authenticated application role; it does not grant admin or participant-link access.
- The presentation access mechanism must be authorized and scoped to the active presentation session under E6.10. Its concrete session/token mechanism is an API/security design decision; it must not expose admin credentials or mutation endpoints to viewers.

## Product Owner Decisions (2026-10-23)

- During open intake, admins see only current contributing-profile count, name limit, and state. Submitted names and proposed-entry counts remain hidden.
- After closure, names are available to authenticated admins for review and editing. The explicit `Reveal results` action opens/publishes to a separate presentation tab; it does not control admin access. The presentation stays neutral until that action.
- On close, preserve original anonymous names/order with the election, but remove browser-profile/device tokens. The global retention duration remains open under PD-005/E8.2.
- Keep original submitted entries available for review. Admin may correct names, remove duplicates, record/remove nominees who decline, remove other entries with a reason, and restore removed names; adding names and changing order are not allowed. After reveal, the presentation shows confirmed list changes live and keeps an append-only, visible history of corrections, removals, and restorations. Correction before/after values and removal reasons are retained as change events under PD-005/E8.2.
- The initial shared-list order is alphabetic by full name, case-insensitive, with deterministic tie ordering; repeated names remain separate rows adjacent in the sorted list. Row order is fixed for this story and is not editable.
- Removed names are absent from the active list. The authenticated admin can inspect a separate Removed section and restore entries. The presentation does not show removed names as active rows, but it does show the confirmed removal event and its selected reason (for example, duplicate or declined).
- The presentation is read-only and separately admin-controlled under E6.10. It mirrors confirmed shared-list state and the nomination change log, without exposing submitter/device identity or admin account credentials.
