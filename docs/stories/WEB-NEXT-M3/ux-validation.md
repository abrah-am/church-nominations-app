# WEB-NEXT-M3 UX Validation

**Result:** Pass for the approved visual-foundation scope.

## Visual evidence

Sixteen integrated screenshots are saved in
[`visual-validation/`](visual-validation/):

- Admin workspace at 1440x900, 390x844, and 320x568.
- Voter voting at all three sizes; nomination, confirmation, waiting, and
  closed examples at 390x844.
- Presentation hidden and visible results at all three sizes.

The nomination screenshot is intentionally the M3 read-only example showing
only the current mock voter's own submitted names. Name-entry controls and a
“Submit names” action are deferred with nomination submission behavior to M4;
an intake/submit-flow screenshot should be added in that milestone.

The Admin shell/workspace remains the M2 baseline. Voter flows use a compact
mobile-first single column, labeled preview states, and no submit/persist
controls. Presentation uses a high-contrast large-display layout with
prominent position/poll status and separate hidden/visible aggregate views.
On mobile, display controls and results stack; all selected states remain
legible without horizontal scrolling.

## Responsive and interaction checks

Developer-run Playwright viewport checks reported `scrollWidth ===
documentElement.clientWidth` for each captured page: client widths 1425, 375,
and 305 pixels respectively after the browser's vertical scrollbar.

Developer-run browser interaction at 390x844 verified:

- Admin selected Secretary, navigated to Voter, and returned with Secretary
  still selected.
- Voter preview continued to show the separate mock active session
  Church Elder · Round 2 · Open.
- Nomination/voting state links navigated locally; a local ballot selection
  led to a clearly labeled confirmation preview and created no submission.
- Presentation switched to visible results (Marcus 3/75%, Priya 1/25%), showed
  the ballots-cast-only count of 4, then switched to hidden results with no
  candidate names displayed.

Focused tests also cover native keyboard selection/navigation, state links,
poll immutability, privacy-safe display, and single/multiple-choice limits.

## Limitations

These are synthetic, local-only previews, not live service behavior. No
assistive-technology session or formal WCAG conformance audit was performed.
