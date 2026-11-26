package com.example.demo.model;

/**
 * 创建用户时前端提交的数据。
 */
public record UserRequest(String name, String email, String role) {
}
