package org.churchnominations.api.nominations;

import java.time.Instant;
import java.util.UUID;

public record RemovedNominationEntryResponse(
        UUID auditEventId,
        UUID originalEntryId,
        String name,
        int sequence,
        Instant removedAt,
        String removedBy) {
}