package com.legalcontract.repository;

import com.legalcontract.entity.ModificationRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ModificationRequestRepository
        extends JpaRepository<ModificationRequest, Long> {

    List<ModificationRequest> findByContractId(Long contractId);

    List<ModificationRequest> findByStatus(String status);

    List<ModificationRequest> findByRequestedById(Long userId);
}