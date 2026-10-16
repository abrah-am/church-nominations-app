package org.churchnominations.api.board;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record BoardSessionResponse(UUID id, LocalDate sessionDate, List<UUID> attendedMemberIds) {
    static BoardSessionResponse from(BoardSession session) {
        return new BoardSessionResponse(session.getId(), session.getSessionDate(),
                session.getAttendedMembers().stream().map(BoardMember::getId).toList());
    }
}