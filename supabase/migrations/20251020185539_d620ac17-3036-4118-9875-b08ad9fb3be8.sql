-- Create shared_wishlists table
CREATE TABLE shared_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  name TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_shared_wishlists_user_id ON shared_wishlists(user_id);
CREATE INDEX idx_shared_wishlists_share_token ON shared_wishlists(share_token);
CREATE INDEX idx_shared_wishlists_active ON shared_wishlists(is_active);

-- Enable RLS
ALTER TABLE shared_wishlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own shared wishlists"
  ON shared_wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create shared wishlists"
  ON shared_wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared wishlists"
  ON shared_wishlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared wishlists"
  ON shared_wishlists FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active shared wishlists"
  ON shared_wishlists FOR SELECT
  USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_shared_wishlists_updated_at
  BEFORE UPDATE ON shared_wishlists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();