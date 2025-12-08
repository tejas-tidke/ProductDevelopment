package com.htc.productdevelopment.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.htc.productdevelopment.config.JiraFieldConfig;
import com.htc.productdevelopment.dto.ContractCompletedRequest;
import com.htc.productdevelopment.dto.ContractDTO;
import com.htc.productdevelopment.model.ContractAttachment;
import com.htc.productdevelopment.model.ContractDetails;
import com.htc.productdevelopment.model.ContractProposal;
import com.htc.productdevelopment.repository.ContractDetailsRepository;
import com.htc.productdevelopment.repository.ContractProposalRepository;
import com.htc.productdevelopment.service.ContractDetailsService;
import com.htc.productdevelopment.service.ContractProposalService;
import com.htc.productdevelopment.service.JiraService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Controller class for handling contract-related API requests
 * This controller provides endpoints for contract management operations
 */
@RestController
@RequestMapping("/api/jira/contracts")

public class ContractController {

    // Logger for tracking controller operations
    private static final Logger logger = LoggerFactory.getLogger(ContractController.class);
    
    // Services for handling contract operations
    private final ContractDetailsService contractDetailsService;
    private final ContractProposalService contractProposalService;
    private final JiraService jiraService;
    private final JiraFieldConfig jiraFieldConfig;

    @Autowired
    private ContractDetailsRepository contractDetailsRepository;

    @Autowired
    private ContractProposalRepository contractProposalRepository;
    
    public ContractController(ContractDetailsService contractDetailsService,
                          ContractProposalService contractProposalService,
                          JiraService jiraService,
                          JiraFieldConfig jiraFieldConfig) {
        this.contractDetailsService = contractDetailsService;
        this.contractProposalService = contractProposalService;
        this.jiraService = jiraService;
        this.jiraFieldConfig = jiraFieldConfig;
    }

    @GetMapping
    public ResponseEntity<?> getAllContracts() {
        try {
           logger.info("Received request to fetch all contracts");
           return ResponseEntity.ok(contractDetailsService.getAllContracts());
       } catch (Exception e) {
           logger.error("Error fetching all contracts", e);
           return (ResponseEntity<?>) ResponseEntity.internalServerError()
                   .body(Map.of("message", "Failed to fetch contracts: " + e.getMessage()));
       }
    }

