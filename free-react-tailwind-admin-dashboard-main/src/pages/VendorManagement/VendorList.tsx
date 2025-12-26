import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import PageMeta from "../../components/common/PageMeta";
import { jiraService, ProductItem } from "../../services/jiraService";
import { Modal } from "../../components/ui/modal/index.ts";
import VendorListModal from "./VendorListModal";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import SuccessToast2 from "../../components/ui/toast/SuccessToast2";

interface Column {
  key: string;
  title: string;
  isSortable: boolean;
  isSelected: boolean;
}

// Add cache outside the component
const vendorDataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Define vendor types similar to agreement statuses
type VendorType = "All Vendors" | "Software" | "Hardware" | "Services" | "Cloud";

const VendorList: React.FC = () => {
  const navigate = useNavigate();
  const { userOrganizationName, userDepartmentName, userData } = useAuth(); // Add userData to get user info
  // --- UI / filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>("vendorId");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // --- Data state
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [vendorSuggestions, setVendorSuggestions] = useState<string[]>([]); // For autocomplete
  const [showVendorSuggestions, setShowVendorSuggestions] = useState(false); // For autocomplete

  // Filter states
  const [filterDepartment, setFilterDepartment] = useState("");

  // Mock departments data - in a real app, this would come from an API
  const departments = useMemo(() => {
    // If user has department info, use that, otherwise provide default departments
    if (userData?.department?.name) {
      return [userData.department.name];
    }
    return ["IT Department", "Finance", "HR", "Marketing", "Operations", "Sales"];
  }, [userData]);

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

  const [addSuccess, setAddSuccess] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<ProductItem | null>(null);
  
  // State for toast notification
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Function to handle vendor name input with autocomplete
  const handleVendorNameChange = (value: string) => {
    setVendorName(value);
    
    if (value.length > 1) { // Only show suggestions after 2 characters
      // Filter vendor names that match the input
      const filtered = products
        .map(p => p.vendorName)
        .filter((name): name is string => name !== undefined)
        .filter(name => name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5); // Limit to 5 suggestions
        
      setVendorSuggestions(filtered);
      setShowVendorSuggestions(true);
    } else {
      setShowVendorSuggestions(false);
    }
  };

  // Function to select a vendor from suggestions
  const selectVendor = (vendorName: string) => {
    setVendorName(vendorName);
    setShowVendorSuggestions(false);
  };

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
    // Reset autocomplete state
    setVendorSuggestions([]);
    setShowVendorSuggestions(false);
    setIsAddVendorModalOpen(true);
  };

  const closeAddVendorModal = () => {
    setIsAddVendorModalOpen(false);
    setVendorName("");
    setVendorProductName("");
    setVendorProductLink("");
    setVendorProductType("License Based");
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
        // Use logged-in user's organization and department instead of manual input
        owner: userOrganizationName || undefined,
        department: userDepartmentName || undefined,
      });
      
      // Calculate total spend for the newly added vendor
      let totalSpend = 0;
      try {
        // Get ALL vendor profiles for this vendor using DTOs to get product information
        const vendorProfiles = await jiraService.getVendorProfileDTOsByName(vendorName.trim());
        
        if (Array.isArray(vendorProfiles)) {
          // Process all products for this vendor
          for (const profile of vendorProfiles) {
            try {
              // Only process if we have product information
              if (profile.productName) {
                const contracts = await jiraService.getCompletedContractsByVendorAndProduct(
                  vendorName.trim(), 
                  profile.productName
                );
                
                if (Array.isArray(contracts)) {
                  for (const contract of contracts) {
                    // Fetch proposals to get the final total cost
                    try {
                      const proposals = await jiraService.getProposalsByIssueKey(contract.jiraIssueKey);
                      
                      if (Array.isArray(proposals) && proposals.length > 0) {
                        // Find the final proposal for total spend
                        const finalProposal = proposals.find((p: any) => p.isFinal);
                        if (finalProposal) {
                          totalSpend += finalProposal.totalCost || 0;
                        } else {
                          // If no final proposal, use the last proposal's total cost
                          const lastProposal = proposals[proposals.length - 1];
                          totalSpend += lastProposal.totalCost || 0;
                        }
                      }
                    } catch (proposalError) {
                      console.error('Failed to fetch proposals for contract:', contract.jiraIssueKey, proposalError);
                    }
                  }
                }
              }
            } catch (contractError) {
              console.error('Failed to fetch contracts for product:', profile.productName, contractError);
            }
          }
        }
      } catch (error) {
        console.error('Failed to calculate total spend for vendor:', vendorName.trim(), error);
      }
      
      // Check if vendor already exists to avoid duplication
      const existingVendorIndex = products.findIndex(p => p.vendorName === vendorName.trim());
      
      if (existingVendorIndex >= 0) {
        // Update existing vendor with calculated total spend
        const updatedProducts = [...products];
        updatedProducts[existingVendorIndex] = {
          ...updatedProducts[existingVendorIndex],
          owner: userOrganizationName || updatedProducts[existingVendorIndex].owner || "John Doe",
          department: userDepartmentName || updatedProducts[existingVendorIndex].department || "IT Department",
          activeAgreementSpend: `$${totalSpend.toLocaleString()}`
        };
        setProducts(updatedProducts);
      } else {
        // Add new vendor
        setProducts((prev) => [...prev, {
          ...created,
          vendorId: `V-${created.id}`,
          vendorName: created.nameOfVendor,
          owner: userOrganizationName || "John Doe",
          department: userDepartmentName || "IT Department",
          activeAgreementSpend: `$${totalSpend.toLocaleString()}`
        }]);
      }

      closeAddVendorModal();
      
      // Navigate with success state
      navigate('/vendor-management/vendors', { state: { toastMessage: `Vendor ${vendorName.trim()} added successfully!`, toastType: 'success' } });
    } catch (err: any) {
      console.error("Failed to create vendor", err);
      
      // Navigate with error state
      navigate('/vendor-management/vendors', { state: { toastMessage: 'Failed to create vendor. Please try again.', toastType: 'error' } });
    }
  };

  // Fetch vendor names for autocomplete when component mounts
  useEffect(() => {
    const fetchVendorNames = async () => {
      try {
        const vendors = await jiraService.getVendorProfilesVendors();
        // We'll use the products state which already contains vendor names
      } catch (err) {
        console.error("Failed to fetch vendor names for autocomplete", err);
      }
    };

    fetchVendorNames();
  }, []);

  // Get location state for toast messages
  const location = useLocation();
  
  // Handle toast message from navigation state
  useEffect(() => {
    const { toastMessage, toastType } = location.state || {};
    if (toastMessage) {
      // Clear the state to avoid showing the toast on page refresh
      window.history.replaceState({}, document.title);
      
      // Set toast data
      setToastMessage(toastMessage);
      setToastType((toastType as 'success' | 'error') || 'success');
      setShowToast(true);
      
      // Auto-hide toast after 3 seconds
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      
      // Clean up timer
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Function to get cached data or fetch new data
  const getCachedOrFetch = async (key: string, fetchFn: () => Promise<any>) => {
    const cached = vendorDataCache.get(key);
    const now = Date.now();
    
    // Check if cache exists and is still valid
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`Using cached data for ${key}`);
      return cached.data;
    }
    
    // Fetch fresh data
    console.log(`Fetching fresh data for ${key}`);
    const data = await fetchFn();
    
    // Cache the data
    vendorDataCache.set(key, { data, timestamp: now });
    return data;
  };

  // Fetch data with caching
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use cached data for vendor profiles
        const vendors = await getCachedOrFetch('vendorProfiles', () => jiraService.getVendorProfilesVendors());

        if (!Array.isArray(vendors)) {
          throw new Error("Failed to fetch vendors");
        }

        // Create a unique list of vendors with their products
        const vendorMap: Record<string, ProductItem> = {};

        // Fetch products for each vendor using the new vendor profiles system
        const productPromises = vendors.map(async (vendorName: string) => {
          try {
            // Use cached data for vendor profiles
            const vendorProfiles = await getCachedOrFetch(`vendorProfiles_${vendorName}`, () => 
              jiraService.getVendorProfileDTOsByName(vendorName)
            );
            
            if (Array.isArray(vendorProfiles) && vendorProfiles.length > 0) {
              // Create cache key for this vendor's total spend calculation
              const cacheKey = `totalSpend_${vendorName}`;
              
              // Check if we have cached total spend data
              let totalSpend = 0;
              const cachedSpend = vendorDataCache.get(cacheKey);
              const now = Date.now();
              
              if (cachedSpend && (now - cachedSpend.timestamp) < CACHE_DURATION) {
                totalSpend = cachedSpend.data;
              } else {
                // Calculate total spend for this vendor by fetching all contracts for all products
                const contractPromises: Promise<any>[] = [];
                
                // Process all products for this vendor in parallel
                for (const profile of vendorProfiles) {
                  // Only process if we have product information
                  if (profile.productName) {
                    contractPromises.push(
                      jiraService.getCompletedContractsByVendorAndProduct(vendorName, profile.productName)
                    );
                  }
                }
                
                // Fetch all contracts in parallel
                const contractResults = await Promise.all(contractPromises);
                
                // Process all contracts to calculate total spend
                const proposalPromises: Promise<any>[] = [];
                const contractsToProcess: any[] = [];
                
                contractResults.forEach(contracts => {
                  if (Array.isArray(contracts)) {
                    contracts.forEach(contract => {
                      contractsToProcess.push(contract);
                      proposalPromises.push(jiraService.getProposalsByIssueKey(contract.jiraIssueKey));
                    });
                  }
                });
                
                // Fetch all proposals in parallel
                const proposalResults = await Promise.all(proposalPromises);
                
                // Calculate total spend from proposals
                for (let i = 0; i < proposalResults.length; i++) {
                  const proposals = proposalResults[i];
                  if (Array.isArray(proposals) && proposals.length > 0) {
                    // Find the final proposal for total spend
                    const finalProposal = proposals.find((p: any) => p.isFinal);
                    if (finalProposal) {
                      totalSpend += finalProposal.totalCost || 0;
                    } else {
                      // If no final proposal, use the last proposal's total cost
                      const lastProposal = proposals[proposals.length - 1];
                      totalSpend += lastProposal.totalCost || 0;
                    }
                  }
                }
                
                // Cache the calculated total spend
                vendorDataCache.set(cacheKey, { data: totalSpend, timestamp: now });
              }
              
              // Use the first profile for vendor details but with calculated total spend
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
                activeAgreementSpend: `$${totalSpend.toLocaleString()}`, // Actual calculated total spend
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
  
  // Filtering & Sorting with better performance
  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    // Apply text search directly to all products since we removed tabs
    let searched = products;
    if (term) {
      searched = products.filter((p) => {
        return (
          (p.vendorId || "").toLowerCase().includes(term) || 
          (p.vendorName || "").toLowerCase().includes(term) || 
          (p.owner || "").toLowerCase().includes(term) || 
          (p.department || "").toLowerCase().includes(term) || 
          (p.activeAgreementSpend || "").toLowerCase().includes(term)
        );
      });
    }

    // Apply department filter
    if (filterDepartment) {
      searched = searched.filter(product => 
        product.department?.toLowerCase() === filterDepartment.toLowerCase()
      );
    }

    // Sort products if needed
    if (sortField) {
      searched = [...searched].sort((a, b) => {
        // Special handling for activeAgreementSpend sorting
        if (sortField === "activeAgreementSpend") {
          // Extract numeric value from formatted string like "$10,000"
          const aVal = parseFloat(a.activeAgreementSpend?.replace(/[^0-9.-]+/g,"") || "0");
          const bVal = parseFloat(b.activeAgreementSpend?.replace(/[^0-9.-]+/g,"") || "0");
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }
        
        // @ts-ignore
        const aVal = String(a[sortField] || "").toLowerCase();
        // @ts-ignore
        const bVal = String(b[sortField] || "").toLowerCase();
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }

    return searched;
  }, [products, searchTerm, sortField, sortDirection, filterDepartment]);

  // Reset all filters
  const resetFilters = () => {
    setFilterDepartment("");
    setSearchTerm("");
  };

  // Draggable Header Component
  const DraggableHeader: React.FC<{
    column: Column;
    index: number;
    onSort: (key: string) => void;
    sortConfig: { key: string; direction: "asc" | "desc" } | null;
    onMove: (dragIndex: number, hoverIndex: number) => void;
  }> = ({ column, index, onSort, sortConfig, onMove }) => {
    const ref = React.useRef<HTMLTableCellElement>(null);
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
        className={`px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 ${isDragging ? "opacity-50" : ""
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
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {product.vendorName || "-"}
          </button>
        );
      case "owner":
        return product.owner || "N/A";
      case "department":
        return product.department || "N/A";
      case "activeAgreementSpend":
        return (
          <span className="font-medium">
            {product.activeAgreementSpend || "$0"}
          </span>
        );
      case "actions":
        return (
          <div className="relative">
            <button
              aria-label="Open action menu"
              onClick={(e) => {
                e.stopPropagation();
                toggleActionMenu(product.id);
              }}
              className="p-1 text-gray-500 hover:text-gray-700"
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
              <div className="absolute right-0 mt-1 w-36 bg-white rounded shadow z-50 border border-gray-200">
                <div className="py-1">
                  <button
                    aria-label={`Delete ${product.productName} from ${product.nameOfVendor}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(product);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
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

  // Function to export vendors to CSV
  const handleExportCsv = () => {
    if (filteredProducts.length === 0) {
      alert("No data to export.");
      return;
    }

    // Define CSV headers
    const headers = [
      "Vendor ID",
      "Vendor Name",
      "Product Name",
      "Product Type",
      "Product Link",
      "Owner",
      "Department",
      "Active Agreement Spend"
    ];

    // Map products to CSV rows
    const rows = filteredProducts.map(product => [
      product.vendorId || "",
      product.vendorName || "",
      product.productName || "",
      product.productType || "",
      product.productLink || "",
      product.owner || "",
      product.department || "",
      product.activeAgreementSpend?.replace('$', '') || "0"
    ]);

    // Escape cell values and join them
    const escapeCell = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const csvContent = [
      headers.map(escapeCell).join(","),
      ...rows.map(row => row.map(String).map(escapeCell).join(","))
    ].join("\r\n");

    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    
    link.href = url;
    link.download = `vendors-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --------- loading / error / normal return all INSIDE VendorList ---------
  if (loading) {
    return (
      <>
        <PageMeta title="Vendor List" description="List of all vendor products" />
        <div className="p-6">
          <div className="bg-white rounded shadow-sm p-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Vendors
            </h1>
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
        <div className="p-6">
          <div className="bg-white rounded shadow-sm p-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Vendors
            </h1>
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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
      {/* Show toast if needed */}
      {showToast && (
        <SuccessToast2 
          message={toastMessage} 
          type={toastType}
          onClose={() => setShowToast(false)} 
        />
      )}
      <div className="p-6">
        <div className="bg-white rounded shadow-sm p-6">

          {/* Header with Add Vendor Button */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Vendors
            </h1>
            <button
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={openAddVendorModal}
            >
              + Add Vendor
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search vendors..."
                  className="pl-10 pr-4 py-2 text-sm border rounded-md w-64 border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium border rounded-md bg-white hover:bg-gray-50 border-gray-300 ${
                    filterDepartment ? "text-indigo-600 border-indigo-600" : ""
                  }`}
                >
                  Filters
                  {filterDepartment && (
                    <>
                      <span className="ml-2 w-2 h-2 bg-indigo-600 rounded-full" />
                      <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
                        1
                      </span>
                    </>
                  )}
                </button>

                {/* Filters panel with department dropdown */}
                {showFilters && (
                  <div className="absolute left-0 mt-2 p-4 border rounded-md bg-white text-sm w-72 z-10 shadow-lg">
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

                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600">
                        Department
                      </label>
                      <select
                        className="w-full border rounded px-2 py-1 text-xs border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                      >
                        <option value="">All Departments</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
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

          {/* Table */}
          <DndProvider backend={HTML5Backend}>
            <div className="border border-gray-200 rounded-lg bg-white shadow-sm" style={{ height: '65vh' }}>
              <div className="overflow-y-auto" style={{ height: '100%' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 && (
                      <TableRow>
                        <TableCell
                          isHeader={false}
                          className="px-6 py-8 text-center text-gray-500"
                          colSpan={visibleColumns.length}
                        >
                          No vendors found for this view.
                        </TableCell>
                      </TableRow>
                    )}

                    {filteredProducts.map((product, idx) => (
                      <TableRow
                        key={product.id || idx}
                        className="hover:bg-indigo-50/40 transition-colors"
                      >
                        {visibleColumns.map((col) => (
                          <TableCell
                            key={`${product.id || idx}-${col.key}`}
                            className="px-4 py-3 align-top text-gray-900 text-center"
                            isHeader={false}
                          >
                            {getCellValue(product, col.key, idx)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </DndProvider>

          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredProducts.length} of {products.length} vendors
          </div>
        </div>
      </div>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={isAddVendorModalOpen}
        onClose={closeAddVendorModal}
        className="max-w-[550px] p-6"
      >
        <div className="flex flex-col overflow-y-auto custom-scrollbar">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-lg">
              Add Vendor
            </h5>
            <p className="text-sm text-gray-500">
              Add a new vendor and its associated product details.
            </p>
          </div>

          <div className="mt-6">
            {/* Vendor Name */}
            <div className="mt-4 relative">
              <label
                htmlFor="vendor-name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Vendor Name
              </label>
              <input
                id="vendor-name"
                type="text"
                value={vendorName}
                onChange={(e) => handleVendorNameChange(e.target.value)}
                onFocus={() => vendorName.length > 0 && setShowVendorSuggestions(true)}
                onBlur={() => setTimeout(() => setShowVendorSuggestions(false), 200)} // Delay to allow click on suggestions
                placeholder="Enter or select vendor name"
                className="h-10 w-full rounded border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/10"
              />
              
              {/* Vendor Suggestions Dropdown */}
              {showVendorSuggestions && vendorSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded border bg-white shadow">
                  <ul className="max-h-40 overflow-auto rounded py-1 text-sm ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {vendorSuggestions.map((suggestion) => (
                      <li
                        key={suggestion}
                        className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-indigo-600 hover:text-white"
                        onMouseDown={() => selectVendor(suggestion)} // Use onMouseDown to prevent blur before selection
                      >
                        <span className="block truncate">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Product Name */}
            <div className="mt-4">
              <label
                htmlFor="product-name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Product Name
              </label>
              <input
                id="product-name"
                type="text"
                value={vendorProductName}
                onChange={(e) => setVendorProductName(e.target.value)}
                placeholder="Enter product name"
                className="h-10 w-full rounded border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/10"
              />
            </div>

            {/* Product Link */}
            <div className="mt-4">
              <label
                htmlFor="product-link"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Product Link
              </label>
              <input
                id="product-link"
                type="url"
                value={vendorProductLink}
                onChange={(e) => setVendorProductLink(e.target.value)}
                placeholder="https://example.com/product"
                className="h-10 w-full rounded border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/10"
              />
            </div>

            {/* Product Type */}
            <div className="mt-4">
              <label
                htmlFor="product-type"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Product Type
              </label>
              <select
                id="product-type"
                value={vendorProductType}
                onChange={(e) =>
                  setVendorProductType(e.target.value as "License Based" | "Usage Based")
                }
                className="h-10 w-full rounded border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 focus:border-indigo-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/10"
              >
                <option value="License Based">License Based</option>
                <option value="Usage Based">Usage Based</option>
              </select>
            </div>

            {/* Removed Owner and Department fields as they are now auto-populated from user's organization and department */}
          </div>

          <div className="flex items-center gap-3 mt-8 modal-footer sm:justify-end">
            <button
              onClick={closeAddVendorModal}
              type="button"
              className="flex w-full justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveVendor}
              type="button"
              className="flex w-full justify-center rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 sm:w-auto"
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
        className="max-w-[400px] p-6"
      >
        <div className="flex flex-col">
          <h5 className="mb-2 font-semibold text-gray-800 text-lg">
            Delete Vendor Product
          </h5>
          <p className="text-sm text-gray-500">
            Are you sure you want to delete{" "}
            <span className="font-medium">
              {productToDelete?.productName || "this product"}
            </span>{" "}
            from vendor{" "}
            <span className="font-medium">
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
              className="flex w-full justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              type="button"
              className="flex w-full justify-center rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 sm:w-auto"
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