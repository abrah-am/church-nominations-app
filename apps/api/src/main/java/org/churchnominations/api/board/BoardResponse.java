package org.churchnominations.api.board;

import java.util.List;
import java.util.UUID;

public record BoardResponse(UUID id, UUID churchId, int year,
                            List<BoardMemberResponse> members,
                            List<BoardSessionResponse> sessions) {
    static BoardResponse from(Board board) {
        return new BoardResponse(board.getId(), board.getChurchId(), board.getYear(),
                board.getMembers().stream().map(BoardMemberResponse::from).toList(),
                board.getSessions().stream().map(BoardSessionResponse::from).toList());
    }

    public record BoardMemberResponse(UUID id, String name) {
        static BoardMemberResponse from(BoardMember member) {
            return new BoardMemberResponse(member.getId(), member.getName());
        }
    }
}