# WEB-NEXT-M1 handoff

## Status and scope

Approved refined visual baseline implemented locally as Admin shell only.
Product Owner accepted M1 on 2026-11-09 based on reported validation and UX/QA,
subject to final screenshots matching the approved reference. The final
[UX comparison](ux-validation.md) confirms the corrected screenshots match the
approved shell, with no remaining material findings. M1 development is closed;
merge and deployment remain unauthorized.
Existing dirty M0 work and unrelated agent-file changes were preserved on
`feat/web-next-m0-foundation`.

## Delivered

- Modular application shell, full-label Elections/Settings navigation,
  shell-only destinations and dependent local viewing-context selectors.
- Official shadcn base-nova Button, Sheet and Select primitives; approved
  neutral surfaces, restrained accents, responsive desktop/mobile structure.
- Focused route/context/keyboard tests. M0 domain/data source remains unchanged.
- No workspace summaries, session toolbar, poll history, candidate/results/
  decision controls, API calls or authentication simulation.

## Tech Lead checks

- Node 24.22.2 `npm --prefix apps/web-next run check`: ESLint passed,
  5 test files / 22 tests passed, TypeScript/project checks and Vite production
  build passed.
- Loopback Vite server responded to `curl /admin`; browser rendered the shell.
- Separate browser viewport measurements: 1440x900 scrollWidth1440;
  390x844 scrollWidth390; 320x568 scrollWidth320, no horizontal overflow.
- Implementation captures: `shell-1440.png`, `shell-390.png`, `shell-320.png`,
  `navigation-open-390.png`. Narrow full-page capture is taller than the viewport
  because normal vertical scrolling is allowed.
- Browser Tab then Enter on skip link focused `main-content`.
- Integrated-browser multi-action menu focus checks were inconclusive due to
  asynchronous focus/viewport behavior. Independent QA subsequently verified
  focus containment, forward/reverse wrapping, Escape and focus return using
  trusted CDP input in standalone Chrome 152. This is browser keyboard evidence,
  not a screen-reader conformance claim.
- `git diff --check` passed; protected legacy frontend/backend/prototype diff
  was empty.

## Final validation and decisions

UX visual comparison and independent QA/review approved the corrected shell:
Elections now uses exact route matching so settings pages have only one current
destination. Removing document minimum width fixed overflow where a vertical
scrollbar reduces the 320px layout viewport to 305px. Final Tech Lead app check
passed 22 tests, lint/types/build. Independent QA repeated those checks and
standalone Chrome viewport, route-selection and keyboard checks successfully.
UX approved visual fidelity with no remaining material findings.
No screen-reader/axe or production integration
claim is implied by unit tests or screenshots.

Initial screenshots had correct PNG dimensions but an incorrectly narrow
rendered viewport due to integrated-browser viewport resets. Replacement
captures used a separate browser page and show the actual desktop 246px sidebar,
390px two-column middle context selectors, and 320px stacked selectors. Compare
only shell regions; workspace artwork remains out of scope.

The final 320px capture is 305x612 pixels: the integrated browser reserves a
15px vertical scrollbar gutter at the 320x568 CSS viewport. Measured clientWidth
and scrollWidth both equal305 (no horizontal overflow). Standalone headless
Chrome, which uses a different scrollbar presentation, measured320/320.
See [comparison gallery](screenshot-comparison.html), [UX validation](ux-validation.md),
[QA](qa-report.md) and [review](review.md).

The temporary Vite validation server has been stopped. Remaining limitation:
the committed jsdom test checks focus containment but not boundary wrapping;
forward/reverse wrapping was verified in standalone Chrome. No actual assistive
technology test was performed.

Opening-filled semantics (Elected plus separate Accepted response) and
ballots-cast percentage denominator remain required future-work invariants.
Viewing context never authorizes session activation; M1 exposes no session
mutation. Existing C1-C4 policy holds remain unresolved.

## Next steps

1. Commit the documented M0/M1 delivery, excluding unrelated agent-file changes,
   as explicitly requested by the Product Owner.
2. Prepare M2 scope and UX references only. Do not implement M2 until the Product
   Owner approves both. No merge or deployment authorized.
