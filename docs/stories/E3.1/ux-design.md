# E3.1 UX Design: Prepare Round 1

## Goal

Make the transition from a confirmed nomination list to poll setup clear. After **Prepare round 1**, the administrator should focus on the exact roster that will appear on the ballot, choose the selection count, and start voting without the full consolidated list competing for attention.

## Entry and layout

- Entry state remains the E6.13 **Consolidated list** section with its existing confirmed names and **Prepare round 1** action.
- Selecting **Prepare round 1** switches the current workflow to a focused **Round 1 setup** state. Collapse or hide the consolidated-list review content; preserve the election/position context and workflow progress.
- Present, in order: Round 1 heading and source description, candidate count and read-only poll roster, selection-count stepper with valid range, **Save round setup** when changes are unsaved, then **Start voting** and **Cancel and rebuild draft**.
- Do not repeat the full candidate list in the consolidated-list section while setup is active. The roster shown in setup is the authoritative preview of the poll roster.

## Interaction and states

- **Unprepared:** Confirmed list is shown; setup controls are not shown.
- **Preparing:** The existing action enters setup and initializes the count from the current product rule (currently `min(2, roster size)`). The roster is the confirmed list returned by the server.
- **Editing setup:** Stepper and numeric input stay bounded by roster size. Invalid or unsaved setup cannot start voting. Show the save action only when needed, or retain it if required by the existing API workflow.
- **Saved draft:** Show the poll roster and saved selection count. **Start voting** opens the existing expected-voter confirmation; the applicable even-sized, two-candidate cutoff warning remains in that confirmation.
- **Save/start error:** Keep the user in setup, preserve input, identify the failed action, and offer retry. Do not silently roll back to the consolidated list.
- **Cancel/rebuild:** Cancel the unstarted draft only through the existing guarded operation, then return to the confirmed list. Explain destructive draft removal using the existing confirmation behavior if present.
- **Active poll:** Setup is no longer editable. Existing active-round controls and presentation clearing behavior are governed by round lifecycle/E4.7, not this story.

## Accessibility and responsive behavior

- Use a semantic heading for Round 1 setup, a labeled list for poll candidates, and a programmatically labeled number input with minimum, maximum, and helper text.
- Give decrement/increment buttons accessible names and disabled states at bounds.
- Announce save/start outcomes and errors. Keep focus in the setup region after transition; after cancellation, return focus to **Prepare round 1** or the confirmed-list heading.
- At 320 CSS px, keep candidate names readable and controls within the viewport with no horizontal scrolling.

## Prototype reference

The canonical flow is `docs/prototype/prototype.html`, where **Prepare round 1** changes from the confirmed roster task to the Round setup task with its candidate-selection count and **Start voting**. Match its state transition while following the approved E6.13 wording and current application conventions; the mock prototype itself is not a behavior or security authority.

## Approval boundary

This document describes a proposed refinement for Product Owner review. It does not approve implementation or alter the existing E6.13 product decisions.