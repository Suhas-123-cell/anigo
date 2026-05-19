-- =============================================
-- Fix Characters Table - Add avatar_filename column
-- Run this if characters table already exists without avatar_filename
-- =============================================

-- Option 1: If table doesn't have avatar_filename, add it
ALTER TABLE IF EXISTS public.characters ADD COLUMN IF NOT EXISTS avatar_filename TEXT;

-- Option 2: Alternative - Drop and recreate if needed
-- DROP TABLE IF EXISTS public.characters CASCADE;
-- Then run add_characters_table.sql

-- Verify the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'characters' AND table_schema = 'public';
