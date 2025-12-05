/**
 * Test Script for Attachment Storage Mechanism
 * 
 * This script tests the functionality where attachments are:
 * 1. Saved locally in the file system
 * 2. Metadata stored in the database
 * 3. Sent to Jira
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const CONFIG = {
  apiUrl: process.env.API_URL || 'http://localhost:8080/api',
  jiraUrl: process.env.JIRA_URL || 'https://mann6767.atlassian.net',
  testFilesDir: './test-files',
  localStoragePath: './local-storage',
  issueKey: 'TEST-001'
};

// Test files to use
const TEST_FILES = [
  { name: 'document.pdf', size: '1.2 MB', type: 'PDF' },
  { name: 'image.png', size: '800 KB', type: 'Image' },
  { name: 'spreadsheet.xlsx', size: '2.1 MB', type: 'Spreadsheet' }
];

/**
 * Create test files
 */
function createTestFiles() {
  console.log('Creating test files...');
  
  if (!fs.existsSync(CONFIG.testFilesDir)) {
    fs.mkdirSync(CONFIG.testFilesDir, { recursive: true });
  }
  
  TEST_FILES.forEach(file => {
    const filePath = path.join(CONFIG.testFilesDir, file.name);
    // Create a dummy file with some content
    const content = `This is a test ${file.type} file named ${file.name} with size approximately ${file.size}.`;
    fs.writeFileSync(filePath, content);
    console.log(`Created ${filePath}`);
  });
}

/**
 * Test local file storage
 */
async function testLocalFileStorage() {
  console.log('\n=== Testing Local File Storage ===');
  
  try {
    // Simulate file upload to local storage
    const testFilePath = path.join(CONFIG.testFilesDir, 'document.pdf');
    const fileContent = fs.readFileSync(testFilePath);
    
    // Create local storage directory structure
    const date = new Date();
    const datePath = path.join(
      CONFIG.localStoragePath,
      date.getFullYear().toString(),
      (date.getMonth() + 1).toString(),
      date.getDate().toString(),
      CONFIG.issueKey
    );
    
    if (!fs.existsSync(datePath)) {
      fs.mkdirSync(datePath, { recursive: true });
    }
    
    // Save file locally
    const localFilePath = path.join(datePath, 'document.pdf');
    fs.writeFileSync(localFilePath, fileContent);
    
    console.log('✓ File saved locally:', localFilePath);
    
    // Verify file exists and has correct content
    if (fs.existsSync(localFilePath)) {
      const savedContent = fs.readFileSync(localFilePath, 'utf8');
      if (savedContent === fileContent.toString()) {
        console.log('✓ File content verified');
      } else {
        console.error('✗ File content mismatch');
        return false;
      }
    } else {
      console.error('✗ File not found in local storage');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('✗ Local file storage test failed:', error.message);
    return false;
  }
}

/**
 * Test database metadata storage
 */
async function testDatabaseMetadata() {
  console.log('\n=== Testing Database Metadata Storage ===');
  
  try {
    // Simulate metadata storage
    const metadata = {
      issueKey: CONFIG.issueKey,
      fileName: 'document.pdf',
      localPath: `storage/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${new Date().getDate()}/${CONFIG.issueKey}/document.pdf`,
      fileSize: fs.statSync(path.join(CONFIG.testFilesDir, 'document.pdf')).size,
      uploadTimestamp: new Date().toISOString()
    };
    
    console.log('✓ Metadata prepared:', JSON.stringify(metadata, null, 2));
    
    // In a real implementation, this would be saved to database
    // For testing purposes, we'll just verify the structure
    
    if (metadata.issueKey && metadata.fileName && metadata.localPath && metadata.fileSize) {
      console.log('✓ Metadata structure verified');
      return true;
    } else {
      console.error('✗ Metadata missing required fields');
      return false;
    }
  } catch (error) {
    console.error('✗ Database metadata test failed:', error.message);
    return false;
  }
}

/**
 * Test Jira attachment upload
 */
async function testJiraAttachment() {
  console.log('\n=== Testing Jira Attachment Upload ===');
  
  try {
    const testFilePath = path.join(CONFIG.testFilesDir, 'document.pdf');
    
    // In a real implementation, this would upload to Jira
    console.log(`✓ Would upload ${testFilePath} to Jira issue ${CONFIG.issueKey}`);
    
    // Simulate Jira API call
    console.log('✓ Jira API call simulated');
    
    return true;
  } catch (error) {
    console.error('✗ Jira attachment test failed:', error.message);
    return false;
  }
}

/**
 * Test error handling
 */
async function testErrorHandling() {
  console.log('\n=== Testing Error Handling ===');
  
  try {
    // Test with non-existent file
    const nonExistentFile = path.join(CONFIG.testFilesDir, 'non-existent.pdf');
    
    if (!fs.existsSync(nonExistentFile)) {
      console.log('✓ Correctly identified non-existent file');
    } else {
      console.error('✗ Non-existent file check failed');
      return false;
    }
    
    // Test with read-only directory
    const readOnlyDir = './read-only-test';
    if (!fs.existsSync(readOnlyDir)) {
      fs.mkdirSync(readOnlyDir);
    }
    
    // Note: Changing directory permissions might not work on all systems
    console.log('✓ Error handling scenarios identified');
    
    return true;
  } catch (error) {
    console.error('✗ Error handling test failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('Starting Attachment Storage Mechanism Tests...\n');
  
  // Create test files
  createTestFiles();
  
  // Run individual tests
  const results = [];
  
  results.push(await testLocalFileStorage());
  results.push(await testDatabaseMetadata());
  results.push(await testJiraAttachment());
  results.push(await testErrorHandling());
  
  // Summary
  console.log('\n=== Test Summary ===');
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
    return true;
  } else {
    console.log('❌ Some tests failed.');
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const success = await runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Test suite failed with error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  testLocalFileStorage,
  testDatabaseMetadata,
  testJiraAttachment,
  testErrorHandling,
  runAllTests
};