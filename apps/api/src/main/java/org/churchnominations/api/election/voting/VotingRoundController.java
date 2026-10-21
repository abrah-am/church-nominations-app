package org.churchnominations.api.election.voting;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/elections/{electionId}/positions/{positionId}/rounds")
public class VotingRoundController {
    private final VotingRoundService rounds;

    public VotingRoundController(VotingRoundService rounds) {
        this.rounds = rounds;
    }

    @GetMapping
    public List<VotingRoundResponse> list(
            @PathVariable UUID electionId, @PathVariable UUID positionId, Principal principal) {
        return rounds.list(electionId, positionId, principal.getName());
    }

    @GetMapping("/{roundId}/progress")
    public VotingRoundProgressResponse progress(
            @PathVariable UUID electionId, @PathVariable UUID positionId, @PathVariable UUID roundId,
            Principal principal) {
        return rounds.progress(electionId, positionId, roundId, principal.getName());
    }

    @PostMapping
    public ResponseEntity<VotingRoundResponse> create(
            @PathVariable UUID electionId,
            @PathVariable UUID positionId,
            @Valid @RequestBody ConfigureVotingRoundRequest request,
            Principal principal) {
        VotingRoundResponse created = rounds.create(electionId, positionId, request, principal.getName());
        return ResponseEntity.created(URI.create("/api/elections/" + electionId + "/positions/" + positionId
                + "/rounds/" + created.id())).body(created);
    }

    @PutMapping("/{roundId}")
    public VotingRoundResponse update(
            @PathVariable UUID electionId,
            @PathVariable UUID positionId,
            @PathVariable UUID roundId,
            @Valid @RequestBody ConfigureVotingRoundRequest request,
            Principal principal) {
        return rounds.update(electionId, positionId, roundId, request, principal.getName());
    }

    @PostMapping("/{roundId}/start")
    public VotingRoundResponse start(
            @PathVariable UUID electionId, @PathVariable UUID positionId, @PathVariable UUID roundId,
            @Valid @RequestBody StartVotingRoundRequest request, Principal principal) {
        return rounds.start(electionId, positionId, roundId, request.expectedVoterCount(), principal.getName());
    }

    @PostMapping("/{roundId}/close")
    public VotingRoundResponse close(
            @PathVariable UUID electionId, @PathVariable UUID positionId, @PathVariable UUID roundId,
            Principal principal) {
        return rounds.close(electionId, positionId, roundId, principal.getName());
    }

    @PostMapping("/{roundId}/reopen")
    public VotingRoundResponse reopen(
            @PathVariable UUID electionId, @PathVariable UUID positionId, @PathVariable UUID roundId,
            Principal principal) {
        return rounds.reopen(electionId, positionId, roundId, principal.getName());
    }

    @PostMapping("/{roundId}/reset")
    public VotingRoundResponse reset(
            @PathVariable UUID electionId, @PathVariable UUID positionId, @PathVariable UUID roundId,
            Principal principal) {
        return rounds.reset(electionId, positionId, roundId, principal.getName());
    }

    @PostMapping("/{roundId}/reveal")
    public VotingRoundResultsResponse reveal(
            @PathVariable UUID electionId, @PathVariable UUID positionId, @PathVariable UUID roundId,
            Principal principal) {
        return rounds.reveal(electionId, positionId, roundId, principal.getName());
    }

    @GetMapping("/{roundId}/results")
    public VotingRoundResultsResponse results(
            @PathVariable UUID electionId, @PathVariable UUID positionId, @PathVariable UUID roundId,
            Principal principal) {
        return rounds.results(electionId, positionId, roundId, principal.getName());
    }

    @PutMapping("/{roundId}/candidates/{candidateId}/decision")
    public VotingRoundResultsResponse decide(
            @PathVariable UUID electionId, @PathVariable UUID positionId, @PathVariable UUID roundId,
            @PathVariable UUID candidateId, @Valid @RequestBody CandidateDecisionRequest request,
            Principal principal) {
        return rounds.decide(electionId, positionId, roundId, candidateId, request, principal.getName());
    }

    @PostMapping("/{roundId}/candidates/{candidateId}/decision/undo")
    public VotingRoundResultsResponse undoDecision(
            @PathVariable UUID electionId, @PathVariable UUID positionId, @PathVariable UUID roundId,
            @PathVariable UUID candidateId, Principal principal) {
        return rounds.undoDecision(electionId, positionId, roundId, candidateId, principal.getName());
    }
}