package com.saul.issueflow.application;
import com.saul.issueflow.application.IssueRequest;
import com.saul.issueflow.application.IssueResponse;
import com.saul.issueflow.domain.Issue;
import com.saul.issueflow.domain.Priority;
import com.saul.issueflow.domain.Status;
import com.saul.issueflow.persistence.IssueRepository;


import org.springframework.data.domain.*;


import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class IssueService {
    private final IssueRepository repository;
    public IssueService(IssueRepository repository) { this.repository = repository; }

    public Page<IssueResponse> list(String query, Status status, Priority priority, int page, int size) {
        return repository.search(query, status, priority, page, size).map(IssueResponse::from);
    }

    public IssueResponse get(long id) { return IssueResponse.from(find(id)); }
    private Issue find(long id) {
        return repository.findById(id).orElseThrow(() -> new IssueFailure(IssueFailure.Kind.NOT_FOUND, "La incidencia no existe."));
    }
    @Transactional
    public IssueResponse create(IssueRequest request) {
        var issue = new Issue();
        apply(issue, request);
        return IssueResponse.from(repository.saveAndFlush(issue));
    }
    @Transactional
    public IssueResponse update(long id, IssueRequest request) {
        var issue = find(id);
        if (request.version() == null) throw new IssueFailure(IssueFailure.Kind.INVALID, "La versión es obligatoria al actualizar.");
        checkVersion(issue, request.version());
        apply(issue, request);
        return IssueResponse.from(repository.saveAndFlush(issue));
    }
    @Transactional
    public void delete(long id, long version) {
        var issue = find(id);
        checkVersion(issue, version);
        repository.delete(issue);
        repository.flush();
    }
    private void checkVersion(Issue issue, long version) {
        if (!Objects.equals(issue.version, version)) throw new IssueFailure(IssueFailure.Kind.CONFLICT,
            "La incidencia cambió. Actualiza la lista antes de volver a intentarlo.");
    }
    private void apply(Issue issue, IssueRequest request) {
        issue.title = request.title(); issue.description = request.description();
        issue.status = request.status(); issue.priority = request.priority(); issue.assignee = request.assignee();
    }
    public Map<String, Long> stats() {
        return Map.of("total", repository.count(), "open", repository.countByStatus(Status.OPEN),
            "inProgress", repository.countByStatus(Status.IN_PROGRESS), "resolved", repository.countByStatus(Status.RESOLVED));
    }
}
