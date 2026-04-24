package com.edutrack.e_journal.controller;

import com.edutrack.e_journal.dto.AuthResponse;
import com.edutrack.e_journal.dto.LoginRequest;
import com.edutrack.e_journal.entity.User;
import com.edutrack.e_journal.repository.UserRepository;
import com.edutrack.e_journal.security.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Arrays;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, token refresh, and logout")
public class AuthController {

    private static final String REFRESH_COOKIE = "refreshToken";
    private static final int   REFRESH_MAX_AGE  = 7 * 24 * 60 * 60; // 7 days in seconds

    private final AuthenticationManager authenticationManager;
    private final UserRepository        userRepository;
    private final JwtUtils              jwtUtils;

    @Operation(summary = "Log in", description = "Authenticate with email and password. Returns a short-lived access token in the body and sets a 7-day HttpOnly refresh cookie.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Authenticated — access token returned"),
        @ApiResponse(responseCode = "401", description = "Invalid email or password")
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request,
                                   HttpServletResponse response) {
        // Authenticate the user credentials via the Spring Security AuthenticationManager
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (AuthenticationException e) {
            // Return 401 Unauthorized if the credentials do not match
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password"));
        }

        // Load the managed User entity from the database using the provided email
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();

        // Generate the JWT pair for the authenticated user
        String accessToken  = jwtUtils.generateAccessToken(user);
        String refreshToken = jwtUtils.generateRefreshToken(user);

        // Persist the refresh token in a secure, HttpOnly cookie on the client
        addRefreshCookie(response, refreshToken);

        // Return the short-lived access token in the response body
        return ResponseEntity.ok(new AuthResponse(accessToken));
    }

    @Operation(summary = "Refresh access token", description = "Uses the HttpOnly refresh cookie to issue a new access token. No request body needed.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "New access token returned"),
        @ApiResponse(responseCode = "401", description = "Refresh token missing or expired")
    })
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request) {
        // Retrieve the refresh token from the HttpOnly cookie or reject the request
        String refreshToken = extractRefreshCookie(request)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token missing"));

        // Verify the token's signature and expiration status
        if (!jwtUtils.validateToken(refreshToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
        }

        // Extract the subject and load the managed User entity from the database
        String email = jwtUtils.getEmailFromToken(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        // Issue a new short-lived access token for the authenticated user
        return ResponseEntity.ok(new AuthResponse(jwtUtils.generateAccessToken(user)));
    }

    @Operation(summary = "Log out", description = "Clears the refresh cookie. The access token expires naturally (24 h).")
    @ApiResponse(responseCode = "200", description = "Logged out")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        // Invalidate the user session by removing the HttpOnly refresh token cookie
        clearRefreshCookie(response);
        // Return a 200 OK response to confirm logout success
        return ResponseEntity.ok().build();
    }

    // -------------------------------------------------------------------------

    private void addRefreshCookie(HttpServletResponse response, String value) {
        // Configure and attach the HttpOnly refresh token cookie to the HTTP response
        // Initialize the cookie with the predefined REFRESH_COOKIE name and the JWT value
        Cookie cookie = new Cookie(REFRESH_COOKIE, value);
        // Prevent client-side scripts from accessing the cookie to mitigate XSS attacks
        cookie.setHttpOnly(true);
        // Disable secure flag for local development; must be true in production environments using HTTPS
        cookie.setSecure(false);   // set true in production (HTTPS)
        // Restrict the cookie scope to the /auth endpoint to limit exposure
        cookie.setPath("/auth");
        // Set the cookie expiration based on the application's refresh token lifetime
        cookie.setMaxAge(REFRESH_MAX_AGE);
        // Persist the cookie in the user's browser via the response header
        response.addCookie(cookie);
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        // Invalidates the refresh token by overwriting the existing cookie with an empty value
        Cookie cookie = new Cookie(REFRESH_COOKIE, "");
        // Prevent client-side script access to the cookie for security
        cookie.setHttpOnly(true);
        // Ensure the cookie is cleared for the specific authentication endpoint path
        cookie.setPath("/auth");
        // Set expiration to zero to trigger immediate deletion by the browser
        cookie.setMaxAge(0);
        // Commit the invalidated cookie to the HTTP response
        response.addCookie(cookie);
    }

    private Optional<String> extractRefreshCookie(HttpServletRequest request) {
        // Retrieve the refresh token from the HttpOnly cookie in the incoming request
        if (request.getCookies() == null) return Optional.empty();
        return Arrays.stream(request.getCookies())
                // Filter the cookie array for the specific REFRESH_COOKIE name
                .filter(c -> REFRESH_COOKIE.equals(c.getName()))
                // Extract the token value from the matched cookie
                .map(Cookie::getValue)
                // Return the first match found, wrapped in an Optional
                .findFirst();
    }
}
