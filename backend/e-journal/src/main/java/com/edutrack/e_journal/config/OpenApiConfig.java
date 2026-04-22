package com.edutrack.e_journal.config;

import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme.In;
import io.swagger.v3.oas.models.security.SecurityScheme.Type;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@SecurityScheme(
        name        = "bearerAuth",
        type        = SecuritySchemeType.HTTP,
        scheme      = "bearer",
        bearerFormat = "JWT",
        description = "Obtain a token via POST /auth/login, then click Authorize and paste it here."
)
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        // Configure the OpenAPI specification for Swagger UI documentation
        return new OpenAPI()
                // Define the API metadata including title, version, and usage instructions
                .info(new Info()
                        .title("EduTrack API")
                        .version("1.0.0")
                        .description("""
                                REST API for the **EduTrack** school e-journal system.

                                ## Authentication
                                All endpoints except `POST /auth/login`, `POST /auth/refresh`, \
                                and `POST /auth/logout` require a JWT access token.
                                Click **Authorize** and paste the token returned by `/auth/login`.

                                ## Roles
                                | Role | Description |
                                |------|-------------|
                                | `ADMIN` | Full system access |
                                | `HEADMASTER` | Manages own school — staff, students, schedule |
                                | `TEACHER` | Records grades, absences, and complaints |
                                | `STUDENT` | Views own grades, absences, and complaints |
                                | `PARENT` | Views their child's records |
                                """)
                        // Set the contact information for the API maintainers
                        .contact(new Contact()
                                .name("EduTrack Development Team")
                                .email("dev@edutrack.bg")))
                // Apply global JWT Bearer authentication requirement to all endpoints
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
