-- Fix vendor_profiles and products data
-- This script will reset and repopulate the vendor_profiles and products tables with correct data

-- Delete all existing data
DELETE FROM vendor_profiles;
DELETE FROM products;

-- Reset sequences
SELECT setval('products_product_id_seq', 1, false);
SELECT setval('vendor_profiles_vendor_id_seq', 1, false);

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