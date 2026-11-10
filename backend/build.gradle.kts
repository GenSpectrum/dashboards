import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import java.io.ByteArrayOutputStream

plugins {
    kotlin("jvm") version "2.4.21"
    kotlin("plugin.spring") version "2.4.21"
    id("org.springframework.boot") version "4.1.2"
    id("io.spring.dependency-management") version "1.1.7"
    id("org.jlleitschuh.gradle.ktlint") version "14.2.0"
    id("org.springdoc.openapi-gradle-plugin") version "1.9.0"
}

group = "org.genspectrum"
version = "0.0.1"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("io.github.microutils:kotlin-logging-jvm:3.0.5")
    implementation("org.jetbrains.kotlin:kotlin-stdlib")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:3.2.0")
    implementation("org.flywaydb:flyway-database-postgresql:11.0.0")
    implementation("org.postgresql:postgresql:42.7.14")
    implementation("org.jetbrains.exposed:exposed-spring-boot4-starter:1.6.0")
    implementation("org.jetbrains.exposed:exposed-json:1.6.0")
    implementation("org.jetbrains.exposed:exposed-jdbc:1.6.0")
    implementation("org.jetbrains.exposed:exposed-kotlin-datetime:1.6.0")
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.8.0-0.6.x-compat")
    implementation("tools.jackson.module:jackson-module-kotlin")

    testImplementation("org.springframework.boot:spring-boot-starter-test") {
        exclude(group = "org.mockito")
    }
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testImplementation("tools.jackson.dataformat:jackson-dataformat-yaml")
    testImplementation("com.ninja-squad:springmockk:5.0.1")
    testImplementation("org.testcontainers:testcontainers:2.0.5")
    testImplementation("org.testcontainers:testcontainers-postgresql:2.0.5")
    testImplementation("org.mock-server:mockserver-netty:5.15.0") {
        exclude(group = "io.swagger.core.v3", module = "swagger-core")
        exclude(group = "io.swagger.core.v3", module = "swagger-models")
    }
    testImplementation("org.mock-server:mockserver-spring-test-listener:5.15.0") {
        exclude(group = "io.swagger.core.v3", module = "swagger-core")
        exclude(group = "io.swagger.core.v3", module = "swagger-models")
    }

    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

// taken from https://github.com/JLLeitschuh/ktlint-gradle/issues/809#issuecomment-2515514826
ktlint {
    version.set("1.4.1")
}

configurations.matching { it.name.startsWith("ktlint") }.configureEach {
    resolutionStrategy.eachDependency {
        if (requested.group == "org.jetbrains.kotlin") {
            requested.version?.let { useVersion(it) }
        }
    }
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

val checkDockerAvailable by tasks.registering(Exec::class) {
    commandLine("docker", "info")
    standardOutput = ByteArrayOutputStream()
    errorOutput = ByteArrayOutputStream()
    isIgnoreExitValue = true
    doLast {
        if (executionResult.get().exitValue != 0) {
            throw GradleException("Docker is not available. Please start Docker before running tests.")
        }
    }
}

tasks.withType<Test> {
    dependsOn(checkDockerAvailable)
    useJUnitPlatform()
    testLogging {
        events("FAILED")
        exceptionFormat = TestExceptionFormat.FULL
        showExceptions = true
        showStandardStreams = true
    }
}
