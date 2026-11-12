package com.example.sirh.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

@Service
public class JwtService {
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();
    private final byte[] secret;
    private final long expirationMinutes;

    public JwtService(@Value("${sirh.jwt.secret}") String secret,
                      @Value("${sirh.jwt.expiration-minutes}") long expirationMinutes) {
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32)
            throw new IllegalArgumentException("SIRH_JWT_SECRET doit contenir au moins 32 octets.");
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.expirationMinutes = expirationMinutes;
    }

    public String issue(String userId) {
        try {
            String header = ENCODER.encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
            long now = Instant.now().getEpochSecond();
            String payloadJson = "{\"sub\":\"" + userId + "\",\"iat\":" + now
                    + ",\"exp\":" + Instant.now().plusSeconds(expirationMinutes * 60).getEpochSecond() + "}";
            String payload = ENCODER.encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
            String input = header + "." + payload;
            return input + "." + ENCODER.encodeToString(sign(input));
        } catch (Exception e) { throw new IllegalStateException("Création du jeton impossible", e); }
    }

    public String subject(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return null;
            byte[] expected = sign(parts[0] + "." + parts[1]);
            if (!java.security.MessageDigest.isEqual(expected, DECODER.decode(parts[2]))) return null;
            String payload = new String(DECODER.decode(parts[1]), StandardCharsets.UTF_8);
            var subjectMatch = java.util.regex.Pattern.compile("\\\"sub\\\":\\\"([A-Za-z0-9_-]+)\\\"").matcher(payload);
            var expMatch = java.util.regex.Pattern.compile("\\\"exp\\\":([0-9]+)").matcher(payload);
            if (!subjectMatch.find() || !expMatch.find()
                    || Long.parseLong(expMatch.group(1)) <= Instant.now().getEpochSecond()) return null;
            return subjectMatch.group(1);
        } catch (Exception e) { return null; }
    }

    private byte[] sign(String input) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        return mac.doFinal(input.getBytes(StandardCharsets.US_ASCII));
    }
}
