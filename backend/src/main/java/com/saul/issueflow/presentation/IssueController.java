package com.saul.issueflow.presentation;
import com.saul.issueflow.application.IssueService;
import com.saul.issueflow.application.IssueRequest;
import com.saul.issueflow.application.IssueResponse;
import com.saul.issueflow.domain.Priority;
import com.saul.issueflow.domain.Status;


import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.*;

@RestController
@RequestMapping("/api")
public class IssueController {
    private final IssueService service;
    public IssueController(IssueService service) { this.service = service; }
    public record IssuePage(List<IssueResponse> content, int page, int size, long totalElements, int totalPages) {}
    @GetMapping("/issues")
    public IssuePage list(@RequestParam(defaultValue = "") @Size(max = 120) String q,
        @RequestParam(required = false) Status status, @RequestParam(required = false) Priority priority,
        @RequestParam(defaultValue = "0") @Min(0) int page, @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        var result = service.list(q, status, priority, page, size);
        return new IssuePage(result.getContent(), result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }
    @GetMapping("/issues/{id}") public IssueResponse get(@PathVariable @Positive long id) { return service.get(id); }
    @PostMapping("/issues") public ResponseEntity<IssueResponse> create(@Valid @RequestBody IssueRequest request) {
        var issue = service.create(request);
        return ResponseEntity.created(URI.create("/api/issues/" + issue.id())).body(issue);
    }
    @PutMapping("/issues/{id}") public IssueResponse update(@PathVariable @Positive long id, @Valid @RequestBody IssueRequest request) {
        return service.update(id, request);
    }
    @DeleteMapping("/issues/{id}") public ResponseEntity<Void> delete(@PathVariable @Positive long id, @RequestParam @PositiveOrZero long version) {
        service.delete(id, version); return ResponseEntity.noContent().build();
    }
    @GetMapping("/stats") public Map<String, Long> stats() { return service.stats(); }
}
