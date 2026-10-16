package org.churchnominations.api.election;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.hamcrest.Matchers.aMapWithSize;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
        assertEquals(1, v1Migration);
        assertEquals(1, v2Migration);
        assertEquals(1, v3Migration);
        assertEquals(1, v4Migration);

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
                .andExpect(jsonPath("$", aMapWithSize(6)))
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.nameLimit").value(2))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.submissions", hasSize(0)))
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
                        .contentType(APPLICATION_JSON).content("{\"names\":[\"Carol\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submittedNames", hasSize(1)))
                .andExpect(jsonPath("$.submittedNames[0]").value("Carol"));
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header("X-Nomination-Device-Token", secondDeviceToken)
                        .contentType(APPLICATION_JSON).content("{\"names\":[\"Dana\"]}"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/nomination-intakes/{accessToken}", accessToken)
                        .header("X-Nomination-Device-Token", deviceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submittedNames", hasSize(1)))
                .andExpect(jsonPath("$.submittedNames[0]").value("Carol"))
                .andExpect(jsonPath("$.deviceToken").doesNotExist())
                .andExpect(jsonPath("$.sourceId").doesNotExist())
                .andExpect(jsonPath("$.actorId").doesNotExist());
        mockMvc.perform(get("/api/nomination-intakes/{accessToken}", accessToken)
                        .header("X-Nomination-Device-Token", secondDeviceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submittedNames", hasSize(1)))
                .andExpect(jsonPath("$.submittedNames[0]").value("Dana"));
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header("X-Nomination-Device-Token", deviceToken)
                        .contentType(APPLICATION_JSON).content("{\"names\":[\"One\",\"Two\",\"Three\"]}"))
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

        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations/close",
                        electionId, positionId).with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.submissions[*].name").value(containsInAnyOrder("Carol", "Dana")))
                .andExpect(jsonPath("$.submissions[0].deviceToken").doesNotExist())
                .andExpect(jsonPath("$.submissions[0].sourceId").doesNotExist());
        mockMvc.perform(get("/api/nomination-intakes/{accessToken}", accessToken)
                        .header("X-Nomination-Device-Token", deviceToken))
                .andExpect(status().isGone());
        mockMvc.perform(put("/api/nomination-intakes/{accessToken}/submission", accessToken)
                        .header("X-Nomination-Device-Token", deviceToken)
                        .contentType(APPLICATION_JSON).content("{\"names\":[\"Late\"]}"))
                .andExpect(status().isGone());
        mockMvc.perform(post("/api/elections/{electionId}/positions/{positionId}/nominations", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON).content("{\"nameLimit\":2}"))
                .andExpect(status().isConflict());

        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/nominations/consolidation",
                        electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Alice\",\"carol\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", aMapWithSize(1)))
                .andExpect(jsonPath("$.candidateNames[0]").value("Alice"))
                .andExpect(jsonPath("$.candidateNames[1]").value("carol"));
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/nominations/consolidation",
                        electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Final Name\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidateNames[0]").value("Final Name"));
        mockMvc.perform(get("/api/elections/{electionId}/positions/{positionId}/nominations", electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consolidatedNames[0]").value("Final Name"))
                .andExpect(jsonPath("$.submissions[0]", aMapWithSize(2)))
                .andExpect(jsonPath("$.submissions[0].actorId").doesNotExist());
        mockMvc.perform(put("/api/elections/{electionId}/positions/{positionId}/nominations/consolidation",
                        electionId, positionId)
                        .with(httpBasic(admin, PASSWORD)).contentType(APPLICATION_JSON)
                        .content("{\"candidateNames\":[\"Same\",\" same \"]}"))
                .andExpect(status().isBadRequest());
    }
}