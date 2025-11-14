import React, { useEffect, useRef, useState } from 'react';
import { jiraService } from '../../services/jiraService';

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

const CreateIssueModal: React.FC<CreateIssueModalProps> = ({ isOpen, onClose, onIssueCreated }) => {
  const [requesterName, setRequesterName] = useState('');
  const [requesterMail, setRequesterMail] = useState('');
  const [contractType, setContractType] = useState<'new' | 'existing' | ''>('');

  const [vendorName, setVendorName] = useState('');
  const [productName, setProductName] = useState('');
  const [vendorContractType, setVendorContractType] = useState<'usage' | 'license' | ''>('');

  const [currentUsageCount, setCurrentUsageCount] = useState<number | ''>('');
  const [currentUnits, setCurrentUnits] = useState<'credits' | 'minutes' | 'others' | ''>('');
  const [currentUnitsOther, setCurrentUnitsOther] = useState(''); // display for current custom unit
  const [currentLicenseCount, setCurrentLicenseCount] = useState<number | ''>('');
  const [currentLicenseUnit, setCurrentLicenseUnit] = useState<'agents' | 'users' | ''>('');

  const [newUsageCount, setNewUsageCount] = useState<number | ''>('');
  const [newUnits, setNewUnits] = useState<'credits' | 'minutes' | 'others' | ''>('');
  const [newUnitsOther, setNewUnitsOther] = useState(''); // custom text when others selected
  const [newLicenseCount, setNewLicenseCount] = useState<number | ''>('');
  const [newLicenseUnit, setNewLicenseUnit] = useState<'agents' | 'users' | ''>(''); // for NEW license unit

  const [dueDate, setDueDate] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [additionalComment, setAdditionalComment] = useState('');

  const [existingContracts, setExistingContracts] = useState<ExistingContract[]>([]);
  const [selectedExistingContractId, setSelectedExistingContractId] = useState('');
  const [loadingExistingContracts, setLoadingExistingContracts] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // feedback messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // NEW: renewalType for existing contract
  const [renewalType, setRenewalType] = useState<'upgrade' | 'downgrade' | 'flat' | ''>('');

  // For existing renewal: separate fields for units/others/license unit
  const [renewalNewUnits, setRenewalNewUnits] = useState<'credits' | 'minutes' | 'others' | ''>('');
  const [renewalNewUnitsOther, setRenewalNewUnitsOther] = useState('');
  const [renewalNewLicenseCount, setRenewalNewLicenseCount] = useState<number | ''>('');
  const [renewalLicenseUnit, setRenewalLicenseUnit] = useState<'agents' | 'users' | ''>('');

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const dueDateRef = useRef<HTMLInputElement | null>(null);
  const renewalDateRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (typeof jiraService.getCurrentUser === 'function') {
          const user = await jiraService.getCurrentUser();
          setRequesterName(user?.displayName ?? user?.name ?? '');
          setRequesterMail(user?.emailAddress ?? user?.email ?? '');
        }
      } catch (err) {
        console.error('Error fetching current user', err);
      }
    };

    if (isOpen) loadUser();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && contractType === 'existing') {
      fetchExistingContracts();
    }
  }, [isOpen, contractType]);

  // When selecting an existing contract -> populate fields and also prefill NEW fields from current
  useEffect(() => {
    if (contractType === 'existing' && selectedExistingContractId) {
      const found = existingContracts.find(c => c.id === selectedExistingContractId);
      if (found) {
        setVendorName(found.vendorName);
        setProductName(found.productName);
        setVendorContractType(found.vendorContractType);
        setDueDate(found.vendorStartDate || '');
        setRenewalDate(found.vendorEndDate || '');
        setAdditionalComment(found.additionalComment ?? '');
        if (found.requesterName) setRequesterName(found.requesterName);
        if (found.requesterMail) setRequesterMail(found.requesterMail);

        // Reset renewalType when selecting a contract (user will choose)
        setRenewalType('');

        if (typeof found.vendorUsage !== 'undefined' && found.vendorUsage !== null) {
          const usageNum = Number(found.vendorUsage) || 0;
          if (found.vendorContractType === 'usage') {
            setCurrentUsageCount(usageNum);
            setCurrentLicenseCount('');
            setNewUsageCount(usageNum); // prefill NEW from existing usage (convenience)
            setNewUnits((found.vendorUnit as any) ?? '');
            setNewLicenseCount('');
            // if vendorUnit is a custom text, we try to preserve it in currentUnitsOther
            if (found.vendorUnit && !['credits', 'minutes', 'others'].includes(found.vendorUnit)) {
              setCurrentUnits('others');
              setCurrentUnitsOther(found.vendorUnit);
              setNewUnits('others');
              setNewUnitsOther(found.vendorUnit);
            } else {
              setCurrentUnits((found.vendorUnit as any) ?? '');
              setCurrentUnitsOther('');
            }
          } else if (found.vendorContractType === 'license') {
            setCurrentLicenseCount(usageNum);
            setCurrentUsageCount('');
            setNewLicenseCount(usageNum); // prefill NEW from existing license (convenience)
            setNewUsageCount('');
            setNewUnits('');
            // if contract has license unit saved somewhere in vendorUnit, map it
            if (found.vendorUnit === 'agents' || found.vendorUnit === 'users') {
              setCurrentLicenseUnit(found.vendorUnit as any);
              setNewLicenseUnit(found.vendorUnit as any);
            } else {
              setCurrentLicenseUnit('');
              setNewLicenseUnit('');
            }
          } else {
            setCurrentUsageCount('');
            setCurrentLicenseCount('');
            setNewUsageCount('');
            setNewLicenseCount('');
            setNewUnits('');
          }
        } else {
          setCurrentUsageCount('');
          setCurrentLicenseCount('');
          setNewUsageCount('');
          setNewLicenseCount('');
          setNewUnits('');
        }

        setCurrentUnits((found.vendorUnit as any) ?? '');
      }
    }
  }, [selectedExistingContractId, contractType, existingContracts]);

  // If user switches to NEW while an existing contract is selected,
  // prefill new fields from the selected existing contract (convenience)
  useEffect(() => {
    if (contractType === 'new' && selectedExistingContractId) {
      const found = existingContracts.find(c => c.id === selectedExistingContractId);
      if (found) {
        if (typeof found.vendorUsage !== 'undefined' && found.vendorUsage !== null) {
          const usageNum = Number(found.vendorUsage) || 0;
          if (found.vendorContractType === 'usage') {
            setNewUsageCount(usageNum);
            setNewUnits((found.vendorUnit as any) ?? '');
            setVendorContractType('usage');
            if (found.vendorUnit && !['credits', 'minutes', 'others'].includes(found.vendorUnit)) {
              setNewUnits('others');
              setNewUnitsOther(found.vendorUnit);
            }
          } else if (found.vendorContractType === 'license') {
            setNewLicenseCount(usageNum);
            setVendorContractType('license');
            if (found.vendorUnit === 'agents' || found.vendorUnit === 'users') {
              setNewLicenseUnit(found.vendorUnit as any);
            }
          }
        }
        if (!vendorName) setVendorName(found.vendorName);
        if (!productName) setProductName(found.productName);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractType, selectedExistingContractId]);

  // ********** UPDATED: Sync from New -> Current (ONLY when contractType === 'new') **********
  useEffect(() => {
    if (contractType !== 'new') return; // do not sync when editing existing contract

    if (newUsageCount === '' || newUsageCount === null) {
      if (selectedExistingContractId) setCurrentUsageCount('');
      return;
    }
    if (typeof newUsageCount === 'number' && !Number.isNaN(newUsageCount)) {
      setCurrentUsageCount(newUsageCount);
      if (newUnits) setCurrentUnits(newUnits);
      // if others selected and custom provided use that as currentUnitsOther
      if (newUnits === 'others' && newUnitsOther) setCurrentUnitsOther(newUnitsOther);
    }
  }, [newUsageCount, newUnits, newUnitsOther, selectedExistingContractId, contractType]);

  // ********** UPDATED: Sync newLicenseCount -> currentLicenseCount (ONLY when contractType === 'new') **********
  useEffect(() => {
    if (contractType !== 'new') return; // do not sync when editing existing contract

    if (newLicenseCount === '' || newLicenseCount === null) {
      if (selectedExistingContractId) setCurrentLicenseCount('');
      return;
    }
    if (typeof newLicenseCount === 'number' && !Number.isNaN(newLicenseCount)) {
      setCurrentLicenseCount(newLicenseCount);
    }
  }, [newLicenseCount, selectedExistingContractId, contractType]);

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
    setDueDate('');
    setRenewalDate('');
    setAdditionalComment('');
    setExistingContracts([]);
    setSelectedExistingContractId('');
    setErrors({});
    setRenewalType(''); // reset renewal type
    setRenewalNewUnits('');
    setRenewalNewUnitsOther('');
    setRenewalNewLicenseCount('');
    setRenewalLicenseUnit('');
  };

  const fetchExistingContracts = async () => {
    try {
      setLoadingExistingContracts(true);
      if (typeof jiraService.getContracts !== 'function') return;
      const data = await jiraService.getContracts();
      const mapped = Array.isArray(data)
        ? data.map((c: any) => ({
            id: String(c.id ?? c.contractId ?? c.key ?? ''),
            vendorName: c.vendorName ?? '',
            productName: c.productName ?? '',
            requesterName: c.requesterName ?? '',
            requesterMail: c.requesterMail ?? '',
            vendorContractType: (c.vendorContractType ?? '') as 'usage' | 'license' | '',
            vendorStartDate: String(c.vendorStartDate ?? ''),
            vendorEndDate: String(c.vendorEndDate ?? ''),
            additionalComment: c.additionalComment ?? '',
            vendorUnit: c.vendorUnit ?? c.unit ?? '',
            vendorUsage:
              typeof c.vendorUsage !== 'undefined'
                ? Number(c.vendorUsage)
                : typeof c.usage !== 'undefined'
                ? Number(c.usage)
                : typeof c.count !== 'undefined'
                ? Number(c.count)
                : undefined,
          }))
        : [];
      setExistingContracts(mapped);
    } catch (err) {
      console.error('Error fetching existing contracts', err);
    } finally {
      setLoadingExistingContracts(false);
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
      if (!dueDate) newErrors.dueDate = 'Due date is required';
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

      // require user to choose renewal type
      if (!renewalType) newErrors.renewalType = 'Select renewal type';

      // If renewal type is upgrade/downgrade we require new renewal inputs.
      if (vendorContractType === 'usage') {
        if (renewalType !== 'flat') {
          if (renewalNewUnits === '' || renewalNewUnits === undefined) newErrors.renewalNewUnits = 'Select unit for renewal';
          if (renewalNewUnits === 'others' && !renewalNewUnitsOther) newErrors.renewalNewUnitsOther = 'Enter custom unit for renewal';
          if (renewalType !== 'flat' && (renewalNewUnits === '' || renewalNewUnits === undefined) && (newUsageCount === '' || newUsageCount === 0)) {
            // ensure a numeric count is present (we use newUsageCount in the existing flow as the value container)
            if (newUsageCount === '' || newUsageCount === 0) newErrors.newUsageCount = 'Enter new renewal usage amount';
          }
          if (renewalType !== 'flat' && (newUsageCount === '' || newUsageCount === 0)) newErrors.newUsageCount = 'Enter new renewal usage amount';
        }
      }
      if (vendorContractType === 'license') {
        if (renewalType !== 'flat') {
          if (renewalNewLicenseCount === '' || renewalNewLicenseCount === 0) newErrors.renewalNewLicenseCount = 'Enter new renewal license count';
          if (!renewalLicenseUnit) newErrors.renewalLicenseUnit = 'Select license unit (agents / users) for renewal';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const vendorDetails = {
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
      dueDate,
      renewalDate: renewalDate || undefined,
      additionalComment,
      requesterName,
      requesterMail,
      contractMode: contractType,
      selectedExistingContractId: contractType === 'existing' ? selectedExistingContractId : undefined,
      renewalType: contractType === 'existing' ? renewalType || undefined : undefined,
      // if existing renewal fields used, include them
      renewalNewUnits: renewalNewUnits === 'others' ? renewalNewUnitsOther || undefined : renewalNewUnits || undefined,
      renewalNewUnitsOther: renewalNewUnitsOther || undefined,
      renewalNewLicenseCount: renewalNewLicenseCount || undefined,
      renewalLicenseUnit: renewalLicenseUnit || undefined,
    };

    try {
      const payload = { summary: `${vendorName || 'Contract'}`, vendorDetails };
      const created = typeof jiraService.createIssueJira === 'function'
        ? await jiraService.createIssueJira(payload)
        : ({ id: 'local', key: 'LOCAL-1', fields: payload } as CreatedIssue);

      // show success message (light green)
      setSuccessMessage('Request successfully created');

      // clear any previous errors
      setErrorMessage('');

      onIssueCreated?.(created);
      resetForm();
      onClose();
    } catch (err) {
      console.error('Create failed', err);
      setErrorMessage('Failed to create request. Please try again.');
      setSuccessMessage('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        dropdownRef.current.classList.add('hidden');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Utility to open native date picker reliably across browsers.
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
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden>{'\u200B'}</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full dark:bg-gray-800 z-[9999] relative">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Create Procurement Request</h3>
          </div>

          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-4">
            {/* feedback banners */}
            {successMessage && (
              <div className="mb-4 rounded-md border bg-green-50 border-green-200 px-4 py-2 text-sm text-green-800">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="mb-4 rounded-md border bg-red-50 border-red-200 px-4 py-2 text-sm text-red-800">
                {errorMessage}
              </div>
            )}
            {/* Contract Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type of Contract  <span className="text-red-500">*</span> </label>
              <div className="flex flex-col space-y-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="contractType"
                    value="new"
                    checked={contractType === 'new'}
                    onChange={() => {
                      setContractType('new');
                    }}
                  />
                  <span className="ml-2">New Contract</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="contractType"
                    value="existing"
                    checked={contractType === 'existing'}
                    onChange={() => {
                      setContractType('existing');
                    }}
                  />
                  <span className="ml-2">Existing Contract</span>
                </label>
              </div>
              {errors.contractType && <p className="mt-1 text-sm text-red-600">{errors.contractType}</p>}
            </div>

            {/* If new: show vendor/product inputs, billing and single due date */}
            {contractType === 'new' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name  <span className  = "text-red-500">* </span></label>
                  <input placeholder="Enter or paste vendor name" value={vendorName} onChange={e => setVendorName(e.target.value)} className="w-full border rounded-md py-2 px-3 text-sm" />
                  {errors.vendorName && <p className="mt-1 text-sm text-red-600">{errors.vendorName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name <span className ="text-red-500">*</span></label>
                  <input placeholder="Enter or paste product name" value={productName} onChange={e => setProductName(e.target.value)} className="w-full border rounded-md py-2 px-3 text-sm" />
                  {errors.productName && <p className="mt-1 text-sm text-red-600">{errors.productName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contract Billing</label>
                  <div className="flex flex-col space-y-2">
                    <label><input type="radio" value="usage" checked={vendorContractType === 'usage'} onChange={() => setVendorContractType('usage')} /> Usage</label>
                    <label><input type="radio" value="license" checked={vendorContractType === 'license'} onChange={() => setVendorContractType('license')} /> License</label>
                  </div>

                  {/* For usage: show volumes + units (same line) */}
                  {vendorContractType === 'usage' && (
                    <>
                      <div className="mt-3 flex items-end space-x-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">How many volumes you want? <span className="text-red-500">*</span></label>
                          <input
                            placeholder="Enter number of volumes"
                            value={newUsageCount}
                            onChange={e => setNewUsageCount(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full border rounded-md py-2 px-3 text-sm"
                          />
                          {/* show current as a hint if selected existing contract is present */}
                          {selectedExistingContractId && currentUsageCount !== '' && (
                            <p className="mt-1 text-xs text-gray-500">Current: {currentUsageCount} {currentUnits === 'others' ? currentUnitsOther || '' : currentUnits || ''}</p>
                          )}
                          {errors.newUsageCount && <p className="mt-1 text-sm text-red-600">{errors.newUsageCount}</p>}
                        </div>
                        <div style={{ minWidth: 140 }}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Units <span className="text-red-500">*</span></label>
                          <select value={newUnits} onChange={e => setNewUnits(e.target.value as any)} className="w-full border rounded-md py-2 px-3 text-sm">
                            <option value="">Select unit</option>
                            <option value="credits">Credits</option>
                            <option value="minutes">Minutes</option>
                            <option value="others">Others</option>
                          </select>
                          {errors.newUnits && <p className="mt-1 text-sm text-red-600">{errors.newUnits}</p>}
                        </div>
                      </div>

                      {/* If user chose 'Others', show a small input to type the custom unit */}
                      {newUnits === 'others' && (
                        <div className="mt-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Specify other unit</label>
                          <input value={newUnitsOther} onChange={e => setNewUnitsOther(e.target.value)} placeholder="Type unit (e.g. messages, transactions)" className="w-full border rounded-md py-2 px-3 text-sm" />
                          {errors.newUnitsOther && <p className="mt-1 text-sm text-red-600">{errors.newUnitsOther}</p>}
                        </div>
                      )}
                    </>
                  )}

                  {/* For license: show license count input + license unit (agents/users) */}
                  {vendorContractType === 'license' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">How many licenses do you want? <span className="text-red-500">*</span>'</label>
                      <div className="flex items-end space-x-3">
                        <input type="number" value={newLicenseCount} onChange={e => setNewLicenseCount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="License Count" className="flex-1 border rounded-md py-2 px-3 text-sm" />
                        <div style={{ minWidth: 140 }}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                          <select value={newLicenseUnit} onChange={e => setNewLicenseUnit(e.target.value as any)} className="w-full border rounded-md py-2 px-3 text-sm">
                            <option value="">Select unit</option>
                            <option value="agents">Agents</option>
                            <option value="users">Users</option>
                          </select>
                        </div>
                      </div>
                      {selectedExistingContractId && currentLicenseCount !== '' && (
                        <p className="mt-1 text-xs text-gray-500">Current: {currentLicenseCount} {currentLicenseUnit ? `(${currentLicenseUnit})` : ''}</p>
                      )}
                      {errors.newLicenseCount && <p className="mt-1 text-sm text-red-600">{errors.newLicenseCount}</p>}
                      {errors.newLicenseUnit && <p className="mt-1 text-sm text-red-600">{errors.newLicenseUnit}</p>}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-red-500" >*</span></label>
                  <div className="flex items-center space-x-2">
                    <input ref={dueDateRef} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border rounded-md py-2 px-3 text-sm" />
                    <button type="button" onClick={focusDueDate} className="p-2 border rounded-md bg-white">
                      {/* simple calendar SVG */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 11H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M15 11H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M16 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>}
                </div>
              </>
            )}

            {/* If existing: show select then show all fields filled & readonly */}
            {contractType === 'existing' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Existing Contract</label>
                  <select value={selectedExistingContractId} onChange={e => setSelectedExistingContractId(e.target.value)} className="w-full border rounded-md py-2 px-3 text-sm">
                    <option value="">{loadingExistingContracts ? 'Loading...' : 'Select Contract'}</option>
                    {existingContracts.map(c => <option key={c.id} value={c.id}>{c.vendorName} — {c.productName}</option>)}
                  </select>
                  {errors.selectedExistingContractId && <p className="mt-1 text-sm text-red-600">{errors.selectedExistingContractId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name <span className="text-red-500">*</span></label>
                  <input value={vendorName} readOnly disabled className="w-full border rounded-md py-2 px-3 text-sm bg-gray-100" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name <span className="text-red-500">*</span> </label>
                  <input value={productName} readOnly disabled className="w-full border rounded-md py-2 px-3 text-sm bg-gray-100" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Type</label>
                  <input value={vendorContractType} readOnly disabled className="w-full border rounded-md py-2 px-3 text-sm bg-gray-100" />
                </div>

                {/* Existing usage: show current (non-editable) then renewal type drop-down and new renewal fields conditionally */}
                {vendorContractType === 'usage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current volumes</label>
                    <div className="flex items-center space-x-2">
                      <input value={currentUsageCount ?? ''} readOnly disabled className="flex-1 w-full border rounded-md py-2 px-3 text-sm bg-gray-100" />
                      <div className="w-36">
                        <select value={currentUnits} disabled className="w-full border rounded-md py-2 px-3 text-sm bg-gray-100">
                          <option value="">Units</option>
                          <option value="credits">Credits</option>
                          <option value="minutes">Minutes</option>
                          <option value="others">Others</option>
                        </select>
                      </div>
                    </div>
                    {currentUnits === 'others' && currentUnitsOther && (
                      <p className="mt-1 text-xs text-gray-500">Custom unit: {currentUnitsOther}</p>
                    )}

                    {/* NEW: Renewal Type */}
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Renewal Type</label>
                      <select value={renewalType} onChange={e => setRenewalType(e.target.value as any)} className="w-full border rounded-md py-2 px-3 text-sm">
                        <option value="">Select renewal type</option>
                        <option value="upgrade">Upgrade</option>
                        <option value="downgrade">Downgrade</option>
                        <option value="flat">Flat Renewal</option>
                      </select>
                      {errors.renewalType && <p className="mt-1 text-sm text-red-600">{errors.renewalType}</p>}
                    </div>

                    {/* Only show new renewal inputs when upgrade or downgrade (i.e. not flat) */}
                    {renewalType !== 'flat' && renewalType !== '' && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">New renewal usage count</label>
                        <div className="flex items-end space-x-3">
                          <div className="flex-1">
                            <input type="number" value={newUsageCount} onChange={e => setNewUsageCount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Enter renewal usage" className="w-full border rounded-md py-2 px-3 text-sm" />
                            {errors.newUsageCount && <p className="mt-1 text-sm text-red-600">{errors.newUsageCount}</p>}
                          </div>
                          <div style={{ minWidth: 140 }}>
                            <select value={renewalNewUnits || newUnits} onChange={e => setRenewalNewUnits(e.target.value as any)} className="w-full border rounded-md py-2 px-3 text-sm">
                              <option value="">Select unit</option>
                              <option value="credits">Credits</option>
                              <option value="minutes">Minutes</option>
                              <option value="others">Others</option>
                            </select>
                            {errors.renewalNewUnits && <p className="mt-1 text-sm text-red-600">{errors.renewalNewUnits}</p>}
                          </div>
                        </div>

                        {/* If 'Others' chosen for renewal, show custom input */}
                        {(renewalNewUnits === 'others') && (
                          <div className="mt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Specify other unit for renewal</label>
                            <input value={renewalNewUnitsOther} onChange={e => setRenewalNewUnitsOther(e.target.value)} placeholder="Type unit (e.g. transactions)" className="w-full border rounded-md py-2 px-3 text-sm" />
                            {errors.renewalNewUnitsOther && <p className="mt-1 text-sm text-red-600">{errors.renewalNewUnitsOther}</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Existing license: show current non-editable, renewal type and new renewal license conditionally */}
                {vendorContractType === 'license' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current license count</label>
                    <input value={currentLicenseCount ?? ''} readOnly disabled className="w-full border rounded-md py-2 px-3 text-sm bg-gray-100" />
                    {currentLicenseUnit && <p className="mt-1 text-xs text-gray-500">Current license unit: {currentLicenseUnit}</p>}

                    {/* NEW: Renewal Type for license too */}
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Renewal Type</label>
                      <select value={renewalType} onChange={e => setRenewalType(e.target.value as any)} className="w-full border rounded-md py-2 px-3 text-sm">
                        <option value="">Select renewal type</option>
                        <option value="upgrade">Upgrade</option>
                        <option value="downgrade">Downgrade</option>
                        <option value="flat">Flat Renewal</option>
                      </select>
                      {errors.renewalType && <p className="mt-1 text-sm text-red-600">{errors.renewalType}</p>}
                    </div>

                    {renewalType !== 'flat' && renewalType !== '' && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">How many licenses do you want to renew?</label>
                        <div className="flex items-end space-x-3">
                          <input type="number" value={renewalNewLicenseCount} onChange={e => setRenewalNewLicenseCount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Enter renewal license count" className="flex-1 border rounded-md py-2 px-3 text-sm" />
                          <div style={{ minWidth: 140 }}>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                            <select value={renewalLicenseUnit} onChange={e => setRenewalLicenseUnit(e.target.value as any)} className="w-full border rounded-md py-2 px-3 text-sm">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <div className="flex items-center space-x-2">
                    {/* Use ref and readOnly (NOT disabled) so focus/showPicker opens native calendar when button clicked */}
                    <input ref={dueDateRef} type="date" value={dueDate} readOnly className="w-full border rounded-md py-2 px-3 text-sm bg-gray-100" />
                    <button type="button" onClick={() => openDatePicker(dueDateRef.current)} className="p-2 border rounded-md bg-white" aria-hidden>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M16 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Renewal Date</label>
                  <div className="flex items-center space-x-2">
                    <input ref={renewalDateRef} type="date" value={renewalDate} onChange={e => setRenewalDate(e.target.value)} className="w-full border rounded-md py-2 px-3 text-sm" />
                    <button type="button" onClick={focusRenewalDate} className="p-2 border rounded-md bg-white">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="9" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M16 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Common Additional Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Comment</label>
              <textarea value={additionalComment} onChange={e => setAdditionalComment(e.target.value)} rows={3} className="w-full border rounded-md py-2 px-3 text-sm" />
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button onClick={() => { resetForm(); onClose(); }} className="px-4 py-2 text-sm bg-white border rounded-md">Cancel</button>
            <button onClick={handleSubmit} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md">Create</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateIssueModal;
