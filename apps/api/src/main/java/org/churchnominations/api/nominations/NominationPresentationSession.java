package org.churchnominations.api.nominations;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "nomination_presentation_sessions")
public class NominationPresentationSession {
    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "intake_id", nullable = false, unique = true, updatable = false)
    private UUID intakeId;

    @Column(name = "access_token", nullable = false, unique = true)
    private UUID accessToken;

    @Column(nullable = false)
    private boolean visible;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected NominationPresentationSession() {}

    public NominationPresentationSession(UUID intakeId) {
        this.intakeId = intakeId;
        this.accessToken = UUID.randomUUID();
        this.visible = true;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void show() {
        if (!visible || endedAt != null) {
            accessToken = UUID.randomUUID();
            endedAt = null;
        }
        visible = true;
        updatedAt = Instant.now();
    }

    public void hide() {
        visible = false;
        accessToken = UUID.randomUUID();
        updatedAt = Instant.now();
    }

    public void end() {
        visible = false;
        endedAt = Instant.now();
        accessToken = UUID.randomUUID();
        updatedAt = endedAt;
    }

    public UUID getId() { return id; }
    public UUID getIntakeId() { return intakeId; }
    public UUID getAccessToken() { return accessToken; }
    public boolean isVisible() { return visible; }
    public Instant getEndedAt() { return endedAt; }
}