# WEB-NEXT-M3 handoff

## Status and approval

Product Owner authorized M3 implementation on 2026-11-10. The three
experience surfaces, focused checks, and evidence were accepted by the Product
Owner on 2026-11-10, contingent on final screenshots matching the approved UX
direction. The reviewed screenshots match the approved hierarchy, responsive
behavior, and visual direction. M3 is committed but not merged or deployed.
Do not start M4 implementation until its proposed scope is confirmed.

Implementation remains within `apps/web-next`. It preserves the M2 Admin
workspace and adds navigable, read-only Voter and Presentation previews backed
by the shared Riverside 2027 Church Elder · Round 2 · Open fixture. The Voter
preview only changes local view/selection state; Presentation only switches
hidden/visible layouts and displays aggregate mock data. Neither can submit,
persist, mutate, or publish. Admin viewed context remains independent from the
active participant session. No individual ballots or voter identities are
modeled or shown.

The approved multiple-opening outcome policy remains unchanged. Clarify in a
later milestone the difference between automatic majority calculations and
automatically recording Elected decisions.

## Evidence

- [Requirements](requirements.md), [implementation plan](implementation-plan.md),
  and [UX design](ux-design.md) record M3 scope and boundaries.
- [Visual validation](visual-validation/) contains 16 screenshots:
  Admin at all three target sizes; Voter voting at all three sizes and
  nomination/confirmation/waiting/closed at 390px; Presentation hidden/visible
  at all three sizes.
- The Voter nomination screenshot is intentionally a read-only own-names
  preview. Name-entry controls and a “Submit names” action are deferred to M4;
  capture the intake/submit flow there, without changing M3's submission
  boundary.
- [QA report](qa-report.md): lint, 58 tests, and production build passed.
  QA recommends Product Owner review and marks browser keyboard/focus
  validation partial.
- [UX validation](ux-validation.md): records screenshot coverage and
  developer-run interactions.
- [Code review](review.md): both reviewer findings were addressed; a separate
  second reviewer pass was not requested.
- Supplemental browser check verified zero horizontal overflow on all eight
  Admin/Voter/Presentation routes/states at 1440, 390, and 320px. Presentation
  keyboard focus visibility remains unverified; one browser inspection attempt
  timed out before reading the active element.
- `PATH=/Users/abraham/.nvm/versions/node/v24.22.2/bin:$PATH npm --prefix
  apps/web-next run check` passed: ESLint, TypeScript, Vite production build,
  and 58 tests across 9 files. `git diff --check` passed.
- Independent QA reviewed all 16 screenshots. The UX presentation direction
  was reviewed against the approved M3 UX reference. Presentation
  browser-level keyboard/focus validation remains partial; no formal WCAG
  conformance audit was performed.

## Files and constraints

M3 application changes are in `apps/web-next/src/app/`, `apps/web-next/src/data/`,
`apps/web-next/src/features/admin-shell/`, `apps/web-next/src/features/voter/`,
`apps/web-next/src/features/presentation/`, `apps/web-next/src/index.css`, and
`apps/web-next/src/App.test.tsx`. The M3 story folder contains requirements,
plan, UX/review/QA records, screenshots, and this handoff. `apps/web`,
`apps/api`, and `docs/prototype-v2` were not changed for M3.

M3 implementation and evidence commit: pending final handoff commit reference.
Preserve unrelated worktree changes, including
`.github/agents/tech-lead.agent.md` and prior approved product-policy and
roadmap updates. No merge or deployment was performed.

## Next session

M3 is accepted. Review and confirm the proposed M4 scope in
[`../WEB-NEXT-M4/requirements.md`](../WEB-NEXT-M4/requirements.md) before
implementation begins. Keep the remaining Presentation keyboard/focus
validation gap visible; do not claim formal WCAG conformance.
