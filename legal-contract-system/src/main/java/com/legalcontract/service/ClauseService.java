package com.legalcontract.service;

import com.legalcontract.entity.Clause;

import java.util.List;

public interface ClauseService {

    Clause createClause(Long contractId, Clause clause);

    List<Clause> getClausesByContract(Long contractId);

    Clause getClauseById(Long clauseId);

    Clause updateClause(Long clauseId, Clause updatedClause);

    void deleteClause(Long clauseId);
}