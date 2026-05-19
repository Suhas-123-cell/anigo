-- =============================================
-- Character Rarity & Spawn Frequency Table
-- Run this in Supabase SQL Editor
-- =============================================

-- Create characters table with rarity and spawn frequency
CREATE TABLE IF NOT EXISTS public.characters (
    id bigint generated always as identity primary key,
    name text not null unique,
    anime text not null,
    rarity text not null check (rarity in ('common', 'rare', 'legendary', 'black')),
    spawn_frequency_ms integer not null default 300000,
    xp_reward integer not null default 5,
    last_spawned_at timestamptz default null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create index on rarity for filtering
CREATE INDEX IF NOT EXISTS idx_characters_rarity ON public.characters (rarity);
CREATE INDEX IF NOT EXISTS idx_characters_name ON public.characters (name);

-- Insert character data with spawn frequencies and XP rewards
INSERT INTO public.characters (name, anime, rarity, spawn_frequency_ms, xp_reward)
VALUES
    ('Naruto Uzumaki', 'Naruto', 'rare', 900000, 10),
    ('Goku', 'Dragon Ball', 'rare', 900000, 10),
    ('Luffy', 'One Piece', 'legendary', 1800000, 25),
    ('Levi Ackerman', 'Attack on Titan', 'rare', 900000, 10),
    ('Itachi Uchiha', 'Naruto', 'black', 3600000, 100),
    ('Tanjiro Kamado', 'Demon Slayer', 'common', 300000, 5),
    ('Gojo Satoru', 'Jujutsu Kaisen', 'legendary', 1800000, 25),
    ('Eren Yeager', 'Attack on Titan', 'black', 3600000, 100),
    ('Spike Spiegel', 'Cowboy Bebop', 'common', 300000, 5),
    ('Edward Elric', 'FMA', 'common', 300000, 5),
    ('Saitama', 'One Punch Man', 'common', 300000, 5),
    ('Light Yagami', 'Death Note', 'rare', 900000, 10),
    ('Zoro', 'One Piece', 'rare', 900000, 10),
    ('Sasuke', 'Naruto', 'common', 300000, 5),
    ('Mikasa', 'Attack on Titan', 'common', 300000, 5)
ON CONFLICT (name) DO UPDATE SET
    rarity = EXCLUDED.rarity,
    spawn_frequency_ms = EXCLUDED.spawn_frequency_ms,
    xp_reward = EXCLUDED.xp_reward;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.set_characters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_characters_updated_at ON public.characters;
CREATE TRIGGER trg_characters_updated_at
BEFORE UPDATE ON public.characters
FOR EACH ROW
EXECUTE FUNCTION public.set_characters_updated_at();

-- Verify data
SELECT name, anime, rarity, spawn_frequency_ms, xp_reward FROM public.characters ORDER BY rarity, name;
