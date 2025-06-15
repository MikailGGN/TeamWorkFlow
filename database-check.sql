-- FieldForce Pro - Database Table & Column Verification Script
-- Run this to check which tables and columns exist in your Supabase database

-- Check if all required tables exist
SELECT 
    'Table Check' AS check_type,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END AS status
FROM (
    VALUES 
        ('employees'),
        ('profiles'),
        ('users'),
        ('teams'),
        ('team_members'),
        ('tasks'),
        ('attendance'),
        ('canvasser_activities'),
        ('turfs'),
        ('canvasser_productivity'),
        ('activity_planner'),
        ('okr_targets'),
        ('okr_actuals'),
        ('sales_metrics')
) AS required_tables(table_name)
LEFT JOIN information_schema.tables t 
    ON t.table_name = required_tables.table_name 
    AND t.table_schema = 'public'
ORDER BY required_tables.table_name;

-- Check employees table columns
SELECT 
    'employees' AS table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employees' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check profiles table columns
SELECT 
    'profiles' AS table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check teams table columns
SELECT 
    'teams' AS table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'teams' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for missing columns in employees table
SELECT 
    'Missing Columns in employees' AS check_type,
    missing_column
FROM (
    VALUES 
        ('id'),
        ('email'),
        ('full_name'),
        ('role'),
        ('department'),
        ('phone'),
        ('status'),
        ('created_at'),
        ('updated_at')
) AS required_columns(missing_column)
WHERE missing_column NOT IN (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'employees' AND table_schema = 'public'
);

-- Check for missing columns in profiles table
SELECT 
    'Missing Columns in profiles' AS check_type,
    missing_column
FROM (
    VALUES 
        ('id'),
        ('email'),
        ('full_name'),
        ('avatar_url'),
        ('phone'),
        ('nin'),
        ('smart_cash_account'),
        ('role'),
        ('status'),
        ('location'),
        ('photo'),
        ('team_id'),
        ('created_by'),
        ('approved_by'),
        ('created_at'),
        ('updated_at')
) AS required_columns(missing_column)
WHERE missing_column NOT IN (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' AND table_schema = 'public'
);

-- Check for missing columns in teams table
SELECT 
    'Missing Columns in teams' AS check_type,
    missing_column
FROM (
    VALUES 
        ('id'),
        ('team_id'),
        ('name'),
        ('description'),
        ('category'),
        ('activity_type'),
        ('channels'),
        ('kit_id'),
        ('location'),
        ('date'),
        ('created_by'),
        ('fae_id'),
        ('created_at')
) AS required_columns(missing_column)
WHERE missing_column NOT IN (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'teams' AND table_schema = 'public'
);

-- Check indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('employees', 'profiles', 'teams', 'canvasser_activities', 'canvasser_productivity')
ORDER BY tablename, indexname;

-- Check foreign key constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Check RLS status
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('employees', 'profiles', 'canvasser_activities', 'canvasser_productivity')
ORDER BY tablename;

-- Summary count of records in each table (if tables exist)
DO $$
DECLARE
    rec RECORD;
    sql_text TEXT;
    result_count INTEGER;
BEGIN
    FOR rec IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'employees', 'profiles', 'users', 'teams', 'team_members', 
            'tasks', 'attendance', 'canvasser_activities', 'turfs', 
            'canvasser_productivity', 'activity_planner', 'okr_targets', 
            'okr_actuals', 'sales_metrics'
        )
    LOOP
        sql_text := 'SELECT COUNT(*) FROM public.' || quote_ident(rec.table_name);
        EXECUTE sql_text INTO result_count;
        RAISE NOTICE 'Table: %, Record Count: %', rec.table_name, result_count;
    END LOOP;
END $$;