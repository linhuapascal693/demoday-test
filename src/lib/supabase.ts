import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库类型定义
export type UserProfile = {
  id: string
  email: string
  profession: string | null
  interests: string[]
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type LearningProgress = {
  id: string
  user_id: string
  concept_id: string
  concept_name: string
  topic: string
  status: 'not_started' | 'learning' | 'mastered'
  feynman_score: number | null
  feynman_round: number
  last_studied_at: string | null
  created_at: string
  updated_at: string
}

export type FeynmanSession = {
  id: string
  user_id: string
  concept_id: string
  concept_name: string
  topic: string
  current_round: number
  conversation: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
  is_completed: boolean
  final_score: number | null
  created_at: string
  updated_at: string
}

export type LearningStats = {
  id: string
  user_id: string
  total_concepts_studied: number
  total_concepts_mastered: number
  total_feynman_completed: number
  current_streak_days: number
  longest_streak_days: number
  last_study_date: string | null
  weekly_goal: number
  weekly_progress: number
  created_at: string
  updated_at: string
}

// 辅助函数：获取用户资料
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data as UserProfile
}

// 辅助函数：更新用户资料
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data as UserProfile
}

// 辅助函数：获取学习进度
export async function getLearningProgress(userId: string) {
  const { data, error } = await supabase
    .from('learning_progress')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  
  if (error) throw error
  return data as LearningProgress[]
}

// 辅助函数：更新学习进度
export async function updateLearningProgress(
  userId: string, 
  conceptId: string, 
  updates: Partial<LearningProgress>
) {
  const { data, error } = await supabase
    .from('learning_progress')
    .upsert({
      user_id: userId,
      concept_id: conceptId,
      ...updates,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data as LearningProgress
}

// 辅助函数：获取学习统计
export async function getLearningStats(userId: string) {
  const { data, error } = await supabase
    .from('learning_stats')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) throw error
  return data as LearningStats
}

// 辅助函数：获取费曼练习记录
export async function getFeynmanSession(userId: string, conceptId: string) {
  const { data, error } = await supabase
    .from('feynman_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('concept_id', conceptId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
  return data as FeynmanSession | null
}

// 辅助函数：创建或更新费曼练习记录
export async function saveFeynmanSession(
  userId: string,
  conceptId: string,
  session: Partial<FeynmanSession>
) {
  const { data, error } = await supabase
    .from('feynman_sessions')
    .upsert({
      user_id: userId,
      concept_id: conceptId,
      ...session,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data as FeynmanSession
}
