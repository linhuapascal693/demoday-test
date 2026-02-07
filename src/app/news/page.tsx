'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Newspaper, 
  Star, 
  Share2, 
  CheckCircle,
  ExternalLink,
  Clock,
  BookOpen,
  Loader2,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface NewsItem {
  id: string
  title: string
  summary: string
  reason: string
  key_takeaway: string
  source: string
  published_at: string
  topic: string
  is_favorite: boolean
  is_read: boolean
}

export default function NewsPage() {
  const { user, session } = useAuth()
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'favorite'>('all')
  const [error, setError] = useState('')
  const [profession, setProfession] = useState('初学者')
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)

  // 获取用户职业背景
  useEffect(() => {
    const fetchUserProfession = async () => {
      if (!user) return
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('profession')
          .eq('id', user.id)
          .single()
        
        if (profile?.profession) {
          setProfession(profile.profession)
        }
      } catch (err) {
        console.error('Error fetching profession:', err)
      }
    }
    
    fetchUserProfession()
  }, [user])

  // 加载资讯
  const loadNews = async () => {
    if (!user || !session) {
      setIsLoading(false)
      setError('请先登录后查看资讯')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/news', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('获取资讯失败')
      }

      const result = await response.json()
      
      if (result.success) {
        setNews(result.data)
        setLastGenerated(result.generated_at)
        if (result.profession) {
          setProfession(result.profession)
        }
      } else {
        throw new Error(result.error || '获取资讯失败')
      }
    } catch (err: any) {
      console.error('Error loading news:', err)
      setError(err.message || '获取资讯失败')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNews()
  }, [user, session])

  // 手动生成新资讯
  const handleGenerateNews = async () => {
    if (!user || !session) {
      alert('请先登录')
      return
    }

    setIsGenerating(true)
    
    try {
      // 删除今天的旧资讯，强制重新生成
      const today = new Date().toISOString().split('T')[0]
      await supabase
        .from('news')
        .delete()
        .eq('user_id', user.id)
        .gte('created_at', today)
      
      // 重新加载
      await loadNews()
    } catch (err) {
      console.error('Error generating news:', err)
      alert('生成资讯失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleFavorite = async (id: string, currentValue: boolean) => {
    if (!session) return

    // 乐观更新
    setNews(prev => prev.map(item => 
      item.id === id ? { ...item, is_favorite: !currentValue } : item
    ))

    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          newsId: id,
          action: 'toggle_favorite',
          value: !currentValue
        })
      })

      if (!response.ok) {
        // 回滚
        setNews(prev => prev.map(item => 
          item.id === id ? { ...item, is_favorite: currentValue } : item
        ))
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
      // 回滚
      setNews(prev => prev.map(item => 
        item.id === id ? { ...item, is_favorite: currentValue } : item
      ))
    }
  }

  const markAsRead = async (id: string) => {
    if (!session) return

    // 乐观更新
    setNews(prev => prev.map(item => 
      item.id === id ? { ...item, is_read: true } : item
    ))

    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          newsId: id,
          action: 'mark_read',
          value: true
        })
      })

      if (!response.ok) {
        // 回滚
        setNews(prev => prev.map(item => 
          item.id === id ? { ...item, is_read: false } : item
        ))
      }
    } catch (err) {
      console.error('Error marking as read:', err)
      // 回滚
      setNews(prev => prev.map(item => 
        item.id === id ? { ...item, is_read: false } : item
      ))
    }
  }

  const filteredNews = news.filter(item => {
    if (filter === 'unread') return !item.is_read
    if (filter === 'favorite') return item.is_favorite
    return true
  })

  const unreadCount = news.filter(item => !item.is_read).length

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a]">
        {/* 动态背景 */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 20 + Math.random() * 60,
                height: 20 + Math.random() * 60,
                background: `radial-gradient(circle at 30% 30%, ${['#e8a87c', '#85dcb8', '#c38d9e', '#41b3a3', '#e27d60'][i % 5]}30, transparent)`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() * 20 - 10, 0],
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          {/* 超大加载动画 */}
          <div className="relative w-64 h-64 mx-auto mb-10">
            {/* 外圈旋转 */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0"
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-3xl"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `rotate(${i * 45}deg) translateY(-130px) translateX(-50%)`
                  }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
                >
                  {['📰', '✨', '💡', '🚀', '⭐', '📡', '🌐', '🔔'][i]}
                </motion.div>
              ))}
            </motion.div>

            {/* 主圆形背景 */}
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-4 rounded-full bg-gradient-to-br from-[#e8a87c]/30 via-[#85dcb8]/20 to-[#c38d9e]/30 border-4 border-[#e8a87c]/50"
              style={{
                boxShadow: '0 0 80px rgba(232, 168, 124, 0.4), inset 0 0 40px rgba(255, 255, 255, 0.1)'
              }}
            />

            {/* 中心图标 */}
            <motion.div
              animate={{
                y: [0, -15, 0],
                rotate: [-5, 5, -5]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-8xl"
              >
                📰
              </motion.div>
            </motion.div>

            {/* 旋转的小图标 */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0"
            >
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-3xl">✨</div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-3xl">💫</div>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-2xl">⭐</div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-2xl">🌟</div>
            </motion.div>

            {/* 飘浮的资讯符号 */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                style={{
                  left: `${20 + i * 15}%`,
                  top: '50%'
                }}
                animate={{
                  y: [0, -40, 0],
                  x: [0, Math.sin(i) * 20, 0],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: 'easeOut'
                }}
              >
                {['📱', '💻', '📊', '📈', '🔍'][i]}
              </motion.div>
            ))}
          </div>

          {/* 主标题 */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-black text-white mb-4"
          >
            <span className="bg-gradient-to-r from-[#e8a87c] via-[#85dcb8] to-[#c38d9e] bg-clip-text text-transparent">
              正在加载资讯
            </span>
            <motion.span
              animate={{ rotate: [0, 20, -20, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: 1 }}
              className="inline-block ml-3"
            >
              ✨
            </motion.span>
          </motion.h2>

          {/* 副标题 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-white/70 mb-8"
          >
            AI 正在为你搜集最新的 AI 资讯...
          </motion.p>

          {/* 随机激励话语 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="inline-block"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#e8a87c]/30 via-[#85dcb8]/30 to-[#c38d9e]/30 border-2 border-[#e8a87c]/50 backdrop-blur-sm"
              style={{
                boxShadow: '0 8px 32px rgba(232, 168, 124, 0.3)'
              }}
            >
              <span className="text-lg font-bold text-[#e8a87c]">
                {(() => {
                  const messages = [
                    '📡 资讯雷达已开启，正在扫描全球...',
                    '🚀 最新 AI 动态正在光速飞来...',
                    '🔍 正在挖掘最有价值的行业洞察...',
                    '✨ 精彩内容即将呈现，请稍候...',
                    '📰 头条新闻正在排队加载中...',
                    '💡 智慧火花正在汇聚成资讯...',
                    '🌐 全球 AI 资讯正在同步更新...',
                    '⭐ 精选内容正在为你筛选中...',
                    '📊 数据分析中，马上呈现...',
                    '🎯 精准匹配你的职业兴趣...'
                  ]
                  return messages[Math.floor(Math.random() * messages.length)]
                })()}
              </span>
            </motion.div>
          </motion.div>

          {/* 加载进度 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex justify-center gap-3 mt-10"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full bg-[#e8a87c]"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                📰 价值资讯流
              </h1>
              <p className="text-gray-400">
                每日精选 3-5 条，针对{profession}职业背景定制
              </p>
            </div>
            <button
              onClick={handleGenerateNews}
              disabled={isGenerating}
              className="btn-secondary flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>生成新资讯</span>
                </>
              )}
            </button>
          </div>
          {lastGenerated && (
            <p className="text-xs text-gray-500 mt-2">
              上次更新: {formatDate(lastGenerated)}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="glass-card p-4 mb-6 border-red-500/30">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          {(['all', 'unread', 'favorite'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-[#e8a87c] to-[#c38d9e] text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {f === 'all' && '全部'}
              {f === 'unread' && `未读 (${unreadCount})`}
              {f === 'favorite' && '收藏'}
            </button>
          ))}
        </div>

        {/* News List */}
        <div className="space-y-4">
          {filteredNews.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card p-6 ${item.is_read ? 'opacity-70' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-white flex-1 mr-4">
                  {item.is_read && <span className="text-gray-500 mr-2">[已读]</span>}
                  {item.title}
                </h3>
                <span className="text-xs text-[#85dcb8] px-2 py-1 rounded-full bg-[#85dcb8]/10 whitespace-nowrap">
                  {item.topic}
                </span>
              </div>

              <p className="text-gray-300 mb-4">{item.summary}</p>

              <div className="space-y-3 mb-4">
                <div className="flex items-start space-x-2">
                  <span className="text-[#e8a87c] text-sm font-medium whitespace-nowrap">推荐理由:</span>
                  <span className="text-gray-400 text-sm">{item.reason}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-[#85dcb8] text-sm font-medium whitespace-nowrap">Key Takeaway:</span>
                  <span className="text-gray-400 text-sm">{item.key_takeaway}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{item.source}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(item.published_at)}</span>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => markAsRead(item.id)}
                    disabled={item.is_read}
                    className={`p-2 rounded-lg transition-all ${
                      item.is_read
                        ? 'text-green-400 cursor-default'
                        : 'text-gray-400 hover:text-green-400 hover:bg-white/5'
                    }`}
                    title={item.is_read ? '已读' : '标记为已读'}
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => toggleFavorite(item.id, item.is_favorite)}
                    className={`p-2 rounded-lg transition-all ${
                      item.is_favorite
                        ? 'text-yellow-400'
                        : 'text-gray-400 hover:text-yellow-400 hover:bg-white/5'
                    }`}
                    title={item.is_favorite ? '取消收藏' : '收藏'}
                  >
                    <Star className={`w-5 h-5 ${item.is_favorite ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-white/5 transition-all"
                    title="分享"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: item.title,
                          text: item.summary,
                        })
                      } else {
                        navigator.clipboard.writeText(`${item.title}\n${item.summary}`)
                        alert('已复制到剪贴板')
                      }
                    }}
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  
                  <button
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    title="查看原文"
                    onClick={() => {
                      // 模拟跳转，实际应该打开外部链接
                      alert(`查看原文: ${item.source}`)
                    }}
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredNews.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Newspaper className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            {!user ? (
              <>
                <p className="text-gray-400 mb-4">请先登录后查看个性化资讯</p>
                <button
                  onClick={() => window.location.href = '/login'}
                  className="btn-primary"
                >
                  去登录
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-400">
                  {filter === 'favorite' ? '暂无收藏的资讯' : '暂无相关资讯'}
                </p>
                {filter === 'all' && (
                  <button
                    onClick={handleGenerateNews}
                    className="btn-primary mt-4"
                  >
                    生成今日资讯
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
