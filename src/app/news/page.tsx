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
  BookOpen
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

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
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'favorite'>('all')

  useEffect(() => {
    // Simulate API call
    const loadNews = async () => {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockNews: NewsItem[] = [
        {
          id: '1',
          title: 'Python 3.12 新特性：性能提升 15%',
          summary: 'Python 3.12 正式发布，引入了新的编译器优化、改进的错误消息、f-string 性能大幅提升等新特性。',
          reason: '作为 Python 学习者，了解版本更新有助于选择合适的学习路径和工具链',
          key_takeaway: 'f-string 性能大幅提升，建议升级体验',
          source: 'Python官方博客',
          published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          topic: 'Python',
          is_favorite: false,
          is_read: false
        },
        {
          id: '2',
          title: '为什么 Python 是数据科学的首选语言？',
          summary: '从生态、语法、社区三个维度分析 Python 在数据科学领域的统治地位，以及未来发展趋势。',
          reason: '帮助你理解所学知识的应用场景和价值',
          key_takeaway: 'Pandas + NumPy 生态是核心竞争力',
          source: 'DataScienceWeekly',
          published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          topic: 'Python',
          is_favorite: true,
          is_read: true
        },
        {
          id: '3',
          title: '费曼学习法：如何真正掌握一门技术？',
          summary: '深入解析费曼学习法的四个步骤，以及如何在编程学习中应用这一方法。',
          reason: '与知识领航员的核心理念相契合，帮助提升学习效率',
          key_takeaway: '用简单语言解释复杂概念是检验理解的最好方式',
          source: '知识领航员精选',
          published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          topic: '学习方法',
          is_favorite: true,
          is_read: true
        },
        {
          id: '4',
          title: '2024年前端开发趋势报告',
          summary: 'React、Vue、Angular 三大框架的最新动态，以及新兴技术如 WebAssembly、Edge Computing 的发展前景。',
          reason: '了解行业趋势，规划学习方向',
          key_takeaway: 'Server Components 将成为 React 的主流模式',
          source: 'FrontendFocus',
          published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          topic: '前端开发',
          is_favorite: false,
          is_read: false
        }
      ]

      setNews(mockNews)
      setIsLoading(false)
    }

    loadNews()
  }, [])

  const toggleFavorite = (id: string) => {
    setNews(prev => prev.map(item => 
      item.id === id ? { ...item, is_favorite: !item.is_favorite } : item
    ))
  }

  const markAsRead = (id: string) => {
    setNews(prev => prev.map(item => 
      item.id === id ? { ...item, is_read: true } : item
    ))
  }

  const filteredNews = news.filter(item => {
    if (filter === 'unread') return !item.is_read
    if (filter === 'favorite') return item.is_favorite
    return true
  })

  const unreadCount = news.filter(item => !item.is_read).length
  const allRead = unreadCount === 0

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">
            📰 价值资讯流
          </h1>
          <p className="text-gray-400">
            每日精选 3-5 条，早 8:00 更新
          </p>
        </div>

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
                    onClick={() => toggleFavorite(item.id)}
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
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  
                  <button
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    title="查看原文"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredNews.length === 0 && (
          <div className="text-center py-12">
            <Newspaper className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {filter === 'favorite' ? '暂无收藏的资讯' : '暂无相关资讯'}
            </p>
          </div>
        )}

        {/* All Read Message */}
        {allRead && filter === 'all' && news.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <p className="text-[#85dcb8]">
              🎉 今日已读完，明天早 8:00 更新新内容
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
