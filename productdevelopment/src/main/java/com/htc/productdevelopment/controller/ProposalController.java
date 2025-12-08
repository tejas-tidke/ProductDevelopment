package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.model.ContractAttachment;
import com.htc.productdevelopment.model.ContractProposal;
import com.htc.productdevelopment.model.Proposal;
import com.htc.productdevelopment.repository.ContractProposalRepository;
import com.htc.productdevelopment.service.ContractAttachmentService;
import com.htc.productdevelopment.service.ContractProposalService;
import com.htc.productdevelopment.service.ProposalService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Controller class for handling proposal-related API requests
 * This controller provides endpoints for proposal management operations
 */
@RestController
@RequestMapping("/api/jira/proposals")

public class ProposalController {

    // Logger for tracking controller operations
    private static final Logger logger = LoggerFactory.getLogger(ProposalController.class);
    
    // Services and repositories for handling proposal operations
    private final ProposalService proposalService;
    private final ContractProposalService contractProposalService;
    private final ContractAttachmentService contractAttachmentService;
    private final ContractProposalRepository contractProposalRepository;

    public ProposalController(ProposalService proposalService,
                            ContractProposalService contractProposalService,
                            ContractAttachmentService contractAttachmentService,
                            ContractProposalRepository contractProposalRepository) {
        this.proposalService = proposalService;
        this.contractProposalService = contractProposalService;
        this.contractAttachmentService = contractAttachmentService;
        this.contractProposalRepository = contractProposalRepository;
    }

    /**
     * Save proposal data with attachments
     * @param proposalData The proposal data to save
     * @return The saved proposal
     */
    @PostMapping
    public ResponseEntity<?> saveProposal(@RequestBody Proposal proposalData) {
        try {
            logger.info("Received request to save proposal data: {}", proposalData);
            
            Proposal savedProposal = proposalService.saveProposal(proposalData);
            logger.info("Proposal saved successfully with ID: {}", savedProposal.getId());
            
            return ResponseEntity.ok(savedProposal);
        } catch (Exception e) {
            logger.error("Error saving proposal", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to save proposal: " + e.getMessage()));
        }
    }

    /**
     * Get all proposals for a specific issue
     * @param issueKey The issue key
     * @return List of proposals for the issue
     */
    @GetMapping("/issue/{issueKey}")
    public ResponseEntity<?> getProposalsByIssueKey(@PathVariable String issueKey) {
        try {
            logger.info("Received request to fetch proposals for issue: {}", issueKey);

            if (issueKey == null || issueKey.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Issue key cannot be empty"));
            }

            String cleanedKey = issueKey.trim();

            List<ContractProposal> proposals = new ArrayList<>();
            try {
                proposals = contractProposalRepository.findByJiraIssueKeyIgnoreCaseOrderByProposalNumberAsc(cleanedKey);
            } catch (Exception e) {
                logger.warn("Failed to fetch proposals from database for issueKey: {}", cleanedKey, e);
                // Return empty list instead of error
                proposals = new ArrayList<>();
            }

            logger.info("Found {} proposals for issue: {}", proposals.size(), cleanedKey);

            return ResponseEntity.ok(
                    proposals.stream().map(p -> {
                        Map<String, Object> proposalMap = new HashMap<>();
                        proposalMap.put("id", p.getId());
                        proposalMap.put("jiraIssueKey", p.getJiraIssueKey());
                        proposalMap.put("proposalNumber", p.getProposalNumber());
                        proposalMap.put("licenseCount", p.getLicenseCount());
                        proposalMap.put("unitCost", p.getUnitCost());
                        proposalMap.put("totalCost", p.getTotalCost());
                        proposalMap.put("comment", p.getComment());
                        proposalMap.put("isFinal", p.isFinal());
                        proposalMap.put("isFinalSubmitted", p.isFinalSubmitted());
                        proposalMap.put("proposalType", p.getProposalType());
                        proposalMap.put("createdAt", p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
                        return proposalMap;
                    }).toList()
                );
        } catch (Exception e) {
            logger.error("Error fetching proposals for issue: {}", issueKey, e);
            // Return empty list instead of error to avoid breaking the UI
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @GetMapping("/{proposalId}")
    public ResponseEntity<?> getProposalById(@PathVariable Long proposalId) {
        try {
            ContractProposal proposal = contractProposalRepository.findById(proposalId)
                    .orElse(null);

            if (proposal == null) {
                return ResponseEntity.status(404)
                        .body(Map.of("message", "Proposal not found"));
            }

            // Return the proposal data in the format expected by the frontend
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("id", proposal.getId());
            responseData.put("jiraIssueKey", proposal.getJiraIssueKey());
            responseData.put("proposalNumber", proposal.getProposalNumber());
            responseData.put("proposalType", proposal.getProposalType());
            responseData.put("licenseCount", proposal.getLicenseCount());
            responseData.put("unitCost", proposal.getUnitCost());
            responseData.put("totalCost", proposal.getTotalCost());
            responseData.put("comment", proposal.getComment());
            responseData.put("final", proposal.isFinal());
            responseData.put("isFinalSubmitted", proposal.isFinalSubmitted());
            responseData.put("createdAt", proposal.getCreatedAt() != null ? proposal.getCreatedAt().toString() : null);
            return ResponseEntity.ok(responseData);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to fetch proposal: " + e.getMessage()));
        }
    }

    @GetMapping("/{proposalId}/attachments")
    public ResponseEntity<?> getAttachmentsByProposalId(@PathVariable Long proposalId) {
        try {
            List<ContractAttachment> attachments = contractAttachmentService.getAttachmentsByProposalId(proposalId);
            return ResponseEntity.ok(attachments);
        } catch (Exception e) {
            logger.error("Error fetching attachments for proposal ID: {}", proposalId, e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch attachments: " + e.getMessage()));
        }
    }
}