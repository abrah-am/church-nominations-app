package org.churchnominations.api.election.voting;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record StartVotingRoundRequest(@NotNull @Min(1) Integer expectedVoterCount) {
}