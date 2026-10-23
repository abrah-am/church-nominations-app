package org.churchnominations.api.nominations;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ReplaceNominationSubmissionRequest(
        @NotNull List<@NotBlank String> names) {
}