package com.saul.issueflow.application;
import com.saul.issueflow.domain.Issue;
import com.saul.issueflow.domain.Priority;
import com.saul.issueflow.domain.Status;


import java.time.Instant;

public record IssueResponse(Long id, Long version, String title, String description,
        Status status, Priority priority, String assignee, Instant createdAt, Instant updatedAt) {
    static IssueResponse from(Issue issue) {
        return new IssueResponse(issue.id, issue.version, issue.title, issue.description,
            issue.status, issue.priority, issue.assignee, issue.createdAt, issue.updatedAt);
    }
}
