package org.churchnominations.api.election.voting;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ConfigureVotingRoundRequest(
        @NotNull @Size(min = 1) List<@NotBlank String> candidateNames,
        @NotNull @Min(1) Integer selectionCount) {
}