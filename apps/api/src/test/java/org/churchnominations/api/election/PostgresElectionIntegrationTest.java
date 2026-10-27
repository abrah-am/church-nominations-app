package org.churchnominations.api.election;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.dao.DataIntegrityViolationException;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.hamcrest.Matchers.aMapWithSize;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;

@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(properties = {
        "spring.profiles.active=dev"
})
@AutoConfigureMockMvc
class PostgresElectionIntegrationTest {
        private static final String USERNAME = "postgres-test-admin@example.org";
        private static final String PASSWORD = "postgres-test-password";

    @Container
    private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("church_nominations_test")
            .withUsername("test_user")
            .withPassword("test_password");

    @DynamicPropertySource
    static void postgresProperties(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        properties.add("spring.datasource.username", POSTGRES::getUsername);
        properties.add("spring.datasource.password", POSTGRES::getPassword);
        properties.add("spring.flyway.enabled", () -> true);
        properties.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void migratesPostgresAndPersistsElectionSetup() throws Exception {
        Integer v1Migration = jdbcTemplate.queryForObject(
                "select count(*) from flyway_schema_history where version = '1' and success = true",
                Integer.class);
        Integer v2Migration = jdbcTemplate.queryForObject(
                "select count(*) from flyway_schema_history where version = '2' and success = true",
                Integer.class);
        Integer v3Migration = jdbcTemplate.queryForObject(
                "select count(*) from flyway_schema_history where version = '3' and success = true",
                Integer.class);
        Integer v4Migration = jdbcTemplate.queryForObject(
                "select count(*) from flyway_schema_history where version = '4' and success = true",
                Integer.class);
        Integer v5Migration = jdbcTemplate.queryForObject(
                "select count(*) from flyway_schema_history where version = '5' and success = true",
                Integer.class);
        Integer v6Migration = jdbcTemplate.queryForObject(
                "select count(*) from flyway_schema_history where version = '6' and success = true",
                Integer.class);
        Integer v7Migration = jdbcTemplate.queryForObject(
                "select count(*) from flyway_schema_history where version = '7' and success = true",
                Integer.class);
        Integer v8Migration = jdbcTemplate.queryForObject(
                "select count(*) from flyway_schema_history where version = '8' and success = true",
                Integer.class);
        Integer v9Migration = jdbcTemplate.queryForObject(
                "select count(*) from flyway_schema_history where version = '9' and success = true",
                Integer.class);
        Integer v10Migration = jdbcTemplate.queryForObject(
                "select count(*) from flyway_schema_history where version = '10' and success = true",
                Integer.class);
        Integer v11Migration = jdbcTemplate.queryForObject(
                "select count(*) from flyway_schema_history where version = '11' and success = true",
                Integer.class);
        assertEquals(1, v1Migration);
        assertEquals(1, v2Migration);
        assertEquals(1, v3Migration);
        assertEquals(1, v4Migration);
        assertEquals(1, v5Migration);
        assertEquals(1, v6Migration);
        assertEquals(1, v7Migration);
        assertEquals(1, v8Migration);
        assertEquals(1, v9Migration);
        assertEquals(1, v10Migration);
        assertEquals(1, v11Migration);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + USERNAME + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/churches")
                        .with(httpBasic(USERNAME, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"name\":\"Postgres Test Church\"}"))
                .andExpect(status().isCreated());

        String location = mockMvc.perform(post("/api/elections")
                        .with(httpBasic(USERNAME, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"departmentName":"PostgreSQL Integration","positions":[
                                  {"name":"Director","openingCount":1},
                                  {"name":"Treasurer","openingCount":2}
                                ]}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.positions[1].sequence").value(2))
                .andReturn().getResponse().getHeader("Location");

        UUID electionId = UUID.fromString(location.substring(location.lastIndexOf('/') + 1));
        UUID directorId = jdbcTemplate.queryForObject(
                "select id from election_positions where election_id = ? and name = ?",
                UUID.class, electionId, "Director");
        UUID treasurerId = jdbcTemplate.queryForObject(
                "select id from election_positions where election_id = ? and name = ?",
                UUID.class, electionId, "Treasurer");

        mockMvc.perform(put(location)
                        .with(httpBasic(USERNAME, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"departmentName":"PostgreSQL Integration","positions":[
                                  {"id":"%s","name":"Treasurer","openingCount":3},
                                  {"id":"%s","name":"Director","openingCount":1},
                                  {"name":"Secretary","openingCount":1}
                                ]}
                                """.formatted(treasurerId, directorId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.positions[0].id").value(treasurerId.toString()))
                .andExpect(jsonPath("$.positions[0].sequence").value(1))
                .andExpect(jsonPath("$.positions[1].id").value(directorId.toString()))
                .andExpect(jsonPath("$.positions[1].sequence").value(2))
                .andExpect(jsonPath("$.positions[2].sequence").value(3));

        mockMvc.perform(get(location)
                        .with(httpBasic(USERNAME, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.departmentName").value("PostgreSQL Integration"))
                .andExpect(jsonPath("$.positions", org.hamcrest.Matchers.hasSize(3)))
                .andExpect(jsonPath("$.positions[0].id").value(treasurerId.toString()))
                .andExpect(jsonPath("$.positions[0].name").value("Treasurer"))
                .andExpect(jsonPath("$.positions[0].openingCount").value(3))
                .andExpect(jsonPath("$.positions[1].id").value(directorId.toString()))
                .andExpect(jsonPath("$.positions[1].name").value("Director"))
                .andExpect(jsonPath("$.positions[2].name").value("Secretary"));

        mockMvc.perform(post("/api/boards")
                        .with(httpBasic(USERNAME, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"year":2026,"members":[{"name":"Avery Chen"},{"name":"Jordan Lee"}]}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.year").value(2026))
                .andExpect(jsonPath("$.members", org.hamcrest.Matchers.hasSize(2)));

        UUID boardId = jdbcTemplate.queryForObject("""
                select b.id from boards b
                join churches c on c.id = b.church_id
                join accounts a on a.id = c.admin_account_id
                where a.email = ? and b.board_year = ?
                """, UUID.class, USERNAME, 2026);
        UUID memberId = jdbcTemplate.queryForObject(
                "select id from board_members where board_id = ? and name = ?",
                UUID.class, boardId, "Avery Chen");

        mockMvc.perform(post("/api/boards/{id}/sessions", boardId)
                        .with(httpBasic(USERNAME, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"sessionDate\":\"2026-10-16\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionDate").value("2026-10-16"));

        UUID sessionId = jdbcTemplate.queryForObject(
                "select id from board_sessions where board_id = ? and session_date = ?",
                UUID.class, boardId, java.sql.Date.valueOf("2026-10-16"));
        mockMvc.perform(put("/api/boards/{id}/sessions/{sessionId}/attendance", boardId, sessionId)
                        .with(httpBasic(USERNAME, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"attendedMemberIds\":[\"" + memberId + "\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attendedMemberIds[0]").value(memberId.toString()));

        mockMvc.perform(get("/api/boards/{id}", boardId).with(httpBasic(USERNAME, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.members", org.hamcrest.Matchers.hasSize(2)))
                .andExpect(jsonPath("$.sessions", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$.sessions[0].attendedMemberIds[0]").value(memberId.toString()));
    }

    @Test
    void deletingPositionRemovesAllHistoryAndAllowsRecreation() throws Exception {
        String admin = "delete-position-admin@example.org";
        String otherAdmin = "delete-position-other-admin@example.org";
        registerChurch(admin, "Delete Position Church");
        registerChurch(otherAdmin, "Other Delete Position Church");

        String electionLocation = mockMvc.perform(post("/api/elections").with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"departmentName\":\"Position Deletion\",\"positions\":["
                                + "{\"name\":\"Elder\",\"openingCount\":1},"
                                + "{\"name\":\"Deacon\",\"openingCount\":1}]}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");
        UUID electionId = UUID.fromString(electionLocation.substring(electionLocation.lastIndexOf('/') + 1));
        UUID elderId = jdbcTemplate.queryForObject(
                "select id from election_positions where election_id = ? and name = ?",
                UUID.class, electionId, "Elder");
        UUID deaconId = jdbcTemplate.queryForObject(
                "select id from election_positions where election_id = ? and name = ?",
                UUID.class, electionId, "Deacon");

        String otherElectionLocation = mockMvc.perform(post("/api/elections").with(httpBasic(otherAdmin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"departmentName\":\"Foreign Election\",\"positions\":["
                                + "{\"name\":\"Elder\",\"openingCount\":1}]}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");
        UUID otherElectionId = UUID.fromString(
                otherElectionLocation.substring(otherElectionLocation.lastIndexOf('/') + 1));
        UUID otherPositionId = jdbcTemplate.queryForObject(
                "select id from election_positions where election_id = ?",
                UUID.class, otherElectionId);

        mockMvc.perform(delete("/api/elections/{electionId}/positions/{positionId}", electionId, elderId))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/elections/{electionId}/positions/{positionId}", UUID.randomUUID(), elderId)
                        .with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/elections/{electionId}/positions/{positionId}", electionId, UUID.randomUUID())
                        .with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/elections/{electionId}/positions/{positionId}", otherElectionId, otherPositionId)
                        .with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/elections/{electionId}/positions/{positionId}", electionId, elderId)
                        .with(httpBasic(otherAdmin, PASSWORD)))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations", electionId, elderId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"nameLimit\":2}"))
                .andExpect(status().isCreated());
        UUID intakeToken = jdbcTemplate.queryForObject(
                "select access_token from nomination_intakes where position_id = ?", UUID.class, elderId);
        UUID intakeId = jdbcTemplate.queryForObject(
                "select id from nomination_intakes where position_id = ?", UUID.class, elderId);
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", intakeToken)
                        .header("X-Nomination-Device-Token", UUID.randomUUID())
                        .contentType(APPLICATION_JSON).content("{\"names\":[\"Alice\",\"Bob\"]}"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations/close",
                        electionId, elderId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations/reveal",
                        electionId, elderId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/nominations/consolidation",
                        electionId, elderId).with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Alice\",\"Bob\"]}"))
                .andExpect(status().isOk());
        String roundLocation = mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds",
                        electionId, elderId).with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Alice\",\"Bob\"],\"selectionCount\":1}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");
        UUID roundId = UUID.fromString(roundLocation.substring(roundLocation.lastIndexOf('/') + 1));
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/start",
                        electionId, elderId, roundId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON).content("{\"expectedVoterCount\":3}"))
                .andExpect(status().isOk());
        UUID roundToken = jdbcTemplate.queryForObject(
                "select access_token from voting_rounds where id = ?", UUID.class, roundId);
        UUID aliceId = jdbcTemplate.queryForObject(
                "select id from voting_round_candidates where round_id = ? and candidate_name = ?",
                UUID.class, roundId, "Alice");
        submitBallot(roundToken, UUID.randomUUID(), aliceId);
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/close",
                        electionId, elderId, roundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/reveal",
                        electionId, elderId, roundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision",
                        electionId, elderId, roundId, aliceId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON).content("{\"decision\":\"ELECTED\",\"reason\":\"Selected\"}"))
                .andExpect(status().isOk());

        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from nomination_intakes where id = ?", Integer.class, intakeId));
        assertEquals(2, jdbcTemplate.queryForObject(
                "select count(*) from nomination_submissions where intake_id = ?", Integer.class, intakeId));
        assertEquals(2, jdbcTemplate.queryForObject(
                "select count(*) from nomination_consolidated_names where intake_id = ?", Integer.class, intakeId));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from voting_rounds where id = ?", Integer.class, roundId));
        assertEquals(2, jdbcTemplate.queryForObject(
                "select count(*) from voting_round_candidates where round_id = ?", Integer.class, roundId));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from voting_ballots where round_id = ?", Integer.class, roundId));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from voting_ballot_choices where round_id = ?", Integer.class, roundId));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from voting_round_candidate_decisions where round_id = ?", Integer.class, roundId));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from voting_round_candidate_decision_events where round_id = ?", Integer.class, roundId));

        mockMvc.perform(delete("/api/elections/{electionId}/positions/{positionId}", electionId, elderId)
                        .with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isNoContent());
        assertEquals(1, jdbcTemplate.queryForObject("select count(*) from elections where id = ?", Integer.class, electionId));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from election_positions where id = ? and election_id = ?",
                Integer.class, deaconId, electionId));
        assertEquals(0, jdbcTemplate.queryForObject(
                "select count(*) from election_positions where id = ?", Integer.class, elderId));
        assertEquals(0, jdbcTemplate.queryForObject(
                "select count(*) from nomination_intakes where position_id = ?", Integer.class, elderId));
        assertEquals(0, jdbcTemplate.queryForObject(
                "select count(*) from nomination_submissions where intake_id = ?", Integer.class, intakeId));
        assertEquals(0, jdbcTemplate.queryForObject(
                "select count(*) from nomination_consolidated_names where intake_id in "
                        + "(select id from nomination_intakes where position_id = ?)", Integer.class, elderId));
        for (String table : List.of("voting_rounds", "voting_round_candidates", "voting_ballots",
                "voting_ballot_choices", "voting_round_candidate_decisions", "voting_round_candidate_decision_events")) {
            String query = table.equals("voting_rounds")
                    ? "select count(*) from voting_rounds where position_id = ?"
                    : "select count(*) from " + table + " where round_id in "
                            + "(select id from voting_rounds where position_id = ?)";
            assertEquals(0, jdbcTemplate.queryForObject(query, Integer.class, elderId), table + " should cascade");
        }

        mockMvc.perform(put("/api/elections/{id}", electionId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"departmentName\":\"Position Deletion\",\"positions\":["
                                + "{\"id\":\"" + deaconId + "\",\"name\":\"Deacon\",\"openingCount\":1},"
                                + "{\"name\":\"Elder\",\"openingCount\":1}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.positions", hasSize(2)))
                .andExpect(jsonPath("$.positions[1].name").value("Elder"));

        UUID recreatedElderId = jdbcTemplate.queryForObject(
                "select id from election_positions where election_id = ? and name = ?",
                UUID.class, electionId, "Elder");
        mockMvc.perform(delete("/api/elections/{electionId}/positions/{positionId}", electionId, deaconId)
                        .with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/elections/{electionId}/positions/{positionId}", electionId, recreatedElderId)
                        .with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isNoContent());
        mockMvc.perform(put("/api/elections/{id}", electionId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"departmentName\":\"Position Deletion\",\"positions\":["
                                + "{\"name\":\"Elder\",\"openingCount\":1}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.positions", hasSize(1)))
                .andExpect(jsonPath("$.positions[0].name").value("Elder"));
    }

    @Test
    void adminCannotReadNominationNamesBeforeExplicitReveal() throws Exception {
        String admin = "nomination-reveal-admin@example.org";
                String otherAdmin = "nomination-reveal-other-admin@example.org";
        mockMvc.perform(post("/api/auth/register").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + admin + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/auth/register").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + otherAdmin + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/churches").with(httpBasic(otherAdmin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"name\":\"Other Nomination Reveal Church\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/churches").with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"name\":\"Nomination Reveal Test Church\"}"))
                .andExpect(status().isCreated());
        String electionLocation = mockMvc.perform(post("/api/elections").with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"departmentName\":\"Reveal Test\",\"positions\":[{\"name\":\"Elder\",\"openingCount\":1}]}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");
        UUID electionId = UUID.fromString(electionLocation.substring(electionLocation.lastIndexOf('/') + 1));
        UUID positionId = jdbcTemplate.queryForObject(
                "select id from election_positions where election_id = ?", UUID.class, electionId);
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations",
                        electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON).content("{\"nameLimit\":2}"))
                .andExpect(status().isCreated());
        UUID accessToken = jdbcTemplate.queryForObject(
                "select access_token from nomination_intakes where position_id = ?", UUID.class, positionId);
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header("X-Nomination-Device-Token", UUID.randomUUID())
                        .contentType(APPLICATION_JSON).content("{\"names\":[\"Private Name\"]}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/nominations", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentContributorCount").value(1))
                .andExpect(jsonPath("$.submissions", hasSize(0)))
                .andExpect(jsonPath("$.consolidatedNames").value(org.hamcrest.Matchers.nullValue()));
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations/close",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.listCreated").value(true))
                .andExpect(jsonPath("$.revealed").value(false))
                .andExpect(jsonPath("$.submissions[*].name").value(org.hamcrest.Matchers.hasItem("Private Name")))
                .andExpect(jsonPath("$.consolidatedNames[0]").value("Private Name"));
        MvcResult presentationStream = mockMvc.perform(get(
                        "/api/elections/{electionId}/positions/{positionId}/nominations/stream",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(request().asyncStarted())
                .andReturn();
        String adminStream = presentationStream.getResponse().getContentAsString();
        org.junit.jupiter.api.Assertions.assertTrue(adminStream.contains("Private Name"));
        org.junit.jupiter.api.Assertions.assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from nomination_submissions where intake_id = "
                        + "(select id from nomination_intakes where position_id = ?)", Integer.class, positionId));
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations/reveal",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revealed").value(true))
                .andExpect(jsonPath("$.listCreated").value(true))
                .andExpect(jsonPath("$.currentContributorCount").value(1))
                .andExpect(jsonPath("$.submissions[*].name").value(org.hamcrest.Matchers.hasItem("Private Name")))
                .andExpect(jsonPath("$.consolidatedNames[0]").value("Private Name"));
        String presentationJson = mockMvc.perform(post(
                        "/api/elections/{electionId}/positions/{positionId}/nominations/presentation",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        UUID presentationToken = UUID.fromString(com.jayway.jsonpath.JsonPath.read(
                presentationJson, "$.accessToken"));
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations/presentation",
                        electionId, positionId).with(httpBasic(otherAdmin, PASSWORD)))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/nomination-presentations/{accessToken}", presentationToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revealed").value(true))
                .andExpect(jsonPath("$.activeNames[0]").value("Private Name"))
                .andExpect(jsonPath("$.events", hasSize(0)));
        MvcResult viewerStream = mockMvc.perform(get(
                        "/api/nomination-presentations/{accessToken}/stream", presentationToken))
                .andExpect(status().isOk())
                .andExpect(request().asyncStarted())
                .andReturn();
        org.junit.jupiter.api.Assertions.assertTrue(
                viewerStream.getResponse().getContentAsString().contains("snapshot"));
        org.junit.jupiter.api.Assertions.assertFalse(
                mockMvc.perform(get("/api/nomination-presentations/{accessToken}", presentationToken))
                        .andReturn().getResponse().getContentAsString().contains(admin));
        String sharedListResponse = mockMvc.perform(get(
                        "/api/elections/{electionId}/positions/{positionId}/nominations", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        UUID sharedRowId = UUID.fromString(com.jayway.jsonpath.JsonPath.read(sharedListResponse,
                "$.sharedList[0].id"));
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/nominations/shared-list",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"expectedRevision\":0,\"entries\":[{\"id\":\"" + sharedRowId
                                + "\",\"name\":\"Corrected Private Name\",\"sequence\":1,\"active\":true}],\"removals\":[]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sharedListRevision").value(1))
                .andExpect(jsonPath("$.sharedList[0].name").value("Corrected Private Name"))
                .andExpect(jsonPath("$.changeEvents[0].action").value("CORRECTED"))
                .andExpect(jsonPath("$.changeEvents[0].beforeName").value("Private Name"))
                .andExpect(jsonPath("$.changeEvents[0].afterName").value("Corrected Private Name"))
                .andExpect(jsonPath("$.changeEvents[0].actorLabel").value(org.hamcrest.Matchers.startsWith("Administrator ")))
                .andExpect(jsonPath("$.changeEvents[0].occurredAt").isNotEmpty());
        jdbcTemplate.update("update nomination_shared_list_audit_events set actor = ? where intake_id = "
                + "(select id from nomination_intakes where position_id = ?)", admin, positionId);
        mockMvc.perform(get("/api/nomination-presentations/{accessToken}", presentationToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeNames[0]").value("Corrected Private Name"))
                .andExpect(jsonPath("$.events[0].beforeName").value("Private Name"))
                .andExpect(jsonPath("$.events[0].actorLabel").value("Administrator"))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString(admin))));
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/nominations/shared-list",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"expectedRevision\":0,\"entries\":[{\"id\":\"" + sharedRowId
                                + "\",\"name\":\"Corrected Private Name\",\"sequence\":1,\"active\":true}],\"removals\":[]}"))
                .andExpect(status().isConflict());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/nominations/shared-list",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"expectedRevision\":1,\"entries\":[],\"removals\":[{\"id\":\""
                                + sharedRowId + "\",\"reason\":\"OTHER\"}]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/nominations/shared-list",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"expectedRevision\":1,\"entries\":[],\"removals\":[{\"id\":\""
                                + sharedRowId + "\",\"reason\":\"DECLINED\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sharedListRevision").value(2))
                .andExpect(jsonPath("$.removedEntries[0].originalEntryId").value(sharedRowId.toString()))
                .andExpect(jsonPath("$.removedEntries[0].name").value("Corrected Private Name"))
                .andExpect(jsonPath("$.removedEntries[0].removedBy").value(org.hamcrest.Matchers.startsWith("Administrator ")))
                .andExpect(jsonPath("$.changeEvents[1].removalReason").value("DECLINED"));
        String viewerBody = mockMvc.perform(get("/api/nomination-presentations/{accessToken}", presentationToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeNames", hasSize(0)))
                .andExpect(jsonPath("$.events[1].removalReason").value("DECLINED"))
                .andReturn().getResponse().getContentAsString();
        org.junit.jupiter.api.Assertions.assertFalse(viewerBody.contains("removedEntries"));
        org.junit.jupiter.api.Assertions.assertFalse(viewerBody.contains("currentContributorCount"));
        mockMvc.perform(post("/api/nomination-presentations/{accessToken}", presentationToken))
                .andExpect(status().isUnauthorized());
        UUID removalEventId = UUID.fromString(com.jayway.jsonpath.JsonPath.read(
                mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/nominations", electionId, positionId)
                                .with(httpBasic(admin, PASSWORD)))
                        .andReturn().getResponse().getContentAsString(), "$.removedEntries[0].auditEventId"));
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations/shared-list/restore",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"auditEventId\":\"" + removalEventId + "\",\"expectedRevision\":2}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sharedListRevision").value(3))
                .andExpect(jsonPath("$.sharedList[0].name").value("Corrected Private Name"))
                .andExpect(jsonPath("$.removedEntries", hasSize(0)))
                .andExpect(jsonPath("$.consolidatedNames[0]").value("Corrected Private Name"));
        org.junit.jupiter.api.Assertions.assertEquals(3, jdbcTemplate.queryForObject(
                "select count(*) from nomination_shared_list_audit_events where intake_id = "
                        + "(select id from nomination_intakes where position_id = ?)", Integer.class, positionId));
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations/presentation/hide",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/nomination-presentations/{accessToken}", presentationToken))
                .andExpect(status().isNotFound());
        String reopened = mockMvc.perform(post(
                        "/api/elections/{electionId}/positions/{positionId}/nominations/presentation",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        UUID reopenedToken = UUID.fromString(com.jayway.jsonpath.JsonPath.read(reopened, "$.accessToken"));
        org.junit.jupiter.api.Assertions.assertNotEquals(presentationToken, reopenedToken);
        mockMvc.perform(get("/api/nomination-presentations/{accessToken}", reopenedToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeNames[0]").value("Corrected Private Name"));
        org.junit.jupiter.api.Assertions.assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from nomination_submissions where intake_id = "
                        + "(select id from nomination_intakes where position_id = ?) and device_token is null",
                Integer.class, positionId));
        org.junit.jupiter.api.Assertions.assertEquals(0, jdbcTemplate.queryForObject(
                "select count(*) from nomination_submissions where intake_id = "
                        + "(select id from nomination_intakes where position_id = ?) and device_token is not null",
                Integer.class, positionId));
    }

    @Test
    void revealingNominationsAlphabetizesNamesAndPreservesDuplicates() throws Exception {
        String admin = "nomination-order-admin@example.org";
        mockMvc.perform(post("/api/auth/register").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + admin + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/churches").with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"name\":\"Nomination Order Church\"}"))
                .andExpect(status().isCreated());
        String electionLocation = mockMvc.perform(post("/api/elections").with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"departmentName\":\"Order Test\",\"positions\":[{\"name\":\"Elder\",\"openingCount\":1}]}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");
        UUID electionId = UUID.fromString(electionLocation.substring(electionLocation.lastIndexOf('/') + 1));
        UUID positionId = jdbcTemplate.queryForObject(
                "select id from election_positions where election_id = ?", UUID.class, electionId);
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations",
                        electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON).content("{\"nameLimit\":2}"))
                .andExpect(status().isCreated());
        UUID accessToken = jdbcTemplate.queryForObject(
                "select access_token from nomination_intakes where position_id = ?", UUID.class, positionId);
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header("X-Nomination-Device-Token", UUID.randomUUID())
                        .contentType(APPLICATION_JSON).content("{\"names\":[\"Zoe\",\"Alex\"]}"))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header("X-Nomination-Device-Token", UUID.randomUUID())
                        .contentType(APPLICATION_JSON).content("{\"names\":[\"Alex\",\"Mina\"]}"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations/close",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.listCreated").value(true))
                .andExpect(jsonPath("$.revealed").value(false))
                .andExpect(jsonPath("$.submissions[*].name").value(containsInAnyOrder("Alex", "Alex", "Mina", "Zoe")));
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations/reveal",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consolidatedNames", org.hamcrest.Matchers.contains("Alex", "Alex", "Mina", "Zoe")))
                .andExpect(jsonPath("$.submissions", hasSize(4)));
    }

    @Test
    void nominationIntakeSupportsAnonymousDeviceEditsClosureAndConsolidation() throws Exception {
        String admin = "nominations-postgres-admin@example.org";
        String otherAdmin = "nominations-other-admin@example.org";
        mockMvc.perform(post("/api/auth/register").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + admin + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/churches").with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"name\":\"Nominations Test Church\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/auth/register").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + otherAdmin + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/churches").with(httpBasic(otherAdmin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"name\":\"Other Nominations Church\"}"))
                .andExpect(status().isCreated());

        String electionLocation = mockMvc.perform(post("/api/elections").with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"departmentName\":\"Nominations Department\",\"positions\":[{\"name\":\"Elder\",\"openingCount\":1}]}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");
        UUID electionId = UUID.fromString(electionLocation.substring(electionLocation.lastIndexOf('/') + 1));
        String secondElectionLocation = mockMvc.perform(post("/api/elections").with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"departmentName\":\"Other Department\",\"positions\":[{\"name\":\"Deacon\",\"openingCount\":1}]}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");
        UUID secondElectionId = UUID.fromString(
                secondElectionLocation.substring(secondElectionLocation.lastIndexOf('/') + 1));
        UUID deaconId = jdbcTemplate.queryForObject(
                "select id from election_positions where election_id = ? and name = ?",
                UUID.class, secondElectionId, "Deacon");
        mockMvc.perform(put("/api/elections/{id}", secondElectionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"departmentName\":\"Other Department\",\"positions\":["
                                + "{\"id\":\"" + deaconId + "\",\"name\":\"Deacon\",\"openingCount\":1},"
                                + "{\"name\":\"Clerk\",\"openingCount\":1}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.positions", hasSize(2)));
        UUID clerkId = jdbcTemplate.queryForObject(
                "select id from election_positions where election_id = ? and name = ?",
                UUID.class, secondElectionId, "Clerk");
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations",
                        secondElectionId, clerkId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON).content("{\"nameLimit\":1}"))
                .andExpect(status().isCreated());
        mockMvc.perform(put("/api/elections/{id}", secondElectionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"departmentName\":\"Other Department\",\"positions\":["
                                + "{\"id\":\"" + deaconId + "\",\"name\":\"Deacon\",\"openingCount\":1}]}"))
                .andExpect(status().isConflict());
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/nominations",
                        secondElectionId, clerkId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk());
        UUID positionId = jdbcTemplate.queryForObject(
                "select id from election_positions where election_id = ?", UUID.class, electionId);
        UUID deviceToken = UUID.randomUUID();
        UUID secondDeviceToken = UUID.randomUUID();

        var createdIntake = mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations",
                                electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON).content("{\"nameLimit\":2}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$", aMapWithSize(13)))
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.nameLimit").value(2))
                .andExpect(jsonPath("$.currentContributorCount").value(0))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.revealed").value(false))
                .andExpect(jsonPath("$.sharedListRevision").value(0))
                .andExpect(jsonPath("$.submissions", hasSize(0)))
                .andExpect(jsonPath("$.sharedList", hasSize(0)))
                .andExpect(jsonPath("$.consolidatedNames").value(org.hamcrest.Matchers.nullValue()))
                .andReturn();
        UUID accessToken = jdbcTemplate.queryForObject(
                "select access_token from nomination_intakes where position_id = ?", UUID.class, positionId);
        org.junit.jupiter.api.Assertions.assertTrue(createdIntake.getResponse().getContentAsString()
                .contains(accessToken.toString()));
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/nominations",
                        secondElectionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/nominations", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value(accessToken.toString()));
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/nominations", electionId, positionId)
                        .with(httpBasic(otherAdmin, PASSWORD)))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations", electionId, positionId)
                        .with(httpBasic(otherAdmin, PASSWORD)).contentType(APPLICATION_JSON).content("{\"nameLimit\":2}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations/close",
                        electionId, positionId).with(httpBasic(otherAdmin, PASSWORD)))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/nominations/consolidation",
                        electionId, positionId).with(httpBasic(otherAdmin, PASSWORD))
                        .contentType(APPLICATION_JSON).content("{\"candidateNames\":[\"Unauthorized\"]}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/nominations", electionId, positionId))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/nominations/stream",
                        electionId, positionId))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/nominations/stream",
                        electionId, positionId).with(httpBasic(otherAdmin, PASSWORD)))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/nomination-intakes/{accessToken}", accessToken)
                        .header("X-Nomination-Device-Token", deviceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", aMapWithSize(4)))
                .andExpect(jsonPath("$.departmentName").value("Nominations Department"))
                .andExpect(jsonPath("$.positionName").value("Elder"))
                .andExpect(jsonPath("$.submittedNames", hasSize(0)));
        mockMvc.perform(options("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "PUT")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "X-Nomination-Device-Token"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS,
                        containsString("X-Nomination-Device-Token")));
        mockMvc.perform(options("/api/nomination-presentations/{accessToken}/stream", UUID.randomUUID())
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Last-Event-ID"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, containsString("Last-Event-ID")));
        mockMvc.perform(get("/api/nomination-intakes/{accessToken}", accessToken))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header("X-Nomination-Device-Token", deviceToken)
                        .contentType(APPLICATION_JSON).content("{\"names\":[\" Alice \",\"Bob\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", aMapWithSize(1)))
                .andExpect(jsonPath("$.submittedNames[0]").value("Alice"))
                .andExpect(jsonPath("$.submittedNames[1]").value("Bob"));
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header("X-Nomination-Device-Token", deviceToken)
                        .contentType(APPLICATION_JSON).content("{\"names\":[\"Alice\",\"Carol\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submittedNames", hasSize(2)))
                .andExpect(jsonPath("$.submittedNames[0]").value("Alice"))
                .andExpect(jsonPath("$.submittedNames[1]").value("Carol"));
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/nominations",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentContributorCount").value(1))
                .andExpect(jsonPath("$.submissions", hasSize(0)));
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header("X-Nomination-Device-Token", secondDeviceToken)
                        .contentType(APPLICATION_JSON).content("{\"names\":[\"carol\",\"Dana\"]}"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/nominations",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentContributorCount").value(2))
                .andExpect(jsonPath("$.submissions", hasSize(0)));
        mockMvc.perform(get("/api/nomination-intakes/{accessToken}", accessToken)
                        .header("X-Nomination-Device-Token", deviceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submittedNames", hasSize(2)))
                .andExpect(jsonPath("$.submittedNames[0]").value("Alice"))
                .andExpect(jsonPath("$.submittedNames[1]").value("Carol"))
                .andExpect(jsonPath("$.deviceToken").doesNotExist())
                .andExpect(jsonPath("$.sourceId").doesNotExist())
                .andExpect(jsonPath("$.actorId").doesNotExist());
        mockMvc.perform(get("/api/nomination-intakes/{accessToken}", accessToken)
                        .header("X-Nomination-Device-Token", secondDeviceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submittedNames", hasSize(2)))
                .andExpect(jsonPath("$.submittedNames[0]").value("carol"))
                .andExpect(jsonPath("$.submittedNames[1]").value("Dana"));
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header("X-Nomination-Device-Token", deviceToken)
                        .contentType(APPLICATION_JSON).content("{\"names\":[\"One\",\"Two\",\"Three\"]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header("X-Nomination-Device-Token", deviceToken)
                        .contentType(APPLICATION_JSON).content("{\"names\":[\"   \"]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header("X-Nomination-Device-Token", deviceToken)
                        .contentType(APPLICATION_JSON).content("{\"names\":null}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header("X-Nomination-Device-Token", deviceToken)
                        .contentType(APPLICATION_JSON).content("{\"names\":[\"Same\",\" same \"]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/nominations/consolidation",
                        electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Alice\"]}"))
                .andExpect(status().isConflict());

        MvcResult stream = mockMvc.perform(get(
                        "/api/elections/{electionId}/positions/{positionId}/nominations/stream",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/event-stream"))
                .andExpect(request().asyncStarted())
                .andReturn();
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header("X-Nomination-Device-Token", deviceToken)
                        .contentType(APPLICATION_JSON).content("{\"names\":[\"Carol\"]}"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/nominations",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentContributorCount").value(2))
                .andExpect(jsonPath("$.submissions", hasSize(0)));
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header("X-Nomination-Device-Token", deviceToken)
                        .contentType(APPLICATION_JSON).content("{\"names\":[]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submittedNames", hasSize(0)));
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/nominations",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentContributorCount").value(1))
                .andExpect(jsonPath("$.submissions", hasSize(0)));
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header("X-Nomination-Device-Token", deviceToken)
                        .contentType(APPLICATION_JSON).content("{\"names\":[\"Resubmitted Name\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submittedNames[0]").value("Resubmitted Name"));
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/nominations",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentContributorCount").value(2))
                .andExpect(jsonPath("$.submissions", hasSize(0)));
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations/close",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.revealed").value(false))
                .andExpect(jsonPath("$.currentContributorCount").value(2))
                .andExpect(jsonPath("$.submissions", hasSize(3)))
                .andExpect(jsonPath("$.consolidatedNames", hasSize(3)));
        String streamBody = mockMvc.perform(asyncDispatch(stream))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals(5, streamBody.split("event:intake", -1).length - 1);
        org.junit.jupiter.api.Assertions.assertTrue(streamBody.contains("\"status\":\"CLOSED\""));
        org.junit.jupiter.api.Assertions.assertTrue(streamBody.contains("\"currentContributorCount\":2"));
        org.junit.jupiter.api.Assertions.assertTrue(streamBody.contains("\"name\":\"carol\""));
        org.junit.jupiter.api.Assertions.assertTrue(streamBody.contains("\"name\":\"Resubmitted Name\""));
        org.junit.jupiter.api.Assertions.assertFalse(streamBody.contains("deviceToken"));
        org.junit.jupiter.api.Assertions.assertFalse(streamBody.contains(deviceToken.toString()));
        MvcResult closedStream = mockMvc.perform(get(
                        "/api/elections/{electionId}/positions/{positionId}/nominations/stream",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/event-stream"))
                .andExpect(request().asyncStarted())
                .andReturn();
        org.junit.jupiter.api.Assertions.assertTrue(closedStream.getResponse().getContentAsString()
                .contains("\"status\":\"CLOSED\""));
        org.junit.jupiter.api.Assertions.assertTrue(closedStream.getResponse().getContentAsString()
                .contains("\"name\":\"carol\""));
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations/reveal",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revealed").value(true));
        org.junit.jupiter.api.Assertions.assertTrue(closedStream.getResponse().getContentAsString()
                .contains("\"name\":\"carol\""));
        mockMvc.perform(get("/api/nomination-intakes/{accessToken}", accessToken)
                        .header("X-Nomination-Device-Token", deviceToken))
                .andExpect(status().isGone());
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header("X-Nomination-Device-Token", deviceToken)
                        .contentType(APPLICATION_JSON).content("{\"names\":[\"Late\"]}"))
                .andExpect(status().isGone());
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header("X-Nomination-Device-Token", secondDeviceToken)
                        .contentType(APPLICATION_JSON).content("{\"names\":[]}"))
                .andExpect(status().isGone());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON).content("{\"nameLimit\":2}"))
                .andExpect(status().isConflict());

        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/nominations/consolidation",
                        electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Alice\",\"carol\"]}"))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations/reveal",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isConflict());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/nominations/consolidation",
                        electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Alice\",\"carol\"]}"))
                .andExpect(status().isConflict());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/nominations/consolidation",
                        electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Final Name\"]}"))
                .andExpect(status().isConflict());
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/nominations", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentContributorCount").value(2))
                .andExpect(jsonPath("$.submissions", hasSize(3)))
                .andExpect(jsonPath("$.submissions[0].name").value("carol"))
                .andExpect(jsonPath("$.submissions[1].name").value("Dana"))
                .andExpect(jsonPath("$.submissions[2].name").value("Resubmitted Name"))
                .andExpect(jsonPath("$.consolidatedNames", org.hamcrest.Matchers.contains(
                        "carol", "Dana", "Resubmitted Name")))
                .andExpect(jsonPath("$.submissions[0]", aMapWithSize(2)))
                .andExpect(jsonPath("$.submissions[0].actorId").doesNotExist());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/nominations/consolidation",
                        electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Same\",\" same \"]}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void votingRoundsRequireClosedConsolidatedNominationsAndPersistDraftConfiguration() throws Exception {
        String admin = "rounds-postgres-admin@example.org";
        String otherAdmin = "rounds-other-admin@example.org";
        mockMvc.perform(post("/api/auth/register").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + admin + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/churches").with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"name\":\"Voting Rounds Church\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/auth/register").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + otherAdmin + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/churches").with(httpBasic(otherAdmin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"name\":\"Other Voting Rounds Church\"}"))
                .andExpect(status().isCreated());

        String electionLocation = mockMvc.perform(post("/api/elections").with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"departmentName\":\"Rounds Department\",\"positions\":["
                                + "{\"name\":\"Elder\",\"openingCount\":1}]}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");
        UUID electionId = UUID.fromString(electionLocation.substring(electionLocation.lastIndexOf('/') + 1));
        UUID positionId = jdbcTemplate.queryForObject(
                "select id from election_positions where election_id = ?", UUID.class, electionId);

        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Unlisted\"],\"selectionCount\":1}"))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"nameLimit\":3}"))
                .andExpect(status().isCreated());
        UUID roundIntakeAccessToken = jdbcTemplate.queryForObject(
                "select access_token from nomination_intakes where position_id = ?", UUID.class, positionId);
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", roundIntakeAccessToken)
                        .header("X-Nomination-Device-Token", UUID.randomUUID())
                        .contentType(APPLICATION_JSON)
                        .content("{\"names\":[\"Alice\",\"Bob\",\"Carol\"]}"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Unlisted\"],\"selectionCount\":1}"))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations/close",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations/reveal",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Unlisted\"],\"selectionCount\":1}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/nominations/consolidation",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Alice\"]}"))
                .andExpect(status().isConflict());

        var created = mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"alice\",\"Bob\"],\"selectionCount\":2}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roundNumber").value(1))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.selectionCount").value(2))
                .andExpect(jsonPath("$.candidates", hasSize(2)))
                .andExpect(jsonPath("$.candidates[0].name").value("Alice"))
                .andExpect(jsonPath("$.candidates[0].sequence").value(1))
                .andExpect(jsonPath("$.candidates[0].id").isNotEmpty())
                .andExpect(jsonPath("$.candidates[1].name").value("Bob"))
                .andExpect(jsonPath("$.candidates[1].sequence").value(2))
                .andReturn();
        String roundLocation = created.getResponse().getHeader("Location");
        UUID roundId = UUID.fromString(roundLocation.substring(roundLocation.lastIndexOf('/') + 1));

        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(roundId.toString()));
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds", electionId, positionId)
                        .with(httpBasic(otherAdmin, PASSWORD)))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Alice\"],\"selectionCount\":1}"))
                .andExpect(status().isConflict());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}",
                        electionId, positionId, roundId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Carol\",\"Alice\"],\"selectionCount\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(roundId.toString()))
                .andExpect(jsonPath("$.roundNumber").value(1))
                .andExpect(jsonPath("$.selectionCount").value(1))
                .andExpect(jsonPath("$.candidates", hasSize(2)))
                .andExpect(jsonPath("$.candidates[0].name").value("Carol"))
                .andExpect(jsonPath("$.candidates[1].name").value("Alice"));
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}",
                        electionId, positionId, UUID.randomUUID()).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Alice\"],\"selectionCount\":1}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}",
                        electionId, positionId, roundId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Missing\"],\"selectionCount\":1}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}",
                        electionId, positionId, roundId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Alice\",\" alice \"],\"selectionCount\":1}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}",
                        electionId, positionId, roundId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Alice\"],\"selectionCount\":2}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/nominations/consolidation",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Alice\"]}"))
                .andExpect(status().isConflict());
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].candidates", hasSize(2)))
                .andExpect(jsonPath("$[0].candidates[0].name").value("Carol"));

        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/start",
                        electionId, positionId, roundId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"expectedVoterCount\":16}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Carol\"],\"selectionCount\":1}"))
                .andExpect(status().isConflict());
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(roundId.toString()))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));

        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/close",
                        electionId, positionId, roundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Carol\"],\"selectionCount\":1}"))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/reveal",
                        electionId, positionId, roundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk());
        UUID carolId = jdbcTemplate.queryForObject(
                "select id from voting_round_candidates where round_id = ? and candidate_name = ?",
                UUID.class, roundId, "Carol");
        UUID aliceId = jdbcTemplate.queryForObject(
                "select id from voting_round_candidates where round_id = ? and candidate_name = ?",
                UUID.class, roundId, "Alice");
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision",
                        electionId, positionId, roundId, carolId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON).content("{\"decision\":\"ADVANCED\",\"reason\":\"Proceed\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision",
                        electionId, positionId, roundId, aliceId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON).content("{\"decision\":\"ELIMINATED\",\"reason\":\"Not selected\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Alice\"],\"selectionCount\":1}"))
                .andExpect(status().isBadRequest());
        String nextRoundLocation = mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"carol\"],\"selectionCount\":1}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roundNumber").value(2))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.candidates", hasSize(1)))
                .andExpect(jsonPath("$.candidates[0].name").value("Carol"))
                .andReturn().getResponse().getHeader("Location");
        UUID nextRoundId = UUID.fromString(nextRoundLocation.substring(nextRoundLocation.lastIndexOf('/') + 1));
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision",
                        electionId, positionId, roundId, carolId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"decision\":\"ELIMINATED\",\"reason\":\"Reconsidered\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/start",
                        electionId, positionId, nextRoundId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON).content("{\"expectedVoterCount\":8}"))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/reopen",
                        electionId, positionId, roundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}",
                        electionId, positionId, nextRoundId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Carol\"],\"selectionCount\":1}"))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/start",
                        electionId, positionId, nextRoundId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON).content("{\"expectedVoterCount\":8}"))
                .andExpect(status().isConflict());
    }

    @Test
    void nominationChangesAreAllowedDuringDraftButInvalidateItsStart() throws Exception {
        String admin = "draft-roster-admin@example.org";
        mockMvc.perform(post("/api/auth/register").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + admin + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/churches").with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"name\":\"Draft Roster Church\"}"))
                .andExpect(status().isCreated());
        String location = mockMvc.perform(post("/api/elections").with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"departmentName\":\"Draft Roster\",\"positions\":[{\"name\":\"Elder\",\"openingCount\":1}]}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getHeader("Location");
        UUID electionId = UUID.fromString(location.substring(location.lastIndexOf('/') + 1));
        UUID positionId = jdbcTemplate.queryForObject(
                "select id from election_positions where election_id = ?", UUID.class, electionId);
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"nameLimit\":2}"))
                .andExpect(status().isCreated());
        UUID intakeId = jdbcTemplate.queryForObject(
                "select id from nomination_intakes where position_id = ?", UUID.class, positionId);
        jdbcTemplate.update("insert into nomination_consolidated_names (id, intake_id, sequence, candidate_name, active) "
                + "values (?, ?, 1, 'Avery', true), (?, ?, 2, 'Blair', true)",
                UUID.randomUUID(), intakeId, UUID.randomUUID(), intakeId);
        jdbcTemplate.update("update nomination_intakes set status = 'CLOSED', list_created_at = now(), "
                + "list_created_by = ?, list_contributor_count = 0 where id = ?", admin, intakeId);
        String roundLocation = mockMvc.perform(post(
                        "/api/elections/{electionId}/positions/{positionId}/rounds", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Avery\"],\"selectionCount\":1}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getHeader("Location");
        UUID roundId = UUID.fromString(roundLocation.substring(roundLocation.lastIndexOf('/') + 1));
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select id, candidate_name, sequence from nomination_consolidated_names where intake_id = ? "
                        + "order by sequence", intakeId);
        UUID rowId = (UUID) rows.getFirst().get("id");
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/nominations/shared-list",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"expectedRevision\":0,\"entries\":[{\"id\":\"" + rowId
                                + "\",\"name\":\"Avery corrected\",\"sequence\":1,\"active\":true}],"
                                + "\"removals\":[{\"id\":\"" + rows.get(1).get("id")
                                + "\",\"reason\":\"DUPLICATE\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sharedListRevision").value(1));
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/start",
                        electionId, positionId, roundId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON).content("{\"expectedVoterCount\":4}"))
                .andExpect(status().isConflict());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/nominations/shared-list",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"expectedRevision\":1,\"entries\":[{\"id\":\"" + rowId
                                + "\",\"name\":\"Avery corrected\",\"sequence\":1,\"active\":true}],\"removals\":[]}"))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}",
                        electionId, positionId, roundId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Avery corrected\"],\"selectionCount\":1}"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/start",
                        electionId, positionId, roundId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON).content("{\"expectedVoterCount\":4}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/nominations/shared-list",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"expectedRevision\":2,\"entries\":[{\"id\":\"" + rowId
                                + "\",\"name\":\"Avery corrected\",\"sequence\":1,\"active\":true}],\"removals\":[]}"))
                .andExpect(status().isConflict());
    }

    @Test
    void multiOpeningElectionsRequireMajorityRespectSeatCapAndStopAfterCompletion() throws Exception {
        String admin = "multi-opening-admin@example.org";
        registerChurch(admin, "Multi Opening Church");

        String electionLocation = mockMvc.perform(post("/api/elections").with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"departmentName\":\"Multiple Openings\",\"positions\":["
                                + "{\"name\":\"Council\",\"openingCount\":2},"
                                + "{\"name\":\"Committee\",\"openingCount\":2}]}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");
        UUID electionId = UUID.fromString(electionLocation.substring(electionLocation.lastIndexOf('/') + 1));
        List<UUID> positionIds = jdbcTemplate.query(
                "select id from election_positions where election_id = ? order by sequence",
                (result, row) -> result.getObject(1, UUID.class), electionId);
        UUID councilId = positionIds.get(0);
        UUID committeeId = positionIds.get(1);

        UUID thresholdRoundId = prepareRound(admin, electionId, committeeId, List.of("No Majority", "Other"));
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/start",
                        electionId, committeeId, thresholdRoundId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON).content("{\"expectedVoterCount\":4}"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/close",
                        electionId, committeeId, thresholdRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/reveal",
                        electionId, committeeId, thresholdRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk());
        UUID noMajorityId = jdbcTemplate.queryForObject(
                "select id from voting_round_candidates where round_id = ? and candidate_name = ?",
                UUID.class, thresholdRoundId, "No Majority");
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision",
                        electionId, committeeId, thresholdRoundId, noMajorityId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON).content("{\"decision\":\"ELECTED\",\"reason\":\"Selected\"}"))
                .andExpect(status().isConflict());

        UUID councilRoundId = prepareRound(admin, electionId, councilId,
                List.of("Alice", "Bob", "Carol", "David"), 3);
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/start",
                        electionId, councilId, councilRoundId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON).content("{\"expectedVoterCount\":4}"))
                .andExpect(status().isOk());
        UUID accessToken = jdbcTemplate.queryForObject(
                "select access_token from voting_rounds where id = ?", UUID.class, councilRoundId);
        Map<String, UUID> councilCandidates = new java.util.HashMap<>();
        jdbcTemplate.query("select id, candidate_name from voting_round_candidates where round_id = ?",
                (org.springframework.jdbc.core.RowCallbackHandler) result -> councilCandidates.put(
                        result.getString("candidate_name"), result.getObject("id", UUID.class)), councilRoundId);
        submitBallot(accessToken, UUID.randomUUID(), List.of(
                councilCandidates.get("Alice"), councilCandidates.get("Bob"), councilCandidates.get("Carol")));
        submitBallot(accessToken, UUID.randomUUID(), List.of(
                councilCandidates.get("Alice"), councilCandidates.get("Bob"), councilCandidates.get("David")));
        submitBallot(accessToken, UUID.randomUUID(), List.of(
                councilCandidates.get("Alice"), councilCandidates.get("Carol"), councilCandidates.get("David")));
        submitBallot(accessToken, UUID.randomUUID(), List.of(
                councilCandidates.get("Bob"), councilCandidates.get("Carol"), councilCandidates.get("David")));
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds",
                        electionId, councilId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("CLOSED"))
                .andExpect(jsonPath("$[0].closeReason").value("EXPECTED_COUNT"));
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/reveal",
                        electionId, councilId, councilRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.majorityThreshold").value(3))
                .andExpect(jsonPath("$.candidates[0].votes").value(3))
                .andExpect(jsonPath("$.candidates[1].votes").value(3))
                .andExpect(jsonPath("$.candidates[2].votes").value(3))
                .andExpect(jsonPath("$.candidates[3].votes").value(3));

        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision",
                        electionId, councilId, councilRoundId, councilCandidates.get("Alice"))
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"decision\":\"ELECTED\",\"reason\":\"Majority\"}"))
                .andExpect(status().isOk());
        for (String candidateName : List.of("Bob", "David")) {
            mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision",
                            electionId, councilId, councilRoundId, councilCandidates.get(candidateName))
                            .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                            .content("{\"decision\":\"ADVANCED\",\"reason\":\"Continue\"}"))
                    .andExpect(status().isOk());
        }
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds",
                        electionId, councilId).with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Bob\",\"David\"],\"selectionCount\":1}"))
                .andExpect(status().isCreated());

        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision",
                        electionId, councilId, councilRoundId, councilCandidates.get("Carol"))
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"decision\":\"ELECTED\",\"reason\":\"Majority\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision",
                        electionId, councilId, councilRoundId, councilCandidates.get("Bob"))
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"decision\":\"ELECTED\",\"reason\":\"Majority\"}"))
                .andExpect(status().isConflict());

        UUID laterRoundId = jdbcTemplate.queryForObject(
                "select id from voting_rounds where position_id = ? order by round_number desc limit 1",
                UUID.class, councilId);
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds",
                        electionId, councilId).with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Bob\"],\"selectionCount\":1}"))
                .andExpect(status().isConflict());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}",
                        electionId, councilId, laterRoundId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Bob\"],\"selectionCount\":1}"))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/start",
                        electionId, councilId, laterRoundId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON).content("{\"expectedVoterCount\":4}"))
                .andExpect(status().isConflict());
    }

    @Test
    void privateBallotsEnforceLifecycleRosterIsolationAndCutoffRules() throws Exception {
        String admin = "private-ballots-admin@example.org";
        String otherAdmin = "private-ballots-other@example.org";
        registerChurch(admin, "Private Ballots Church");
        registerChurch(otherAdmin, "Other Private Ballots Church");
        String electionLocation = mockMvc.perform(post("/api/elections").with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"departmentName\":\"Private Voting\",\"positions\":["
                                + "{\"name\":\"Even\",\"openingCount\":1},"
                                + "{\"name\":\"Odd\",\"openingCount\":1}]}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");
        UUID electionId = UUID.fromString(electionLocation.substring(electionLocation.lastIndexOf('/') + 1));
        UUID evenPositionId = jdbcTemplate.queryForObject(
                "select id from election_positions where election_id = ? and name = ?",
                UUID.class, electionId, "Even");
        UUID oddPositionId = jdbcTemplate.queryForObject(
                "select id from election_positions where election_id = ? and name = ?",
                UUID.class, electionId, "Odd");

        UUID evenRoundId = prepareRound(admin, electionId, evenPositionId, List.of("Alice", "Bob"));
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/progress",
                        electionId, evenPositionId, evenRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", aMapWithSize(4)))
                .andExpect(jsonPath("$.roundId").value(evenRoundId.toString()))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.ballotsCast").value(0))
                .andExpect(jsonPath("$.expectedVoterCount").value(org.hamcrest.Matchers.nullValue()));
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/start",
                        electionId, evenPositionId, evenRoundId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"expectedVoterCount\":0}"))
                .andExpect(status().isBadRequest());
        var started = mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/start",
                        electionId, evenPositionId, evenRoundId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"expectedVoterCount\":16}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.expectedVoterCount").value(16))
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.closeReason").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.total").doesNotExist())
                .andExpect(jsonPath("$.ballots").doesNotExist())
                .andReturn();
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/progress",
                        electionId, evenPositionId, evenRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", aMapWithSize(4)))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.ballotsCast").value(0))
                .andExpect(jsonPath("$.expectedVoterCount").value(16))
                .andExpect(jsonPath("$.deviceToken").doesNotExist())
                .andExpect(jsonPath("$.accessToken").doesNotExist())
                .andExpect(jsonPath("$.candidates").doesNotExist())
                .andExpect(jsonPath("$.choices").doesNotExist());
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/progress",
                        electionId, evenPositionId, UUID.randomUUID()).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/progress",
                        electionId, evenPositionId, evenRoundId).with(httpBasic(otherAdmin, PASSWORD)))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/reveal",
                        electionId, evenPositionId, evenRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isConflict());
        UUID accessToken = jdbcTemplate.queryForObject(
                "select access_token from voting_rounds where id = ?", UUID.class, evenRoundId);
        org.junit.jupiter.api.Assertions.assertTrue(started.getResponse().getContentAsString()
                .contains(accessToken.toString()));
        UUID aliceId = jdbcTemplate.queryForObject(
                "select id from voting_round_candidates where round_id = ? and candidate_name = ?",
                UUID.class, evenRoundId, "Alice");
        UUID bobId = jdbcTemplate.queryForObject(
                "select id from voting_round_candidates where round_id = ? and candidate_name = ?",
                UUID.class, evenRoundId, "Bob");

        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds",
                        electionId, evenPositionId).with(httpBasic(otherAdmin, PASSWORD)))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/close",
                        electionId, evenPositionId, evenRoundId).with(httpBasic(otherAdmin, PASSWORD)))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/reveal",
                        electionId, evenPositionId, evenRoundId).with(httpBasic(otherAdmin, PASSWORD)))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds",
                        electionId, evenPositionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].expectedVoterCount").value(16))
                .andExpect(jsonPath("$[0].accessToken").value(accessToken.toString()))
                .andExpect(jsonPath("$[0].total").doesNotExist())
                .andExpect(jsonPath("$[0].deviceToken").doesNotExist());

        UUID firstDevice = UUID.randomUUID();
        UUID secondDevice = UUID.randomUUID();
        mockMvc.perform(get("/api/polls/{token}", accessToken).header("X-Voting-Device-Token", firstDevice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", aMapWithSize(5)))
                .andExpect(jsonPath("$.departmentName").value("Private Voting"))
                .andExpect(jsonPath("$.positionName").value("Even"))
                .andExpect(jsonPath("$.selectionCount").value(1))
                .andExpect(jsonPath("$.candidates", hasSize(2)))
                .andExpect(jsonPath("$.submittedCandidateIds", hasSize(0)))
                .andExpect(jsonPath("$.total").doesNotExist())
                .andExpect(jsonPath("$.deviceToken").doesNotExist());
        mockMvc.perform(get("/api/polls/{token}", UUID.randomUUID())
                        .header("X-Voting-Device-Token", firstDevice))
                .andExpect(status().isNotFound());

        mockMvc.perform(put("/api/polls/{token}/ballot", accessToken)
                        .header("X-Voting-Device-Token", firstDevice).contentType(APPLICATION_JSON)
                        .content("{\"candidateIds\":[\"" + aliceId + "\",\"" + aliceId + "\"]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/polls/{token}/ballot", accessToken)
                        .header("X-Voting-Device-Token", firstDevice).contentType(APPLICATION_JSON)
                        .content("{\"candidateIds\":[\"" + UUID.randomUUID() + "\"]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/polls/{token}/ballot", accessToken)
                        .header("X-Voting-Device-Token", firstDevice).contentType(APPLICATION_JSON)
                        .content("{\"candidateIds\":[\"" + aliceId + "\",\"" + bobId + "\"]}"))
                .andExpect(status().isBadRequest());
        submitBallot(accessToken, firstDevice, aliceId);
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/progress",
                        electionId, evenPositionId, evenRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ballotsCast").value(1));
        submitBallot(accessToken, firstDevice, bobId);
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/progress",
                        electionId, evenPositionId, evenRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ballotsCast").value(1));
        mockMvc.perform(get("/api/polls/{token}", accessToken).header("X-Voting-Device-Token", firstDevice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submittedCandidateIds", hasSize(1)))
                .andExpect(jsonPath("$.submittedCandidateIds[0]").value(bobId.toString()));
        mockMvc.perform(get("/api/polls/{token}", accessToken).header("X-Voting-Device-Token", secondDevice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submittedCandidateIds", hasSize(0)));
        submitBallot(accessToken, secondDevice, aliceId);
        for (int voter = 3; voter <= 15; voter++) {
            submitBallot(accessToken, UUID.randomUUID(), voter % 2 == 0 ? aliceId : bobId);
        }
        assertEquals(15, jdbcTemplate.queryForObject(
                "select count(*) from voting_ballots where round_id = ?", Integer.class, evenRoundId));
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/progress",
                        electionId, evenPositionId, evenRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ballotsCast").value(15));
        mockMvc.perform(get("/api/polls/{token}", accessToken).header("X-Voting-Device-Token", firstDevice))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds",
                        electionId, evenPositionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("CLOSED"))
                .andExpect(jsonPath("$[0].closeReason").value("CUTOFF"))
                .andExpect(jsonPath("$[0].total").doesNotExist());
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/results",
                        electionId, evenPositionId, evenRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision",
                        electionId, evenPositionId, evenRoundId, aliceId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"decision\":\"ELECTED\",\"reason\":\"Plurality\"}"))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/reveal",
                        electionId, evenPositionId, evenRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", aMapWithSize(8)))
                .andExpect(jsonPath("$.roundId").value(evenRoundId.toString()))
                .andExpect(jsonPath("$.roundNumber").value(1))
                .andExpect(jsonPath("$.expectedVoterCount").value(16))
                .andExpect(jsonPath("$.ballotsCast").value(15))
                .andExpect(jsonPath("$.majorityThreshold").value(8))
                .andExpect(jsonPath("$.revealedAt").isNotEmpty())
                .andExpect(jsonPath("$.revealedBy").value(admin))
                .andExpect(jsonPath("$.candidates", hasSize(2)))
                .andExpect(jsonPath("$.candidates[0].name").value("Alice"))
                .andExpect(jsonPath("$.candidates[0].votes").value(7))
                .andExpect(jsonPath("$.candidates[1].name").value("Bob"))
                .andExpect(jsonPath("$.candidates[1].votes").value(8))
                .andExpect(jsonPath("$.deviceToken").doesNotExist())
                .andExpect(jsonPath("$.ballots").doesNotExist())
                .andExpect(jsonPath("$.candidates[0].ballotId").doesNotExist())
                .andReturn();
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/reveal",
                        electionId, evenPositionId, evenRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isConflict());
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/results",
                        electionId, evenPositionId, evenRoundId).with(httpBasic(otherAdmin, PASSWORD)))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/results",
                        electionId, evenPositionId, evenRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ballotsCast").value(15))
                .andExpect(jsonPath("$.candidates[0].votes").value(7));
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision",
                        electionId, evenPositionId, evenRoundId, aliceId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"decision\":\"ELECTED\",\"reason\":\"Plurality\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidates[0].decision").value("ELECTED"))
                .andExpect(jsonPath("$.candidates[0].decisionReason").value("Plurality"))
                .andExpect(jsonPath("$.candidates[0].decisionBy").value(admin))
                .andExpect(jsonPath("$.candidates[0].decisionAt").isNotEmpty());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision",
                        electionId, evenPositionId, evenRoundId, aliceId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"decision\":\"ELIMINATED\",\"reason\":\"Reconsidered\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidates[0].decision").value("ELIMINATED"))
                .andExpect(jsonPath("$.candidates[0].decisionReason").value("Reconsidered"));
        assertEquals(2, jdbcTemplate.queryForObject(
                "select count(*) from voting_round_candidate_decision_events where round_id = ? and candidate_id = ?",
                Integer.class, evenRoundId, aliceId));
        assertEquals(1, jdbcTemplate.queryForObject("""
                select count(*) from voting_round_candidate_decision_events
                where round_id = ? and candidate_id = ? and decision = 'ELECTED'
                    and reason = 'Plurality' and decided_by = ? and decided_at is not null
                """, Integer.class, evenRoundId, aliceId, admin));
        assertEquals(1, jdbcTemplate.queryForObject("""
                select count(*) from voting_round_candidate_decision_events
                where round_id = ? and candidate_id = ? and decision = 'ELIMINATED'
                    and reason = 'Reconsidered' and decided_by = ? and decided_at is not null
                """, Integer.class, evenRoundId, aliceId, admin));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from voting_round_candidate_decisions where round_id = ? and candidate_id = ?",
                Integer.class, evenRoundId, aliceId));
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision",
                        electionId, evenPositionId, evenRoundId, UUID.randomUUID()).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"decision\":\"ADVANCED\",\"reason\":\"Not in round\"}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision",
                        electionId, evenPositionId, evenRoundId, aliceId).with(httpBasic(otherAdmin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"decision\":\"ADVANCED\",\"reason\":\"Foreign admin\"}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision",
                        electionId, evenPositionId, evenRoundId, bobId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"decision\":\"ADVANCED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidates[1].decision").value("ADVANCED"))
                .andExpect(jsonPath("$.candidates[1].decisionReason").value(org.hamcrest.Matchers.nullValue()));
        assertEquals(1, jdbcTemplate.queryForObject("""
                select count(*) from voting_round_candidate_decision_events
                where round_id = ? and candidate_id = ? and decision = 'ADVANCED' and reason is null
                """, Integer.class, evenRoundId, bobId));

        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/reopen",
                        electionId, evenPositionId, evenRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.closeReason").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.total").doesNotExist());
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/results",
                        electionId, evenPositionId, evenRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isNotFound());
        assertEquals(2, jdbcTemplate.queryForObject(
                "select count(*) from voting_round_candidate_decision_events where round_id = ? and candidate_id = ?",
                Integer.class, evenRoundId, aliceId));
        submitBallot(accessToken, firstDevice, aliceId);
        mockMvc.perform(get("/api/polls/{token}", accessToken).header("X-Voting-Device-Token", firstDevice))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/close",
                        electionId, evenPositionId, evenRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.closeReason").value("ADMIN"))
                .andExpect(jsonPath("$.total").doesNotExist());
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/results",
                        electionId, evenPositionId, evenRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/reveal",
                        electionId, evenPositionId, evenRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidates[0].decision").value("ELIMINATED"))
                .andExpect(jsonPath("$.candidates[0].decisionReason").value("Reconsidered"));
        mockMvc.perform(get("/api/polls/{token}", accessToken).header("X-Voting-Device-Token", firstDevice))
                .andExpect(status().isNotFound());

        UUID oddRoundId = prepareRound(admin, electionId, oddPositionId, List.of("Red", "Blue"));
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/start",
                        electionId, oddPositionId, oddRoundId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"expectedVoterCount\":5}"))
                .andExpect(status().isOk());
        UUID oddToken = jdbcTemplate.queryForObject(
                "select access_token from voting_rounds where id = ?", UUID.class, oddRoundId);
        UUID redId = jdbcTemplate.queryForObject(
                "select id from voting_round_candidates where round_id = ? and candidate_name = ?",
                UUID.class, oddRoundId, "Red");
        UUID expectedCountDevice = UUID.randomUUID();
        submitBallot(oddToken, expectedCountDevice, redId);
        submitBallot(oddToken, expectedCountDevice, redId);
        for (int voter = 0; voter < 3; voter++) {
            submitBallot(oddToken, UUID.randomUUID(), redId);
        }
        assertEquals(4, jdbcTemplate.queryForObject(
                "select count(*) from voting_ballots where round_id = ?", Integer.class, oddRoundId));
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds",
                        electionId, oddPositionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
        submitBallot(oddToken, UUID.randomUUID(), redId);
        assertEquals(5, jdbcTemplate.queryForObject(
                "select count(*) from voting_ballots where round_id = ?", Integer.class, oddRoundId));
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds",
                        electionId, oddPositionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("CLOSED"))
                .andExpect(jsonPath("$[0].closeReason").value("EXPECTED_COUNT"));
        mockMvc.perform(put("/api/polls/{token}/ballot", oddToken)
                        .header("X-Voting-Device-Token", UUID.randomUUID()).contentType(APPLICATION_JSON)
                        .content("{\"candidateIds\":[\"" + redId + "\"]}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/reopen",
                        electionId, oddPositionId, oddRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
        submitBallot(oddToken, expectedCountDevice, redId);
        assertEquals(5, jdbcTemplate.queryForObject(
                "select count(*) from voting_ballots where round_id = ?", Integer.class, oddRoundId));
        mockMvc.perform(put("/api/polls/{token}/ballot", oddToken)
                        .header("X-Voting-Device-Token", UUID.randomUUID()).contentType(APPLICATION_JSON)
                        .content("{\"candidateIds\":[\"" + redId + "\"]}"))
                .andExpect(status().isConflict());
        assertEquals(5, jdbcTemplate.queryForObject(
                "select count(*) from voting_ballots where round_id = ?", Integer.class, oddRoundId));
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/rounds",
                        electionId, oddPositionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/close",
                        electionId, oddPositionId, oddRoundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.closeReason").value("ADMIN"));
    }

    @Test
    void eliminatedCandidateDecisionCanBeUndoneWithImmutableAuditAndTenantAuthorization() throws Exception {
        String admin = "undo-decision-admin@example.org";
        String otherAdmin = "undo-decision-other@example.org";
        registerChurch(admin, "Undo Decision Church");
        registerChurch(otherAdmin, "Other Undo Decision Church");

        String electionLocation = mockMvc.perform(post("/api/elections").with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"departmentName\":\"Undo Decisions\",\"positions\":["
                                + "{\"name\":\"Elder\",\"openingCount\":1}]}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");
        UUID electionId = UUID.fromString(electionLocation.substring(electionLocation.lastIndexOf('/') + 1));
        UUID positionId = jdbcTemplate.queryForObject(
                "select id from election_positions where election_id = ?", UUID.class, electionId);
        UUID roundId = prepareRound(admin, electionId, positionId,
                List.of("Eliminated", "Advanced", "Elected", "Undecided"));
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/start",
                        electionId, positionId, roundId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON).content("{\"expectedVoterCount\":1}"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/close",
                        electionId, positionId, roundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/reveal",
                        electionId, positionId, roundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk());

        UUID eliminatedId = jdbcTemplate.queryForObject(
                "select id from voting_round_candidates where round_id = ? and candidate_name = ?",
                UUID.class, roundId, "Eliminated");
        UUID advancedId = jdbcTemplate.queryForObject(
                "select id from voting_round_candidates where round_id = ? and candidate_name = ?",
                UUID.class, roundId, "Advanced");
        UUID electedId = jdbcTemplate.queryForObject(
                "select id from voting_round_candidates where round_id = ? and candidate_name = ?",
                UUID.class, roundId, "Elected");
        UUID undecidedId = jdbcTemplate.queryForObject(
                "select id from voting_round_candidates where round_id = ? and candidate_name = ?",
                UUID.class, roundId, "Undecided");
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision",
                        electionId, positionId, roundId, eliminatedId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON).content("{\"decision\":\"ELIMINATED\",\"reason\":\"Not selected\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision",
                        electionId, positionId, roundId, advancedId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON).content("{\"decision\":\"ADVANCED\",\"reason\":\"Proceed\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision",
                        electionId, positionId, roundId, electedId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON).content("{\"decision\":\"ELECTED\",\"reason\":\"Selected\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision/undo",
                        electionId, positionId, roundId, eliminatedId).with(httpBasic(otherAdmin, PASSWORD)))
                .andExpect(status().isNotFound());
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from voting_round_candidate_decisions where round_id = ? and candidate_id = ?",
                Integer.class, roundId, eliminatedId));

        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision/undo",
                        electionId, positionId, roundId, eliminatedId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidates[0].decision").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.candidates[1].decision").value("ADVANCED"))
                .andExpect(jsonPath("$.candidates[2].decision").value("ELECTED"))
                .andExpect(jsonPath("$.candidates[3].decision").value(org.hamcrest.Matchers.nullValue()));
        assertEquals(0, jdbcTemplate.queryForObject(
                "select count(*) from voting_round_candidate_decisions where round_id = ? and candidate_id = ?",
                Integer.class, roundId, eliminatedId));
        assertEquals(2, jdbcTemplate.queryForObject(
                "select count(*) from voting_round_candidate_decision_events where round_id = ? and candidate_id = ?",
                Integer.class, roundId, eliminatedId));
        assertEquals(1, jdbcTemplate.queryForObject("""
                select count(*) from voting_round_candidate_decision_events
                where round_id = ? and candidate_id = ? and decision = 'ELIMINATED' and reason = 'Not selected'
                """, Integer.class, roundId, eliminatedId));
        assertEquals(1, jdbcTemplate.queryForObject("""
                select count(*) from voting_round_candidate_decision_events
                where round_id = ? and candidate_id = ? and decision = 'UNDONE'
                    and reason = 'Undid ELIMINATED decision: Not selected' and decided_by = ?
                    and decided_at is not null
                """, Integer.class, roundId, eliminatedId, admin));

        for (UUID candidateId : List.of(advancedId, electedId, undecidedId)) {
            mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/candidates/{candidateId}/decision/undo",
                            electionId, positionId, roundId, candidateId).with(httpBasic(admin, PASSWORD)))
                    .andExpect(status().isConflict());
        }
        assertThrows(DataIntegrityViolationException.class, () -> jdbcTemplate.update("""
                insert into voting_round_candidate_decisions
                    (round_id, candidate_id, decision, reason, decided_at, decided_by)
                values (?, ?, 'UNDONE', 'Must not be a current decision', current_timestamp, ?)
                """, roundId, eliminatedId, admin));
    }

    @Test
    void resettingClosedRoundClearsBallotsAndCurrentDecisionsButPreservesRosterAndAudit() throws Exception {
        String admin = "round-reset-admin@example.org";
        registerChurch(admin, "Round Reset Church");
        UUID positionId = createElection(admin, "Round Reset Election", List.of("Chair")).get(0);
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations",
                        electionIdFor(positionId), positionId).with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON).content("{\"nameLimit\":1}"))
                .andExpect(status().isCreated());
        UUID intakeId = jdbcTemplate.queryForObject(
                "select id from nomination_intakes where position_id = ?", UUID.class, positionId);
        UUID candidateNominationId = UUID.randomUUID();
        jdbcTemplate.update("insert into nomination_consolidated_names (id, intake_id, sequence, candidate_name, active) "
                + "values (?, ?, 1, 'Alice', true)", candidateNominationId, intakeId);
        jdbcTemplate.update("update nomination_intakes set status = 'CLOSED', list_created_at = current_timestamp, "
                + "list_created_by = ?, list_contributor_count = 0 where id = ?", admin, intakeId);
        UUID roundId = seedRound(positionId, 1, "CLOSED");
        jdbcTemplate.update("update voting_rounds set nomination_revision = 0 where id = ?", roundId);
        UUID candidateId = seedCandidate(roundId, "Alice", 1);
        UUID ballotId = UUID.randomUUID();
        jdbcTemplate.update("insert into voting_ballots (id, round_id, device_token) values (?, ?, ?)",
                ballotId, roundId, UUID.randomUUID());
        jdbcTemplate.update("""
                insert into voting_ballot_choices (id, round_id, ballot_id, candidate_id)
                values (?, ?, ?, ?)
                """, UUID.randomUUID(), roundId, ballotId, candidateId);
        jdbcTemplate.update("""
                insert into voting_round_candidate_decisions
                    (round_id, candidate_id, decision, reason, decided_at, decided_by)
                values (?, ?, 'ELECTED', 'Selected', current_timestamp, ?)
                """, roundId, candidateId, admin);
        jdbcTemplate.update("""
                insert into voting_round_candidate_decision_events
                    (id, round_id, candidate_id, decision, reason, decided_at, decided_by)
                values (?, ?, ?, 'ELECTED', 'Selected', current_timestamp, ?)
                """, UUID.randomUUID(), roundId, candidateId, admin);
        UUID oldAccessToken = jdbcTemplate.queryForObject(
                "select access_token from voting_rounds where id = ?", UUID.class, roundId);

        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/reset",
                        electionIdFor(positionId), positionId, roundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(roundId.toString()))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.selectionCount").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.expectedVoterCount").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.accessToken").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.closeReason").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.resetCount").value(1))
                .andExpect(jsonPath("$.candidates", hasSize(1)))
                .andExpect(jsonPath("$.candidates[0].id").value(candidateId.toString()))
                .andExpect(jsonPath("$.candidates[0].name").value("Alice"));

        assertEquals(0, jdbcTemplate.queryForObject(
                "select count(*) from voting_ballots where round_id = ?", Integer.class, roundId));
        assertEquals(0, jdbcTemplate.queryForObject(
                "select count(*) from voting_ballot_choices where round_id = ?", Integer.class, roundId));
        assertEquals(0, jdbcTemplate.queryForObject(
                "select count(*) from voting_round_candidate_decisions where round_id = ?", Integer.class, roundId));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from voting_round_candidate_decision_events where round_id = ?",
                Integer.class, roundId));
        assertEquals(admin, jdbcTemplate.queryForObject(
                "select reset_by from voting_round_reset_events where round_id = ?", String.class, roundId));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from voting_round_reset_events where round_id = ? and reset_at is not null",
                Integer.class, roundId));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from voting_round_candidates where round_id = ? and id = ? and candidate_name = ?",
                Integer.class, roundId, candidateId, "Alice"));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from voting_rounds where id = ? and access_token is null and reset_count = 1",
                Integer.class, roundId));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from voting_rounds where id = ? and revealed_at is null and revealed_by is null",
                Integer.class, roundId));
        assertEquals(0, jdbcTemplate.queryForObject(
                "select count(*) from voting_rounds where access_token = ?", Integer.class, oldAccessToken));

        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/reset",
                        electionIdFor(positionId), positionId, roundId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isConflict());
    }

    @Test
        void resettingRejectsNonClosedRoundsAndRoundsWithAnyLaterRound() throws Exception {
        String admin = "round-reset-guard-admin@example.org";
        registerChurch(admin, "Round Reset Guard Church");
        List<UUID> positions = createElection(admin, "Round Reset Guard Election",
                List.of("Chair", "Treasurer", "Secretary", "Deacon"));
        UUID draftRoundId = seedRound(positions.get(0), 1, "DRAFT");
        UUID activeRoundId = seedRound(positions.get(1), 1, "CLOSED");
        UUID laterActiveRoundId = seedRound(positions.get(1), 2, "ACTIVE");
        UUID closedRoundId = seedRound(positions.get(2), 1, "CLOSED");
        UUID laterClosedRoundId = seedRound(positions.get(2), 2, "CLOSED");
        UUID closedBeforeDraftRoundId = seedRound(positions.get(3), 1, "CLOSED");
        UUID laterDraftRoundId = seedRound(positions.get(3), 2, "DRAFT");

        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/reset",
                        electionIdFor(positions.get(0)), positions.get(0), draftRoundId)
                        .with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/reset",
                        electionIdFor(positions.get(1)), positions.get(1), activeRoundId)
                        .with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/reset",
                        electionIdFor(positions.get(2)), positions.get(2), closedRoundId)
                        .with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds/{roundId}/reset",
                        electionIdFor(positions.get(3)), positions.get(3), closedBeforeDraftRoundId)
                        .with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isConflict());

        assertEquals(0, jdbcTemplate.queryForObject("""
                select count(*) from voting_round_reset_events
                where round_id in (?, ?, ?, ?)
                """, Integer.class, draftRoundId, activeRoundId, closedRoundId, closedBeforeDraftRoundId));
        assertEquals("ACTIVE", jdbcTemplate.queryForObject(
                "select status from voting_rounds where id = ?", String.class, laterActiveRoundId));
        assertEquals("CLOSED", jdbcTemplate.queryForObject(
                "select status from voting_rounds where id = ?", String.class, laterClosedRoundId));
        assertEquals("DRAFT", jdbcTemplate.queryForObject(
                "select status from voting_rounds where id = ?", String.class, laterDraftRoundId));
    }

    private List<UUID> createElection(String admin, String departmentName, List<String> positionNames)
            throws Exception {
        String positionsJson = positionNames.stream()
                .map(name -> "{\"name\":\"" + name + "\",\"openingCount\":1}")
                .collect(java.util.stream.Collectors.joining(","));
        String location = mockMvc.perform(post("/api/elections").with(httpBasic(admin, PASSWORD))
                        .contentType(APPLICATION_JSON)
                        .content("{\"departmentName\":\"" + departmentName + "\",\"positions\":["
                                + positionsJson + "]}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");
        UUID electionId = UUID.fromString(location.substring(location.lastIndexOf('/') + 1));
        return jdbcTemplate.query("select id from election_positions where election_id = ? order by sequence",
                (result, row) -> result.getObject(1, UUID.class), electionId);
    }

    private UUID electionIdFor(UUID positionId) {
        return jdbcTemplate.queryForObject("""
                select election_id from election_positions where id = ?
                """, UUID.class, positionId);
    }

    private UUID seedRound(UUID positionId, int roundNumber, String status) {
        UUID roundId = UUID.randomUUID();
        UUID draftPositionId = null;
        UUID activePositionId = "ACTIVE".equals(status) ? positionId : null;
        Integer expectedVoterCount = "DRAFT".equals(status) ? null : 2;
        UUID accessToken = "DRAFT".equals(status) ? null : UUID.randomUUID();
        String closeReason = "CLOSED".equals(status) ? "ADMIN" : null;
        java.sql.Timestamp revealedAt = "CLOSED".equals(status)
                ? java.sql.Timestamp.from(java.time.Instant.now()) : null;
        String revealedBy = revealedAt == null ? null : "round-reset-test@example.org";
        jdbcTemplate.update("""
                insert into voting_rounds
                    (id, position_id, draft_position_id, active_position_id, round_number, status,
                     selection_count, expected_voter_count, access_token, close_reason, cutoff_overridden,
                                 revealed_at, revealed_by, reset_count)
                         values (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, false, ?, ?, 0)
                """, roundId, positionId, draftPositionId, activePositionId, roundNumber, status,
                expectedVoterCount, accessToken, closeReason, revealedAt, revealedBy);
        return roundId;
    }

    private UUID seedCandidate(UUID roundId, String name, int sequence) {
        UUID candidateId = UUID.randomUUID();
        jdbcTemplate.update("""
                insert into voting_round_candidates (id, round_id, candidate_name, sequence)
                values (?, ?, ?, ?)
                """, candidateId, roundId, name, sequence);
        return candidateId;
    }

    private void registerChurch(String admin, String churchName) throws Exception {
        mockMvc.perform(post("/api/auth/register").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + admin + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/churches").with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"name\":\"" + churchName + "\"}"))
                .andExpect(status().isCreated());
    }

    private UUID prepareRound(String admin, UUID electionId, UUID positionId, List<String> names) throws Exception {
        return prepareRound(admin, electionId, positionId, names, 1);
    }

    private UUID prepareRound(
            String admin, UUID electionId, UUID positionId, List<String> names, int selectionCount) throws Exception {
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                                                .content("{\"nameLimit\":" + names.size() + "}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getHeader("Location");
        UUID accessToken = jdbcTemplate.queryForObject(
                "select access_token from nomination_intakes where position_id = ?", UUID.class, positionId);
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header("X-Nomination-Device-Token", UUID.randomUUID())
                        .contentType(APPLICATION_JSON)
                        .content("{\"names\":[" + names.stream().map(name -> "\"" + name + "\"")
                                .collect(java.util.stream.Collectors.joining(",")) + "]}"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations/close",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations/reveal",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk());
        String location = mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/rounds",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[" + names.stream()
                                .map(name -> "\"" + name + "\"").collect(java.util.stream.Collectors.joining(","))
                                + "],\"selectionCount\":" + selectionCount + "}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");
        return UUID.fromString(location.substring(location.lastIndexOf('/') + 1));
    }

    private void submitBallot(UUID accessToken, UUID deviceToken, UUID candidateId) throws Exception {
        submitBallot(accessToken, deviceToken, List.of(candidateId));
    }

    private void submitBallot(UUID accessToken, UUID deviceToken, List<UUID> candidateIds) throws Exception {
        mockMvc.perform(put("/api/polls/{token}/ballot", accessToken)
                        .header("X-Voting-Device-Token", deviceToken).contentType(APPLICATION_JSON)
                        .content("{\"candidateIds\":[" + candidateIds.stream()
                                .map(candidateId -> "\"" + candidateId + "\"")
                                .collect(java.util.stream.Collectors.joining(",")) + "]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", aMapWithSize(1)))
                .andExpect(jsonPath("$.submitted").value(true));
    }
}