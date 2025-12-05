# Attachment Testing Guide

This guide explains how to access and use the attachment testing pages that have been created for testing the Jira Data Center pattern implementation.

## Available Testing Pages

Standalone HTML files have been created for attachment testing in this folder:

1. **Comprehensive Attachment Test Page** - `attachment-test-standalone.html`
2. **Simple Attachment Test Page** - `simple-attachment-test.html`

Both pages allow you to test the complete attachment workflow following the Jira Data Center pattern:
- Save files to local filesystem
- Store metadata in database
- Send attachments to Jira

## How to Access the Testing Pages

### Method 1: Opening HTML Files Directly
You can access either page by opening the HTML files directly in your browser:
- Comprehensive Test Page: `attachment-test-standalone.html`
- Simple Test Page: `simple-attachment-test.html`

### Method 2: Serving Files via Local Server
If you prefer to serve the files via a local server:
1. Navigate to this directory in your terminal
2. Run a local server (e.g., `npx serve` or `python -m http.server 8000`)
3. Open your browser to `http://localhost:8000/attachment-test-standalone.html` or `http://localhost:8000/simple-attachment-test.html`

## Features of the Testing Pages

Both pages offer the same core functionality:

1. **Test Types**:
   - Create Issue + Attach: Creates a new procurement request and attaches the selected file
   - Attach to Existing Issue: Attaches the selected file to an existing issue (you'll be prompted for the issue key)

2. **File Selection**:
   - Select any file type and size for testing
   - File information is displayed after selection

3. **Processing Feedback**:
   - Visual loading indicator during processing
   - Success/error messages with detailed information
   - Display of created issue keys

4. **Testing Instructions**:
   - Clear step-by-step instructions for testing
   - Guidance on verifying results in Jira
   - Configurable API URL settings

## Testing the Jira Data Center Pattern

The attachment functionality follows the Jira Data Center pattern:

1. **Local Storage**: Files are saved to the local filesystem
2. **Metadata Storage**: File metadata is stored in the database
3. **Jira Integration**: Attachments are sent to Jira

When testing, you can verify each step by:
1. Checking that files are properly saved locally
2. Confirming metadata is stored in the database
3. Verifying attachments appear in Jira issues

## Backend Implementation Notes

The attachment functionality is implemented in the jiraService:
- `createContractIssue()` - Creates new issues
- `addAttachmentToIssue()` - Handles attachment upload to Jira
- Various helper functions for local storage and metadata management

## Troubleshooting

If you encounter issues:
1. Ensure you're logged into the application
2. Check browser console for error messages
3. Verify backend services are running
4. Confirm Jira connectivity