package com.htc.productdevelopment.repository;

import com.htc.productdevelopment.model.ContractProposal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContractProposalRepository extends JpaRepository<ContractProposal, Long> {

	List<ContractProposal> findByJiraIssueKeyIgnoreCaseOrderByProposalNumberAsc(String jiraIssueKey);

	ContractProposal findTopByJiraIssueKeyIgnoreCaseOrderByProposalNumberDesc(String jiraIssueKey);
}
