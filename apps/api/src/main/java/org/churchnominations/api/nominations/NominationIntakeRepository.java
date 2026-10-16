package org.churchnominations.api.nominations;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface NominationIntakeRepository extends JpaRepository<NominationIntake, UUID> {
    Optional<NominationIntake> findByPositionId(UUID positionId);

        Optional<NominationIntake> findByAccessToken(UUID accessToken);

    Optional<NominationIntake> findByAccessTokenAndStatus(UUID accessToken, NominationIntakeStatus status);

    boolean existsByPositionIdIn(Iterable<UUID> positionIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select intake from NominationIntake intake where intake.positionId = :positionId")
    Optional<NominationIntake> findByPositionIdForUpdate(@Param("positionId") UUID positionId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select intake from NominationIntake intake where intake.accessToken = :accessToken "
            + "and intake.status = :status")
    Optional<NominationIntake> findByAccessTokenAndStatusForUpdate(
            @Param("accessToken") UUID accessToken, @Param("status") NominationIntakeStatus status);

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("select intake from NominationIntake intake where intake.accessToken = :accessToken")
        Optional<NominationIntake> findByAccessTokenForUpdate(@Param("accessToken") UUID accessToken);
}