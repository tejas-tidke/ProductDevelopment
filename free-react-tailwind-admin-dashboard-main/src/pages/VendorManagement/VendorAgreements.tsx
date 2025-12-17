import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
// Import useAuth hook to access user details
import { useAuth } from "../../context/AuthContext";

// Define the contract details type based on the backend DTO (same as in procurement-renewal.tsx)
type ContractDetails = {
  id: number;
  contractType: string | null;
  renewalStatus: string | null;
  jiraIssueKey: string | null;
  nameOfVendor: string;
  productName: string;
  requesterName: string;
  requesterEmail: string;
  requesterDepartment: string;
  requesterOrganization: string;
  vendorContractType: string;
  additionalComment: string;
  currentLicenseCount: number | null;
  currentUsageCount: number | null;
  currentUnits: string | null;
  newLicenseCount: number | null;
  newUsageCount: number | null;
  newUnits: string | null;
  dueDate: string | null;
  renewalDate: string | null;
  licenseUpdateType: string | null;
  existingContractId: string | null;
  billingType: string | null;
  contractDuration: string | null;
  totalOptimizedCost?: number | null;

};

// Map contract details to agreement format for the table
export type AgreementFromContract = {
  id: string; // e.g. C-242
  vendor: string;
  owner: string;
  type: string;
  category: string;
  startDate: string;
  endDate: string; // Add endDate property
  totalCost: string;
  status: AgreementStatus;
  // Additional fields from procurement renewal
  productId: number;
  contractType: string | null;
  renewalStatus: string | null;
  jiraIssueKey: string | null;
  productName: string;
  requesterEmail: string;
  requesterDepartment: string;
  requesterOrganization: string;
  billingType: string | null;
  currentLicenseCount: number | null;
  newLicenseCount: number | null;
  currentUsageCount: number | null;
  newUsageCount: number | null;
  currentUnits: string | null;
  newUnits: string | null;
  dueDate: string | null;
  renewalDate: string | null;
  licenseUpdateType: string | null;
  existingContractId: string | null;
  contractDuration: string | null;
  additionalComment: string | null;
};

export type AgreementStatus =
  | "All Agreements"
  | "Long-Term Contracts"
  | "Subscriptions"
  | "Active"
  | "Expired";

const TABS: AgreementStatus[] = [
  "All Agreements",
  "Long-Term Contracts",
  "Subscriptions",
  "Active",
  "Expired",
];

