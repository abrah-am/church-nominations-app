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

    protected NominationConsolidatedName() {
    }

    public NominationConsolidatedName(UUID intakeId, int sequence, String candidateName) {
        this.intakeId = intakeId;
        this.sequence = sequence;
        this.candidateName = candidateName;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public int getSequence() {
        return sequence;
    }
}