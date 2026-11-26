package com.example.demo.controller;

import com.example.demo.service.UserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 系统类接口：探活 + 概览信息，方便前端确认后端连通性。
 */
@RestController
@RequestMapping("/api")
public class SystemController {

    private final UserService userService;

    public SystemController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/hello")
    public Map<String, Object> hello() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", "Hello from Spring Boot!");
        body.put("time", Instant.now().toString());
        body.put("userCount", userService.count());
        return body;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
