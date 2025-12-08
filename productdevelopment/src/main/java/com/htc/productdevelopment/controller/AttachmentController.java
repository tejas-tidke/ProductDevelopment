package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.model.ContractAttachment;
import com.htc.productdevelopment.repository.ContractAttachmentRepository;
import com.htc.productdevelopment.service.ContractAttachmentService;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Controller class for handling attachment-related API requests
 * This controller provides endpoints for attachment management operations
 */
@RestController
@RequestMapping("/api/jira/contracts/attachments")

public class AttachmentController {

    // Logger for tracking controller operations
    private static final Logger logger = LoggerFactory.getLogger(AttachmentController.class);
    
    // Services and repositories for handling attachment operations
    private final ContractAttachmentService contractAttachmentService;
    private final ContractAttachmentRepository contractAttachmentRepository;

    public AttachmentController(ContractAttachmentService contractAttachmentService,
                               ContractAttachmentRepository contractAttachmentRepository) {
        this.contractAttachmentService = contractAttachmentService;
        this.contractAttachmentRepository = contractAttachmentRepository;
    }
    
    @GetMapping("/issue/{issueKey}")
    public ResponseEntity<?> getAttachmentsByIssueKey(@PathVariable String issueKey) {
        try {
            List<ContractAttachment> attachments = contractAttachmentService.getAttachmentsByIssueKey(issueKey);
            return ResponseEntity.ok(attachments);
        } catch (Exception e) {
            logger.error("Error fetching attachments for issue key: {}", issueKey, e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch attachments: " + e.getMessage()));
        }
    }
    
    /**
     * Serve attachment file content
     * @param attachmentId The attachment ID
     * @return The attachment file content
     */
    @GetMapping("/{attachmentId}/content")
    public ResponseEntity<?> getAttachmentContent(@PathVariable Long attachmentId) {
        try {
            ContractAttachment attachment = contractAttachmentRepository.findById(attachmentId)
                    .orElse(null);
            
            if (attachment == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Since we no longer store file content locally, redirect to Jira for the attachment
            // Extract Jira attachment URL from our fileUrl
            String fileUrl = attachment.getFileUrl();
            if (fileUrl != null && !fileUrl.isEmpty()) {
                // Redirect to the Jira attachment URL
                return ResponseEntity.status(HttpStatus.FOUND)
                        .header(HttpHeaders.LOCATION, fileUrl)
                        .build();
            } else {
                // If we don't have a file URL, return not found
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error serving attachment content for ID: {}", attachmentId, e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to serve attachment: " + e.getMessage()));
        }
    }
}