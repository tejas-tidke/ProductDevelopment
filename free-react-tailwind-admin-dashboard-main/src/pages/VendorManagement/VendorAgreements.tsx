import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import VendorAgreementDetails from "./VendorAgreementDetails";

export type AgreementStatus =
  | "All Agreements"
  | "Long-Term Contracts"
  | "Subscriptions"
  | "Active"
  | "Expired";

export interface Agreement {
  id: string; // e.g. C-242
  vendor: string;
  owner: string;
  type: string;
  category: string;
  startDate: string;
  totalCost: string;
  status: AgreementStatus;
}

const TABS: AgreementStatus[] = [
  "All Agreements",
  "Long-Term Contracts",
  "Subscriptions",
  "Active",
  "Expired",
];

const initialAgreements: Agreement[] = [
  {
    id: "C-242",
    vendor: "Freshworks, Inc.",
    owner: "Tara Lee Collard",
    type: "Contract",
    category: "Software",
    startDate: "Jul 30, 2025",
    totalCost: "119,000",
    status: "Active",
  },
  {
    id: "C-241",
    vendor: "Tilt",
    owner: "Tara Lee Collard",
    type: "Contract",
    category: "Software",
    startDate: "Aug 28, 2025",
    totalCost: "110,000",
    status: "Active",
  },
  {
    id: "C-240",
    vendor: "Outreach Corporation",
    owner: "Lexis Jenkins",
    type: "Contract",
    category: "Software",
    startDate: "Sep 01, 2025",
    totalCost: "240,000",
    status: "Active",
  },
  {
    id: "C-239",
    vendor: "SFTPGo",
    owner: "Lizhi Yan",
    type: "Contract",
    category: "Software",
    startDate: "Aug 12, 2025",
    totalCost: "25,000",
    status: "Active",
  },
  {
    id: "C-238",
    vendor: "Docker Inc",
    owner: "Umesh Vermaji",
    type: "Contract",
    category: "Software",
    startDate: "Aug 06, 2025",
    totalCost: "50,000",
    status: "Active",
  },
  {
    id: "C-237",
    vendor: "HubSpot, Inc.",
    owner: "Ryan Niehaus",
    type: "Contract",
    category: "Software",
    startDate: "Sep 15, 2025",
    totalCost: "55,000",
    status: "Active",
  },
  // Long-Term Contracts
  {
    id: "C-236",
    vendor: "Microsoft Corporation",
    owner: "Sarah Johnson",
    type: "Contract",
    category: "Software",
    startDate: "Jan 15, 2024",
    totalCost: "500,000",
    status: "Long-Term Contracts",
  },
  {
    id: "C-235",
    vendor: "Oracle America, Inc.",
    owner: "Michael Chen",
    type: "Contract",
    category: "Services",
    startDate: "Mar 22, 2023",
    totalCost: "750,000",
    status: "Long-Term Contracts",
  },
  {
    id: "C-234",
    vendor: "IBM Corporation",
    owner: "James Wilson",
    type: "Contract",
    category: "Hardware",
    startDate: "Nov 10, 2022",
    totalCost: "1,200,000",
    status: "Long-Term Contracts",
  },
  {
    id: "C-233",
    vendor: "Cisco Systems",
    owner: "Patricia Brown",
    type: "Contract",
    category: "Network",
    startDate: "Jun 05, 2023",
    totalCost: "850,000",
    status: "Long-Term Contracts",
  },
  // Subscriptions
  {
    id: "C-101",
    vendor: "Slack Technologies",
    owner: "Emma Wilson",
    type: "Subscription",
    category: "Software",
    startDate: "Apr 05, 2025",
    totalCost: "12,000",
    status: "Subscriptions",
  },
  {
    id: "C-102",
    vendor: "Zoom Video Communications",
    owner: "David Park",
    type: "Subscription",
    category: "Software",
    startDate: "May 18, 2025",
    totalCost: "8,500",
    status: "Subscriptions",
  },
  {
    id: "C-103",
    vendor: "Adobe Creative Cloud",
    owner: "Lisa Anderson",
    type: "Subscription",
    category: "Software",
    startDate: "Jul 22, 2025",
    totalCost: "15,000",
    status: "Subscriptions",
  },
  {
    id: "C-104",
    vendor: "Microsoft 365",
    owner: "Robert Garcia",
    type: "Subscription",
    category: "Software",
    startDate: "Aug 30, 2025",
    totalCost: "9,800",
    status: "Subscriptions",
  },
  // Expired
  {
    id: "C-501",
    vendor: "Adobe Systems Incorporated",
    owner: "Jennifer Lopez",
    type: "Contract",
    category: "Software",
    startDate: "Jun 30, 2023",
    totalCost: "45,000",
    status: "Expired",
  },
  {
    id: "C-502",
    vendor: "Salesforce.com, Inc.",
    owner: "Robert Taylor",
    type: "Subscription",
    category: "Software",
    startDate: "Feb 14, 2024",
    totalCost: "32,000",
    status: "Expired",
  },
  {
    id: "C-503",
    vendor: "Dropbox, Inc.",
    owner: "Maria Hernandez",
    type: "Subscription",
    category: "Software",
    startDate: "Oct 05, 2023",
    totalCost: "7,200",
    status: "Expired",
  },
  {
    id: "C-504",
    vendor: "Amazon Web Services",
    owner: "Thomas Moore",
    type: "Contract",
    category: "Cloud",
    startDate: "Dec 18, 2023",
    totalCost: "120,000",
    status: "Expired",
  },
  // Additional static data
  {
    id: "C-001",
    vendor: "Holograph",
    owner: "John Doe",
    type: "Contract",
    category: "Services",
    startDate: "Jan 01, 2024",
    totalCost: "100,000",
    status: "Long-Term Contracts",
  },
  {
    id: "C-002",
    vendor: "Atlassian",
    owner: "Jane Smith",
    type: "Contract",
    category: "Software",
    startDate: "Feb 01, 2024",
    totalCost: "200,000",
    status: "Long-Term Contracts",
  },
  {
    id: "C-003",
    vendor: "Google",
    owner: "Bob Johnson",
    type: "Subscription",
    category: "Software",
    startDate: "Mar 01, 2025",
    totalCost: "5,000",
    status: "Subscriptions",
  },
  {
    id: "C-004",
    vendor: "Microsoft",
    owner: "Alice Williams",
    type: "Subscription",
    category: "Services",
    startDate: "Apr 01, 2025",
    totalCost: "10,000",
    status: "Subscriptions",
  },
  {
    id: "C-005",
    vendor: "Honda",
    owner: "Charlie Brown",
    type: "Contract",
    category: "Hardware",
    startDate: "May 01, 2023",
    totalCost: "50,000",
    status: "Expired",
  },
  {
    id: "C-006",
    vendor: "TATA Motors",
    owner: "Diana Prince",
    type: "Subscription",
    category: "Software",
    startDate: "Jun 01, 2023",
    totalCost: "25,000",
    status: "Expired",
  },
];

