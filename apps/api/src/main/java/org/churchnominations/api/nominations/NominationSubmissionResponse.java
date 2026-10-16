package org.churchnominations.api.nominations;

import java.util.UUID;

public record NominationSubmissionResponse(UUID id, String name) {
    public static NominationSubmissionResponse from(NominationSubmission submission) {
        return new NominationSubmissionResponse(submission.getId(), submission.getName());
    }
}