# Dashboards backend

## Local setup

You have to provide config information to the backend:
* Dashboards configuration, e.g. the LAPIS instances of the organisms.
  We have profiles available that only need to be activated via `spring.profiles.active`.
* Database connection configuration: values need to be passed via [external properties](https://docs.spring.io/spring-boot/reference/features/external-config.html).
  For local development, we have a `local-db` profile available. 
  You can also check that for required properties.

To run the backend locally, you can use the following command:
```bash
./gradlew bootRun --args='--spring.profiles.active=local-db,dashboards-dev'
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
