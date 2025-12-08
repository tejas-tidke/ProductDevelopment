package com.htc.productdevelopment.service.jira;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;

/**
 * Field and metadata helpers (e.g., safe value extraction).
 */
@Service
public class JiraFieldService {

    public String getTextValue(JsonNode node, String fieldName) {
        if (node == null || fieldName == null) return null;
        JsonNode fieldNode = node.get(fieldName);
        return fieldNode != null ? fieldNode.asText() : null;
    }

    public String getFlexibleTextValue(JsonNode fields, String fieldId) {
        if (fields == null || fieldId == null) return null;

        JsonNode field = fields.path(fieldId);
        if (field.isNull() || field.isMissingNode()) {
            return null;
        }

        if (field.isTextual() || field.isNumber()) {
            return field.asText();
        }

        if (field.has("value")) {
            return field.get("value").asText();
        }

        if (field.has("displayName")) {
            return field.get("displayName").asText();
        }

        return field.toString();
    }
}