// Helper function to format dates in dd-mm-yyyy format
const formatDateHelper = (value: string): string => {
  if (!value) return "N/A";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "N/A";
  // Format as dd-mm-yyyy (e.g., 16-12-2025)
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Function to map contract details to agreement format
const mapContractToAgreement = (contract: ContractDetails, index: number): AgreementFromContract => {
  // Determine agreement type based on contract data
  let type = "Contract";
  if (contract.vendorContractType && contract.vendorContractType.toLowerCase().includes("subscription")) {
    type = "Subscription";
  } else if (contract.contractDuration && parseInt(contract.contractDuration) >= 12) {
    type = "Long-Term Contract";
  }

  // Determine category based on product/service type
  let category = "Software";
  if (contract.productName.toLowerCase().includes("hardware") || contract.productName.toLowerCase().includes("equipment")) {
    category = "Hardware";
  } else if (contract.productName.toLowerCase().includes("service") || contract.productName.toLowerCase().includes("consult")) {
    category = "Services";
  } else if (contract.productName.toLowerCase().includes("cloud") || contract.productName.toLowerCase().includes("hosting")) {
    category = "Cloud";
  }

  // Generate a pseudo cost based on license/usage counts
  // let totalCost = "0";
  // if (contract.currentLicenseCount) {
  //   totalCost = (contract.currentLicenseCount * 1000).toString();
  // } else if (contract.currentUsageCount) {
  //   totalCost = (contract.currentUsageCount * 50).toString();
  // }
  // ✅ Use DB value (totalOptimizedCost) FIRST
let totalCost =
  contract.totalOptimizedCost !== null &&
  contract.totalOptimizedCost !== undefined
    ? contract.totalOptimizedCost.toString()
    : "0";

// fallback only if DB value not present
if (totalCost === "0") {
  if (contract.currentLicenseCount) {
    totalCost = (contract.currentLicenseCount * 1000).toString();
  } else if (contract.currentUsageCount) {
    totalCost = (contract.currentUsageCount * 50).toString();
  }
}


  // Determine status based on contract duration and dates
  let status: AgreementStatus = "Active";
  
  // Parse contract duration (assuming it's in months)
  const contractDurationValue = contract.contractDuration ? contract.contractDuration.toString().trim() : "";
  const contractDurationMonths = contractDurationValue && 
                               !contractDurationValue.toLowerCase().includes("n/a") && 
                               !isNaN(parseInt(contractDurationValue)) ? 
                               parseInt(contractDurationValue) : 0;
  
  // Calculate end date based on start date and duration
  let endDateValue = "N/A";
  
  if (contract.renewalDate) {
    const startDate = new Date(contract.renewalDate);
    // Parse contract duration (assuming it's in months)
    const contractDurationValue = contract.contractDuration ? contract.contractDuration.toString().trim() : "";
    const contractDurationMonths = contractDurationValue && 
                                 !contractDurationValue.toLowerCase().includes("n/a") && 
                                 !isNaN(parseInt(contractDurationValue)) ? 
                                 parseInt(contractDurationValue) : 0;
                                  
    if (contractDurationMonths > 0) {
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + contractDurationMonths);
      endDateValue = endDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    } else {
      endDateValue = contract.renewalDate;
    }
  }
  
  // Determine the appropriate status based on exact requirements:
  // Long-term: Contracts with duration of 12 months or more
  // Subscription: Contracts with 1-month duration specifically
  // Active: Contracts with 90 days remaining until end date
  // Expired: Contracts whose end dates have passed
  
  if (endDateValue !== "N/A") {
    const endDate = new Date(endDateValue);
    const today = new Date();
    const timeDiff = endDate.getTime() - today.getTime();
    const daysUntilExpiration = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // If already expired (end date has passed)
    if (daysUntilExpiration < 0) {
      status = "Expired";
    }
    // If within 90 days of expiration, show in Active (regardless of duration)
    else if (daysUntilExpiration <= 90) {
      status = "Active";
    }
    // If not within 90 days, classify based on duration
    else {
      if (contractDurationMonths >= 12) {
        // Long-term contracts (12 months or more)
        status = "Long-Term Contracts";
      } else if (contractDurationMonths === 1) {
        // Subscription contracts (exactly 1 month duration)
        status = "Subscriptions";
      } else {
        // All other contracts default to Active
        status = "Active";
      }
    }
  } else {
    // If no end date, classify based on duration only
    if (contractDurationMonths >= 12) {
      status = "Long-Term Contracts";
    } else if (contractDurationMonths === 1) {
      status = "Subscriptions";
    } else {
      status = "Active";
    }
  }

  return {
    id: `C-${index + 1}`, // Use index-based numbering to match procurement renewal
    vendor: contract.nameOfVendor,
    owner: contract.requesterName,
    type: type,
    category: category,
    startDate: contract.renewalDate || contract.dueDate || "N/A",
    endDate: endDateValue, // Store raw value for consistent formatting
    totalCost: totalCost,
    status: status,
    // Additional fields from procurement renewal
    productId: contract.id,
    contractType: contract.contractType,
    renewalStatus: contract.renewalStatus,
    jiraIssueKey: contract.jiraIssueKey,
    productName: contract.productName,
    requesterEmail: contract.requesterEmail,
    requesterDepartment: contract.requesterDepartment,
    requesterOrganization: contract.requesterOrganization,
    billingType: contract.billingType,
    currentLicenseCount: contract.currentLicenseCount,
    newLicenseCount: contract.newLicenseCount,
    currentUsageCount: contract.currentUsageCount,
    newUsageCount: contract.newUsageCount,
    currentUnits: contract.currentUnits,
    newUnits: contract.newUnits,
    dueDate: contract.dueDate,
    renewalDate: contract.renewalDate,
    licenseUpdateType: contract.licenseUpdateType,
    existingContractId: contract.existingContractId,
    contractDuration: contract.contractDuration,
    additionalComment: contract.additionalComment,
  };
};

