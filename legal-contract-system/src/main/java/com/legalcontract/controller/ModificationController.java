package com.legalcontract.controller;

import com.legalcontract.entity.Modification;
import com.legalcontract.repository.ContractRepository;
import com.legalcontract.repository.ModificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contracts/{contractId}/modifications")
@RequiredArgsConstructor
public class ModificationController {

    private final ModificationRepository modificationRepository;
    private final ContractRepository contractRepository;

    // =========================
    // GET ALL MODIFICATIONS
    // =========================
    @GetMapping
    public ResponseEntity<?> getAllModifications(
            @PathVariable Long contractId) {

        // Check if contract exists
        contractRepository.findById(contractId)
                .orElseThrow(() ->
                        new RuntimeException("Contract not found"));

        List<Modification> modifications =
                modificationRepository.findAll()
                        .stream()
                        .filter(modification ->
                                modification.getVersion()
                                        .getContract()
                                        .getId()
                                        .equals(contractId))
                        .toList();

        return ResponseEntity.ok(modifications);
    }

    // =========================
    // GET MODIFICATION BY ID
    // =========================
    @GetMapping("/{modificationId}")
    public ResponseEntity<?> getModificationById(
            @PathVariable Long contractId,
            @PathVariable Long modificationId) {

        Modification modification =
                modificationRepository.findById(modificationId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Modification not found"));

        // Verify modification belongs to this contract
        if (!modification.getVersion()
                .getContract()
                .getId()
                .equals(contractId)) {

            return ResponseEntity.badRequest()
                    .body(
                            "Modification does not belong to this contract"
                    );
        }

        return ResponseEntity.ok(modification);
    }
}