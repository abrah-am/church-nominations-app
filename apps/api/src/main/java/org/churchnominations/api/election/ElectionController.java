package org.churchnominations.api.election;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.UUID;
import java.security.Principal;

@RestController
@RequestMapping("/api/elections")
public class ElectionController {
    private final ElectionService elections;

    public ElectionController(ElectionService elections) {
        this.elections = elections;
    }

    @GetMapping
    public List<ElectionResponse> list(Principal principal) {
        return elections.list(principal.getName());
    }

    @PostMapping
    public ResponseEntity<ElectionResponse> create(@Valid @RequestBody ElectionSetupRequest request, Principal principal) {
        ElectionResponse created = elections.create(request, principal.getName());
        return ResponseEntity.created(URI.create("/api/elections/" + created.id())).body(created);
    }

    @GetMapping("/{id}")
    public ElectionResponse get(@PathVariable UUID id, Principal principal) {
        return elections.get(id, principal.getName());
    }

    @PutMapping("/{id}")
    public ElectionResponse update(@PathVariable UUID id, @Valid @RequestBody ElectionSetupRequest request, Principal principal) {
        return elections.update(id, request, principal.getName());
    }

    @DeleteMapping("/{electionId}/positions/{positionId}")
    public ResponseEntity<Void> deletePosition(
            @PathVariable UUID electionId, @PathVariable UUID positionId, Principal principal) {
        elections.deletePosition(electionId, positionId, principal.getName());
        return ResponseEntity.noContent().build();
    }
}