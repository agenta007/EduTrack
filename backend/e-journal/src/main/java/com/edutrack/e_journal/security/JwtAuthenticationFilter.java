package com.edutrack.e_journal.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtUtils jwtUtils;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        // Intercepts incoming HTTP requests to validate the JWT Bearer token
        String header = request.getHeader("Authorization");

        // Check if the Authorization header is present and follows the Bearer scheme
        if (header != null && header.startsWith("Bearer ")) {
            // Extract the raw JWT from the header and capture request metadata for auditing
            String token = header.substring(7);
            String ip        = getClientIp(request);
            String userAgent = request.getHeader("User-Agent");
            String timestamp = Instant.now().toString();

            // Verify the token's signature and expiration status
            if (!jwtUtils.validateToken(token)) {
                log.warn("[JWT] FAILED | ts={} | ip={} | ua={} | reason=invalid_or_expired_token",
                        timestamp, ip, userAgent);
            } else {
                String email;
                try {
                    // Extract the subject (email) from the validated token claims
                    email = jwtUtils.getEmailFromToken(token);
                } catch (Exception e) {
                    // Log extraction failure and abort authentication processing for this request
                    log.warn("[JWT] FAILED | ts={} | ip={} | ua={} | reason=cannot_extract_email | error={}",
                            timestamp, ip, userAgent, e.getMessage());
                    chain.doFilter(request, response);
                    return;
                }

                try {
                    // Load the managed UserDetails from the database using the extracted email
                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                    // Create the authentication principal and populate authorities/details
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                
                    // Establish the SecurityContext to authorize the current request
                    SecurityContextHolder.getContext().setAuthentication(auth);

                    log.info("[JWT] OK | ts={} | ip={} | ua={} | user={} | roles={}",
                            timestamp, ip, userAgent, email, userDetails.getAuthorities());

                } catch (Exception e) {
                    // Log failure if the user no longer exists in the system
                    log.warn("[JWT] FAILED | ts={} | ip={} | ua={} | user={} | reason=user_not_found | error={}",
                            timestamp, ip, userAgent, email, e.getMessage());
                }
            }
        }

        // Continue the filter chain for the next security filter or the controller
        chain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        // Extract the client's IP address, accounting for potential proxy/load balancer headers
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // Return the first IP in the chain if the X-Forwarded-For header is present
            return forwarded.split(",")[0].trim();
        }
        // Fallback to the direct remote address if no proxy header is found
        return request.getRemoteAddr();
    }
}
