-- Migration: Add manual_price column to stocks table
-- Run this in Supabase SQL Editor

-- Add manual_price column to existing stocks table
ALTER TABLE stocks 
ADD COLUMN IF NOT EXISTS manual_price DECIMAL(15, 4);

-- Update data_source comment to include new sources
COMMENT ON COLUMN stocks.data_source IS 'yahoo, scbam, fundsupermart, scb_robo, guru_portfolio, manual';

-- Optional: Add index for faster queries on data_source
CREATE INDEX IF NOT EXISTS idx_stocks_data_source ON stocks(data_source);

-- Verify the changes
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'stocks' 
ORDER BY ordinal_position;
