package org.churchnominations.api.nominations;

import java.util.List;
import java.util.UUID;

public record NominationIntakeResponse(
        UUID id,
        UUID accessToken,
        int nameLimit,
        long currentContributorCount,
        NominationIntakeStatus status,
        boolean listCreated,
        boolean revealed,
        long sharedListRevision,
        List<NominationSubmissionResponse> submissions,
        List<String> consolidatedNames,
        List<SharedNominationEntryResponse> sharedList,
        List<RemovedNominationEntryResponse> removedEntries) {
}