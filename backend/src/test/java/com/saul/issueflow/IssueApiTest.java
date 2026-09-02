package com.saul.issueflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.util.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = IssueflowApplication.class, properties = "spring.datasource.url=jdbc:h2:mem:issueflow-test;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
class IssueApiTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired IssueRepository repository;
    @BeforeEach void clean() { repository.deleteAll(); }
    Map<String, Object> payload(String title) {
        var body = new LinkedHashMap<String, Object>();
        body.put("title", title); body.put("description", "Pasos para reproducir el error.");
        body.put("status", "OPEN"); body.put("priority", "HIGH"); body.put("assignee", "Saul");
        return body;
    }
    Map<String, Object> create(String title) throws Exception {
        var response = mvc.perform(post("/api/issues").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(payload(title))))
            .andExpect(status().isCreated()).andExpect(header().exists("Location")).andReturn();
        return json.readValue(response.getResponse().getContentAsString(), new com.fasterxml.jackson.core.type.TypeReference<>() {});
    }
    @Test void createsAndRetrievesPersistedIssue() throws Exception {
        var issue = create("  Error de autenticación  ");
        mvc.perform(get("/api/issues/" + issue.get("id"))).andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("Error de autenticación"))
            .andExpect(jsonPath("$.version").value(0)).andExpect(jsonPath("$.createdAt").isNotEmpty());
        assertThat(repository.count()).isEqualTo(1);
    }
    @Test void rejectsWhitespaceAndShortTitles() throws Exception {
        for (String title : List.of("   ", "ab")) {
            mvc.perform(post("/api/issues").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(payload(title))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.title").exists());
        }
        assertThat(repository.count()).isZero();
    }
    @Test void rejectsOversizedDescriptionAndInvalidEnum() throws Exception {
        var body = payload("Título válido"); body.put("description", "x".repeat(4001));
        mvc.perform(post("/api/issues").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body))).andExpect(status().isBadRequest());
        body.put("description", ""); body.put("status", "OTHER");
        mvc.perform(post("/api/issues").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body))).andExpect(status().isBadRequest());
        assertThat(repository.count()).isZero();
    }
    @Test void filtersPaginatesAndEscapesSearchWildcards() throws Exception {
        create("Error 100% reproducible"); create("Error alternativo");
        mvc.perform(get("/api/issues").param("q", "%").param("status", "OPEN").param("priority", "HIGH"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/api/issues").param("q", "ERROR").param("size", "1").param("page", "1"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(1)).andExpect(jsonPath("$.totalPages").value(2));
        mvc.perform(get("/api/issues").param("priority", "LOW")).andExpect(jsonPath("$.totalElements").value(0));
    }
    @Test void rejectsInvalidPagination() throws Exception {
        mvc.perform(get("/api/issues").param("size", "101")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/issues").param("page", "-1")).andExpect(status().isBadRequest());
    }
    @Test void updatesVersionAndRejectsStaleEdits() throws Exception {
        var issue = create("Error en reporte"); var body = payload("Reporte corregido"); body.put("version", 0); body.put("status", "RESOLVED");
        mvc.perform(put("/api/issues/" + issue.get("id")).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.version").value(1)).andExpect(jsonPath("$.status").value("RESOLVED"));
        mvc.perform(put("/api/issues/" + issue.get("id")).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body))).andExpect(status().isConflict());
        mvc.perform(get("/api/stats")).andExpect(jsonPath("$.resolved").value(1)).andExpect(jsonPath("$.open").value(0));
    }
    @Test void requiresVersionOnUpdateAndDelete() throws Exception {
        var issue = create("Error en formulario");
        mvc.perform(put("/api/issues/" + issue.get("id")).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(payload("Cambio"))))
            .andExpect(status().isBadRequest());
        mvc.perform(delete("/api/issues/" + issue.get("id"))).andExpect(status().isBadRequest());
    }
    @Test void deletesAndReturnsNotFound() throws Exception {
        var issue = create("Incidencia temporal");
        mvc.perform(delete("/api/issues/" + issue.get("id")).param("version", "7")).andExpect(status().isConflict());
        mvc.perform(delete("/api/issues/" + issue.get("id")).param("version", "0")).andExpect(status().isNoContent());
        mvc.perform(get("/api/issues/" + issue.get("id"))).andExpect(status().isNotFound());
        mvc.perform(get("/api/stats")).andExpect(jsonPath("$.total").value(0));
    }
    @Test void exposesOnlyHealthDetails() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP")).andExpect(jsonPath("$.components").doesNotExist());
    }
}

