# E6.12: Show a Session QR Code in the Presentation View

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (high; future follow-up)
- **Workflow status:** Future backlog; blocked by E6.8 and E6.11
- **User story:** As an administrator presenting an election, I want a QR code for the active session link on the read-only presentation view so participants can open the same session on their phones.

## Acceptance Criteria
- Once approved and implemented, the presentation can display a QR code encoding the same stable participant session URL from E6.11; it does not create a second link or broaden its authorization.
- The QR code appears only for the active session and follows approved session expiry/revocation/end behavior.
- Provide a visible, readable short URL or other approved text alternative; QR is never the only access method.
- The presentation remains read-only. It has no control to change session state, reveal/hide results, or edit nominations.
- QR and accompanying text remain legible on projector and mobile layouts, have accessible labeling, and do not obscure results or other approved content.
- Tests verify the QR payload matches the active session link and does not contain credentials beyond the approved link capability or expose another session.

## Scope and Dependencies
Future presentation enhancement. Depends on E6.8 presentation surface, E6.11 stable session link, and E6.10 authorization/expiry/revocation decisions. QR generation/display is not part of the initial session-link delivery.
