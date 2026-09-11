package com.legalcontract.controller;

import com.legalcontract.dto.ClauseUpdateRequest;
import com.legalcontract.entity.Clause;
import com.legalcontract.entity.Contract;
import com.legalcontract.entity.User;
import com.legalcontract.entity.Version;
import com.legalcontract.entity.Modification;
import com.legalcontract.repository.ClauseRepository;
import com.legalcontract.repository.ContractRepository;
import com.legalcontract.repository.UserRepository;
import com.legalcontract.repository.VersionRepository;
import com.legalcontract.repository.ModificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.legalcontract.service.AuditLogService;
@RestController
@RequestMapping("/contracts/{contractId}/clauses")
@RequiredArgsConstructor
public class ClauseController {

    private final ClauseRepository clauseRepository;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final VersionRepository versionRepository;
    private final ModificationRepository modificationRepository;
    private final AuditLogService auditLogService;
    // =========================
    // CREATE CLAUSE
    // =========================
    @PostMapping
    public ResponseEntity<?> createClause(
            @PathVariable Long contractId,
            @RequestBody Clause clause,
            Authentication authentication) {

        // Find contract
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found"));

        // Find logged-in user
        String username = authentication.getName();

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check role and ownership
        String role = currentUser.getRole().getName();

        if (!role.equals("ADMIN")) {

            if (!role.equals("LEGAL_USER") ||
                    !contract.getCreatedBy().getId().equals(currentUser.getId())) {

                return ResponseEntity.status(403)
                        .body("You are not authorized to create a clause");
            }
        }

        // Attach clause to contract
        clause.setContract(contract);

        int nextOrder = clauseRepository
                .findByContractIdOrderByOrderNumberDesc(contractId)
                .stream()
                .findFirst()
                .map(clauseItem -> clauseItem.getOrderNumber() + 1)
                .orElse(1);

        clause.setOrderNumber(nextOrder);

        Clause savedClause = clauseRepository.save(clause);

        auditLogService.log(
                currentUser,
                "CREATE",
                "CLAUSE",
                savedClause.getId(),
                "Clause created: " + savedClause.getTitle()
        );

        return ResponseEntity.ok(savedClause);
    }


    // =========================
    // GET ALL CLAUSES
    // =========================
    @GetMapping
    public ResponseEntity<?> getAllClauses(
            @PathVariable Long contractId,
            Authentication authentication) {

        // Check contract exists
        contractRepository.findById(contractId)
                .orElseThrow(() ->
                        new RuntimeException("Contract not found"));

        // Find logged-in user
        String username = authentication.getName();

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        String role = currentUser.getRole().getName();

        // Reviewer can view clauses
        // Admin can view clauses
        // Legal User can view clauses
        if (!role.equals("ADMIN") &&
                !role.equals("LEGAL_USER") &&
                !role.equals("REVIEWER")) {

            return ResponseEntity.status(403)
                    .body("You are not authorized to view clauses");
        }

        return ResponseEntity.ok(
                clauseRepository
                        .findByContractIdOrderByOrderNumberAsc(contractId)
        );
    }
    // =========================
    // GET CLAUSE BY ID
    // =========================
    @GetMapping("/{clauseId}")
    public ResponseEntity<?> getClauseById(
            @PathVariable Long contractId,
            @PathVariable Long clauseId,
            Authentication authentication) {

        Clause clause = clauseRepository.findById(clauseId)
                .orElseThrow(() ->
                        new RuntimeException("Clause not found"));

        // Make sure clause belongs to contract
        if (!clause.getContract().getId().equals(contractId)) {
            return ResponseEntity.badRequest()
                    .body("Clause does not belong to this contract");
        }

        // Find logged-in user
        String username = authentication.getName();

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        String role = currentUser.getRole().getName();

        // All three roles can view clauses
        if (!role.equals("ADMIN") &&
                !role.equals("LEGAL_USER") &&
                !role.equals("REVIEWER")) {

            return ResponseEntity.status(403)
                    .body("You are not authorized to view this clause");
        }

        return ResponseEntity.ok(clause);
    }

