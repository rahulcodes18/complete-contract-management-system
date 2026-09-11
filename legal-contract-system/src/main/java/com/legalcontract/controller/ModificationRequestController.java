package com.legalcontract.controller;

import com.legalcontract.entity.Clause;
import com.legalcontract.entity.Contract;
import com.legalcontract.entity.Modification;
import com.legalcontract.entity.ModificationRequest;
import com.legalcontract.entity.User;
import com.legalcontract.entity.Version;
import com.legalcontract.repository.ClauseRepository;
import com.legalcontract.repository.ContractRepository;
import com.legalcontract.repository.ModificationRepository;
import com.legalcontract.repository.ModificationRequestRepository;
import com.legalcontract.repository.UserRepository;
import com.legalcontract.repository.VersionRepository;
import com.legalcontract.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/modification-requests")
@RequiredArgsConstructor
public class ModificationRequestController {

    private final ModificationRequestRepository modificationRequestRepository;
    private final ContractRepository contractRepository;
    private final ClauseRepository clauseRepository;
    private final UserRepository userRepository;
    private final VersionRepository versionRepository;
    private final ModificationRepository modificationRepository;
    private final AuditLogService auditLogService;


    // =========================================================
    // CREATE MODIFICATION REQUEST
    // =========================================================
    @PostMapping
    public ResponseEntity<?> createRequest(
            @RequestBody ModificationRequest request,
            Authentication authentication) {

        String username = authentication.getName();

        User currentUser = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        // Contract is required
        if (request.getContract() == null ||
                request.getContract().getId() == null) {

            return ResponseEntity.badRequest()
                    .body("Contract is required");
        }

        // Find contract
        Contract contract = contractRepository
                .findById(request.getContract().getId())
                .orElseThrow(() ->
                        new RuntimeException("Contract not found"));

        // =====================================================
        // OPTIONAL CLAUSE
        // =====================================================

        Clause clause = null;

        if (request.getClause() != null &&
                request.getClause().getId() != null) {

            clause = clauseRepository
                    .findById(request.getClause().getId())
                    .orElseThrow(() ->
                            new RuntimeException("Clause not found"));

            // Make sure clause belongs to selected contract
            if (!clause.getContract()
                    .getId()
                    .equals(contract.getId())) {

                return ResponseEntity.badRequest()
                        .body("Clause does not belong to this contract");
            }
        }

        // =====================================================
        // ONLY LEGAL_USER CAN CREATE REQUEST
        // =====================================================

        String role = currentUser.getRole().getName();

        if (!"LEGAL_USER".equalsIgnoreCase(role)) {

            return ResponseEntity.status(403)
                    .body(
                            "Only LEGAL_USER can create modification requests"
                    );
        }

        request.setContract(contract);
        request.setClause(clause);
        request.setRequestedBy(currentUser);

        // Every new request starts as PENDING
        request.setStatus("PENDING");

        ModificationRequest savedRequest =
                modificationRequestRepository.save(request);

        // Audit log
        auditLogService.log(
                currentUser,
                "MODIFICATION_REQUEST_CREATE",
                "MODIFICATION_REQUEST",
                savedRequest.getId(),
                "Modification request created for contract: "
                        + contract.getTitle()
        );

        return ResponseEntity.ok(savedRequest);
    }


    // =========================================================
    // GET ALL MODIFICATION REQUESTS
    // =========================================================
    @GetMapping
    public ResponseEntity<?> getAllRequests(
            Authentication authentication) {

        String username = authentication.getName();

        User currentUser = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        String role = currentUser.getRole().getName();

        System.out.println(
                "Modification Requests - User: "
                        + username
                        + ", Role: "
                        + role
        );

        // =====================================================
        // ADMIN AND REVIEWER CAN VIEW ALL REQUESTS
        // =====================================================

        if ("ADMIN".equalsIgnoreCase(role) ||
                "REVIEWER".equalsIgnoreCase(role)) {

            return ResponseEntity.ok(
                    modificationRequestRepository.findAll()
            );
        }

        // =====================================================
        // LEGAL_USER CAN VIEW ONLY THEIR OWN REQUESTS
        // =====================================================

        if ("LEGAL_USER".equalsIgnoreCase(role)) {

            return ResponseEntity.ok(
                    modificationRequestRepository
                            .findByRequestedById(
                                    currentUser.getId()
                            )
            );
        }

        return ResponseEntity.status(403)
                .body(
                        "You are not authorized to view modification requests"
                );
    }


    // =========================================================
    // GET REQUESTS BY CONTRACT
    // =========================================================
    @GetMapping("/contract/{contractId}")
    public ResponseEntity<?> getRequestsByContract(
            @PathVariable Long contractId,
            Authentication authentication) {

        contractRepository.findById(contractId)
                .orElseThrow(() ->
                        new RuntimeException("Contract not found"));

        return ResponseEntity.ok(
                modificationRequestRepository
                        .findByContractId(contractId)
        );
    }


