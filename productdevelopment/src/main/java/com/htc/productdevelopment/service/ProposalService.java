package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.Proposal;
import com.htc.productdevelopment.repository.ProposalRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProposalService {
    private final ProposalRepository proposalRepository;

    public ProposalService(ProposalRepository proposalRepository) {
        this.proposalRepository = proposalRepository;
    }

    public Proposal saveProposal(Proposal proposal) {
        return proposalRepository.save(proposal);
    }

    public List<Proposal> getProposalsByIssueKey(String issueKey) {
        return proposalRepository.findByIssueKey(issueKey);
    }

    public List<Proposal> getProposalsByIssueKeyAndType(String issueKey, String proposalType) {
        return proposalRepository.findByIssueKeyAndProposalType(issueKey, proposalType);
    }
}