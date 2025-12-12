import React, { useMemo, useState } from "react";

interface RenewalItem {
  id: string;
  vendorName: string;
  product: string;
  renewalDeadline: string; // display string (e.g. "Aug 29, 2025")
  daysUntilRenewal: number;
  renewalStage: "Completed" | "Alerted" | "In Progress";
  owner: string;
  totalValue: string; // display like "13,800"
}

const mockRenewals: RenewalItem[] = [
  {
    id: "C-152",
    vendorName: "Tilt",
    product: "Tilt",
    renewalDeadline: "Aug 29, 2025",
    daysUntilRenewal: 3,
    renewalStage: "Completed",
    owner: "Tara Lee Collard",
    totalValue: "13,800",
  },
  {
    id: "C-148",
    vendorName: "Outreach Corporation",
    product: "Outreach",
    renewalDeadline: "Sep 01, 2025",
    daysUntilRenewal: 6,
    renewalStage: "Completed",
    owner: "Lexis Jenkins",
    totalValue: "21,240",
  },
  {
    id: "C-160",
    vendorName: "Lightcast",
    product: "Lightcast",
    renewalDeadline: "Sep 13, 2025",
    daysUntilRenewal: 18,
    renewalStage: "Alerted",
    owner: "Fei Sha",
    totalValue: "54,150",
  },
  {
    id: "C-150",
    vendorName: "Navan",
    product: "Navan",
    renewalDeadline: "Sep 13, 2025",
    daysUntilRenewal: 18,
    renewalStage: "Alerted",
    owner: "Tara Lee Collard",
    totalValue: "38,880",
  },
  {
    id: "C-151",
    vendorName: "Gong.IO INC",
    product: "Gong",
    renewalDeadline: "Sep 14, 2025",
    daysUntilRenewal: 19,
    renewalStage: "In Progress",
    owner: "Lexis Jenkins",
    totalValue: "172,137",
  },
  {
    id: "C-154",
    vendorName: "HubSpot,Inc.",
    product: "Hubspot Marketing Hub",
    renewalDeadline: "Sep 14, 2025",
    daysUntilRenewal: 19,
    renewalStage: "Completed",
    owner: "Ryan Niehaus",
    totalValue: "69,498",
  },
  {
    id: "C-193",
    vendorName: "Gong.IO INC",
    product: "Gong +1",
    renewalDeadline: "Sep 14, 2025",
    daysUntilRenewal: 19,
    renewalStage: "Alerted",
    owner: "Lexis Jenkins",
    totalValue: "4,859",
  },
  {
    id: "C-203",
    vendorName: "Gong.IO INC",
    product: "Gong",
    renewalDeadline: "Sep 14, 2025",
    daysUntilRenewal: 19,
    renewalStage: "Alerted",
    owner: "Lexis Jenkins",
    totalValue: "1,470",
  },
  {
    id: "C-158",
    vendorName: "Retool,Inc",
    product: "Retool",
    renewalDeadline: "Sep 20, 2025",
    daysUntilRenewal: 25,
    renewalStage: "Alerted",
    owner: "Karthick Mohanram",
    totalValue: "589",
  },
  {
    id: "C-153",
    vendorName: "Sendoso",
    product: "Sendoso",
    renewalDeadline: "Sep 27, 2025",
    daysUntilRenewal: 32,
    renewalStage: "In Progress",
    owner: "Lexis Jenkins",
    totalValue: "56,400",
  },
];

const Renewal_vendor: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRenewals = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return mockRenewals;
    return mockRenewals.filter(
      (r) =>
        r.vendorName.toLowerCase().includes(term) ||
        r.product.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const handleExportCSV = () => {
    if (!filteredRenewals.length) {
      alert("No data to export.");
      return;
    }

    const headers = [
      "Renewal ID",
      "Vendor Name",
      "Product(s)",
      "Renewal Deadline",
      "Days Until Renewal",
      "Renewal Stage",
      "Owner",
      "Total Value (USD)",
    ];

    const escapeCell = (val: string) => `"${val.replace(/"/g, '""')}"`;

    const rows = filteredRenewals.map((r) =>
      [
        r.id,
        r.vendorName,
        r.product,
        r.renewalDeadline,
        r.daysUntilRenewal.toString(),
        r.renewalStage,
        r.owner,
        r.totalValue,
      ].map(escapeCell)
       .join(",")
    );

    const csv = [headers.map(escapeCell).join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `renewals-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderStageBadge = (stage: RenewalItem["renewalStage"]) => {
    const base =
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border";
    switch (stage) {
      case "Completed":
        return (
          <span className={`${base} border-green-200 bg-green-50 text-green-600`}>
            Completed
          </span>
        );
      case "Alerted":
        return (
          <span className={`${base} border-blue-200 bg-blue-50 text-blue-600`}>
            Alerted
          </span>
        );
      case "In Progress":
        return (
          <span className={`${base} border-pink-200 bg-pink-50 text-pink-600`}>
            In Progress
          </span>
        );
      default:
        return stage;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-6 pt-6 pb-4">
          {/* Breadcrumb + title + right controls */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs text-gray-400 tracking-wide mb-1">
                VENDOR MANAGEMENT &gt; RENEWALS
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">Renewals</h1>
            </div>

            <div className="flex items-center space-x-3">
              {/* Small calendar button */}
              <button
                type="button"
                className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-pink-50 text-pink-500 border border-pink-100 hover:bg-pink-100"
              >
                {/* calendar icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.6}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V5m8 2V5M4 10h16M6 5h12a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z"
                  />
                </svg>
              </button>

              {/* small grid/list button */}
              <button
                type="button"
                className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-pink-500 text-white border border-pink-500 hover:bg-pink-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h7M4 12h7M4 18h7M13 6h7M13 12h7M13 18h7"
                  />
                </svg>
              </button>

              {/* Export CSV */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.6}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v10m0 0l-3-3m3 3l3-3M5 20h14"
                  />
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* Search + Filters row */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-3">
              <div className="relative w-72">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.6}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M6 10h12M9 14h9M11 18h7"
                  />
                </svg>
                Filters
              </button>
            </div>
            <div /> {/* right side empty to match spacing in screenshot */}
          </div>
        </div>

        {/* Table */}
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto max-h-[calc(100vh-260px)]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-pink-50/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Renewal ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Vendor Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Product(s)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Renewal Deadline
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Days Until Renewal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Renewal Stage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Total Value (USD)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRenewals.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-8 text-center text-sm text-gray-500"
                    >
                      No renewals found
                    </td>
                  </tr>
                )}

                {filteredRenewals.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-pink-50/40 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-pink-600 font-medium">
                      {r.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-pink-600 hover:underline cursor-pointer">
                      {r.vendorName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {r.product}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {r.renewalDeadline}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {r.daysUntilRenewal}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {renderStageBadge(r.renewalStage)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {r.owner}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-semibold text-right">
                      {r.totalValue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 text-xs text-gray-500">
            Showing {filteredRenewals.length} of {mockRenewals.length} renewals
          </div>
        </div>
      </div>
    </div>
  );
};

export default Renewal_vendor;
