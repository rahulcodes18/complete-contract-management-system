package com.legalcontract.security;

import com.legalcontract.service.CustomUserDetailsService;
import com.legalcontract.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        String username = null;
        String token = null;

        // =========================
        // GET JWT TOKEN
        // =========================
        if (authHeader != null &&
                authHeader.startsWith("Bearer ")) {

            token = authHeader.substring(7);

            try {
                username = jwtService.extractUsername(token);
            } catch (Exception e) {
                System.out.println(
                        "JWT DEBUG - Invalid token: "
                                + e.getMessage()
                );
            }
        }

        // =========================
        // TEMPORARY DEBUG
        // =========================
        System.out.println(
                "JWT DEBUG - Username: "
                        + username
                        + ", URI: "
                        + request.getRequestURI()
        );

        // =========================
        // AUTHENTICATE USER
        // =========================
        if (username != null &&
                SecurityContextHolder
                        .getContext()
                        .getAuthentication() == null) {

            try {

                UserDetails userDetails =
                        userDetailsService
                                .loadUserByUsername(username);

                if (jwtService.isTokenValid(token)) {

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request)
                    );

                    SecurityContextHolder
                            .getContext()
                            .setAuthentication(authentication);

                    System.out.println(
                            "JWT DEBUG - Authenticated: "
                                    + username
                                    + ", Authorities: "
                                    + userDetails.getAuthorities()
                    );

                } else {

                    System.out.println(
                            "JWT DEBUG - Token is NOT valid for: "
                                    + username
                    );
                }

            } catch (Exception e) {

                System.out.println(
                        "JWT DEBUG - Authentication error: "
                                + e.getMessage()
                );
            }
        }

        filterChain.doFilter(request, response);
    }
}