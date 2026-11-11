# WEB-NEXT-M3 UX reference

This is a constrained continuation of the approved Prototype V2 and M1/M2
design, not a redesign. Use its Voter and Presentation information hierarchy
and apply the accepted `apps/web-next` shadcn `base-nova` primitives, type,
spacing, colors, focus treatment, and compact responsive behavior.

## References

- Voter flows and states: `docs/prototype-v2/src/features/voter/VoterView.tsx`
- Presentation hierarchy and aggregate display: `docs/prototype-v2/src/features/presentation/PresentationView.tsx`
- Shared shell and responsive navigation: `docs/stories/WEB-NEXT-M1/requirements.md`
- Admin workspace visual baseline: `docs/stories/WEB-NEXT-M2/visual-validation/`

Prototype state-changing behavior is not in scope. All added screens and
transitions are mock previews, explicitly marked as such.

## Layout and interaction

- **Admin:** Retain existing shell/workspace. Add a grouped Experience previews
  navigation section; destination links must not change the separately viewed
  poll or active-session fixture.
- **Voter:** One-column mobile-first card layout; position and poll status
  precede the task. Provide compact links between nomination, voting,
  confirmation, waiting, and closed preview states. Sample input/selection
  controls may demonstrate appearance but must be identified as preview-only
  and never submit or persist.
- **Presentation:** Full-width dark/neutral room-display composition with
  prominent position and active-poll status, aggregate content centered for
  distance viewing, and explicit mock-preview links for hidden/visible results.
  At smaller widths, stack content without horizontal scrolling.
- **Accessibility:** Use landmarks, headings in order, labeled controls,
  keyboard-operable links/buttons, visible focus, live status for state
  navigation, and reduced-motion-safe transitions. Do not rely on color alone.

## Validation sizes

Capture and compare integrated screens at 1440x900, 390x844, and 320x568.
Verify both hidden/visible Presentation states and representative Voter states.
