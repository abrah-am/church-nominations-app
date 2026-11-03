# E6.13: Clarify Nomination Intake and Consolidation Stages

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (proposed)
- **Workflow status:** Accepted by Product Owner 2026-11-02; implementation complete; PR review and merge pending
- **User story:** As an administrator, I want the nomination workflow to identify the open intake and the post-close consolidation step with distinct, concise titles, so I can tell which stage I am managing.

## Acceptance Criteria
- The open nomination collection section is titled **Nomination Intake**.
- After intake closes, the workflow task and review section are titled **Review and consolidate**. After confirmation, the read-only list is titled **Consolidated list**. Accessible names clearly distinguish review from the confirmed list.
- The closed-stage view presents the editable shared nominee list for spelling corrections, duplicate removal, decline/removal, and restoration using the existing approved constraints. It does not imply that raw intake is still accepting submissions.
- There is no separate nomination **Reveal results** button. In the authenticated admin workspace, the existing **Audience presentation** show/hide control is the control for publishing/showing the closed nomination list to the read-only audience and participant viewer.
- During open intake, the presentation is off by default. When an authenticated admin turns it on, incoming names and confirmed changes appear live on the room presentation only; the participant session link does not show open-intake names.
- If the room presentation is on when intake closes, it remains on and transitions to the submitted list and confirmed consolidation changes; the closed list is published to participants at closure. If it is off at closure, the participant remains neutral until the admin turns the presentation on after closure.
- After closure, Show publishes the server-confirmed consolidated list and subsequent confirmed changes to both the room presentation and participant session viewer. Participants receive read-only content and never receive admin editing controls or submission/device identity.
- Hide after closure clears and revokes the current nomination list from both viewer surfaces. A later Show republishes the current server-confirmed list. Ending the presentation revokes its presentation-view capability under E6.10.
- A later active voting poll takes precedence in the participant session resolver; nomination content is not returned as the current phase while that poll is active.
- When the position is complete, the elected person or people appear on both current-session viewer surfaces. This does not grant historical-report access.
- The separate **Reveal results** action for closed voting rounds remains. This story does not change aggregate result authorization or reveal timing.
- Publication, visibility, and end behavior are server-authoritative, tenant-scoped, read-only for viewers, and covered by API and UI tests. UI state must not claim publication until the server confirms it.
- The titles and controls remain keyboard and screen-reader accessible and fit narrow viewports without clipping.
- After list confirmation, show the confirmed names as a plain list and expose **Prepare round 1**. Round setup includes an accessible selection-count stepper bounded from one through the confirmed roster size; **Start voting** is enabled only after a valid draft configuration is saved. The existing expected-voter confirmation remains required.
- **Cancel and rebuild draft** removes only an unstarted first-round draft and returns the administrator to the confirmed list; active or superseded rounds cannot be deleted.

## Scope and Dependencies
This is a focused terminology and nomination-publication interaction follow-up to E6.9. It revises E6.9's separate nomination reveal action by using the existing authenticated Audience presentation show/hide control to publish the closed list, while retaining distinct projector visibility. It depends on E6.8 presentation behavior, E6.9 shared-list lifecycle, E6.10 access policy, and E6.11 participant session phase resolution. API, cache, and transition contracts must be reviewed before implementation.

## Explicitly Out of Scope
- Removing or changing the closed-round **Reveal results** action for aggregate voting results.
- Publishing names while nomination intake is open.
- Showing submitter/device identities, private ballot information, live voting totals, or administrator controls to viewers.
- Automatic presentation hiding when a poll starts; that is tracked separately in E4.7.

## Product Owner Direction (2026-11-02)
- Use **Nomination Intake** for the intake stage and **Nomination Intake Consolidation** for the post-close editing stage.
- During open intake, Show controls room presentation only. Participants receive no incoming names.
- If the room is on at closure, the closed list publishes to participants at closure. If not, post-close Show publishes to both room and participant surfaces.
- Hide after closure retracts the list from both viewer surfaces; Show republishes the server-confirmed current list.
- The voting-result reveal action remains necessary and unchanged.
- Elected person or people are shown on both current-session viewer surfaces; historical reports remain separate.
- The approved prototype wording for the post-close task is **Review and consolidate**. Confirmation is distinct from presentation visibility. After confirmation, show a plain-text consolidated list and **Prepare round 1**; round setup asks how many names each ballot can select and offers **Start voting** and **Cancel and rebuild draft**.

## Implementation Notes and Remaining Contract Boundaries
- E6.9's existing persistence field and endpoint named `revealed` are reused for the server-confirmed consolidation transition for compatibility; presentation visibility remains a separate publication gate. Voting aggregate reveal remains separate.
- The current position-scoped nomination URL now returns a read-only closed state, not the E6.11 stable session-level participant route. Session-level phase resolution remains E6.11 scope.
- A successful poll start suppresses nominations from viewer projections while the active round is authoritative. E4.7 still owns the atomic presentation hide/clear transition behavior and any recovery details beyond this server-side projection guard.