package org.churchnominations.api.nominations;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ReplaceNominationSubmissionRequest(
        @NotNull @Size(min = 1) List<@NotBlank String> names) {
}