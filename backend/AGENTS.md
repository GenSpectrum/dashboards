# AGENTS.md — Backend

Kotlin + Spring Boot backend. All commands run from `backend/`. Docker must be running (tests use Testcontainers).

---

## Build & Dev Commands

```bash
./gradlew build                   # Build
./gradlew test                    # Run all tests
./gradlew bootRun --args='--spring.profiles.active=local-db,dashboards-prod'  # Run locally
```

The backend will be available at `http://localhost:8080`. Swagger UI at `http://localhost:8080/swagger-ui/index.html`.
The database from the top-level Docker Compose file needs to be running.

## Running a Single Test

```bash
# Run a single test class:
./gradlew test --tests "org.genspectrum.dashboardsbackend.controller.SubscriptionsControllerTest"

# Run a single test method (use the full backtick-quoted name):
./gradlew test --tests "org.genspectrum.dashboardsbackend.controller.SubscriptionsControllerTest.GIVEN I created a subscription WHEN getting subscriptions THEN contains created subscription"
```

## Lint

```bash
./gradlew ktlintCheck
./gradlew ktlintFormat
```

---

## Code Style

### Style
- Enforced by **ktlint** (version 1.4.1). Run `./gradlew ktlintFormat` to auto-fix.
- Follow standard Kotlin idioms: data classes, sealed interfaces, extension functions.

### Naming
- Classes/interfaces: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_CASE`
- Test method names use backtick syntax describing behavior:
  ```kotlin
  @Test
  fun `GIVEN some state WHEN action THEN expected result`() { ... }
  ```

### Logging
Use `kotlin-logging` (`io.github.microutils:kotlin-logging-jvm`):
```kotlin
private val log = KotlinLogging.logger {}
log.info { "message" }
```

(There should be one global logger instance that can be reused everywhere)

### Error Handling
- Throw typed exceptions: `BadRequestException`, `NotFoundException`, `ForbiddenException`.
- The global `ExceptionHandler` maps these to appropriate HTTP status codes with `ProblemDetail` bodies.
- Log unexpected exceptions at `error` level; expected/handled exceptions at `info` or `warn`.

### Testing
- Use `@SpringBootTest` + `@AutoConfigureMockMvc` for integration tests.
- Since the API is a relatively thin layer around the database, most tests should focus on interacting with the code via the endpoints.
  Only add dedicated unit tests for isolated logic that is more complex.
- Use **MockK** (via `springmockk`) instead of Mockito.
- Use **Testcontainers** for database tests (Docker required).
- Tests are organized by controller/feature, not by test type.
