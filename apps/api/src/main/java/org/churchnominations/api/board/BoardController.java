package org.churchnominations.api.board;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/boards")
public class BoardController {
    private final BoardService boards;

    public BoardController(BoardService boards) {
        this.boards = boards;
    }

    @GetMapping
    public List<BoardResponse> list(Principal principal) {
        return boards.list(principal.getName());
    }

    @PostMapping
    public ResponseEntity<BoardResponse> create(@Valid @RequestBody BoardCreateRequest request, Principal principal) {
        BoardResponse created = boards.create(request, principal.getName());
        return ResponseEntity.created(URI.create("/api/boards/" + created.id())).body(created);
    }

    @GetMapping("/{id}")
    public BoardResponse get(@PathVariable UUID id, Principal principal) {
        return boards.get(id, principal.getName());
    }

    @PostMapping("/{id}/sessions")
    public BoardSessionResponse createSession(@PathVariable UUID id,
                                              @Valid @RequestBody BoardSessionCreateRequest request,
                                              Principal principal) {
        return boards.createSession(id, request, principal.getName());
    }

    @PutMapping("/{id}/sessions/{sessionId}/attendance")
    public BoardSessionResponse replaceAttendance(@PathVariable UUID id, @PathVariable UUID sessionId,
                                                  @Valid @RequestBody BoardAttendanceRequest request,
                                                  Principal principal) {
        return boards.replaceAttendance(id, sessionId, request, principal.getName());
    }
}