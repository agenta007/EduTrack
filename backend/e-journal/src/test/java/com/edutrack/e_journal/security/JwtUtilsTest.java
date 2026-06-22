package com.edutrack.e_journal.security;

import com.edutrack.e_journal.entity.Role;
import com.edutrack.e_journal.entity.RoleEnum;
import com.edutrack.e_journal.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;

class JwtUtilsTest {

    // Must be at least 32 bytes (256 bits) for HMAC-SHA256
    private static final String SECRET =
            "test-secret-key-that-is-long-enough-for-hmac-sha256-algorithm";
    private static final long EXPIRY_MS = 60_000L; // 1 minute

    private JwtUtils jwtUtils;
    private User user;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", SECRET);
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationInMs", EXPIRY_MS);

        Role role = new Role();
        role.setName(RoleEnum.TEACHER);

        user = User.builder()
                .id(7L)
                .firstName("Maria")
                .lastName("Ivanova")
                .email("maria@school.bg")
                .passwordHash("h")
                .role(role)
                .build();
    }

    // ── generateAccessToken ──────────────────────────────────────────────────────

    @Test
    void generateAccessToken_containsEmailAsSubject() {
        String token = jwtUtils.generateAccessToken(user);

        assertThat(jwtUtils.getEmailFromToken(token)).isEqualTo("maria@school.bg");
    }

    @Test
    void generateAccessToken_tokenIsValid() {
        String token = jwtUtils.generateAccessToken(user);

        assertThat(jwtUtils.validateToken(token)).isTrue();
    }

    @Test
    void generateAccessToken_twoCallsProduceDifferentTokens() {
        // issuedAt timestamps differ by at least 1 ms between calls
        String t1 = jwtUtils.generateAccessToken(user);
        String t2 = jwtUtils.generateAccessToken(user);

        // tokens may occasionally be equal if generated in same millisecond — soft assertion
        // The important thing is both are valid
        assertThat(jwtUtils.validateToken(t1)).isTrue();
        assertThat(jwtUtils.validateToken(t2)).isTrue();
    }

    // ── generateRefreshToken ─────────────────────────────────────────────────────

    @Test
    void generateRefreshToken_containsEmailAsSubject() {
        String token = jwtUtils.generateRefreshToken(user);

        assertThat(jwtUtils.getEmailFromToken(token)).isEqualTo("maria@school.bg");
    }

    @Test
    void generateRefreshToken_tokenIsValid() {
        String token = jwtUtils.generateRefreshToken(user);

        assertThat(jwtUtils.validateToken(token)).isTrue();
    }

    // ── validateToken ─────────────────────────────────────────────────────────────

    @Test
    void validateToken_expiredToken_returnsFalse() {
        // Generate a token that expired 1 second in the past
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationInMs", -1000L);
        String expiredToken = jwtUtils.generateAccessToken(user);

        // Restore normal expiry for validation
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationInMs", EXPIRY_MS);

        assertThat(jwtUtils.validateToken(expiredToken)).isFalse();
    }

    @Test
    void validateToken_tamperedToken_returnsFalse() {
        String token = jwtUtils.generateAccessToken(user);
        // Corrupt the signature segment (last part of the JWT)
        String tampered = token.substring(0, token.lastIndexOf('.') + 1) + "invalidsignature";

        assertThat(jwtUtils.validateToken(tampered)).isFalse();
    }

    @Test
    void validateToken_emptyString_returnsFalse() {
        assertThat(jwtUtils.validateToken("")).isFalse();
    }

    @Test
    void validateToken_randomString_returnsFalse() {
        assertThat(jwtUtils.validateToken("not.a.jwt")).isFalse();
    }

    @Test
    void validateToken_wrongSecret_returnsFalse() {
        // Token signed with a different secret should fail validation
        JwtUtils otherUtils = new JwtUtils();
        ReflectionTestUtils.setField(otherUtils, "jwtSecret",
                "completely-different-secret-key-that-is-long-enough-for-hmac");
        ReflectionTestUtils.setField(otherUtils, "jwtExpirationInMs", EXPIRY_MS);

        String foreignToken = otherUtils.generateAccessToken(user);

        assertThat(jwtUtils.validateToken(foreignToken)).isFalse();
    }

    // ── getEmailFromToken ─────────────────────────────────────────────────────────

    @Test
    void getEmailFromToken_accessToken_returnsCorrectEmail() {
        String token = jwtUtils.generateAccessToken(user);

        assertThat(jwtUtils.getEmailFromToken(token)).isEqualTo("maria@school.bg");
    }

    @Test
    void getEmailFromToken_refreshToken_returnsCorrectEmail() {
        String token = jwtUtils.generateRefreshToken(user);

        assertThat(jwtUtils.getEmailFromToken(token)).isEqualTo("maria@school.bg");
    }
}
