import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import PageMeta from '../components/common/PageMeta';
import { jiraService, IssueUpdateData } from '../services/jiraService';
import EditIssueModal from '../components/modals/EditIssueModal';

// Define types
interface Issue {
  id: string;
  key: string;
  fields: {
    summary?: string;
    project?: {
      key: string;
    };
    description?: string;
    duedate?: string;
    issuetype?: {
      name: string;
    };
    customfield_10200?: string;
  };
}

const EditIssuePage: React.FC = () => {
  const { issueKey } = useParams<{ issueKey: string }>();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch issue data
  useEffect(() => {
    const fetchIssue = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching issue data for editing:", issueKey);

        const issueResponse = await jiraService.getIssueByIdOrKey(issueKey!);
        console.log("Issue response for editing:", issueResponse);

        setIssue(issueResponse);
      } catch (err) {
        console.error("Error fetching issue for editing:", err);
        setError("Failed to fetch issue details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (issueKey) {
      fetchIssue();
    }
  }, [issueKey]);

  // Handle edit issue submission
  const handleEditIssueSubmit = async (issueIdOrKey: string, issueData: IssueUpdateData) => {
    try {
      await jiraService.updateIssue(issueIdOrKey, issueData);
      alert('Issue updated successfully');
      // Navigate back to the issue detail page
      navigate(`/issues/${issueKey}`);
    } catch (error) {
      console.error('Error updating issue:', error);
      alert('Failed to update issue');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/issues/${issueKey}`);
  };

  if (loading) {
    return (
      <>
        <PageMeta title="Edit Issue" description="Edit issue details" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta title="Edit Issue" description="Edit issue details" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error! </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!issue) {
    return (
      <>
        <PageMeta title="Edit Issue" description="Edit issue details" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-center py-12">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white">Issue not found</h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">The requested issue could not be found.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title={`Edit Issue ${issue.key}`} description="Edit issue details" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Issue: {issue.key}
              </h1>
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Edit Form */}
          <div className="px-6 py-4">
            <EditIssueModal
              isOpen={true}
              onClose={handleCancel}
              onSubmit={handleEditIssueSubmit}
              issue={issue}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default EditIssuePage;
