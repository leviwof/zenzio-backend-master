-- Migration script to add missing columns to orders table
-- Run this script on your PostgreSQL database

-- Add user_otp column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_otp VARCHAR(10);

-- Add item_total column  
ALTER TABLE orders ADD COLUMN IF NOT EXISTS item_total FLOAT DEFAULT 0;

-- Add delivery_fee column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee FLOAT DEFAULT 0;

-- Add taxes column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS taxes FLOAT DEFAULT 0;

-- Add delivery_address column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Add restaurant coordinates columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS restaurant_lat DECIMAL(10, 7);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS restaurant_lng DECIMAL(10, 7);

-- Add customer coordinates columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_lat DECIMAL(10, 7);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_lng DECIMAL(10, 7);

-- Add partner (delivery partner) coordinates columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS partner_lat DECIMAL(10, 7);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS partner_lng DECIMAL(10, 7);

-- Add distance_km column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS distance_km FLOAT;

-- Add payment_mode column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(20);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
