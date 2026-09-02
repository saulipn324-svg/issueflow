package com.saul.issueflow;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "issues")
public class Issue {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @Version public Long version;
    @Column(nullable = false, length = 120) public String title;
    @Column(nullable = false, length = 4000) public String description;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) public Status status;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) public Priority priority;
    @Column(nullable = false, length = 80) public String assignee;
    @Column(nullable = false, updatable = false) public Instant createdAt;
    @Column(nullable = false) public Instant updatedAt;

    @PrePersist void onCreate() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = Instant.now(); }
}
