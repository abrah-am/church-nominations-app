package org.churchnominations.api.election.voting;

import java.util.List;
import java.util.UUID;

public record VotingRoundResponse(
        UUID id,
        int roundNumber,
        VotingRoundStatus status,
        Integer selectionCount,
        List<VotingRoundCandidateResponse> candidates,
        Integer expectedVoterCount,
        java.util.UUID accessToken,
        VotingRoundCloseReason closeReason,
        int resetCount) {
}