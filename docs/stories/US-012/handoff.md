# Handoff: Live Results and Candidate Decisions

## Status

- Product Owner direction recorded 2026-11-04 as PD-019.
- Prototype and story/product/API policy documents updated for next implementation session; no application code/API implementation was changed.
- `docs/prototype/prototype.html` is the current sole prototype. The superseded `prototype-full-workflow.html` was deleted.

## Approved Behavior

- Authenticated admin sees live aggregate candidate totals during voting.
- The **Show audience presentation** switch governs aggregate-total visibility on both participant and presentation viewer surfaces. Turning it off clears both; poll start still hides/clears prior content.
- Closing voting ends ballot access and makes final aggregate totals available to the admin. There is no separate **Reveal Results** action.
- After close, the admin records exactly one action per candidate: **Elect**, **Advance**, or **Remove**. Decisions are admin-only and retained.
- A valid decision set must elect at least one candidate or mark at least two candidates **Advance**. Until all actions are entered and the set is valid, the admin remains in the current **Candidate decisions** step with selections preserved for correction.
- Saving a valid set creates a fresh draft from **Advance** candidates only, with zero votes. An Elect-only set is saved without creating an empty draft; the position completes only when all configured openings are filled.
- Further validation UX/API details can be handled in a later story if needed. No separate story is required now.

## Updated Files

- `docs/prototype/prototype.html`
- `docs/prototype/README.md`
- `docs/product/requirements.md`
- `docs/product/backlog.md`
- `docs/product/product-decisions.md`
- `docs/technical/architecture.md`
- `docs/technical/api-contract.md`
- `docs/stories/US-011/requirements.md`
- `docs/stories/US-012/requirements.md`
- `docs/stories/E4.2/requirements.md`
- `docs/stories/E4.2/implementation-plan.md`
- `docs/stories/E4.2/handoff.md`
- `docs/stories/E4.7/requirements.md`
- `docs/stories/E5.1/requirements.md`
- `docs/stories/E5.2/requirements.md`
- `docs/stories/E5.3/requirements.md`
- `docs/stories/E6.8/requirements.md`
- `docs/stories/E6.8/ux-design.md`
- `docs/stories/E6.10/requirements.md`
- `docs/stories/E6.11/requirements.md`
- `docs/stories/E8.3/requirements.md`
- `docs/stories/E4.2/implementation-plan.md`
- `docs/stories/E4.2/handoff.md`

## Validation

- Prototype inline JavaScript syntax parse passed.
- Integrated browser loaded the prototype without page errors after fixing a stale reference to the removed results panel.
- Browser workflow verified live admin totals, viewer totals when presentation is on, viewer clearing when off, restoring totals when on again, closing directly into candidate decisions, decision history, and a fresh Round 2 draft containing only the Advanced candidate with zero previous-round ballots.
- `git diff --check` passed.
- Headless browser runner could not launch because Playwright Chromium is not installed; VS Code integrated browser was used instead.

## Next Steps

- Add any remaining decision-set validation UX/API detail in a future story if needed; the minimum valid-set rule above is the current agreed behavior.
- Reconcile open PR #29 with PD-019 before merge; its current implementation retains separate Close voting and Reveal results behavior.
- Implement the live admin aggregate API and shared audience visibility contract, including server authorization and viewer cache invalidation; current presentation API supports nomination snapshots only.
- Implement per-candidate Elect/Advance/Remove persistence and automatic fresh-draft creation from the Advance set.
- Add focused frontend/API tests for active admin totals, toggle-controlled participant/presentation visibility, close-without-reveal, decision validation/audit, next-round roster, and fresh totals.
