package org.churchnominations.api.election.voting;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "voting_rounds")
public class VotingRound {
    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "position_id", nullable = false, updatable = false)
    private UUID positionId;

    @Column(name = "draft_position_id", unique = true)
    private UUID draftPositionId;

    @Column(name = "active_position_id", unique = true)
    private UUID activePositionId;

    @Column(name = "round_number", nullable = false, updatable = false)
    private int roundNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private VotingRoundStatus status;

    @Column(name = "selection_count")
    private Integer selectionCount;

    @Column(name = "reset_count", nullable = false)
    private int resetCount;

    @Column(name = "expected_voter_count")
    private Integer expectedVoterCount;

    @Column(name = "access_token", unique = true)
    private UUID accessToken;

    @Enumerated(EnumType.STRING)
    @Column(name = "close_reason", length = 20)
    private VotingRoundCloseReason closeReason;

    @Column(name = "cutoff_overridden", nullable = false)
    private boolean cutoffOverridden;

    @Column(name = "revealed_at")
    private Instant revealedAt;

    @Column(name = "revealed_by", length = 320)
    private String revealedBy;

    @Column(name = "nomination_revision")
    private Long nominationRevision;

    protected VotingRound() {
    }

    public VotingRound(UUID positionId, int roundNumber, int selectionCount) {
        this.positionId = positionId;
        this.draftPositionId = positionId;
        this.roundNumber = roundNumber;
        this.selectionCount = selectionCount;
        this.status = VotingRoundStatus.DRAFT;
    }

    public void updateSelectionCount(int selectionCount) {
        this.selectionCount = selectionCount;
    }

    public void captureNominationRevision(long revision) {
        nominationRevision = revision;
    }

    public void activate(int expectedVoterCount) {
        this.expectedVoterCount = expectedVoterCount;
        this.accessToken = UUID.randomUUID();
        this.closeReason = null;
        this.cutoffOverridden = false;
        this.draftPositionId = null;
        this.activePositionId = positionId;
        this.status = VotingRoundStatus.ACTIVE;
    }

    public void close(VotingRoundCloseReason reason) {
        this.status = VotingRoundStatus.CLOSED;
        this.activePositionId = null;
        this.closeReason = reason;
    }

    public void reopen() {
        this.status = VotingRoundStatus.ACTIVE;
        this.activePositionId = positionId;
        this.closeReason = null;
        this.cutoffOverridden = true;
        this.revealedAt = null;
        this.revealedBy = null;
    }

    public void reset() {
        this.selectionCount = null;
        this.expectedVoterCount = null;
        this.accessToken = null;
        this.closeReason = null;
        this.cutoffOverridden = false;
        this.revealedAt = null;
        this.revealedBy = null;
        this.draftPositionId = null;
        this.activePositionId = null;
        this.status = VotingRoundStatus.DRAFT;
        this.resetCount++;
    }

    public void reveal(String accountEmail, Instant timestamp) {
        this.revealedAt = timestamp;
        this.revealedBy = accountEmail;
    }

    public UUID getId() {
        return id;
    }

    public UUID getPositionId() {
        return positionId;
    }

    public int getRoundNumber() {
        return roundNumber;
    }

    public VotingRoundStatus getStatus() {
        return status;
    }

    public Integer getSelectionCount() {
        return selectionCount;
    }

    public int getResetCount() {
        return resetCount;
    }

    public Integer getExpectedVoterCount() {
        return expectedVoterCount;
    }

    public UUID getAccessToken() {
        return accessToken;
    }

    public VotingRoundCloseReason getCloseReason() {
        return closeReason;
    }

    public boolean isCutoffOverridden() {
        return cutoffOverridden;
    }

    public Instant getRevealedAt() {
        return revealedAt;
    }

    public String getRevealedBy() {
        return revealedBy;
    }

    public Long getNominationRevision() {
        return nominationRevision;
    }
}