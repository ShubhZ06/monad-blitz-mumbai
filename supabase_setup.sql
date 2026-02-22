-- ============================================================
-- MonadMons TCG – Full Supabase Schema
-- ============================================================

-- 1. Rooms table (multiplayer battle sessions)
DROP TABLE IF EXISTS rooms;

CREATE TABLE rooms (
  id text PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  player1_address text,
  player2_address text,
  player1_card jsonb,
  player2_card jsonb,
  player1_owned_card_id uuid,    -- references player_cards.id for transfer
  player2_owned_card_id uuid,    -- references player_cards.id for transfer
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

ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;

-- 2. Player Cards table (card ownership / inventory)
DROP TABLE IF EXISTS player_cards;

CREATE TABLE player_cards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id text NOT NULL,                              -- references card catalog ID (e.g. 'charizard')
  owner_address text NOT NULL,                        -- wallet address (lowercase)
  acquired_via text NOT NULL DEFAULT 'shop',          -- 'shop' | 'daily_claim' | 'battle_win' | 'starter'
  acquired_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookups by owner
CREATE INDEX idx_player_cards_owner ON player_cards(owner_address);
CREATE INDEX idx_player_cards_owner_via ON player_cards(owner_address, acquired_via);

ALTER TABLE player_cards DISABLE ROW LEVEL SECURITY;

-- 3. Enable Realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE player_cards;
