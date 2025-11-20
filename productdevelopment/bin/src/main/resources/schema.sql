-- Add product_type column to vendor_details table only if it doesn't exist
ALTER TABLE vendor_details ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) DEFAULT NULL;

-- Add contract_type column to contract_details table only if it doesn't exist
ALTER TABLE contract_details ADD COLUMN IF NOT EXISTS contract_type VARCHAR(20) DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_vendor_details_product_type ON vendor_details(product_type);
CREATE INDEX IF NOT EXISTS idx_contract_details_contract_type ON contract_details(contract_type);