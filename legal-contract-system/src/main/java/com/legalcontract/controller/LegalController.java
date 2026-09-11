package com.legalcontract.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/legal")
public class LegalController {

    @GetMapping("/test")
    public String legalTest() {
        return "LEGAL_USER access granted!";
    }
}