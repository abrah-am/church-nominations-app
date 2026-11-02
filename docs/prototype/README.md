# E9.1 Prototype Reference

The canonical three-experience mock is [prototype.html](prototype.html). The older workflow-only mock is retained as [prototype-full-workflow.html](prototype-full-workflow.html) for comparison; use the canonical prototype for current implementation reference.

## Tagged Screenshots

Screenshots are stored under [`screenshots/`](screenshots/). Each captured state has desktop (`1280x800`) and mobile (`390x844`) images. Tag names are stable reference IDs for implementation discussions.

| Tag | State | Desktop | Mobile |
| --- | --- | --- | --- |
| P01 | Administrator dashboard | [PNG](screenshots/P01-admin-dashboard-desktop.png) | [PNG](screenshots/P01-admin-dashboard-mobile.png) |
| P02 | Election overview | [PNG](screenshots/P02-election-overview-desktop.png) | [PNG](screenshots/P02-election-overview-mobile.png) |
| P03 | Position setup before intake opens | [PNG](screenshots/P03-position-setup-desktop.png) | [PNG](screenshots/P03-position-setup-mobile.png) |
| P04a | Open intake, no names submitted | [PNG](screenshots/P04-intake-open-empty-desktop.png) | [PNG](screenshots/P04-intake-open-empty-mobile.png) |
| P04b | Open intake, submitted names as plain text | [PNG](screenshots/P04-intake-open-submitted-desktop.png) | [PNG](screenshots/P04-intake-open-submitted-mobile.png) |
| P05 | Closed intake review with editable rows | [PNG](screenshots/P05-intake-closed-review-desktop.png) | [PNG](screenshots/P05-intake-closed-review-mobile.png) |
| P05b | Name edited, before save | [PNG](screenshots/P05b-review-name-edited-desktop.png) | [PNG](screenshots/P05b-review-name-edited-mobile.png) |
| P06 | Consolidated list saved | [PNG](screenshots/P06-list-confirmed-desktop.png) | [PNG](screenshots/P06-list-confirmed-mobile.png) |
| P07 | Nominations revealed | [PNG](screenshots/P07-nominations-revealed-desktop.png) | [PNG](screenshots/P07-nominations-revealed-mobile.png) |
| P08 | Round 1 draft | [PNG](screenshots/P08-round-draft-desktop.png) | [PNG](screenshots/P08-round-draft-mobile.png) |
| P09 | Voting active | [PNG](screenshots/P09-voting-active-desktop.png) | [PNG](screenshots/P09-voting-active-mobile.png) |

Use [capture-reference.mjs](capture-reference.mjs) to refresh these 22 images. It drives the canonical prototype's admin UI and voter form through the available mock state transitions in one browser page. Ballot, results, and presentation routes are not included in this capture set yet. The prototypes are mock UI only, not references for server behavior or authorization.

## Change Workflow

Treat this prototype as a maintained product artifact, not an ad hoc scratch file. Changes to prototype behavior, screens, or styling should be introduced through an approved user story, with requirements, acceptance criteria, screenshots, and a handoff as appropriate. Keep prototype-only behavior clearly labeled and do not imply API or production behavior that is not implemented.

## Nomination State Reference

- **Open intake:** show the current profile count and configured name limit. Submitted names, editable fields, Save, and Remove are not shown.
- **Closed intake:** show the submitted names as editable inputs. A changed value enables its Save action; Remove is available on each row.
- **Workflow progress:** nomination remains the current step until a round draft exists. Configuring a draft advances the current step to voting rounds.

These are UI reference behaviors. Product rules and production API state remain defined by the linked story requirements and API contracts.
