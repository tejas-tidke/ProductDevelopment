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

interface ProductItem {
  id: string;
  productName: string;
  nameOfVendor?: string;
  productLink?: string;
}

  const CreateIssueModal: React.FC<CreateIssueModalProps> = ({ isOpen, onClose, onIssueCreated }) => {
  const [requesterName, setRequesterName] = useState('');
  const [requesterMail, setRequesterMail] = useState('');
  const [contractType, setContractType] = useState<'new' | 'existing' | ''>('');
  const [vendors, setVendors] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);


  const [vendorName, setVendorName] = useState('');
  const [productName, setProductName] = useState('');
  const [vendorContractType, setVendorContractType] = useState<'usage' | 'license' | ''>('');

  const [currentUsageCount, setCurrentUsageCount] = useState<number | ''>('');
  const [currentUnits, setCurrentUnits] = useState<'credits' | 'minutes' | 'others' | ''>('');
  const [currentLicenseCount, setCurrentLicenseCount] = useState<number | ''>('');

  const [newUsageCount, setNewUsageCount] = useState<number | ''>('');
  const [newUnits, setNewUnits] = useState<'credits' | 'minutes' | 'others' | ''>('');
  const [newLicenseCount, setNewLicenseCount] = useState<number | ''>('');

  const [dueDate, setDueDate] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [additionalComment, setAdditionalComment] = useState('');

  const [existingContracts, setExistingContracts] = useState<ExistingContract[]>([]);
  const [selectedExistingContractId, setSelectedExistingContractId] = useState('');
  const [loadingExistingContracts, setLoadingExistingContracts] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // Load vendors list when NEW contract selected
useEffect(() => {
  const loadVendors = async () => {
    if (contractType !== "new") return;

    try {
      setLoadingVendors(true);
      const list = await jiraService.getVendors();
      if (Array.isArray(list)) setVendors(list);
    } catch (err) {
      console.error("Error loading vendors", err);
    } finally {
      setLoadingVendors(false);
    }
  };

  loadVendors();
}, [contractType]);

  // Load products when vendor changes
