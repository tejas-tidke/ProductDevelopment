import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { jiraService } from '../../services/jiraService';
import { useAuth } from '../../context/AuthContext';

interface ExistingContract {
  id: string;
  vendorName: string;
  productName: string;
  requesterName: string;
  requesterMail: string;
  vendorContractType: 'usage' | 'license' | '';
  vendorStartDate: string;
  vendorEndDate: string;
  additionalComment?: string;
  vendorUnit?: string;
  vendorUsage?: number;
}

interface CreatedIssue {
  id: string;
  key: string;
  fields: Record<string, unknown>;
}

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueCreated?: (issue: CreatedIssue) => void;
}

// Define the product item structure
interface ProductItem {
  id: string;
  productName: string;
  nameOfVendor?: string;
  productLink?: string;
  productType?: 'license' | 'usage'; // New field to indicate if product is license-based or usage-based
}

const CreateIssueModal: React.FC<CreateIssueModalProps> = ({ isOpen, onClose, onIssueCreated }) => {
  // Get user data from context
  const {
    currentUser,
    userData,
    userDepartmentName,
    userOrganizationName
  } = useAuth();

  const navigate = useNavigate();

  // State for dropdown visibility and filtering
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // requester
  const [requesterName, setRequesterName] = useState('');
  const [requesterMail, setRequesterMail] = useState('');

  // contract mode
  const [contractType, setContractType] = useState<'new' | 'existing' | ''>('');

  // vendors/products (from lighter file)
  const [vendors, setVendors] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Declare vendorName and productName states
  const [vendorName, setVendorName] = useState('');
  const [productName, setProductName] = useState('');

  // Filter vendors and products only when they have values
  const filteredVendors = vendorName && Array.isArray(vendors) ? vendors.filter(v => v.toLowerCase().includes(vendorName.toLowerCase())) : [];
  const filteredProducts = productName && Array.isArray(products) ? products.filter(p => p.productName.toLowerCase().includes(productName.toLowerCase())) : [];

  // Log the auth context values
  console.log('🔐 Auth Context - Department:', userDepartmentName);
  console.log('🔐 Auth Context - Organization:', userOrganizationName);

  // Helper functions
  const addMonths = (date: string, months: number): string => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  };

  // When a product is selected, fetch its type
  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProductName = e.target.value;
    setProductName(selectedProductName);

    // Reset billing type when product changes
    setVendorContractType('');

    // Fetch product type
    if (selectedProductName && vendorName) {
      jiraService.getProductType(vendorName, selectedProductName)
        .then((response: { productType: string }) => {
          if (response.productType) {
            setProductType(response.productType as 'license' | 'usage' | '');
            // Auto-select billing type based on product type
            if (response.productType === 'license') {
              setVendorContractType('license');
            } else if (response.productType === 'usage') {
              setVendorContractType('usage');
            }
          }
        })
        .catch(err => {
          console.error('Error fetching product type', err);
          setProductType('');
        });
    }
  };

  // product type
  const [productType, setProductType] = useState<'license' | 'usage' | ''>('');

  // core fields (detailed)
  const [vendorContractType, setVendorContractType] = useState<'usage' | 'license' | ''>('');

  const [currentUsageCount, setCurrentUsageCount] = useState<number | ''>('');
  const [currentUnits, setCurrentUnits] = useState<'credits' | 'minutes' | 'others' | ''>('');
  const [currentUnitsOther, setCurrentUnitsOther] = useState('');
  const [currentLicenseCount, setCurrentLicenseCount] = useState<number | ''>('');
  const [currentLicenseUnit, setCurrentLicenseUnit] = useState<'agents' | 'users' | ''>('');

  const [newUsageCount, setNewUsageCount] = useState<number | ''>('');
  const [newUnits, setNewUnits] = useState<'credits' | 'minutes' | 'others' | ''>('');
  const [newUnitsOther, setNewUnitsOther] = useState('');
  const [newLicenseCount, setNewLicenseCount] = useState<number | ''>('');
  const [newLicenseUnit, setNewLicenseUnit] = useState<'agents' | 'users' | ''>('');

  // existing contracts
  const [existingContracts, setExistingContracts] = useState<ExistingContract[]>([]);
  const [selectedExistingContractId, setSelectedExistingContractId] = useState('');
  const [loadingExistingContracts, setLoadingExistingContracts] = useState(false);

  // dates/comments
  const [contractDuration, setContractDuration] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [additionalComment, setAdditionalComment] = useState('');

  // renewal type for existing
  const [renewalType, setRenewalType] = useState<'upgrade' | 'downgrade' | 'flat' | ''>('');
  const [renewalNewUnits, setRenewalNewUnits] = useState<'credits' | 'minutes' | 'others' | ''>('');
  const [renewalNewUnitsOther, setRenewalNewUnitsOther] = useState('');
  const [renewalNewLicenseCount, setRenewalNewLicenseCount] = useState<number | ''>('');
  const [renewalLicenseUnit, setRenewalLicenseUnit] = useState<'agents' | 'users' | ''>('');

  // UI
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vendorDropdownRef = useRef<HTMLDivElement | null>(null);
  const productDropdownRef = useRef<HTMLDivElement | null>(null);
  const dueDateRef = useRef<HTMLInputElement | null>(null);
  const renewalDateRef = useRef<HTMLInputElement | null>(null);

  // ------------------------------------------------------------------
  // Load logged in user (from backend jiraService.myself)
  // ------------------------------------------------------------------
  // ------------------------------------------------------------------
  // Load logged in user (from backend jiraService.myself)
  // ------------------------------------------------------------------


  useEffect(() => {
    if (isOpen && userData && currentUser) {
      setRequesterName(userData.user.name || "");
      setRequesterMail(currentUser.email || "");
    }
  }, [isOpen, userData, currentUser]);


  // ------------------------------------------------------------------
  // Load existing contracts when needed
  // ------------------------------------------------------------------
  useEffect(() => {
    if (isOpen && contractType === 'existing') fetchExistingContracts();
  }, [isOpen, contractType]);

  const fetchExistingContracts = async () => {
    try {
      setLoadingExistingContracts(true);
      // Use the new endpoint to fetch only "new" contracts when selecting "existing" contract type
      if (typeof jiraService.getContractsByTypeAsDTO === 'function') {
        const data: unknown = await jiraService.getContractsByTypeAsDTO('new');
        const mapped = Array.isArray(data)
          ? data.map((c: any) => ({
            id: String(c.id ?? c.contractId ?? c.key ?? ''),
            vendorName: c.vendorName ?? c.nameOfVendor ?? '',
            productName: c.productName ?? '',
            requesterName: c.requesterName ?? '',
            requesterMail: c.requesterMail ?? c.requesterEmail ?? '',
            vendorContractType:
              (c.vendorContractType ||
                c.billingType ||
                c.billing_type ||
                c.contractBilling ||
                c.vendor_contract_type ||
                '') as 'usage' | 'license' | '',

            vendorStartDate: String(c.dueDate ?? ''),
            vendorEndDate: String(c.renewalDate ?? ''),
            additionalComment: c.additionalComment ?? '',
            // Fixed mapping for current units and usage
            vendorUnit: c.currentUnits ?? c.unit ?? '',
            vendorUsage:
              (typeof c.currentUsageCount !== 'undefined' && c.currentUsageCount !== null)
                ? Number(c.currentUsageCount)
                : (typeof c.currentLicenseCount !== 'undefined' && c.currentLicenseCount !== null)
                  ? Number(c.currentLicenseCount)
                  : undefined,
          }))
          : [];
        setExistingContracts(mapped);
      }
    } catch (err) {
      console.error('Error fetching existing contracts', err);
    } finally {
      setLoadingExistingContracts(false);
    }
  };

  // ------------------------------------------------------------------
  // Vendors & products (when using dropdown flavor)
  // ------------------------------------------------------------------
  useEffect(() => {
    const loadVendors = async () => {
      if (contractType !== 'new') return;
      try {
        setLoadingVendors(true);
        const list = await jiraService.getVendors();
        if (Array.isArray(list)) setVendors(list);
      } catch (err) {
        console.error('Error loading vendors', err);
      } finally {
        setLoadingVendors(false);
      }
    };
    loadVendors();
  }, [contractType]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!vendorName || contractType !== 'new') return;
      try {
        setLoadingProducts(true);
        const list = await jiraService.getProductsByVendor(vendorName);
        if (Array.isArray(list)) setProducts(list);

        // Reset product type when vendor changes
        setProductType('');
      } catch (err) {
        console.error('Error loading products', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, [vendorName, contractType]);

  // ------------------------------------------------------------------
  // When an existing contract is selected, populate fields
  // ------------------------------------------------------------------
  useEffect(() => {
    if (contractType === 'existing' && selectedExistingContractId) {
      const found = existingContracts.find(c => c.id === selectedExistingContractId);
      if (!found) return;

      setVendorName(found.vendorName);
      setProductName(found.productName);
      setVendorContractType(found.vendorContractType);
      setDueDate(found.vendorStartDate || '');
      setRenewalDate(found.vendorEndDate || '');
      setAdditionalComment(found.additionalComment ?? '');
      if (found.requesterName) setRequesterName(found.requesterName);
      if (found.requesterMail) setRequesterMail(found.requesterMail);

      setRenewalType(''); // reset renewal type for user choice

      if (typeof found.vendorUsage !== 'undefined' && found.vendorUsage !== null) {
        const usageNum = Number(found.vendorUsage) || 0;
        if (found.vendorContractType === 'usage') {
          setCurrentUsageCount(usageNum);
          setCurrentLicenseCount('');
          setNewUsageCount(usageNum);
          // units mapping
          if (found.vendorUnit && !['credits', 'minutes', 'others'].includes(found.vendorUnit)) {
            setCurrentUnits('others');
            setCurrentUnitsOther(found.vendorUnit);
            setNewUnits('others');
            setNewUnitsOther(found.vendorUnit);
          } else {
            setCurrentUnits((found.vendorUnit as any) ?? '');
            setCurrentUnitsOther('');
            setNewUnits((found.vendorUnit as any) ?? '');
            setNewUnitsOther('');
          }
        } else if (found.vendorContractType === 'license') {
          setCurrentLicenseCount(usageNum);
          setCurrentUsageCount('');
          setNewLicenseCount(usageNum);
          setNewUsageCount('');
          if (found.vendorUnit === 'agents' || found.vendorUnit === 'users') {
            setCurrentLicenseUnit(found.vendorUnit as any);
            setNewLicenseUnit(found.vendorUnit as any);
          } else {
            setCurrentLicenseUnit('');
            setNewLicenseUnit('');
          }
        }
      } else {
        setCurrentUsageCount('');
        setCurrentLicenseCount('');
        setNewUsageCount('');
        setNewLicenseCount('');
        setNewUnits('');
      }
    }
  }, [selectedExistingContractId, contractType, existingContracts]);

  // If switching to new while existing selected: prefill new fields from selected existing contract
  useEffect(() => {
    if (contractType === 'new' && selectedExistingContractId) {
      const found = existingContracts.find(c => c.id === selectedExistingContractId);
      if (!found) return;
      if (typeof found.vendorUsage !== 'undefined' && found.vendorUsage !== null) {
        const usageNum = Number(found.vendorUsage) || 0;
        if (found.vendorContractType === 'usage') {
          setNewUsageCount(usageNum);
          if (found.vendorUnit && !['credits', 'minutes', 'others'].includes(found.vendorUnit)) {
            setNewUnits('others');
            setNewUnitsOther(found.vendorUnit);
          } else {
            setNewUnits((found.vendorUnit as any) ?? '');
            setNewUnitsOther('');
          }
          setVendorContractType('usage');
        } else if (found.vendorContractType === 'license') {
          setNewLicenseCount(usageNum);
          if (found.vendorUnit === 'agents' || found.vendorUnit === 'users') setNewLicenseUnit(found.vendorUnit as any);
          setVendorContractType('license');
        }
        if (!vendorName) setVendorName(found.vendorName);
        if (!productName) setProductName(found.productName);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractType, selectedExistingContractId]);

  // Sync new -> current only when creating NEW (keeps preview consistent)
  useEffect(() => {
    if (contractType !== 'new') return;
    if (newUsageCount === '' || newUsageCount === null) {
      if (selectedExistingContractId) setCurrentUsageCount('');
      return;
    }
    if (typeof newUsageCount === 'number' && !Number.isNaN(newUsageCount)) {
      setCurrentUsageCount(newUsageCount);
      if (newUnits) setCurrentUnits(newUnits);
      if (newUnits === 'others' && newUnitsOther) setCurrentUnitsOther(newUnitsOther);
    }
  }, [newUsageCount, newUnits, newUnitsOther, selectedExistingContractId, contractType]);

  useEffect(() => {
    if (contractType !== 'new') return;
    if (newLicenseCount === '' || newLicenseCount === null) {
      if (selectedExistingContractId) setCurrentLicenseCount('');
      return;
    }
    if (typeof newLicenseCount === 'number' && !Number.isNaN(newLicenseCount)) {
      setCurrentLicenseCount(newLicenseCount);
    }
  }, [newLicenseCount, selectedExistingContractId, contractType]);

  // Calculate renewal date
  useEffect(() => {
    if ((contractType === 'new' || contractType === 'existing') && contractDuration) {
      const today = new Date().toISOString().split('T')[0];
      const newRenewalDate = addMonths(today, contractDuration);
      setRenewalDate(newRenewalDate);
    }
  }, [contractType, contractDuration]);

  // ------------------------------------------------------------------
  // Validation
  // ------------------------------------------------------------------
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!requesterName) newErrors.requesterName = 'Requester name required';
    if (!requesterMail) newErrors.requesterMail = 'Requester email required';
    if (!contractType) newErrors.contractType = 'Select contract type';

    if (contractType === 'new') {
      if (!vendorName) newErrors.vendorName = 'Vendor is required';
      if (!productName) newErrors.productName = 'Product is required';
      if (!contractDuration) newErrors.contractDuration = 'Contract duration is required';
      if (contractDuration && Number(contractDuration) < 0) newErrors.contractDuration = 'Contract duration cannot be negative';
      if (!dueDate) newErrors.dueDate = 'Due date is required';

      // For new contracts, due date should not be in the past
      if (dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time part for comparison
        const selectedDate = new Date(dueDate);
        if (selectedDate < today) {
          newErrors.dueDate = 'Due date cannot be in the past for new contracts';
        }
      }

      if (!vendorContractType) newErrors.vendorContractType = 'Select usage or license';

      if (vendorContractType === 'usage') {
        if (newUsageCount === '' || newUsageCount === 0) newErrors.newUsageCount = 'Enter usage amount';
        if (!newUnits) newErrors.newUnits = 'Select unit';
        if (newUnits === 'others' && !newUnitsOther) newErrors.newUnitsOther = 'Enter custom unit';
      }
      if (vendorContractType === 'license') {
        if (newLicenseCount === '' || newLicenseCount === 0) newErrors.newLicenseCount = 'Enter license count';
        if (!newLicenseUnit) newErrors.newLicenseUnit = 'Select license unit (agents / users)';
      }
    }

    if (contractType === 'existing') {
      if (!selectedExistingContractId) newErrors.selectedExistingContractId = 'Select an existing contract';
      if (!vendorContractType) newErrors.vendorContractType = 'Existing contract has no billing type';
      if (!renewalType) newErrors.renewalType = 'Select renewal type';

      // For existing contracts, due date is still required
      if (!dueDate) newErrors.dueDate = 'Due date is required';

      if (dueDate && renewalDate) {
        const dDate = new Date(dueDate);
        const rDate = new Date(renewalDate);
        if (dDate <= rDate) {
          newErrors.dueDate = 'Due date must be ahead of the renewal date.';
        }
      }

      // Contract duration validation for existing contracts
      if (contractDuration && Number(contractDuration) < 0) newErrors.contractDuration = 'Contract duration cannot be negative';

      if (vendorContractType === 'usage') {
        if (renewalType === 'upgrade' && (newUsageCount === '' || Number(newUsageCount) <= Number(currentUsageCount))) {
          newErrors.newUsageCount = 'For an upgrade, new usage must be greater than the current.';
        }
        if (renewalType === 'downgrade' && (newUsageCount === '' || Number(newUsageCount) >= Number(currentUsageCount))) {
          newErrors.newUsageCount = 'For a downgrade, new usage must be less than the current.';
        }
        if (renewalType !== 'flat') {
          if (!renewalNewUnits && (newUsageCount === '' || newUsageCount === 0)) newErrors.renewalNewUnits = 'Select unit for renewal or enter new usage';
          if (renewalNewUnits === 'others' && !renewalNewUnitsOther) newErrors.renewalNewUnitsOther = 'Enter custom unit for renewal';
          if (newUsageCount === '' || newUsageCount === 0) newErrors.newUsageCount = 'Enter new renewal usage amount';
        }
      }
      if (vendorContractType === 'license') {
        if (renewalType === 'upgrade' && (renewalNewLicenseCount === '' || Number(renewalNewLicenseCount) <= Number(currentLicenseCount))) {
          newErrors.renewalNewLicenseCount = 'For an upgrade, new license count must be greater than the current.';
        }
        if (renewalType === 'downgrade' && (renewalNewLicenseCount === '' || Number(renewalNewLicenseCount) >= Number(currentLicenseCount))) {
          newErrors.renewalNewLicenseCount = 'For a downgrade, new license count must be less than the current.';
        }
        if (renewalType !== 'flat') {
          if (renewalNewLicenseCount === '' || renewalNewLicenseCount === 0) newErrors.renewalNewLicenseCount = 'Enter new renewal license count';
          if (!renewalLicenseUnit) newErrors.renewalLicenseUnit = 'Select license unit (agents / users) for renewal';
        }
      }
      if (!dueDate) newErrors.dueDate = 'Due date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ------------------------------------------------------------------
  // Submit -> uses jiraService.createContractIssue (ensure jiraService exported function exists)
  // ------------------------------------------------------------------
  const resetForm = () => {
    setContractType('');
    setVendorName('');
    setProductName('');
    setVendorContractType('');
    setCurrentUsageCount('');
    setCurrentUnits('');
    setCurrentUnitsOther('');
    setCurrentLicenseCount('');
    setCurrentLicenseUnit('');
    setNewUsageCount('');
    setNewUnits('');
    setNewUnitsOther('');
    setNewLicenseCount('');
    setNewLicenseUnit('');
    setContractDuration('');
    setDueDate('');
    setRenewalDate('');
    setAdditionalComment('');
    setExistingContracts([]);
    setSelectedExistingContractId('');
    setErrors({});
    setRenewalType('');
    setRenewalNewUnits('');
    setRenewalNewUnitsOther('');
    setRenewalNewLicenseCount('');
    setRenewalLicenseUnit('');
    setAttachments([]);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Show loader
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    const vendorDetails: any = {
      vendorName,
      productName,
      vendorContractType,
      currentUsageCount: currentUsageCount || undefined,
      currentUnits: currentUnits === 'others' ? currentUnitsOther || undefined : currentUnits || undefined,
      currentLicenseCount: currentLicenseCount || undefined,
      currentLicenseUnit: currentLicenseUnit || undefined,
      newUsageCount: newUsageCount || undefined,
      newUnits: newUnits === 'others' ? newUnitsOther || undefined : newUnits || undefined,
      newLicenseCount: newLicenseCount || undefined,
      newLicenseUnit: newLicenseUnit || undefined,
      contractDuration: contractDuration || undefined,
      dueDate,
      renewalDate: renewalDate || undefined,
      additionalComment,
      requesterName,
      requesterMail,
      department: userDepartmentName || '',
      organization: userOrganizationName || '',
      contractMode: contractType,
      selectedExistingContractId: contractType === 'existing' ? selectedExistingContractId : undefined,
      renewalType: contractType === 'existing' ? renewalType || undefined : undefined,
      renewalNewUnits: renewalNewUnits === 'others' ? renewalNewUnitsOther || undefined : renewalNewUnits || undefined,
      renewalNewUnitsOther: renewalNewUnitsOther || undefined,
      renewalNewLicenseCount: renewalNewLicenseCount || undefined,
      renewalLicenseUnit: renewalLicenseUnit || undefined,
      attachments,
    };

    // Log the vendor details to see what's being sent
    console.log('📤 Vendor Details being sent:', vendorDetails);
    console.log('📤 Department:', userDepartmentName);
    console.log('📤 Organization:', userOrganizationName);

    try {
      const payload = { vendorDetails };
      console.log('🚀 Submitting payload to Jira:', payload);

      const created = await jiraService.createContractIssue(payload);

      if (attachments.length > 0 && created.key) {
        try {
          for (const file of attachments) {
            await jiraService.addAttachmentToIssue(created.key, file);
          }
        } catch (err) {
          console.error('Error uploading attachments:', err);
          // Optionally, set a warning message here if needed
        }
      }

      // ⭐ SAVE ATTACHMENTS IN DB AS "CREATION" STAGE
      // ⭐ SAVE ATTACHMENTS IN DB AS "CREATION" STAGE
      if (attachments.length > 0) {
        try {


          for (const file of attachments) {
            const meta = await jiraService.getLastUploadedAttachment(created.key, file.name);

            if (!meta) {
              console.warn(`Attachment metadata not found for file: ${file.name}`);
              continue;
            }

            await fetch("http://localhost:8080/api/jira/contracts/save-attachment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                issueKey: created.key,

                // 📌 Backend expects metadata object
                metadata: {
                  fileName: meta.filename,
                  content: meta.content,
                  size: meta.size,
                  mimeType: meta.mimeType || file.type || "application/octet-stream"
                }
              })
            });
          }

          console.log("📁 Attachments saved in DB successfully");
        } catch (err) {
          console.error("❌ Error saving attachment in DB: ", err);
        }
      }


      setSuccessMessage('Request successfully created');
      setErrorMessage('');
      setShowSuccess(true);

      // Dispatch a custom event to notify other components to refresh the issue list
      window.dispatchEvent(new CustomEvent('requestCreated'));

      setTimeout(() => setShowSuccess(false), 1800);

      onIssueCreated?.(created as CreatedIssue);
      resetForm();

      // Redirect to AllOpen page after successful submission
      setTimeout(() => {
        onClose();
        navigate('/request-management/all-open');
      }, 2000);
    } catch (err) {
      console.error('Create failed', err);
      setErrorMessage('Failed to create request. Please try again.');
      setSuccessMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Check if click is outside both dropdowns
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(e.target as Node)) {
        setShowVendorDropdown(false);
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // date picker helpers
  const openDatePicker = (inputEl: HTMLInputElement | null | undefined) => {
    if (!inputEl) return;
    try {
      const anyEl = inputEl as any;
      if (typeof anyEl.showPicker === 'function') {
        anyEl.showPicker();
        return;
      }
      inputEl.focus();
      const evt = new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window });
      inputEl.dispatchEvent(evt);
      inputEl.click();
    } catch (err) {
      try { inputEl.focus(); } catch (e) { /* ignore */ }
    }
  };

  const focusDueDate = () => openDatePicker(dueDateRef.current);
  const focusRenewalDate = () => openDatePicker(renewalDateRef.current);

  if (!isOpen) return null;

  return (
    <>
      {showSuccess && (
        <div className="fixed top-5 right-5 z-[100000] bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-fade-in">
          🎉 Issue Created Successfully!
        </div>
      )}

      <div className="fixed inset-0 z-[9999] overflow-y-auto">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden>{'\u200B'}</span>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full dark:bg-gray-800 z-[9999] relative">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Create Procurement Request</h3>
            </div>

            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-4">
              {successMessage && (
                <div className="mb-4 rounded-md border bg-green-50 border-green-200 px-4 py-2 text-sm text-green-800">{successMessage}</div>
              )}
              {errorMessage && (
                <div className="mb-4 rounded-md border bg-red-50 border-red-200 px-4 py-2 text-sm text-red-800">{errorMessage}</div>
              )}

              {/* Contract Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type of Contract <span className="text-red-500">*</span></label>
                <div className="flex flex-col space-y-2">
                  <label htmlFor="contractTypeNew" className="inline-flex items-center">
                    <input id="contractTypeNew" type="radio" name="contractType" value="new" checked={contractType === 'new'} onChange={() => setContractType('new')} />
                    <span className="ml-2">New Contract</span>
                  </label>
                  <label htmlFor="contractTypeExisting" className="inline-flex items-center">
                    <input id="contractTypeExisting" type="radio" name="contractType" value="existing" checked={contractType === 'existing'} onChange={() => setContractType('existing')} />
                    <span className="ml-2">Existing Contract</span>
                  </label>
                </div>
                {errors.contractType && <p className="mt-1 text-sm text-red-600">{errors.contractType}</p>}
              </div>



              {/* NEW flow (supports vendor dropdown + detailed fields) */}
              {contractType === 'new' && (
                <>
                  <div className="relative" ref={vendorDropdownRef}>
                    <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700 mb-1">Vendor Name <span className="text-red-500">*</span></label>
                    <input
                      id="vendorName"
                      type="text"
                      value={vendorName}
                      onChange={e => {
                        setVendorName(e.target.value);
                        setShowVendorDropdown(true);
                        // Hide product dropdown when typing in vendor
                        setShowProductDropdown(false);
                      }}
                      placeholder={loadingVendors ? 'Loading vendors...' : 'Type or select vendor'}
                      className="w-full border rounded-md py-2 px-3 text-sm"
                      autoComplete="off"
                      onFocus={() => {
                        setShowVendorDropdown(true);
                        // Hide product dropdown when focusing on vendor
                        setShowProductDropdown(false);
                      }}
                      onBlur={() => {
                        // Delay closing dropdown to allow item click
                        setTimeout(() => setShowVendorDropdown(false), 150);
                      }}
                    />
                    {showVendorDropdown && vendorName && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md max-h-40 overflow-auto dark:bg-gray-700">
                        {filteredVendors.length > 0 ? filteredVendors.map((v, index) => (
                          <li
                            key={index}
                            className="px-3 py-1 cursor-pointer hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500"
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent blur event
                              setVendorName(v);
                              setShowVendorDropdown(false);
                              // Show product dropdown after selecting vendor
                              setTimeout(() => {
                                if (productName) {
                                  setShowProductDropdown(true);
                                }
                              }, 150);
                            }}
                          >
                            {v}
                          </li>
                        )) : (
                          <li className="px-3 py-1 text-gray-500">No vendors found</li>
                        )}
                      </ul>
                    )}
                    {errors.vendorName && <p className="mt-1 text-sm text-red-600">{errors.vendorName}</p>}
                  </div>

                  <div className="relative" ref={productDropdownRef}>
                    <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label>
                    <input
                      id="productName"
                      type="text"
                      value={productName}
                      onChange={e => {
                        setProductName(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      placeholder={loadingProducts ? 'Loading products...' : 'Type or select product'}
                      className="w-full border rounded-md py-2 px-3 text-sm"
                      autoComplete="off"
                      onFocus={() => {
                        setShowProductDropdown(true);
                        // Hide vendor dropdown when focusing on product
                        setShowVendorDropdown(false);
                      }}
                      onBlur={() => {
                        // Delay closing dropdown to allow item click
                        setTimeout(() => setShowProductDropdown(false), 150);
                      }}
                    />
                    {showProductDropdown && productName && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md max-h-40 overflow-auto dark:bg-gray-700">
                        {filteredProducts.length > 0 ? filteredProducts.map((p) => (
                          <li
                            key={p.id}
                            className="px-3 py-1 cursor-pointer hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500"
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent blur event
                              setProductName(p.productName);
                              setShowProductDropdown(false);
                            }}
                          >
                            {p.productName}
                          </li>
                        )) : (
                          <li className="px-3 py-1 text-gray-500">No products found</li>
                        )}
                      </ul>
                    )}
                    {errors.productName && <p className="mt-1 text-sm text-red-600">{errors.productName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contract Billing <span className="text-red-500">*</span></label>
                    <div className="flex flex-col space-y-2">
                      <label htmlFor="billingUsage"><input id="billingUsage" type="radio" value="usage" checked={vendorContractType === 'usage'} onChange={() => setVendorContractType('usage')} /> Usage</label>
                      <label htmlFor="billingLicense"><input id="billingLicense" type="radio" value="license" checked={vendorContractType === 'license'} onChange={() => setVendorContractType('license')} /> License</label>
                    </div>

                    {/* Show a message if the product type doesn't match the selected billing type */}
                    {productType && vendorContractType && productType !== vendorContractType && (
                      <div className="mt-2 text-sm text-yellow-600">
                        Note: The selected product is typically {productType}-based, but you've selected {vendorContractType} billing.
                      </div>
                    )}

                    {vendorContractType === 'usage' && (
                      <>
                        <div className="mt-3 flex items-end space-x-3">
                          <div className="flex-1">
                            <label htmlFor="newUsageCount" className="block text-sm font-medium text-gray-700 mb-1">How many volumes you want? <span className="text-red-500">*</span></label>
                            <input id="newUsageCount" placeholder="Enter number of volumes" value={newUsageCount} onChange={e => setNewUsageCount(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border rounded-md py-2 px-3 text-sm" />
                            {selectedExistingContractId && currentUsageCount !== '' && (<p className="mt-1 text-xs text-gray-500">Current: {currentUsageCount} {currentUnits === 'others' ? currentUnitsOther || '' : currentUnits || ''}</p>)}
                            {errors.newUsageCount && <p className="mt-1 text-sm text-red-600">{errors.newUsageCount}</p>}
                          </div>
                          <div style={{ minWidth: 140 }}>
                            <label htmlFor="newUnits" className="block text-sm font-medium text-gray-700 mb-1">Units <span className="text-red-500">*</span></label>
                            <select id="newUnits" value={newUnits} onChange={e => setNewUnits(e.target.value as any)} className="w-full border rounded-md py-2 px-3 text-sm">
                              <option value="">Select unit</option>
                              <option value="credits">Credits</option>
                              <option value="minutes">Minutes</option>
                              <option value="others">Others</option>
                            </select>
                            {errors.newUnits && <p className="mt-1 text-sm text-red-600">{errors.newUnits}</p>}
                          </div>
                        </div>

                        {newUnits === 'others' && (
                          <div className="mt-2">
                            <label htmlFor="newUnitsOther" className="block text-sm font-medium text-gray-700 mb-1">Specify other unit <span className="text-red-500">*</span></label>
                            <input id="newUnitsOther" value={newUnitsOther} onChange={e => setNewUnitsOther(e.target.value)} placeholder="Type unit (e.g. messages, transactions)" className="w-full border rounded-md py-2 px-3 text-sm" />
                            {errors.newUnitsOther && <p className="mt-1 text-sm text-red-600">{errors.newUnitsOther}</p>}
                          </div>
                        )}
                      </>
                    )}

                    {vendorContractType === 'license' && (
                      <div className="mt-3">
                        <label htmlFor="newLicenseCount" className="block text-sm font-medium text-gray-700 mb-1">How many licenses do you want? <span className="text-red-500">*</span></label>
                        <div className="flex items-end space-x-3">
                          <input id="newLicenseCount" type="number" min={0} value={newLicenseCount} onChange={e => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            if (val === '' || val >= 0) setNewLicenseCount(val);
                          }} placeholder="License Count" className="flex-1 border rounded-md py-2 px-3 text-sm" />
                          <div style={{ minWidth: 140 }}>
                            <label htmlFor="newLicenseUnit" className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                            <select id="newLicenseUnit" value={newLicenseUnit} onChange={e => setNewLicenseUnit(e.target.value as any)} className="w-full border rounded-md py-2 px-3 text-sm">
                              <option value="">Select unit</option>
                              <option value="agents">Agents</option>
                              <option value="users">Users</option>
                            </select>
                          </div>
                        </div>
                        {selectedExistingContractId && currentLicenseCount !== '' && (<p className="mt-1 text-xs text-gray-500">Current: {currentLicenseCount} {currentLicenseUnit ? `(${currentLicenseUnit})` : ''}</p>)}
                        {errors.newLicenseCount && <p className="mt-1 text-sm text-red-600">{errors.newLicenseCount}</p>}
                        {errors.newLicenseUnit && <p className="mt-1 text-sm text-red-600">{errors.newLicenseUnit}</p>}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="contractDuration" className="block text-sm font-medium text-gray-700 mb-1">Contract Duration (months) <span className="text-red-500">*</span></label>
                    <input id="contractDuration" type="number" min={0} value={contractDuration} onChange={e => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      if (val === '' || val >= 0) setContractDuration(val);
                    }} placeholder="Enter duration in months" className="w-full border rounded-md py-2 px-3 text-sm" />
                    {errors.contractDuration && <p className="mt-1 text-sm text-red-600">{errors.contractDuration}</p>}
                  </div>

                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-red-500">*</span></label>
                    <div className="flex items-center space-x-2">
                      <input id="dueDate" ref={dueDateRef} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border rounded-md py-2 px-3 text-sm" />
                      <button type="button" onClick={focusDueDate} className="p-2 border rounded-md bg-white" aria-label="Open due date picker">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 11H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 11H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M16 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </div>
                    {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>}
                  </div>
                </>
              )}

              {/* EXISTING flow */}
              {contractType === 'existing' && (
                <>
                  <div>
                    <label htmlFor="selectedExistingContractId" className="block text-sm font-medium text-gray-700 mb-1">Select Existing Contract</label>
                    <select id="selectedExistingContractId" value={selectedExistingContractId} onChange={e => setSelectedExistingContractId(e.target.value)} className="w-full border rounded-md py-2 px-3 text-sm">
                      <option value="">{loadingExistingContracts ? 'Loading...' : 'Select Contract'}</option>
                      {existingContracts.map(c => <option key={c.id} value={c.id}>{c.vendorName} — {c.productName}</option>)}
                    </select>
                    {errors.selectedExistingContractId && <p className="mt-1 text-sm text-red-600">{errors.selectedExistingContractId}</p>}
                  </div>

                  <div>
                    <label htmlFor="vendorNameExisting" className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                    <input id="vendorNameExisting" value={vendorName} readOnly disabled className="w-full border rounded-md py-2 px-3 text-sm bg-gray-100" />
                  </div>

                  <div>
                    <label htmlFor="productNameExisting" className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input id="productNameExisting" value={productName} readOnly disabled className="w-full border rounded-md py-2 px-3 text-sm bg-gray-100" />
                  </div>

                  <div>
                    <label htmlFor="billingTypeExisting" className="block text-sm font-medium text-gray-700 mb-1">Billing Type</label>
                    <input id="billingTypeExisting" value={vendorContractType} readOnly disabled className="w-full border rounded-md py-2 px-3 text-sm bg-gray-100" />
                  </div>

                  {vendorContractType === 'usage' && (
                    <div>
                      <label htmlFor="currentUsageCount" className="block text-sm font-medium text-gray-700 mb-1">Current volumes</label>
                      <div className="flex items-center space-x-2">
                        <input id="currentUsageCount" value={currentUsageCount ?? ''} readOnly disabled className="flex-1 w-full border rounded-md py-2 px-3 text-sm bg-gray-100" />
                        <div className="w-36">
                          <select id="currentUnits" value={currentUnits} disabled className="w-full border rounded-md py-2 px-3 text-sm bg-gray-100" aria-label="Current units">
                            <option value="">Units</option>
                            <option value="credits">Credits</option>
                            <option value="minutes">Minutes</option>
                            <option value="others">Others</option>
                            {/* Add option for custom units if they don't match predefined ones */}
                            {currentUnits && !['credits', 'minutes', 'others', ''].includes(currentUnits) && (
                              <option value={currentUnits}>{currentUnits}</option>
                            )}
                          </select>
                        </div>
                      </div>
                      {currentUnits === 'others' && currentUnitsOther && <p className="mt-1 text-xs text-gray-500">Custom unit: {currentUnitsOther}</p>}
                      {/* Display custom unit if it's not one of the predefined ones */}
                      {currentUnits && !['credits', 'minutes', 'others', ''].includes(currentUnits) && (
                        <p className="mt-1 text-xs text-gray-500">Unit: {currentUnits}</p>
                      )}

                      <div className="mt-3">
                        <label htmlFor="renewalTypeUsage" className="block text-sm font-medium text-gray-700 mb-1">Renewal Type</label>
                        <select id="renewalTypeUsage" value={renewalType} onChange={e => setRenewalType(e.target.value as any)} className="w-full border rounded-md py-2 px-3 text-sm">
                          <option value="">Select renewal type</option>
                          <option value="upgrade">Upgrade</option>
                          <option value="downgrade">Downgrade</option>
                          <option value="flat">Flat Renewal</option>
                        </select>
                        {errors.renewalType && <p className="mt-1 text-sm text-red-600">{errors.renewalType}</p>}
                      </div>

                      {renewalType !== 'flat' && renewalType !== '' && (
                        <div className="mt-3">
                          <label htmlFor="renewalNewUsageCount" className="block text-sm font-medium text-gray-700 mb-1">New renewal usage count</label>
                          <div className="flex items-end space-x-3">
                            <div className="flex-1">
                              <input id="renewalNewUsageCount" type="number" value={newUsageCount} onChange={e => setNewUsageCount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Enter renewal usage" className="w-full border rounded-md py-2 px-3 text-sm" />
                              {errors.newUsageCount && <p className="mt-1 text-sm text-red-600">{errors.newUsageCount}</p>}
                            </div>
                            <div style={{ minWidth: 140 }}>
                              <label htmlFor="renewalNewUnits" className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                              <select id="renewalNewUnits" value={renewalNewUnits || newUnits} onChange={e => setRenewalNewUnits(e.target.value as any)} className="w-full border rounded-md py-2 px-3 text-sm">
                                <option value="">Select unit</option>
                                <option value="credits">Credits</option>
                                <option value="minutes">Minutes</option>
                                <option value="others">Others</option>
                              </select>
                              {errors.renewalNewUnits && <p className="mt-1 text-sm text-red-600">{errors.renewalNewUnits}</p>}
                            </div>
                          </div>

                          {renewalNewUnits === 'others' && (
                            <div className="mt-2">
                              <label htmlFor="renewalNewUnitsOther" className="block text-sm font-medium text-gray-700 mb-1">Specify other unit for renewal <span className="text-red-500">*</span></label>
                              <input id="renewalNewUnitsOther" value={renewalNewUnitsOther} onChange={e => setRenewalNewUnitsOther(e.target.value)} placeholder="Type unit (e.g. transactions)" className="w-full border rounded-md py-2 px-3 text-sm" />
                              {errors.renewalNewUnitsOther && <p className="mt-1 text-sm text-red-600">{errors.renewalNewUnitsOther}</p>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {vendorContractType === 'license' && (
                    <div>
                      <label htmlFor="currentLicenseCount" className="block text-sm font-medium text-gray-700 mb-1">Current license count</label>
                      <input id="currentLicenseCount" value={currentLicenseCount ?? ''} readOnly disabled className="w-full border rounded-md py-2 px-3 text-sm bg-gray-100" />
                      {currentLicenseUnit && <p className="mt-1 text-xs text-gray-500">Current license unit: {currentLicenseUnit}</p>}

                      <div className="mt-3">
                        <label htmlFor="renewalTypeLicense" className="block text-sm font-medium text-gray-700 mb-1">Renewal Type</label>
                        <select id="renewalTypeLicense" value={renewalType} onChange={e => setRenewalType(e.target.value as any)} className="w-full border rounded-md py-2 px-3 text-sm">
                          <option value="">Select renewal type</option>
                          <option value="upgrade">Upgrade</option>
                          <option value="downgrade">Downgrade</option>
                          <option value="flat">Flat Renewal</option>
                        </select>
                        {errors.renewalType && <p className="mt-1 text-sm text-red-600">{errors.renewalType}</p>}
                      </div>

                      {renewalType !== 'flat' && renewalType !== '' && (
                        <div className="mt-3">
                          <label htmlFor="renewalNewLicenseCount" className="block text-sm font-medium text-gray-700 mb-1">How many licenses do you want to renew?</label>
                          <div className="flex items-end space-x-3">
                            <input id="renewalNewLicenseCount" type="number" value={renewalNewLicenseCount} onChange={e => setRenewalNewLicenseCount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Enter renewal license count" className="flex-1 border rounded-md py-2 px-3 text-sm" />
                            <div style={{ minWidth: 140 }}>
                              <label htmlFor="renewalLicenseUnit" className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                              <select id="renewalLicenseUnit" value={renewalLicenseUnit} onChange={e => setRenewalLicenseUnit(e.target.value as any)} className="w-full border rounded-md py-2 px-3 text-sm">
                                <option value="">Select unit</option>
                                <option value="agents">Agents</option>
                                <option value="users">Users</option>
                              </select>
                            </div>
                          </div>
                          {errors.renewalNewLicenseCount && <p className="mt-1 text-sm text-red-600">{errors.renewalNewLicenseCount}</p>}
                          {errors.renewalLicenseUnit && <p className="mt-1 text-sm text-red-600">{errors.renewalLicenseUnit}</p>}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label htmlFor="contractDurationExisting" className="block text-sm font-medium text-gray-700 mb-1">Contract Duration (months)</label>
                    <input id="contractDurationExisting" type="number" min={0} value={contractDuration} onChange={e => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      if (val === '' || val >= 0) setContractDuration(val);
                    }} placeholder="Enter duration in months" className="w-full border rounded-md py-2 px-3 text-sm" />
                  </div>

                  <div>
                    <label htmlFor="renewalDate" className="block text-sm font-medium text-gray-700 mb-1">Renewal Date</label>
                    <div className="flex items-center space-x-2">
                      <input id="renewalDate" ref={renewalDateRef} type="date" value={renewalDate} readOnly disabled className="w-full border rounded-md py-2 px-3 text-sm bg-gray-100" />
                      <button type="button" onClick={focusRenewalDate} className="p-2 border rounded-md bg-white" aria-label="Open renewal date picker">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M16 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="dueDateExisting" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <div className="flex items-center space-x-2">
                      <input id="dueDateExisting" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border rounded-md py-2 px-3 text-sm" />
                      <button type="button" onClick={() => dueDateRef.current?.focus()} className="p-2 border rounded-md bg-white" aria-label="Open due date picker">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M16 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {contractType && (
                <>
                  {/* Additional comment */}
                  <div>
                    <label htmlFor="additionalComment" className="block text-sm font-medium text-gray-700 mb-1">Additional Comment</label>
                    <textarea id="additionalComment" value={additionalComment} onChange={e => setAdditionalComment(e.target.value)} rows={3} className="w-full border rounded-md py-2 px-3 text-sm" placeholder="Enter additional comment" />
                  </div>

                  {/* Attachments */}
                  <div>
                    <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                    <input
                      id="attachments"
                      type="file"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
                        const validFiles = files.filter(file => validTypes.includes(file.type.toLowerCase()));

                        if (validFiles.length !== files.length) {
                          setErrorMessage('Only PDF and JPG files are allowed as attachments.');
                        } else {
                          setErrorMessage('');
                        }
                        setAttachments(validFiles);
                      }}
                      className="w-full border rounded-md py-2 px-3 text-sm"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    {errorMessage && (
                      <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
                    )}
                    {attachments.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Selected files:</p>
                        <ul className="list-disc list-inside text-sm text-gray-500">
                          {attachments.map((file, index) => (
                            <li key={index}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => { resetForm(); onClose(); }}
                className="px-4 py-2 text-sm bg-white border rounded-md"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className={`px-4 py-2 text-sm text-white rounded-md flex items-center ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateIssueModal;