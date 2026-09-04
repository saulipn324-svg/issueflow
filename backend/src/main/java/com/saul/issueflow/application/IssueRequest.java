package com.saul.issueflow.application;
import com.saul.issueflow.domain.Priority;
import com.saul.issueflow.domain.Status;


import jakarta.validation.constraints.*;

public record IssueRequest(
    @NotBlank @Size(min = 3, max = 120) String title,
    @NotNull @Size(max = 4000) String description,
    @NotNull Status status,
    @NotNull Priority priority,
    @NotNull @Size(max = 80) String assignee,
    @PositiveOrZero Long version
) {
    public IssueRequest {
        title = title == null ? null : title.strip();
        description = description == null ? null : description.strip();
        assignee = assignee == null ? null : assignee.strip();
    }
}
