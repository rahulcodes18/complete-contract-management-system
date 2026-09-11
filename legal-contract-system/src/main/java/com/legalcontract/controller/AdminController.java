package com.legalcontract.controller;

import com.legalcontract.entity.User;
import com.legalcontract.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;

    @GetMapping("/test")
    public String adminTest() {
        return "ADMIN access granted!";
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
            Authentication authentication) {

        String username = authentication.getName();

        User currentUser = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        String role = currentUser.getRole().getName();

        if (!role.equals("ADMIN")) {
            return ResponseEntity.status(403)
                    .body("Only ADMIN can view users");
        }

        List<User> users = userRepository.findAll();

        return ResponseEntity.ok(users);
    }
}