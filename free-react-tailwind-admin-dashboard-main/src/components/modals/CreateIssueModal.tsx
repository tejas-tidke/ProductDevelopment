import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { jiraService } from '../../services/jiraService';
import { useAuth } from '../../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PortalModal } from '../../components/ui/modal';
import { PrimaryToast } from '../../components/ui/toast';
import SuccessToast2 from '../../components/ui/toast/SuccessToast2';

function normalizeVendorType(
  type: string | null | undefined
): 'usage' | 'license' | '' {
  if (!type) return '';

  const t = type.toLowerCase();

  // usage-based keywords
  if (
    t.includes('usage') ||
    t.includes('consumption') ||
    t.includes('credits') ||
    t.includes('minute') || 
    t.includes('volume') ||
    t.includes('pay as you go') ||
    t.includes('usage based')
  ) {
    return 'usage';
  }

  // license-based keywords
  if (
    t.includes('license') ||
    t.includes('licence') || // British spelling
    t.includes('user') ||
    t.includes('agent') ||
    t.includes('seat') ||
    t.includes('per user') ||
    t.includes('per agent') ||
    t.includes('license based')
  ) {
    return 'license';
  }

  return '';
}


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
  initialContractType?: 'new' | 'existing';
  initialExistingContractId?: string;
}

interface ProductItem {
  id: string;
  productName: string;
  nameOfVendor?: string;
  productLink?: string;
  productType?: 'license' | 'usage';
}

