FROM gradle:jdk21 AS build

WORKDIR /workspace

COPY . ./

RUN ./gradlew bootJar

FROM eclipse-temurin:21-alpine

WORKDIR /workspace

COPY --from=build /workspace/build/libs/*.jar app.jar

COPY entrypoint.sh entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["./entrypoint.sh"]

LABEL org.opencontainers.image.source="https://github.com/GenSpectrum/dashboards/backend"
