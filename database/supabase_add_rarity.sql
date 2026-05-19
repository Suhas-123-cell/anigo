-- Supabase Migration: Add rarity column to inventory table
-- Run this in Supabase SQL Editor if you already have the inventory table

ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS rarity text NOT NULL DEFAULT 'common';
