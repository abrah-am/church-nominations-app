package org.churchnominations.api.election.voting;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record VotingRoundResultsResponse(
        UUID roundId,
        int roundNumber,
        int expectedVoterCount,
        long ballotsCast,
        long majorityThreshold,
        Instant revealedAt,
        String revealedBy,
        List<CandidateResult> candidates) {

    public record CandidateResult(
            UUID id,
            String name,
            int sequence,
            long votes,
            CandidateDecision decision,
            String decisionReason,
            Instant decisionAt,
            String decisionBy) {
    }
}