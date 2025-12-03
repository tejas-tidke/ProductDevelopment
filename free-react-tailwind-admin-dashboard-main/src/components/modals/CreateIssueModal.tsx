import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { jiraService } from '../../services/jiraService';
import { useAuth } from '../../context/AuthContext';
import AttachmentPreview from '../AttachmentPreview';

interface ExistingContract {
  id: string;
  vendorName: string;
  productName: string;
  requesterName: string;
  requesterMail: string;
  vendorContractType: 'usage' | 'license' | '';
  vendorStartDate: string;
  vendorEndDate: string;
  contractDuration?: number;
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

  // Date picker functions
  const toggleDatePicker = (field: string) => {
    setCurrentDateField(field);
    setShowDatePicker(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const closeDatePicker = () => {
    setShowDatePicker({
      dueDate: false,
      renewalDate: false,
      dueDateExisting: false,
      renewalDateExisting: false
    });
    setCurrentDateField('');
  };

  const handleDateSelect = (date: Date) => {
    // Format date as YYYY-MM-DD without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    switch(currentDateField) {
      case 'dueDate':
        setDueDate(formattedDate);
        break;
      case 'renewalDate':
        setRenewalDate(formattedDate);
        break;
      case 'dueDateExisting':
        setDueDate(formattedDate);
        break;
      case 'renewalDateExisting':
        setRenewalDate(formattedDate);
        break;
      default:
        break;
    }
    
    closeDatePicker();
  };

  // Get current date value for the active field
  const getCurrentDateValue = () => {
    switch(currentDateField) {
      case 'dueDate':
      case 'dueDateExisting':
        return dueDate;
      case 'renewalDate':
      case 'renewalDateExisting':
        return renewalDate;
      default:
        return '';
    }
  };

  // Custom Date Picker Component
  const DatePicker = ({ fieldId }: { fieldId: string }) => {
    const datePickerRef = useRef<HTMLDivElement>(null);
    const [displayMonth, setDisplayMonth] = useState<number>(
      getCurrentDateValue() ? new Date(getCurrentDateValue()).getMonth() : new Date().getMonth()
    );
    const [displayYear, setDisplayYear] = useState<number>(
      getCurrentDateValue() ? new Date(getCurrentDateValue()).getFullYear() : new Date().getFullYear()
    );
    
    // Close date picker when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
          if (showDatePicker[fieldId]) {
            closeDatePicker();
          }
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showDatePicker, fieldId]);

    // Reset display month/year when date picker is opened
    useEffect(() => {
      if (showDatePicker[fieldId]) {
        const currentDate = getCurrentDateValue() ? new Date(getCurrentDateValue()) : new Date();
        setDisplayMonth(currentDate.getMonth());
        setDisplayYear(currentDate.getFullYear());
      }
    }, [showDatePicker[fieldId]]);

    if (!showDatePicker[fieldId]) return null;
    
    // Generate calendar days
    const getDaysInMonth = (year: number, month: number) => {
      return new Date(year, month + 1, 0).getDate();
    };
    
    const getFirstDayOfMonth = (year: number, month: number) => {
      return new Date(year, month, 1).getDay();
    };
    
