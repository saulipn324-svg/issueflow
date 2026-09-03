package com.saul.issueflow;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockHttpSession;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:security-test;DB_CLOSE_DELAY=-1",
    "ISSUEFLOW_ADMIN_PASSWORD=TestAdmin-Only-2026", "ISSUEFLOW_USER_PASSWORD=TestUser-Only-2026"})
@AutoConfigureMockMvc
class SecurityTest {
    @Autowired MockMvc mvc;
    @Test void anonymousCannotReadIssues() throws Exception {
        mvc.perform(get("/api/issues")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }
    @Test void badPasswordAndMissingCsrfFail() throws Exception {
        mvc.perform(post("/api/auth/login").with(csrf()).param("username","admin").param("password","wrong"))
            .andExpect(status().isUnauthorized()).andExpect(unauthenticated());
        mvc.perform(post("/api/auth/login").param("username","admin").param("password","TestAdmin-Only-2026"))
            .andExpect(status().isForbidden());
        mvc.perform(delete("/api/issues/999").with(user("admin").roles("ADMIN")).param("version","0"))
            .andExpect(status().isForbidden());
    }
    @Test void userCannotDeleteButAdminReachesController() throws Exception {
        mvc.perform(delete("/api/issues/999").with(user("usuario").roles("USER")).with(csrf()).param("version","0"))
            .andExpect(status().isForbidden());
        mvc.perform(delete("/api/issues/999").with(user("admin").roles("ADMIN")).with(csrf()).param("version","0"))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/stats").with(user("usuario").roles("USER"))).andExpect(status().isOk());
    }
    @Test void userCanCreateAndEdit() throws Exception {
        String body="{\"title\":\"Prueba usuario\",\"description\":\"\",\"status\":\"OPEN\",\"priority\":\"HIGH\",\"assignee\":\"\"}";
        var result=mvc.perform(post("/api/issues").with(user("usuario").roles("USER")).with(csrf())
            .contentType("application/json").content(body)).andExpect(status().isCreated()).andReturn();
        String location=result.getResponse().getHeader("Location");
        mvc.perform(put(location).with(user("usuario").roles("USER")).with(csrf())
            .contentType("application/json").content(body.replace("Prueba usuario","Cambio usuario").replace("{","{\"version\":0,")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.version").value(1));
    }
    @Test void realLoginRotatesSessionAndLogoutInvalidatesIt() throws Exception {
        var initial=mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andExpect(jsonPath("$.token").isNotEmpty()).andReturn();
        var session=(MockHttpSession)initial.getRequest().getSession();
        String originalId=session.getId();
        mvc.perform(post("/api/auth/login").session(session).with(csrf()).param("username","admin").param("password","TestAdmin-Only-2026"))
            .andExpect(status().isNoContent()).andExpect(authenticated().withRoles("ADMIN"));
        assertThat(session.getId()).isNotEqualTo(originalId);
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk()).andExpect(jsonPath("$.role").value("ADMIN"));
        mvc.perform(post("/api/auth/logout").session(session).with(csrf())).andExpect(status().isNoContent());
        assertThat(session.isInvalid()).isTrue();
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }
}
