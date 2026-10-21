package org.churchnominations.api.election;

import org.churchnominations.api.election.voting.InvalidVotingRoundRequestException;
import org.churchnominations.api.election.voting.VotingRoundConflictException;
import org.churchnominations.api.election.voting.VotingRoundNotFoundException;
import org.churchnominations.api.church.ChurchAlreadyExistsException;
import org.churchnominations.api.board.BoardAlreadyExistsException;
import org.churchnominations.api.board.BoardNotFoundException;
import org.churchnominations.api.board.InvalidBoardMemberIdException;
import org.churchnominations.api.identity.AccountAlreadyExistsException;
import org.churchnominations.api.identity.InvalidRegistrationException;
import org.churchnominations.api.nominations.InvalidNominationRequestException;
import org.churchnominations.api.nominations.NominationConflictException;
import org.churchnominations.api.nominations.NominationIntakeAlreadyExistsException;
import org.churchnominations.api.nominations.NominationIntakeClosedException;
import org.churchnominations.api.nominations.NominationIntakeNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(VotingRoundNotFoundException.class)
    ResponseEntity<Map<String, String>> votingRoundNotFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "not_found", "message", "Voting round not found"));
    }

    @ExceptionHandler(VotingRoundConflictException.class)
    ResponseEntity<Map<String, String>> votingRoundConflict() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "voting_round_state_conflict", "message", "Voting round cannot be configured in the current state"));
    }

    @ExceptionHandler(InvalidVotingRoundRequestException.class)
    ResponseEntity<Map<String, String>> invalidVotingRoundRequest() {
        return ResponseEntity.badRequest()
                .body(Map.of("error", "validation_failed", "message", "Request body is invalid"));
    }

    @ExceptionHandler(NominationIntakeNotFoundException.class)
    ResponseEntity<Map<String, String>> nominationIntakeNotFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "not_found", "message", "Nomination intake not found"));
    }

    @ExceptionHandler(NominationIntakeClosedException.class)
    ResponseEntity<Map<String, String>> nominationIntakeClosed() {
        return ResponseEntity.status(HttpStatus.GONE)
                .body(Map.of("error", "nomination_intake_closed", "message", "This nomination intake is closed"));
    }

    @ExceptionHandler(NominationIntakeAlreadyExistsException.class)
    ResponseEntity<Map<String, String>> nominationIntakeAlreadyExists() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "nomination_intake_already_exists", "message", "This position already has a nomination intake"));
    }

    @ExceptionHandler(NominationConflictException.class)
    ResponseEntity<Map<String, String>> nominationConflict() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "nomination_state_conflict", "message", "The nomination intake is not closed"));
    }

    @ExceptionHandler(InvalidNominationRequestException.class)
    ResponseEntity<Map<String, String>> invalidNominationRequest() {
        return ResponseEntity.badRequest()
                .body(Map.of("error", "validation_failed", "message", "Request body is invalid"));
    }

    @ExceptionHandler(BoardNotFoundException.class)
    ResponseEntity<Map<String, String>> boardNotFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "not_found", "message", "Board or session not found"));
    }

    @ExceptionHandler(BoardAlreadyExistsException.class)
    ResponseEntity<Map<String, String>> boardAlreadyExists() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "board_already_exists", "message", "A board already exists for this year"));
    }

    @ExceptionHandler(InvalidBoardMemberIdException.class)
    ResponseEntity<Map<String, String>> invalidBoardMemberId() {
        return ResponseEntity.badRequest()
                .body(Map.of("error", "validation_failed", "message", "Attendance includes a member outside this board"));
    }

    @ExceptionHandler(ElectionNotFoundException.class)
    ResponseEntity<Map<String, String>> notFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "not_found", "message", "Election not found"));
    }

    @ExceptionHandler(ElectionNotEditableException.class)
    ResponseEntity<Map<String, String>> notEditable() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "election_not_editable", "message", "Election setup can only be changed in SETUP status"));
    }

    @ExceptionHandler(ElectionPositionHasNominationsException.class)
    ResponseEntity<Map<String, String>> positionHasNominations() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "position_has_nominations", "message", "A position with a nomination intake cannot be removed"));
    }

    @ExceptionHandler(InvalidPositionIdException.class)
    ResponseEntity<Map<String, String>> invalidPositionId() {
        return ResponseEntity.badRequest()
                .body(Map.of("error", "validation_failed", "message", "Request body is invalid"));
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    ResponseEntity<Map<String, String>> invalidRequest() {
        return ResponseEntity.badRequest()
                .body(Map.of("error", "validation_failed", "message", "Request body is invalid"));
    }

    @ExceptionHandler(AccountAlreadyExistsException.class)
    ResponseEntity<Map<String, String>> accountAlreadyExists() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "account_already_exists", "message", "An account with this email already exists"));
    }

    @ExceptionHandler(ChurchAlreadyExistsException.class)
    ResponseEntity<Map<String, String>> churchAlreadyExists() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "church_already_exists", "message", "This account already administers a church"));
    }

    @ExceptionHandler(InvalidRegistrationException.class)
    ResponseEntity<Map<String, String>> invalidRegistration() {
        return ResponseEntity.badRequest()
                .body(Map.of("error", "validation_failed", "message", "Request body is invalid"));
    }
}