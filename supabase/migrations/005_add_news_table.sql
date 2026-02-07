-- 创建资讯表
CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  reason TEXT NOT NULL,
  key_takeaway TEXT NOT NULL,
  source TEXT NOT NULL,
  topic TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_news_user_id ON news(user_id);
CREATE INDEX idx_news_created_at ON news(created_at);
CREATE INDEX idx_news_user_created ON news(user_id, created_at);

-- 启用 RLS
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can view own news"
  ON news FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own news"
  ON news FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own news"
  ON news FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own news"
  ON news FOR DELETE
  USING (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
