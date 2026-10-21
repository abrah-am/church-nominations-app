package org.churchnominations.api.election;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "elections")
public class Election {
    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "church_id", nullable = false, updatable = false)
    private UUID churchId;

    @Column(name = "department_name", nullable = false)
    private String departmentName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ElectionStatus status;

    @OneToMany(mappedBy = "election", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequence ASC")
    private List<ElectionPosition> positions = new ArrayList<>();

    protected Election() {
    }

    public Election(UUID churchId, String departmentName) {
        this.churchId = churchId;
        this.departmentName = departmentName;
        this.status = ElectionStatus.SETUP;
    }

    public void replaceSetup(String departmentName, List<ElectionPosition> replacementPositions) {
        this.departmentName = departmentName;
        positions.clear();
        replacementPositions.forEach(position -> {
            position.setElection(this);
            positions.add(position);
        });
    }

    public void updateSetup(String departmentName, List<ElectionPosition> replacementPositions) {
        this.departmentName = departmentName;
        positions.removeIf(position -> !replacementPositions.contains(position));
        replacementPositions.forEach(position -> {
            position.setElection(this);
            if (!positions.contains(position)) {
                positions.add(position);
            }
        });
        positions.sort(Comparator.comparingInt(ElectionPosition::getSequence));
    }

    void removePosition(ElectionPosition position) {
        positions.remove(position);
    }

    public UUID getId() {
        return id;
    }

    public UUID getChurchId() {
        return churchId;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public ElectionStatus getStatus() {
        return status;
    }

    public List<ElectionPosition> getPositions() {
        return positions;
    }
}