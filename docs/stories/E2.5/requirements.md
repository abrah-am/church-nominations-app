# E2.5: Restore Current Position Workflow State on Revisit

- **Epic:** E2 Nomination Workflow Clarity and Recovery
- **Priority:** P1 (proposed)
- **Workflow status:** Proposed; Product Owner approval required before implementation
- **User story:** As an election administrator, I want a position workflow to restore its current server state when I reopen it so I can continue managing nominations and voting without repeating setup actions or seeing stale workflow guidance.

## Problem and Root Cause

When an administrator leaves a position for the election list and later reopens it, the position workflow component mounts with no nomination intake in local state and `isExpanded` false. The intake GET is only issued after the administrator chooses **Open nomination intake**. As a result, a position with an existing open intake can render the progress-derived empty-state task and setup-oriented action instead of the current submission count, submitted names, and intake controls. Round configuration/results have a separate mount-time load path; intake state is the identified gap.

The election list refreshes election metadata on return, but the reopened position must independently hydrate its current intake and lifecycle data from the authoritative API. Progress metadata alone does not include submitted names or other intake details.

## Acceptance Criteria

- On opening or revisiting a position, the admin view loads the current position workflow state from the API without requiring a misleading setup action first.
- If nomination intake is open, display the current open-intake view, configured name limit, current profile-submission count, and every currently submitted name returned by the admin API.
- If intake is closed, restore the current closed/review/consolidation state and saved list according to the existing reveal and privacy rules.
- If no intake exists, show the existing create-intake task and setup action; do not create an intake as a side effect of loading.
- Reflect current round lifecycle and decision state on revisit using the existing authoritative round and result endpoints.
- Show a clear loading state while current workflow state is being fetched, and a recoverable error/retry state if loading fails. Do not silently present an empty/setup state when the current state is unknown.
- Preserve current behavior for leaving the position, unsaved-draft confirmation, manual refresh, and election-list navigation.
- Keep submitter/device identity private. Show only anonymous proposed names, never infer names from the profile count, and do not expose ballot totals during an active voting round.
- Add regression tests for leaving and reopening a position after submissions exist, including the displayed profile count and names, plus no-intake, closed-intake, loading, and API-error states as applicable.

## Scope

- Frontend position-workflow initialization and current-state hydration on navigation/revisit.
- Reuse the existing authenticated intake, round, and results API contracts.
- Focus on consistency between election/position lifecycle and the detailed workflow view.

## Out of Scope

- Changes to nomination submission, anonymity, consolidation, reveal, or voting lifecycle rules.
- New endpoints or persistence changes unless investigation during planning proves the existing API cannot provide required current state; any such contract change requires separate review.
- Preserving unsaved client drafts across navigation beyond the existing confirmation behavior.
- Changes to participant or presentation views.

## Dependencies and Risks

- Depends on US-008 for position-scoped intake and current submission data; E2.1 defines the open/closed admin presentation and privacy behavior.
- Coordinate intake hydration with existing round/result loading so the current task is not briefly or incorrectly derived from incomplete data.
- Avoid duplicate requests or stale responses when the administrator changes positions or leaves the workflow during loading.
- API responses must remain church-authorized and must not include submitter/device identity.

## Suggested Validation

- Component test: start with an existing open intake containing anonymous names, navigate back to the election list, reopen the same position, and assert the live intake view and names appear without clicking **Open nomination intake**.
- Component tests: no intake remains in setup; closed intake restores review/consolidation; loading and failed requests do not masquerade as an empty intake.
- API contract/integration check: current authorized intake response includes all current open submissions and no submitter/device identifiers.
- Verify active-round totals remain hidden and existing unsaved-draft navigation guard remains intact.
