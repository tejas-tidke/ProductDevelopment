package com.htc.productdevelopment.service;

import com.htc.productdevelopment.dto.ContractDTO;
import com.htc.productdevelopment.model.ContractDetails;
import com.htc.productdevelopment.repository.ContractDetailsRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ContractDetailsService {

    private final ContractDetailsRepository contractDetailsRepository;

    public ContractDetailsService(ContractDetailsRepository contractDetailsRepository) {
        this.contractDetailsRepository = contractDetailsRepository;
    }

    /**
     * ✅ Fetch all contract records (for dropdown)
     */
    public List<ContractDetails> getAllContracts() {
        return contractDetailsRepository.findAll();
    }

    /**
     * ✅ Fetch contracts by vendor name
     */
    public List<ContractDetails> getContractsByVendor(String vendorName) {
        return contractDetailsRepository.findByNameOfVendorIgnoreCase(vendorName);
    }

    /**
     * ✅ Fetch contracts by contract type
     */
    public List<ContractDetails> getContractsByType(String contractType) {
        return contractDetailsRepository.findByContractType(contractType);
    }

    /**
     * ✅ Fetch contracts by contract type as DTOs
     */
    public List<ContractDTO> getContractsByTypeAsDTO(String contractType) {
        return contractDetailsRepository.findByContractType(contractType).stream().map(c -> {
            ContractDTO dto = new ContractDTO();

            dto.setId(c.getId());
            dto.setNameOfVendor(c.getNameOfVendor());
            dto.setProductName(c.getProductName());
            dto.setRequesterName(c.getRequesterName());
            dto.setRequesterEmail(c.getRequesterMail());
            dto.setRequesterDepartment(c.getRequesterDepartment());
            dto.setRequesterOrganization(c.getRequesterOrganization());
            dto.setVendorContractType(c.getVendorContractType());
            dto.setAdditionalComment(c.getAdditionalComment());

            dto.setCurrentLicenseCount(c.getCurrentLicenseCount());
            dto.setCurrentUsageCount(c.getCurrentUsageCount());
            dto.setCurrentUnits(c.getCurrentUnits());

            dto.setNewLicenseCount(c.getNewLicenseCount());
            dto.setNewUsageCount(c.getNewUsageCount());
            dto.setNewUnits(c.getNewUnits());

            dto.setDueDate(c.getDueDate() != null ? c.getDueDate().toString() : null);
            dto.setRenewalDate(c.getRenewalDate() != null ? c.getRenewalDate().toString() : null);

            return dto;
        }).collect(java.util.stream.Collectors.toList());
    }

    /**
     * ✅ Save a contract to the database
     */
    public ContractDetails saveContract(ContractDetails contract) {
        return contractDetailsRepository.save(contract);
    }

    /**
     * ✅ Fetch existing license count for upgrade/downgrade/flat renewal logic
     */
    public Integer getExistingLicenseCount(String vendorName, String productName) {
        ContractDetails contract = contractDetailsRepository.findByNameOfVendorAndProductNameIgnoreCase(vendorName, productName);
        return contract != null ? contract.getQuantity() : 0;
    }
}