    const daysInMonth = getDaysInMonth(displayYear, displayMonth);
    const firstDayOfMonth = getFirstDayOfMonth(displayYear, displayMonth);
    
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      // Create date string in YYYY-MM-DD format to avoid timezone issues
      const monthStr = String(displayMonth + 1).padStart(2, '0');
      const dayStr = String(i).padStart(2, '0');
      const dateString = `${displayYear}-${monthStr}-${dayStr}`;
      // Store as a simple object instead of Date to avoid timezone conversion
      days.push({
        date: i,
        dateString: dateString,
        fullDate: new Date(displayYear, displayMonth, i)
      });
    }
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <div ref={datePickerRef} className="absolute z-50 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <button 
            onClick={() => {
              if (displayMonth === 0) {
                setDisplayYear(displayYear - 1);
                setDisplayMonth(11);
              } else {
                setDisplayMonth(displayMonth - 1);
              }
            }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="font-medium text-gray-800 dark:text-gray-200">
            {monthNames[displayMonth]} {displayYear}
          </div>
          <button 
            onClick={() => {
              if (displayMonth === 11) {
                setDisplayYear(displayYear + 1);
                setDisplayMonth(0);
              } else {
                setDisplayMonth(displayMonth + 1);
              }
            }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((dateObj, index) => (
            <div key={index} className="flex justify-center">
              {dateObj ? (
                <button
                  onClick={() => handleDateSelect(dateObj.fullDate)}
                  className={`w-8 h-8 text-sm rounded-full flex items-center justify-center 
                    ${getCurrentDateValue() === dateObj.dateString 
                      ? 'bg-blue-500 text-white' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}
                    ${dateObj.dateString === new Date().toISOString().split('T')[0] 
                      ? 'border border-blue-300' 
                      : ''}`}
                >
                  {dateObj.date}
                </button>
              ) : (
                <div className="w-8 h-8"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState<{[key: string]: boolean}>({
    dueDate: false,
    renewalDate: false,
    dueDateExisting: false,
    renewalDateExisting: false
  });
  const [currentDateField, setCurrentDateField] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement | null>(null);
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

  // Clear status messages and loader each time modal opens so nothing persists
  useEffect(() => {
    if (isOpen) {
      setSuccessMessage('');
      setErrorMessage('');
      setShowSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

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

  // Calculate renewal date based on due date and contract duration
  useEffect(() => {
    if (contractType === 'new' && dueDate && contractDuration && contractDuration > 0) {
      const [year, month, day] = dueDate.split('-').map(Number);
      const dueDateObj = new Date(year, month - 1, day);
      dueDateObj.setMonth(dueDateObj.getMonth() + contractDuration);
      const renewalYear = dueDateObj.getFullYear();
      const renewalMonth = String(dueDateObj.getMonth() + 1).padStart(2, '0');
      const renewalDay = String(dueDateObj.getDate()).padStart(2, '0');
      const renewalDateString = `${renewalYear}-${renewalMonth}-${renewalDay}`;
      setRenewalDate(renewalDateString);
    } else if (contractType === 'existing' && dueDate && contractDuration && contractDuration > 0) {
      const originalContract = existingContracts.find(c => c.id === selectedExistingContractId);
      if (originalContract && dueDate !== originalContract.vendorStartDate) {
        const [year, month, day] = dueDate.split('-').map(Number);
        const dueDateObj = new Date(year, month - 1, day);
        dueDateObj.setMonth(dueDateObj.getMonth() + contractDuration);
        const renewalYear = dueDateObj.getFullYear();
        const renewalMonth = String(dueDateObj.getMonth() + 1).padStart(2, '0');
        const renewalDay = String(dueDateObj.getDate()).padStart(2, '0');
        const renewalDateString = `${renewalYear}-${renewalMonth}-${renewalDay}`;
        setRenewalDate(renewalDateString);
      }
    } else if (contractType === 'new' && (!dueDate || !contractDuration || contractDuration <= 0)) {
      setRenewalDate('');
    } else if (contractType === 'existing' && (!dueDate || !contractDuration || contractDuration <= 0)) {
      const originalContract = existingContracts.find(c => c.id === selectedExistingContractId);
      if (originalContract && dueDate !== originalContract.vendorStartDate) {
        setRenewalDate('');
      }
    }
  }, [dueDate, contractDuration, contractType, existingContracts, selectedExistingContractId]);

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
            contractDuration: 
              (typeof c.contractDuration !== 'undefined' && c.contractDuration !== null)
                ? Number(c.contractDuration)
                : undefined,
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
      setAdditionalComment('');
      if (typeof found.contractDuration !== 'undefined' && found.contractDuration !== null) {
        setContractDuration(found.contractDuration);
      }
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
    }
  }, [newLicenseCount, selectedExistingContractId, contractType]);

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!requesterName) newErrors.requesterName = 'Requester name required';
    if (!requesterMail) newErrors.requesterMail = 'Requester email required';
    if (!contractType) newErrors.contractType = 'Select contract type';

    if (contractType === 'new') {
      if (!vendorName) newErrors.vendorName = 'Vendor is required';
      if (!productName) newErrors.productName = 'Product is required';
      if (contractDuration === '' || contractDuration === null || contractDuration === undefined) newErrors.contractDuration = 'Contract duration is required';
      if (typeof contractDuration === 'number' && contractDuration < 0) {
        newErrors.contractDuration = 'Contract duration cannot be negative';
      }
      if (!dueDate) newErrors.dueDate = 'Due date is required';
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(dueDate);
      if (selectedDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past for new contracts';
      }
      
      if (renewalDate) {
        const renewalSelectedDate = new Date(renewalDate);
        if (renewalSelectedDate < today) {
          newErrors.renewalDate = 'Renewal date cannot be in the past';
        }
      }
      
      if (!vendorContractType) newErrors.vendorContractType = 'Select usage or license';
      
      if (vendorContractType === 'usage') {
        if (newUsageCount === '' || newUsageCount === 0) newErrors.newUsageCount = 'Enter usage amount';
        if (!newUnits) newErrors.newUnits = 'Select unit';
        if (newUnits === 'others' && !newUnitsOther) newErrors.newUnitsOther = 'Enter custom unit';
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
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(dueDate);
      if (selectedDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past for existing contracts';
      }
      
      if (renewalDate) {
        const renewalSelectedDate = new Date(renewalDate);
        if (renewalSelectedDate < today) {
          newErrors.renewalDate = 'Renewal date cannot be in the past';
        }
      }
      
      if (typeof contractDuration === 'number' && contractDuration < 0) {
        newErrors.contractDuration = 'Contract duration cannot be negative';
      }

      // ---- USAGE CONTRACT ----
      if (vendorContractType === 'usage') {
        // Only validate renewal fields if not flat renewal
        if (renewalType !== 'flat') {
          if (!renewalNewUnits && (newUsageCount === '' || newUsageCount === 0)) {
            newErrors.renewalNewUnits = 'Select unit for renewal or enter new usage';
          }
          if (renewalNewUnits === 'others' && !renewalNewUnitsOther) {
            newErrors.renewalNewUnitsOther = 'Enter custom unit for renewal';
          }
          if (newUsageCount === '' || newUsageCount === 0) {
            newErrors.newUsageCount = 'Enter new renewal usage amount';
          }

          // ✅ Compare with current volumes based on renewalType
          if (
            typeof currentUsageCount === 'number' &&
            typeof newUsageCount === 'number'
          ) {
            if (
              renewalType === 'upgrade' &&
              !newErrors.newUsageCount &&            // don't override existing message
              newUsageCount <= currentUsageCount
            ) {
              newErrors.newUsageCount = `For upgrade, new usage must be greater than current usage (${currentUsageCount}).`;
            }

            if (
              renewalType === 'downgrade' &&
              !newErrors.newUsageCount &&
              newUsageCount >= currentUsageCount
            ) {
              newErrors.newUsageCount = `For downgrade, new usage must be less than current usage (${currentUsageCount}).`;
            }
          }
        }
      }

      // ---- LICENSE CONTRACT ----
      if (vendorContractType === 'license') {
        // Only validate renewal fields if not flat renewal
        if (renewalType !== 'flat') {
          if (renewalNewLicenseCount === '' || renewalNewLicenseCount === 0) {
            newErrors.renewalNewLicenseCount = 'Enter new renewal license count';
          }
          if (!renewalLicenseUnit) {
            newErrors.renewalLicenseUnit = 'Select license unit (agents / users) for renewal';
          }

          // ✅ Compare with current license count based on renewalType
          if (
            typeof currentLicenseCount === 'number' &&
            typeof renewalNewLicenseCount === 'number'
          ) {
            if (
              renewalType === 'upgrade' &&
              !newErrors.renewalNewLicenseCount &&
              renewalNewLicenseCount <= currentLicenseCount
            ) {
              newErrors.renewalNewLicenseCount =
                `For upgrade, renewal license count must be greater than current license count (${currentLicenseCount}).`;
            }

            if (
              renewalType === 'downgrade' &&
              !newErrors.renewalNewLicenseCount &&
              renewalNewLicenseCount >= currentLicenseCount
            ) {
              newErrors.renewalNewLicenseCount =
                `For downgrade, renewal license count must be less than current license count (${currentLicenseCount}).`;
            }
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...files]);
    }
  };

  // Handle removing an attachment
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle previewing an attachment
  const handlePreviewAttachment = (file: File) => {
    setPreviewFile(file);
    setShowPreview(true);
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
    // Reset status messages & loader so when modal reopens it starts clean
    setSuccessMessage('');
    setErrorMessage('');
    setShowSuccess(false);
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
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

    console.log('📤 Vendor Details being sent:', vendorDetails);
    try {
      const payload = { vendorDetails };
      const created = await jiraService.createContractIssue(payload);

      if (attachments.length > 0 && created.key) {
        try {
          // First, upload attachments to Jira
          const uploadedAttachments = [];
          for (const file of attachments) {
            const jiraResponse = await jiraService.addAttachmentToIssue(created.key, file);
            uploadedAttachments.push({ file, jiraResponse });
          }
          
          // (local saving commented out intentionally)
        } catch (err) {
          console.error('Error uploading attachments:', err);
          throw err; // Re-throw to prevent success message
        }
      }

      // --- Success Sequence ---

      // 1. Set success state to show the toast notification.
      setSuccessMessage('Request Created Successfully');
      setErrorMessage('');
      setShowSuccess(true);
      window.dispatchEvent(new CustomEvent('requestCreated'));

      // 2. Notify parent component.
      onIssueCreated?.(created as CreatedIssue);

      // 3. After a delay to show the success toast, navigate and close the modal.
      setTimeout(() => {
        navigate('/request-management/all-open');
        resetForm(); // Clears form for next time
        onClose();   // Closes the modal
      }, 2000); // 2-second delay for the user to see the success message

    } catch (err) {
      console.error('Create failed', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create request. Please try again.';
      setErrorMessage(errorMessage);
      setSuccessMessage('');
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
    
    // This is a fallback for browsers that don't support showPicker()
    inputEl.click();
  };
  const focusDueDate = () => openDatePicker(dueDateRef.current);
  const focusRenewalDate = () => openDatePicker(renewalDateRef.current);

  if (!isOpen) return null;

  const inputClass =
    'dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800';

  return (
    <>
      {showSuccess && (
        <div className="fixed top-5 right-5 z-[100000] bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-fade-in">
          🎉 {successMessage}
        </div>
      )}

      {/* Attachment Preview Modal */}
      {showPreview && previewFile && (
        <AttachmentPreview 
          file={previewFile} 
          onClose={() => setShowPreview(false)} 
        />
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
            {/* Loader overlay while submitting */}
            {isSubmitting && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-black/40 rounded-2xl">
                <div className="flex flex-col items-center space-y-2">
                  <svg className="animate-spin -ml-1 mr-2 h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <div className="text-sm text-gray-700 dark:text-gray-200">Submitting...</div>
                </div>
              </div>
            )}

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
              {successMessage && !isSubmitting && ( // Show inline message only if submission is complete but modal hasn't closed
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
                    <input
                      id="contractDuration"
                      type="number"
                      min={0}
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
                      <input 
                        id="dueDate" 
                        ref={dueDateRef} 
                        type="text" 
                        value={dueDate || ''} 
                        readOnly 
                        className={inputClass} 
                        onClick={() => toggleDatePicker('dueDate')}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer" onClick={() => toggleDatePicker('dueDate')}>
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <DatePicker fieldId="dueDate" />
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
                          <label htmlFor="renewalNewUsageCount" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">New renewal usage count</label>
                          <div className="flex items-end space-x-3">
                            <div className="flex-1">
                              <input id="renewalNewUsageCount" type="number" value={newUsageCount} onChange={e => setNewUsageCount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Enter renewal usage" className={inputClass} />
                              {errors.newUsageCount && <p className="mt-1 text-sm text-red-600">{errors.newUsageCount}</p>}
                            </div>
                            <div style={{ minWidth: 140 }}>
                              <label htmlFor="renewalNewUnits" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Unit</label>
                              <select id="renewalNewUnits" value={renewalNewUnits || newUnits} onChange={e => setRenewalNewUnits(e.target.value as any)} className={inputClass}>
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
                              <label htmlFor="renewalNewUnitsOther" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Specify other unit for renewal</label>
                              <input id="renewalNewUnitsOther" value={renewalNewUnitsOther} onChange={e => setRenewalNewUnitsOther(e.target.value)} placeholder="Type unit (e.g. transactions)" className={inputClass} />
                              {errors.renewalNewUnitsOther && <p className="mt-1 text-sm text-red-600">{errors.renewalNewUnitsOther}</p>}
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
                    <label htmlFor="contractDurationExisting" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Contract Duration (months) <span className="text-red-500">*</span></label>
                    <input 
                      id="contractDurationExisting" 
                      type="number" 
                      min={0}
                      value={contractDuration}
                      onChange={(e) => {
                        const value = e.target.value;
                        
                        if (value === '') {
                          setContractDuration('');
                          return;
                        }
                        
                        const num = Number(value);
                        if (Number.isNaN(num)) {
                          return;
                        }
                        
                        setContractDuration(Math.max(0, num));
                      }} 
                      placeholder="Enter duration in months" 
                      className={inputClass} 
                    />
                  </div>

                  <div className="mt-6">
                    <label htmlFor="renewalDate" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Renewal Date</label>
                    <div className="relative">
                      <input 
                        id="renewalDate" 
                        ref={renewalDateRef} 
                        type="text" 
                        value={renewalDate || ''} 
                        readOnly 
                        className={`${inputClass} bg-gray-100`} 
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label htmlFor="dueDateExisting" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Due Date</label>
                    <div className="relative">
                      <input 
                        id="dueDateExisting" 
                        type="text" 
                        value={dueDate || ''} 
                        readOnly 
                        className={inputClass} 
                        onClick={() => toggleDatePicker('dueDateExisting')}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer" onClick={() => toggleDatePicker('dueDateExisting')}>
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <DatePicker fieldId="dueDateExisting" />
                    </div>
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
                    <div className="border border-gray-300 rounded-md p-3 dark:border-gray-600">
                      {/* File input */}
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        id="attachment-input"
                      />
                      <label
                        htmlFor="attachment-input"
                        className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                      >
                        <svg
                          className="mr-2 -ml-1 h-5 w-5 text-gray-500"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8 4a3 3 0 00-3 7v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Add Files
                      </label>

                      {/* Selected attachments */}
                      {attachments.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Selected Files:
                          </h4>
                          <ul className="space-y-2">
                            {attachments.map((file, index) => (
                              <li
                                key={`${file.name}-${file.size}`}
                                className="flex items-center justify-between text-sm bg-gray-100 rounded p-2 dark:bg-gray-700"
                              >
                                <div className="flex items-center truncate max-w-xs">
                                  <svg
                                    className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span className="truncate">{file.name}</span>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handlePreviewAttachment(file)}
                                    className="text-blue-500 hover:text-blue-700"
                                    title="Preview"
                                  >
                                    <svg
                                      className="h-5 w-5"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                      <path
                                        fillRule="evenodd"
                                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAttachment(index)}
                                    className="text-red-500 hover:text-red-700"
                                    title="Remove"
                                  >
                                    <svg
                                      className="h-5 w-5"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
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
