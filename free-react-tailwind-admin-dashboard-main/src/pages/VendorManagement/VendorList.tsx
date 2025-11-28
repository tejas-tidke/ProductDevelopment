import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import PageMeta from "../../components/common/PageMeta";
import { jiraService, ProductItem } from "../../services/jiraService";
import { Modal } from "../../components/ui/modal/index.tsx";
// import { useModal } from "../../hooks/useModal"; // not used right now

interface Column {
  key: string;
  title: string;
  isSortable: boolean;
  isSelected: boolean;
}

const VendorList: React.FC = () => {
  // --- UI / filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data state
  const [products, setProducts] = useState<ProductItem[]>([]);

  // column visibility + ordering
  const [allColumns, setAllColumns] = useState<Column[]>([
    { key: "id", title: "ID", isSortable: true, isSelected: true },
    { key: "nameOfVendor", title: "Vendor Name", isSortable: true, isSelected: true },
    { key: "productName", title: "Product Name", isSortable: true, isSelected: true },
    { key: "productLink", title: "Product Link", isSortable: true, isSelected: true },
    { key: "productType", title: "Product Type", isSortable: true, isSelected: true },
  ]);

  const visibleColumns = allColumns.filter((c) => c.isSelected);

  // --- Add Vendor Modal state
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [vendorProductName, setVendorProductName] = useState("");
  const [vendorProductLink, setVendorProductLink] = useState("");
  const [vendorProductType, setVendorProductType] = useState<"License Based" | "Usage Based">(
    "License Based"
  );

  const openVendorModal = () => {
    setVendorName("");
    setVendorProductName("");
    setVendorProductLink("");
    setVendorProductType("License Based");
    setIsVendorModalOpen(true);
  };

  const closeVendorModal = () => {
    setIsVendorModalOpen(false);
  };

  // 🔥 async version – talks to backend
  const handleSaveVendor = async () => {
    if (!vendorName.trim() || !vendorProductName.trim()) {
      alert("Vendor Name and Product Name are required.");
      return;
    }

    try {
      const created = await jiraService.createVendor({
        nameOfVendor: vendorName.trim(),
        productName: vendorProductName.trim(),
        productLink: vendorProductLink.trim(),
        productType: vendorProductType,
      });

      setProducts((prev) => [...prev, created]);
      closeVendorModal();
    } catch (err: any) {
      console.error("Failed to create vendor", err);
      alert(err.message || "Something went wrong");
    }
  };

  // Fetch data
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch all vendors
        const vendors = await jiraService.getVendors();

        if (!Array.isArray(vendors)) {
          throw new Error("Failed to fetch vendors");
        }

        // 2. Fetch products for each vendor
        const productPromises = vendors.map(async (vendorName: string) => {
          try {
            const products = await jiraService.getProductsByVendor(vendorName);
            if (Array.isArray(products)) {
              // Ensure nameOfVendor is populated
              return products.map((p: ProductItem) => ({
                ...p,
                nameOfVendor: p.nameOfVendor || vendorName,
              }));
            }
            return [];
          } catch (e) {
            console.warn(`Failed to fetch products for vendor ${vendorName}`, e);
            return [];
          }
        });

        const results = await Promise.all(productPromises);
        const allProducts = results.flat();

        console.log("Fetched all products:", allProducts);
        setProducts(allProducts);
      } catch (err) {
        console.error("Failed to fetch products", err);
        setError("Failed to load vendor products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    let res = products.filter((p) => {
      const term = searchTerm.toLowerCase();
      const vendor = (p.nameOfVendor || "").toLowerCase();
      const product = (p.productName || "").toLowerCase();

      return searchTerm === "" || vendor.includes(term) || product.includes(term);
    });

    if (sortField) {
      res = [...res].sort((a, b) => {
        // @ts-ignore
        const aVal = String(a[sortField] || "").toLowerCase();
        // @ts-ignore
        const bVal = String(b[sortField] || "").toLowerCase();
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }

    return res;
  }, [products, searchTerm, sortField, sortDirection]);

  // Draggable Header Component
  const DraggableHeader: React.FC<{
    column: Column;
    index: number;
    onSort: (key: string) => void;
    sortConfig: { key: string; direction: "asc" | "desc" } | null;
    onMove: (dragIndex: number, hoverIndex: number) => void;
  }> = ({ column, index, onSort, sortConfig, onMove }) => {
    const ref = React.useRef<HTMLTableHeaderCellElement>(null);
    const [{ isDragging }, drag] = useDrag({
      type: "tableColumn",
      item: { index, column },
      collect: (m) => ({ isDragging: m.isDragging() }),
    });
    const [, drop] = useDrop({
      accept: "tableColumn",
      hover(item: { index: number }) {
        const dragIndex = item.index;
        const hoverIndex = index;
        if (dragIndex === hoverIndex) return;
        onMove(dragIndex, hoverIndex);
        item.index = hoverIndex;
      },
    });
    drag(drop(ref));
    return (
      <th
        ref={ref}
        className={`px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 ${isDragging ? "opacity-50" : ""
          }`}
      >
        <div
          onClick={() => column.isSortable && onSort(column.key)}
          style={{ cursor: column.isSortable ? "pointer" : "default" }}
        >
          {column.title}
          {sortConfig && sortConfig.key === column.key && (
            <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
          )}
        </div>
      </th>
    );
  };

  const handleColumnMove = (dragIndex: number, hoverIndex: number) => {
    const visible = allColumns.filter((c) => c.isSelected);
    const newOrder = [...visible];
    const [removed] = newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, removed);

    let vi = 0;
    const merged = allColumns.map((c) => {
      if (!c.isSelected) return c;
      const next = newOrder[vi];
      vi++;
      return next;
    });
    setAllColumns(merged);
  };

  const handleSort = (key: string) => {
    let dir: "asc" | "desc" = "asc";
    if (sortField === key && sortDirection === "asc") dir = "desc";
    setSortField(key);
    setSortDirection(dir);
  };

  const getCellValue = (product: ProductItem, colKey: string): React.ReactNode => {
    switch (colKey) {
      case "id":
        return product.id;
      case "nameOfVendor":
        return product.nameOfVendor || "-";
      case "productName":
        return product.productName || "-";
      case "productLink":
        return product.productLink ? (
          <a
            href={product.productLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {product.productLink}
          </a>
        ) : (
          "-"
        );
      case "productType":
        return product.productType || "-";
      default:
        // @ts-ignore
        return product[colKey] || "-";
    }
  };

  // --------- loading / error / normal return all INSIDE VendorList ---------
  if (loading) {
    return (
      <>
        <PageMeta title="Vendor List" description="List of all vendor products" />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Vendor List
            </h1>
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta title="Vendor List" description="List of all vendor products" />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Vendor List
            </h1>
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Error: {error}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Vendor List" description="List of all vendor products" />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor List</h1>
            <div className="flex space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
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

              {/* Add Vendor Button */}
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                onClick={openVendorModal}
              >
                Add Vendor
              </button>
            </div>
          </div>

          {/* Table */}
          <DndProvider backend={HTML5Backend}>
            <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
              <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                    <tr>
                      {visibleColumns.map((col, idx) => (
                        <DraggableHeader
                          key={col.key}
                          column={col}
                          index={idx}
                          onSort={handleSort}
                          sortConfig={
                            sortField ? { key: sortField, direction: sortDirection } : null
                          }
                          onMove={handleColumnMove}
                        />
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td
                          colSpan={visibleColumns.length}
                          className="px-6 py-8 text-center text-sm text-gray-500"
                        >
                          No products found
                        </td>
                      </tr>
                    )}

                    {filteredProducts.map((product, idx) => (
                      <tr
                        key={product.id || idx}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {visibleColumns.map((col) => (
                          <td
                            key={`${product.id || idx}-${col.key}`}
                            className="px-4 py-3 text-sm text-gray-900 dark:text-white align-top border-r border-gray-200 dark:border-gray-700"
                          >
                            {getCellValue(product, col.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </DndProvider>

          <div className="mt-3 text-sm text-gray-500">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>
      </div>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={isVendorModalOpen}
        onClose={closeVendorModal}
        className="max-w-[700px] p-6 lg:p-10 "
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              Add Vendor
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add a new vendor and its associated product details.
            </p>
          </div>

          <div className="mt-8">
            {/* Vendor Name */}
            <div className="mt-4">
              <label
                htmlFor="vendor-name"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
              >
                Vendor Name
              </label>
              <input
                id="vendor-name"
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Enter vendor name"
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            {/* Product Name */}
            <div className="mt-4">
              <label
                htmlFor="product-name"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
              >
                Product Name
              </label>
              <input
                id="product-name"
                type="text"
                value={vendorProductName}
                onChange={(e) => setVendorProductName(e.target.value)}
                placeholder="Enter product name"
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            {/* Product Link */}
            <div className="mt-4">
              <label
                htmlFor="product-link"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
              >
                Product Link
              </label>
              <input
                id="product-link"
                type="url"
                value={vendorProductLink}
                onChange={(e) => setVendorProductLink(e.target.value)}
                placeholder="https://example.com/product"
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            {/* Product Type */}
            <div className="mt-4">
              <label
                htmlFor="product-type"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
              >
                Product Type
              </label>
              <select
                id="product-type"
                value={vendorProductType}
                onChange={(e) =>
                  setVendorProductType(e.target.value as "License Based" | "Usage Based")
                }
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              >
                <option value="License Based">License Based</option>
                <option value="Usage Based">Usage Based</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
            <button
              onClick={closeVendorModal}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Close
            </button>
            <button
              onClick={handleSaveVendor}
              type="button"
              className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
            >
              Add Vendor
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default VendorList;
