package com.htc.productdevelopment.repository;

import com.htc.productdevelopment.model.ContractAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContractAttachmentRepository extends JpaRepository<ContractAttachment, Long> {

    List<ContractAttachment> findByContractId(Long contractId);

    List<ContractAttachment> findByJiraIssueKey(String issueKey);

    List<ContractAttachment> findByContractIdAndStage(Long contractId, String stage);
}
