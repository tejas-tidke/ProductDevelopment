import React from "react";
import type { Agreement } from "./VendorAgreements";

type VendorAgreementDetailsProps = {
  agreement: Agreement;
  onBack: () => void;
};

const VendorAgreementDetails: React.FC<VendorAgreementDetailsProps> = ({
  agreement,
  onBack,
}) => {
  return (
    <div className="space-y-6">
      {/* Top breadcrumb + back */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button
            type="button"
            onClick={onBack}
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
            Offerings: {agreement.category || "Software"}
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
                    {agreement.startDate}
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    End Date
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    Jul 29, 2026
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Agreement Term
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    12 months
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
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing & License Details */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Pricing &amp; License Details
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
                    Line Item Type
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">License</td>
                </tr>

                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Offering Name
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {agreement.vendor}
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Pricing Model
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    User-based: Per Seat
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Plan
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    Growth Annual
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Quantity
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">10</td>
                </tr>

                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Cost per Unit
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {agreement.totalCost} USD
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Unit of Measure
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">Per Seat</td>
                </tr>

                <tr>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    Duration
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    Per Service Period
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAgreementDetails;
