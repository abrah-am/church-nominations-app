# E2.1: Make Intake States and Closure Consequences Clear

- **Epic:** E2 Nomination Workflow Clarity and Recovery
- **Priority:** P1 (proposed)
- **Workflow status:** Accepted by Product Owner 2026-10-22; implementation complete; merge authorization pending
- **User story:** As an administrator, I want to see whether intake is open or closed and what closing it does so I can operate the nomination window confidently.

## Acceptance Criteria
- Show intake state, the number of distinct browser profiles with a current non-empty submitted name list, configured name limit, and whether the public link is usable.
- Label the count as current profile submissions and explain that it counts browser profiles, not verified people; the first successful non-empty submission changes a profile's contribution from zero to one, replacing its list leaves the count unchanged, and withdrawing all names changes it back to zero.
- Allow a submitter to withdraw all names while intake is open; after withdrawal, that profile is not counted as a current contributor. The existing admin submission list and live count update accordingly.
- Show every currently proposed name in a numbered list sorted alphabetically by the full name, case-insensitively, with stable ordering for equal names.
- Keep the profile count separate from the number of proposed names; duplicate names from different profiles remain separate suggestions until administrator consolidation.
- Closing nominations has a clear label and confirmation only if required by the approved UX policy; after success, show that submissions are read-only and consolidation is next.
- Empty submissions have an explicit state and a clear next action.
- Updates and closure are announced accessibly; no submitter/device identity is displayed.

## Scope and Dependencies
Admin-facing intake state and closure UX, including empty and accessibility states. Depends on US-008 nomination intake. Product policy already permits admin closure; UX confirmation policy remains to be defined.

## Approved Refinement Decisions (2026-10-22)
- The count represents distinct browser profiles that currently have at least one proposed name. A first successful non-empty submission changes that profile's contribution from zero to one; replacing names leaves it one; an empty current list changes it to zero; a later non-empty resubmission changes it to one again.
- A profile may withdraw all names while intake is open; withdrawal deletes its current proposed-name rows and removes it from the current contributor count. This is not historical submission-event tracking.
- This count is an attendance cross-check only, not a verified count of people. Shared devices, multiple browser profiles, or cleared browser storage can make profile counts differ from people present.
- Proposed names remain free-form. Continue sorting by the full name alphabetically, case-insensitively, and number the rendered list; do not add structured first/last-name fields.
- The public form's primary action is labeled `Submit names`; after saving, the confirmation says the names were submitted.
- Count current proposed-name entries independently from contributor profiles. Repeated/duplicate names remain visible as submitted until an administrator consolidates them.

## Readiness
US-008 intake creation, sharing, live updates, and closure are implemented locally. Requirements, implementation plan, and UX decisions were approved; implementation, QA, review, and source-level UX validation are complete. Product Owner acceptance is recorded below. Merge authorization remains a separate pending approval.

## Implementation Notes and Limitations
Backlog says intake create/share/live updates/close are implemented locally. E2.1 is clarity/recovery work, not the underlying intake implementation.

## Acceptance
Product Owner accepted E2.1 on 2026-10-22. QA and independent code review are complete with no blocking findings. Rendered responsive/browser, keyboard-only, screen-reader, and measured contrast verification were not performed; full accessibility conformance is not claimed. Merge requires separate explicit authorization under the development workflow.
