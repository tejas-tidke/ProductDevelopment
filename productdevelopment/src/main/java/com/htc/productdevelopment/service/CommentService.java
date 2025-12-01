package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.Comment;
import com.htc.productdevelopment.repository.CommentRepository;
import com.htc.productdevelopment.dto.CommentDto;
import com.htc.productdevelopment.dto.CreateCommentDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    public Comment saveComment(Comment comment) {
        return commentRepository.save(comment);
    }

    /**
     * Create a top-level comment or a reply (if parentCommentId is set)
     */
    public Comment createComment(CreateCommentDto createCommentDto) {
        Comment comment = new Comment();
        comment.setIssueKey(createCommentDto.getIssueKey());
        comment.setUserId(createCommentDto.getUserId());
        comment.setUserName(createCommentDto.getUserName());
        comment.setCommentText(createCommentDto.getCommentText());
        comment.setParentCommentId(createCommentDto.getParentCommentId());

        // Optional validation: ensure parent belongs to same issue
        if (createCommentDto.getParentCommentId() != null) {
            Comment parent = commentRepository.findById(createCommentDto.getParentCommentId())
                    .orElseThrow(() -> new IllegalArgumentException("Parent comment not found"));

            if (!parent.getIssueKey().equals(createCommentDto.getIssueKey())) {
                throw new IllegalArgumentException("Parent comment belongs to a different issue");
            }
        }

        return commentRepository.save(comment);
    }

    /**
     * Flat list of comments (if you need it somewhere else)
     */
    public List<Comment> getCommentsByIssueKey(String issueKey) {
        return commentRepository.findByIssueKeyOrderByCreatedAtAsc(issueKey);
    }

    /**
     * Hierarchical list (with nested replies) used by the controller.
     */
    public List<CommentDto> getCommentsByIssueKeyAsDto(String issueKey) {
        // Get all comments for that issue; order by createdAt so parents come before children
        List<Comment> comments = commentRepository.findByIssueKeyOrderByCreatedAtAsc(issueKey);

        // First, convert all to DTOs and index them by ID
        Map<Long, CommentDto> dtoMap = comments.stream()
                .map(this::convertToDto)
                .collect(Collectors.toMap(
                        CommentDto::getId,
                        dto -> {
                            dto.setReplies(new ArrayList<>());
                            return dto;
                        },
                        (existing, replacement) -> existing,
                        LinkedHashMap::new // keep insertion order
                ));

        List<CommentDto> roots = new ArrayList<>();

        // Build parent -> children tree
        for (Comment comment : comments) {
            CommentDto dto = dtoMap.get(comment.getId());
            Long parentId = comment.getParentCommentId();

            if (parentId == null) {
                // This is a root/top-level comment
                roots.add(dto);
            } else {
                CommentDto parentDto = dtoMap.get(parentId);
                if (parentDto != null) {
                    if (parentDto.getReplies() == null) {
                        parentDto.setReplies(new ArrayList<>());
                    }
                    parentDto.getReplies().add(dto);
                } else {
                    // Parent not found (maybe deleted) – treat as root to avoid losing it
                    roots.add(dto);
                }
            }
        }

        return roots;
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
        dto.setParentCommentId(comment.getParentCommentId());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUpdatedAt(comment.getUpdatedAt());
        // replies list is initialized in the caller
        return dto;
    }
}
