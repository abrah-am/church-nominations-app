package org.churchnominations.api.nominations;

import java.util.List;
import java.util.UUID;

public record NominationIntakeResponse(
        UUID id,
        UUID accessToken,
        int nameLimit,
        NominationIntakeStatus status,
        List<NominationSubmissionResponse> submissions,
        List<String> consolidatedNames) {
}