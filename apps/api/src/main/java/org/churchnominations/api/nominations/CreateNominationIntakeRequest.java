package org.churchnominations.api.nominations;

import jakarta.validation.constraints.Positive;

public record CreateNominationIntakeRequest(@Positive int nameLimit) {
}