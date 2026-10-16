package org.churchnominations.api.board;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BoardRepository extends JpaRepository<Board, UUID> {
    List<Board> findAllByChurchIdOrderByYearDescIdAsc(UUID churchId);

    Optional<Board> findByIdAndChurchId(UUID id, UUID churchId);

    boolean existsByChurchIdAndYear(UUID churchId, int year);
}