useEffect(() => {
  const loadProducts = async () => {
    if (!vendorName || contractType !== "new") return;

    try {
      setLoadingProducts(true);
      const list = await jiraService.getProductsByVendor(vendorName);
      if (Array.isArray(list)) setProducts(list);
    } catch (err) {
      console.error("Error loading products", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  loadProducts();
}, [vendorName, contractType]);


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

        if (typeof found.vendorUsage !== 'undefined' && found.vendorUsage !== null) {
          const usageNum = Number(found.vendorUsage) || 0;
          if (found.vendorContractType === 'usage') {
            setCurrentUsageCount(usageNum);
            setCurrentLicenseCount('');
            setNewUsageCount(usageNum);    // prefill NEW from existing usage
            setNewUnits((found.vendorUnit as any) ?? '');
            setNewLicenseCount('');
          } else if (found.vendorContractType === 'license') {
            setCurrentLicenseCount(usageNum);
            setCurrentUsageCount('');
            setNewLicenseCount(usageNum);  // prefill NEW from existing license
            setNewUsageCount('');
            setNewUnits('');
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
          } else if (found.vendorContractType === 'license') {
            setNewLicenseCount(usageNum);
            setVendorContractType('license');
          }
        }
        if (!vendorName) setVendorName(found.vendorName);
        if (!productName) setProductName(found.productName);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractType, selectedExistingContractId]);

  // ********** NEW: Sync from New -> Current **********
  // If user edits newUsageCount while on New contract, reflect that value into currentUsageCount so Existing view shows it
  useEffect(() => {
    // Only sync numeric values ('' means empty)
    if (newUsageCount === '' || newUsageCount === null) {
      // If cleared, clear current only if an existing contract is selected (user intent)
      if (selectedExistingContractId) setCurrentUsageCount('');
      return;
    }
    // When there's a selected existing contract or even without one, update current so existing view displays same
    if (typeof newUsageCount === 'number' && !Number.isNaN(newUsageCount)) {
      setCurrentUsageCount(newUsageCount);
      // also sync units if available
      if (newUnits) setCurrentUnits(newUnits);
    }
  }, [newUsageCount, newUnits, selectedExistingContractId]);

  // Sync newLicenseCount -> currentLicenseCount
  useEffect(() => {
    if (newLicenseCount === '' || newLicenseCount === null) {
      if (selectedExistingContractId) setCurrentLicenseCount('');
      return;
    }
    if (typeof newLicenseCount === 'number' && !Number.isNaN(newLicenseCount)) {
      setCurrentLicenseCount(newLicenseCount);
    }
  }, [newLicenseCount, selectedExistingContractId]);

  const resetForm = () => {
    setContractType('');
    setVendorName('');
    setProductName('');
    setVendorContractType('');
    setCurrentUsageCount('');
    setCurrentUnits('');
    setCurrentLicenseCount('');
    setNewUsageCount('');
    setNewUnits('');
    setNewLicenseCount('');
    setDueDate('');
    setRenewalDate('');
    setAdditionalComment('');
    setExistingContracts([]);
    setSelectedExistingContractId('');
    setErrors({});
  };

  const fetchExistingContracts = async () => {
    try {
      setLoadingExistingContracts(true);
      if (typeof jiraService.getContracts !== 'function') return;
      const data = await jiraService.getContracts();
      const mapped = Array.isArray(data)
        ? data.map((c: any) => ({
            id: String(c.id ?? c.contractId ?? c.key ?? ''),
            vendorName: c.nameOfVendor ?? '',
            productName: c.productName ?? '',
            requesterName: c.requesterName ?? '',
            requesterMail: c.requesterMail ?? '',
            vendorContractType: (c.vendorContractType ?? '') as 'usage' | 'license' | '',
            vendorStartDate: String(c.vendorStartDate ?? ''),
            vendorEndDate: String(c.vendorEndDate ?? ''),
            additionalComment: c.additionalComment ?? '',
            vendorUnit: c.vendorUnit ?? c.unit ?? '',
            vendorUsage: typeof c.vendorUsage !== 'undefined' ? Number(c.vendorUsage) : (typeof c.usage !== 'undefined' ? Number(c.usage) : (typeof c.count !== 'undefined' ? Number(c.count) : undefined)),
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
      }
      if (vendorContractType === 'license') {
        if (newLicenseCount === '' || newLicenseCount === 0) newErrors.newLicenseCount = 'Enter license count';
      }
    }

    if (contractType === 'existing') {
      if (!selectedExistingContractId) newErrors.selectedExistingContractId = 'Select an existing contract';
      if (!vendorContractType) newErrors.vendorContractType = 'Existing contract has no billing type';
      if (vendorContractType === 'usage') {
        if (newUsageCount === '' || newUsageCount === 0) newErrors.newUsageCount = 'Enter new renewal usage amount';
        if (!newUnits) newErrors.newUnits = 'Select unit for renewal';
      }
      if (vendorContractType === 'license') {
        if (newLicenseCount === '' || newLicenseCount === 0) newErrors.newLicenseCount = 'Enter new renewal license count';
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
    currentUnits: currentUnits || undefined,
    currentLicenseCount: currentLicenseCount || undefined,
    newUsageCount: newUsageCount || undefined,
    newUnits: newUnits || undefined,
    newLicenseCount: newLicenseCount || undefined,
    dueDate,
    renewalDate: renewalDate || undefined,
    additionalComment,
    requesterName,
    requesterMail,
    contractMode: contractType,
    selectedExistingContractId:
      contractType === "existing" ? selectedExistingContractId : undefined,
  };

  try {
    const payload = { vendorDetails };
    console.log("🚀 Submitting payload to Jira:", payload);

    // ⭐ FIXED — call correct API
    const created = await jiraService.createContractIssue(payload);

    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      onIssueCreated?.(created);
      resetForm();
      onClose();
    }, 2000);

  } catch (err) {
    console.error("Create failed", err);
    alert("Failed to create issue.");
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

  // Utility: focus native date input when calendar icon clicked
  const focusDueDate = () => dueDateRef.current?.focus();
  const focusRenewalDate = () => renewalDateRef.current?.focus();

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
            {/* Contract Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type of Contract</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                  <select
                    value={vendorName}
                    onChange={e => setVendorName(e.target.value)}
                    className="w-full border rounded-md py-2 px-3 text-sm"
                  >
                    <option value="">{loadingVendors ? "Loading vendors..." : "Select Vendor"}</option>
                    {vendors.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  {errors.vendorName && <p className="mt-1 text-sm text-red-600">{errors.vendorName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <select
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full border rounded-md py-2 px-3 text-sm"
                  >
                    <option value="">
                      {loadingProducts ? "Loading products..." : "Select Product"}
                    </option>

                    {products.map((p) => (
                      <option key={p.id} value={p.productName}>
                        {p.productName}
                      </option>
                    ))}
                  </select>

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
                          <label className="block text-sm font-medium text-gray-700 mb-1">How many volumes you want?</label>
                          <input
                            placeholder="Enter number of volumes"
                            value={newUsageCount}
                            onChange={e => setNewUsageCount(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full border rounded-md py-2 px-3 text-sm"
                          />
                          {/* show current as a hint if selected existing contract is present */}
                          {selectedExistingContractId && currentUsageCount !== '' && (
                            <p className="mt-1 text-xs text-gray-500">Current: {currentUsageCount} {currentUnits || ''}</p>
                          )}
                        </div>
                        <div style={{ minWidth: 140 }}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
                          <select value={newUnits} onChange={e => setNewUnits(e.target.value as any)} className="w-full border rounded-md py-2 px-3 text-sm">
                            <option value="">Select unit</option>
                            <option value="credits">Credits</option>
                            <option value="minutes">Minutes</option>
                            <option value="others">Others</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* For license: show license count input */}
                  {vendorContractType === 'license' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">How many licenses do you want?</label>
                      <input type="number" value={newLicenseCount} onChange={e => setNewLicenseCount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="License Count" className="w-full border rounded-md py-2 px-3 text-sm" />
                      {selectedExistingContractId && currentLicenseCount !== '' && (
                        <p className="mt-1 text-xs text-gray-500">Current: {currentLicenseCount}</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                  <input value={vendorName} readOnly disabled className="w-full border rounded-md py-2 px-3 text-sm bg-gray-100" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input value={productName} readOnly disabled className="w-full border rounded-md py-2 px-3 text-sm bg-gray-100" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Type</label>
                  <input value={vendorContractType} readOnly disabled className="w-full border rounded-md py-2 px-3 text-sm bg-gray-100" />
                </div>

                {/* Existing usage: show current (non-editable) then new renewal fields editable */}
                {vendorContractType === 'usage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current volumes</label>
                    <div className="flex items-center space-x-2">
                      <input value={currentUsageCount ?? ''} readOnly disabled className="flex-1 w-full border rounded-md py-2 px-3 text-sm bg-gray-100" />
                      <select value={currentUnits} disabled className="w-36 border rounded-md py-2 px-3 text-sm bg-gray-100">
                        <option value="">Units</option>
                        <option value="credits">Credits</option>
                        <option value="minutes">Minutes</option>
                        <option value="others">Others</option>
                      </select>
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">New renewal usage count</label>
                      <div className="flex items-end space-x-3">
                        <div className="flex-1">
                          <input type="number" value={newUsageCount} onChange={e => setNewUsageCount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Enter renewal usage" className="w-full border rounded-md py-2 px-3 text-sm" />
                        </div>
                        <div style={{ minWidth: 140 }}>
                          <select value={newUnits} onChange={e => setNewUnits(e.target.value as any)} className="w-full border rounded-md py-2 px-3 text-sm">
                            <option value="">Select unit</option>
                            <option value="credits">Credits</option>
                            <option value="minutes">Minutes</option>
                            <option value="others">Others</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Existing license: show current non-editable, then new renewal license editable */}
                {vendorContractType === 'license' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current license count</label>
                    <input value={currentLicenseCount ?? ''} readOnly disabled className="w-full border rounded-md py-2 px-3 text-sm bg-gray-100" />

                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">How many licenses do you want to renew?</label>
                      <input type="number" value={newLicenseCount} onChange={e => setNewLicenseCount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Enter renewal license count" className="w-full border rounded-md py-2 px-3 text-sm" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <div className="flex items-center space-x-2">
                    <input type="date" value={dueDate} readOnly disabled className="w-full border rounded-md py-2 px-3 text-sm bg-gray-100" />
                    <button type="button" onClick={() => dueDateRef.current?.focus()} className="p-2 border rounded-md bg-white" aria-hidden>
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
                        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
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
    </>
  );
};

export default CreateIssueModal;



