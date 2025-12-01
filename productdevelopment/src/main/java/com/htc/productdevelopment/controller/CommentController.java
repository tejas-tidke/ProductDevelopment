package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.model.Comment;
import com.htc.productdevelopment.dto.CommentDto;
import com.htc.productdevelopment.dto.CreateCommentDto;
import com.htc.productdevelopment.service.CommentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private static final Logger logger = LoggerFactory.getLogger(CommentController.class);

    @Autowired
    private CommentService commentService;

    /**
     * Add a new comment or reply
     * @param createCommentDto The comment data
     * @return The created comment
     */
    @PostMapping
    public ResponseEntity<?> addComment(@RequestBody CreateCommentDto createCommentDto) {
        try {
            logger.info("Received request to add comment for issue: {}", createCommentDto.getIssueKey());

            if (createCommentDto.getIssueKey() == null || createCommentDto.getIssueKey().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Issue key is required"));
            }

            if (createCommentDto.getUserId() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "User ID is required"));
            }

            if (createCommentDto.getUserName() == null || createCommentDto.getUserName().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "User name is required"));
            }

            if (createCommentDto.getCommentText() == null || createCommentDto.getCommentText().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Comment text is required"));
            }

            Comment savedComment = commentService.createComment(createCommentDto);
            logger.info("Comment added successfully with ID: {}", savedComment.getId());

            return ResponseEntity.ok(savedComment);
        } catch (IllegalArgumentException e) {
            logger.error("Validation error adding comment", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error adding comment", e);
            return ResponseEntity.internalServerError().body(
                    Map.of("message", "Failed to add comment: " + e.getMessage())
            );
        }
    }

    /**
     * Get all comments for a specific issue in hierarchical form
     * @param issueKey The issue key
     * @return List of comments (each with nested replies)
     */
    @GetMapping("/issue/{issueKey}")
    public ResponseEntity<?> getCommentsByIssueKey(@PathVariable String issueKey) {
        try {
            logger.info("Received request to fetch comments for issue: {}", issueKey);

            if (issueKey == null || issueKey.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Issue key cannot be empty"));
            }

            List<CommentDto> comments = commentService.getCommentsByIssueKeyAsDto(issueKey.trim());
            logger.info("Found {} root comments for issue: {}", comments.size(), issueKey);

            return ResponseEntity.ok(Map.of("comments", comments));
        } catch (Exception e) {
            logger.error("Error fetching comments for issue: {}", issueKey, e);
            return ResponseEntity.internalServerError().body(
                    Map.of("message", "Failed to fetch comments: " + e.getMessage())
            );
        }
    }
}
