# E2.1 UX Design: Intake States and Closure Consequences

**Phase:** 2 — UX Discovery and Design
**Date:** 2026-10-22
**Status:** Product Owner approved 2026-10-22; ready for implementation preparation.

## User Goals and Scope

**Administrator:** Understand whether nomination intake is accepting changes, how many browser profiles currently have a non-empty list, how many proposed-name entries exist, whether the public link works, and what closing intake will do. Review all suggestions in a predictable order and move confidently to consolidation.

**Nomination submitter:** Use a shared link without signing in, enter or replace their own free-form name list within the limit, understand whether the save worked, and withdraw the whole list while intake is open. Learn clearly when intake has closed and changes are no longer possible.

This design covers the public nomination form and the administrator's intake section for open, closed, empty, loading, error, and live-update states. It does not redesign candidate consolidation or subsequent voting workflows.

## Decisions Already Approved

- The contributor count is the number of distinct browser profiles with a current non-empty submitted list. It is a profile-submission count, not a verified count of people.
- Replacing a profile's list does not change its contribution to that count; withdrawing all names removes that profile from the current count. This is a current-state count, not event history.
- The profile count and proposed-name-entry count are separate measures.
- Names stay free-form. The admin list is numbered and sorted by full name, case-insensitively, with stable ordering for equal names.
- Duplicate names from different profiles remain distinct submitted suggestions until an administrator consolidates them.
- Submitters can withdraw all names only while intake is open. Closed intake is read-only.
- No submitter or device identity is shown to administrators.

## User Journey

1. The submitter opens the position-specific shared link. A loading state appears while the intake is resolved.
2. When available and open, the page identifies the position and department, states the maximum names allowed, and loads the names currently saved by this browser profile (or one blank field when there are none).
3. The submitter edits the list in place, adds/removes individual fields, and submits the replacement list. Empty fields are ignored. The saved state confirms the replacement and explains that it can still be changed or withdrawn before closure.
4. To withdraw, the submitter chooses a clearly separated “Withdraw all names” action, reviews the consequence, and confirms. On success, the editable form returns to its empty state and a status message confirms that no names from this profile are currently included. They can submit again while intake remains open.
5. If an administrator closes intake before a save or withdrawal finishes, the public page switches to a read-only closed state after the server rejects the write. It must not imply the attempted change succeeded.
6. The administrator opens “Manage nominations” and scans intake status, both counts, limit, link usability, and the sorted submitted-name list. Live changes update counts and entries without exposing which profile contributed them.
7. The administrator selects “Close nominations.” After the approved confirmation step, the intake becomes closed, the link is disabled, the submitted list remains available read-only, and the page points to review and consolidation as the next action.

## Information Architecture and Layout

### Administrator

Keep the intake within the existing position workflow and its “Nomination intake” section. The current disclosure remains a reasonable container; its collapsed summary should be compact and unambiguous: `Nomination intake` plus `Open`/`Closed` and the profile-submission count. Do not summarize the name-entry count as “submissions.”

When expanded, order content as follows:

1. Intake status and operational summary.
2. Public-link state and, while open, the share URL and `Copy link` action.
3. Proposed-name list and its empty state.
4. Close control and a short consequence statement while open; read-only/consolidation guidance while closed.

Use a two-column summary at wide sizes only if all labels and values remain easy to scan; on narrow screens, stack each metric. Keep the profile count and name-entry count adjacent but separately labeled. Keep the status visually distinct from the counts; never rely on color alone.

The name list is an ordered list, not a bulleted list. Each row displays the full submitted name with its list number. Preserve repeated names and stable ordering among equal full names. Do not add profile identifiers, grouping by profile, or per-name attribution.

### Public Submitter

Use the existing focused public page: position name as the primary heading, department as context, instructions immediately above the form, and no administrator-only information. Keep the name editor and submit action in a single column. Place withdrawal below the primary save action and visually separated as a destructive/reversal action; do not give it equal prominence with routine editing.

