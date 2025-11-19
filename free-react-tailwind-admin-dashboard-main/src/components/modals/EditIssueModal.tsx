import React, { useState, useEffect, useRef } from 'react';
import { jiraService, IssueUpdateData } from '../../services/jiraService';
import { createPortal } from "react-dom";

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
    // Procurement request fields
    customfield_10290?: string; // Vendor Name
    customfield_10291?: string; // Product Name
    customfield_10292?: string; // Billing Type
    customfield_10293?: string; // Current License Count
    customfield_10294?: string; // Current Usage Count
    customfield_10295?: string; // Current Units
    customfield_10296?: string; // New License Count
    customfield_10297?: string; // New Usage Count
    customfield_10298?: string; // New Units
    customfield_10243?: string; // Requester Name
    customfield_10246?: string; // Requester Email
    customfield_10244?: string; // Department
    customfield_10299?: string; // Contract Type
    customfield_10300?: string; // License Update Type
    customfield_10301?: string; // Existing Contract ID
    customfield_10302?: string; // Due Date
    customfield_10303?: string; // Renewal Date
    customfield_10304?: string; // Additional Comments
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
  
  // Procurement request fields
  const [vendorName, setVendorName] = useState('');
  const [productName, setProductName] = useState('');
  const [billingType, setBillingType] = useState('');
  const [currentLicenseCount, setCurrentLicenseCount] = useState('');
  const [currentUsageCount, setCurrentUsageCount] = useState('');
  const [currentUnits, setCurrentUnits] = useState('');
  const [newLicenseCount, setNewLicenseCount] = useState('');
  const [newUsageCount, setNewUsageCount] = useState('');
  const [newUnits, setNewUnits] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [contractType, setContractType] = useState('');
  const [licenseUpdateType, setLicenseUpdateType] = useState('');
  const [existingContractId, setExistingContractId] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  
  const dateInputRef = useRef<HTMLInputElement>(null);
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
      
      // Procurement request fields
      setVendorName(issue.fields?.customfield_10290 || '');
      setProductName(issue.fields?.customfield_10291 || '');
      setBillingType(issue.fields?.customfield_10292 || '');
      setCurrentLicenseCount(issue.fields?.customfield_10293 || '');
      setCurrentUsageCount(issue.fields?.customfield_10294 || '');
      setCurrentUnits(issue.fields?.customfield_10295 || '');
      setNewLicenseCount(issue.fields?.customfield_10296 || '');
      setNewUsageCount(issue.fields?.customfield_10297 || '');
      setNewUnits(issue.fields?.customfield_10298 || '');
      setRequesterName(issue.fields?.customfield_10243 || '');
      setRequesterEmail(issue.fields?.customfield_10246 || '');
      setDepartment(issue.fields?.customfield_10244 || '');
      setContractType(issue.fields?.customfield_10299 || '');
      setLicenseUpdateType(issue.fields?.customfield_10300 || '');
      setExistingContractId(issue.fields?.customfield_10301 || '');
      setRenewalDate(issue.fields?.customfield_10303 || '');
      setAdditionalComments(issue.fields?.customfield_10304 || '');
    }
  }, [isOpen, issue]);

  // Validate form - only require essential fields
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Issue type and project are fetched automatically, so we don't validate them
    if (!summary) newErrors.summary = 'Summary is required';
    
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
          reporterCustom: "Manish Jangir", // Hardcoded current user for custom field
          
          // Procurement request fields
          customfield_10290: vendorName || undefined,
          customfield_10291: productName || undefined,
          customfield_10292: billingType || undefined,
          customfield_10293: currentLicenseCount || undefined,
          customfield_10294: currentUsageCount || undefined,
          customfield_10295: currentUnits || undefined,
          customfield_10296: newLicenseCount || undefined,
          customfield_10297: newUsageCount || undefined,
          customfield_10298: newUnits || undefined,
          customfield_10243: requesterName || undefined,
          customfield_10246: requesterEmail || undefined,
          customfield_10244: department || undefined,
          customfield_10299: contractType || undefined,
          customfield_10300: licenseUpdateType || undefined,
          customfield_10301: existingContractId || undefined,
          customfield_10303: renewalDate || undefined,
          customfield_10304: additionalComments || undefined,
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
        
        // Reset procurement fields
        setVendorName('');
        setProductName('');
        setBillingType('');
        setCurrentLicenseCount('');
        setCurrentUsageCount('');
        setCurrentUnits('');
        setNewLicenseCount('');
        setNewUsageCount('');
        setNewUnits('');
        setRequesterName('');
        setRequesterEmail('');
        setDepartment('');
        setContractType('');
        setLicenseUpdateType('');
        setExistingContractId('');
        setRenewalDate('');
        setAdditionalComments('');
        
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

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto">
      {/* Background overlay that covers the entire screen */}
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-80 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal container - centered vertically and horizontally */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Invisible span to trick the browser into vertical centering */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal content */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full dark:bg-gray-800 z-[100000] relative">
          {/* Modal header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Edit Request
            </h3>
          </div>

          {/* Modal body */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              {/* Summary */}
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

              {/* Procurement Request Fields */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
                <h3 className="text-md font-semibold text-gray-900 dark:text-white">Procurement Request Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vendor & Product */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vendor Name
                  </label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Billing Type
                  </label>
                  <input
                    type="text"
                    value={billingType}
                    onChange={(e) => setBillingType(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contract Type
                  </label>
                  <input
                    type="text"
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                {/* Current counts */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current License Count
                  </label>
                  <input
                    type="text"
                    value={currentLicenseCount}
                    onChange={(e) => setCurrentLicenseCount(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Usage Count
                  </label>
                  <input
                    type="text"
                    value={currentUsageCount}
                    onChange={(e) => setCurrentUsageCount(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Units
                  </label>
                  <input
                    type="text"
                    value={currentUnits}
                    onChange={(e) => setCurrentUnits(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                {/* New counts */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New License Count
                  </label>
                  <input
                    type="text"
                    value={newLicenseCount}
                    onChange={(e) => setNewLicenseCount(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Usage Count
                  </label>
                  <input
                    type="text"
                    value={newUsageCount}
                    onChange={(e) => setNewUsageCount(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Units
                  </label>
                  <input
                    type="text"
                    value={newUnits}
                    onChange={(e) => setNewUnits(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                {/* Requester info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Requester Name
                  </label>
                  <input
                    type="text"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Requester Email
                  </label>
                  <input
                    type="text"
                    value={requesterEmail}
                    onChange={(e) => setRequesterEmail(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    License Update Type
                  </label>
                  <input
                    type="text"
                    value={licenseUpdateType}
                    onChange={(e) => setLicenseUpdateType(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Existing Contract ID
                  </label>
                  <input
                    type="text"
                    value={existingContractId}
                    onChange={(e) => setExistingContractId(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                {/* Dates */}
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
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Renewal Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={renewalDate}
                      onChange={(e) => setRenewalDate(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Comments
                </label>
                <textarea
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  placeholder="Enter additional comments"
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Assignee */}
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

              {/* Description */}
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
                    <svg
                      className="mr-2 -ml-1 h-5 w-5 text-gray-500"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Add Files
                  </label>

                  {/* Selected attachments */}
                  {attachments.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Selected Files:
                      </h4>
                      <ul className="space-y-1">
                        {attachments.map((file, index) => (
                          <li
                            key={`${file.name}-${file.size}`}
                            className="flex items-center justify-between text-sm bg-gray-100 rounded p-2 dark:bg-gray-700"
                          >
                            <span className="truncate max-w-xs">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(index)}
                              className="text-red-500 hover:text-red-700 ml-2"
                              aria-label={`Remove ${file.name}`}
                            >
                              <svg
                                className="h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
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
    </div>,
    document.body // ✅ This ensures the modal overlays navbar and layout
  );
};

export default EditIssueModal;