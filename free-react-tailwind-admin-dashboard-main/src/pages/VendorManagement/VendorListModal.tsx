import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "../../components/ui/modal";
import { jiraService, ProductItem } from "../../services/jiraService";

interface ProposalData {
  id: number;
  jiraIssueKey: string;
  proposalNumber: number;
  licenseCount: number;
  unitCost: number;
  totalCost: number;
  comment: string;
  isFinal: boolean;
  isFinalSubmitted: boolean;
  proposalType: string;
  createdAt: string;
}

interface Contract {
  id: string;
  productName: string;
  organization: string;
  totalQuantity: number;
  totalSpend: number;
  optimizedCost: number; // New field for optimized cost
}

interface VendorDetails {
  vendorName: string;
  products: ProductItem[];
  contracts: Contract[];
}

interface VendorListModalProps {
  vendorName: string;
  isOpen: boolean;
  onClose: () => void;
}

// Add cache outside the component
const modalDataCache = new Map<string, { data: any; timestamp: number }>();
const MODAL_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const VendorListModal: React.FC<VendorListModalProps> = ({ vendorName, isOpen, onClose }) => {
  const [vendorDetails, setVendorDetails] = useState<VendorDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Function to get cached data or fetch new data
  const getModalCachedOrFetch = async (key: string, fetchFn: () => Promise<any>) => {
    const cached = modalDataCache.get(key);
    const now = Date.now();
    
    // Check if cache exists and is still valid
    if (cached && (now - cached.timestamp) < MODAL_CACHE_DURATION) {
      console.log(`Using cached data for ${key}`);
      return cached.data;
    }
    
    // Fetch fresh data
    console.log(`Fetching fresh data for ${key}`);
    const data = await fetchFn();
    
    // Cache the data
    modalDataCache.set(key, { data, timestamp: now });
    return data;
  };

  // Fetch vendor products with caching
  const fetchVendorProducts = async (vendor: string): Promise<ProductItem[]> => {
    try {
      // Use cached data for vendor profiles
      const vendorProfiles = await getModalCachedOrFetch(`vendorProfiles_${vendor}`, () => 
        jiraService.getVendorProfileDTOsByName(vendor)
      );
      
      if (Array.isArray(vendorProfiles) && vendorProfiles.length > 0) {
        // Map vendor profiles to ProductItem format
        return vendorProfiles.map(profile => ({
          id: profile.vendorId?.toString() || "",
          productName: profile.productName || "",
          nameOfVendor: profile.vendorName || vendor,
          productType: profile.productType as 'license' | 'usage' || 'license',
          vendorId: `V-${profile.vendorId}`,
          vendorName: profile.vendorName || vendor,
          owner: profile.vendorOwner || "",
          department: profile.department || ""
        }));
      }
    } catch (err) {
      console.error(`Failed to fetch vendor profiles for ${vendor}:`, err);
    }
    
    // Return empty array if no data fetched
    return [];
  };

  // Fetch real contracts for products with caching
  const fetchContractsForProducts = async (vendorName: string, products: ProductItem[]): Promise<Contract[]> => {
    const contracts: Contract[] = [];
    
    try {
      console.log('Fetching contracts for vendor:', vendorName, 'products:', products);
      
      // Create promises for all products
      const contractPromises: Promise<any>[] = [];
      const productMap = new Map<number, ProductItem>();
      
      // Collect all contract fetch promises
      products.forEach((product, index) => {
        const promise = getModalCachedOrFetch(
          `contracts_${vendorName}_${product.productName}`,
          () => jiraService.getCompletedContractsByVendorAndProduct(vendorName, product.productName)
        );
        contractPromises.push(promise);
        // Store mapping to associate results with products
      });
      
      // Fetch all contracts in parallel
      const contractResults = await Promise.all(contractPromises);
      
      // Process results
      const proposalPromises: Promise<any>[] = [];
      const contractDataToProcess: any[] = [];
      
      contractResults.forEach((contractData, index) => {
        if (Array.isArray(contractData)) {
          // Convert contract data to Contract format
          for (const contract of contractData as Array<{
            id: number;
            contractType: string;
            renewalStatus: string;
            jiraIssueKey: string;
            nameOfVendor: string;
            productName: string;
            requesterName: string;
            requesterEmail: string;
            requesterDepartment: string;
            requesterOrganization: string;
            vendorContractType: string;
            additionalComment: string;
            currentLicenseCount: number;
            currentUsageCount: number;
            currentUnits: string;
            newLicenseCount: number;
            newUsageCount: number;
            newUnits: string;
            dueDate: string;
            renewalDate: string;
            licenseUpdateType: string;
            existingContractId: string;
            billingType: string;
            contractDuration: string;
            totalProfit: number;
          }>) {
            contractDataToProcess.push(contract);
            proposalPromises.push(
              getModalCachedOrFetch(
                `proposals_${contract.jiraIssueKey}`,
                () => jiraService.getProposalsByIssueKey(contract.jiraIssueKey)
              )
            );
          }
        }
      });
      
      // Fetch all proposals in parallel
      const proposalResults = await Promise.all(proposalPromises);
      
      // Process contracts with their proposals
      for (let i = 0; i < contractDataToProcess.length; i++) {
        const contract = contractDataToProcess[i];
        const proposals = proposalResults[i];
        
        // Determine quantity based on billing type
        let totalQuantity = 0;
        if (contract.billingType === 'license') {
          totalQuantity = contract.newLicenseCount || contract.currentLicenseCount || 0;
        } else if (contract.billingType === 'usage') {
          totalQuantity = contract.newUsageCount || contract.currentUsageCount || 0;
        }
        
        // Process proposals to get total spend
        let totalSpend = 0;
        let optimizedCost = contract.totalProfit || 0;
        
        if (Array.isArray(proposals) && proposals.length > 0) {
          // Find the final proposal for total spend
          const finalProposal = proposals.find(p => p.isFinal);
          if (finalProposal) {
            totalSpend = finalProposal.totalCost || 0;
          } else {
            // If no final proposal, use the last proposal's total cost
            const lastProposal = proposals[proposals.length - 1];
            totalSpend = lastProposal.totalCost || 0;
          }
        }
        
        contracts.push({
          id: `CON-${contract.id}`,
          productName: contract.productName,
          organization: contract.requesterOrganization || contract.requesterDepartment || 'Unknown Organization',
          totalQuantity: totalQuantity,
          totalSpend: totalSpend,
          optimizedCost: optimizedCost
        });
      }
      
      console.log('Final contracts array:', contracts);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    }
    
    return contracts;
  };

  useEffect(() => {
    if (isOpen && vendorName) {
      const fetchVendorDetails = async () => {
        try {
          console.log('Fetching vendor details for:', vendorName);
          setLoading(true);
          setError(null);
          
          // Use cached data for products
          const products = await fetchVendorProducts(vendorName);
          console.log('Fetched products:', products);
          
          // Use cached data for contracts
          const contracts = await fetchContractsForProducts(vendorName, products);
          console.log('Fetched contracts:', contracts);
          
          setVendorDetails({
            vendorName,
            products,
            contracts
          });
          
          // Set the first product as selected by default
          if (products.length > 0) {
            setSelectedProduct(products[0]);
          }
        } catch (err) {
          console.error("Failed to fetch vendor details", err);
          setError("Failed to load vendor details.");
        } finally {
          setLoading(false);
        }
      };
      
      fetchVendorDetails();
    }
  }, [isOpen, vendorName]);

  const handleProductSelect = (product: ProductItem) => {
    setSelectedProduct(product);
  };

  // Get contracts for the selected product
  const productContracts = useMemo(() => {
    if (!vendorDetails || !selectedProduct) return [];
    
    return vendorDetails.contracts.filter(c => {
      return c.productName === selectedProduct.productName;
    });
  }, [vendorDetails, selectedProduct]);

  // Calculate total spend and optimized cost for the selected product
  const totalSpend = useMemo(() => {
    if (productContracts.length === 0) return 0;
    return productContracts.reduce((sum: number, contract: Contract) => sum + contract.totalSpend, 0);
  }, [productContracts]);

  const totalOptimizedCost = useMemo(() => {
    if (productContracts.length === 0) return 0;
    return productContracts.reduce((sum: number, contract: Contract) => sum + contract.optimizedCost, 0);
  }, [productContracts]);

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-6xl w-full p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-6xl w-full p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </Modal>
    );
  }

  if (!vendorDetails) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-6xl w-full p-6">
      <div className="flex flex-col h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {vendorDetails.vendorName} Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Side - Product List */}
          <div className="w-1/3 pr-4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Products
            </h3>
            <div className="space-y-2">
              {vendorDetails.products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedProduct?.id === product.id
                      ? "bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700"
                      : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {product.productName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {product.nameOfVendor}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Contract Details */}
          <div className="w-2/3 pl-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Contract Details for {selectedProduct?.productName || "Product"}
            </h3>
            
            {productContracts.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                {/* Contracts Table */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Organization
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Total Spend
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Optimized Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {productContracts.map((contract: Contract) => (
                        <tr key={contract.id}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {contract.organization}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {contract.totalQuantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            ${contract.totalSpend.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            ${contract.optimizedCost.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No contracts found for this product
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Total Spend and Optimized Cost for selected product */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedProduct?.productName || "Product"} Total Spend:
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${totalSpend.toLocaleString()}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedProduct?.productName || "Product"} Total Optimized Cost:
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${totalOptimizedCost.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default VendorListModal;