When closed, replace the editable form with a concise read-only explanation. Do not expose the submitted list on this shared route unless product policy explicitly authorizes that; current design keeps the public view to intake state and avoids revealing submissions to other link holders.

## Exact Labels and Copy Proposal

### Administrator, Open

- Section: `Nomination intake`
- Status label/value: `Intake status` / `Open`
- Metric: `Current profile submissions` with help text: `Browser profiles with at least one name currently submitted. This is not a verified count of people.`
- Metric: `Proposed-name entries` with help text: `Includes repeated names; each submitted entry is counted separately.`
- Metric: `Names allowed per profile` (value is the configured limit)
- Link label: `Public nomination link`
- Link status: `Usable while intake is open`
- List heading: `Submitted names`
- List description: `Names are shown without submitter or device identity. Repeated names remain separate until you consolidate them.`
- Empty list: `No names have been submitted yet.`
- Empty-list supporting action: `Share the public link to invite suggestions.`
- Close button: `Close nominations`
- Close consequence: `Closing disables the public link and makes all submissions read-only. You can review and consolidate the names afterward.`
- Copy feedback: `Nomination link copied.`

### Administrator, Closed

- Status label/value: `Intake status` / `Closed`
- Link state: `Public link disabled`
- Read-only notice: `Nominations are closed. The public link is disabled and submissions are read-only.`
- With entries: `Review the submitted names, then consolidate them into the candidate list.`
- Empty list: `No names were submitted before intake closed.`
- Empty-list next step: `You can enter candidates manually in the candidate list below.`
- Saved consolidation status, if already present: `The consolidated candidate list is saved.`

### Public Submitter, Open

- Heading: use the position name; context line: department name.
- Instructions: `Enter up to {limit} names you would like to suggest. You can replace or withdraw your list until nominations close.`
- Editor heading: `Your names`
- Counter: `{entered} of {limit} names`
- Field labels: `Name 1`, `Name 2`, and so on.
- Add action: `Add another name`
- Submit action: `Submit names`
- Submit progress: `Submitting…`
- Submit success with names: `Your names were submitted. You can replace or withdraw them until nominations close.`
- Save success after withdrawal: `Your names have been withdrawn. This profile has no names currently included. You may submit a new list while nominations are open.`
- Withdrawal action: `Withdraw all names`
- Withdrawal confirmation title: `Withdraw your names?`
- Withdrawal confirmation body: `This removes every name currently saved by this browser profile from the intake. You can submit a new list while nominations remain open.`
- Withdrawal confirmation actions: `Keep my names` and `Withdraw names`

### Public Submitter, Closed or Unavailable

- Closed heading: `Nominations are closed`
- Closed body: `This intake is no longer accepting changes. Any names saved before it closed remain available to the administrator for review.`
- Unavailable heading: `This link is unavailable`
- Unavailable body: `The nomination intake may have been removed or this link may be incorrect.`
- Load failure alert: `We could not load this nomination form. Check your connection and try again.`
- Save failure alert: `Your names were not saved. Please try again.`
- Limit validation: `You can submit up to {limit} names. Remove a name to continue.`

Avoid “people,” “voters,” “participants,” “unique people,” or “attendance count” as labels for the profile count. “Current profile submissions” is intentionally explicit; supporting text should remain adjacent to the metric, not hidden behind hover-only help.

## Interaction Behavior

### Submit and Replace

- Each browser profile sees its current list when the form loads. The public count is not exposed to submitters.
- Editing is local until the submitter activates `Submit names`; that action replaces the profile's complete current list rather than appending individual rows.
- Count only non-empty trimmed names toward the configured per-profile limit. Do not allow saving an empty list through the ordinary save action; use the explicit withdrawal action instead.
- Disable duplicate submissions while a save is in progress. On success, reflect the server-returned current list and announce success. On failure, preserve the user's unsaved field values and explain that no save was confirmed.
- If the intake closes during a save, show the closed read-only state and a message that the change was not accepted.