const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  isOpen,
  onClose,
  onIssueCreated,
  initialContractType,
  initialExistingContractId,
}) => {
  const { currentUser, userData, userDepartmentName, userOrganizationName } = useAuth();
  const navigate = useNavigate();

  const addMonths = (date: string, months: number): string => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  };

  const [requesterName, setRequesterName] = useState('');
  const [requesterMail, setRequesterMail] = useState('');

  const [contractType, setContractType] = useState<'new' | 'existing' | ''>('');

  const [vendors, setVendors] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [productType, setProductType] = useState<'license' | 'usage' | ''>('');
  const [vendorName, setVendorName] = useState('');
  const [productName, setProductName] = useState('');
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

  const [existingContracts, setExistingContracts] = useState<ExistingContract[]>([]);
  const [selectedExistingContractId, setSelectedExistingContractId] = useState('');
  const [loadingExistingContracts, setLoadingExistingContracts] = useState(false);

  const [contractDuration, setContractDuration] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [additionalComment, setAdditionalComment] = useState('');

  const [renewalType, setRenewalType] = useState<'upgrade' | 'downgrade' | 'flat' | ''>('');
  const [renewalNewUnits, setRenewalNewUnits] = useState<'credits' | 'minutes' | 'others' | ''>('');
  const [renewalNewUnitsOther, setRenewalNewUnitsOther] = useState('');
  const [renewalNewLicenseCount, setRenewalNewLicenseCount] = useState<number | ''>('');
  const [renewalLicenseUnit, setRenewalLicenseUnit] = useState<'agents' | 'users' | ''>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Add a new state for showing full modal loader
  const [showModalLoader, setShowModalLoader] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  // const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const vendorDropdownRef = useRef<HTMLDivElement | null>(null);
  const productDropdownRef = useRef<HTMLDivElement | null>(null);


  const dueDateRef = useRef<HTMLInputElement | null>(null);
  const renewalDateRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen && userData && currentUser) {
      setRequesterName(userData.user.name || '');
      setRequesterMail(currentUser.email || '');
      // Clear any previous success messages when opening the modal
      setSuccessMessage('');
      setShowSuccess(false);
    }
  }, [isOpen, userData, currentUser]); useEffect(() => {
    if (!isOpen) return;
    if (initialContractType) setContractType(initialContractType);
    else setContractType('');
    if (initialContractType === 'existing' && initialExistingContractId) setSelectedExistingContractId(initialExistingContractId);
    else if (!initialExistingContractId) setSelectedExistingContractId('');
  }, [isOpen, initialContractType, initialExistingContractId]);

  useEffect(() => {
    if (isOpen && contractType === 'existing') fetchExistingContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, contractType]);

  const fetchExistingContracts = async () => {
    try {
      setLoadingExistingContracts(true);
      if (typeof jiraService.getContractsByTypeAsDTO === 'function') {
        const data: unknown = await jiraService.getContractsByTypeAsDTO('new');
        const mapped: ExistingContract[] = Array.isArray(data)
          ? data.map((c: any) => {
            // 1. Get raw type from backend (same fields you already used)
            const rawType =
              c.vendorContractType ||
              c.billingType ||
              c.billing_type ||
              c.contractBilling ||
              c.vendor_contract_type ||
              '';

            // 2. Normalize it like Procurement-renewal.tsx
            const normalizedType = normalizeVendorType(rawType);

            // 3. Decide which numeric field is "current" based on type
            let vendorUsage: number | undefined;

            if (normalizedType === 'usage') {
              const usageVal =
                c.currentUsageCount ??
                c.newUsageCount ??
                null;

              if (usageVal !== null && usageVal !== undefined) {
                vendorUsage = Number(usageVal);
              }
            } else if (normalizedType === 'license') {
              const licenseVal =
                c.currentLicenseCount ??
                c.newLicenseCount ??
                null;

              if (licenseVal !== null && licenseVal !== undefined) {
                vendorUsage = Number(licenseVal);
              }
            } else {
              // fallback: keep your previous behaviour as backup
              const anyVal =
                c.currentUsageCount ??
                c.currentLicenseCount ??
                c.newUsageCount ??
                c.newLicenseCount ??
                null;

              if (anyVal !== null && anyVal !== undefined) {
                vendorUsage = Number(anyVal);
              }
            }

            return {
              id: String(c.id ?? c.contractId ?? c.key ?? ''),
              vendorName: c.vendorName ?? c.nameOfVendor ?? '',
              productName: c.productName ?? '',
              requesterName: c.requesterName ?? '',
              requesterMail: c.requesterMail ?? c.requesterEmail ?? '',
              vendorContractType: normalizedType,  // 👈 IMPORTANT: now strictly 'usage' | 'license' | ''
              vendorStartDate: String(c.dueDate ?? ''),
              vendorEndDate: String(c.renewalDate ?? ''),
              additionalComment: c.additionalComment ?? '',
              vendorUnit: c.currentUnits ?? c.unit ?? '',
              vendorUsage,
            };
          })
          : [];
        setExistingContracts(mapped);

      }
    } catch (err) {
      console.error('Error fetching existing contracts', err);
    } finally {
      setLoadingExistingContracts(false);
    }
  };

  useEffect(() => {
    const loadVendors = async () => {
      if (contractType !== 'new') return;
      try {
        setLoadingVendors(true);
        
        console.log('Fetching vendors from VendorProfile system');
        const list = await jiraService.getVendorProfilesVendors();
        console.log('Received vendors:', list);
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
        
        console.log('Fetching products for vendor:', vendorName);
        const vendorProfiles = await jiraService.getVendorProfileDTOsByName(vendorName);
        console.log('Received vendor profiles:', vendorProfiles);
        if (Array.isArray(vendorProfiles)) {
          // Convert vendor profiles to product items
          const productList = vendorProfiles.map(profile => ({
            id: profile.vendorId?.toString() || '',
            productName: profile.productName || '',
            nameOfVendor: profile.vendorName,
            productType: (profile.productType as 'license' | 'usage') || undefined
          }));
          console.log('Converted product list:', productList);
          setProducts(productList);
        }
        setProductType('');
      } catch (err) {
        console.error('Error loading products', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, [vendorName, contractType, vendors]);


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
      setRenewalType('');
      if (typeof found.vendorUsage !== 'undefined' && found.vendorUsage !== null) {
        const usageNum = Number(found.vendorUsage) || 0;
        if (found.vendorContractType === 'usage') {
          setCurrentUsageCount(usageNum);
          setCurrentLicenseCount('');
          setNewUsageCount(usageNum);
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

      // optional visual sync
      if (newLicenseUnit) {
        setCurrentLicenseUnit(newLicenseUnit);
      }
    }
  }, [newLicenseCount, newLicenseUnit, selectedExistingContractId, contractType]);

  useEffect(() => {
    // ✅ Do NOT calculate renewal date when creating a NEW contract
    // Renewal date will be calculated after request completion
    // Just store the contract duration
    if (contractType === 'new' && contractDuration) {
      // Clear renewal date - it will be calculated after completion
      setRenewalDate('');
    }
  }, [contractType, contractDuration]);


  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProductName = e.target.value;
    setProductName(selectedProductName);
    setVendorContractType('');

    if (selectedProductName && vendorName) {
      const selectedProduct = products.find(p => p.productName === selectedProductName);
      if (selectedProduct && selectedProduct.productType) {
        setProductType(selectedProduct.productType);
        setVendorContractType(selectedProduct.productType);
      } else {
        setProductType('');
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!requesterName) newErrors.requesterName = 'Requester name required';
    if (!requesterMail) newErrors.requesterMail = 'Requester email required';
    if (!contractType) newErrors.contractType = 'Select contract type';

    if (contractType === 'new') {
      if (!vendorName) newErrors.vendorName = 'Vendor is required';
      if (!productName) newErrors.productName = 'Product is required';
      if (!contractDuration) newErrors.contractDuration = 'Contract duration is required';
      if (contractDuration && Number(contractDuration) < 0) {
        newErrors.contractDuration = 'Contract duration cannot be negative';
      }
      if (!dueDate) newErrors.dueDate = 'Due date is required';
      if (dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(dueDate);
        if (selectedDate < today) {
          newErrors.dueDate = 'Due date cannot be in the past for new contracts';
        }
      }
      if (!vendorContractType) newErrors.vendorContractType = 'Select usage or license';

      if (vendorContractType === 'usage') {
        if (newUsageCount === '' || newUsageCount === 0) {
          newErrors.newUsageCount = 'Enter usage amount';
        }
        if (!newUnits) newErrors.newUnits = 'Select unit';
        if (newUnits === 'others' && !newUnitsOther) {
          newErrors.newUnitsOther = 'Enter custom unit';
        }
      }

      if (vendorContractType === 'license') {
        if (newLicenseCount === '' || newLicenseCount === 0) {
          newErrors.newLicenseCount = 'Enter license count';
        }
        if (!newLicenseUnit) {
          newErrors.newLicenseUnit = 'Select license unit (agents / users)';
        }
      }
    }

    // 🔽🔽🔽 REPLACE THIS PART WITH BELOW 🔽🔽🔽
    if (contractType === 'existing') {
      if (!selectedExistingContractId) {
        newErrors.selectedExistingContractId = 'Select an existing contract';
      }
      if (!vendorContractType) {
        newErrors.vendorContractType = 'Existing contract has no billing type';
      }
      if (!renewalType) {
        newErrors.renewalType = 'Select renewal type';
      }
      if (!dueDate) {
        newErrors.dueDate = 'Due date is required';
      } else if (renewalDate) {
        const due = new Date(dueDate);
        const renewal = new Date(renewalDate);

        // Existing contract rule:
        // Due Date must NOT be earlier than Renewal Date
        if (due < renewal) {
          newErrors.dueDate =
            'For existing contracts, Due Date cannot be earlier than Renewal Date.';
        }
      }



      if (contractDuration && Number(contractDuration) < 0) {
        newErrors.contractDuration = 'Contract duration cannot be negative';
      }

      // ========== USAGE CONTRACT (existing) ==========
      if (vendorContractType === 'usage' && renewalType !== 'flat') {
        // allow 0, only block empty
        if (newUsageCount === '') {
          newErrors.newUsageCount = 'Enter new renewal usage amount';
        }

        if (!renewalNewUnits && newUsageCount === '') {
          newErrors.renewalNewUnits = 'Select unit for renewal or enter new usage';
        }

        if (renewalNewUnits === 'others' && !renewalNewUnitsOther) {
          newErrors.renewalNewUnitsOther = 'Enter custom unit for renewal';
        }

        if (
          typeof currentUsageCount === 'number' &&
          typeof newUsageCount === 'number'
        ) {
          // 🔼 UPGRADE: new MUST be >= current
          if (
            renewalType === 'upgrade' &&
            !newErrors.newUsageCount &&
            newUsageCount < currentUsageCount
          ) {
            newErrors.newUsageCount =
              `For upgrade, new usage must be greater than or equal to current usage (${currentUsageCount}).`;
          }

          // 🔽 DOWNGRADE: new MUST be <= current
          if (
            renewalType === 'downgrade' &&
            !newErrors.newUsageCount &&
            newUsageCount > currentUsageCount
          ) {
            newErrors.newUsageCount =
              `For downgrade, new usage must not be more than current usage (${currentUsageCount}).`;
          }
        }
      }

      // ========== LICENSE CONTRACT (existing) ==========
      if (vendorContractType === 'license' && renewalType !== 'flat') {
        // allow 0, only block empty
        if (renewalNewLicenseCount === '') {
          newErrors.renewalNewLicenseCount = 'Enter new renewal license count';
        }

        if (!renewalLicenseUnit) {
          newErrors.renewalLicenseUnit =
            'Select license unit (agents / users) for renewal';
        }

        if (
          typeof currentLicenseCount === 'number' &&
          typeof renewalNewLicenseCount === 'number'
        ) {
          // 🔼 UPGRADE: new MUST be >= current
          if (
            renewalType === 'upgrade' &&
            !newErrors.renewalNewLicenseCount &&
            renewalNewLicenseCount < currentLicenseCount
          ) {
            newErrors.renewalNewLicenseCount =
              `For upgrade, renewal license count must be greater than or equal to current license count (${currentLicenseCount}).`;
          }

          // 🔽 DOWNGRADE: new MUST be <= current
          if (
            renewalType === 'downgrade' &&
            !newErrors.renewalNewLicenseCount &&
            renewalNewLicenseCount > currentLicenseCount
          ) {
            newErrors.renewalNewLicenseCount =
              `For downgrade, renewal license count must not be more than current license count (${currentLicenseCount}).`;
          }
        }
      }
    }



    // 🔼🔼🔼 END OF REPLACED PART 🔼🔼🔼

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


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
    // Set submitting state for button loader only
    setIsSubmitting(true);
    // Clear any previous messages
    setSuccessMessage('');
    setErrorMessage('');
    // Reset toast states
    setShowSuccessToast(false);
    setShowErrorToast(false);
    // 👇 Compute what to send as CURRENT values
    let currentUnitsToSend =
      currentUnits === 'others'
        ? currentUnitsOther || undefined
        : currentUnits || undefined;

    let currentLicenseCountToSend =
      currentLicenseCount === '' ? undefined : currentLicenseCount;

    let currentLicenseUnitToSend =
      currentLicenseUnit || undefined;

    // 👇 For NEW + LICENSE, mirror NEW → CURRENT
    if (contractType === 'new' && vendorContractType === 'license') {
      currentLicenseCountToSend =
        newLicenseCount === '' ? undefined : newLicenseCount;

      // This will become "Current Units" in RequestSplitView
      currentUnitsToSend = newLicenseUnit || undefined;

      // Keep it consistent
      currentLicenseUnitToSend = newLicenseUnit || undefined;
    }

    const vendorDetails: any = {
      vendorName,
      productName,
      vendorContractType,

      // 👇 use computed CURRENT values
      currentUsageCount: currentUsageCount || undefined,
      currentUnits: currentUnitsToSend,
      currentLicenseCount: currentLicenseCountToSend,
      currentLicenseUnit: currentLicenseUnitToSend,

      newUsageCount: newUsageCount || undefined,
      newUnits:
        newUnits === 'others'
          ? newUnitsOther || undefined
          : newUnits || undefined,
      newLicenseCount: newLicenseCount || undefined,
      newLicenseUnit: newLicenseUnit || undefined,

      contractDuration: contractDuration || undefined,
      dueDate,
      // renewalDate: renewalDate || undefined,
      // Don't send renewalDate at creation time - it will be calculated after completion
      renewalDate: '',
      additionalComment,
      requesterName,
      requesterMail,
      department: userDepartmentName || '',
      organization: userOrganizationName || '',
      contractMode: contractType,
      selectedExistingContractId:
        contractType === 'existing' ? selectedExistingContractId : undefined,
      renewalType:
        contractType === 'existing' ? renewalType || undefined : undefined,
      renewalNewUnits:
        renewalNewUnits === 'others'
          ? renewalNewUnitsOther || undefined
          : renewalNewUnits || undefined,
      renewalNewUnitsOther: renewalNewUnitsOther || undefined,
      renewalNewLicenseCount: renewalNewLicenseCount || undefined,
      renewalLicenseUnit: renewalLicenseUnit || undefined,
      attachments,
    };

    console.log('📤 Vendor Details being sent:', vendorDetails);

    try {
      const payload = { vendorDetails };
      const created = await jiraService.createContractIssue(payload);

      if (attachments.length > 0 && created.key) {
        try {
          for (const file of attachments) {
            await jiraService.addAttachmentToIssue(created.key, file);
          }
        } catch (err) {
          console.error('Error uploading attachments:', err);
        }
      }

      // window.dispatchEvent(new CustomEvent('requestCreated'));
      // after 'created' is returned from jiraService.createContractIssue(payload)
      const issueKey = (created && (created as any).key) || (created && (created as any).issueKey);
      window.dispatchEvent(new CustomEvent('requestCreated', { detail: { issueKey } }));

      onIssueCreated?.(created as CreatedIssue);

      // Close modal immediately after success
      onClose();
      
      // Navigate with success state
      navigate('/request-management/all-open', { state: { toastMessage: 'Request successfully created', toastType: 'success' } });
    } catch (err) {
      console.error('Create failed', err);
      
      // Close modal and navigate with error state
      onClose();
      
      // Navigate with error state
      navigate('/request-management/all-open', { state: { toastMessage: 'Failed to create request. Please try again.', toastType: 'error' } });
    } finally {
      // Set submitting state to false when done
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
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
    } catch {
      try { inputEl?.focus(); } catch { }
    }
  };
  const focusDueDate = () => openDatePicker(dueDateRef.current);
  const focusRenewalDate = () => openDatePicker(renewalDateRef.current);

  const openDueDatePicker = () => {
    if (contractType === 'new') {
      openDatePicker(dueDateRef.current);
    } else if (contractType === 'existing') {
      // For existing contracts, we focus the DatePicker input
      const el = document.getElementById('dueDate');
      if (el) {
        el.focus();
        // Trigger mousedown event to open the DatePicker
        const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
        el.dispatchEvent(event);
      }
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  if (!isOpen) return null;

  const inputClass =
    'dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800';

  return (
    <>
      <PortalModal
        isOpen={isOpen}
        onClose={() => { resetForm(); onClose(); }}
        title="Create Procurement Request"
        size="xl"
      >

        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type of Contract <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
              <div className="n-chk">
                <div className="form-check form-check-inline">
                  <label className="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400" htmlFor="contractTypeNew">
                    <span className="relative">
                      <input
                        className="sr-only form-check-input"
                        id="contractTypeNew"
                        type="radio"
                        name="contractType"
                        value="new"
                        checked={contractType === 'new'}
                        onChange={() => setContractType('new')}
                      />
                      <span className="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700">
                        <span className={`h-2 w-2 rounded-full bg-white ${contractType === 'new' ? 'block' : 'hidden'}`}></span>
                      </span>
                    </span>
                    New Contract
                  </label>
                </div>
              </div>

              <div className="n-chk">
                <div className="form-check form-check-inline">
                  <label className="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400" htmlFor="contractTypeExisting">
                    <span className="relative">
                      <input
                        className="sr-only form-check-input"
                        id="contractTypeExisting"
                        type="radio"
                        name="contractType"
                        value="existing"
                        checked={contractType === 'existing'}
                        onChange={() => setContractType('existing')}
                      />
                      <span className="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700">
                        <span className={`h-2 w-2 rounded-full bg-white ${contractType === 'existing' ? 'block' : 'hidden'}`}></span>
                      </span>
                    </span>
                    Existing Contract
                  </label>
                </div>
              </div>
            </div>
            {errors.contractType && <p className="mt-1 text-sm text-red-600">{errors.contractType}</p>}
          </div>

          {contractType === 'new' && (
            <>

              <div className="mt-6">
                <label
                  htmlFor="vendorName"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                >
                  Vendor Name <span className="text-red-500">*</span>
                </label>

                <div className="relative" ref={vendorDropdownRef}>
                  <input
                    id="vendorName"
                    value={vendorName}
                    onChange={(e) => {
                      setVendorName(e.target.value);
                      setShowVendorDropdown(true);
                    }}
                    onFocus={() => setShowVendorDropdown(true)}
                    placeholder={loadingVendors ? 'Loading vendors...' : 'Start typing or click to see all vendors'}
                    className={inputClass}
                    autoComplete="off"
                  />

                  {showVendorDropdown && (
                    <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white text-sm shadow-lg dark:border-gray-700 dark:bg-gray-900">
                      {(vendorName
                        ? vendors.filter((v) =>
                          v.toLowerCase().startsWith(vendorName.toLowerCase())
                        )
                        : vendors
                      ).map((v) => (
                        <button
                          type="button"
                          key={v}
                          onClick={() => {
                            setVendorName(v);
                            setShowVendorDropdown(false);
                            // Trigger product loading when vendor is selected
                            setProducts([]); // Clear previous products
                          }}
                          className="block w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          {v}
                        </button>
                      ))}

                      {(vendorName
                        ? vendors.filter((v) =>
                          v.toLowerCase().startsWith(vendorName.toLowerCase())
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

                {errors.vendorName && (
                  <p className="mt-1 text-sm text-red-600">{errors.vendorName}</p>
                )}
              </div>

              <div className="mt-6">
                <label
                  htmlFor="productName"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                >
                  Product Name <span className="text-red-500">*</span>
                </label>

                <div className="relative" ref={productDropdownRef}>
                  <input
                    id="productName"
                    value={productName}
                    onChange={(e) => {
                      setProductName(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    placeholder={
                      loadingProducts
                        ? 'Loading products...'
                        : vendorName
                          ? 'Start typing or click to see all products'
                          : 'Select vendor first'
                    }
                    className={inputClass}
                    autoComplete="off"
                    disabled={!vendorName}
                  />

                  {showProductDropdown && !!vendorName && (
                    <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white text-sm shadow-lg dark:border-gray-700 dark:bg-gray-900">
                      {(productName
                        ? products.filter((p) =>
                          p.productName.toLowerCase().startsWith(productName.toLowerCase())
                        )
                        : products
                      ).map((p) => (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => {
                            setProductName(p.productName);
                            setShowProductDropdown(false);
                       
                            if (p.productType) {
                              setProductType(p.productType);
                              setVendorContractType(p.productType);
                            } else {
                              setProductType('');
                            }
                          }}
                          className="block w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          {p.productName}
                        </button>
                      ))}

                      {(productName
                        ? products.filter((p) =>
                          p.productName.toLowerCase().startsWith(productName.toLowerCase())
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

                {errors.productName && (
                  <p className="mt-1 text-sm text-red-600">{errors.productName}</p>
                )}
              </div>

              <div className="mt-6">
                {/* <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">Contract Billing</label> */}
                <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Contract Billing <span className="text-red-500">*</span>
                </label>

                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                  <div className="n-chk">
                    <div className={`form-check form-check-usage form-check-inline`}>
                      <label className="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400" htmlFor="billingUsage">
                        <span className="relative">
                          <input
                            className="sr-only form-check-input"
                            id="billingUsage"
                            type="radio"
                            name="billingType"
                            value="usage"
                            checked={vendorContractType === 'usage'}
                            onChange={() => setVendorContractType('usage')}
                          />
                          <span className="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700">
                            <span className={`h-2 w-2 rounded-full bg-white ${vendorContractType === 'usage' ? 'block' : 'hidden'}`}></span>
                          </span>
                        </span>
                        Usage
                      </label>
                    </div>
                  </div>

                  <div className="n-chk">
                    <div className={`form-check form-check-license form-check-inline`}>
                      <label className="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400" htmlFor="billingLicense">
                        <span className="relative">
                          <input
                            className="sr-only form-check-input"
                            id="billingLicense"
                            type="radio"
                            name="billingType"
                            value="license"
                            checked={vendorContractType === 'license'}
                            onChange={() => setVendorContractType('license')}
                          />
                          <span className="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700">
                            <span className={`h-2 w-2 rounded-full bg-white ${vendorContractType === 'license' ? 'block' : 'hidden'}`}></span>
                          </span>
                        </span>
                        License
                      </label>
                    </div>
                  </div>
                </div>

                {/* {productType && vendorContractType && productType !== vendorContractType && (
                      <div className="mt-2 text-sm text-yellow-600">Note: The selected product is typically {productType}-based, but you've selected {vendorContractType} billing.</div>
                    )} */}

                {vendorContractType === 'usage' && (
                  <>
                    <div className="mt-3 flex items-end space-x-3">
                      <div className="flex-1">
                        <label htmlFor="newUsageCount" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">How many volumes you want? <span className="text-red-500">*</span></label>
                        <input id="newUsageCount" placeholder="Enter number of volumes" value={newUsageCount} onChange={(e) => {
                          const value = e.target.value;

                          if (value === '') {
                            setNewUsageCount('');
                            return;
                          }

                          const num = Number(value);
                          if (Number.isNaN(num)) {
                            return;
                          }

                          setNewUsageCount(num);
                        }}
                          className={inputClass} />
                        {selectedExistingContractId && currentUsageCount !== '' && (<p className="mt-1 text-xs text-gray-500">Current: {currentUsageCount} {currentUnits === 'others' ? currentUnitsOther || '' : currentUnits || ''}</p>)}
                        {errors.newUsageCount && <p className="mt-1 text-sm text-red-600">{errors.newUsageCount}</p>}
                      </div>
                      <div style={{ minWidth: 140 }}>
                        <label htmlFor="newUnits" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Units <span className="text-red-500">*</span></label>
                        <select id="newUnits" value={newUnits} onChange={e => setNewUnits(e.target.value as any)} className={inputClass}>
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
                        <label htmlFor="newUnitsOther" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Specify other unit</label>
                        <input id="newUnitsOther" value={newUnitsOther} onChange={e => setNewUnitsOther(e.target.value)} placeholder="Type unit (e.g. messages, transactions)" className={inputClass} />
                        {errors.newUnitsOther && <p className="mt-1 text-sm text-red-600">{errors.newUnitsOther}</p>}
                      </div>
                    )}
                  </>
                )}

                {vendorContractType === 'license' && (
                  <div className="mt-3">
                    <label htmlFor="newLicenseCount" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">How many licenses do you want? <span className="text-red-500">*</span></label>
                    <div className="flex items-end space-x-3">
                      <input
                        id="newLicenseCount"
                        type="number"
                        min={0}                               // ⬅️ UI will not allow negative values via arrows
                        value={newLicenseCount}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (value === '') {
                            setNewLicenseCount('');
                            return;
                          }

                          const num = Number(value);
                          if (Number.isNaN(num)) {
                            return;
                          }

                          // ⬅️ Hard clamp: never store negative numbers
                          setNewLicenseCount(Math.max(0, num));
                        }}
                        placeholder="License Count"
                        className={inputClass}
                      />

                      <div style={{ minWidth: 140 }}>
                        <label htmlFor="newLicenseUnit" className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Unit</label>
                        <select id="newLicenseUnit" value={newLicenseUnit} onChange={e => setNewLicenseUnit(e.target.value as any)} className={inputClass}>
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

              <div className="mt-6">
                <label htmlFor="contractDuration" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Contract Duration (months) <span className="text-red-500">*</span></label>
                {/* <input id="contractDuration" type="number" value={contractDuration} onChange={e => setContractDuration(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Enter duration in months" className={inputClass} /> */}
                <input
                  id="contractDuration"
                  type="number"
                  min={0}                                // ⬅️ Stops negative typing
                  value={contractDuration}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (value === '') {
                      setContractDuration('');
                      return;
                    }

                    const num = Number(value);
                    if (Number.isNaN(num)) {
                      // ignore invalid characters and don't update state
                      return;
                    }

                    setContractDuration(Math.max(0, num));
                  }}

                  placeholder="Enter duration in months"
                  className={inputClass}
                />

                {errors.contractDuration && <p className="mt-1 text-sm text-red-600">{errors.contractDuration}</p>}
              </div>

              <div className="mt-6">
                <label htmlFor="dueDate" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Due Date <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input id="dueDate" ref={dueDateRef} type="date" min={renewalDate || todayStr} value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputClass} />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer" onClick={openDueDatePicker}>
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>}
              </div>
            </>
          )}

          {contractType === 'existing' && (
            <>
              <div className="mt-6">
                <label htmlFor="selectedExistingContractId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Select Existing Contract <span className="text-red-500">*</span></label>
                <select id="selectedExistingContractId" value={selectedExistingContractId} onChange={e => setSelectedExistingContractId(e.target.value)} className={inputClass}>
                  <option value="">{loadingExistingContracts ? 'Loading...' : 'Select Contract'}</option>
                  {existingContracts.map(c => <option key={c.id} value={c.id}>{c.vendorName} — {c.productName}</option>)}
                </select>
                {errors.selectedExistingContractId && <p className="mt-1 text-sm text-red-600">{errors.selectedExistingContractId}</p>}
              </div>

              <div className="mt-6">
                <label htmlFor="vendorNameExisting" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Vendor Name</label>
                <input id="vendorNameExisting" value={vendorName} readOnly disabled className={`${inputClass} bg-gray-100`} />
              </div>

              <div className="mt-6">
                <label htmlFor="productNameExisting" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Product Name</label>
                <input id="productNameExisting" value={productName} readOnly disabled className={`${inputClass} bg-gray-100`} />
              </div>

              <div className="mt-6">
                <label htmlFor="billingTypeExisting" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Billing Type</label>
                <input id="billingTypeExisting" value={vendorContractType} readOnly disabled className={`${inputClass} bg-gray-100`} />
              </div>

              {vendorContractType === 'usage' && (
                <div className="mt-6">
                  <label htmlFor="currentUsageCount" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Current volumes</label>
                  <div className="flex items-center space-x-2">
                    <input id="currentUsageCount" value={currentUsageCount ?? ''} readOnly disabled className={`${inputClass} flex-1 bg-gray-100`} />
                    <div style={{ minWidth: 140 }}>
                      <select id="currentUnits" value={currentUnits} disabled className={`${inputClass} bg-gray-100`} aria-label="Current units">
                        <option value="">Units</option>
                        <option value="credits">Credits</option>
                        <option value="minutes">Minutes</option>
                        <option value="others">Others</option>
                        {currentUnits && !['credits', 'minutes', 'others', ''].includes(currentUnits) && <option value={currentUnits}>{currentUnits}</option>}
                      </select>
                    </div>
                  </div>
                  {currentUnits === 'others' && currentUnitsOther && <p className="mt-1 text-xs text-gray-500">Custom unit: {currentUnitsOther}</p>}
                  {currentUnits && !['credits', 'minutes', 'others', ''].includes(currentUnits) && <p className="mt-1 text-xs text-gray-500">Unit: {currentUnits}</p>}

                  <div className="mt-3">
                    <label htmlFor="renewalTypeUsage" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Renewal Type</label>
                    <select id="renewalTypeUsage" value={renewalType} onChange={e => setRenewalType(e.target.value as any)} className={inputClass}>
                      <option value="">Select renewal type</option>
                      <option value="upgrade">Upgrade</option>
                      <option value="downgrade">Downgrade</option>
                      <option value="flat">Flat Renewal</option>
                    </select>
                    {errors.renewalType && <p className="mt-1 text-sm text-red-600">{errors.renewalType}</p>}
                  </div>

                  {renewalType !== 'flat' && renewalType !== '' && (
                    <div className="mt-3">
                      <label
                        htmlFor="renewalNewUsageCount"
                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                      >
                        New renewal usage count
                      </label>
                      <div className="flex items-end space-x-3">
                        <div className="flex-1">
                          <input
                            id="renewalNewUsageCount"
                            type="number"
                            min={0}
                            value={newUsageCount}
                            onChange={(e) => {
                              const value = e.target.value;

                              if (value === '') {
                                setNewUsageCount('');
                                return;
                              }

                              let num = Number(value);
                              if (Number.isNaN(num)) {
                                return;
                              }

                              // ⬅️ Hard clamp: never store negative numbers
                              num = Math.max(0, num);
                              setNewUsageCount(num);
                            }}
                            placeholder="Enter renewal usage"
                            className={inputClass}
                          />
                          {errors.newUsageCount && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.newUsageCount}
                            </p>
                          )}
                        </div>
                        <div style={{ minWidth: 140 }}>
                          <label
                            htmlFor="renewalNewUnits"
                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                          >
                            Unit
                          </label>
                          <select
                            id="renewalNewUnits"
                            value={renewalNewUnits || newUnits}
                            onChange={(e) => setRenewalNewUnits(e.target.value as any)}
                            className={inputClass}
                          >
                            <option value="">Select unit</option>
                            <option value="credits">Credits</option>
                            <option value="minutes">Minutes</option>
                            <option value="others">Others</option>
                          </select>
                          {errors.renewalNewUnits && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.renewalNewUnits}
                            </p>
                          )}
                        </div>
                      </div>

                      {renewalNewUnits === 'others' && (
                        <div className="mt-2">
                          <label
                            htmlFor="renewalNewUnitsOther"
                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                          >
                            Specify other unit for renewal
                          </label>
                          <input
                            id="renewalNewUnitsOther"
                            value={renewalNewUnitsOther}
                            onChange={(e) => setRenewalNewUnitsOther(e.target.value)}
                            placeholder="Type unit (e.g. transactions)"
                            className={inputClass}
                          />
                          {errors.renewalNewUnitsOther && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.renewalNewUnitsOther}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {vendorContractType === 'license' && (
                <div className="mt-6">
                  <label htmlFor="currentLicenseCount" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Current license count</label>
                  <input id="currentLicenseCount" value={currentLicenseCount ?? ''} readOnly disabled className={`${inputClass} bg-gray-100`} />
                  {currentLicenseUnit && <p className="mt-1 text-xs text-gray-500">Current license unit: {currentLicenseUnit}</p>}

                  <div className="mt-3">
                    <label htmlFor="renewalTypeLicense" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Renewal Type</label>
                    <select id="renewalTypeLicense" value={renewalType} onChange={e => setRenewalType(e.target.value as any)} className={inputClass}>
                      <option value="">Select renewal type</option>
                      <option value="upgrade">Upgrade</option>
                      <option value="downgrade">Downgrade</option>
                      <option value="flat">Flat Renewal</option>
                    </select>
                    {errors.renewalType && <p className="mt-1 text-sm text-red-600">{errors.renewalType}</p>}
                  </div>

                  {renewalType !== 'flat' && renewalType !== '' && (
                    <div className="mt-3">
                      <label htmlFor="renewalNewLicenseCount" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">How many licenses do you want to renew?</label>
                      <div className="flex items-end space-x-3">
                        <input
                          id="renewalNewLicenseCount"
                          type="number"
                          min={0}
                          value={renewalNewLicenseCount}
                          onChange={(e) => {
                            const value = e.target.value;

                            if (value === '') {
                              setRenewalNewLicenseCount('');
                              return;
                            }

                            const num = Number(value);
                            if (Number.isNaN(num)) {
                              return;
                            }

                            setRenewalNewLicenseCount(Math.max(0, num));
                          }}
                          placeholder="Enter renewal license count"
                          className={inputClass}
                        />

                        <div style={{ minWidth: 140 }}>
                          <label htmlFor="renewalLicenseUnit" className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Unit</label>
                          <select id="renewalLicenseUnit" value={renewalLicenseUnit} onChange={e => setRenewalLicenseUnit(e.target.value as any)} className={inputClass}>
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

              <div className="mt-6">
                <label htmlFor="renewalDate" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Renewal Date</label>
                <div className="relative">
                  <input id="renewalDate" ref={renewalDateRef} type="date" value={renewalDate} readOnly disabled className={`${inputClass} bg-gray-100`} />
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="dueDate"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                >
                  Due Date <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <DatePicker
                    id="dueDate"
                    selected={dueDate ? new Date(dueDate) : null}
                    onChange={(date: Date | null) => {
                      if (date) {
                        // keep the same yyyy-MM-dd format you already use everywhere
                        const iso = date.toISOString().split('T')[0];
                        setDueDate(iso);
                      } else {
                        setDueDate('');
                      }
                    }}
                    // same min logic as before: renewalDate or today
                    minDate={renewalDate ? new Date(renewalDate) : new Date()}
                    dateFormat="yyyy-MM-dd"
                    className={inputClass}
                    placeholderText="Select due date"
                    // optional: open calendar when clicking on input
                    calendarStartDay={1} // Monday start, remove if not needed
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer" onClick={openDueDatePicker}>
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {errors.dueDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
                )}
              </div>



            </>
          )}

          {contractType && (
            <>
              <div className="mt-6">
                <label htmlFor="additionalComment" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Additional Comment</label>
                <textarea id="additionalComment" value={additionalComment} onChange={e => setAdditionalComment(e.target.value)} rows={3} className={inputClass} placeholder="Enter additional comment" />
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Attachments</label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200"
                  onClick={() => document.getElementById('attachments-input')?.click()}
                >
                  <div className="flex flex-col items-center justify-center">
                    <svg className="h-10 w-10 text-gray-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm font-medium text-gray-700 mb-1">Click to upload files</p>
                    <p className="text-xs text-gray-500">or drag and drop files here</p>
                    <p className="text-xs text-gray-400 mt-1">Supports all file types</p>
                  </div>
                  <input
                    id="attachments-input"
                    type="file"
                    multiple
                    onChange={(e) => setAttachments(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                </div>
                {attachments.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected files ({attachments.length}):</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center truncate flex-1 min-w-0">
                            <svg className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            <div className="truncate">
                              <p className="truncate text-sm font-medium text-gray-700">{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                          </div>
                          <div className="flex space-x-1 ml-2 flex-shrink-0">
                            <button
                              onClick={() => {
                                // Preview functionality - open file in new tab
                                const url = URL.createObjectURL(file);
                                window.open(url, '_blank');
                              }}
                              className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-100"
                              title="Preview"
                            >
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                // Remove file from attachments
                                setAttachments(attachments.filter((_, i) => i !== index));
                              }}
                              className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100"
                              title="Remove"
                            >
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
      </div>

        <div className="flex items-center gap-3 mt-6 px-6 py-4 bg-gray-50 border-t border-gray-200 sm:justify-end">
          <button
            onClick={() => { resetForm(); onClose(); }}
            type="button"
            className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            type="button"
            className={`btn btn-success btn-update-event flex w-full justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white sm:w-auto ${isSubmitting ? 'bg-brand-400' : 'bg-brand-500 hover:bg-brand-600'}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Creating...
              </>
            ) : (
              'Create'
            )}
          </button>
        </div>
      
    </PortalModal>
  </>
  );
};

export default CreateIssueModal;