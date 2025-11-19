-- Add product_type column to vendor_details table only if it doesn't exist
ALTER TABLE vendor_details ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_vendor_details_product_type ON vendor_details(product_type);