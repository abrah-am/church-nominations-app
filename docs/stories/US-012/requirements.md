# US-012: Close a Round and Record Candidate Decisions

- **Epic:** P0 Ballot Operations
- **Priority:** P0
- **Workflow status:** Implemented for local POC; formal acceptance not recorded
- **User story:** As an administrator, I can monitor live aggregate results, close voting when ready, and record an outcome for every candidate so the next round contains only candidates I advance.

## Acceptance Criteria
- Only an authorized admin can close or reopen a poll and record candidate decisions.
- The authorized admin can view live aggregate candidate totals while voting is active; live data does not include voter identities, ballot-level choices, or a participation-to-choice mapping.
- The Audience Presentation control is the single visibility control for aggregate results on the participant viewer and room presentation. When off, both viewer surfaces contain no totals; when on during voting, both show the current aggregate snapshot; turning it off clears them.
- Closing ends ballot access and makes final aggregate totals available to the admin immediately. There is no separate **Reveal Results** action.
- Results include aggregate candidate totals, the ballot denominator, and approved thresholds without exposing voter identity or ballot records.
- Close/reopen times, actor, and candidate decisions are recorded without linking actors to ballot choices.
- For every candidate, the admin records exactly one outcome: **Elect**, **Advance**, or **Remove**. The decision is retained. Elected candidates count toward configured openings.
- A decision set is valid only when at least one candidate is marked **Elect** or at least two candidates are marked **Advance**. If it is incomplete or invalid, keep the admin at the current **Candidate decisions** step, explain what is missing, and preserve the selections for correction. Do not create a draft or mark the election complete.
- Saving decisions with one or more **Advance** actions creates a new draft round with zero ballots and only those candidates. Candidates marked **Elect** or **Remove** are excluded from that roster. Elected candidates remain listed in the workflow with an **Elected** label while subsequent rounds run.
- If no candidates are marked **Advance** and multiple candidates are marked **Elect**, show the elected-candidate list and require an explicit **Confirm** action before completing the position.
- If no candidates are marked **Advance** but exactly one candidate is marked **Elect**, save the outcome without creating an empty draft; the position is complete only if that candidate fills all configured openings.
- The election is complete only when all configured openings are filled.
- After an even-group, two-candidate cutoff, the poll closes automatically at `N - 1` submissions; an admin may override the cutoff and reopen the poll.

## Scope and Dependencies
Admin lifecycle actions, live admin aggregate results, Audience Presentation result visibility, and candidate decisions. Depends on US-011. Viewer and historical report contracts link to E6.8/E6.10 and E6.4/E8.2.

## Relevant Decisions
Only authorized admins can close/reopen and record outcomes. Admin live aggregate totals are allowed; participant and presentation visibility is controlled together by the Audience Presentation setting. Close ends voting and does not require separate result release. Admin decisions are Elect, Advance, or Remove for each candidate; only Advanced candidates enter a fresh round.

## Implementation Notes and Limitations
The current local POC has progress monitoring, close/reopen, aggregate preview, and basic candidate decisions. It must be updated to expose live aggregate admin totals, toggle-controlled viewer results, and required per-candidate Elect/Advance/Remove actions. Full election history and status presentation remain follow-up scope. The exact report audience and fields remain unresolved (PD-006).
