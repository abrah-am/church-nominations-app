package org.churchnominations.api.election;

import java.util.List;
import java.util.UUID;

public record ElectionResponse(UUID id, String departmentName, String status, List<PositionResponse> positions) {
    static ElectionResponse from(Election election) {
        List<PositionResponse> positions = election.getPositions().stream()
                .map(position -> new PositionResponse(position.getId(), position.getName(),
                        position.getOpeningCount(), position.getSequence()))
                .toList();
        return new ElectionResponse(election.getId(), election.getDepartmentName(), election.getStatus().name(), positions);
    }

    public record PositionResponse(UUID id, String name, int openingCount, int sequence) {
    }
}