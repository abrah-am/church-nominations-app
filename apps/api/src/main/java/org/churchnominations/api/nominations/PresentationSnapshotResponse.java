package org.churchnominations.api.nominations;

import java.util.List;

public record PresentationSnapshotResponse(boolean revealed, List<String> activeNames,
        List<NominationChangeEventResponse> events) {
    public static PresentationSnapshotResponse neutral() {
        return new PresentationSnapshotResponse(false, List.of(), List.of());
    }
}