const VendorAgreements: React.FC = () => {
  const { userData, userDepartmentId, userOrganizationId } = useAuth(); // Get user details from AuthContext
  const [activeTab, setActiveTab] = useState<AgreementStatus>("All Agreements");
  const [agreements, setAgreements] = useState<AgreementFromContract[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter states
  const [filterMinCost, setFilterMinCost] = useState("");
  const [filterMaxCost, setFilterMaxCost] = useState("");
  const [filterCategory, setFilterCategory] = useState(""); // Add this line for category filter

  const [formVendor, setFormVendor] = useState("");
  const [formOwner, setFormOwner] = useState("");
  const [formType, setFormType] = useState("Contract");
  const [formCategory, setFormCategory] = useState("Software");
  const [formStartDate, setFormStartDate] = useState("");
  const [formTotalCost, setFormTotalCost] = useState("");

  // Fetch contract details from backend (same as in procurement-renewal.tsx)
  useEffect(() => {
    const fetchContractDetails = async () => {
      try {
        setLoading(true);
        console.log("Fetching contract details from backend...");
        const response = await fetch("http://localhost:8080/api/jira/contracts/completed");
        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response body:", errorText);
          throw new Error(`Failed to fetch contracts: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const contracts: ContractDetails[] = await response.json();
        console.log("Received contracts:", contracts);
        
        // Map contracts to agreements using index-based numbering
        const mappedAgreements = contracts.map((contract, index) => 
          mapContractToAgreement(contract, index)
        );
        console.log("Mapped agreements:", mappedAgreements);
        
        setAgreements(mappedAgreements);
        setError(null);
      } catch (err) {
        console.error("Error fetching contract details:", err);
        setError("Failed to load contract details. Please try again later.");
        setAgreements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContractDetails();
  }, []);

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

      // Apply category filter
      if (filterCategory && agreement.category !== filterCategory) {
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
  }, [agreements, search, activeTab, filterMinCost, filterMaxCost, filterCategory]);
  // Reset all filters
  const resetFilters = () => {
    setFilterMinCost("");
    setFilterMaxCost("");
    setFilterCategory(""); // Add this line to reset category filter
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

  const handleAddAgreement = async (e: React.FormEvent) => {

  
  e.preventDefault();

  if (!formVendor || !formOwner || !formStartDate || !formTotalCost) {
    alert("Please fill in all required fields.");
    return;
  }

  // Determine status based on form data
  // let status: AgreementStatus = "Active"; // Comment out to fix linter error
  // For manually added agreements, we'll determine duration based on category selection
  let contractDurationMonths = 0;
  if (formCategory === "Long-Term Contracts") {
    contractDurationMonths = 12; // Minimum for long-term
  } else if (formCategory === "Subscriptions") {
    contractDurationMonths = 1; // Exactly 1 month for subscriptions
  }
  
  // Calculate end date based on start date and duration
  let endDate: Date | null = null;
  const startDate = new Date(formStartDate);
  
  if (contractDurationMonths > 0) {
    endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + contractDurationMonths);
  }
  
  // Determine the appropriate status based on exact requirements:
  // Long-term: Contracts with duration of 12 months or more
  // Subscription: Contracts with 1-month duration specifically
  // Active: Contracts with 90 days remaining until end date
  // Expired: Contracts whose end dates have passed
  
  // if (endDate) {
  //   const today = new Date();
  //   const timeDiff = endDate.getTime() - today.getTime();
  //   const daysUntilExpiration = Math.ceil(timeDiff / (1000 * 3600 * 24));
  //   
  //   // If already expired (end date has passed)
  //   if (daysUntilExpiration < 0) {
  //     status = "Expired";
  //   }
  //   // If within 90 days of expiration, show in Active (regardless of duration)
  //   else if (daysUntilExpiration <= 90) {
  //     status = "Active";
  //   }
  //   // If not within 90 days, classify based on duration
  //   else {
  //     if (contractDurationMonths >= 12) {
  //       // Long-term contracts (12 months or more)
  //       status = "Long-Term Contracts";
  //     } else if (contractDurationMonths === 1) {
  //       // Subscription contracts (exactly 1 month duration)
  //       status = "Subscriptions";
  //     } else {
  //       // All other contracts default to Active
  //       status = "Active";
  //     }
  //   }
  // } else {
  //   // If no end date, classify based on duration only
  //   if (contractDurationMonths >= 12) {
  //     status = "Long-Term Contracts";
  //   } else if (contractDurationMonths === 1) {
  //     status = "Subscriptions";
  //   } else {
  //     status = "Active";
  //   }
  // }

  // Prepare contract data with user details
  const contractData = {
    nameOfVendor: formVendor,
    productName: "",
    requesterName: formOwner,
    vendorContractType: formType,
    contractDuration: formCategory === "Long-Term Contracts" ? "12" : "1",
    renewalDate: formStartDate,
    renewalStatus: "completed",
    totalOptimizedCost: Number(formTotalCost),

    // Add user details from AuthContext
    requesterMail: userData?.user?.email || "",
    requesterDepartment: userData?.user?.department?.name || "",
    requesterOrganization: userData?.user?.organization?.name || "",
    requesterDepartmentId: userDepartmentId || null,
    requesterOrganizationId: userOrganizationId || null
  };

  // Send to backend
  await fetch("http://localhost:8080/api/jira/contracts/manual", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contractData),
  });

  const response = await fetch(
    "http://localhost:8080/api/jira/contracts/completed"
  );
  const contracts: ContractDetails[] = await response.json();

  setAgreements(
    contracts.map((contract, index) =>
      mapContractToAgreement(contract, index)
    )
  );


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
      "End Date",
      "Total Cost (USD)",
      "Status",
    ];

    const rows = filteredAgreements.map((a) => [
      a.id,
      a.vendor,
      a.owner,
      a.type,
      a.category,
      formatDateHelper(a.startDate),
      formatDateHelper(a.endDate),
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

  return (
    <div className="p-6">
      {/* Remove the conditional rendering for the detail page since we're removing the modal */}
      <>          {/* Header */}
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

                    <div className="flex gap-3 mb-3">
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

                    {/* Category Filter */}
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600">
                        Agreement Category
                      </label>
                      <select
                        className="w-full border rounded px-2 py-1 text-xs border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                      >
                        <option value="">All Categories</option>
                        <option value="Software">Software</option>
                        <option value="Hardware">Hardware</option>
                        <option value="Services">Services</option>
                        <option value="Cloud">Cloud</option>
                      </select>
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

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          {/* Table */}
   <div className="border border-gray-200 rounded-lg bg-white shadow-sm h-[65vh] overflow-y-auto">

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
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      End Date
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
                      <td className="px-4 py-2 text-gray-900">
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
                        {formatDateHelper(agreement.startDate)}
                      </td>
                      <td className="px-4 py-2 text-gray-900">
                        {formatDateHelper(agreement.endDate)}
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

                  {filteredAgreements.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={10}
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
                                <option value="Long-Term Contract">Long-Term Contract</option>
                              <option value="Subscriptions">Subscriptions</option>
                              
                            
                          
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
    </div>  );
};

export default VendorAgreements;