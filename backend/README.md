> [!NOTE]
> 
> This backend is *not currently used* as the subscription feature is
> currently on hold and not fully implemented yet, and can currently
> be ignored when setting up a dashboards installation.  It is also
> partially out of date. An exception are these two configuration
> files which are shared with the frontend (`website` folder) and thus
> in use and up to date:
> [application-dashboards-prod.yaml](src/main/resources/application-dashboards-prod.yaml),
> [application-dashboards-staging.yaml](src/main/resources/application-dashboards-staging.yaml)

# Dashboards backend

This backend exists to serve the subscription feature (unfinished,
currently on hold, note the banner above). Genomic queries are served
by LAPIS instances and do not go through this backend.

See [docs/arc42/03-context.md](../docs/arc42/03-context.md) for its
place in the whole context.

## Local setup

You have to provide config information to the backend:
* Dashboards configuration, e.g. the LAPIS instances of the organisms.
  We have profiles available that only need to be activated via `spring.profiles.active`.
* Database connection configuration: values need to be passed via [external properties](https://docs.spring.io/spring-boot/reference/features/external-config.html).
  For local development, we have a `local-db` profile available. 
  You can also check that for required properties.

To run the backend locally, you can use the following command:
```bash
./gradlew bootRun --args='--spring.profiles.active=local-db,dashboards-prod'
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
