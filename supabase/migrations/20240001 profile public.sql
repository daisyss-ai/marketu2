-- Migration: profile public reputation
-- Run in Supabase SQL editor

-- 1. Add is_verified column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- 2. View for average seller response time (minutes)
CREATE OR REPLACE VIEW seller_avg_response AS
SELECT
  seller_id,
  ROUND(
    AVG(
      EXTRACT(EPOCH FROM (updated_at - created_at)) / 60
    )
  )::int AS avg_response_minutes,
  COUNT(*) AS confirmed_orders
FROM orders
WHERE status::text IN ('confirmed', 'delivered')
  AND updated_at > created_at
  AND (updated_at - created_at) < INTERVAL '7 days'
GROUP BY seller_id;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_orders_seller_status ON orders (seller_id, status);
CREATE INDEX IF NOT EXISTS idx_products_seller_active ON products (seller_id, is_active);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews (reviewer_id);