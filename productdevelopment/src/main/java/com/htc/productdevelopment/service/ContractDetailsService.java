package com.htc.productdevelopment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.htc.productdevelopment.config.JiraFieldConfig;
import com.htc.productdevelopment.dto.ContractDTO;
import com.htc.productdevelopment.model.ContractDetails;
import com.htc.productdevelopment.repository.ContractDetailsRepository;
import com.htc.productdevelopment.service.JiraService;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
public class ContractDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(ContractDetailsService.class);

    private final ContractDetailsRepository contractDetailsRepository;
    @Lazy
    private final JiraService jiraService;
    private final JiraFieldConfig jiraFieldConfig;

    public ContractDetailsService(ContractDetailsRepository contractDetailsRepository, JiraService jiraService, JiraFieldConfig jiraFieldConfig) {
        this.contractDetailsRepository = contractDetailsRepository;
        this.jiraService = jiraService;
        this.jiraFieldConfig = jiraFieldConfig;
    }

    public List<ContractDetails> getAllContracts() {
        return contractDetailsRepository.findAll();
    }

    public List<ContractDetails> getContractsByVendor(String vendorName) {
        return contractDetailsRepository.findByNameOfVendorIgnoreCase(vendorName);
    }

    // ⭐ Add this method (required for duplicate prevention)
    public ContractDetails findByJiraIssueKey(String issueKey) {
        return contractDetailsRepository.findByJiraIssueKey(issueKey);
    }

    // ⭐ UNIVERSAL method — Controller will call this
    public List<ContractDetails> getContractsByRenewalStatus(String status) {
        logger.info("Fetching contracts where renewalStatus = {}", status);
        return contractDetailsRepository.findByRenewalStatusIgnoreCase(status);
    }

    // ⭐ NEW – This is the correct method used by procurement-renewal
    public List<ContractDetails> getCompletedContracts() {
        logger.info("Fetching renewalStatus = completed");
        return contractDetailsRepository.findByRenewalStatusIgnoreCase("completed");
    }
    
    // Get completed contracts by vendor name and product name
    public List<ContractDetails> getCompletedContractsByVendorAndProduct(String vendorName, String productName) {
        logger.info("Fetching completed contracts for vendor: {} and product: {}", vendorName, productName);
        return contractDetailsRepository.findByRenewalStatusAndNameOfVendorAndProductNameAllIgnoreCase("completed", vendorName, productName);
    }
    
    /**
     * Get subscription contracts (1-month duration) that are completed
     * @return List of subscription contracts
     */
    public List<ContractDetails> getSubscriptionContracts() {
        logger.info("Fetching subscription contracts (1-month duration)");
        List<ContractDetails> allCompleted = contractDetailsRepository.findByRenewalStatusIgnoreCase("completed");
        
        // Filter for contracts with 1-month duration
        List<ContractDetails> subscriptions = allCompleted.stream()
                .filter(contract -> {
                    if (contract.getContractDuration() == null) return false;
                    String duration = contract.getContractDuration().trim();
                    return "1".equals(duration);
                })
                .collect(Collectors.toList());
                
        logger.info("Found {} subscription contracts out of {} completed contracts", 
                   subscriptions.size(), allCompleted.size());
        
        return subscriptions;
    }

    // ⭐ DTO Conversion based on renewalStatus
    public List<ContractDTO> getContractsByTypeAsDTO(String contractType) {
        logger.info("Fetching contracts by OLD contractType filter: {}", contractType);

        List<ContractDetails> contracts =
                contractDetailsRepository.findByRenewalStatusIgnoreCase("completed");

        return contracts.stream().map(c -> {
            ContractDTO dto = new ContractDTO();

            dto.setId(c.getId());
            dto.setContractType(c.getContractType());
            dto.setJiraIssueKey(c.getJiraIssueKey());
            dto.setRenewalStatus(c.getRenewalStatus());

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
    }
    
    public ContractDetails saveContract(ContractDetails incoming) {
        logger.info("📌 Saving contract (generic save) for issueKey={}", incoming.getJiraIssueKey());

        if (incoming.getJiraIssueKey() == null) {
            throw new RuntimeException("jiraIssueKey cannot be null while saving contract");
        }

        // Duplicate prevention
        ContractDetails existing = contractDetailsRepository.findByJiraIssueKey(incoming.getJiraIssueKey());

        ContractDetails contract;
        if (existing != null) {
            logger.info("Updating existing contract id={}", existing.getId());
            contract = existing;
        } else {
            logger.info("Creating new contract");
            contract = new ContractDetails();
            contract.setJiraIssueKey(incoming.getJiraIssueKey());
        }

        // Copy fields
        contract.setRenewalStatus("completed");

        contract.setNameOfVendor(incoming.getNameOfVendor());
        contract.setProductName(incoming.getProductName());

        contract.setRequesterName(incoming.getRequesterName());
        contract.setRequesterMail(incoming.getRequesterMail());
        contract.setRequesterDepartment(incoming.getRequesterDepartment());
        contract.setRequesterOrganization(incoming.getRequesterOrganization());

        contract.setCurrentLicenseCount(incoming.getCurrentLicenseCount());
        contract.setCurrentUsageCount(incoming.getCurrentUsageCount());
        contract.setCurrentUnits(incoming.getCurrentUnits());

        contract.setNewLicenseCount(incoming.getNewLicenseCount());
        contract.setNewUsageCount(incoming.getNewUsageCount());
        contract.setNewUnits(incoming.getNewUnits());

        contract.setVendorContractType(incoming.getVendorContractType());
        contract.setLicenseUpdateType(incoming.getLicenseUpdateType());
        contract.setExistingContractId(incoming.getExistingContractId());
        contract.setBillingType(incoming.getBillingType());
        // Ensure contract duration is properly trimmed
        String contractDurationStr = incoming.getContractDuration();
        if (contractDurationStr != null) {
            contractDurationStr = contractDurationStr.trim();
            logger.info("Received contract duration in saveContract: '{}'", contractDurationStr);
        } else {
            logger.info("Received null contract duration in saveContract");
        }
        contract.setContractDuration(contractDurationStr);

        contract.setDueDate(incoming.getDueDate());
    
        // Set contract start date to current date when transitioning to completed
        LocalDate contractStartDate = LocalDate.now();
        contract.setContractStartDate(contractStartDate);
    
        // Calculate renewal date based on completion date + contract duration for completed requests
        logger.info("[saveContract] Processing contract duration string: '{}' (null: {}, empty: {})", 
                   contractDurationStr, 
                   contractDurationStr == null, 
                   contractDurationStr != null && contractDurationStr.isEmpty());
        LocalDate calculatedRenewalDate = null;
        if (contractDurationStr != null && !contractDurationStr.isEmpty()) {
            try {
                // Parse contract duration
                int contractDuration = Integer.parseInt(contractDurationStr);
                
                // Use current date as completion date for contracts marked as completed through UI
                LocalDate completionDate = contractStartDate;
                
                // Calculate renewal date = completion date + contract duration (in months)
                calculatedRenewalDate = completionDate.plusMonths(contractDuration);
                contract.setRenewalDate(calculatedRenewalDate);
                
                // Set contract end date to the same value as renewal date
                contract.setContractEndDate(calculatedRenewalDate);
                
                logger.info("Calculated renewal date: {} based on completion date: {} and contract duration: {} months", 
                    calculatedRenewalDate, completionDate, contractDuration);
            } catch (Exception e) {
                logger.warn("Failed to calculate renewal date based on contract duration: {}", contractDurationStr, e);
                
                // Fall back to the renewal date from incoming contract if calculation fails
                contract.setRenewalDate(incoming.getRenewalDate());
                // Also set contract end date to the same value as renewal date
                contract.setContractEndDate(incoming.getRenewalDate());
            }
        } else {
            // If no contract duration, fall back to the renewal date from incoming contract
            contract.setRenewalDate(incoming.getRenewalDate());
            // Also set contract end date to the same value as renewal date
            contract.setContractEndDate(incoming.getRenewalDate());
        }

        contract.setAdditionalComment(incoming.getAdditionalComment());

        ContractDetails saved = contractDetailsRepository.save(contract);

        logger.info("✔ Contract saved: {}", saved.getId());

        return saved;
    }


    public ContractDetails saveCompletedContract(ContractDetails incoming) {
        logger.info("📌 Saving completed contract for issueKey={}", incoming.getJiraIssueKey());

        if (incoming.getJiraIssueKey() == null) {
            throw new RuntimeException("jiraIssueKey cannot be null while saving completed contract");
        }

        // 1️⃣ Prevent duplicates by Jira Issue Key
        ContractDetails existing = contractDetailsRepository.findByJiraIssueKey(incoming.getJiraIssueKey());

        ContractDetails contract;

        if (existing != null) {
            logger.info("➡ Updating EXISTING contract ID={} for issueKey={}", existing.getId(), existing.getJiraIssueKey());
            contract = existing;
        } else {
            logger.info("➡ Creating NEW contract record for issueKey={}", incoming.getJiraIssueKey());
            contract = new ContractDetails();
            contract.setJiraIssueKey(incoming.getJiraIssueKey());
        }

        // 2️⃣ Required fields validation
        if (incoming.getNameOfVendor() == null || incoming.getNameOfVendor().trim().isEmpty()) {
            throw new RuntimeException("Vendor name cannot be null");
        }
        if (incoming.getProductName() == null || incoming.getProductName().trim().isEmpty()) {
            throw new RuntimeException("Product name cannot be null");
        }

        // 3️⃣ Copy all fields
        contract.setRenewalStatus("completed");
        contract.setContractType("existing");

        contract.setNameOfVendor(incoming.getNameOfVendor());
        contract.setProductName(incoming.getProductName());

        contract.setRequesterName(incoming.getRequesterName());
        contract.setRequesterMail(incoming.getRequesterMail());
        contract.setRequesterDepartment(incoming.getRequesterDepartment());
        contract.setRequesterOrganization(incoming.getRequesterOrganization());

        contract.setCurrentLicenseCount(incoming.getCurrentLicenseCount());
        contract.setCurrentUsageCount(incoming.getCurrentUsageCount());
        contract.setCurrentUnits(incoming.getCurrentUnits());

        contract.setNewLicenseCount(incoming.getNewLicenseCount());
        contract.setNewUsageCount(incoming.getNewUsageCount());
        contract.setNewUnits(incoming.getNewUnits());

        contract.setVendorContractType(incoming.getVendorContractType());
        contract.setLicenseUpdateType(incoming.getLicenseUpdateType());
        contract.setExistingContractId(incoming.getExistingContractId());
        contract.setBillingType(incoming.getBillingType());
        // Ensure contract duration is properly trimmed
        String contractDurationStr = incoming.getContractDuration();
        if (contractDurationStr != null) {
            contractDurationStr = contractDurationStr.trim();
            logger.info("Received contract duration in saveCompletedContract: '{}'", contractDurationStr);
        } else {
            logger.info("Received null contract duration in saveCompletedContract");
        }
        contract.setContractDuration(contractDurationStr);

        contract.setDueDate(incoming.getDueDate());
        
        // Set contract start date to current date when transitioning to completed
        LocalDate contractStartDate = LocalDate.now();
        contract.setContractStartDate(contractStartDate);
        
        // Calculate renewal date based on completion date + contract duration for completed requests
        logger.info("[saveCompletedContract] Processing contract duration string: '{}' (null: {}, empty: {})", 
                   contractDurationStr, 
                   contractDurationStr == null, 
                   contractDurationStr != null && contractDurationStr.isEmpty());
        LocalDate calculatedRenewalDate = null;
        if (contractDurationStr != null && !contractDurationStr.isEmpty()) {
            try {
                // Parse contract duration
                int contractDuration = Integer.parseInt(contractDurationStr);
                
                // Use current date as completion date for contracts marked as completed through UI
                LocalDate completionDate = contractStartDate;
                
                // Calculate renewal date = completion date + contract duration (in months)
                calculatedRenewalDate = completionDate.plusMonths(contractDuration);
                contract.setRenewalDate(calculatedRenewalDate);
                
                // Set contract end date to the same value as renewal date
                contract.setContractEndDate(calculatedRenewalDate);
                
                logger.info("Calculated renewal date: {} based on completion date: {} and contract duration: {} months", 
                    calculatedRenewalDate, completionDate, contractDuration);
            } catch (Exception e) {
                logger.warn("Failed to calculate renewal date based on contract duration: {}", contractDurationStr, e);
                
                // Fall back to the renewal date from incoming contract if calculation fails
                contract.setRenewalDate(incoming.getRenewalDate());
                // Also set contract end date to the same value as renewal date
                contract.setContractEndDate(incoming.getRenewalDate());
            }
        } else {
            // If no contract duration, fall back to the renewal date from incoming contract
            contract.setRenewalDate(incoming.getRenewalDate());
            // Also set contract end date to the same value as renewal date
            contract.setContractEndDate(incoming.getRenewalDate());
        }

        contract.setAdditionalComment(incoming.getAdditionalComment());
    
        // Set the total optimized cost if provided
        contract.setTotalOptimizedCost(incoming.getTotalOptimizedCost());

        // 4️⃣ Save and return
        ContractDetails saved = contractDetailsRepository.save(contract);

        logger.info("✅ Contract saved successfully with ID={} issueKey={}", saved.getId(), saved.getJiraIssueKey());

        return saved;
    }

    public ContractDetails saveManualAgreement(ContractDetails incoming) {
        logger.info("📌 Saving manual agreement for vendor={}", incoming.getNameOfVendor());

        // Create a new contract without requiring a Jira issue key
        ContractDetails contract = new ContractDetails();
        
        logger.info("Incoming contract data - Vendor: {}, Product: {}, Duration: {}", 
                   incoming.getNameOfVendor(), incoming.getProductName(), incoming.getContractDuration());
        
        // Log contract duration for debugging
        if (incoming.getContractDuration() != null) {
            logger.info("[DEBUG] Contract duration value: '{}' length: {}", 
                       incoming.getContractDuration(), incoming.getContractDuration().length());
        }
        
        // Generate a unique identifier for internal tracking
        String uniqueKey = "AGREEMENT-" + System.currentTimeMillis() % 1000000;
        contract.setJiraIssueKey(uniqueKey);

        // Required fields validation
        if (incoming.getNameOfVendor() == null || incoming.getNameOfVendor().trim().isEmpty()) {
            throw new RuntimeException("Vendor name cannot be null");
        }
        if (incoming.getProductName() == null || incoming.getProductName().trim().isEmpty()) {
            throw new RuntimeException("Product name cannot be null");
        }

        // Copy all fields
        contract.setRenewalStatus("completed");
        contract.setContractType("existing");

        contract.setNameOfVendor(incoming.getNameOfVendor());
        contract.setProductName(incoming.getProductName());

        contract.setRequesterName(incoming.getRequesterName());
        contract.setRequesterMail(incoming.getRequesterMail());
        contract.setRequesterDepartment(incoming.getRequesterDepartment());
        contract.setRequesterOrganization(incoming.getRequesterOrganization());

        contract.setCurrentLicenseCount(incoming.getCurrentLicenseCount());
        contract.setCurrentUsageCount(incoming.getCurrentUsageCount());
        contract.setCurrentUnits(incoming.getCurrentUnits());

        contract.setNewLicenseCount(incoming.getNewLicenseCount());
        contract.setNewUsageCount(incoming.getNewUsageCount());
        contract.setNewUnits(incoming.getNewUnits());

        contract.setVendorContractType(incoming.getVendorContractType());
        contract.setLicenseUpdateType(incoming.getLicenseUpdateType());
        contract.setExistingContractId(incoming.getExistingContractId());
        contract.setBillingType(incoming.getBillingType());
        
        // Ensure contract duration is properly trimmed
        String contractDurationStr = incoming.getContractDuration();
        if (contractDurationStr != null) {
            contractDurationStr = contractDurationStr.trim();
            logger.info("Received contract duration in saveManualAgreement: '{}'", contractDurationStr);
        } else {
            logger.info("Received null contract duration in saveManualAgreement");
        }
        contract.setContractDuration(contractDurationStr);

        contract.setDueDate(incoming.getDueDate());
        
        // Set contract start date to current date when transitioning to completed
        LocalDate contractStartDate = LocalDate.now();
        contract.setContractStartDate(contractStartDate);
        
        // Calculate renewal date based on completion date + contract duration for completed requests
        logger.info("[saveManualAgreement] Processing contract duration string: '{}' (null: {}, empty: {})", 
                   contractDurationStr, 
                   contractDurationStr == null, 
                   contractDurationStr != null && contractDurationStr.isEmpty());
        LocalDate calculatedRenewalDate = null;
        
        // Special handling for subscription contracts (1 month duration)
        boolean isSubscription = false;
        
        if (contractDurationStr != null && !contractDurationStr.isEmpty()) {
            try {
                // Parse contract duration
                int contractDuration = Integer.parseInt(contractDurationStr);
                
                // Check if this is a subscription (1 month contract)
                isSubscription = contractDuration == 1;
                
                // Use current date as completion date for contracts marked as completed through UI
                LocalDate completionDate = contractStartDate;
                
                // Calculate renewal date = completion date + contract duration (in months)
                calculatedRenewalDate = completionDate.plusMonths(contractDuration);
                contract.setRenewalDate(calculatedRenewalDate);
                
                // Set contract end date to the same value as renewal date
                contract.setContractEndDate(calculatedRenewalDate);
                
                logger.info("[saveManualAgreement] Calculated renewal date: {} based on completion date: {} and contract duration: {} months. Is subscription: {}", 
                    calculatedRenewalDate, completionDate, contractDuration, isSubscription);
            } catch (Exception e) {
                logger.warn("[saveManualAgreement] Failed to calculate renewal date based on contract duration: {}", contractDurationStr, e);
                
                // Fall back to the renewal date from incoming contract if calculation fails
                contract.setRenewalDate(incoming.getRenewalDate());
                // Also set contract end date to the same value as renewal date
                contract.setContractEndDate(incoming.getRenewalDate());
            }
        } else {
            // If no contract duration, fall back to the renewal date from incoming contract
            contract.setRenewalDate(incoming.getRenewalDate());
            // Also set contract end date to the same value as renewal date
            contract.setContractEndDate(incoming.getRenewalDate());
            logger.info("[saveManualAgreement] Using fallback renewal date: {}", incoming.getRenewalDate());
        }

        contract.setAdditionalComment(incoming.getAdditionalComment());
    
        // Set the total optimized cost if provided
        contract.setTotalOptimizedCost(incoming.getTotalOptimizedCost());

        // Save and return
        ContractDetails saved = contractDetailsRepository.save(contract);

        logger.info("✅ Manual agreement saved successfully with ID={} trackingKey={} Duration='{}' IsSubscription={}", 
                   saved.getId(), saved.getJiraIssueKey(), saved.getContractDuration(), 
                   saved.getContractDuration() != null && saved.getContractDuration().equals("1"));

        return saved;
    }


    public Integer getExistingLicenseCount(String vendorName, String productName) {
        ContractDetails contract =
                contractDetailsRepository.findByNameOfVendorAndProductNameIgnoreCase(vendorName, productName);
        return contract != null ? contract.getCurrentLicenseCount() : 0;
    }
    
    /**
     * Update the license count and total profit for a contract by issue key
     * @param issueKey The Jira issue key
     * @param newLicenseCount The new license count
     * @param totalProfit The calculated total profit
     * @return The updated contract details
     */
    public ContractDetails updateLicenseCountAndProfit(String issueKey, Integer newLicenseCount, Double totalProfit) {
        logger.info("Updating license count and profit for issueKey={}, newLicenseCount={}, totalProfit={}", 
                   issueKey, newLicenseCount, totalProfit);
        
        try {
            // Find the contract by issue key
            ContractDetails contract = contractDetailsRepository.findByJiraIssueKey(issueKey);
            
            // Check the Jira issue status
            String issueStatus = jiraService.getIssueStatus(issueKey);
            logger.info("Jira issue {} is in status: {}", issueKey, issueStatus);
            
            boolean isNewlyCreatedContract = false;
            // If contract doesn't exist but Jira issue is in completed status, we should create the contract
            if (contract == null) {
                if ("Completed".equalsIgnoreCase(issueStatus) || "completed".equalsIgnoreCase(issueStatus)) {
                    logger.info("Contract not found for issueKey: {} but Jira issue is completed. Creating contract.", issueKey);
                    contract = new ContractDetails();
                    contract.setJiraIssueKey(issueKey);
                    contract.setRenewalStatus("completed");
                    isNewlyCreatedContract = true;
                } else {
                    logger.warn("Contract not found for issueKey: {} and Jira issue is not completed (status: {}). Only updating Jira custom fields.", issueKey, issueStatus);
                    // Still update Jira custom fields even if contract doesn't exist in DB
                    if (newLicenseCount != null || totalProfit != null) {
                        Map<String, Object> updateFields = new HashMap<>();
                        if (newLicenseCount != null) {
                            updateFields.put(jiraFieldConfig.getNewLicenseCount(), String.valueOf(newLicenseCount));
                        }
                        if (totalProfit != null) {
                            updateFields.put(jiraFieldConfig.getTotaloptimizedcost(), String.valueOf(totalProfit));
                        }
                        
                        if (!updateFields.isEmpty()) {
                            try {
                                jiraService.updateIssue(issueKey, updateFields);
                                logger.info("Updated Jira custom fields for issueKey: {}", issueKey);
                            } catch (Exception e) {
                                logger.warn("Failed to update Jira custom fields for issueKey: {}", issueKey, e);
                            }
                        }
                    }
                    // Return a temporary contract object for the response
                    ContractDetails tempContract = new ContractDetails();
                    tempContract.setJiraIssueKey(issueKey);
                    return tempContract;
                }
            }
            
            // Update the license count
            // Skip Jira update if we already did it for a newly created contract in non-completed status
            if (newLicenseCount != null) {
                contract.setNewLicenseCount(newLicenseCount);
                logger.info("Updated newLicenseCount to {} for issueKey: {}", newLicenseCount, issueKey);
                
                // Update Jira custom field for license count (skip if already done)
                if (!isNewlyCreatedContract || "Completed".equalsIgnoreCase(issueStatus) || "completed".equalsIgnoreCase(issueStatus)) {
                    try {
                        Map<String, Object> updateFields = new HashMap<>();
                        updateFields.put(jiraFieldConfig.getNewLicenseCount(), String.valueOf(newLicenseCount));
                        
                        jiraService.updateIssue(issueKey, updateFields);
                        logger.info("Updated newLicenseCount in Jira custom field to {} for issueKey: {}", newLicenseCount, issueKey);
                    } catch (Exception e) {
                        logger.warn("Failed to update newLicenseCount in Jira custom field for issueKey: {}", issueKey, e);
                    }
                }
            }
            
            // Update the total profit if provided
            // Skip Jira update if we already did it for a newly created contract in non-completed status
            if (totalProfit != null) {
                // Store the profit in a custom field (skip if already done)
                if (!isNewlyCreatedContract || "Completed".equalsIgnoreCase(issueStatus) || "completed".equalsIgnoreCase(issueStatus)) {
                    try {
                        Map<String, Object> updateFields = new HashMap<>();
                        updateFields.put(jiraFieldConfig.getTotaloptimizedcost(), String.valueOf(totalProfit));
                        
                        jiraService.updateIssue(issueKey, updateFields);
                        logger.info("Updated total optimized cost in Jira custom field to {} for issueKey: {}", totalProfit, issueKey);
                    } catch (Exception e) {
                        logger.warn("Failed to update total optimized cost in Jira custom field for issueKey: {}", issueKey, e);
                    }
                }
                
                // Also store the optimized cost in the comment field as a backup
                String additionalComment = contract.getAdditionalComment();
                if (additionalComment == null) {
                    additionalComment = "";
                }
                additionalComment += "\nTotal Optimized Cost: " + totalProfit;
                contract.setAdditionalComment(additionalComment);
                logger.info("Updated total optimized cost in comment field to {} for issueKey: {}", totalProfit, issueKey);
            }
            
            // Save the updated contract
            ContractDetails saved = contractDetailsRepository.save(contract);
            logger.info("Successfully updated contract with ID: {} for issueKey: {}", saved.getId(), issueKey);
            
            return saved;
        } catch (Exception e) {
            logger.error("Error updating license count and profit for issueKey: {}", issueKey, e);
            throw new RuntimeException("Failed to update license count and profit: " + e.getMessage(), e);
        }
    }
    
    /**
     * Mark a contract as having a submitted final quote
     * @param issueKey The Jira issue key
     * @return The updated contract details
     */
    public ContractDetails markFinalQuoteSubmitted(String issueKey) {
        logger.info("Marking final quote as submitted for issueKey={}", issueKey);
        
        try {
            // Find the contract by issue key
            ContractDetails contract = contractDetailsRepository.findByJiraIssueKey(issueKey);
            
            // If contract doesn't exist, create it
            if (contract == null) {
                logger.info("Contract not found for issueKey: {}, creating new contract", issueKey);
                contract = new ContractDetails();
                contract.setJiraIssueKey(issueKey);
            }
            
            // Mark as final quote submitted
            contract.setRenewalStatus("final_quote_submitted");
            logger.info("Marked contract as final_quote_submitted for issueKey: {}", issueKey);
            
            // Save the updated contract
            ContractDetails saved = contractDetailsRepository.save(contract);
            logger.info("Successfully updated contract with ID: {} for issueKey: {}", saved.getId(), issueKey);
            
            return saved;
        } catch (Exception e) {
            logger.error("Error marking final quote as submitted for issueKey: {}", issueKey, e);
            throw new RuntimeException("Failed to mark final quote as submitted: " + e.getMessage(), e);
        }
    }
    
 // ⭐ NEW — Save attachment metadata in DB
    public void saveAttachmentMetadata(String issueKey, Map<String, Object> metadata) {
        logger.info("📦 Saving attachment metadata for issueKey={}", issueKey);

        ContractDetails contract = contractDetailsRepository.findByJiraIssueKey(issueKey);

        if (contract == null) {
            throw new RuntimeException("Contract not found for issueKey: " + issueKey);
        }

        try {
            ObjectMapper mapper = new ObjectMapper();

            // Load existing attachments (if any)
            List<Map<String, Object>> list;

            if (contract.getAttachmentMetadata() != null) {
                list = mapper.readValue(
                    contract.getAttachmentMetadata(),
                    mapper.getTypeFactory().constructCollectionType(List.class, Map.class)
                );
            } else {
                list = new java.util.ArrayList<>();
            }

            // Add new attachment metadata
            list.add(metadata);

            // Save updated list
            contract.setAttachmentMetadata(mapper.writeValueAsString(list));
            contractDetailsRepository.save(contract);

            logger.info("✔ Attachment metadata saved successfully for issueKey={}", issueKey);

        } catch (Exception e) {
            logger.error("❌ Failed saving attachment metadata", e);
            throw new RuntimeException("Failed to save attachment metadata: " + e.getMessage());
        }
    }

}

