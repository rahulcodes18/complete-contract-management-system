package com.legalcontract.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reviewer")
public class ReviewerController {

    @GetMapping("/test")
    public String reviewerTest() {
        return "REVIEWER access granted!";
    }
}