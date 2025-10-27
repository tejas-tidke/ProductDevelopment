package com.htc.productdevelopment.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JiraProject {
    private String id;
    private String key;
    private String name;
    private String description;
    private String projectTypeKey;
    private String lead; // Project lead
}