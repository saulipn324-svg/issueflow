package com.saul.issueflow.application;
public class IssueFailure extends RuntimeException {
    public enum Kind { NOT_FOUND, INVALID, CONFLICT }
    private final Kind kind;
    public IssueFailure(Kind kind, String message) { super(message); this.kind = kind; }
    public Kind kind() { return kind; }
}
