package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.Comment;
import com.htc.productdevelopment.repository.CommentRepository;
import com.htc.productdevelopment.dto.CommentDto;
import com.htc.productdevelopment.dto.CreateCommentDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CommentService {
    
    @Autowired
    private CommentRepository commentRepository;
    
    public Comment saveComment(Comment comment) {
        return commentRepository.save(comment);
    }
    
    public Comment createComment(CreateCommentDto createCommentDto) {
        Comment comment = new Comment();
        comment.setIssueKey(createCommentDto.getIssueKey());
        comment.setUserId(createCommentDto.getUserId());
        comment.setUserName(createCommentDto.getUserName());
        comment.setCommentText(createCommentDto.getCommentText());
        return commentRepository.save(comment);
    }
    
    public List<Comment> getCommentsByIssueKey(String issueKey) {
        return commentRepository.findByIssueKeyOrderByCreatedAtDesc(issueKey);
    }
    
    public List<CommentDto> getCommentsByIssueKeyAsDto(String issueKey) {
        List<Comment> comments = commentRepository.findByIssueKeyOrderByCreatedAtDesc(issueKey);
        return comments.stream().map(this::convertToDto).collect(Collectors.toList());
    }
    
    public Optional<Comment> getCommentById(Long id) {
        return commentRepository.findById(id);
    }
    
    public void deleteComment(Long id) {
        commentRepository.deleteById(id);
    }
    
    private CommentDto convertToDto(Comment comment) {
        CommentDto dto = new CommentDto();
        dto.setId(comment.getId());
        dto.setIssueKey(comment.getIssueKey());
        dto.setUserId(comment.getUserId());
        dto.setUserName(comment.getUserName());
        dto.setCommentText(comment.getCommentText());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUpdatedAt(comment.getUpdatedAt());
        return dto;
    }
}