package org.churchnominations.api.nominations;

import org.churchnominations.api.election.voting.VotingRoundService;
import org.churchnominations.api.election.ElectionPosition;
import org.churchnominations.api.election.ElectionPositionDetails;
import org.churchnominations.api.election.ElectionService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class NominationIntakeService {
    private final NominationIntakeRepository intakes;
    private final NominationSubmissionRepository submissions;
    private final NominationConsolidatedNameRepository consolidatedNames;
    private final ElectionPositionRepository positions;
    private final ElectionService elections;
    private final VotingRoundService votingRounds;
    private final NominationIntakeEventRegistry events;

    public NominationIntakeService(
            NominationIntakeRepository intakes,
            NominationSubmissionRepository submissions,
            NominationConsolidatedNameRepository consolidatedNames,
            ElectionPositionRepository positions,
            ElectionService elections,
            VotingRoundService votingRounds,
            NominationIntakeEventRegistry events) {
        this.intakes = intakes;
        this.submissions = submissions;
        this.consolidatedNames = consolidatedNames;
        this.positions = positions;
        this.elections = elections;
        this.votingRounds = votingRounds;
        this.events = events;
    }

    @Transactional
    public NominationIntakeResponse create(
            UUID electionId, UUID positionId, CreateNominationIntakeRequest request, String accountEmail) {
        elections.lockPositionForChurch(electionId, positionId, accountEmail);
        if (intakes.findByPositionId(positionId).isPresent()) {
            throw new NominationIntakeAlreadyExistsException();
        }
        try {
            NominationIntake intake = intakes.saveAndFlush(new NominationIntake(positionId, request.nameLimit()));
            return adminResponse(intake);
        } catch (DataIntegrityViolationException exception) {
            throw new NominationIntakeAlreadyExistsException();
        }
    }

    public NominationIntakeResponse get(UUID electionId, UUID positionId, String accountEmail) {
        elections.getPositionForChurch(electionId, positionId, accountEmail);
        return adminResponse(findByPosition(positionId));
    }

    public SseEmitter stream(UUID electionId, UUID positionId, String accountEmail) {
        elections.getPositionForChurch(electionId, positionId, accountEmail);
        NominationIntake intake = findByPosition(positionId);
        return events.subscribe(intake.getId(), () -> adminResponse(intake));
    }

    @Transactional
    public NominationIntakeResponse close(UUID electionId, UUID positionId, String accountEmail) {
        elections.getPositionForChurch(electionId, positionId, accountEmail);
        NominationIntake intake = intakes.findByPositionIdForUpdate(positionId)
            .orElseThrow(NominationIntakeNotFoundException::new);
        intake.close();
        NominationIntakeResponse response = adminResponse(intakes.save(intake));
        publishAfterCommit(intake.getId(), response, true);
        return response;
    }

    @Transactional
    public ConsolidatedNamesResponse consolidate(
            UUID electionId, UUID positionId, ConsolidateNominationsRequest request, String accountEmail) {
        elections.lockPositionForChurch(electionId, positionId, accountEmail);
        votingRounds.assertConsolidationEditable(positionId);
        NominationIntake intake = findByPosition(positionId);
        if (intake.getStatus() != NominationIntakeStatus.CLOSED) {
            throw new NominationConflictException();
        }
        List<String> cleanNames = validateAndClean(request.candidateNames());
        consolidatedNames.deleteAllByIntakeId(intake.getId());
        consolidatedNames.flush();
        List<NominationConsolidatedName> snapshot = java.util.stream.IntStream.range(0, cleanNames.size())
                .mapToObj(index -> new NominationConsolidatedName(intake.getId(), index + 1, cleanNames.get(index)))
                .toList();
        consolidatedNames.saveAllAndFlush(snapshot);
        return new ConsolidatedNamesResponse(cleanNames);
    }

    public PublicNominationIntakeResponse getPublic(UUID accessToken, UUID deviceToken) {
        NominationIntake intake = findByAccessToken(accessToken);
        requireOpen(intake);
        ElectionPosition position = positions.findWithElectionById(intake.getPositionId())
                .orElseThrow(NominationIntakeNotFoundException::new);
        List<String> names = submissions.findAllByIntakeIdAndDeviceTokenOrderBySequenceAsc(
                intake.getId(), deviceToken).stream()
                .map(NominationSubmission::getName)
                .toList();
        return new PublicNominationIntakeResponse(
                position.getElection().getDepartmentName(), position.getName(), intake.getNameLimit(), names);
    }

    @Transactional
    public SubmittedNamesResponse replaceSubmission(
            UUID accessToken, UUID deviceToken, ReplaceNominationSubmissionRequest request) {
        NominationIntake intake = intakes.findByAccessTokenForUpdate(accessToken)
            .orElseThrow(NominationIntakeNotFoundException::new);
        requireOpen(intake);
        List<String> cleanNames = validateAndClean(request.names());
        if (cleanNames.size() > intake.getNameLimit()) {
            throw new InvalidNominationRequestException();
        }
        submissions.deleteAllByIntakeIdAndDeviceToken(intake.getId(), deviceToken);
        submissions.flush();
        List<NominationSubmission> replacement = java.util.stream.IntStream.range(0, cleanNames.size())
                .mapToObj(index -> {
                    String name = cleanNames.get(index);
                    return new NominationSubmission(intake.getId(), deviceToken, name,
                            normalize(name), index + 1);
                })
                .toList();
        submissions.saveAllAndFlush(replacement);
        publishAfterCommit(intake.getId(), adminResponse(intake), false);
        return new SubmittedNamesResponse(cleanNames);
    }

    private void publishAfterCommit(UUID intakeId, NominationIntakeResponse snapshot, boolean complete) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            events.publish(intakeId, snapshot, complete);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                events.publish(intakeId, snapshot, complete);
            }
        });
    }

    private NominationIntakeResponse adminResponse(NominationIntake intake) {
        List<NominationSubmissionResponse> submitted = submissions
                .findAllByIntakeIdOrderByNameAscIdAsc(intake.getId()).stream()
                .map(NominationSubmissionResponse::from)
                .toList();
        List<String> consolidated = consolidatedNames.findAllByIntakeIdOrderBySequenceAsc(intake.getId()).stream()
                .map(NominationConsolidatedName::getCandidateName)
                .toList();
        return new NominationIntakeResponse(intake.getId(), intake.getAccessToken(), intake.getNameLimit(),
                intake.getStatus(), submitted, consolidated.isEmpty() ? null : consolidated);
    }

    private NominationIntake findByPosition(UUID positionId) {
        return intakes.findByPositionId(positionId).orElseThrow(NominationIntakeNotFoundException::new);
    }

    private NominationIntake findByAccessToken(UUID accessToken) {
        return intakes.findByAccessToken(accessToken).orElseThrow(NominationIntakeNotFoundException::new);
    }

    private void requireOpen(NominationIntake intake) {
        if (intake.getStatus() != NominationIntakeStatus.OPEN) {
            throw new NominationIntakeClosedException();
        }
    }

    private List<String> validateAndClean(List<String> names) {
        List<String> cleanNames = names.stream().map(String::trim).toList();
        if (cleanNames.stream().anyMatch(String::isBlank)
                || cleanNames.stream().map(this::normalize).distinct().count() != cleanNames.size()) {
            throw new InvalidNominationRequestException();
        }
        return cleanNames;
    }

    private String normalize(String name) {
        return name.toLowerCase(Locale.ROOT);
    }
}