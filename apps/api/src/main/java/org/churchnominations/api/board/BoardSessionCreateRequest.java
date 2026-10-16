package org.churchnominations.api.board;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record BoardSessionCreateRequest(@NotNull LocalDate sessionDate) {
}