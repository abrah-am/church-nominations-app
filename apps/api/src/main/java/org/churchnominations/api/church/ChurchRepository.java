package org.churchnominations.api.church;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChurchRepository extends JpaRepository<Church, UUID> {
    Optional<Church> findByAdminAccountEmail(String email);

    List<Church> findAllByAdminAccountEmailOrderByNameAsc(String email);

    boolean existsByAdminAccountEmail(String email);
}