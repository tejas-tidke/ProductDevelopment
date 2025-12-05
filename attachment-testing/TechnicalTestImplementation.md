# Technical Test Implementation for Attachment Storage Mechanism

## Overview
This document describes the technical implementation approach for testing the attachment storage mechanism where attachments are saved locally, metadata is stored in the database, and attachments are also sent to Jira.

## Current Implementation Analysis

Based on the code review, the attachment handling is done in the `handleSubmit` function in `CreateIssueModal.tsx`:

```javascript
if (attachments.length > 0 && created.key) {
  try {
    for (const file of attachments) {
      await jiraService.addAttachmentToIssue(created.key, file);
    }
  } catch (err) {
    console.error('Error uploading attachments:', err);
  }
}
```

This shows that currently, attachments are only being sent to Jira, but we need to implement local storage as well.

## Required Implementation Changes

### 1. Backend Service Enhancement

We need to enhance the backend to handle local file storage. Here's what needs to be implemented:

#### File Storage Service
```java
@Service
public class LocalFileStorageService {
    
    @Value("${local.storage.path}")
    private String storagePath;
    
    public String saveFile(MultipartFile file, String issueKey) throws IOException {
        // Create directory structure: /storage/{year}/{month}/{day}/{issueKey}/
        String directoryPath = createDirectoryStructure(issueKey);
        
        // Save file locally
        Path filePath = Paths.get(directoryPath, file.getOriginalFilename());
        Files.write(filePath, file.getBytes());
        
        // Return the relative path for database storage
        return Paths.get("storage", getDateString(), issueKey, file.getOriginalFilename()).toString();
    }
    
    private String createDirectoryStructure(String issueKey) {
        String datePath = getDateString();
        String fullPath = Paths.get(storagePath, datePath, issueKey).toString();
        Files.createDirectories(Paths.get(fullPath));
        return fullPath;
    }
    
    private String getDateString() {
        LocalDate now = LocalDate.now();
        return now.getYear() + "/" + now.getMonthValue() + "/" + now.getDayOfMonth();
    }
}
```

#### Attachment Metadata Service
```java
@Service
public class AttachmentMetadataService {
    
    @Autowired
    private AttachmentMetadataRepository repository;
    
    public AttachmentMetadata saveMetadata(String issueKey, String fileName, String localPath, long fileSize) {
        AttachmentMetadata metadata = new AttachmentMetadata();
        metadata.setIssueKey(issueKey);
        metadata.setFileName(fileName);
        metadata.setLocalPath(localPath);
        metadata.setFileSize(fileSize);
        metadata.setUploadTimestamp(LocalDateTime.now());
        
        return repository.save(metadata);
    }
}
```

#### Enhanced Jira Service
```java
@Service
public class EnhancedJiraService {
    
    @Autowired
    private LocalFileStorageService localFileStorageService;
    
    @Autowired
    private AttachmentMetadataService attachmentMetadataService;
    
    public void handleAttachmentWithLocalStorage(MultipartFile file, String issueKey) throws IOException {
        // Step 1: Save file locally
        String localPath = localFileStorageService.saveFile(file, issueKey);
        
        // Step 2: Save metadata to database
        attachmentMetadataService.saveMetadata(
            issueKey, 
            file.getOriginalFilename(), 
            localPath, 
            file.getSize()
        );
        
        // Step 3: Send to Jira
        addAttachmentToIssue(issueKey, file);
    }
}
```

### 2. Database Schema

#### Attachment Metadata Table
```sql
CREATE TABLE attachment_metadata (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    issue_key VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    local_path VARCHAR(1000) NOT NULL,
    file_size BIGINT NOT NULL,
    upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    jira_attachment_id VARCHAR(255),
    INDEX idx_issue_key (issue_key),
    INDEX idx_upload_time (upload_timestamp)
);
```

## Test Implementation Plan

### 1. Unit Tests

#### Local File Storage Service Tests
```java
@Test
public void testSaveFile_createsCorrectDirectoryStructure() throws IOException {
    // Given
    MockMultipartFile file = new MockMultipartFile("test.pdf", "test.pdf", "application/pdf", "test content".getBytes());
    String issueKey = "TEST-123";
    
    // When
    String localPath = localFileStorageService.saveFile(file, issueKey);
    
    // Then
    assertThat(localPath).contains("storage");
    assertThat(localPath).contains(issueKey);
    // Verify file exists at path
    Path filePath = Paths.get(localFileStorageService.getBasePath(), localPath);
    assertTrue(Files.exists(filePath));
}

@Test
public void testSaveFile_handlesSpecialCharactersInFileName() throws IOException {
    // Test with filenames containing special characters
}
```

#### Attachment Metadata Service Tests
```java
@Test
public void testSaveMetadata_storesAllRequiredFields() {
    // Given
    String issueKey = "TEST-123";
    String fileName = "document.pdf";
    String localPath = "storage/2023/12/1/TEST-123/document.pdf";
    long fileSize = 1024L;
    
    // When
    AttachmentMetadata metadata = attachmentMetadataService.saveMetadata(issueKey, fileName, localPath, fileSize);
    
    // Then
    assertThat(metadata.getIssueKey()).isEqualTo(issueKey);
    assertThat(metadata.getFileName()).isEqualTo(fileName);
    assertThat(metadata.getLocalPath()).isEqualTo(localPath);
    assertThat(metadata.getFileSize()).isEqualTo(fileSize);
    assertThat(metadata.getUploadTimestamp()).isNotNull();
}
```

### 2. Integration Tests

#### End-to-End Attachment Flow Test
```java
@Test
@Sql(scripts = "/clean-attachment-test-data.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
public void testAttachmentFlow_savesLocallyAndSendsToJira() throws Exception {
    // Given
    MockMultipartFile attachment = new MockMultipartFile(
        "attachment", 
        "test-document.pdf", 
        "application/pdf", 
        "Test document content".getBytes()
    );
    
    // When
    mockMvc.perform(multipart("/api/issues/create")
        .file(attachment)
        .param("summary", "Test Issue")
        .param("description", "Test Description"))
        .andExpect(status().isOk());
    
    // Then
    // Verify file saved locally
    List<AttachmentMetadata> metadataList = attachmentMetadataRepository.findByIssueKey("TEST-123");
    assertThat(metadataList).hasSize(1);
    
    AttachmentMetadata metadata = metadataList.get(0);
    Path localFilePath = Paths.get(localStorageBasePath, metadata.getLocalPath());
    assertTrue(Files.exists(localFilePath));
    
    // Verify file content
    String content = new String(Files.readAllBytes(localFilePath));
    assertThat(content).isEqualTo("Test document content");
    
    // Verify Jira was called
    verify(jiraClient).addAttachmentToIssue(eq("TEST-123"), any(MultipartFile.class));
}
```

### 3. Frontend Tests

#### CreateIssueModal Tests
```javascript
describe('CreateIssueModal', () => {
  beforeEach(() => {
    // Setup mocks
  });
  
  it('should handle attachment upload with local storage and Jira', async () => {
    // Given
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const mockCreatedIssue = { key: 'TEST-123' };
    
    // Mock the enhanced service
    jiraService.createContractIssue.mockResolvedValue(mockCreatedIssue);
    jiraService.addAttachmentToIssue.mockResolvedValue({});
    
    // When
    // Simulate form submission with attachment
    
    // Then
    // Verify local storage was called
    // Verify Jira service was called
    // Verify success message is displayed
  });
  
  it('should handle attachment upload failure gracefully', async () => {
    // Test error scenarios
  });
});
```

## Test Environment Setup

### 1. Local Storage Configuration
```properties
# application-test.properties
local.storage.path=./test-storage
jira.api.url=https://test-jira-instance.com
jira.username=test-user
jira.password=test-password
```

### 2. Test Database
Use H2 in-memory database for tests:
```properties
# application-test.properties
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
```

## Monitoring and Validation

### 1. Health Checks
Implement health checks to verify:
- Local storage directory is writable
- Database connectivity
- Jira API availability

### 2. Metrics Collection
Collect metrics for:
- Average file upload time
- Storage utilization
- Error rates

### 3. Logging
Ensure proper logging for:
- File save operations
- Metadata storage operations
- Jira API calls
- Error conditions

## Rollback Strategy

In case of failures:
1. Delete local file if database save fails
2. Log error and notify administrators
3. Retry mechanism for transient failures
4. Manual cleanup procedures for orphaned data

## Performance Considerations

1. **Concurrent Uploads**: Implement thread-safe file operations
2. **Large Files**: Consider streaming for files > 100MB
3. **Storage Cleanup**: Implement retention policies for old files
4. **Database Indexes**: Ensure proper indexing for metadata queries

## Security Considerations

1. **File Validation**: Validate file types and scan for malware
2. **Path Traversal**: Prevent directory traversal attacks
3. **Access Control**: Ensure only authorized users can access files
4. **Encryption**: Consider encrypting sensitive files at rest