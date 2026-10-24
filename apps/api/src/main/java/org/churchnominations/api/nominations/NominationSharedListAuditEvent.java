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
@Table(name = "nomination_shared_list_audit_events")
public class NominationSharedListAuditEvent {
    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "intake_id", nullable = false, updatable = false)
    private UUID intakeId;

    @Column(name = "entry_id", nullable = false, updatable = false)
    private UUID entryId;

    @Column(name = "entry_name", nullable = false, updatable = false)
    private String entryName;

    @Column(name = "entry_sequence", nullable = false, updatable = false)
    private int entrySequence;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12, updatable = false)
    private Action action;

    @Column(nullable = false, length = 320, updatable = false)
    private String actor;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt;

    protected NominationSharedListAuditEvent() {
    }

    public NominationSharedListAuditEvent(
            UUID intakeId, UUID entryId, String entryName, int entrySequence, Action action, String actor) {
        this.intakeId = intakeId;
        this.entryId = entryId;
        this.entryName = entryName;
        this.entrySequence = entrySequence;
        this.action = action;
        this.actor = actor;
        this.occurredAt = Instant.now();
    }

    public enum Action {
        REMOVED,
        RESTORED
    }

    public UUID getId() { return id; }
    public UUID getEntryId() { return entryId; }
    public String getEntryName() { return entryName; }
    public int getEntrySequence() { return entrySequence; }
    public Action getAction() { return action; }
    public String getActor() { return actor; }
    public Instant getOccurredAt() { return occurredAt; }
    public UUID getIntakeId() { return intakeId; }
}