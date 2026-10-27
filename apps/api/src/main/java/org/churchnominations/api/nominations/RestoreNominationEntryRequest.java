package org.churchnominations.api.nominations;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

import java.util.UUID;

public record RestoreNominationEntryRequest(@NotNull UUID auditEventId, @Min(0) long expectedRevision) {
}