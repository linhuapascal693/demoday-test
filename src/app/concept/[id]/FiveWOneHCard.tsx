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
    gradient: 'from-[#e8a87c]/20 to-[#e8a87c]/5',
    loadingIcon: '🤔',
    loadingText: '让我想想这是什么...',
    loadingSubtext: '正在拆解概念的本质'
  },
  why: {
    title: 'Why',
    subtitle: '为什么',
    color: '#85dcb8',
    icon: '💡',
    gradient: 'from-[#85dcb8]/20 to-[#85dcb8]/5',
    loadingIcon: '🤯',
    loadingText: '为什么要学这个呢...',
    loadingSubtext: '正在探索背后的意义'
  },
  how: {
    title: 'How',
    subtitle: '怎么用',
    color: '#c38d9e',
    icon: '🛠️',
    gradient: 'from-[#c38d9e]/20 to-[#c38d9e]/5',
    loadingIcon: '🤹',
    loadingText: '这个要怎么操作呢...',
    loadingSubtext: '正在整理使用方法'
  },
  when: {
    title: 'When',
    subtitle: '何时用',
    color: '#41b3a3',
    icon: '⏰',
    gradient: 'from-[#41b3a3]/20 to-[#41b3a3]/5',
    loadingIcon: '⏳',
    loadingText: '什么时候用最好呢...',
    loadingSubtext: '正在分析最佳时机'
  },
  where: {
    title: 'Where',
    subtitle: '在哪用',
    color: '#e27d60',
    icon: '📍',
    gradient: 'from-[#e27d60]/20 to-[#e27d60]/5',
    loadingIcon: '🗺️',
    loadingText: '在哪里能用到呢...',
    loadingSubtext: '正在定位应用场景'
  },
  who: {
    title: 'Who',
    subtitle: '谁在主导',
    color: '#9b59b6',
    icon: '👥',
    gradient: 'from-[#9b59b6]/20 to-[#9b59b6]/5',
    loadingIcon: '🕵️',
    loadingText: '都有谁在研究这个...',
    loadingSubtext: '正在寻找领域专家'
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
      {/* 全屏加载动画 - 点击卡片后显示 */}
      <AnimatePresence>
        {flippedCard && cardDetails[flippedCard]?.isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="text-center"
            >
              {/* 可爱的思考动画 */}
              <motion.div
                animate={{ 
                  y: [0, -20, 0],
                  rotate: [-8, 8, -8, 8, 0]
                }}
                transition={{ 
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="text-8xl mb-8"
              >
                {cardConfig[flippedCard].loadingIcon}
              </motion.div>
              
              {/* 对话气泡 */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative inline-block mb-6"
              >
                <div 
                  className="px-8 py-4 rounded-3xl text-white text-xl font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${cardConfig[flippedCard].color} 0%, ${cardConfig[flippedCard].color}cc 100%)`,
                    boxShadow: `0 10px 40px ${cardConfig[flippedCard].color}50, 0 0 60px ${cardConfig[flippedCard].color}30`
                  }}
                >
                  {cardConfig[flippedCard].loadingText}
                </div>
                {/* 气泡小三角 */}
                <div 
                  className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 rotate-45"
                  style={{ background: cardConfig[flippedCard].color }}
                />
              </motion.div>
              
              {/* 副标题 */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-300 text-lg mb-8"
              >
                {cardConfig[flippedCard].loadingSubtext}
              </motion.p>
              
              {/* 进度条 */}
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.5 }}
                className="w-64 h-2 rounded-full overflow-hidden mx-auto"
                style={{ backgroundColor: `${cardConfig[flippedCard].color}30` }}
              >
                <motion.div
                  animate={{ 
                    x: ['-100%', '100%']
                  }}
                  transition={{ 
                    duration: 1.2,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  className="h-full w-1/3 rounded-full"
                  style={{ 
                    background: `linear-gradient(90deg, transparent, ${cardConfig[flippedCard].color}, transparent)` 
                  }}
                />
              </motion.div>
              
              {/* 知识点提示 */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-gray-500 text-sm mt-6"
              >
                正在分析「{conceptName}」的{cardConfig[flippedCard].title}维度
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 卡片网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {(Object.keys(cardConfig) as Array<keyof typeof cardConfig>).map((type) => {
          const config = cardConfig[type]
          const content = data[type]
          const hasDetail = cardDetails[type]?.content

          return (
            <motion.div
              key={type}
              whileHover={{ 
                scale: 1.05,
                y: -8,
                transition: { type: 'spring', stiffness: 400, damping: 15 }
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCardClick(type)}
              className={`relative h-40 cursor-pointer rounded-xl bg-gradient-to-br ${config.gradient}
                border-2 border-white/10 hover:border-white/40 
                transition-all duration-300 ease-out
                overflow-hidden group
                hover:shadow-2xl`}
              style={{
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              {/* 悬停发光边框效果 */}
              <motion.div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, ${config.color}20 0%, transparent 50%, ${config.color}10 100%)`,
                  boxShadow: `inset 0 0 30px ${config.color}20, 0 0 30px ${config.color}30`
                }}
              />

              {/* 背景装饰 - 悬停时放大并改变透明度 */}
              <motion.div
                className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 transition-all duration-500 group-hover:scale-200 group-hover:opacity-20"
                style={{ 
                  backgroundColor: config.color,
                  opacity: 0.1
                }}
              />

              {/* 底部装饰 - 新增 */}
              <motion.div
                className="absolute bottom-0 left-0 w-16 h-16 rounded-full -ml-8 -mb-8 transition-all duration-500 group-hover:scale-150 group-hover:opacity-15"
                style={{ 
                  backgroundColor: config.color,
                  opacity: 0.05
                }}
              />

              {/* AI 生成指示器 - 悬停时放大 */}
              {hasDetail && (
                <motion.div 
                  className="absolute top-2 right-2 transition-transform duration-300 group-hover:scale-110"
                  whileHover={{ rotate: 180 }}
                >
                  <Sparkles className="w-4 h-4 text-[#e8a87c]" />
                </motion.div>
              )}

              {/* 卡片内容 */}
              <div className="relative h-full p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    {/* 图标悬停动画 */}
                    <motion.span 
                      className="text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
                    >
                      {config.icon}
                    </motion.span>
                    <span
                      className="text-lg font-bold transition-all duration-300 group-hover:text-xl"
                      style={{ 
                        color: config.color,
                        textShadow: '0 0 0 transparent'
                      }}
                    >
                      <span className="group-hover:[text-shadow:0_0_20px_currentColor]">
                        {config.title}
                      </span>
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 transition-colors duration-300 group-hover:text-gray-400">
                    {config.subtitle}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-gray-400 text-sm line-clamp-2 flex-1 mr-2 transition-colors duration-300 group-hover:text-gray-300">
                    {content}
                  </p>
                  {/* 箭头悬停动画 */}
                  <motion.div
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                  </motion.div>
                </div>

                {/* 点击提示 - 增强动画 */}
                <motion.div 
                  className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                >
                  <span 
                    className="text-xs flex items-center px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: `${config.color}20`,
                      color: config.color
                    }}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI 深度分析
                  </span>
                </motion.div>
              </div>

              {/* 悬停时的光扫效果 */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${config.color}10 50%, transparent 100%)`,
                }}
              />
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
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)'
            }}
            onClick={handleClose}
          >
            {/* 背景发光效果 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, ${cardConfig[flippedCard].color}20 0%, transparent 70%)`
              }}
            />
            
            <motion.div
              initial={{ 
                scale: 0.5, 
                opacity: 0, 
                rotateY: -180,
                y: 100
              }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                rotateY: 0,
                y: 0
              }}
              exit={{ 
                scale: 0.5, 
                opacity: 0, 
                rotateY: 180,
                y: 100
              }}
              transition={{ 
                type: 'spring', 
                damping: 20, 
                stiffness: 200,
                mass: 1.2
              }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl"
              style={{
                boxShadow: `0 0 60px ${cardConfig[flippedCard].color}40, 0 25px 50px -12px rgba(0, 0, 0, 0.8)`
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 卡片容器 */}
              <div
                className="rounded-2xl border-2 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${cardConfig[flippedCard].color}20 0%, #1a1a2e 50%, #0f172a 100%)`,
                  borderColor: `${cardConfig[flippedCard].color}50`
                }}
              >
                {/* 顶部发光条 */}
                <div 
                  className="h-1 w-full"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${cardConfig[flippedCard].color}, transparent)`,
                    boxShadow: `0 0 20px ${cardConfig[flippedCard].color}`
                  }}
                />
                {/* 头部 */}
                <div
                  className="p-6 border-b-2"
                  style={{ 
                    background: `linear-gradient(135deg, ${cardConfig[flippedCard].color}30 0%, ${cardConfig[flippedCard].color}10 100%)`,
                    borderColor: `${cardConfig[flippedCard].color}40`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <motion.div 
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                        style={{ 
                          background: `linear-gradient(135deg, ${cardConfig[flippedCard].color}40, ${cardConfig[flippedCard].color}20)`,
                          boxShadow: `0 0 30px ${cardConfig[flippedCard].color}50`
                        }}
                      >
                        {cardConfig[flippedCard].icon}
                      </motion.div>
                      <div>
                        <motion.h3
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-3xl font-bold"
                          style={{ 
                            color: cardConfig[flippedCard].color,
                            textShadow: `0 0 30px ${cardConfig[flippedCard].color}60`
                          }}
                        >
                          {cardConfig[flippedCard].title}
                        </motion.h3>
                        <motion.span 
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="text-gray-300 text-sm font-medium"
                        >
                          {cardConfig[flippedCard].subtitle}
                        </motion.span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* 重试按钮 */}
                      {cardDetails[flippedCard]?.error && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRetry(flippedCard)}
                          className="p-3 rounded-xl transition-colors"
                          style={{ backgroundColor: `${cardConfig[flippedCard].color}20` }}
                          title="重新生成"
                        >
                          <RefreshCw className="w-5 h-5" style={{ color: cardConfig[flippedCard].color }} />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleClose}
                        className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-400" />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* 内容区域 */}
                <div 
                  className="p-8 overflow-y-auto max-h-[65vh] pb-20"
                  style={{
                    background: 'linear-gradient(180deg, rgba(26, 26, 46, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)'
                  }}
                >
                  {cardDetails[flippedCard]?.isLoading ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-12"
                    >
                      {/* 可爱的加载动画 */}
                      <motion.div
                        animate={{ 
                          y: [0, -15, 0],
                          rotate: [-5, 5, -5, 5, 0]
                        }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                        className="text-7xl mb-6"
                      >
                        {cardConfig[flippedCard].loadingIcon}
                      </motion.div>
                      
                      {/* 对话气泡 */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative mb-6"
                      >
                        <div 
                          className="px-6 py-3 rounded-2xl text-white font-medium text-center"
                          style={{
                            background: `linear-gradient(135deg, ${cardConfig[flippedCard].color} 0%, ${cardConfig[flippedCard].color}dd 100%)`,
                            boxShadow: `0 8px 30px ${cardConfig[flippedCard].color}40`
                          }}
                        >
                          {cardConfig[flippedCard].loadingText}
                        </div>
                        {/* 气泡小三角 */}
                        <div 
                          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rotate-45"
                          style={{ background: cardConfig[flippedCard].color }}
                        />
                      </motion.div>
                      
                      {/* 副标题 */}
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-400 text-sm mb-6"
                      >
                        {cardConfig[flippedCard].loadingSubtext}
                      </motion.p>
                      
                      {/* 进度指示器 */}
                      <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="w-48 h-1 rounded-full overflow-hidden"
                        style={{ backgroundColor: `${cardConfig[flippedCard].color}20` }}
                      >
                        <motion.div
                          animate={{ 
                            x: ['-100%', '100%']
                          }}
                          transition={{ 
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'linear'
                          }}
                          className="h-full w-1/2 rounded-full"
                          style={{ backgroundColor: cardConfig[flippedCard].color }}
                        />
                      </motion.div>
                    </motion.div>
                  ) : cardDetails[flippedCard]?.error ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-16"
                    >
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                      >
                        <X className="w-8 h-8 text-red-400" />
                      </div>
                      <p className="text-red-400 mb-6 text-lg">{cardDetails[flippedCard].error}</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRetry(flippedCard)}
                        className="px-6 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2 mx-auto"
                        style={{
                          background: `linear-gradient(135deg, ${cardConfig[flippedCard].color}30, ${cardConfig[flippedCard].color}10)`,
                          color: cardConfig[flippedCard].color,
                          border: `1px solid ${cardConfig[flippedCard].color}50`
                        }}
                      >
                        <RefreshCw className="w-5 h-5" />
                        <span>重新生成</span>
                      </motion.button>
                    </motion.div>
                  ) : cardDetails[flippedCard]?.content ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="prose prose-invert max-w-none"
                    >
                      {renderMarkdown(cardDetails[flippedCard].content)}
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-16"
                    >
                      <Loader2 className="w-8 h-8 text-[#e8a87c] animate-spin mb-4" />
                      <p className="text-gray-400">准备生成分析...</p>
                    </motion.div>
                  )}
                </div>

                {/* 底部 */}
                <div 
                  className="p-5 border-t-2 flex justify-between items-center"
                  style={{
                    background: `linear-gradient(135deg, ${cardConfig[flippedCard].color}10 0%, rgba(15, 23, 42, 0.95) 100%)`,
                    borderColor: `${cardConfig[flippedCard].color}30`
                  }}
                >
                  <span className="text-sm text-gray-400 font-medium">
                    <span style={{ color: cardConfig[flippedCard].color }}>{conceptName}</span>
                    <span className="mx-2">·</span>
                    {cardConfig[flippedCard].subtitle}
                  </span>
                  <div className="flex items-center space-x-3">
                    {cardDetails[flippedCard]?.content && !cardDetails[flippedCard]?.isLoading && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRetry(flippedCard)}
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2"
                        style={{
                          background: `linear-gradient(135deg, ${cardConfig[flippedCard].color}20, ${cardConfig[flippedCard].color}10)`,
                          color: cardConfig[flippedCard].color,
                          border: `1px solid ${cardConfig[flippedCard].color}40`
                        }}
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>重新生成</span>
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleClose}
                      className="px-6 py-2 rounded-xl text-sm font-medium transition-colors"
                      style={{
                        background: `linear-gradient(135deg, ${cardConfig[flippedCard].color}30, ${cardConfig[flippedCard].color}20)`,
                        color: cardConfig[flippedCard].color,
                        boxShadow: `0 4px 15px ${cardConfig[flippedCard.color]}40`
                      }}
                    >
                      关闭
                    </motion.button>
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
