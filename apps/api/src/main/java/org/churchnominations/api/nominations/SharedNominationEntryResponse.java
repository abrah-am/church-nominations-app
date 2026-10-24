package org.churchnominations.api.nominations;

import java.util.UUID;

public record SharedNominationEntryResponse(UUID id, String name, int sequence, boolean active) {
    public static SharedNominationEntryResponse from(NominationConsolidatedName row) {
        return new SharedNominationEntryResponse(row.getId(), row.getCandidateName(), row.getSequence(), row.isActive());
    }
}