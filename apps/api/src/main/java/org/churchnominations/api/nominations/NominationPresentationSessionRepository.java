package org.churchnominations.api.nominations;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface NominationPresentationSessionRepository
        extends JpaRepository<NominationPresentationSession, UUID> {
    Optional<NominationPresentationSession> findByIntakeId(UUID intakeId);
    Optional<NominationPresentationSession> findByAccessTokenAndEndedAtIsNull(UUID accessToken);
}