package com.htc.productdevelopment.service;

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
     * ✅ Fetch existing license count for upgrade/downgrade/flat renewal logic
     */
    public Integer getExistingLicenseCount(String vendorName, String productName) {
        ContractDetails contract = contractDetailsRepository.findByNameOfVendorAndProductNameIgnoreCase(vendorName, productName);
        return contract != null ? contract.getQuantity() : 0;
    }
}