    // =========================
    // UPDATE CLAUSE
    // =========================
    // =========================
// UPDATE CLAUSE
// =========================
    @PutMapping("/{clauseId}")
    public ResponseEntity<?> updateClause(
            @PathVariable Long contractId,
            @PathVariable Long clauseId,
            @RequestBody ClauseUpdateRequest updatedClause,
            Authentication authentication) {

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found"));

        Clause existingClause = clauseRepository.findById(clauseId)
                .orElseThrow(() -> new RuntimeException("Clause not found"));

        if (!existingClause.getContract().getId().equals(contractId)) {
            return ResponseEntity.badRequest()
                    .body("Clause does not belong to this contract");
        }

        String username = authentication.getName();

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String role = currentUser.getRole().getName();

        if (!role.equals("ADMIN")) {
            if (!role.equals("LEGAL_USER") ||
                    !contract.getCreatedBy().getId().equals(currentUser.getId())) {

                return ResponseEntity.status(403)
                        .body("You are not authorized to modify this clause");
            }
        }

        // Store old content before updating
        String oldContent = existingClause.getContent();

        // Find latest version
        Version latestVersion = versionRepository
                .findByContractIdOrderByVersionNumberDesc(contractId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Version not found"));

        // Create next version
        Version newVersion = new Version();

        newVersion.setContract(contract);
        newVersion.setVersionNumber(
                latestVersion.getVersionNumber() + 1
        );
        newVersion.setCreatedBy(currentUser);
        newVersion.setStatus("DRAFT");
        newVersion.setChangeSummary(
                "Updated clause " + existingClause.getClauseNumber()
        );

        Version savedVersion = versionRepository.save(newVersion);

        // Update clause
        existingClause.setClauseNumber(updatedClause.getClauseNumber());
        existingClause.setTitle(updatedClause.getTitle());
        existingClause.setContent(updatedClause.getContent());

        Clause savedClause = clauseRepository.save(existingClause);

        // Create modification history
        Modification modification = new Modification();

        modification.setVersion(savedVersion);
        modification.setClause(savedClause);
        modification.setModifiedBy(currentUser);
        modification.setOldContent(oldContent);
        modification.setNewContent(updatedClause.getContent());
        modification.setChangeReason(updatedClause.getChangeReason());

        modificationRepository.save(modification);

        auditLogService.log(
                currentUser,
                "UPDATE",
                "CLAUSE",
                savedClause.getId(),
                "Clause updated: " + savedClause.getTitle()
        );

        return ResponseEntity.ok(savedClause);
    }
    // =========================
// REORDER CLAUSE
// =========================
    @PutMapping("/{clauseId}/move")
    public ResponseEntity<?> moveClause(
            @PathVariable Long contractId,
            @PathVariable Long clauseId,
            @RequestParam String direction,
            Authentication authentication) {

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() ->
                        new RuntimeException("Contract not found"));

        Clause currentClause = clauseRepository.findById(clauseId)
                .orElseThrow(() ->
                        new RuntimeException("Clause not found"));

        // Make sure clause belongs to this contract
        if (!currentClause.getContract().getId().equals(contractId)) {
            return ResponseEntity.badRequest()
                    .body("Clause does not belong to this contract");
        }

        // Find logged-in user
        String username = authentication.getName();

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        String role = currentUser.getRole().getName();

        // ADMIN can reorder any clause
        // LEGAL_USER can reorder clauses from their own contracts
        if (!role.equals("ADMIN")) {

            if (!role.equals("LEGAL_USER") ||
                    !contract.getCreatedBy()
                            .getId()
                            .equals(currentUser.getId())) {

                return ResponseEntity.status(403)
                        .body("You are not authorized to reorder this clause");
            }
        }

        // Get clauses in correct order
        List<Clause> clauses =
                clauseRepository
                        .findByContractIdOrderByOrderNumberAsc(contractId);

        int currentIndex = -1;

        for (int i = 0; i < clauses.size(); i++) {

            if (clauses.get(i).getId().equals(clauseId)) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex == -1) {
            return ResponseEntity.badRequest()
                    .body("Clause not found in this contract");
        }

        int targetIndex;

        if (direction.equalsIgnoreCase("UP")) {

            if (currentIndex == 0) {
                return ResponseEntity.badRequest()
                        .body("Clause is already at the top");
            }

            targetIndex = currentIndex - 1;

        } else if (direction.equalsIgnoreCase("DOWN")) {

            if (currentIndex == clauses.size() - 1) {
                return ResponseEntity.badRequest()
                        .body("Clause is already at the bottom");
            }

            targetIndex = currentIndex + 1;

        } else {

            return ResponseEntity.badRequest()
                    .body("Direction must be UP or DOWN");
        }

        // Swap order numbers
        Clause targetClause = clauses.get(targetIndex);

        int currentOrder = currentClause.getOrderNumber();
        int targetOrder = targetClause.getOrderNumber();

        currentClause.setOrderNumber(targetOrder);
        targetClause.setOrderNumber(currentOrder);

        clauseRepository.save(currentClause);
        clauseRepository.save(targetClause);

        auditLogService.log(
                currentUser,
                "REORDER",
                "CLAUSE",
                currentClause.getId(),
                "Clause reordered " + direction + ": " + currentClause.getTitle()
        );

        return ResponseEntity.ok(
                clauseRepository
                        .findByContractIdOrderByOrderNumberAsc(contractId)
        );
    }
    @DeleteMapping("/{clauseId}")
    public ResponseEntity<?> deleteClause(
            @PathVariable Long contractId,
            @PathVariable Long clauseId,
            Authentication authentication) {

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() ->
                        new RuntimeException("Contract not found"));

        Clause clause = clauseRepository.findById(clauseId)
                .orElseThrow(() ->
                        new RuntimeException("Clause not found"));

        // Make sure the clause belongs to this contract
        if (!clause.getContract().getId().equals(contractId)) {
            return ResponseEntity.badRequest()
                    .body("Clause does not belong to this contract");
        }

        String username = authentication.getName();

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        String role = currentUser.getRole().getName();

        // ADMIN can delete any clause
        // LEGAL_USER can delete clauses from their own contracts
        if (!role.equals("ADMIN")) {

            if (!role.equals("LEGAL_USER") ||
                    !contract.getCreatedBy()
                            .getId()
                            .equals(currentUser.getId())) {

                return ResponseEntity.status(403)
                        .body("You are not authorized to delete this clause");
            }
        }

        clauseRepository.delete(clause);

        auditLogService.log(
                currentUser,
                "DELETE",
                "CLAUSE",
                clauseId,
                "Clause deleted: " + clause.getTitle()
        );

        return ResponseEntity.ok(
                "Clause deleted successfully"
        );
    }
}