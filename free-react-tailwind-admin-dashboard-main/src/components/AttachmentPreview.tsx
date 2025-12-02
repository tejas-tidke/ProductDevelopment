import React, { useState, useEffect } from 'react';

interface AttachmentPreviewProps {
  file: File;
  fileUrl?: string;
  onClose: () => void;
  hasLocalCopy?: boolean;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ file, fileUrl: propFileUrl, onClose, hasLocalCopy }) => {
  const [fileUrl, setFileUrl] = useState<string | null>(propFileUrl || null);
  const [fileType, setFileType] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have a fileUrl prop, use it directly
    if (propFileUrl) {
      setFileUrl(propFileUrl);
      
      // Determine file type for appropriate preview based on URL or file
      const urlLower = propFileUrl.toLowerCase();
      if (urlLower.includes('.jpg') || urlLower.includes('.jpeg') || urlLower.includes('.png') || urlLower.includes('.gif')) {
        setFileType('image');
      } else if (urlLower.includes('.pdf')) {
        setFileType('pdf');
      } else {
        setFileType('other');
      }
      setLoading(false);
      return;
    }
    
    // Otherwise, create object URL from file
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    
    // Determine file type for appropriate preview
    const type = file.type.toLowerCase();
    if (type.includes('image')) {
      setFileType('image');
    } else if (type.includes('pdf')) {
      setFileType('pdf');
    } else {
      setFileType('other');
    }
    setLoading(false);

    // Clean up URL object when component unmounts
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, propFileUrl]);

  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (hasLocalCopy === false) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-75">
        <div className="relative bg-white rounded-lg shadow-xl w-full h-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {file.name}
            </h3>
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Close
            </button>
          </div>
          
          {/* Error Message */}
          <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Local Copy Not Found</h3>
              <p className="mt-2 text-sm text-gray-500">
                The local copy of this file is missing or has been moved. Please re-upload the file to restore local access.
              </p>
              <div className="mt-6">
                <button
                  onClick={onClose}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative bg-white rounded-lg shadow-xl w-full h-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {file.name}
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Download
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
          {fileType === 'image' && fileUrl && (
            <img 
              src={fileUrl} 
              alt={file.name}
              className="max-w-full max-h-full object-contain"
            />
          )}
          
          {fileType === 'pdf' && fileUrl && (
            <iframe
              src={fileUrl}
              className="w-full h-full min-h-[600px]"
              title={file.name}
            />
          )}
          
          {fileType === 'other' && (
            <div className="text-center p-8">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-100">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Unable to preview file</h3>
              <p className="mt-2 text-sm text-gray-500">
                This file type cannot be previewed. You can download it instead.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Download File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t text-sm text-gray-500">
          <div className="flex justify-between">
            <span>File size: {(file.size / 1024).toFixed(2)} KB</span>
            <span>Type: {file.type || 'Unknown'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttachmentPreview;