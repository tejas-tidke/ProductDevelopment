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
    }
  }, [isOpen, userData, currentUser]);

  useEffect(() => {
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

      // Only load when vendorName matches one from the list (avoid calls on "a", "ab", etc.)
      const exactMatch = vendors.includes(vendorName);
      if (!exactMatch) return;

      try {
        setLoadingProducts(true);
        const list = await jiraService.getProductsByVendor(vendorName);
        if (Array.isArray(list)) setProducts(list);
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

  // useEffect(() => {
  //   if ((contractType === 'new' || contractType === 'existing') && contractDuration) {
  //     const today = new Date().toISOString().split('T')[0];
  //     const newRenewalDate = addMonths(today, contractDuration);
  //     setRenewalDate(newRenewalDate);
  //   }
  // }, [contractType, contractDuration]);
  useEffect(() => {
    // ✅ Only calculate renewal date when creating a NEW contract
    if (contractType === 'new' && contractDuration) {
      const today = new Date().toISOString().split('T')[0];
      const newRenewalDate = addMonths(today, contractDuration);
      setRenewalDate(newRenewalDate);
    }
  }, [contractType, contractDuration]);


  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProductName = e.target.value;
    setProductName(selectedProductName);
    setVendorContractType('');
    if (selectedProductName && vendorName) {
      jiraService
        .getProductType(vendorName, selectedProductName)
        .then((response: { productType: string }) => {
          if (response.productType) {
            setProductType(response.productType as 'license' | 'usage' | '');
            if (response.productType === 'license') setVendorContractType('license');
            else if (response.productType === 'usage') setVendorContractType('usage');
          }
        })
        .catch((err) => {
          console.error('Error fetching product type', err);
          setProductType('');
        });
    }
  };

  // const validateForm = () => {
  //   const newErrors: Record<string, string> = {};
  //   if (!requesterName) newErrors.requesterName = 'Requester name required';
  //   if (!requesterMail) newErrors.requesterMail = 'Requester email required';
  //   if (!contractType) newErrors.contractType = 'Select contract type';

  //   if (contractType === 'new') {
  //     if (!vendorName) newErrors.vendorName = 'Vendor is required';
  //     if (!productName) newErrors.productName = 'Product is required';
  //     if (!contractDuration) newErrors.contractDuration = 'Contract duration is required';
  //     // if (contractDuration && Number(contractDuration) < 0) newErrors.contractDuration = 'Contract duration cannot be negative';
  //     if (!dueDate) newErrors.dueDate = 'Due date is required';
  //     if (dueDate) {
  //       const today = new Date(); today.setHours(0, 0, 0, 0);
  //       const selectedDate = new Date(dueDate);
  //       if (selectedDate < today) newErrors.dueDate = 'Due date cannot be in the past for new contracts';
  //     }
  //     if (!vendorContractType) newErrors.vendorContractType = 'Select usage or license';
  //     if (vendorContractType === 'usage') {
  //       if (newUsageCount === '' || newUsageCount === 0) newErrors.newUsageCount = 'Enter usage amount';
  //       if (!newUnits) newErrors.newUnits = 'Select unit';
  //       if (newUnits === 'others' && !newUnitsOther) newErrors.newUnitsOther = 'Enter custom unit';
  //     }
  //     if (vendorContractType === 'license') {
  //       if (newLicenseCount === '' || newLicenseCount === 0) newErrors.newLicenseCount = 'Enter license count';
  //       if (!newLicenseUnit) newErrors.newLicenseUnit = 'Select license unit (agents / users)';
  //     }
  //   }

  //   if (contractType === 'existing') {
  //     if (!selectedExistingContractId) newErrors.selectedExistingContractId = 'Select an existing contract';
  //     if (!vendorContractType) newErrors.vendorContractType = 'Existing contract has no billing type';
  //     if (!renewalType) newErrors.renewalType = 'Select renewal type';
  //     if (!dueDate) newErrors.dueDate = 'Due date is required';
  //     if (contractDuration && Number(contractDuration) < 0) newErrors.contractDuration = 'Contract duration cannot be negative';
  //     if (vendorContractType === 'usage') {
  //       if (renewalType !== 'flat') {
  //         if (!renewalNewUnits && (newUsageCount === '' || newUsageCount === 0)) newErrors.renewalNewUnits = 'Select unit for renewal or enter new usage';
  //         if (renewalNewUnits === 'others' && !renewalNewUnitsOther) newErrors.renewalNewUnitsOther = 'Enter custom unit for renewal';
  //         if (newUsageCount === '' || newUsageCount === 0) newErrors.newUsageCount = 'Enter new renewal usage amount';
  //       }
  //     }
  //     if (vendorContractType === 'license') {
  //       if (renewalType !== 'flat') {
  //         if (renewalNewLicenseCount === '' || renewalNewLicenseCount === 0) newErrors.renewalNewLicenseCount = 'Enter new renewal license count';
  //         if (!renewalLicenseUnit) newErrors.renewalLicenseUnit = 'Select license unit (agents / users) for renewal';
  //       }
  //     }
  //   }

  //   setErrors(newErrors);
  //   return Object.keys(newErrors).length === 0;
  // };

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
  setIsSubmitting(true);
  setSuccessMessage('');
  setErrorMessage('');

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
    renewalDate: renewalDate || undefined,
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

    setSuccessMessage('Request successfully created');
    setErrorMessage('');
    setShowSuccess(true);
    window.dispatchEvent(new CustomEvent('requestCreated'));

    setTimeout(() => setShowSuccess(false), 1800);
    onIssueCreated?.(created as CreatedIssue);
    resetForm();

    setTimeout(() => {
      onClose();
      navigate('/request-management/all-open');
    }, 1200);
  } catch (err) {
    console.error('Create failed', err);
    setErrorMessage('Failed to create request. Please try again.');
    setSuccessMessage('');
  } finally {
    setIsSubmitting(false);
  }
};


    // useEffect(() => {
    //   const handleClickOutside = (e: MouseEvent) => {
    //     if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
    //       dropdownRef.current.classList.add('hidden');
    //     }
    //   };
    //   document.addEventListener('mousedown', handleClickOutside);
    //   return () => document.removeEventListener('mousedown', handleClickOutside);
    // }, []);

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

    const todayStr = new Date().toISOString().split('T')[0];
    if (!isOpen) return null;

    const inputClass =
      'dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800';

    return (
      <>
        {showSuccess && (
          <div className="fixed top-5 right-5 z-[100000] bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-fade-in">
            🎉 Issue Created Successfully!
          </div>
        )}

        {/* Full-screen container */}
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          {/* Frosted / blurred backdrop similar to provided image */}
          <div
            className="fixed inset-0"
            onClick={onClose}
            style={{
              // translucent overlay color + frosted blur
              background:
                'linear-gradient(180deg, rgba(232,236,243,0.55), rgba(220,224,233,0.55))',
              backdropFilter: 'blur(30px) saturate(110%)',
              WebkitBackdropFilter: 'blur(30px) saturate(110%)',
            }}
          />

          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden>
              {'\u200B'}
            </span>

            <div
              className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full dark:bg-gray-800 z-[10000] relative"
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-procurement-title"
              onClick={(e) => e.stopPropagation()} // prevent clicks inside modal from closing backdrop
            >
              {/* Close button (round) */}
              <button
                onClick={() => { resetForm(); onClose(); }}
                aria-label="Close modal"
                className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white dark:bg-gray-700 dark:hover:bg-gray-600"
                style={{ backdropFilter: 'blur(4px)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
                <h5 id="create-procurement-title" className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                  Create Procurement Request
                </h5>
                <p className="text-sm text-gray-500 dark:text-gray-400">Fill details for the new request</p>
              </div>

              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {successMessage && (
                  <div className="mb-4 rounded-md border bg-green-50 border-green-200 px-4 py-2 text-sm text-green-800">{successMessage}</div>
                )}
                {errorMessage && (
                  <div className="mb-4 rounded-md border bg-red-50 border-red-200 px-4 py-2 text-sm text-red-800">{errorMessage}</div>
                )}

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
                    {/* <div className="mt-6">
                    <label htmlFor="vendorName" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Vendor Name <span className="text-red-500">*</span></label>
                    <select id="vendorName" value={vendorName} onChange={(e) => setVendorName(e.target.value)} className={inputClass}>
                      <option value="">{loadingVendors ? 'Loading vendors...' : 'Select Vendor'}</option>
                      {vendors.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    {errors.vendorName && <p className="mt-1 text-sm text-red-600">{errors.vendorName}</p>}
                  </div> */}

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
                                  handleProductChange({
                                    target: { value: p.productName },
                                  } as React.ChangeEvent<HTMLSelectElement>);
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

                      {productType && vendorContractType && productType !== vendorContractType && (
                        <div className="mt-2 text-sm text-yellow-600">Note: The selected product is typically {productType}-based, but you've selected {vendorContractType} billing.</div>
                      )}

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

                    {/* <div className="mt-6">
                    <label htmlFor="contractDurationExisting" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Contract Duration (months) <span className="text-red-500">*</span></label>
                    <input id="contractDurationExisting" type="number" value={contractDuration} onChange={e => setContractDuration(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Enter duration in months" className={inputClass} />
                  </div> */}

                    <div className="mt-6">
                      <label htmlFor="renewalDate" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Renewal Date</label>
                      <div className="relative">
                        <input id="renewalDate" ref={renewalDateRef} type="date" value={renewalDate} readOnly disabled className={`${inputClass} bg-gray-100`} />
                      </div>
                    </div>

                    <div className="mt-6">
                      <label
                        htmlFor="dueDateExisting"
                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                      >
                        Due Date
                      </label>
                      <div className="relative">
                        <input
                          id="dueDateExisting"
                          type="date"
                          value={dueDate}
                          onChange={e => setDueDate(e.target.value)}
                          className={inputClass}
                        />
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
                      <label htmlFor="attachments" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Attachments</label>
                      <input id="attachments" type="file" multiple onChange={(e) => setAttachments(Array.from(e.target.files || []))} className={inputClass} />
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
            </div>
          </div>
        </div>
      </>
    );
  };

  export default CreateIssueModal;
