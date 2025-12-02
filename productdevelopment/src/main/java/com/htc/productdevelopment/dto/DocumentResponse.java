package com.htc.productdevelopment.dto;

public class DocumentResponse {

    private Long id;
    private String fileName;
    private String contentType;

    public DocumentResponse(Long id, String fileName, String contentType) {
        this.id = id;
        this.fileName = fileName;
        this.contentType = contentType;
    }

    public Long getId() {
        return id;
    }

    public String getFileName() {
        return fileName;
    }

    public String getContentType() {
        return contentType;
    }
}
