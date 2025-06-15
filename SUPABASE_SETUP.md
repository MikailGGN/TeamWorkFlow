# FieldForce Pro - Supabase Database Setup Guide

This guide provides complete SQL scripts to set up all required tables in your Supabase database.

## Required Tables Summary

The FieldForce Pro application requires the following 14 tables:

1. **employees** - FAE and admin authentication (public.employees)
2. **profiles** - Canvasser and user profiles (public.profiles)
3. **users** - Internal user management
4. **teams** - Team management and creation
5. **team_members** - Team membership relationships
6. **tasks** - Task assignment and tracking
7. **attendance** - Attendance tracking for canvassers
8. **canvasser_activities** - Daily canvasser activity logging
9. **turfs** - Territory mapping and management
10. **canvasser_productivity** - Daily productivity metrics
11. **activity_planner** - Activity planning and scheduling
12. **okr_targets** - OKR target setting
13. **okr_actuals** - OKR actual performance tracking
14. **sales_metrics** - Sales performance metrics

## Setup Instructions

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor in the left sidebar
3. Create a new query

### Step 2: Run the Setup Script
Copy and paste the complete setup script below into your SQL Editor and execute it:

```sql
-- FieldForce Pro - Complete Database Setup Script
-- Run this entire script in your Supabase SQL Editor

-- 1. Create employees table (public.employees)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'FAE', 'ADMIN', 'SUPERVISOR'
    department TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- active, inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create or update profiles table (public.profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    nin TEXT, -- National Identification Number
    smart_cash_account TEXT,
    role TEXT NOT NULL DEFAULT 'canvasser', -- fae, canvasser, admin
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    location JSONB, -- { lat, lng, address }
    photo TEXT, -- Base64 data URL
    team_id TEXT, -- Associated team ID
    created_by UUID,
    approved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member', -- admin, member, viewer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
    id SERIAL PRIMARY KEY,
    team_id TEXT UNIQUE, -- Generated ID: Date-Geolocation-TeamName
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    activity_type TEXT, -- MEGA, MIDI, MINI
    channels TEXT, -- Comma-separated list of channels
    kit_id TEXT, -- Kit ID for daily canvasser use
    location JSONB, -- { lat, lng, address }
    date TIMESTAMP WITH TIME ZONE,
    created_by INTEGER REFERENCES public.users(id),
    fae_id UUID REFERENCES public.profiles(id), -- Field Area Executive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES public.teams(id),
    user_id INTEGER REFERENCES public.users(id),
    profile_id UUID REFERENCES public.profiles(id),
    role TEXT NOT NULL DEFAULT 'member', -- admin, member, viewer, canvasser
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    team_id INTEGER REFERENCES public.teams(id),
    assigned_to INTEGER REFERENCES public.users(id),
    assigned_profile UUID REFERENCES public.profiles(id),
    status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed
    priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 7. Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id),
    profile_id UUID REFERENCES public.profiles(id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    location JSONB, -- { lat, lng }
    status TEXT NOT NULL DEFAULT 'present', -- present, absent, late
    notes TEXT
);

-- 8. Create canvasser_activities table
CREATE TABLE IF NOT EXISTS public.canvasser_activities (
    id SERIAL PRIMARY KEY,
    canvasser_id UUID REFERENCES public.profiles(id),
    team_id INTEGER REFERENCES public.teams(id),
    activity_type TEXT NOT NULL, -- MEGA, MIDI, MINI, Other
    channel TEXT,
    description TEXT,
    location JSONB, -- { lat, lng, address }
    photo TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create turfs table
CREATE TABLE IF NOT EXISTS public.turfs (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    geojson JSONB NOT NULL,
    color TEXT NOT NULL,
    team_id INTEGER REFERENCES public.teams(id),
    status TEXT DEFAULT 'active',
    assigned_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    created_by INTEGER NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create canvasser_productivity table
CREATE TABLE IF NOT EXISTS public.canvasser_productivity (
    id SERIAL PRIMARY KEY,
    canvasser_id UUID NOT NULL REFERENCES public.profiles(id),
    date TEXT NOT NULL,
    daily_target INTEGER DEFAULT 0,
    actual_count INTEGER DEFAULT 0,
    gads_points INTEGER DEFAULT 0,
    incentive_amount TEXT DEFAULT '0.00',
    performance_rating TEXT DEFAULT 'average',
    notes TEXT,
    updated_by TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Create activity_planner table
CREATE TABLE IF NOT EXISTS public.activity_planner (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    location TEXT NOT NULL,
    activity TEXT NOT NULL,
    notes TEXT,
    useremail TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Create okr_targets table
CREATE TABLE IF NOT EXISTS public.okr_targets (
    id SERIAL PRIMARY KEY,
    period TEXT NOT NULL, -- Q1 2024, Q2 2024, etc.
    team_id INTEGER REFERENCES public.teams(id),
    fae_id TEXT REFERENCES public.employees(id),
    region TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    channel TEXT NOT NULL,
    expected_sales DECIMAL(12, 2) NOT NULL,
    target_units INTEGER NOT NULL,
    target_revenue DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Create okr_actuals table
CREATE TABLE IF NOT EXISTS public.okr_actuals (
    id SERIAL PRIMARY KEY,
    okr_target_id INTEGER REFERENCES public.okr_targets(id) NOT NULL,
    period TEXT NOT NULL,
    actual_sales DECIMAL(12, 2) NOT NULL,
    actual_units INTEGER NOT NULL,
    actual_revenue DECIMAL(12, 2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Create sales_metrics table
CREATE TABLE IF NOT EXISTS public.sales_metrics (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES public.teams(id),
    fae_id TEXT REFERENCES public.employees(id),
    region TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    channel TEXT NOT NULL,
    period TEXT NOT NULL,
    sales_amount DECIMAL(12, 2) NOT NULL,
    units_won INTEGER NOT NULL,
    revenue DECIMAL(12, 2) NOT NULL,
    conversion_rate DECIMAL(5, 2),
    customer_acquisition_cost DECIMAL(10, 2),
    recorded_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON public.profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_team_id ON public.teams(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_fae_id ON public.teams(fae_id);
CREATE INDEX IF NOT EXISTS idx_canvasser_activities_canvasser_id ON public.canvasser_activities(canvasser_id);
CREATE INDEX IF NOT EXISTS idx_canvasser_activities_date ON public.canvasser_activities(date);
CREATE INDEX IF NOT EXISTS idx_canvasser_productivity_canvasser_id ON public.canvasser_productivity(canvasser_id);
CREATE INDEX IF NOT EXISTS idx_canvasser_productivity_date ON public.canvasser_productivity(date);
CREATE INDEX IF NOT EXISTS idx_attendance_profile_id ON public.attendance(profile_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_turfs_team_id ON public.turfs(team_id);
CREATE INDEX IF NOT EXISTS idx_okr_targets_fae_id ON public.okr_targets(fae_id);
CREATE INDEX IF NOT EXISTS idx_sales_metrics_fae_id ON public.sales_metrics(fae_id);

-- Enable Row Level Security (RLS) on sensitive tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvasser_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvasser_productivity ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employees table
CREATE POLICY IF NOT EXISTS "Employees can view their own data" ON public.employees
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY IF NOT EXISTS "Admins can view all employees" ON public.employees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE id::text = auth.uid()::text AND role = 'ADMIN'
        )
    );

-- Create RLS policies for profiles table
CREATE POLICY IF NOT EXISTS "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "FAEs and Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE id::text = auth.uid()::text AND role IN ('FAE', 'ADMIN')
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Insert sample data for testing
INSERT INTO public.employees (email, full_name, role, department, phone, status) 
VALUES ('fae@company.com', 'John Smith', 'FAE', 'Field Operations', '+1234567890', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.employees (email, full_name, role, department, phone, status) 
VALUES ('admin@company.com', 'Admin User', 'ADMIN', 'Management', '+0987654321', 'active')
ON CONFLICT (email) DO NOTHING;

-- Verification query
SELECT 'Setup Complete - All tables created successfully' as status;
```

