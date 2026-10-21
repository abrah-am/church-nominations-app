package org.churchnominations.api.election.voting;

import java.util.UUID;

public record VotingRoundCandidateResponse(UUID id, String name, int sequence) {
    static VotingRoundCandidateResponse from(VotingRoundCandidate candidate) {
        return new VotingRoundCandidateResponse(candidate.getId(), candidate.getName(), candidate.getSequence());
    }
}