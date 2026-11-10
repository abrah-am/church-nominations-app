# WEB-NEXT-M1: Admin shell and responsive application navigation

Status: accepted by the Product Owner 2026-11-09 based on validation and UX/QA,
subject to final screenshots matching the approved visual reference; final
UX validation confirms the corrected screenshots match. Development closed;
merge/deployment not authorized.

The Product Owner approved the [refined visual reference](../WEB-NEXT-M0/ux-refinement.md)
as M1's visual baseline. Only the shell is authorized; the illustrated Position
Workspace belongs to later milestones.

## Acceptance criteria

- REQ-001: Match the approved shell's layout, full-label navigation, neutral
  surfaces, typography, spacing and restrained accent palette. Desktop sidebar
  is approximately 246px; main content retains available workspace width.
- REQ-002: Application navigation contains Elections and Settings grouping only
  existing Church settings and Term management destinations. No Dashboard or new
  features. Church -> Term -> Department -> Position belongs to the compact
  content header, never duplicated in the sidebar.
- REQ-003: Implement reusable shadcn/ui primitives with the configured primitive
  family, modular shell/application composition, and explicit local mock context.
  No production-auth or API integration claim. Navigation destinations may show
  honest shell-only placeholders; do not link into the legacy app accidentally.
- REQ-004: At 1440x900, 390x844 and 320x568, preserve readable labels and context
  order without horizontal page overflow. Mobile navigation uses a labeled,
  keyboard-accessible overlay with Escape, focus containment and focus return.
  Provide semantic landmarks, skip link, visible focus, associated selector
  labels and selected-navigation indication.
- REQ-005: Context/navigation changes affect only viewing context. No participant
  activation, poll operations, response/decision actions or session mutations.
  Do not implement the illustrated position summary, share toolbar, poll history,
  candidates, results or decisions.
- REQ-006: Run tests, lint, type checks and production build. Capture implementation
  screenshots at each width and mobile navigation open; compare shell regions
  with approved references and record deliberate later-milestone omissions.
  Request UX validation, QA and independent code review; fix material findings.
- REQ-007: Preserve `apps/web`, `apps/api`, `docs/prototype-v2` and unrelated
  work. No merge/deployment or M2 implementation without authorization.

## Future-work invariants

For later Position Workspace work, an opening is filled only after an Elected
candidate separately accepts. Vote percentages use ballots cast, not total
selections or expected participants. These rules do not authorize workspace
implementation in M1. Existing policy conflicts C1-C4 remain separate holds.
