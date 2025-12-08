package com.htc.productdevelopment.service.exception;

public class JiraServiceException extends Exception {
    
    public JiraServiceException(String message) {
        super(message);
    }
    
    public JiraServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}