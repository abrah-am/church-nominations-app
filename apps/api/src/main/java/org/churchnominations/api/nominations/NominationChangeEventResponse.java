package org.churchnominations.api.nominations;

import java.time.Instant;
import java.util.UUID;

public record NominationChangeEventResponse(
        UUID id,
        UUID entryId,
        String action,
        String beforeName,
        String afterName,
        NominationRemovalReason removalReason,
        String reasonDetail,
        String actorLabel,
        Instant occurredAt) {
    public static NominationChangeEventResponse from(NominationSharedListAuditEvent event) {
        return new NominationChangeEventResponse(event.getId(), event.getEntryId(), event.getAction().name(),
                event.getBeforeName(), event.getAfterName(), event.getRemovalReason(), event.getReasonDetail(),
                safeActorLabel(event.getActor()), event.getOccurredAt());
    }

    private static String safeActorLabel(String actor) {
        return actor != null && actor.matches("Administrator [A-F0-9]{8}") ? actor : "Administrator";
    }
}