-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    parent_id BIGINT REFERENCES organizations(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    role VARCHAR(50),
    active BOOLEAN DEFAULT true,
    avatar TEXT,
    department_id BIGINT REFERENCES departments(id),
    organization_id BIGINT REFERENCES organizations(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department_id BIGINT,
    organization_id BIGINT REFERENCES organizations(id),
    invited_by VARCHAR(255),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN DEFAULT false,
    sent BOOLEAN DEFAULT false
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_used ON invitations(used);

-- Insert sample departments
INSERT INTO departments (name) VALUES 
    ('Finance'),
    ('Technology'),
    ('Human Resources'),
    ('Marketing'),
    ('Operations'),
    ('Sales')
ON CONFLICT (name) DO NOTHING;

-- Insert sample organizations with hierarchy
INSERT INTO organizations (name, parent_id) VALUES 
    ('Cost Room', NULL),  -- Root organization
    ('North America Division', 1),  -- Child of Cost Room
    ('Europe Division', 1),  -- Child of Cost Room
    ('Asia Pacific Division', 1),  -- Child of Cost Room
    ('New York Office', 2),  -- Child of North America Division
    ('Los Angeles Office', 2),  -- Child of North America Division
    ('London Office', 3),  -- Child of Europe Division
    ('Paris Office', 3),  -- Child of Europe Division
    ('Tokyo Office', 4),  -- Child of Asia Pacific Division
    ('Singapore Office', 4)  -- Child of Asia Pacific Division
ON CONFLICT (name) DO NOTHING;