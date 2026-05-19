-- =============================================
-- Add Characters Table to Supabase
-- Run in Supabase SQL Editor
-- =============================================

-- Drop table if it exists to ensure clean state
DROP TABLE IF EXISTS public.characters CASCADE;

-- Create characters table
CREATE TABLE public.characters (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    anime TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'legendary', 'black')),
    spawn_frequency_ms INTEGER NOT NULL,
    xp_reward INTEGER NOT NULL,
    avatar_filename TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_characters_name ON public.characters(name);
CREATE INDEX IF NOT EXISTS idx_characters_rarity ON public.characters(rarity);
CREATE INDEX IF NOT EXISTS idx_characters_anime ON public.characters(anime);

-- Insert Common Rarity Characters (30)
INSERT INTO public.characters (name, anime, rarity, spawn_frequency_ms, xp_reward, avatar_filename) VALUES
    ('Tanjiro Kamado', 'Demon Slayer', 'common', 300000, 5, 'tanjiro-kamado.jpg'),
    ('Nezuko Kamado', 'Demon Slayer', 'common', 300000, 5, 'nezuko-kamado.jpg'),
    ('Zenitsu Agatsuma', 'Demon Slayer', 'common', 300000, 5, 'zenitsu-agatsuma.jpg'),
    ('Inosuke Hashibira', 'Demon Slayer', 'common', 300000, 5, 'inosuke-hashibira.jpg'),
    ('Yuji Itadori', 'Jujutsu Kaisen', 'common', 300000, 5, 'yuji-itadori.jpg'),
    ('Megumi Fushiguro', 'Jujutsu Kaisen', 'common', 300000, 5, 'megumi-fushiguro.jpg'),
    ('Nobara Kugisaki', 'Jujutsu Kaisen', 'common', 300000, 5, 'nobara-kugisaki.jpg'),
    ('Sakura Haruno', 'Naruto', 'common', 300000, 5, 'sakura-haruno.jpg'),
    ('Rock Lee', 'Naruto', 'common', 300000, 5, 'rock-lee.jpg'),
    ('Hinata Hyuga', 'Naruto', 'common', 300000, 5, 'hinata-hyuga.jpg'),
    ('Sanji', 'One Piece', 'common', 300000, 5, 'sanji.jpg'),
    ('Usopp', 'One Piece', 'common', 300000, 5, 'usopp.jpg'),
    ('Tony Tony Chopper', 'One Piece', 'common', 300000, 5, 'tony-tony-chopper.jpg'),
    ('Nami', 'One Piece', 'common', 300000, 5, 'nami.jpg'),
    ('Orihime Inoue', 'Bleach', 'common', 300000, 5, 'orihime-inoue.jpg'),
    ('Uryu Ishida', 'Bleach', 'common', 300000, 5, 'uryu-ishida.jpg'),
    ('Mikasa Ackerman', 'Attack on Titan', 'common', 300000, 5, 'mikasa-ackerman.jpg'),
    ('Armin Arlert', 'Attack on Titan', 'common', 300000, 5, 'armin-arlert.jpg'),
    ('Sasha Blouse', 'Attack on Titan', 'common', 300000, 5, 'sasha-blouse.jpg'),
    ('Genos', 'One Punch Man', 'common', 300000, 5, 'genos.jpg'),
    ('Mumen Rider', 'One Punch Man', 'common', 300000, 5, 'mumen-rider.jpg'),
    ('Ochaco Uraraka', 'My Hero Academia', 'common', 300000, 5, 'ochaco-uraraka.jpg'),
    ('Tenya Iida', 'My Hero Academia', 'common', 300000, 5, 'tenya-iida.jpg'),
    ('Denji', 'Chainsaw Man', 'common', 300000, 5, 'denji.jpg'),
    ('Power', 'Chainsaw Man', 'common', 300000, 5, 'power.jpg'),
    ('Aki Hayakawa', 'Chainsaw Man', 'common', 300000, 5, 'aki-hayakawa.jpg'),
    ('Subaru Natsuki', 'Re:Zero', 'common', 300000, 5, 'subaru-natsuki.jpg'),
    ('Emilia', 'Re:Zero', 'common', 300000, 5, 'emilia.jpg'),
    ('Edward Elric', 'Fullmetal Alchemist', 'common', 300000, 5, 'edward-elric.jpg'),
    ('Winry Rockbell', 'Fullmetal Alchemist', 'common', 300000, 5, 'winry-rockbell.jpg');

