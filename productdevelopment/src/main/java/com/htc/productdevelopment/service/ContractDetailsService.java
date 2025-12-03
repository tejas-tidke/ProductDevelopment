package com.htc.productdevelopment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.htc.productdevelopment.dto.ContractDTO;
import com.htc.productdevelopment.model.ContractDetails;
import com.htc.productdevelopment.repository.ContractDetailsRepository;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

@Service
public class ContractDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(ContractDetailsService.class);

    private final ContractDetailsRepository contractDetailsRepository;

    public ContractDetailsService(ContractDetailsRepository contractDetailsRepository) {
        this.contractDetailsRepository = contractDetailsRepository;
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

        contract.setDueDate(incoming.getDueDate());
        contract.setRenewalDate(incoming.getRenewalDate());

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

        contract.setDueDate(incoming.getDueDate());
        contract.setRenewalDate(incoming.getRenewalDate());

        contract.setAdditionalComment(incoming.getAdditionalComment());

        // 4️⃣ Save and return
        ContractDetails saved = contractDetailsRepository.save(contract);

        logger.info("✅ Contract saved successfully with ID={} issueKey={}", saved.getId(), saved.getJiraIssueKey());

        return saved;
    }


    public Integer getExistingLicenseCount(String vendorName, String productName) {
        ContractDetails contract =
                contractDetailsRepository.findByNameOfVendorAndProductNameIgnoreCase(vendorName, productName);
        return contract != null ? contract.getCurrentLicenseCount() : 0;
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

