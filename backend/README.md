# Dashboards backend

## Local setup
You have to provide config information to the backend. This can be done by providing commandline arguments.
The necessary properties can be found in the `dev.properties.example` file.

To run the backend locally, you can use the following command:
```bash
./gradlew bootRun --args='--your-arg=your-value'
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
