package com.htc.productdevelopment.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCommentDto {
    private String issueKey;
    private Long userId;
    private String userName;
    private String commentText;
}