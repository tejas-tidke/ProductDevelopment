package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.dto.DocumentResponse;
import com.htc.productdevelopment.model.Document;
import com.htc.productdevelopment.repository.DocumentRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "http://localhost:3000")
public class DocumentController {

    private static final Logger log = LoggerFactory.getLogger(DocumentController.class);

    private final DocumentRepository documentRepository;

    public DocumentController(DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(@RequestParam("file") MultipartFile file) {
        log.info("Received upload request: name={}, size={}", file.getOriginalFilename(), file.getSize());
        try {
            Document doc = new Document(
                    file.getOriginalFilename(),
                    file.getContentType(),
                    file.getBytes()
            );
            Document saved = documentRepository.save(doc);

            DocumentResponse response =
                    new DocumentResponse(saved.getId(), saved.getFileName(), saved.getContentType());

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Error reading file bytes", e);
            return ResponseEntity.status(500).body("Could not upload file: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error on upload", e);
            return ResponseEntity.status(500).body("Unexpected error: " + e.getMessage());
        }
    }

    @GetMapping
    public List<DocumentResponse> getAllDocuments() {
        return documentRepository.findAll()
                .stream()
                .map(d -> new DocumentResponse(d.getId(), d.getFileName(), d.getContentType()))
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}/view")
    public ResponseEntity<byte[]> viewDocument(@PathVariable Long id) {
        return documentRepository.findById(id)
                .map(doc -> ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                "inline; filename=\"" + doc.getFileName() + "\"")
                        .contentType(MediaType.parseMediaType(doc.getContentType()))
                        .body(doc.getData()))
                .orElse(ResponseEntity.notFound().build());
    }
}
