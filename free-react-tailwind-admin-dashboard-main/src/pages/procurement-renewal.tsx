import React, { useState, useEffect } from "react";

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
          
          // Map contracts to rows
          const mappedRows = contracts.map((contract) => 
            mapContractToRow(contract)
          );
          console.log("Mapped rows:", mappedRows);
          
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
          const response = await fetch('http://localhost:8080/api/jira/issues/create', {
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
        <h1 className="text-3xl font-extrabold mb-6">Procurement — Renewals (Spreadsheet style)</h1>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Showing</div>
                {/* <div className="text-lg font-medium">{rows.length} vendors</div> */}
                <div className="text-lg font-medium">Contracts</div>
              </div>
              <div className="text-sm text-gray-500">Styled spreadsheet-like view — click a row to select.</div>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="min-w-[1800px] w-full table-auto border-separate border-spacing-0">
              <thead className="bg-green-50 sticky top-0 z-10">
                <tr>  
                  {/* For Adding the Radio Button In the Procurement Renewal form */}
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700"></th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">#</th>
                  {/* <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">EEID</th> */}
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Requester Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Requester Email</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Department</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Organization</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Vendor</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Product</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Contract Type</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Renewal Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Jira Issue</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Billing Type</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Current License Count</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">New License Count</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Current Usage Count</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">New Usage Count</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Current Units</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">New Units</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Due Date</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Renewal Date</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">License Update Type</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Existing Contract ID</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Additional Comment</th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {rows.length > 0 ? (
                  rows.map((r, idx) => (
                    <React.Fragment key={r.id}>
                      <tr
  onClick={() => selectRow(r.id)}
  className={`cursor-pointer ${expandedRowId === r.id ? "bg-indigo-50" : idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
>
   {/* Radio Button Function on Renewal button */}
  <td className="px-3 py-2 text-center border-b border-r border-gray-200">
    <input
      type="radio"
      name="renewalRowSelect"
      checked={expandedRowId === r.id}
      onChange={(e) => { e.stopPropagation(); selectRow(r.id); }}
      onClick={(e) => e.stopPropagation()}
      aria-label={`Select ${r.vendorName} — ${r.productName}`}
    />
  </td>
  <td className="px-3 py-2 text-sm text-gray-600 border-b border-r border-gray-200">{idx + 1}</td>
  {/* <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.id}</td> */}

  <td className="px-3 py-2 text-sm text-gray-900 border-b border-r border-gray-200">{r.requesterName}</td>
  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.requesterEmail}</td>
  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.requesterDepartment}</td>
  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.requesterOrganization}</td>

  <td className="px-3 py-2 text-sm font-semibold text-indigo-700 border-b border-r border-gray-200">{r.vendorName}</td>
  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.productName}</td>

  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.contractType}</td>
  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.renewalStatus}</td>

  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.jiraIssueKey}</td>
  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.billingType}</td>

  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.currentLicenseCount ?? "N/A"}</td>
  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.newLicenseCount ?? "N/A"}</td>

  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.currentUsageCount ?? "N/A"}</td>
  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.newUsageCount ?? "N/A"}</td>

  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.currentUnits ?? "N/A"}</td>
  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.newUnits ?? "N/A"}</td>

  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.dueDate ?? "N/A"}</td>
  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.renewalDate ?? "N/A"}</td>

  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.licenseUpdateType ?? "N/A"}</td>
  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.existingContractId ?? "N/A"}</td>

  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.additionalComment ?? "N/A"}</td>
</tr>
 </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={24} className="px-3 py-4 text-center text-gray-500">
                      {loading ? "Loading..." : "No completed contracts found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Global options panel below the list */}
          {false && selectedRow && (
            <div className="border-t bg-white/60 backdrop-blur-sm">
              <div className="max-w-8xl mx-auto p-5">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 rounded-full bg-indigo-100 text-indigo-700 w-10 h-10 flex items-center justify-center font-bold">
                    {selectedRow.vendorName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-xs text-gray-500">Selected</div>
                        <div className="text-base font-semibold text-gray-900">
                          {selectedRow.vendorName} — {selectedRow.productName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
  onClick={(e) => {
    e.stopPropagation();
    openActionForRow(selectedRow, "upgrade");
  }} className={`px-3 py-2 rounded-md text-xs font-semibold ${rowActionType[selectedRow.id] === "upgrade" ? "bg-green-600 text-white" : "bg-green-50 text-green-700 border border-green-200"}`}>Upgrade</button>
                        <button
  onClick={(e) => {
    e.stopPropagation();
    openActionForRow(selectedRow, "downgrade");
  }} className={`px-3 py-2 rounded-md text-xs font-semibold ${rowActionType[selectedRow.id] === "downgrade" ? "bg-yellow-400 text-black" : "bg-yellow-50 text-yellow-800 border border-yellow-200"}`}>Downgrade</button>
                        <button
  onClick={(e) => {
    e.stopPropagation();
    openActionForRow(selectedRow, "flat");
  }} className={`px-3 py-2 rounded-md text-xs font-semibold ${rowActionType[selectedRow.id] === "flat" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>Flat Renewal</button>
                        <button onClick={() => closeForm(selectedRow.id)} className="ml-2 px-3 py-2 rounded-md text-xs border">Close</button>
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
 rowActionType[selectedRow.id] !== "flat" && (
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
 rowActionType[selectedRow.id] !== "flat" && (
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
                          <span className="text-xs text-gray-500">Attachments</span>
                          <input
                            type="file"
                            multiple
                            onChange={(e) => setFormValues({...formValues, attachments: Array.from(e.target.files || [])})}
                            className="mt-1 p-3 border rounded-lg bg-white"
                            aria-label="Attachments"
                          />
                          {formValues.attachments.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">Selected files:</p>
                              <ul className="list-disc list-inside text-sm text-gray-500">
                                {formValues.attachments.map((file, index) => (
                                  <li key={index}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </label>
                      </div>

                      {(rowActionType[selectedRow.id] === "upgrade" || rowActionType[selectedRow.id] === "downgrade") && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <div className="text-sm text-blue-800">
                            {rowActionType[selectedRow.id] === "upgrade" 
                              ? "You are upgrading this contract. Please specify the new license/usage count (must be greater than current)." 
                              : "You are downgrading this contract. Please specify the new license/usage count (must be less than current)."}
                          </div>
                        </div>
                      )}

                      {rowActionType[selectedRow.id] === "flat" && (
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
                          onClick={() => closeForm(selectedRow.id)} 
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
            <button
              type="button"
              disabled={!expandedRowId}
              onClick={(e) => {
                e.stopPropagation();
                if (!expandedRowId) return;
                const row = rows.find(r => r.id === expandedRowId);
                const contractId = row?.id?.replace('C','') || row?.existingContractId || null;
                if (contractId) {
                  window.dispatchEvent(new CustomEvent('openCreateModal', { detail: { existingContractId: contractId } }));
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium ${expandedRowId ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
            >
              Renewal
            </button>
          </div>
        </div>
      </div>
    );
  }