package com.legalcontract.service;

import com.legalcontract.entity.Clause;
import com.legalcontract.entity.Contract;
import com.legalcontract.repository.ClauseRepository;
import com.legalcontract.repository.ContractRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClauseServiceImpl implements ClauseService {

    private final ClauseRepository clauseRepository;
    private final ContractRepository contractRepository;

    public ClauseServiceImpl(
            ClauseRepository clauseRepository,
            ContractRepository contractRepository) {
        this.clauseRepository = clauseRepository;
        this.contractRepository = contractRepository;
    }

    @Override
    public Clause createClause(Long contractId, Clause clause) {

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found"));

        clause.setContract(contract);

        return clauseRepository.save(clause);
    }

    @Override
    public List<Clause> getClausesByContract(Long contractId) {

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found"));

        return clauseRepository.findAll()
                .stream()
                .filter(clause -> clause.getContract().getId().equals(contract.getId()))
                .toList();
    }

    @Override
    public Clause getClauseById(Long clauseId) {

        return clauseRepository.findById(clauseId)
                .orElseThrow(() -> new RuntimeException("Clause not found"));
    }

    @Override
    public Clause updateClause(Long clauseId, Clause updatedClause) {

        Clause existingClause = clauseRepository.findById(clauseId)
                .orElseThrow(() -> new RuntimeException("Clause not found"));

        existingClause.setClauseNumber(updatedClause.getClauseNumber());
        existingClause.setTitle(updatedClause.getTitle());
        existingClause.setContent(updatedClause.getContent());

        return clauseRepository.save(existingClause);
    }

    @Override
    public void deleteClause(Long clauseId) {

        Clause clause = clauseRepository.findById(clauseId)
                .orElseThrow(() -> new RuntimeException("Clause not found"));

        clauseRepository.delete(clause);
    }
}