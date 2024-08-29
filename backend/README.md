# Dashboards backend

## Local setup

Run application:
```bash
./gradlew bootRun
```

Run tests:
    
```bash
./gradlew test
```

## Logging
Logs to rotating files are stored in `./logs` and written to stdout.
In the Docker container, log files are stored in `/workspace/logs`


## Swagger UI and OpenAPI

The backend provides a OpenApi 3.0 specification for the API documentation.
The specification is available at `/v3/api-docs`.

The backend provides a Swagger UI for the API documentation.
The Swagger UI is available at `/swagger-ui/index.html`.
