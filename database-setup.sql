-- FieldForce Pro Database Setup for Supabase
-- This script creates all necessary tables and initial data for role-based authentication

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_roles junction table (links Supabase auth.users to roles)
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Create employees table (for FAE/Admin staff)
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  supabase_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
  ('FAE', 'Field Area Engineer', '["create_teams", "manage_canvassers", "view_reports"]'),
  ('ADMIN', 'Administrator', '["full_access"]'),
  ('CANVASSER', 'Canvasser', '["update_profile", "submit_activities"]'),
  ('SUPERVISOR', 'Supervisor', '["view_teams", "view_reports"]')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view roles" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view their own roles" ON user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view employee data" ON employees FOR SELECT TO authenticated USING (true);

-- Create function to get user roles
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS TEXT[] AS $$
  SELECT array_agg(r.name)
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Create function to assign user role
CREATE OR REPLACE FUNCTION assign_user_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  role_record roles%ROWTYPE;
BEGIN
  -- Get role by name
  SELECT * INTO role_record FROM roles WHERE name = role_name;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Insert user role (ON CONFLICT DO NOTHING prevents duplicates)
  INSERT INTO user_roles (user_id, role_id)
  VALUES (user_uuid, role_record.id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update employee updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample employee data (will be created when users sign up)
-- These correspond to Supabase auth users that will be created
COMMENT ON TABLE employees IS 'Employee records linked to Supabase auth users';
COMMENT ON TABLE user_roles IS 'Junction table linking Supabase auth users to application roles';
COMMENT ON TABLE roles IS 'Application roles with permissions for role-based access control';