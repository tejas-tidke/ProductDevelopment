-- First, ensure the vendor_details table exists with proper structure
CREATE TABLE IF NOT EXISTS vendor_details (
    id BIGSERIAL PRIMARY KEY,
    name_of_vendor VARCHAR(500),
    product_name VARCHAR(500),
    product_link VARCHAR(500),
    product_type VARCHAR(500),
    vendor_owner VARCHAR(500),
    department VARCHAR(500)
);

-- Also ensure the contract_details table exists with proper structure
CREATE TABLE IF NOT EXISTS contract_details (
    id BIGSERIAL PRIMARY KEY,
    jira_issue_key VARCHAR(255) UNIQUE,
    name_of_vendor VARCHAR(500),
    product_name VARCHAR(500),
    requester_name VARCHAR(255),
    requester_mail VARCHAR(255),
    requester_department VARCHAR(255),
    vendor_contract_type VARCHAR(50),
    additional_comment TEXT,
    current_license_count VARCHAR(255),
    current_usage_count VARCHAR(255),
    current_units VARCHAR(255),
    new_license_count VARCHAR(255),
    new_usage_count VARCHAR(255),
    new_units VARCHAR(255),
    due_date DATE,
    renewal_date DATE,
    contract_type VARCHAR(20),
    attachments TEXT,
    license_update_type VARCHAR(255),
    existing_contract_id VARCHAR(255),
    billing_type VARCHAR(255),
    requester_organization VARCHAR(255)
);

-- Add product_type column to vendor_details table only if it doesn't exist
ALTER TABLE vendor_details ADD COLUMN IF NOT EXISTS product_type VARCHAR(500) DEFAULT NULL;

-- Add vendor_owner column to vendor_details table only if it doesn't exist
ALTER TABLE vendor_details ADD COLUMN IF NOT EXISTS vendor_owner VARCHAR(500) DEFAULT NULL;

-- Add department column to vendor_details table only if it doesn't exist
ALTER TABLE vendor_details ADD COLUMN IF NOT EXISTS department VARCHAR(500) DEFAULT NULL;

-- Increase the size of VARCHAR columns if they are too small
ALTER TABLE vendor_details ALTER COLUMN name_of_vendor TYPE VARCHAR(500);
ALTER TABLE vendor_details ALTER COLUMN product_name TYPE VARCHAR(500);
ALTER TABLE vendor_details ALTER COLUMN product_link TYPE VARCHAR(500);
ALTER TABLE vendor_details ALTER COLUMN product_type TYPE VARCHAR(500);
ALTER TABLE vendor_details ALTER COLUMN vendor_owner TYPE VARCHAR(500);
ALTER TABLE vendor_details ALTER COLUMN department TYPE VARCHAR(500);

-- Add contract_type column to contract_details table only if it doesn't exist
ALTER TABLE contract_details ADD COLUMN IF NOT EXISTS contract_type VARCHAR(20) DEFAULT NULL;

-- Add attachments column to contract_details table only if it doesn't exist
ALTER TABLE contract_details ADD COLUMN IF NOT EXISTS attachments TEXT DEFAULT NULL;

-- Add additional columns for RequestSplitView integration
ALTER TABLE contract_details ADD COLUMN IF NOT EXISTS license_update_type VARCHAR(255) DEFAULT NULL;
ALTER TABLE contract_details ADD COLUMN IF NOT EXISTS existing_contract_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE contract_details ADD COLUMN IF NOT EXISTS billing_type VARCHAR(255) DEFAULT NULL;
ALTER TABLE contract_details ADD COLUMN IF NOT EXISTS requester_organization VARCHAR(255) DEFAULT NULL;

-- Create proposals table if it doesn't exist
CREATE TABLE IF NOT EXISTS proposals (
    id BIGSERIAL PRIMARY KEY,
    proposal_type VARCHAR(20) NOT NULL,
    license_count VARCHAR(255),
    unit_cost VARCHAR(255),
    total_cost VARCHAR(255),
    attachment_ids TEXT,
    issue_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_vendor_details_product_type ON vendor_details(product_type);
CREATE INDEX IF NOT EXISTS idx_contract_details_contract_type ON contract_details(contract_type);
CREATE INDEX IF NOT EXISTS idx_proposals_issue_key ON proposals(issue_key);

-- Create comments table for custom comment functionality
CREATE TABLE IF NOT EXISTS comments (
    id BIGSERIAL PRIMARY KEY,
    issue_key VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance on comments table
CREATE INDEX IF NOT EXISTS idx_comment_issue_key ON comments(issue_key);
CREATE INDEX IF NOT EXISTS idx_comment_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_created_at ON comments(created_at);

-- Create products table for vendor profile functionality
CREATE TABLE IF NOT EXISTS products (
    product_id BIGSERIAL PRIMARY KEY,
    product_name VARCHAR(500),
    product_type VARCHAR(500)
);

-- Create vendor_profiles table for vendor profile functionality
CREATE TABLE IF NOT EXISTS vendor_profiles (
    vendor_id BIGSERIAL PRIMARY KEY,
    vendor_name VARCHAR(500),
    vendor_owner VARCHAR(500),
    department VARCHAR(500),
    product_id BIGINT REFERENCES products(product_id)
);

-- Ensure vendor_profiles table columns have adequate size
ALTER TABLE vendor_profiles ALTER COLUMN vendor_name TYPE VARCHAR(500);
ALTER TABLE vendor_profiles ALTER COLUMN vendor_owner TYPE VARCHAR(500);
ALTER TABLE vendor_profiles ALTER COLUMN department TYPE VARCHAR(500);

-- Ensure products table columns have adequate size
ALTER TABLE products ALTER COLUMN product_name TYPE VARCHAR(500);
ALTER TABLE products ALTER COLUMN product_type TYPE VARCHAR(500);