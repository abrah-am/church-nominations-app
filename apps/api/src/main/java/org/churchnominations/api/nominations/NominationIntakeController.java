package org.churchnominations.api.nominations;

import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.net.URI;
import java.security.Principal;
import java.util.UUID;

@RestController
public class NominationIntakeController {
    private final NominationIntakeService intakes;

    public NominationIntakeController(NominationIntakeService intakes) {
        this.intakes = intakes;
    }

    @PostMapping("/api/elections/{electionId}/positions/{positionId}/nominations")
    public ResponseEntity<NominationIntakeResponse> create(
            @PathVariable UUID electionId,
            @PathVariable UUID positionId,
            @Valid @RequestBody CreateNominationIntakeRequest request,
            Principal principal) {
        NominationIntakeResponse response = intakes.create(electionId, positionId, request, principal.getName());
        return ResponseEntity.created(URI.create("/api/elections/" + electionId + "/positions/" + positionId
                + "/nominations")).body(response);
    }

    @GetMapping("/api/elections/{electionId}/positions/{positionId}/nominations")
    public NominationIntakeResponse get(
            @PathVariable UUID electionId, @PathVariable UUID positionId, Principal principal) {
        return intakes.get(electionId, positionId, principal.getName());
    }

    @GetMapping(value = "/api/elections/{electionId}/positions/{positionId}/nominations/stream",
            produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            @PathVariable UUID electionId, @PathVariable UUID positionId, Principal principal) {
        return intakes.stream(electionId, positionId, principal.getName());
    }

    @PostMapping("/api/elections/{electionId}/positions/{positionId}/nominations/close")
    public NominationIntakeResponse close(
            @PathVariable UUID electionId, @PathVariable UUID positionId, Principal principal) {
        return intakes.close(electionId, positionId, principal.getName());
    }

    @PostMapping("/api/elections/{electionId}/positions/{positionId}/nominations/reveal")
    public NominationIntakeResponse reveal(
            @PathVariable UUID electionId, @PathVariable UUID positionId, Principal principal) {
        return intakes.reveal(electionId, positionId, principal.getName());
    }

    @PutMapping("/api/elections/{electionId}/positions/{positionId}/nominations/consolidation")
    public ConsolidatedNamesResponse consolidate(
            @PathVariable UUID electionId,
            @PathVariable UUID positionId,
            @Valid @RequestBody ConsolidateNominationsRequest request,
            Principal principal) {
        return intakes.consolidate(electionId, positionId, request, principal.getName());
    }

    @PutMapping("/api/elections/{electionId}/positions/{positionId}/nominations/shared-list")
    public NominationIntakeResponse updateSharedList(
            @PathVariable UUID electionId,
            @PathVariable UUID positionId,
            @Valid @RequestBody UpdateSharedNominationListRequest request,
            Principal principal) {
        return intakes.updateSharedList(electionId, positionId, request, principal.getName());
    }

    @PostMapping("/api/elections/{electionId}/positions/{positionId}/nominations/shared-list/restore")
    public NominationIntakeResponse restoreSharedListEntry(
            @PathVariable UUID electionId,
            @PathVariable UUID positionId,
            @Valid @RequestBody RestoreNominationEntryRequest request,
            Principal principal) {
        return intakes.restoreSharedListEntry(electionId, positionId, request, principal.getName());
    }

    @GetMapping("/api/nomination-intakes/{accessToken}")
    public PublicNominationIntakeResponse getPublic(
            @PathVariable UUID accessToken,
            @RequestHeader("X-Nomination-Device-Token") UUID deviceToken) {
        return intakes.getPublic(accessToken, deviceToken);
    }

    @PutMapping("/api/nomination-intakes/{accessToken}/submission")
    public SubmittedNamesResponse replaceSubmission(
            @PathVariable UUID accessToken,
            @RequestHeader("X-Nomination-Device-Token") UUID deviceToken,
            @Valid @RequestBody ReplaceNominationSubmissionRequest request) {
        return intakes.replaceSubmission(accessToken, deviceToken, request);
    }
}