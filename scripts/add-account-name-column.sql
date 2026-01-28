-- Migration: Add account_name column to cash_accounts table
-- Run this in Supabase SQL Editor if the column doesn't exist

-- Check if column exists and add if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cash_accounts' 
        AND column_name = 'account_name'
    ) THEN
        ALTER TABLE cash_accounts 
        ADD COLUMN account_name TEXT NOT NULL DEFAULT 'บัญชีหลัก';
        
        RAISE NOTICE 'Column account_name added successfully';
    ELSE
        RAISE NOTICE 'Column account_name already exists';
    END IF;
END $$;

-- Verify the column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'cash_accounts' 
AND column_name = 'account_name';
