-- 1. Drop the existing table to start fresh
DROP TABLE IF EXISTS rooms;

-- 2. Create the rooms table for multiplayer
CREATE TABLE rooms (
  id text PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  player1_address text,
  player2_address text,
  player1_card jsonb,
  player2_card jsonb,
  player1_hp integer DEFAULT 0,
  player2_hp integer DEFAULT 0,
  player1_shield integer DEFAULT 0,
  player2_shield integer DEFAULT 0,
  player1_move jsonb,
  player2_move jsonb,
  status text DEFAULT 'waiting'::text,
  winner text,
  action_log jsonb DEFAULT '[]'::jsonb
);

-- 3. Disable Row Level Security (RLS) so our Anon key can freely read/write for the game
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;

-- 4. Turn on Realtime for the rooms table
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
