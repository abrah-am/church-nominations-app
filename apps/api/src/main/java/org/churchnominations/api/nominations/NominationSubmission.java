package org.churchnominations.api.nominations;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "nomination_submissions")
public class NominationSubmission {
    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "intake_id", nullable = false, updatable = false)
    private UUID intakeId;

    @Column(name = "device_token", nullable = false, updatable = false)
    private UUID deviceToken;

    @Column(nullable = false)
    private String name;

    @Column(name = "normalized_name", nullable = false, updatable = false)
    private String normalizedName;

    @Column(nullable = false)
    private int sequence;

    protected NominationSubmission() {
    }

    public NominationSubmission(UUID intakeId, UUID deviceToken, String name, String normalizedName, int sequence) {
        this.intakeId = intakeId;
        this.deviceToken = deviceToken;
        this.name = name;
        this.normalizedName = normalizedName;
        this.sequence = sequence;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public UUID getDeviceToken() {
        return deviceToken;
    }
}