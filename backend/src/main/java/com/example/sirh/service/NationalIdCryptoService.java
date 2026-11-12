package com.example.sirh.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class NationalIdCryptoService {
    private static final int NONCE_BYTES = 12;
    private static final int TAG_BITS = 128;
    private final String configuredKey;
    private final SecureRandom random = new SecureRandom();

    public NationalIdCryptoService(@Value("${sirh.crypto.national-id-key:}") String configuredKey) {
        this.configuredKey = configuredKey;
    }

    public String encrypt(String value) {
        if (value == null || value.isBlank()) return null;
        byte[] key = key();
        byte[] nonce = new byte[NONCE_BYTES];
        random.nextBytes(nonce);
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(TAG_BITS, nonce));
            byte[] encrypted = cipher.doFinal(value.trim().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            byte[] result = new byte[nonce.length + encrypted.length];
            System.arraycopy(nonce, 0, result, 0, nonce.length);
            System.arraycopy(encrypted, 0, result, nonce.length, encrypted.length);
            return Base64.getEncoder().encodeToString(result);
        } catch (Exception exception) {
            throw new IllegalStateException("Chiffrement du NIR impossible.", exception);
        }
    }

    public String decrypt(String value) {
        if (value == null || value.isBlank()) return null;
        byte[] payload = Base64.getDecoder().decode(value);
        if (payload.length <= NONCE_BYTES) throw new IllegalStateException("Donnée NIR chiffrée invalide.");
        try {
            byte[] nonce = java.util.Arrays.copyOfRange(payload, 0, NONCE_BYTES);
            byte[] encrypted = java.util.Arrays.copyOfRange(payload, NONCE_BYTES, payload.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key(), "AES"), new GCMParameterSpec(TAG_BITS, nonce));
            return new String(cipher.doFinal(encrypted), java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception exception) {
            throw new IllegalStateException("Déchiffrement du NIR impossible; vérifiez la clé locale configurée.", exception);
        }
    }

    private byte[] key() {
        if (configuredKey == null || configuredKey.isBlank())
            throw new IllegalStateException("Configurez SIRH_NATIONAL_ID_KEY avant d’enregistrer ou lire un NIR.");
        byte[] key = Base64.getDecoder().decode(configuredKey.trim());
        if (key.length != 32) throw new IllegalStateException("SIRH_NATIONAL_ID_KEY doit contenir une clé AES-256 encodée en Base64.");
        return key;
    }
}
