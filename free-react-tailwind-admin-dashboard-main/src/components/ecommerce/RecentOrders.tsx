// RecentOrders.tsx
import React, { useMemo, useState, useEffect } from "react";
import Badge from "../ui/badge/Badge"; // keep your badge component if present

// Define types for vendor renewal data
type RenewalItem = {
  id: string;
  vendorName: string;
  product: string;
  renewalDeadline: string;
  daysUntilRenewal: number | null;
  renewalStage: "Active" | "Expired";
  owner: string;
  totalValue: string;
};

function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function RecentOrders() {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<"All" | "Active" | "Expired">("All");
  const [page, setPage] = useState(1);
  const [renewals, setRenewals] = useState<RenewalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const pageSize = 4;

  // Fetch vendor renewal data
  useEffect(() => {
    const fetchRenewals = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8080/api/jira/contracts/completed");
        const data = await response.json();
        
        // Transform data to match RenewalItem interface
        const transformedData = data.map((contract: any) => {
          // Calculate days until renewal
          const renewalDate = contract.renewalDate ? new Date(contract.renewalDate) : new Date();
          const today = new Date();
          const timeDiff = renewalDate.getTime() - today.getTime();
          const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));
          
          // Determine renewal stage
          let renewalStage: "Active" | "Expired" = "Active";
          if (daysUntil <= 30) {
            renewalStage = "Expired";
          } else if (daysUntil > 30 && daysUntil <= 90) {
            renewalStage = "Active";
          }
          
          // Format renewal deadline
          const renewalDeadline = renewalDate.toLocaleDateString(undefined, { 
            year: "numeric", 
            month: "short", 
            day: "numeric" 
          });
          
          // Format total value - use totalProfit if available, otherwise fallback
          let totalValue = "$0";
          if (contract.totalProfit !== undefined && contract.totalProfit !== null) {
            totalValue = `$${Number(contract.totalProfit).toLocaleString()}`;
          } else if (contract.finalProposalTotal !== undefined && contract.finalProposalTotal !== null) {
            totalValue = `$${Number(contract.finalProposalTotal).toLocaleString()}`;
          } else if (contract.totalValue !== undefined && contract.totalValue !== null) {
            totalValue = `$${Number(contract.totalValue).toLocaleString()}`;
          }
          
          return {
            id: contract.id ? `C-${contract.id}` : "C-unknown",
            vendorName: contract.nameOfVendor || "Unknown Vendor",
            product: contract.productName || "Unknown Product",
            renewalDeadline: renewalDeadline || "N/A",
            daysUntilRenewal: daysUntil,
            renewalStage: renewalStage,
            owner: contract.requesterName || "N/A",
            totalValue: totalValue
          };
        });
        
        setRenewals(transformedData);
      } catch (error) {
        console.error("Failed to fetch renewal data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRenewals();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return renewals.filter((p) => {
      const matchesQuery = !q || 
        p.vendorName.toLowerCase().includes(q) || 
        p.product.toLowerCase().includes(q);
      const matchesStage = stage === "All" || p.renewalStage === stage;
      return matchesQuery && matchesStage;
    });
  }, [query, stage, renewals]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  function exportVisible() {
    const rows = [["Vendor Name", "Product", "Renewal Deadline", "Days Until", "Status", "Owner", "Total Value"]];
    filtered.forEach((p) => rows.push([
      p.vendorName, 
      p.product, 
      p.renewalDeadline, 
      p.daysUntilRenewal?.toString() || "N/A",
      p.renewalStage,
      p.owner,
      p.totalValue
    ]));
    downloadCSV("vendor_renewals.csv", rows);
  }

  if (loading) {
    return (
      <div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-13">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Vendor Renewals</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Upcoming vendor contract renewals</p>
            </div>
          </div>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    // removed "space-y-6" wrapper to avoid extra spacing above this card
    <div>
      {/* Recent Orders Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-13">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Vendor Renewals</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Upcoming vendor contract renewals</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search Vendor/Product"
              aria-label="Search renewals"
              className="rounded-md border border-gray-300 px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
            <select
              value={stage}
              onChange={(e) => {
                setStage(e.target.value as "All" | "Active" | "Expired");
                setPage(1);
              }}
              aria-label="Filter by stage"
              className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
            </select>

            <button
              onClick={exportVisible}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              aria-label="Export visible renewals"
            >
              Export CSV
            </button>

            <button className="rounded-md border border-gray-300 px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              See all
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-y border-gray-100 dark:border-gray-800">
              <tr>
                <th className="py-3 text-xs text-gray-500">Vendor Name</th>
                <th className="py-3 text-xs text-gray-500">Product</th>
                <th className="py-3 text-xs text-gray-500">Renewal Deadline</th>
                <th className="py-3 text-xs text-gray-500">Days Until</th>
                <th className="py-3 text-xs text-gray-500">Status</th>
                <th className="py-3 text-xs text-gray-500">Owner</th>
                <th className="py-3 text-xs text-gray-500">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {visible.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 text-sm text-gray-800 dark:text-white/90 font-medium">{p.vendorName}</td>
                  <td className="py-3 text-sm text-gray-500">{p.product}</td>
                  <td className="py-3 text-sm text-gray-500">{p.renewalDeadline}</td>
                  <td className="py-3 text-sm text-gray-500">{p.daysUntilRenewal !== null ? p.daysUntilRenewal : "N/A"}</td>
                  <td className="py-3">
                    <Badge 
                      size="sm" 
                      color={p.renewalStage === "Active" ? "success" : "error"}
                    >
                      {p.renewalStage}
                    </Badge>
                  </td>
                  <td className="py-3 text-sm text-gray-500">{p.owner}</td>
                  <td className="py-3 text-sm font-medium text-gray-800 dark:text-white/90">{p.totalValue}</td>
                </tr>
              ))}

              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">
                    No renewals found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} of {filtered.length}</div>

          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded border px-3 py-1 text-sm">Prev</button>
            <div className="text-sm">{page} / {pageCount}</div>
            <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="rounded border px-3 py-1 text-sm">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}