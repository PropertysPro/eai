-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  match_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Add RLS policies for matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own matches
CREATE POLICY "Users can read their own matches"
  ON matches FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own matches
CREATE POLICY "Users can insert their own matches"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own matches
CREATE POLICY "Users can update their own matches"
  ON matches FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own matches
CREATE POLICY "Users can delete their own matches"
  ON matches FOR DELETE
  USING (auth.uid() = user_id);

-- Add RLS policies for favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own favorites
CREATE POLICY "Users can read their own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own favorites
CREATE POLICY "Users can insert their own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own favorites
CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Insert sample data for matches (optional)
-- This will create matches between the first user and all properties
INSERT INTO matches (user_id, property_id, match_score)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  id,
  RANDOM() * 100
FROM properties;

-- Insert sample data for favorites (optional)
-- This will add the first 3 properties to the first user's favorites
INSERT INTO favorites (user_id, property_id)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  id
FROM properties
LIMIT 3;
