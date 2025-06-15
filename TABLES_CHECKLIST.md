# FieldForce Pro - Required Tables Checklist

## Required Tables for Supabase Database

### ✅ Core Authentication & User Management
- [ ] **public.employees** - FAE and admin authentication
- [ ] **public.profiles** - Canvasser profiles and user data  
- [ ] **public.users** - Internal user management

### ✅ Team & Task Management
- [ ] **public.teams** - Team creation and management
- [ ] **public.team_members** - Team membership relationships
- [ ] **public.tasks** - Task assignment and tracking

### ✅ Activity & Attendance Tracking
- [ ] **public.attendance** - Daily attendance tracking
- [ ] **public.canvasser_activities** - Activity logging
- [ ] **public.canvasser_productivity** - Daily productivity metrics

### ✅ Territory & Planning
- [ ] **public.turfs** - Territory mapping and management
- [ ] **public.activity_planner** - Activity scheduling

### ✅ Performance & Analytics
- [ ] **public.okr_targets** - OKR target setting
- [ ] **public.okr_actuals** - OKR performance tracking
- [ ] **public.sales_metrics** - Sales performance data

## Key Column Requirements

### public.employees (Critical for getFAE function)
```sql
- id (UUID PRIMARY KEY)
- email (TEXT UNIQUE)
- full_name (TEXT)
- role (TEXT) -- 'FAE', 'ADMIN', 'SUPERVISOR'
- department (TEXT)
- phone (TEXT)
- status (TEXT DEFAULT 'active')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### public.profiles (Canvasser data)
```sql
- id (UUID PRIMARY KEY)
- email (TEXT UNIQUE)
- full_name (TEXT)
- nin (TEXT) -- National ID
- smart_cash_account (TEXT)
- role (TEXT DEFAULT 'canvasser')
- status (TEXT DEFAULT 'pending')
- location (JSONB)
- photo (TEXT)
- team_id (TEXT)
- created_by (UUID)
- approved_by (UUID)
```

### public.teams (Team management)
```sql
- id (SERIAL PRIMARY KEY)
- team_id (TEXT UNIQUE)
- name (TEXT)
- category (TEXT)
- activity_type (TEXT) -- MEGA, MIDI, MINI
- channels (TEXT)
- kit_id (TEXT)
- location (JSONB)
- fae_id (UUID REFERENCES profiles.id)
```

## Setup Instructions

1. **Copy the complete SQL script from SUPABASE_SETUP.md**
2. **Paste into your Supabase SQL Editor**
3. **Execute the entire script**
4. **Run verification queries to confirm setup**

## Verification Commands

After setup, run these in Supabase SQL Editor:

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'employees', 'profiles', 'users', 'teams', 'team_members', 
    'tasks', 'attendance', 'canvasser_activities', 'turfs', 
    'canvasser_productivity', 'activity_planner', 'okr_targets', 
    'okr_actuals', 'sales_metrics'
) ORDER BY table_name;

-- Verify employees table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employees' AND table_schema = 'public';

-- Test sample data insertion
SELECT COUNT(*) as employee_count FROM public.employees;
SELECT COUNT(*) as profile_count FROM public.profiles;
```

## Current Status
- ✅ getFAE function updated to fetch exclusively from public.employees
- ✅ Storage interface updated with employee methods
- ✅ Complete SQL setup scripts generated
- ⏳ **Waiting for you to execute SQL scripts in Supabase**

Once you run the setup script in your Supabase dashboard, all tables will be created with proper relationships and the application will be fully functional.