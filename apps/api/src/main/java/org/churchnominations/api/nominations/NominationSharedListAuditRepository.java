package org.churchnominations.api.nominations;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.util.List;

public interface NominationSharedListAuditRepository extends JpaRepository<NominationSharedListAuditEvent, UUID> {
    List<NominationSharedListAuditEvent> findAllByIntakeIdAndActionOrderByOccurredAtDesc(
	    UUID intakeId, NominationSharedListAuditEvent.Action action);

    java.util.Optional<NominationSharedListAuditEvent> findFirstByIntakeIdAndEntryIdAndActionOrderByOccurredAtDesc(
	    UUID intakeId, UUID entryId, NominationSharedListAuditEvent.Action action);

	    java.util.Optional<NominationSharedListAuditEvent> findFirstByIntakeIdAndEntryIdOrderByOccurredAtDesc(
		    UUID intakeId, UUID entryId);
}