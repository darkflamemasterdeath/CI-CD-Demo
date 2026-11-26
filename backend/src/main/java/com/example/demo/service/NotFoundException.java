package com.example.demo.service;

/**
 * 资源不存在异常，由全局异常处理器转成 HTTP 404。
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
