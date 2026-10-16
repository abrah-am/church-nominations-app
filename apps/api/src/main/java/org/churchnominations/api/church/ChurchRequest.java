package org.churchnominations.api.church;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChurchRequest(@NotBlank @Size(max = 200) String name) {
}