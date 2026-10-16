package org.churchnominations.api.nominations;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NominationConsolidatedNameRepository extends JpaRepository<NominationConsolidatedName, UUID> {
    List<NominationConsolidatedName> findAllByIntakeIdOrderBySequenceAsc(UUID intakeId);

    void deleteAllByIntakeId(UUID intakeId);
}