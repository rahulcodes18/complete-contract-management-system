package com.legalcontract.controller;

import com.legalcontract.entity.Contract;
import com.legalcontract.entity.User;
import com.legalcontract.repository.ContractRepository;
import com.legalcontract.repository.UserRepository;
import com.legalcontract.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;


    // =========================
    // CREATE CONTRACT
    // ADMIN + LEGAL_USER
    // =========================
    @PostMapping
    public ResponseEntity<?> createContract(
            @RequestBody Contract contract,
            Authentication authentication) {

        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        String role = user.getRole().getName();

        // Only ADMIN and LEGAL_USER can create contracts
        if (!role.equals("ADMIN") &&
                !role.equals("LEGAL_USER")) {

            return ResponseEntity.status(403)
                    .body("You are not authorized to create contracts");
        }

        contract.setCreatedBy(user);
        contract.setStatus("DRAFT");

        Contract savedContract =
                contractRepository.save(contract);

        auditLogService.log(
                user,
                "CREATE",
                "CONTRACT",
                savedContract.getId(),
                "Contract created: " +
                        savedContract.getTitle()
        );

        return ResponseEntity.ok(savedContract);
    }


    // =========================
    // GET ALL CONTRACTS
    // ADMIN + LEGAL_USER + REVIEWER
    // =========================
    @GetMapping
    public ResponseEntity<List<Contract>> getAllContracts(
            Authentication authentication) {

        String username = authentication.getName();

        User currentUser =
                userRepository.findByUsername(username)
                        .orElseThrow(() ->
                                new RuntimeException("User not found"));

        String role = currentUser.getRole().getName();


        // =========================
        // ADMIN
        // Can view ALL contracts
        // =========================
        if (role.equals("ADMIN")) {

            return ResponseEntity.ok(
                    contractRepository.findAll()
            );
        }


        // =========================
        // LEGAL_USER
        // Can view ONLY own contracts
        // =========================
        if (role.equals("LEGAL_USER")) {

            List<Contract> contracts =
                    contractRepository.findAll()
                            .stream()
                            .filter(contract ->
                                    contract.getCreatedBy()
                                            .getId()
                                            .equals(currentUser.getId())
                            )
                            .toList();

            return ResponseEntity.ok(contracts);
        }


        // =========================
        // REVIEWER
        // Can view ALL contracts
        // =========================
        if (role.equals("REVIEWER")) {

            return ResponseEntity.ok(
                    contractRepository.findAll()
            );
        }


        return ResponseEntity.status(403)
                .body(List.of());
    }


    // =========================
    // GET CONTRACT BY ID
    // =========================
    @GetMapping("/{id}")
    public ResponseEntity<?> getContractById(
            @PathVariable Long id,
            Authentication authentication) {

        Contract contract =
                contractRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Contract not found"
                                ));

        String username = authentication.getName();

        User currentUser =
                userRepository.findByUsername(username)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));

        String role = currentUser.getRole().getName();


        // ADMIN and REVIEWER can view any contract
        if (role.equals("ADMIN") ||
                role.equals("REVIEWER")) {

            return ResponseEntity.ok(contract);
        }


        // LEGAL_USER can view only own contract
        if (role.equals("LEGAL_USER") &&
                contract.getCreatedBy()
                        .getId()
                        .equals(currentUser.getId())) {

            return ResponseEntity.ok(contract);
        }


        return ResponseEntity.status(403)
                .body(
                        "You are not authorized to view this contract"
                );
    }


    // =========================
    // UPDATE CONTRACT
    // ADMIN + CONTRACT OWNER
    // =========================
    @PutMapping("/{id}")
    public ResponseEntity<?> updateContract(
            @PathVariable Long id,
            @RequestBody Contract updatedContract,
            Authentication authentication) {

        Contract existingContract =
                contractRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Contract not found"
                                ));

        String username = authentication.getName();

        User currentUser =
                userRepository.findByUsername(username)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));

        String role = currentUser.getRole().getName();


        // ADMIN can update any contract
        if (!role.equals("ADMIN")) {

            // LEGAL_USER can update only own contract
            if (!role.equals("LEGAL_USER") ||
                    !existingContract.getCreatedBy()
                            .getId()
                            .equals(currentUser.getId())) {

                return ResponseEntity.status(403)
                        .body(
                                "You are not authorized to update this contract"
                        );
            }
        }


        existingContract.setTitle(
                updatedContract.getTitle()
        );

        existingContract.setContractNumber(
                updatedContract.getContractNumber()
        );

        existingContract.setDescription(
                updatedContract.getDescription()
        );


        Contract savedContract =
                contractRepository.save(existingContract);


        auditLogService.log(
                currentUser,
                "UPDATE",
                "CONTRACT",
                savedContract.getId(),
                "Contract updated: " +
                        savedContract.getTitle()
        );

        return ResponseEntity.ok(savedContract);
    }


    // =========================
    // DELETE CONTRACT
    // ADMIN + CONTRACT OWNER
    // =========================
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteContract(
            @PathVariable Long id,
            Authentication authentication) {

        Contract contract =
                contractRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Contract not found"
                                ));

        String username = authentication.getName();

        User currentUser =
                userRepository.findByUsername(username)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));

        String role = currentUser.getRole().getName();


        // ADMIN can delete any contract
        if (!role.equals("ADMIN")) {

            // LEGAL_USER can delete only own contract
            if (!role.equals("LEGAL_USER") ||
                    !contract.getCreatedBy()
                            .getId()
                            .equals(currentUser.getId())) {

                return ResponseEntity.status(403)
                        .body(
                                "You are not authorized to delete this contract"
                        );
            }
        }


        Long contractId = contract.getId();
        String contractTitle = contract.getTitle();


        contractRepository.delete(contract);


        auditLogService.log(
                currentUser,
                "DELETE",
                "CONTRACT",
                contractId,
                "Contract deleted: " +
                        contractTitle
        );


        return ResponseEntity.ok(
                "Contract deleted successfully"
        );
    }
}