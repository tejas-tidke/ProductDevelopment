-- Complete reset of vendor_profiles and products tables
-- This script will drop and recreate the tables to ensure clean state

-- Drop tables in correct order (due to foreign key constraints)
DROP TABLE IF EXISTS vendor_profiles;
DROP TABLE IF EXISTS products;

-- Recreate products table
CREATE TABLE products (
    product_id BIGSERIAL PRIMARY KEY,
    product_name VARCHAR(255),
    product_type VARCHAR(255)
);

-- Recreate vendor_profiles table
CREATE TABLE vendor_profiles (
    vendor_id BIGSERIAL PRIMARY KEY,
    vendor_name VARCHAR(255),
    vendor_owner VARCHAR(255),
    department VARCHAR(255),
    product_id BIGINT REFERENCES products(product_id)
);

-- Insert products with the correct data
INSERT INTO products (product_name, product_type) VALUES
('Sales Cloud', 'license'),
('Service Cloud', 'license'),
('Slack', 'usage'),
('Zoom Meetings', 'usage'),
('Jira', 'license'),
('Confluence', 'license'),
('WiFi', NULL),
('Inverters', NULL),
('Bitbucket', 'LICENSE_BASED'),
('Adobe Acrobat Reader', 'Usage Based'),
('Opsgenie', 'License Based');

-- Insert vendor_profiles with correct product_id references
INSERT INTO vendor_profiles (vendor_name, vendor_owner, department, product_id) VALUES 
('Salesforce', 'Vendor Owner 1', 'Sales', 1),
('Salesforce', 'Vendor Owner 1', 'Support', 2),
('Slack', 'Vendor Owner 2', 'IT', 3),
('Zoom', 'Vendor Owner 3', 'IT', 4),
('Atlassian', 'Vendor Owner 4', 'Engineering', 5),
('Atlassian', 'Vendor Owner 4', 'Engineering', 6),
('BlueChip', 'Vendor Owner 5', 'Network', 7),
('SolarMate', 'Vendor Owner 6', 'Facilities', 8),
('Atlassian', 'Vendor Owner 4', 'Engineering', 9),
('Adobe', 'Vendor Owner 7', 'Design', 10),
('Atlassian', 'Vendor Owner 4', 'Operations', 11);