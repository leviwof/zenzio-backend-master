-- Migration: Fix Revenue Calculation
-- Run this script to add revenue tracking columns and backfill historical data

-- Step 1: Add new columns (idempotent - safe to run multiple times)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "is_revenue_counted" boolean DEFAULT false;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "refunded_amount" float DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_status" varchar(50);

-- Step 2: Backfill payment_status for existing ONLINE orders
-- ONLINE orders that were successful (not cancelled/rejected) get 'success' status
UPDATE "orders" 
SET "payment_status" = 'success'
WHERE "payment_mode" = 'ONLINE' 
  AND "restaurantStatus" NOT IN ('cancelled', 'rejected')
  AND "deliveryPartnerStatus" NOT IN ('cancelled', 'admin_cancelled')
  AND ("payment_status" IS NULL OR "payment_status" = '');

-- Step 3: Backfill isRevenueCounted based on business rules
-- Rule 1: ONLINE orders with payment_status = success
UPDATE "orders" 
SET "is_revenue_counted" = true
WHERE "payment_mode" = 'ONLINE' 
  AND "payment_status" = 'success'
  AND "restaurantStatus" NOT IN ('cancelled', 'rejected')
  AND "deliveryPartnerStatus" NOT IN ('cancelled', 'admin_cancelled');

-- Rule 2: COD orders that were delivered
UPDATE "orders" 
SET "is_revenue_counted" = true
WHERE "payment_mode" = 'COD' 
  AND "deliveryPartnerStatus" = 'delivered'
  AND "restaurantStatus" NOT IN ('cancelled', 'rejected');

-- Step 4: Create index for faster revenue queries
CREATE INDEX IF NOT EXISTS idx_orders_revenue_lookup 
ON "orders" ("payment_mode", "payment_status", "deliveryPartnerStatus", "restaurantStatus", "is_revenue_counted")
WHERE "is_revenue_counted" = true;

-- Step 5: Create function to safely update revenue tracking (for webhook handlers)
-- This prevents race conditions with duplicate webhooks
CREATE OR REPLACE FUNCTION mark_order_revenue_eligible(p_order_id uuid, p_payment_status text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only update if not already counted (prevents double counting)
  UPDATE "orders" 
  SET 
    "is_revenue_counted" = true,
    "payment_status" = COALESCE(p_payment_status, "payment_status")
  WHERE "id" = p_order_id 
    AND "is_revenue_counted" = false;
END;
$$;

-- Step 6: Create function to handle refund (subtracts from revenue)
CREATE OR REPLACE FUNCTION handle_refund(p_order_id uuid, p_refund_amount float)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "orders"
  SET "refunded_amount" = COALESCE("refunded_amount", 0) + p_refund_amount
  WHERE "id" = p_order_id;
  
  -- Log the refund for audit
  RAISE NOTICE 'Refund processed: Order % - Amount: %', p_order_id, p_refund_amount;
END;
$$;

-- Step 7: Verify revenue calculation matches expected formula
-- Run this query to see revenue breakdown
-- SELECT 
--   COUNT(*) as "valid_orders",
--   ROUND(SUM("delivery_fee")::numeric, 2) as "total_delivery_fee",
--   ROUND(SUM("packing_charge")::numeric, 2) as "total_packing_charge", 
--   ROUND(SUM("taxes")::numeric, 2) as "total_tax",
--   ROUND(SUM("refunded_amount")::numeric, 2) as "total_refunded",
--   ROUND(SUM("delivery_fee" + "packing_charge" + "taxes" - COALESCE("refunded_amount", 0))::numeric, 2) as "net_revenue"
-- FROM "orders"
-- WHERE "is_revenue_counted" = true;