package org.churchnominations.api.nominations;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record RestoreNominationEntryRequest(@NotNull UUID auditEventId) {
}