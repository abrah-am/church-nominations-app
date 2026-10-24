# Product Backlog

**Purpose:** Status dashboard and index. Story acceptance criteria and scope live in the linked requirements files; unresolved product-wide questions are in [product-decisions.md](product-decisions.md). Local POC implementation is not formal story acceptance or production readiness.

**POC baseline evidence (backlog snapshot 2026-10-16):** The local application foundation was reported implemented; API tests 2/2 and frontend tests 4/4 passed, frontend production build and API boot JAR succeeded, and a browser check showed `API connected`. The frontend lint note was one existing non-null assertion warning in `apps/web/src/main.tsx`. These are historical baseline results, not current full-suite or story-acceptance claims. The local POC workflow includes onboarding, annual boards/attendance, election setup, nominations/consolidation, private rounds/ballots, cutoff/reopen, reveal, and candidate decisions.

## Active Stories

| ID | Epic | Story | Priority | Workflow status | Dependencies | Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| E2.2 | E2 Nomination Workflow Clarity and Recovery | Preserve consolidation drafts on failure and navigation | P1 | Backlog | US-009 | [requirements](../stories/E2.2/requirements.md) |
| E2.3 | E2 Nomination Workflow Clarity and Recovery | Explain roster lock and provide pre-draft edit path | P1 | Backlog | US-009, E2.2 | [requirements](../stories/E2.3/requirements.md) |
| E3.1 | E3 Round Setup and Candidate Roster | Clarify roster source and valid selection count | P1 | Backlog | US-009, US-010; prior decisions | [requirements](../stories/E3.1/requirements.md) |
| E3.2 | E3 Round Setup and Candidate Roster | Preview next-round roster from saved decisions | P1 | Backlog | US-012, E5.2 | [requirements](../stories/E3.2/requirements.md) |
| E3.4 | E3 Round Setup and Candidate Roster | Make candidate rosters easy to review | P1 | Backlog | Round roster data; E7 target | [requirements](../stories/E3.4/requirements.md) |
| E4.1 | E4 Ballot Operations | Explain expected voter count and cutoff before start | P1 | Backlog | Round start/configuration | [requirements](../stories/E4.1/requirements.md) |
| E4.2 | E4 Ballot Operations | Make ballot progress and lifecycle actions scannable | P1 | Backlog | Round lifecycle; E4.5 | [requirements](../stories/E4.2/requirements.md) |
| E4.3 | E4 Ballot Operations | Improve guest ballot mobile and recovery states | P1 | Backlog | US-011, E7.1 | [requirements](../stories/E4.3/requirements.md) |
| E4.6 | E4 Ballot Operations | Make the draft round's next action visible | P1 | Backlog | Round lifecycle; E4.1 | [requirements](../stories/E4.6/requirements.md) |
| E5.1 | E5 Results Review and Candidate Decisions | Make result rankings and recommendations easy to scan | P1 | Backlog | US-012; result access policy | [requirements](../stories/E5.1/requirements.md) |
| E5.2 | E5 Results Review and Candidate Decisions | Show unsaved and failed candidate decisions | P1 | Backlog | Candidate decision API; audit policy | [requirements](../stories/E5.2/requirements.md) |
| E5.3 | E5 Results Review and Candidate Decisions | Provide a reviewed-results handoff to the next round | P1 | Backlog | E3.2, E5.2 | [requirements](../stories/E5.3/requirements.md) |
| E6.8 | E6 Election Completion and History | Present revealed session content with live nomination changes | P1 (high) | Backlog; presentation tab/API and event-history contract review pending | E6.9, E6.10, US-012 | [requirements](../stories/E6.8/requirements.md) |
| E6.9 | E6 Election Completion and History | Review nominations, reveal, and share live list changes | P1 (high) | Requirements revised 2026-10-23; separate presentation tab, live change log, and correction/removal reasons remain to implement; PD-005 retention remains a production gate | US-008, E6.10; replaces separate refined-list step in US-009 | [requirements](../stories/E6.9/requirements.md) |
| E6.12 | E6 Election Completion and History | Show a session QR code in the presentation view | P1 (high; future follow-up) | Future backlog; QR is not part of initial link delivery | E6.8, E6.11 | [requirements](../stories/E6.12/requirements.md) |
| E7.2 | E7 Accessibility and Responsive Administration | Audit and repair workflow semantics and keyboard access | P1 | Backlog | E7.1 | [requirements](../stories/E7.2/requirements.md) |
| E7.3 | E7 Accessibility and Responsive Administration | Validate responsive layouts for core workflows | P1 | Backlog | E7.1; approved device matrix | [requirements](../stories/E7.3/requirements.md) |
| US-014 | P1 Future Integration Discovery | Discover member directory integration | P1 | Discovery not started; integration is future scope | System of record and access decision | [requirements](../stories/US-014/requirements.md) |
| US-015 | P0 Ballot Operations (legacy umbrella) | Private voting rounds POC | P0 | Local POC work reported; handoff remains WIP; no acceptance/merge recorded | US-007–US-012; overlaps granular E4/E5 stories | [requirements](../stories/US-015/requirements.md) |

