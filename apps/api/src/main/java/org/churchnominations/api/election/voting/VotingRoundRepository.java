package org.churchnominations.api.election.voting;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VotingRoundRepository extends JpaRepository<VotingRound, UUID> {
    List<VotingRound> findAllByPositionIdOrderByRoundNumberAsc(UUID positionId);

    Optional<VotingRound> findByIdAndPositionId(UUID id, UUID positionId);

    Optional<VotingRound> findByPositionIdAndRoundNumber(UUID positionId, int roundNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select round from VotingRound round where round.id = :id and round.positionId = :positionId")
    Optional<VotingRound> findByIdAndPositionIdForUpdate(@Param("id") UUID id, @Param("positionId") UUID positionId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select round from VotingRound round where round.accessToken = :accessToken")
    Optional<VotingRound> findByAccessTokenForUpdate(@Param("accessToken") UUID accessToken);

    Optional<VotingRound> findByAccessTokenAndStatus(UUID accessToken, VotingRoundStatus status);

    Optional<VotingRound> findFirstByPositionIdAndStatus(UUID positionId, VotingRoundStatus status);

    boolean existsByPositionIdAndStatus(UUID positionId, VotingRoundStatus status);

    @Query("select coalesce(max(round.roundNumber), 0) from VotingRound round where round.positionId = :positionId")
    int findMaximumRoundNumber(@Param("positionId") UUID positionId);
}