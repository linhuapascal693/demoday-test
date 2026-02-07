'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, Loader2, Sparkles, RefreshCw } from 'lucide-react'

interface FiveWOneHData {
  what: string
  why: string
  how: string
  when: string
  where: string
  who: string
}

interface FiveWOneHCardProps {
  data: FiveWOneHData
  conceptName: string
}

type CardType = 'what' | 'why' | 'how' | 'when' | 'where' | 'who' | null

interface CardDetail {
  content: string
  isLoading: boolean
  error: string
}

const cardConfig = {
  what: {
    title: 'What',
    subtitle: '是什么',
    color: '#e8a87c',
    icon: '📦',
    gradient: 'from-[#e8a87c]/20 to-[#e8a87c]/5'
  },
  why: {
    title: 'Why',
    subtitle: '为什么',
    color: '#85dcb8',
    icon: '💡',
    gradient: 'from-[#85dcb8]/20 to-[#85dcb8]/5'
  },
  how: {
    title: 'How',
    subtitle: '怎么用',
    color: '#c38d9e',
    icon: '🛠️',
    gradient: 'from-[#c38d9e]/20 to-[#c38d9e]/5'
  },
  when: {
    title: 'When',
    subtitle: '何时用',
    color: '#41b3a3',
    icon: '⏰',
    gradient: 'from-[#41b3a3]/20 to-[#41b3a3]/5'
  },
  where: {
    title: 'Where',
    subtitle: '在哪用',
    color: '#e27d60',
    icon: '📍',
    gradient: 'from-[#e27d60]/20 to-[#e27d60]/5'
  },
  who: {
    title: 'Who',
    subtitle: '谁在主导',
    color: '#9b59b6',
    icon: '👥',
    gradient: 'from-[#9b59b6]/20 to-[#9b59b6]/5'
  }
}