## Defects / Follow-up

| ID | Area | Defect | Priority | Workflow status | Related story |
| --- | --- | --- | --- | --- | --- |
| DEFECT-001 | E1 Election and Position Progress | Position stepper shows “Progress unavailable” and “Action unavailable” when progress metadata is missing; verify the running API includes `progressStatus` and `nextAction` before treating this as an E1.2 regression. | P1 | Reproduction needed; check API version/response | [E1.2](../stories/STORY-E1.2/requirements.md) |

## Blocked / Decision Needed

| ID | Epic | Story | Priority | Workflow status | Dependencies | Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| E2.4 | E2 Nomination Workflow Clarity and Recovery | Decide correction behavior after draft creation | P1 | Product decision needed | None; blocks E3.3 | [requirements](../stories/E2.4/requirements.md) |
| E3.3 | E3 Round Setup and Candidate Roster | Implement approved draft correction policy | P1 | Blocked | E2.4 | [requirements](../stories/E3.3/requirements.md) |
| E4.4 | E4 Ballot Operations | Document and validate device-profile limitations | P1 | Production policy decision needed | E8.2 | [requirements](../stories/E4.4/requirements.md) |
| E4.5 | E4 Ballot Operations | Reset a closed voting round and start a fresh attempt | P1 | Reset/retention decisions needed | E6 history; E8.2 | [requirements](../stories/E4.5/requirements.md) |
| E5.4 | E5 Results Review and Candidate Decisions | Show saved candidate decisions with a single undo action | P1 | Undo eligibility decision needed | Later-round roster behavior; E2.4/E3.3 | [requirements](../stories/E5.4/requirements.md) |
| E6.1 | E6 Election Completion and History | Define completion states and transition rules | P1 | Product decision needed | Majority/runoff and candidate-decision rules | [requirements](../stories/E6.1/requirements.md) |
| E6.2 | E6 Election Completion and History | Show completion status in election and position lists | P1 | Blocked | E6.1; E1.1/E1.2 | [requirements](../stories/E6.2/requirements.md) |
| E6.3 | E6 Election Completion and History | Build navigable position history | P1 | Blocked by history access/privacy policy | E6.1, E6.4, E8.2 | [requirements](../stories/E6.3/requirements.md) |
| E6.4 | E6 Election Completion and History | Define historical result and report access | P1 | Product/security decision needed | E8.2 | [requirements](../stories/E6.4/requirements.md) |
| E6.5 | E6 Election Completion and History | Decide and design a results-only view for poll participants | P1 | Blocked by E6.4 | E6.4, E8.2 | [requirements](../stories/E6.5/requirements.md) |
| E6.6 | E6 Election Completion and History | Confirm elected people and mark position openings filled | P1 | Product clarification needed | E6.1; candidate elected outcomes | [requirements](../stories/E6.6/requirements.md) |
| E6.7 | E6 Election Completion and History | Handle declined offers and select a replacement path | P1 | Product clarification needed | E6.6; last-round results and candidate roster | [requirements](../stories/E6.7/requirements.md) |
| E6.11 | E6 Election Completion and History | Reuse one participant link across an active session | P1 (high) | Policy approved; API/security contract review pending | US-008, US-011, US-012, E6.9, E6.10 | [requirements](../stories/E6.11/requirements.md) |
| E7.1 | E7 Accessibility and Responsive Administration | Approve accessibility target and test approach | P1 | Product decision needed | Jurisdiction/device requirements | [requirements](../stories/E7.1/requirements.md) |
| E8.1 | E8 Privacy, Audit, and Production Readiness | Resolve production identity and account lifecycle | P0 production | Production blocker | Identity, account and transport policy | [requirements](../stories/E8.1/requirements.md) |
| E8.2 | E8 Privacy, Audit, and Production Readiness | Define privacy, participation, and retention policy | P0 production | Product/privacy decision needed | Privacy and retention inputs | [requirements](../stories/E8.2/requirements.md) |
| E8.3 | E8 Privacy, Audit, and Production Readiness | Complete tenant and privacy security verification | P0 production | Partial POC coverage; production verification needed | US-002, E8.2, E6.4/E6.5 | [requirements](../stories/E8.3/requirements.md) |
| E8.4 | E8 Privacy, Audit, and Production Readiness | Define operational readiness and recovery | P0 production | Operations/Product Owner decision needed | Scale, hosting, privacy and retention | [requirements](../stories/E8.4/requirements.md) |
| US-002 | P0 Security Foundation | Tenant data isolation | P0 | Partial local POC; full endpoint coverage not verified | Identity/membership; scoped guest links | [requirements](../stories/US-002/requirements.md) |
| US-003 | P0 Security Foundation | Maintain church users and permissions | P0 | Partial local POC; production identity unresolved | US-002, US-004, US-005 | [requirements](../stories/US-003/requirements.md) |
| US-013 | P1 History and Reporting | Historical reports and audit review | P1 | Not started; report details unresolved | E6.1, E6.4, E8.2 | [requirements](../stories/US-013/requirements.md) |

