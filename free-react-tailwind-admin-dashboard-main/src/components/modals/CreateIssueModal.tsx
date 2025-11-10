import React, { useState, useEffect, useRef } from 'react';
import { jiraService, IssueData, ProjectMeta } from '../../services/jiraService';
import IssueTypeIcon from '../tables/IssueTypeIcon';

// Define types
interface Project {
  id: string;
  key: string;
  name: string;
  description: string;
  projectTypeKey: string;
  issuetypes?: ProjectMeta['issuetypes']; // For storing issue types when fetched with project
}

interface IssueType {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
}

interface CreatedIssue {
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
    [key: string]: unknown;
  };
}

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueCreated?: (issue: CreatedIssue, attachments: File[]) => void;
}

const CreateIssueModal: React.FC<CreateIssueModalProps> = ({ isOpen, onClose, onIssueCreated }) => {
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
  const [attachmentUploadStatus, setAttachmentUploadStatus] = useState<{[key: string]: 'uploading' | 'success' | 'error'}>({});
  const dateInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIssueType('');
      setSummary('');
      setProject('');
      setDescription('');
      setDueDate('');
      setAssigneeCustom('');
      setAttachments([]);
      setErrors({});
      setAttachmentUploadStatus({});
    }
  }, [isOpen]);

  // Fetch projects and issue types from Jira when modal opens
  useEffect(() => {
    console.log("Modal isOpen changed to:", isOpen);
    if (isOpen) {
      console.log("Fetching Jira projects because modal is open");
      // Test connectivity first
      testJiraConnectivity();
      fetchJiraProjects();
      // Reset dropdown when modal opens
      if (dropdownRef.current) {
        dropdownRef.current.classList.add('hidden');
      }
    }
  }, [isOpen]);

  const testJiraConnectivity = async () => {
    try {
      console.log("Testing Jira connectivity...");
      const result = await jiraService.testJiraConnectivity();
      console.log("Jira connectivity test result:", result);
      
      // Also test getting all projects directly
      console.log("Testing getAllProjects...");
      const allProjects = await jiraService.getAllProjects();
      console.log("getAllProjects result:", allProjects);
      
      // Test getCreateMeta as well
      console.log("Testing getCreateMeta...");
      const createMeta = await jiraService.getCreateMeta();
      console.log("getCreateMeta result:", createMeta);
    } catch (error) {
      console.error("Jira connectivity test failed:", error);
      alert("Failed to connect to Jira. Please check your network connection and Jira configuration.");
    }
  };

  const fetchJiraProjects = async () => {
    try {
      setLoadingProjects(true);
      console.log("Fetching Jira projects...");
      const data: ProjectMeta[] = await jiraService.getCreateMeta();
      console.log("Received project data:", data);
      console.log("Data type:", typeof data);
      console.log("Is array:", Array.isArray(data));
      console.log("Data length:", Array.isArray(data) ? data.length : 'N/A');
      
      if (Array.isArray(data) && data.length > 0) {
        setJiraProjects(data.map((p) => ({
          id: p.id,
          key: p.key,
          name: p.name,
          description: p.description,
          projectTypeKey: p.projectTypeKey,
          issuetypes: p.issuetypes,
        })));
        console.log("Set jiraProjects state with", data.length, "projects");
      } else {
        console.warn("No projects received or empty array");
        setJiraProjects([]);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      // Show error to user
      alert("Failed to fetch projects. Please check the console for details.");
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchIssueTypesForProject = async (projectKey: string) => {
    try {
      setLoadingIssueTypes(true);
      const data: ProjectMeta[] = await jiraService.getCreateMeta(projectKey);
      const projectData = data.find((p) => p.key === projectKey);
      setIssueTypes(projectData?.issuetypes || []);
    } catch (err) {
      console.error("Error fetching issue types:", err);
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
    if (validateForm()) {
      try {
        // Automatically set reporter to current user (hardcoded for now)
        const issueData: IssueData = {
          issueType,
          summary,
          project,
          description,
          dueDate,
          assignee: assigneeCustom || undefined
        };
        
        console.log('Creating issue with data:', issueData);
        
        // Call the onSubmit handler with Jira's expected payload structure
        const createdIssue = await jiraService.createIssueJira(issueData);
        console.log('Issue created successfully:', createdIssue);
        
        // Upload attachments if any
        if (attachments.length > 0 && createdIssue && createdIssue.key) {
          try {
            // Upload each attachment and track status
            const uploadPromises = attachments.map(async (attachment) => {
              try {
                setAttachmentUploadStatus(prev => ({ ...prev, [attachment.name]: 'uploading' }));
                console.log(`Uploading attachment: ${attachment.name}`);
                const response = await jiraService.addAttachmentToIssueJira(createdIssue.key, attachment);
                console.log(`Successfully uploaded attachment: ${attachment.name}`, response);
                setAttachmentUploadStatus(prev => ({ ...prev, [attachment.name]: 'success' }));
                return { success: true, fileName: attachment.name };
              } catch (error) {
                console.error('Error uploading attachment:', attachment.name, error);
                setAttachmentUploadStatus(prev => ({ ...prev, [attachment.name]: 'error' }));
                return { success: false, fileName: attachment.name, error };
              }
            });
            
            // Wait for all attachment uploads to complete
            const results = await Promise.all(uploadPromises);
            
            // Count successes and failures
            const successCount = results.filter(r => r.success).length;
            const failCount = results.filter(r => !r.success).length;
            
            if (failCount === 0) {
              // All attachments uploaded successfully
              console.log(`All ${successCount} attachments uploaded successfully`);
            } else if (successCount === 0) {
              console.warn('All attachments failed to upload');
            } else {
              console.warn(`${successCount} attachments uploaded, ${failCount} failed`);
            }
          } catch (error) {
            console.error('Error uploading attachments:', error);
          }
        }
        
        // Notify parent component if callback is provided
        if (onIssueCreated) {
          onIssueCreated(createdIssue, attachments);
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
        setAttachmentUploadStatus({});
        
        // Close the modal
        onClose();
      } catch (error) {
        console.error('Error creating issue:', error);
        if (error instanceof Error) {
          alert(`Failed to create issue: ${error.message}`);
        } else {
          alert('Failed to create issue. Please check your network connection and try again.');
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
              Create Issue
            </h3>
          </div>

          {/* Modal body */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Project *
                </label>
                <div className="flex space-x-2">
                  <select
                    value={project}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const selectedProject = e.target.value;
                      setProject(selectedProject);
                      fetchIssueTypesForProject(selectedProject);
                      if (errors.project) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.project;
                          return newErrors;
                        });
                      }
                    }}
                    className="flex-1 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    aria-label="Project"
                    disabled={loadingProjects}
                  >
                    <option value="">{loadingProjects ? 'Loading projects...' : 'Select project'}</option>
                    {jiraProjects.map((proj) => (
                      <option key={proj.key} value={proj.key}>
                        {proj.name} ({proj.key})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={fetchJiraProjects}
                    disabled={loadingProjects}
                    className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    title="Refresh projects"
                  >
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                {loadingProjects && <p className="mt-1 text-sm text-gray-500">Loading projects...</p>}
                {jiraProjects.length === 0 && !loadingProjects && (
                  <div className="mt-1">
                    <p className="text-sm text-gray-500">No projects available. Please check your Jira connection.</p>
                    <button 
                      type="button" 
                      onClick={testJiraConnectivity}
                      className="mt-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Test Connection
                    </button>
                  </div>
                )}
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
                      <span className="ml-2">{issueType}</span>
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
                      <span className="ml-2">{type.name}</span>
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
                    id="attachment-input-create"
                  />
                  <label 
                    htmlFor="attachment-input-create"
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
                            <div className="flex items-center">
                              <span className="truncate max-w-xs">{file.name}</span>
                              {attachmentUploadStatus && attachmentUploadStatus[file.name] === 'uploading' && (
                                <svg className="ml-2 h-4 w-4 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              )}
                              {attachmentUploadStatus && attachmentUploadStatus[file.name] === 'success' && (
                                <svg className="ml-2 h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                              {attachmentUploadStatus && attachmentUploadStatus[file.name] === 'error' && (
                                <svg className="ml-2 h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
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
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateIssueModal;