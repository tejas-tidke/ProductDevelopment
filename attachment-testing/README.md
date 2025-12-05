# Attachment Storage Testing

This directory contains test plans and scripts for verifying the attachment storage mechanism where attachments are:
1. Saved locally in the file system
2. Metadata stored in the database
3. Sent to Jira

## Directory Structure

```
attachment-testing/
├── AttachmentStorageTest.md          # High-level test plan
├── TechnicalTestImplementation.md    # Detailed technical implementation plan
├── attachment-test-script.js        # JavaScript test script
├── attachment-test-standalone.html  # Standalone HTML test page
├── simple-attachment-test.html      # Simplified HTML test page
├── test-runner.js                   # Test runner utility
├── SUMMARY.md                       # Complete framework summary
├── package.json                     # Dependencies for the test script
└── test-files/                      # Directory for test files (created during test run)
```

## Test Plans

### AttachmentStorageTest.md
Contains high-level test scenarios and verification points for the attachment storage mechanism.

### TechnicalTestImplementation.md
Provides detailed technical implementation approaches for testing the attachment storage mechanism, including:
- Required backend service enhancements
- Database schema design
- Unit and integration test approaches
- Test environment setup

## Test Scripts and Pages

### attachment-test-script.js
A Node.js script that simulates and tests the attachment storage mechanism.

### Standalone HTML Test Pages
Two standalone HTML pages for browser-based testing:
- `attachment-test-standalone.html` - Comprehensive testing interface
- `simple-attachment-test.html` - Simplified testing interface

These pages can be opened directly in any browser without requiring the main application.

### Running the Test Script

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the tests:
   ```bash
   npm test
   ```

3. Run the frontend test checker:
   ```bash
   npm run test:frontend
   ```

### What the Test Script Does

1. Creates sample test files
2. Tests local file storage functionality
3. Tests database metadata storage (simulated)
4. Tests Jira attachment upload (simulated)
5. Tests error handling scenarios

## Implementation Notes

The current implementation in the codebase only sends attachments directly to Jira. To fully implement the local storage mechanism:

1. Backend changes are needed to save files locally
2. Database schema updates to store metadata
3. Enhancement of the Jira service to handle the three-step process

Refer to `TechnicalTestImplementation.md` for detailed implementation approaches.