## Completed / Reconciled / POC Implemented

“POC implemented” records local behavior only. It does not mean formally accepted, merged, production-ready, or Done. Reconciled entries are closed as duplicate/covered scope and link to their closure evidence. No unnumbered story below has recorded Product Owner acceptance and merge evidence.

| ID | Epic | Story | Priority | Workflow status | Dependencies | Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| E1.1 | E1 Election and Position Progress | Show meaningful election lifecycle status | P1 | Accepted by Product Owner 2026-10-22; implemented and merged (`70e41be`) | Election/position lifecycle data | [requirements](../stories/STORY-E1.1/requirements.md) |
| E1.2 | E1 Election and Position Progress | Show position progress and next action | P1 | Accepted by Product Owner 2026-10-21; PR #5 merged (`a23033e`) | E1.1 concepts; position workflow data | [requirements](../stories/STORY-E1.2/requirements.md) |
| E1.3 | E1 Election and Position Progress | Remove contradictory election setup notice | P1 | Closed; scope delivered by merged E1.1/E1.2; no separate implementation | E1.1, E1.2 | [requirements](../stories/E1.3/requirements.md) |
| E6.10 | E6 Election Completion and History | Approve session-link and presentation access policy | P1 (high) | Accepted by Product Owner 2026-10-23; policy recorded; no application implementation in scope | E6.4, E6.5, E8.2, PD-004, PD-006, PD-012 | [requirements](../stories/E6.10/requirements.md) |
| E2.1 | E2 Nomination Workflow Clarity and Recovery | Make intake states and closure consequences clear | P1 | Accepted by Product Owner 2026-10-22; merge pending explicit authorization | US-008 | [requirements](../stories/E2.1/requirements.md) |
| US-001 | P0 Developer Foundation | Reproducible local database environment | P0 | Implemented locally; acceptance not recorded | Docker Compose, PostgreSQL, integration tests | [requirements](../stories/US-001/requirements.md) |
| US-004 | POC Identity and Onboarding | Register an administrator account | P0 | Implemented for local demonstration; acceptance not recorded | Identity persistence; US-002 | [requirements](../stories/US-004/requirements.md) |
| US-005 | POC Identity and Onboarding | Register a church | P0 | Implemented for local demonstration; acceptance not recorded | US-004, US-002 | [requirements](../stories/US-005/requirements.md) |
| US-006 | POC Identity and Onboarding | Register an election board and record attendance | P0 | Implemented locally; acceptance not recorded | US-005, tenant authorization | [requirements](../stories/US-006/requirements.md) |
| US-007 | P0 Election Setup | Configure a department election | P0 | Implemented for local setup; acceptance not recorded | US-005, US-002 | [requirements](../stories/US-007/requirements.md) |
| US-008 | P0 Nomination Workflow | Collect position nominations | P0 | Implemented for local POC; acceptance not recorded | US-007 | [requirements](../stories/US-008/requirements.md) |
| US-009 | P0 Nomination Workflow | Consolidate nominations into the first roster | P0 | Implemented for local POC; acceptance not recorded | US-008 | [requirements](../stories/US-009/requirements.md) |
| US-010 | P0 Round Setup | Configure a voting round | P0 | Implemented for local POC; acceptance not recorded | US-007, US-009 | [requirements](../stories/US-010/requirements.md) |
| US-011 | P0 Ballot Operations | Cast or replace a private ballot | P0 | Implemented for local POC; acceptance not recorded | US-010, active scoped voting link | [requirements](../stories/US-011/requirements.md) |
| US-012 | P0 Ballot Operations | Close and reveal a round | P0 | Implemented for local POC; acceptance not recorded | US-011 | [requirements](../stories/US-012/requirements.md) |

## Product Outcome

An administrator can onboard a church, establish its annual board, configure a department election with multiple positions/openings, collect and consolidate nominations, operate private voting rounds, and review aggregate outcomes without exposing voter-to-choice mappings. Current POC capability is a development baseline; production readiness and end-to-end acceptance remain outstanding.

## Backlog Rules

- Keep acceptance criteria, scope, decisions, and implementation evidence in each linked story requirements file and its handoff; keep this page as an index/dashboard.
- Do not mark a story Done without verified acceptance, required tests/reviews, and merge evidence per [development workflow](../development-workflow.md).
- Approved cross-story policies are recorded in the story/technical source of truth; unresolved product-wide decisions are tracked in [product-decisions.md](product-decisions.md).
- Preserve existing story IDs. Proposed `US-001`–`US-015` assignments are new identifiers for previously unnumbered work; E1–E8 identifiers are unchanged.
