package org.churchnominations.api.nominations;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Supplier;

@Component
public class NominationIntakeEventRegistry {
    private final Map<UUID, Set<SseEmitter>> subscribers = new HashMap<>();

    public synchronized SseEmitter subscribe(UUID intakeId, Supplier<NominationIntakeResponse> snapshotSupplier) {
        SseEmitter emitter = new SseEmitter(0L);
        subscribers.computeIfAbsent(intakeId, ignored -> new HashSet<>()).add(emitter);
        emitter.onCompletion(() -> remove(intakeId, emitter));
        emitter.onTimeout(() -> remove(intakeId, emitter));
        emitter.onError(error -> remove(intakeId, emitter));

        try {
            NominationIntakeResponse snapshot = snapshotSupplier.get();
            send(emitter, snapshot);
            if (snapshot.status() == NominationIntakeStatus.CLOSED && !snapshot.revealed()) {
                remove(intakeId, emitter);
                emitter.complete();
            }
        } catch (IOException | RuntimeException exception) {
            remove(intakeId, emitter);
            emitter.completeWithError(exception);
        }
        return emitter;
    }

    public synchronized void publish(
            UUID intakeId, NominationIntakeResponse snapshot, boolean complete) {
        Set<SseEmitter> currentSubscribers = subscribers.get(intakeId);
        if (currentSubscribers == null) {
            return;
        }
        for (SseEmitter emitter : Set.copyOf(currentSubscribers)) {
            try {
                send(emitter, snapshot);
                if (complete) {
                    emitter.complete();
                    remove(intakeId, emitter);
                }
            } catch (IOException | RuntimeException exception) {
                remove(intakeId, emitter);
                emitter.completeWithError(exception);
            }
        }
    }

    private void send(SseEmitter emitter, NominationIntakeResponse snapshot) throws IOException {
        emitter.send(SseEmitter.event().name("intake").data(snapshot, MediaType.APPLICATION_JSON));
    }

    private synchronized void remove(UUID intakeId, SseEmitter emitter) {
        Set<SseEmitter> intakeSubscribers = subscribers.get(intakeId);
        if (intakeSubscribers != null) {
            intakeSubscribers.remove(emitter);
            if (intakeSubscribers.isEmpty()) {
                subscribers.remove(intakeId);
            }
        }
    }
}