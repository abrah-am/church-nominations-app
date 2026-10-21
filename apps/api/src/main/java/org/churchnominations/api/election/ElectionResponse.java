package org.churchnominations.api.election;

import java.util.List;
import java.util.UUID;

public record ElectionResponse(UUID id, String departmentName, String status, List<PositionResponse> positions) {
    static ElectionResponse from(
        Election election,
        ElectionStatus status,
        java.util.Map<UUID, PositionProgressResponse> progressByPosition) {
        List<PositionResponse> positions = election.getPositions().stream()
                .map(position -> new PositionResponse(position.getId(), position.getName(),
            position.getOpeningCount(), position.getSequence(),
            progressByPosition.get(position.getId()).progressStatus(),
            progressByPosition.get(position.getId()).nextAction(),
            progressByPosition.get(position.getId()).roundNumber()))
                .toList();
        return new ElectionResponse(election.getId(), election.getDepartmentName(), status.name(), positions);
    }

    public record PositionProgressResponse(String progressStatus, String nextAction, Integer roundNumber) {
    }

    public record PositionResponse(
        UUID id,
        String name,
        int openingCount,
        int sequence,
        String progressStatus,
        String nextAction,
        Integer roundNumber) {
    }
}