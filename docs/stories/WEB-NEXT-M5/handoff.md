# WEB-NEXT-M5 Handoff

## Status

M5a is **Product Owner accepted (2026-11-11)** after the focused browser
keyboard smoke test below found no blocking defect. PR #39 merged
`feat/web-next-m0-foundation` into `main` (merge commit `0d71444`), so the
M2-M5a implementation and evidence commits (through `485ee1b`) are on `main`.
M5b has not started. No backend integration or deployment was performed; do
not start M5b or deploy without explicit Product Owner authorization.

## M5a delivered

- Admin reviews closed-poll aggregate results and strict-majority guidance;
  Elected, Advanced, and Eliminated decisions require explicit confirmation.
- Candidate responses are append-only and separately linked to the Elected
  decision and opening. Accepted fills the opening; Declined leaves it vacant.
- Create Next Poll is explicit, preselects Advanced candidates for Admin
  review, configures exact choices per ballot, and creates a fresh draft with
  zero totals.
- Poll snapshots, prior decisions/responses, and audit entries are preserved.
  Draft roster and choice count are visible in poll history.
- Shared snapshot updates preserve the Admin's selected viewed poll when it
  remains available. The active participant session remains independent.

## Validation evidence

- Node 24.22.2:
  `PATH=/Users/abraham/.nvm/versions/node/v24.22.2/bin:$PATH npm --prefix apps/web-next run check`
  passed: lint, 78 tests across 12 files, TypeScript, and production build.
- `git diff --check` passed.
- Focused M5a tests passed: 22 tests across decision-panel, position-workspace,
  and mock-store suites. Coverage includes Accepted and Declined responses,
  explicit decisions, next-poll creation, historical integrity, and viewed
  poll preservation.
- Browser responsive inspection at 1440, 390, and 320 CSS pixels found no
  horizontal overflow (document and body scroll widths matched the viewport).
  The prior M5a browser workflow exercised decision confirmation, next-poll
  draft creation, and a separately recorded Accepted response.
- Independent QA found no confirmed functional defect. Automated checks passed;
  QA noted browser keyboard checks were not run.
- Independent code review found no remaining material issue. The reviewer
  confirmed that a next-poll draft not yet being openable is a valid M5a scope
  boundary: M5a requires draft creation, not activation.
- 2026-11-11 browser keyboard smoke test (headless Chromium driven by
  Playwright with real key events, full workflow replayed from intake to next
  poll): 27 passing checks, no blocking defect.
  - Decision confirmation: Tab/Shift+Tab order is logical; the disabled Save
    button is skipped until the confirmation checkbox is checked; Space
    toggles the checkbox; Enter activates "Save confirmed decisions"; Escape
    does not discard entered decisions or confirmation state; the outcome is
    announced via a `role="status"` region.
  - Create Next Poll: roster checkboxes are focusable and Space-toggleable;
    Tab order runs roster, choice count, confirmation checkbox, create button;
    the create button stays disabled until confirmed; Enter creates the fresh
    draft (verified Round 4 draft with zero votes in poll history).
  - Scope clarification: both confirmations are inline confirmed sections, not
    modal dialogs, so focus containment and focus return do not apply to them
    by design. The application's only modal dialog (the navigation sheet)
    passes Enter-to-open, initial focus into the dialog, Tab/Shift+Tab focus
    containment with wrap, Escape-to-close, and focus return to the trigger.
  - Decision/opening/closed-poll selects are native controls with no custom
    key handling and are keyboard operable (arrow and type-ahead selection
    fire change events that update state).

## Limitations and next steps

- Build emits Vite's advisory that the 511.57 kB JavaScript chunk exceeds the
  500 kB threshold. No code splitting change was made; revisit before or
  during M6 integration readiness.
- After "Save confirmed decisions" or "Confirm and create next poll", the
  activated control is removed from the DOM and focus falls back to the
  document body; the result is announced via `role="status"`. Non-blocking
  accessibility refinement: manage focus to the resulting section in a later
  milestone.
- Mock state remains ephemeral and resets on page refresh; there is no backend
  integration or persistence.
- Draft activation, finalization/reopen, and replacement workflows belong to
  M5b; M5b remains unstarted.
- The previously documented Playwright locator stability limitation remains.
  Additionally, automation of closed native `<select>` elements via ArrowDown
  opens the macOS native picker and is unreliable under automation; use
  type-ahead or `selectOption` in future browser checks (browser behavior,
  not an application defect).
- Do not merge further work or deploy without explicit authorization.

## M5b implementation handoff

- Scope: REQ-M5-005 through REQ-M5-008 and the M5b acceptance criteria in
  [requirements.md](./requirements.md) — explicit confirmed finalization and
  reopen with lifecycle audit events, PD-018 direct replacement
  recommendations with same-position exclusions and tie-break polls, and
  Admin-directed manual replacement polls with an audited reason. Approved
  product rules 1-9 in requirements.md remain binding.
- Start from `main` (contains merged M5a via PR #39, `0d71444`) on a fresh
  feature branch. Await explicit Product Owner authorization before starting.
- Key building blocks: `apps/web-next/src/data/mock-election-store.ts`
  (polls, decision/response events, openings, audit),
  `apps/web-next/src/features/workspace/election-decisions-panel.tsx`
  (decision/response/next-poll UI),
  `apps/web-next/src/domain/election-decisions.ts` (decision rules), and
  `apps/web-next/src/data/position-fixtures.ts` (seeded history).
- Preserve append-only events, poll snapshots, audit history, viewed-context
  versus active-session separation, and Voter/Presentation privacy (no
  decisions, responses, reasons, or identities in those projections).
- Validation bar: `npm --prefix apps/web-next run check`, focused vitest
  suites for new store/panel behavior, and a browser pass including keyboard
  checks at 1440/390/320 widths. Reuse the type-ahead select guidance above.
