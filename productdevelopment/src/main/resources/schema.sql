-- Add product_type column to vendor_details table only if it doesn't exist
ALTER TABLE vendor_details ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) DEFAULT NULL;

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