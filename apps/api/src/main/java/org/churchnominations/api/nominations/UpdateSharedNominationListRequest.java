package org.churchnominations.api.nominations;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record UpdateSharedNominationListRequest(
        @Min(0) long expectedRevision,
    @NotNull List<@NotNull @Valid Entry> entries) {
    public record Entry(UUID id, @NotNull String name, @Min(1) int sequence, boolean active) {
    }
}