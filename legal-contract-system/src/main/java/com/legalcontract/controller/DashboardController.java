package com.legalcontract.controller;

import com.legalcontract.entity.User;
import com.legalcontract.repository.ContractRepository;
import com.legalcontract.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.legalcontract.repository.ApprovalRepository;
import java.util.HashMap;
import java.util.Map;
import com.legalcontract.repository.DocumentRepository;
import com.legalcontract.repository.VersionRepository;
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final UserRepository userRepository;
    private final ContractRepository contractRepository;
    private final ApprovalRepository approvalRepository;
    private final DocumentRepository documentRepository;
    private final VersionRepository versionRepository;
    @GetMapping
    public ResponseEntity<?> getDashboard(
            Authentication authentication) {

        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        String role = user.getRole().getName();

        Map<String, Object> dashboard = new HashMap<>();

        dashboard.put("username", username);
        dashboard.put("role", role);

        // LEGAL_USER dashboard
        if (role.equals("LEGAL_USER")) {

            var myContracts =
                    contractRepository.findByCreatedById(user.getId());

            dashboard.put("myContracts", myContracts.size());

            long draftContracts = myContracts.stream()
                    .filter(c -> "DRAFT".equals(c.getStatus()))
                    .count();

            long pendingApprovals = myContracts.stream()
                    .filter(c -> "PENDING_APPROVAL".equals(c.getStatus()))
                    .count();

            long approvedContracts = myContracts.stream()
                    .filter(c -> "APPROVED".equals(c.getStatus()))
                    .count();

            long rejectedContracts = myContracts.stream()
                    .filter(c -> "REJECTED".equals(c.getStatus()))
                    .count();

            dashboard.put("draftContracts", draftContracts);
            dashboard.put("pendingApprovals", pendingApprovals);
            dashboard.put("approvedContracts", approvedContracts);
            dashboard.put("rejectedContracts", rejectedContracts);
        }
        // ADMIN dashboard
        if (role.equals("ADMIN")) {

            long totalUsers = userRepository.count();

            long totalContracts = contractRepository.count();

            long totalDocuments = documentRepository.count();

            long totalVersions = versionRepository.count();

            long pendingApprovals =
                    approvalRepository.findByStatus("PENDING").size();

            dashboard.put("totalUsers", totalUsers);
            dashboard.put("totalContracts", totalContracts);
            dashboard.put("totalDocuments", totalDocuments);
            dashboard.put("totalVersions", totalVersions);
            dashboard.put("pendingApprovals", pendingApprovals);
        }
        // REVIEWER dashboard
        if (role.equals("REVIEWER")) {

            long pendingApprovals =
                    approvalRepository.findByStatus("PENDING").size();

            long approvedReviews =
                    approvalRepository.findByStatus("APPROVED").size();

            long rejectedReviews =
                    approvalRepository.findByStatus("REJECTED").size();

            long totalReviews =
                    approvedReviews + rejectedReviews;

            dashboard.put("pendingApprovals", pendingApprovals);
            dashboard.put("approvedReviews", approvedReviews);
            dashboard.put("rejectedReviews", rejectedReviews);
            dashboard.put("totalReviews", totalReviews);
        }
        return ResponseEntity.ok(dashboard);
    }
}