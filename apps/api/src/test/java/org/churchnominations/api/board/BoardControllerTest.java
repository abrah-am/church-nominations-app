package org.churchnominations.api.board;

import org.churchnominations.api.church.ChurchRepository;
import org.churchnominations.api.identity.AccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.profiles.active=dev")
@AutoConfigureMockMvc
@Transactional
class BoardControllerTest {
    private static final String ADMIN = "board-admin@example.org";
    private static final String OTHER_ADMIN = "board-other-admin@example.org";
    private static final String PASSWORD = "test-password-123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BoardRepository boards;

    @Autowired
    private ChurchRepository churches;

    @Autowired
    private AccountRepository accounts;

    @BeforeEach
    void resetAndRegisterAdmins() throws Exception {
        boards.deleteAll();
        churches.deleteAll();
        accounts.deleteAll();
        registerAdmin(ADMIN, "Board Church");
        registerAdmin(OTHER_ADMIN, "Other Board Church");
    }

    @Test
    void createsListsAndLoadsBoardsInDescendingYearOrder() throws Exception {
        String boardId = createBoard(2025, "Avery", "Jordan");
        createBoard(2027, "Casey");
        UUID churchId = churches.findByAdminAccountEmail(ADMIN).orElseThrow().getId();

        mockMvc.perform(get("/api/boards").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].year").value(2027))
                .andExpect(jsonPath("$[1].year").value(2025));
        mockMvc.perform(get("/api/boards/{id}", boardId).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.churchId").value(churchId.toString()))
                .andExpect(jsonPath("$.year").value(2025))
                .andExpect(jsonPath("$.members", hasSize(2)))
                .andExpect(jsonPath("$.members[0].id").isNotEmpty())
                .andExpect(jsonPath("$.sessions", hasSize(0)));
    }

    @Test
    void validatesYearAndMemberNamesAndEnforcesOneBoardPerChurchYear() throws Exception {
        String[] invalidRequests = {
                "{\"year\":0,\"members\":[{\"name\":\"Avery\"}]}",
                "{\"year\":2025}",
                "{\"year\":2025,\"members\":[]}",
                "{\"year\":2025,\"members\":[null]}",
                "{\"year\":2025,\"members\":[{\"name\":\" \"}]}"
        };
        for (String request : invalidRequests) {
            mockMvc.perform(post("/api/boards").with(admin())
                            .contentType(MediaType.APPLICATION_JSON).content(request))
                    .andExpect(status().isBadRequest());
        }
        createBoard(2025, "Avery");
        mockMvc.perform(post("/api/boards").with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"year\":2025,\"members\":[{\"name\":\"Jordan\"}]}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("board_already_exists"));
        createBoardAsOtherAdmin(2025);
    }

    @Test
    void scopesBoardDetailsToTheAuthenticatedChurch() throws Exception {
        String foreignBoardId = createBoardAsOtherAdmin(2025);

        mockMvc.perform(get("/api/boards/{id}", foreignBoardId).with(admin()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/boards/{id}", UUID.randomUUID()).with(admin()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/boards").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(get("/api/boards")).andExpect(status().isUnauthorized());
    }

    @Test
    void createsSessionAndReplacesAttendanceAndRejectsForeignMemberIds() throws Exception {
        String boardId = createBoard(2025, "Avery", "Jordan");
        String otherBoardId = createBoard(2026, "Casey");
        Board board = boards.findById(UUID.fromString(boardId)).orElseThrow();
        UUID firstMemberId = board.getMembers().get(0).getId();
        UUID secondMemberId = board.getMembers().get(1).getId();
        mockMvc.perform(post("/api/boards/{id}/sessions", boardId).with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionDate\":\"2025-06-15\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionDate").value("2025-06-15"))
                .andExpect(jsonPath("$.attendedMemberIds", hasSize(0)))
                .andReturn();
        String sessionId = boards.findById(UUID.fromString(boardId)).orElseThrow()
                .getSessions().get(0).getId().toString();

        mockMvc.perform(put("/api/boards/{id}/sessions/{sessionId}/attendance", boardId, sessionId)
                        .with(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"attendedMemberIds\":[\"" + firstMemberId + "\",\"" + secondMemberId + "\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attendedMemberIds", hasSize(2)));
        mockMvc.perform(put("/api/boards/{id}/sessions/{sessionId}/attendance", boardId, sessionId)
                        .with(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"attendedMemberIds\":[\"" + secondMemberId + "\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attendedMemberIds", hasSize(1)))
                .andExpect(jsonPath("$.attendedMemberIds[0]").value(secondMemberId.toString()));

        UUID foreignMemberId = boards.findById(UUID.fromString(otherBoardId)).orElseThrow()
                .getMembers().get(0).getId();
        mockMvc.perform(put("/api/boards/{id}/sessions/{sessionId}/attendance", boardId, sessionId)
                        .with(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"attendedMemberIds\":[\"" + foreignMemberId + "\"]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/boards/{id}/sessions", boardId).with(admin())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"sessionDate\":\"not-a-date\"}"))
                .andExpect(status().isBadRequest());
    }

    private String createBoard(int year, String... names) throws Exception {
        String members = java.util.Arrays.stream(names)
                .map(name -> "{\"name\":\"" + name + "\"}")
                .collect(java.util.stream.Collectors.joining(","));
        mockMvc.perform(post("/api/boards").with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"year\":" + year + ",\"members\":[" + members + "]}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.members", hasSize(names.length)))
                .andExpect(jsonPath("$.sessions", hasSize(0)));
        UUID churchId = churches.findByAdminAccountEmail(ADMIN).orElseThrow().getId();
        return boards.findAllByChurchIdOrderByYearDescIdAsc(churchId).stream()
                .filter(board -> board.getYear() == year).findFirst().orElseThrow().getId().toString();
    }

    private String createBoardAsOtherAdmin(int year) throws Exception {
        mockMvc.perform(post("/api/boards").with(httpBasic(OTHER_ADMIN, PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"year\":" + year + ",\"members\":[{\"name\":\"Taylor\"}]}"))
                .andExpect(status().isCreated())
                .andReturn();
        UUID churchId = churches.findByAdminAccountEmail(OTHER_ADMIN).orElseThrow().getId();
        return boards.findAllByChurchIdOrderByYearDescIdAsc(churchId).getFirst().getId().toString();
    }

    private void registerAdmin(String email, String churchName) throws Exception {
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/churches").with(httpBasic(email, PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"" + churchName + "\"}"))
                .andExpect(status().isCreated());
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor admin() {
        return httpBasic(ADMIN, PASSWORD);
    }

}