package org.churchnominations.api.nominations;

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
@Table(name = "nomination_presentation_control_events")
public class NominationPresentationControlEvent {
    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "intake_id", nullable = false, updatable = false)
    private UUID intakeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8, updatable = false)
    private Action action;

    @Column(name = "actor_label", nullable = false, length = 32, updatable = false)
    private String actorLabel = "Administrator";

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt = Instant.now();

    protected NominationPresentationControlEvent() {}

    public NominationPresentationControlEvent(UUID intakeId, Action action) {
        this.intakeId = intakeId;
        this.action = action;
    }

    public enum Action { START, HIDE, END }
}