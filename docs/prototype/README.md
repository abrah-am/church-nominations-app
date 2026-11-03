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
| P07 (legacy) | Nominations revealed; superseded by P12 | [PNG](screenshots/P07-nominations-revealed-desktop.png) | [PNG](screenshots/P07-nominations-revealed-mobile.png) |
| P08 | Round 1 draft | [PNG](screenshots/P08-round-draft-desktop.png) | [PNG](screenshots/P08-round-draft-mobile.png) |
| P09 | Voting active | [PNG](screenshots/P09-voting-active-desktop.png) | [PNG](screenshots/P09-voting-active-mobile.png) |
| P10 | Live open intake, room presentation on | [PNG](screenshots/P10-intake-live-desktop.png) | [PNG](screenshots/P10-intake-live-mobile.png) |
| P11 | Closed consolidation, not yet published | [PNG](screenshots/P11-consolidation-private-desktop.png) | [PNG](screenshots/P11-consolidation-private-mobile.png) |
| P12 | Consolidated list published | [PNG](screenshots/P12-consolidation-published-desktop.png) | [PNG](screenshots/P12-consolidation-published-mobile.png) |
| P13 | Audience presentation with live intake names | [PNG](screenshots/P13-presentation-live-intake-desktop.png) | [PNG](screenshots/P13-presentation-live-intake-mobile.png) |
| P14 | Participant session with published list | [PNG](screenshots/P14-participant-published-list-desktop.png) | [PNG](screenshots/P14-participant-published-list-mobile.png) |
| P15 | Voting active, presentation hidden | [PNG](screenshots/P15-voting-active-hidden-display-desktop.png) | [PNG](screenshots/P15-voting-active-hidden-display-mobile.png) |

The original P01-P09 capture set is preserved. Use [capture-reference.mjs](capture-reference.mjs) for those original workflow captures and [capture-updated-flow.mjs](capture-updated-flow.mjs) to generate the revised P10-P15 states. Together the documented sets contain 34 desktop/mobile screenshots. The prototype uses browser-local mock state and can simulate same-origin tab updates; it does not demonstrate server behavior or authorization.

## Change Workflow

Treat this prototype as a maintained product artifact, not an ad hoc scratch file. Changes to prototype behavior, screens, or styling should be introduced through an approved user story, with requirements, acceptance criteria, screenshots, and a handoff as appropriate. Keep prototype-only behavior clearly labeled and do not imply API or production behavior that is not implemented.

## Nomination State Reference

- **Open intake:** show the current profile count and configured name limit. Submitted names are visible to admins. The audience presentation is off by default; when enabled, it shows incoming names live on the room display only. The participant session link does not show open-intake names.
- **Review and consolidate:** after closure, show the full submitted list as editable inputs. A changed value enables its Save action; Remove is available on each row. Duplicate names remain until explicitly removed. **Confirm consolidated list** saves the edits and shows the confirmed names as a plain list, with **Prepare round 1** as the next action.
- **Publication:** if the room presentation was on when intake closes, it remains on and the consolidated list is also released to participants. Otherwise, participants stay neutral until the admin turns the presentation on. Hiding after closure clears both viewer surfaces. An active poll hides the presentation; closed poll results still require explicit reveal.
- **Round 1 setup:** **Prepare round 1** opens a draft under the **Round setup** heading. A compact, labeled stepper configures the number of names each ballot can select, from 1 through the confirmed roster size. **Start voting** is enabled only for a valid whole-number selection count. **Cancel and rebuild draft** returns to the confirmed list. Later-round mock selection counts remain one.
- **Workflow progress:** nomination remains the current step until a round draft exists. Configuring a draft advances the current step to voting rounds.

These are UI reference behaviors. Product rules and production API state remain defined by the linked story requirements and API contracts.
