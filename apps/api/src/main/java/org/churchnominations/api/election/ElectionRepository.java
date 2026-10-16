package org.churchnominations.api.election;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ElectionRepository extends JpaRepository<Election, UUID> {
    List<Election> findAllByChurchIdOrderByDepartmentNameAscIdAsc(UUID churchId);

    Optional<Election> findByIdAndChurchId(UUID id, UUID churchId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select election from Election election where election.id = :id and election.churchId = :churchId")
    Optional<Election> findByIdAndChurchIdForUpdate(@Param("id") UUID id, @Param("churchId") UUID churchId);
}