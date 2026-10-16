package org.churchnominations.api.nominations;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

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