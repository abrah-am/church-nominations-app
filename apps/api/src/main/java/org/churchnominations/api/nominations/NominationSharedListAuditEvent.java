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

    @Column(name = "before_name", updatable = false)
    private String beforeName;

    @Column(name = "after_name", updatable = false)
    private String afterName;

    @Enumerated(EnumType.STRING)
    @Column(name = "removal_reason", length = 12, updatable = false)
    private NominationRemovalReason removalReason;

    @Column(name = "reason_detail", updatable = false)
    private String reasonDetail;

    protected NominationSharedListAuditEvent() {
    }

    public NominationSharedListAuditEvent(
            UUID intakeId, UUID entryId, String entryName, int entrySequence, Action action, String actor) {
        this(intakeId, entryId, entryName, entrySequence, action, null, null, null, null, actor);
    }

    public NominationSharedListAuditEvent(
            UUID intakeId, UUID entryId, String entryName, int entrySequence, Action action,
            String beforeName, String afterName, NominationRemovalReason removalReason, String reasonDetail,
            String actor) {
        this.intakeId = intakeId;
        this.entryId = entryId;
        this.entryName = entryName;
        this.entrySequence = entrySequence;
        this.action = action;
        this.actor = actor;
        this.beforeName = beforeName;
        this.afterName = afterName;
        this.removalReason = removalReason;
        this.reasonDetail = reasonDetail;
        this.occurredAt = Instant.now();
    }

    public enum Action {
        CORRECTED,
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
    public String getBeforeName() { return beforeName; }
    public String getAfterName() { return afterName; }
    public NominationRemovalReason getRemovalReason() { return removalReason; }
    public String getReasonDetail() { return reasonDetail; }
}