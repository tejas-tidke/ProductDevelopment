package com.htc.productdevelopment.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentDto {
    private Long id;
    private String issueKey;
    private Long userId;
    private String userName;
    private String commentText;
    private Date createdAt;
    private Date updatedAt;
}