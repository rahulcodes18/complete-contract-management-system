package com.legalcontract.controller;

import com.legalcontract.entity.Contract;
import com.legalcontract.entity.User;
import com.legalcontract.entity.Version;
import com.legalcontract.repository.ContractRepository;
import com.legalcontract.repository.UserRepository;
import com.legalcontract.repository.VersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.legalcontract.entity.Document;
import com.legalcontract.repository.DocumentRepository;
import com.legalcontract.service.AuditLogService;
@RestController
@RequestMapping("/contracts/{contractId}/versions")
@RequiredArgsConstructor
public class VersionController {

    private final VersionRepository versionRepository;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final AuditLogService auditLogService;
    // CREATE VERSION
    @PostMapping
    public ResponseEntity<Version> createVersion(
            @PathVariable Long contractId,
            @RequestBody Version version,
            Authentication authentication) {

        // 1. Find contract
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() ->
                        new RuntimeException("Contract not found"));

        // 2. Get logged-in user
        String username = authentication.getName();

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        // 3. Check role
        String role = currentUser.getRole().getName();

        // 4. ADMIN can create version for any contract
        if (!role.equals("ADMIN")) {

            // LEGAL_USER can create version only for own contract
            if (!role.equals("LEGAL_USER") ||
                    !contract.getCreatedBy()
                            .getId()
                            .equals(currentUser.getId())) {

                return ResponseEntity.status(403).build();
            }
        }


        // 5. Find latest version number
        Integer nextVersionNumber =
                versionRepository
                        .findByContractIdOrderByVersionNumberDesc(contractId)
                        .stream()
                        .findFirst()
                        .map(v -> v.getVersionNumber() + 1)
                        .orElse(1);


        // 6. Set server-controlled fields
        version.setContract(contract);
        version.setVersionNumber(nextVersionNumber);
        version.setCreatedBy(currentUser);
        version.setStatus("DRAFT");

        // 7. Save version
        Version savedVersion = versionRepository.save(version);

        auditLogService.log(
                currentUser,
                "VERSION_CREATE",
                "VERSION",
                savedVersion.getId(),
                "Version created: V" + savedVersion.getVersionNumber()
                        + " for contract: " + contract.getTitle()
        );

        return ResponseEntity.ok(savedVersion);    }
    // GET ALL VERSIONS OF A CONTRACT
    @GetMapping
    public ResponseEntity<?> getVersions(
            @PathVariable Long contractId,
            Authentication authentication) {

        // Check contract exists
        contractRepository.findById(contractId)
                .orElseThrow(() ->
                        new RuntimeException("Contract not found"));

        return ResponseEntity.ok(
                versionRepository
                        .findByContractIdOrderByVersionNumberDesc(contractId)
        );
    }
    @PutMapping("/{versionId}/document/{documentId}")
    public ResponseEntity<?> attachDocument(
            @PathVariable Long contractId,
            @PathVariable Long versionId,
            @PathVariable Long documentId,
            Authentication authentication) {

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found"));

        Version version = versionRepository.findById(versionId)
                .orElseThrow(() -> new RuntimeException("Version not found"));

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        // Make sure version belongs to this contract
        if (!version.getContract().getId().equals(contractId)) {
            return ResponseEntity.badRequest()
                    .body("Version does not belong to this contract");
        }

        // Make sure document belongs to this contract
        if (!document.getContract().getId().equals(contractId)) {
            return ResponseEntity.badRequest()
                    .body("Document does not belong to this contract");
        }

        // Logged-in user
        String username = authentication.getName();

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String role = currentUser.getRole().getName();

        // Authorization
        if (!role.equals("ADMIN")) {
            if (!role.equals("LEGAL_USER") ||
                    !contract.getCreatedBy().getId().equals(currentUser.getId())) {

                return ResponseEntity.status(403)
                        .body("You are not authorized to attach document");
            }
        }

        // Attach document
        version.setDocument(document);

        Version savedVersion = versionRepository.save(version);

        auditLogService.log(
                currentUser,
                "VERSION_CREATE",
                "VERSION",
                savedVersion.getId(),
                "Version created: V" + savedVersion.getVersionNumber()
                        + " for contract: " + contract.getTitle()
        );

        return ResponseEntity.ok(savedVersion);
    }
}