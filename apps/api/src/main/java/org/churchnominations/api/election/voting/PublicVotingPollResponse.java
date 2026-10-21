package org.churchnominations.api.election.voting;

import java.util.List;

public record PublicVotingPollResponse(
        String departmentName,
        String positionName,
        int selectionCount,
        List<VotingRoundCandidateResponse> candidates,
        List<String> submittedCandidateIds) {
}