import React, { useState, useEffect } from 'react';

const JiraIntegration = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    // Check if environment variables are properly configured
    if (!import.meta.env.VITE_JIRA_BASE_URL || !import.meta.env.VITE_JIRA_API_TOKEN) {
      setIsConfigured(false);
      setError('Jira configuration is missing. Please check your .env file.');
    }
  }, []);

  const fetchJiraProjects = async () => {
    if (!isConfigured) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const authString = btoa(`tejastidke007@gmail.com:${import.meta.env.VITE_JIRA_API_TOKEN}`);
      const response = await fetch(
        `${import.meta.env.VITE_JIRA_BASE_URL}/rest/api/3/project`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(`Failed to fetch projects: ${err.message}`);
      console.error('Jira API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
        <h2 className="text-xl font-semibold mb-2 text-yellow-800">Configuration Required</h2>
        <p className="text-yellow-700 mb-4">Please configure your Jira settings in the .env file.</p>
        <div className="bg-gray-800 text-gray-100 p-4 rounded text-sm font-mono">
          VITE_JIRA_BASE_URL=your-domain.atlassian.net<br />
          VITE_JIRA_API_TOKEN=your-api-token
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Jira Projects</h2>
        <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
          Connected to {import.meta.env.VITE_JIRA_BASE_URL}
        </span>
      </div>
      
      <button
        onClick={fetchJiraProjects}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </>
        ) : 'Fetch Jira Projects'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Your Projects</h3>
            <span className="text-sm text-gray-500">{projects.length} project(s) found</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start">
                  {project.avatarUrls && (
                    <img 
                      src={project.avatarUrls['48x48']} 
                      alt={project.name}
                      className="h-10 w-10 rounded mr-3"
                    />
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">{project.name}</h4>
                    <p className="text-sm text-gray-600">Key: {project.key}</p>
                    <p className="text-xs text-gray-500 mt-1">ID: {project.id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JiraIntegration;
