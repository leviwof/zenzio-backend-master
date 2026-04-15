-- Migration: Add delivery_partner_uid and createdAt columns to orders table
-- Run this SQL in your PostgreSQL database

-- Add delivery_partner_uid column
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_partner_uid VARCHAR(255);

-- Add createdAt column (if not exists)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows with createdAt from time column
UPDATE orders
SET "createdAt" = time::timestamp WITH TIME ZONE
WHERE "createdAt" IS NULL AND time IS NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
