package org.churchnominations.api.nominations;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NominationSubmissionRepository extends JpaRepository<NominationSubmission, UUID> {
    List<NominationSubmission> findAllByIntakeIdOrderByNameAscIdAsc(UUID intakeId);

    List<NominationSubmission> findAllByIntakeIdAndDeviceTokenOrderBySequenceAsc(UUID intakeId, UUID deviceToken);

    void deleteAllByIntakeIdAndDeviceToken(UUID intakeId, UUID deviceToken);
}