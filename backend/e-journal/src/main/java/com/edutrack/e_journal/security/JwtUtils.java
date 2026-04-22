package com.edutrack.e_journal.security;

import com.edutrack.e_journal.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtils {

    @Value("${app.jwtSecret}")
    private String jwtSecret;

    @Value("${app.jwtExpirationInMs}")
    private long jwtExpirationInMs;

    // 7 days
    private static final long REFRESH_EXPIRATION_MS = 7L * 24 * 60 * 60 * 1000;

    private SecretKey signingKey() {
        // Generate a HMAC-SHA key from the configured JWT secret string
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /** Generates an access token with all claims the frontend needs. */
    public String generateAccessToken(User user) {
        // Construct a new JWT for the authenticated user
        return Jwts.builder()
                // Set the subject as the user's unique email identifier
                .subject(user.getEmail())
                // Embed the user's primary key and profile details as custom claims
                .claim("id",    user.getId())
                .claim("email", user.getEmail())
                .claim("role",  user.getRole().getName().name())
                .claim("name",  user.getFirstName() + " " + user.getLastName())
                // Define the token issuance timestamp and the calculated expiration window
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationInMs))
                // Cryptographically sign the payload using the application's secret key
                .signWith(signingKey())
                // Serialize the builder into a compact, URL-safe JWT string
                .compact();
    }

    /** Generates a long-lived refresh token (subject only, no extra claims). */
    public String generateRefreshToken(User user) {
        // Create a new JWT refresh token for the authenticated user
        return Jwts.builder()
                // Set the user's email as the subject of the token
                .subject(user.getEmail())
                // Set the token issuance timestamp to the current time
                .issuedAt(new Date())
                // Define the token expiration time based on the configured refresh duration
                .expiration(new Date(System.currentTimeMillis() + REFRESH_EXPIRATION_MS))
                // Sign the token using the application's secret signing key
                .signWith(signingKey())
                // Serialize the claims into a compact, URL-safe string
                .compact();
    }

    // Extract the user's email (subject) from the provided JWT
    public String getEmailFromToken(String token) {
        // Parse the JWT claims and retrieve the subject claim
        return parseClaims(token).getSubject();
    }

    public boolean validateToken(String token) {
        // Verify the integrity and authenticity of the JWT
        try {
            // Attempt to extract and verify the claims within the token
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            // Return false if the token is expired, malformed, or otherwise invalid
            return false;
        }
    }

    private Claims parseClaims(String token) {
        // Decodes the JWT and extracts the payload claims after verifying the signature
        return Jwts.parser()
                // Use the application's signing key to validate the token's integrity
                .verifyWith(signingKey())
                .build()
                // Parse the JWS (Signed JWT) and ensure the signature matches
                .parseSignedClaims(token)
                // Retrieve the claims object containing the token's payload
                .getPayload();
    }
}
