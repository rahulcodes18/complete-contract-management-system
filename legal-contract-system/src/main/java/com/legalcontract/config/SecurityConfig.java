package com.legalcontract.config;

import com.legalcontract.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration)
            throws Exception {

        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http

                // =========================
                // CSRF
                // =========================
                .csrf(csrf -> csrf.disable())

                // =========================
                // CORS
                // =========================
                .cors(cors -> {})

                // =========================
                // JWT - STATELESS
                // =========================
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // =========================
                        // AUTHENTICATION
                        // =========================
                        .requestMatchers(
                                "/auth/register",
                                "/auth/login"
                        )
                        .permitAll()


                        // =========================
                        // ADMIN APIs
                        // =========================
                        .requestMatchers("/admin/**")
                        .hasRole("ADMIN")


                        // =========================
                        // LEGAL USER APIs
                        // =========================
                        .requestMatchers("/legal/**")
                        .hasRole("LEGAL_USER")


                        // =========================
                        // REVIEWER APIs
                        // =========================
                        .requestMatchers("/reviewer/**")
                        .hasRole("REVIEWER")


                        // =========================
                        // AUDIT LOGS
                        // ADMIN ONLY
                        // =========================
                        .requestMatchers("/audit-logs/**")
                        .hasRole("ADMIN")


                        // =========================
                        // DASHBOARD
                        // ALL LOGGED-IN ROLES
                        // =========================
                        .requestMatchers("/dashboard")
                        .hasAnyRole(
                                "ADMIN",
                                "LEGAL_USER",
                                "REVIEWER"
                        )


                        // =========================
                        // CREATE CONTRACT
                        // ADMIN + LEGAL USER
                        // =========================
                        .requestMatchers(
                                HttpMethod.POST,
                                "/contracts/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "LEGAL_USER"
                        )


                        // =========================
                        // VERSION APIs
                        // ADMIN + LEGAL USER + REVIEWER
                        // =========================
                        .requestMatchers(
                                "/contracts/*/versions/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "LEGAL_USER",
                                "REVIEWER"
                        )


                        // =========================
                        // CONTRACT APIs
                        // ALL THREE ROLES
                        // Controller handles
                        // view/update/delete permissions
                        // =========================
                        .requestMatchers("/contracts/**")
                        .hasAnyRole(
                                "ADMIN",
                                "LEGAL_USER",
                                "REVIEWER"
                        )


                        // =========================
                        // MODIFICATION REQUESTS
                        // =========================
                        // Any authenticated user can reach
                        // these endpoints.
                        //
                        // ModificationRequestController
                        // handles the actual role permissions.
                        // =========================
                        .requestMatchers(
                                "/modification-requests",
                                "/modification-requests/**"
                        )
                        .authenticated()


                        // =========================
                        // APPROVALS
                        // =========================
                        // Any authenticated user can reach
                        // these endpoints.
                        //
                        // Controller handles reviewer
                        // authorization.
                        // =========================
                        .requestMatchers(
                                "/approvals",
                                "/approvals/**"
                        )
                        .authenticated()


                        // =========================
                        // ERROR
                        // =========================
                        .requestMatchers("/error")
                        .permitAll()


                        // =========================
                        // EVERYTHING ELSE
                        // =========================
                        .anyRequest()
                        .authenticated()
                )

                // =========================
                // JWT FILTER
                // =========================
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}