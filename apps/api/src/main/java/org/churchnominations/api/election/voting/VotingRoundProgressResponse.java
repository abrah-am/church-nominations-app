package org.churchnominations.api.election.voting;

import java.util.UUID;

public record VotingRoundProgressResponse(
        UUID roundId,
        VotingRoundStatus status,
        long ballotsCast,
        Integer expectedVoterCount) {
}