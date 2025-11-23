package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.ContractDetails;
import com.htc.productdevelopment.model.ContractProposal;
import com.htc.productdevelopment.repository.ContractDetailsRepository;
import com.htc.productdevelopment.repository.ContractProposalRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ContractProposalService {

    @Autowired
    private ContractProposalRepository proposalRepo;

    @Autowired
    private ContractDetailsRepository contractRepo;

    /**
     * Save a proposal (first, second, third, final)
     */
    public ContractProposal saveProposal(
            String jiraIssueKey,
            Integer licenseCount,
            Double unitCost,
            Double totalCost,
            String comment,
            boolean isFinal,
            String proposalType
    ) {

        // 1️⃣ Ensure ContractDetails row exists
        ContractDetails contract = contractRepo.findByJiraIssueKey(jiraIssueKey);
        if (contract == null) {
            contract = new ContractDetails();
            contract.setJiraIssueKey(jiraIssueKey);
            contract = contractRepo.save(contract);
        }

        // 2️⃣ Compute proposal number
        int proposalNumber = 1;
        ContractProposal lastProposal =
        	    proposalRepo.findTopByJiraIssueKeyIgnoreCaseOrderByProposalNumberDesc(jiraIssueKey);

        if (lastProposal != null) {
            proposalNumber = lastProposal.getProposalNumber() + 1;
        }

        // 3️⃣ Create proposal object
        ContractProposal proposal = new ContractProposal();
        proposal.setContract(contract);
        proposal.setJiraIssueKey(jiraIssueKey);
        proposal.setProposalNumber(proposalNumber);
        proposal.setProposalType(proposalType);
        proposal.setLicenseCount(licenseCount);
        proposal.setUnitCost(unitCost);
        proposal.setTotalCost(totalCost);
        proposal.setComment(comment);
        proposal.setCreatedAt(LocalDateTime.now());
        proposal.setFinal(isFinal);

        return proposalRepo.save(proposal);
    }

    /**
     * Get all proposals for an issue
     */
    public List<ContractProposal> getProposalsForIssue(String issueKey) {
        return proposalRepo.findByJiraIssueKeyIgnoreCaseOrderByProposalNumberAsc(issueKey);
    }

    public ContractProposal getLatestProposal(String issueKey) {
        return proposalRepo.findTopByJiraIssueKeyIgnoreCaseOrderByProposalNumberDesc(issueKey);
    }
}
