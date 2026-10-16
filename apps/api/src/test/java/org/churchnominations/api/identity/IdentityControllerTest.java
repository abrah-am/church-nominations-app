package org.churchnominations.api.identity;

import org.churchnominations.api.church.ChurchRepository;
import org.churchnominations.api.election.ElectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.profiles.active=dev")
@AutoConfigureMockMvc
class IdentityControllerTest {
    private static final String PASSWORD = "valid-password-123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accounts;

    @Autowired
    private ChurchRepository churches;

    @Autowired
    private ElectionRepository elections;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void clearDatabase() {
        elections.deleteAll();
        churches.deleteAll();
        accounts.deleteAll();
    }

    @Test
    void registersWithBcryptAndReturnsOnlySafeAccountData() throws Exception {
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(request("New.User@Example.org", PASSWORD)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.email").value("new.user@example.org"))
                .andExpect(jsonPath("$.church").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        Account saved = accounts.findByEmail("new.user@example.org").orElseThrow();
        assertNotEquals(PASSWORD, saved.getPasswordHash());
        assertTrue(passwordEncoder.matches(PASSWORD, saved.getPasswordHash()));
    }

    @Test
    void rejectsDuplicateAndInvalidRegistrationsWithoutReturningCredentials() throws Exception {
        register("duplicate@example.org");
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(request("DUPLICATE@example.org", PASSWORD)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("account_already_exists"))
                .andExpect(jsonPath("$.password").doesNotExist());

        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(request("not-an-email", "short")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("validation_failed"));
    }

    @Test
    void allowsRegisteredAuthenticationButRequiresChurchAdminForElections() throws Exception {
        String email = "auth@example.org";
        register(email);
        mockMvc.perform(get("/api/elections")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/elections").with(httpBasic(email, PASSWORD)))
                .andExpect(status().isForbidden());

        createChurch(email, "Auth Church");
        mockMvc.perform(get("/api/elections").with(httpBasic(email, PASSWORD)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/auth/me").with(httpBasic(email, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));
        mockMvc.perform(get("/api/elections").with(httpBasic(email, "wrong-password")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createsOneChurchAndReturnsItFromCurrentChurchAndMe() throws Exception {
        String email = "church-owner@example.org";
        register(email);
        mockMvc.perform(get("/api/churches/my").with(httpBasic(email, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        mockMvc.perform(post("/api/churches").with(httpBasic(email, PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"First Church\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("First Church"));
        mockMvc.perform(get("/api/churches/my").with(httpBasic(email, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("First Church"));
        mockMvc.perform(get("/api/auth/me").with(httpBasic(email, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.church.name").value("First Church"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
        mockMvc.perform(post("/api/churches").with(httpBasic(email, PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Second Church\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("church_already_exists"));
    }

    @Test
    void isolatesElectionReadsAndWritesBetweenChurchAdmins() throws Exception {
        String firstAdmin = "first-admin@example.org";
        String secondAdmin = "second-admin@example.org";
        register(firstAdmin);
        register(secondAdmin);
        createChurch(firstAdmin, "First Church");
        createChurch(secondAdmin, "Second Church");

        String location = mockMvc.perform(post("/api/elections").with(httpBasic(firstAdmin, PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"departmentName\":\"Worship\",\"positions\":[{\"name\":\"Director\",\"openingCount\":1}]}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");
        UUID electionId = UUID.fromString(location.substring(location.lastIndexOf('/') + 1));

        mockMvc.perform(get("/api/elections").with(httpBasic(secondAdmin, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(get("/api/elections/{id}", electionId).with(httpBasic(secondAdmin, PASSWORD)))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/elections/{id}", electionId).with(httpBasic(secondAdmin, PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"departmentName\":\"Changed\",\"positions\":[{\"name\":\"Chair\",\"openingCount\":1}]}"))
                .andExpect(status().isNotFound());
    }

    private void register(String email) throws Exception {
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(request(email, PASSWORD)))
                .andExpect(status().isCreated());
    }

    private void createChurch(String email, String name) throws Exception {
        mockMvc.perform(post("/api/churches").with(httpBasic(email, PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"" + name + "\"}"))
                .andExpect(status().isCreated());
    }

    private String request(String email, String password) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
    }
}