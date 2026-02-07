-- 修复 learning_stats 表的 RLS 策略

-- 删除现有策略
DROP POLICY IF EXISTS "Users can view own stats" ON learning_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON learning_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON learning_stats;

-- 重新创建策略（允许用户插入自己的记录）
CREATE POLICY "Enable insert for authenticated users only"
  ON learning_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable select for users based on user_id"
  ON learning_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id"
  ON learning_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- 完成
