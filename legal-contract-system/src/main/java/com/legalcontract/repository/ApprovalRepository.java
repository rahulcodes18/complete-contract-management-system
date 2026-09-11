package com.legalcontract.repository;

import com.legalcontract.entity.Approval;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApprovalRepository extends JpaRepository<Approval, Long> {

    List<Approval> findByStatus(String status);
    Optional<Approval> findByVersionId(Long versionId);
}