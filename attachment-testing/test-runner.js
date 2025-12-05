/**
 * Attachment Testing Runner
 * 
 * This script helps run attachment tests from the command line
 * and provides utilities for testing the attachment functionality.
 */

const fs = require('fs');
const path = require('path');

// Function to list all test files in the directory
function listTestFiles() {
    console.log('🔍 Available Test Files:');
    console.log('========================');
    
    const testFiles = [
        'attachment-test-standalone.html',
        'simple-attachment-test.html',
        'attachment-test-script.js',
        'frontend-test-access.js'
    ];
    
    testFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
        } else {
            console.log(`❌ ${file} (Not found)`);
        }
    });
    
    console.log('\n📁 Documentation Files:');
    console.log('======================');
    
    const docFiles = [
        'ATTACHMENT_TESTING_GUIDE.md',
        'AttachmentStorageTest.md',
        'TechnicalTestImplementation.md'
    ];
    
    docFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`📄 ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
        } else {
            console.log(`❌ ${file} (Not found)`);
        }
    });
}

// Function to provide testing instructions
function showTestingInstructions() {
    console.log('\n🧪 Attachment Testing Instructions:');
    console.log('===================================');
    console.log('1. Open one of the HTML test files directly in your browser:');
    console.log('   - attachment-test-standalone.html');
    console.log('   - simple-attachment-test.html');
    console.log('');
    console.log('2. Make sure your backend server is running at http://localhost:8080');
    console.log('   (or update the API URL in the test pages if different)');
    console.log('');
    console.log('3. Select a test file and choose a test type');
    console.log('4. Run the test and observe the results');
    console.log('5. Verify in Jira that attachments were properly uploaded');
    console.log('');
    console.log('📝 For automated testing, run: node attachment-test-script.js');
}

// Function to check if required files exist
function checkRequiredFiles() {
    console.log('\n✅ Checking Required Files:');
    console.log('==========================');
    
    const requiredFiles = [
        'attachment-test-standalone.html',
        'simple-attachment-test.html',
        'ATTACHMENT_TESTING_GUIDE.md'
    ];
    
    let allExist = true;
    
    requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            console.log(`✅ ${file} - Found`);
        } else {
            console.log(`❌ ${file} - Missing`);
            allExist = false;
        }
    });
    
    if (allExist) {
        console.log('\n🎉 All required files are present!');
    } else {
        console.log('\n⚠️  Some required files are missing.');
    }
    
    return allExist;
}

// Main function
function main() {
    console.log('🚀 Attachment Testing Framework');
    console.log('===============================');
    
    checkRequiredFiles();
    listTestFiles();
    showTestingInstructions();
    
    console.log('\n📖 For detailed instructions, see ATTACHMENT_TESTING_GUIDE.md');
}

// Run the script if called directly
if (require.main === module) {
    main();
}

module.exports = {
    listTestFiles,
    showTestingInstructions,
    checkRequiredFiles
};