package org.churchnominations.api.board;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record BoardCreateRequest(
        @Positive int year,
        @NotEmpty List<@NotNull @Valid BoardMemberRequest> members) {
    public record BoardMemberRequest(@NotBlank String name) {
    }
}