package org.churchnominations.api.election.voting;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record ReplaceBallotRequest(@NotNull @Size(min = 1) List<@NotNull UUID> candidateIds) {
}