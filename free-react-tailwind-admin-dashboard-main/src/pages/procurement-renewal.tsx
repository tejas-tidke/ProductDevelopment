import React, { useState, useEffect } from "react";

type Row = {
  id: string;
  vendorName: string;
  contactName: string;
  jobTitle: string;
  department: string;
  businessUnit: string;
  gender: string;
  ethnicity: string;
  age: number;
  hireDate: string;
  annualSalary: string;
  bonus: string;
  country: string;
  city: string;
  exitDate?: string;
  productName: string;
  startDate: string;
  endDate: string;
  usageLicense: number;
};

const DUMMY_ROWS: Row[] = [
  {
    id: "R1",
    vendorName: "Atlassian",
    contactName: "Emily Davis",
    jobTitle: "Sr. Manager",
    department: "IT",
    businessUnit: "Research & Development",
    gender: "Female",
    ethnicity: "Black",
    age: 55,
    hireDate: "4/8/2016",
    annualSalary: "$141,604",
    bonus: "15%",
    country: "United States",
    city: "Seattle",
    exitDate: "10/16/2021",
    productName: "Bitbucket",
    startDate: "2024-11-01",
    endDate: "2025-10-31",
    usageLicense: 500,
  },
  {
    id: "R2",
    vendorName: "Microsoft",
    contactName: "Theodore Dinh",
    jobTitle: "Technical Architect",
    department: "IT",
    businessUnit: "Manufacturing",
    gender: "Male",
    ethnicity: "Asian",
    age: 59,
    hireDate: "11/29/1997",
    annualSalary: "$99,975",
    bonus: "0%",
    country: "China",
    city: "Chongqing",
    productName: "Azure DevOps",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    usageLicense: 1200,
  },
  {
    id: "R3",
    vendorName: "GitLab",
    contactName: "Luna Sanders",
    jobTitle: "Director",
    department: "Finance",
    businessUnit: "Speciality Products",
    gender: "Female",
    ethnicity: "Caucasian",
    age: 50,
    hireDate: "10/26/2006",
    annualSalary: "$163,099",
    bonus: "20%",
    country: "United States",
    city: "Chicago",
    productName: "GitLab Ultimate",
    startDate: "2023-09-15",
    endDate: "2024-09-14",
    usageLicense: 350,
  },
  {
    id: "R4",
    vendorName: "HashiCorp",
    contactName: "Penelope Jordan",
    jobTitle: "Computer Systems Manager",
    department: "IT",
    businessUnit: "Manufacturing",
    gender: "Female",
    ethnicity: "Caucasian",
    age: 26,
    hireDate: "9/27/2019",
    annualSalary: "$84,913",
    bonus: "7%",
    country: "United States",
    city: "Chicago",
    productName: "Terraform Cloud",
    startDate: "2024-06-01",
    endDate: "2025-05-31",
    usageLicense: 220,
  },
  {
    id: "R5",
    vendorName: "JetBrains",
    contactName: "Austin Vo",
    jobTitle: "Sr. Analyst",
    department: "Finance",
    businessUnit: "Manufacturing",
    gender: "Male",
    ethnicity: "Asian",
    age: 55,
    hireDate: "11/20/1995",
    annualSalary: "$95,409",
    bonus: "0%",
    country: "United States",
    city: "Phoenix",
    productName: "YouTrack",
    startDate: "2024-03-10",
    endDate: "2025-03-09",
    usageLicense: 75,
  },
  {
    id: "R6",
    vendorName: "Docker",
    contactName: "Joshua Gupta",
    jobTitle: "Account Representative",
    department: "Sales",
    businessUnit: "Corporate",
    gender: "Male",
    ethnicity: "Asian",
    age: 57,
    hireDate: "1/24/2017",
    annualSalary: "$50,994",
    bonus: "0%",
    country: "China",
    city: "Chongqing",
    productName: "Docker Teams",
    startDate: "2024-07-01",
    endDate: "2025-06-30",
    usageLicense: 180,
  },
  {
    id: "R7",
    vendorName: "Amazon",
    contactName: "Ruby Barnes",
    jobTitle: "Manager",
    department: "IT",
    businessUnit: "Corporate",
    gender: "Female",
    ethnicity: "Caucasian",
    age: 27,
    hireDate: "7/1/2020",
    annualSalary: "$119,746",
    bonus: "10%",
    country: "United States",
    city: "Phoenix",
    productName: "AWS CodeCommit",
    startDate: "2024-02-01",
    endDate: "2025-01-31",
    usageLicense: 420,
  },
  {
    id: "R8",
    vendorName: "Google",
    contactName: "Luke Martin",
    jobTitle: "Analyst",
    department: "Finance",
    businessUnit: "Manufacturing",
    gender: "Male",
    ethnicity: "Black",
    age: 25,
    hireDate: "5/16/2020",
    annualSalary: "$41,336",
    bonus: "0%",
    country: "United States",
    city: "Miami",
    exitDate: "5/20/2021",
    productName: "Cloud Source Repositories",
    startDate: "2024-04-01",
    endDate: "2025-03-31",
    usageLicense: 95,
  },
  {
    id: "R9",
    vendorName: "Perforce",
    contactName: "Easton Bailey",
    jobTitle: "Manager",
    department: "Accounting",
    businessUnit: "Manufacturing",
    gender: "Male",
    ethnicity: "Caucasian",
    age: 29,
    hireDate: "1/25/2019",
    annualSalary: "$113,527",
    bonus: "6%",
    country: "United States",
    city: "Austin",
    productName: "Helix Core",
    startDate: "2024-08-01",
    endDate: "2025-07-31",
    usageLicense: 60,
  },
  {
    id: "R10",
    vendorName: "Bitrise",
    contactName: "Madeline Walker",
    jobTitle: "Sr. Analyst",
    department: "Finance",
    businessUnit: "Speciality Products",
    gender: "Female",
    ethnicity: "Caucasian",
    age: 34,
    hireDate: "6/13/2018",
    annualSalary: "$77,203",
    bonus: "0%",
    country: "United States",
    city: "Chicago",
    productName: "CI/CD",
    startDate: "2024-05-01",
    endDate: "2025-04-30",
    usageLicense: 310,
  },
];