### Withdraw All

- Offer withdrawal only when the current profile has one or more saved names and the intake is open.
- Require explicit confirmation because this removes the profile's entire current list and decreases the admin's current profile count; make the consequence clear in the confirmation.
- On cancel, preserve the saved and edited form state. On success, clear the fields, update the profile's local state to empty, and announce the success text above. The administrator view should receive the updated names and count through the existing live-update flow.
- Count transition: first non-empty submission changes a profile's count contribution from zero to one; edits/replacements keep it one; withdrawal changes it to zero; later resubmission changes it to one again.
- If withdrawal fails, keep the last confirmed saved state and do not claim the profile was removed from the count.
- Product approval is required for the confirmation pattern and the exact behavior when the user has unsaved edits at the time they request withdrawal. Recommendation: the confirmation should explicitly withdraw the saved list; do not silently discard local edits until the action succeeds, and offer a cancel path.

### Admin Closure

- Keep `Close nominations` available only while open. Present it as an operationally consequential action, not as a routine form submit.
- **Recommendation requiring Product Owner approval:** require a confirmation dialog. Closing disables the shared public link and makes all future submit/replace/withdraw actions unavailable; the admin list remains reviewable. This is consequential and not reversible through the current UX, so confirmation prevents accidental closure.
- Proposed dialog: title `Close nominations?`; body `The public link will stop accepting changes. Current submitted names will remain available for review and consolidation.` Actions: `Keep intake open` and `Close nominations`.
- During the close request, prevent repeat activation and announce `Closing nominations…`. On success, update the status, disable/hide the usable link, preserve the list, and announce the read-only state and next step. On failure, keep the intake open and show a recoverable error.

## Administrator States

| State | Presentation and behavior |
| --- | --- |
| Not created | Show name-limit setup and `Create intake`; explain the limit refers to names per browser profile. |
| Loading | Keep the section context and show `Loading nomination intake…` with a polite status announcement. Avoid presenting zero counts as if loaded. |
| Open, no names | Show `Open`, `0` current profile submissions, `0` proposed-name entries, limit, usable link, explicit empty message and share-link next action, then close control and consequence text. |
| Open, with names | Show both independent counts, limit, usable link, alphabetically sorted numbered list, and close control. Repeated names remain separate. |
| Closed, with names | Show `Closed`, final current profile and entry counts, disabled-link state, numbered read-only list, and next action to consolidate. No public editing or withdrawal affordance. |
| Closed, no names | Show zero counts, disabled-link state, `No names were submitted before intake closed`, and the existing manual candidate-entry next step. |
| Load/create/close error | Keep the last known state where available; show a specific `role="alert"` message near the relevant action and a retry path. Never display a successful closed state when close failed. |
| Live update | Update both counts and the ordered list from the same snapshot. Announce a concise change such as `Submissions updated: {profiles} current profile submissions and {entries} proposed-name entries.` Do not announce profile identity or every individual name in a way that becomes noisy. |
| Live stream unavailable | Retain the last confirmed snapshot and show `Live updates unavailable. Refreshing submissions periodically.` If fallback refresh also fails, disclose that values may be out of date and provide a manual refresh/retry action. |
| Intake closes elsewhere | Switch the admin panel to closed/read-only, disable the public link and close control, preserve the latest confirmed list, and announce closure once. |

## Responsive Behavior

- Preserve the existing single-column public form on all widths. Keep the heading, limit instructions, fields, and primary save action in reading order.
- On narrow screens, stack admin summary metrics and link controls; allow the URL input to wrap or remain horizontally scrollable within its own control without expanding the page. Keep copy action adjacent and full-size enough to tap.
- Make `Close nominations` and withdrawal actions easy to find without placing them adjacent to routine save/copy actions. On narrow screens, stack dialog actions, with the safer cancel action first in focus/order and the consequential action clearly distinguished.
- Long free-form names must wrap without clipping or horizontal page overflow. The ordered-list marker remains visible at 320 CSS pixels.
- Maintain visible keyboard focus and target sizes consistent with the existing button/input sizing; do not rely on hover for explanations or state.

