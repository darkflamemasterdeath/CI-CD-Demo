package com.example.demo.model;

/**
 * 用户（返回给前端的数据结构）。
 */
public record User(Long id, String name, String email, String role) {
}
