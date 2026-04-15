-- Add restaurant_uid column to orders table

ALTER TABLE "orders" 
ADD COLUMN "restaurant_uid" VARCHAR(255) NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'restaurant_uid';
