package org.churchnominations.api.election;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "election_positions")
public class ElectionPosition {
    @Id
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "election_id", nullable = false)
    private Election election;

    @Column(nullable = false)
    private String name;

    @Column(name = "opening_count", nullable = false)
    private int openingCount;

    @Column(name = "sequence", nullable = false)
    private int sequence;

    protected ElectionPosition() {
    }

    public ElectionPosition(String name, int openingCount, int sequence) {
        this.name = name;
        this.openingCount = openingCount;
        this.sequence = sequence;
    }

    void update(String name, int openingCount, int sequence) {
        this.name = name;
        this.openingCount = openingCount;
        this.sequence = sequence;
    }

    void setSequence(int sequence) {
        this.sequence = sequence;
    }

    void setElection(Election election) {
        this.election = election;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getOpeningCount() {
        return openingCount;
    }

    public int getSequence() {
        return sequence;
    }

    public Election getElection() {
        return election;
    }
}