package org.churchnominations.api.election;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.churchnominations.api.church.ChurchRepository;
import org.churchnominations.api.identity.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.profiles.active=dev"
})
@AutoConfigureMockMvc
class ElectionControllerTest {
        private static final String USERNAME = "election-admin@example.org";
        private static final String PASSWORD = "test-password-123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ElectionRepository elections;

        @Autowired
        private ElectionService electionService;

        @Autowired
        private ChurchRepository churches;

        @Autowired
        private AccountRepository accounts;

        @Autowired
        private JdbcTemplate jdbc;

    @BeforeEach
        void resetAndRegisterAdmin() throws Exception {
        elections.deleteAll();
                churches.deleteAll();
                accounts.deleteAll();
                mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                                                .content("{\"email\":\"" + USERNAME + "\",\"password\":\"" + PASSWORD + "\"}"))
                                .andExpect(status().isCreated());
                mockMvc.perform(post("/api/churches").with(admin()).contentType(MediaType.APPLICATION_JSON)
                                                .content("{\"name\":\"Test Church\"}"))
                                .andExpect(status().isCreated());
    }

    @Test
    void createsListsLoadsAndReplacesElectionSetup() throws Exception {
        String request = """
                {"departmentName":"Worship","positions":[
                  {"name":"Director","openingCount":1},
                  {"name":"Assistant Director","openingCount":2}
                ]}
                """;

        mockMvc.perform(post("/api/elections").with(admin()).contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.departmentName").value("Worship"))
                .andExpect(jsonPath("$.status").value("SETUP"))
                .andExpect(jsonPath("$.positions", hasSize(2)))
                .andExpect(jsonPath("$.positions[0].name").value("Director"))
                .andExpect(jsonPath("$.positions[0].sequence").value(1))
                .andExpect(jsonPath("$.positions[1].openingCount").value(2))
                .andExpect(jsonPath("$.positions[1].sequence").value(2));

        String id = elections.findAll().getFirst().getId().toString();
        mockMvc.perform(get("/api/elections").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
        mockMvc.perform(get("/api/elections/{id}", id).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.departmentName").value("Worship"));

        mockMvc.perform(put("/api/elections/{id}", id).with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"departmentName\":\"Music\",\"positions\":[{\"name\":\"Chair\",\"openingCount\":3}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.departmentName").value("Music"))
                .andExpect(jsonPath("$.positions", hasSize(1)))
                .andExpect(jsonPath("$.positions[0].name").value("Chair"))
                .andExpect(jsonPath("$.positions[0].sequence").value(1));
    }

    @Test
    void updatesPositionsInPlaceAndCreatesPositionsWithoutIds() throws Exception {
        String electionId = createElection("Worship", """
                {"departmentName":"Worship","positions":[
                  {"name":"Director","openingCount":1},
                  {"name":"Assistant Director","openingCount":2}
                ]}
                """);
        ElectionResponse initialElection = electionService.get(UUID.fromString(electionId), USERNAME);
        UUID retainedId = initialElection.positions().getFirst().id();
        UUID reorderedId = initialElection.positions().get(1).id();

        mockMvc.perform(put("/api/elections/{id}", electionId).with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"departmentName":"Music","positions":[
                                  {"id":"%s","name":"Assistant","openingCount":4},
                                  {"id":"%s","name":"Director Renamed","openingCount":3},
                                  {"name":"New Position","openingCount":1}
                                ]}
                                """.formatted(reorderedId, retainedId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.positions", hasSize(3)))
                .andExpect(jsonPath("$.positions[0].id").value(reorderedId.toString()))
                .andExpect(jsonPath("$.positions[0].name").value("Assistant"))
                .andExpect(jsonPath("$.positions[0].sequence").value(1))
                .andExpect(jsonPath("$.positions[1].id").value(retainedId.toString()))
                .andExpect(jsonPath("$.positions[1].name").value("Director Renamed"))
                .andExpect(jsonPath("$.positions[1].sequence").value(2))
                .andExpect(jsonPath("$.positions[2].id").isNotEmpty())
                .andExpect(jsonPath("$.positions[2].sequence").value(3));

        mockMvc.perform(put("/api/elections/{id}", electionId).with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"departmentName":"Music","positions":[
                                  {"id":"%s","name":"Assistant Retained","openingCount":2}
                                ]}
                                """.formatted(reorderedId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.positions", hasSize(1)))
                .andExpect(jsonPath("$.positions[0].id").value(reorderedId.toString()));
    }

    @Test
    void rejectsUnknownForeignAndDuplicatePositionIds() throws Exception {
        String electionId = createElection("Worship", """
                {"departmentName":"Worship","positions":[{"name":"Director","openingCount":1}]}
                """);
        String otherElectionId = createElection("Youth", """
                {"departmentName":"Youth","positions":[{"name":"Leader","openingCount":1}]}
                """);
        UUID otherPositionId = electionService.get(UUID.fromString(otherElectionId), USERNAME)
                .positions().getFirst().id();
        UUID targetPositionId = electionService.get(UUID.fromString(electionId), USERNAME)
                .positions().getFirst().id();
        UUID unknownId = UUID.randomUUID();
        String[] invalidRequests = {
                "[{'id':'%s','name':'Unknown','openingCount':1}]".formatted(unknownId),
                "[{'id':'%s','name':'Foreign','openingCount':1}]".formatted(otherPositionId),
                "[{'id':'%s','name':'First','openingCount':1},{'id':'%s','name':'Second','openingCount':1}]"
                        .formatted(targetPositionId, targetPositionId)
        };
        for (String positions : invalidRequests) {
            String request = "{\"departmentName\":\"Changed\",\"positions\":"
                    + positions.replace('\'', '\"') + "}";
            mockMvc.perform(put("/api/elections/{id}", electionId).with(admin())
                            .contentType(MediaType.APPLICATION_JSON).content(request))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("validation_failed"));
        }
    }

    @Test
    void rejectsInvalidSetup() throws Exception {
        String[] invalidRequests = {
                "{\"departmentName\":\" \",\"positions\":[{\"name\":\"Chair\",\"openingCount\":1}]}",
                "{\"departmentName\":\"Worship\",\"positions\":[]}",
                "{\"departmentName\":\"Worship\",\"positions\":[{\"name\":\" \",\"openingCount\":1}]}",
                "{\"departmentName\":\"Worship\",\"positions\":[{\"name\":\"Chair\",\"openingCount\":0}]}"
        };
        for (String request : invalidRequests) {
            mockMvc.perform(post("/api/elections").with(admin()).contentType(MediaType.APPLICATION_JSON).content(request))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("validation_failed"));
        }
    }

    @Test
    void derivesStatusFromCurrentPositionWorkflowAndOpeningCounts() throws Exception {
        String electionId = createElection("Status Election", """
                {"departmentName":"Status Election","positions":[
                  {"name":"Chair","openingCount":1},
                  {"name":"Members","openingCount":2}
                ]}
                """);
        ElectionResponse election = electionService.get(UUID.fromString(electionId), USERNAME);
        UUID chairId = election.positions().get(0).id();
        UUID membersId = election.positions().get(1).id();

        mockMvc.perform(get("/api/elections/{id}", electionId).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SETUP"));

        insertDraftRound(chairId);
        mockMvc.perform(get("/api/elections/{id}", electionId).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SETUP"));
        jdbc.update("delete from voting_rounds where position_id = ?", chairId);

        insertActiveRound(chairId);
        mockMvc.perform(get("/api/elections/{id}", electionId).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
        jdbc.update("delete from voting_rounds where position_id = ?", chairId);

        insertIntake(chairId);
        mockMvc.perform(get("/api/elections/{id}", electionId).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
        jdbc.update("update nomination_intakes set status = 'CLOSED' where position_id = ?", chairId);
        mockMvc.perform(get("/api/elections/{id}", electionId).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        insertClosedRoundWithDecisions(chairId, List.of("ELECTED"));
        insertClosedRoundWithDecisions(membersId, List.of("ELECTED", "ADVANCED", "ELIMINATED"));
        mockMvc.perform(get("/api/elections/{id}", electionId).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        insertDecision(membersId, 1, 2, "ELECTED");
        mockMvc.perform(get("/api/elections").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("COMPLETE"));

        mockMvc.perform(put("/api/elections/{id}", electionId).with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"departmentName":"Status Election","positions":[
                                  {"id":"%s","name":"Chair","openingCount":1},
                                  {"id":"%s","name":"Members","openingCount":3}
                                ]}
                                """.formatted(chairId, membersId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        mockMvc.perform(delete("/api/elections/{electionId}/positions/{positionId}", electionId, membersId)
                        .with(admin()))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/elections/{id}", electionId).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETE"));

        mockMvc.perform(delete("/api/elections/{electionId}/positions/{positionId}", electionId, chairId)
                        .with(admin()))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/elections/{id}", electionId).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.positions", hasSize(0)))
                .andExpect(jsonPath("$.status").value("SETUP"));
    }

    @Test
    void anyCurrentCandidateDecisionSignalsProgressOnDraftRound() throws Exception {
        String electionId = createElection("Decision Status Election", """
                {"departmentName":"Decision Status Election","positions":[
                  {"name":"Chair","openingCount":2}
                ]}
                """);
        UUID positionId = electionService.get(UUID.fromString(electionId), USERNAME).positions().getFirst().id();

        for (String decision : List.of("ADVANCED", "ELIMINATED", "ELECTED")) {
                jdbc.update("delete from voting_rounds where position_id = ?", positionId);
                insertDraftRoundWithDecision(positionId, decision);
                mockMvc.perform(get("/api/elections/{id}", electionId).with(admin()))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
        }
    }

    @Test
    void closedRoundWithoutIntakeOrCandidateDecisionsSignalsProgress() throws Exception {
        String electionName = "Closed Round Status " + UUID.randomUUID();
        String electionId = createElection(electionName, """
                {"departmentName":"%s","positions":[{"name":"Chair","openingCount":1}]}
                """.formatted(electionName));
        UUID positionId = electionService.get(UUID.fromString(electionId), USERNAME).positions().getFirst().id();

        insertClosedRoundWithoutCandidates(positionId);
        try {
            assertEquals(0, jdbc.queryForObject(
                    "select count(*) from nomination_intakes where position_id = ?", Integer.class, positionId));
            assertEquals(0, jdbc.queryForObject("""
                    select count(*) from voting_round_candidate_decisions decision
                    join voting_rounds round on round.id = decision.round_id
                    where round.position_id = ?
                    """, Integer.class, positionId));
            mockMvc.perform(get("/api/elections/{id}", electionId).with(admin()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
        } finally {
            jdbc.update("delete from voting_rounds where position_id = ?", positionId);
        }
        }

    @Test
    void requiresAdminAuthentication() throws Exception {
        mockMvc.perform(get("/api/elections")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/elections").with(httpBasic(USERNAME, "wrong")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void hidesUnknownAndOtherChurchElections() throws Exception {
        String otherAdmin = "other-admin@example.org";
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + otherAdmin + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/churches").with(httpBasic(otherAdmin, PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Other Church\"}"))
                .andExpect(status().isCreated());
        UUID otherChurchId = churches.findByAdminAccountEmail(otherAdmin).orElseThrow().getId();
        Election foreignElection = new Election(otherChurchId, "Other Church");
        foreignElection.replaceSetup("Other Church", java.util.List.of(new ElectionPosition("Pastor", 1, 1)));
        Election saved = elections.saveAndFlush(foreignElection);
        insertIntake(saved.getPositions().getFirst().getId());

        mockMvc.perform(get("/api/elections/{id}", saved.getId()).with(admin()))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/elections/{id}", saved.getId()).with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"departmentName\":\"Changed\",\"positions\":[{\"name\":\"Chair\",\"openingCount\":1}]}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/elections/{id}", UUID.randomUUID()).with(admin()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/elections").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor admin() {
        return httpBasic(USERNAME, PASSWORD);
    }

    private String createElection(String departmentName, String request) throws Exception {
        mockMvc.perform(post("/api/elections").with(admin())
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isCreated());
        return elections.findAll().stream()
                .filter(election -> election.getDepartmentName().equals(departmentName))
                .findFirst().orElseThrow().getId().toString();
    }

        private void insertIntake(UUID positionId) {
                jdbc.update("""
                                insert into nomination_intakes (id, position_id, access_token, name_limit, status)
                                values (?, ?, ?, 5, 'OPEN')
                                """, UUID.randomUUID(), positionId, UUID.randomUUID());
        }

        private void insertDraftRound(UUID positionId) {
                jdbc.update("""
                                insert into voting_rounds
                                        (id, position_id, draft_position_id, round_number, status, selection_count, reset_count,
                                         cutoff_overridden)
                                values (?, ?, ?, 1, 'DRAFT', 1, 0, false)
                                """, UUID.randomUUID(), positionId, positionId);
        }

        private void insertDraftRoundWithDecision(UUID positionId, String decision) {
                UUID roundId = UUID.randomUUID();
                UUID candidateId = UUID.randomUUID();
                jdbc.update("""
                                insert into voting_rounds
                                        (id, position_id, draft_position_id, round_number, status, selection_count,
                                         reset_count, cutoff_overridden)
                                values (?, ?, ?, 1, 'DRAFT', 1, 0, false)
                                """, roundId, positionId, positionId);
                jdbc.update("""
                                insert into voting_round_candidates (id, round_id, candidate_name, sequence)
                                values (?, ?, 'Decision Candidate', 1)
                                """, candidateId, roundId);
                insertDecision(roundId, candidateId, decision);
        }

        private void insertActiveRound(UUID positionId) {
                jdbc.update("""
                                insert into voting_rounds
                                        (id, position_id, draft_position_id, active_position_id, round_number, status,
                                         selection_count, reset_count, expected_voter_count, access_token, cutoff_overridden)
                                values (?, ?, null, ?, 1, 'ACTIVE', 1, 0, 1, ?, false)
                                """, UUID.randomUUID(), positionId, positionId, UUID.randomUUID());
        }

        private void insertClosedRoundWithDecisions(UUID positionId, java.util.List<String> decisions) {
                UUID roundId = UUID.randomUUID();
                jdbc.update("""
                                insert into voting_rounds
                                        (id, position_id, draft_position_id, active_position_id, round_number, status, selection_count,
                                         reset_count, expected_voter_count, access_token, close_reason, cutoff_overridden)
                                values (?, ?, null, null, 1, 'CLOSED', 1, 0, 1, ?, 'ADMIN', false)
                                """, roundId, positionId, UUID.randomUUID());
                for (int index = 0; index < decisions.size(); index++) {
                        UUID candidateId = UUID.randomUUID();
                        jdbc.update("""
                                        insert into voting_round_candidates (id, round_id, candidate_name, sequence)
                                        values (?, ?, ?, ?)
                                        """, candidateId, roundId, "Candidate " + index, index + 1);
                        insertDecision(roundId, candidateId, decisions.get(index));
                }
        }

        private void insertClosedRoundWithoutCandidates(UUID positionId) {
                jdbc.update("""
                                insert into voting_rounds
                                        (id, position_id, draft_position_id, active_position_id, round_number, status,
                                         selection_count, reset_count, expected_voter_count, access_token, close_reason,
                                         cutoff_overridden)
                                values (?, ?, null, null, 1, 'CLOSED', 1, 0, 1, ?, 'ADMIN', false)
                                """, UUID.randomUUID(), positionId, UUID.randomUUID());
        }

        private void insertDecision(UUID positionId, int roundNumber, int sequence, String decision) {
                UUID roundId = jdbc.queryForObject(
                                "select id from voting_rounds where position_id = ? and round_number = ?", UUID.class,
                                positionId, roundNumber);
                UUID candidateId = jdbc.queryForObject(
                                "select id from voting_round_candidates where round_id = ? and sequence = ?", UUID.class,
                                roundId, sequence);
                insertDecision(roundId, candidateId, decision);
        }

        private void insertDecision(UUID roundId, UUID candidateId, String decision) {
                jdbc.update("delete from voting_round_candidate_decisions where round_id = ? and candidate_id = ?",
                                roundId, candidateId);
                jdbc.update("""
                                insert into voting_round_candidate_decisions
                                        (round_id, candidate_id, decision, reason, decided_at, decided_by)
                                values (?, ?, ?, 'Status test', current_timestamp, ?)
                                """, roundId, candidateId, decision, USERNAME);
        }
}