## Accessibility Requirements

- Use semantic headings, a real ordered list (`ol`/`li`) for numbered names, and programmatic labels for all form controls.
- Expose loading and non-urgent save/live-update feedback through a polite status region (`role="status"` or equivalent `aria-live="polite"`); expose validation and request failures through an alert region. Avoid announcing the entire name list on every live update.
- Ensure status (`Open`, `Closed`, link disabled) is text and not color-only. Keep metric labels and explanatory text associated with their values.
- The profile-count explanation must be visible or available through a keyboard-accessible disclosure, not a hover-only tooltip.
- Confirmation dialogs must have an accessible name and description, move focus into the dialog, keep focus contained, support Escape to cancel, return focus to the initiating control, and put initial focus on the safer action.
- After save, withdrawal, closure, or live refresh, do not unexpectedly move focus. Keep the changed status discoverable by assistive technology.
- All actions must work by keyboard. Disabled actions must communicate why where the reason is not self-evident. Respect reduced-motion preferences already established by the application.
- Verify contrast for status, muted explanatory copy, focus rings, and destructive actions against WCAG 2.2 AA; current palette values should be checked in rendered states.

## Privacy and Usability Risks

- **Profile count may be mistaken for people count:** Keep “browser profiles” in the label/explanation and explicitly disclaim verified person count. Shared devices, multiple profiles, and cleared storage affect the relationship to actual people.
- **Link sharing:** Anyone possessing the public link can submit while open. Make link usability and closure consequence clear to admins; never imply that one profile equals one person.
- **Withdrawal ambiguity:** Users may think removing individual blank fields withdraws saved names. The distinct all-names action and success message should state that the saved list was removed.
- **Duplicate-name expectation:** Numbering and sorting can look like a deduplicated candidate roster. Explicitly state repeated entries remain separate until admin consolidation.
- **Live-update privacy:** Keep counts and names aggregate/current-state only. Never display profile identifiers, per-profile grouping, or inferred identities. Avoid live announcements that unexpectedly disclose a changing list in a shared room.
- **Accidental closure:** Closure disables the public link. Confirmation is recommended; reopening is not in this story and should not be implied.
- **Stale data:** When streaming or refresh fails, label the snapshot as potentially stale rather than presenting it as current without qualification.
- **Local unsaved edits during withdrawal:** Clarify whether withdrawal acts on the last saved list and what happens to unsaved field edits before implementation.

## Product Owner Approval Questions

Resolved by Product Owner on 2026-10-22:

1. **Closure confirmation:** Require an explicit confirmation dialog before closing; state that the public link will stop accepting changes and current names remain reviewable.
2. **Withdrawal confirmation:** Require an explicit confirmation before withdrawing the complete saved list.
3. **Unsaved edits during withdrawal:** On successful withdrawal, clear both saved and unsaved name fields and show the empty state. If withdrawal fails or is cancelled, preserve all current fields.
4. **Live announcement granularity:** Announce the updated counts and changed names. Keep names anonymous and do not announce profile identity or attribution.
5. **Unavailability semantics:** Retain distinct valid-closed and unavailable-link states, as recommended.

## UX Acceptance Checklist

- Admin can distinguish current browser-profile submissions from proposed-name entries and does not see either described as a verified people count.
- Open, closed, empty, loading, error, live-update, and stale/live-unavailable states are specified and have clear next actions.
- Admin names render as a stable, case-insensitive full-name alphabetical ordered list, retaining duplicate entries.
- Submitter can replace the complete list or withdraw all saved names while open; withdrawal is unavailable once closed.
- Closure clearly explains the disabled public link and read-only consequence; confirmation follows the approved policy.
- No submitter/device identity or per-profile attribution is exposed.
- Keyboard, screen-reader announcements, responsive layout, focus management, and contrast meet the stated accessibility requirements.