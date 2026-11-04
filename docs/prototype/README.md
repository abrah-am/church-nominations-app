# E9.1 Prototype Reference

The current three-experience prototype is [prototype.html](prototype.html). Use it as the sole prototype reference for implementation.

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
| P16 | Voting active with simulated submissions | [PNG](screenshots/P16-voting-active-simulated-desktop.png) | [PNG](screenshots/P16-voting-active-simulated-mobile.png) |
| P17 | Voting closed with admin results | [PNG](screenshots/P17-voting-closed-preview-desktop.png) | [PNG](screenshots/P17-voting-closed-preview-mobile.png) |
| P18 | Legacy voting results released capture | [PNG](screenshots/P18-voting-results-released-desktop.png) | [PNG](screenshots/P18-voting-results-released-mobile.png) |

The original P01-P09 capture set is preserved. Use [capture-reference.mjs](capture-reference.mjs) for those original workflow captures, [capture-updated-flow.mjs](capture-updated-flow.mjs) for the revised P10-P15 states, and [the E5.1 capture harness](../stories/E5.1/capture-results-reference.mjs) for P16-P18. Together the documented sets contain 40 desktop/mobile screenshots. The prototype uses browser-local mock state and can simulate same-origin tab updates; it does not demonstrate server behavior or authorization.

## Change Workflow

Treat this prototype as a maintained product artifact, not an ad hoc scratch file. Changes to prototype behavior, screens, or styling should be introduced through an approved user story, with requirements, acceptance criteria, screenshots, and a handoff as appropriate. Keep prototype-only behavior clearly labeled and do not imply API or production behavior that is not implemented.

## Nomination State Reference

- **Open intake:** show the current profile count and configured name limit. Submitted names are visible to admins. The audience presentation is off by default; when enabled, it shows incoming names live on the room display only. The participant session link does not show open-intake names.
- **Review and consolidate:** after closure, show the full submitted list as editable inputs. A changed value enables its Save action; Remove is available on each row. Duplicate names remain until explicitly removed. **Confirm consolidated list** saves the edits and shows the confirmed names as a plain list, with **Prepare round 1** as the next action.
- **Publication:** if the room presentation was on when intake closes, it remains on and the consolidated list is also released to participants. Otherwise, participants stay neutral until the admin turns the presentation on. Hiding after closure clears both viewer surfaces. Starting voting hides the presentation; during voting, the admin may turn it on to show live aggregate totals to participants and the room, or off to clear them.
- **Round setup:** **Prepare round 1** opens a draft under the **Round setup** heading. A compact, labeled stepper configures the number of names each ballot can select, from 1 through the confirmed roster size. **Start voting** is enabled only for a valid whole-number selection count. **Cancel and rebuild draft** returns to the confirmed list. Later-round mock selection counts remain one.
- **Voting simulation:** In the active admin workspace, select a batch size and use **Add submissions** to create prototype-only anonymous mock ballots with distinct candidate selections matching the configured selection count. Repeat to reach the desired submission count. Admin aggregate totals update live; the Audience Presentation switch controls whether totals are shown to participants and the room. The simulation is bounded by the expected count and uses the two-candidate, one-choice `N - 1` cutoff. It does not submit to or change the API.
- **Results and decisions:** Closing voting ends ballot access and immediately shows per-candidate totals with **Elect**, **Advance**, and **Remove** choices to the admin. **Save decisions** requires one action per candidate, at least one Elect or at least two Advance. After saving, show only the next-round roster (the Advance set) followed by elected candidates labeled **Elected**; do not show every saved decision. If nobody advances and multiple candidates are elected, show their list with a **Confirm** button; confirming completes the position. Results are never gated by a separate reveal action.
- **Live result display:** Candidate rows show vote counts and proportional bars representing share of ballots cast, ordered by vote count descending and name A-Z for ties. Live totals are visible only to the admin unless the Audience Presentation switch is on. The viewer surfaces never show candidate decisions, participation status, identities, or ballot selections.
- **E5.1 references:** Paired desktop/mobile captures for simulated active voting, closed admin preview, and released results are documented in [the E5.1 prototype references](../stories/E5.1/prototype/README.md), with a repeatable capture harness at `docs/stories/E5.1/capture-results-reference.mjs`.
- **Workflow progress:** nomination remains the current step until a round draft exists. Configuring a draft advances the current step to voting rounds.

These are UI reference behaviors. Product rules and production API state remain defined by the linked story requirements and API contracts.
