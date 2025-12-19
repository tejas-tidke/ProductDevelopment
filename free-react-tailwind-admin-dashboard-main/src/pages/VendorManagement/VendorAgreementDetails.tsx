import React from "react";
import { useLocation, useNavigate } from "react-router";
import type { AgreementFromContract as Agreement } from "./VendorAgreements";

// Helper function to format dates in dd-mm-yyyy format
const formatDate = (value: string): string => {
  if (!value) return "N/A";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "N/A";
  // Format as dd-mm-yyyy (e.g., 16-12-2025)
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

type VendorAgreementDetailsProps = {
  agreement?: Agreement;
  onBack?: () => void;
};

const VendorAgreementDetails: React.FC<VendorAgreementDetailsProps> = ({
  agreement: propAgreement,
  onBack: propOnBack,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get agreement data from location state or props
  const agreement = location.state?.agreement || propAgreement;
  
  // Use prop onBack or default to navigate(-1)
  const handleBack = propOnBack || (() => navigate(-1));
  
  // If no agreement data, show error
  if (!agreement) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="text-indigo-600 hover:underline"
          >
            ← Back to Agreements
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">No agreement data found. Please select an agreement from the list.</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Top breadcrumb + back */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button
            type="button"
            onClick={handleBack}
            className="text-indigo-600 hover:underline"
          >
            ← Agreements
          </button>
          <span>/</span>
          <span className="font-medium text-gray-700">{agreement.vendor}</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {agreement.vendor}
          </h1>
          <p className="text-sm text-gray-500">
            Product: {agreement.productName || "N/A"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 border border-green-200">
            <span className="mr-1 h-2 w-2 rounded-full bg-green-500" />
            Active
          </span>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Agreement Details */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Agreement Details
          </h2>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="w-1/3 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Field
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Agreement ID
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {agreement.id}
                  </td>
                </tr>
                
                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Agreement Owner
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="flex items-center justify-between gap-3">
                      <span>{agreement.owner}</span>
                      <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Agreement Type
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {agreement.type || "Contract"}
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Start Date
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatDate(agreement.startDate)}
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    End Date
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatDate(agreement.endDate)}
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Agreement Term
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {agreement.contractDuration || "N/A"}
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Total Cost &amp; Currency
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {agreement.totalCost} USD
                  </td>
                </tr>
                
                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Jira Issue
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {agreement.jiraIssueKey || "N/A"}
                  </td>
                </tr>
                
                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Renewal Status
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {agreement.renewalStatus || "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Product & License Details */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Product &amp; License Details
          </h2>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="w-1/3 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Field
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Product Name
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {agreement.productName || "N/A"}
                  </td>
                </tr>
                
                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Billing Type
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {agreement.billingType || "N/A"}
                  </td>
                </tr>
                
                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Current License Count
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {agreement.currentLicenseCount !== null ? agreement.currentLicenseCount : "N/A"}
                  </td>
                </tr>
                
                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    New License Count
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {agreement.newLicenseCount !== null ? agreement.newLicenseCount : "N/A"}
                  </td>
                </tr>
                
                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Current Usage Count
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {agreement.currentUsageCount !== null ? agreement.currentUsageCount : "N/A"}
                  </td>
                </tr>
                
                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    New Usage Count
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {agreement.newUsageCount !== null ? agreement.newUsageCount : "N/A"}
                  </td>
                </tr>
                
                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Current Units
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {agreement.currentUnits || "N/A"}
                  </td>
                </tr>
                
                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    New Units
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {agreement.newUnits || "N/A"}
                  </td>
                </tr>
                
                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Due Date
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {agreement.dueDate || "N/A"}
                  </td>
                </tr>
                
                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Renewal Date
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {agreement.renewalDate || "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Additional Information Section */}
      {(agreement.contractDuration || agreement.licenseUpdateType || agreement.additionalComment) && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Additional Information
          </h2>
          
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="w-1/3 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Field
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {agreement.contractDuration && (
                  <tr>
                    <td className="px-4 py-3 text-xs font-medium text-gray-500">
                      Contract Duration
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {agreement.contractDuration}
                    </td>
                  </tr>
                )}
                
                {agreement.licenseUpdateType && (
                  <tr>
                    <td className="px-4 py-3 text-xs font-medium text-gray-500">
                      License Update Type
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {agreement.licenseUpdateType}
                    </td>
                  </tr>
                )}
                
                {agreement.additionalComment && (
                  <tr>
                    <td className="px-4 py-3 text-xs font-medium text-gray-500">
                      Additional Comment
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {agreement.additionalComment}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorAgreementDetails;