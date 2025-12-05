# Attachment Storage Mechanism Test Plan

## Overview
This document outlines the test plan for verifying the attachment storage mechanism where:
1. Attachments are saved locally in the file system
2. Metadata is stored in the database
3. Attachments are also sent to Jira

## Test Scenarios

### Scenario 1: Successful Attachment Upload
**Description**: Verify that when a user uploads an attachment, it gets saved locally, metadata is stored in DB, and it's sent to Jira.

**Preconditions**:
- User is authenticated
- Jira integration is configured
- Local storage path is accessible

**Steps**:
1. Create a new procurement request with attachments
2. Submit the request
3. Check local file system for saved attachments
4. Verify database for metadata entry
5. Check Jira for attachment presence

**Expected Results**:
- File is saved in local storage path
- Database contains metadata (file name, path, size, etc.)
- Attachment appears in Jira issue

### Scenario 2: Large File Upload
**Description**: Test uploading large files to ensure system handles them properly.

**Preconditions**:
- Large file (>10MB) is available
- System has sufficient disk space

**Steps**:
1. Create a procurement request with a large attachment
2. Submit the request
3. Monitor system resources during upload
4. Verify all storage locations

**Expected Results**:
- File uploads successfully without timeout
- System resources are managed properly
- All storage mechanisms work correctly

### Scenario 3: Multiple Attachments
**Description**: Test uploading multiple attachments simultaneously.

**Preconditions**:
- Multiple files (different types) are available

**Steps**:
1. Create a procurement request with multiple attachments
2. Submit the request
3. Verify each file in all storage locations

**Expected Results**:
- All files are saved locally
- All metadata entries are in database
- All attachments appear in Jira

### Scenario 4: File System Error Handling
**Description**: Test system behavior when local storage is unavailable.

**Preconditions**:
- Local storage path is made inaccessible

**Steps**:
1. Make local storage path read-only or unavailable
2. Attempt to create procurement request with attachment
3. Observe system behavior

**Expected Results**:
- Appropriate error message is shown
- Request fails gracefully
- No partial data is saved

### Scenario 5: Database Error Handling
**Description**: Test system behavior when database is unavailable.

**Preconditions**:
- Database connection is temporarily disabled

**Steps**:
1. Disable database connection
2. Attempt to create procurement request with attachment
3. Observe system behavior

**Expected Results**:
- Appropriate error message is shown
- Request fails gracefully
- Files are not left orphaned in local storage

## Test Data

### File Types to Test
- PDF documents
- Image files (PNG, JPEG)
- Text files
- Spreadsheet documents
- Presentation files

### File Sizes to Test
- Small files (<100KB)
- Medium files (1-5MB)
- Large files (10-50MB)

## Verification Points

### Local Storage Verification
- File exists at expected path
- File size matches original
- File permissions are appropriate
- Timestamps are recorded

### Database Verification
- Metadata record exists
- File path is correct
- File size matches
- Creation timestamp is recorded
- Associated issue ID is correct

### Jira Verification
- Attachment appears in issue
- File name is correct
- File size matches
- Attachment timestamp is recorded

## Automation Approach

### Test Framework
- Use Jest for backend testing
- Use Cypress for frontend testing

### Mock Services
- Mock Jira API for isolated testing
- Mock file system operations when needed

### Test Data Management
- Use temporary directories for file storage tests
- Clean up test data after each test
- Use database transactions to rollback changes

## Success Criteria
- All attachments are successfully stored in all three locations
- Error handling works correctly for failure scenarios
- Performance is acceptable for typical file sizes
- System recovers gracefully from errors