    // Add this new endpoint for fetching contracts by type as DTOs
    @GetMapping("/type/{contractType}/dto")
    public ResponseEntity<?> getContractsByTypeAsDTO(@PathVariable String contractType) {
        try {
            logger.info("Received request to fetch contracts by type: {}", contractType);
            List<ContractDTO> contracts = contractDetailsService.getContractsByTypeAsDTO(contractType);
            logger.info("Returning {} contracts", contracts.size());
            return ResponseEntity.ok(contracts);
        } catch (Exception e) {
            logger.error("Error fetching contracts by type: {}", contractType, e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Failed to fetch contracts: " + e.getMessage()));
        }
    }

    @PostMapping("/create")
    public ResponseEntity<?> createContractIssue(@RequestBody Map<String,Object> issueData) {
        try {
            JsonNode result = jiraService.createIssueJira(issueData);
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * Get all completed contract details for procurement renewal page
     * @return List of completed contract details
     */
    @GetMapping("/completed")
    public ResponseEntity<?> getCompletedContracts() {
        try {
            logger.info("Fetching COMPLETED contracts (renewalStatus=completed)");

            List<ContractDetails> completed = 
                    contractDetailsService.getContractsByRenewalStatus("completed");

            List<ContractDTO> dtoList = completed.stream().map(c -> {
                ContractDTO dto = new ContractDTO();

                dto.setId(c.getId());
                dto.setContractType(c.getContractType());
                dto.setRenewalStatus(c.getRenewalStatus());   // ⭐ IMPORTANT
                dto.setJiraIssueKey(c.getJiraIssueKey());

                dto.setNameOfVendor(c.getNameOfVendor());
                dto.setProductName(c.getProductName());
                dto.setRequesterName(c.getRequesterName());
                dto.setRequesterEmail(c.getRequesterMail());
                dto.setRequesterDepartment(c.getRequesterDepartment());
                dto.setRequesterOrganization(c.getRequesterOrganization());

                dto.setVendorContractType(c.getVendorContractType());
                dto.setAdditionalComment(c.getAdditionalComment());
                dto.setBillingType(c.getBillingType());
                dto.setLicenseUpdateType(c.getLicenseUpdateType());
                dto.setExistingContractId(c.getExistingContractId());
                dto.setContractDuration(c.getContractDuration());

                dto.setCurrentLicenseCount(c.getCurrentLicenseCount());
                dto.setCurrentUsageCount(c.getCurrentUsageCount());
                dto.setCurrentUnits(c.getCurrentUnits());

                dto.setNewLicenseCount(c.getNewLicenseCount());
                dto.setNewUsageCount(c.getNewUsageCount());
                dto.setNewUnits(c.getNewUnits());

                dto.setDueDate(c.getDueDate() != null ? c.getDueDate().toString() : null);
                dto.setRenewalDate(c.getRenewalDate() != null ? c.getRenewalDate().toString() : null);

                return dto;
            }).toList();

            return ResponseEntity.ok(dtoList);

        } catch (Exception e) {
            logger.error("Error fetching completed contracts", e);
            return ResponseEntity.status(500)
                    .body(Map.of("message", e.getMessage()));
        }
    }


    //----------------------------------------------------------
    //⭐ NEW API — Save contract as COMPLETED
    //----------------------------------------------------------
    @PostMapping("/mark-completed")
    public ResponseEntity<?> markContractCompleted(@RequestBody ContractCompletedRequest request) {
        try {
            logger.info("Received request to mark contract as completed: {}", request);

            if (request.getIssueKey() == null || request.getTransitionKey() == null) {
                return ResponseEntity.badRequest().body("Missing issueKey or transitionKey");
            }

            // ⭐ 1. CHECK CURRENT STATUS FIRST
            String currentStatus = jiraService.getIssueStatus(request.getIssueKey());
            logger.info("Current Jira status for {} is: {}", request.getIssueKey(), currentStatus);

            // If already completed → SKIP Jira transition
            if (currentStatus != null && currentStatus.equalsIgnoreCase("completed")) {
                logger.warn("Skipping Jira transition — issue already completed.");
            } else {
                // ⭐ 2. TRANSITION ONLY IF NOT COMPLETED
                boolean success = jiraService.transitionIssueByKey(
                        request.getIssueKey(),
                        request.getTransitionKey()
                );

                if (!success) {
                    return ResponseEntity.badRequest().body("Transition failed");
                }
            }

            // ⭐ 3. SAVE CONTRACT DATA
            ContractDetails contract = contractDetailsService.findByJiraIssueKey(request.getIssueKey());
            if (contract == null) {
                contract = new ContractDetails();
            }

            contract.setRenewalStatus("completed");
            contract.setJiraIssueKey(request.getIssueKey());
            contract.setContractType("existing");
            contract.setNameOfVendor(request.getNameOfVendor());
            contract.setProductName(request.getProductName());
            contract.setRequesterName(request.getRequesterName());
            contract.setRequesterMail(request.getRequesterMail());
            contract.setRequesterDepartment(request.getRequesterDepartment());
            contract.setRequesterOrganization(request.getRequesterOrganization());
            contract.setCurrentLicenseCount(request.getCurrentLicenseCount());
            contract.setCurrentUsageCount(request.getCurrentUsageCount());
            contract.setCurrentUnits(request.getCurrentUnits());
            contract.setNewLicenseCount(request.getNewLicenseCount());
            contract.setNewUsageCount(request.getNewUsageCount());
            contract.setNewUnits(request.getNewUnits());
            contract.setAdditionalComment(request.getAdditionalComment());
            contract.setVendorContractType(request.getVendorContractType());
            contract.setLicenseUpdateType(request.getLicenseUpdateType());
            contract.setExistingContractId(request.getExistingContractId());
            contract.setBillingType(request.getBillingType());
            contract.setContractDuration(request.getContractDuration());

            if (request.getDueDate() != null && !request.getDueDate().trim().isEmpty()) {
                contract.setDueDate(LocalDate.parse(request.getDueDate()));
            }

            if (request.getRenewalDate() != null && !request.getRenewalDate().trim().isEmpty()) {
                contract.setRenewalDate(LocalDate.parse(request.getRenewalDate()));
            }

            ContractDetails saved = contractDetailsService.saveCompletedContract(contract);
            logger.info("Completed contract saved with ID: {}", saved.getId());

            return ResponseEntity.ok(Map.of("message", "Contract saved successfully!"));

        } catch (Exception e) {
            logger.error("Error saving completed contract", e);
            return ResponseEntity.status(500)
                    .body(Map.of("message", e.getMessage()));
        }
    }
    
    /**
     * Get profit data for a contract
     * @param issueKey The Jira issue key
     * @return Profit data and submission status
     */
    @GetMapping("/profit/{issueKey}")
    public ResponseEntity<?> getContractProfit(@PathVariable String issueKey) {
        try {
            logger.info("Received request for profit data for issueKey: {}", issueKey);
            
            // Validate required fields
            if (issueKey == null || issueKey.isEmpty()) {
                logger.warn("Missing issueKey in profit request");
                return ResponseEntity.badRequest().body(Map.of("error", "Missing issueKey"));
            }
            
            logger.info("Processing profit request for issueKey: {}", issueKey);
            
            // Initialize default values
            boolean hasSubmittedFinalQuote = false;
            Double totalProfit = null;
            
            try {
                // Check if final quote has been submitted by looking at proposals
                logger.info("Fetching proposals for issueKey: {}", issueKey);
                List<ContractProposal> proposals = contractProposalService.getProposalsForIssue(issueKey);
                logger.info("Found {} proposals for issueKey: {}", proposals.size(), issueKey);
                hasSubmittedFinalQuote = proposals.stream().anyMatch(p -> p.isFinal());
                logger.info("hasSubmittedFinalQuote: {} for issueKey: {}", hasSubmittedFinalQuote, issueKey);
                
                // Get the total optimized cost field value directly from Jira
                logger.info("Calling JiraService to get field value for issueKey: {} and fieldId: {}", issueKey, jiraFieldConfig.getTotaloptimizedcost());
                String totalProfitStr = jiraService.getIssueFieldValue(issueKey, jiraFieldConfig.getTotaloptimizedcost());
                logger.info("Received totalProfitStr: '{}' for issueKey: {}", totalProfitStr, issueKey);
                if (totalProfitStr != null && !totalProfitStr.isEmpty()) {
                    try {
                        totalProfit = Double.parseDouble(totalProfitStr);
                        logger.info("Parsed totalProfit: {} for issueKey: {}", totalProfit, issueKey);
                    } catch (NumberFormatException e) {
                        logger.warn("Failed to parse total optimized cost value '{}' for issueKey: {}", totalProfitStr, issueKey, e);
                    }
                } else {
                    logger.info("totalProfitStr is null or empty for issueKey: {}", issueKey);
                }
                
                logger.info("Successfully retrieved optimized cost data for issueKey: {} - profit: {}, finalSubmitted: {}", 
                           issueKey, totalProfit, hasSubmittedFinalQuote);
            } catch (Exception e) {
                logger.warn("Failed to fetch optimized cost data from Jira for issueKey: {}", issueKey, e);
                // Return default values instead of error to avoid breaking the UI
            }
            
            logger.info("Returning profit data for issueKey: {} - profit: {}, finalSubmitted: {}", 
                       issueKey, totalProfit, hasSubmittedFinalQuote);
            
            return ResponseEntity.ok(Map.of(
                "totalProfit", totalProfit,
                "hasSubmittedFinalQuote", hasSubmittedFinalQuote,
                "issueKey", issueKey
            ));
            
        } catch (Exception e) {
            logger.error("Error retrieving profit data for issueKey: {}", issueKey, e);
            // Return default values instead of error to avoid breaking the UI
            logger.info("Returning default values for issueKey: {} due to error", issueKey);
            return ResponseEntity.ok(Map.of(
                "totalProfit", null,
                "hasSubmittedFinalQuote", false,
                "issueKey", issueKey
            ));
        }
    }
    
    @PostMapping("/save-attachment")
    public ResponseEntity<?> saveAttachmentToContract(@RequestBody Map<String, Object> payload) {

        try {
            String issueKey = (String) payload.get("issueKey");
            
            // Extract fields directly from payload (not from metadata object)
            String fileName = payload.get("fileName") != null ? payload.get("fileName").toString() : "";
            String fileUrl = payload.get("fileUrl") != null ? payload.get("fileUrl").toString() : "";
            Long fileSize = payload.get("fileSize") != null ? Long.valueOf(payload.get("fileSize").toString()) : 0L;
            String mimeType = payload.get("mimeType") != null ? payload.get("mimeType").toString() : "";
            String uploadedBy = payload.get("uploadedBy") != null ? payload.get("uploadedBy").toString() : "system";
            String stage = payload.get("stage") != null ? payload.get("stage").toString() : "CREATION";
            Long proposalId = payload.get("proposalId") != null ? Long.valueOf(payload.get("proposalId").toString()) : null;
            
            // Removed fileContent processing since we're no longer storing attachment content in DB
            // Jira handles attachment storage

            logger.info("Saving attachment metadata in DB for issueKey={} file={}", issueKey, fileName);

            // Get proposal if proposalId is provided
            // Note: This requires ContractProposalRepository to be autowired

            ContractProposal proposal = null;
            if (proposalId != null) {
                proposal = contractProposalRepository.findById(proposalId).orElse(null);
            }

            ContractAttachment attachment = new ContractAttachment();
            attachment.setContract(null);
            attachment.setProposal(proposal);
            attachment.setJiraIssueKey(issueKey);
            attachment.setFileName(fileName);
            attachment.setFileUrl(fileUrl);
            attachment.setFileSize(fileSize);
            attachment.setMimeType(mimeType);
            attachment.setUploadedBy(uploadedBy);
            attachment.setStage(stage);
            // Removed setting fileContent since we're not storing it anymore

            // Note: This requires ContractAttachmentRepository to be autowired
            // contractAttachmentRepository.save(attachment);

            return ResponseEntity.ok(Map.of("message", "Attachment metadata saved successfully"));

        } catch (Exception e) {
            logger.error("Failed saving attachment: ", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/add-proposal")
    public ResponseEntity<?> addProposal(@RequestBody Map<String, Object> payload) {

        try {
            String issueKey = (String) payload.get("jiraIssueKey");

            if (issueKey == null) {
                issueKey = (String) payload.get("issueKey"); // fallback
            }
            Integer licenseCount = payload.get("licenseCount") != null
                    ? Integer.valueOf(payload.get("licenseCount").toString()) : null;

            Double unitCost = payload.get("unitCost") != null
                    ? Double.valueOf(payload.get("unitCost").toString()) : null;

            Double totalCost = payload.get("totalCost") != null
                    ? Double.valueOf(payload.get("totalCost").toString())
                    : (unitCost != null && licenseCount != null ? unitCost * licenseCount : null);

            String comment = (String) payload.get("comment");
            boolean isFinal = payload.get("isFinal") != null && (Boolean) payload.get("isFinal");

            // ❌ DO NOT CREATE CONTRACT HERE
            ContractDetails contract = contractDetailsRepository.findByJiraIssueKey(issueKey);
            // If null, keep null (contract is created only at COMPLETED status)

            ContractProposal last = contractProposalRepository
                    .findTopByJiraIssueKeyIgnoreCaseOrderByProposalNumberDesc(issueKey);


            int proposalNumber = last == null ? 1 : last.getProposalNumber() + 1;

            ContractProposal proposal = new ContractProposal();
            proposal.setContract(contract);  // can be null
            proposal.setJiraIssueKey(issueKey);
            proposal.setProposalNumber(proposalNumber);
            proposal.setLicenseCount(licenseCount);
            proposal.setUnitCost(unitCost);
            proposal.setTotalCost(totalCost);
            proposal.setComment(comment);
            proposal.setFinal(isFinal);
            proposal.setProposalType(isFinal ? "FINAL" : "PROPOSAL " + proposalNumber);

            contractProposalRepository.save(proposal);

            return ResponseEntity.ok(Map.of(
                    "message", "Proposal saved",
                    "proposalId", proposal.getId()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Update license count and total optimized cost for a contract
     * @param payload Request payload containing issueKey, newLicenseCount, and totalProfit
     * @return Response indicating success or failure
     */
    @PostMapping("/update-license-count")
    public ResponseEntity<?> updateLicenseCount(@RequestBody Map<String, Object> payload) {
        try {
            logger.info("Received request to update license count with payload: {}", payload);
            
            // Extract required fields from payload
            String issueKey = (String) payload.get("issueKey");
            Object licenseCountObj = payload.get("newLicenseCount");
            Object totalProfitObj = payload.get("totalProfit");
            
            // Validate required fields
            if (issueKey == null || issueKey.isEmpty()) {
                logger.warn("Missing issueKey in update license count request");
                return ResponseEntity.badRequest().body(Map.of("error", "Missing issueKey"));
            }
            
            // Convert license count to Integer
            Integer newLicenseCount = null;
            if (licenseCountObj != null) {
                if (licenseCountObj instanceof Number) {
                    newLicenseCount = ((Number) licenseCountObj).intValue();
                } else if (licenseCountObj instanceof String) {
                    try {
                        newLicenseCount = Integer.parseInt((String) licenseCountObj);
                    } catch (NumberFormatException e) {
                        logger.warn("Invalid license count format: {}", licenseCountObj);
                        return ResponseEntity.badRequest().body(Map.of("error", "Invalid license count format"));
                    }
                }
            }
            
            // Convert total profit to Double (optional)
            Double totalProfit = null;
            if (totalProfitObj != null) {
                if (totalProfitObj instanceof Number) {
                    totalProfit = ((Number) totalProfitObj).doubleValue();
                } else if (totalProfitObj instanceof String) {
                    try {
                        totalProfit = Double.parseDouble((String) totalProfitObj);
                    } catch (NumberFormatException e) {
                        logger.warn("Invalid total profit format: {}", totalProfitObj);
                        // Don't fail the request for invalid profit, just ignore it
                    }
                }
            }
            
            // Update the license count and profit
            ContractDetails updatedContract = contractDetailsService.updateLicenseCountAndProfit(
                issueKey, newLicenseCount, totalProfit);
            
            logger.info("Successfully updated license count for issueKey: {}", issueKey);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "License count updated successfully");
            if (updatedContract.getId() != null) {
                response.put("contractId", updatedContract.getId());
            } else {
                response.put("issueKey", updatedContract.getJiraIssueKey());
            }
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error updating license count", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to update license count");
            errorResponse.put("message", e.getMessage() != null ? e.getMessage() : "Unknown error occurred");
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * Finalize contract submission for an issue
     * @param issueKey The Jira issue key
     * @return Success or error response
     */
    @PostMapping("/final-submit/{issueKey}")
    public ResponseEntity<?> finalSubmitContract(@PathVariable String issueKey) {
        try {
            logger.info("Received request to finalize contract submission for issueKey: {}", issueKey);
            
            // Validate required fields
            if (issueKey == null || issueKey.isEmpty()) {
                logger.warn("Missing issueKey in final submit request");
                return ResponseEntity.badRequest().body(Map.of("error", "Missing issueKey"));
            }
            
            // Calculate total optimized cost before marking as submitted
            Double totalProfit = contractProposalService.calculateTotalProfit(issueKey);
            
            // Update the total optimized cost in Jira
            if (totalProfit != null) {
                try {
                    // Update the contract with the calculated profit
                    contractDetailsService.updateLicenseCountAndProfit(issueKey, null, totalProfit);
                } catch (Exception e) {
                    logger.warn("Failed to update total optimized cost for issueKey: {}", issueKey, e);
                }
            }
            
            // Mark the contract as having a submitted final quote
            ContractDetails updatedContract = contractDetailsService.markFinalQuoteSubmitted(issueKey);
            
            logger.info("Successfully finalized contract submission for issueKey: {}", issueKey);
            return ResponseEntity.ok(Map.of(
                "message", "Contract finalized successfully",
                "issueKey", issueKey,
                "contractId", updatedContract.getId(),
                "totalProfit", totalProfit
            ));
            
        } catch (Exception e) {
            logger.error("Error finalizing contract submission for issueKey: {}", issueKey, e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to finalize contract submission",
                "message", e.getMessage()
            ));
        }
    }
}