import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import PageMeta from "../../components/common/PageMeta";
import { jiraService, ProductItem } from "../../services/jiraService";
import { Modal } from "../../components/ui/modal/index.tsx";
import VendorListModal from "./VendorListModal";

interface Column {
  key: string;
  title: string;
  isSortable: boolean;
  isSelected: boolean;
}

const VendorList: React.FC = () => {
  // --- UI / filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>("vendorId");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data state
  const [products, setProducts] = useState<ProductItem[]>([]);

  // column visibility + ordering
  const [allColumns, setAllColumns] = useState<Column[]>([
    { key: "vendorId", title: "Vendor ID", isSortable: true, isSelected: true },
    { key: "vendorName", title: "Vendor Name", isSortable: true, isSelected: true },
    { key: "owner", title: "Owner", isSortable: true, isSelected: true },
    { key: "department", title: "Department", isSortable: true, isSelected: true },
    { key: "activeAgreementSpend", title: "Active Agreement Spend", isSortable: true, isSelected: true },
    { key: "actions", title: "Action", isSortable: false, isSelected: true },
  ]);

  const visibleColumns = allColumns.filter((c) => c.isSelected);

  // --- Vendor Modal state
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

  // --- Add Vendor Modal state
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [vendorProductName, setVendorProductName] = useState("");
  const [vendorProductLink, setVendorProductLink] = useState("");
  const [vendorProductType, setVendorProductType] = useState<"License Based" | "Usage Based">(
    "License Based"
  );
  // New fields for the modal
  const [vendorOwner, setVendorOwner] = useState("");
  const [vendorDepartment, setVendorDepartment] = useState("");

  const [addSuccess, setAddSuccess] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<ProductItem | null>(null);


  // --- Actions Dropdown state
  const [openActionId, setOpenActionId] = useState<string | number | null>(null);

  // --- Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);

  // Delete vendor success popup state
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [lastDeletedProduct, setLastDeletedProduct] = useState<ProductItem | null>(null);


  const toggleActionMenu = (id: string | number) => {
    setOpenActionId(openActionId === id ? null : id);
  };

  // Open delete confirmation modal
  const handleDelete = (product: ProductItem) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
    setOpenActionId(null);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      await jiraService.deleteVendorProduct(Number(productToDelete.id));

      // Remove from UI
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));

      // 🔹 Save info for success message
      setLastDeletedProduct(productToDelete);
      setDeleteSuccess(true);

      console.log(`Deleted product with id: ${productToDelete.id}`);
    } catch (err) {
      console.error("Failed to delete vendor product", err);
      alert("Failed to delete vendor product. Please try again.");
    } finally {
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const openAddVendorModal = () => {
    setVendorName("");
    setVendorProductName("");
    setVendorProductLink("");
    setVendorProductType("License Based");
    // Reset new fields
    setVendorOwner("");
    setVendorDepartment("");
    setIsAddVendorModalOpen(true);
  };

  const closeAddVendorModal = () => {
    setIsAddVendorModalOpen(false);
  };

  // Add this function to open the vendor modal
  const openVendorDetailsModal = (vendorName: string) => {
    setSelectedVendor(vendorName);
    setIsVendorModalOpen(true);
  };

  // Add this function to close the vendor modal
  const closeVendorDetailsModal = () => {
    setIsVendorModalOpen(false);
    setSelectedVendor(null);
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
        owner: vendorOwner.trim() || undefined,
        department: vendorDepartment.trim() || undefined,
      });
      // Check if vendor already exists to avoid duplication
      const existingVendorIndex = products.findIndex(p => p.vendorName === vendorName.trim());
      
      if (existingVendorIndex >= 0) {
        // Update existing vendor
        const updatedProducts = [...products];
        updatedProducts[existingVendorIndex] = {
          ...updatedProducts[existingVendorIndex],
          owner: vendorOwner || "John Doe",
          department: vendorDepartment || "IT Department",
          activeAgreementSpend: "$10,000"
        };
        setProducts(updatedProducts);
      } else {
        // Add new vendor
        setProducts((prev) => [...prev, {
          ...created,
          vendorId: `V-${created.id}`,
          vendorName: created.nameOfVendor,
          owner: vendorOwner || "John Doe",
          department: vendorDepartment || "IT Department",
          activeAgreementSpend: "$10,000"
        }]);
      }

      // 🔹 Save info for success message
      setLastAddedProduct({
        ...created,
        vendorId: `V-${created.id}`,
        vendorName: created.nameOfVendor,
        owner: vendorOwner || "John Doe",
        department: vendorDepartment || "IT Department",
        activeAgreementSpend: "$10,000"
      });
      setAddSuccess(true);

      closeAddVendorModal();
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

        // 1. Fetch all vendors from the new vendor profiles system
        const vendors = await jiraService.getVendorProfilesVendors();

        if (!Array.isArray(vendors)) {
          throw new Error("Failed to fetch vendors");
        }

        // 2. Create a unique list of vendors with their products
        const vendorMap: Record<string, ProductItem> = {};

        // 3. Fetch products for each vendor using the new vendor profiles system
        const productPromises = vendors.map(async (vendorName: string) => {
          try {
            // Get vendor profiles for this vendor
            const vendorProfiles = await jiraService.getVendorProfileDTOsByName(vendorName);
            
            if (Array.isArray(vendorProfiles) && vendorProfiles.length > 0) {
              // Take the first profile for each vendor to avoid duplicates
              const firstProfile = vendorProfiles[0];
              vendorMap[vendorName] = {
                id: firstProfile.vendorId?.toString() || "",
                productName: firstProfile.productName || "",
                nameOfVendor: firstProfile.vendorName || vendorName,
                productType: firstProfile.productType as 'license' | 'usage' || 'license',
                vendorId: `V-${firstProfile.vendorId}`,
                vendorName: firstProfile.vendorName || vendorName,
                owner: firstProfile.vendorOwner || "John Doe",
                department: firstProfile.department || "IT Department",
                activeAgreementSpend: "$10,000", // Dummy data
              };
            }
            return [];
          } catch (e) {
            console.warn(`Failed to fetch vendor profiles for vendor ${vendorName}`, e);
            return [];
          }
        });

        await Promise.all(productPromises);
        const uniqueVendors = Object.values(vendorMap);

        console.log("Fetched unique vendors:", uniqueVendors);
        setProducts(uniqueVendors);
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
      const vendorId = (p.vendorId || "").toLowerCase();
      const vendorName = (p.vendorName || "").toLowerCase();
      const owner = (p.owner || "").toLowerCase();
      const department = (p.department || "").toLowerCase();
      const agreementSpend = (p.activeAgreementSpend || "").toLowerCase();

      return searchTerm === "" || 
             vendorId.includes(term) || 
             vendorName.includes(term) || 
             owner.includes(term) || 
             department.includes(term) || 
             agreementSpend.includes(term);
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

  const getCellValue = (
    product: ProductItem,
    colKey: string,
    index: number
  ): React.ReactNode => {
    switch (colKey) {
      case "vendorId":
        return product.vendorId || "-";
      case "vendorName":
        // Make vendor name clickable
        return (
          <button
            onClick={() => openVendorDetailsModal(product.vendorName || "")}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            {product.vendorName || "-"}
          </button>
        );
      case "owner":
        return product.owner || "N/A";
      case "department":
        return product.department || "N/A";
      case "activeAgreementSpend":
        return product.activeAgreementSpend || "$0";
      case "actions":
        return (
          <div className="relative">
            <button
              aria-label="Open action menu"
              onClick={(e) => {
                e.stopPropagation();
                toggleActionMenu(product.id);
              }}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >

              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {openActionId === product.id && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                <div className="py-1">

                  <button
                    aria-label={`Delete ${product.productName} from ${product.nameOfVendor}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(product);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-red-400"
                  >

                    {/* icon + text */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
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

          {deleteSuccess && lastDeletedProduct && (
            <div className="mb-4 flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-700 dark:bg-green-900/40 dark:text-green-200">
              <span>
                <span className="font-semibold">
                  {lastDeletedProduct.productName || "Product"}
                </span>{" "}
                from vendor{" "}
                <span className="font-semibold">
                  {lastDeletedProduct.nameOfVendor || "Vendor"}
                </span>{" "}
                has been deleted successfully.
              </span>

              <button
                type="button"
                onClick={() => setDeleteSuccess(false)}
                className="ml-4 text-green-900 hover:text-green-700 dark:text-green-300 dark:hover:text-green-100 font-semibold"
              >
                ×
              </button>
            </div>
          )}

          {addSuccess && lastAddedProduct && (
            <div className="mb-4 flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-700 dark:bg-green-900/40 dark:text-green-200">
              <span>
                <span className="font-semibold">
                  {lastAddedProduct.productName || "Product"}
                </span>{" "}
                has been added successfully under vendor{" "}
                <span className="font-semibold">
                  {lastAddedProduct.nameOfVendor || "Vendor"}
                </span>.
              </span>

              <button
                type="button"
                onClick={() => setAddSuccess(false)}
                className="ml-4 text-green-900 hover:text-green-700 dark:text-green-300 dark:hover:text-green-100 font-semibold"
              >
                ×
              </button>
            </div>
          )}


          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor List</h1>
            <div className="flex space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search vendors..."
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
                onClick={openAddVendorModal}
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
                            {getCellValue(product, col.key, idx)}
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
            Showing {filteredProducts.length} of {products.length} vendors
          </div>
        </div>
      </div>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={isAddVendorModalOpen}
        onClose={closeAddVendorModal}
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

            {/* Owner */}
            <div className="mt-4">
              <label
                htmlFor="vendor-owner"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
              >
                Owner
              </label>
              <input
                id="vendor-owner"
                type="text"
                value={vendorOwner}
                onChange={(e) => setVendorOwner(e.target.value)}
                placeholder="Enter owner name"
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            {/* Department */}
            <div className="mt-4">
              <label
                htmlFor="vendor-department"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
              >
                Department
              </label>
              <input
                id="vendor-department"
                type="text"
                value={vendorDepartment}
                onChange={(e) => setVendorDepartment(e.target.value)}
                placeholder="Enter department"
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
            <button
              onClick={closeAddVendorModal}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        className="max-w-[450px] p-6"
      >
        <div className="flex flex-col">
          <h5 className="mb-3 font-semibold text-gray-800 text-lg dark:text-white/90">
            Delete Vendor Product
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete{" "}
            <span className="font-semibold">
              {productToDelete?.productName || "this product"}
            </span>{" "}
            from vendor{" "}
            <span className="font-semibold">
              {productToDelete?.nameOfVendor || "-"}
            </span>
            ?
            <br />
            This action cannot be undone.
          </p>

          <div className="flex items-center gap-3 mt-6 sm:justify-end">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setProductToDelete(null);
              }}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              type="button"
              className="flex w-full justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 sm:w-auto"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Vendor Details Modal */}
      {selectedVendor && (
        <VendorListModal
          vendorName={selectedVendor}
          isOpen={isVendorModalOpen}
          onClose={closeVendorDetailsModal}
        />
      )}
    </>
  );
};

export default VendorList;