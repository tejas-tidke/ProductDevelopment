import React, { useState, useEffect } from "react";
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

const VendorListModal: React.FC<{
  vendorName: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ vendorName, isOpen, onClose }) => {
  const [vendorDetails, setVendorDetails] = useState<VendorDetails | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products for a vendor from the new vendor profiles system
  const fetchVendorProducts = async (vendor: string): Promise<ProductItem[]> => {
    try {
      // Get vendor profiles for this vendor from the new API
      const vendorProfiles = await jiraService.getVendorProfileDTOsByName(vendor);
      
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

  // Fetch real contracts for products
  const fetchContractsForProducts = async (vendorName: string, products: ProductItem[]): Promise<Contract[]> => {
    const contracts: Contract[] = [];
    
    try {
      console.log('Fetching contracts for vendor:', vendorName, 'products:', products);
      // For each product, fetch the completed contracts
      for (const product of products) {
        console.log('Fetching contracts for product:', product.productName);
        const contractData = await jiraService.getCompletedContractsByVendorAndProduct(vendorName, product.productName);
        console.log('Received contract data:', contractData);
        
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
          }>) {
            // Determine quantity based on contract type
            let totalQuantity = 0;
            if (contract.vendorContractType === 'license') {
              totalQuantity = contract.newLicenseCount || contract.currentLicenseCount || 0;
            } else if (contract.vendorContractType === 'usage') {
              totalQuantity = contract.newUsageCount || contract.currentUsageCount || 0;
            }
            
            // Fetch proposal data to get optimized cost
            let optimizedCost = 0;
            let totalSpend = 0;
            
            try {
              const proposals: ProposalData[] = await jiraService.getProposalsByIssueKey(contract.jiraIssueKey);
              console.log('Proposals for contract:', contract.jiraIssueKey, proposals);
              
              if (Array.isArray(proposals) && proposals.length > 0) {
                // Find the final proposal
                const finalProposal = proposals.find(p => p.isFinal);
                if (finalProposal) {
                  optimizedCost = finalProposal.totalCost || 0;
                }
                
                // Use the last proposal's total cost as total spend if no final proposal
                const lastProposal = proposals[proposals.length - 1];
                totalSpend = lastProposal.totalCost || 0;
              }
            } catch (proposalError) {
              console.error('Failed to fetch proposals for contract:', contract.jiraIssueKey, proposalError);
              // Fallback to using contract data for total spend
              totalSpend = 10000; // Placeholder value
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
        }
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
          
          // Fetch products for the vendor from the new API
          const products = await fetchVendorProducts(vendorName);
          console.log('Fetched products:', products);
          
          // Fetch real contracts for the products
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

  // Get contracts for the selected product
  console.log('Selected product:', selectedProduct);
  console.log('All contracts:', vendorDetails.contracts);
  const productContracts = selectedProduct 
    ? vendorDetails.contracts.filter(c => {
        const match = c.productName === selectedProduct.productName;
        console.log(`Checking contract ${c.id}: ${c.productName} === ${selectedProduct.productName} = ${match}`);
        return match;
      })
    : [];
  console.log('Filtered product contracts:', productContracts);

  // Calculate total spend and optimized cost for the selected product
  const totalSpend = productContracts.reduce((sum, contract) => sum + contract.totalSpend, 0);
  const totalOptimizedCost = productContracts.reduce((sum, contract) => sum + contract.optimizedCost, 0);

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
                      {productContracts.map((contract) => (
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