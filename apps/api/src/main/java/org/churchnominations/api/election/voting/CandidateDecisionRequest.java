package org.churchnominations.api.election.voting;

import jakarta.validation.constraints.NotNull;

public record CandidateDecisionRequest(
        @NotNull CandidateDecision decision,
        String reason) {
}