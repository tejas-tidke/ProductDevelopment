import React, { useState, useEffect } from "react";
import PrimaryButton from "../components/ui/button/PrimaryButton";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";

  // Define the contract details type based on the backend DTO
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
  };

  // Map contract details to row format for the table
  type Row = {
  id: string;

  contractType: string | null;
  renewalStatus: string | null;
  jiraIssueKey: string | null;

  vendorName: string;
  productName: string;

  requesterName: string;
  requesterEmail: string;
  requesterDepartment: string;
  requesterOrganization: string;

  billingType: string | null;
  vendorContractType: string | null;
  additionalComment: string | null;

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

  usageLicense: number; // used for upgrade/downgrade logic
};


  // Function to map contract details to row format
  const mapContractToRow = (contract: ContractDetails): Row => {
  const usageLicense =
    contract.newLicenseCount ??
    contract.currentLicenseCount ??
    contract.newUsageCount ??
    contract.currentUsageCount ??
    0;

  return {
    id: `C${contract.id}`,

    contractType: contract.contractType,
    renewalStatus: contract.renewalStatus,
    jiraIssueKey: contract.jiraIssueKey,

    vendorName: contract.nameOfVendor,
    productName: contract.productName,

    requesterName: contract.requesterName,
    requesterEmail: contract.requesterEmail,
    requesterDepartment: contract.requesterDepartment,
    requesterOrganization: contract.requesterOrganization,

    billingType: contract.billingType,
    vendorContractType: contract.vendorContractType,
    additionalComment: contract.additionalComment,

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

    usageLicense: usageLicense,
  };
};

