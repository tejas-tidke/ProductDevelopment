import React, { useState, useEffect } from "react";
import { Modal } from "../../components/ui/modal";
import { jiraService, ProductItem } from "../../services/jiraService";

interface Contract {
  id: string;
  productName: string;
  organization: string;
  totalQuantity: number;
  totalSpend: number;
  totalOptimizedCost: number;
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

  // Mock data for products based on vendor
  const getMockProducts = (vendor: string): ProductItem[] => {
    const productMap: Record<string, ProductItem[]> = {
      "Atlassian": [
        { id: "1", productName: "Jira", nameOfVendor: "Atlassian" },
        { id: "2", productName: "Confluence", nameOfVendor: "Atlassian" },
        { id: "3", productName: "Bitbucket", nameOfVendor: "Atlassian" },
        { id: "4", productName: "Jira Service Management", nameOfVendor: "Atlassian" }
      ],
      "Microsoft": [
        { id: "5", productName: "Microsoft 365", nameOfVendor: "Microsoft" },
        { id: "6", productName: "Azure", nameOfVendor: "Microsoft" },
        { id: "7", productName: "Dynamics 365", nameOfVendor: "Microsoft" }
      ],
      "Adobe": [
        { id: "8", productName: "Adobe Creative Cloud", nameOfVendor: "Adobe" },
        { id: "9", productName: "Adobe Sign", nameOfVendor: "Adobe" }
      ]
    };
    
    return productMap[vendor] || [
      { id: "10", productName: "General Product", nameOfVendor: vendor }
    ];
  };

  // Mock data for contracts
  const getMockContracts = (products: ProductItem[]): Contract[] => {
    const contracts: Contract[] = [];
    
    products.forEach((product, productIndex) => {
      // Create multiple contracts for each product (1-3 contracts per product)
      const contractCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < contractCount; i++) {
        contracts.push({
          id: `CON-${productIndex + 1}-${i + 1}`,
          productName: product.productName,
          organization: ["CostRoom Inc.", "TechCorp Ltd.", "InnovateCo"][i % 3],
          totalQuantity: Math.floor(Math.random() * 100) + 10,
          totalSpend: (productIndex + 1) * 10000 + i * 5000,
          totalOptimizedCost: (productIndex + 1) * 8000 + i * 4000
        });
      }
    });
    
    return contracts;
  };

  useEffect(() => {
    if (isOpen && vendorName) {
      const fetchVendorDetails = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Get mock products for the vendor
          const products = getMockProducts(vendorName);
          
          // Get mock contracts for the products
          const contracts = getMockContracts(products);
          
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
  const productContracts = selectedProduct 
    ? vendorDetails.contracts.filter(c => c.productName === selectedProduct.productName)
    : [];

  // Calculate total spend for the selected product
  const totalSpend = productContracts.reduce((sum, contract) => sum + contract.totalSpend, 0);
  const totalOptimizedCost = productContracts.reduce((sum, contract) => sum + contract.totalOptimizedCost, 0);

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
                            ${contract.totalOptimizedCost.toLocaleString()}
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

        {/* Footer with Total Spend for selected product */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedProduct?.productName || "Product"} Total Spend:
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${totalSpend.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default VendorListModal;