export default function ProcurementRenewal(): JSX.Element {
  const [rows] = useState<Row[]>(DUMMY_ROWS);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [rowActionType, setRowActionType] = useState<Record<string, "upgrade" | "downgrade" | "flat" | null>>({});
  const [formValues, setFormValues] = useState({ vendorName: "", productName: "", startDate: "", endDate: "", usageLicense: 0, renewalUsageLicense: 0 });
  const [error, setError] = useState<string | null>(null);
  const selectedRow = rows.find((r) => r.id === expandedRowId) || null;
  const [showGlobalPanel, setShowGlobalPanel] = useState<boolean>(false);

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
          <table className="min-w-[1200px] w-full table-auto border-separate border-spacing-0">
            <thead className="bg-green-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">#</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">EEID</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Full Name</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Job Title</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Department</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Country</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">City</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Vendor</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Product</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Start</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">End</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-green-700">Usage</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-green-700">Action</th>
              </tr>
            </thead>

            <tbody className="bg-white">
              {rows.map((r, idx) => (
                <React.Fragment key={r.id}>
                  <tr
                    onClick={() => selectRow(r.id)}
                    className={`cursor-pointer ${expandedRowId === r.id ? "bg-indigo-50" : idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <td className="px-3 py-2 text-sm text-gray-600 border-b border-r border-gray-200">{idx + 1}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">E0{(2387 + idx).toString().padStart(3, "0")}</td>
                    <td className="px-3 py-2 text-sm font-medium text-gray-900 border-b border-r border-gray-200">{r.contactName}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.jobTitle}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.department}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.country}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.city}</td>
                    <td className="px-3 py-2 text-sm font-semibold text-indigo-700 border-b border-r border-gray-200">{r.vendorName}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.productName}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.startDate}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 border-b border-r border-gray-200">{r.endDate}</td>
                    <td className="px-3 py-2 text-sm text-right font-semibold text-indigo-600 border-b border-r border-gray-200">{r.usageLicense.toLocaleString()}</td>
                    <td className="px-3 py-2 text-sm text-right border-b border-gray-200">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); expandedRowId === r.id ? closeForm(r.id) : openActionForRow(r, "flat"); }}
                          className="px-3 py-1.5 rounded-md border text-xs font-medium"
                        >
                          {expandedRowId === r.id ? "Close" : "Action"}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Inline row expansion removed; using global panel below the table */}
                </React.Fragment>
              ))}
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
