package com.htc.productdevelopment.repository;

import com.htc.productdevelopment.model.Proposal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProposalRepository extends JpaRepository<Proposal, Long> {
    List<Proposal> findByIssueKey(String issueKey);
    List<Proposal> findByIssueKeyAndProposalType(String issueKey, String proposalType);
}