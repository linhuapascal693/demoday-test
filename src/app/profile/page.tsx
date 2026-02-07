'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  BookOpen, 
  Target, 
  Award, 
  Calendar,
  ChevronRight,
  Star,
  Clock,
  FileText,
  Bookmark,
  Search,
  Trash2,
  Briefcase,
  Tag,
  Loader2
} from 'lucide-react'
import { ACHIEVEMENTS, formatDate } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { supabase } from '@/lib/supabase'

interface UserStats {
  learning_topics: number
  mastered_concepts: number
  feynman_sessions: number
  streak_days: number
}

interface LearningTopic {
  id: string
  name: string
  progress: number
  mastered: number
  total: number
  last_studied: string
}

interface FeynmanNote {
  id: string
  concept_name: string
  score: number
  summary: string
  created_at: string
}

interface FavoriteNews {
  id: string
  title: string
  source: string
  key_takeaway: string
  favorited_at: string
}

function ProfileContent() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'progress' | 'notes' | 'favorites'>('progress')
  const [stats, setStats] = useState<UserStats | null>(null)
  const [topics, setTopics] = useState<LearningTopic[]>([])
  const [notes, setNotes] = useState<FeynmanNote[]>([])
  const [favorites, setFavorites] = useState<FavoriteNews[]>([])
  const [achievements, setAchievements] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [profession, setProfession] = useState<string>('未设置')
  const [interests, setInterests] = useState<string[]>([])

  useEffect(() => {
    // 从数据库加载真实数据
    const loadData = async () => {
      setIsLoading(true)
      
      if (!user) {
        setIsLoading(false)
        return
      }
      
      try {
        // 获取用户资料
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('profession, interests')
          .eq('id', user.id)
          .single()
        
        if (profileError) {
          console.error('Error fetching profile:', profileError)
        } else if (profileData) {
          setProfession(profileData.profession || '未设置')
          setInterests(profileData.interests || [])
        }
        
        // 获取学习统计
        const { data: statsData, error: statsError } = await supabase
          .from('learning_stats')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (statsError && statsError.code !== 'PGRST116') {
          console.error('Error fetching stats:', statsError)
        }
        
        // 获取学习进度
        const { data: progressData, error: progressError } = await supabase
          .from('learning_progress')
          .select('*')
          .eq('user_id', user.id)
        
        if (progressError) {
          console.error('Error fetching progress:', progressError)
        }
        
        // 获取费曼笔记
        const { data: feynmanData, error: feynmanError } = await supabase
          .from('feynman_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_completed', true)
        
        if (feynmanError) {
          console.error('Error fetching feynman sessions:', feynmanError)
        }
        
        // 计算统计数据
        const topicsMap = new Map()
        progressData?.forEach((item: any) => {
          if (!topicsMap.has(item.topic)) {
            topicsMap.set(item.topic, { mastered: 0, total: 0 })
          }
          const topic = topicsMap.get(item.topic)
          topic.total++
          if (item.status === 'mastered') {
            topic.mastered++
          }
        })
        
        const learningTopics = topicsMap.size
        const masteredConcepts = progressData?.filter((p: any) => p.status === 'mastered').length || 0
        const feynmanSessions = feynmanData?.length || 0
        
        setStats({
          learning_topics: learningTopics,
          mastered_concepts: masteredConcepts,
          feynman_sessions: feynmanSessions,
          streak_days: statsData?.streak_days || 0
        })
        
        // 格式化主题数据
        const formattedTopics: LearningTopic[] = []
        topicsMap.forEach((value, key) => {
          const topicProgress = progressData?.filter((p: any) => p.topic === key)
          const lastStudied = topicProgress?.sort((a: any, b: any) => 
            new Date(b.last_studied_at || 0).getTime() - new Date(a.last_studied_at || 0).getTime()
          )[0]?.last_studied_at
          
          formattedTopics.push({
            id: key,
            name: key,
            progress: Math.round((value.mastered / value.total) * 100),
            mastered: value.mastered,
            total: value.total,
            last_studied: lastStudied || new Date().toISOString()
          })
        })
        
        setTopics(formattedTopics)
        
        // 格式化费曼笔记
        const formattedNotes: FeynmanNote[] = feynmanData?.map((session: any) => ({
          id: session.id,
          concept_name: session.concept_name,
          score: session.final_score / 20, // 转换为5分制
          summary: session.conversation?.slice(-1)[0]?.content?.substring(0, 50) + '...' || '无摘要',
          created_at: session.created_at
        })) || []
        
        setNotes(formattedNotes)
        
        // 设置成就（根据实际数据计算）
        const earnedAchievements: string[] = []
        if (feynmanSessions >= 1) earnedAchievements.push('first_step')
        if (feynmanSessions >= 5) earnedAchievements.push('feynman_master')
        if (masteredConcepts >= 10) earnedAchievements.push('knowledge_collector')
        if (statsData?.streak_days >= 7) earnedAchievements.push('consistent_learner')
        
        setAchievements(earnedAchievements)
        
        // 收藏资讯（暂时为空，需要单独实现收藏功能）
        setFavorites([])
        
      } catch (err) {
        console.error('Error loading profile data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user])

  const renderStars = (score: number) => {
    const fullStars = Math.floor(score)
    const hasHalfStar = score % 1 >= 0.5
    
    return (
      <div className="flex items-center space-x-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < fullStars
                ? 'text-yellow-400 fill-yellow-400'
                : i === fullStars && hasHalfStar
                ? 'text-yellow-400 fill-yellow-400/50'
                : 'text-gray-600'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-400">{score}分</span>
      </div>
    )
  }

  const filteredNotes = notes.filter(note => 
    note.concept_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.summary.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredFavorites = favorites.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#e8a87c]" />
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#e8a87c] to-[#85dcb8] flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">个人中心</h1>
            <p className="text-gray-400">{user?.email}</p>
          </div>
        </div>

        {/* User Info Card */}
        <div className="glass-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-sm text-gray-400 flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4" />
                职业背景
              </span>
              <p className="text-white font-medium">{profession}</p>
            </div>
            <div>
              <span className="text-sm text-gray-400 flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4" />
                兴趣标签
              </span>
              <div className="flex flex-wrap gap-2">
                {interests.length > 0 ? (
                  interests.map((interest: string) => (
                    <span
                      key={interest}
                      className="px-3 py-1 rounded-full text-sm bg-white/10 text-white"
                    >
                      {interest}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">暂无兴趣标签</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-[#e8a87c]/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-[#e8a87c]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.learning_topics || 0}</p>
                  <p className="text-sm text-gray-400">学习主题</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-[#85dcb8]/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#85dcb8]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.mastered_concepts || 0}</p>
                  <p className="text-sm text-gray-400">已掌握概念</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-[#c38d9e]/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-[#c38d9e]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.feynman_sessions || 0}</p>
                  <p className="text-sm text-gray-400">费曼演练</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.streak_days || 0}</p>
                  <p className="text-sm text-gray-400">连续学习(天)</p>
                </div>
              </div>
            </motion.div>
          </div>

        {/* Achievements */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Award className="w-5 h-5 text-[#e8a87c]" />
            <span>获得成就</span>
          </h2>
          {achievements.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">还没有获得成就</p>
              <p className="text-sm text-gray-500">开始学习并完成费曼演练来解锁成就</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {achievements.map((achievementId) => {
                const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)
                if (!achievement) return null
                
                return (
                  <div
                    key={achievement.id}
                    className="p-4 rounded-xl bg-gradient-to-br from-[#e8a87c]/10 to-[#85dcb8]/10 border border-[#e8a87c]/20"
                  >
                    <span className="text-2xl mb-2 block">{achievement.icon}</span>
                    <p className="text-sm font-medium text-white">{achievement.name}</p>
                    <p className="text-xs text-gray-400">{achievement.description}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-1 mb-6 border-b border-white/10">
          {[
            { id: 'progress', label: '学习进度', icon: BookOpen },
            { id: 'notes', label: '费曼笔记', icon: FileText },
            { id: 'favorites', label: '收藏资讯', icon: Bookmark }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-[#e8a87c] text-[#e8a87c]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'progress' && (
            <div className="space-y-4">
              {topics.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">还没有学习记录</p>
                  <p className="text-sm text-gray-500">快去知识图开始学习吧！</p>
                </div>
              ) : (
                topics.map((topic) => (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <BookOpen className="w-5 h-5 text-[#e8a87c]" />
                        <h3 className="font-medium text-white">{topic.name}</h3>
                      </div>
                      <span className={`text-sm ${
                        topic.progress === 100 ? 'text-emerald-400' : 'text-[#e8a87c]'
                      }`}>
                        {topic.progress}%
                      </span>
                    </div>
                    
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full transition-all ${
                          topic.progress === 100
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                            : 'bg-gradient-to-r from-[#e8a87c] to-[#c38d9e]'
                        }`}
                        style={{ width: `${topic.progress}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>已掌握 {topic.mastered}/{topic.total} 个概念</span>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>最近学习: {formatDate(topic.last_studied)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索笔记..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e8a87c]/50"
                />
              </div>
              
              {filteredNotes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">还没有费曼笔记</p>
                  <p className="text-sm text-gray-500">完成费曼演练后会自动生成笔记</p>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-white mb-1">{note.concept_name}</h3>
                        {renderStars(note.score)}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(note.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{note.summary}</p>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索收藏..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e8a87c]/50"
                />
              </div>
              
              {filteredFavorites.length === 0 ? (
                <div className="text-center py-12">
                  <Bookmark className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">还没有收藏资讯</p>
                  <p className="text-sm text-gray-500">在资讯流中收藏感兴趣的内容</p>
                </div>
              ) : (
                filteredFavorites.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-white mb-1">{item.title}</h3>
                        <p className="text-sm text-[#e8a87c] mb-2">{item.source}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <span className="px-2 py-0.5 rounded bg-white/5">要点</span>
                          <span>{item.key_takeaway}</span>
                        </div>
                      </div>
                      <button className="p-2 text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  )
}