function normalizeVendorType(type: string | null): "usage" | "license" | "" {
  if (!type) return "";

  const t = type.toLowerCase();

  // usage-based keywords
  if (
    t.includes("usage") ||
    t.includes("consumption") ||
    t.includes("credits") ||
    t.includes("minute") ||
    t.includes("volume") ||
    t.includes("pay as you go") ||
    t.includes("usage based")
  ) {
    return "usage";
  }

  // license-based keywords
  if (
    t.includes("license") ||
    t.includes("user") ||
    t.includes("agent") ||
    t.includes("seat") ||
    t.includes("per user") ||
    t.includes("per agent") ||
    t.includes("license based")
  ) {
    return "license";
  }

  return "";
}


  // Function to calculate renewal date based on completion date + contract duration
  const calculateRenewalDate = (row: Row): string => {
    // If the row has a renewalDate already set, return it
    if (row.renewalDate) {
      return row.renewalDate;
    }
    
    // If contract is completed and has contract duration, calculate renewal date
    if (row.renewalStatus === "completed" && row.contractDuration) {
      // For this table view, we don't have access to the exact completion date
      // In a real implementation, we would need to get this from the backend
      // For now, we'll just indicate that it should be calculated
      return "Calculated on completion";
    }
    
    return "N/A";
  };


  export default function ProcurementRenewal() {
    const [rows, setRows] = useState<Row[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [rowActionType, setRowActionType] = useState<Record<string, "upgrade" | "downgrade" | "flat" | null>>({});
    const [formValues, setFormValues] = useState({ 
      vendorName: "", 
      productName: "", 
      dueDate: "", 
      renewalDate: "", 
      usageLicense: 0, 
      renewalUsageLicense: 0,
      requesterName: "",
      requesterEmail: "",
      requesterDepartment: "",
      requesterOrganization: "",
      currentLicenseCount: 0,
      currentUsageCount: 0,
      currentUnits: "",
      billingType: "",
      vendorContractType: "",
      additionalComment: "",
      // New fields for dynamic form
      newLicenseCount: 0,
      newUsageCount: 0,
      newUnits: "",
      newUnitsOther: "",
      contractDuration: "",
      attachments: [] as File[]
    });
    const selectedRow = rows.find((r) => r.id === expandedRowId) || null;
    const [showGlobalPanel, setShowGlobalPanel] = useState<boolean>(false);

    // Fetch contract details from backend
    useEffect(() => {
      const fetchContractDetails = async () => {
        try {
          setLoading(true);
          console.log("Fetching contract details from backend...");
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/jira/contracts/completed`);
          console.log("Response status:", response.status);
          console.log("Response headers:", response.headers);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response body:", errorText);
            throw new Error(`Failed to fetch contracts: ${response.status} ${response.statusText} - ${errorText}`);
          }
          
          const contracts: ContractDetails[] = await response.json();
          console.log("Received contracts:", contracts);
          
          // Check if any contracts have renewal dates
          contracts.forEach((contract, index) => {
            console.log(`Contract ${index}:`, {
              id: contract.id,
              vendor: contract.nameOfVendor,
              product: contract.productName,
              renewalDate: contract.renewalDate,
              contractDuration: contract.contractDuration
            });
          });
          
          // Map contracts to rows
          const mappedRows = contracts.map((contract) => 
            mapContractToRow(contract)
          );
          console.log("Mapped rows:", mappedRows);
          
          // Check if any rows have renewal dates
          mappedRows.forEach((row, index) => {
            console.log(`Row ${index}:`, {
              id: row.id,
              vendor: row.vendorName,
              product: row.productName,
              renewalDate: row.renewalDate,
              contractDuration: row.contractDuration
            });
          });
          
          setRows(mappedRows);
          setError(null);
        } catch (err) {
          console.error("Error fetching contract details:", err);
          setError("Failed to load contract details. Please try again later.");
          setRows([]);
        } finally {
          setLoading(false);
        }
      };

      fetchContractDetails();
    }, []);

    useEffect(() => {
      // whenever selectedRow or action changes, reset errors
      setError(null);
    }, [expandedRowId]);

    function selectRow(id: string) {
      setExpandedRowId((prev) => (prev === id ? null : id));
    }

    function openActionForRow(row: Row, action: "upgrade" | "downgrade" | "flat") {
      setExpandedRowId(row.id);
      setRowActionType((prev) => ({ ...prev, [row.id]: action }));
      setShowGlobalPanel(true);

      // Set form values based on the selected row
      const initialValues = {
        vendorName: row.vendorName,
        productName: row.productName,
        dueDate: row.dueDate || "",
        renewalDate: row.renewalDate || "",
        usageLicense: row.usageLicense,
        renewalUsageLicense: row.usageLicense,
        requesterName: row.requesterName,
        requesterEmail: row.requesterEmail,
        requesterDepartment: row.requesterDepartment,
        requesterOrganization: row.requesterOrganization,
        currentLicenseCount: row.currentLicenseCount || 0,
        currentUsageCount: row.currentUsageCount || 0,
        currentUnits: row.currentUnits || "",
        billingType: row.billingType || row.vendorContractType || "",
        vendorContractType: normalizeVendorType(row.billingType || row.vendorContractType),
        additionalComment: row.additionalComment || "",
        // Initialize new fields
        newLicenseCount: action === "flat" ? (row.currentLicenseCount || 0) : (row.newLicenseCount || row.currentLicenseCount || 0),
        newUsageCount: action === "flat" ? (row.currentUsageCount || 0) : (row.newUsageCount || row.currentUsageCount || 0),
        newUnits: row.newUnits || row.currentUnits || "",
        newUnitsOther: "",
        contractDuration: "",
        attachments: [] as File[]
      };

      setFormValues(initialValues);
    }

    function closeForm(rowId?: string) {
      if (rowId) {
        setRowActionType((prev) => ({ ...prev, [rowId]: null }));
        if (expandedRowId === rowId) setExpandedRowId(null);
      } else {
        setRowActionType({});
        setExpandedRowId(null);
      }
      setShowGlobalPanel(false);
      setError(null);
    }

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      // final validation check
      if (!selectedRow) return;
      const actionType = rowActionType[selectedRow.id];
      if (!actionType) return;
      
      // Validation for upgrade/downgrade
      if (actionType === "upgrade") {
        if (formValues.vendorContractType === 'usage' && formValues.newUsageCount <= formValues.currentUsageCount) {
          setError(`Upgrade usage count must be greater than current (${formValues.currentUsageCount}).`);
          return;
        }
        if (formValues.vendorContractType === 'license' && formValues.newLicenseCount <= formValues.currentLicenseCount) {
          setError(`Upgrade license count must be greater than current (${formValues.currentLicenseCount}).`);
          return;
        }
      }
      
      if (actionType === "downgrade") {
        if (formValues.vendorContractType === 'usage' && (formValues.newUsageCount >= formValues.currentUsageCount || formValues.newUsageCount < 0)) {
          setError(`Downgrade usage count must be less than current (${formValues.currentUsageCount}) and not negative.`);
          return;
        }
        if (formValues.vendorContractType === 'license' && (formValues.newLicenseCount >= formValues.currentLicenseCount || formValues.newLicenseCount < 0)) {
          setError(`Downgrade license count must be less than current (${formValues.currentLicenseCount}) and not negative.`);
          return;
        }
      }

      // Create new request
      const createRequest = async () => {
        try {
          const vendorDetails: any = {
    vendorName: formValues.vendorName,
    productName: formValues.productName,
    vendorContractType: formValues.vendorContractType,
    currentUsageCount: formValues.currentUsageCount || undefined,
    currentUnits:
      formValues.currentUnits === "others"
        ? formValues.newUnitsOther || undefined
        : formValues.currentUnits || undefined,
    currentLicenseCount: formValues.currentLicenseCount || undefined,
    currentLicenseUnit:
      formValues.currentUnits === "agents" ||
      formValues.currentUnits === "users"
        ? formValues.currentUnits
        : undefined,

    newUsageCount:
      actionType === "flat"
        ? formValues.currentUsageCount
        : formValues.newUsageCount || undefined,

    newUnits:
      actionType === "flat"
        ? formValues.currentUnits
        : formValues.newUnits === "others"
        ? formValues.newUnitsOther || undefined
        : formValues.newUnits || undefined,

    newLicenseCount:
      actionType === "flat"
        ? formValues.currentLicenseCount
        : formValues.newLicenseCount || undefined,

    newLicenseUnit:
      formValues.newUnits === "agents" || formValues.newUnits === "users"
        ? formValues.newUnits
        : undefined,

    dueDate: formValues.dueDate,
    renewalDate: formValues.renewalDate || undefined,

    requesterName: formValues.requesterName,
    requesterMail: formValues.requesterEmail,
    department: formValues.requesterDepartment,
    organization: formValues.requesterOrganization,

    contractMode: "existing",
    selectedExistingContractId: selectedRow.id.replace("C", ""),
    renewalType: actionType,

    contractDuration: formValues.contractDuration || undefined,
    additionalComment: formValues.additionalComment || undefined,

    attachments: formValues.attachments,
};
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/jira/issues/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ vendorDetails }),

          });

          if (!response.ok) {
            throw new Error(`Failed to create request: ${response.status} ${response.statusText}`);
          }

          const result = await response.json();
          console.log("Request created successfully", result);
          alert(`Request created successfully for ${formValues.vendorName} - ${formValues.productName}`);
          closeForm(selectedRow.id);
        } catch (err) {
          console.error("Error creating request:", err);
          setError("Failed to create request. Please try again.");
        }
      };

      createRequest();
    }

    return (
      <div className="p-8 max-w-8xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-6">Procurement — Renewals</h1>

        <div className="border border-gray-200 rounded-lg bg-white shadow-sm" style={{ height: '65vh' }}>
          <div className="overflow-y-auto" style={{ height: '100%' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  {/* For Adding the Radio Button In the Procurement Renewal form */}
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 w-10">&nbsp;</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">ID</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Requester Name</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Requester Email</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Department</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Organization</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Vendor</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Product</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Contract Type</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Renewal Status</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Jira Issue</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Billing Type</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Current License Count</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">New License Count</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Current Usage Count</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">New Usage Count</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Current Units</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">New Units</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Due Date</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Renewal Date</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Contract Duration</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">License Update Type</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Existing Contract ID</TableCell>
                  <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Additional Comment</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.length > 0 ? (
                  rows.map((r, idx) => (
                    <React.Fragment key={r.id}>
                      <TableRow
  onClick={() => selectRow(r.id)}
  className={`cursor-pointer hover:bg-indigo-50/40 transition-colors ${expandedRowId === r.id ? "bg-indigo-50" : idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
>
   {/* Radio Button Function on Renewal button */}
  <TableCell isHeader={false} className="px-4 py-2">
    <input
      type="radio"
      name="renewalRowSelect"
      checked={expandedRowId === r.id}
      onChange={(e) => { e.stopPropagation(); selectRow(r.id); }}
      onClick={(e) => e.stopPropagation()}
      aria-label={`Select ${r.vendorName} — ${r.productName}`}
    />
  </TableCell>
  <TableCell isHeader={false} className="px-4 py-2 text-gray-900 font-medium">{idx + 1}</TableCell>

  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.requesterName}</TableCell>
  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.requesterEmail}</TableCell>
  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.requesterDepartment}</TableCell>
  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.requesterOrganization}</TableCell>

  <TableCell isHeader={false} className="px-4 py-2 text-gray-900 font-medium text-indigo-600">{r.vendorName}</TableCell>
  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.productName}</TableCell>

  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.contractType}</TableCell>
  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.renewalStatus}</TableCell>

  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.jiraIssueKey}</TableCell>
  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.billingType}</TableCell>

  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.currentLicenseCount ?? "N/A"}</TableCell>
  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.newLicenseCount ?? "N/A"}</TableCell>

  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.currentUsageCount ?? "N/A"}</TableCell>
  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.newUsageCount ?? "N/A"}</TableCell>

  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.currentUnits ?? "N/A"}</TableCell>
  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.newUnits ?? "N/A"}</TableCell>

  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.dueDate ?? "N/A"}</TableCell>
  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.renewalDate ?? "N/A"}</TableCell>
  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.contractDuration ?? "N/A"}</TableCell>

  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.licenseUpdateType ?? "N/A"}</TableCell>
  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.existingContractId ?? "N/A"}</TableCell>

  <TableCell isHeader={false} className="px-4 py-2 text-gray-900">{r.additionalComment ?? "N/A"}</TableCell>
