package com.example.sirh.service;

import com.example.sirh.security.JwtService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AuthService {
    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwords;
    private final JwtService jwt;
    private final DirectoryService directory;

    public AuthService(JdbcTemplate jdbc, PasswordEncoder passwords, JwtService jwt, DirectoryService directory) {
        this.jdbc = jdbc; this.passwords = passwords; this.jwt = jwt; this.directory = directory;
    }

    public LoginResult login(String email, String password) {
        var matches = jdbc.queryForList("SELECT id, password_hash FROM users WHERE lower(email)=lower(?)", email.trim());
        if (matches.isEmpty() || matches.getFirst().get("password_hash") == null
                || !passwords.matches(password, (String) matches.getFirst().get("password_hash")))
            throw new InvalidCredentialsException();
        String id = (String) matches.getFirst().get("id");
        Map<String, Object> profile = directory.users().stream().filter(user -> id.equals(user.get("id")))
                .findFirst().orElseThrow(InvalidCredentialsException::new);
        return new LoginResult(jwt.issue(id), profile);
    }

    public Map<String, Object> profile(String userId) {
        return directory.users().stream().filter(user -> userId.equals(user.get("id")))
                .findFirst().orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }

    public record LoginResult(String token, Map<String, Object> user) {}
}
