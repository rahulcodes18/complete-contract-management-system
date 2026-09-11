package com.legalcontract.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClauseUpdateRequest {

    private String clauseNumber;

    private String title;

    private String content;

    private String changeReason;
}