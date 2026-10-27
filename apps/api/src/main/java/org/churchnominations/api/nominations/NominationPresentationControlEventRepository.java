package org.churchnominations.api.nominations;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface NominationPresentationControlEventRepository
        extends JpaRepository<NominationPresentationControlEvent, UUID> {
}