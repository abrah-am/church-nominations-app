# E4.7: Hide the Audience Presentation When Voting Starts

- **Epic:** E4 Ballot Operations
- **Priority:** P1 (proposed)
- **Workflow status:** Backlog refinement; Product Owner direction recorded 2026-11-02; transition/API ownership requires design
- **User story:** As an administrator, I want the audience presentation hidden whenever a voting poll starts, so nomination content or prior results are not left visible when ballot collection begins.

## Acceptance Criteria
- On successful start of any draft voting round, the authenticated presentation is hidden and its displayed content is cleared as part of the server-authoritative lifecycle transition.
- Starting a fresh voting attempt after an authorized reset also hides and clears the presentation.
- A failed or cancelled start leaves the current presentation visibility unchanged; the presentation is hidden only when the poll-start transition succeeds.
- Once the poll is active, reopening or reconnecting the presentation cannot restore stale nomination content or prior-round results as current content.
- The participant session link resolves to the active ballot during voting and never shows results or nomination content as the current phase. Existing ballot confidentiality rules remain unchanged.
- Closing the poll leaves the presentation neutral until the existing explicit voting-result reveal action is completed. This story does not auto-reveal results.
- Existing poll reopen behavior continues to clear current results; the presentation remains hidden until the administrator explicitly shows it again.
- Behavior is enforced server-side and tested for normal start, fresh reset/start, cancelled/failed start, hidden state, and stale viewer reconnect. UI-only hiding is insufficient.
- Hide/clear is tenant-scoped and does not expose poll status or results through presentation capabilities, caches, event streams, or errors.

## Scope and Dependencies
Presentation lifecycle safety on successful voting-poll start. Depends on E4.1 round-start confirmation, E4.5 fresh-attempt behavior, E6.8 presentation, E6.10 access policy, and the round-start API contract. Coordinate with E6.13 nomination publication so an active poll supersedes the nomination viewer snapshot.

## Explicitly Out of Scope
- Automatically revealing poll results after close.
- Changing the Audience presentation control or nomination publication behavior.
- Hiding the presentation merely because an administrator opened a draft or cancelled the start confirmation.
- Treating reopening an existing poll as a fresh poll start; existing reopen-clearing policy still applies.

## Product Owner Direction (2026-11-02)
- Automatically turn off the audience presentation every time a voting or polling session starts, to prevent results from being left visible.
- If no story already covers this lifecycle transition, track it as a separate follow-up; this story is newly added because the backlog had no matching requirement.

## Risks and Review Needs
- The current presentation visibility/session lifecycle and poll start may be implemented in separate API operations. Prefer a server-coordinated transition that cannot leave a visible stale snapshot if the browser closes or loses connectivity.
- Define whether legacy or multiple open presentation sessions are all revoked/hidden on poll start; validation must cover any presentation capability for the same election position.