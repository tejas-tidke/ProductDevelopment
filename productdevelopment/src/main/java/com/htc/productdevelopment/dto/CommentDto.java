package com.htc.productdevelopment.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentDto {
    private Long id;
    private String issueKey;
    private Long userId;
    private String userName;
    private String commentText;
    private Long parentCommentId;
    private List<CommentDto> replies;
    private Date createdAt;
    private Date updatedAt;
}