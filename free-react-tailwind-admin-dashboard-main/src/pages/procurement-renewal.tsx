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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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


  export default function ProcurementRenewal() {
    const [rows, setRows] = useState<Row[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [rowActionType, setRowActionType] = useState<Record<string, "upgrade" | "downgrade" | "flat" | null>>({});
    const [formValues, setFormValues] = useState({ vendorName: "", productName: "", startDate: "", endDate: "", usageLicense: 0, renewalUsageLicense: 0 });
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
          const mappedRows = contracts.map((contract, index) => 
            mapContractToRow(contract, index)
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
    }, [expandedRowId, rowActionType]);

    function selectRow(id: string) {
      setExpandedRowId((prev) => (prev === id ? null : id));
    }

    function openActionForRow(row: Row, action: "upgrade" | "downgrade" | "flat") {
      setExpandedRowId(row.id);
      setRowActionType((prev) => ({ ...prev, [row.id]: action }));
      setShowGlobalPanel(true);

      setFormValues({
        vendorName: row.vendorName,
        productName: row.productName,
        startDate: row.startDate,
        endDate: row.endDate,
        usageLicense: row.usageLicense,
        renewalUsageLicense: row.usageLicense,
      });
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

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const { name, value } = e.target;
      const parsed = name === "usageLicense" || name === "renewalUsageLicense" ? Number(value) : value;

      setFormValues((v) => ({ ...v, [name]: parsed }));

      // validation rules
      if (name === "renewalUsageLicense") {
        const current = selectedRow?.usageLicense ?? 0;
        const newVal = Number(value);
        const actionType = selectedRow ? rowActionType[selectedRow.id] : null;
        if (actionType === "upgrade") {
          if (isNaN(newVal) || newVal < current) {
            setError(`Upgrade must be >= current licenses (${current}).`);
          } else {
            setError(null);
          }
        } else if (actionType === "downgrade") {
          if (isNaN(newVal) || newVal > current) {
            setError(`Downgrade must be <= current licenses (${current}).`);
          } else {
            setError(null);
          }
        } else {
          setError(null);
        }
      }
    }

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      // final validation check
      if (!selectedRow) return;
      const actionType = rowActionType[selectedRow.id];
      if (!actionType) return;
      const current = selectedRow.usageLicense;
      const newVal = formValues.renewalUsageLicense;

      if (actionType === "upgrade" && newVal < current) {
        setError(`Upgrade must be >= current licenses (${current}).`);
        return;
      }
      if (actionType === "downgrade" && newVal > current) {
        setError(`Downgrade must be <= current licenses (${current}).`);
        return;
      }

      console.log("Submitted", { actionType, rowId: selectedRow.id, formValues });
      alert(`Submitted ${actionType} for ${formValues.vendorName} (demo)`);
      closeForm(selectedRow.id);
    }

    return (
      <div className="p-8 max-w-8xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-6">Procurement — Renewals (Spreadsheet style)</h1>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Showing</div>
                <div className="text-lg font-medium">{rows.length} vendors</div>
              </div>
              <div className="text-sm text-gray-500">Styled spreadsheet-like view — click a row to select.</div>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="min-w-[1800px] w-full table-auto border-separate border-spacing-0">
              <thead className="bg-green-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">#</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">EEID</th>
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
                  <th className="px-3 py-2 text-right text-xs font-semibold text-green-700">Action</th>
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
  <td className="px-3 py-2 text-sm text-gray-600 border-b border-r border-gray-200">{idx + 1}</td>
  <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.id}</td>

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

  <td className="px-3 py-2 text-sm text-right border-b border-gray-200">
    <button
      type="button"
      onClick={(e) => { 
        e.stopPropagation(); 
        if (expandedRowId === r.id) {
          closeForm(r.id);
        } else {
          openActionForRow(r, "flat");
        }
      }}
      className="px-3 py-1.5 rounded-md border text-xs font-medium"
    >
      {expandedRowId === r.id ? "Close" : "Action"}
    </button>
  </td>
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
          {showGlobalPanel && selectedRow && (
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
                        <div className="text-base font-semibold text-gray-900">{selectedRow.contactName} — {selectedRow.vendorName} ({selectedRow.productName})</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openActionForRow(selectedRow, "upgrade")} className={`px-3 py-2 rounded-md text-xs font-semibold ${rowActionType[selectedRow.id] === "upgrade" ? "bg-green-600 text-white" : "bg-green-50 text-green-700 border border-green-200"}`}>Upgrade</button>
                        <button onClick={() => openActionForRow(selectedRow, "downgrade")} className={`px-3 py-2 rounded-md text-xs font-semibold ${rowActionType[selectedRow.id] === "downgrade" ? "bg-yellow-400 text-black" : "bg-yellow-50 text-yellow-800 border border-yellow-200"}`}>Downgrade</button>
                        <button onClick={() => openActionForRow(selectedRow, "flat")} className={`px-3 py-2 rounded-md text-xs font-semibold ${rowActionType[selectedRow.id] === "flat" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>Flat Renewal</button>
                        <button onClick={() => closeForm(selectedRow.id)} className="ml-2 px-3 py-2 rounded-md text-xs border">Close</button>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="flex flex-col">
                          <span className="text-xs text-gray-500">Vendor</span>
                          <input name="vendorName" value={formValues.vendorName} onChange={handleChange} className="mt-1 p-3 border rounded-lg bg-gray-50" />
                        </label>

                        <label className="flex flex-col">
                          <span className="text-xs text-gray-500">Product</span>
                          <input name="productName" value={formValues.productName} onChange={handleChange} className="mt-1 p-3 border rounded-lg bg-gray-50" />
                        </label>

                        <label className="flex flex-col">
                          <span className="text-xs text-gray-500">Start date</span>
                          <input name="startDate" value={formValues.startDate} onChange={handleChange} type="date" className="mt-1 p-3 border rounded-lg bg-gray-50" />
                        </label>

                        <label className="flex flex-col">
                          <span className="text-xs text-gray-500">End date</span>
                          <input name="endDate" value={formValues.endDate} onChange={handleChange} type="date" className="mt-1 p-3 border rounded-lg bg-gray-50" />
                        </label>

                        <label className="flex flex-col">
                          <span className="text-xs text-gray-500">Current usage license</span>
                          <input name="usageLicense" value={String(formValues.usageLicense)} onChange={handleChange} type="number" className="mt-1 p-3 border rounded-lg bg-gray-100 text-right font-semibold" readOnly />
                        </label>

                        {(rowActionType[selectedRow.id] === "upgrade" || rowActionType[selectedRow.id] === "downgrade") && (
                          <label className="flex flex-col">
                            <span className="text-xs text-gray-500">Renewal usage license</span>
                            <input
                              name="renewalUsageLicense"
                              value={String(formValues.renewalUsageLicense)}
                              onChange={handleChange}
                              type="number"
                              min={0}
                              className="mt-1 p-3 border rounded-lg bg-white text-right font-semibold"
                            />
                            <div className="text-sm mt-1 text-red-600">{error}</div>
                            <div className="text-xs mt-1 text-gray-400">{rowActionType[selectedRow.id] === "upgrade" ? `Must be >= current (${selectedRow.usageLicense})` : `Must be <= current (${selectedRow.usageLicense})`}</div>
                          </label>
                        )}
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <button type="submit" disabled={Boolean(error)} className={`px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium ${error ? "opacity-60 cursor-not-allowed" : ""}`}>Submit</button>
                        <button type="button" onClick={() => closeForm(selectedRow.id)} className="px-4 py-2 border rounded-lg">Cancel</button>
                        <div className="ml-auto text-sm text-gray-500">Demo only — submissions are logged to console.</div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-gray-50 text-sm text-gray-500 border-t">Use the Action button in any row to open options below the list. Current usage is read-only; upgrade/downgrade have validation to prevent invalid numbers.</div>
        </div>
      </div>
    );
  }