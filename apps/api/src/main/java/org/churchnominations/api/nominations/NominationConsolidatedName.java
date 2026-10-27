package org.churchnominations.api.nominations;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "nomination_consolidated_names")
public class NominationConsolidatedName {
    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "intake_id", nullable = false, updatable = false)
    private UUID intakeId;

    @Column(nullable = false)
    private int sequence;

    @Column(name = "candidate_name", nullable = false)
    private String candidateName;

    @Column(nullable = false)
    private boolean active = true;

    protected NominationConsolidatedName() {
    }

    public NominationConsolidatedName(UUID intakeId, int sequence, String candidateName) {
        this(intakeId, sequence, candidateName, true);
    }

    public NominationConsolidatedName(UUID intakeId, int sequence, String candidateName, boolean active) {
        this.intakeId = intakeId;
        this.sequence = sequence;
        this.candidateName = candidateName;
        this.active = active;
    }

    public static NominationConsolidatedName restore(UUID id, UUID intakeId, int sequence, String candidateName) {
        NominationConsolidatedName row = new NominationConsolidatedName(intakeId, sequence, candidateName, true);
        row.id = id;
        return row;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public int getSequence() {
        return sequence;
    }

    public UUID getId() {
        return id;
    }

    public boolean isActive() {
        return active;
    }

    public void update(String name, int newSequence, boolean isActive) {
        candidateName = name;
        sequence = newSequence;
        active = isActive;
    }
}