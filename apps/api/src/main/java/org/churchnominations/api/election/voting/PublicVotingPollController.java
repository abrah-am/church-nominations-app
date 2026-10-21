package org.churchnominations.api.election.voting;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
public class PublicVotingPollController {
    private final VotingRoundService rounds;

    public PublicVotingPollController(VotingRoundService rounds) {
        this.rounds = rounds;
    }

    @GetMapping("/api/polls/{accessToken}")
    public PublicVotingPollResponse get(
            @PathVariable UUID accessToken,
            @RequestHeader("X-Voting-Device-Token") UUID deviceToken) {
        return rounds.getPoll(accessToken, deviceToken);
    }

    @PutMapping("/api/polls/{accessToken}/ballot")
    public SubmittedBallotResponse submit(
            @PathVariable UUID accessToken,
            @RequestHeader("X-Voting-Device-Token") UUID deviceToken,
            @Valid @RequestBody ReplaceBallotRequest request) {
        return rounds.submitBallot(accessToken, deviceToken, request);
    }
}