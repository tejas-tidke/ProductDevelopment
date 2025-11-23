package com.htc.productdevelopment.repository;

import com.htc.productdevelopment.model.ContractDetails;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ContractDetailsRepository extends JpaRepository<ContractDetails, Long> {

    // Filter vendors by department
    @Query("""
        SELECT DISTINCT c.nameOfVendor
        FROM ContractDetails c
        WHERE c.requesterDepartment IN :departments
        ORDER BY c.nameOfVendor
    """)
    List<String> findVendorsByDepartments(List<String> departments);

    // Filter products by vendor + department
    @Query("""
        SELECT DISTINCT c.productName
        FROM ContractDetails c
        WHERE c.nameOfVendor = :vendor
        AND c.requesterDepartment IN :departments
        ORDER BY c.productName
    """)
    List<String> findProductsByVendor(String vendor, List<String> departments);

    // Existing contracts dropdown
    @Query("""
        SELECT c
        FROM ContractDetails c
        WHERE c.requesterDepartment IN :departments
        ORDER BY c.nameOfVendor, c.productName
    """)
    List<ContractDetails> findContractsByDepartments(List<String> departments);

    // Fetch contracts by contract type
    List<ContractDetails> findByContractType(String contractType);

    // ⭐ NEW — Fix case sensitivity (needed for procurement-renewal)
    List<ContractDetails> findByContractTypeIgnoreCase(String contractType);

    // vendor → existing contracts
    List<ContractDetails> findByNameOfVendorIgnoreCase(String vendorName);

    ContractDetails findByNameOfVendorAndProductNameIgnoreCase(String vendorName, String productName);
    
 // ⭐ NEW — Fetch completed/renewed contracts using renewalStatus
    List<ContractDetails> findByRenewalStatusIgnoreCase(String renewalStatus);

 
    ContractDetails findByJiraIssueKey(String jiraIssueKey);
    

}
