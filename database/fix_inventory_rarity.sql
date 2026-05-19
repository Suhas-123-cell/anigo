-- =============================================
-- Fix Inventory Rarity Column
-- Run this in Supabase SQL Editor if catch endpoint is failing
-- =============================================

-- Ensure rarity column exists with proper defaults
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS rarity text NOT NULL DEFAULT 'common';

-- Update any NULL rarity values to 'common'
UPDATE public.inventory SET rarity = 'common' WHERE rarity IS NULL;

-- Verify the column
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'inventory' AND column_name = 'rarity';

-- Check table structure
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'inventory';
