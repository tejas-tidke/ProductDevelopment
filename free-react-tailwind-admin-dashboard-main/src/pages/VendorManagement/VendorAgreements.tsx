 import React, { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// Import useAuth hook to access user details
import { useAuth } from "../../context/AuthContext";
import { jiraService } from '../../services/jiraService';
import { userApi } from '../../services/api';
import { PrimaryButton, SecondaryButton } from "../../components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import { PortalModal } from "../../components/ui/modal";
import SuccessToast2 from "../../components/ui/toast/SuccessToast2";

// Define the vendor profile response interface
interface VendorProfileResponse {
  vendorId?: number;
  vendorName?: string;
  vendorOwner?: string;
  department?: string;
  productName?: string;
  productType?: string;
}

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
  
  console.log("Contract duration raw value:", contract.contractDuration);
  console.log("Contract duration value:", contractDurationValue);
  console.log("Contract duration months:", contractDurationMonths);
  console.log("Is NaN check:", isNaN(parseInt(contractDurationValue)));
  console.log("Is 1 month contract:", contractDurationMonths === 1);
  
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
                                  
    console.log("Second parsing - Contract duration value:", contractDurationValue);
    console.log("Second parsing - Contract duration months:", contractDurationMonths);
                                  
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
  
  // Special handling for manual agreements (which have "AGREEMENT-" prefix in jiraIssueKey)
  const isManualAgreement = contract.jiraIssueKey && contract.jiraIssueKey.startsWith("AGREEMENT-");
  
  if (endDateValue !== "N/A") {
    const endDate = new Date(endDateValue);
    const today = new Date();
    const timeDiff = endDate.getTime() - today.getTime();
    const daysUntilExpiration = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    console.log("End date:", endDate);
    console.log("Today:", today);
    console.log("Days until expiration:", daysUntilExpiration);
    
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
        console.log("Setting status to Long-Term Contracts based on duration:", contractDurationMonths);
      } else if (contractDurationMonths === 1) {
        // Subscription contracts (exactly 1 month duration)
        status = "Subscriptions";
        console.log("Setting status to Subscriptions based on duration:", contractDurationMonths);
      } else {
        // All other contracts default to Active
        status = "Active";
        console.log("Setting status to Active based on duration:", contractDurationMonths);
      }
    }
  } else {
    // If no end date, classify based on duration only
    console.log("No end date, classifying based on duration only");
    if (contractDurationMonths >= 12) {
      status = "Long-Term Contracts";
      console.log("Setting status to Long-Term Contracts (no end date) based on duration:", contractDurationMonths);
    } else if (contractDurationMonths === 1) {
      status = "Subscriptions";
      console.log("Setting status to Subscriptions (no end date) based on duration:", contractDurationMonths);
    } else {
      status = "Active";
      console.log("Setting status to Active (no end date) based on duration:", contractDurationMonths);
    }
  }
  
  // Override status for manual agreements to ensure proper categorization
  if (isManualAgreement) {
    console.log("Manual agreement detected. Duration months:", contractDurationMonths);
    if (contractDurationMonths === 1) {
      status = "Subscriptions";
    } else if (contractDurationMonths >= 12) {
      status = "Long-Term Contracts";
    } else {
      status = "Active";
    }
    console.log("Manual agreement detected. Overriding status to:", status);
  }
  
  console.log("Determined status:", status);

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
  const navigate = useNavigate();
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
  const [formProductName, setFormProductName] = useState("");
  const [formType, setFormType] = useState("Contract");
  const [formCategory, setFormCategory] = useState("Software");
  const [formStartDate, setFormStartDate] = useState("");
  const [formTotalCost, setFormTotalCost] = useState("");
  const [formContractDuration, setFormContractDuration] = useState("1"); // Default to 1 month
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
    
  // State for toast notification
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Vendor and product dropdown states
  const [vendors, setVendors] = useState<string[]>([]);
  const [products, setProducts] = useState<{ id: string; productName: string; productType?: 'license' | 'usage' }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const vendorDropdownRef = useRef<HTMLDivElement | null>(null);
  const productDropdownRef = useRef<HTMLDivElement | null>(null);
  const userDropdownRef = useRef<HTMLDivElement | null>(null);

  // Load vendors and users when the add modal is opened
  useEffect(() => {
    const loadVendors = async () => {
      if (!showAddModal) return;
      try {
        setLoadingVendors(true);
        console.log('Fetching vendors from VendorProfile system');
        const list: string[] = await jiraService.getVendorProfilesVendors();
        console.log('Received vendors:', list);
        if (Array.isArray(list)) setVendors(list);
      } catch (err) {
        console.error('Error loading vendors', err);
      } finally {
        setLoadingVendors(false);
      }
    };
    
    const loadUsers = async () => {
      if (!showAddModal) return;
      try {
        setLoadingUsers(true);
        console.log('Fetching users from user API');
        const userList: { id: string; name: string; email: string }[] = await userApi.getAllUsers();
        console.log('Received users:', userList);
        if (Array.isArray(userList)) setUsers(userList);
      } catch (err) {
        console.error('Error loading users', err);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    loadVendors();
    loadUsers();
  }, [showAddModal]);

  // Load products when vendor is selected
  useEffect(() => {
    const loadProducts = async () => {
      if (!formVendor || !showAddModal) return;

      try {
        setLoadingProducts(true);
        console.log('Fetching products for vendor:', formVendor);
        const vendorProfiles: VendorProfileResponse[] = await jiraService.getVendorProfileDTOsByName(formVendor);
        console.log('Received vendor profiles:', vendorProfiles);
        if (Array.isArray(vendorProfiles)) {
          // Convert vendor profiles to product items
          const productList = vendorProfiles.map(profile => ({
            id: profile.vendorId?.toString() || '',
            productName: profile.productName || '',
            productType: (profile.productType as 'license' | 'usage') || undefined
          }));
          console.log('Converted product list:', productList);
          setProducts(productList);
        }
      } catch (err) {
        console.error('Error loading products', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, [formVendor, showAddModal]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(e.target as Node)) {
        setShowVendorDropdown(false);
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch contract details from backend (same as in procurement-renewal.tsx)
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
  
  // Clear navigation state on component mount to prevent showing old toasts
  useEffect(() => {
    if (location.state && Object.keys(location.state).length > 0) {
      window.history.replaceState({}, document.title);
    }
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

  const resetForm = () => {
    // Reset form fields
    setFormVendor("");
    setFormProductName("");
    setFormOwner("");
    setFormType("Contract");
    setFormCategory("Software");
    setFormStartDate("");
    setFormTotalCost("");
    setFormContractDuration("1"); // Reset to default 1 month
    
    // Reset dropdown states
    setShowVendorDropdown(false);
    setShowProductDropdown(false);
    setShowUserDropdown(false);
    setVendors([]);
    setProducts([]);
    setUsers([]);
  };

  const handleAddAgreement = async (e: React.FormEvent) => {

  
  e.preventDefault();

  if (!formVendor || !formProductName || !formOwner || !formStartDate || !formTotalCost) {
    setErrorMessage("Please fill in all required fields.");
    setTimeout(() => setErrorMessage(""), 5000); // Hide after 5 seconds
    return;
  }

  setIsSubmitting(true);
  try {
    
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
      productName: formProductName,
      requesterName: formOwner,
      vendorContractType: formType,
      contractDuration: formContractDuration,
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
    
    console.log("Sending contract data:", contractData);

    // Send to backend
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/jira/contracts/manual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contractData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create agreement: ${response.status} ${response.statusText}`);
    }

    const updatedResponse = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/jira/contracts/completed`
    );
    const contracts: ContractDetails[] = await updatedResponse.json();

    setAgreements(
      contracts.map((contract, index) =>
        mapContractToAgreement(contract, index)
      )
    );

    // reset form and dropdown states
    resetForm();
    setShowAddModal(false);
    
    // reset form and dropdown states
    resetForm();
    setShowAddModal(false);
    
    // Show success toast in place
    setToastMessage(`Agreement for ${formVendor} created successfully!`);
    setToastType('success');
    setShowToast(true);
    
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  } catch (error) {
    console.error("Error creating agreement:", error);
    
    // Show error toast in place
    setToastMessage('Failed to create agreement. Please try again.');
    setToastType('error');
    setShowToast(true);
    
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  } finally {
    setIsSubmitting(false);
  }
};

  const handleExportCsv = () => {
    if (filteredAgreements.length === 0) {
      setErrorMessage("No data to export.");
      setTimeout(() => setErrorMessage(""), 5000); // Hide after 5 seconds
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
      {/* Show toast if needed */}
      {showToast && (
        <SuccessToast2 
          message={toastMessage} 
          type={toastType}
          onClose={() => setShowToast(false)} 
        />
      )}
      {/* Remove the conditional rendering for the detail page since we're removing the modal */}
      <>          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-300">
              <h1 className="text-2xl font-semibold text-gray-900">
                Agreements
              </h1>
              <PrimaryButton
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                + Add Agreement
              </PrimaryButton>
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
                <SecondaryButton
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
                </SecondaryButton>

                {/* Simple filters panel */}
                {showFilters && (
                  <div className="absolute left-0 mt-2 p-3 border rounded-md bg-white text-sm w-72 z-20 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        Filters
                      </h3>
                      <div className="flex gap-2 ml-4">
                        <SecondaryButton
                          onClick={resetFilters}
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          Reset
                        </SecondaryButton>
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
              <SecondaryButton
                onClick={handleExportCsv}
                className="inline-flex items-center px-3 py-2 text-sm font-medium border rounded-md bg-white hover:bg-gray-50 border-gray-300"
              >
                Export CSV
              </SecondaryButton>
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
   <div className="border border-gray-200 rounded-lg bg-white shadow-sm" style={{ height: '65vh' }}>

            <div className="overflow-y-auto" style={{ height: '100%' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredAgreements.length > 0 &&
                          selectedIds.length === filteredAgreements.length
                        }
                        onChange={toggleSelectAll}
                      />
                    </TableCell>
                    <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold ">
                      Agreement ID
                    </TableCell>
                    <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Vendor
                    </TableCell>
                    <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Agreement Owner
                    </TableCell>
                    <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Agreement Type
                    </TableCell>
                    <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Agreement Category
                    </TableCell>
                    <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Start Date
                    </TableCell>
                    <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      End Date
                    </TableCell>
                    <TableCell isHeader={true} className="px-4 py-2 text-right text-xs font-semibold text-gray-500">
                      Total Cost (USD)
                    </TableCell>
                    <TableCell isHeader={true} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Status
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgreements.map((agreement) => (
                    <TableRow
                      key={agreement.id}
                      className="hover:bg-indigo-50/40 transition-colors cursor-pointer"
                      onClick={() => navigate(`/vendor-management/contract`, { state: { agreement } })}
                    >
                      <TableCell isHeader={false} className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(agreement.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelectOne(agreement.id);
                          }}
                        />
                      </TableCell>
                      <TableCell isHeader={false} className="px-4 py-2 text-indigo-600 font-medium">
                        {agreement.id}
                      </TableCell>
                      <TableCell isHeader={false} className="px-4 py-2 text-gray-900">
                        {agreement.vendor}
                      </TableCell>
                      <TableCell isHeader={false} className="px-4 py-2 text-gray-900">
                        {agreement.owner}
                      </TableCell>
                      <TableCell isHeader={false} className="px-4 py-2 text-gray-900">
                        {agreement.type}
                      </TableCell>
                      <TableCell isHeader={false} className="px-4 py-2 text-gray-900">
                        {agreement.category}
                      </TableCell>
                      <TableCell isHeader={false} className="px-4 py-2 text-gray-900">
                        {formatDateHelper(agreement.startDate)}
                      </TableCell>
                      <TableCell isHeader={false} className="px-4 py-2 text-gray-900">
                        {formatDateHelper(agreement.endDate)}
                      </TableCell>
                      <TableCell isHeader={false} className="px-4 py-2 text-right text-gray-900 tabular-nums">
                        {agreement.totalCost}
                      </TableCell>
                      <TableCell isHeader={false} className="px-4 py-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${getStatusBadgeClasses(
                            agreement.status
                          )}`}
                        >
                          {agreement.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredAgreements.length === 0 && !loading && (
                    <TableRow>
                      <TableCell
                        isHeader={false}
                        className="px-4 py-6 text-center text-gray-500"
                        colSpan={10}
                      >
                        No agreements found for this view.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Add Agreement Modal (skeleton, keep your existing form inside) */}
          <PortalModal
            isOpen={showAddModal}
            onClose={() => {
              resetForm();
              setShowAddModal(false);
            }}
            title="Add New Agreement"
            size="2xl"
          >
            {/* Add Agreement Form */}
            <div className="px-6 py-6 sm:px-8 sm:py-8">
                      {successMessage && (
                        <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-md border border-green-200">
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>{successMessage}</span>
                          </div>
                        </div>
                      )}
                      {errorMessage && (
                        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md border border-red-200">
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{errorMessage}</span>
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleAddAgreement} className="space-y-5">
                        <div>
                          <label
                            htmlFor="vendor"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Vendor *
                          </label>
                          <div className="relative" ref={vendorDropdownRef}>
                            <input
                              id="vendor"
                              value={formVendor}
                              onChange={(e) => {
                                setFormVendor(e.target.value);
                                setShowVendorDropdown(true);
                              }}
                              onFocus={() => setShowVendorDropdown(true)}
                              placeholder={loadingVendors ? 'Loading vendors...' : 'Start typing or click to see all vendors'}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              autoComplete="off"
                              required
                            />
                            {showVendorDropdown && (
                              <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white text-sm shadow-lg dark:border-gray-700 dark:bg-gray-900">
                                {(formVendor
                                  ? vendors.filter((v) =>
                                    v.toLowerCase().startsWith(formVendor.toLowerCase())
                                  )
                                  : vendors
                                ).map((v) => (
                                  <button
                                    type="button"
                                    key={v}
                                    onClick={() => {
                                      setFormVendor(v);
                                      setShowVendorDropdown(false);
                                      // Clear previous products when vendor changes
                                      setProducts([]);
                                      setFormProductName('');
                                    }}
                                    className="block w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                                  >
                                    {v}
                                  </button>
                                ))}
                                {(formVendor
                                  ? vendors.filter((v) =>
                                    v.toLowerCase().startsWith(formVendor.toLowerCase())
                                  )
                                  : vendors
                                ).length === 0 && (
                                    <div className="px-3 py-2 text-xs text-gray-400">
                                      No vendors found
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="productName"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Product Name *
                          </label>
                          <div className="relative" ref={productDropdownRef}>
                            <input
                              id="productName"
                              value={formProductName}
                              onChange={(e) => {
                                setFormProductName(e.target.value);
                                setShowProductDropdown(true);
                              }}
                              onFocus={() => setShowProductDropdown(true)}
                              placeholder={
                                loadingProducts
                                  ? 'Loading products...'
                                  : formVendor
                                    ? 'Start typing or click to see all products'
                                    : 'Select vendor first'
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              autoComplete="off"
                              disabled={!formVendor}
                              required
                            />
                            {showProductDropdown && !!formVendor && (
                              <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white text-sm shadow-lg dark:border-gray-700 dark:bg-gray-900">
                                {(formProductName
                                  ? products.filter((p) =>
                                    p.productName.toLowerCase().startsWith(formProductName.toLowerCase())
                                  )
                                  : products
                                ).map((p) => (
                                  <button
                                    type="button"
                                    key={p.id}
                                    onClick={() => {
                                      setFormProductName(p.productName);
                                      setShowProductDropdown(false);
                                    }}
                                    className="block w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                                  >
                                    {p.productName}
                                  </button>
                                ))}
                                {(formProductName
                                  ? products.filter((p) =>
                                    p.productName.toLowerCase().startsWith(formProductName.toLowerCase())
                                  )
                                  : products
                                ).length === 0 && (
                                    <div className="px-3 py-2 text-xs text-gray-400">
                                      No products found
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="owner"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Agreement Owner *
                          </label>
                          <div className="relative" ref={userDropdownRef}>
                            <input
                              type="text"
                              id="owner"
                              value={formOwner}
                              onChange={(e) => {
                                setFormOwner(e.target.value);
                                setShowUserDropdown(true);
                              }}
                              onFocus={() => setShowUserDropdown(true)}
                              placeholder={loadingUsers ? 'Loading users...' : 'Start typing or click to see all users'}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              autoComplete="off"
                              required
                            />
                            {showUserDropdown && (
                              <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white text-sm shadow-lg dark:border-gray-700 dark:bg-gray-900">
                                {(formOwner
                                  ? users.filter((u) =>
                                    u.name.toLowerCase().includes(formOwner.toLowerCase()) ||
                                    u.email.toLowerCase().includes(formOwner.toLowerCase())
                                  )
                                  : users
                                ).map((u) => (
                                  <button
                                    type="button"
                                    key={u.id}
                                    onClick={() => {
                                      setFormOwner(u.name);
                                      setShowUserDropdown(false);
                                    }}
                                    className="block w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                                  >
                                    <div className="font-medium">{u.name}</div>
                                    <div className="text-xs text-gray-500">{u.email}</div>
                                  </button>
                                ))}
                                {(formOwner
                                  ? users.filter((u) =>
                                    u.name.toLowerCase().includes(formOwner.toLowerCase()) ||
                                    u.email.toLowerCase().includes(formOwner.toLowerCase())
                                  )
                                  : users
                                ).length === 0 && (
                                    <div className="px-3 py-2 text-xs text-gray-400">
                                      No users found
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
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
                            htmlFor="contractDuration"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Contract Duration (months)
                          </label>
                          <select
                            id="contractDuration"
                            value={formContractDuration}
                            onChange={(e) => setFormContractDuration(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="1">Monthly (1 month)</option>
                            <option value="12">Annual (12 months)</option>
                            <option value="24">2 Years (24 months)</option>
                            <option value="36">3 Years (36 months)</option>
                            <option value="60">5 Years (60 months)</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="startDate"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Start Date *
                          </label>
                          <div className="relative">
                            <DatePicker
                              id="startDate"
                              selected={formStartDate ? new Date(formStartDate) : null}
                              onChange={(date: Date | null) => {
                                if (date) {
                                  // keep the same yyyy-MM-dd format you already use everywhere
                                  const iso = date.toISOString().split('T')[0];
                                  setFormStartDate(iso);
                                } else {
                                  setFormStartDate('');
                                }
                              }}
                              dateFormat="yyyy-MM-dd"
                              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              placeholderText="Select start date"
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
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
                          <SecondaryButton
                            type="button"
                            onClick={() => setShowAddModal(false)}
                          >
                            Cancel
                          </SecondaryButton>
                          <PrimaryButton
                            type="submit"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Adding...
                              </>
                            ) : (
                              "Add Agreement"
                            )}
                          </PrimaryButton>
                        </div>
                      </form>
                    </div>
                  </PortalModal>
        </>
    </div>  );
};

export default VendorAgreements;