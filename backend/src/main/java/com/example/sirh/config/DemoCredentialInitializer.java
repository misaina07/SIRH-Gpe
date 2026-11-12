package com.example.sirh.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@ConditionalOnProperty(name = "sirh.demo.credentials.enabled", havingValue = "true")
public class DemoCredentialInitializer implements CommandLineRunner {
    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;
    private final Map<String, String> credentials;

    public DemoCredentialInitializer(JdbcTemplate jdbc, PasswordEncoder encoder,
            @Value("${SIRH_DEMO_PASSWORD_RH:}") String rh,
            @Value("${SIRH_DEMO_PASSWORD_MANAGER:}") String manager,
            @Value("${SIRH_DEMO_PASSWORD_FINANCE:}") String finance,
            @Value("${SIRH_DEMO_PASSWORD_DIRECTION:}") String direction) {
        this.jdbc = jdbc;
        this.encoder = encoder;
        this.credentials = Map.of("usr-1", rh, "usr-2", manager, "usr-3", finance, "usr-4", direction,
                "usr-5", manager);
    }

    @Override
    public void run(String... args) {
        if (credentials.values().stream().anyMatch(String::isBlank))
            throw new IllegalStateException("Configurez les quatre SIRH_DEMO_PASSWORD_* avant d'activer les comptes locaux.");
        credentials.forEach((userId, password) -> jdbc.update(
                "UPDATE users SET password_hash=? WHERE id=?", encoder.encode(password), userId));
    }
}
