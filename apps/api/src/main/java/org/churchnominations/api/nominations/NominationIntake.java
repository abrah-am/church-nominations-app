package org.churchnominations.api.nominations;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;
import java.time.Instant;

@Entity
@Table(name = "nomination_intakes")
public class NominationIntake {
    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "position_id", nullable = false, unique = true, updatable = false)
    private UUID positionId;

    @Column(name = "access_token", nullable = false, unique = true, updatable = false)
    private UUID accessToken;

    @Column(name = "name_limit", nullable = false)
    private int nameLimit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private NominationIntakeStatus status;

    @Column(name = "revealed_at")
    private Instant revealedAt;

    @Column(name = "revealed_by")
    private String revealedBy;

    @Column(name = "revealed_contributor_count")
    private Long revealedContributorCount;

    @Column(name = "list_created_at")
    private Instant listCreatedAt;

    @Column(name = "list_created_by")
    private String listCreatedBy;

    @Column(name = "list_contributor_count")
    private Long listContributorCount;

    @Column(name = "shared_list_revision", nullable = false)
    private long sharedListRevision;

    protected NominationIntake() {
    }

    public NominationIntake(UUID positionId, int nameLimit) {
        this.positionId = positionId;
        this.accessToken = UUID.randomUUID();
        this.nameLimit = nameLimit;
        this.status = NominationIntakeStatus.OPEN;
    }

    public void close() {
        status = NominationIntakeStatus.CLOSED;
    }

    public void createSharedList(String accountEmail, long contributorCount) {
        if (status != NominationIntakeStatus.CLOSED || isListCreated()) {
            throw new NominationConflictException();
        }
        listCreatedAt = Instant.now();
        listCreatedBy = accountEmail;
        listContributorCount = contributorCount;
    }

    public void reveal(String accountEmail, long contributorCount) {
        if (!isListCreated() || isRevealed()) {
            throw new NominationConflictException();
        }
        revealedAt = Instant.now();
        revealedBy = accountEmail;
        revealedContributorCount = contributorCount;
    }

    public boolean isRevealed() {
        return revealedAt != null;
    }

    public boolean isListCreated() {
        return listCreatedAt != null;
    }

    public long getRevealedContributorCount() {
        if (revealedContributorCount != null) return revealedContributorCount;
        return listContributorCount == null ? 0 : listContributorCount;
    }

    public long getSharedListRevision() {
        return sharedListRevision;
    }

    public void advanceSharedListRevision() {
        sharedListRevision++;
    }

    public UUID getId() {
        return id;
    }

    public UUID getPositionId() {
        return positionId;
    }

    public UUID getAccessToken() {
        return accessToken;
    }

    public int getNameLimit() {
        return nameLimit;
    }

    public NominationIntakeStatus getStatus() {
        return status;
    }
}