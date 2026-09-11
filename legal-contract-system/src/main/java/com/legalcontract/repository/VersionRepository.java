package com.legalcontract.repository;

import com.legalcontract.entity.Version;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VersionRepository extends JpaRepository<Version, Long> {

    List<Version> findByContractIdOrderByVersionNumberDesc(Long contractId);
}