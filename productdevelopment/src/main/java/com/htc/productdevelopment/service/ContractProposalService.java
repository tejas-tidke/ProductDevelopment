package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.ContractDetails;
import com.htc.productdevelopment.model.ContractProposal;
import com.htc.productdevelopment.repository.ContractDetailsRepository;
import com.htc.productdevelopment.repository.ContractProposalRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Collections;

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
    
    /**
     * Calculate total profit based on the last non-final proposal and the final proposal
     * @param issueKey The Jira issue key
     * @return The calculated profit
     */
    public Double calculateTotalProfit(String issueKey) {
        // Get all proposals for this issue
        List<ContractProposal> proposals = getProposalsForIssue(issueKey);
        
        if (proposals.size() < 2) {
            return 0.0; // Not enough proposals to calculate profit
        }
        
        // Sort proposals by proposal number
        proposals.sort((a, b) -> a.getProposalNumber().compareTo(b.getProposalNumber()));
        
        // Find the final proposal (should be the last one)
        ContractProposal finalProposal = null;
        ContractProposal lastNonFinalProposal = null;
        
        // Iterate backwards to find the final proposal
        for (int i = proposals.size() - 1; i >= 0; i--) {
            ContractProposal proposal = proposals.get(i);
            if (proposal.isFinal()) {
                finalProposal = proposal;
                // Find the last non-final proposal
                for (int j = i - 1; j >= 0; j--) {
                    if (!proposals.get(j).isFinal()) {
                        lastNonFinalProposal = proposals.get(j);
                        break;
                    }
                }
                break;
            }
        }
        
        // If we don't have both proposals, we can't calculate profit
        if (finalProposal == null || lastNonFinalProposal == null) {
            return 0.0;
        }
        
        // Calculate profit (previous total - final total)
        Double lastTotal = lastNonFinalProposal.getTotalCost();
        Double finalTotal = finalProposal.getTotalCost();
        
        if (lastTotal == null || finalTotal == null) {
            return 0.0;
        }
        
        return lastTotal - finalTotal;
    }
}