export default function FiveWOneHCard({ data, conceptName }: FiveWOneHCardProps) {
  const [flippedCard, setFlippedCard] = useState<CardType>(null)
  const [cardDetails, setCardDetails] = useState<{
    [key: string]: CardDetail
  }>({})

  const generateDetail = useCallback(async (type: CardType) => {
    if (!type) return

    // 如果已经有内容，直接显示
    if (cardDetails[type]?.content && !cardDetails[type]?.error) {
      setFlippedCard(type)
      return
    }

    // 设置加载状态
    setCardDetails(prev => ({
      ...prev,
      [type]: { ...prev[type], isLoading: true, error: '' }
    }))
    setFlippedCard(type)

    try {
      const response = await fetch('/api/5w1h', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: conceptName,
          type: type,
          basicContent: data[type]
        })
      })

      if (!response.ok) {
        throw new Error('生成分析失败')
      }

      const result = await response.json()

      if (result.success) {
        setCardDetails(prev => ({
          ...prev,
          [type]: { content: result.content, isLoading: false, error: '' }
        }))
      } else {
        throw new Error(result.error || '生成失败')
      }
    } catch (err: any) {
      console.error('Error generating detail:', err)
      setCardDetails(prev => ({
        ...prev,
        [type]: { content: '', isLoading: false, error: err.message || '生成失败，请重试' }
      }))
    }
  }, [conceptName, data, cardDetails])

  const handleCardClick = (type: CardType) => {
    generateDetail(type)
  }

  const handleClose = () => {
    setFlippedCard(null)
  }

  const handleRetry = (type: CardType) => {
    // 清除之前的内容，重新生成
    setCardDetails(prev => ({
      ...prev,
      [type]: { content: '', isLoading: false, error: '' }
    }))
    generateDetail(type)
  }

  const renderMarkdown = (text: string) => {
    if (!text) return null

    const lines = text.split('\n')
    const elements: JSX.Element[] = []
    let currentList: JSX.Element[] = []
    let inList = false

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()

      // 处理标题
      if (trimmedLine.startsWith('### ')) {
        if (inList && currentList.length > 0) {
          elements.push(<ul key={`list-${index}`} className="space-y-2 mb-4 ml-4">{currentList}</ul>)
          currentList = []
          inList = false
        }
        elements.push(
          <h4 key={index} className="text-lg font-bold text-[#e8a87c] mt-6 mb-3">
            {trimmedLine.replace('### ', '')}
          </h4>
        )
        return
      }

      // 处理二级标题
      if (trimmedLine.startsWith('## ')) {
        if (inList && currentList.length > 0) {
          elements.push(<ul key={`list-${index}`} className="space-y-2 mb-4 ml-4">{currentList}</ul>)
          currentList = []
          inList = false
        }
        elements.push(
          <h3 key={index} className="text-xl font-bold text-white mt-8 mb-4">
            {trimmedLine.replace('## ', '')}
          </h3>
        )
        return
      }

      // 处理加粗文本（行首）
      if (trimmedLine.startsWith('**') && trimmedLine.includes('**：')) {
        if (inList && currentList.length > 0) {
          elements.push(<ul key={`list-${index}`} className="space-y-2 mb-4 ml-4">{currentList}</ul>)
          currentList = []
          inList = false
        }
        const parts = trimmedLine.split('**：')
        elements.push(
          <p key={index} className="text-[#85dcb8] font-semibold mb-2 mt-4">
            {parts[0].replace('**', '')}
            {parts[1] && <span className="text-gray-300 font-normal">：{parts[1]}</span>}
          </p>
        )
        return
      }

      // 处理列表项
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        inList = true
        const content = trimmedLine.substring(2)
        currentList.push(
          <li key={index} className="text-gray-300 text-sm flex items-start">
            <span className="text-[#e8a87c] mr-2 mt-1">•</span>
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }} />
          </li>
        )
        return
      }

      // 处理编号列表
      if (/^\d+\./.test(trimmedLine)) {
        inList = true
        const content = trimmedLine.replace(/^\d+\.\s*/, '')
        currentList.push(
          <li key={index} className="text-gray-300 text-sm flex items-start">
            <span className="text-[#85dcb8] mr-2 font-medium">{trimmedLine.match(/^\d+/)?.[0]}.</span>
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }} />
          </li>
        )
        return
      }

      // 普通段落
      if (trimmedLine) {
        if (inList && currentList.length > 0) {
          elements.push(<ul key={`list-${index}`} className="space-y-2 mb-4 ml-4">{currentList}</ul>)
          currentList = []
          inList = false
        }
        elements.push(
          <p key={index} className="text-gray-300 text-sm mb-3 leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmedLine) }} />
          </p>
        )
      }
    })

    // 处理未闭合的列表
    if (inList && currentList.length > 0) {
      elements.push(<ul key="final-list" className="space-y-2 mb-4 ml-4">{currentList}</ul>)
    }

    return elements
  }

  const formatInlineMarkdown = (text: string): string => {
    // 处理加粗
    let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#e8a87c]">$1</strong>')
    // 处理斜体
    formatted = formatted.replace(/\*(.+?)\*/g, '<em class="text-gray-400">$1</em>')
    return formatted
  }

  return (
    <div className="relative">
      {/* 卡片网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {(Object.keys(cardConfig) as Array<keyof typeof cardConfig>).map((type) => {
          const config = cardConfig[type]
          const content = data[type]
          const hasDetail = cardDetails[type]?.content

          return (
            <motion.div
              key={type}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCardClick(type)}
              className={`relative h-40 cursor-pointer rounded-xl bg-gradient-to-br ${config.gradient}
                border border-white/10 hover:border-white/20 transition-all duration-300
                overflow-hidden group`}
            >
              {/* 背景装饰 */}
              <div
                className="absolute top-0 right-0 w-20 h-20 opacity-10 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150"
                style={{ backgroundColor: config.color }}
              />

              {/* AI 生成指示器 */}
              {hasDetail && (
                <div className="absolute top-2 right-2">
                  <Sparkles className="w-4 h-4 text-[#e8a87c]" />
                </div>
              )}

              {/* 卡片内容 */}
              <div className="relative h-full p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{config.icon}</span>
                    <span
                      className="text-lg font-bold"
                      style={{ color: config.color }}
                    >
                      {config.title}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{config.subtitle}</span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-gray-400 text-sm line-clamp-2 flex-1 mr-2">
                    {content}
                  </p>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                </div>

                {/* 点击提示 */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-gray-500 flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI 深度分析
                  </span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* 翻卡详情弹窗 */}
      <AnimatePresence>
        {flippedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateY: -90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotateY: 90 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 卡片容器 */}
              <div
                className="rounded-2xl border border-white/20 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${cardConfig[flippedCard].color}15 0%, #1a1a2e 100%)`
                }}
              >
                {/* 头部 */}
                <div
                  className="p-6 border-b border-white/10"
                  style={{ backgroundColor: `${cardConfig[flippedCard].color}20` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{cardConfig[flippedCard].icon}</span>
                      <div>
                        <h3
                          className="text-2xl font-bold"
                          style={{ color: cardConfig[flippedCard].color }}
                        >
                          {cardConfig[flippedCard].title}
                        </h3>
                        <span className="text-gray-400 text-sm">
                          {cardConfig[flippedCard].subtitle}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* 重试按钮 */}
                      {cardDetails[flippedCard]?.error && (
                        <button
                          onClick={() => handleRetry(flippedCard)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="重新生成"
                        >
                          <RefreshCw className="w-5 h-5 text-gray-400" />
                        </button>
                      )}
                      <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 内容区域 */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  {cardDetails[flippedCard]?.isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-[#e8a87c] animate-spin mb-4" />
                      <p className="text-gray-400">AI 正在深度分析...</p>
                      <p className="text-gray-500 text-sm mt-2">请稍候，正在生成专业解读</p>
                    </div>
                  ) : cardDetails[flippedCard]?.error ? (
                    <div className="text-center py-12">
                      <p className="text-red-400 mb-4">{cardDetails[flippedCard].error}</p>
                      <button
                        onClick={() => handleRetry(flippedCard)}
                        className="px-4 py-2 bg-[#e8a87c]/20 text-[#e8a87c] rounded-lg hover:bg-[#e8a87c]/30 transition-colors flex items-center space-x-2 mx-auto"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>重新生成</span>
                      </button>
                    </div>
                  ) : cardDetails[flippedCard]?.content ? (
                    <div className="prose prose-invert max-w-none">
                      {renderMarkdown(cardDetails[flippedCard].content)}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-[#e8a87c] animate-spin mb-4" />
                      <p className="text-gray-400">准备生成分析...</p>
                    </div>
                  )}
                </div>

                {/* 底部 */}
                <div className="p-4 border-t border-white/10 bg-white/5 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {conceptName} - {cardConfig[flippedCard].subtitle}
                  </span>
                  <div className="flex items-center space-x-2">
                    {cardDetails[flippedCard]?.content && !cardDetails[flippedCard]?.isLoading && (
                      <button
                        onClick={() => handleRetry(flippedCard)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
                        style={{
                          backgroundColor: `${cardConfig[flippedCard].color}20`,
                          color: cardConfig[flippedCard].color
                        }}
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>重新生成</span>
                      </button>
                    )}
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: `${cardConfig[flippedCard].color}20`,
                        color: cardConfig[flippedCard].color
                      }}
                    >
                      关闭
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
