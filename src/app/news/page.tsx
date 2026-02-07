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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#e8a87c] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">正在加载资讯...</p>
        </div>
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
