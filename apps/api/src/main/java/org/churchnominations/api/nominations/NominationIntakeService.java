package org.churchnominations.api.nominations;

import org.churchnominations.api.election.voting.VotingRoundService;
import org.churchnominations.api.election.ElectionPosition;
import org.churchnominations.api.election.ElectionPositionDetails;
import org.churchnominations.api.election.ElectionService;
import org.churchnominations.api.identity.Account;
import org.churchnominations.api.identity.AccountRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class NominationIntakeService {
    private final NominationIntakeRepository intakes;
    private final NominationSubmissionRepository submissions;
    private final NominationConsolidatedNameRepository consolidatedNames;
    private final NominationSharedListAuditRepository sharedListAudit;
    private final ElectionPositionRepository positions;
    private final ElectionService elections;
    private final VotingRoundService votingRounds;
    private final NominationIntakeEventRegistry events;
    private final NominationPresentationSessionRepository presentationSessions;
    private final NominationPresentationControlEventRepository presentationControlEvents;
    private final AccountRepository accounts;
    private final Map<UUID, Set<SseEmitter>> presentationSubscribers = new ConcurrentHashMap<>();
    private final Map<UUID, Object> presentationLocks = new ConcurrentHashMap<>();

    public NominationIntakeService(
            NominationIntakeRepository intakes,
            NominationSubmissionRepository submissions,
            NominationConsolidatedNameRepository consolidatedNames,
            NominationSharedListAuditRepository sharedListAudit,
            ElectionPositionRepository positions,
            ElectionService elections,
            VotingRoundService votingRounds,
            NominationIntakeEventRegistry events,
            NominationPresentationSessionRepository presentationSessions,
            NominationPresentationControlEventRepository presentationControlEvents,
            AccountRepository accounts) {
        this.intakes = intakes;
        this.submissions = submissions;
        this.consolidatedNames = consolidatedNames;
        this.sharedListAudit = sharedListAudit;
        this.positions = positions;
        this.elections = elections;
        this.votingRounds = votingRounds;
        this.events = events;
        this.presentationSessions = presentationSessions;
        this.presentationControlEvents = presentationControlEvents;
        this.accounts = accounts;
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

    @Transactional
    public PresentationSessionResponse showPresentation(UUID electionId, UUID positionId, String accountEmail) {
        elections.getPositionForChurch(electionId, positionId, accountEmail);
        NominationIntake intake = findByPosition(positionId);
        NominationPresentationSession session = presentationSessions.findByIntakeId(intake.getId())
            .orElseGet(() -> new NominationPresentationSession(intake.getId()));
        session.show();
        session = presentationSessions.saveAndFlush(session);
        presentationControlEvents.save(new NominationPresentationControlEvent(
            intake.getId(), NominationPresentationControlEvent.Action.START));
        return new PresentationSessionResponse(session.getAccessToken(),
            "/api/nomination-presentations/" + session.getAccessToken(), true);
    }

    @Transactional
    public void hidePresentation(UUID electionId, UUID positionId, String accountEmail) {
        controlPresentation(electionId, positionId, accountEmail, false);
    }

    @Transactional
    public void endPresentation(UUID electionId, UUID positionId, String accountEmail) {
        elections.getPositionForChurch(electionId, positionId, accountEmail);
        NominationIntake intake = findByPosition(positionId);
        presentationSessions.findByIntakeId(intake.getId()).ifPresent(session -> {
            session.end();
            presentationSessions.saveAndFlush(session);
            presentationControlEvents.save(new NominationPresentationControlEvent(
                intake.getId(), NominationPresentationControlEvent.Action.END));
            clearPresentationSubscribersAfterCommit(intake.getId());
        });
    }

    private void controlPresentation(UUID electionId, UUID positionId, String accountEmail, boolean show) {
        elections.getPositionForChurch(electionId, positionId, accountEmail);
        NominationIntake intake = findByPosition(positionId);
        presentationSessions.findByIntakeId(intake.getId()).ifPresent(session -> {
            session.hide();
            presentationSessions.saveAndFlush(session);
            presentationControlEvents.save(new NominationPresentationControlEvent(
                intake.getId(), NominationPresentationControlEvent.Action.HIDE));
            clearPresentationSubscribersAfterCommit(intake.getId());
        });
    }

    public PresentationSnapshotResponse presentationSnapshot(UUID accessToken) {
        NominationPresentationSession session = presentationSessions.findByAccessTokenAndEndedAtIsNull(accessToken)
            .filter(NominationPresentationSession::isVisible)
            .orElseThrow(NominationIntakeNotFoundException::new);
        NominationIntake intake = intakes.findById(session.getIntakeId())
            .orElseThrow(NominationIntakeNotFoundException::new);
        return presentationProjection(intake);
    }

    public SseEmitter presentationStream(UUID accessToken, String lastEventId) {
        NominationPresentationSession initialSession = presentationSessions.findByAccessTokenAndEndedAtIsNull(accessToken)
            .filter(NominationPresentationSession::isVisible)
            .orElseThrow(NominationIntakeNotFoundException::new);
        UUID intakeId = initialSession.getIntakeId();
        SseEmitter emitter = new SseEmitter(0L);
        synchronized (presentationLocks.computeIfAbsent(intakeId, ignored -> new Object())) {
            NominationPresentationSession session = presentationSessions.findByAccessTokenAndEndedAtIsNull(accessToken)
                .filter(NominationPresentationSession::isVisible)
                .orElseThrow(NominationIntakeNotFoundException::new);
            NominationIntake intake = intakes.findById(session.getIntakeId())
                .orElseThrow(NominationIntakeNotFoundException::new);
            PresentationSnapshotResponse snapshot = presentationProjection(intake);
            Set<SseEmitter> subscribers = presentationSubscribers.computeIfAbsent(intakeId,
                ignored -> new CopyOnWriteArraySet<>());
            subscribers.add(emitter);
            emitter.onCompletion(() -> subscribers.remove(emitter));
            emitter.onTimeout(() -> subscribers.remove(emitter));
            emitter.onError(error -> subscribers.remove(emitter));
            try {
                NominationPresentationSession confirmed = presentationSessions
                    .findByAccessTokenAndEndedAtIsNull(accessToken)
                    .filter(NominationPresentationSession::isVisible)
                    .orElseThrow(NominationIntakeNotFoundException::new);
                if (!confirmed.getIntakeId().equals(intakeId)) {
                    throw new NominationIntakeNotFoundException();
                }
                emitter.send(SseEmitter.event().id(Long.toString(intake.getSharedListRevision()))
                    .name("snapshot").data(snapshot, MediaType.APPLICATION_JSON));
            } catch (IOException | NominationIntakeNotFoundException exception) {
                subscribers.remove(emitter);
                emitter.complete();
            }
        }
        return emitter;
    }

    private PresentationSnapshotResponse presentationProjection(NominationIntake intake) {
        if (!intake.isRevealed()) return PresentationSnapshotResponse.neutral();
        List<String> activeNames = consolidatedNames.findAllByIntakeIdAndActiveTrueOrderBySequenceAsc(intake.getId())
            .stream().map(NominationConsolidatedName::getCandidateName).toList();
        List<NominationChangeEventResponse> changeEvents = sharedListAudit
            .findAllByIntakeIdOrderByOccurredAtAscIdAsc(intake.getId()).stream()
            .map(NominationChangeEventResponse::from).toList();
        return new PresentationSnapshotResponse(true, activeNames, changeEvents);
    }

    private void publishPresentationAfterCommit(UUID intakeId) {
        Runnable publish = () -> {
            synchronized (presentationLocks.computeIfAbsent(intakeId, ignored -> new Object())) {
                presentationSessions.findByIntakeId(intakeId).filter(NominationPresentationSession::isVisible)
                    .filter(session -> session.getEndedAt() == null).ifPresent(session -> {
                        NominationIntake intake = intakes.findById(intakeId).orElseThrow();
                        PresentationSnapshotResponse snapshot = presentationProjection(intake);
                        long revision = intake.getSharedListRevision();
                        for (SseEmitter emitter : presentationSubscribers.getOrDefault(intakeId, Set.of())) {
                            try {
                                emitter.send(SseEmitter.event().id(Long.toString(revision)).name("snapshot")
                                    .data(snapshot, MediaType.APPLICATION_JSON));
                            } catch (IOException exception) {
                                emitter.completeWithError(exception);
                            }
                        }
                    });
            }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { publish.run(); }
            });
        } else publish.run();
    }

    private void clearPresentationSubscribers(UUID intakeId) {
        synchronized (presentationLocks.computeIfAbsent(intakeId, ignored -> new Object())) {
            Set<SseEmitter> subscribers = presentationSubscribers.remove(intakeId);
            if (subscribers != null) subscribers.forEach(emitter -> {
                try {
                    emitter.send(SseEmitter.event().name("clear").data(PresentationSnapshotResponse.neutral(),
                        MediaType.APPLICATION_JSON));
                } catch (IOException ignored) {
                    // The capability is revoked or hidden regardless of subscriber connectivity.
                }
                emitter.complete();
            });
        }
    }

    private void clearPresentationSubscribersAfterCommit(UUID intakeId) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { clearPresentationSubscribers(intakeId); }
            });
        } else {
            clearPresentationSubscribers(intakeId);
        }
    }

    public SseEmitter stream(UUID electionId, UUID positionId, String accountEmail) {
        elections.getPositionForChurch(electionId, positionId, accountEmail);
        NominationIntake intake = findByPosition(positionId);
        return events.subscribe(intake.getId(), () -> adminResponse(findByPosition(positionId)));
    }

    @Transactional
    public NominationIntakeResponse close(UUID electionId, UUID positionId, String accountEmail) {
        elections.getPositionForChurch(electionId, positionId, accountEmail);
        NominationIntake intake = intakes.findByPositionIdForUpdate(positionId)
            .orElseThrow(NominationIntakeNotFoundException::new);
        intake.close();
        List<NominationSubmission> currentSubmissions = submissions.findAllByIntakeId(intake.getId());
        long contributorCount = currentSubmissions.stream()
            .map(NominationSubmission::getDeviceToken)
            .filter(java.util.Objects::nonNull)
            .distinct()
            .count();
        List<String> orderedNames = currentSubmissions.stream()
            .sorted(Comparator.comparing(NominationSubmission::getName, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(NominationSubmission::getName)
                .thenComparing(NominationSubmission::getId))
            .map(NominationSubmission::getName)
            .toList();
        List<NominationConsolidatedName> snapshot = java.util.stream.IntStream.range(0, orderedNames.size())
            .mapToObj(index -> new NominationConsolidatedName(intake.getId(), index + 1, orderedNames.get(index)))
            .toList();
        consolidatedNames.deleteAllByIntakeId(intake.getId());
        consolidatedNames.flush();
        consolidatedNames.saveAllAndFlush(snapshot);
        currentSubmissions.forEach(NominationSubmission::clearDeviceToken);
        submissions.saveAllAndFlush(currentSubmissions);
        intake.createSharedList(accountEmail, contributorCount);
        NominationIntake saved = intakes.saveAndFlush(intake);
        NominationIntakeResponse response = adminResponse(saved);
        publishAfterCommit(intake.getId(), response, true);
        return response;
    }

        @Transactional
        public NominationIntakeResponse reveal(UUID electionId, UUID positionId, String accountEmail) {
        elections.getPositionForChurch(electionId, positionId, accountEmail);
        NominationIntake intake = intakes.findByPositionIdForUpdate(positionId)
            .orElseThrow(NominationIntakeNotFoundException::new);
        if (!intake.isListCreated() || intake.isRevealed()) {
            throw new NominationConflictException();
        }
        long contributorCount = intake.getRevealedContributorCount();
        intake.reveal(accountEmail, contributorCount);
        NominationIntake saved = intakes.saveAndFlush(intake);
        NominationIntakeResponse response = adminResponse(saved);
        publishAfterCommit(saved.getId(), response, false);
        publishPresentationAfterCommit(saved.getId());
        return response;
        }

    @Transactional
    public ConsolidatedNamesResponse consolidate(
            UUID electionId, UUID positionId, ConsolidateNominationsRequest request, String accountEmail) {
        elections.getPositionForChurch(electionId, positionId, accountEmail);
        NominationIntake intake = findByPosition(positionId);
        if (!intake.isListCreated()) throw new NominationConflictException();
        List<String> requested = validateAndClean(request.candidateNames());
        List<String> current = consolidatedNames.findAllByIntakeIdAndActiveTrueOrderBySequenceAsc(intake.getId())
            .stream().map(NominationConsolidatedName::getCandidateName).toList();
        if (!requested.equals(current)) throw new NominationConflictException();
        return new ConsolidatedNamesResponse(current);
    }

    @Transactional
    public NominationIntakeResponse updateSharedList(
            UUID electionId, UUID positionId, UpdateSharedNominationListRequest request, String accountEmail) {
        elections.lockPositionForChurch(electionId, positionId, accountEmail);
        votingRounds.assertNoActiveRound(positionId);
        NominationIntake intake = intakes.findByPositionIdForUpdate(positionId)
                .orElseThrow(NominationIntakeNotFoundException::new);
        if (!intake.isListCreated()) {
            throw new NominationConflictException();
        }
        if (request.expectedRevision() != intake.getSharedListRevision()) {
            throw new NominationConflictException();
        }
        List<UpdateSharedNominationListRequest.Entry> entries = request.entries();
        List<UpdateSharedNominationListRequest.Removal> removals = request.removals() == null
            ? List.of() : request.removals();
        if (entries.stream().anyMatch(entry -> entry.name().isBlank() || !entry.active())
                || removals.stream().anyMatch(removal -> removal.reason() == NominationRemovalReason.OTHER
                    ? removal.detail() == null || removal.detail().isBlank()
                    : removal.detail() != null && !removal.detail().isBlank())) {
            throw new InvalidNominationRequestException();
        }

        List<NominationConsolidatedName> existing = consolidatedNames
            .findAllByIntakeIdAndActiveTrueOrderBySequenceAsc(intake.getId());
        java.util.Map<UUID, NominationConsolidatedName> existingById = existing.stream()
                .collect(java.util.stream.Collectors.toMap(NominationConsolidatedName::getId, row -> row));
        List<UUID> submittedIds = entries.stream().map(UpdateSharedNominationListRequest.Entry::id)
            .filter(java.util.Objects::nonNull).toList();
        if (entries.stream().anyMatch(entry -> entry.id() == null)
                || submittedIds.stream().distinct().count() != submittedIds.size()
                || !existingById.keySet().containsAll(submittedIds)) {
            throw new NominationConflictException();
        }
        if (entries.stream().anyMatch(entry -> existingById.get(entry.id()).getSequence() != entry.sequence())) {
            throw new NominationConflictException();
        }
        java.util.Map<UUID, UpdateSharedNominationListRequest.Removal> removalById = removals.stream()
            .collect(java.util.stream.Collectors.toMap(UpdateSharedNominationListRequest.Removal::id, removal -> removal,
                (first, duplicate) -> { throw new NominationConflictException(); }));
        List<UUID> removedIds = existing.stream().map(NominationConsolidatedName::getId)
            .filter(id -> !submittedIds.contains(id)).toList();
        if (removalById.size() != removedIds.size() || !removalById.keySet().containsAll(removedIds)) {
            throw new NominationConflictException();
        }
        for (NominationConsolidatedName row : existing) {
            if (!submittedIds.contains(row.getId())) {
                UpdateSharedNominationListRequest.Removal removal = removalById.get(row.getId());
                sharedListAudit.save(new NominationSharedListAuditEvent(intake.getId(), row.getId(),
                        row.getCandidateName(), row.getSequence(), NominationSharedListAuditEvent.Action.REMOVED,
                    row.getCandidateName(), null, removal.reason(), cleanDetail(removal.detail()),
                    actorLabel(accountEmail)));
                row.update(row.getCandidateName(), row.getSequence(), false);
            }
        }
        for (UpdateSharedNominationListRequest.Entry entry : entries) {
            NominationConsolidatedName row = existingById.get(entry.id());
            if (!row.getCandidateName().equals(entry.name().trim())) {
                sharedListAudit.save(new NominationSharedListAuditEvent(intake.getId(), row.getId(),
                    entry.name().trim(), row.getSequence(), NominationSharedListAuditEvent.Action.CORRECTED,
                    row.getCandidateName(), entry.name().trim(), null, null, actorLabel(accountEmail)));
                row.update(entry.name().trim(), row.getSequence(), row.isActive());
            }
        }
        intake.advanceSharedListRevision();
        intakes.saveAndFlush(intake);
        consolidatedNames.flush();
        NominationIntakeResponse response = adminResponse(intake);
        publishAfterCommit(intake.getId(), response, false);
        publishPresentationAfterCommit(intake.getId());
        return response;
    }

        @Transactional
        public NominationIntakeResponse restoreSharedListEntry(
            UUID electionId, UUID positionId, RestoreNominationEntryRequest request, String accountEmail) {
        elections.lockPositionForChurch(electionId, positionId, accountEmail);
        votingRounds.assertNoActiveRound(positionId);
        NominationIntake intake = intakes.findByPositionIdForUpdate(positionId)
            .orElseThrow(NominationIntakeNotFoundException::new);
        if (!intake.isListCreated()) {
            throw new NominationConflictException();
        }
        if (request.expectedRevision() != intake.getSharedListRevision()) {
            throw new NominationConflictException();
        }
        NominationSharedListAuditEvent removed = sharedListAudit.findById(request.auditEventId())
            .filter(event -> event.getIntakeId().equals(intake.getId())
                && event.getAction() == NominationSharedListAuditEvent.Action.REMOVED)
            .orElseThrow(NominationConflictException::new);
        NominationSharedListAuditEvent latest = sharedListAudit.findFirstByIntakeIdAndEntryIdOrderByOccurredAtDesc(
            intake.getId(), removed.getEntryId()).orElseThrow(NominationConflictException::new);
        if (latest.getAction() != NominationSharedListAuditEvent.Action.REMOVED) {
            throw new NominationConflictException();
        }

        NominationConsolidatedName restored = consolidatedNames.findById(removed.getEntryId())
            .filter(row -> !row.isActive()).orElseThrow(NominationConflictException::new);
        int sequence = removed.getEntrySequence();
        restored.update(removed.getEntryName(), sequence, true);
        consolidatedNames.saveAndFlush(restored);
        sharedListAudit.saveAndFlush(new NominationSharedListAuditEvent(intake.getId(), removed.getEntryId(),
            removed.getEntryName(), sequence, NominationSharedListAuditEvent.Action.RESTORED,
            null, removed.getEntryName(), null, null, actorLabel(accountEmail)));
        intake.advanceSharedListRevision();
        intakes.saveAndFlush(intake);
        NominationIntakeResponse response = adminResponse(intake);
        publishAfterCommit(intake.getId(), response, false);
        publishPresentationAfterCommit(intake.getId());
        return response;
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
        long currentContributorCount = intake.isListCreated()
            ? intake.getRevealedContributorCount()
            : submissions.findAllByIntakeId(intake.getId()).stream()
                .map(NominationSubmission::getDeviceToken)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .count();
        List<NominationSubmissionResponse> submitted = intake.isListCreated()
            ? submissions.findAllByIntakeId(intake.getId()).stream()
                .sorted(Comparator.comparing(NominationSubmission::getName, String.CASE_INSENSITIVE_ORDER)
                    .thenComparing(NominationSubmission::getName)
                    .thenComparing(NominationSubmission::getId))
                .map(NominationSubmissionResponse::from)
                .toList()
            : List.of();
        List<NominationConsolidatedName> sharedRows = intake.isListCreated()
            ? consolidatedNames.findAllByIntakeIdOrderBySequenceAsc(intake.getId()) : List.of();
        List<String> consolidated = sharedRows.stream()
            .filter(NominationConsolidatedName::isActive)
            .map(NominationConsolidatedName::getCandidateName)
            .toList();
        return new NominationIntakeResponse(intake.getId(), intake.getAccessToken(), intake.getNameLimit(),
            currentContributorCount, intake.getStatus(), intake.isListCreated(), intake.isRevealed(), intake.getSharedListRevision(), submitted,
                intake.isListCreated() ? consolidated : null,
            sharedRows.stream().filter(NominationConsolidatedName::isActive)
                .map(SharedNominationEntryResponse::from).toList(),
            sharedListAudit.findAllByIntakeIdAndActionOrderByOccurredAtDesc(
                    intake.getId(), NominationSharedListAuditEvent.Action.REMOVED).stream()
                .filter(event -> sharedListAudit.findFirstByIntakeIdAndEntryIdOrderByOccurredAtDesc(
                    intake.getId(), event.getEntryId())
                    .map(latest -> latest.getAction() == NominationSharedListAuditEvent.Action.REMOVED
                        && latest.getId().equals(event.getId()))
                    .orElse(false))
                .map(event -> new RemovedNominationEntryResponse(event.getId(), event.getEntryId(),
                    event.getEntryName(), event.getEntrySequence(), event.getOccurredAt(), event.getActor()))
                .toList(), sharedListAudit.findAllByIntakeIdOrderByOccurredAtAscIdAsc(intake.getId()).stream()
                    .map(NominationChangeEventResponse::from).toList());
    }

    private NominationIntakeResponse presentationResponse(NominationIntake intake) {
        NominationIntakeResponse admin = adminResponse(intake);
        if (intake.isRevealed()) return admin;
        return new NominationIntakeResponse(admin.id(), admin.accessToken(), admin.nameLimit(),
                admin.currentContributorCount(), admin.status(), admin.listCreated(), false,
            admin.sharedListRevision(), List.of(), null, List.of(), List.of(), List.of());
    }

    private String cleanDetail(String detail) {
        return detail == null || detail.isBlank() ? null : detail.trim();
    }

    private String actorLabel(String accountEmail) {
        Account account = accounts.findByEmail(accountEmail)
            .orElseThrow(NominationIntakeNotFoundException::new);
        return "Administrator " + account.getId().toString().substring(0, 8).toUpperCase(Locale.ROOT);
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