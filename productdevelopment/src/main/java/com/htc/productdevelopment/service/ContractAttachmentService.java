package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.ContractAttachment;
import com.htc.productdevelopment.model.ContractDetails;
import com.htc.productdevelopment.model.ContractProposal;
import com.htc.productdevelopment.repository.ContractAttachmentRepository;
import com.htc.productdevelopment.repository.ContractDetailsRepository;
import com.htc.productdevelopment.repository.ContractProposalRepository;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

@Service
public class ContractAttachmentService {

    @Autowired
    private ContractAttachmentRepository attachmentRepo;

    @Autowired
    private ContractDetailsRepository contractRepo;

    @Autowired
    private ContractProposalRepository proposalRepo;

    public ContractAttachment saveAttachment(
            String jiraIssueKey,
            String fileName,
            String fileUrl,
            Long fileSize,
            String uploadedBy,
            String stage,
            Long proposalId) {

        // Optional: link proposal if exists
        ContractProposal proposal = null;
        if (proposalId != null) {
            proposal = proposalRepo.findById(proposalId).orElse(null);
        }

        ContractAttachment attachment = new ContractAttachment();
        attachment.setContract(null); // 🚀 No contract yet
        attachment.setProposal(proposal);
        attachment.setJiraIssueKey(jiraIssueKey);
        attachment.setFileName(fileName);
        attachment.setFileUrl(fileUrl);
        attachment.setFileSize(fileSize);
        attachment.setUploadedBy(uploadedBy);
        attachment.setStage(stage);

        return attachmentRepo.save(attachment);
    }


    public List<ContractAttachment> getAttachmentsForContract(Long contractId) {
        return attachmentRepo.findByContractId(contractId);
    }

    public List<ContractAttachment> getAttachmentsByStage(Long contractId, String stage) {
        return attachmentRepo.findByContractIdAndStage(contractId, stage);
    }
    
    public List<ContractAttachment> getAttachmentsByProposalId(Long proposalId) {
        return attachmentRepo.findByProposalId(proposalId);
    }
    
    public List<ContractAttachment> getAttachmentsByIssueKey(String issueKey) {
        return attachmentRepo.findByJiraIssueKey(issueKey);
    }
}


