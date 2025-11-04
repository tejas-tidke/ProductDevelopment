const axios = require('axios');

// Test the issues API endpoint
async function testIssuesApi() {
  try {
    console.log('Testing issues API...');
    
    // Make a request to the backend issues endpoint
    const response = await axios.get('http://localhost:8080/api/jira/issues');
    
    console.log('Response status:', response.status);
    console.log('Response data structure:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check if it has issues array
    if (response.data && Array.isArray(response.data.issues)) {
      console.log(`Found ${response.data.issues.length} issues`);
      if (response.data.issues.length > 0) {
        console.log('First issue structure:');
        console.log(JSON.stringify(response.data.issues[0], null, 2));
      }
    } else if (Array.isArray(response.data)) {
      console.log(`Found ${response.data.length} issues (direct array)`);
      if (response.data.length > 0) {
        console.log('First issue structure:');
        console.log(JSON.stringify(response.data[0], null, 2));
      }
    } else {
      console.log('Unexpected response structure:');
      console.log(JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('Error testing issues API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testIssuesApi();