package com.edutrack.e_journal.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Set;

/**
 * When {@code app.security.allow-localhost=true} (the default), any request
 * from 127.0.0.1 / ::1 that carries no JWT is automatically authenticated with
 * every role, bypassing all {@code @PreAuthorize} checks.
 *
 * Set {@code app.security.allow-localhost=false} to disable this behaviour
 * (e.g. in staging / production).
 *
 * NOT annotated with @Component — registered explicitly in SecurityConfig.
 */
public class LocalhostAdminFilter extends OncePerRequestFilter {

    private static final Set<String> LOOPBACK = Set.of("127.0.0.1", "0:0:0:0:0:0:0:1", "::1");

    private static final List<SimpleGrantedAuthority> ALL_ROLES = List.of(
            new SimpleGrantedAuthority("ROLE_ADMIN"),
            new SimpleGrantedAuthority("ROLE_HEADMASTER"),
            new SimpleGrantedAuthority("ROLE_TEACHER"),
            new SimpleGrantedAuthority("ROLE_STUDENT"),
            new SimpleGrantedAuthority("ROLE_PARENT")
    );

    private final boolean enabled;

    public LocalhostAdminFilter(boolean enabled) {
        // Initialize the filter with a toggle to bypass security checks during local development
        this.enabled = enabled;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        // Check if the dev-bypass filter is active and the request is unauthenticated
        if (enabled
                && SecurityContextHolder.getContext().getAuthentication() == null
                && LOOPBACK.contains(request.getRemoteAddr())) {

            // Use a real UserDetails as the principal so that controllers declaring
            // @AuthenticationPrincipal UserDetails receive a non-null value (a plain
            // String principal would be injected as null and NPE downstream).
            UserDetails principal = User.withUsername("localhost-admin")
                    .password("")
                    .authorities(ALL_ROLES)
                    .build();

            // Grant full administrative authority to requests originating from localhost
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(principal, null, ALL_ROLES)
            );
        }

        // Continue the filter chain execution
        chain.doFilter(request, response);
    }
}
