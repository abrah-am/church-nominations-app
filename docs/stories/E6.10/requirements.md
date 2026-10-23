# E6.10: Approve Session-Link and Presentation Access Policy

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (high)
- **Workflow status:** Product/security decision needed; blocks E6.8 and E6.11 implementation
- **User story:** As the product owner, I want the access and lifecycle rules for a session-level participant link and presentation display explicitly decided so implementation cannot accidentally broaden access or weaken ballot privacy.

## Acceptance Criteria
- Decide whether one stable link replaces current position-scoped nomination links and poll-scoped voting links, and define exactly which active session and current phase it can resolve.
- Define behavior when there is no active intake or poll and when the session ends, using generic states that do not reveal another session or historical poll.
- Decide who may use the session link, whether it is a bearer capability, forwarding expectations, expiry, revocation, and server-side tenant authorization.
- Decide whether browser-profile ballot uniqueness remains once per poll or changes across rounds/session; specify whether a profile may submit a ballot in each successive round.
- Preserve the directed lifecycle: active poll shows ballot without totals; closed-unrevealed and reopened polls show the existing `poll is not active` message; closed-revealed current poll shows the same read-only approved results snapshot as the presentation; a subsequent close requires a new reveal.
- Confirm which aggregate fields appear in the shared guest/presentation result view and how historical results remain separate from the session link.
- Define presentation-session authorization, how it is started/hidden/ended, and its audience. Presentation is read-only and independent from the guest link's poll lifecycle where directed.
- Record audit, retention, and privacy requirements for nomination change history/tombstones and presentation access/events.
- Update product requirements, product decisions, technical/API contracts, and this UX design with the decisions before implementation stories are unblocked.

## Scope and Dependencies
Decision/discovery story only. Depends on the product owner/security review of E6.8 UX design, E6.4/E6.5, PD-006/PD-012, and ballot-profile policy PD-004. Does not implement links, access control, results UI, or QR codes.

## Security Constraints
A session link must never resolve another session, historical poll/report, admin data, or presentation controls. Link possession does not establish a person's identity. Enforce church tenant boundaries and lifecycle state server-side.
