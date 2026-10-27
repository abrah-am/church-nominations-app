package org.churchnominations.api.election.voting;

import org.churchnominations.api.election.ElectionPositionDetails;
import org.churchnominations.api.election.ElectionService;
import org.churchnominations.api.nominations.NominationConsolidatedName;
import org.churchnominations.api.nominations.NominationConsolidatedNameRepository;
import org.churchnominations.api.nominations.NominationIntake;
import org.churchnominations.api.nominations.NominationIntakeRepository;
import org.churchnominations.api.nominations.NominationIntakeStatus;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class VotingRoundService {
    private final ElectionService elections;
    private final NominationIntakeRepository intakes;
    private final NominationConsolidatedNameRepository consolidatedNames;
    private final VotingRoundRepository rounds;
    private final VotingRoundCandidateRepository candidates;
    private final JdbcTemplate jdbc;

    public VotingRoundService(
            ElectionService elections,
            NominationIntakeRepository intakes,
            NominationConsolidatedNameRepository consolidatedNames,
            VotingRoundRepository rounds,
            VotingRoundCandidateRepository candidates,
            JdbcTemplate jdbc) {
        this.elections = elections;
        this.intakes = intakes;
        this.consolidatedNames = consolidatedNames;
        this.rounds = rounds;
        this.candidates = candidates;
        this.jdbc = jdbc;
    }

    public List<VotingRoundResponse> list(UUID electionId, UUID positionId, String accountEmail) {
        elections.getPositionForChurch(electionId, positionId, accountEmail);
        return rounds.findAllByPositionIdOrderByRoundNumberAsc(positionId).stream()
                .map(this::response)
                .toList();
    }

    public void assertConsolidationEditable(UUID positionId) {
        assertNoActiveRound(positionId);
    }

    public void assertNoActiveRound(UUID positionId) {
        if (rounds.findFirstByPositionIdAndStatus(positionId, VotingRoundStatus.ACTIVE).isPresent()) {
            throw new org.churchnominations.api.nominations.NominationConflictException();
        }
    }

    @Transactional
    public VotingRoundResponse create(
            UUID electionId, UUID positionId, ConfigureVotingRoundRequest request, String accountEmail) {
        ElectionPositionDetails position = elections.lockPositionForChurch(electionId, positionId, accountEmail);
        ensurePositionIncomplete(positionId, position.openingCount());
        if (rounds.findFirstByPositionIdAndStatus(positionId, VotingRoundStatus.DRAFT).isPresent()
            || rounds.existsByPositionIdAndStatus(positionId, VotingRoundStatus.ACTIVE)) {
            throw new VotingRoundConflictException();
        }
        int roundNumber = rounds.findMaximumRoundNumber(positionId) + 1;
        List<String> selectedNames = validateAndResolveCandidates(positionId, roundNumber, request);
        VotingRound round;
        try {
            round = rounds.saveAndFlush(new VotingRound(positionId, roundNumber, request.selectionCount()));
        } catch (DataIntegrityViolationException exception) {
            throw new VotingRoundConflictException();
        }
        if (roundNumber == 1) {
            NominationIntake intake = intakes.findByPositionId(positionId).orElse(null);
            if (intake != null) round.captureNominationRevision(intake.getSharedListRevision());
            round = rounds.saveAndFlush(round);
        }
        saveCandidates(round.getId(), selectedNames);
        return response(round);
    }

    @Transactional
    public VotingRoundResponse update(
            UUID electionId,
            UUID positionId,
            UUID roundId,
            ConfigureVotingRoundRequest request,
            String accountEmail) {
        ElectionPositionDetails position = elections.lockPositionForChurch(electionId, positionId, accountEmail);
        ensurePositionIncomplete(positionId, position.openingCount());
        VotingRound round = rounds.findByIdAndPositionId(roundId, positionId)
                .orElseThrow(VotingRoundNotFoundException::new);
        if (round.getStatus() != VotingRoundStatus.DRAFT) {
            throw new VotingRoundConflictException();
        }
        List<String> selectedNames = validateAndResolveCandidates(positionId, round.getRoundNumber(), request);
        candidates.deleteAllByRoundId(roundId);
        candidates.flush();
        round.updateSelectionCount(request.selectionCount());
        if (round.getRoundNumber() == 1) {
            intakes.findByPositionId(positionId)
                .ifPresent(intake -> round.captureNominationRevision(intake.getSharedListRevision()));
        }
        rounds.save(round);
        saveCandidates(roundId, selectedNames);
        return response(round);
    }

        @Transactional
        public VotingRoundResponse start(
            UUID electionId, UUID positionId, UUID roundId, int expectedVoterCount, String accountEmail) {
        ElectionPositionDetails position = elections.lockPositionForChurch(electionId, positionId, accountEmail);
        ensurePositionIncomplete(positionId, position.openingCount());
        VotingRound round = rounds.findByIdAndPositionIdForUpdate(roundId, positionId)
            .orElseThrow(VotingRoundNotFoundException::new);
        if (round.getStatus() != VotingRoundStatus.DRAFT
            || round.getSelectionCount() == null
            || candidates.findAllByRoundIdOrderBySequenceAsc(roundId).isEmpty()
            || rounds.existsByPositionIdAndStatus(positionId, VotingRoundStatus.ACTIVE)
            || !hasCurrentRoster(round)
            || !hasValidPredecessorRoster(round)) {
            throw new VotingRoundConflictException();
        }
        round.activate(expectedVoterCount);
        return response(rounds.saveAndFlush(round));
        }

        @Transactional
        public VotingRoundResponse reset(
            UUID electionId, UUID positionId, UUID roundId, String accountEmail) {
        elections.lockPositionForChurch(electionId, positionId, accountEmail);
        VotingRound round = rounds.findByIdAndPositionIdForUpdate(roundId, positionId)
            .orElseThrow(VotingRoundNotFoundException::new);
        if (round.getStatus() != VotingRoundStatus.CLOSED
            || jdbc.queryForObject("""
                select exists (
                    select 1 from voting_rounds
                    where position_id = ? and round_number > ?
                )
                """, Boolean.class, positionId, round.getRoundNumber())) {
            throw new VotingRoundConflictException();
        }

        Instant resetAt = Instant.now();
        jdbc.update("delete from voting_ballots where round_id = ?", roundId);
        jdbc.update("delete from voting_round_candidate_decisions where round_id = ?", roundId);
        round.reset();
        VotingRoundResponse response = response(rounds.saveAndFlush(round));
        jdbc.update("""
            insert into voting_round_reset_events (id, round_id, reset_at, reset_by)
            values (?, ?, ?, ?)
            """, UUID.randomUUID(), roundId, Timestamp.from(resetAt), accountEmail);
        return response;
        }

        @Transactional
        public VotingRoundResponse close(
            UUID electionId, UUID positionId, UUID roundId, String accountEmail) {
        ElectionPositionDetails position = elections.lockPositionForChurch(electionId, positionId, accountEmail);
        VotingRound round = rounds.findByIdAndPositionIdForUpdate(roundId, positionId)
            .orElseThrow(VotingRoundNotFoundException::new);
        if (round.getStatus() != VotingRoundStatus.ACTIVE) {
            throw new VotingRoundConflictException();
        }
        round.close(VotingRoundCloseReason.ADMIN);
        return response(rounds.saveAndFlush(round));
        }

        @Transactional
        public VotingRoundResponse reopen(
            UUID electionId, UUID positionId, UUID roundId, String accountEmail) {
        elections.lockPositionForChurch(electionId, positionId, accountEmail);
        VotingRound round = rounds.findByIdAndPositionIdForUpdate(roundId, positionId)
            .orElseThrow(VotingRoundNotFoundException::new);
        if (round.getStatus() != VotingRoundStatus.CLOSED
            || rounds.existsByPositionIdAndStatus(positionId, VotingRoundStatus.ACTIVE)) {
            throw new VotingRoundConflictException();
        }
        round.reopen();
        return response(rounds.saveAndFlush(round));
        }

        @Transactional
        public VotingRoundResultsResponse reveal(
            UUID electionId, UUID positionId, UUID roundId, String accountEmail) {
        elections.lockPositionForChurch(electionId, positionId, accountEmail);
        VotingRound round = rounds.findByIdAndPositionIdForUpdate(roundId, positionId)
            .orElseThrow(VotingRoundNotFoundException::new);
        if (round.getStatus() != VotingRoundStatus.CLOSED || round.getRevealedAt() != null) {
            throw new VotingRoundConflictException();
        }
        round.reveal(accountEmail, Instant.now());
        round = rounds.saveAndFlush(round);
        return results(round);
        }

        public VotingRoundResultsResponse results(
            UUID electionId, UUID positionId, UUID roundId, String accountEmail) {
        elections.getPositionForChurch(electionId, positionId, accountEmail);
        VotingRound round = rounds.findByIdAndPositionId(roundId, positionId)
            .orElseThrow(VotingRoundNotFoundException::new);
        if (round.getStatus() != VotingRoundStatus.CLOSED || round.getRevealedAt() == null) {
            throw new VotingRoundNotFoundException();
        }
        return results(round);
        }

        public VotingRoundProgressResponse progress(
            UUID electionId, UUID positionId, UUID roundId, String accountEmail) {
        elections.getPositionForChurch(electionId, positionId, accountEmail);
        VotingRound round = rounds.findByIdAndPositionId(roundId, positionId)
            .orElseThrow(VotingRoundNotFoundException::new);
        Long ballotsCast = jdbc.queryForObject(
            "select count(*) from voting_ballots where round_id = ?", Long.class, roundId);
        return new VotingRoundProgressResponse(roundId, round.getStatus(),
            ballotsCast == null ? 0 : ballotsCast, round.getExpectedVoterCount());
        }

        @Transactional
        public VotingRoundResultsResponse decide(
            UUID electionId,
            UUID positionId,
            UUID roundId,
            UUID candidateId,
            CandidateDecisionRequest request,
            String accountEmail) {
        ElectionPositionDetails position = elections.lockPositionForChurch(electionId, positionId, accountEmail);
        VotingRound round = rounds.findByIdAndPositionIdForUpdate(roundId, positionId)
            .orElseThrow(VotingRoundNotFoundException::new);
        if (round.getStatus() != VotingRoundStatus.CLOSED || round.getRevealedAt() == null) {
            throw new VotingRoundConflictException();
        }
        if (candidates.findByIdAndRoundId(candidateId, roundId).isEmpty()) {
            throw new VotingRoundNotFoundException();
        }
        if (request.decision() == CandidateDecision.ELECTED && position.openingCount() > 1) {
            VotingRoundResultsResponse currentResults = results(round);
            long candidateVotes = currentResults.candidates().stream()
                .filter(candidate -> candidate.id().equals(candidateId))
                .findFirst()
                .orElseThrow(VotingRoundNotFoundException::new)
                .votes();
            if (candidateVotes < currentResults.majorityThreshold()
                || electedCandidateCount(positionId, candidateId) >= position.openingCount()) {
                throw new VotingRoundConflictException();
            }
        }

        Instant decidedAt = Instant.now();
        String reason = request.reason() == null || request.reason().isBlank() ? null : request.reason().trim();
        jdbc.update("""
            insert into voting_round_candidate_decision_events
                (id, round_id, candidate_id, decision, reason, decided_at, decided_by)
            values (?, ?, ?, ?, ?, ?, ?)
            """, UUID.randomUUID(), roundId, candidateId, request.decision().name(),
            reason, Timestamp.from(decidedAt), accountEmail);
        jdbc.update("""
            insert into voting_round_candidate_decisions
                (round_id, candidate_id, decision, reason, decided_at, decided_by)
            values (?, ?, ?, ?, ?, ?)
            on conflict (round_id, candidate_id) do update set
                decision = excluded.decision,
                reason = excluded.reason,
                decided_at = excluded.decided_at,
                decided_by = excluded.decided_by
            """, roundId, candidateId, request.decision().name(), reason,
            Timestamp.from(decidedAt), accountEmail);
        return results(round);
        }

        private void ensurePositionIncomplete(UUID positionId, int openingCount) {
        if (electedCandidateCount(positionId, null) >= openingCount) {
            throw new VotingRoundConflictException();
        }
        }

        private int electedCandidateCount(UUID positionId, UUID excludedCandidateId) {
        Integer count = jdbc.queryForObject("""
            select count(*)
            from voting_round_candidate_decisions decision
            join voting_round_candidates candidate
                on candidate.round_id = decision.round_id and candidate.id = decision.candidate_id
            join voting_rounds round on round.id = candidate.round_id
            where round.position_id = ? and decision.decision = 'ELECTED'
                and (cast(? as uuid) is null or candidate.id <> cast(? as uuid))
            """, Integer.class, positionId, excludedCandidateId, excludedCandidateId);
        return count == null ? 0 : count;
        }

        @Transactional
        public VotingRoundResultsResponse undoDecision(
            UUID electionId, UUID positionId, UUID roundId, UUID candidateId, String accountEmail) {
        elections.lockPositionForChurch(electionId, positionId, accountEmail);
        VotingRound round = rounds.findByIdAndPositionIdForUpdate(roundId, positionId)
            .orElseThrow(VotingRoundNotFoundException::new);
        if (round.getStatus() != VotingRoundStatus.CLOSED || round.getRevealedAt() == null) {
            throw new VotingRoundConflictException();
        }
        if (candidates.findByIdAndRoundId(candidateId, roundId).isEmpty()) {
            throw new VotingRoundNotFoundException();
        }

        List<CurrentCandidateDecision> currentDecisions = jdbc.query("""
            select decision, reason from voting_round_candidate_decisions
            where round_id = ? and candidate_id = ?
            """, (result, row) -> new CurrentCandidateDecision(
                result.getString("decision"), result.getString("reason")), roundId, candidateId);
        CurrentCandidateDecision currentDecision = currentDecisions.stream().findFirst()
            .orElseThrow(VotingRoundConflictException::new);
        if (!"ELIMINATED".equals(currentDecision.decision())) {
            throw new VotingRoundConflictException();
        }

        jdbc.update("delete from voting_round_candidate_decisions where round_id = ? and candidate_id = ?",
            roundId, candidateId);
        jdbc.update("""
            insert into voting_round_candidate_decision_events
                (id, round_id, candidate_id, decision, reason, decided_at, decided_by)
            values (?, ?, ?, 'UNDONE', ?, ?, ?)
            """, UUID.randomUUID(), roundId, candidateId,
            currentDecision.reason() == null ? "Undid ELIMINATED decision"
                : "Undid ELIMINATED decision: " + currentDecision.reason(),
            Timestamp.from(Instant.now()), accountEmail);
        return results(round);
        }

        private record CurrentCandidateDecision(String decision, String reason) {}

        private VotingRoundResultsResponse results(VotingRound round) {
        Long ballotsCastResult = jdbc.queryForObject(
            "select count(*) from voting_ballots where round_id = ?", Long.class, round.getId());
        long ballotsCast = ballotsCastResult == null ? 0 : ballotsCastResult;
        List<VotingRoundResultsResponse.CandidateResult> candidateResults = jdbc.query("""
            select c.id, c.candidate_name, c.sequence, count(choice.ballot_id) as votes,
                   decision.decision, decision.reason, decision.decided_at, decision.decided_by
            from voting_round_candidates c
            left join voting_ballot_choices choice
                on choice.round_id = c.round_id and choice.candidate_id = c.id
            left join voting_round_candidate_decisions decision
                on decision.round_id = c.round_id and decision.candidate_id = c.id
            where c.round_id = ?
            group by c.id, c.candidate_name, c.sequence, decision.decision,
                 decision.reason, decision.decided_at, decision.decided_by
            order by c.sequence
            """, (result, row) -> {
            Timestamp decidedAt = result.getTimestamp("decided_at");
            String decision = result.getString("decision");
            return new VotingRoundResultsResponse.CandidateResult(
                result.getObject("id", UUID.class),
                result.getString("candidate_name"),
                result.getInt("sequence"),
                result.getLong("votes"),
                decision == null ? null : CandidateDecision.valueOf(decision),
                result.getString("reason"),
                decidedAt == null ? null : decidedAt.toInstant(),
                result.getString("decided_by"));
        }, round.getId());
        return new VotingRoundResultsResponse(round.getId(), round.getRoundNumber(),
            round.getExpectedVoterCount(), ballotsCast, ballotsCast / 2 + 1,
            round.getRevealedAt(), round.getRevealedBy(), candidateResults);
        }

        public PublicVotingPollResponse getPoll(UUID accessToken, UUID deviceToken) {
        VotingRound round = rounds.findByAccessTokenAndStatus(accessToken, VotingRoundStatus.ACTIVE)
            .orElseThrow(VotingRoundNotFoundException::new);
        ElectionPositionDetails position = elections.getPositionForPoll(round.getPositionId());
        List<VotingRoundCandidateResponse> roster = candidates.findAllByRoundIdOrderBySequenceAsc(round.getId())
            .stream().map(VotingRoundCandidateResponse::from).toList();
        List<UUID> ownChoices = jdbc.query(
            "select c.candidate_id from voting_ballots b join voting_ballot_choices c on c.ballot_id = b.id "
                + "where b.round_id = ? and b.device_token = ? order by c.candidate_id",
            (result, row) -> result.getObject(1, UUID.class), round.getId(), deviceToken);
        return new PublicVotingPollResponse(position.departmentName(), position.positionName(),
            round.getSelectionCount(), roster, ownChoices.stream().map(UUID::toString).toList());
        }

        @Transactional
        public SubmittedBallotResponse submitBallot(UUID accessToken, UUID deviceToken, ReplaceBallotRequest request) {
        VotingRound round = rounds.findByAccessTokenForUpdate(accessToken)
            .orElseThrow(VotingRoundNotFoundException::new);
        if (round.getStatus() != VotingRoundStatus.ACTIVE) {
            throw new VotingRoundNotFoundException();
        }
        List<UUID> candidateIds = request.candidateIds();
        if (candidateIds.stream().distinct().count() != candidateIds.size()
            || candidateIds.size() != round.getSelectionCount()
            || candidates.findAllByRoundIdAndIdIn(round.getId(), candidateIds).size() != candidateIds.size()) {
            throw new InvalidVotingRoundRequestException();
        }
        Long currentBallotCount = jdbc.queryForObject(
            "select count(*) from voting_ballots where round_id = ?", Long.class, round.getId());
        boolean deviceHasBallot = jdbc.queryForObject(
            "select exists(select 1 from voting_ballots where round_id = ? and device_token = ?)",
            Boolean.class, round.getId(), deviceToken);
        if (currentBallotCount != null
            && currentBallotCount >= round.getExpectedVoterCount()
            && !deviceHasBallot) {
            throw new VotingRoundConflictException();
        }
        UUID ballotId = jdbc.query("""
            insert into voting_ballots (id, round_id, device_token)
            values (?, ?, ?)
            on conflict (round_id, device_token) do update set device_token = excluded.device_token
            returning id
            """, (result, row) -> result.getObject(1, UUID.class), UUID.randomUUID(), round.getId(), deviceToken)
            .getFirst();
        jdbc.update("delete from voting_ballot_choices where ballot_id = ?", ballotId);
        candidateIds.forEach(candidateId -> jdbc.update(
            "insert into voting_ballot_choices (id, round_id, ballot_id, candidate_id) values (?, ?, ?, ?)",
            UUID.randomUUID(), round.getId(), ballotId, candidateId));

        Long ballotCount = jdbc.queryForObject(
            "select count(*) from voting_ballots where round_id = ?", Long.class, round.getId());
        if (isCutoffEligible(round)) {
            if (ballotCount != null && ballotCount >= round.getExpectedVoterCount() - 1) {
                round.close(VotingRoundCloseReason.CUTOFF);
                rounds.saveAndFlush(round);
            }
        } else if (!round.isCutoffOverridden() && ballotCount != null
            && ballotCount >= round.getExpectedVoterCount()) {
            round.close(VotingRoundCloseReason.EXPECTED_COUNT);
            rounds.saveAndFlush(round);
        }
        return new SubmittedBallotResponse(true);
        }

        private boolean isCutoffEligible(VotingRound round) {
        return !round.isCutoffOverridden() && round.getSelectionCount() == 1
            && round.getExpectedVoterCount() % 2 == 0
            && candidates.findAllByRoundIdOrderBySequenceAsc(round.getId()).size() == 2;
        }

    private List<String> validateAndResolveCandidates(
            UUID positionId, int roundNumber, ConfigureVotingRoundRequest request) {
        if (request.selectionCount() > request.candidateNames().size()) {
            throw new InvalidVotingRoundRequestException();
        }
        if (roundNumber > 1) {
            return resolveAdvancedCandidates(positionId, roundNumber - 1, request);
        }
        NominationIntake intake = intakes.findByPositionId(positionId)
                .orElseThrow(VotingRoundConflictException::new);
        if (intake.getStatus() != NominationIntakeStatus.CLOSED) {
            throw new VotingRoundConflictException();
        }
        List<NominationConsolidatedName> snapshot = consolidatedNames
                .findAllByIntakeIdAndActiveTrueOrderBySequenceAsc(intake.getId());
        if (snapshot.isEmpty()) {
            throw new VotingRoundConflictException();
        }

        Map<String, String> snapshotByNormalizedName = new HashMap<>();
        for (NominationConsolidatedName entry : snapshot) {
            snapshotByNormalizedName.put(normalize(entry.getCandidateName()), entry.getCandidateName());
        }
        List<String> requested = request.candidateNames().stream().map(String::trim).toList();
        if (requested.stream().anyMatch(String::isBlank)
                || requested.stream().map(VotingRoundService::normalize).distinct().count() != requested.size()) {
            throw new InvalidVotingRoundRequestException();
        }
        List<String> resolved = requested.stream()
                .map(name -> snapshotByNormalizedName.get(normalize(name)))
                .toList();
        if (resolved.stream().anyMatch(java.util.Objects::isNull)) {
            throw new InvalidVotingRoundRequestException();
        }
        return resolved;
    }

    private List<String> resolveAdvancedCandidates(
            UUID positionId, int previousRoundNumber, ConfigureVotingRoundRequest request) {
        VotingRound previousRound = rounds.findByPositionIdAndRoundNumber(positionId, previousRoundNumber)
                .orElseThrow(VotingRoundConflictException::new);
        if (previousRound.getStatus() != VotingRoundStatus.CLOSED || previousRound.getRevealedAt() == null) {
            throw new VotingRoundConflictException();
        }

        List<String> requested = normalizeRequestedNames(request.candidateNames());
        Map<String, String> advancedByNormalizedName = new HashMap<>();
        jdbc.query("""
                select candidate.candidate_name
                from voting_round_candidates candidate
                join voting_round_candidate_decisions decision
                    on decision.round_id = candidate.round_id and decision.candidate_id = candidate.id
                where candidate.round_id = ? and decision.decision = 'ADVANCED'
                """, result -> {
            String candidateName = result.getString(1);
            advancedByNormalizedName.put(normalize(candidateName), candidateName);
        }, previousRound.getId());
        List<String> resolved = requested.stream()
                .map(name -> advancedByNormalizedName.get(normalize(name)))
                .toList();
        if (resolved.stream().anyMatch(java.util.Objects::isNull)) {
            throw new InvalidVotingRoundRequestException();
        }
        return resolved;
    }

    private boolean hasValidPredecessorRoster(VotingRound round) {
        if (round.getRoundNumber() == 1) {
            return true;
        }
        VotingRound previous = rounds.findByPositionIdAndRoundNumber(
                        round.getPositionId(), round.getRoundNumber() - 1)
                .filter(candidate -> candidate.getStatus() == VotingRoundStatus.CLOSED
                        && candidate.getRevealedAt() != null)
                .orElse(null);
        if (previous == null) {
            return false;
        }
        List<String> roster = candidates.findAllByRoundIdOrderBySequenceAsc(round.getId()).stream()
            .map(VotingRoundCandidate::getName)
                .toList();
        try {
            resolveAdvancedCandidates(round.getPositionId(), previous.getRoundNumber(),
                    new ConfigureVotingRoundRequest(roster, round.getSelectionCount()));
            return true;
        } catch (InvalidVotingRoundRequestException exception) {
            return false;
        }
    }

    private boolean hasCurrentRoster(VotingRound round) {
        if (round.getRoundNumber() != 1) return true;
        NominationIntake intake = intakes.findByPositionId(round.getPositionId()).orElse(null);
        if (intake == null || intake.getStatus() != NominationIntakeStatus.CLOSED) return false;
        return round.getNominationRevision() != null
            && round.getNominationRevision() == intake.getSharedListRevision();
    }

    private static List<String> normalizeRequestedNames(List<String> candidateNames) {
        List<String> requested = candidateNames.stream().map(String::trim).toList();
        if (requested.stream().anyMatch(String::isBlank)
                || requested.stream().map(VotingRoundService::normalize).distinct().count() != requested.size()) {
            throw new InvalidVotingRoundRequestException();
        }
        return requested;
    }

    private void saveCandidates(UUID roundId, List<String> names) {
        List<VotingRoundCandidate> selected = java.util.stream.IntStream.range(0, names.size())
                .mapToObj(index -> new VotingRoundCandidate(roundId, names.get(index), index + 1))
                .toList();
        candidates.saveAllAndFlush(selected);
    }

    private VotingRoundResponse response(VotingRound round) {
        List<VotingRoundCandidateResponse> roundCandidates = candidates
                .findAllByRoundIdOrderBySequenceAsc(round.getId()).stream()
                .map(VotingRoundCandidateResponse::from)
                .toList();
        return new VotingRoundResponse(round.getId(), round.getRoundNumber(), round.getStatus(),
            round.getSelectionCount(), roundCandidates, round.getExpectedVoterCount(),
            round.getAccessToken(), round.getCloseReason(), round.getResetCount(), round.getNominationRevision());
    }

    private static String normalize(String name) {
        return name.toLowerCase(Locale.ROOT);
    }
}