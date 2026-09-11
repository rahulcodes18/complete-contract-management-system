package com.legalcontract.controller;
import org.springframework.core.io.Resource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import com.legalcontract.entity.Contract;
import com.legalcontract.entity.Document;
import com.legalcontract.entity.User;
import com.legalcontract.repository.ContractRepository;
import com.legalcontract.repository.DocumentRepository;
import com.legalcontract.repository.UserRepository;
import com.legalcontract.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.legalcontract.repository.VersionRepository;
import com.legalcontract.entity.Version;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/contracts/{contractId}/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentRepository documentRepository;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final VersionRepository versionRepository;

    // =========================
    // UPLOAD DOCUMENT
    // =========================
    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(
            @PathVariable Long contractId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {

        // 1. Find contract
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() ->
                        new RuntimeException("Contract not found"));

        // 2. Find logged-in user
        String username = authentication.getName();

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        // 3. Check authorization
        String role = currentUser.getRole().getName();

        if (!role.equals("ADMIN")) {

            if (!role.equals("LEGAL_USER") ||
                    !contract.getCreatedBy().getId()
                            .equals(currentUser.getId())) {

                return ResponseEntity.status(403)
                        .body("You are not authorized to upload document");
            }
        }

        // 4. Check file
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("Please select a file");
        }

        // 5. Create upload directory
        Path uploadDir = Paths.get("uploads");

        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        // 6. Generate unique file name
        String originalFileName = file.getOriginalFilename();

        String fileName =
                UUID.randomUUID() + "_" + originalFileName;

        Path filePath = uploadDir.resolve(fileName);

        // 7. Save file
        Files.copy(
                file.getInputStream(),
                filePath
        );

        // 8. Create Document entity
        Document document = new Document();

        document.setContract(contract);
        document.setFileName(originalFileName);
        document.setFileType(file.getContentType());
        document.setFilePath(filePath.toString());
        document.setUploadedBy(currentUser);

        // 9. Save database record
        Document savedDocument =
                documentRepository.save(document);

        // 10. Create initial version if this is the first document
        List<Version> existingVersions =
                versionRepository.findByContractIdOrderByVersionNumberDesc(contractId);

        if (existingVersions.isEmpty()) {

            Version version = new Version();

            version.setContract(contract);
            version.setVersionNumber(1);
            version.setDocument(savedDocument);
            version.setCreatedBy(currentUser);
            version.setStatus("DRAFT");
            version.setChangeSummary("Initial version of the contract.");

            versionRepository.save(version);
        }
        // 10. Create audit log
        auditLogService.log(
                currentUser,
                "UPLOAD",
                "DOCUMENT",
                savedDocument.getId(),
                "Document uploaded: " + originalFileName
        );

        return ResponseEntity.ok(savedDocument);
    }

    // =========================
    // GET DOCUMENTS FOR CONTRACT
    // =========================
    @GetMapping
    public ResponseEntity<List<Document>> getDocuments(
            @PathVariable Long contractId) {

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() ->
                        new RuntimeException("Contract not found"));

        List<Document> documents =
                documentRepository.findAll()
                        .stream()
                        .filter(document ->
                                document.getContract()
                                        .getId()
                                        .equals(contract.getId()))
                        .toList();


        return ResponseEntity.ok(documents);
    }
    // =========================
// VIEW DOCUMENT
// =========================
    @GetMapping("/{documentId}/view")
    public ResponseEntity<Resource> viewDocument(
            @PathVariable Long contractId,
            @PathVariable Long documentId) {

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() ->
                        new RuntimeException("Document not found"));

        // Make sure document belongs to this contract
        if (!document.getContract().getId().equals(contractId)) {
            return ResponseEntity.badRequest().build();
        }

        Path filePath = Paths.get(document.getFilePath());

        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }
        User currentUser = userRepository.findByUsername(
                org.springframework.security.core.context.SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getName()
        ).orElseThrow(() -> new RuntimeException("User not found"));

        auditLogService.log(
                currentUser,
                "DOWNLOAD",
                "DOCUMENT",
                document.getId(),
                "Document downloaded: " + document.getFileName()
        );
        Resource resource = new FileSystemResource(filePath);

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;

        if (document.getFileType() != null) {
            try {
                mediaType = MediaType.parseMediaType(document.getFileType());
            } catch (Exception ignored) {
            }
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + document.getFileName() + "\""
                )
                .body(resource);
    }


    // =========================
// DOWNLOAD DOCUMENT
// =========================
    @GetMapping("/{documentId}/download")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long contractId,
            @PathVariable Long documentId) {

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() ->
                        new RuntimeException("Document not found"));

        // Make sure document belongs to this contract
        if (!document.getContract().getId().equals(contractId)) {
            return ResponseEntity.badRequest().build();
        }

        Path filePath = Paths.get(document.getFilePath());

        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }
        User currentUser = userRepository.findByUsername(
                org.springframework.security.core.context.SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getName()
        ).orElseThrow(() -> new RuntimeException("User not found"));

        auditLogService.log(
                currentUser,
                "VIEW",
                "DOCUMENT",
                document.getId(),
                "Document viewed: " + document.getFileName()
        );
        Resource resource = new FileSystemResource(filePath);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + document.getFileName() + "\""
                )
                .body(resource);
    }

}

