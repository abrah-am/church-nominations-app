package org.churchnominations.api.election;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.ActiveProfiles;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NonDevElectionSecurityTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void deniesAllElectionRoutesOutsideDevProfile() throws Exception {
        mockMvc.perform(get("/api/elections")).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/elections")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"departmentName\":\"Worship\",\"positions\":[{\"name\":\"Director\",\"openingCount\":1}]}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/elections/{id}", "11111111-1111-1111-1111-111111111111"))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/elections/{id}", "11111111-1111-1111-1111-111111111111")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"departmentName\":\"Worship\",\"positions\":[{\"name\":\"Director\",\"openingCount\":1}]}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"disabled@example.org\",\"password\":\"test-password\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/auth/me")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/churches/my")).andExpect(status().isForbidden());
    }

        @Test
        void permitsOnlyPublicNominationReadAndWriteRoutesOutsideDevProfile() throws Exception {
                String token = "11111111-1111-1111-1111-111111111111";
                mockMvc.perform(get("/api/nomination-intakes/{token}", token)
                                                .header("X-Nomination-Device-Token", token))
                                .andExpect(status().isNotFound());
                mockMvc.perform(put("/api/nomination-intakes/{token}/submission", token)
                                                .header("X-Nomination-Device-Token", token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content("{\"names\":[\"Nominee\"]}"))
                                .andExpect(status().isNotFound());
                mockMvc.perform(post("/api/nomination-intakes/{token}/submission", token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content("{\"names\":[\"Nominee\"]}"))
                                .andExpect(status().isForbidden());
                        mockMvc.perform(get("/api/polls/{token}", token)
                                                        .header("X-Voting-Device-Token", token))
                                        .andExpect(status().isNotFound());
                        mockMvc.perform(put("/api/polls/{token}/ballot", token)
                                                        .header("X-Voting-Device-Token", token)
                                                        .contentType(MediaType.APPLICATION_JSON)
                                                        .content("{\"candidateIds\":[\"" + token + "\"]}"))
                                        .andExpect(status().isNotFound());
                        mockMvc.perform(post("/api/polls/{token}/ballot", token)
                                                        .contentType(MediaType.APPLICATION_JSON)
                                                        .content("{\"candidateIds\":[\"" + token + "\"]}"))
                                        .andExpect(status().isForbidden());
        }
}