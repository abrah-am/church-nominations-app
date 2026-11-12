# WEB-NEXT-M3 Implementation Plan

1. Add one typed read-only experience-preview contract that derives its
   position and active poll from existing Admin fixtures.
2. Implement isolated, responsive Voter and Presentation feature components
   with route/view-state navigation only and explicit mock-only messaging.
3. Add standalone preview routes and non-mutating navigation links to/from the
   accepted Admin shell. Preserve `/admin` and its M2 workspace behavior.
4. Add focused component/route tests, run web-next checks, and validate at
   1440px, 390px, and 320px. Save screenshot evidence and concise QA, UX,
   review, and handoff records for Product Owner review.

## File ownership

- Tech Lead: shared preview contract/fixture, route composition, Admin
  navigation, story coordination and final integration checks.
- Frontend Developer: `src/features/voter/**` and Voter tests.
- Frontend Developer: `src/features/presentation/**` and Presentation tests.
- QA/UX review: verify integrated flows and required viewports; report findings
  without modifying unrelated application surfaces.

No dependency changes, backend work, or changes outside `apps/web-next` and
this story's concise evidence files are expected.
