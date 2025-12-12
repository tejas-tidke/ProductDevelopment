-- Update existing vendor details with product types
-- For Microsoft products
UPDATE vendor_details SET product_type = 'license' WHERE name_of_vendor = 'Microsoft' AND product_name = 'Office 365';
UPDATE vendor_details SET product_type = 'license' WHERE name_of_vendor = 'Microsoft' AND product_name = 'Windows Server';
UPDATE vendor_details SET product_type = 'usage' WHERE name_of_vendor = 'Microsoft' AND product_name = 'Azure';

-- For AWS products
UPDATE vendor_details SET product_type = 'usage' WHERE name_of_vendor = 'Amazon Web Services' AND product_name = 'EC2';
UPDATE vendor_details SET product_type = 'usage' WHERE name_of_vendor = 'Amazon Web Services' AND product_name = 'S3';
UPDATE vendor_details SET product_type = 'usage' WHERE name_of_vendor = 'Amazon Web Services' AND product_name = 'RDS';

-- For Google products
UPDATE vendor_details SET product_type = 'usage' WHERE name_of_vendor = 'Google Cloud' AND product_name = 'Compute Engine';
UPDATE vendor_details SET product_type = 'usage' WHERE name_of_vendor = 'Google Cloud' AND product_name = 'Cloud Storage';
UPDATE vendor_details SET product_type = 'license' WHERE name_of_vendor = 'Google' AND product_name = 'Workspace';

-- For Adobe products
UPDATE vendor_details SET product_type = 'license' WHERE name_of_vendor = 'Adobe' AND product_name = 'Creative Cloud';
UPDATE vendor_details SET product_type = 'usage' WHERE name_of_vendor = 'Adobe' AND product_name = 'Document Cloud';

-- Insert new sample vendor details with product types (avoid duplicates)
INSERT INTO vendor_details (name_of_vendor, product_name, product_link, product_type) 
SELECT 'Salesforce', 'Sales Cloud', 'https://www.salesforce.com/products/sales-cloud/', 'license'
WHERE NOT EXISTS (
    SELECT 1 FROM vendor_details 
    WHERE name_of_vendor = 'Salesforce' AND product_name = 'Sales Cloud'
);

INSERT INTO vendor_details (name_of_vendor, product_name, product_link, product_type) 
SELECT 'Salesforce', 'Service Cloud', 'https://www.salesforce.com/products/service-cloud/', 'license'
WHERE NOT EXISTS (
    SELECT 1 FROM vendor_details 
    WHERE name_of_vendor = 'Salesforce' AND product_name = 'Service Cloud'
);

INSERT INTO vendor_details (name_of_vendor, product_name, product_link, product_type) 
SELECT 'Slack', 'Slack', 'https://slack.com', 'usage'
WHERE NOT EXISTS (
    SELECT 1 FROM vendor_details 
    WHERE name_of_vendor = 'Slack' AND product_name = 'Slack'
);

INSERT INTO vendor_details (name_of_vendor, product_name, product_link, product_type) 
SELECT 'Zoom', 'Zoom Meetings', 'https://zoom.us', 'usage'
WHERE NOT EXISTS (
    SELECT 1 FROM vendor_details 
    WHERE name_of_vendor = 'Zoom' AND product_name = 'Zoom Meetings'
);

INSERT INTO vendor_details (name_of_vendor, product_name, product_link, product_type) 
SELECT 'Atlassian', 'Jira', 'https://www.atlassian.com/software/jira', 'license'
WHERE NOT EXISTS (
    SELECT 1 FROM vendor_details 
    WHERE name_of_vendor = 'Atlassian' AND product_name = 'Jira'
);

INSERT INTO vendor_details (name_of_vendor, product_name, product_link, product_type) 
SELECT 'Atlassian', 'Confluence', 'https://www.atlassian.com/software/confluence', 'license'
WHERE NOT EXISTS (
    SELECT 1 FROM vendor_details 
    WHERE name_of_vendor = 'Atlassian' AND product_name = 'Confluence'
);

