'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Bot, 
  User, 
  ChevronLeft, 
  Star,
  RotateCcw,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  MessageSquare,
  GraduationCap
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  role: 'ai' | 'user'
  content: string
  round?: number
}

interface EvaluationResult {
  final_score: number
  clarity_score: number
  accuracy_score: number
  completeness_score: number
  feedback: string
  strengths: string[]
  weaknesses: string[]
}

export default function FeynmanPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const conceptId = params.id as string
  const isInitial = searchParams.get('initial') === 'true'
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [currentRound, setCurrentRound] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [conceptName, setConceptName] = useState('概念')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [confusedCount, setConfusedCount] = useState(0)
  const [showBackToLearn, setShowBackToLearn] = useState(false)

  // 获取概念名称
  useEffect(() => {
    const fetchConceptName = async () => {
      try {
        // 优先从 URL 参数获取概念名称（从概念页面跳转过来时会携带）
        const nameFromUrl = searchParams.get('name')
        if (nameFromUrl) {
          setConceptName(decodeURIComponent(nameFromUrl))
          return
        }
        
        // 从知识图谱节点中获取概念名称
        // 这里简化处理，实际应该从数据库查询
        const conceptNames: { [key: string]: string } = {
          'variables': '变量与类型',
          'operators': '运算符',
          'control-flow': '流程控制',
          'list-dict': '列表与字典',
          'functions': '函数定义',
          'modules': '模块导入',
          'classes': '类与对象',
          'inheritance': '继承多态',
          'pip': '包管理器',
          'jupyter': 'Jupyter环境',
          'vscode': 'VSCode配置'
        }
        setConceptName(conceptNames[conceptId] || conceptId)
      } catch (error) {
        console.error('Error fetching concept:', error)
      }
    }

    fetchConceptName()
  }, [conceptId, searchParams])

  // Initialize conversation
  useEffect(() => {
    const initConversation = async () => {
      if (!conceptName || conceptName === '概念') return
      
      setIsLoading(true)
      
      try {
        // 创建费曼演练会话
        const { data: session, error: sessionError } = await supabase
          .from('feynman_sessions')
          .insert({
            user_id: user?.id,
            concept_id: conceptId,
            concept_name: conceptName,
            status: 'in_progress'
          })
          .select()
          .single()
        
        if (sessionError) {
          console.error('Error creating session:', sessionError)
        } else {
          setSessionId(session.id)
        }

        // 调用 AI API 生成第一个问题
        const response = await fetch('/api/feynman', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            concept: conceptName,
            round: 1,
            conversation: '',
            isInitial: isInitial // 传递初始问题标记
          })
        })

        if (!response.ok) {
          throw new Error('Failed to get AI response')
        }

        const data = await response.json()
        
        // 如果是初始问题，使用更具体的提问方式
        const initialQuestion = isInitial 
          ? `你好！我是刚学编程的小白。听说今天要学习「${conceptName}」这个概念，但我完全不知道这是什么意思...

老师，你能用简单的话给我讲讲什么是${conceptName}吗？最好举个例子让我理解一下～`
          : (data.question || `你好！我是刚学编程的小白。能给我讲讲什么是${conceptName}吗？我不太理解这个概念...`)
        
        setMessages([
          {
            id: '1',
            role: 'ai',
            content: initialQuestion,
            round: 1
          }
        ])
        setCurrentRound(1)
      } catch (error) {
        console.error('Error initializing conversation:', error)
        // 使用默认问题
        const defaultQuestion = isInitial
          ? `你好！我是刚学编程的小白。听说今天要学习「${conceptName}」这个概念，但我完全不知道这是什么意思...

老师，你能用简单的话给我讲讲什么是${conceptName}吗？最好举个例子让我理解一下～`
          : `你好！我是刚学编程的小白。能给我讲讲什么是${conceptName}吗？我不太理解这个概念...`
        
        setMessages([
          {
            id: '1',
            role: 'ai',
            content: defaultQuestion,
            round: 1
          }
        ])
        setCurrentRound(1)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      initConversation()
    }
  }, [conceptId, conceptName, user])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 检测用户是否表示不理解
  const isConfusedAnswer = (answer: string): boolean => {
    const confusedPatterns = ['不清楚', '不懂', '不明白', '不知道', '不会', '不理解', '没懂', '不懂什么意思']
    return confusedPatterns.some(pattern => answer.includes(pattern)) || answer.length < 5
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userAnswer = input.trim()
    
    // 检测用户是否表示不理解
    const isConfused = isConfusedAnswer(userAnswer)
    if (isConfused) {
      setConfusedCount(prev => prev + 1)
    }
    
    // 如果连续2次表示不理解，显示返回学习按钮
    if (confusedCount + (isConfused ? 1 : 0) >= 2) {
      setShowBackToLearn(true)
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userAnswer,
      round: currentRound
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // 构建对话历史
      const conversationHistory = messages
        .map(m => `${m.role === 'ai' ? 'AI' : '用户'}: ${m.content}`)
        .join('\n')

      if (currentRound >= 3) {
        // 完成演练，进行评估
        const response = await fetch('/api/feynman', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            concept: conceptName,
            round: currentRound,
            conversation: conversationHistory + `\n用户: ${userAnswer}`,
            evaluate: true
          })
        })

        if (response.ok) {
          const data = await response.json()
          setEvaluation(data.evaluation)
          setIsComplete(true)
          
          // 保存评估结果到数据库
          if (sessionId) {
            await supabase
              .from('feynman_sessions')
              .update({
                status: 'completed',
                final_score: data.evaluation?.final_score,
                conversation_data: { messages: [...messages, userMessage] }
              })
              .eq('id', sessionId)
          }
        }
      } else {
        // 继续下一轮对话
        const response = await fetch('/api/feynman', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            concept: conceptName,
            round: currentRound + 1,
            conversation: conversationHistory + `\n用户: ${userAnswer}`,
            userAnswer: userAnswer // 传递用户回答，用于 AI 判断是否困惑
          })
        })

        if (!response.ok) {
          throw new Error('Failed to get AI response')
        }

        const data = await response.json()
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: data.question,
          round: currentRound + 1
        }

        setMessages(prev => [...prev, aiMessage])
        setCurrentRound(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error in conversation:', error)
      // 使用默认回复
      let defaultResponse = ''
      
      if (isConfused) {
        // 如果用户表示不理解，给出简化版问题或提示
        defaultResponse = `没关系，让我换个方式问。${conceptName}其实就像...（给出一个简单的类比）。你能试着用自己的话说说看吗？`
      } else if (currentRound === 1) {
        defaultResponse = `哦，原来是这样！那${conceptName}和其他相关概念有什么区别呢？`
      } else if (currentRound === 2) {
        defaultResponse = `明白了！那你能给我举个例子吗？比如在实际工作中怎么使用${conceptName}？`
      } else {
        defaultResponse = `太感谢了！我现在对${conceptName}有了更清晰的理解。`
        setIsComplete(true)
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: defaultResponse,
        round: currentRound + 1
      }
      setMessages(prev => [...prev, aiMessage])
      setCurrentRound(prev => prev + 1)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestart = () => {
    setMessages([])
    setCurrentRound(0)
    setIsComplete(false)
    setEvaluation(null)
    setSessionId(null)
    // Re-initialize
    window.location.reload()
  }

  const renderStars = (score: number) => {
    const fullStars = Math.floor(score)
    const hasHalfStar = score % 1 >= 0.5
    
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-6 h-6 ${
              i < fullStars
                ? 'text-yellow-400 fill-yellow-400'
                : i === fullStars && hasHalfStar
                ? 'text-yellow-400 fill-yellow-400/50'
                : 'text-gray-600'
            }`}
          />
        ))}
        <span className="ml-2 text-2xl font-bold text-white">{score}/5</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 text-gray-400 hover:text-white mb-2 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>返回概念解码</span>
            </button>
            <h1 className="text-2xl font-bold gradient-text">
              🎓 费曼演练场 - {conceptName}
            </h1>
          </div>
          
          {!isComplete && (
            <div className="glass-card px-4 py-2">
              <span className="text-sm text-gray-400">轮次: </span>
              <span className="text-[#e8a87c] font-bold">{Math.min(currentRound, 3)}/3</span>
            </div>
          )}
        </div>

        {/* 提示：连续不理解时显示 */}
        {showBackToLearn && !isComplete && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 mb-4 border-amber-500/30 bg-amber-500/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span className="text-amber-200 text-sm">
                  看起来你对这个概念还有些困惑，建议先回到概念解码重新学习
                </span>
              </div>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm hover:bg-amber-500/30 transition-colors"
              >
                返回学习
              </button>
            </div>
          </motion.div>
        )}

        {!isComplete ? (
          <>
            {/* Chat Area */}
            <div className="glass-card mb-4 h-[500px] overflow-y-auto p-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex items-start space-x-3 max-w-[80%] ${
                        message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'user'
                            ? 'bg-[#e8a87c]/20'
                            : 'bg-[#85dcb8]/20'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <User className="w-5 h-5 text-[#e8a87c]" />
                        ) : (
                          <Bot className="w-5 h-5 text-[#85dcb8]" />
                        )}
                      </div>
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-[#e8a87c]/20 text-white rounded-br-md'
                            : 'bg-white/5 text-gray-200 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        {message.round && (
                          <span className="text-xs text-gray-500 mt-1 block">
                            第{message.round}轮
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#85dcb8]/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-[#85dcb8]" />
                      </div>
                      <div className="px-4 py-3 rounded-2xl bg-white/5 rounded-bl-md">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 text-[#85dcb8] animate-spin" />
                          <span className="text-sm text-gray-400">AI正在思考...</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            {!isComplete && (
              <div className="glass-card p-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="用简单易懂的方式解释这个概念..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#e8a87c]/50"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-[#e8a87c] to-[#c38d9e] text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <span>发送</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 mt-3">
                  💡 提示：用简单的语言和类比来解释，就像教一个初学者一样
                </p>
              </div>
            )}
          </>
        ) : (
          /* Evaluation Result */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#e8a87c] to-[#85dcb8] flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">演练完成！</h2>
              <p className="text-gray-400">恭喜完成费曼学习法演练</p>
            </div>

            {evaluation && (
              <>
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">综合评分</h3>
                  {renderStars(evaluation.final_score)}
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-[#e8a87c]">{evaluation.clarity_score}</p>
                    <p className="text-sm text-gray-400">清晰度</p>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-[#85dcb8]">{evaluation.accuracy_score}</p>
                    <p className="text-sm text-gray-400">准确性</p>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-[#c38d9e]">{evaluation.completeness_score}</p>
                    <p className="text-sm text-gray-400">完整性</p>
                  </div>
                </div>

                {/* 如果需要重新学习的提示 */}
                {evaluation.needsReview && (
                  <div className="mb-6 glass-card p-4 border-amber-500/30 bg-amber-500/10">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-amber-400 font-semibold mb-2">建议重新学习</h3>
                        <p className="text-amber-200/80 text-sm mb-3">
                          {evaluation.reviewSuggestion || '你对这个概念的理解还不够深入，建议回到概念解码页面重新学习。'}
                        </p>
                        <button
                          onClick={() => window.history.back()}
                          className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm hover:bg-amber-500/30 transition-colors"
                        >
                          返回概念解码
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-[#e8a87c]" />
                    <span>评价反馈</span>
                  </h3>
                  <p className="text-gray-300 bg-white/5 rounded-xl p-4">{evaluation.feedback}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 text-[#85dcb8]">亮点</h3>
                    <ul className="space-y-2">
                      {evaluation.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start space-x-2 text-gray-300">
                          <span className="text-[#85dcb8] mt-1">✓</span>
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 text-[#c38d9e]">改进建议</h3>
                    <ul className="space-y-2">
                      {evaluation.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start space-x-2 text-gray-300">
                          <span className="text-[#c38d9e] mt-1">•</span>
                          <span className="text-sm">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-center space-x-4 mt-8">
              <button
                onClick={handleRestart}
                className="px-6 py-3 glass-card text-white rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>重新演练</span>
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 bg-gradient-to-r from-[#e8a87c] to-[#c38d9e] text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>返回图谱</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
