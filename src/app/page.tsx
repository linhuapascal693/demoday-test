'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Sparkles, BookOpen, Brain, Target } from 'lucide-react'
import { motion } from 'framer-motion'

export default function HomePage() {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerateMap = async () => {
    if (!topic.trim()) return
    
    setIsLoading(true)
    // Navigate to knowledge map page with topic
    router.push(`/knowledge-map?topic=${encodeURIComponent(topic)}`)
  }

  const features = [
    {
      icon: Brain,
      title: 'AI 知识全景图',
      description: '输入任何学习主题，AI 自动生成可视化知识树，建立全局视角'
    },
    {
      icon: BookOpen,
      title: '智能概念解码',
      description: '5W1H 全维定义 + 个性化类比，让复杂概念变得简单易懂'
    },
    {
      icon: Target,
      title: '费曼演练场',
      description: '通过教授 AI 来验证理解，3 轮对话深度检验学习效果'
    }
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-4xl mx-auto mb-16"
      >
        <div className="flex items-center justify-center mb-6">
          <span className="text-6xl mr-4 floating">🪐</span>
          <h1 className="text-4xl md:text-6xl font-bold gradient-text">
            知识领航员
          </h1>
        </div>
        <p className="text-xl md:text-2xl text-gray-300 mb-4">
          建立学习领域的「上帝视角」
        </p>
        <p className="text-gray-400 max-w-3xl mx-auto whitespace-nowrap">
          通过 AI 生成动态知识全景图，让学习不再迷茫。从全局视角出发，循序渐进掌握每一个知识点。
        </p>
      </motion.div>

      {/* Search Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full max-w-2xl mb-16"
      >
        <div className="glass-card p-2 flex items-center">
          <Search className="w-6 h-6 text-gray-400 ml-4" />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateMap()}
            placeholder="输入你想学习的主题，如：Python、机器学习、摄影..."
            className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-white placeholder-gray-500"
          />
          <button
            onClick={handleGenerateMap}
            disabled={isLoading || !topic.trim()}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="loading-spinner w-5 h-5" />
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>生成知识全景图</span>
              </>
            )}
          </button>
        </div>
        <p className="text-center text-sm text-gray-500 mt-3">
          试试输入：Python编程、Web前端开发、数据分析、摄影技巧...
        </p>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
      >
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <div
              key={index}
              className="glass-card p-6 hover:scale-105 transition-transform duration-300 text-center"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#e8a87c]/20 to-[#85dcb8]/20 flex items-center justify-center mb-4 mx-auto">
                <Icon className="w-6 h-6 text-[#e8a87c]" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          )
        })}
      </motion.div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16"
      >
        <div className="text-center">
          <div className="text-3xl font-bold gradient-text">∞</div>
          <div className="text-gray-400 text-sm">学习主题</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold gradient-text">AI</div>
          <div className="text-gray-400 text-sm">智能生成</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold gradient-text">3</div>
          <div className="text-gray-400 text-sm">轮费曼验证</div>
        </div>
      </motion.div>
    </div>
  )
}
