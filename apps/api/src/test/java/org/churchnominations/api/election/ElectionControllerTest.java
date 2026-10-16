package org.churchnominations.api.election;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.churchnominations.api.church.ChurchRepository;
import org.churchnominations.api.identity.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
}