### Step 3: Verify Setup
After running the setup script, run this verification query to confirm all tables were created:

```sql
-- Verify all tables exist
SELECT 
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'employees', 'profiles', 'users', 'teams', 'team_members', 
    'tasks', 'attendance', 'canvasser_activities', 'turfs', 
    'canvasser_productivity', 'activity_planner', 'okr_targets', 
    'okr_actuals', 'sales_metrics'
)
ORDER BY table_name;
```

### Step 4: Add Missing Columns (If Needed)
If you already have some tables and need to add missing columns, run this script:

```sql
-- Add missing columns to existing tables
DO $$ 
BEGIN
    -- Add missing columns to employees table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='department') THEN
        ALTER TABLE public.employees ADD COLUMN department TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='phone') THEN
        ALTER TABLE public.employees ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='status') THEN
        ALTER TABLE public.employees ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
    END IF;
    
    -- Add missing columns to profiles table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='nin') THEN
        ALTER TABLE public.profiles ADD COLUMN nin TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='smart_cash_account') THEN
        ALTER TABLE public.profiles ADD COLUMN smart_cash_account TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'canvasser';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='status') THEN
        ALTER TABLE public.profiles ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='location') THEN
        ALTER TABLE public.profiles ADD COLUMN location JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='photo') THEN
        ALTER TABLE public.profiles ADD COLUMN photo TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='team_id') THEN
        ALTER TABLE public.profiles ADD COLUMN team_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='created_by') THEN
        ALTER TABLE public.profiles ADD COLUMN created_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='approved_by') THEN
        ALTER TABLE public.profiles ADD COLUMN approved_by UUID;
    END IF;
    
    -- Add missing columns to teams table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='activity_type') THEN
        ALTER TABLE public.teams ADD COLUMN activity_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='channels') THEN
        ALTER TABLE public.teams ADD COLUMN channels TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='kit_id') THEN
        ALTER TABLE public.teams ADD COLUMN kit_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='location') THEN
        ALTER TABLE public.teams ADD COLUMN location JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='date') THEN
        ALTER TABLE public.teams ADD COLUMN date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='fae_id') THEN
        ALTER TABLE public.teams ADD COLUMN fae_id UUID REFERENCES public.profiles(id);
    END IF;
END $$;

SELECT 'Missing columns added successfully' as status;
```

## Post-Setup Configuration

### Update Environment Variables
After setting up the database, ensure your `.env` file contains the correct DATABASE_URL:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### Test Connection
The application will automatically connect to your Supabase database using the DATABASE_URL. The getFAE function now fetches data exclusively from the public.employees table as requested.

## Table Relationships Summary

- **employees** ↔ **okr_targets** (fae_id)
- **employees** ↔ **sales_metrics** (fae_id)
- **profiles** ↔ **teams** (fae_id)
- **profiles** ↔ **canvasser_activities** (canvasser_id)
- **profiles** ↔ **canvasser_productivity** (canvasser_id)
- **teams** ↔ **team_members** (team_id)
- **teams** ↔ **tasks** (team_id)
- **teams** ↔ **turfs** (team_id)
- **users** ↔ **teams** (created_by)
- **users** ↔ **turfs** (created_by)

This setup ensures proper data integrity and supports all FieldForce Pro application features including team management, canvasser tracking, territory mapping, productivity monitoring, and OKR management.