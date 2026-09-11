package com.legalcontract.service;

import com.legalcontract.dto.LoginRequest;
import com.legalcontract.dto.RegisterRequest;
import com.legalcontract.entity.AuditLog;
import com.legalcontract.entity.Role;
import com.legalcontract.entity.User;
import com.legalcontract.repository.AuditLogRepository;
import com.legalcontract.repository.RoleRepository;
import com.legalcontract.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AuditLogRepository auditLogRepository;

    // REGISTER
    public String register(RegisterRequest request) {

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Role role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new RuntimeException("Role not found"));

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .enabled(true)
                .role(role)
                .build();

        User savedUser = userRepository.save(user);

        AuditLog auditLog = new AuditLog();
        auditLog.setUser(savedUser);
        auditLog.setAction("REGISTER");
        auditLog.setEntityType("USER");
        auditLog.setEntityId(savedUser.getId());
        auditLog.setDescription(
                "User registered: " + savedUser.getUsername()
        );

        auditLogRepository.save(auditLog);

        return "User registered successfully";
    }

    // LOGIN
    public String login(LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        AuditLog auditLog = new AuditLog();
        auditLog.setUser(user);
        auditLog.setAction("LOGIN");
        auditLog.setEntityType("USER");
        auditLog.setEntityId(user.getId());
        auditLog.setDescription(
                "User logged in: " + user.getUsername()
        );

        auditLogRepository.save(auditLog);

        return jwtService.generateToken(
                user.getUsername(),
                user.getRole().getName()
        );
    }
    // LOGOUT
    public void logout(User user) {

        AuditLog auditLog = new AuditLog();

        auditLog.setUser(user);
        auditLog.setAction("LOGOUT");
        auditLog.setEntityType("USER");
        auditLog.setEntityId(user.getId());
        auditLog.setDescription(
                "User logged out: " + user.getUsername()
        );

        auditLogRepository.save(auditLog);
    }


}

