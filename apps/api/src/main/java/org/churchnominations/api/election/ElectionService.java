package org.churchnominations.api.election;

import org.churchnominations.api.election.voting.VotingRoundNotFoundException;
import org.churchnominations.api.church.Church;
import org.churchnominations.api.church.ChurchRepository;
import org.churchnominations.api.nominations.NominationIntakeRepository;
import org.churchnominations.api.nominations.ElectionPositionRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ElectionService {
    private final ElectionRepository elections;
    private final ChurchRepository churches;
    private final NominationIntakeRepository nominationIntakes;
    private final ElectionPositionRepository positions;
    private final JdbcTemplate jdbc;

    public ElectionService(
            ElectionRepository elections,
            ChurchRepository churches,
            NominationIntakeRepository nominationIntakes,
            ElectionPositionRepository positions,
            JdbcTemplate jdbc) {
        this.elections = elections;
        this.churches = churches;
        this.nominationIntakes = nominationIntakes;
        this.positions = positions;
        this.jdbc = jdbc;
    }

    public List<ElectionResponse> list(String accountEmail) {
        UUID churchId = getChurch(accountEmail).getId();
        List<Election> churchElections = elections.findAllByChurchIdOrderByDepartmentNameAscIdAsc(churchId);
        Map<UUID, ElectionStatus> statuses = deriveStatuses(churchId, churchElections);
        return churchElections.stream()
                .map(election -> ElectionResponse.from(election, statuses.get(election.getId())))
                .toList();
    }

    public ElectionResponse get(UUID id, String accountEmail) {
        UUID churchId = getChurch(accountEmail).getId();
        Election election = elections.findByIdAndChurchId(id, churchId)
                .orElseThrow(ElectionNotFoundException::new);
        return ElectionResponse.from(election, deriveStatuses(churchId, List.of(election)).get(election.getId()));
    }

    public ElectionPositionDetails getPositionForChurch(UUID electionId, UUID positionId, String accountEmail) {
        Election election = findForChurch(electionId, accountEmail);
        return positionDetails(election, positionId);
    }

        public ElectionPositionDetails getPositionForPoll(UUID positionId) {
        return positions.findWithElectionById(positionId)
            .map(position -> new ElectionPositionDetails(
                position.getElection().getDepartmentName(), position.getName(), position.getOpeningCount()))
            .orElseThrow(VotingRoundNotFoundException::new);
        }

    @Transactional
    public ElectionPositionDetails lockPositionForChurch(UUID electionId, UUID positionId, String accountEmail) {
        UUID churchId = getChurch(accountEmail).getId();
        Election election = elections.findByIdAndChurchIdForUpdate(electionId, churchId)
                .orElseThrow(ElectionNotFoundException::new);
        return positionDetails(election, positionId);
    }

    private ElectionPositionDetails positionDetails(Election election, UUID positionId) {
        return election.getPositions().stream()
                .filter(position -> position.getId().equals(positionId))
                .findFirst()
                .map(position -> new ElectionPositionDetails(
                    election.getDepartmentName(), position.getName(), position.getOpeningCount()))
                .orElseThrow(ElectionNotFoundException::new);
    }

    @Transactional
    public ElectionResponse create(ElectionSetupRequest request, String accountEmail) {
        UUID churchId = getChurch(accountEmail).getId();
        Election election = new Election(churchId, request.departmentName());
        election.replaceSetup(request.departmentName(), mapPositions(request.positions()));
        election = elections.saveAndFlush(election);
        return ElectionResponse.from(election, deriveStatuses(churchId, List.of(election)).get(election.getId()));
    }

    @Transactional
    public ElectionResponse update(UUID id, ElectionSetupRequest request, String accountEmail) {
        UUID churchId = getChurch(accountEmail).getId();
        Election election = elections.findByIdAndChurchIdForUpdate(id, churchId)
            .orElseThrow(ElectionNotFoundException::new);
        if (election.getStatus() != ElectionStatus.SETUP) {
            throw new ElectionNotEditableException();
        }
        Map<UUID, ElectionPosition> existingPositions = new HashMap<>();
        election.getPositions().forEach(position -> existingPositions.put(position.getId(), position));

        Set<UUID> requestedIds = new HashSet<>();
        for (PositionSetupRequest position : request.positions()) {
            UUID positionId = position.id();
            if (positionId != null && (!requestedIds.add(positionId) || !existingPositions.containsKey(positionId))) {
                throw new InvalidPositionIdException();
            }
        }
        List<UUID> removedPositionIds = existingPositions.keySet().stream()
                .filter(positionId -> !requestedIds.contains(positionId))
                .toList();
        if (!removedPositionIds.isEmpty() && nominationIntakes.existsByPositionIdIn(removedPositionIds)) {
            throw new ElectionPositionHasNominationsException();
        }

        int temporarySequence = Math.max(request.positions().size(), election.getPositions().stream()
                .mapToInt(ElectionPosition::getSequence).max().orElse(0)) + 1;
        for (ElectionPosition position : election.getPositions()) {
            position.setSequence(temporarySequence++);
        }
        elections.flush();

        List<ElectionPosition> replacementPositions = java.util.stream.IntStream.range(0, request.positions().size())
                .mapToObj(index -> {
                    PositionSetupRequest setup = request.positions().get(index);
                    ElectionPosition position = setup.id() == null ? null : existingPositions.get(setup.id());
                    if (position == null) {
                        position = new ElectionPosition(setup.name(), setup.openingCount(), index + 1);
                    } else {
                        position.update(setup.name(), setup.openingCount(), index + 1);
                    }
                    return position;
                })
                .toList();
        election.updateSetup(request.departmentName(), replacementPositions);
        election = elections.saveAndFlush(election);
        return ElectionResponse.from(election, deriveStatuses(churchId, List.of(election)).get(election.getId()));
    }

    @Transactional
    public void deletePosition(UUID electionId, UUID positionId, String accountEmail) {
        UUID churchId = getChurch(accountEmail).getId();
        Election election = elections.findByIdAndChurchIdForUpdate(electionId, churchId)
                .orElseThrow(ElectionNotFoundException::new);
        ElectionPosition position = election.getPositions().stream()
                .filter(candidate -> candidate.getId().equals(positionId))
                .findFirst()
                .orElseThrow(ElectionNotFoundException::new);
        election.removePosition(position);
    }

    private Election findForChurch(UUID id, String accountEmail) {
        UUID churchId = getChurch(accountEmail).getId();
        return elections.findByIdAndChurchId(id, churchId)
                .orElseThrow(ElectionNotFoundException::new);
    }

    private Church getChurch(String accountEmail) {
        return churches.findByAdminAccountEmail(accountEmail)
                .orElseThrow(ElectionNotFoundException::new);
    }

    private List<ElectionPosition> mapPositions(List<PositionSetupRequest> positions) {
        return java.util.stream.IntStream.range(0, positions.size())
                .mapToObj(index -> new ElectionPosition(positions.get(index).name(),
                        positions.get(index).openingCount(), index + 1))
                .toList();
    }

    private Map<UUID, ElectionStatus> deriveStatuses(UUID churchId, List<Election> churchElections) {
        if (churchElections.isEmpty()) {
            return Map.of();
        }
        List<UUID> electionIds = churchElections.stream().map(Election::getId).toList();
        String placeholders = String.join(", ", java.util.Collections.nCopies(electionIds.size(), "?"));
        List<Object> parameters = new ArrayList<>();
        parameters.add(churchId);
        parameters.addAll(electionIds);
        Map<UUID, List<PositionProgress>> progressByElection = new HashMap<>();
        jdbc.query("""
                select election.id as election_id, position.id as position_id, position.opening_count,
                    exists (
                        select 1 from nomination_intakes intake where intake.position_id = position.id
                    ) as has_intake,
                    exists (
                        select 1 from voting_rounds round
                        where round.position_id = position.id and round.status in ('ACTIVE', 'CLOSED')
                    ) as has_progressed_round,
                    exists (
                        select 1 from voting_rounds round
                        join voting_round_candidate_decisions decision on decision.round_id = round.id
                        where round.position_id = position.id
                    ) as has_decision,
                    (
                        select count(*) from voting_rounds round
                        join voting_round_candidate_decisions decision on decision.round_id = round.id
                        where round.position_id = position.id and decision.decision = 'ELECTED'
                    ) as elected_count
                from elections election
                join election_positions position on position.election_id = election.id
                where election.church_id = ? and election.id in (%s)
                """.formatted(placeholders), result -> {
            UUID electionId = result.getObject("election_id", UUID.class);
            progressByElection.computeIfAbsent(electionId, ignored -> new ArrayList<>())
                    .add(new PositionProgress(
                            result.getInt("opening_count"),
                            result.getBoolean("has_intake"),
                            result.getBoolean("has_progressed_round"),
                            result.getBoolean("has_decision"),
                            result.getLong("elected_count")));
        }, parameters.toArray());

        Map<UUID, ElectionStatus> statuses = new HashMap<>();
        for (Election election : churchElections) {
            List<PositionProgress> positionProgress = progressByElection.getOrDefault(election.getId(), List.of());
            ElectionStatus status;
            if (positionProgress.isEmpty()) {
                status = ElectionStatus.SETUP;
            } else if (positionProgress.stream().allMatch(position -> position.electedCount() >= position.openingCount())) {
                status = ElectionStatus.COMPLETE;
            } else if (positionProgress.stream().anyMatch(PositionProgress::hasProgress)) {
                status = ElectionStatus.IN_PROGRESS;
            } else {
                status = ElectionStatus.SETUP;
            }
            statuses.put(election.getId(), status);
        }
        return statuses;
    }

    private record PositionProgress(
            int openingCount, boolean hasIntake, boolean hasProgressedRound, boolean hasDecision, long electedCount) {
        private boolean hasProgress() {
            return hasIntake || hasProgressedRound || hasDecision;
        }
    }
}