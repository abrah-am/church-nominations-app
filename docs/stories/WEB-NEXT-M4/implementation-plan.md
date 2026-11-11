# WEB-NEXT-M4 Implementation Plan

## Status

Product Owner confirmed scope on 2026-11-10. Implement only the linked
[requirements](requirements.md); do not integrate a backend or begin M5.

## Sequence

1. **Shared mock boundary:** define typed M4 operations and an in-memory
   application store/service initialized from the M3 fixture. Add focused
   contract tests for validation, route-shared updates, refresh reset, and
   historical immutability.
2. **Admin poll basics:** add nomination setup/open/close and review/
   consolidation/confirmation; add first voting-poll setup/open/close from the
   confirmed roster. Keep operations explicit and surface invalid transitions.
3. **Voter interactions:** add final, limited nomination submission and own-name
   review; enforce exact ballot choice count, confirmation, submit/replacement
   while open, and closed/waiting states.
4. **Presentation controls:** bind independent aggregate-results and
   ballots-cast visibility settings to shared state; retain privacy-safe
   projections and separate nomination-list publication rules.
5. **Integration and verification:** wire all three experiences to the same
   service, test cross-route updates and lifecycle boundaries, run web-next
   checks, and validate critical flows at 1440, 390, and 320 px.

## Constraints

- Keep all application changes in `apps/web-next`; no API calls, persistence,
  authentication simulation, or edits to `apps/web` / `docs/prototype-v2`.
- Reuse existing domain types, fixtures, and M3 routes. Add only the state and
  mutation seams needed for the confirmed M4 behaviors.
- Do not add election decisions, candidate responses, finalization,
  replacements, or automatic Elected recording.
