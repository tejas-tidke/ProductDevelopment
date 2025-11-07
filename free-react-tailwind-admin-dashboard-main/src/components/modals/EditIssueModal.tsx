import React, { useState, useEffect, useRef } from 'react';
import { jiraService, IssueUpdateData } from '../../services/jiraService';
import IssueTypeIcon from '../tables/IssueTypeIcon';

// Define types
interface Project {
  id: string;
  key: string;
  name: string;
  description: string;
  projectTypeKey: string;
}

interface JiraIssueType {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
}

interface IssueType {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
}

// Define the issue structure
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

interface EditIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (issueIdOrKey: string, issueData: IssueUpdateData) => void;
  issue: Issue; // The issue to edit
}

const EditIssueModal: React.FC<EditIssueModalProps> = ({ isOpen, onClose, onSubmit, issue }) => {
  const [issueType, setIssueType] = useState('');
  const [summary, setSummary] = useState('');
  const [project, setProject] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assigneeCustom, setAssigneeCustom] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [jiraProjects, setJiraProjects] = useState<Project[]>([]);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingIssueTypes, setLoadingIssueTypes] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form with issue data when modal opens
  useEffect(() => {
    if (isOpen && issue) {
      // Set form values from the issue data
      setIssueType(issue.fields?.issuetype?.name || '');
      setSummary(issue.fields?.summary || '');
      setProject(issue.fields?.project?.key || '');
      setDescription(issue.fields?.description || '');
      setDueDate(issue.fields?.duedate || '');
      setAssigneeCustom(issue.fields?.customfield_10200 || '');
      
      fetchJiraProjects();
      fetchIssueTypes();
      // Reset dropdown when modal opens
      if (dropdownRef.current) {
        dropdownRef.current.classList.add('hidden');
      }
    }
  }, [isOpen, issue]);

  const fetchJiraProjects = async () => {
    try {
      setLoadingProjects(true);
      const projectsData = await jiraService.getAllProjects();
      setJiraProjects(projectsData);
    } catch (error) {
      console.error('Error fetching Jira projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchIssueTypes = async () => {
    try {
      setLoadingIssueTypes(true);
      const issueTypesData: JiraIssueType[] = await jiraService.getIssueTypes();
      // Filter to only include specific issue types
      const filteredIssueTypes = issueTypesData.filter(type => 
        ['Epic', 'Story', 'Sub-task', 'Bug', 'Task'].includes(type.name)
      );
      // Convert the response to our IssueType format
      const formattedIssueTypes: IssueType[] = filteredIssueTypes.map((type) => ({
        id: type.id,
        name: type.name,
        description: type.description || '',
        iconUrl: type.iconUrl || ''
      }));
      setIssueTypes(formattedIssueTypes);
    } catch (error) {
      console.error('Error fetching issue types:', error);
      // Fallback to static issue types if API call fails
      const staticIssueTypes: IssueType[] = [
        { id: '1', name: 'Task', description: 'A task that needs to be done', iconUrl: '' },
        { id: '2', name: 'Bug', description: 'A problem or error', iconUrl: '' },
        { id: '3', name: 'Story', description: 'A user story', iconUrl: '' },
        { id: '4', name: 'Epic', description: 'A large user story', iconUrl: '' },
        { id: '5', name: 'Sub-task', description: 'A sub-task of a story or task', iconUrl: '' }
      ];
      setIssueTypes(staticIssueTypes);
    } finally {
      setLoadingIssueTypes(false);
    }
  };

  // Validate form - only require essential fields
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!issueType) newErrors.issueType = 'Issue type is required';
    if (!summary) newErrors.summary = 'Summary is required';
    if (!project) newErrors.project = 'Project is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...files]);
    }
  };

  // Handle removing an attachment
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (validateForm() && issue) {
      try {
        // Create the issue data object with proper field names for the backend
        const issueData: IssueUpdateData = {
          issueType: issueType,
          summary: summary,
          project: project,
          description: description,
          dueDate: dueDate || '', // Send empty string if dueDate is not set
          assigneeCustom: assigneeCustom || undefined,
          reporterCustom: "Manish Jangir" // Hardcoded current user for custom field
        };
        
        // Call the onSubmit handler for issue update
        await onSubmit(issue.key, issueData);
        
        // Upload attachments if any
        if (attachments.length > 0) {
          try {
            let successCount = 0;
            let failCount = 0;
            
            // Create an array of promises for all attachment uploads
            const attachmentPromises = attachments.map(async (attachment) => {
              try {
                const response = await jiraService.addAttachmentToIssue(issue.key, attachment);
                console.log(`Successfully uploaded attachment: ${attachment.name}`, response);
                // Check if response indicates success
                if (response && Array.isArray(response) && response.length > 0) {
                  return { success: true, fileName: attachment.name };
                } else {
                  return { success: false, fileName: attachment.name, error: "Empty response" };
                }
              } catch (error) {
                console.error('Error uploading attachment:', error);
                return { success: false, fileName: attachment.name, error };
              }
            });
            
            // Wait for all attachment uploads to complete
            const results = await Promise.all(attachmentPromises);
            
            // Count successes and failures
            results.forEach(result => {
              if (result.success) {
                successCount++;
              } else {
                failCount++;
              }
            });
            
            if (failCount === 0) {
              alert(`Issue updated successfully with ${successCount} new attachment(s)`);
            } else if (successCount === 0) {
              alert('Issue updated successfully, but all new attachments failed to upload. Please check your network connection and try again.');
            } else {
              alert(`Issue updated successfully with ${successCount} new attachment(s) uploaded, ${failCount} failed. Please check your network connection and try again for failed attachments.`);
            }
          } catch (error) {
            console.error('Error uploading attachments:', error);
            alert('Issue updated successfully, but some attachments failed to upload. Please check your network connection and try again.');
          }
        } else {
          alert('Issue updated successfully');
        }
        
        // Reset form
        setIssueType('');
        setSummary('');
        setProject('');
        setDescription('');
        setDueDate('');
        setAssigneeCustom('');
        setAttachments([]);
        setErrors({});
        
        // Close the modal
        onClose();
      } catch (error) {
        console.error('Error updating issue:', error);
        if (error instanceof Error) {
          alert(`Failed to update issue: ${error.message}`);
        } else {
          alert('Failed to update issue. Please check your network connection and try again.');
        }
      }
    }
  };

  // Handle calendar icon click
  const handleCalendarClick = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Check if the click was on the issue type button
        const issueTypeButton = (event.target as HTMLElement).closest('button[aria-label="Issue Type"]');
        if (!issueTypeButton) {
          dropdownRef.current.classList.add('hidden');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isOpen) return null;

  return (
    // Portal the modal to the body to ensure it overlays everything
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Background overlay that covers entire screen */}
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal container - centered vertically and horizontally */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        {/* Modal content */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full dark:bg-gray-800 z-[9999] relative">
          {/* Modal header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Edit Issue
            </h3>
          </div>

          {/* Modal body */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Project *
                </label>
                <select
                  value={project}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setProject(e.target.value);
                    if (errors.project) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.project;
                        return newErrors;
                      });
                    }
                  }}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  aria-label="Project"
                  disabled={loadingProjects}
                >
                  <option value="">{loadingProjects ? 'Loading projects...' : 'Select project'}</option>
                  {jiraProjects.map((proj) => (
                    <option key={proj.key} value={proj.key}>
                      {proj.name}
                    </option>
                  ))}
                </select>
                {errors.project && (
                  <p className="mt-1 text-sm text-red-600">{errors.project}</p>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Issue Type *
                </label>
                <button
                  type="button"
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-left"
                  onClick={() => dropdownRef.current?.classList.toggle('hidden')}
                  disabled={loadingIssueTypes}
                  aria-haspopup="listbox"
                  aria-expanded="false"
                  aria-label="Issue Type"
                >
                  {issueType ? (
                    <div className="flex items-center">
                      <IssueTypeIcon type={issueType} size="sm" />
                    </div>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Select issue type</span>
                  )}
                </button>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300 pointer-events-none">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
                <div 
                  ref={dropdownRef}
                  className="hidden absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 dark:bg-gray-700 max-h-60 overflow-auto"
                  role="listbox"
                >
                  {issueTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 flex items-center"
                      onClick={() => {
                        setIssueType(type.name);
                        dropdownRef.current?.classList.add('hidden');
                        if (errors.issueType) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.issueType;
                            return newErrors;
                          });
                        }
                      }}
                      role="option"
                      title={`Select ${type.name} issue type`}
                    >
                      <IssueTypeIcon type={type.name} size="sm" />
                    </button>
                  ))}
                </div>
                {errors.issueType && (
                  <p className="mt-1 text-sm text-red-600">{errors.issueType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Summary *
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSummary(e.target.value);
                    if (errors.summary) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.summary;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="What needs to be done?"
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  aria-label="Summary"
                />
                {errors.summary && (
                  <p className="mt-1 text-sm text-red-600">{errors.summary}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assignee (Custom Field - customfield_10200)
                </label>
                <input
                  type="text"
                  value={assigneeCustom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setAssigneeCustom(e.target.value);
                  }}
                  placeholder="Enter assignee name"
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  aria-label="Assignee Custom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setDescription(e.target.value);
                  }}
                  placeholder="Add a description (optional)"
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  aria-label="Description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <div className="relative">
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={dueDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setDueDate(e.target.value);
                    }}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    aria-label="Due Date"
                  />
                  <button
                    type="button"
                    onClick={handleCalendarClick}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    aria-label="Open calendar"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Attachments Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Attachments
                </label>
                <div className="border border-gray-300 rounded-md p-3 dark:border-gray-600">
                  {/* File input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="attachment-input"
                  />
                  <label 
                    htmlFor="attachment-input"
                    className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    <svg className="mr-2 -ml-1 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                    </svg>
                    Add Files
                  </label>
                  
                  {/* Selected attachments */}
                  {attachments.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selected Files:</h4>
                      <ul className="space-y-1">
                        {attachments.map((file, index) => (
                          <li key={`${file.name}-${file.size}`} className="flex items-center justify-between text-sm bg-gray-100 rounded p-2 dark:bg-gray-700">
                            <span className="truncate max-w-xs">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(index)}
                              className="text-red-500 hover:text-red-700 ml-2"
                              aria-label={`Remove ${file.name}`}
                            >
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 dark:bg-gray-700 dark:border-gray-600">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditIssueModal;