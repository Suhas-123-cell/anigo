-- =============================================
-- Fix Character Rarities in Inventory
-- Run this in Supabase SQL Editor to fix existing character rarities
-- =============================================

-- Character Rarity Mapping
-- Update existing inventory entries with correct rarities based on character name

UPDATE public.inventory SET rarity = 'rare' WHERE character_name = 'Naruto Uzumaki' AND rarity = 'common';
UPDATE public.inventory SET rarity = 'rare' WHERE character_name = 'Goku' AND rarity = 'common';
UPDATE public.inventory SET rarity = 'legendary' WHERE character_name = 'Luffy' AND rarity = 'common';
UPDATE public.inventory SET rarity = 'legendary' WHERE character_name = 'Itachi Uchiha' AND rarity = 'common';
UPDATE public.inventory SET rarity = 'legendary' WHERE character_name = 'Gojo Satoru' AND rarity = 'common';
UPDATE public.inventory SET rarity = 'rare' WHERE character_name = 'Levi Ackerman' AND rarity = 'common';
UPDATE public.inventory SET rarity = 'rare' WHERE character_name = 'Eren Yeager' AND rarity = 'common';
UPDATE public.inventory SET rarity = 'rare' WHERE character_name = 'Spike Spiegel' AND rarity = 'common';
UPDATE public.inventory SET rarity = 'rare' WHERE character_name = 'Edward Elric' AND rarity = 'common';
UPDATE public.inventory SET rarity = 'legendary' WHERE character_name = 'Saitama' AND rarity = 'common';
UPDATE public.inventory SET rarity = 'rare' WHERE character_name = 'Light Yagami' AND rarity = 'common';
UPDATE public.inventory SET rarity = 'legendary' WHERE character_name = 'Zoro' AND rarity = 'common';

-- Verify results
SELECT character_name, rarity, COUNT(*) as count FROM public.inventory GROUP BY character_name, rarity ORDER BY character_name;