-- Insert Rare Rarity Characters (12)
INSERT INTO public.characters (name, anime, rarity, spawn_frequency_ms, xp_reward, avatar_filename) VALUES
    ('Naruto Uzumaki', 'Naruto', 'rare', 900000, 10, 'naruto-uzumaki.jpg'),
    ('Sasuke Uchiha', 'Naruto', 'rare', 900000, 10, 'sasuke-uchiha.jpg'),
    ('Kakashi Hatake', 'Naruto', 'rare', 900000, 10, 'kakashi-hatake.jpg'),
    ('Roronoa Zoro', 'One Piece', 'rare', 900000, 10, 'roronoa-zoro.jpg'),
    ('Monkey D. Ace', 'One Piece', 'rare', 900000, 10, 'monkey-d-ace.jpg'),
    ('Toji Fushiguro', 'Jujutsu Kaisen', 'rare', 900000, 10, 'toji-fushiguro.jpg'),
    ('Levi Ackerman', 'Attack on Titan', 'rare', 900000, 10, 'levi-ackerman.jpg'),
    ('Light Yagami', 'Death Note', 'rare', 900000, 10, 'light-yagami.jpg'),
    ('Vegeta', 'Dragon Ball', 'rare', 900000, 10, 'vegeta.jpg'),
    ('Shoto Todoroki', 'My Hero Academia', 'rare', 900000, 10, 'shoto-todoroki.jpg'),
    ('Killua Zoldyck', 'Hunter x Hunter', 'rare', 900000, 10, 'killua-zoldyck.jpg'),
    ('Yuta Okkotsu', 'Jujutsu Kaisen', 'rare', 900000, 10, 'yuta-okkotsu.jpg');

-- Insert Legendary Rarity Characters (7)
INSERT INTO public.characters (name, anime, rarity, spawn_frequency_ms, xp_reward, avatar_filename) VALUES
    ('Monkey D. Luffy', 'One Piece', 'legendary', 1800000, 25, 'monkey-d-luffy.jpg'),
    ('Satoru Gojo', 'Jujutsu Kaisen', 'legendary', 1800000, 25, 'satoru-gojo.jpg'),
    ('Goku', 'Dragon Ball', 'legendary', 1800000, 25, 'goku.jpg'),
    ('Sung Jin-Woo', 'Solo Leveling', 'legendary', 1800000, 25, 'sung-jin-woo.jpg'),
    ('Ichigo Kurosaki', 'Bleach', 'legendary', 1800000, 25, 'ichigo-kurosaki.jpg'),
    ('Eren Yeager', 'Attack on Titan', 'legendary', 1800000, 25, 'eren-yeager.jpg'),
    ('Saitama', 'One Punch Man', 'legendary', 1800000, 25, 'saitama.jpg');

-- Insert Black Rarity Characters (5) - use 'sukuna' filename for Ryomen Sukuna
INSERT INTO public.characters (name, anime, rarity, spawn_frequency_ms, xp_reward, avatar_filename) VALUES
    ('Itachi Uchiha', 'Naruto', 'black', 3600000, 100, 'itachi-uchiha.jpg'),
    ('Ryomen Sukuna', 'Jujutsu Kaisen', 'black', 3600000, 100, 'sukuna.jpg'),
    ('Sosuke Aizen', 'Bleach', 'black', 3600000, 100, 'sosuke-aizen.jpg'),
    ('Akagami Shanks', 'One Piece', 'black', 3600000, 100, 'akagami-shanks.jpg');

-- Add trigger to update updated_at
DROP TRIGGER IF EXISTS trg_characters_updated_at ON public.characters;

CREATE OR REPLACE FUNCTION public.set_characters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_characters_updated_at
BEFORE UPDATE ON public.characters
FOR EACH ROW
EXECUTE FUNCTION public.set_characters_updated_at();
