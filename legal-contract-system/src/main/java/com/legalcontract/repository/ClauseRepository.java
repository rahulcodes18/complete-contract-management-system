package com.legalcontract.repository;
import java.util.List;
import com.legalcontract.entity.Clause;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClauseRepository extends JpaRepository<Clause, Long> {
    List<Clause> findByContractIdOrderByOrderNumberDesc(Long contractId);
    List<Clause> findByContractIdOrderByOrderNumberAsc(Long contractId);
}