    // =========================================================
    // GET REQUEST BY ID
    // =========================================================
    @GetMapping("/{requestId}")
    public ResponseEntity<?> getRequestById(
            @PathVariable Long requestId) {

        ModificationRequest request =
                modificationRequestRepository
                        .findById(requestId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Modification request not found"
                                ));

        return ResponseEntity.ok(request);
    }


    // =========================================================
    // REVIEW MODIFICATION REQUEST
    // ONLY REVIEWER CAN APPROVE / REJECT
    // =========================================================
    @Transactional
    @PutMapping("/{requestId}/review")
    public ResponseEntity<?> reviewRequest(
            @PathVariable Long requestId,
            @RequestParam String status,
            @RequestParam(required = false) String comments,
            Authentication authentication) {

        // Find modification request
        ModificationRequest request =
                modificationRequestRepository
                        .findById(requestId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Modification request not found"
                                ));

        // Current reviewer
        User reviewer =
                userRepository
                        .findByUsername(authentication.getName())
                        .orElseThrow(() ->
                                new RuntimeException("User not found"));

        String role = reviewer.getRole().getName();

        // =====================================================
        // ONLY REVIEWER CAN APPROVE / REJECT
        // =====================================================

        if (!"REVIEWER".equalsIgnoreCase(role)) {

            return ResponseEntity.status(403)
                    .body(
                            "Only Reviewer can approve or reject modification requests"
                    );
        }

        // =====================================================
        // VALIDATE STATUS
        // =====================================================

        if (!"APPROVED".equalsIgnoreCase(status) &&
                !"REJECTED".equalsIgnoreCase(status)) {

            return ResponseEntity.badRequest()
                    .body(
                            "Status must be APPROVED or REJECTED"
                    );
        }

        // =====================================================
        // ONLY PENDING REQUESTS CAN BE REVIEWED
        // =====================================================

        if (!"PENDING".equalsIgnoreCase(request.getStatus())) {

            return ResponseEntity.badRequest()
                    .body(
                            "Only PENDING requests can be reviewed"
                    );
        }

        // =====================================================
        // REJECTION REASON REQUIRED
        // =====================================================

        if ("REJECTED".equalsIgnoreCase(status) &&
                (comments == null || comments.isBlank())) {

            return ResponseEntity.badRequest()
                    .body(
                            "Rejection reason is required"
                    );
        }

        // =====================================================
        // UPDATE REQUEST
        // =====================================================

        request.setStatus(status.toUpperCase());
        request.setReviewedBy(reviewer);
        request.setReviewerComments(comments);
        request.setReviewedAt(
                java.time.LocalDateTime.now()
        );


        // =====================================================
        // IF APPROVED
        // CREATE NEW VERSION + MODIFICATION HISTORY
        // =====================================================

        if ("APPROVED".equalsIgnoreCase(status)) {

            Long contractId =
                    request.getContract().getId();

            // -------------------------------------------------
            // FIND LATEST VERSION
            // -------------------------------------------------

            Version latestVersion =
                    versionRepository
                            .findByContractIdOrderByVersionNumberDesc(
                                    contractId
                            )
                            .stream()
                            .findFirst()
                            .orElse(null);

            // -------------------------------------------------
            // NEXT VERSION NUMBER
            // -------------------------------------------------

            Integer nextVersionNumber =
                    latestVersion != null
                            ? latestVersion.getVersionNumber() + 1
                            : 1;

            // -------------------------------------------------
            // CREATE NEW VERSION
            // -------------------------------------------------

            Version newVersion =
                    Version.builder()
                            .contract(request.getContract())
                            .versionNumber(nextVersionNumber)
                            .document(
                                    latestVersion != null
                                            ? latestVersion.getDocument()
                                            : null
                            )
                            .createdBy(request.getRequestedBy())
                            .status("APPROVED")
                            .changeSummary(request.getReason())
                            .build();

            Version savedVersion =
                    versionRepository.save(newVersion);

            // -------------------------------------------------
            // CREATE MODIFICATION HISTORY
            // -------------------------------------------------

            Modification modification =
                    Modification.builder()
                            .version(savedVersion)
                            .clause(request.getClause())
                            .modifiedBy(request.getRequestedBy())
                            .oldContent(request.getOriginalValue())
                            .newContent(
                                    request.getProposedModification()
                            )
                            .changeReason(request.getReason())
                            .build();

            modificationRepository.save(modification);
        }


        // =====================================================
        // SAVE REQUEST
        // =====================================================

        ModificationRequest savedRequest =
                modificationRequestRepository.save(request);


        // =====================================================
        // AUDIT LOG
        // =====================================================

        String auditAction =
                "APPROVED".equalsIgnoreCase(status)
                        ? "MODIFICATION_APPROVE"
                        : "MODIFICATION_REJECT";

        auditLogService.log(
                reviewer,
                auditAction,
                "MODIFICATION_REQUEST",
                savedRequest.getId(),
                "Modification request "
                        + status.toLowerCase()
                        + " by "
                        + reviewer.getUsername()
                        + (
                        comments != null &&
                                !comments.isBlank()
                                ? ". Comments: " + comments
                                : ""
                )
        );

        return ResponseEntity.ok(savedRequest);
    }
}