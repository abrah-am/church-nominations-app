package org.churchnominations.api.nominations;

import org.churchnominations.api.election.ElectionPosition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ElectionPositionRepository extends JpaRepository<ElectionPosition, UUID> {
    @Query("select position from ElectionPosition position join fetch position.election where position.id = :id")
    Optional<ElectionPosition> findWithElectionById(@Param("id") UUID id);
}