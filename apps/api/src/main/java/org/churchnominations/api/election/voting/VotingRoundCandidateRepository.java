package org.churchnominations.api.election.voting;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VotingRoundCandidateRepository extends JpaRepository<VotingRoundCandidate, UUID> {
    java.util.Optional<VotingRoundCandidate> findByIdAndRoundId(UUID id, UUID roundId);

    List<VotingRoundCandidate> findAllByRoundIdOrderBySequenceAsc(UUID roundId);

    List<VotingRoundCandidate> findAllByRoundIdAndIdIn(UUID roundId, List<UUID> ids);

    void deleteAllByRoundId(UUID roundId);
}