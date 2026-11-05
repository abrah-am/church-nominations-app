package org.churchnominations.api.election.voting;

import java.util.List;
import java.util.UUID;

public record VotingRoundAggregateResultsResponse(
        int expectedVoterCount,
        long ballotsCast,
        long majorityThreshold,
        List<CandidateAggregate> candidates) {

    public record CandidateAggregate(UUID id, String name, long votes) {
    }
}