</TableRow>
 </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <td colSpan={24} className="px-4 py-6 text-center text-gray-500">
                      {loading ? "Loading..." : "No completed contracts found"}
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

          {/* Global options panel below the list */}
          {false && selectedRow && (
            <div className="border-t bg-white/60 backdrop-blur-sm">
              <div className="max-w-8xl mx-auto p-5">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 rounded-full bg-indigo-100 text-indigo-700 w-10 h-10 flex items-center justify-center font-bold">
                    {selectedRow?.vendorName?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-xs text-gray-500">Selected</div>
                        <div className="text-base font-semibold text-gray-900">
                          {selectedRow?.vendorName} — {selectedRow?.productName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
  onClick={(e) => {
    e.stopPropagation();
    if (selectedRow) openActionForRow(selectedRow, "upgrade");
  }} className={`px-3 py-2 rounded-md text-xs font-semibold ${selectedRow && rowActionType[selectedRow!.id] === "upgrade" ? "bg-green-600 text-white" : "bg-green-50 text-green-700 border border-green-200"}`}>Upgrade</button>
                        <button
  onClick={(e) => {
    e.stopPropagation();
    if (selectedRow) openActionForRow(selectedRow, "downgrade");
  }} className={`px-3 py-2 rounded-md text-xs font-semibold ${selectedRow && rowActionType[selectedRow!.id] === "downgrade" ? "bg-yellow-400 text-black" : "bg-yellow-50 text-yellow-800 border border-yellow-200"}`}>Downgrade</button>
                        <button
  onClick={(e) => {
    e.stopPropagation();
    if (selectedRow) openActionForRow(selectedRow, "flat");
  }} className={`px-3 py-2 rounded-md text-xs font-semibold ${selectedRow && rowActionType[selectedRow!.id] === "flat" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>Flat Renewal</button>
                        <button onClick={() => { if (selectedRow) closeForm(selectedRow.id); }} className="ml-2 px-3 py-2 rounded-md text-xs border">Close</button>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="flex flex-col">
                          <span className="text-xs text-gray-500">Vendor</span>
                          <input 
                            name="vendorName" 
                            value={formValues.vendorName} 
                            className="mt-1 p-3 border rounded-lg bg-gray-50" 
                            readOnly
                            aria-label="Vendor Name"
                          />
                        </label>

                        <label className="flex flex-col">
                          <span className="text-xs text-gray-500">Product</span>
                          <input 
                            name="productName" 
                            value={formValues.productName} 
                            className="mt-1 p-3 border rounded-lg bg-gray-50" 
                            readOnly
                            aria-label="Product Name"
                          />
                        </label>

                        <label className="flex flex-col">
                          <span className="text-xs text-gray-500">Billing Type</span>
                          <input 
                            name="billingType" 
                            value={formValues.billingType} 
                            className="mt-1 p-3 border rounded-lg bg-gray-100" 
                            readOnly
                            aria-label="Billing Type"
                          />
                        </label>

                        {/* License/Usage Count - Always visible after billing type */}
                        {formValues.vendorContractType === 'usage' ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500">Current volumes</span>
                            <div className="flex items-center mt-1">
                              <input 
                                name="currentUsageCount" 
                                value={formValues.currentUsageCount} 
                                className="flex-1 p-3 border rounded-lg bg-gray-100" 
                                readOnly
                                aria-label="Current Usage Count"
                                placeholder="Enter current usage count"
                              />
                              <div className="ml-2 w-32">
                                <select 
                                  value={formValues.currentUnits} 
                                  disabled
                                  className="w-full p-3 border rounded-lg bg-gray-100"
                                  aria-label="Current Units"
                                >
                                  <option value="">Units</option>
                                  <option value="credits">Credits</option>
                                  <option value="minutes">Minutes</option>
                                  <option value="others">Others</option>
                                  {formValues.currentUnits && !['credits', 'minutes', 'others', ''].includes(formValues.currentUnits) && (
                                    <option value={formValues.currentUnits}>{formValues.currentUnits}</option>
                                  )}
                                </select>
                              </div>
                            </div>
                            {formValues.currentUnits && !['credits', 'minutes', 'others', ''].includes(formValues.currentUnits) && (
                              <p className="mt-1 text-xs text-gray-500">Unit: {formValues.currentUnits}</p>
                            )}
                          </div>
                        ) : formValues.vendorContractType === 'license' ? (
                          <label className="flex flex-col">
                            <span className="text-xs text-gray-500">Current license count</span>
                            <input 
                              name="currentLicenseCount" 
                              value={formValues.currentLicenseCount} 
                              className="mt-1 p-3 border rounded-lg bg-gray-100" 
                              readOnly
                              aria-label="Current License Count"
                              placeholder="Enter current license count"
                            />
                            {formValues.currentUnits && (
                              <p className="mt-1 text-xs text-gray-500">Current license unit: {formValues.currentUnits}</p>
                            )}
                          </label>
                        ) : null}

                        <label className="flex flex-col">
                          <span className="text-xs text-gray-500">Due date</span>
                          <input 
                            name="dueDate" 
                            value={formValues.dueDate} 
                            onChange={(e) => setFormValues({...formValues, dueDate: e.target.value})} 
                            type="date" 
                            className="mt-1 p-3 border rounded-lg bg-white" 
                            aria-label="Due Date"
                          />
                        </label>

                        <label className="flex flex-col">
                          <span className="text-xs text-gray-500">Renewal date</span>
                          <input 
                            name="renewalDate" 
                            value={formValues.renewalDate} 
                            onChange={(e) => setFormValues({...formValues, renewalDate: e.target.value})} 
                            type="date" 
                            className="mt-1 p-3 border rounded-lg bg-white" 
                            aria-label="Renewal Date"
                          />
                        </label>

                        <label className="flex flex-col">
                          <span className="text-xs text-gray-500">Contract Duration (months)</span>
                          <input
                            name="contractDuration"
                            value={formValues.contractDuration}
                            onChange={(e) => setFormValues({...formValues, contractDuration: e.target.value})}
                            type="number"
                            min={1}
                            className="mt-1 p-3 border rounded-lg bg-white"
                            aria-label="Contract Duration"
                            placeholder="Enter duration in months"
                          />
                        </label>


                        {formValues.vendorContractType === "usage" &&
 selectedRow && rowActionType[selectedRow!.id] !== "flat" && (
  <div className="mt-4 flex flex-col">
    <span className="text-xs text-gray-500">New renewal usage count</span>

    <div className="flex items-center mt-1">
      <input
        type="number"
        value={formValues.newUsageCount}
        onChange={(e) =>
          setFormValues({ ...formValues, newUsageCount: Number(e.target.value) })
        }
        className="flex-1 p-3 border rounded-lg bg-white"
      />

      <div className="ml-2 w-32">
        <select
          value={formValues.newUnits}
          onChange={(e) =>
            setFormValues({ ...formValues, newUnits: e.target.value })
          }
          className="w-full p-3 border rounded-lg bg-white"
        >
          <option value="">Select unit</option>
          <option value="credits">Credits</option>
          <option value="minutes">Minutes</option>
          <option value="others">Others</option>
        </select>
      </div>
    </div>

    {formValues.newUnits === "others" && (
      <input
        className="mt-2 p-3 border rounded-lg"
        placeholder="Custom unit"
        value={formValues.newUnitsOther}
        onChange={(e) =>
          setFormValues({ ...formValues, newUnitsOther: e.target.value })
        }
      />
    )}
  </div>
)}


{formValues.vendorContractType === "license" &&
 selectedRow && rowActionType[selectedRow!.id] !== "flat" && (
  <div className="mt-4 flex flex-col">
    <span className="text-xs text-gray-500">
      How many licenses do you want to renew?
    </span>

    <div className="flex items-center mt-1">
      <input
        type="number"
        value={formValues.newLicenseCount}
        onChange={(e) =>
          setFormValues({ ...formValues, newLicenseCount: Number(e.target.value) })
        }
        className="flex-1 p-3 border rounded-lg bg-white"
      />

      <div className="ml-2 w-32">
        <select
          value={formValues.newUnits}
          onChange={(e) =>
            setFormValues({ ...formValues, newUnits: e.target.value })
          }
          className="w-full p-3 border rounded-lg bg-white"
        >
          <option value="">Select unit</option>
          <option value="agents">Agents</option>
          <option value="users">Users</option>
        </select>
      </div>
    </div>
  </div>
)}
 </div>
                      {/* Additional comment */}
                      <div className="mt-4">
                        <label className="flex flex-col">
                          <span className="text-xs text-gray-500">Additional Comment</span>
                          <textarea
                            name="additionalComment"
                            value={formValues.additionalComment}
                            onChange={(e) => setFormValues({...formValues, additionalComment: e.target.value})}
                            rows={3}
                            className="mt-1 p-3 border rounded-lg bg-white"
                            aria-label="Additional Comment"
                            placeholder="Enter additional comment"
                          />
                        </label>
                      </div>

                      {/* Attachments */}
                      <div className="mt-4">
                        <label className="flex flex-col">
                          <span className="text-xs text-gray-500 mb-1.5">Attachments</span>
                          <div 
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200"
                            onClick={() => document.getElementById('attachments-input')?.click()}
                          >
                            <div className="flex flex-col items-center justify-center">
                              <svg className="h-10 w-10 text-gray-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="text-sm font-medium text-gray-700 mb-1">Click to upload files</p>
                              <p className="text-xs text-gray-500">or drag and drop files here</p>
                              <p className="text-xs text-gray-400 mt-1">Supports all file types</p>
                            </div>
                            <input 
                              id="attachments-input" 
                              type="file" 
                              multiple 
                              onChange={(e) => setFormValues({...formValues, attachments: Array.from(e.target.files || [])})}
                              className="hidden" 
                              aria-label="Attachments"
                            />
                          </div>
                          {formValues.attachments.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">Selected files ({formValues.attachments.length}):</p>
                              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {formValues.attachments.map((file, index) => (
                                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center truncate flex-1 min-w-0">
                                      <svg className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                      </svg>
                                      <div className="truncate">
                                        <p className="truncate text-sm font-medium text-gray-700">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                      </div>
                                    </div>
                                    <div className="flex space-x-1 ml-2 flex-shrink-0">
                                      <button 
                                        onClick={() => {
                                          // Preview functionality - open file in new tab
                                          const url = URL.createObjectURL(file);
                                          window.open(url, '_blank');
                                        }}
                                        className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-100"
                                        title="Preview"
                                      >
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                      </button>
                                      <button 
                                        onClick={() => {
                                          // Remove file from attachments
                                          setFormValues({...formValues, attachments: formValues.attachments.filter((_, i) => i !== index)});
                                        }}
                                        className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100"
                                        title="Remove"
                                      >
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </label>
                      </div>

                      {selectedRow && (rowActionType[selectedRow!.id] === "upgrade" || rowActionType[selectedRow!.id] === "downgrade") && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <div className="text-sm text-blue-800">
                            {selectedRow && rowActionType[selectedRow!.id] === "upgrade" 
                              ? "You are upgrading this contract. Please specify the new license/usage count (must be greater than current)." 
                              : "You are downgrading this contract. Please specify the new license/usage count (must be less than current)."}
                          </div>
                        </div>
                      )}

                      {selectedRow && rowActionType[selectedRow!.id] === "flat" && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg">
                          <div className="text-sm text-green-800">
                            You are renewing this contract with the same license/usage count.
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-3">
                        <button 
                          type="submit" 
                          disabled={Boolean(error)} 
                          className={`px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium ${error ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          Submit Request
                        </button>
                        <button 
                          type="button" 
                          onClick={() => selectedRow && closeForm(selectedRow.id)} 
                          className="px-4 py-2 border rounded-lg"
                        >
                          Cancel
                        </button>
                        <div className="ml-auto text-sm text-gray-500">Renewal request will be created in Jira</div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 border-t bg-gray-50 flex items-center justify-end gap-3">
            <PrimaryButton
              type="button"
              disabled={!expandedRowId}
              onClick={(e) => {
                e?.stopPropagation();
                if (!expandedRowId) return;
                const row = rows.find(r => r.id === expandedRowId);
                const contractId = row?.id?.replace('C','') || row?.existingContractId || null;
                if (contractId) {
                  window.dispatchEvent(new CustomEvent('openCreateModal', { detail: { existingContractId: contractId } }));
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium ${!expandedRowId ? 'opacity-50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              Renewal
            </PrimaryButton>
          </div>
        </div>
    );
  }