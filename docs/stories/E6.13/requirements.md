# E6.13: Clarify Nomination Intake and Consolidation Stages

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (proposed)
- **Workflow status:** Backlog refinement; Product Owner direction recorded 2026-11-02; implementation contract review required
- **User story:** As an administrator, I want the nomination workflow to identify the open intake and the post-close consolidation step with distinct, concise titles, so I can tell which stage I am managing.

## Acceptance Criteria
- The open nomination collection section is titled **Nomination Intake**.
- After intake closes, the editing/review stage is titled **Nomination Intake Consolidation**. The title is used consistently in the workflow task, relevant section heading, and accessible names for that stage.
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
- The title and controls remain keyboard and screen-reader accessible and fit narrow viewports without clipping.

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

## Risks and Review Needs
- E6.9 and the E6.10/API contract currently treat nomination publication as a distinct explicit reveal operation. Update and verify API authorization, participant-phase resolution, SSE snapshots, and cache invalidation before implementation.
- A poll start must atomically supersede nomination content so viewers cannot continue to see the list as current; E4.7 defines the complementary presentation hide/clear behavior.