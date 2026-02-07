-- Supabase Database Schema for Knowledge Navigator

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  profession TEXT NOT NULL,
  interests TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge Maps Table
CREATE TABLE IF NOT EXISTS knowledge_maps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Concept Decodes Table
CREATE TABLE IF NOT EXISTS concept_decodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id TEXT NOT NULL,
  map_id UUID REFERENCES knowledge_maps(id) ON DELETE CASCADE,
  what TEXT NOT NULL,
  why TEXT NOT NULL,
  how TEXT NOT NULL,
  "when" TEXT NOT NULL,
  "where" TEXT NOT NULL,
  who TEXT NOT NULL,
  analogies JSONB NOT NULL DEFAULT '[]',
  classics TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feynman Sessions Table
CREATE TABLE IF NOT EXISTS feynman_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  concept_name TEXT NOT NULL,
  rounds JSONB NOT NULL DEFAULT '[]',
  final_score NUMERIC(3,1),
  clarity_score NUMERIC(3,1),
  accuracy_score NUMERIC(3,1),
  completeness_score NUMERIC(3,1),
  feedback TEXT,
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- News Items Table
CREATE TABLE IF NOT EXISTS news_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  reason TEXT NOT NULL,
  key_takeaway TEXT NOT NULL,
  source TEXT NOT NULL,
  topic TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User News Interactions Table
CREATE TABLE IF NOT EXISTS user_news_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  news_id UUID REFERENCES news_items(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, news_id)
);

-- Learning Achievements Table
CREATE TABLE IF NOT EXISTS learning_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_knowledge_maps_user_id ON knowledge_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_concept_decodes_map_id ON concept_decodes(map_id);
CREATE INDEX IF NOT EXISTS idx_feynman_sessions_user_id ON feynman_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_news_items_topic ON news_items(topic);
CREATE INDEX IF NOT EXISTS idx_user_news_interactions_user_id ON user_news_interactions(user_id);

-- Row Level Security (RLS) Policies

-- Profiles: Users can only read/update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Knowledge Maps: Users can only access their own maps
ALTER TABLE knowledge_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own knowledge maps" ON knowledge_maps
  FOR ALL USING (auth.uid() = user_id);

-- Concept Decodes: Users can only access decodes for their own maps
ALTER TABLE concept_decodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own concept decodes" ON concept_decodes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM knowledge_maps 
      WHERE knowledge_maps.id = concept_decodes.map_id 
      AND knowledge_maps.user_id = auth.uid()
    )
  );

-- Feynman Sessions: Users can only access their own sessions
ALTER TABLE feynman_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own feynman sessions" ON feynman_sessions
  FOR ALL USING (auth.uid() = user_id);

-- News Items: Public read access
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "News items are publicly readable" ON news_items
  FOR SELECT USING (true);

-- User News Interactions: Users can only access their own interactions
ALTER TABLE user_news_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own news interactions" ON user_news_interactions
  FOR ALL USING (auth.uid() = user_id);

-- Learning Achievements: Users can only access their own achievements
ALTER TABLE learning_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON learning_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, profession, interests)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'profession', '其他'),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'interests')), ARRAY[]::TEXT[])
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
