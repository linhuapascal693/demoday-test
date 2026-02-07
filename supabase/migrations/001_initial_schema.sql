-- 知识领航员数据库初始化脚本
-- 在 Supabase SQL Editor 中执行

-- ============================================
-- 1. 用户资料表 (profiles)
-- ============================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  profession text,
  interests text[] default '{}',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 启用 RLS
alter table profiles enable row level security;

-- 创建策略
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- ============================================
-- 2. 学习进度表 (learning_progress)
-- ============================================
create table if not exists learning_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  concept_id text not null,
  concept_name text not null,
  topic text not null,
  status text default 'not_started' check (status in ('not_started', 'learning', 'mastered')),
  feynman_score integer check (feynman_score >= 0 and feynman_score <= 100),
  feynman_round integer default 0,
  last_studied_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, concept_id)
);

-- 索引
CREATE INDEX idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX idx_learning_progress_concept_id ON learning_progress(concept_id);
CREATE INDEX idx_learning_progress_status ON learning_progress(status);

-- 启用 RLS
alter table learning_progress enable row level security;

-- 创建策略
create policy "Users can view own progress"
  on learning_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on learning_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on learning_progress for update
  using (auth.uid() = user_id);

create policy "Users can delete own progress"
  on learning_progress for delete
  using (auth.uid() = user_id);

-- ============================================
-- 3. 费曼练习记录表 (feynman_sessions)
-- ============================================
create table if not exists feynman_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  concept_id text not null,
  concept_name text not null,
  topic text not null,
  current_round integer default 1 check (current_round >= 1 and current_round <= 3),
  conversation jsonb default '[]'::jsonb,
  is_completed boolean default false,
  final_score integer check (final_score >= 0 and final_score <= 100),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 索引
CREATE INDEX idx_feynman_sessions_user_id ON feynman_sessions(user_id);
CREATE INDEX idx_feynman_sessions_concept_id ON feynman_sessions(concept_id);
CREATE INDEX idx_feynman_sessions_completed ON feynman_sessions(is_completed);

-- 启用 RLS
alter table feynman_sessions enable row level security;

-- 创建策略
create policy "Users can view own feynman sessions"
  on feynman_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own feynman sessions"
  on feynman_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own feynman sessions"
  on feynman_sessions for update
  using (auth.uid() = user_id);

-- ============================================
-- 4. 学习统计表 (learning_stats)
-- ============================================
create table if not exists learning_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  total_concepts_studied integer default 0,
  total_concepts_mastered integer default 0,
  total_feynman_completed integer default 0,
  current_streak_days integer default 0,
  longest_streak_days integer default 0,
  last_study_date date,
  weekly_goal integer default 5,
  weekly_progress integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 启用 RLS
alter table learning_stats enable row level security;

-- 创建策略
create policy "Users can view own stats"
  on learning_stats for select
  using (auth.uid() = user_id);

create policy "Users can update own stats"
  on learning_stats for update
  using (auth.uid() = user_id);

create policy "Users can insert own stats"
  on learning_stats for insert
  with check (auth.uid() = user_id);

-- ============================================
-- 5. 用户兴趣标签表 (user_interests)
-- ============================================
create table if not exists user_interests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  interest text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, interest)
);

-- 启用 RLS
alter table user_interests enable row level security;

-- 创建策略
create policy "Users can view own interests"
  on user_interests for select
  using (auth.uid() = user_id);

create policy "Users can manage own interests"
  on user_interests for all
  using (auth.uid() = user_id);

-- ============================================
-- 6. 创建触发器函数：自动更新 updated_at
-- ============================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- 为所有表添加触发器
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_progress_updated_at BEFORE UPDATE ON learning_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feynman_sessions_updated_at BEFORE UPDATE ON feynman_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_stats_updated_at BEFORE UPDATE ON learning_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. 创建触发器函数：用户注册时自动创建资料
-- ============================================
create or replace function handle_new_user()
returns trigger as $$
begin
  -- 创建用户资料
  insert into profiles (id, email, created_at, updated_at)
  values (new.id, new.email, now(), now());
  
  -- 创建学习统计
  insert into learning_stats (user_id, created_at, updated_at)
  values (new.id, now(), now());
  
  return new;
end;
$$ language plpgsql security definer;

-- 监听用户注册
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 8. 创建存储过程：更新学习统计
-- ============================================
create or replace function update_learning_statistics(p_user_id uuid)
returns void as $$
begin
  update learning_stats
  set 
    total_concepts_studied = (
      select count(*) from learning_progress 
      where user_id = p_user_id and status != 'not_started'
    ),
    total_concepts_mastered = (
      select count(*) from learning_progress 
      where user_id = p_user_id and status = 'mastered'
    ),
    total_feynman_completed = (
      select count(*) from feynman_sessions 
      where user_id = p_user_id and is_completed = true
    ),
    updated_at = now()
  where user_id = p_user_id;
end;
$$ language plpgsql;

-- ============================================
-- 完成
-- ============================================
