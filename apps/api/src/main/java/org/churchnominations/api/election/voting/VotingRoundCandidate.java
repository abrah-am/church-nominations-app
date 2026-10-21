package org.churchnominations.api.election.voting;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "voting_round_candidates")
public class VotingRoundCandidate {
    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "round_id", nullable = false, updatable = false)
    private UUID roundId;

    @Column(name = "candidate_name", nullable = false, columnDefinition = "text", updatable = false)
    private String name;

    @Column(nullable = false, updatable = false)
    private int sequence;

    protected VotingRoundCandidate() {
    }

    public VotingRoundCandidate(UUID roundId, String name, int sequence) {
        this.roundId = roundId;
        this.name = name;
        this.sequence = sequence;
    }

    public UUID getId() {
        return id;
    }

    public UUID getRoundId() {
        return roundId;
    }

    public String getName() {
        return name;
    }

    public int getSequence() {
        return sequence;
    }
}