-- Parent-defined rewards and child redemptions
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INT NOT NULL DEFAULT 0 CHECK (xp >= 0);

CREATE TABLE IF NOT EXISTS reward_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cost_points INT NOT NULL CHECK (cost_points > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_item_id UUID REFERENCES reward_items(id) ON DELETE SET NULL,
  child_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  cost_points INT NOT NULL CHECK (cost_points > 0),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'fulfilled', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  resolved_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_reward_items_parent_id ON reward_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_reward_items_active ON reward_items(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_child_id ON reward_redemptions(child_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_parent_id ON reward_redemptions(parent_id);
