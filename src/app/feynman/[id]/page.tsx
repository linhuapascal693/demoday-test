'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
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
  AlertCircle
} from 'lucide-react'

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
  const conceptId = params.id as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [currentRound, setCurrentRound] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)

  // Initialize conversation
  useEffect(() => {
    const initConversation = async () => {
      setIsLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMessages([
        {
          id: '1',
          role: 'ai',
          content: '你好！我是刚学编程的小白。能给我讲讲什么是变量吗？我不太理解这个概念...',
          round: 1
        }
      ])
      setCurrentRound(1)
      setIsLoading(false)
    }

    initConversation()
  }, [conceptId])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      round: currentRound
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500))

    let aiResponse = ''
    let nextRound = currentRound

    if (currentRound === 1) {
      aiResponse = '哦，原来是这样！那变量和常量有什么区别呢？什么时候应该用变量而不是常量？'
      nextRound = 2
    } else if (currentRound === 2) {
      aiResponse = '明白了！那你能给我举个例子吗？比如用变量来存储学生成绩，应该怎么写？'
      nextRound = 3
    } else if (currentRound === 3) {
      // Complete the session
      aiResponse = '太感谢了！我现在对变量有了更清晰的理解。'
      setIsComplete(true)
      
      // Mock evaluation
      setEvaluation({
        final_score: 4.2,
        clarity_score: 4.5,
        accuracy_score: 4.0,
        completeness_score: 3.5,
        feedback: '整体解释清晰，类比生动形象。建议补充变量命名规范的内容。',
        strengths: ['类比生动，用"盒子"解释很形象', '逻辑清晰，循序渐进', '举例贴近实际'],
        weaknesses: ['未提及变量命名规范', '变量作用域概念未涉及']
      })
    }

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      content: aiResponse,
      round: nextRound
    }

    setMessages(prev => [...prev, aiMessage])
    setCurrentRound(nextRound)
    setIsLoading(false)
  }

  const handleRestart = () => {
    setMessages([])
    setCurrentRound(0)
    setIsComplete(false)
    setEvaluation(null)
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
              🎓 费曼演练场 - 变量与类型
            </h1>
          </div>
          
          {!isComplete && (
            <div className="glass-card px-4 py-2">
              <span className="text-sm text-gray-400">轮次: </span>
              <span className="text-[#e8a87c] font-bold">{Math.min(currentRound, 3)}/3</span>
            </div>
          )}
        </div>

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
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-[#e8a87c] to-[#c38d9e] text-white'
                          : 'bg-white/10 text-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        {message.role === 'ai' ? (
                          <>
                            <Bot className="w-4 h-4" />
                            <span className="text-sm font-medium">AI（初学者）</span>
                            {message.round && (
                              <span className="text-xs text-gray-400">
                                追问{message.round}/3
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <User className="w-4 h-4" />
                            <span className="text-sm font-medium">你</span>
                          </>
                        )}
                      </div>
                      <p className="break-words whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="glass-card p-4">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="输入你的回答..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="btn-primary p-3 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Evaluation Report */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              📊 演练报告 - 变量与类型
            </h2>

            {evaluation && (
              <>
                {/* Overall Score */}
                <div className="text-center mb-8">
                  <p className="text-gray-400 mb-2">综合评分</p>
                  {renderStars(evaluation.final_score)}
                </div>

                {/* Dimension Scores */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center p-4 rounded-lg bg-white/5">
                    <p className="text-sm text-gray-400 mb-1">清晰度</p>
                    <p className="text-2xl font-bold text-[#e8a87c]">{evaluation.clarity_score}</p>
                    <p className="text-xs text-green-400">优秀</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-white/5">
                    <p className="text-sm text-gray-400 mb-1">准确性</p>
                    <p className="text-2xl font-bold text-[#e8a87c]">{evaluation.accuracy_score}</p>
                    <p className="text-xs text-green-400">良好</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-white/5">
                    <p className="text-sm text-gray-400 mb-1">完整性</p>
                    <p className="text-2xl font-bold text-[#e8a87c]">{evaluation.completeness_score}</p>
                    <p className="text-xs text-yellow-400">待加强</p>
                  </div>
                </div>

                {/* Feedback */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">总体评价</h3>
                  <p className="text-gray-300 bg-white/5 p-4 rounded-lg">
                    {evaluation.feedback}
                  </p>
                </div>

                {/* Strengths */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                    优点
                  </h3>
                  <ul className="space-y-2">
                    {evaluation.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start space-x-2 text-gray-300">
                        <span className="text-green-400 mt-1">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-yellow-400" />
                    薄弱点
                  </h3>
                  <ul className="space-y-2">
                    {evaluation.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start space-x-2 text-gray-300">
                        <span className="text-yellow-400 mt-1">!</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="btn-primary flex items-center justify-center space-x-2 flex-1">
                    <Save className="w-5 h-5" />
                    <span>保存笔记</span>
                  </button>
                  
                  <button
                    onClick={handleRestart}
                    className="btn-secondary flex items-center justify-center space-x-2 flex-1"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>重新演练</span>
                  </button>
                  
                  <button
                    onClick={() => window.history.back()}
                    className="btn-secondary flex items-center justify-center space-x-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span>返回学习</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
