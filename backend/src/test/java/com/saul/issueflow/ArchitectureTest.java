package com.saul.issueflow;
import java.nio.file.*;
import java.io.IOException;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class ArchitectureTest {
 @Test void dependencyDirection() throws IOException {
 check("presentation", "com.saul.issueflow.persistence");
 check("application", "com.saul.issueflow.presentation");
 check("application", "com.saul.issueflow.configuration");
 check("persistence", "com.saul.issueflow.presentation");
 check("persistence", "com.saul.issueflow.application");
 check("persistence", "com.saul.issueflow.configuration");
 check("domain", "com.saul.issueflow.presentation");
 check("domain", "com.saul.issueflow.application");
 check("domain", "com.saul.issueflow.persistence");
 check("domain", "com.saul.issueflow.configuration");
 check("application", "org.springframework.http");
 check("application", "org.springframework.web");
 }
 private void check(String layer, String forbidden) throws IOException {
  Path base = Path.of("src/main/java/com/saul/issueflow",layer);
  assertTrue(Files.isDirectory(base), "Missing layer " + base);
  try(var files = Files.walk(base)) {
   for(Path file : files.filter(p -> p.toString().endsWith(".java")).toList())
    assertFalse(Files.readString(file).contains(forbidden), file + " depends on " + forbidden);
  }
 }
}
