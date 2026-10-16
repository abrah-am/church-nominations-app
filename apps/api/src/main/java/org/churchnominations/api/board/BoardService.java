package org.churchnominations.api.board;

import org.churchnominations.api.church.ChurchRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class BoardService {
    private final BoardRepository boards;
    private final ChurchRepository churches;

    public BoardService(BoardRepository boards, ChurchRepository churches) {
        this.boards = boards;
        this.churches = churches;
    }

    public List<BoardResponse> list(String accountEmail) {
        UUID churchId = getChurchId(accountEmail);
        return boards.findAllByChurchIdOrderByYearDescIdAsc(churchId).stream()
                .map(BoardResponse::from).toList();
    }

    public BoardResponse get(UUID id, String accountEmail) {
        return BoardResponse.from(findForChurch(id, accountEmail));
    }

    @Transactional
    public BoardResponse create(BoardCreateRequest request, String accountEmail) {
        UUID churchId = getChurchId(accountEmail);
        if (boards.existsByChurchIdAndYear(churchId, request.year())) {
            throw new BoardAlreadyExistsException();
        }
        Board board = new Board(churchId, request.year(),
                request.members().stream().map(BoardCreateRequest.BoardMemberRequest::name).toList());
        try {
            return BoardResponse.from(boards.saveAndFlush(board));
        } catch (DataIntegrityViolationException exception) {
            throw new BoardAlreadyExistsException();
        }
    }

    @Transactional
    public BoardSessionResponse createSession(UUID boardId, BoardSessionCreateRequest request, String accountEmail) {
        Board board = findForChurch(boardId, accountEmail);
        BoardSession session = board.addSession(request.sessionDate());
        boards.saveAndFlush(board);
        return BoardSessionResponse.from(session);
    }

    @Transactional
    public BoardSessionResponse replaceAttendance(UUID boardId, UUID sessionId,
                                                   BoardAttendanceRequest request, String accountEmail) {
        Board board = findForChurch(boardId, accountEmail);
        BoardSession session = board.getSessions().stream()
                .filter(candidate -> candidate.getId().equals(sessionId))
                .findFirst().orElseThrow(BoardNotFoundException::new);
        var requestedIds = new LinkedHashSet<>(request.attendedMemberIds());
        var membersById = board.getMembers().stream()
                .filter(member -> requestedIds.contains(member.getId()))
                .collect(java.util.stream.Collectors.toMap(BoardMember::getId, member -> member));
        if (membersById.size() != requestedIds.size()) {
            throw new InvalidBoardMemberIdException();
        }
        session.replaceAttendance(requestedIds.stream().map(membersById::get).toList());
        boards.saveAndFlush(board);
        return BoardSessionResponse.from(session);
    }

    private Board findForChurch(UUID id, String accountEmail) {
        UUID churchId = getChurchId(accountEmail);
        return boards.findByIdAndChurchId(id, churchId).orElseThrow(BoardNotFoundException::new);
    }

    private UUID getChurchId(String accountEmail) {
        return churches.findByAdminAccountEmail(accountEmail)
                .orElseThrow(BoardNotFoundException::new).getId();
    }
}