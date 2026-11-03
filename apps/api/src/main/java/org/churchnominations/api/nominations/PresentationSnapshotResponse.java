package org.churchnominations.api.nominations;

import java.util.List;

public record PresentationSnapshotResponse(boolean revealed, boolean intakeOpen, boolean listCreated,
        List<String> activeNames, List<NominationChangeEventResponse> events) {
    public static PresentationSnapshotResponse neutral() {
        return new PresentationSnapshotResponse(false, false, false, List.of(), List.of());
    }
}