package com.edutrack.e_journal.security;

import com.edutrack.e_journal.entity.User;
import com.edutrack.e_journal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Spring Security calls this with the value the user typed in the "username" field.
     * We use email as the login identifier.
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Retrieve the user from the database by their email address
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("No user found with email: " + email));

        // Map the domain User entity to a Spring Security UserDetails object
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                // Convert the domain role into a Spring Security GrantedAuthority with the ROLE_ prefix
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName().name())))
                .build();
    }
}