const getStatusBadgeClasses = (status: AgreementStatus): string => {
  switch (status) {
    case "Active":
      return "bg-green-50 text-green-700 border-green-200";
    case "Expired":
      return "bg-red-50 text-red-700 border-red-200";
    case "Subscriptions":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Long-Term Contracts":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const VendorAgreements: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AgreementStatus>("All Agreements");
  const [agreements, setAgreements] =
    useState<Agreement[]>(initialAgreements);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAgreement, setSelectedAgreement] =
    useState<Agreement | null>(null);

  // Filter states
  const [filterMinCost, setFilterMinCost] = useState("");
  const [filterMaxCost, setFilterMaxCost] = useState("");

  const [formVendor, setFormVendor] = useState("");
  const [formOwner, setFormOwner] = useState("");
  const [formType, setFormType] = useState("Contract");
  const [formCategory, setFormCategory] = useState("Software");
  const [formStartDate, setFormStartDate] = useState("");
  const [formTotalCost, setFormTotalCost] = useState("");

  const filteredAgreements = useMemo(() => {
    const term = search.toLowerCase().trim();

    return agreements.filter((agreement) => {
      const matchesTab =
        activeTab === "All Agreements" || agreement.status === activeTab;

      if (!matchesTab) return false;

      // Apply text search
      if (
        term &&
        !`${agreement.id} ${agreement.vendor} ${agreement.owner} ${agreement.type} ${agreement.category}`
          .toLowerCase()
          .includes(term)
      ) {
        return false;
      }

      // Apply cost filters only if they have values
      if (filterMinCost || filterMaxCost) {
        const agreementCost = parseFloat(
          agreement.totalCost.replace(/,/g, "")
        );
        const minCost = filterMinCost ? parseFloat(filterMinCost) : 0;
        const maxCost = filterMaxCost ? parseFloat(filterMaxCost) : Infinity;

        if (agreementCost < minCost || agreementCost > maxCost) {
          return false;
        }
      }

      return true;
    });
  }, [agreements, search, activeTab, filterMinCost, filterMaxCost]);

  // Reset all filters
  const resetFilters = () => {
    setFilterMinCost("");
    setFilterMaxCost("");
    setSearch("");
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAgreements.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAgreements.map((a) => a.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const getNextAgreementId = (): string => {
    if (agreements.length === 0) {
      return "C-001";
    }

    const maxNum = agreements.reduce((max, agr) => {
      const num = parseInt(agr.id.replace(/C-/i, ""), 10);
      if (isNaN(num)) return max;
      return Math.max(max, num);
    }, 0);

    const nextNum = maxNum + 1;
    return `C-${nextNum}`;
  };

  const formatDate = (value: string): string => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const handleAddAgreement = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formVendor || !formOwner || !formStartDate || !formTotalCost) {
      alert("Please fill in all required fields.");
      return;
    }

    const newAgreement: Agreement = {
      id: getNextAgreementId(),
      vendor: formVendor,
      owner: formOwner,
      type: formType,
      category: formCategory,
      startDate: formatDate(formStartDate),
      totalCost: formTotalCost,
      status: "Active",
    };

    setAgreements((prev) => [...prev, newAgreement]);

    // reset form
    setFormVendor("");
    setFormOwner("");
    setFormType("Contract");
    setFormCategory("Software");
    setFormStartDate("");
    setFormTotalCost("");
    setShowAddModal(false);
  };

  const handleExportCsv = () => {
    if (filteredAgreements.length === 0) {
      alert("No data to export.");
      return;
    }

    const header = [
      "Agreement ID",
      "Vendor",
      "Agreement Owner",
      "Agreement Type",
      "Agreement Category",
      "Start Date",
      "Total Cost (USD)",
      "Status",
    ];

    const rows = filteredAgreements.map((a) => [
      a.id,
      a.vendor,
      a.owner,
      a.type,
      a.category,
      a.startDate,
      a.totalCost,
      a.status,
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map((c) => `"${c}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "agreements.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      {/* If a vendor is selected, show detail page */}
      {selectedAgreement ? (
        <VendorAgreementDetails
          agreement={selectedAgreement}
          onBack={() => setSelectedAgreement(null)}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-300">
              <h1 className="text-2xl font-semibold text-gray-900">
                Agreements
              </h1>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-semibold text-white rounded-md bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                + Add Agreement
              </button>
            </div>

            <div className="flex items-center gap-3" />
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-8">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap pb-2 text-sm font-medium border-b-2 ${
                    activeTab === tab
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search…"
                  className="pl-9 pr-3 py-2 text-sm border rounded-md w-64 border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-400 text-sm">
                  🔎
                </span>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium border rounded-md bg-white hover:bg-gray-50 border-gray-300 ${
                    filterMinCost || filterMaxCost
                      ? "text-indigo-600 border-indigo-600"
                      : ""
                  }`}
                >
                  Filters
                  {(filterMinCost || filterMaxCost) && (
                    <>
                      <span className="ml-2 w-2 h-2 bg-indigo-600 rounded-full" />
                      <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
                        {[filterMinCost, filterMaxCost].filter(Boolean).length}
                      </span>
                    </>
                  )}
                </button>

                {/* Simple filters panel */}
                {showFilters && (
                  <div className="absolute left-0 mt-2 p-3 border rounded-md bg-white text-sm w-72 z-10 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        Filters
                      </h3>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={resetFilters}
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => setShowFilters(false)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-gray-600">
                          Min Cost ($)
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full border rounded px-2 py-1 text-xs border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          value={filterMinCost}
                          onChange={(e) => setFilterMinCost(e.target.value)}
                        />
                      </div>

                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-gray-600">
                          Max Cost ($)
                        </label>
                        <input
                          type="number"
                          placeholder="1000000"
                          className="w-full border rounded px-2 py-1 text-xs border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          value={filterMaxCost}
                          onChange={(e) => setFilterMaxCost(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center px-3 py-2 text-sm font-medium border rounded-md bg-white hover:bg-gray-50 border-gray-300"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden border border-gray-200 rounded-lg bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredAgreements.length > 0 &&
                          selectedIds.length === filteredAgreements.length
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Agreement ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Vendor
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Agreement Owner
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Agreement Type
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Agreement Category
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Start Date
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">
                      Total Cost (USD)
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAgreements.map((agreement) => (
                    <tr
                      key={agreement.id}
                      className="hover:bg-indigo-50/40 transition-colors"
                    >
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(agreement.id)}
                          onChange={() => toggleSelectOne(agreement.id)}
                        />
                      </td>
                      <td className="px-4 py-2 text-indigo-600 font-medium">
                        {agreement.id}
                      </td>
                      <td
                        className="px-4 py-2 text-indigo-600 cursor-pointer hover:underline"
                        onClick={() => setSelectedAgreement(agreement)}
                      >
                        {agreement.vendor}
                      </td>
                      <td className="px-4 py-2 text-gray-900">
                        {agreement.owner}
                      </td>
                      <td className="px-4 py-2 text-gray-900">
                        {agreement.type}
                      </td>
                      <td className="px-4 py-2 text-gray-900">
                        {agreement.category}
                      </td>
                      <td className="px-4 py-2 text-gray-900">
                        {agreement.startDate}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-900 tabular-nums">
                        {agreement.totalCost}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${getStatusBadgeClasses(
                            agreement.status
                          )}`}
                        >
                          {agreement.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {filteredAgreements.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-6 text-center text-gray-500"
                      >
                        No agreements found for this view.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Agreement Modal (skeleton, keep your existing form inside) */}
          {showAddModal &&
            createPortal(
              <div className="fixed inset-0 z-[9999] overflow-y-auto">
                {/* Frosted / blurred backdrop */}
                <div
                  className="fixed inset-0"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(232,236,243,0.55), rgba(220,224,233,0.55))",
                    backdropFilter: "blur(30px) saturate(110%)",
                    WebkitBackdropFilter: "blur(30px) saturate(110%)",
                  }}
                />

                <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                  <span
                    className="hidden sm:inline-block sm:align-middle sm:h-screen"
                    aria-hidden
                  >
                    {"\u200B"}
                  </span>

                  <div
                    className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full dark:bg-gray-800 z-[10000] relative"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="add-agreement-title"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Add Agreement Form */}
                    <div className="px-6 py-6 sm:px-8 sm:py-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3
                          id="add-agreement-title"
                          className="text-lg font-semibold text-gray-900"
                        >
                          Add New Agreement
                        </h3>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-500"
                          onClick={() => setShowAddModal(false)}
                        >
                          <span className="sr-only">Close</span>
                          <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>

                      <form onSubmit={handleAddAgreement} className="space-y-5">
                        <div>
                          <label
                            htmlFor="vendor"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Vendor *
                          </label>
                          <input
                            type="text"
                            id="vendor"
                            value={formVendor}
                            onChange={(e) => setFormVendor(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="owner"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Agreement Owner *
                          </label>
                          <input
                            type="text"
                            id="owner"
                            value={formOwner}
                            onChange={(e) => setFormOwner(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="type"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Agreement Type
                            </label>
                            <select
                              id="type"
                              value={formType}
                              onChange={(e) => setFormType(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="Contract">Contract</option>
                              <option value="Subscription">Subscription</option>
                            </select>
                          </div>

                          <div>
                            <label
                              htmlFor="category"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Category
                            </label>
                            <select
                              id="category"
                              value={formCategory}
                              onChange={(e) => setFormCategory(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="Software">Software</option>
                              <option value="Services">Services</option>
                              <option value="Hardware">Hardware</option>
                              <option value="Cloud">Cloud</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="startDate"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Start Date *
                          </label>
                          <input
                            type="date"
                            id="startDate"
                            value={formStartDate}
                            onChange={(e) => setFormStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="totalCost"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Total Cost (USD) *
                          </label>
                          <input
                            type="number"
                            id="totalCost"
                            value={formTotalCost}
                            onChange={(e) => setFormTotalCost(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Add Agreement
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )}
        </>
      )}
    </div>
  );
};

export default VendorAgreements;
