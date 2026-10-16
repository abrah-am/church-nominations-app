package org.churchnominations.api.election;

import org.churchnominations.api.church.Church;
import org.churchnominations.api.church.ChurchRepository;
import org.churchnominations.api.nominations.NominationIntakeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public ElectionService(
            ElectionRepository elections,
            ChurchRepository churches,
            NominationIntakeRepository nominationIntakes) {
        this.elections = elections;
        this.churches = churches;
        this.nominationIntakes = nominationIntakes;
    }

    public List<ElectionResponse> list(String accountEmail) {
        UUID churchId = getChurch(accountEmail).getId();
        return elections.findAllByChurchIdOrderByDepartmentNameAscIdAsc(churchId).stream()
                .map(ElectionResponse::from)
                .toList();
    }

    public ElectionResponse get(UUID id, String accountEmail) {
        return ElectionResponse.from(findForChurch(id, accountEmail));
    }

    public ElectionPositionDetails getPositionForChurch(UUID electionId, UUID positionId, String accountEmail) {
        Election election = findForChurch(electionId, accountEmail);
        return positionDetails(election, positionId);
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
                .map(position -> new ElectionPositionDetails(election.getDepartmentName(), position.getName()))
                .orElseThrow(ElectionNotFoundException::new);
    }

    @Transactional
    public ElectionResponse create(ElectionSetupRequest request, String accountEmail) {
        UUID churchId = getChurch(accountEmail).getId();
        Election election = new Election(churchId, request.departmentName());
        election.replaceSetup(request.departmentName(), mapPositions(request.positions()));
        return ElectionResponse.from(elections.save(election));
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
        return ElectionResponse.from(elections.save(election));
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
}