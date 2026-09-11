package com.legalcontract.service;

import com.legalcontract.entity.AuditLog;
import com.legalcontract.entity.User;
import com.legalcontract.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void log(
            User user,
            String action,
            String entityType,
            Long entityId,
            String description
    ) {
        AuditLog auditLog = new AuditLog();

        auditLog.setUser(user);
        auditLog.setAction(action);
        auditLog.setEntityType(entityType);
        auditLog.setEntityId(entityId);
        auditLog.setDescription(description);

        auditLogRepository.save(auditLog);
    }
}