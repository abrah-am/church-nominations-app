package org.churchnominations.api.board;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record BoardAttendanceRequest(@NotNull List<@NotNull UUID> attendedMemberIds) {
}