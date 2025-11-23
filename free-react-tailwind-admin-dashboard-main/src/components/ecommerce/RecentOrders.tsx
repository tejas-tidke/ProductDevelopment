// RecentOrders.tsx
import React, { useMemo, useState } from "react";
import Badge from "../ui/badge/Badge"; // keep your badge component if present

type Product = {
  id: number;
  name: string;
  variants: string;
  category: string;
  price: string;
  image?: string;
  status: "Delivered" | "Pending" | "Canceled";
};

const PRODUCTS: Product[] = [
  { id: 1, name: "JIRA”", variants: "2 Variants", category: "Atlassian", price: "$2399.00", status: "Delivered", image: "/images/product/product-01.jpg" },
  { id: 2, name: "YOUTUBE", variants: "1 Variant", category: "Google", price: "$879.00", status: "Pending", image: "/images/product/product-02.jpg" },
  { id: 3, name: "Confluence ", variants: "2 Variants", category: "Holograph", price: "$1869.00", status: "Delivered", image: "/images/product/product-03.jpg" },
  { id: 4, name: "Sensors", variants: "2 Variants", category: "TECHNOVA", price: "$1699.00", status: "Canceled", image: "/images/product/product-04.jpg" },
  { id: 5, name: "WIFI", variants: "1 Variant", category: "BLUECHIP", price: "$240.00", status: "Delivered", image: "/images/product/product-05.jpg" },
];

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
  const [status, setStatus] = useState<"All" | Product["status"]>("All");
  const [page, setPage] = useState(1);
  const pageSize = 4;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const matchesStatus = status === "All" || p.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  function exportVisible() {
    const rows = [["Product", "Vendor Name", "Quotation", "Status", "Variants"]];
    filtered.forEach((p) => rows.push([p.name, p.category, p.price, p.status, p.variants]));
    downloadCSV("recent_orders.csv", rows);
  }

  return (
    // removed "space-y-6" wrapper to avoid extra spacing above this card
    <div>
      {/* Recent Orders Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-13 ">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Recent Orders</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Latest products & statuses</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search Vendor/Product"
              aria-label="Search orders"
              className="rounded-md border border-gray-300 px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as "All" | Product["status"]);
                setPage(1);
              }}
              aria-label="Filter by status"
              className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="All">All</option>
              <option value="Delivered">Delivered</option>
              <option value="Pending">Pending</option>
              <option value="Canceled">Canceled</option>
            </select>

            <button
              onClick={exportVisible}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              aria-label="Export visible orders"
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
                <th className="py-3 text-xs text-gray-500">Product</th>
                <th className="py-3 text-xs text-gray-500">Vendor Name</th>
                <th className="py-3 text-xs text-gray-500">Quotation</th>
                <th className="py-3 text-xs text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {visible.map((p) => (
                <tr key={p.id}>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100">
                        {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 dark:text-white/90">{p.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{p.variants}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-gray-500">{p.category}</td>
                  <td className="py-3 text-sm text-gray-500">{p.price}</td>
                  <td className="py-3">
                    <Badge size="sm" color={p.status === "Delivered" ? "success" : p.status === "Pending" ? "warning" : "error"}>
                      {p.status}
                    </Badge>
                  </td>
                </tr>
              ))}

              {visible.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">
                    No orders found
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