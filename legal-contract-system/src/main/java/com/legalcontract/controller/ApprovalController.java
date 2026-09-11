package com.legalcontract.controller;
import com.legalcontract.service.AuditLogService;
import com.legalcontract.entity.Approval;
import com.legalcontract.entity.Contract;
import com.legalcontract.entity.User;
import com.legalcontract.entity.Version;
import com.legalcontract.repository.ApprovalRepository;
import com.legalcontract.repository.ContractRepository;
import com.legalcontract.repository.UserRepository;
import com.legalcontract.repository.VersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.legalcontract.entity.Modification;
import com.legalcontract.repository.ModificationRepository;

import java.util.List;

@RestController
@RequestMapping("/contracts/{contractId}/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalRepository approvalRepository;
    private final ContractRepository contractRepository;
    private final VersionRepository versionRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final ModificationRepository modificationRepository;
    // Submit a version for approval
    @PostMapping("/version/{versionId}")
    public ResponseEntity<?> requestApproval(
            @PathVariable Long contractId,
            @PathVariable Long versionId,
            @RequestBody Approval approval,
            Authentication authentication) {

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found"));

        Version version = versionRepository.findById(versionId)
                .orElseThrow(() -> new RuntimeException("Version not found"));

        if (!version.getContract().getId().equals(contractId)) {
            return ResponseEntity.badRequest()
                    .body("Version does not belong to this contract");
        }

        String username = authentication.getName();

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String role = currentUser.getRole().getName();

        if (!role.equals("ADMIN")) {
            if (!role.equals("LEGAL_USER") ||
                    !contract.getCreatedBy().getId().equals(currentUser.getId())) {

                return ResponseEntity.status(403)
                        .body("You are not authorized to request approval");
            }
        }

        approval.setVersion(version);
        approval.setRequestedBy(currentUser);
        approval.setStatus("PENDING");
// Check version status
        if (!version.getStatus().equals("DRAFT")) {
            return ResponseEntity.badRequest()
                    .body("Only DRAFT versions can be submitted for approval");
        }

// Check if approval already exists
        if (approvalRepository.findByVersionId(versionId).isPresent()) {
            return ResponseEntity.badRequest()
                    .body("Approval request already exists for this version");
        }

// Create approval
        approval.setVersion(version);
        approval.setRequestedBy(currentUser);
        approval.setStatus("PENDING");

        Approval savedApproval = approvalRepository.save(approval);

        version.setStatus("PENDING_APPROVAL");
        versionRepository.save(version);

        auditLogService.log(
                currentUser,
                "APPROVAL_REQUEST",
                "APPROVAL",
                savedApproval.getId(),
                "Version V" + version.getVersionNumber()
                        + " submitted for approval for contract: "
                        + contract.getTitle()
        );

        return ResponseEntity.ok(savedApproval);

    }

    // Reviewer/Admin can approve or reject
    @PutMapping("/{approvalId}/review")
    public ResponseEntity<?> reviewApproval(
            @PathVariable Long contractId,
            @PathVariable Long approvalId,
            @RequestParam String status,
            @RequestParam(required = false) String comments,
            Authentication authentication) {

        Approval approval = approvalRepository.findById(approvalId)
                .orElseThrow(() -> new RuntimeException("Approval not found"));
        Contract contract = approval.getVersion().getContract();
        if (!approval.getVersion().getContract().getId().equals(contractId)) {
            return ResponseEntity.badRequest()
                    .body("Approval does not belong to this contract");
        }

        User reviewer = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String role = reviewer.getRole().getName();

        if (!role.equals("REVIEWER") && !role.equals("ADMIN")) {
            return ResponseEntity.status(403)
                    .body("Only Reviewer or Admin can review approval");
        }

        if (!status.equals("APPROVED") && !status.equals("REJECTED")) {
            return ResponseEntity.badRequest()
                    .body("Status must be APPROVED or REJECTED");
        }

        approval.setStatus(status);
        approval.setReviewedBy(reviewer);
        approval.setComments(comments);
        approval.setReviewedAt(java.time.LocalDateTime.now());

        Approval savedApproval = approvalRepository.save(approval);

        Version version = approval.getVersion();

        if (status.equals("APPROVED")) {

            version.setStatus("APPROVED");
            contract.setStatus("APPROVED");
            contractRepository.save(contract);

        } else {

            version.setStatus("REJECTED");
        }

        versionRepository.save(version);

        String auditAction = status.equals("APPROVED")
                ? "APPROVAL_APPROVE"
                : "APPROVAL_REJECT";

        auditLogService.log(
                reviewer,
                auditAction,
                "APPROVAL",
                savedApproval.getId(),
                "Approval " + status.toLowerCase()
                        + " for version V"
                        + version.getVersionNumber()
                        + " of contract: "
                        + contract.getTitle()
                        + (comments != null && !comments.isBlank()
                        ? ". Comments: " + comments
                        : "")
        );

        return ResponseEntity.ok(savedApproval);
    }

    // Get all approvals for a contract
    @GetMapping
    public ResponseEntity<?> getApprovals(@PathVariable Long contractId) {

        contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found"));

        List<Approval> approvals = approvalRepository.findAll()
                .stream()
                .filter(approval ->
                        approval.getVersion()
                                .getContract()
                                .getId()
                                .equals(contractId))
                .toList();

        return ResponseEntity.ok(approvals);
    }

    // Get one approval
    @GetMapping("/{approvalId}")
    public ResponseEntity<?> getApproval(
            @PathVariable Long contractId,
            @PathVariable Long approvalId) {

        Approval approval = approvalRepository.findById(approvalId)
                .orElseThrow(() -> new RuntimeException("Approval not found"));

        if (!approval.getVersion()
                .getContract()
                .getId()
                .equals(contractId)) {

            return ResponseEntity.badRequest()
                    .body("Approval does not belong to this contract");
        }

        return ResponseEntity.ok(approval);
    }
}