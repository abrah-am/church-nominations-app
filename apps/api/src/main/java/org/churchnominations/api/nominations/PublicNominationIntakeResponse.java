package org.churchnominations.api.nominations;

import java.util.List;

public record PublicNominationIntakeResponse(
        String departmentName,
        String positionName,
        int nameLimit,
        List<String> submittedNames) {
}