FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn --batch-mode --no-transfer-progress verify

FROM eclipse-temurin:21-jre-jammy
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system issueflow && useradd --system --gid issueflow --home-dir /app issueflow
WORKDIR /app
COPY --from=build --chown=issueflow:issueflow /build/target/issueflow-1.0.0.jar ./app.jar
USER issueflow
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
